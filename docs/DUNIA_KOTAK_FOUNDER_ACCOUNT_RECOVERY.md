# DUNIA KOTAK — Founder-assisted account recovery

This procedure is for the repository owner/founder only. It is not a public self-service endpoint.

## Security model

- The founder verifies ownership outside the game before issuing a recovery code.
- The API requires the Cloudflare Worker secret binding `FOUNDER_RECOVERY_SECRET`.
- The secret must be at least 32 characters, must never be committed to Git, and must never be sent to a player.
- A founder-issued code contains 24 characters from the recovery alphabet, is stored only as a SHA-256 hash, expires after 10 minutes, and can be redeemed once.
- Issuing a founder code replaces any previous self-service or founder recovery code for that citizen.
- Issuance and redemption are recorded in `founder_recovery_audit`. The audit stores a short verification note and a hashed IP, not the secret or the raw code.
- A successful recovery rotates the citizen session key and invalidates outstanding WebSocket tickets.

## Before enabling in production

1. Review and merge the security PR only after tests and human review pass.
2. In Cloudflare Dashboard, open the production Worker for `willoapparel`.
3. Open **Settings → Variables and Secrets**.
4. Add a **Secret** named `FOUNDER_RECOVERY_SECRET`.
5. Set a newly generated random value with at least 32 characters. Do not use a password reused elsewhere.
6. Save the secret and deploy the Worker. Do not put the value in `wrangler.jsonc`, source code, GitHub issues, chat, or screenshots.

The secret is not configured by this repository change. A Cloudflare account owner must add it in the dashboard.

## Manual recovery procedure

1. Ask the requester for their citizen number and verify account ownership using evidence already linked to the account plus an independent verification step. A public username by itself is not sufficient.
2. Do not ask for Google passwords, OTPs, existing session keys, or recovery codes.
3. Record a concise note describing the verification performed. Use at least 30 characters; avoid storing identity documents or unnecessary personal data.
4. From a trusted founder device, call the endpoint below. Keep the secret in an environment variable or secret manager, never inline in shell history.

```sh
export FOUNDER_RECOVERY_SECRET='REPLACE_WITH_CLOUDFLARE_SECRET'

curl --fail-with-body -X POST 'https://willoapparel.com/duniakotak/api/founder-recovery' \
  -H "Authorization: Bearer ${FOUNDER_RECOVERY_SECRET}" \
  -H 'Content-Type: application/json' \
  --data '{"no":123,"verification":"Verified through the account-linked channel and a separate ownership check."}'
```

Replace `123` with the exact citizen number. The API returns the raw recovery code once. Deliver it only through the verified private channel and tell the citizen to redeem it immediately. The code expires in 10 minutes.

5. The citizen opens `https://willoapparel.com/duniakotak/`, chooses account recovery, enters the code, and signs in.
6. Ask the citizen to generate a fresh self-service recovery code and store it securely.
7. If the request cannot be independently verified, do not issue a code. Escalate for a stronger manual verification rather than relying on social usernames.

## API contract

- Method/path: `POST /duniakotak/api/founder-recovery`
- Header: `Authorization: Bearer <FOUNDER_RECOVERY_SECRET>`
- JSON body:
  - `no`: positive integer citizen number
  - `verification`: 30–500 character audit note
- Success: `{ "no": number, "code": string, "expires": unix_milliseconds, "message": string }`
- Expected failures: `401` invalid founder secret, `400` invalid citizen number or short verification note, `404` citizen not found, `503` secret not configured.

## Operational safeguards

- Never merge/deploy solely because this document exists; complete the PR checks and manual review first.
- Rotate the Cloudflare secret immediately if it is exposed.
- Keep founder recovery access limited to the owner and a trusted break-glass operator.
- Review audit records after any disputed recovery. The audit table is internal and must not be exposed through public API routes.
