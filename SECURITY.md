# Security practices

How secrets, servers and databases are handled in this project. It is short on purpose: every rule here
exists because breaking it has already cost something once.

## 1. Secrets never go into git

- Real values live only in `.env` / `.env.local` files, which are git-ignored. Commit a `.env.example`
  with **placeholders only** (`DATABASE_URL=postgres://<user>:<password>@127.0.0.1:15432/<db>`).
- Never hardcode a key, password, token or connection string in source, scripts, docs, tests or
  notebooks. Read it from the environment (`process.env.X`, `os.environ["X"]`) and fail loudly when it is
  missing. No fallback to a "default" secret — a default in the source is a published secret.
- Signing keys (`*.pfx`, `*.p12`, `*.pem`, `*.key`) and service-account JSON files are never committed.
  Their passwords come from the environment of the shell that runs the build.
- Deploy notes and runbooks name the variable, never the value: write `DEEPGRAM_API_KEY=<from the console>`.

Baseline `.gitignore` block (keep it in every repo):

```gitignore
# secrets
.env
.env.*
!.env.example
*.env
*.pem
*.key
*.pfx
*.p12
*service-account*.json
credentials*.json
secrets/
# editor history snapshots (they copy .env files)
.history/
.lh/
```

Before every commit, check what is staged:

```bash
git diff --cached | grep -nEi "(password|secret|api[_-]?key|token|private key)\s*[:=]|postgres(ql)?://[^:]+:[^@]+@|sk-|AIza|rzp_live_"
```

## 2. Secrets never go into images

`.dockerignore` excludes the same patterns (`.env*`, `*.env`, `*.bak*`, keys, `secrets/`). Configuration is
passed at run time with `docker run --env-file /root/<app>/.env`; those files are `chmod 600` on the server.

## 3. Database

- Postgres is **not reachable from the internet**. Apps on the server reach it over the docker bridge.
  From a laptop, open an SSH tunnel and point the local `.env` at it:
  `ssh -N -L 127.0.0.1:15432:127.0.0.1:5432 root@88.198.81.89` → `postgres://<role>:<pw>@127.0.0.1:15432/<db>`.
- Every app has **its own login** (`app_<name>`) that owns its own database and nothing else. The
  `postgres` superuser cannot log in over the network at all; admin work is done on the server with
  `docker exec -it root-db-1 psql -U postgres`.
- Passwords are random (32+ characters) and stored on the server in `/root/secrets/db/<role>.pw` (0600).

## 4. Servers

- SSH is **key-only**; password login is disabled. Protect your private key with a passphrase and keep a
  backup of it somewhere safe — without it (or the hosting provider's rescue console) nobody gets in.
- App containers publish ports on `127.0.0.1` only; nginx is the only thing listening publicly (80/443).
- Nothing internal (databases, admin panels, dev servers like Vite on 5173) is published on `0.0.0.0`.

## 5. When a secret leaks

1. **Rotate it first** — create the new value, deploy it, revoke the old one. Removing it from files does
   not un-leak it.
2. Remove it from the working tree.
3. Remove it from history: `git filter-repo --replace-text replacements.txt` (one `old==>***REMOVED***`
   per line) on a fresh mirror clone, verify with `git log --all -S"<old>"` (must be empty), then
   `git push --force-with-lease`. Everyone else re-clones.

## 6. Dependencies

Run `npm audit --omit=dev` (or `pip-audit`) before a release and fix anything high or critical.
