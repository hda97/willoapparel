import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const worker = readFileSync(new URL("../worker.js", import.meta.url), "utf8");
const wargaPage = readFileSync(new URL("../public/duniakotak/index.html", import.meta.url), "utf8");
const multiplayer = readFileSync(new URL("../public/duniakotak/mabar/game.js", import.meta.url), "utf8");
const gitignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");

test("native registration creates a DUNIA KOTAK account without Google or social identity", () => {
  const start = worker.indexOf('if (aksi === "daftar-native")');
  const end = worker.indexOf('if (aksi === "daftar-ig")', start);
  const handler = worker.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.ok(handler.includes('const rateId = "register:" + String(rateKey || "");'));
  assert.match(handler, /attempts >= 10/);
  assert.match(handler, /60 \* 60 \* 1000/);
  assert.match(handler, /sub = "dk:" \+ crypto\.randomUUID\(\)/);
  assert.match(handler, /this\.tambah\(\{ sub, nama, kerja \}\)/);
  assert.doesNotMatch(handler, /ig:|tiktok:/);
});

test("native registration API hashes the client IP before forwarding to the Durable Object", () => {
  const apiStart = worker.indexOf('async function apiWarga');
  const start = worker.indexOf('if (aksi === "daftar-native")', apiStart);
  const end = worker.indexOf('if (aksi === "daftar-ig")', start);
  const route = worker.slice(start, end);
  assert.ok(start > apiStart && end > start);
  assert.match(route, /CF-Connecting-IP/);
  assert.match(route, /dk-register-rate-v1/);
  assert.match(route, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(route, /daftar-native/);
});

test("native registration UI asks only for a game display name and optional occupation", () => {
  const start = wargaPage.indexOf('<div id="pDaftar">');
  const end = wargaPage.indexOf('<div id="pesanDaftar"', start);
  const form = wargaPage.slice(start, end);
  assert.match(form, /Buat akun DUNIA KOTAK/);
  assert.match(form, /Tidak perlu Google, Instagram, atau TikTok/);
  assert.match(form, /id="namaDaftar"/);
  assert.match(form, /id="kerjaDaftar"/);
  assert.doesNotMatch(form, /id="igDaftar"|id="ttDaftar"|data-cara=/);
  assert.match(wargaPage, /kirim\('daftar-native'/);
  assert.doesNotMatch(wargaPage, /kirim\('daftar-ig'/);
});

test("founder recovery route requires configured secret and bearer authorization", () => {
  const route = worker.slice(worker.indexOf('if (aksi === "founder-recovery")'), worker.indexOf('if (aksi === "ws-ticket")', worker.indexOf('if (aksi === "founder-recovery")')));
  assert.ok(route.length > 0, "founder route must exist before ws-ticket route");
  assert.match(route, /env\.FOUNDER_RECOVERY_SECRET/);
  assert.match(route, /configured\.length < 32/);
  assert.match(route, /authorization/);
  assert.match(route, /mismatch !== 0/);
  assert.match(route, /verification\.length < 30/);
  assert.match(route, /issue-founder-recovery/);
});

test("founder-issued recovery codes are random, one-time and expire after ten minutes", () => {
  const start = worker.indexOf('if (aksi === "issue-founder-recovery")');
  const end = worker.indexOf('if (aksi === "redeem-recovery")', start);
  const handler = worker.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(handler, /getRandomValues\(new Uint8Array\(24\)\)/);
  assert.match(handler, /now \+ 10 \* 60 \* 1000/);
  assert.match(handler, /DELETE FROM recovery_code WHERE no = \?/);
  assert.match(handler, /INSERT INTO recovery_code \(hash, no, created, expires, source\)/);
  assert.match(handler, /'founder'/);
  assert.doesNotMatch(handler, /INSERT INTO recovery_code[^\n]*\bcode\b/i);
});

test("redemption checks expiry, deletes the recovery code, rotates the session and invalidates WS tickets", () => {
  const start = worker.indexOf('if (aksi === "redeem-recovery")');
  const end = worker.indexOf('if (aksi === "consume-ws-ticket")', start);
  const handler = worker.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(handler, /row\.expires <= now/);
  assert.match(handler, /DELETE FROM recovery_code WHERE hash = \?/);
  assert.match(handler, /UPDATE warga SET kunci = \? WHERE no = \?/);
  assert.match(handler, /DELETE FROM ws_ticket WHERE no = \?/);
  assert.match(handler, /UPDATE founder_recovery_audit SET redeemed = \?/);
});

test("recovery attempts are rate-limited and raw IP is hashed before forwarding", () => {
  const start = worker.indexOf('if (aksi === "recovery-login")');
  const end = worker.indexOf('if (aksi === "founder-recovery")', start);
  const route = worker.slice(start, end);
  assert.match(route, /CF-Connecting-IP/);
  assert.match(route, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(route, /redeem-recovery/);
  const redeemStart = worker.indexOf('if (aksi === "redeem-recovery")');
  const redeemEnd = worker.indexOf('if (aksi === "consume-ws-ticket")', redeemStart);
  const redeem = worker.slice(redeemStart, redeemEnd);
  assert.match(redeem, /blocked_until > now/);
  assert.match(redeem, /attempts >= 5/);
});

test("self-service recovery UI calls the recovery API and limits the visible input to 32 characters", () => {
  assert.match(wargaPage, /id="kodePulih"[^>]*maxlength="32"/);
  assert.match(wargaPage, /kirim\('recovery-login'/);
  assert.match(wargaPage, /kirim\('recovery-code'/);
});

test("multiplayer client obtains a short-lived ticket instead of putting the account key in the WebSocket URL", () => {
  assert.match(multiplayer, /api\('ws-ticket'/);
  assert.match(multiplayer, /ticket=/);
  assert.doesNotMatch(multiplayer, /\?kunci=\$\{encodeURIComponent\(S\.kunci\)\}/);
});

test("recovery schema includes expiry, source and a founder audit trail", () => {
  assert.match(worker, /CREATE TABLE IF NOT EXISTS recovery_code/);
  assert.match(worker, /ALTER TABLE recovery_code ADD COLUMN expires/);
  assert.match(worker, /ALTER TABLE recovery_code ADD COLUMN source/);
  assert.match(worker, /CREATE TABLE IF NOT EXISTS founder_recovery_audit/);
  assert.match(worker, /ALTER TABLE founder_recovery_audit ADD COLUMN redeemed/);
});


test("local Wrangler state and environment secrets are excluded from Git", () => {
  assert.match(gitignore, /^\.wrangler\//m);
  assert.match(gitignore, /^\.dev\.vars$/m);
  assert.match(gitignore, /^\.env\.\*$/m);
});
