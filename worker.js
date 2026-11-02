// Pengunjung ASLI halaman produk untuk pop up "Seseorang dari <kota> sedang melihat halaman ini".
// Satu Durable Object per halaman. Menyimpan jumlah harian (WIB) dan kunjungan 30 menit terakhir
// berupa kota (dari Cloudflare) + id acak browser. Tanpa nama, email, atau IP.
import { DurableObject } from "cloudflare:workers";
export class Pengunjung extends DurableObject {
  async fetch(request) {
    const u = new URL(request.url);
    const now = Date.now();
    const hari = new Date(now + 7 * 3600 * 1000).toISOString().slice(0, 10);
    const v = (u.searchParams.get("v") || "").slice(0, 40);
    const kota = (u.searchParams.get("kota") || "").slice(0, 60);
    let n = (await this.ctx.storage.get(hari)) || 0;
    if (u.searchParams.get("tambah") === "1") {
      n += 1;
      await this.ctx.storage.put(hari, n);
    }
    let baru = ((await this.ctx.storage.get("baru")) || []).filter((x) => now - x.t < 30 * 60 * 1000);
    if (v && kota) {
      baru = baru.filter((x) => x.v !== v);
      baru.push({ v, kota, t: now });
      baru = baru.slice(-30);
      await this.ctx.storage.put("baru", baru);
    }
    const lain = baru.filter((x) => x.v !== v).reverse().slice(0, 3)
      .map((x) => ({ kota: x.kota, menit: Math.floor((now - x.t) / 60000) }));
    return Response.json({ hari, n, lain });
  }
}

// Warga Dunia Kotak (@duniakotak.id). Satu Durable Object "desa" berisi tabel warga (SQLite).
// Login Google: browser kirim ID token, worker memeriksanya ke Google lalu memberi nomor kavling berurutan.
// Email hanya disimpan di sini (untuk 1 akun = 1 kavling), TIDAK pernah ditampilkan ke publik.
const KAVLING_DISIAPKAN = {
  lalaliablue: 2, dian_semangat_terus: 3, "velora.nyxflare": 4, oredz_y: 5, dwabu7: 6, sayuti5044: 7,
  thzzz146: 8, "4rchive_nov4l": 9, chan_juan_0: 10, fakhri_udah_itu_aja_89: 11, nourma_mutiara_r: 12, ustadzriyan507349: 13,
};
export class Warga extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS warga (
      no INTEGER PRIMARY KEY AUTOINCREMENT, sub TEXT UNIQUE NOT NULL, email TEXT, nama TEXT,
      ig TEXT, usulan TEXT, dibuat INTEGER NOT NULL)`);
    // Kavling 1 = Raka. Kavling 2-13 sudah disiapkan di video Hari 2 untuk komentator yang minta rumah
    // (lihat KAVLING_DISIAPKAN). Pendaftar lain mulai dari kavling 14.
    if (!this.sql.exec("SELECT 1 FROM warga LIMIT 1").toArray().length) {
      this.sql.exec("DELETE FROM sqlite_sequence WHERE name = 'warga'");
      this.sql.exec("INSERT INTO sqlite_sequence (name, seq) VALUES ('warga', ?)", 13);
    }
  }
  publik(r) {
    return { no: r.no, ig: r.ig || "", usulan: r.usulan || "", dibuat: r.dibuat };
  }
  async fetch(request) {
    const u = new URL(request.url);
    const aksi = u.pathname.slice(1);
    if (aksi === "daftar") {
      const { sub, email, nama } = await request.json();
      let r = this.sql.exec("SELECT * FROM warga WHERE sub = ?", sub).toArray()[0];
      let baru = false;
      if (!r) {
        this.sql.exec("INSERT INTO warga (sub, email, nama, dibuat) VALUES (?, ?, ?, ?)", sub, email, nama, Date.now());
        r = this.sql.exec("SELECT * FROM warga WHERE sub = ?", sub).toArray()[0];
        baru = true;
      }
      return Response.json({ ...this.publik(r), nama: r.nama || "", baru });
    }
    if (aksi === "ig") {
      const { sub, ig } = await request.json();
      const ada = this.sql.exec("SELECT no FROM warga WHERE ig = ? AND sub != ?", ig, sub).toArray()[0];
      if (ada) return Response.json({ galat: "Username ini sudah dipakai warga No. " + ada.no }, { status: 409 });
      this.sql.exec("UPDATE warga SET ig = ? WHERE sub = ?", ig, sub);
      // Pindahkan ke kavling yang sudah disiapkan di video, kalau kavling itu masih kosong.
      const siap = KAVLING_DISIAPKAN[ig];
      if (siap && !this.sql.exec("SELECT 1 FROM warga WHERE no = ?", siap).toArray().length) {
        this.sql.exec("UPDATE warga SET no = ? WHERE sub = ?", siap, sub);
      }
      const r = this.sql.exec("SELECT * FROM warga WHERE sub = ?", sub).toArray()[0];
      return Response.json({ ...this.publik(r), nama: r.nama || "" });
    }
    if (aksi === "usulan") {
      const { sub, usulan } = await request.json();
      this.sql.exec("UPDATE warga SET usulan = ? WHERE sub = ?", usulan, sub);
      const r = this.sql.exec("SELECT * FROM warga WHERE sub = ?", sub).toArray()[0];
      return Response.json({ ...this.publik(r), nama: r.nama || "" });
    }
    if (aksi === "usulan-publik") {
      const rows = this.sql.exec("SELECT no, ig, usulan FROM warga WHERE usulan IS NOT NULL AND usulan != '' ORDER BY no").toArray();
      return Response.json({ jumlah: rows.length, usulan: rows });
    }
    if (aksi === "daftar-publik") {
      const rows = this.sql.exec("SELECT no, ig, usulan, dibuat FROM warga ORDER BY no").toArray();
      return Response.json({ jumlah: rows.length, warga: rows.map((r) => this.publik(r)) });
    }
    return new Response("{}", { status: 404 });
  }
}

// Periksa ID token Google (dari tombol "Lanjut dengan Google") ke server Google.
async function cekGoogle(env, credential) {
  if (!env.GOOGLE_CLIENT_ID || !credential || typeof credential !== "string" || credential.length > 4096) return null;
  const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
  if (!r.ok) return null;
  const t = await r.json();
  const okIss = t.iss === "accounts.google.com" || t.iss === "https://accounts.google.com";
  if (t.aud !== env.GOOGLE_CLIENT_ID || !okIss || Number(t.exp) * 1000 < Date.now() || !t.sub) return null;
  if (t.email_verified !== "true" && t.email_verified !== true) return null;
  return { sub: t.sub, email: t.email || "", nama: (t.given_name || t.name || "").slice(0, 60) };
}

async function apiWarga(request, env, url) {
  const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  const aksi = url.pathname.replace("/duniakotak/api/", "");
  if (aksi === "config") return json({ clientId: env.GOOGLE_CLIENT_ID || "" });
  if (!env.WARGA) return json({ galat: "Database warga belum aktif" }, 503);
  const stub = env.WARGA.get(env.WARGA.idFromName("desa"));
  if (aksi === "warga" && request.method === "GET") {
    return new Response((await stub.fetch("https://do/daftar-publik")).body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=30", "access-control-allow-origin": "*" } });
  }
  if (aksi === "usulan" && request.method === "GET") {
    return new Response((await stub.fetch("https://do/usulan-publik")).body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=30", "access-control-allow-origin": "*" } });
  }
  if (request.method !== "POST") return json({ galat: "Metode salah" }, 405);
  let body;
  try { body = await request.json(); } catch (e) { return json({ galat: "Data tidak terbaca" }, 400); }
  const g = await cekGoogle(env, body.credential);
  if (!g) return json({ galat: "Login Google tidak valid. Coba masuk lagi." }, 401);
  if (aksi === "daftar") {
    return new Response((await stub.fetch("https://do/daftar", { method: "POST", body: JSON.stringify(g) })).body, { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "ig") {
    const ig = String(body.ig || "").trim().replace(/^@/, "").toLowerCase();
    if (!/^[a-z0-9._]{1,30}$/.test(ig)) return json({ galat: "Username IG hanya huruf, angka, titik, garis bawah (maks 30)." }, 400);
    const r = await stub.fetch("https://do/ig", { method: "POST", body: JSON.stringify({ sub: g.sub, ig }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "usulan") {
    const usulan = String(body.usulan || "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 140);
    if (!usulan) return json({ galat: "Tulis usulanmu dulu." }, 400);
    return new Response((await stub.fetch("https://do/usulan", { method: "POST", body: JSON.stringify({ sub: g.sub, usulan }) })).body, { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  return json({ galat: "Tidak ada" }, 404);
}

// Berjalan sebelum file situs disajikan: alihkan www ke domain utama, sajikan beranda di "/".
// Juga mencatat kunjungan halaman ke Workers Analytics Engine (dataset willo_kunjungan):
// - "req":  setiap permintaan halaman HTML dari server (manusia + bot).
// - "view": sinyal dari browser yang menjalankan JavaScript (hampir pasti manusia), dikirim /_k.
// - "wa":   klik tombol WhatsApp, dikirim /_k dari wa-tag.js.
// Tidak menyimpan alamat IP.
function log(env, request, kind, path, ref) {
  if (!env.LOG) return;
  const cf = request.cf || {};
  let refHost = "";
  try { refHost = ref ? new URL(ref).hostname : ""; } catch (e) {}
  env.LOG.writeDataPoint({
    indexes: [kind],
    blobs: [
      kind,
      path.slice(0, 200),
      refHost.slice(0, 100),
      (request.headers.get("user-agent") || "").slice(0, 300),
      cf.country || "",
      (cf.asOrganization || "").slice(0, 100),
      new URL(request.url).hostname,
    ],
    doubles: [cf.asn || 0],
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    // Short link produk digital: /kantor-agent-ai, /kantoragentai, /KANTOR-AGENT-AI, dst.
    // Tanda baca yang ikut tersalin (":", ".", ")", "%3A", dst.) di ujung link diabaikan.
    let pendek = url.pathname.toLowerCase();
    try { pendek = decodeURIComponent(pendek); } catch (e) {}
    pendek = pendek.replace(/[^a-z0-9]+$/, "").replace(/[^a-z0-9/]/g, "");
    if (pendek === "/kantoragentai" || pendek === "/kantoragenai") {
      if (url.pathname !== "/kantor-agen-ai/") {
        url.pathname = "/kantor-agen-ai/";
        return Response.redirect(url.toString(), 301);
      }
    }
    if (url.pathname === "/_pengunjung") {
      // ?h=kantor-agen-ai&v=<id acak>[&tambah=1] → {hari, n: kunjungan hari ini, lain: [{kota, menit}]}
      const h = url.searchParams.get("h");
      if (!env.PENGUNJUNG || !["kantor-agen-ai"].includes(h)) return new Response("{}", { status: 404 });
      const stub = env.PENGUNJUNG.get(env.PENGUNJUNG.idFromName(h));
      const q = new URLSearchParams({
        tambah: url.searchParams.get("tambah") === "1" ? "1" : "0",
        v: url.searchParams.get("v") || "",
        kota: (request.cf && (request.cf.city || request.cf.region)) || "",
      });
      const r = await stub.fetch("https://do/?" + q);
      return new Response(r.body, { headers: { "content-type": "application/json", "cache-control": "no-store" } });
    }
    if (url.pathname.startsWith("/duniakotak/api/")) return apiWarga(request, env, url);
    if (pendek === "/warga" || pendek === "/daftarwarga") {
      url.pathname = "/duniakotak/";
      return Response.redirect(url.toString(), 302);
    }
    if (url.pathname === "/_k") {
      // Sinyal dari browser: ?t=view|wa&p=/halaman.html&r=<referrer asli>&u=<utm_source>
      const t = url.searchParams.get("t") === "wa" ? "wa" : "view";
      const p = (url.searchParams.get("p") || "/") + (url.searchParams.get("u") ? "?utm_source=" + url.searchParams.get("u") : "");
      try { log(env, request, t, p, url.searchParams.get("r") || ""); } catch (e) {}
      return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    }
    if (url.pathname.endsWith("/") || url.pathname.endsWith(".html")) {
      const p = url.pathname + (url.searchParams.get("utm_source") ? "?utm_source=" + url.searchParams.get("utm_source") : "");
      try { log(env, request, "req", p, request.headers.get("referer") || ""); } catch (e) {}
    }
    if (url.pathname.endsWith("/")) {
      url.pathname += "index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  },
};
