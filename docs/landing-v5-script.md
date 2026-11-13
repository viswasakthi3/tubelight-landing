# Tubelight landing page — v5 script

Built from v4 (waitlist) plus the *Landing Page Design Intelligence* book (12 Nov 2026).
Only v4 was used as the design base. The copy is written before the UI, as the book (C5) says.

## 1. Product truth (what the page is allowed to claim)

| Fact | Status | Where it shows |
|---|---|---|
| Windows 10/11 desktop app | verified | hero conditions, FAQ |
| Select text in any app → Alt + E → short narrated explainer (pictures, voice, captions) beside the page | verified | hero, how it works |
| Fast ≈ 10–15 s, Balanced < 20 s, Rich < 30 s to make one | measured in Sept 2026 runs | "Quick or deep" tile only, worded "about" |
| Type a topic instead of selecting | verified | feature tile |
| Follow-up chat ("explain it simpler") | verified | feature tile |
| Tab + R reads selected text aloud | verified | feature tile |
| Every explanation is saved on your PC and never deleted | verified (saved library) | feature tile, FAQ |
| Free to try, paid plans for heavy use | verified | FAQ, conditions line |
| Mac version | **not shipped** | FAQ says "on the way", nowhere else |
| Waitlist count | **real number from the database only** | hero, CTA, dialog |
| "Answer questions to get invited sooner" | **true only once the backend ranks by it** (built in v5) | dialog |
| Accuracy | AI, can slip | FAQ (I38) |

Claims we do **not** make: an invented user count, a fake queue position, "instant", "100% accurate", "private by design".

## 2. The visitor

- **Situation:** reading something hard on a PC (a textbook PDF, a paper, a news article) and hitting a word or paragraph that doesn't make sense.
- **What they do now:** open a new tab, Google it or ask ChatGPT, read a wall of text, lose their place.
- **What they want:** to get it and keep reading.
- **Why they might not act:** "Is this real or a concept?", "Is it another chatbot?", "Will the answer be good?", "When do I actually get it?"

Core promise (C4): *Tubelight turns any text you select on your PC into a short picture-and-voice explanation, right beside what you're reading.*

Message ladder: understand anything in seconds → select + Alt + E → a real explanation playing (proof) → it's AI and can slip; you can ask follow-ups → join the waitlist; invites go out weekly in order.

## 3. Section scripts

### S1 Hero — "What is this, and is it for me?"
- **Takeaway:** select text, press Alt + E, get a short narrated video about it.
- **Removed from v4:** the "Tubelight for Windows" eyebrow and the small logo (the header already shows both). The left column is aligned to the player: vertically centred and pulled tight to it.
- **H1:** Understand anything in seconds.
- **Body:** Select any text on your Windows PC and press Alt + E. Tubelight explains it with pictures and a voice, right beside what you're reading.
- **Form:** Email address · **Join the waitlist**
- **Conditions under the form (I13, I20):** Free to try · Windows 10 & 11 · Invites go out every week, in order.
- **Proof line (I17, I19):** live dot + "**{real count} people** are waiting · {joined this week} joined this week". If the count is too small to say, fall back to "New invites every week — earlier sign-ups get in first."
- **Visual (I07, I09, I28):** the v4 desk, **wider** (the player takes ~62% of the hero instead of ~56%). Left window: the source document with the sentence highlighted. Pressing the Alt + E key cap (or the real shortcut) opens the Tubelight panel, which plays a **real saved Tubelight video with its own voice**. Captions on. Mute, replay, and a "Try another" row that swaps to other real videos.
- **States:** idle (poster + glowing key) · playing · ended (replay) · video failed (poster + caption text stays readable) · reduced motion (no auto split, poster shown).
- **No autoplay with sound.** The video starts muted on scroll-in only after the visitor presses the key; the visitor's press is what turns sound on (I30).

### S2 How it works — "What exactly do I do?"
- **H2:** Three steps. No new tab.
- **Steps:** 1 Select any text — in a PDF, a website, Word or Notion. · 2 Press Alt + E — one shortcut, nothing to type. · 3 Watch and listen — pictures and a voice explain it beside your page.
- The v4 "[Your product video]" placeholder is **removed** unless a real screen recording exists (removal test, D11). The hero already shows the operation.

### S3 Why not just Google it? — the main objection
- **H2:** Why not just Google it?
- **Lede:** Or ask ChatGPT? Both pull you away from what you're reading. Tubelight explains it right where you are.
- Comparison table kept from v4 (where you go / what you do / what you get / how long). "How long" row reads "Seconds — usually under 20" instead of a bare "Seconds".

### S4 Curious about anything? — "Will it work for *my* topics?" (proof)
- **H2:** Curious about anything?
- **Lede:** These are real explanations Tubelight made. Press play on any of them.
- **Visual:** six cards, each a real saved video: poster, topic tag, title, length. A **small, quiet play button** (white disc, 44 px, low shadow) sits in the corner of each poster and grows slightly on hover. Click → the video plays in a lightbox with sound, captions, and close/Esc.
- Caption under the grid: "Unedited output from the Windows app."

### S5 Everything it can do — features for people who are now interested
- Same bento as v4, with two changes: "Everything saved" shows real saved-item posters that **play when clicked**, and "Quick or deep" uses "about 15 s / 20 s / 30 s".

### S6 Who it's for
- Kept from v4: Students · Engineers & researchers · Curious minds, plus "Works in Chrome, Edge, PDF readers, Word, Notion…".

### S7 FAQ — remaining doubts
- What is Tubelight? · **When will I get access?** (weekly invites, in order; people who tell us how they'll use it are invited first) · **What happens after I join?** (an email when your invite is ready, nothing else) · Why not ChatGPT? · Does it cost anything? · Is it accurate? (AI can slip, ask a follow-up or check your textbook) · Which computers? (Windows 10/11; Mac on the way) · Is what I select private? (your selection is sent to make the explanation; your saved explanations stay on your PC).

### S8 Final CTA
- **H2:** Get early access.
- **Lede:** Invites go out every week, in order. Tell us how you'll use Tubelight and you'll be invited sooner.
- Form + real count line.

### Waitlist dialog — "get ahead" (I22, I27)
1. **Email step** (if opened from the nav).
2. **You're on the waitlist** — real place in line (from the server), and "Want an earlier invite? Tell us how you'll use Tubelight. Each answer moves you up."
3. Questions (each saved to the server and each one really raises priority):
   - Which best describes you? (Student · Working professional · Teacher · Researcher · Just curious)
   - What would you use it for? (pick any) (School & board exams · JEE or NEET · College subjects · Research papers · Coding · Work documents · News & everyday reading)
   - Where do you read most? (pick any) (PDFs · Websites · Word / Google Docs · Notion · Slack / Teams · Somewhere else)
   - How often do you get stuck on something you're reading? (Every day · A few times a week · Now and then)
   - Optional: "What's one thing you wish someone would explain to you?" (free text, 200 chars)
4. **Done** — "You moved up {n} spots. You're now #{pos}." · "We'll email {email} as soon as your invite is ready." · While you wait: Quick Search AI.

## 4. What gets measured (F5)
`hero_video_play`, `gallery_video_play` (with video id), `waitlist_submit`, `waitlist_answer` (question id), `waitlist_done`. A play is not counted as understanding.

## 5. Revision v5.1 (13 Nov 2026) — after the book review

Why: see `docs/landing-v5-review.md`. These strings replace the earlier ones everywhere they appear (design artboard and code).

| # | Where | Old | New |
|---|---|---|---|
| 1 | Hero conditions, 3rd item | Invites every week, in order | Invites in line order |
| 2 | Hero proof line | four avatar faces + text | live green dot + text (no faces) |
| 3 | Proof fallback (count below threshold) | New invites every week — earlier sign-ups get in first | Invites go out in batches — earlier sign-ups get in first |
| 4 | Hero demo link | Watch the 80-second demo | Watch the demo (1:21) |
| 5 | Note under hero demo | Real explanations made by Tubelight, with its own voice. The page on the left is a sample. | Real Tubelight explanations of these topics, in its own voice. Making one takes about 10–30 seconds; here it plays straight away. The page is a sample. |
| 6 | Hero key button on touch screens | Explain the highlighted text | Tap to explain the highlighted text |
| 7 | Demo section lede | Three steps, no new tab. Here’s the whole thing, start to finish. | Three steps, no new tab. Here’s Tubelight on a real Windows PC. |
| 8 | Step 1 body | In a PDF, a website, Word, Notion — any app on your PC. | In a PDF, a website, Word or Notion — wherever you can select text. |
| 9 | Comparison, “How long” (Tubelight) | Seconds — usually under 20 | About 10–30 seconds to make |
| 10 | Note under the gallery | Unedited output from the Windows app. | Unedited output from the Windows app. It’s AI, so it can slip now and then — if something looks off, ask a follow-up. |
| 11 | Feature tile “Explain anything you select” | Select text in any app and press Alt + E. Pictures and a voice explain it in seconds. | Select text and press Alt + E. A short explanation with pictures and a voice opens beside your page. |
| 12 | Feature tile “Everything saved” | Every explanation stays on your PC, forever. Click one above to replay it. | Every explanation is saved on your PC until you delete it. Click one above to replay it. |
| 13 | “Who” footnote | Works in Chrome, Edge, PDF readers, Word, Notion, Slack, VS Code — any app on your Windows PC. | Works wherever you can select text — Chrome, Edge, PDF readers, Word, Notion, Slack, VS Code — on Windows 10 and 11. |
| 14 | FAQ “When will I get access?” | We send invites every week, in waitlist order. People who tell us how they’ll use Tubelight are invited first — it helps us let in the people it’ll help most. | We invite people in batches, in waitlist order. People who tell us how they’ll use Tubelight move up the line, so they’re invited sooner. |
| 15 | FAQ “What happens to the text I select?” | It’s sent to our servers only to make your explanation. The explanations you make are saved on your own PC. | It’s sent to our servers to make your explanation. We keep a record of the explanations we make so we can fix problems and improve them. Your saved explanations also live on your own PC. |
| 16 | Final CTA lede | Invites go out every week, in order. Tell us how you’ll use Tubelight and you’ll be invited sooner. | We invite people in batches, in line order. Tell us how you’ll use Tubelight and you’ll move up the line. |
| 17 | Under the final CTA form and the dialog email form (new) | — | We’ll email you when your invite is ready. Nothing else. |
| 18 | Dialog email step lede | Invites go out every week, in order. It takes ten seconds. | We invite people in batches, in line order. It takes ten seconds. |
| 19 | Dialog questions intro | Tell us how you’ll use Tubelight. Every answer moves you up the line — we invite the people it’ll help most first. | Tell us how you’ll use Tubelight. Every answer moves you up the line, so you’re invited sooner. |

## 6. Revision v5.2 (13 Nov 2026) — "you don't have to select anything", topic search, mobile

**Problem (owner):** the page only shows Alt + E, so people think they must select text. In fact they can also type a topic or paste text.
**Visitor question:** "What if the thing I want to understand isn't on my screen?"
**Takeaway:** You can select text, type a topic, or paste a paragraph. All three give the same picture-and-voice explanation.
**Evidence:** every gallery video was made from a casually typed topic (real inputs from the saved library: "how rocket engine works", "why headaches happen", "Ocean currents", "life cycle of a polar bear", "how lic policy works", "how does modern tv work so good and high in quality"). So showing the typed input is real proof (I07, I09, I04).
**Rejected:** a fake "generating your video…" screen that asks for an email. Nothing would be generated; the book forbids invented work and fake progress (I37, I27). It stays a follow-up only if a real web-generation endpoint is built.

### Hero
- **Body (new):** Select any text and press Alt + E, or just type a topic. Tubelight explains it with pictures and a voice.
- **Mode switch above the demo** (two segments, keyboard-operable, `aria-pressed`): **Select text** · **Type or paste**.
  - *Select text:* as before (sample page, highlighted sentence, Alt + E).
  - *Type or paste:* the left window becomes Tubelight's box: label "What do you want to understand?", the real typed topic types itself in, an **Explain** button, and a hint "You can paste a whole paragraph too." The key button shows **Enter** with "Explain my topic". The video is the same real output, made from exactly that typed topic.
- Reduced motion: the topic appears at once, no typing animation.

### Curious about anything? (gallery) — search first
- **Search box above the grid.** Visible label: "What do you want to understand?" Placeholder cycles through example topics (static if reduced motion). Button: **Explain it**.
- Typing filters the real examples by title and typed topic: "2 explanations match".
- **Submit with a match:** the best match plays in the lightbox.
- **Submit with no match (honest):** a status card: “Tubelight hasn’t explained “{topic}” on this page yet. In the app it makes one in about 10–30 seconds. Join the waitlist and it can be the first thing you try.” + email form. The topic is saved with the signup (it pre-fills question 5) so we learn what people want.
- **Each card shows its real input:** `You typed: “how lic policy works”`.

### Feature tile
- "Just type a topic" becomes **"Type it or paste it"**: "Nothing to select? Type a topic or paste a paragraph and get the same kind of explanation."

### Mobile (I32, D2, D7)
- Same order of meaning: purpose → how (with the mode switch) → the action → the demo → proof.
- **Desktop-only continuation (D7),** shown only on phones under the hero form: "Tubelight runs on Windows PCs. Join from your phone and your invite comes by email, so you can open it on your PC."
- **Demo recomposed, not shrunk:** the sample page keeps only its title and highlighted sentence; the Tubelight panel is full width; captions stay under the video; the key button says "Tap to explain" (select mode) or "Tap Explain" (type mode).
- **Gallery:** search box and button stack full width; cards in two compact columns (poster, length, title; the "You typed" line stays because it carries the meaning).
- **Lightbox:** full width, captions under the video, close button reachable at the top.
- Targets ≥ 44 px; no horizontal scroll at 360–430 px; the sticky top bar keeps "Join the waitlist" reachable (no extra sticky bottom bar covering content, D3).

## 7. Revision v5.3 (13 Nov 2026) — real player, live preview, app search

Owner asks: maximise button; hero shows all pictures; search icon; a better play button; type mode presses Enter itself; app-style player with the pictures in a rail on the right; the app's search; typing a new topic really makes a video, asks for the email to watch it, then offers "get ahead"; new videos (medical and other wow topics) for the features section; gallery topics and hero topics stay.

### Book check of the new flow
| Decision | Book card | How we keep it honest |
|---|---|---|
| A visitor can make a real video on the page | I21 (a genuinely useful lower-commitment route), I28 (interaction when "will it work on *my* topic?" is the question) | It is a real Fast run on our backend, not a mock. |
| Email needed to watch it | I25, I20 (state the commitment before the click) | Said **before** they press: "Free preview · about 20 seconds · you’ll need your email to watch it." The form says it also joins the waitlist. |
| Progress while it is made | I37 (no invented work) | Stages come from the real stream: writing the story → drawing picture k of N → recording the voice → ready. No fake percentage. |
| Limits | I24, I13 | "1 free preview a day." Clear states for limit reached, busy, error with retry. |
| Topic leaves the device | I18 | "Your topic is sent to our servers to make the video." |
| AI can be wrong | I38 | Under every preview: "Made just now by AI. If something looks off, ask a follow-up in the app." |
| Get ahead | I27 | Offered after they have watched, never before the video. |
| Speed of the page | I36 | Player and preview code load only when opened. |

### Hero
- Videos play in full (all pictures show), not the 3-beat cut.
- **Maximise** button in the Tubelight panel bar opens the same video in the big player at the same moment.
- "Type or paste": the topic types itself, then the Enter key presses itself (a short visible press) and the video plays. The visitor clicked the switch, so sound is on.
- Second link under the form: **Try your own topic** (jumps to the search and focuses it), beside "Watch the demo (1:21)".

### The player (gallery, features, saved tile, hero maximise, live preview)
- Mirrors the desktop app: head line = big title + run time + "Made by Tubelight"; stage = the picture/video with two-line captions on it (white on 75 % black); **slide rail on the right** (≥ 1100 px; a horizontal strip below on smaller screens): numbered thumbnails, the current one ringed in brand purple with a small speaking wave, click = jump to that picture.
- Transport under the stage: play/pause · slide k / N with prev/next · time · sound · CC · **maximise** (full screen), last on the right — same order as the app.
- Keys: Space play/pause, ←/→ slide, C captions, F full screen, Esc close.

### Gallery cards
- Same six topics. New play mark: a 56 px frosted white circle with a purple triangle, centred, grows slightly on hover; the length moves to a small dark chip in the top-right corner.

### Search (same behaviour as the app’s home box)
- Box: search icon · placeholder "Search a topic or paste text… e.g. how memory works" · button with a search icon **Explain it**.
- As you type, a suggestion list (like the app): first any of our ready-made videos that match ("Watch · 0:58"), then Wikipedia title suggestions with their one-line description, then the last row **Make a video about “{typed}”** with the hint "Free preview · about 20 s · email needed to watch". ↑/↓ move, Tab fills, Enter picks, Esc closes. Footer: "Suggestions from Wikipedia. Your video is made fresh for your topic."
- The cards below no longer filter (the six examples stay as they are).

### Live preview flow
1. Pick a suggestion or press Explain it with no ready-made match → the player opens in **making** mode: title "Making your video…", the rail shows dashed placeholders that fill as pictures arrive, stage shows the real stage text.
2. Over the stage, the email card: "Your video is being made. Enter your email to watch it." + field + **Watch my video** + "This also puts you on the Tubelight waitlist. We’ll only email you about your invite."
3. Email in + video ready → it plays. Email in first → "Almost ready…" with the real stage.
4. When it ends: "Want an earlier invite? Tell us how you’ll use Tubelight." → the questions dialog (topic pre-filled in question 5).
5. States: limit reached ("You’ve used today’s free preview — your topic is saved with your spot"), busy ("Our picture makers are busy — try again in a minute"), error (retry), and stream cut (keeps what arrived, offers retry).

### Features section
- New pictures from other real videos (medical first): kidneys (Explain anything), zombie cells (See it. Hear it.), and the saved tile shows neurons, appendix, supernova, dark matter. Each one plays in the player when clicked.

### FAQ (new)
- **Can I try it before I’m invited?** Yes. Type a topic in the search box and Tubelight makes a free preview video right on this page — one a day. You’ll need your email to watch it, which also puts you on the waitlist.

## 8. Revision v5.4 (14 Nov 2026) — seekable timelines, pointer, search-first hero, better questions

Owner's list (see `docs/HANDOFF-v5.4.md`), refined. Done one by one, design first on the canvas (artboards **V54** desktop + **V54m** 390 px phone; V53 and older kept), then ported to the code, each checked in the browser at 1440 and 375 px.

### 8.1 Every timeline is seekable, with play/pause beside it (I24, I23, I35, I29)
- **Problem:** the hero's progress bar ignores clicks; a green dot (the voice "wave") sits where people expect a play button.
- **Hero panel and hero search player:** the transport row becomes **[play/pause button] [timeline] [0:12 / 1:10]**. The button is a 36 px round button (purple on white, `aria-label` Play/Pause) and replaces the green wave. The play/pause icon in the panel's title bar goes (one control, one place); Replay, Maximise and Sound stay.
- **Timeline behaviour (hero and big player, one shared implementation):** `role="slider"`, `aria-label="Seek"`, `aria-valuetext="0:12 of 1:10"`; click anywhere to jump, press-and-drag to scrub (pointer capture, works with touch), keys ←/→ 5 s, PageUp/PageDown 10 s, Home/End. Visual: 6 px track in a 24 px tall hit area; a 14 px knob shows on hover, focus and while dragging; visible focus ring. Seeking while idle starts the video at that point.
- **Big player:** the existing seek bar gets drag + keyboard (it was click-only); its play/pause already sits at the start of the controls row, directly under the bar. Arrow keys on the focused timeline seek; elsewhere in the player they still change slides.
- **Demo film:** keeps the browser's native controls once started (already seekable by mouse and keyboard). Checked, no change.

### 8.2 The app's pointer over the hero video (I11, I09, I30)
- **Data:** the render script exports, per beat, the pointer place the app would use: the `focus` box if the picture was measured, else the plan's `at` zone (same `ZONE_RECTS` as `Spotlight.jsx`), converted to fractions of the 1280×720 video frame (the picture is letterboxed inside it). `null` for `whole` or no zone. A picture only gets a pointer when its beats point at two or more different places (the `walk.js` rule), so DNA (no pointer data) shows none, which is the honest answer.
- **Look:** the app's default **Pointer (orb)**: a small white-cored, warm-orange glowing light (9–22 px, sized to the picture) that glides 720 ms between places and breathes gently. Nothing is dimmed (the app's "Highlight" is its stronger, optional mode; not used here).
- **Timing:** on only while the video is actually playing; off when paused, ended or idle; 600 ms of the whole picture before it appears on each new picture (as in the app). Positioned against the real picture box inside the `<video>` (object-fit contain), re-measured on resize.
- **Reduced motion:** no glide and no breathing; the light simply moves. Decorative (`aria-hidden`); the captions carry the meaning.
- Used in the hero (both modes) and in the big player (same data, cheap).

### 8.3 The sign-up number (I19, I27, I17 — P0 to stay truthful)
Real counts on 14 Nov (read-only): landing waitlist **1**; old app waitlist 3; PCs that installed the app **82** (47 active in the last 30 days); accounts 5; logged explanations 29 (39 by daily usage) from 4 devices. **There is no truthful number near 1,500–2,000.**
- **Shipped:** unchanged rule — the live count appears only above `WAITLIST_SHOW_MIN`; below it the line reads "Invites go out in batches — earlier sign-ups get in first". The canvas now defaults to the real count (1), so it shows what visitors see.
- **For the owner to decide:** once the list passes the threshold the live count shows by itself. A fixed "1,500+" is only allowed if the owner confirms it after seeing these numbers; the book treats an invented count as a P0 failure (I27).

### 8.4 Questions rewritten as customer discovery, each with "Other" (I22, I14, C2, The Mom Test)
Ask about the last real episode, not "would you use…". Six short steps, all skippable, every answered step +60 spots (same server rule). Every chip question ends with an **Other** chip; picking it opens an inline text box right under the chips ("Tell us in a few words", 80 characters, focused). Stored as `"Other: …"`.

| # | Question | Kind | Options |
|---|---|---|---|
| 0 | Which best describes you? | one | School student · College student · Working professional · Teacher or researcher · Just curious · Other |
| 1 | Think of the last time you got stuck on something you were reading. Where were you reading it? | one + optional text "What was it about?" | A PDF or e-book · A website or article · Word or Google Docs · Notion or OneNote · Slack, Teams or email · Other |
| 2 | What did you do to understand it? | any | Googled it · Asked ChatGPT or another AI · Watched a YouTube video · Asked a friend or teacher · Gave up and moved on · Other |
| 3 | In the last 7 days, how many times did that happen? | one | Not once · Once or twice · 3 to 5 times · Almost every day |
| 4 | What do you pay for today to learn or understand things? | any | Nothing, free tools only · ChatGPT Plus or another AI plan · Coaching or tuition · Online courses or apps · Books or test series · Other |
| 5 | How did you hear about Tubelight? | one | A friend · YouTube · Instagram · LinkedIn · Google search · Other |

- Server: question keys become "0"–"5"; the "What was it about?" text is saved with question 1 as `"About: …"`. The topic from a live preview stays in `answers.searched` (it no longer pre-fills a question).
- Intro stays: "Tell us how you’ll use Tubelight. Every answer moves you up the line, so you’re invited sooner."

### 8.5 Hero copy: search first (I08, I13, I07)
- **Body:** "Search a topic, or select any text and press Alt + E. Tubelight explains it with pictures and a voice in under 15 seconds."
- **Truth check:** Fast makes one in ≈ 11 s (Sept 2026 runs); Rich takes up to 30 s. Every time line now says it the same way: hero note "In the app, Fast makes one in about 11 seconds (Rich takes up to 30); here they play straight away." · comparison "How long": "Under 15 seconds on Fast, up to 30 on Rich" · the web free preview keeps its own measured "about 20 s" (it runs on our shared servers and streams to the page).

### 8.6 No more "You typed" lines (owner; D11 removal test)
- Removed from the gallery cards and their screen-reader labels. The typed topic still shows where it is the input being demonstrated: the hero search box.

### 8.7 A milder play mark (I23, I09)
- Gallery, saved tiles and feature pictures: a 40 px disc in the **bottom-left corner** (12 px inset), dark glass `rgba(20,16,40,.38)` with a white triangle, light blur, no big shadow. It never covers the middle of the picture. On hover/focus it turns white with a purple triangle and grows to 44 px. The whole card stays the button (large target, small visible icon).

### 8.8 Search mode first and open on load (I21, I28, I30)
- Mode switch order: **Search a topic** (default, open on load) · **Select text · Alt + E**.
- On load the sample topic types itself and presses Enter; the video plays **muted** (no sound without a press, I30). Reduced motion: the topic appears at once and nothing plays until pressed.

### 8.9 Search-mode hero layout like the app (I07, I10, I32)
- **Before playing:** one wide Tubelight window fills the whole demo area (no empty page on the left): heading "What do you want to understand?", a **real** search box (search icon · input · **Explain it** button with an Enter key cap) and two hints: "You can paste a whole paragraph too." and "Your own topic? Press Enter for a free preview · about 20 s · email needed to watch" (said before the click, I20, I25).
  - The sample topic types itself; clicking into the box stops the typing and selects it so the visitor can type over it. A sample topic plays its ready video in place; anything else opens the live preview (same flow as the gallery search).
- **Once playing:** the window becomes the app's player: a slim bar with the topic in a search pill (click = edit), Sound and Maximise; the **video takes the full width with the slide rail on the right** (numbered thumbnails, current one ringed purple with the speaking wave, click = jump); captions under the video; then the transport from 8.1.
- **Select mode** keeps the sample page + panel split (with the new transport and the pointer).
- **Phone:** box and button stack full width; while playing the rail becomes a horizontal strip under the transport.

### 8.10 Quick Search AI block gets a mild colour (I34, D4)
- The "More from Tubelight" card gets a soft tint from the hero palette: a light lavender-to-peach wash (`#F4F0FF` → `#FFF4E4`) with a faint sky-blue glow in one corner and a 1 px lavender edge. Text contrast unchanged (≥ 4.5:1); nothing animated.

### 8.11 Book review and phone equivalence (F1, E3, I32)
- Re-run F1 + E3 on the finished page; record the result in `docs/landing-v5-review.md` (section "v5.4"). Phone (375 px) keeps the same meaning in the same order: purpose → how (mode switch, search first) → action → demo → proof.
