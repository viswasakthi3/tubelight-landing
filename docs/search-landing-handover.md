# search.tubelight.net landing — handover (Nov 14, 2026)

## Where things stand

The Quick Search AI landing page lives inside `D:\projects\tubelight_landing` (Next.js 15, React 19), as
**new files only**. The main Tubelight landing page (`app/page.tsx`, `components/v5/*`, root
`app/layout.tsx`, `app/globals.css`) must not be changed. Nothing is committed yet.

| File | What it is |
| --- | --- |
| `middleware.ts` | Rewrites `/` to `/search` when the host starts with `search.` (matcher `["/"]` only). |
| `app/search/page.tsx` | Metadata, OG image, JSON-LD (SoftwareApplication + FAQPage), loads Manrope via `next/font` as `--font-manrope`. |
| `components/search/SearchLanding.tsx` | All page sections (server component). `QS_FAQ` is exported for the JSON-LD. |
| `components/search/client.tsx` | `GetButton` (device-aware: Windows → Store, phone → share/copy link, Mac → Store + note), `DemoMount`, `Film`, `qsTrack`. |
| `components/search/page.ts` | Plain-DOM page behaviour (v4): "Watch it work" scrolls the film to the centre and starts it; the sticky download bar shows only after the hero button scrolls away and hides at the closing panel. Also runs in the artifact. |
| `components/search/demo.ts` | Plain-DOM controller for the hero demo (auto loop; hold on-screen keys; hold Tab + Q on keyboard; sample-question chips). Also runs in the artifact. |
| `components/search/icons.tsx` | Inline SVG icons, `Mark` (app icon), `Windows` logo. |
| `components/search/search.css` | All styles, scoped under `.qs`. Uses `:where()` resets so class rules win. |
| `public/search/` | Film cuts (`stop-opening-tabs.mp4` 16:9, `-phone.mp4` 9:16, 47.8 s), posters, `og.jpg`, `icon.png`, answer pictures `pic-blossom/aurora/moon.webp` (cropped from the Store screenshots). |
| `docs/search-landing-v2-script.md` | The page script and the reasons behind v2 and v3. |

Design artifact (private): https://claude.ai/artifact/FKzuLREw14pw5Ly8rj2LdD — built from the live page's
SSR markup by `build-artifact.js` (in the old session's scratchpad: it fetches
`http://localhost:3005/search`, cuts out `<div class="qs" id="top">…`, inlines `search.css`, transpiles
`demo.ts` with the project's TypeScript, and swaps `/search/*.{jpg,webp,png}` for data URIs). Re-create
that script if you need to republish. Since v4 it must transpile both `demo.ts` and `page.ts` and call
`mountDemo(.qs-demo)` and `mountPage(#top)`.

The source "book" is the user's Design canvas https://claude.ai/artifact/Upyi9HNo4jmPjEATzKQkUq
(one 1440×6100 artboard, "Quick Search AI Landing Page": night hero "Stop opening new tabs.",
Tab + Q demo, how-it-works cards, answer card, 50 free, final CTA).

## Facts the page relies on (verified)

- Live on the Microsoft Store: ID `9NFK7MS99FB3`. Button URL
  `https://apps.microsoft.com/detail/9NFK7MS99FB3?mode=direct&cid=qs-landing-<where>`.
- 50 searches a day per device, refilled at midnight, no account.
- Tab still works: a lone Tab is replayed ~40 ms late; Alt/Ctrl/Shift + Tab untouched (`quick_search/main/chord-host.js`).
- Tab + S captures a region (rectangle or freehand); "Explain image" or ask a question; "Copy text"
  is on-device OCR and doesn't use a search.
- History is kept only on the PC; clear it in Settings. Windows 10 (1809+) and 11.
- No email-sending service is configured (no Resend key), so the page must not promise an email.
- No privacy page exists (`tubelight.net/privacy` is 404).

## Real assets to draw from

- Store screenshots: `D:\projects\quick_search\store\screenshots\01-ask-anything-anywhere.png`,
  `v3\02-select-words.png`, `v3\03-real-sources.png` (callout lines from dots to labels),
  `v3\04-keep-asking.png`, `v3\05-free-every-day.png`.
- Film source and components: `D:\projects\quick_search\store\video\short\tabq-tabs.html`
  (light Chrome window, crowded tab strip, egg card CSS, capture/OCR card CSS: `.att`, `.thumb`, `.ocr`,
  "Text copied", "Explain image"), storyboard `tabq-tabs-storyboard-desktop.png`.

## How to check your work

- Dev server already runs on port 3005 (`next dev`, hot reload). Open `http://search.localhost:3005/`.
  `http://localhost:3005/` must still show the Tubelight page.
- Do not run `next build` while the dev server runs (it overwrites `.next`). `npx tsc --noEmit -p .` is fine.
- Scrolled or interactive checks: drive headless Edge over the DevTools protocol (launch with
  `--remote-debugging-port`, then `Page.navigate`, `Runtime.evaluate`, `Page.captureScreenshot` of the
  viewport) — Node 22's built-in `WebSocket` is enough, no extra packages. The page's `html` has
  `scroll-behavior: smooth` from the global CSS, so set it to `auto` before scripted scrolling.
- The browser pane's scrolled screenshots go blank; for full-page shots use headless Edge
  (`msedge --headless=new --screenshot --window-size=1440,6500 --user-data-dir=<scratch>`). Edge has a
  ~500px minimum width, so for phone width put the page in an `<iframe style="width:390px">` on a local
  HTML file and screenshot that.
