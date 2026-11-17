// Static-only local review server. Byte ranges let the MP4 scene buttons seek.
// No Next environment files, backend, database or provider calls are loaded.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const port = Number(process.env.HERO_REVIEW_PORT || 3012);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.mp4':'video/mp4', '.vtt':'text/vtt; charset=utf-8' };
http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  let target;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(root + path.sep) && target !== root) throw new Error('Outside public root');
    if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  } catch { res.writeHead(404); res.end('Not found'); return; }
  let stat;
  try { stat = fs.statSync(target); if (!stat.isFile()) throw new Error('Not a file'); }
  catch { res.writeHead(404); res.end('Not found'); return; }
  const headers = { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Accept-Ranges':'bytes', 'Cache-Control':'no-cache' };
  let start = 0, end = stat.size - 1, status = 200;
  if (req.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!match || (!match[1] && !match[2])) { res.writeHead(416, { 'Content-Range':`bytes */${stat.size}` }); res.end(); return; }
    if (!match[1]) start = Math.max(0, stat.size - Number(match[2]));
    else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
    if (start > end || start >= stat.size) { res.writeHead(416, { 'Content-Range':`bytes */${stat.size}` }); res.end(); return; }
    status = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
  }
  headers['Content-Length'] = end - start + 1;
  res.writeHead(status, headers);
  if (req.method === 'HEAD') { res.end(); return; }
  const stream = fs.createReadStream(target, { start, end });
  stream.on('error', () => res.destroy());
  stream.pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`Hero storyboards: http://127.0.0.1:${port}/previews/hero-2026-11-17/`));
