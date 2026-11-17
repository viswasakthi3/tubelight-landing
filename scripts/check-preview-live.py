"""Explicit one-generation production check; run on the server AFTER release.

python3 check-preview-live.py --generate --release-dir /root/tubelight-preview-releases/ID
All cookies/media stay in a mode0700 directory. TLS verification stays enabled.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--generate', action='store_true', required=True)
    parser.add_argument('--release-dir', required=True)
    args = parser.parse_args()
    base = Path('/root/tubelight-preview-releases').resolve()
    release = Path(args.release_dir).resolve()
    if release.parent != base or not release.is_dir():
        raise RuntimeError('Use the exact existing private release directory')
    os.umask(0o077)
    folder = release / ('preview-qa-' + str(time.time_ns()))
    folder.mkdir(mode=0o700)
    cookie = folder / 'owner.cookies'
    other_cookie = folder / 'other.cookies'
    email = 'preview-qa-' + str(time.time_ns()) + '@example.test'
    topic = 'How a rainbow forms'
    results = []

    def call(label, body=None, jar=cookie, endpoint='/api/preview'):
        output, headers = folder / (label + '.body'), folder / (label + '.headers')
        command = [
            'curl', '--silent', '--show-error', '--max-time', '180',
            '--resolve', 'tubelight.net:443:127.0.0.1',
            '--cookie', str(jar), '--cookie-jar', str(jar),
            '--header', 'Origin: https://tubelight.net',
            '--header', 'CF-Connecting-IP: 198.51.100.17',
            '--header', 'X-Real-IP: 203.0.113.25',
            '--header', 'X-Forwarded-For: 192.0.2.99',
            '--dump-header', str(headers), '--output', str(output),
            '--write-out', '%{http_code}',
        ]
        if body is not None:
            request = folder / (label + '.request.json')
            request.write_text(json.dumps(body))
            command += ['--header', 'Content-Type: application/json', '--data-binary', '@' + str(request)]
        command.append('https://tubelight.net' + endpoint)
        process = subprocess.run(command, capture_output=True, text=True, timeout=190)
        if process.returncode:
            raise RuntimeError(label + ': HTTP transport failed; private session retained')
        status = int(process.stdout)
        data = output.read_bytes()
        parsed_headers = {}
        for line in headers.read_text().splitlines():
            if ':' in line:
                key, value = line.split(':', 1)
                parsed_headers[key.lower()] = value.strip()
        results.append({'check': label, 'status': status})
        return status, parsed_headers, data

    status, headers, _ = call('bootstrap')
    assert status == 200 and 'tb_owner=' in headers.get('set-cookie', ''), 'bootstrap failed'
    status, _, _ = call('missing-email', {'topic': topic})
    assert status == 400, 'missing-email gate failed'
    status, _, _ = call('backend-auth', {'topic': topic}, endpoint='/api/web/explain')
    assert status == 401, 'backend shared-secret gate failed'

    status, headers, original = call('first-preview', {'topic': topic, 'email': email})
    assert status == 200 and headers.get('x-preview-replay') == '0', 'first generation failed'
    frames = [json.loads(line) for line in original.splitlines() if line.strip()]
    images = sum(frame.get('type') == 'image' and isinstance(frame.get('data', {}).get('imageUrl'), str) for frame in frames)
    voices = sum(frame.get('type') == 'voice' and isinstance(frame.get('data', {}).get('audio'), str) for frame in frames)
    assert images and voices and frames[-1].get('type') == 'done', 'real media generation failed'
    assert not any(frame.get('type') == 'error' for frame in frames), 'provider completion failed'

    status, headers, replay = call('same-preview', {'topic': topic, 'email': email})
    assert status == 200 and headers.get('x-preview-replay') == '1' and original == replay, 'cached replay failed'
    status, _, body = call('second-topic', {'topic': 'Why the Moon has phases', 'email': email})
    assert status == 429 and json.loads(body).get('scope') == 'identity', 'second-topic limit failed'
    status, _, _ = call('new-browser', jar=other_cookie)
    assert status == 200, 'second browser bootstrap failed'
    status, _, body = call('email-ownership', {'topic': topic, 'email': email}, jar=other_cookie)
    assert status == 429 and json.loads(body).get('scope') == 'identity', 'used email disclosed media'

    # Direct-origin requests above supplied forged forwarding headers. nginx must
    # record loopback as the trusted network, regardless of those attacker values.
    code = """
import {previewConfig,previewIdentity} from './lib/webPreviewStore.js';
import {query,closeDb} from './db.js';
try {
 const identity=previewIdentity({email:EMAIL,ownerId:'a'.repeat(43),topic:'unused',prefix:'v4:127.0.0.0/24'},previewConfig(process.env));
 const r=await query('SELECT status,prefix_hash FROM t2u_web_preview_runs WHERE email_hash=$1',[identity.emailHash]);
 if(r.rows.length!==1||r.rows[0].status!=='complete'||r.rows[0].prefix_hash!==identity.prefixHash)throw Error('identity');
 console.log('trusted-network-and-single-reservation: PASS');
}catch{console.error('trusted-network-and-single-reservation: FAIL');process.exitCode=1;}finally{await closeDb();}
""".replace('EMAIL', json.dumps(email))
    check = subprocess.run(['docker', 'exec', '-i', 'tubelight-backend', 'node', '--input-type=module'], input=code, capture_output=True, text=True, timeout=30)
    assert check.returncode == 0, 'trusted-network SQL verification failed'
    report = {'checks': results, 'images': images, 'voiceSegments': voices, 'resultSha256': hashlib.sha256(original).hexdigest(), 'cachedReplayIdentical': True, 'trustedNetworkVerified': True, 'generationReservations': 1}
    (release / 'preview-live-check.json').write_text(json.dumps(report, indent=2) + '\n')
    # Delete only files this invocation created; retain the non-sensitive receipt.
    for item in folder.iterdir():
        if item.is_file():
            item.unlink()
    folder.rmdir()
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('Live preview verification failed:', str(error))
        raise SystemExit(1)
