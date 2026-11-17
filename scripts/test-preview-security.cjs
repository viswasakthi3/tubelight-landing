const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));

class NextResponse extends Response {
  static json(value, init) {
    return new NextResponse(JSON.stringify(value), {
      ...init, headers: { 'content-type': 'application/json', ...init?.headers },
    });
  }
}

let calls, signups, storeFails, upstreamFails, upstreamStatus;
function compile(file, overrides = {}, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  const localRequire = (id) => {
    if (id in overrides) return overrides[id];
    if (id.startsWith('@/')) return compile(id.slice(2) + '.ts', overrides);
    return require(id);
  };
  const ctx = vm.createContext({
    module: mod, exports: mod.exports, require: localRequire, process, Buffer,
    Response, Request, Headers, URL, TextEncoder, TextDecoder, console,
    fetch: async (url, init) => {
      calls.push({ url, ...init });
      if (upstreamFails) throw new Error('test upstream unavailable');
      return upstreamStatus === 200
        ? new Response('{"type":"done"}\n', { status: 200 })
        : new Response(JSON.stringify({ error: 'limit', scope: 'identity' }), { status: upstreamStatus });
    },
    ...globals,
  });
  vm.runInContext(output, ctx, { filename: file });
  return mod.exports;
}

process.env.NODE_ENV = 'production';
process.env.WEB_EXPLAIN_SECRET = 'preview-test-only-not-a-production-secret';
process.env.DATABASE_URL = 'postgres://test-placeholder-not-used';
delete process.env.OWNER_COOKIE_SECRET;
const owner = compile('lib/owner-token.ts');
const api = compile('app/api/preview/route.ts', {
  'next/server': { NextResponse },
  '@/lib/rate-limit': { makeLimiter: () => () => false },
  '@/lib/owner-token': owner,
  '@/lib/waitlist': {
    saveSignup: async (signup) => { signups.push(signup); if (storeFails) throw new Error('test store unavailable'); },
    isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email),
  },
});
const stableOwner = owner.generateOwnerId();

function reset() {
  calls = []; signups = []; storeFails = false; upstreamFails = false; upstreamStatus = 200;
  process.env.WEB_EXPLAIN_SECRET = 'preview-test-only-not-a-production-secret';
}
function request(body, headers = {}) {
  return new Request('https://tubelight.net/api/preview', {
    method: 'POST', headers: {
      host: 'tubelight.net', origin: 'https://tubelight.net',
      'content-type': 'application/json', 'x-real-ip': '203.0.113.5', ...headers,
      cookie: `${owner.OWNER_COOKIE_NAME}=${owner.signOwnerCookie(stableOwner)}`,
      ...headers,
    }, body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
const good = { topic: 'How soap bubbles form', email: 'QA@example.com' };
let passed = 0, failed = 0;
async function test(name, run) {
  reset();
  try { await run(); passed++; console.log('PASS', name); }
  catch (error) { failed++; console.log('FAIL', name, '-', error.message); }
}

(async () => {
  await test('bootstrap establishes private ownership before any paid work', async () => {
    const r = await api.GET(request(good, { cookie: '' }));
    assert.equal(r.status, 200); assert.deepEqual(await r.json(), { ok: true });
    assert.ok(r.headers.get('set-cookie')); assert.equal(calls.length, 0); assert.equal(signups.length, 0);
  });
  await test('generation requires an already-received signed cookie', async () => {
    const r = await api.POST(request(good, { cookie: '' }));
    assert.equal(r.status, 403); assert.equal(calls.length, 0); assert.equal(signups.length, 0);
  });
  await test('forged owner cookie cannot authorize generation', async () => {
    const r = await api.POST(request(good, { cookie: 'tb_owner=v1.' + stableOwner + '.' + 'z'.repeat(43) }));
    assert.equal(r.status, 403); assert.equal(calls.length, 0);
  });
  await test('missing email does not call provider', async () => {
    const r = await api.POST(request({ topic: good.topic }));
    assert.equal(r.status, 400); assert.equal(calls.length, 0);
  });
  await test('malformed body fails without provider', async () => {
    const r = await api.POST(request('{'));
    assert.equal(r.status, 400); assert.equal(calls.length, 0);
  });
  await test('null JSON is a controlled 400', async () => {
    const r = await api.POST(request('null'));
    assert.equal(r.status, 400); assert.equal(calls.length, 0);
  });
  await test('untrusted origin refused', async () => {
    const r = await api.POST(request(good, { origin: 'https://attacker.example' }));
    assert.equal(r.status, 403); assert.equal(calls.length, 0);
  });
  await test('localhost origin refused in production', async () => {
    const r = await api.POST(request(good, { origin: 'http://localhost:9999' }));
    assert.equal(r.status, 403); assert.equal(calls.length, 0);
  });
  await test('forged CF header cannot supply missing trusted IP', async () => {
    const r = await api.POST(request(good, { 'x-real-ip': '', 'cf-connecting-ip': '198.51.100.2' }));
    assert.ok(r.status >= 400); assert.equal(calls.length, 0);
  });
  await test('email stored before request and owner comes from signed cookie only', async () => {
    const r = await api.POST(request({ ...good, ownerId: 'attacker-supplied-owner-value-0000000000' }));
    assert.equal(r.status, 200); assert.equal(signups[0].email, 'qa@example.com');
    const sent = JSON.parse(calls[0].body);
    assert.equal(sent.email, 'qa@example.com'); assert.notEqual(sent.ownerId, 'attacker-supplied-owner-value-0000000000');
    const cookie = r.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /SameSite=Lax/);
    assert.equal(owner.verifyOwnerCookie(cookie.split(';')[0].split('=')[1]), sent.ownerId);
  });
  await test('same signed browser cookie forwards stable owner for replay', async () => {
    const id = owner.generateOwnerId();
    await api.POST(request(good, { cookie: `${owner.OWNER_COOKIE_NAME}=${owner.signOwnerCookie(id)}` }));
    assert.equal(JSON.parse(calls[0].body).ownerId, id);
  });
  await test('store failure prevents provider call', async () => {
    storeFails = true;
    const r = await api.POST(request(good));
    assert.equal(r.status, 503); assert.equal(calls.length, 0);
  });
  await test('invalid signing configuration fails before provider work', async () => {
    const req = request(good);
    process.env.WEB_EXPLAIN_SECRET = 'short';
    const r = await api.POST(req);
    assert.ok(r.status >= 400); assert.equal(calls.length, 0);
  });
  await test('lost upstream response preserves owner cookie for retry', async () => {
    upstreamFails = true;
    const r = await api.POST(request(good));
    assert.equal(r.status, 502); assert.ok(r.headers.get('set-cookie'));
  });
  await test('backend identity limit preserved', async () => {
    upstreamStatus = 429;
    const r = await api.POST(request(good));
    assert.equal(r.status, 429); assert.equal((await r.json()).scope, 'identity');
  });
  await test('oversized and non-JSON payloads refused before provider', async () => {
    assert.equal((await api.POST(request(JSON.stringify({ ...good, padding: 'x'.repeat(5000) })))).status, 413);
    assert.equal((await api.POST(request(good, { 'content-type': 'text/plain' }))).status, 415);
    assert.equal(calls.length, 0);
  });
  await test('preview cannot use local-file fallback without a database', async () => {
    delete process.env.DATABASE_URL;
    try { assert.equal((await api.POST(request(good))).status, 503); assert.equal(calls.length, 0); }
    finally { process.env.DATABASE_URL = 'postgres://test-placeholder-not-used'; }
  });
  await test('client never starts a generation if ownership bootstrap fails', async () => {
    const methods = [], events = [];
    const client = compile('lib/preview-stream.ts', {}, { fetch: async (_url, init) => {
      methods.push(init.method);
      return new Response('{"error":"preview_unavailable"}', { status: 503 });
    } });
    await client.startPreview(good.topic, good.email, event => events.push(event));
    assert.deepEqual(methods, ['GET']); assert.equal(events[0].code, 'preview_unavailable');
  });
  await test('client bootstraps before POST and preserves terminal server errors', async () => {
    const methods = [], events = [];
    const client = compile('lib/preview-stream.ts', {}, { fetch: async (_url, init) => {
      methods.push(init.method);
      return init.method === 'GET' ? new Response('{"ok":true}')
        : new Response('{"type":"error","code":"preview_unavailable"}\n');
    } });
    await client.startPreview(good.topic, good.email, event => events.push(event));
    assert.deepEqual(methods, ['GET', 'POST']); assert.equal(events.at(-1).code, 'preview_unavailable');
  });
  await test('playback waits for durable terminal completion after all media arrives', async () => {
    const client = compile('lib/preview-stream.ts');
    let state = client.reducePreview(client.initialPreviewState, {
      type: 'plan', title: 'Test', beats: [{ say: 'A test.', sheet: 0 }], sheets: [{ index: 0, title: 'Test' }],
    });
    state = client.reducePreview(state, { type: 'image', index: 0, src: 'data:image/png;base64,dGVzdA==' });
    state = client.reducePreview(state, { type: 'voice', index: 0, src: 'data:audio/mp3;base64,dGVzdA==' });
    assert.equal(state.status, 'saving');
    assert.equal(client.reducePreview(state, { type: 'done' }).status, 'ready');
    assert.equal(client.reducePreview(state, { type: 'error', code: 'preview_unavailable' }).status, 'error');
  });
  console.log(JSON.stringify({ passed, failed }));
  process.exitCode = failed ? 1 : 0;
})();

