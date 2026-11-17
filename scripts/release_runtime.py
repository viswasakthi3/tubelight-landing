#!/usr/bin/env python3
"""Remote release worker. Stdlib only; never prints environment, cookies or inspect JSON.

Offline safety tests: python scripts/test_release_runtime.py
The deploy entry point is scripts/deploy_preview.py. This file does nothing on import.
"""
import argparse
import copy
import difflib
import fnmatch
import hashlib
import http.client
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import signal
import socket
import ssl
import subprocess
import sys
import tarfile
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request

BASE = Path('/root/tubelight-preview-releases')
NAMES = ('tubelight-backend', 'tubelight-landing')
PORTS = {'tubelight-backend': 8787, 'tubelight-landing': 8097}
CANDIDATE_PORTS = {'tubelight-backend': 8788, 'tubelight-landing': 8098}
BACKEND_FILES = (
    'webExplain.js', 'lib/webPreviewStore.js', 'lib/webPreviewSchema.js',
    'scripts/migrate_web_preview.js', 'scripts/test_web_explain.js',
    'scripts/test_web_preview.js', 'scripts/test_web_preview_db.js', 'docs/WEB_PREVIEW.md',
)
PREVIEW_KEYS = {
    'tubelight-backend': {'WEB_EXPLAIN_SECRET', 'WEB_EXPLAIN_IDENTITY_SECRET'},
    'tubelight-landing': {'WEB_EXPLAIN_SECRET', 'OWNER_COOKIE_SECRET', 'T2U_API_URL'},
}
REVIEWED_INDEX_SHA256 = '18f304725994e93f786614479e71fbfd4349b477d9dbdbeaa35d7207ed965216'
IMPORT_ANCHOR = "import { handleInstant, readDeviceId, readClaimedDeviceId } from './instant.js';"
ROUTE_ANCHOR = "app.post('/api/instant', handleInstant);"
IMPORT_LINE = "import { handleWebExplain } from './webExplain.js';"
ROUTE_LINE = "app.post('/api/web/explain', handleWebExplain);"
TERMINAL_ANCHOR = "app.use((req, res) => res.status(404).json({ error: 'No such endpoint.' }));"


class ReleaseError(RuntimeError):
    """Messages in this class must never contain runtime secrets or capabilities."""


class DockerHTTPError(ReleaseError):
    def __init__(self, status):
        self.status = status
        super().__init__('Docker Engine operation failed (HTTP %d)' % status)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def private_write(path, data):
    """Mode 0600 before the first byte, then atomic replacement in a private directory."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    temp = path.with_name(path.name + '.tmp-' + secrets.token_hex(6))
    fd = os.open(str(temp), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data.encode() if isinstance(data, str) else data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, path)
    finally:
        if temp.exists():
            temp.unlink()


def private_json(path, value):
    private_write(path, json.dumps(value, sort_keys=True, indent=2) + '\n')


def env_map(values):
    result = {}
    for item in values or []:
        key, separator, value = item.partition('=')
        if not separator or not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', key) or key in result:
            raise ReleaseError('Unexpected duplicate or malformed runtime environment key')
        result[key] = value
    return result


def strong(value):
    return isinstance(value, str) and len(re.sub(r'\s', '', value)) >= 32


def read_env_file(path):
    result = {}
    if Path(path).exists():
        for line in Path(path).read_text().splitlines():
            if line and not line.lstrip().startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                if key.strip() in set.union(*PREVIEW_KEYS.values()):
                    result[key.strip()] = value.strip().strip('\"\'')
    return result


def persist_preview_settings(path, updates):
    """Preserve every unrelated line; persist only the approved preview keys."""
    path = Path(path)
    lines, found = [], set()
    for line in path.read_text().splitlines(True) if path.exists() else []:
        key = line.split('=', 1)[0].strip() if '=' in line and not line.lstrip().startswith('#') else None
        if key in updates:
            if key not in found:
                lines.append(key + '=' + updates[key] + '\n')
                found.add(key)
        else:
            lines.append(line)
    if lines and not lines[-1].endswith('\n'):
        lines[-1] += '\n'
    lines.extend(key + '=' + value + '\n' for key, value in updates.items() if key not in found)
    private_write(path, ''.join(lines))


def preview_settings(inspects, env_files):
    """Only preview keys may change; actual unrelated runtime env is authoritative."""
    runtime = {name: env_map(inspects[name]['Config'].get('Env')) for name in NAMES}
    b, l = (runtime[name] for name in NAMES)
    bf, lf = (env_files.get(name, {}) for name in NAMES)
    live_shared = {row['WEB_EXPLAIN_SECRET'] for row in (b, l) if strong(row.get('WEB_EXPLAIN_SECRET'))}
    if len(live_shared) > 1:
        raise ReleaseError('Live preview service secrets disagree; reconcile before deployment')
    shared = next(iter(live_shared), None) or next((row['WEB_EXPLAIN_SECRET'] for row in (bf, lf) if strong(row.get('WEB_EXPLAIN_SECRET'))), None) or secrets.token_urlsafe(36)
    identity = b.get('WEB_EXPLAIN_IDENTITY_SECRET') if strong(b.get('WEB_EXPLAIN_IDENTITY_SECRET')) else None
    # Existing fallback users must keep their hashing key when gaining a dedicated setting.
    identity = identity or (b.get('WEB_EXPLAIN_SECRET') if strong(b.get('WEB_EXPLAIN_SECRET')) else None) or (bf.get('WEB_EXPLAIN_IDENTITY_SECRET') if strong(bf.get('WEB_EXPLAIN_IDENTITY_SECRET')) else shared)
    owner = (l.get('OWNER_COOKIE_SECRET') if strong(l.get('OWNER_COOKIE_SECRET')) else None) or (l.get('WEB_EXPLAIN_SECRET') if strong(l.get('WEB_EXPLAIN_SECRET')) else None) or (lf.get('OWNER_COOKIE_SECRET') if strong(lf.get('OWNER_COOKIE_SECRET')) else secrets.token_urlsafe(36))
    return {
        NAMES[0]: {'WEB_EXPLAIN_SECRET': shared, 'WEB_EXPLAIN_IDENTITY_SECRET': identity},
        NAMES[1]: {'WEB_EXPLAIN_SECRET': shared, 'OWNER_COOKIE_SECRET': owner, 'T2U_API_URL': 'https://tubelight.net'},
    }


def clone_runtime(inspect, image, name, updates, candidate=False):
    """Preserve Docker Config + full HostConfig + existing volumes and dynamic network.

    Inspection-only assigned addresses/endpoint IDs are never copied. Unsupported
    identity/static network settings abort before the old containers are touched.
    """
    config = copy.deepcopy(inspect['Config'])
    host = copy.deepcopy(inspect['HostConfig'])
    if set(updates) - PREVIEW_KEYS[name]:
        raise ReleaseError('Attempt to alter unrelated runtime environment')
    if host.get('AutoRemove') or host.get('ContainerIDFile'):
        raise ReleaseError('Unsupported auto-removal or container ID file configuration')
    if str(host.get('IpcMode', '')).startswith('container:') or str(host.get('PidMode', '')).startswith('container:'):
        raise ReleaseError('Shared container namespace requires explicit review')
    port = PORTS[name]
    bindings = host.get('PortBindings') or {}
    expected = {f'{port}/tcp': [{'HostIp': '127.0.0.1', 'HostPort': str(port)}]}
    if bindings != expected or host.get('PublishAllPorts'):
        raise ReleaseError('Unexpected published ports; only the reviewed loopback binding is allowed')
    if candidate:
        host['PortBindings'][f'{port}/tcp'][0]['HostPort'] = str(CANDIDATE_PORTS[name])
    mode = host.get('NetworkMode') or 'bridge'
    primary_network = 'bridge' if mode == 'default' else mode
    networks = inspect.get('NetworkSettings', {}).get('Networks') or {}
    if mode in ('host', 'none') or mode.startswith('container:') or set(networks) != {primary_network}:
        raise ReleaseError('Unexpected network topology requires explicit review')
    endpoints = {}
    automatic = {inspect.get('Id'), str(inspect.get('Id', ''))[:12], inspect.get('Name', '').lstrip('/')}
    for network, endpoint in networks.items():
        if endpoint.get('IPAMConfig') or endpoint.get('Links') or host.get('Links'):
            raise ReleaseError('Static addresses or legacy network links require explicit review')
        aliases = [alias for alias in (endpoint.get('Aliases') or []) if alias not in automatic]
        if aliases and candidate:
            raise ReleaseError('Custom network aliases would collide with the live service')
        selected = {key: copy.deepcopy(endpoint[key]) for key in ('DriverOpts', 'GwPriority') if endpoint.get(key) is not None}
        if aliases:
            selected['Aliases'] = aliases
        endpoints[network] = selected
    represented = {mount.get('Target') for mount in (host.get('Mounts') or [])}
    for binding in host.get('Binds') or []:
        pieces = binding.split(':')
        if len(pieces) not in (2, 3) or not pieces[1].startswith('/'):
            raise ReleaseError('Unexpected bind mount syntax')
        represented.add(pieces[1])
    # Existing anonymous volumes are not necessarily in HostConfig.Binds/Mounts.
    # Attach the SAME volume, retaining its read/write status, instead of minting one.
    for mount in inspect.get('Mounts') or []:
        if mount['Destination'] in represented:
            continue
        if mount.get('Type') == 'tmpfs':
            if mount['Destination'] not in (host.get('Tmpfs') or {}):
                raise ReleaseError('Unrepresented tmpfs mount requires explicit review')
            continue
        kind = mount.get('Type')
        if kind not in ('bind', 'volume'):
            raise ReleaseError('Unexpected mount type requires explicit review')
        normalized = {'Type': kind, 'Source': mount.get('Name') if kind == 'volume' else mount['Source'], 'Target': mount['Destination'], 'ReadOnly': not mount.get('RW', True)}
        if not normalized['Source']:
            raise ReleaseError('Existing volume has no reusable identity')
        if kind == 'bind':
            normalized['BindOptions'] = {'Propagation': mount.get('Propagation') or 'rprivate'}
        else:
            normalized['VolumeOptions'] = {'NoCopy': True}
        if not host.get('Mounts'):
            host['Mounts'] = []
        host['Mounts'].append(normalized)
    existing = env_map(config.get('Env'))
    existing.update(updates)
    config['Env'] = [f'{key}={value}' for key, value in existing.items()]
    config['Image'] = image
    return {**config, 'HostConfig': host, 'NetworkingConfig': {'EndpointsConfig': endpoints}}


def validate_audit(returncode, stdout):
    if returncode != 0:
        raise ReleaseError('Dependency audit failed; deployment stopped')
    try:
        report = json.loads(stdout)
        levels = report['metadata']['vulnerabilities']
        for key in ('critical', 'high'):
            if type(levels[key]) is not int or levels[key] < 0:
                raise ValueError()
        if levels['critical'] or levels['high'] or 'error' in report:
            raise ValueError()
    except (ValueError, KeyError, TypeError):
        raise ReleaseError('Dependency audit did not prove zero critical/high vulnerabilities') from None
    return {key: levels.get(key, 0) for key in ('critical', 'high', 'moderate', 'low', 'info')}


def patch_router(original):
    text = original.decode('utf-8')
    if IMPORT_LINE in text or ROUTE_LINE in text:
        if text.count(IMPORT_LINE) != 1 or text.count(ROUTE_LINE) != 1 or text.index(ROUTE_LINE) > text.index(TERMINAL_ANCHOR):
            raise ReleaseError('Unexpected existing preview registration')
        return original, ''
    if digest(original) != REVIEWED_INDEX_SHA256:
        raise ReleaseError('Production router differs from the reviewed baseline')
    for anchor in (IMPORT_ANCHOR, ROUTE_ANCHOR, TERMINAL_ANCHOR):
        if text.count(anchor) != 1:
            raise ReleaseError('Production router anchor is not unique')
    if text.index(ROUTE_ANCHOR) > text.index(TERMINAL_ANCHOR):
        raise ReleaseError('Preview registration would follow terminal routing')
    changed = text.replace(IMPORT_ANCHOR, IMPORT_ANCHOR + '\n' + IMPORT_LINE, 1).replace(ROUTE_ANCHOR, ROUTE_ANCHOR + '\n' + ROUTE_LINE, 1)
    patch = ''.join(difflib.unified_diff(text.splitlines(True), changed.splitlines(True), fromfile='a/index.js', tofile='b/index.js'))
    return changed.encode(), patch


def nginx_blocks(text):
    """Locate brace blocks while ignoring quoted strings and comments."""
    blocks, stack = [], []
    start, quote, escaped, comment = 0, None, False, False
    for index, char in enumerate(text):
        if comment:
            if char == '\n':
                comment = False
            continue
        if quote:
            if escaped:
                escaped = False
            elif char == '\\':
                escaped = True
            elif char == quote:
                quote = None
            continue
        if char == '#':
            comment = True
        elif char in ('\"', "'"):
            quote = char
        elif char == '{':
            header = re.sub(r'#[^\n]*', '', text[start:index]).strip()
            node = {'header': header, 'start': start, 'open': index, 'parent': stack[-1] if stack else None}
            stack.append(node)
            start = index + 1
        elif char == '}':
            if not stack:
                raise ReleaseError('Unbalanced nginx configuration')
            node = stack.pop()
            node['end'] = index + 1
            blocks.append(node)
            start = index + 1
        elif char == ';':
            start = index + 1
    if stack or quote:
        raise ReleaseError('Unbalanced nginx configuration')
    return blocks


def guard_preview_nginx(text):
    blocks = nginx_blocks(text)
    servers = [block for block in blocks if block['header'] == 'server' and re.search(r'server_name\s+[^;]*\btubelight\.net\b', text[block['open']:block['end']])]
    if not servers:
        raise ReleaseError('Cannot locate Tubelight nginx servers for rollback guard')
    edits = []
    for server in servers:
        for endpoint in ('/api/preview', '/api/web/explain'):
            existing = [block for block in blocks if block['parent'] is server and block['header'] == f'location = {endpoint}']
            if len(existing) > 1:
                raise ReleaseError('Duplicate exact preview location in nginx')
            if existing:
                block = existing[0]
                edits.append((block['open'] + 1, block['end'] - 1, ' return 503; '))
            else:
                edits.append((server['open'] + 1, server['open'] + 1, f'\n    location = {endpoint} {{ return 503; }}\n'))
    for start, end, replacement in sorted(edits, reverse=True):
        text = text[:start] + replacement + text[end:]
    return text


class UnixHTTPConnection(http.client.HTTPConnection):
    def connect(self):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect('/var/run/docker.sock')


class Docker:
    def request(self, method, path, value=None, allowed=(200, 201, 204)):
        connection = UnixHTTPConnection('localhost', timeout=90)
        body = json.dumps(value).encode() if value is not None else None
        try:
            connection.request(method, path, body, {'Content-Type': 'application/json'} if body else {})
            response = connection.getresponse()
            payload = response.read()
            if response.status not in allowed:
                raise DockerHTTPError(response.status)
            return json.loads(payload) if payload else None
        finally:
            connection.close()

    def inspect(self, name):
        return self.request('GET', '/containers/' + urllib.parse.quote(name, safe='') + '/json')

    def exists(self, name):
        try:
            self.inspect(name)
            return True
        except DockerHTTPError as error:
            if error.status == 404:
                return False
            raise

    def create(self, name, body):
        return self.request('POST', '/containers/create?' + urllib.parse.urlencode({'name': name}), body)['Id']

    def start(self, name):
        self.request('POST', '/containers/' + name + '/start', allowed=(204, 304))

    def stop(self, name):
        self.request('POST', '/containers/' + name + '/stop?t=15', allowed=(204, 304))

    def rename(self, name, target):
        self.request('POST', '/containers/' + name + '/rename?' + urllib.parse.urlencode({'name': target}))

    def remove(self, name):
        if self.exists(name):
            self.request('DELETE', '/containers/' + name + '?force=1&v=0')


def command(args, directory, label, input_text=None, timeout=900):
    result = subprocess.run(args, input=input_text, text=True, capture_output=True, timeout=timeout)
    private_write(Path(directory) / (label + '.log'), result.stdout + '\n' + result.stderr)
    if result.returncode:
        raise ReleaseError(label + ' failed; see private release log')
    return result


def request_http(url, headers=None):
    request = urllib.request.Request(url, headers=headers or {}, method='GET')
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, response.headers, response.read(1024 * 1024)
    except urllib.error.HTTPError as error:
        return error.code, error.headers, error.read(1024 * 1024)


def assert_probe(port, backend=False, bootstrap=False, request=request_http):
    headers = {'Host': 'tubelight.net', 'X-Forwarded-Host': 'tubelight.net', 'X-Real-IP': '127.0.0.1', 'X-Forwarded-Proto': 'https', 'Origin': 'https://tubelight.net'}
    path = '/api/health' if backend else '/api/preview' if bootstrap else '/'
    status, response_headers, body = request('http://127.0.0.1:%d%s' % (port, path), headers)
    if status != 200:
        raise ReleaseError('Candidate HTTP readiness failed')
    if backend:
        try:
            health = json.loads(body)
            if health.get('ok') is not True or health.get('database') is not True:
                raise ValueError()
        except (ValueError, TypeError):
            raise ReleaseError('Candidate backend/database readiness failed') from None
    elif bootstrap:
        try:
            valid = json.loads(body).get('ok') is True
        except (ValueError, TypeError):
            valid = False
        cookie = response_headers.get('Set-Cookie', '')
        if not valid or not all(value in cookie for value in ('tb_owner=', 'HttpOnly', 'Secure', 'SameSite=Lax')):
            raise ReleaseError('Candidate ownership bootstrap failed')
    elif b'<html' not in body.lower() or b'understand anything' not in body.lower():
        raise ReleaseError('Candidate landing did not return the expected Tubelight content')


def assert_backend_auth_route(port):
    request = urllib.request.Request('http://127.0.0.1:%d/api/web/explain' % port, data=b'{}', headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            status, body = response.status, response.read(4096)
    except urllib.error.HTTPError as error:
        status, body = error.code, error.read(4096)
    try:
        valid = json.loads(body).get('error') == 'unauthorized'
    except (ValueError, TypeError, AttributeError):
        valid = False
    if status != 401 or not valid:
        raise ReleaseError('Candidate preview route is missing or not protected')


def wait_probe(probe, seconds=75):
    deadline = time.monotonic() + seconds
    while True:
        try:
            probe()
            return
        except (ReleaseError, OSError, ValueError):
            if time.monotonic() >= deadline:
                raise ReleaseError('Readiness deadline exceeded') from None
            time.sleep(2)


def source_allowed(relative):
    """Allow code/assets, excluding every runtime/secret/backup directory recursively."""
    denied_dirs = {'node_modules', '.git', 'storage', 'secrets', 'backups', 'backup', 'uploads', 'logs', 'cache', '.cache', 'tmp', 'scratch', 'releases', 'updates', 'eval'}
    patterns = ('.env*', '*.env', '*.pem', '*.key', '*.pfx', '*.p12', '*.crt', '*credential*', '*service-account*', '*service_account*', '*secret*', '*adc*.json', '*.sql*', '*.dump*', '*.bak*', '*.log*', '*.gz', '*.zip', '*.tar', '*.tgz', '*.7z', 'backup*', 'rollback*')
    parts = Path(relative).parts
    for part in parts:
        lower = part.lower()
        if lower in denied_dirs:
            return False
        if lower != 'secretscheck.js' and any(fnmatch.fnmatch(lower, pattern) for pattern in patterns):
            return False
    name = parts[-1]
    return name in ('Dockerfile', '.dockerignore', '.gitignore') or Path(name).suffix.lower() in {'.js', '.mjs', '.cjs', '.json', '.md', '.html', '.css', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.woff', '.woff2', '.ttf', '.py', '.txt'}


def copy_backend(source, target):
    # Release parent is private (0700); image source itself must be readable by
    # the existing unprivileged Node user after Docker COPY.
    target.mkdir(mode=0o755)
    os.chmod(target, 0o755)
    for root, directories, files in os.walk(source, followlinks=False):
        root = Path(root)
        directories[:] = [name for name in directories if not (root / name).is_symlink() and source_allowed((root / name).relative_to(source) / 'probe.js')]
        for name in files:
            original = root / name
            relative = original.relative_to(source)
            if original.is_symlink() or not source_allowed(relative):
                continue
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
            for parent in (destination.parent, *destination.parent.parents):
                if parent == target.parent:
                    break
                os.chmod(parent, 0o755)
            shutil.copy2(original, destination)
            os.chmod(destination, 0o755 if original.stat().st_mode & 0o111 else 0o644)


def extract_archive(archive, target, allowed=None):
    target.mkdir(parents=True, exist_ok=True, mode=0o700)
    with tarfile.open(archive) as package:
        seen = set()
        for member in package.getmembers():
            name = member.name.rstrip('/')
            if member.issym() or member.islnk() or not (member.isfile() or member.isdir()) or name.startswith('/') or '..' in Path(name).parts:
                raise ReleaseError('Unsafe release archive entry')
            if not name:
                continue
            if member.mode & 0o6000 or member.isfile() and name in seen:
                raise ReleaseError('Unsafe or duplicate release archive entry')
            seen.add(name)
            if allowed is not None and member.isfile() and name not in allowed:
                raise ReleaseError('Unexpected backend overlay file')
            # Never permit secrets, runtime data or local caches in a landing archive.
            if allowed is None and any(part.startswith('.env') and part != '.env.example' or part in ('.git', 'node_modules', '.next', '.next-dev') for part in Path(name).parts):
                raise ReleaseError('Landing archive contains runtime or secret material')
            package.extract(member, target)


def atomic_symlink(target, link):
    temp = Path(link).with_name('.' + Path(link).name + '.release-' + secrets.token_hex(4))
    os.symlink(str(target), temp)
    os.replace(temp, link)


def activate_nginx(text, directory):
    live = Path('/etc/nginx/sites-available/tubelight.net')
    enabled = Path('/etc/nginx/sites-enabled/tubelight.net')
    if not enabled.is_symlink() or enabled.resolve() != live.resolve():
        raise ReleaseError('Unexpected nginx site linkage')
    old_text, old_target = live.read_bytes(), os.readlink(enabled)
    candidate = live.with_name('tubelight.net.preview-' + Path(directory).name)
    private_write(candidate, text)
    try:
        atomic_symlink(candidate, enabled)
        command(['nginx', '-t'], directory, 'nginx-candidate-validation', timeout=30)
        os.replace(candidate, live)
        atomic_symlink(live, enabled)
        command(['systemctl', 'reload', 'nginx'], directory, 'nginx-reload', timeout=30)
    except BaseException:
        private_write(live, old_text)
        atomic_symlink(old_target, enabled)
        if candidate.exists():
            candidate.unlink()
        command(['nginx', '-t'], directory, 'nginx-revert-validation', timeout=30)
        command(['systemctl', 'reload', 'nginx'], directory, 'nginx-revert-reload', timeout=30)
        raise


def rollback_services(docker, saved, release_id, install_guard, touched):
    """The public kill switch MUST succeed before any legacy service is restored."""
    if not touched:
        return
    install_guard()
    untouched = set()
    for name in reversed(NAMES):
        if name in touched:
            # Intent is persisted before rename. A failed rename must NEVER cause
            # removal of the original still-live container during recovery.
            if docker.exists(name) and docker.inspect(name)['Id'] == saved[name]['Id']:
                untouched.add(name)
            else:
                docker.remove(name)
    for name in NAMES:
        if name not in touched:
            continue
        if name in untouched:
            docker.start(name)
            continue
        backup = name + '__rollback_' + release_id
        if docker.exists(backup):
            docker.rename(backup, name)
        else:
            # Exact saved runtime, never a reconstruction from current .env files.
            body = clone_runtime(saved[name], saved[name]['Image'], name, {'WEB_EXPLAIN_SECRET': ''})
            docker.create(name, body)
        docker.start(name)


def search_status():
    try:
        socket.getaddrinfo('search.tubelight.net', 443)
    except socket.gaierror:
        return 'pending_dns'
    try:
        with socket.create_connection(('search.tubelight.net', 443), timeout=5) as raw:
            with ssl.create_default_context().wrap_socket(raw, server_hostname='search.tubelight.net'):
                return 'tls_ready'
    except (ssl.SSLError, OSError):
        return 'pending_tls'


def public_probes(request=request_http):
    for url, needle in [('https://tubelight.net/', b'understand anything'), ('https://tubelight.net/search', b'quick search')]:
        status, _, body = request(url)
        if status != 200 or b'<html' not in body.lower() or needle not in body.lower():
            raise ReleaseError('Public landing/search probe failed')
    status, _, body = request('https://tubelight.net/api/health')
    try:
        health = json.loads(body)
        valid = health.get('ok') is True and health.get('database') is True
    except (ValueError, TypeError):
        valid = False
    if status != 200 or not valid:
        raise ReleaseError('Public backend/database probe failed')
    status, headers, body = request('https://tubelight.net/api/preview', {'Origin': 'https://tubelight.net'})
    try:
        valid = json.loads(body).get('ok') is True
    except (ValueError, TypeError):
        valid = False
    if status != 200 or not valid or 'tb_owner=' not in headers.get('Set-Cookie', ''):
        raise ReleaseError('Public ownership bootstrap failed')


MIGRATION_CHECK = """
import {createHash} from 'node:crypto';
import {query,closeDb} from './db.js';
try {
 const r=await query("SELECT to_regclass('t2u_web_preview_runs') IS NOT NULL AS runs,to_regclass('t2u_web_preview_settings') IS NOT NULL AS settings");
 if(!r.rows[0].runs||!r.rows[0].settings)throw Error('schema');
 const key=process.env.WEB_EXPLAIN_IDENTITY_SECRET??process.env.WEB_EXPLAIN_SECRET;
 const fp=createHash('sha256').update('web-preview-key-v1\\0'+key).digest('hex');
 const pin=await query("SELECT value FROM t2u_web_preview_settings WHERE key='identity-key-v1'");
 if(pin.rows.length&&pin.rows[0].value!==fp)throw Error('identity key mismatch');
 console.log('PREVIEW_SCHEMA_AND_IDENTITY_KEY_OK');
}catch{console.error('Preview schema/key verification failed');process.exitCode=1;}finally{await closeDb();}
"""


class Deployer:
    def __init__(self, directory, docker=None):
        self.directory = Path(directory)
        self.release_id = self.directory.name
        self.docker = docker or Docker()
        self.saved = {}
        self.touched = []
        self.candidates = []
        self.state = {}

    def stage(self, message):
        try:
            print(message, flush=True)
        except (BrokenPipeError, OSError):
            # A dropped SSH output stream must never prevent safe rollback.
            pass

    def save_state(self):
        self.state['touched'] = self.touched
        private_json(self.directory / 'state.json', self.state)

    def guarded_rollback(self):
        old = (self.directory / 'nginx.before.conf').read_text()
        handled = [value for value in (getattr(signal, 'SIGHUP', None), signal.SIGTERM, signal.SIGINT) if value is not None]
        previous = {value: signal.getsignal(value) for value in handled}
        try:
            for value in handled:
                signal.signal(value, signal.SIG_IGN)
            rollback_services(self.docker, self.saved, self.release_id, lambda: activate_nginx(guard_preview_nginx(old), self.directory), self.touched)
        finally:
            for value, handler in previous.items():
                signal.signal(value, handler)
        self.state['status'] = 'rolled_back_preview_disabled'
        self.save_state()

    def run(self):
        try:
            self.release()
        except BaseException:
            private_write(self.directory / 'failure.log', traceback.format_exc())
            if self.touched:
                self.stage('Release failed; disabling public preview and restoring both prior services.')
                try:
                    self.guarded_rollback()
                except BaseException:
                    private_write(self.directory / 'rollback-failure.log', traceback.format_exc())
                    raise ReleaseError('AUTOMATIC ROLLBACK FAILED; inspect private release logs immediately') from None
            raise
        finally:
            for candidate in self.candidates:
                try:
                    self.docker.remove(candidate)
                except Exception:
                    private_write(self.directory / ('cleanup-' + candidate + '.log'), traceback.format_exc())
                    self.stage('Candidate cleanup needs attention; see private release logs.')

    def release(self):
        self.stage('1/8 Recording private snapshots and validating preserved runtime topology.')
        metadata = json.loads((self.directory / 'manifest.json').read_text())
        if metadata.get('release_id') != self.release_id:
            raise ReleaseError('Release manifest identity mismatch')
        for archive in ('landing', 'backend'):
            if digest((self.directory / (archive + '.tar.gz')).read_bytes()) != metadata[archive + '_archive_sha256']:
                raise ReleaseError('Release archive hash mismatch')
        self.state = {'status': 'preparing', 'release_id': self.release_id, 'landing_commit': metadata['landing_commit'], 'backend_commit': metadata['backend_commit']}
        self.saved = {name: self.docker.inspect(name) for name in NAMES}
        settings = preview_settings(self.saved, {name: read_env_file('/root/' + name.replace('-', '_') + '/.env') for name in NAMES})
        self.images = {name: name + ':preview_' + self.release_id for name in NAMES}
        for name in NAMES:
            if not env_map(self.saved[name]['Config'].get('Env')).get('DATABASE_URL'):
                raise ReleaseError('Actual runtime database configuration is missing')
            clone_runtime(self.saved[name], self.images[name], name, settings[name], candidate=True)
            private_json(self.directory / (name + '.inspect.json'), self.saved[name])
            private_json(self.directory / (name + '.settings.json'), settings[name])
            command(['docker', 'tag', self.saved[name]['Image'], name + ':rollback_' + self.release_id], self.directory, name + '-snapshot-tag')
        private_write(self.directory / 'nginx.before.conf', Path('/etc/nginx/sites-available/tubelight.net').read_bytes())
        # Prove rollback guarding can be constructed before any application switch.
        guard_preview_nginx((self.directory / 'nginx.before.conf').read_text())
        self.save_state()
        self.stage('2/8 Preparing clean production-baseline backend with scoped reviewed overlay.')
        backend = self.directory / 'backend-build'
        copy_backend(Path('/root/tubelight_backend'), backend)
        overlay = self.directory / 'backend-overlay'
        extract_archive(self.directory / 'backend.tar.gz', overlay, BACKEND_FILES)
        for relative in BACKEND_FILES:
            data = (overlay / relative).read_bytes()
            if digest(data) != metadata['backend_hashes'][relative]:
                raise ReleaseError('Backend overlay hash mismatch')
            target = backend / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            os.chmod(target, 0o644)
        original = (backend / 'index.js').read_bytes()
        changed, patch = patch_router(original)
        (backend / 'index.js').write_bytes(changed)
        private_write(self.directory / 'index.js.before', original)
        private_write(self.directory / 'index.js.after', changed)
        private_write(self.directory / 'backend-router.patch', patch)
        self.state['router_before_sha256'] = digest(original)
        self.state['router_after_sha256'] = digest(changed)
        self.state['router_patch_sha256'] = digest(patch.encode())
        (backend / '.dockerignore').write_text('node_modules\n.git\n**/.env*\n**/*.env\n**/storage\n**/secrets\n**/*backup*\n**/*rollback*\n**/*.sql*\n**/*.pem\n**/*.key\n')
        self.stage('3/8 Auditing dependencies in isolated Node containers; failures stop the release.')
        node = ['docker', 'run', '--rm', '-v', str(backend) + ':/work', '-w', '/work', 'node:22-alpine']
        command(node + ['node', '--check', 'index.js'], self.directory, 'backend-router-syntax')
        command(node + ['npm', 'audit', 'fix', '--omit=dev', '--ignore-scripts', '--audit-level=high', '--no-fund'], self.directory, 'backend-audit-fix')
        audit = command(node + ['npm', 'audit', '--omit=dev', '--audit-level=high', '--json'], self.directory, 'backend-audit')
        self.state['backend_audit'] = validate_audit(audit.returncode, audit.stdout)
        for filename in ('package.json', 'package-lock.json'):
            private_write(self.directory / ('backend-audited-' + filename), (backend / filename).read_bytes())
        private_write(self.directory / 'backend-dependencies.patch', ''.join(difflib.unified_diff(Path('/root/tubelight_backend/package-lock.json').read_text().splitlines(True), (backend / 'package-lock.json').read_text().splitlines(True), fromfile='a/package-lock.json', tofile='b/package-lock.json')))
        command(['docker', 'build', '-t', self.images[NAMES[0]], str(backend)], self.directory, 'backend-image-build')
        self.stage('4/8 Building the explicit committed landing source; no working-tree bundle.')
        landing = self.directory / 'landing-build'
        extract_archive(self.directory / 'landing.tar.gz', landing)
        private_write(self.directory / 'nginx.after.conf', (landing / 'infra/nginx/tubelight.net.conf').read_bytes())
        landing_audit = command(['docker', 'run', '--rm', '-v', str(landing) + ':/work', '-w', '/work', 'node:22-alpine', 'npm', 'audit', '--omit=dev', '--audit-level=high', '--json'], self.directory, 'landing-audit')
        self.state['landing_audit'] = validate_audit(landing_audit.returncode, landing_audit.stdout)
        command(['docker', 'build', '-t', self.images[NAMES[1]], str(landing)], self.directory, 'landing-image-build')
        self.stage('5/8 Starting candidates with exact final environment/network; migrating NEW backend.')
        for name in NAMES:
            candidate = name + '-candidate-' + self.release_id
            self.candidates.append(candidate)
            self.docker.create(candidate, clone_runtime(self.saved[name], self.images[name], name, settings[name], candidate=True))
            self.docker.start(candidate)
            if name == NAMES[0]:
                wait_probe(lambda: assert_probe(CANDIDATE_PORTS[name], backend=True))
                result = command(['docker', 'exec', candidate, 'node', 'scripts/migrate_web_preview.js'], self.directory, 'preview-migration')
                if 'Web preview schema ready' not in result.stdout:
                    raise ReleaseError('Migration did not report completion')
                command(['docker', 'exec', '-i', candidate, 'node', '--input-type=module'], self.directory, 'preview-schema-key-check', MIGRATION_CHECK)
                assert_backend_auth_route(CANDIDATE_PORTS[name])
            else:
                wait_probe(lambda: assert_probe(CANDIDATE_PORTS[name]))
                wait_probe(lambda: assert_probe(CANDIDATE_PORTS[name], bootstrap=True))
        for candidate in self.candidates:
            self.docker.remove(candidate)
        self.candidates = []
        # Persist only preview keys BEFORE activation: a request that pins the new
        # identity key followed by a failed public probe must remain recoverable.
        # Existing live containers keep their original immutable runtime env.
        for name in NAMES:
            env_path = Path('/root/' + name.replace('-', '_') + '/.env')
            if env_path.exists():
                private_write(self.directory / (name + '.host-env.before'), env_path.read_bytes())
            persist_preview_settings(env_path, settings[name])
        self.stage('6/8 Switching both services; any later failure restores both with preview blocked.')
        self.state['status'] = 'switching'
        self.save_state()
        for name in NAMES:
            # Persist intent BEFORE rename, so interrupted releases can be recovered.
            self.touched.append(name)
            self.save_state()
            self.docker.rename(name, name + '__rollback_' + self.release_id)
            self.docker.stop(name + '__rollback_' + self.release_id)
            self.docker.create(name, clone_runtime(self.saved[name], self.images[name], name, settings[name]))
            self.docker.start(name)
            wait_probe(lambda name=name: assert_probe(PORTS[name], backend=name == NAMES[0]))
            if name == NAMES[1]:
                wait_probe(lambda: assert_probe(PORTS[name], bootstrap=True))
        self.stage('7/8 Validating nginx candidate and atomically activating routes.')
        activate_nginx((self.directory / 'nginx.after.conf').read_text(), self.directory)
        self.stage('8/8 Asserting public HTTP, database and cookie-presence checks (no capabilities logged).')
        public_probes()
        self.state['search_domain'] = search_status()
        if self.state['search_domain'] == 'tls_ready':
            status, _, body = request_http('https://search.tubelight.net/')
            if status != 200 or b'<html' not in body.lower() or not any(needle in body.lower() for needle in (b'quick search', b'stop opening')):
                raise ReleaseError('Public search hostname did not return Quick Search content')
        self.state['status'] = 'healthy'
        self.state['images'] = self.images
        self.save_state()
        self.stage('Release healthy. Search hostname status: ' + self.state['search_domain'])
        self.stage('Private rollback/runtime/dependency/router artifacts retained at ' + str(self.directory))
        # Retain reviewed/audited source for reproducibility and later scoped SCM work.
        # It contains no runtime environment, keys, storage or database backups.


def check():
    docker = Docker()
    rows = {}
    for name in NAMES:
        inspected = docker.inspect(name)
        # Empty updates are safe for topology validation; no mutation or secret provisioning.
        clone_runtime(inspected, inspected['Image'], name, {}, candidate=True)
        rows[name] = {'running': inspected['State']['Running'], 'image': inspected['Image'], 'runtime_database_configured': bool(env_map(inspected['Config']['Env']).get('DATABASE_URL')), 'mount_count': len(inspected.get('Mounts') or []), 'networks': list(inspected['NetworkSettings']['Networks'])}
    baseline = Path('/root/tubelight_backend/index.js').read_bytes()
    changed, patch = patch_router(baseline)
    guard_preview_nginx(Path('/etc/nginx/sites-available/tubelight.net').read_text())
    print(json.dumps({'services': rows, 'router_before_sha256': digest(baseline), 'router_after_sha256': digest(changed), 'router_patch_required': bool(patch), 'rollback_guard_prepared': True, 'search_domain': search_status()}, sort_keys=True))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--deploy')
    parser.add_argument('--rollback')
    arguments = parser.parse_args()
    if arguments.check:
        check()
        return
    directory = Path(arguments.deploy or arguments.rollback or '').resolve()
    if directory.parent != BASE or not re.fullmatch(r'[0-9]{8}_[0-9]{6}_[a-f0-9]{8}', directory.name):
        raise ReleaseError('Invalid release directory')
    import fcntl
    BASE.mkdir(mode=0o700, parents=True, exist_ok=True)
    with open(BASE / '.release.lock', 'a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise ReleaseError('Another release or rollback is active') from None
        deployer = Deployer(directory)
        def interrupted(_number, _frame):
            raise ReleaseError('Release interrupted; rollback will be attempted')
        for value in (getattr(signal, 'SIGHUP', None), signal.SIGTERM, signal.SIGINT):
            if value is not None:
                signal.signal(value, interrupted)
        if arguments.rollback:
            deployer.state = json.loads((directory / 'state.json').read_text())
            deployer.saved = {name: json.loads((directory / (name + '.inspect.json')).read_text()) for name in NAMES}
            deployer.touched = deployer.state.get('touched') or []
            deployer.guarded_rollback()
            for name in NAMES:
                deployer.docker.remove(name + '-candidate-' + deployer.release_id)
            print('Rollback complete. Public preview endpoints are disabled; lifetime database claims retained.')
        else:
            deployer.run()


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error) if isinstance(error, ReleaseError) else 'Release failed; inspect private release logs', file=sys.stderr)
        sys.exit(1)
