#!/usr/bin/env python3
"""Launch a pinned, scoped release worker. --check/--dry-run are read-only.

python scripts/deploy_preview.py --deploy --landing-commit <approved SHA>
python scripts/deploy_preview.py --rollback <release ID>
Offline checks: python scripts/test_release_runtime.py
"""
import argparse
import datetime
import hashlib
import io
import json
from pathlib import Path
import re
import secrets
import shlex
import subprocess
import sys
import tarfile
import tempfile

import release_runtime as worker

LANDING = Path(__file__).resolve().parent.parent
BACKEND = Path(r'D:\projects\time2understand\t2u_backend')
SERVER = 'root@88.198.81.89'
BASE = '/root/tubelight-preview-releases'


def run(arguments, **kwargs):
    result = subprocess.run(arguments, capture_output=True, **kwargs)
    if result.returncode:
        # Do not echo SSH/subprocess payloads: inspect and cookie material may be private.
        raise worker.ReleaseError('Command failed (exit %d); no production activation was requested by checks' % result.returncode)
    return result


def ssh(command, input_text=None, timeout=120):
    args = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5']
    if input_text is None:
        args.append('-n')
    args += [SERVER, command]
    return run(args, input=input_text, text=True, timeout=timeout)


def git(root, *arguments):
    return run(['git', '-C', str(root), *arguments]).stdout


def commit(root, reference):
    if not reference or reference.startswith('-'):
        raise worker.ReleaseError('An explicit approved landing commit is required')
    value = git(root, 'rev-parse', '--verify', reference + '^{commit}').decode().strip()
    if not re.fullmatch(r'[a-f0-9]{40,64}', value):
        raise worker.ReleaseError('Could not resolve an exact release commit')
    return value


def backend_blob(revision, relative):
    # Backend lives in the time2understand repository; derive its tracked prefix.
    prefix = git(BACKEND, 'rev-parse', '--show-prefix').decode().strip()
    return git(BACKEND, 'show', revision + ':' + prefix + relative)


def readonly_check():
    # stdin is fully supplied/closed; no upload, directories, keys or containers created.
    source = (LANDING / 'scripts/release_runtime.py').read_text()
    result = ssh('python3 - --check', input_text=source)
    print(result.stdout.strip())


def upload(path, destination):
    run(['scp', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', str(path), SERVER + ':' + destination], timeout=1200)


def execute(arguments):
    if arguments.check or arguments.dry_run:
        readonly_check()
        if arguments.dry_run:
            print('Read-only checks complete. Deploy requires --landing-commit; no working-tree packaging is supported.')
        return
    if arguments.rollback:
        if not re.fullmatch(r'[0-9]{8}_[0-9]{6}_[a-f0-9]{8}', arguments.rollback):
            raise worker.ReleaseError('Invalid rollback release ID')
        directory = BASE + '/' + arguments.rollback
        command = 'python3 %s --rollback %s' % (shlex.quote(directory + '/release_runtime.py'), shlex.quote(directory))
        completed = subprocess.run(['ssh', '-n', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', SERVER, command], timeout=600)
        if completed.returncode:
            raise worker.ReleaseError('Rollback failed; inspect private release logs immediately')
        return
    landing_sha = commit(LANDING, arguments.landing_commit)
    backend_sha = commit(BACKEND, arguments.backend_commit or 'HEAD')
    # The reviewed launcher/worker must match the explicitly approved landing commit.
    for filename in ('scripts/deploy_preview.py', 'scripts/release_runtime.py'):
        approved = git(LANDING, 'show', landing_sha + ':' + filename).replace(b'\r\n', b'\n')
        working = (LANDING / filename).read_bytes().replace(b'\r\n', b'\n')
        if approved != working:
            raise worker.ReleaseError('Release tooling differs from the approved landing commit')
    release_id = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d_%H%M%S_') + secrets.token_hex(4)
    remote = BASE + '/' + release_id
    with tempfile.TemporaryDirectory(prefix='tubelight-release-') as temporary:
        temporary = Path(temporary)
        landing_tar = temporary / 'landing.tar.gz'
        run(['git', '-C', str(LANDING), 'archive', '--format=tar.gz', '--output', str(landing_tar), landing_sha])
        backend_tar = temporary / 'backend.tar.gz'
        hashes = {}
        with tarfile.open(backend_tar, 'w:gz') as archive:
            for relative in worker.BACKEND_FILES:
                data = backend_blob(backend_sha, relative)
                hashes[relative] = hashlib.sha256(data).hexdigest()
                item = tarfile.TarInfo(relative)
                item.size, item.mode, item.mtime = len(data), 0o600, 0
                archive.addfile(item, io.BytesIO(data))
        manifest = {'release_id': release_id, 'landing_commit': landing_sha, 'backend_commit': backend_sha,
                    'backend_hashes': hashes, 'landing_archive_sha256': worker.digest(landing_tar.read_bytes()),
                    'backend_archive_sha256': worker.digest(backend_tar.read_bytes())}
        (temporary / 'manifest.json').write_text(json.dumps(manifest, sort_keys=True, indent=2))
        (temporary / 'release_runtime.py').write_bytes(git(LANDING, 'show', landing_sha + ':scripts/release_runtime.py'))
        # No runtime keys, environment files or inspect snapshots leave the server.
        ssh('umask 077; mkdir -p %s; chmod 700 %s; mkdir %s' % (shlex.quote(BASE), shlex.quote(BASE), shlex.quote(remote)))
        for filename in ('landing.tar.gz', 'backend.tar.gz', 'manifest.json', 'release_runtime.py'):
            upload(temporary / filename, remote + '/' + filename)
        ssh('chmod 600 ' + ' '.join(shlex.quote(remote + '/' + filename) for filename in ('landing.tar.gz', 'backend.tar.gz', 'manifest.json', 'release_runtime.py')))
    print('Release ID:', release_id, flush=True)
    print('Approved landing commit:', landing_sha, flush=True)
    print('Scoped backend commit:', backend_sha, flush=True)
    # Worker emits only sanitized stage messages. Stream them for ongoing status.
    command = 'python3 %s --deploy %s' % (shlex.quote(remote + '/release_runtime.py'), shlex.quote(remote))
    result = subprocess.run(['ssh', '-n', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', SERVER, command], timeout=3600)
    if result.returncode:
        raise worker.ReleaseError('Release failed; consult its private state/logs and rollback status before retrying')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--dry-run', action='store_true')
    mode.add_argument('--deploy', action='store_true')
    mode.add_argument('--rollback')
    parser.add_argument('--landing-commit')
    parser.add_argument('--backend-commit', help='Defaults to committed backend HEAD; only the eight reviewed feature paths are read')
    arguments = parser.parse_args()
    try:
        execute(arguments)
    except (worker.ReleaseError, subprocess.SubprocessError) as error:
        print(str(error) if isinstance(error, worker.ReleaseError) else 'Release command failed or timed out; inspect private remote state', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
