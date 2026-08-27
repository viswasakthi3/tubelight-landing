# Tubelight — landing page

Beta-waitlist landing page for Tubelight, the Windows app that explains whatever you
highlight. Next.js 15 (App Router) + React 19 + Tailwind v4 + Motion.

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm start
```

## Collecting emails

The page has two signup forms (hero and the beta CTA, which also asks an optional
role). Both POST to `app/api/waitlist/route.ts`, which:

- validates the address and rejects obvious junk,
- drops bot submissions via a hidden `company` honeypot field,
- rate-limits to 5 requests per minute per IP (in-memory, resets on redeploy),
- appends the signup to `data/waitlist.json` (gitignored),
- forwards it to a webhook and/or emails you, if configured.

Copy `.env.example` to `.env.local` and fill in whichever you want:

| Variable | What it does |
| --- | --- |
| `WAITLIST_WEBHOOK_URL` | POSTs `{email, role, source, createdAt}` to Zapier/Make/Slack/your CRM |
| `RESEND_API_KEY` + `WAITLIST_NOTIFY_TO` | Emails you on every signup via [Resend](https://resend.com) |
| `WAITLIST_NOTIFY_FROM` | From-address for that email (must be a verified Resend domain) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used for OG/Twitter metadata |

**Deploying to Vercel/Netlify:** the filesystem is read-only there, so
`data/waitlist.json` silently no-ops and the webhook (or Resend) becomes your only
record. Set at least one of them before going live.

To read the local list:

```bash
cat data/waitlist.json
```

## Structure

```
app/
  layout.tsx           fonts (Fraunces + Inter), metadata, no-JS reveal fallback
  page.tsx             section order
  globals.css          design tokens, paper grain, keycaps, demo-stage grid
  api/waitlist/route.ts
components/
  Hero.tsx             headline, hero form, real product screenshot
  HowItWorks.tsx       three steps, kept in sync with the animation
  AltEDemo.tsx         the looping select → Alt+E → panel → drawn diagram demo
  NightBand.tsx        dark section for the dark product shots
  Features.tsx         bento of real screenshots, one tint per card
  BetaCTA.tsx          main signup with optional role chips
  Faq.tsx  Footer.tsx  Nav.tsx  WaitlistForm.tsx  Reveal.tsx  LiveWaveform.tsx
lib/
  waitlist.ts          storage + forwarding
  useInViewport.ts     scroll-reveal trigger
public/
  brand/               logo, mark, icons
  shots/               cropped product screenshots
```

## Design notes

- **Warm paper, not white.** The palette is built on `--color-paper` (#fbf8f3) and
  warm ink, with violet as the accent and amber (`--color-filament`) as its warm
  counterweight, so the page never reads as flat white-and-purple.
- **Real screenshots.** Every feature card uses actual app output cropped from
  `time2understand/windows_store_assets` and `store_screenshots` — the colourful
  generated slides do most of the work of breaking up the palette.
- **Section rhythm.** Paper → paper → full-width night band → paper → warm CTA. The
  dark band exists so the dark product shots sit in their native environment.
- **One real animation.** `AltEDemo` plays the actual product gesture (highlight →
  keycaps → panel slides in → SVG diagram draws while the waveform runs) and drives
  the step list beside it. Everything respects `prefers-reduced-motion`.
- **Reveals can't blank the page.** `useInViewport` uses a throttled rect check
  rather than IntersectionObserver/rAF (both can stall in an iframe or an offscreen
  frame and leave content stuck at `opacity: 0`), and a `<noscript>` rule forces
  everything visible when JS is off.

## Assets

Screenshots were cropped from the Time2Understand store assets. To regenerate them,
re-crop from `D:/projects/time2understand/windows_store_assets` — the arrow overlay
in the topic-explorer shot is painted out before cropping.
