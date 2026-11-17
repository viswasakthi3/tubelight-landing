// Rebuild the static review page, VTT captions and silent three-scene MP4s.
// Usage: node scripts/build-hero-storyboards.mjs [--page-only]
// No provider calls. Source art comes from ChatGPT image_gen; see the saved prompts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'public/previews/hero-2026-11-17');
const data = JSON.parse(fs.readFileSync(path.join(dir, 'storyboards-v2.json'), 'utf8'));
const pageOnly = process.argv.includes('--page-only');
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const stamp = (s) => {
  const ms = Math.round(s * 1000);
  return `00:${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
};

for (const topic of data.storyboards) {
  if (topic.scenes.length !== 3) throw new Error(`${topic.slug}: expected three scenes`);
  let clock = 0;
  const cues = [];
  topic.scenes.forEach((scene) => {
    if (!fs.existsSync(path.join(dir, scene.image))) throw new Error(`Missing ${scene.image}`);
    if (scene.captions.join(' ') !== scene.narration) throw new Error(`Caption/transcript mismatch: ${topic.slug}/${scene.id}`);
    scene.start = clock;
    const weight = scene.captions.reduce((n, line) => n + line.split(/\s+/).length, 0);
    scene.captions.forEach((line) => {
      const start = clock;
      clock += scene.seconds * line.split(/\s+/).length / weight;
      cues.push({ start, end: clock, text: line });
    });
    scene.end = clock;
  });
  topic.duration = Math.round(clock);
  fs.writeFileSync(path.join(dir, `${topic.slug}-storyboard-v2.vtt`), 'WEBVTT\n\n' + cues.map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n'));

  if (!pageOnly) {
    const args = ['-y', '-v', 'error'];
    topic.scenes.forEach((s) => args.push('-loop', '1', '-framerate', '12', '-t', String(s.seconds), '-i', path.join(dir, s.image)));
    const filters = topic.scenes.map((_, i) => `[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x071222,setsar=1,setpts=PTS-STARTPTS[v${i}]`);
    filters.push('[v0][v1][v2]concat=n=3:v=1:a=0[v]');
    args.push('-filter_complex', filters.join(';'), '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'medium', '-tune', 'stillimage', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', '12', '-movflags', '+faststart', path.join(dir, `${topic.slug}-storyboard-v2.mp4`));
    execFileSync('ffmpeg', args, { stdio: 'inherit' });
    console.log(`${topic.slug}: ${topic.duration}s silent preview, 3 images`);
  }
}

const topics = data.storyboards.map((t, i) => `<a href="#${t.slug}" class="topic-link${i === 0 ? ' active' : ''}" data-topic="${t.slug}"${i === 0 ? ' aria-current="true"' : ''}><span class="topic-number">0${i + 1}</span><span>${esc(t.label)}<small>3 images · ${t.duration} sec preview</small></span><span class="topic-arrow" aria-hidden="true">↗</span></a>`).join('\n');
const articles = data.storyboards.map((t, i) => `
  <article class="concept" id="${t.slug}" aria-labelledby="${t.slug}-title">
    <div class="concept-head"><div><p class="eyebrow">0${i + 1} / THREE IMAGES, ONE EXPLANATION</p><h2 id="${t.slug}-title">${esc(t.title)}</h2></div><a class="image-link" href="${t.slug}-storyboard-v2.mp4" download>Download silent preview ↗</a></div>
    <div class="story-layout">
      <div class="visual-column">
        <figure class="artwork">
          <video controls muted playsinline preload="metadata" poster="${t.scenes[0].image}" aria-label="${esc(t.label)}: silent three-image storyboard" aria-describedby="${t.slug}-timing">
            <source src="${t.slug}-storyboard-v2.mp4" type="video/mp4">
            <track kind="captions" src="${t.slug}-storyboard-v2.vtt" srclang="en" label="Draft English script">
            Your browser cannot play this preview. Use the three image links and script below.
          </video>
          <figcaption>${esc(t.kind)} <span>· ChatGPT image model</span></figcaption>
        </figure>
        <p class="spoken-line" aria-label="Draft caption">${esc(t.scenes[0].captions[0])}</p>
        <p class="timing-note" id="${t.slug}-timing">Silent storyboard · captions show the draft script · timing is provisional</p>
        <div class="scene-rail" aria-label="${esc(t.label)} scenes">
        ${t.scenes.map((s, n) => `<button type="button" class="scene-pick${n === 0 ? ' active' : ''}" data-scene="${n}" data-start="${s.start}" data-end="${s.end}" aria-pressed="${n === 0}"><img src="${s.image}" width="1672" height="941" alt="${esc(s.alt)}"><span><b>0${n + 1}</b> ${esc(s.title)}</span></button>`).join('\n')}
        </div>
      </div>
      <section class="script" aria-labelledby="${t.slug}-script">
        <div class="script-head"><h3 id="${t.slug}-script">Simple narration</h3><span>Voice comes next</span></div>
        <ol>${t.scenes.map((s, n) => `<li><button type="button" class="beat${n === 0 ? ' active' : ''}" data-scene="${n}" data-start="${s.start}" aria-pressed="${n === 0}"><span class="beat-number">0${n + 1}</span><span><strong>${esc(s.title)}</strong><span>${esc(s.narration)}</span></span></button><a class="scene-image-link" href="${s.image}" target="_blank" rel="noopener">Open image ${n + 1} in full size ↗</a></li>`).join('\n')}</ol>
        <p class="scene-summary">${esc(t.summary)}</p>
        <a class="source" href="${esc(t.source)}" target="_blank" rel="noopener">Science reference: ${t.slug === 'headaches' ? 'NIH' : 'NASA'} ↗</a>
      </section>
    </div>
  </article>`).join('\n');

fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="color-scheme" content="light"><title>Tubelight · Three images per explanation</title><link rel="stylesheet" href="review.css"><script src="review.js" defer></script></head>
<body><header class="topbar"><a class="brand" href="../../../" aria-label="Tubelight home"><span class="brand-mark" aria-hidden="true">t</span> tubelight<span class="brand-dot">.</span></a><span class="review-status"><span aria-hidden="true"></span> Storyboard review · v2</span></header>
<main>
<div class="intro"><p class="eyebrow">NINE IMAGES. THREE LITTLE EXPLANATIONS.</p><h1>Less text.<br>More <em>“now I get it.”</em></h1><p class="lede">Three connected images for each question. Just the useful labels and markings in the artwork, with a simple explanation alongside it.</p></div>
<nav class="topics" aria-label="Choose an explanation">${topics}</nav>
<div class="view-toolbar" hidden><p>Choose a picture, or press play <span>· Silent preview, narration next</span></p><fieldset class="size-picker"><legend class="sr-only">Visual display size</legend><button type="button" class="active" data-size="full" aria-pressed="true">Full visual</button><button type="button" data-size="hero" aria-pressed="false">Hero size · 620 px</button></fieldset></div>
${articles}
<footer class="next"><span class="next-label">PICTURES FIRST, THEN VOICE</span><p>Three short scenes, spoken like a person explaining it beside you.<br><span>Next: warm female narration from Gemini on Vertex, timed to these images.</span></p></footer>
</main></body></html>\n`);
console.log('Review page and caption tracks rebuilt.');
