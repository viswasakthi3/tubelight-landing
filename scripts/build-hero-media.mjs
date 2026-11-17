// Assemble approved three-image art and Vertex narration into landing hero media.
// Run generation + local alignment first. This command makes no provider calls.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const art = path.join(root, 'public/previews/hero-2026-11-17');
const work = path.join(root, '.media-work/hero-v3');
const out = path.join(root, 'public/videos');
const data = JSON.parse(fs.readFileSync(path.join(art, 'storyboards-v2.json'), 'utf8'));
const run = (cmd, args) => execFileSync(cmd, args, { encoding:'utf8', maxBuffer:32 << 20 });
const ff = (args) => run('ffmpeg', ['-y', '-v', 'error', ...args]);
const r = (n) => Math.round(n * 1000) / 1000;
const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const stamp = (s) => { const ms=Math.round(s*1000); return `00:${String(Math.floor(ms/60000)).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`; };

// Pointer locations are fractions of the full 16:9 frame, tied to spoken phrases.
const focus = {
  rocket: [ [null,[.5,.25],[.5,.39]], [[.5,.30],[.5,.30],[.5,.66]], [[.28,.78],[.64,.40],[.64,.40],[.64,.40]] ],
  headaches: [ [[.56,.40],[.56,.40],[.28,.43]], [[.25,.36],[.33,.40],[.33,.40],[.70,.53]], [[.36,.70],[.73,.40],[.73,.40],[.12,.60],[.73,.40]] ],
  'black-hole': [ [[.50,.45],[.50,.23],[.80,.60],[.50,.45]], [[.55,.60],[.66,.42],[.61,.48]], [[.14,.49],[.45,.25],[.90,.48],[.40,.30],[.40,.69]] ],
};
const extraFocus = {
  rocket: [ [{word:'oxygen',point:[.50,.39]}], [{word:'out',point:[.50,.89]}], [] ],
  headaches: [ [{word:'nerves',point:[.30,.55]}], [], [] ],
  'black-hole': [ [], [], [] ],
};

for (const topic of data.storyboards) {
  const slug = topic.slug === 'black-hole' ? 'hero-black-holes' : `hero-${topic.slug}`;
  const alignment = JSON.parse(fs.readFileSync(path.join(work, `${topic.slug}-alignment.json`), 'utf8'));
  const request = JSON.parse(fs.readFileSync(path.join(work, `${topic.slug}-request.json`), 'utf8'));
  const audio = path.join(work, `${topic.slug}-master.wav`);
  if (createHash('sha256').update(fs.readFileSync(audio)).digest('hex') !== alignment.audioSha256) throw new Error(`${slug}: audio changed since alignment`);
  if (request.transcript !== topic.scenes.map(s=>s.narration).join('\n\n')) throw new Error(`${slug}: approved transcript changed since speech generation`);
  const words = alignment.words;
  const sheets = [], cues = [], beats = [];
  const imageDir = path.join(out, slug);
  fs.mkdirSync(imageDir, {recursive:true});
  let offset = 0;
  const sceneWords = topic.scenes.map((scene) => {
    const result = words.slice(offset, offset + scene.narration.split(/\s+/).length);
    offset += result.length;
    return result;
  });
  if (offset !== words.length) throw new Error(`${slug}: word count mismatch`);
  const starts = sceneWords.map((ws, i) => i === 0 ? 0 : Math.round(Math.max(sceneWords[i-1].at(-1).end, ws[0].start - .18) * 30) / 30);
  const total = Math.ceil(alignment.duration * 30) / 30;
  const durations = starts.map((start, i) => (starts[i+1] ?? total) - start);
  if (durations.some((d) => d <= 0)) throw new Error(`${slug}: invalid scene timing`);

  topic.scenes.forEach((scene, i) => {
    const source = path.join(art, scene.image);
    ff(['-i', source, '-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x071222','-c:v','libwebp','-quality','87',path.join(imageDir,`p${i}.webp`)]);
    ff(['-i', source, '-vf','scale=400:225:force_original_aspect_ratio=decrease,pad=400:225:(ow-iw)/2:(oh-ih)/2:color=0x071222','-c:v','libwebp','-quality','82',path.join(imageDir,`p${i}-s.webp`)]);
    sheets.push({index:i,title:scene.title,src:`/videos/${slug}/p${i}.webp`,thumb:`/videos/${slug}/p${i}-s.webp`,start:r(starts[i]),end:r(starts[i]+durations[i]),walk:true,pw:1});
    const ws = sceneWords[i];
    const localCues = [];
    let wi=0;
    scene.captions.forEach((text,j) => {
      const count = text.split(/\s+/).length;
      const first = ws[wi], last = ws[wi+count-1];
      const next = ws[wi+count];
      const cue = {start:r(Math.max(starts[i],first.start-.035)),end:r(Math.min(starts[i]+durations[i],next?.start ?? last.end+.15)),text};
      if (cue.end <= cue.start) throw new Error(`${slug}: invalid caption timing`);
      localCues.push({...cue,ptr:focus[topic.slug][i][j]});
      cues.push(cue);
      wi+=count;
    });
    const sceneBeats = localCues.map((cue,j) => ({start:j===0?starts[i]:cue.start,end:localCues[j+1]?.start ?? starts[i]+durations[i],sheet:i,ptr:cue.ptr ? {x:cue.ptr[0],y:cue.ptr[1]} : null}));
    for (const anchor of extraFocus[topic.slug][i]) {
      const word = ws.find((w) => clean(w.word) === anchor.word);
      if (!word) throw new Error(`Missing pointer anchor ${anchor.word}`);
      const at = Math.max(starts[i], word.start);
      const bi=sceneBeats.findIndex(b=>at>b.start && at<b.end);
      if (bi>=0) {
        const b=sceneBeats[bi],end=b.end;
        b.end=at;
        sceneBeats.splice(bi+1,0,{start:at,end,sheet:i,ptr:{x:anchor.point[0],y:anchor.point[1]}});
      }
    }
    beats.push(...sceneBeats.map(b=>({...b,start:r(b.start),end:r(b.end)})));
  });
  const args=[];
  topic.scenes.forEach((scene,i)=>args.push('-loop','1','-framerate','30','-t',durations[i].toFixed(6),'-i',path.join(art,scene.image)));
  args.push('-i',audio);
  const filters=topic.scenes.map((_,i)=>`[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x071222,setsar=1,setpts=PTS-STARTPTS[v${i}]`);
  filters.push('[v0][v1][v2]concat=n=3:v=1:a=0[v]');
  args.push('-filter_complex',filters.join(';'),'-map','[v]','-map','3:a','-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ar','48000','-ac','1','-c:v','libx264','-preset','medium','-tune','stillimage','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart','-shortest',path.join(out,`${slug}.mp4`));
  ff(args);
  ff(['-i',audio,'-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ar','24000','-ac','1','-c:a','libmp3lame','-b:a','128k',path.join(out,`${slug}-voice.mp3`)]);
  ff(['-i',path.join(art,topic.scenes[0].image),'-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x071222','-q:v','3',path.join(out,`${slug}-poster.jpg`)]);
  ff(['-i',path.join(imageDir,'p0.webp'),'-vf','scale=640:360','-c:v','libwebp','-quality','82',path.join(out,`${slug}-thumb.webp`)]);
  const duration=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',path.join(out,`${slug}.mp4`)]).trim());
  sheets.at(-1).end=r(duration);
  beats.at(-1).end=r(duration);
  const json={slug,title:topic.title,duration:r(duration),curated:true,typed:topic.title,cues,sheets,beats,
    provenance:{images:'ChatGPT image_gen',speechProvider:request.provider,model:request.model,voice:request.voice,style:request.style,transcript:request.transcript,alignment:'Local Whisper word timestamps matched to approved script',wordCoverage:alignment.coverage},
  };
  fs.writeFileSync(path.join(out,`${slug}.json`),JSON.stringify(json,null,2)+'\n');
  fs.writeFileSync(path.join(out,`${slug}.vtt`),'WEBVTT\n\n'+cues.map((c,i)=>`${i+1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n'));
  console.log(`${slug}: ${r(duration)}s, 3 pictures, ${beats.length} audio-timed pointer beats, ${cues.length} captions`);
}
