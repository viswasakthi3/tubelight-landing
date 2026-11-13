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
