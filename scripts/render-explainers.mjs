// Renders saved Tubelight explanations into small web MP4s + VTT + JSON.
// Usage: node scripts/render-explainers.mjs [slug ...]
//        node scripts/render-explainers.mjs --pointer-only [slug ...]   (only refresh pointer data in existing JSON)
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
  { slug: 'neurons', id: 'instant_1790349841826_yx3j3' },
  { slug: 'zombie-cells', id: 'instant_1790386734228_2lr2h' },
  { slug: 'kidneys', id: 'instant_1788991015305_8ccuf' },
  { slug: 'appendix', id: 'instant_1791435756172_bsm0c' },
  { slug: 'black-holes', id: 'instant_1789932308259_q9um3' },
  { slug: 'dark-matter', id: 'instant_1789981977671_aosyc' },
];
const args0 = process.argv.slice(2);
const POINTER_ONLY = args0.includes('--pointer-only');
const only = args0.filter((a) => !a.startsWith('--'));
const index = JSON.parse(fs.readFileSync(`${LIB}/index.json`, 'utf8')).entries;
const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 }).toString();
const dur = (f) => parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]));
const ts = (s) => {
  const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(m)}:${p(sec)}.${p(ms % 1000, 3)}`;
};
const r3 = (x) => Math.round(x * 1000) / 1000;

// ---- Pointer data (mirrors the app's Spotlight.jsx / lib/instant/walk.js) ----
const ZONE_RECTS = {
  left: { x: 0, y: 0, w: 0.36, h: 1 }, center: { x: 0.32, y: 0, w: 0.36, h: 1 }, right: { x: 0.64, y: 0, w: 0.36, h: 1 },
  'top-left': { x: 0, y: 0, w: 0.44, h: 0.55 }, 'top-center': { x: 0.28, y: 0, w: 0.44, h: 0.55 }, 'top-right': { x: 0.56, y: 0, w: 0.44, h: 0.55 },
  'bottom-left': { x: 0, y: 0.45, w: 0.44, h: 0.55 }, 'bottom-center': { x: 0.28, y: 0.45, w: 0.44, h: 0.55 }, 'bottom-right': { x: 0.56, y: 0.45, w: 0.44, h: 0.55 },
};
const isBox = (b) => Boolean(b) && ['x', 'y', 'w', 'h'].every((k) => Number.isFinite(b[k])) && b.w > 0 && b.h > 0;
const focusRect = (b) => {
  if (!isBox(b)) return null;
  const pad = 0.025, x = Math.max(0, b.x - pad), y = Math.max(0, b.y - pad);
  return { x, y, w: Math.min(1 - x, b.w + pad * 2), h: Math.min(1 - y, b.h + pad * 2) };
};
const overlapShare = (a, b) => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (w <= 0 || h <= 0) return 0;
  const sh = w * h, un = a.w * a.h + b.w * b.h - sh;
  return un > 0 ? sh / un : 0;
};
function walkPlaces(beats) {
  const places = [];
  for (const beat of beats) {
    const place = isBox(beat?.focus) ? { box: beat.focus } : beat?.at && beat.at !== 'whole' && ZONE_RECTS[beat.at] ? { zone: beat.at } : null;
    if (!place) continue;
    if (!places.some((o) => (place.zone || o.zone ? place.zone === o.zone : overlapShare(place.box, o.box) >= 0.5))) places.push(place);
  }
  return places;
}
const r4 = (x) => Math.round(x * 10000) / 10000;
// Returns { beats: [{x,y}|null per meta beat], sheets: { [sheet]: { walk, pw } } }; coordinates are fractions of the 1280x720 frame.
function pointerData(meta, idir) {
  const dims = {}, sheets = {};
  const dim = (N) => dims[N] ??= run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', `${idir}/image-${N}.png`]).trim().split(',').map(Number);
  const walkOf = (N) => sheets[N]?.walk ?? (sheets[N] = { walk: walkPlaces(meta.beats.filter((b) => b.sheet === N)).length >= 2 }).walk;
  const beats = meta.beats.map((b) => {
    const N = b.sheet, walk = walkOf(N);
    const [iw, ih] = dim(N), s = Math.min(1280 / iw, 720 / ih), pw = iw * s, ph = ih * s, ox = (1280 - pw) / 2, oy = (720 - ph) / 2;
    sheets[N].pw = r4(pw / 1280);
    const rect = focusRect(b.focus) || (b.at && b.at !== 'whole' ? ZONE_RECTS[b.at] : null);
    if (!walk || !rect) return null;
    return { x: r4((ox + (rect.x + rect.w / 2) * pw) / 1280), y: r4((oy + (rect.y + rect.h / 2) * ph) / 720) };
  });
  return { beats, sheets };
}

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
  return { total, cues, out, durs, beats, meta };
}

fs.mkdirSync(OUT, { recursive: true });
for (const it of ITEMS) {
  if (only.length && !only.includes(it.slug)) continue;
  if (POINTER_ONLY) {
    const jp = path.join(OUT, `${it.slug}.json`), json = JSON.parse(fs.readFileSync(jp, 'utf8'));
    const idir = `${LIB}/items/${it.id}`, meta = JSON.parse(fs.readFileSync(`${idir}/meta.json`, 'utf8'));
    const pd = pointerData(meta, idir);
    if (pd.beats.length !== json.beats.length) console.warn(`beat count mismatch ${it.slug}: meta ${pd.beats.length} json ${json.beats.length}`);
    json.beats.forEach((b, i) => { b.ptr = pd.beats[i] ?? null; });
    json.sheets.forEach((sh) => { const p = pd.sheets[sh.index]; sh.walk = p.walk; sh.pw = p.pw; });
    fs.writeFileSync(jp, JSON.stringify(json, null, 2));
    console.log('pointer', it.slug, json.beats.filter((b) => b.ptr).length + '/' + json.beats.length);
    continue;
  }
  const title = index[it.id]?.title || it.slug;
  const full = render(it.slug, it.id, null, '', title);
  const json = { slug: it.slug, title, duration: r3(full.total), cues: full.cues };
  {
    const sd = path.join(OUT, it.slug); fs.mkdirSync(sd, { recursive: true });
    const idir = `${LIB}/items/${it.id}`;
    const sheets = [], beatsOut = []; let t = 0;
    const pd = pointerData(full.meta, idir);
    full.beats.forEach((b, i) => {
      const start = r3(t), end = r3(t + full.durs[i]); t += full.durs[i];
      beatsOut.push({ start, end, sheet: b.sheet, say: (b.say || '').replace(/\s+/g, ' ').trim(), ptr: pd.beats[i] ?? null });
      let sh = sheets.find((x) => x.index === b.sheet);
      if (sh) sh.end = end;
      else {
        const N = b.sheet;
        run('ffmpeg', ['-y', '-v', 'error', '-i', `${idir}/image-${N}.png`, '-vf', 'scale=1280:-2', '-c:v', 'libwebp', '-quality', '80', path.join(sd, `p${N}.webp`)]);
        run('ffmpeg', ['-y', '-v', 'error', '-i', `${idir}/image-${N}.png`, '-vf', 'scale=400:-2', '-c:v', 'libwebp', '-quality', '76', path.join(sd, `p${N}-s.webp`)]);
        sheets.push({ index: N, title: full.meta.sheets?.[N]?.title || '', src: `/videos/${it.slug}/p${N}.webp`, thumb: `/videos/${it.slug}/p${N}-s.webp`, start, end, walk: pd.sheets[N].walk, pw: pd.sheets[N].pw });
      }
    });
    json.sheets = sheets; json.beats = beatsOut;
    json.typed = String(full.meta.source || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  }
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
