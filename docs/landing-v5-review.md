# Landing v5 — review against the book

Reviewed 13 Nov 2026 with the book's own tools: the F1 rubric, the E3 "most consequential failures" pass, and the D11 brand-swap / reality / removal tests.
This is a self-review. Under F1 no dimension can score 3 until real visitors confirm it, so the best possible score here is 2.

## F1 rubric (0 = absent or misleading · 1 = present but ambiguous · 2 = clear, passes inspection, not yet user-tested)

| Dimension | Before | After fixes | Evidence / remaining weakness |
|---|---|---|---|
| Immediate product clarity | 2 | 2 | H1 + "Select … press Alt + E" + a real explanation playing beside a page. Not tested with a 5-second test (F2). |
| Audience relevance | 2 | 2 | Sample pages are a textbook PDF, health article, biology notes; "Who" section. No recent-task interviews yet. |
| Value proposition | 2 | 2 | Compared against the real alternative (Google / ChatGPT, new tab). |
| Product demonstration | 1 | 2 | **Fixed:** hero implied the video was generated from that highlighted sentence, in real time. Now says the explanations are real, the page is a sample, and making one takes about 10–30 s (D5: disclose time compression). |
| Ease of understanding | 2 | 2 | Input → key → output stay side by side (I10). |
| Information sequence | 2 | 2 | Nav jump links; form in hero and at the end; FAQ. |
| Hierarchy and readability | 2 | 2 | Checked at 1440 and 375 px. |
| Authenticity and distinction | 1 | 2 | **Fixed:** generic avatar faces sat next to the proof line and implied real users; removed. Brand-swap test passes (Alt + E key, real Tubelight output). |
| Trust and objections | 0 | 2 | **Fixed (P0):** the privacy answer said the text is sent "only to make your explanation", but the backend keeps a record of explanations (`t2u_explanations`) and follow-up questions with the selected text (`t2u_user_questions.selected_text`). Rewritten to say what happens. AI limits moved next to the examples (I38). |
| CTA clarity | 1 | 2 | **Fixed:** nothing near the form said what happens after joining. Added "We'll email you when your invite is ready. Nothing else." (I20, I27). |
| Conversion friction | 2 | 2 | Server-confirmed submit, inline errors, duplicate handled, questions skippable. |
| Mobile responsiveness | 1 | 2 | **Fixed earlier:** nav links overflowed on phones. Key button says "Tap to explain" on touch screens. |
| Accessibility | 2 | 2 | Real buttons, labels, focus trap, Esc, reduced motion stops autoplay, captions on every explainer. **Gap:** the demo film has no captions (we didn't open that file). |
| Performance | 2 | 2 | Posters first, hero video `preload=metadata`, others `none`, fonts via next/font. No field data yet. |
| Evidence alignment | 1 | 2 | **Fixed:** several unverified claims (below) softened or removed; claim ledger in this file. |

No release blocker remains after the fixes, **as long as the "Open questions" below are answered before launch**.

## The five most consequential failures (E3)

1. **False privacy claim (factual error, P0).** "Sent to our servers only to make your explanation" was untrue. New FAQ answer: "It's sent to our servers to make your explanation. We keep a record of the explanations we make so we can fix problems and improve them. Your saved explanations also live on your own PC." *Test:* ask 5 visitors what happens to their text; compare with the backend.
2. **Invented schedule (factual error, P0 under I27).** "Invites go out every week, in order" and "we invite the people it'll help most first" are not verified facts. Now: "We invite people in batches, in line order." and "People who answer are invited first" (true because ranking is by answers, *if* invites follow the ranking). *Unblock:* confirm the real invite cadence; then "every week" can come back.
3. **Demo implied real-time generation from the highlighted text (communication ambiguity, I09/D5).** The videos were made from typed topics and play instantly. Caption now: "Real Tubelight explanations of these topics, in its own voice. Making one takes about 10–30 seconds — here it plays straight away. The page is a sample." *Test:* reconstruction task — can visitors say what they'd select, what they'd press, how long it takes?
4. **Over-broad compatibility claims (factual error, I08).** "Any app on your PC", "Every explanation stays on your PC, forever", "Here's the whole thing, start to finish" (we never opened the demo). Now: "Wherever you can select text — PDFs, websites, Word, Notion…", "Saved on your PC until you delete them", "Here's Tubelight on a real Windows PC."
5. **No next-step promise at the form (CTA clarity, I20).** Added microcopy under the email field in the dialog and final CTA; the hero keeps the three short conditions to stay scannable.

Also fixed: "Seconds — usually under 20" → "About 10–30 seconds to make" (measured Fast ≈ 11 s, Rich < 30 s); "Watch the 80-second demo" → "Watch the demo (1:21)"; AI-limits line placed under the examples gallery.

## Claim → proof ledger

| Claim on the page | Proof | Status |
|---|---|---|
| Select text, press Alt + E, get pictures + voice | The app; the hero and gallery videos are unedited output | verified |
| About 10–30 s to make one | Sept 2026 measurements (Fast ≈ 11 s, Rich < 30 s) | verified, re-measure before launch |
| Free to try | 3 free videos, then sign-in | verified |
| Windows 10 & 11 | Release builds | verified |
| Mac "on the way" | Mac port exists, never run on a real Mac | provisional — FAQ only |
| Saved on your PC until you delete them | Saved library never prunes | verified |
| N people waiting / +N this week | Live database count, shown only above `WAITLIST_SHOW_MIN` | verified (real data) |
| People who answer are invited first | Ranking by boost in `lib/waitlist.ts` | true only if invites follow the ranking — **owner to confirm** |
| Invites in batches | — | **owner to confirm cadence** |
| Text handling | `t2u_explanations`, `t2u_user_questions` | verified by code read; retention period unknown |

## Open questions for the owner (block truthful copy)

1. How often do invites actually go out, and do they follow the waitlist order? (Restores "every week" if true.)
2. Is the app downloadable right now? `/download` exists and the update channel serves v0.1.1 — a waitlist page next to a public download contradicts itself (I27, C1).
3. How long are explanations and selected text kept on the server, and can a user delete them? (Lets the privacy answer name a period.)
4. Does the demo film contain narration? If yes, it needs captions (I30).

## Test backlog (F2/F3, smallest first)

1. Five-second test with 5 students: "What is this? What would you get? What happens after the button?" Answer key: Windows app · select + Alt + E · narrated picture explanation beside the page · email for an invite.
2. End-to-end waitlist task on a phone and a PC, including a typo email and a duplicate signup.
3. Watch `hero_video_play` (autoplay vs `sound: true`) against `waitlist_submit` per visitor — a play is not understanding (I39).
4. Once traffic allows: hero headline "Understand anything in seconds." vs a concrete version ("Select any text. Press Alt + E. See it explained.") with equal facts.
