# search.tubelight.net — landing v2 script

Source: the "Quick Search AI Landing Page" design canvas (Nov 2026). This version keeps its story
("Stop opening new tabs."), its look (night hero, violet, tubelight yellow, Bricolage + Manrope) and
its examples, and cuts what slowed a visitor down.

## The page's one job

Get a Windows visitor to install Quick Search AI from the Microsoft Store (Store ID 9NFK7MS99FB3).
A phone visitor can't install, so their job is to send the link to their PC.

## What a visitor must get in 5 seconds

| They think | The page answers with |
| --- | --- |
| What is this? | Eyebrow "Free AI answers for Windows" + headline "Stop opening new tabs." |
| How does it work? | One sentence: hold Tab + Q, ask out loud, let go. The demo beside it plays exactly that. |
| What's the catch? | "No account · 50 free searches a day · Windows 10 & 11" right under the button. |
| What do I do? | One violet button: "Get it free" (Microsoft Store). Nothing else competes with it. |

## Changes from the design canvas

1. **Email gate removed.** The app is live on the Store, so the button installs it. The canvas asked
   for an email and promised to email a download link, but nothing sends that email. One step less,
   and no broken promise.
2. **The hero demo is playable.** It loops on its own (ask → listening → answer flickers on), and the
   visitor can hold the keycaps, or hold Tab + Q on the page, to make it answer. Doing the gesture once
   is what makes people want the real thing.
3. **Four "how it works" cards became three**: Ask out loud (Tab + Q), Look up words you see
   (select + Tab + Q), Ask about your screen (Tab + S, with Copy text folded in).
4. **"Real answers. Real sources." and its four feature tiles merged into one annotated answer card.**
5. **Film chapter chips removed** (their times didn't match the cut).
6. **Added a five-question FAQ** for the doubts that stop installs: is it free, will it break my Tab
   key, is it always listening, where do my questions go, Mac/phone.
7. **Device-aware button.** Windows: Store. Phone: "Send it to my PC" (share sheet, or copy link).
   Mac: Store link plus "Windows 10 & 11 for now".

## Order

1. Nav — logo, How it works, FAQ, Get it free
2. Hero (night) — eyebrow, headline, one sentence, button, three ticks · playable demo
3. Film — "48 seconds. Sound on." (desktop 16:9 cut, phone 9:16 cut)
4. How it works — three ways to ask + "Tab still types normally"
5. What comes back — one answer card, four points
6. Free — 50 a day, no account, history stays on your PC, refills at midnight
7. FAQ
8. Final call (night) — "One tab. Finally."
9. Footer

## Facts used (checked against the app, Nov 13 2026)

- 50 searches a day per device, refilled at midnight; no account (`t2u_backend/lib/quickSearch.js`).
- Tab still works: a lone Tab is replayed ~40 ms late; Alt/Ctrl/Shift+Tab untouched (`main/chord-host.js`).
- Tab + S captures a region; Copy text runs on-device OCR and doesn't use a search.
- History is kept only on the PC and can be cleared in Settings.
- MSIX MinVersion 10.0.17763 → Windows 10 (1809+) and 11.

## Routing

`middleware.ts` rewrites `/` on any `search.*` host to `/search`. The main landing (`app/page.tsx`,
`components/v5/*`, root layout) is untouched. DNS + the nginx `server_name` for search.tubelight.net
still need to point at this app.

---

## v3 (Nov 13, after review): picture-first, light, roomier

Feedback on v2: tight letters are hard to read, items feel cramped, the Quick Search card is a wall of
black text, and the bag icon makes the free download feel like a purchase.

What changes:

- **Type.** Headings go from -0.045em to -0.02em letter spacing (the video's setting) with more line
  height. Body text is 18px Manrope at 1.65 line height. Every card gets 28–32px padding and wider gaps.
- **Colours.** Light lavender page (#f7f6fc, the video's background) with soft colour panels:
  lavender, mint, peach, sky. Violet stays the only strong colour. The night hero is gone.
- **The answer card copies the app and the video**: a picture first (the video's drawn eggs; the
  Store screenshots' cherry blossoms and Moon), then one big bold line, one quiet line, coloured
  source chips and a violet "Reading aloud" pill. Each answer reads in two seconds.
- **"Three ways to ask" leads with pictures.** Each card is mostly a coloured scene (keys + voice
  bubble; highlighted "Northern Lights" with the aurora picture; an error boxed with Tab + S), and one
  short line of text.
- **"What comes back" is one annotated card** with numbered markers, like the Store screenshot.
- **Store button**: Windows logo, "Download free", "from the Microsoft Store". No bag.
- **Closing band**: a violet panel with big white Tab + Q keys and "One tab. Finally."

---

## v4 (Nov 14, after review): the first seconds, section by section

Re-read the book (the "Quick Search AI Landing Page" canvas) with one question per section: what does
a first-time visitor think in the first seconds, and do they have to work to get it?

### First-seconds check (v3 as built)

| Section | What a visitor thinks in 3 seconds | Effort? | Fix in v4 |
| --- | --- | --- | --- |
| Nav | "Two purple Download buttons. Which one?" | Yes: two equal calls compete. | Nav keeps only the logo, How it works and FAQ. A slim bar with the button slides in only after the hero button has scrolled away (and hides again at the closing panel). One violet button above the fold. |
| Hero window | "A small browser… a card on top of it… what was this person doing?" | Yes: the window is small, the tab strip is coloured blocks, the page is a serif "article" with an ad. The search story isn't readable. | A big light Chrome window like the film: a crowded tab strip where every tab is the same question searched again ("how long do i boil an egg", "boiled egg time", "egg boiling minutes"…), squeezing down to icons, with a red "31 tabs" count. The page is a results list where every result says something different. The Quick Search popup sits inside the window's bottom-right corner, answering. Story: many tabs → going nowhere → answer in the corner. One font (Manrope) everywhere in the window. |
| Hero words | "Stop opening new tabs. Hold Tab + Q." Clear. | No. | Shorter line under the headline. |
| "Watch it work" | "Where did it take me? The film is half off-screen." | Yes. | Smooth scroll that centres the film, and the film starts playing (with sound: the click allows it). |
| Film | "48 seconds, sound on." Clear. | No. | Unchanged. |
| How it works | "Three cards… the keys, the title and the line under it are all the same black." The third card shows an error with a dashed box and two buttons, but not the steps. | Yes. | Coloured key chips per card (violet, green, orange), a strong title, a softer caption. The screen card now shows the three steps as pictures: Tab + S → a box drawn around part of the screen → "Screenshot attached" with two choices, **Ask about it** or **Copy text**. |
| What comes back | "Numbers on the card, a list on the right. Which number is which?" | Yes: eyes jump back and forth. | Each number sits on the card's edge next to the part it points at, and a thin line runs from it straight to its label, like the Store screenshot. "Reading aloud" moves into the follow-up bar, as in the app. On phones the labels stack under the card with matching numbers. |
| Free | "50 a day, no account, history stays on my PC." Clear. | No. | Tighter on phones. |
| FAQ | Clear. | No. | Unchanged. |
| Final panel | "One tab. Finally." Perfect, per the user. | No. | **Not touched.** |

### Phone (390 px), section by section

- **Nav**: logo only (How it works and FAQ are a long scroll away anyway); the sticky bar later offers "Send to PC".
- **Hero**: words first (pill, headline, one line, full-width button, film link, ticks). Then the window,
  cut down to what fits: a strip of tiny tabs with the red count, the search box, two results. The
  popup overlaps the window's lower right corner and has a fixed height so nothing jumps while it plays.
  The keys sit under it with the three sample questions.
- **Film**: the tall 9:16 cut, never taller than the screen.
- **How it works**: one card per screen width, picture first, keys, title, line.
- **What comes back**: the card full width with numbers on its edge, then the four labels as a numbered list.
- **Free, FAQ, final, footer**: single column, smaller "50".

### v4 script (changes only)

- Hero line: "Hold <kbd>Tab</kbd> + <kbd>Q</kbd> in any app and ask out loud. Let go, and the answer pops up in the corner."
- Try row: "Try it here: hold Tab + Q, then let go." (touch: "Press and hold the keys, then let go.")
- How it works lede: "Works on top of any app. Nothing to switch to."
- Card 1: Tab + Q · **Ask out loud** · "Hold the keys, ask, let go."
- Card 2: Select, then Tab + Q · **Look up words you see** · "Highlight a word on any page. It's explained right there."
- Card 3: Tab + S · **Ask about your screen** · "Box any part of your screen. Ask about it, or copy the text out, free."
- What comes back labels: 1 **A picture first** "Real photos from the pages it read." · 2 **Sources you can open** "Every answer shows where it came from." · 3 **Keep asking** "It knows "there" means the Moon." · 4 **Read out loud** "Turn the voice off any time."
