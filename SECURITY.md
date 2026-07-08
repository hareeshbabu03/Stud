# Security notes

## Action required before you push this anywhere public

Two real credentials were previously hardcoded in source:

- `electron/googleAuth.ts` — Google OAuth Client Secret
- `electron/tmdb.ts` — TMDb API key

**Rotate both now, even if this code never went to a public repo.** Treat them as
compromised the moment they existed in plaintext source:

1. TMDb: log in at themoviedb.org → Settings → API → regenerate the key (or just
   generate a fresh key and stop using the old one).
2. Google: console.cloud.google.com → APIs & Services → Credentials → find the
   OAuth 2.0 Client ID → reset the client secret.
3. If this repo was ever pushed to GitHub (even briefly, even in an old commit),
   scrub it from git history too — `git log -p -- electron/googleAuth.ts` will
   show you every commit that touched it. `git filter-repo` or GitHub's
   secret-scanning remediation docs cover removing it from history.

## What changed

- No credentials live in source anymore. `electron-store` now holds an
  `apiConfig` object (`tmdbApiKey`, `googleClientId`, `googleClientSecret`)
  that each user fills in themselves from **Settings → API keys**. This file
  lives only on the local machine, is never bundled into the built app, and
  is covered by `.gitignore`.
- Google sign-in now uses PKCE (`code_verifier` / `code_challenge`) in addition
  to the client secret. Google's "Desktop app" OAuth client type still requires
  the secret in the token exchange call — that's a quirk of their API, not a
  choice — but PKCE adds a real defense-in-depth layer against authorization
  code interception, and removing the secret from source is the actual fix
  for the leak risk.
- `.gitignore` now excludes `.env*`, build output, and `node_modules` so this
  class of mistake is harder to repeat.

## Why this matters for a portfolio project

A public repo with a live secret gets scraped by bots within minutes — GitHub
itself runs secret scanning that will flag it, and there are public tools that
do nothing but crawl for exactly this pattern. "No secrets in source, runtime
BYO-key configuration" is also just a better engineering story to tell in an
interview than "I hardcoded a key and hoped no one looked."
