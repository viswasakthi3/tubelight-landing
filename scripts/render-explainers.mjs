// Renders saved Tubelight explanations into small web MP4s + VTT + JSON.
// Usage: node scripts/render-explainers.mjs [slug ...]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const LIB = 'C:/Users/viswa/AppData/Roaming/Tubelight Library';
const OUT = path.resolve(import.meta.dirname, '..', 'public', 'videos');
const TMP = path.join(OUT, '.tmp');
const ITEMS = [
  { slug: 'rocket', id: 'instant_1791435159127_yu88p', short: true },
  { slug: 'headaches', id: 'instant_1790160125548_ocy62', short: true },
  { slug: 'dna', id: 'clarity_1789969512902_cctog', short: true },
  { slug: 'ocean', id: 'instant_1790399028296_gzfho' },
  { slug: 'polar-bear', id: 'instant_1790147204991_2x0in' },
  { slug: 'insurance', id: 'instant_1790855218442_9j46h' },
  { slug: 'tv', id: 'instant_1791435496164_i7i5k' },
];
const only = process.argv.slice(2);
const index = JSON.parse(fs.readFileSync(`${LIB}/index.json`, 'utf8')).entries;
const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 }).toString();
const dur = (f) => parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]));
const ts = (s) => {
  const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(m)}:${p(sec)}.${p(ms % 1000, 3)}`;
};
const r3 = (x) => Math.round(x * 1000) / 1000;

function splitText(text, d) {
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length <= 120) return [{ start: 0, end: d, text }];
  const n = Math.min(3, Math.ceil(text.length / 120));
  let parts = text.match(/[^.!?]+[.!?]+["')]*\s*|[^.!?]+$/g).map((s) => s.trim());
  // further split long sentences at commas
  parts = parts.flatMap((s) => (s.length > 120 ? s.split(/(?<=,)\s+/) : [s]));
  // greedily merge into n groups by target length
  const target = text.length / n;
  const groups = []; let cur = '';
  for (const p of parts) {
    if (cur && groups.length < n - 1 && (cur + ' ' + p).length > target * 1.15) { groups.push(cur); cur = p; }
    else cur = cur ? cur + ' ' + p : p;
  }
  if (cur) groups.push(cur);
  const total = groups.reduce((a, g) => a + g.length, 0);
  let t = 0;
  return groups.map((g) => { const s = t; t += (g.length / total) * d; return { start: s, end: t, text: g }; });
}

function render(slug, id, count, suffix, title) {
  const dir = `${LIB}/items/${id}`;
  const meta = JSON.parse(fs.readFileSync(`${dir}/meta.json`, 'utf8'));
  const beats = meta.beats.slice(0, count ?? meta.beats.length);
  const durs = beats.map((_, i) => dur(`${dir}/voice-${i}.mp3`));
  const total = durs.reduce((a, b) => a + b, 0);
  // inputs: each beat = looped still image with duration; audio from mp3
  const args = ['-y', '-v', 'error'];
  beats.forEach((b, i) => args.push('-loop', '1', '-framerate', '10', '-t', String(durs[i]), '-i', `${dir}/image-${b.sheet}.png`));
  beats.forEach((_, i) => args.push('-i', `${dir}/voice-${i}.mp3`));
  const n = beats.length;
  const vf = beats.map((_, i) => `[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,fps=10,format=yuv420p[v${i}]`);
  const vin = beats.map((_, i) => `[v${i}]`).join('');
  const ain = beats.map((_, i) => `[${n + i}:a]aresample=44100,aformat=channel_layouts=mono[a${i}]`);
  const aj = beats.map((_, i) => `[a${i}]`).join('');
  const fc = [...vf, ...ain, `${vin}concat=n=${n}:v=1:a=0[v]`, `${aj}concat=n=${n}:v=0:a=1[a]`].join(';');
  const out = path.join(OUT, `${slug}${suffix}.mp4`);
  args.push('-filter_complex', fc, '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-r', '10',
    '-c:a', 'aac', '-b:a', '96k', '-ac', '1', '-movflags', '+faststart', out);
  run('ffmpeg', args);
  let cues = [], t0 = 0;
  beats.forEach((b, i) => {
    for (const c of splitText(b.say || '', durs[i])) cues.push({ start: r3(t0 + c.start), end: r3(t0 + c.end), text: c.text });
    t0 += durs[i];
  });
  fs.writeFileSync(path.join(OUT, `${slug}${suffix}.vtt`),
    'WEBVTT\n\n' + cues.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join('\n'));
  return { total, cues, out };
}

fs.mkdirSync(OUT, { recursive: true });
for (const it of ITEMS) {
  if (only.length && !only.includes(it.slug)) continue;
  const title = index[it.id]?.title || it.slug;
  const full = render(it.slug, it.id, null, '', title);
  const json = { slug: it.slug, title, duration: r3(full.total), cues: full.cues };
  if (it.short) {
    const s = render(it.slug, it.id, 3, '-short', title);
    json.shortDuration = r3(s.total); json.shortCues = s.cues;
  }
  fs.writeFileSync(path.join(OUT, `${it.slug}.json`), JSON.stringify(json, null, 2));
  const img0 = `${LIB}/items/${it.id}/image-0.png`;
  const sc = 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=white';
  run('ffmpeg', ['-y', '-v', 'error', '-i', img0, '-vf', sc, '-q:v', '4', path.join(OUT, `${it.slug}-poster.jpg`)]);
  run('ffmpeg', ['-y', '-v', 'error', '-i', img0, '-vf', 'scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2:color=white', '-c:v', 'libwebp', '-quality', '78', path.join(OUT, `${it.slug}-thumb.webp`)]);
  console.log('done', it.slug, title, json.duration);
}
