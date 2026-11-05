# DUNIA KOTAK — Security patch test plan

## Safety boundary

- Run integration tests only against a staging Worker with a separate Durable Object namespace and isolated test accounts.
- Never run invalid-code loops, recovery issuance, session rotation, or WebSocket replay tests against production.
- Do not copy production database contents into staging. Use synthetic test citizens.
- Capture a baseline of test-account fields before and after tests. Do not modify real citizen balances, plots, inventory, avatar, missions, or progress.
- Keep all secrets in the staging Worker secret store. Never print them in CI logs.

## Stage 1 — Automated CI

The pull-request workflow runs:
1. `node --check worker.js`
2. `node --check public/duniakotak/mabar/game.js`
3. `node --test tests/security-patch.test.mjs`

The Node regression tests are source-level guards. They do not replace Durable Object or browser integration tests.

## Stage 2 — Staging integration test matrix

Use synthetic accounts only. Record the HTTP status, response shape, and whether the expected state transition occurred.

| Area | Test | Expected result |
|---|---|---|
| Login | Correct 6-character citizen code | Correct citizen session is returned |
| Login | Wrong code / username-only attempt | 401; no account session is created |
| Login | 10 failed attempts in the same IP + code buckets | 429; further attempts blocked for 15 minutes |
| Login | Successful login after earlier failures | Does not clear the IP failure bucket |
| Google | Existing Google subject | Existing citizen account is returned |
| Google | Link legacy social account using its authenticated session key | Account is linked without creating a duplicate citizen |
| Google | Attempt to claim an existing IG/TikTok username without the old session key | 409; existing account remains unchanged |
| Self recovery | Generate recovery code from an authenticated session | 16-character code displayed once; only hash is stored |
| Self recovery | Redeem valid recovery code | New session key returned; previous key no longer authenticates |
| Self recovery | Redeem the same code a second time | 401; no second session issued |
| Self recovery | Five invalid recovery attempts from one IP | 429; recovery attempts blocked for 15 minutes |
| Founder recovery | Secret missing or shorter than 32 characters | 503; no code issued |
| Founder recovery | Wrong Bearer secret | 401; no code issued |
| Founder recovery | Missing/short verification note | 400; no code issued |
| Founder recovery | Nonexistent citizen number | 404; no code issued |
| Founder recovery | Valid secret, existing synthetic citizen, adequate note | 24-character code returned once; expires in 10 minutes |
| Founder recovery | Redeem founder code twice | First succeeds; second returns 401 |
| Founder recovery | Inspect audit row after redemption | Issuance and redemption timestamps are recorded; no raw code or secret is stored |
| WebSocket | Request ticket with valid session | Short-lived ticket returned |
| WebSocket | Consume same ticket twice | First connection succeeds; replay is rejected |
| WebSocket | Consume expired ticket | 401; ticket cannot connect |
| WebSocket | Reconnect after disconnect | Client obtains a new ticket; does not reuse account key in URL |
| Regression | Load game and join multiplayer from two staging accounts | Both clients connect and see expected presence |
| Regression | Compare test citizen before/after auth tests | Coins, plots, inventory, avatar, missions and progress unchanged |

## Stage 3 — Browser/device checks

- Desktop Chrome: Google sign-in, citizen-code login, recovery UI, generate/copy code.
- Android Chrome: same flows, keyboard behavior, clipboard fallback.
- iOS Safari: same flows, clipboard permission/fallback, return from Google sign-in.
- Multiplayer: connect, move, disconnect, reconnect, and verify presence updates.
- Verify error messages do not expose session keys, recovery hashes, secrets, or stack traces.

## Stage 4 — Review and release gate

Do not merge until:
- latest GitHub Actions run is green;
- staging integration matrix is completed and results attached to PR #85;
- Durable Object schema changes are reviewed for existing SQLite databases;
- the founder recovery secret is created only in the intended Cloudflare environment;
- a human reviewer approves the security changes.

Do not deploy this branch to production as a test. Production release is a separate, explicitly approved action.

## Release blocker — unverified social-username registration

The public `POST /duniakotak/api/daftar-ig` route currently creates a citizen account using a caller-supplied Instagram or TikTok username without proving control of that social account. Existing username collisions are rejected, so this is not a direct takeover of an already registered citizen; however, an attacker can reserve an unclaimed username belonging to another person and block its legitimate owner from registering under that identity.

Do not describe social usernames as verified identities. Do not merge this patch as a complete identity-security solution until one of these product-safe remediations is implemented and tested:

1. Replace unauthenticated social-only registration with verified Google sign-in, then allow the user to add a social username to that authenticated account; or
2. Implement a real ownership challenge for Instagram/TikTok and verify the challenge server-side before activating the username.

The current registration page calls this endpoint directly. Do not simply disable it without updating the registration UX and testing the full onboarding flow. Until remediation is complete, treat social-only registration as a known release blocker. Preserve existing citizen records and do not alter live game data while implementing the change.
