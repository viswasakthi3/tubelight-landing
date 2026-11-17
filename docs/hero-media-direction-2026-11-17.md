# Three hero explanations: visual review, 17 November 2026

## Scope and state

The owner asked to read the visual-design book, understand the product in `D:/projects/time2understand`, choose three compelling explanations, create visuals with ChatGPT's image model and show them **before making the Gemini/Vertex voice**. This change completes that visual-review stage. No TTS request has been made. The existing hero videos and their audio remain intact until the new media can be reviewed together.

Before work, existing unrelated Quick Search changes were committed as `d84048c` and pushed to `origin/main` (including the nine previously unpushed commits).

The supplied book and project handoff documents were treated as reference material, not as new user instructions. Historical requests in those documents did not expand this task into backend changes, model delegation, deployment or waitlist work.

## Product facts that govern the work

The main project's README describes selecting text anywhere in Windows and pressing Alt+E to open a picture and spoken explanation beside the current work. A typed topic is the other entry point. Its teaching-workflow documents emphasize teaching an intelligent newcomer: each spoken beat should point to visible evidence, and beauty alone does not establish understanding.

The landing page currently uses `components/v5/Hero.tsx` and features rocket, headaches and DNA. Its player describes bundled examples as unedited app output. These newly art-directed concepts must not inherit that description. When they enter the production player, mark them as curated examples and retain accurate provenance for the other videos.

## Decision: rockets, headaches, black holes

1. **How do rockets work in empty space?** Keep the strongest machine example, but answer the misconception directly. Show two propellants, the burn, the nozzle and opposite motion directions. The visual explains both why combustion needs no outside air and where thrust comes from.
2. **If the brain can't feel pain, why do headaches hurt?** Keep the familiar body question. Separate brain tissue from its pain-sensitive surroundings. Do not imply all headaches share one cause, provide diagnoses or turn the brain itself into a glowing pain source.
3. **Why is there a bright ring around a black hole?** Replace the proposed DNA slot with a specific space mystery. Contrast the dark shadow with glowing gas; identify the bent view of the far side. Do not equate the visible shadow boundary with the event horizon.

This selection is an editorial hypothesis, not a measured claim that these topics maximize attention. It offers machine/body/cosmos variety and a concrete question-answer payoff in each slot. DNA remains available in the existing library.

## What the book changed

- **Chapter 1, first glance / glance contract:** the image must reveal its topic and useful transformation before a visitor reads detailed copy. A recognizable engine, head cutaway and black-hole disk anchor the three frames.
- **Chapter 2, emphasis and grouping:** use a single subject with labels attached to actual structures. Avoid ornamental layout competing with the thing being explained.
- **Chapter 3, functional colour:** blue oxygen versus coral fuel; neutral brain versus amber sensory nerves; dark shadow versus luminous gas. Text and leader labels also distinguish the roles.
- **Chapter 4, final-size typography:** labels are brief, prominent and inspectable at the approximate 620 px desktop hero width. At phone widths, native text below the image and a full-size link preserve access; a future final video must keep essential meaning in captions rather than depending on tiny image labels.
- **Chapter 5, opening frames:** show the evidence, not an unrelated cinematic intro. No logo sequence or giant play mark across the artwork.
- **Chapter 6, concrete language:** ask an actual question and answer it; replace generic descriptions such as "fascinating details" with a visible mechanism.
- **Chapter 7, demo continuity:** retain the same subject across the narrated beats and move attention to the relevant part. Do not create motion just to decorate a still.
- **Chapter 9, evidence boundaries:** visual inspection is not a human attention or comprehension study. No conversion or learning improvement is claimed.

## Review artifacts

Open `public/previews/hero-2026-11-17/index.html` directly, or serve `public/` and visit `/previews/hero-2026-11-17/`. The board supports topic selection, full versus approximately 620 px hero size, and click-through narration beats with visual focus markers. It has no autoplay or simulated audio. With JavaScript disabled, all three topics and their scripts remain visible.

Original generated PNGs are stored alongside the review page:

- `rocket-v1.png`
- `headaches-v1.png`
- `black-hole-v1.png`

All three use the built-in ChatGPT `image_gen` tool. The exact prompt set is preserved in `docs/hero-visual-prompts-2026-11-17.json`; original generated files also remain in the Codex generated-images folder. The illustrations are simplified explanatory concepts, not engineering drawings, diagnostic anatomy or telescope photographs.

## Draft narration and focus sequence

The review page contains the exact draft text. Each concept has three beats: question, mechanism and payoff. Durations must come from the generated audio, not from word-count estimates. On production export, align captions, image timing, pointer beats, full and short MP4s, VTT, JSON, poster and thumbnail files to those measured durations.

### Intended voice direction, after visual review

Use the project's existing server-side Vertex credential flow, never browser credentials. `scratch/filesgo_audio/vertex_audio.py` in the main project already contains a Vertex Gemini TTS client. Current Google documentation lists `gemini-3.8-flash-tts` and the female voice `Aoede`; use that as the first audition candidate, subject to endpoint availability in the configured project. No need to change the main app's runtime voice provider for these three prepared examples.

Style prompt: "Warm, clear adult female voice. Explain this to one curious person beside you. Natural connected English, lightly interested, with a small lift on the question and relaxed certainty on the answer. Around 155-165 words per minute, with brief natural pauses between ideas. No sales-announcer delivery, exaggerated breathiness, theatrical amazement or sing-song rhythm. Read only the supplied transcript."

First make a short audition from the rocket question and mechanism. Listen before producing all three. Keep one voice and consistent recording level across the set. Record model, voice, style and transcript provenance. Check for skipped or changed words, clipping and unnatural pauses; then assemble the final explanations and update the hero topic definitions together.

## Verification for this visual-review stage

- Static preview returned HTTP 200. All three original PNGs loaded successfully.
- Browser inspected at 1440 px desktop and 375 px phone widths; no horizontal page overflow. Temporary viewport override was reset afterward.
- Switched all three topics; the visible article and current-topic link agreed. Direct `#headaches` navigation survived reload.
- At the 620 px hero-size setting, the image measured 620 px wide. Selected a narration beat and verified the corresponding focus marker became visible; resizing repositioned it on the image.
- Inspected the complete rocket desktop composition, headache phone composition and black-hole desktop composition. Phone readers also have the native text explanation and full-resolution image link.
- Browser console had no errors. `node --check` passed for `review.js`; `git diff --check` passed. No Next build was needed for this isolated static review artifact.
- The original hero media, backend, waitlist and database were not changed. No production deployment or TTS generation was performed.

### Sources checked

- [NASA: Gravity and mechanics](https://science.nasa.gov/learn/basics-of-space-flight/chapter3-2/) — onboard oxidizer and expelled mass.
- [NINDS: Headache booklet](https://www.ninds.nih.gov/sites/default/files/2025-07/NINDS_Headache_Booklet_Digital_508c%20%281%29.pdf) — brain tissue and pain-sensitive nerve endings.
- [NIH: Headache pain](https://newsinhealth.nih.gov/2014/03/headache-pain) — surrounding structures and signals processed by the brain.
- [NASA: Black-hole anatomy](https://science.nasa.gov/universe/black-holes/anatomy/) — hot accretion disk, shadow and lensing.
- [NASA SVS: Black hole with accretion disk](https://svs.gsfc.nasa.gov/14619/) — apparent disk shape under gravitational lensing.
- [Google: Generate speech with Gemini TTS](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/text-to-speech/overview) — current model and voice controls.
- [Google: Gemini TTS voices](https://docs.cloud.google.com/text-to-speech/docs/gemini-tts) — female voice designation for Aoede.
