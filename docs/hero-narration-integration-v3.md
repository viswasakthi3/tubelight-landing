# Main hero: narrated three-picture examples

Completed 17 November 2026 after pushing the v2 storyboard state (`ef30c55`).

## Result

The main landing hero now features Rockets, Headaches and Black holes. Each has the three approved minimal-text ChatGPT illustrations, one continuous female narration, captions and a ring indicator timed to the spoken explanation. Both the topic-search demo and selected-text demo use these new media files, and the expanded player preserves the same timing and sound.

| Hero asset | Duration | Pictures | Timed pointer beats |
| --- | ---: | ---: | ---: |
| `hero-rocket` | 21.967 s | 3 | 12 |
| `hero-headaches` | 24.333 s | 3 | 13 |
| `hero-black-holes` | 27.467 s | 3 | 12 |

Files are under `public/videos/`: MP4 with AAC narration, standalone `-voice.mp3`, JSON timing/provenance, VTT, poster, thumbnail and a directory of full/small WebP slides for each asset.

The pre-existing library videos remain available independently. New assets are labelled as curated examples, so the expanded player does not describe art-directed landing material as unedited Windows-app output.

## Voice and synchronization

- Provider: Google Vertex AI, model `gemini-3.8-flash-tts`, female prebuilt voice `Aoede`.
- Each topic was spoken in one continuous request to keep the delivery connected across pictures. All three use the same warm, conversational style prompt; exact style and transcript are recorded in each public asset JSON.
- Speech generation used the existing sibling project's `scratch/filesgo_audio/vertex_audio.py` credential flow. No credentials, access tokens or Google project IDs were copied into this repository or browser code.
- Local cached Whisper transcription supplied actual spoken-word times. Rocket and black-hole tokens matched completely. The headache alignment matched 98.7%; the compound `pain-sensitive` was a tokenizer mismatch, while the transcribed sentence retained the phrase. Its word interval was interpolated between surrounding matching words.
- Image changes come from measured paragraph boundaries. Caption and ring beats use measured phrase/word times, including moving from fuel to oxygen and from the chamber through the nozzle. These replace the earlier provisional 30–31 second silent timings.
- Encoded narration is normalized with an integrated loudness target of -16 LUFS and a true-peak target of -1.5 dBTP. The rocket export's measured maximum sample level was -1.2 dBFS after AAC encoding.
- Autoplay starts muted to comply with browser policy. The visible sound control enables narration; user-initiated topic/shortcut playback requests sound. The active slide also shows the existing playback indicator. Pausing stops the ring animation, and other players pause when a new one opens.

## Rebuilding

1. `python scripts/generate-hero-audio.py` generates the approved transcripts through Vertex, reusing exact matching recordings. Raw WAV and request records stay in ignored `.media-work/hero-v3/`.
2. `python scripts/align-hero-audio.py` transcribes locally using the already installed cached English model. Audio hashes prevent reusing a different recording's alignment.
3. `node scripts/build-hero-media.mjs` creates the production assets and timing. It checks the approved transcript and audio hash against generation/alignment records before assembling.

No TTS request is made by the build command or by normal landing-page playback. A fresh generation requires the local main-project credentials and existing Python dependencies.

## Verification

- The generated media validator passed all three assets: three existing pictures each, continuous picture boundaries, valid caption intervals, pointer beats confined to the correct picture and coordinates inside the frame.
- FFprobe confirmed H.264 1280×720 video and AAC audio in the integrated media; standalone MP3s are also present.
- Browser checks at 1440 px desktop and 375 px phone verified all three hero sources, three slides, sound on/off, playing state, ring visibility, picture seeking, selection-mode playback, and the curated label in the expanded player. Phone had no horizontal page overflow.
- A first build overlapped dev-server startup and failed when the dev server regenerated its `.next-dev/types` directory. After startup completed, the production build passed compilation, type checks and all 13 static pages. `tsc --noEmit` and `git diff --check` also passed.
- Preview used `scripts/dev-safe.mjs` with the database disabled. No signups were submitted and no production deployment was performed.

The old v2 silent storyboard page is retained as design history. Review the integrated result at the landing page's `#demo` section.
