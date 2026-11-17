# Tubelight — Landing & Quick Search Website

Official marketing site, Quick Search portal, and waitlist for Tubelight, the Windows desktop AI explainer. Next.js 15.5.29 (App Router) + React 19 + Tailwind v4 + Motion.

```bash
npm install
npm run dev        # http://localhost:3005
npm run build      # Production Next.js build
npm start          # Local production preview on 3005; Docker runs standalone on 8097
```

---

## Architecture & Production Domains

* **`https://tubelight.net/`**: Main marketing landing page and explainer player.
* **`https://tubelight.net/search`**: Quick Search AI for Windows directly on the apex domain, preserving query strings (`?q=...`), meta tags, and structured data.
* **`https://search.tubelight.net/`**: Dedicated Quick Search AI portal (`/` maps internally to `/search` through `next.config.ts`).

For full operations, infrastructure, Nginx reverse proxy configuration, and deployment runbooks, see [docs/OPERATIONS.md](docs/OPERATIONS.md).

---

## Free Video Previews: Quota & Security Model

Visitors to `tubelight.net` can request one free generated video preview for any topic.

1. **Email-First Gating**: A valid email must be submitted before generation starts. The email is durably registered in the PostgreSQL `tubelight_waitlist` table.
2. **Cryptographic Owner Cookie & Bootstrap**: A signed HttpOnly cookie (`tb_owner`) binds the preview to the visitor's browser session. A bootstrap `GET /api/preview` call mints or verifies this cookie before any generation begins; subsequent `POST /api/preview` calls missing a valid cookie are rejected with HTTP 403. The browser cannot spoof or inject its own `ownerId`.
3. **Durable Quota Enforcement**: Backend checks lifetime uniqueness per email and per browser owner. One generation is permitted per observable visitor identity across restarts and UTC midnight.
4. **Instant Replay**: Re-requesting the exact same topic with the matching owner and email streams cached frames from PostgreSQL without invoking Vertex AI / Deepgram. No cross-visitor or cross-owner topic cache exists (different visitors requesting the same topic generate independent runs).
5. **Second-Topic Limits**: Subsequent requests on new topics return HTTP 429 (`scope: "identity"`). The UI collects waitlist survey answers and directs visitors to download the desktop Windows application.
6. **No Mailbox Ownership Claims**: Email addresses are collected as submitted abuse signals. Because no email delivery service is configured, the UI does not claim mailbox verification or promise OTP/sent links.

---

## Environment Configuration

Configuration values are stored in `.env` / `.env.local` (`chmod 600`, git-ignored). Commit template placeholders only in `.env.example`.

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (`time_to_understand`) |
| `PORT` | Container HTTP bind port (default `8097`) |
| `NEXT_PUBLIC_SITE_URL` | Public canonical site URL (`https://tubelight.net`) |
| `T2U_API_URL` | Upstream backend API base URL (`https://tubelight.net` or shared Docker network) |
| `WEB_EXPLAIN_SECRET` | Shared secret with backend (>= 32 characters, matching backend) |
| `OWNER_COOKIE_SECRET` | Dedicated secret for signing `tb_owner` cookies |
| `WAITLIST_SECRET` | Secret for signing waitlist referral tokens |
| `RAZORPAY_KEY_ID` | Razorpay payment key identifier |
| `RAZORPAY_KEY_SECRET` | Razorpay payment key secret |
| `RAZORPAY_PLAN_ID` | Pro subscription plan ID |
| `RAZORPAY_MAX_PLAN_ID`| Max subscription plan ID |
| `MAX_CREDITS` | Credit allowance for Max tier |
| `MAX_PRICE_PAISE` | Pricing in paise for Max tier |

---

## Security Practices

* **No Secrets in Git or Images**: Verified via `.dockerignore` and `.gitignore`.
* **Dependency Audit**: Check the actual release tree with `npm audit --omit=dev`; do not infer the running backend's audit from this separate landing project.
* **Reverse Proxy Trust**: The nginx template trusts official Cloudflare CIDRs, overwrites spoofable headers, and clears incoming `CF-Connecting-IP` before forwarding.

The second example below the topic search is the existing kidney video; the hero retains its headache example. Run `node scripts/test-preview-security.cjs` for the API/client security checks, and `node scripts/check-site.mjs <origin>` for read-only page, route, and asset checks.
