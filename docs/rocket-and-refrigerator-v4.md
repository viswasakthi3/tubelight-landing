# Original rocket pair and refrigerator gallery example

Completed 17 November 2026. The previous state was pushed before this revision.

## Hero rocket

`hero-rocket` now uses the two original source images from `public/videos/rocket/p0.webp` and `p1.webp`: pumping/combustion, followed by the nozzle. No new rocket artwork was generated and those source files were not edited.

A fresh continuous female narration was generated through Gemini on Vertex (`gemini-3.8-flash-tts`, `Aoede`), using a simple script specifically written for these two pictures. It lasts 25.167 seconds. Local speech transcription matched all script words. Captions, the two-picture rail and 13 pointer beats follow the measured speech timing.

The hero helper line now displays the current example's actual picture count. Headaches and Black holes remain the existing three-picture examples. Their 24 media files were checked against SHA-256 hashes recorded before this work and are unchanged.

## First gallery example

The first card under “Curious about anything?” is now **How a Refrigerator Keeps Food Cold**, replacing the duplicate rocket card. The five other cards retain their topics and order.

Three connected images explain the mechanism:

1. **Absorb heat inside:** the supplied image, copied unchanged from Downloads.
2. **Release heat to the room:** a matching rear cutaway of the compressor and condenser.
3. **Drop the pressure and return:** a matching valve close-up connected to the internal cold coil.

The two new images were made with ChatGPT's built-in image_gen tool. A corrective edit clarified the suction direction in image 2 and made image 3 a focused valve view rather than an ambiguous whole-system plumbing drawing. Only the selected final pictures are in the public asset folder; drafts stay in ignored local working files.

Original PNGs: [image 1](../public/previews/refrigerator-v4/01-absorbing-heat.png), [image 2](../public/previews/refrigerator-v4/02-releasing-heat.png), [image 3](../public/previews/refrigerator-v4/03-expansion-return.png).

Exact prompts: [initial pair](refrigerator-image-prompts-v4.json), [final corrective edits](refrigerator-image-corrections-v4.json). The refrigerator reference's hash matches the supplied PNG.

The completed video lasts 35.167 seconds, with the same female Vertex voice, three pictures, 16 caption phrases and 16 synchronized pointer beats. Its script also matched all words in the local transcription. The gallery wording and existing curated label correctly describe this newly assembled example alongside saved Windows-app videos.

## Reproduction and output

The approved scripts, artwork inputs and pointer locations are in [landing-media-v4.json](landing-media-v4.json). Run only this configuration to avoid regenerating the other topics:

```powershell
python scripts/generate-hero-audio.py --config docs/landing-media-v4.json --work-dir .media-work/landing-v4
python scripts/align-hero-audio.py --config docs/landing-media-v4.json --work-dir .media-work/landing-v4
node scripts/build-hero-media.mjs --config docs/landing-media-v4.json --work-dir .media-work/landing-v4
```

The existing scripts now accept a selected configuration and work directory, and assembly supports either two or three pictures. Defaults still target the earlier v3 set. Raw speech, local alignment and discarded drafts remain in ignored `.media-work/landing-v4`.

Production assets are `public/videos/hero-rocket.*` and `public/videos/refrigerator.*`, with poster, thumbnail, standalone MP3 and per-picture WebP files. The original saved `rocket` explanation remains available as a separate asset.

## Verification

- Media checks passed: expected picture counts (2 and 3), existing images/thumbnails, continuous picture and pointer timelines, non-overlapping caption intervals, coordinates within the frame, and 100% script token matching for both fresh narrations.
- FFprobe confirmed both exports contain 1280×720 H.264 video and AAC audio at the measured durations above.
- Browser verified the old rocket illustrations, two-picture rail, sound enabled and seeking to the nozzle image. The first gallery card opens the refrigerator player with three slides, sound enabled and the correct title.
- Desktop and 375 px phone inspection verified the new refrigerator pictures, seeking to pictures 2 and 3, visible pointer and narration captions, and no horizontal page overflow on phone.
- Production build passed compilation, type checks and all 13 static pages. `tsc --noEmit` and `git diff --check` passed.
- Preview used the existing database-disabled local server. No signups or production deployment were performed.

Mechanism references: [GE refrigerator sealed-system operation](https://products.geappliances.com/appliance/gea-support-search-content?contentId=16911), [US Department of Energy refrigerator technical description](https://www1.eere.energy.gov/buildings/appliance_standards/pdfs/refrig_finalrule_tsd.pdf), [NASA rocket nozzle design](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/nozzle-design/).
