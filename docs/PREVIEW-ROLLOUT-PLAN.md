# Landing preview limits and domain rollout

Requested 2026-11-17. This document records the intended behavior and review findings.
It is a plan, not evidence that a deployment has completed. See `OPERATIONS.md` and
the deployment report for the final implementation and live verification.

Latest steering: the second example below the topic search is now the existing
kidney video (`kidneys`). The hero keeps its headache example. Kidney search
keywords live in the gallery entry so suggestions do not duplicate the same clip.

Review corrections: production currently lacks the web-preview router import and
registration, despite an earlier delegation report assuming it existed. Release
must apply a minimal reviewed router patch against the production baseline while
preserving unrelated local `index.js` edits. Search-host internal routing uses
relative `beforeFiles` rewrites in `next.config.ts`; middleware only canonicalizes
the search host's `/search` URL. This avoids HTTPS-to-loopback rewrite failures.

## Product contract

- One free generated landing preview per observable visitor identity, across days
  and server restarts. Curated example videos stay available.
- Collect email before generation so an already-used email can be refused before
  another paid AI request. Email submission alone does not verify ownership.
- Keep the generated result private to the requesting browser/session. Typing an
  existing email must never disclose someone else's preview.
- Replaying or reconnecting to the same preview must not generate another video.
- A second topic opens a details form and the product access/download action.
  Completing the form does not grant another landing preview.
- `https://tubelight.net/` is the main landing page.
  `https://search.tubelight.net/` and `https://tubelight.net/search` serve Quick Search.

## Security requirements

Use preview-specific PostgreSQL records and atomic identity/budget reservations,
outside the desktop device and credit system. Store keyed hashes of normalized
email, browser identity, and the chosen IP/network signal. A signed, HttpOnly
first-party cookie binds result access to its owner. Do not use localStorage or
the existing waitlist token as authorization. Missing durable storage or production
signing configuration must disable generation.

Reserve the global daily cost budget and concurrency capacity before provider work.
Retries, lost responses, disconnects, crashes, and media expiry must not erase
lifetime claims or trigger uncertain provider work again. Document any permitted
pre-work retry and the independent retention period for saved media.

Only trust client addresses established by a configured reverse proxy. For the
Cloudflare deployment, nginx must accept real-IP headers only from Cloudflare's
published proxy ranges and overwrite application-facing forwarded headers. Normalize
IPv4/IPv6 consistently and document the network prefix and shared-address policy.

Email, IP, and cookies are abuse signals, not proof of a unique human. A person
using a new email, browser, and network can evade all three. A strict permanent IP
claim also blocks other people sharing that address. Do not describe these controls
as verified email ownership or perfect person identification.

## Baseline findings

Sol 6.1 performed a read-only security review. The old `webExplain.js` limits were
in-memory and reset daily and on restart. The old player gated playback with
`w.sent` while the API already streamed narration and media to the browser.
Duplicate waitlist submission reissued its token without email verification and
did not persist new signup answers. The implementation must address these facts.

Read-only production checks found:

- SSH access to `root@88.198.81.89` works using existing key authentication.
- nginx site: `/etc/nginx/sites-enabled/tubelight.net`.
- Landing container: `tubelight-landing`, loopback port `8097`; old image
  `tubelight-landing:1.3`, no source mount.
- Backend container: `tubelight-backend`, loopback port `8787`; source directory
  `/root/tubelight_backend`, persistent storage mount under its `storage` directory.
- The public apex still serves an older landing design. `/api/health` is available.
- All `/api/` requests currently go to the backend. Add precise nginx locations
  for landing APIs, preserving desktop, billing, update, and download routes.
- The existing certificate covers `tubelight.net` only. The search hostname needs
  DNS and valid TLS. The user agreed to add a proxied Cloudflare CNAME named
  `search`, targeting `tubelight.net`; verify actual resolution before certificate work.
- Landing `npm audit --omit=dev` reported one critical and four high issues.
  The reported Next.js patch is `15.5.29`; validate the final dependency tree.

Never include environment values, database URLs with credentials, signing keys,
Cloudflare tokens, or private account material in this document or deployment logs.

## Delegation and rollout

Antigravity is assigned implementation, focused validation, git push, and scoped
deployment. Its installed catalog exposes `gemini-3.8-flash-high` with high effort;
Sol 6.1 is used separately for the important security review. Implementation
conversation: `f481f46f-ec9d-4381-8974-51ebf9868dc7`.

Local handoff files are in `C:/Users/Public/Documents/Antigravity-Handoff/`:
`LANDING-PREVIEW-TASK-20261117.md` and
`LANDING-PREVIEW-SOL-REVIEW-20261117.md`. They contain no credentials.

The backend checkout at `D:/projects/time2understand` contains substantial unrelated
edits. Never deploy that entire directory or stage all its changes. Compare the
scoped preview patch against production, keep source and Docker rollback copies,
apply additive database changes, and deploy only the required feature files.

Before publishing, review the actual diff, focused tests, production dependency
audit, domain routing, and backward compatibility during rollout. After publishing,
record commit IDs, service versions, migrations, rollback locations, and actual live
checks in the operations documentation. Browser control was stopped by the user;
do not claim a completed browser review unless a later authorized check was run.

## Acceptance evidence

Verify concurrent reservation permits one provider invocation; restart and UTC
midnight do not restore eligibility; changed email/cookie/IP combinations follow
the documented policy; invalid cookies, wrong shared secrets, spoofed proxy headers,
and copied run IDs cannot authorize generation or reveal a result. Store failure
must prevent provider calls. Test first preview, same-run replay, second-topic form,
and durable detail updates for an already-signed-up email. Check main and both
search URLs, representative assets, signup, download, checkout, and unchanged
desktop/Quick Search capabilities. Distinguish mocked tests from live provider and
database verification.
