/** Read-only HTTP smoke checks. No signup, payment or generation requests. */
const base = new URL(process.argv[2] || 'http://127.0.0.1:3006');
const local = ['localhost', '127.0.0.1'].includes(base.hostname);
const searchBase = local ? base : new URL('https://search.tubelight.net');
const checks = [
  [base, '/', 'tubelight.net', 'Understand anything'],
  [base, '/search?route-check=1', 'tubelight.net', 'Stop opening'],
  [searchBase, '/', 'search.tubelight.net', 'Stop opening'],
  [base, '/download', 'tubelight.net', 'Download Tubelight'],
  [base, '/upgrade', 'tubelight.net', 'Tubelight'],
  [base, '/checkout', 'tubelight.net', 'Tubelight'],
  [base, '/robots.txt', 'tubelight.net', 'Sitemap'],
  [base, '/sitemap.xml', 'tubelight.net', 'urlset'],
  [searchBase, '/llms.txt', 'search.tubelight.net', 'Quick Search AI'],
  [searchBase, '/llms-full.txt', 'search.tubelight.net', 'Quick Search AI'],
];
const results = [];
const assets = new Map();
const headersFor = (host) => local ? { host, 'x-forwarded-host': host, 'x-forwarded-proto': 'https' } : {};
for (const [origin, path, host, expected] of checks) {
  try {
    const response = await fetch(new URL(path, origin), { headers: headersFor(host), redirect: 'manual', signal: AbortSignal.timeout(20_000) });
    const body = await response.text();
    const ok = response.status === 200 && body.toLowerCase().includes(expected.toLowerCase());
    results.push({ path, host, status: response.status, ok });
    if (response.status === 200 && response.headers.get('content-type')?.includes('text/html')) {
      for (const match of body.matchAll(/(?:src|href|poster)="([^"<>]+)"/g)) {
        const value = match[1].replaceAll('&amp;', '&');
        if (value.startsWith('/') && !value.startsWith('//') && /\.(png|jpe?g|webp|svg|ico|mp4|mp3|wav|woff2?|js|css)(\?|$)/i.test(value)) assets.set(value, { origin, host });
      }
    }
  } catch (error) { results.push({ path, host, ok: false, error: error.message }); }
}
const entries = [...assets];
let cursor = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (cursor < entries.length) {
    const [path, { origin, host }] = entries[cursor++];
    try {
      const r = await fetch(new URL(path, origin), { method: 'HEAD', headers: headersFor(host), signal: AbortSignal.timeout(20_000) });
      results.push({ path, host, status: r.status, ok: r.status === 200, asset: true });
    } catch (error) { results.push({ path, host, ok: false, error: error.message, asset: true }); }
  }
}));
try {
  const r = await fetch(new URL('/search?route-check=1', searchBase), { redirect: 'manual', headers: headersFor('search.tubelight.net'), signal: AbortSignal.timeout(20_000) });
  const location = r.headers.get('location');
  const url = location ? new URL(location, searchBase) : null;
  results.push({ path: '/search?route-check=1', host: 'search.tubelight.net', status: r.status, ok: r.status === 308 && url?.hostname === 'search.tubelight.net' && url.pathname === '/' && url.search === '?route-check=1' });
} catch (error) { results.push({ path: '/search?route-check=1', ok: false, error: error.message }); }
const failed = results.filter(result => !result.ok);
console.log(JSON.stringify({ base: base.href, pages: checks.length + 1, assets: assets.size, passed: results.length - failed.length, failed: failed.length, failures: failed }, null, 2));
process.exitCode = failed.length ? 1 : 0;
