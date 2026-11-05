import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../worker.js", import.meta.url), "utf8");
const dashboard = await readFile(new URL("../public/duniakotak/founder-stats.html", import.meta.url), "utf8");
const wrangler = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");

test("founder statistics endpoint is read-only and protected by a secret", () => {
  assert.match(worker, /aksi === "founder\/stats"/);
  assert.match(worker, /env\.FOUNDER_STATS_TOKEN/);
  assert.match(worker, /const statsStub = env\.WARGA\.get/);
  assert.match(worker, /authorization/);
  assert.match(worker, /aksi === "statistik-founder"/);
  assert.match(worker, /SELECT COUNT\(\*\) AS total/);
  assert.match(worker, /dibuat >= \?/);
  assert.match(worker, /persetujuan: \{ tersedia: false/);
});

test("founder dashboard sends token in Authorization header and does not persist it", () => {
  assert.match(dashboard, /Authorization": "Bearer " \+ secret/);
  assert.match(dashboard, /founder\/stats/);
  assert.doesNotMatch(dashboard, /localStorage|sessionStorage/);
  assert.match(dashboard, /Belum tersedia/);
});

test("staging environment uses an isolated worker without production routes", () => {
  assert.match(wrangler, /"name": "willoapparel-staging"/);
  assert.match(wrangler, /"routes": \[\]/);
  assert.match(wrangler, /"ENVIRONMENT": "staging"/);
});
