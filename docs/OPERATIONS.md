# Tubelight operations

This is the entry point for maintaining the landing page, Quick Search routes, and
free video previews. Read `SECURITY.md` before release work. The dated rollout plan
records discovery history; the deployed release receipt takes precedence over it.

## Release status

Application changes are implemented and tested. Backend feature commit
`3354c89f763f44edc8d3fdb79d981f38e1f7959c` is pushed to `time2understand/main`.
Production activation and the final landing commit remain pending until a release
receipt is recorded. Do not equate a CLI launch, dry run, or successful build with a
live deployment. The search DNS record was still absent at the last verification.

## Projects and services

| Component | Source / production location |
| --- | --- |
| Landing | `D:/projects/tubelight_landing`, GitHub `viswasakthi3/tubelight-landing` |
| Backend | `D:/projects/time2understand/t2u_backend`, GitHub `viswasakthi3/time2understand` |
| Server | `root@88.198.81.89`, existing SSH key authentication, port 22 |
| Landing container | `tubelight-landing`, `127.0.0.1:8097` |
| Backend container | `tubelight-backend`, `127.0.0.1:8787` |
| Backend production source | `/root/tubelight_backend` |
| Runtime envfiles | `/root/tubelight_landing/.env`, `/root/tubelight_backend/.env` |
| nginx | `/etc/nginx/sites-available/tubelight.net`, linked from `sites-enabled` |
| Database | `root-db-1`, PostgreSQL database `time_to_understand` |
| Desktop updates | `/var/www/tubelight_updates`, preserved mounts and nginx aliases |

Only the Tubelight app ports above are confirmed to bind to loopback. Other host
services and the database's published port are outside this release's network scope.
Do not change or restart unrelated containers.

## Domains and proxy contract

- `https://tubelight.net/` serves the main landing page.
- `https://tubelight.net/search` serves Quick Search directly.
- `https://search.tubelight.net/` serves Quick Search at its root.
- The search host's `/search` redirects to its public root, preserving the query.
- `next.config.ts` uses relative `beforeFiles` rewrites for the search root and
  `llms` files. Middleware only performs the canonical redirect. Relative rewrites
  avoid accidentally proxying HTTPS to a container's HTTP loopback listener.

The reviewed nginx template is `infra/nginx/tubelight.net.conf`. Exact
`/api/preview`, exact `/api/waitlist`, and `/api/waitlist/` children reach Next on
8097. Other `/api/` routes, including existing billing contracts and
`/api/web/explain`, remain on backend 8787. Preserve `/updates/` and the direct
installer aliases.

nginx accepts `CF-Connecting-IP` only from the official Cloudflare proxy ranges,
then overwrites Host, X-Forwarded-Host, X-Real-IP, X-Forwarded-For and scheme. It
clears the CF header before proxying. ALL `proxy_set_header` directives stay at
server scope: adding one inside a location suppresses inheritance of the entire
header set. Sources: [nginx inheritance](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header),
[Cloudflare IPv4](https://www.cloudflare.com/ips-v4),
[Cloudflare IPv6](https://www.cloudflare.com/ips-v6).

`T2U_API_URL` defaults to `https://tubelight.net`, which has been reachable from the
landing container. A deliberately configured shared Docker network may use backend
DNS instead. `127.0.0.1:8787` inside the landing container does not reach the backend.

## Preview behavior and data

The browser first calls GET `/api/preview` to receive a signed HttpOnly owner
cookie, then submits email and topic to POST `/api/preview`. POST requires the
already-received cookie, validates origin/IP/body size, and saves the email to
PostgreSQL before calling the backend. Cookie signing and the upstream secret must
be configured before provider work. Neither localStorage nor a waitlist token grants
preview access. Email submission is not mailbox verification; there is no OTP flow.

The authenticated backend accepts `{topic,email,ownerId}` and a trusted visitor IP.
A committed reservation permanently claims both the normalized email and browser
owner. The same owner, email and topic can replay a cached result without another
AI invocation; another owner knowing the email cannot retrieve that result. A new
topic or changed email cannot grant that browser another preview. Existing examples
are free to replay and do not create generations.

Second-topic refusals lead into the existing details questions, then offer the
Windows product download. Profile completion never grants a second landing run.
The second gallery example is now `kidneys`; the hero retains its headache clip.

Preview-specific tables are `t2u_web_preview_settings` and `t2u_web_preview_runs`.
They do not register desktop devices or consume/grant app credits. Reservations,
global budgets and worker leases are atomic across processes. Failures and
uncertain work retain their claims; disconnects let the one job finish and cache.
The client waits for terminal `done`, emitted after cache commit, before playback.

| Setting | Default |
| --- | --- |
| Lifetime email/browser allowance | 1 committed generation |
| `WEB_EXPLAIN_PREFIX_DAILY` | 5 per IPv4 /24 or IPv6 /64 per UTC day |
| `WEB_EXPLAIN_DAILY_MAX` | 150 committed generations per UTC day |
| `WEB_EXPLAIN_CONCURRENCY` | 4 live worker leases |
| `WEB_EXPLAIN_CACHE_DAYS` | 7 days, maximum 30 |
| Cached payload limit | 32 MiB per result |

Keep lifetime hash rows after media expires. The identity key fingerprint is pinned:
changing the hashing key fails closed, rather than granting fresh allowances. Do
not delete rows, reset the pin, or rotate this key casually. Support should direct
failed/expired previews to the product. IP prefixes are a daily abuse budget,
not proof of identity: new email + cleared browser + changed network can evade
anonymous signals, and shared networks can affect unrelated users.

Full schema, error contract and migration details:
`D:/projects/time2understand/t2u_backend/docs/WEB_PREVIEW.md`.

## Configuration

Runtime files stay on the server with mode 0600, outside build contexts. Never print
values, raw Docker inspect data, cookies, API keys, or credential-bearing URLs.

- Both services: matching strong `WEB_EXPLAIN_SECRET` (at least 32 non-whitespace
  characters), and their existing `DATABASE_URL`.
- Backend: stable `WEB_EXPLAIN_IDENTITY_SECRET`; quota settings listed above.
- Landing: stable `OWNER_COOKIE_SECRET`, optional existing `WAITLIST_SECRET`,
  `T2U_API_URL`, and existing billing configuration.
- Keep provider credentials/mounts, database settings, restart policy, networking,
  labels, commands and all existing runtime values when replacing containers.

`.env.example` contains placeholders only. `.dockerignore` excludes all real env
files, secrets, local builds and media scratch work. Next standalone output from a
local build can contain a copied local `.env`; never deploy that directory blindly.
The release builds from committed source in a fresh secret-free Docker context.

## Checks and release

Run from the landing checkout:

```text
node scripts/test-preview-security.cjs
npx tsc --noEmit -p .
npm audit --omit=dev
npm run build
node scripts/check-site.mjs http://127.0.0.1:3006
```

The last command expects a separately started local production preview with proxy
headers simulated by the script. It performs no signup, payment or generation.
Browser interaction checks are distinct; browser control was stopped by the user.

Backend handler checks: `node scripts/test_web_explain.js`. The optional
`test_web_preview_db.js` uses a temporary isolated schema and real PostgreSQL;
only run it with deliberate database access. Twelve real SQL checks passed during
implementation; it is not necessary to repeat them for a media-order change.

The backend checkout contains unrelated dirty files, including `index.js` and
package manifests. NEVER stage all or deploy that directory wholesale. Production
was also missing the preview router registration; apply only the reviewed import
and POST registration patch against its baseline. Keep the router patch and exact
dependency delta with the release artifacts. Repair production dependency findings
inside an isolated Node container; the host has no Node/npm installation. A clean
local backend audit does not prove the older running image is clean.

Before activation, require a pushed landing commit and approved feature manifest.
Build both new images, clone actual runtime settings, run the additive
`node scripts/migrate_web_preview.js` in the new backend candidate's final runtime
configuration, and probe both candidates on alternate loopback ports. The old
containers stay active until these checks pass. Activation has a brief container
switch; it must restore both prior services on a later failure. Keep private
snapshots, old stopped containers, image IDs, exact source revisions and audit
artifacts. Validate candidate nginx configuration before reload.

The reviewed entry point is `scripts/deploy_preview.py`; its companion runtime
helper and offline checks document the exact implementation. Read its `--help`
and the final release receipt before running it; do not copy an earlier draft
command that packaged an uncommitted working tree.

After activation, verify public main and `/search`, preview cookie bootstrap,
backend health/capabilities, referenced assets, and a real preview followed by
same-owner replay and second-topic rejection. A same-email/different-owner attempt
must not disclose media. Confirm actual spoofed forwarding headers cannot change
the network identity. Check checkout pages without submitting a payment.

## DNS, TLS and rollback

The user agreed to add a proxied Cloudflare CNAME named `search`, targeting
`tubelight.net`. Verify actual DNS resolution before issuing its certificate.
The existing certificate initially covered only the apex. Use the existing
certificate account and configured ACME webroot; test the HTTP challenge path.
Do not bypass TLS verification or claim the subdomain is live while DNS/TLS fails.
Apex `/search` works independently of the new DNS record.

Use the exact release snapshot ID and rollback command from its receipt. Preserve
all quota tables, cached ownership and identity keys. If old daily/in-memory quota
code is restored, actively disable public `/api/preview` with a 503 response before
serving it; a comment about disabling it is insufficient. Never restore with a
wildcard backup path or erase unrelated state. Verify both restored services and
nginx after rollback.
