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
