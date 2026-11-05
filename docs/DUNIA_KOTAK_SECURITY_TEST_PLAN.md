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

## Identity architecture decision — native DUNIA KOTAK accounts

DUNIA KOTAK accounts are native game accounts. Google sign-in is not required and must not be introduced as the default or mandatory identity provider.

- A citizen registers and signs in using a DUNIA KOTAK account identity and game-issued credentials.
- The account's public in-game username is independent of Instagram, TikTok, and YouTube usernames.
- Social handles are optional metadata only. They must never authenticate, reserve an account, prove ownership, or block another person from registering.
- Social handles may be collected later with explicit consent for optional community/market analytics, and must be clearly separated from authentication data.
- Existing citizens must retain their citizen number, plot, coins, inventory, avatar, missions, and progress. Existing legacy Google/social-linked accounts must continue to have a safe recovery path during any migration.

### Required implementation before merge

1. Design a native account identifier and authentication flow. Do not use a caller-supplied social handle as the account's unique key.
2. Decide the native credential model (for example, generated citizen login code plus one-time recovery code, or a separately designed password/passkey flow). Never treat a public username as a secret.
3. Add registration abuse controls (rate limits, duplicate prevention, and safe error responses).
4. Keep optional social handles in separate fields and only attach them after explicit user action; do not claim they are verified unless a real ownership challenge is implemented.
5. Update registration, login, account recovery, game client, and multiplayer session flows together.
6. Design and test a backward-compatible migration for existing records. Do not bulk rewrite live records or change production schema as part of staging work.
7. Run staging integration tests with synthetic citizens and prove that old citizens can still recover and enter their original plots.

### Identity acceptance tests

| Area | Test | Expected result |
|---|---|---|
| Registration | Register with a native game identity and no Google/social account | Citizen account is created |
| Registration | Omit all social handles | Registration succeeds |
| Registration | Supply another person's social username as optional text | It does not authenticate or reserve that social identity |
| Registration | Reuse an existing in-game username | Safe duplicate error; no existing account is modified |
| Login | Correct native credential | Only the matching citizen session is returned |
| Login | Username alone or social handle alone | No session is issued |
| Social metadata | Leave Instagram/TikTok/YouTube fields empty | Account remains fully playable |
| Social metadata | Add/remove optional handle | Authentication identity and game progress remain unchanged |
| Recovery | Use valid citizen recovery credential | Same citizen number and game progress are restored |
| Migration | Existing legacy citizen signs in/recover | Same citizen number, plot, coins, inventory, avatar, missions, and progress remain intact |

The existing public POST /duniakotak/api/daftar-ig flow does not satisfy this architecture: it creates accounts using unverified social handles as identity. The existing Google flow is also not the desired replacement. Do not simply switch off either path until a native registration/login flow and a backward-compatible legacy recovery path are implemented and tested.

Until that work is complete, keep this PR Draft and do not merge or deploy it.
