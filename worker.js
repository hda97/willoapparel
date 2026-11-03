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
// Warga sementara = 63 pengikut @duniakotak.id per 2 Nov 2026 (urutan follow). Kavling 1 = Raka.
// Salah ketik yang sudah dipastikan (username salah → username benar).
const KOREKSI_IG = { fakhri_udah_itu_aja: "fakhri_udah_itu_aja_89" };

// Username yang terpotong di screenshot: dicocokkan dari awalannya.
const KAVLING_AWALAN = { muhammadfebriy: 10 };
function kavlingSiap(ig) {
  if (KAVLING_DISIAPKAN[ig]) return KAVLING_DISIAPKAN[ig];
  for (const [awal, no] of Object.entries(KAVLING_AWALAN)) if (ig.startsWith(awal)) return no;
  return 0;
}

const KAVLING_DISIAPKAN = {
  "fakhri_udah_itu_aja_89": 2,
  "thzzz146": 3,
  "akilq_plenger": 4,
  "narahukama": 5,
  "velora.nyxflare": 6,
  "friday_apyttt": 7,
  "dirga_ganteng61": 8,
  "eliezarmanglassa2004": 9,
  "iloveyou.singkatsaja": 11,
  "crab.7546898": 12,
  "napisahh_16": 13,
  "_1per.son_": 14,
  "oredz_y": 15,
  "ustadzriyan507349": 16,
  "arsalovemartabakmanis12": 17,
  "m.abidzarzalkaal": 18,
  "juan101762": 19,
  "rina_bunda5n": 20,
  "an.firoh": 21,
  "dian_semangat_terus": 22,
  "elfanother_world": 23,
  "fraditadestiyana": 24,
  "aliqhaisyanaramadhani": 25,
  "tiranosaurus905": 26,
  "gimzzzz6": 27,
  "sukma_syarie": 28,
  "exxel.ez": 29,
  "adhann_86": 30,
  "indahy1523": 31,
  "afid_ibnu": 32,
  "yd1ii__65aaa1": 33,
  "ivane198": 34,
  "aksashop_jambiborneo": 35,
  "alvarezzzzzz_28": 36,
  "lalaliablue": 37,
  "nahw_kfm": 38,
  "yanzzbukanflado": 39,
  "_itzzyr_kays": 40,
  "revanojonesh": 41,
  "vinsche.s": 42,
  "muh.pasya_": 43,
  "tsha_cntk": 44,
  "lcienron": 45,
  "ibanggkobaa_": 46,
  "lunlun.xb": 47,
  "archvien.a": 48,
  "zupzipzap7": 49,
  "ritodiaz_firentina": 50,
  "_diandra_putra_": 51,
  "anur98755": 52,
  "whoo.rapaaa": 53,
  "dinnandrai": 54,
  "dee4_12": 55,
  "boygilbert162": 56,
  "andyana_suherman": 57,
  "adilillahwijaya": 58,
  "lisya____llw_0006": 59,
  "xdzball": 60,
  "chan_juan_0": 61,
  "4rchive_nov4l": 62,
  "fajar_alflah": 63,
  "lie_yuann": 64,
};
export class Warga extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS warga (
      no INTEGER PRIMARY KEY AUTOINCREMENT, sub TEXT UNIQUE NOT NULL, email TEXT, nama TEXT,
      ig TEXT, usulan TEXT, dibuat INTEGER NOT NULL)`);
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN kunci TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN kode TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN avatar TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN tiktok TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN kerja TEXT"); } catch (e) { /* kolom sudah ada */ }
    // Koreksi salah ketik username: pindahkan ke username & kavling yang benar (sekali jalan, aman diulang).
    for (const [salah, benar] of Object.entries(KOREKSI_IG)) {
      const r = this.sql.exec("SELECT no FROM warga WHERE ig = ?", salah).toArray()[0];
      if (!r || this.sql.exec("SELECT 1 FROM warga WHERE ig = ?", benar).toArray().length) continue;
      const siap = kavlingSiap(benar);
      const kosong = siap && !this.sql.exec("SELECT 1 FROM warga WHERE no = ?", siap).toArray().length;
      this.sql.exec("UPDATE warga SET ig = ?, no = ? WHERE ig = ?", benar, kosong ? siap : r.no, salah);
    }
    // Kavling 1 = Raka. Kavling 2-64 disiapkan untuk 63 pengikut pertama (lihat KAVLING_DISIAPKAN).
    // Pendaftar lain mulai dari kavling 65.
    if (!this.sql.exec("SELECT 1 FROM warga LIMIT 1").toArray().length) {
      this.sql.exec("DELETE FROM sqlite_sequence WHERE name = 'warga'");
      this.sql.exec("INSERT INTO sqlite_sequence (name, seq) VALUES ('warga', ?)", 64);
    }
  }
  publik(r) {
    // Daftar lewat Google tanpa username: nama yang ditulis warga jadi ukiran batu (label).
    return { no: r.no, ig: r.ig || "", tiktok: r.tiktok || "", label: r.ig || r.tiktok ? "" : r.nama || "", usulan: r.usulan || "", dibuat: r.dibuat };
  }
  // Nama tampil di game & batu: username IG kalau ada, kalau tidak username TikTok.
  nm(r) { return r.ig || r.tiktok || r.nama || ""; }
  // Cek username IG/TikTok belum dipakai warga lain (selain baris "kecuali").
  bentrok(ig, tiktok, kecuali) {
    if (ig) { const a = this.sql.exec("SELECT no FROM warga WHERE ig = ? AND no != ?", ig, kecuali || 0).toArray()[0]; if (a) return "IG @" + ig + " sudah terdaftar sebagai warga No. " + a.no + "."; }
    if (tiktok) { const a = this.sql.exec("SELECT no FROM warga WHERE tiktok = ? AND no != ?", tiktok, kecuali || 0).toArray()[0]; if (a) return "TikTok @" + tiktok + " sudah terdaftar sebagai warga No. " + a.no + "."; }
    return "";
  }
  // Lengkapi data yang masih kosong (tidak menimpa username yang sudah ada).
  lengkapi(r, { ig, tiktok, namaWarga, kerja }) {
    if (kerja) { this.sql.exec("UPDATE warga SET kerja = ? WHERE no = ?", kerja, r.no); r.kerja = kerja; }
    if (ig && !r.ig && !this.bentrok(ig, "", r.no)) { this.sql.exec("UPDATE warga SET ig = ? WHERE no = ?", ig, r.no); r.ig = ig; }
    if (tiktok && !r.tiktok && !this.bentrok("", tiktok, r.no)) { this.sql.exec("UPDATE warga SET tiktok = ? WHERE no = ?", tiktok, r.no); r.tiktok = tiktok; }
    if (namaWarga) { this.sql.exec("UPDATE warga SET nama = ? WHERE no = ?", namaWarga, r.no); r.nama = namaWarga; }
  }
  // Tambah warga baru; pakai kavling yang disiapkan di video kalau username IG-nya ada di daftar & masih kosong.
  tambah({ sub, email, nama, ig, tiktok, kerja }) {
    const k = crypto.randomUUID();
    const siap = ig ? kavlingSiap(ig) : 0;
    const kosong = siap && !this.sql.exec("SELECT 1 FROM warga WHERE no = ?", siap).toArray().length;
    if (kosong) this.sql.exec("INSERT INTO warga (no, sub, email, nama, ig, tiktok, kunci, dibuat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", siap, sub, email || null, nama || null, ig || null, tiktok || null, k, Date.now());
    else this.sql.exec("INSERT INTO warga (sub, email, nama, ig, tiktok, kunci, dibuat) VALUES (?, ?, ?, ?, ?, ?, ?)", sub, email || null, nama || null, ig || null, tiktok || null, k, Date.now());
    if (kerja) this.sql.exec("UPDATE warga SET kerja = ? WHERE kunci = ?", kerja, k);
    return this.sql.exec("SELECT * FROM warga WHERE kunci = ?", k).toArray()[0];
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
      const siap = kavlingSiap(ig);
      if (siap && !this.sql.exec("SELECT 1 FROM warga WHERE no = ?", siap).toArray().length) {
        this.sql.exec("UPDATE warga SET no = ? WHERE sub = ?", siap, sub);
      }
      const r = this.sql.exec("SELECT * FROM warga WHERE sub = ?", sub).toArray()[0];
      return Response.json({ ...this.publik(r), nama: r.nama || "" });
    }
    if (aksi === "daftar-ig") {
      // Daftar tanpa Google (dipakai di dalam aplikasi IG/TikTok): cukup username IG atau TikTok.
      const { ig, tiktok, namaWarga, kerja } = await request.json();
      const salah = this.bentrok(ig, tiktok, 0);
      if (salah) return Response.json({ galat: salah }, { status: 409 });
      const r = this.tambah({ sub: ig ? "ig:" + ig : "tt:" + tiktok, nama: namaWarga, ig, tiktok, kerja });
      return Response.json({ ...this.publik(r), nm: this.nm(r), nama: r.nama || "", kunci: r.kunci, baru: true });
    }
    // ---- Game mabar: login Google, ditautkan ke kavling lama (tidak membuat kavling dobel) ----
    if (aksi === "google") {
      // Dipakai halaman daftar warga & game. Satu akun Google = satu kavling; kavling lama (daftar tanpa Google) ditautkan, tidak dobel.
      const { sub, email, nama, kunci, ig, tiktok, namaWarga, kerja, cari } = await request.json();
      const isi = { ig, tiktok, namaWarga, kerja };
      const keluar = (r, baru) => {
        if (!r.kunci) { r.kunci = crypto.randomUUID(); this.sql.exec("UPDATE warga SET kunci = ? WHERE no = ?", r.kunci, r.no); }
        return Response.json({ ...this.publik(r), nm: this.nm(r), nama: r.nama || "", kunci: r.kunci, baru: !!baru });
      };
      const tanpaGoogle = (r) => /^(ig|tt):/.test(String(r.sub));
      const tautkan = (r) => {
        this.sql.exec("UPDATE warga SET sub = ?, email = ? WHERE no = ?", sub, email, r.no);
        if (!namaWarga && !r.nama && nama) { this.sql.exec("UPDATE warga SET nama = ? WHERE no = ?", nama, r.no); r.nama = nama; }
        this.lengkapi(r, isi);
        return keluar(r);
      };
      let r = this.sql.exec("SELECT * FROM warga WHERE sub = ?", sub).toArray()[0];
      if (r) { this.lengkapi(r, isi); return keluar(r); }
      if (kunci) {
        r = this.sql.exec("SELECT * FROM warga WHERE kunci = ?", kunci).toArray()[0];
        if (r && tanpaGoogle(r)) return tautkan(r);
      }
      // Warga lama masuk dari HP lain: username IG/TikTok yang dulu dipakai daftar + akun Google ini.
      if (cari) {
        r = KOREKSI_IG[cari] ? this.sql.exec("SELECT * FROM warga WHERE ig = ?", KOREKSI_IG[cari]).toArray()[0] : null;
        r = r || this.sql.exec("SELECT * FROM warga WHERE ig = ? OR tiktok = ? ORDER BY no LIMIT 1", cari, cari).toArray()[0];
        if (!r) return Response.json({ galat: "@" + cari + " belum terdaftar. Daftar dulu di tab Daftar warga baru." }, { status: 404 });
        if (!tanpaGoogle(r)) return Response.json({ galat: "@" + cari + " sudah tersambung ke akun Google lain. Masuk pakai akun Google itu, atau DM @duniakotak.id." }, { status: 409 });
        return tautkan(r);
      }
      if (!ig && !tiktok && !namaWarga) return Response.json({ perlu: "ig" });
      for (const [kol, v] of [["ig", ig], ["tiktok", tiktok]]) {
        if (!v) continue;
        r = this.sql.exec(`SELECT * FROM warga WHERE ${kol} = ?`, v).toArray()[0];
        if (!r) continue;
        if (!tanpaGoogle(r)) return Response.json({ galat: "@" + v + " sudah ditautkan ke akun Google lain. DM @duniakotak.id kalau ini akunmu." }, { status: 409 });
        const lain = this.bentrok(ig, tiktok, r.no);
        if (lain) return Response.json({ galat: lain }, { status: 409 });
        return tautkan(r);
      }
      const salah = this.bentrok(ig, tiktok, 0);
      if (salah) return Response.json({ galat: salah }, { status: 409 });
      return keluar(this.tambah({ sub, email, nama: namaWarga || nama, ig, tiktok, kerja }), true);
    }
    // ---- Game mabar: sesi pakai kunci (HP pendaftar) atau kode warga 6 huruf (HP lain) ----
    if (aksi === "sesi" || aksi === "kode" || aksi === "avatar" || aksi === "profil") {
      const q = await request.json();
      let r;
      if (aksi === "kode") r = this.sql.exec("SELECT * FROM warga WHERE kode = ?", String(q.kode || "")).toArray()[0];
      else r = this.sql.exec("SELECT * FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      if (!r) return Response.json({ galat: aksi === "kode" ? "Kode warga tidak ditemukan." : "Data warga tidak ditemukan di HP ini." }, { status: 401 });
      if (!r.kode) {
        const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (let i = 0; i < 20; i++) {
          const b = crypto.getRandomValues(new Uint8Array(6));
          const k = [...b].map((x) => A[x % A.length]).join("");
          if (!this.sql.exec("SELECT 1 FROM warga WHERE kode = ?", k).toArray().length) { this.sql.exec("UPDATE warga SET kode = ? WHERE no = ?", k, r.no); r.kode = k; break; }
        }
      }
      if (aksi === "avatar") { this.sql.exec("UPDATE warga SET avatar = ? WHERE no = ?", String(q.avatar || "").slice(0, 600), r.no); r.avatar = q.avatar; }
      // Data Kartu Warga yang bisa diubah sendiri: nama & pekerjaan.
      if (aksi === "profil") {
        if (q.nama) { this.sql.exec("UPDATE warga SET nama = ? WHERE no = ?", q.nama, r.no); r.nama = q.nama; }
        if (q.kerja !== undefined) { this.sql.exec("UPDATE warga SET kerja = ? WHERE no = ?", q.kerja || null, r.no); r.kerja = q.kerja; }
      }
      let av = null; try { av = r.avatar ? JSON.parse(r.avatar) : null; } catch (e) {}
      return Response.json({ no: r.no, ig: this.nm(r), kode: r.kode, kunci: r.kunci, avatar: av, nama: r.nama || "", kerja: r.kerja || "", akunIg: r.ig || "", tiktok: r.tiktok || "", dibuat: r.dibuat });
    }
    if (aksi === "usulan-kunci") {
      const { kunci, usulan } = await request.json();
      const r0 = this.sql.exec("SELECT no FROM warga WHERE kunci = ?", kunci).toArray()[0];
      if (!r0) return Response.json({ galat: "Data pendaftaranmu tidak ditemukan di perangkat ini." }, { status: 401 });
      this.sql.exec("UPDATE warga SET usulan = ? WHERE kunci = ?", usulan, kunci);
      const r = this.sql.exec("SELECT * FROM warga WHERE kunci = ?", kunci).toArray()[0];
      return Response.json(this.publik(r));
    }
    if (aksi === "usulan") {
      const { sub, usulan } = await request.json();
      this.sql.exec("UPDATE warga SET usulan = ? WHERE sub = ?", usulan, sub);
      const r = this.sql.exec("SELECT * FROM warga WHERE sub = ?", sub).toArray()[0];
      return Response.json({ ...this.publik(r), nama: r.nama || "" });
    }
    if (aksi === "usulan-publik") {
      const rows = this.sql.exec("SELECT no, ig, tiktok, usulan FROM warga WHERE usulan IS NOT NULL AND usulan != '' ORDER BY no").toArray();
      return Response.json({ jumlah: rows.length, usulan: rows });
    }
    if (aksi === "daftar-publik") {
      // Gabungkan warga terdaftar dengan 63 pengikut awal yang kavlingnya sudah disiapkan (sudah warga sejak video).
      const rows = this.sql.exec("SELECT no, sub, nama, ig, tiktok, usulan, dibuat FROM warga ORDER BY no").toArray();
      const terisi = new Set(rows.map((r) => r.no));
      const igTerdaftar = new Set(rows.map((r) => r.ig).filter(Boolean));
      const awalan = Object.entries(KAVLING_AWALAN).map(([a, no]) => [a + "…", no]);
      const siap = [...Object.entries(KAVLING_DISIAPKAN), ...awalan]
        .filter(([ig, no]) => !terisi.has(no) && !igTerdaftar.has(ig))
        .map(([ig, no]) => ({ no, ig, tiktok: "", label: "", usulan: "", dibuat: 0 }));
      const semua = [...siap, ...rows.map((r) => this.publik(r))].sort((x, y) => x.no - y.no);
      return Response.json({ jumlah: semua.length, warga: semua });
    }
    return new Response("{}", { status: 404 });
  }
}

// ---- Ruang dusun untuk game mabar (willoapparel.com/duniakotak/mabar) ----
// Satu Durable Object per dusun. WebSocket: posisi warga + chat (Sekitar & Dusun) dengan 5 pengaman anak:
// saringan kata kasar, tolak nomor HP/link/@akun, batas kirim, laporkan (3 pelapor = bisu 1 jam), riwayat 7 hari.
const KATA_KASAR = ["anjing","anjir","anjrit","anying","bangsat","bajingan","babi","monyet","kampret","kontol","memek","ngentot","entot","jancok","jancuk","cuk","dancok","asu","bacot","tolol","goblok","goblog","bego","idiot","tai","taik","setan","sialan","brengsek","keparat","pantek","pepek","itil","lonte","pelacur","jablay","perek","bencong","banci","bodoh","dongo","kimak","pukimak","ngewe","coli","sange","bokep","porno","telanjang","jembut","silit","matamu","raimu","gathel","jamput","pecun","kafir","sundel","bajigur","budeg","cebong","kampang","tempik","turuk","tetek","toket","fuck","shit","bitch","dick","pussy","sex","seks"];
const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i" };
function saringChat(teks) {
  let m = String(teks || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!m) return { galat: "Pesan kosong." };
  const rapat = m.replace(/[\s.\-_()+]/g, "");
  if (/\d{8,}/.test(rapat) || /(\+62|\b08)\d{6,}/.test(rapat)) return { galat: "Demi keamanan, nomor dan link tidak boleh dikirim." };
  if (/(https?:|www\.|\.com|\.id\b|\.net|\.org|\.ly|wa\.me|t\.me|bit\.ly|s\.id|lynk|linktr)/i.test(m)) return { galat: "Demi keamanan, nomor dan link tidak boleh dikirim." };
  if (/@[a-z0-9._]{2,}/i.test(m)) return { galat: "Demi keamanan, nomor dan link tidak boleh dikirim." };
  m = m.split(/(\s+)/).map((w) => {
    if (/^\s+$/.test(w)) return w;
    const n = w.toLowerCase().replace(/[0134578@$!]/g, (c) => LEET[c] || c).replace(/[^a-z]/g, "").replace(/(.)\1+/g, "$1");
    return n && KATA_KASAR.some((k) => n === k.replace(/(.)\1+/g, "$1") || (k.length >= 5 && n.includes(k.replace(/(.)\1+/g, "$1")))) ? "★★★" : w;
  }).join("");
  return { m };
}
export class Ruang extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER, no INTEGER, ig TEXT, ch TEXT, m TEXT)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS lapor (pelapor INTEGER, terlapor INTEGER, t INTEGER, PRIMARY KEY (pelapor, terlapor))`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS bisu (no INTEGER PRIMARY KEY, sampai INTEGER)`);
    this.pos = new Map();
    this.kirimTerakhir = 0;
  }
  semua() { return this.ctx.getWebSockets().map((ws) => ({ ws, a: ws.deserializeAttachment() || {} })); }
  siar(o, kecuali) { const s = JSON.stringify(o); for (const { ws } of this.semua()) { if (ws !== kecuali) try { ws.send(s); } catch (e) {} } }
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      const u = new URL(request.url);
      if (u.pathname === "/online") return Response.json({ online: this.semua().filter((x) => x.a.no).length });
      return new Response("{}", { status: 404 });
    }
    const w = JSON.parse(request.headers.get("x-warga") || "{}");
    const [c, s] = Object.values(new WebSocketPair());
    // Satu warga = satu koneksi: tutup koneksi lama warga yang sama.
    for (const { ws, a } of this.semua()) if (a.no === w.no) { try { ws.close(4000, "Masuk dari tempat lain"); } catch (e) {} }
    this.ctx.acceptWebSocket(s);
    const p0 = { x: w.x || 0, z: w.z || 0, r: 0, a: 0 };
    s.serializeAttachment({ no: w.no, ig: w.ig, av: w.avatar || null, ...p0, kirim: 0 });
    const lain = this.semua().filter((x) => x.ws !== s && x.a.no).map(({ a }) => ({ no: a.no, ig: a.ig, av: a.av, ...(this.pos.get(a.no) || { x: a.x, z: a.z, r: a.r || 0, a: 0 }) }));
    const riwayat = this.sql.exec("SELECT t, no, ig, ch, m FROM chat WHERE ch = 'dusun' ORDER BY id DESC LIMIT 50").toArray().reverse();
    s.send(JSON.stringify({ t: "halo", saya: w.no, warga: lain, chat: riwayat }));
    this.siar({ t: "masuk", w: { no: w.no, ig: w.ig, av: w.avatar || null, ...p0 } }, s);
    return new Response(null, { status: 101, webSocket: c });
  }
  async webSocketMessage(ws, data) {
    let q; try { q = JSON.parse(data); } catch (e) { return; }
    const a = ws.deserializeAttachment() || {};
    if (!a.no) return;
    const now = Date.now();
    if (q.t === "p") {
      const p = { x: +q.x || 0, z: +q.z || 0, r: +q.r || 0, a: q.a ? 1 : 0 };
      if (![p.x, p.z, p.r].every(Number.isFinite)) return;
      this.pos.set(a.no, p);
      if (now - (a.simpan || 0) > 5000) { ws.serializeAttachment({ ...a, ...p, simpan: now }); }
      if (now - this.kirimTerakhir > 120) {
        this.kirimTerakhir = now;
        const daftar = []; for (const [no, v] of this.pos) daftar.push([no, Math.round(v.x * 10) / 10, Math.round(v.z * 10) / 10, Math.round(v.r * 100) / 100, v.a]);
        this.pos.clear();
        this.siar({ t: "p", d: daftar });
      }
      return;
    }
    if (q.t === "c") {
      const ch = q.ch === "dusun" ? "dusun" : "sekitar";
      const b = this.sql.exec("SELECT sampai FROM bisu WHERE no = ?", a.no).toArray()[0];
      if (b && b.sampai > now) { ws.send(JSON.stringify({ t: "tolak", m: "Kamu dibisukan sementara karena dilaporkan warga. Coba lagi nanti." })); return; }
      if (now - (a.kirim || 0) < 2000) { ws.send(JSON.stringify({ t: "tolak", m: "Pelan-pelan ya, 1 pesan tiap 2 detik." })); return; }
      const h = saringChat(q.m);
      if (h.galat) { ws.send(JSON.stringify({ t: "tolak", m: h.galat })); return; }
      ws.serializeAttachment({ ...a, kirim: now });
      this.sql.exec("INSERT INTO chat (t, no, ig, ch, m) VALUES (?, ?, ?, ?, ?)", now, a.no, a.ig, ch, h.m);
      if (Math.random() < 0.05) { this.sql.exec("DELETE FROM chat WHERE t < ?", now - 7 * 864e5); this.sql.exec("DELETE FROM lapor WHERE t < ?", now - 864e5); }
      this.siar({ t: "c", no: a.no, ig: a.ig, ch, m: h.m, w: now });
      return;
    }
    if (q.t === "e") { const e = ["sapa", "hati", "tawa", "main"].includes(q.e) ? q.e : null; if (e && now - (a.emote || 0) > 1500) { ws.serializeAttachment({ ...a, emote: now }); this.siar({ t: "e", no: a.no, e }); } return; }
    if (q.t === "av") { const av = q.av && typeof q.av === "object" ? q.av : null; ws.serializeAttachment({ ...a, av }); this.siar({ t: "av", no: a.no, av }, ws); return; }
    if (q.t === "lapor") {
      const t = Math.floor(+q.no); if (!t || t === a.no) return;
      this.sql.exec("INSERT OR REPLACE INTO lapor (pelapor, terlapor, t) VALUES (?, ?, ?)", a.no, t, now);
      const n = this.sql.exec("SELECT COUNT(*) AS n FROM lapor WHERE terlapor = ? AND t > ?", t, now - 864e5).toArray()[0].n;
      if (n >= 3) { this.sql.exec("INSERT OR REPLACE INTO bisu (no, sampai) VALUES (?, ?)", t, now + 3600e3); this.sql.exec("DELETE FROM lapor WHERE terlapor = ?", t); }
      ws.send(JSON.stringify({ t: "info", m: "Laporan terkirim. Terima kasih sudah menjaga desa." }));
    }
  }
  async webSocketClose(ws) { const a = ws.deserializeAttachment() || {}; if (a.no) { this.pos.delete(a.no); this.siar({ t: "keluar", no: a.no }, ws); } }
  async webSocketError(ws) { return this.webSocketClose(ws); }
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

// Rapikan username yang diketik/ditempel: buang @, spasi, huruf besar, dan link profil (instagram.com/x, tiktok.com/@x).
function bersihUn(v) {
  return String(v || "").toLowerCase().replace(/\s+/g, "")
    .replace(/^(https?:\/\/)?(www\.|m\.|vt\.)?(instagram\.com|tiktok\.com)\//, "")
    .replace(/[?#].*$/, "").replace(/\/.*$/, "").replace(/^@+/, "");
}
// Baca isian daftar: username IG / TikTok (boleh salah satu) dan nama warga (opsional, disaring kata kasar).
function bacaAkun(body) {
  let ig = bersihUn(body.ig), tiktok = bersihUn(body.tiktok);
  if (ig && !/^[a-z0-9._]{1,30}$/.test(ig)) return { galat: "@" + ig.slice(0, 40) + " bukan username Instagram yang benar. Hanya huruf, angka, titik, garis bawah (maks 30)." };
  if (tiktok && !/^[a-z0-9._]{2,24}$/.test(tiktok)) return { galat: "@" + tiktok.slice(0, 40) + " bukan username TikTok yang benar. Hanya huruf, angka, titik, garis bawah (2-24 karakter)." };
  ig = KOREKSI_IG[ig] || ig;
  const namaWarga = String(body.nama || "").replace(/[\u0000-\u001f<>@]/g, " ").replace(/\s+/g, " ").trim().slice(0, 24);
  if (namaWarga && saringChat(namaWarga).m !== namaWarga) return { galat: "Nama itu tidak bisa dipakai. Pakai nama yang sopan ya." };
  const kerja = String(body.kerja || "").replace(/[\u0000-\u001f<>@]/g, " ").replace(/\s+/g, " ").trim().slice(0, 22);
  if (kerja && saringChat(kerja).m !== kerja) return { galat: "Pekerjaan itu tidak bisa dipakai. Pakai kata yang sopan ya." };
  return { ig, tiktok, namaWarga, kerja };
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
  if (aksi === "ruang") {
    // WebSocket game: ?dusun=wetan&kunci=...
    if (request.headers.get("Upgrade") !== "websocket") return json({ galat: "Butuh WebSocket" }, 426);
    if (!env.RUANG) return json({ galat: "Ruang belum aktif" }, 503);
    const kunci = String(url.searchParams.get("kunci") || "").slice(0, 64);
    const r = await stub.fetch("https://do/sesi", { method: "POST", body: JSON.stringify({ kunci }) });
    if (!r.ok) return json({ galat: "Masuk dulu sebagai warga." }, 401);
    const w = await r.json();
    const dusun = ["wetan"].includes(url.searchParams.get("dusun")) ? url.searchParams.get("dusun") : "wetan";
    const h = new Headers(request.headers);
    h.set("x-warga", JSON.stringify({ no: w.no, ig: w.ig, avatar: w.avatar, x: +url.searchParams.get("x") || 0, z: +url.searchParams.get("z") || 0 }));
    return env.RUANG.get(env.RUANG.idFromName(dusun)).fetch(new Request("https://do/ws", { headers: h }));
  }
  if (aksi === "online" && request.method === "GET") {
    if (!env.RUANG) return json({ online: 0 });
    const r = await env.RUANG.get(env.RUANG.idFromName("wetan")).fetch("https://do/online");
    return new Response(r.body, { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "usulan" && request.method === "GET") {
    return new Response((await stub.fetch("https://do/usulan-publik")).body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=30", "access-control-allow-origin": "*" } });
  }
  if (request.method !== "POST") return json({ galat: "Metode salah" }, 405);
  let body;
  try { body = await request.json(); } catch (e) { return json({ galat: "Data tidak terbaca" }, 400); }
  const bersihUsulan = (v) => String(v || "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 140);
  if (aksi === "daftar-ig") {
    const d = bacaAkun(body);
    if (d.galat) return json({ galat: d.galat }, 400);
    if (!d.ig && !d.tiktok) return json({ galat: "Isi username Instagram atau TikTok (salah satu cukup)." }, 400);
    const r = await stub.fetch("https://do/daftar-ig", { method: "POST", body: JSON.stringify(d) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "profil") {
    const bersih = (v, n) => String(v || "").replace(/[\u0000-\u001f<>@]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
    const q = { kunci: String(body.kunci || "").slice(0, 64), nama: bersih(body.nama, 24), kerja: bersih(body.kerja, 22) };
    for (const v of [q.nama, q.kerja]) if (v && saringChat(v).m !== v) return json({ galat: "Kata itu tidak bisa dipakai. Pakai kata yang sopan ya." }, 400);
    const r = await stub.fetch("https://do/profil", { method: "POST", body: JSON.stringify(q) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "sesi" || aksi === "kode" || aksi === "avatar") {
    const q = aksi === "kode" ? { kode: String(body.kode || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) } : { kunci: String(body.kunci || "").slice(0, 64) };
    if (aksi === "avatar") { try { q.avatar = JSON.stringify(body.avatar || {}).slice(0, 600); } catch (e) { return json({ galat: "Avatar tidak terbaca" }, 400); } }
    const r = await stub.fetch("https://do/" + aksi, { method: "POST", body: JSON.stringify(q) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "usulan" && body.kunci) {
    const usulan = bersihUsulan(body.usulan);
    if (!usulan) return json({ galat: "Tulis usulanmu dulu." }, 400);
    const r = await stub.fetch("https://do/usulan-kunci", { method: "POST", body: JSON.stringify({ kunci: String(body.kunci).slice(0, 64), usulan }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  const g = await cekGoogle(env, body.credential);
  if (!g) return json({ galat: "Login Google tidak valid. Coba masuk lagi." }, 401);
  if (aksi === "google") {
    const d = bacaAkun(body);
    if (d.galat) return json({ galat: d.galat }, 400);
    const cari = bersihUn(body.cari);
    if (cari && !/^[a-z0-9._]{1,30}$/.test(cari)) return json({ galat: "Username hanya huruf, angka, titik, garis bawah (maks 30)." }, 400);
    const r = await stub.fetch("https://do/google", { method: "POST", body: JSON.stringify({ ...g, ...d, cari, kunci: String(body.kunci || "").slice(0, 64) }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "daftar") {
    return new Response((await stub.fetch("https://do/daftar", { method: "POST", body: JSON.stringify(g) })).body, { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "ig") {
    const ig = bersihUn(body.ig);
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
