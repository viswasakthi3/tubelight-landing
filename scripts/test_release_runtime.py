"""Offline release safety tests. No SSH, Docker, provider or production mutations."""
import copy
from contextlib import redirect_stdout
import io
import json
import os
from pathlib import Path
import stat
import tarfile
import tempfile
import unittest
from unittest import mock

import release_runtime as r
import deploy_preview as launcher


def fixture(name='tubelight-backend'):
    port = r.PORTS[name]
    return {
        'Id': name + '-original-id', 'Name': '/' + name, 'Image': 'sha256:approved-old-image',
        'Config': {'Image': 'old:tag', 'Env': ['DATABASE_URL=actual-runtime-db', 'UNRELATED_TOKEN=retain-me', 'NODE_ENV=production', 'PORT=' + str(port)],
                   'Labels': {'com.example.owner': 'keep'}, 'Cmd': ['node', 'index.js'], 'Entrypoint': ['entrypoint.sh'], 'User': '1001:1001', 'WorkingDir': '/app', 'Hostname': 'existing-host', 'StopSignal': 'SIGTERM', 'Volumes': {'/app/volume': {}}},
        'HostConfig': {'NetworkMode': 'default', 'PortBindings': {str(port) + '/tcp': [{'HostIp': '127.0.0.1', 'HostPort': str(port)}]},
                       'Binds': ['/srv/storage:/app/storage:rw,rprivate', '/srv/key.json:/run/secrets/key.json:ro'], 'Mounts': None,
                       'RestartPolicy': {'Name': 'on-failure', 'MaximumRetryCount': 8}, 'ReadonlyRootfs': True, 'CapDrop': ['ALL'],
                       'Memory': 536870912, 'NanoCpus': 1500000000, 'PidsLimit': 200, 'Ulimits': [{'Name': 'nofile', 'Soft': 1234, 'Hard': 2345}],
                       'SecurityOpt': ['no-new-privileges:true'], 'LogConfig': {'Type': 'json-file', 'Config': {'max-size': '10m'}}, 'Dns': ['1.1.1.1'], 'ExtraHosts': ['internal:192.0.2.5'], 'ShmSize': 134217728},
        'Mounts': [{'Type': 'bind', 'Source': '/srv/storage', 'Destination': '/app/storage', 'RW': True},
                   {'Type': 'bind', 'Source': '/srv/key.json', 'Destination': '/run/secrets/key.json', 'RW': False},
                   {'Type': 'volume', 'Name': 'existing-anonymous-volume', 'Source': '/var/lib/docker/volumes/existing-anonymous-volume/_data', 'Destination': '/app/volume', 'RW': False}],
        'NetworkSettings': {'Networks': {'bridge': {'IPAMConfig': None, 'Aliases': None, 'IPAddress': '172.17.0.5', 'MacAddress': 'aa:bb:cc:dd:ee:ff', 'EndpointID': 'do-not-clone'}}},
        'State': {'Running': True},
    }


class FakeDocker:
    def __init__(self, containers):
        self.containers = copy.deepcopy(containers)
        self.events = []

    def exists(self, name):
        return name in self.containers

    def inspect(self, name):
        return self.containers[name]

    def remove(self, name):
        self.events.append(('remove', name))
        self.containers.pop(name, None)

    def rename(self, name, target):
        self.events.append(('rename', name, target))
        self.containers[target] = self.containers.pop(name)

    def create(self, name, body):
        self.events.append(('create', name, body))
        self.containers[name] = {'Id': name + '-fallback', **body}

    def start(self, name):
        self.events.append(('start', name))


class RuntimeSafety(unittest.TestCase):
    def test_candidate_and_final_retain_real_credentials_resources_mount_flags_and_commands(self):
        original = fixture()
        before = copy.deepcopy(original)
        candidate = r.clone_runtime(original, 'approved:new', r.NAMES[0], {'WEB_EXPLAIN_SECRET': 'a' * 43}, True)
        final = r.clone_runtime(original, 'approved:new', r.NAMES[0], {'WEB_EXPLAIN_SECRET': 'a' * 43})
        self.assertEqual(original, before, 'cloning must not mutate the rollback snapshot')
        self.assertEqual(r.env_map(candidate['Env'])['DATABASE_URL'], 'actual-runtime-db')
        self.assertEqual(r.env_map(candidate['Env'])['UNRELATED_TOKEN'], 'retain-me')
        for key in ('Labels', 'Cmd', 'Entrypoint', 'User', 'WorkingDir', 'StopSignal', 'Volumes'):
            self.assertEqual(candidate[key], original['Config'][key])
        for key, value in original['HostConfig'].items():
            if key not in ('PortBindings', 'Mounts'):
                self.assertEqual(candidate['HostConfig'][key], value)
        self.assertEqual(candidate['HostConfig']['PortBindings']['8787/tcp'][0], {'HostIp': '127.0.0.1', 'HostPort': '8788'})
        self.assertEqual(final['HostConfig']['PortBindings'], original['HostConfig']['PortBindings'])
        self.assertEqual(candidate['NetworkingConfig'], {'EndpointsConfig': {'bridge': {}}})
        self.assertEqual(candidate['HostConfig']['NetworkMode'], 'default')
        volume = candidate['HostConfig']['Mounts'][0]
        self.assertEqual(volume['Source'], 'existing-anonymous-volume')
        self.assertTrue(volume['ReadOnly'])
        self.assertNotIn('172.17.0.5', json.dumps(candidate))

    def test_unexpected_static_network_public_ports_or_other_env_override_abort(self):
        for mutate in (
            lambda row: row['NetworkSettings']['Networks']['bridge'].update(IPAMConfig={'IPv4Address': '172.17.0.5'}),
            lambda row: row['HostConfig'].update(NetworkMode='host'),
            lambda row: row['HostConfig']['PortBindings']['8787/tcp'][0].update(HostIp='0.0.0.0'),
            lambda row: row['HostConfig'].update(AutoRemove=True),
            lambda row: row['NetworkSettings']['Networks']['bridge'].update(Aliases=['live-custom-alias']),
        ):
            row = fixture(); mutate(row)
            with self.assertRaises(r.ReleaseError):
                r.clone_runtime(row, 'new', r.NAMES[0], {}, True)
        with self.assertRaises(r.ReleaseError):
            r.clone_runtime(fixture(), 'new', r.NAMES[0], {'DATABASE_URL': 'wrong-host-env-db'})

    def test_only_preview_keys_from_host_files_can_override_preserved_runtime(self):
        saved = {name: fixture(name) for name in r.NAMES}
        shared = 'live-strong-shared-key-' + 'a' * 32
        saved[r.NAMES[0]]['Config']['Env'].append('WEB_EXPLAIN_SECRET=' + shared)
        saved[r.NAMES[1]]['Config']['Env'].append('WEB_EXPLAIN_SECRET=' + shared)
        settings = r.preview_settings(saved, {r.NAMES[0]: {'DATABASE_URL': 'wrong-database', 'WEB_EXPLAIN_SECRET': 'b' * 43, 'WEB_EXPLAIN_IDENTITY_SECRET': 'unapproved-rotation-' + 'b' * 43}, r.NAMES[1]: {'OWNER_COOKIE_SECRET': 'unapproved-cookie-rotation-' + 'b' * 43}})
        self.assertEqual(settings[r.NAMES[0]]['WEB_EXPLAIN_SECRET'], shared)
        self.assertEqual(settings[r.NAMES[0]]['WEB_EXPLAIN_IDENTITY_SECRET'], shared, 'fallback identity hash key must not rotate')
        self.assertEqual(settings[r.NAMES[1]]['OWNER_COOKIE_SECRET'], shared, 'fallback cookie key must not rotate')
        cloned = r.clone_runtime(saved[r.NAMES[0]], 'new', r.NAMES[0], settings[r.NAMES[0]])
        self.assertEqual(r.env_map(cloned['Env'])['DATABASE_URL'], 'actual-runtime-db')

    def test_audit_is_fail_closed_on_exit_status_malformed_missing_or_positive_counts(self):
        valid = {'metadata': {'vulnerabilities': {'critical': 0, 'high': 0, 'moderate': 1}}}
        self.assertEqual(r.validate_audit(0, json.dumps(valid))['high'], 0)
        for status, payload in [(1, json.dumps(valid)), (0, 'warning\n' + json.dumps(valid)), (0, '{}'), (0, json.dumps({'error': 'registry failed'})), (0, json.dumps({'metadata': {'vulnerabilities': {'critical': 1, 'high': 0}}})), (0, json.dumps({'metadata': {'vulnerabilities': {'critical': 0, 'high': '0'}}}))]:
            with self.assertRaises(r.ReleaseError):
                r.validate_audit(status, payload)

    def test_candidate_bootstrap_uses_trusted_headers_and_never_accepts_error_or_missing_private_cookie(self):
        calls = []
        def response(url, headers):
            calls.append((url, headers))
            return 200, {'Set-Cookie': 'tb_owner=DO-NOT-PRINT; HttpOnly; Secure; SameSite=Lax'}, b'{"ok":true}'
        output = io.StringIO()
        with redirect_stdout(output):
            r.assert_probe(8098, bootstrap=True, request=response)
        self.assertEqual(calls[0][1]['Host'], 'tubelight.net')
        self.assertEqual(calls[0][1]['X-Real-IP'], '127.0.0.1')
        self.assertEqual(calls[0][1]['X-Forwarded-Host'], 'tubelight.net')
        self.assertNotIn('DO-NOT-PRINT', output.getvalue())
        for reply in [(403, {}, b'{"error":"untrusted_proxy"}'), (200, {}, b'{"ok":true}'), (200, {'Set-Cookie': 'tb_owner=x'}, b'{"ok":true}')]:
            with self.assertRaises(r.ReleaseError):
                r.assert_probe(8098, bootstrap=True, request=lambda *args: reply)

    def test_public_smoke_asserts_status_and_body_instead_of_only_printing_curl(self):
        def healthy(url, headers=None):
            if url.endswith('/api/health'):
                return 200, {}, b'{"ok":true,"database":true}'
            if url.endswith('/api/preview'):
                return 200, {'Set-Cookie': 'tb_owner=private; Secure; HttpOnly; SameSite=Lax'}, b'{"ok":true}'
            return 200, {}, b'<html>Understand anything. Quick Search.</html>'
        r.public_probes(healthy)
        for status in (404, 500, 502):
            with self.assertRaises(r.ReleaseError):
                r.public_probes(lambda *args: (status, {}, b'<html>error page</html>'))
        with self.assertRaises(r.ReleaseError):
            r.public_probes(lambda url, headers=None: (200, {}, b'<html>wrong endpoint</html>'))
        with self.assertRaises(r.ReleaseError):
            r.public_probes(lambda url, headers=None: (200, {}, b'<html><title>TheLuvit movies</title></html>'))

    def test_rollback_disables_preview_before_restoring_both_services_after_late_failure(self):
        saved = {name: fixture(name) for name in r.NAMES}
        containers = {}
        for name in r.NAMES:
            containers[name] = {'Id': name + '-new-id'}
            containers[name + '__rollback_test'] = saved[name]
        docker = FakeDocker(containers)
        guard = lambda: docker.events.append(('PUBLIC_PREVIEW_DISABLED',))
        r.rollback_services(docker, saved, 'test', guard, list(r.NAMES))
        self.assertEqual(docker.events[0], ('PUBLIC_PREVIEW_DISABLED',))
        for name in r.NAMES:
            self.assertEqual(docker.containers[name]['Id'], saved[name]['Id'])
            self.assertIn(('start', name), docker.events)

    def test_failed_rename_never_deletes_original_and_guard_failure_never_restores_legacy(self):
        saved = {name: fixture(name) for name in r.NAMES}
        docker = FakeDocker(saved)
        r.rollback_services(docker, saved, 'test', lambda: None, [r.NAMES[0]])
        self.assertFalse(any(event[0] in ('remove', 'create', 'rename') for event in docker.events))
        docker = FakeDocker({name + '__rollback_test': row for name, row in saved.items()})
        def fail_guard():
            raise r.ReleaseError('guard failed')
        with self.assertRaises(r.ReleaseError):
            r.rollback_services(docker, saved, 'test', fail_guard, list(r.NAMES))
        self.assertEqual(docker.events, [])

    def test_manual_rollback_missing_container_uses_saved_runtime_and_disables_legacy_secret(self):
        saved = {name: fixture(name) for name in r.NAMES}
        docker = FakeDocker({name: {'Id': 'new-' + name} for name in r.NAMES})
        r.rollback_services(docker, saved, 'test', lambda: None, list(r.NAMES))
        for event in docker.events:
            if event[0] == 'create':
                self.assertEqual(event[2]['Image'], 'sha256:approved-old-image')
                self.assertEqual(r.env_map(event[2]['Env'])['WEB_EXPLAIN_SECRET'], '')
                self.assertEqual(r.env_map(event[2]['Env'])['DATABASE_URL'], 'actual-runtime-db')

    def test_any_late_release_exception_invokes_both_service_rollback(self):
        with tempfile.TemporaryDirectory() as temporary:
            deployer = r.Deployer(temporary, FakeDocker({}))
            deployer.touched = list(r.NAMES)
            deployer.release = mock.Mock(side_effect=r.ReleaseError('public smoke failure'))
            deployer.guarded_rollback = mock.Mock()
            with self.assertRaises(r.ReleaseError):
                deployer.run()
            deployer.guarded_rollback.assert_called_once()
            self.assertTrue((Path(temporary) / 'failure.log').exists())

    def test_closed_ssh_output_cannot_interrupt_rollback_stage_logging(self):
        deployer = r.Deployer('/unused', FakeDocker({}))
        with mock.patch('builtins.print', side_effect=BrokenPipeError):
            deployer.stage('Rolling back safely')

    def test_deploy_without_explicit_commit_never_uploads_or_contacts_production(self):
        args = mock.Mock(check=False, dry_run=False, rollback=None, landing_commit=None)
        with mock.patch.object(launcher, 'ssh') as remote, mock.patch.object(launcher, 'upload') as upload:
            with self.assertRaises(r.ReleaseError):
                launcher.execute(args)
            remote.assert_not_called()
            upload.assert_not_called()

    def test_nginx_guard_is_real_and_preserves_desktop_routes_and_quoted_braces(self):
        config = '''server { listen 443 ssl; server_name tubelight.net; # ignored { bracket
location = /api/preview { proxy_set_header Example "a{b}"; proxy_pass http://landing; }
location /api/ { proxy_pass http://backend; } }
server { listen 80; server_name tubelight.net; return 301 https://$host$request_uri; }'''
        guarded = r.guard_preview_nginx(config)
        self.assertIn('location = /api/preview { return 503; }', guarded)
        self.assertEqual(guarded.count('location = /api/web/explain { return 503; }'), 2)
        self.assertIn('location /api/ { proxy_pass http://backend; }', guarded)
        self.assertEqual(r.guard_preview_nginx(guarded), guarded)
        with self.assertRaises(r.ReleaseError):
            r.guard_preview_nginx('server { server_name unrelated.example; }')

    def test_router_patch_is_exactly_two_insertions_before_terminal_and_refuses_drift(self):
        original = ('// production baseline\n' + r.IMPORT_ANCHOR + '\nconst app = express();\n' + r.ROUTE_ANCHOR + '\n' + r.TERMINAL_ANCHOR + '\napp.listen(8787);\n').encode()
        with mock.patch.object(r, 'REVIEWED_INDEX_SHA256', r.digest(original)):
            patched, artifact = r.patch_router(original)
            added = [line for line in artifact.splitlines() if line.startswith('+') and not line.startswith('+++')]
            self.assertEqual(added, ['+' + r.IMPORT_LINE, '+' + r.ROUTE_LINE])
            self.assertLess(patched.index(r.ROUTE_LINE.encode()), patched.index(r.TERMINAL_ANCHOR.encode()))
            self.assertEqual(r.patch_router(patched), (patched, ''))
            with self.assertRaises(r.ReleaseError):
                r.patch_router(original + b'// unreviewed delta\n')

    def test_private_snapshots_are_0600_even_under_permissive_umask(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'inspect.json'
            previous = os.umask(0)
            try:
                r.private_write(path, 'private runtime state')
            finally:
                os.umask(previous)
            if os.name != 'nt':
                self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)
            self.assertEqual(path.read_text(), 'private runtime state')

    def test_backend_context_excludes_recursive_secrets_backups_storage_and_symlinks(self):
        with tempfile.TemporaryDirectory() as temporary:
            source, target = Path(temporary) / 'source', Path(temporary) / 'target'
            for name in ['index.js', 'package.json', 'lib/models.js', 'lib/nested/.env.production', 'lib/nested/credentials.json', 'backups/db.sql.gz', 'storage/user.json', 'lib/backup_2026/anything.js']:
                path = source / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('placeholder')
            r.copy_backend(source, target)
            files = {path.relative_to(target).as_posix() for path in target.rglob('*') if path.is_file()}
            self.assertEqual(files, {'index.js', 'package.json', 'lib/models.js'})
            if os.name != 'nt':
                self.assertEqual(stat.S_IMODE((target / 'lib').stat().st_mode), 0o755)
                self.assertEqual(stat.S_IMODE((target / 'lib/models.js').stat().st_mode), 0o644)

    def test_archive_cannot_escape_or_create_links(self):
        for member in [tarfile.TarInfo('../outside'), tarfile.TarInfo('/absolute'), tarfile.TarInfo('link')]:
            if member.name == 'link':
                member.type, member.linkname = tarfile.SYMTYPE, '/etc/shadow'
            with tempfile.TemporaryDirectory() as temporary:
                archive = Path(temporary) / 'bad.tar'
                with tarfile.open(archive, 'w') as stream:
                    stream.addfile(member)
                with self.assertRaises(r.ReleaseError):
                    r.extract_archive(archive, Path(temporary) / 'target')

    def test_persisting_preview_keys_keeps_actual_host_lines_and_file_private(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / '.env'
            path.write_text('DATABASE_URL=host-db-kept-verbatim\n# comment\nWEB_EXPLAIN_SECRET=old\n')
            r.persist_preview_settings(path, {'WEB_EXPLAIN_SECRET': 'new-preview-key'})
            self.assertEqual(path.read_text(), 'DATABASE_URL=host-db-kept-verbatim\n# comment\nWEB_EXPLAIN_SECRET=new-preview-key\n')

    def test_wait_probe_recovers_from_transient_failures(self):
        attempts = 0
        def transient_probe():
            nonlocal attempts
            attempts += 1
            if attempts < 3:
                raise r.ReleaseError('Transient 503 preview guard')
            return True
        r.wait_probe(transient_probe, seconds=2, interval=0.01)
        self.assertEqual(attempts, 3)

    def test_wait_probe_persistent_failure_preserves_sanitized_ultimate_cause(self):
        def failing_probe():
            raise r.ReleaseError('Public ownership bootstrap failed [https://tubelight.net/api/preview status=503 ok=False cookie=False]')
        with self.assertRaises(r.ReleaseError) as context:
            r.wait_probe(failing_probe, seconds=0.05, interval=0.01)
        error_message = str(context.exception)
        self.assertIn('Readiness deadline exceeded:', error_message)
        self.assertIn('status=503 ok=False cookie=False', error_message)
        self.assertIsNotNone(context.exception.__cause__)

    def test_public_probes_and_search_diagnostics_sanitize_and_exclude_secrets(self):
        secret_token = 'super-secret-token-do-not-print-12345'
        cookie_val = f'tb_owner={secret_token}; Path=/'
        # Test 1: preview 503 during reload
        def preview_503(url, headers=None):
            if url.endswith('/api/preview'):
                return 503, {'Set-Cookie': cookie_val}, b'Service Unavailable'
            if url.endswith('/api/health'):
                return 200, {}, b'{"ok":true,"database":true}'
            return 200, {}, b'<html>Understand anything. Quick Search.</html>'
        with self.assertRaises(r.ReleaseError) as cm:
            r.public_probes(preview_503)
        msg = str(cm.exception)
        self.assertIn('Public ownership bootstrap failed', msg)
        self.assertIn('status=503', msg)
        self.assertNotIn(secret_token, msg)

        # Test 2: landing wrong site 200 (TheLuvit)
        def wrong_site(url, headers=None):
            return 200, {}, b'<html><title>TheLuvit Movies</title></html>'
        with self.assertRaises(r.ReleaseError) as cm:
            r.public_probes(wrong_site)
        msg = str(cm.exception)
        self.assertIn('Public landing/search probe failed', msg)
        self.assertIn('status=200 html=True needle=False', msg)

    def test_assert_search_host_validation(self):
        # Valid search host
        def valid_search(url, headers=None):
            return 200, {}, b'<html><title>Tubelight Quick Search</title><body>Quick Search. Stop opening dozens of tabs.</body></html>'
        r.assert_search_host(valid_search)

        # Wrong site 200 on search host
        def wrong_search(url, headers=None):
            return 200, {}, b'<html><title>TheLuvit</title></html>'
        with self.assertRaises(r.ReleaseError) as cm:
            r.assert_search_host(wrong_search)
        self.assertIn('status=200 html=True needle=False', str(cm.exception))

        # 404 on search host
        def not_found(url, headers=None):
            return 404, {}, b'<html>404 Not Found</html>'
        with self.assertRaises(r.ReleaseError) as cm:
            r.assert_search_host(not_found)
        self.assertIn('status=404', str(cm.exception))


if __name__ == '__main__':
    unittest.main(verbosity=2)
