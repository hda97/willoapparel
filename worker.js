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
// Voting fasum berbintang (Huda 6 Nov 2026): 1 bintang gratis per hari (WIB) + bintang donasi (Rp1.000 = 1 bintang).
// Huda 8 Nov 2026: donasi pindah ke Trakteer (trakteer.id/duniakotak.id, unit "Bata" Rp5.000). Webhook Saweria tetap diterima.
// Ganti PUTARAN untuk membuka putaran voting baru (suara putaran lama tetap tersimpan). Calon bisa ditambah/diubah di CALON_FASUM.
const PUTARAN_VOTING = "2026-11";
// Siklus mingguan (Huda 8 Nov 2026): voting 1 minggu → pemenang dibangun 7 hari → voting fasum lain dibuka.
// Setelah VOTING_TUTUP suara ditolak dan pop up wajib tidak muncul sampai putaran baru (ganti PUTARAN_VOTING, CALON_FASUM, VOTING_TUTUP).
const VOTING_TUTUP = Date.parse("2026-11-14T00:00:00+07:00");
// Stream Key Saweria bisa disetel lewat halaman /duniakotak/atur-saweria.html (Huda tidak menemukan worker di Cloudflare).
// Halaman itu butuh token setel; di sini hanya hash SHA-256-nya (token asli dikirim ke Huda lewat chat proyek).
const HASH_TOKEN_SETEL = "3875bd9e3be8eb385420fc08c7acbb25d81b72d5581356c72a210d4b87df4510";
// Huda 6 Nov 2026: cukup 4 calon (usulan terbanyak dari komentar); fasum lain untuk voting berikutnya.
// 6 Nov 2026 Huda menutup voting → Taman Kota dibangun (game.js BANGUN_VOTING); taman keluar dari calon, bintangnya dikembalikan.
const CALON_FASUM = ["kafe", "hiburan", "polisi"];
// Toko Hias (Huda 6 Nov 2026): barang hias dibeli PERMATA (dari donasi Saweria: Rp1.000 = 1 bintang + 10 permata)
// atau koin (lebih mahal). Barang pertama tiap jenis gratis. Permata tidak masuk peringkat & tidak bisa jadi koin.
const PERMATA_PER_RIBU = 10;
// ---- Hadiah pendukung "Bata" (Huda 8 Nov 2026, terinspirasi sistem "Genteng" @negerikomen, tetap lewat Saweria) ----
// 1 Bata = Rp5.000 (= 5 bintang + 50 permata, konversi lama tetap). Semua hadiah hanya hiasan & gelar, tanpa keuntungan main.
// Total 1 Bata: label 🧱 + nama di kartu terima kasih video. Total 2 Bata: Bendera Emas permanen di rumah.
// Donatur terbesar minggu ini (Senin–Minggu WIB) = Juragan Bata: mahkota di atap, pindah tangan saat disalip.
// Tiap kelipatan 20 Bata: nama di plakat fasum yang sedang dibangun saat itu. Pengusul pertama fasum pemenang = Bos fasum (gratis).
const BATA_RP = 5000, BATA_BENDERA = 2, BATA_PLAKAT = 20;
// Fasum yang sedang dibangun (samakan dengan BANGUN_VOTING di game.js). Setelah `sampai`, plakat baru masuk ke fasum berikutnya.
const BANGUN_SEKARANG = [{ id: "taman", sampai: Date.parse("2026-11-14T00:00:00+07:00") }];
// Kata kunci usulan warga (kolom usulan saat daftar) untuk mencari pengusul pertama tiap fasum pemenang/calon.
// Bisa ditimpa manual lewat BOS_TETAP (mis. { taman: 48 }) bila pengusul yang ditemukan otomatis kurang tepat.
const BOS_TETAP = {};
const KATA_FASUM = { taman: /taman\s*(kota|desa)|^\s*(bikin |bangun |buat )?taman(\s+(dan|&|yang|dengan)\b|\s*$)/i, kafe: /\b(kafe|cafe|coffee|kopi|ngopi)/i, hiburan: /hiburan|wahana|pasar malam|taman bermain|dufan/i, polisi: /polisi|polsek|polres/i };
const TOKO_HIAS = {
  cat: { krem: 0, putih: 30, biru: 30, hijau: 30, pink: 30, kuning: 30, ungu: 30 },
  pagar: { putih: 0, kayu: 20, hitam: 20, biru: 20, merah: 20 },
  topi: { tanpa: 0, merah: 20, biru: 20, hitam: 20, kuning: 20 },
  // Huda 6 Nov 2026: rumah warga bisa di-upgrade sampai 2 lantai (rumah kucing tidak, hanya ganti warna di menu Kucing)
  rumah: { satu: 0, dua: 150 },
};
// Rakit Hiasan (Huda 6 Nov 2026): barang pungutan (apel, bunga, kayu, daun, batu, jamur) dirakit jadi hiasan pekarangan.
// Bahan dihitung di tas warga (HP); server menyimpan hiasan yang dimiliki & dipasang supaya terlihat warga lain.
const DEKOR = ["bangku", "pot", "lampu", "keranjang", "jamur", "kolam"];
const RESEP_DEKOR = { bangku: { Kayu: 3, "Batu kotak": 1 }, pot: { Bunga: 2, Daun: 1, "Batu kotak": 1 }, lampu: { Kayu: 2, "Batu kotak": 2 }, keranjang: { Apel: 3, Kayu: 1, Daun: 1 }, jamur: { Jamur: 3, Daun: 1 } };
// Tas warga disimpan di SERVER (audit ekonomi 6 Nov 2026): barang pungutan & hasil mancing tidak bisa diakali lewat HP.
const BARANG = { Apel: "🍎", Bunga: "🌼", Kayu: "🪵", Jamur: "🍄", "Batu kotak": "🪨", Daun: "🍃" };
const IKAN = [[35, "🐟", "Ikan mas"], [28, "🐠", "Ikan nila"], [18, "🐡", "Ikan buntal kotak"], [11, "🦐", "Udang"], [5, "👟", "Sepatu bekas"], [3, "🦀", "Kepiting langka"]];
const BATAS_AMBIL = 60, BATAS_MANCING = 40;   // per hari WIB
// Album Ikan & Panen (Huda 9 Nov 2026): koleksi pertama kali dapat tiap ikan (mancing) & hasil kebun (panen), disimpan di tas._al
// {nama: waktu}. Album lengkap = lencana (tampilan saja): bit 1 = 🎣 semua ikan, bit 2 = 🧺 semua hasil panen (tas._alb).
const ALBUM_IKAN = IKAN.map((i) => i[2]);
// Pasar Malam Sabtu (Huda 9 Nov 2026): tiap Sabtu 19.00–23.00 WIB di lapangan Stadion Kotak Wetan. Jajan & Lempar Gelang bayar koin
// (penyerap koin mengendap). Lempar Gelang kena >= 2 dari 3 = suvenir acak masuk tas & Album (lengkap 5 = lencana 🎪, bit 4).
const PASAR_JAJAN = { sate: ["🍢", "Sate", 6], martabak: ["🥞", "Martabak", 8], dawet: ["🥤", "Es dawet", 3], gulali: ["🍭", "Gulali", 4], jagung: ["🌽", "Jagung bakar", 5] };
const PASAR_GELANG = 10, PASAR_GELANG_HARI = 10, PASAR_JAJAN_HARI = 20;
const SUVENIR = [["🧸", "Boneka beruang"], ["🐰", "Boneka kelinci"], ["🎈", "Balon"], ["🪀", "Yoyo"], ["🏮", "Lampion"]];
const pasarBuka = (t) => { const d = new Date(t + 7 * 3600e3); return d.getUTCDay() === 6 && d.getUTCHours() >= 19 && d.getUTCHours() < 23; };
const KOIN_PER_PERMATA = 10;
// Pelari Kalcer Dunia Kotak (Huda 7 Nov 2026): koin game lari = koin Dunia Kotak (satu dompet), top up Saweria = permata.
// Koin hasil lari dibatasi supaya ekonomi desa tidak banjir: maks PK_MAKS_LARI per lari, PK_MAKS_HARI per hari WIB,
// dan lari baru dihitung bila jarak waktu "mulai" ke "selesai" >= PK_MIN_LARI (lari 1 KM normal ±1,5-2 menit).
// Harga barang toko lari (dalam koin; bayar permata = harga / KOIN_PER_PERMATA dibulatkan ke atas). Sama dengan
// pelarikalcer-kotak/src/main.js. Bekal (PK_BEKAL) habis sekali pakai, sisanya barang milik permanen.
const PK_MAKS_LARI = 50, PK_MAKS_HARI = 150, PK_MIN_LARI = 45e3;
// Rekor 1 KM: waktu game tercepat yang masuk akal (sepatu+bekal terbaik, sprint penuh ±3:00). Di bawah ini ditolak.
// Audit #3: dinaikkan ke 4:00 (rekor asli tercepat 9 Nov = 5:10) supaya rekor palsu lewat HP tidak masuk. Turunkan bila pelari asli mendekati.
const PK_REKOR_MIN = 240, PK_SKALA_WAKTU = 3.4;
// Misi harian (Huda 8 Nov): 3 misi per hari (lari1 selalu ada + 2 acak menurut tanggal, sama untuk semua warga), hadiah 10 koin.
const PK_MISI_KOIN = 10;
// Misi harian DESA "Ikut lari Pelari Kalcer" (Huda 8 Nov): tetap tiap hari, selesai otomatis saat finish 1 KM, di luar undian 6 misi & bonus.
const PK_MISI_DESA = 15;
// Lintasan (Huda 9 Nov): 7 rute 1 KM, urutan sama dengan pelarikalcer-kotak/src/lintasan.js. Rute ke-n terbuka setelah finish
// sah rute ke-(n-1); progres disimpan di kolom pelari ($.rb = indeks rute tertinggi yang terbuka).
// Piala Antardusun Mingguan (Huda 9 Nov 2026): tiap finish Pelari Kalcer & gol stadion = poin untuk dusun warga itu.
// Minggu = Senin 00.00 – Minggu 23.59 WIB (sama dengan Juragan Minggu Ini). Dusun dengan poin terbanyak = juara minggu itu:
// bendera emas di gapura dusunnya selama minggu berikutnya. Hadiah hanya tampilan/gelar (tidak menambah koin/permata).
// Batas harian per warga supaya satu orang tidak bisa memborong poin dusun: 3 finish berpoin + 5 gol berkoin.
// Ajak Tetangga (Huda 9 Nov 2026): link willoapparel.com/duniakotak/?ajak=<no>. Pendaftar baru lewat link itu dicatat (kolom ajak).
// Hadiah baru dibayar saat warga baru menyelesaikan misi pemula ke-2 (🌱 tanam), supaya akun asal daftar tidak berhadiah.
// Pengajak +AJAK_PERMATA, yang diajak +AJAK_PERMATA_BARU; pengajak maks AJAK_HARI hadiah per hari WIB. Target = Segara dibuka di warga ke-861.
// Lomba Rumah Terindah (Huda 9 Nov 2026): tiap warga punya RUMAH_SUKA_HARI ❤️ gratis per hari WIB untuk rumah warga lain
// (bukan rumah sendiri/Raka, 1 rumah sekali per hari). Minggu Senin–Minggu WIB; rumah dengan ❤️ terbanyak = juara minggu itu:
// piala emas di atas rumah + lencana 🏡 selama minggu berikutnya (hanya tampilan). Juara masuk Vlog Raka (konten).
const RUMAH_SUKA_HARI = 3;
const AJAK_PERMATA = 10, AJAK_PERMATA_BARU = 5, AJAK_HARI = 5, AJAK_TARGET = 861;
const PIALA_LARI = 10, PIALA_LARI_HARI = 3, PIALA_GOL = 2;
const PIALA_DUSUN = ["wetan", "kulon", "curug", "tlaga", "segara"];
const dusunNo = (no) => (no > 860 ? "segara" : no > 660 ? "tlaga" : no > 460 ? "curug" : no > 260 ? "kulon" : "wetan");
const PK_RUTE = ["CFD Kotak Wetan", "Jakarta Sudirman CFD", "Jogja Borobudur", "Bali Sanur", "Siksorogo Lawu", "Bromo Trail", "Dieng & Rinjani"];
const PK_MISI = { lari1: (p) => p.fh >= 1, lari3: (p) => p.fh >= 3, koin30: (p) => p.km >= 30, top5: (p) => p.pb > 0 && p.pb <= 5, iso: (p) => !!p.iso, mulus: (p) => !!p.mulus, cepat: (p) => p.rh > 0 && p.rh <= 330 };
function pkMisiHari(hari) { const lain = Object.keys(PK_MISI).slice(1); let h = 0; for (const c of hari) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = lain[h % lain.length], sisa = lain.filter((x) => x !== a); return ["lari1", a, sisa[(h >>> 8) % sisa.length]]; }
const PK_BEKAL = ["isotonik", "gel", "pisang", "kopi", "bakmi"];
// Item keren khusus 💎 (Huda 8 Nov): outfit toko, aksesori gengsi, sepatu & jam tier 3-4. Sisanya koin lari.
const PK_GENGSI = ["waist_bag", "sunglasses_matte", "handuk", "ransel", "hydration_vest", "grail_trail_pack"];
const pkPermata = (id) => ["trail_sandstone", "solomate_carbon", "nyx_hyperfoam", "coro_pro", "titanium_ultra"].includes(id) || PK_GENGSI.includes(id) || /^(kaos|bawah|topi)-/.test(id);
const PK_HARGA = {"isotonik": 15, "gel": 20, "pisang": 10, "kopi": 25, "bakmi": 30, "daily_oat": 50, "trail_sandstone": 85, "solomate_carbon": 140, "nyx_hyperfoam": 240, "willo_sport": 45, "coro_pro": 95, "titanium_ultra": 220, "waist_bag": 15, "sunglasses_matte": 35, "handuk": 40, "ransel": 50, "hydration_vest": 75, "grail_trail_pack": 260, "kaos-3": 30, "kaos-4": 30, "kaos-5": 30, "kaos-6": 30, "kaos-11": 45, "kaos-12": 50, "kaos-13": 50, "kaos-14": 35, "kaos-15": 35, "kaos-16": 35, "kaos-17": 35, "kaos-18": 35, "kaos-19": 45, "kaos-20": 45, "bawah-9": 35, "bawah-10": 35, "bawah-11": 25, "bawah-12": 25, "bawah-13": 35, "bawah-14": 40, "bawah-15": 40, "bawah-16": 40, "topi-7": 20, "topi-8": 20, "topi-9": 20};
// Iklan berhadiah Google H5 Games Ads (Huda 6 Nov 2026): warga MEMILIH sendiri menonton iklan → +3 permata, maks 3x/hari WIB.
// Hanya permata (bukan koin). Menyala bila variabel IKLAN_H5 = "1" (setelah Google menyetujui H5 Games Ads).
const IKLAN_PERMATA = 3, IKLAN_BATAS = 3, IKLAN_MIN = 8000;
// Panen kebun sendiri (Huda 6 Nov 2026): permata juga didapat dari panen, tiap 6 jam sekali, +5 permata.
const PANEN_JEDA = 6 * 3600e3, PANEN_PERMATA = 2;
// Bibit & jual hasil panen (audit ekonomi, Huda 6 Nov 2026): bibit dibeli koin tiap tanam, panen = 5 hasil + 2 permata,
// hasil dijual di warung depan rumah (batas 60 hasil/hari). Untung terbaik +20 koin per panen (cabai).
const albumBit = (al) => (ALBUM_IKAN.every((n) => al[n]) ? 1 : 0) | (Object.values(BIBIT).every((b) => al[b.nama]) ? 2 : 0) | (SUVENIR.every((x) => al[x[1]]) ? 4 : 0);
const BIBIT = { tomat: { nama: "Tomat", ikon: "🍅", harga: 10, hasil: 5, jual: 6 }, jagung: { nama: "Jagung", ikon: "🌽", harga: 20, hasil: 5, jual: 9 }, cabai: { nama: "Cabai", ikon: "🌶️", harga: 30, hasil: 5, jual: 14 } };
const BATAS_JUAL = 60;
// Audit ekonomi #2 (Huda 6 Nov 2026): harga jual kebun naik (tomat 6, jagung 9, cabai 14) dan IKAN bisa dijual di warung
// (ikut batas 60/hari). 2 ikan termurah selalu disisakan untuk makan kucing.
const JUAL_IKAN = { "Ikan mas": 2, "Ikan nila": 3, "Ikan buntal kotak": 5, "Udang": 6, "Kepiting langka": 15 };
const SISA_IKAN = 2;
// Hiasan pekarangan bisa dibeli pakai KOIN (penyerap koin), selain dirakit dari bahan. Kolam ikan hanya bisa dibeli.
const DEKOR_KOIN = { bangku: 100, pot: 100, lampu: 150, keranjang: 120, jamur: 100, kolam: 800 };
// Profesi (audit ekonomi, Huda 6 Nov 2026): dibuka dengan menukar permata di Kantor Desa; gaji SAMA untuk semua profesi
// (permata hanya membeli pilihan profesi + seragam, bukan gaji lebih besar). Petani & pedagang gratis (penghasilan dari kebun/warung).
// siap:false = fasum tempat kerjanya belum berdiri (tunggu menang voting).
const PROFESI = {
  petani: { nama: "Petani", ikon: "🧑‍🌾", harga: 0 }, pedagang: { nama: "Pedagang", ikon: "🧺", harga: 0 },
  guru: { nama: "Guru", ikon: "🧑‍🏫", harga: 50 }, perawat: { nama: "Perawat", ikon: "💉", harga: 50 }, dokter: { nama: "Dokter", ikon: "🩺", harga: 80 },
  kasir: { nama: "Kasir", ikon: "🛒", harga: 30 }, wasit: { nama: "Wasit", ikon: "🟨", harga: 30 },
  polisi: { nama: "Polisi", ikon: "👮", harga: 50, siap: false }, barista: { nama: "Barista", ikon: "☕", harga: 30, siap: false },
};
// Iuran pembangunan (Huda 6 Nov 2026, kartu "Bar progres pembangunan"): pemenang voting dibangun dalam 7 hari setelah voting ditutup;
// tiap 1.000 koin iuran warga mempercepat 1 hari (maks 7.000 = langsung dibangun). Permata dihitung 10 koin, maks 50 💎 per warga per minggu.
// Iuran TIDAK ikut menentukan pemenang (voting tetap pakai bintang) dan tidak masuk peringkat.
const IURAN_HARI = 7, IURAN_PER_HARI = 1000, IURAN_PERMATA_MINGGU = 50;
const GAJI_SHIFT = 50, BATAS_SHIFT = 4, SHIFT_MIN = 5.5 * 60e3;
// Audit ekonomi #3 (Huda 9 Nov 2026 "usulan terbaik terapkan"): permata kecil dari kegiatan harian supaya profesi bisa dibuka
// (semua misi harian selesai +3, hadir beruntun hari ke-7 +10, tiap misi Pelari Kalcer +1), dan bonus pulang kampung
// untuk warga yang ≥3 hari tidak main (+50 koin +5 permata, maks 1x per 30 hari).
const MISI_BONUS_PERMATA = 3, HADIR7_PERMATA = 10, PK_MISI_PERMATA = 1;
// Lama main (Huda 10 Nov 2026: target warga rata-rata 1 jam main/hari). Game mengirim "detak" tiap ±1 menit selama layar
// terbuka & dipakai; server menghitung menit main harian (jeda >3 menit = menit itu tidak dihitung).
// Misi menit main 15/30/60 → +2/+3/+5 💎; Jam Kumpul Warga: tiap 10 menit main +1 💎 (maks 6/hari);
// tiap 10 menit main, tanaman di kebun tumbuh 30 menit lebih cepat (siram otomatis).
const MENIT_TIER = [[15, 2], [30, 3], [60, 5]], MENIT_KUMPUL_PERMATA = 1, MENIT_KUMPUL_MAKS = 6, SIRAM_TIAP = 10, SIRAM_MAJU = 30 * 60e3;
// Jam Kumpul Warga (menit WIB): 06 Senam Pagi, 12 Belanja Siang, 16 Mancing Bareng, 19 Nongkrong + 20 Main Bola (toleransi 2 menit)
const JAM_KUMPUL = [[360, 422], [720, 782], [960, 1022], [1140, 1262]];
const menitWib = (t = Date.now()) => { const w = new Date(t + 7 * 3600e3); return w.getUTCHours() * 60 + w.getUTCMinutes(); };
const PULANG_HARI = 3, PULANG_JEDA_HARI = 30, PULANG_KOIN = 50, PULANG_PERMATA = 5;
// Koin lari maks per detik lari sungguhan (lari 1 KM normal ±90 detik = sampai 50 koin; lari 45 detik paling banyak 36).
const PK_KOIN_DETIK = 0.8;   // harga koin = harga permata x 10
const WARNA_TOPI = { merah: "#d8443a", biru: "#2f6fd8", hitam: "#24242a", kuning: "#f2c230" };
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
// Tanggal WIB (YYYY-MM-DD) dari waktu ms.
function hariWib(t = Date.now()) { return new Date((t || 0) + 7 * 3600e3).toISOString().slice(0, 10); }
// Senin (YYYY-MM-DD, WIB) dari minggu waktu t.
function mingguWib(t = Date.now()) { const d = new Date(t + 7 * 3600e3); return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10); }
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
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN kucing TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN koin INTEGER DEFAULT 0"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN misi TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN tiktok TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN kerja TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN bagi INTEGER DEFAULT 0"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN aktif INTEGER"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN bintang INTEGER DEFAULT 0"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN bhari TEXT"); } catch (e) { /* kolom sudah ada */ }
    // vhari: tanggal WIB terakhir warga menaruh bintang (hak pilih harian sudah dipakai → pop up voting wajib tidak muncul lagi hari itu)
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN vhari TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN permata INTEGER DEFAULT 0"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN hias TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN panen INTEGER"); } catch (e) { /* kolom sudah ada */ }
    // koinTotal = semua koin yang pernah didapat (peringkat); koin = saldo yang bisa dibelanjakan
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN koinTotal INTEGER"); } catch (e) { /* kolom sudah ada */ }
    this.sql.exec("UPDATE warga SET koinTotal = COALESCE(koin, 0) WHERE koinTotal IS NULL");
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN tas TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN kebun TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN profesi TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN iklan TEXT"); } catch (e) { /* kolom sudah ada */ }
    // Lima menit pertama (7 Nov 2026): misi pemula berurutan + hadiah hadir beruntun harian
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN pemula TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN hadir TEXT"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN pelari TEXT"); } catch (e) { /* kolom sudah ada */ }
    // Pulang kampung (audit ekonomi #3, Huda 9 Nov 2026): waktu terakhir warga dapat bonus kembali main.
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN pulang INTEGER"); } catch (e) { /* kolom sudah ada */ }
    // Ajak Tetangga: ajak = nomor warga pengajak, ajakOk = waktu hadiah ajak dibayar
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN ajak INTEGER"); } catch (e) { /* kolom sudah ada */ }
    try { this.sql.exec("ALTER TABLE warga ADD COLUMN ajakOk INTEGER"); } catch (e) { /* kolom sudah ada */ }
    // Arus ekonomi harian (audit #3): jumlah koin/permata masuk per sumber dan keluar per penyerap. Hanya untuk dashboard Huda.
    this.sql.exec("CREATE TABLE IF NOT EXISTS arus (hari TEXT, jenis TEXT, n INTEGER DEFAULT 0, PRIMARY KEY (hari, jenis))");
    this.sql.exec("CREATE TABLE IF NOT EXISTS iuran (put TEXT, no INTEGER, koin INTEGER DEFAULT 0, permata INTEGER DEFAULT 0, mg TEXT, mgn INTEGER DEFAULT 0, PRIMARY KEY (put, no))");
    // suara = bintang yang sudah ditaruh warga ke calon fasum; donasi = catatan webhook Saweria (id unik, tidak dobel)
    this.sql.exec("CREATE TABLE IF NOT EXISTS suara (put TEXT, calon TEXT, no INTEGER, n INTEGER, PRIMARY KEY (put, calon, no))");
    // Bintang yang sudah ditaruh di calon yang dihapus dari putaran ini dikembalikan ke pemiliknya (aman diulang).
    for (const x of this.sql.exec("SELECT calon, no, n FROM suara WHERE put = ?", PUTARAN_VOTING).toArray()) {
      if (CALON_FASUM.includes(x.calon)) continue;
      this.sql.exec("UPDATE warga SET bintang = COALESCE(bintang, 0) + ? WHERE no = ?", x.n, x.no);
      this.sql.exec("DELETE FROM suara WHERE put = ? AND calon = ? AND no = ?", PUTARAN_VOTING, x.calon, x.no);
    }
    this.sql.exec("CREATE TABLE IF NOT EXISTS rahasia (k TEXT PRIMARY KEY, v TEXT, t INTEGER)");
    // Lomba Rumah Terindah: satu baris = satu ❤️ dari warga `dari` ke rumah `ke` pada hari WIB `hari` (minggu `mg`)
    this.sql.exec("CREATE TABLE IF NOT EXISTS rumahSuka (mg TEXT, hari TEXT, dari INTEGER, ke INTEGER, t INTEGER, PRIMARY KEY (hari, dari, ke))");
    // Piala Antardusun: poin warga per minggu (mg = Senin WIB), d = dusun saat poin didapat, lh = finish berpoin hari itu
    this.sql.exec("CREATE TABLE IF NOT EXISTS piala (mg TEXT, no INTEGER, d TEXT, poin INTEGER DEFAULT 0, lari INTEGER DEFAULT 0, gol INTEGER DEFAULT 0, hari TEXT, lh INTEGER DEFAULT 0, PRIMARY KEY (mg, no))");
    this.sql.exec("CREATE TABLE IF NOT EXISTS donasi (id TEXT PRIMARY KEY, t INTEGER, no INTEGER, rp INTEGER, bintang INTEGER, nama TEXT, pesan TEXT)");
    // juragan = riwayat pemegang mahkota Juragan Bata (baris terbaru = pemegang sekarang); plakat = nama di plakat fasum
    this.sql.exec("CREATE TABLE IF NOT EXISTS juragan (id INTEGER PRIMARY KEY AUTOINCREMENT, no INTEGER, t INTEGER, mg TEXT)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS plakat (no INTEGER, ke INTEGER, fasum TEXT, t INTEGER, PRIMARY KEY (no, ke))");
    // Hitungan pemakaian fitur per hari WIB (dashboard Huda, 7 Nov 2026). Hanya angka, tidak tampil ke warga.
    this.sql.exec("CREATE TABLE IF NOT EXISTS fitur (hari TEXT, aksi TEXT, n INTEGER DEFAULT 0, PRIMARY KEY (hari, aksi))");
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
  // ---- Lomba Rumah Terindah ----
  // Juara minggu lalu (cache per minggu; data minggu lalu tidak berubah lagi). Seri: yang lebih dulu mencapai jumlah itu.
  juaraRumah() {
    const lalu = mingguWib(Date.now() - 7 * 864e5);
    if (!this._tr || this._tr.mg !== lalu) {
      const x = this.sql.exec("SELECT ke AS no, COUNT(*) AS n, MAX(t) AS akhir FROM rumahSuka WHERE mg = ? GROUP BY ke ORDER BY n DESC, akhir ASC LIMIT 1", lalu).toArray()[0];
      this._tr = { mg: lalu, no: x ? x.no : 0, n: x ? x.n : 0 };
    }
    return this._tr.no ? this._tr : null;
  }
  topRumah(mg, n) {
    return this.sql.exec(`SELECT s.ke AS no, COUNT(*) AS suka, MAX(s.t) AS akhir, w.ig, w.tiktok FROM rumahSuka s LEFT JOIN warga w ON w.no = s.ke WHERE s.mg = ? GROUP BY s.ke ORDER BY suka DESC, akhir ASC LIMIT ${n}`, mg).toArray()
      .map((x) => ({ no: x.no, u: x.ig || x.tiktok || "", suka: x.suka }));
  }
  infoRumah(no) {
    const kini = Date.now(), mg = mingguWib(kini), hari = hariWib(kini), tr = this.juaraRumah();
    let juara = null;
    if (tr) { const w = this.sql.exec("SELECT ig, tiktok FROM warga WHERE no = ?", tr.no).toArray()[0]; juara = { no: tr.no, u: w ? w.ig || w.tiktok || "" : "", suka: tr.n, mg: tr.mg }; }
    const out = { mg, tutup: Date.parse(mg + "T00:00:00+07:00") + 7 * 864e5, top: this.topRumah(mg, 10), juara, aturan: { hari: RUMAH_SUKA_HARI } };
    if (no) {
      const pakai = this.sql.exec("SELECT ke FROM rumahSuka WHERE hari = ? AND dari = ?", hari, no).toArray().map((x) => x.ke);
      const suka = this.sql.exec("SELECT COUNT(*) AS n FROM rumahSuka WHERE mg = ? AND ke = ?", mg, no).toArray()[0].n;
      out.saya = { no, sisa: Math.max(0, RUMAH_SUKA_HARI - pakai.length), sudah: pakai, suka };
    }
    return out;
  }
  // ---- Ajak Tetangga ----
  // Dipanggil saat warga r menyelesaikan misi pemula "tanam". Bayar sekali; pengajak dibatasi AJAK_HARI hadiah per hari.
  bayarAjak(r) {
    try {
      if (!r.ajak || r.ajakOk) return null;
      const kini = Date.now(), awal = Date.parse(hariWib(kini) + "T00:00:00+07:00");
      this.sql.exec("UPDATE warga SET ajakOk = ?, permata = COALESCE(permata, 0) + ? WHERE no = ?", kini, AJAK_PERMATA_BARU, r.no); r.ajakOk = kini;
      this.arus("+permata:ajak", AJAK_PERMATA_BARU);
      const p = this.sql.exec("SELECT no, ig, tiktok FROM warga WHERE no = ?", r.ajak).toArray()[0];
      const n = this.sql.exec("SELECT COUNT(*) AS n FROM warga WHERE ajak = ? AND ajakOk >= ? AND no != ?", r.ajak, awal, r.no).toArray()[0].n;
      if (p && n < AJAK_HARI) { this.sql.exec("UPDATE warga SET permata = COALESCE(permata, 0) + ? WHERE no = ?", AJAK_PERMATA, p.no); this.arus("+permata:ajak", AJAK_PERMATA); }
      return { permata: AJAK_PERMATA_BARU, dari: p ? p.ig || p.tiktok || "warga " + p.no : "" };
    } catch (e) { return null; }
  }
  // Data publik papan Ajak: menuju warga ke-861 (Segara), pengajak terbanyak minggu ini, dan (bila ?no=) hasil ajakan warga itu.
  infoAjak(no, dari) {
    const maks = this.sql.exec("SELECT COALESCE(MAX(no), 0) AS m FROM warga").toArray()[0].m;
    const awal = Date.parse(mingguWib() + "T00:00:00+07:00");
    const top = this.sql.exec("SELECT a.ajak AS no, COUNT(*) AS n, w.ig, w.tiktok FROM warga a JOIN warga w ON w.no = a.ajak WHERE a.ajak IS NOT NULL AND a.ajakOk >= ? GROUP BY a.ajak ORDER BY n DESC, MIN(a.ajakOk) ASC LIMIT 5", awal).toArray()
      .map((x) => ({ no: x.no, u: x.ig || x.tiktok || "", n: x.n }));
    const out = { maks, target: AJAK_TARGET, kurang: Math.max(0, AJAK_TARGET - maks), top, hadiah: { pengajak: AJAK_PERMATA, baru: AJAK_PERMATA_BARU, hari: AJAK_HARI } };
    if (dari) { const d = this.sql.exec("SELECT no, ig, tiktok FROM warga WHERE no = ?", dari).toArray()[0]; if (d) out.dari = { no: d.no, u: d.ig || d.tiktok || "" }; }
    if (no) { const q = this.sql.exec("SELECT COUNT(*) AS daftar, COUNT(ajakOk) AS main FROM warga WHERE ajak = ?", no).toArray()[0];
      out.saya = { no, daftar: q.daftar, main: q.main, baru: this.sql.exec("SELECT no, ig, tiktok, ajakOk FROM warga WHERE ajak = ? ORDER BY no DESC LIMIT 10", no).toArray().map((x) => ({ no: x.no, u: x.ig || x.tiktok || "", main: x.ajakOk ? 1 : 0 })) }; }
    return out;
  }
  // ---- Piala Antardusun Mingguan ----
  // jenis "lari" (finish sah) atau "gol" (gol berkoin). Mengembalikan {dapat, d, nd} atau null bila jatah harian habis.
  tambahPiala(no, jenis) {
    try {
      const kini = Date.now(), mg = mingguWib(kini), hari = hariWib(kini), d = dusunNo(no);
      const x = this.sql.exec("SELECT lh, hari FROM piala WHERE mg = ? AND no = ?", mg, no).toArray()[0];
      const lh = x && x.hari === hari ? x.lh || 0 : 0;
      if (jenis === "lari" && lh >= PIALA_LARI_HARI) return null;
      const dapat = jenis === "lari" ? PIALA_LARI : PIALA_GOL;
      this.sql.exec("INSERT INTO piala (mg, no, d, poin, lari, gol, hari, lh) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (mg, no) DO UPDATE SET d = excluded.d, poin = poin + excluded.poin, lari = lari + excluded.lari, gol = gol + excluded.gol, hari = excluded.hari, lh = ?",
        mg, no, d, dapat, jenis === "lari" ? 1 : 0, jenis === "gol" ? 1 : 0, hari, jenis === "lari" ? 1 : 0, jenis === "lari" ? lh + 1 : lh);
      const nd = this.sql.exec("SELECT COALESCE(SUM(poin), 0) AS n FROM piala WHERE mg = ? AND d = ?", mg, d).toArray()[0].n;
      return { dapat, d, nd };
    } catch (e) { return null; }
  }
  // Klasemen satu minggu: 5 dusun urut poin (seri: dusun dengan pemain lebih sedikit di atas, lalu urutan dusun).
  klasemenPiala(mg) {
    const per = {}; for (const d of PIALA_DUSUN) per[d] = { d, poin: 0, pemain: 0 };
    for (const x of this.sql.exec("SELECT d, SUM(poin) AS poin, COUNT(*) AS pemain FROM piala WHERE mg = ? AND poin > 0 GROUP BY d", mg).toArray()) if (per[x.d]) per[x.d] = { d: x.d, poin: x.poin, pemain: x.pemain };
    return Object.values(per).sort((a, b) => b.poin - a.poin || a.pemain - b.pemain || PIALA_DUSUN.indexOf(a.d) - PIALA_DUSUN.indexOf(b.d));
  }
  topPiala(mg, d, n) {
    return this.sql.exec(`SELECT p.no, p.d, p.poin, p.lari, p.gol, w.ig, w.tiktok FROM piala p LEFT JOIN warga w ON w.no = p.no WHERE p.mg = ? AND p.poin > 0 ${d ? "AND p.d = ?" : ""} ORDER BY p.poin DESC, p.no ASC LIMIT ${n}`, ...(d ? [mg, d] : [mg])).toArray()
      .map((x) => ({ no: x.no, u: x.ig || x.tiktok || "", d: x.d, poin: x.poin, lari: x.lari, gol: x.gol }));
  }
  // Data publik papan Piala: minggu ini + juara minggu lalu (gapura berbendera emas).
  piala(no) {
    const kini = Date.now(), mg = mingguWib(kini), lalu = mingguWib(kini - 7 * 864e5);
    const tutup = Date.parse(mg + "T00:00:00+07:00") + 7 * 864e5;
    const kl = this.klasemenPiala(mg), kll = this.klasemenPiala(lalu);
    const juara = kll[0] && kll[0].poin > 0 ? { d: kll[0].d, poin: kll[0].poin, mg: lalu, top: this.topPiala(lalu, kll[0].d, 3) } : null;
    const out = { mg, tutup, klasemen: kl, top: this.topPiala(mg, "", 10), juara, aturan: { lari: PIALA_LARI, lariHari: PIALA_LARI_HARI, gol: PIALA_GOL } };
    if (no) { const x = this.sql.exec("SELECT poin, lari, gol, hari, lh FROM piala WHERE mg = ? AND no = ?", mg, no).toArray()[0];
      out.saya = { no, d: dusunNo(no), poin: x ? x.poin : 0, lari: x ? x.lari : 0, gol: x ? x.gol : 0, sisaLari: PIALA_LARI_HARI - (x && x.hari === hariWib(kini) ? x.lh || 0 : 0) }; }
    return out;
  }
  // Catat arus ekonomi: jenis "+koin:hadir", "-permata:profesi", dst. n = jumlah koin/permata.
  arus(jenis, n) { n = Math.floor(+n || 0); if (!n) return; try { this.sql.exec("INSERT INTO arus (hari, jenis, n) VALUES (?, ?, ?) ON CONFLICT (hari, jenis) DO UPDATE SET n = n + excluded.n", hariWib(), jenis, n); } catch (e) {} }
  // ---- Bata (hadiah pendukung) ----
  // Total rupiah donasi per warga (hanya donasi yang memuat kode DK); di-cache di memori, dibuang tiap ada donasi baru.
  rpWarga() {
    if (!this._rp) { this._rp = {}; for (const x of this.sql.exec("SELECT no, SUM(rp) AS rp FROM donasi WHERE no IS NOT NULL GROUP BY no").toArray()) this._rp[x.no] = x.rp || 0; }
    return this._rp;
  }
  bataWarga(no) { return Math.floor((this.rpWarga()[no] || 0) / BATA_RP); }
  juraganKini() {
    if (this._jr === undefined) this._jr = this.sql.exec("SELECT no, t, mg FROM juragan ORDER BY id DESC LIMIT 1").toArray()[0] || null;
    return this._jr;
  }
  fasumDibangun(t = Date.now()) { const b = BANGUN_SEKARANG.find((x) => t < x.sampai); return b ? b.id : "berikut"; }
  // Dipanggil sesudah donasi tercatat: perbarui cache, mahkota Juragan minggu ini, dan plakat fasum.
  sesudahDonasi(no) {
    this._rp = null;
    const kini = Date.now(), mg = mingguWib(kini), awal = Date.parse(mg + "T00:00:00+07:00");
    const top = this.sql.exec("SELECT no, SUM(rp) AS s, MAX(t) AS akhir FROM donasi WHERE no IS NOT NULL AND t >= ? GROUP BY no ORDER BY s DESC, akhir ASC", awal).toArray();
    if (top.length) {
      const jr = this.juraganKini(), maks = top[0].s;
      // seri: pemegang lama tetap memegang mahkota (harus benar-benar menyalip)
      const juara = jr && top.some((x) => x.no === jr.no && x.s === maks) ? jr.no : top[0].no;
      if (!jr || jr.no !== juara) this.sql.exec("INSERT INTO juragan (no, t, mg) VALUES (?, ?, ?)", juara, kini, mg);
      else if (jr.mg !== mg) this.sql.exec("UPDATE juragan SET mg = ? WHERE id = (SELECT MAX(id) FROM juragan)", mg);
      this._jr = undefined;
    }
    if (no) {
      const n = Math.floor(this.bataWarga(no) / BATA_PLAKAT), ada = this.sql.exec("SELECT COUNT(*) AS n FROM plakat WHERE no = ?", no).toArray()[0].n;
      for (let ke = ada + 1; ke <= n; ke++) this.sql.exec("INSERT OR IGNORE INTO plakat (no, ke, fasum, t) VALUES (?, ?, ?, ?)", no, ke, this.fasumDibangun(kini), kini);
    }
  }
  // Data publik papan pendukung (game, Pulau Desa, kartu terima kasih video).
  pendukung() {
    const nmNo = {}; for (const r of this.sql.exec("SELECT w.no, w.ig, w.tiktok, w.nama FROM warga w WHERE w.no IN (SELECT no FROM donasi WHERE no IS NOT NULL UNION SELECT no FROM juragan UNION SELECT no FROM plakat)").toArray()) nmNo[r.no] = r.ig || r.tiktok || r.nama || "warga " + r.no;
    const rp = this.rpWarga(), kini = Date.now(), mg = mingguWib(kini), awal = Date.parse(mg + "T00:00:00+07:00");
    const daftar = Object.entries(rp).map(([no, v]) => ({ no: +no, nm: nmNo[no] || "", bata: Math.floor(v / BATA_RP) })).filter((x) => x.bata >= 1).sort((a, b) => b.bata - a.bata || a.no - b.no);
    const jr = this.juraganKini();
    const mgIni = {}; for (const x of this.sql.exec("SELECT no, SUM(rp) AS s FROM donasi WHERE no IS NOT NULL AND t >= ? GROUP BY no", awal).toArray()) mgIni[x.no] = x.s;
    const riwayat = this.sql.exec("SELECT no, t FROM juragan ORDER BY id DESC LIMIT 10").toArray().map((x) => ({ no: x.no, nm: nmNo[x.no] || "", sejak: x.t }));
    const plakat = this.sql.exec("SELECT no, fasum, MIN(t) AS t, COUNT(*) AS n FROM plakat GROUP BY no, fasum ORDER BY t").toArray().map((x) => ({ no: x.no, nm: nmNo[x.no] || "", fasum: x.fasum, n: x.n }));
    // donasi terbaru (kartu terima kasih video): tanpa kode DK = "Pendukung misterius" (nama Saweria tidak ditampilkan)
    const terbaru = this.sql.exec("SELECT no, rp, t FROM donasi ORDER BY t DESC LIMIT 20").toArray().map((x) => ({ no: x.no || 0, nm: x.no ? nmNo[x.no] || "" : "", bata: Math.floor(x.rp / BATA_RP), t: x.t }));
    const bos = {};
    for (const [id, no] of Object.entries(BOS_TETAP)) { const r = this.sql.exec("SELECT no, ig, tiktok FROM warga WHERE no = ?", no).toArray()[0]; if (r) bos[id] = { no: r.no, nm: r.ig || r.tiktok }; }
    for (const [id, re] of Object.entries(KATA_FASUM)) {
      if (bos[id]) continue;
      for (const r of this.sql.exec("SELECT no, ig, tiktok, usulan FROM warga WHERE usulan IS NOT NULL AND usulan != '' AND (ig IS NOT NULL AND ig != '' OR tiktok IS NOT NULL AND tiktok != '') ORDER BY dibuat ASC, no ASC").toArray()) {
        if (re.test(r.usulan)) { bos[id] = { no: r.no, nm: r.ig || r.tiktok }; break; }
      }
    }
    // Papan "Juragan minggu ini" (Huda 9 Nov 2026): peringkat Bata minggu ini (Senin–Minggu WIB); seri → pemegang mahkota dulu.
    const papanMinggu = Object.entries(mgIni).map(([no, s]) => ({ no: +no, nm: nmNo[no] || "", bata: Math.floor(s / BATA_RP), s })).filter((x) => x.bata >= 1)
      .sort((a, b) => b.s - a.s || (jr && jr.mg === mg ? (b.no === jr.no) - (a.no === jr.no) : 0) || a.no - b.no).slice(0, 10).map(({ no, nm, bata }) => ({ no, nm, bata }));
    return { harga: BATA_RP, bendera: BATA_BENDERA, plakatTiap: BATA_PLAKAT, dibangun: this.fasumDibangun(kini), minggu: mg, papanMinggu,
      juragan: jr ? { no: jr.no, nm: nmNo[jr.no] || "", sejak: jr.t, bataMinggu: Math.floor((mgIni[jr.no] || 0) / BATA_RP), mingguIni: jr.mg === mg ? 1 : 0 } : null,
      riwayat, plakat, bos, pendukung: daftar.slice(0, 50), jumlah: daftar.length, terbaru };
  }
  publik(r) {
    // Daftar lewat Google tanpa username: nama yang ditulis warga jadi ukiran batu (label).
    let kc = null; try { kc = r.kucing ? JSON.parse(r.kucing) : null; } catch (e) {}
    const hs = this.hiasPakai(r), bt = this.bataWarga(r.no), jr = this.juraganKini(), tr = this.juaraRumah();
    return { ...(bt ? { bt } : {}), ...(r.alb ? { al: r.alb } : {}), ...(jr && jr.no === r.no ? { jr: 1 } : {}), ...(tr && tr.no === r.no ? { tr: 1 } : {}), ...(hs.cat !== "krem" || hs.pagar !== "putih" || hs.rumah === "dua" || hs.dekor.length ? { hs: { c: hs.cat, p: hs.pagar, ...(hs.rumah === "dua" ? { l: 2 } : {}), ...(hs.dekor.length ? { d: hs.dekor } : {}) } } : {}), no: r.no, ig: r.ig || "", tiktok: r.tiktok || "", label: r.ig || r.tiktok ? "" : r.nama || "", usulan: r.usulan || "", dibuat: r.dibuat, ...(kc ? { kc } : {}), ...(r.aktif ? { ak: Math.floor(r.aktif / 60000) * 60000 } : {}) };
  }
  // Hias: {punya:{cat:[...],pagar:[...],topi:[...]}, cat, pagar, topi}
  bacaHias(r) { let h = {}; try { h = r.hias ? JSON.parse(r.hias) : {}; } catch (e) {} h.punya = h.punya || {}; for (const j of Object.keys(TOKO_HIAS)) h.punya[j] = h.punya[j] || []; return h; }
  bacaKebun(r) { let k = {}; try { k = r.kebun ? JSON.parse(r.kebun) : {}; } catch (e) {} return k; }
  infoKebun(k) { return k.b ? { b: k.b, siap: k.t + PANEN_JEDA } : { b: null }; }
  bacaProfesi(r) { let p = {}; try { p = r.profesi ? JSON.parse(r.profesi) : {}; } catch (e) {} p.p = Array.isArray(p.p) ? p.p.filter(x => PROFESI[x]) : []; if (!PROFESI[p.a]) p.a = "petani"; return p; }
  infoProfesi(p) { const hari = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    return { a: p.a, punya: ["petani", "pedagang", ...p.p], sh: p.sh || null, shift: p.sd === hari ? p.sn || 0 : 0, gantiHariIni: p.g === hari ? 1 : 0, batas: BATAS_SHIFT, gaji: GAJI_SHIFT, min: SHIFT_MIN, diskon: p.p.length ? 0 : 1 }; }
  bacaTas(r) { let t = {}; try { t = r.tas ? JSON.parse(r.tas) : {}; } catch (e) {} t.isi = t.isi && typeof t.isi === "object" ? t.isi : {};
    // album: yang sudah ada di tas (sebelum fitur album) langsung tercatat
    t._al = t._al && typeof t._al === "object" ? t._al : {};
    for (const n of Object.keys(t.isi)) if (!t._al[n] && (ALBUM_IKAN.includes(n) || SUVENIR.some((x) => x[1] === n) || Object.values(BIBIT).some((b) => b.nama === n))) t._al[n] = 1;
    t._alb = albumBit(t._al); return t; }
  hiasPakai(r) { const h = this.bacaHias(r); return { cat: h.cat || "krem", pagar: h.pagar || "putih", topi: h.topi || "tanpa", rumah: h.rumah || "satu", dekor: (h.dekor || []).filter(x => DEKOR.includes(x)) }; }
  pasangTopi(avatarJson, topi) { let a = {}; try { a = avatarJson ? JSON.parse(avatarJson) : {}; } catch (e) {} if (WARNA_TOPI[topi]) a.topi = WARNA_TOPI[topi]; else delete a.topi; return JSON.stringify(a).slice(0, 600); }
  hasilVoting() {
    const hasil = {}; for (const c of CALON_FASUM) hasil[c] = 0;
    for (const x of this.sql.exec("SELECT calon, SUM(n) AS n, COUNT(*) AS w FROM suara WHERE put = ? GROUP BY calon", PUTARAN_VOTING).toArray()) if (x.calon in hasil) hasil[x.calon] = x.n;
    const pemilih = this.sql.exec("SELECT COUNT(DISTINCT no) AS w FROM suara WHERE put = ?", PUTARAN_VOTING).toArray()[0].w;
    return { putaran: PUTARAN_VOTING, calon: CALON_FASUM, hasil, pemilih, tutup: VOTING_TUTUP, ditutup: Date.now() >= VOTING_TUTUP ? 1 : 0, dana: this.danaIuran() };
  }
  danaIuran() {
    const t = this.sql.exec("SELECT COALESCE(SUM(koin + permata * ?), 0) AS v, COUNT(*) AS w FROM iuran WHERE put = ?", KOIN_PER_PERMATA, PUTARAN_VOTING).toArray()[0];
    const top = this.sql.exec("SELECT i.koin + i.permata * ? AS v, w.ig, w.tiktok, w.nama FROM iuran i JOIN warga w ON w.no = i.no WHERE i.put = ? ORDER BY v DESC LIMIT 5", KOIN_PER_PERMATA, PUTARAN_VOTING).toArray().map(x => ({ ig: this.nm(x), v: x.v }));
    const target = IURAN_HARI * IURAN_PER_HARI, hemat = Math.min(IURAN_HARI, Math.floor(t.v / IURAN_PER_HARI));
    return { total: t.v, target, hemat, hari: IURAN_HARI - hemat, penyumbang: t.w, top, perHari: IURAN_PER_HARI, batasPermata: IURAN_PERMATA_MINGGU };
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
  tambah({ sub, email, nama, ig, tiktok, kerja, ajak }) {
    const k = crypto.randomUUID();
    const siap = ig ? kavlingSiap(ig) : 0;
    const kosong = siap && !this.sql.exec("SELECT 1 FROM warga WHERE no = ?", siap).toArray().length;
    if (kosong) this.sql.exec("INSERT INTO warga (no, sub, email, nama, ig, tiktok, kunci, dibuat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", siap, sub, email || null, nama || null, ig || null, tiktok || null, k, Date.now());
    else this.sql.exec("INSERT INTO warga (sub, email, nama, ig, tiktok, kunci, dibuat) VALUES (?, ?, ?, ?, ?, ?, ?)", sub, email || null, nama || null, ig || null, tiktok || null, k, Date.now());
    if (kerja) this.sql.exec("UPDATE warga SET kerja = ? WHERE kunci = ?", kerja, k);
    // pengajak harus warga yang sudah ada (bukan diri sendiri)
    if (ajak > 0 && this.sql.exec("SELECT 1 FROM warga WHERE no = ? AND kunci != ?", ajak, k).toArray().length) this.sql.exec("UPDATE warga SET ajak = ? WHERE kunci = ?", ajak, k);
    return this.sql.exec("SELECT * FROM warga WHERE kunci = ?", k).toArray()[0];
  }
  async fetch(request) {
    const aksi = new URL(request.url).pathname.slice(1);
    if (aksi === "statistik") return Response.json(this.statistik());
    // Jejak keluar (Huda 10 Nov 2026): kapan & di layar mana warga menutup game, lama layar memuat. Angka saja, tanpa nama.
    if (aksi === "jejak") {
      const q = await request.json().catch(() => ({})), hari = hariWib();
      const pilih = (v, L) => (L.includes(v) ? v : "?"), nm = (v) => (/^[a-z]{1,16}$/i.test(v || "") ? v : "main");
      const tambah = (k) => { try { this.sql.exec("INSERT INTO fitur (hari, aksi, n) VALUES (?, ?, 1) ON CONFLICT (hari, aksi) DO UPDATE SET n = n + 1", hari, k); } catch (e) {} };
      if (q.m) tambah("muat:" + pilih(q.m, ["<3", "3-6", "6-10", "10-20", "20+", "gagal"]));
      if (q.d) tambah("keluar:" + pilih(q.d, ["<30d", "30-60d", "1-3m", "3-5m", "5-15m", "15m+"]) + ":" + nm(q.p));
      return Response.json({ ok: 1 });
    }
    const res = await this.layani(request);
    if (request.method === "POST" && res.ok && !request.url.includes("ws=1") && !/^(rahasia|saweria-status|saweria-kunci|trakteer-status|trakteer-kunci|donasi-misterius|detak)/.test(aksi)) {
      try { this.sql.exec("INSERT INTO fitur (hari, aksi, n) VALUES (?, ?, 1) ON CONFLICT (hari, aksi) DO UPDATE SET n = n + 1", hariWib(), aksi); } catch (e) {}
    }
    return res;
  }
  // Ringkasan untuk dashboard Huda (/duniakotak/dashboard/). Angka agregat saja, tanpa email.
  statistik() {
    const now = Date.now(), q = (sql, ...a) => this.sql.exec(sql, ...a).toArray();
    const rows = q("SELECT no, dibuat, aktif, koin, koinTotal, permata, kebun, profesi, kucing, hias, bagi, misi, bintang FROM warga");
    const hari = hariWib(), daftar = {}, aktifHari = {};
    const menit = { warga: 0, total: 0, m15: 0, m30: 0, m60: 0 };
    let koin = 0, koinTotal = 0, permata = 0, kebun = 0, kucing = 0, rumah2 = 0, bagi = 0, misiHariIni = 0, misiPenuh = 0, bintang = 0;
    const profesi = {}, a = { j1: 0, j24: 0, h7: 0, pernah: 0 };
    for (const r of rows) {
      const hd = hariWib(r.dibuat); daftar[hd] = (daftar[hd] || 0) + 1;
      if (r.aktif) { a.pernah++; const d = now - r.aktif; if (d < 3600e3) a.j1++; if (d < 864e5) a.j24++; if (d < 7 * 864e5) a.h7++; }
      koin += r.koin || 0; koinTotal += r.koinTotal || 0; permata += r.permata || 0; bintang += r.bintang || 0;
      if (r.kebun && this.bacaKebun(r).b) kebun++;
      if (r.kucing) kucing++;
      if (r.bagi) bagi++;
      if (this.bacaHias(r).rumah === "dua") rumah2++;
      if (r.profesi) { const p = this.bacaProfesi(r); if (p.p.length) for (const x of p.p) { const nm = PROFESI[x].ikon + " " + PROFESI[x].nama; profesi[nm] = (profesi[nm] || 0) + 1; } }
      try { const m = r.misi ? JSON.parse(r.misi) : null; if (m && m.t === hari && m.s && m.s.length) { misiHariIni++; if (m.s.includes("bonus")) misiPenuh++; }
        if (m && m.t === hari && m.mm) { menit.warga++; menit.total += m.mm; if (m.mm >= 15) menit.m15++; if (m.mm >= 30) menit.m30++; if (m.mm >= 60) menit.m60++; } } catch (e) {}
    }
    const fitur = q("SELECT hari, aksi, n FROM fitur WHERE hari >= ? ORDER BY hari", hariWib(now - 14 * 864e5));
    const donasi = q("SELECT date((t + 25200000) / 1000, 'unixepoch') AS h, COUNT(*) AS n, SUM(rp) AS rp FROM donasi GROUP BY h ORDER BY h");
    const arus = q("SELECT hari, jenis, n FROM arus WHERE hari >= ? ORDER BY hari", hariWib(now - 14 * 864e5));
    return { waktu: now, warga: rows.length, daftar, aktif: a, ekonomi: { koin, koinTotal, permata, bintang }, kebun, kucing, rumah2, bagi, misiHariIni, misiPenuh, menit, profesi, fitur, donasi, arus, voting: this.hasilVoting() };
  }
  async layani(request) {
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
      const { ig, tiktok, namaWarga, kerja, ajak } = await request.json();
      const salah = this.bentrok(ig, tiktok, 0);
      if (salah) return Response.json({ galat: salah }, { status: 409 });
      const r = this.tambah({ sub: ig ? "ig:" + ig : "tt:" + tiktok, nama: namaWarga, ig, tiktok, kerja, ajak });
      return Response.json({ ...this.publik(r), nm: this.nm(r), nama: r.nama || "", kunci: r.kunci, baru: true });
    }
    // ---- Game mabar: login Google, ditautkan ke kavling lama (tidak membuat kavling dobel) ----
    if (aksi === "google") {
      // Dipakai halaman daftar warga & game. Satu akun Google = satu kavling; kavling lama (daftar tanpa Google) ditautkan, tidak dobel.
      const { sub, email, nama, kunci, ig, tiktok, namaWarga, kerja, cari, ajak } = await request.json();
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
      return keluar(this.tambah({ sub, email, nama: namaWarga || nama, ig, tiktok, kerja, ajak }), true);
    }
    // ---- Game mabar: sesi pakai kunci (HP pendaftar) atau kode warga 6 huruf (HP lain) ----
    if (aksi === "sesi" || aksi === "kode" || aksi === "avatar" || aksi === "profil" || aksi === "kucing" || aksi === "misi" || aksi === "gol" || aksi === "bagikan" || aksi === "pemula" || aksi === "hadir") {
      const q = await request.json();
      let r;
      if (aksi === "kode") {
        if (String(q.kode || "").length === 6) r = this.sql.exec("SELECT * FROM warga WHERE kode = ?", String(q.kode)).toArray()[0];
        // Satu kolom: kode warga ATAU username IG/TikTok. Username hanya bisa dipakai untuk kavling yang belum dikunci Google.
        if (!r && q.un) {
          const un = q.un, r2 = (KOREKSI_IG[un] && this.sql.exec("SELECT * FROM warga WHERE ig = ?", KOREKSI_IG[un]).toArray()[0])
            || this.sql.exec("SELECT * FROM warga WHERE ig = ? OR tiktok = ? ORDER BY no LIMIT 1", un, un).toArray()[0];
          if (r2 && !/^(ig|tt):/.test(String(r2.sub))) return Response.json({ galat: "@" + un + " sudah dikunci dengan akun Google. Masuk pakai tombol Google (buka di Chrome), atau pakai kode warga." }, { status: 401 });
          r = r2;
          if (r && !r.kunci) { r.kunci = crypto.randomUUID(); this.sql.exec("UPDATE warga SET kunci = ? WHERE no = ?", r.kunci, r.no); }
        }
      }
      else r = this.sql.exec("SELECT * FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      if (!r) return Response.json({ galat: aksi === "kode" ? (q.un ? "@" + q.un + " belum terdaftar, dan bukan kode warga. Cek lagi tulisannya, atau daftar dulu." : "Kode warga tidak ditemukan.") : "Data warga tidak ditemukan di HP ini." }, { status: 401 });
      if (!r.kode) {
        const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (let i = 0; i < 20; i++) {
          const b = crypto.getRandomValues(new Uint8Array(6));
          const k = [...b].map((x) => A[x % A.length]).join("");
          if (!this.sql.exec("SELECT 1 FROM warga WHERE kode = ?", k).toArray().length) { this.sql.exec("UPDATE warga SET kode = ? WHERE no = ?", k, r.no); r.kode = k; break; }
        }
      }
      // Jejak warga: kapan terakhir main (tampil di depan rumahnya di game). Ditulis paling sering tiap 5 menit.
      const kini = Date.now();
      // Pulang kampung: warga yang ≥ PULANG_HARI hari tidak main dapat bonus sekali (maks 1x per PULANG_JEDA_HARI hari).
      let pulang = null;
      if ((aksi === "sesi" || aksi === "kode") && !u.searchParams.has("ws") && r.aktif && kini - r.aktif >= PULANG_HARI * 864e5 && (!r.pulang || kini - r.pulang >= PULANG_JEDA_HARI * 864e5)) {
        pulang = { koin: PULANG_KOIN, permata: PULANG_PERMATA, hari: Math.floor((kini - r.aktif) / 864e5) };
        this.sql.exec("UPDATE warga SET koin = COALESCE(koin, 0) + ?, koinTotal = COALESCE(koinTotal, 0) + ?, permata = COALESCE(permata, 0) + ?, pulang = ? WHERE no = ?", PULANG_KOIN, PULANG_KOIN, PULANG_PERMATA, kini, r.no);
        r.koin = (r.koin || 0) + PULANG_KOIN; r.koinTotal = (r.koinTotal || 0) + PULANG_KOIN; r.permata = (r.permata || 0) + PULANG_PERMATA; r.pulang = kini;
        this.arus("+koin:pulang", PULANG_KOIN); this.arus("+permata:pulang", PULANG_PERMATA);
      }
      if (!r.aktif || kini - r.aktif > 300000) { this.sql.exec("UPDATE warga SET aktif = ? WHERE no = ?", kini, r.no); r.aktif = kini; }
      if (aksi === "avatar") { const av = this.pasangTopi(String(q.avatar || ""), this.hiasPakai(r).topi); this.sql.exec("UPDATE warga SET avatar = ? WHERE no = ?", av, r.no); r.avatar = av; }
      // Misi harian: tiap misi sekali per hari (tanggal WIB), koin masuk di server; bonus bila semua selesai.
      const hari = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
      let ms = { t: hari, s: [] }; try { const m0 = r.misi ? JSON.parse(r.misi) : null; if (m0 && m0.t === hari && Array.isArray(m0.s)) ms = m0; } catch (e) {}
      let dapat = 0, dapatPermata = 0;
      const MISI_HARIAN = misiHari(hari);
      // Misi harian HANYA bisa diklaim saat Jam Kumpul Warga (Huda: supaya warga online bareng), toleransi 2 menit:
      // 5 event: 06 Senam Pagi, 12 Belanja Siang, 16 Mancing Bareng, 19 Nongkrong Warung, 20 Main Bola (sama dengan SESI di mabar/game.js)
      const wibM = new Date(Date.now() + 7 * 3600e3), mntM = wibM.getUTCHours() * 60 + wibM.getUTCMinutes();
      const jamKumpul = JAM_KUMPUL.some(([a, b]) => mntM >= a && mntM < b);
      // 7 Nov 2026 (lima menit pertama): misi harian bisa dikerjakan SEPANJANG HARI (koin 1x); Jam Kumpul Warga tetap koin 2x.
      if (aksi === "misi" && (MISI_SEPANJANG_HARI || jamKumpul) && MISI_HARIAN[q.id] && !ms.s.includes(q.id)) {
        const inti = Object.keys(MISI_HARIAN).filter((k) => k !== "bonus");
        if (q.id !== "bonus" || inti.every((k) => ms.s.includes(k))) {
          ms.s.push(q.id); dapat = MISI_HARIAN[q.id] * (jamKumpul ? 2 : 1);
          if (q.id === "bonus") dapatPermata = MISI_BONUS_PERMATA;
          this.sql.exec("UPDATE warga SET koin = COALESCE(koin, 0) + ?, koinTotal = COALESCE(koinTotal, 0) + ?, permata = COALESCE(permata, 0) + ?, misi = ? WHERE no = ?", dapat, dapat, dapatPermata, JSON.stringify(ms), r.no);
          r.koin = (r.koin || 0) + dapat; r.permata = (r.permata || 0) + dapatPermata;
          this.arus("+koin:misi", dapat); this.arus("+permata:misi", dapatPermata);
        }
      }
      // Gol di stadion: +5 koin per gol, maks 5 gol berkoin per hari (WIB), jeda 20 detik antar gol
      if (aksi === "gol") {
        const kini2 = Date.now();
        ms.g = ms.g || 0;
        if (ms.g < 5 && kini2 - (ms.gt || 0) > 20000) {
          ms.g += 1; ms.gt = kini2; dapat = 5; this.arus("+koin:gol", dapat);
          r._piala = this.tambahPiala(r.no, "gol");
          this.sql.exec("UPDATE warga SET koin = COALESCE(koin, 0) + ?, koinTotal = COALESCE(koinTotal, 0) + ?, misi = ? WHERE no = ?", dapat, dapat, JSON.stringify(ms), r.no);
          r.koin = (r.koin || 0) + dapat;
        }
      }
      // Misi pemula: 5 langkah berurutan, sekali seumur kavling, koin langsung masuk (hadiah cepat warga baru).
      let pm = []; try { pm = r.pemula ? JSON.parse(r.pemula) : []; } catch (e) {}
      if (!Array.isArray(pm)) pm = [];
      const bolehPemula = pm.length > 0 || (r.koinTotal || r.koin || 0) < PEMULA_BATAS_KOIN || (r.koin || 0) < PEMULA_SALDO;
      let dapatPm = 0;
      if (aksi === "pemula" && bolehPemula) {
        const i = PEMULA.findIndex(([id]) => id === q.id);
        if (i >= 0 && !pm.includes(q.id) && PEMULA.slice(0, i).every(([id]) => pm.includes(id))) {
          pm.push(q.id); dapat = dapatPm = PEMULA[i][1]; const dpm = PEMULA[i][2] || 0;
          this.sql.exec("UPDATE warga SET koin = COALESCE(koin, 0) + ?, koinTotal = COALESCE(koinTotal, 0) + ?, permata = COALESCE(permata, 0) + ?, pemula = ? WHERE no = ?", dapat, dapat, dpm, JSON.stringify(pm), r.no);
          r.koin = (r.koin || 0) + dapat; r.koinTotal = (r.koinTotal || 0) + dapat; r.permata = (r.permata || 0) + dpm;
          this.arus("+koin:pemula", dapat); this.arus("+permata:pemula", dpm);
          try { this.sql.exec("INSERT INTO fitur (hari, aksi, n) VALUES (?, ?, 1) ON CONFLICT (hari, aksi) DO UPDATE SET n = n + 1", hari, "pemula:" + q.id); } catch (e) {}
          if (q.id === "tanam") { const ha = this.bayarAjak(r); if (ha) { r._ajak = ha; r.permata = (r.permata || 0) + ha.permata; } }
        }
      }
      // Hadir beruntun: sekali per hari WIB, hadiah naik tiap hari berturut-turut (7 hari lalu ulang), putus = mulai hari 1.
      let hd = { t: "", n: 0 }; try { hd = r.hadir ? JSON.parse(r.hadir) : hd; } catch (e) {}
      let dapatHadir = 0;
      if (aksi === "hadir" && hd.t !== hari) {
        const kemarin = new Date(Date.now() + 7 * 3600e3 - 864e5).toISOString().slice(0, 10);
        hd = { t: hari, n: hd.t === kemarin ? (hd.n || 0) + 1 : 1 };
        dapat = dapatHadir = HADIAH_HADIR[(hd.n - 1) % HADIAH_HADIR.length];
        // hari ke-7, 14, 21, ... beruntun: + permata (audit ekonomi #3)
        if (hd.n % HADIAH_HADIR.length === 0) dapatPermata = HADIR7_PERMATA;
        this.sql.exec("UPDATE warga SET koin = COALESCE(koin, 0) + ?, koinTotal = COALESCE(koinTotal, 0) + ?, permata = COALESCE(permata, 0) + ?, hadir = ? WHERE no = ?", dapat, dapat, dapatPermata, JSON.stringify(hd), r.no);
        r.koin = (r.koin || 0) + dapat; r.koinTotal = (r.koinTotal || 0) + dapat; r.permata = (r.permata || 0) + dapatPermata;
        this.arus("+koin:hadir", dapat); this.arus("+permata:hadir", dapatPermata);
      }
      const hadirInfo = { n: hd.n || 0, hariIni: hd.t === hari, besok: HADIAH_HADIR[(hd.t === hari ? hd.n : 0) % HADIAH_HADIR.length], daftar: HADIAH_HADIR, permata7: HADIR7_PERMATA };
      // Syarat main: bagikan Kartu Warga ke story sekali (tidak bisa diverifikasi ke IG, dicatat saat tombol dipakai).
      if (aksi === "bagikan" && !r.bagi) { this.sql.exec("UPDATE warga SET bagi = 1 WHERE no = ?", r.no); r.bagi = 1; }
      // Kucing peliharaan warga (maks 2) + warna kandang.
      if (aksi === "kucing") { this.sql.exec("UPDATE warga SET kucing = ? WHERE no = ?", q.kucing || null, r.no); r.kucing = q.kucing; }
      // Data Kartu Warga yang bisa diubah sendiri: nama & pekerjaan.
      if (aksi === "profil") {
        if (q.nama) { this.sql.exec("UPDATE warga SET nama = ? WHERE no = ?", q.nama, r.no); r.nama = q.nama; }
        if (q.kerja !== undefined) { this.sql.exec("UPDATE warga SET kerja = ? WHERE no = ?", q.kerja || null, r.no); r.kerja = q.kerja; }
      }
      let av = null; try { av = r.avatar ? JSON.parse(r.avatar) : null; } catch (e) {}
      let kc = null; try { kc = r.kucing ? JSON.parse(r.kucing) : null; } catch (e) {}
      return Response.json({ no: r.no, ig: this.nm(r), kode: r.kode, kunci: r.kunci, avatar: av, kucing: kc, koin: r.koin || 0, misi: ms.s, gol: ms.g || 0, menit: { m: ms.mm || 0, h: ms.mh || [], k: Math.min(MENIT_KUMPUL_MAKS, Math.floor((ms.mk || 0) / 10)) }, dapat, bagi: r.bagi ? 1 : 0, nama: r.nama || "", kerja: r.kerja || "", akunIg: r.ig || "", tiktok: r.tiktok || "", dibuat: r.dibuat, permata: r.permata || 0, hias: this.bacaHias(r), kebun: this.infoKebun(this.bacaKebun(r)), bibit: BIBIT, tas: this.bacaTas(r).isi, album: this.bacaTas(r)._al, tasImpor: this.bacaTas(r)._impor ? 1 : 0, koinTotal: r.koinTotal || r.koin || 0, profesi: this.infoProfesi(this.bacaProfesi(r)), daftarProfesi: PROFESI, pemula: { s: pm, boleh: bolehPemula, dapat: dapatPm }, hadir: { ...hadirInfo, dapat: dapatHadir }, dapatPermata, ...(pulang ? { pulang } : {}), ...(r._piala ? { piala: r._piala } : {}), ...(r._ajak ? { ajak: r._ajak } : {}) });
    }
    // ---- Voting fasum berbintang ----
    if (aksi === "voting") {
      const q = await request.json();
      const r = this.sql.exec("SELECT no, bintang, bhari, vhari FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      if (!r) return Response.json({ galat: "Masuk dulu sebagai warga." }, { status: 401 });
      let saldo = r.bintang || 0, gratis = 0;
      const hari = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
      if (r.bhari !== hari) { saldo += 1; gratis = 1; this.sql.exec("UPDATE warga SET bintang = ?, bhari = ? WHERE no = ?", saldo, hari, r.no); }
      if (q.calon) {
        const n = Math.floor(+q.n || 0);
        if (Date.now() >= VOTING_TUTUP) return Response.json({ galat: "Voting minggu ini sudah ditutup. Bintangmu tetap tersimpan untuk voting berikutnya." }, { status: 400 });
        if (!CALON_FASUM.includes(q.calon)) return Response.json({ galat: "Calon fasum tidak dikenal." }, { status: 400 });
        if (n < 1 || n > saldo) return Response.json({ galat: saldo ? "Bintangmu tinggal " + saldo + "." : "Bintangmu habis. Besok dapat 1 bintang gratis lagi." }, { status: 400 });
        saldo -= n;
        this.sql.exec("UPDATE warga SET bintang = ?, vhari = ? WHERE no = ?", saldo, hari, r.no); r.vhari = hari;
        this.sql.exec("INSERT INTO suara (put, calon, no, n) VALUES (?, ?, ?, ?) ON CONFLICT (put, calon, no) DO UPDATE SET n = n + excluded.n", PUTARAN_VOTING, q.calon, r.no, n);
      }
      const saya = {}; for (const x of this.sql.exec("SELECT calon, n FROM suara WHERE put = ? AND no = ?", PUTARAN_VOTING, r.no).toArray()) saya[x.calon] = x.n;
      const don = this.sql.exec("SELECT COALESCE(SUM(bintang), 0) AS b FROM donasi WHERE no = ?", r.no).toArray()[0].b;
      return Response.json({ no: r.no, saldo, gratis, sudahPilih: r.vhari === hari || Date.now() >= VOTING_TUTUP ? 1 : 0, saya, donasi: don, ...this.hasilVoting() });
    }
    if (aksi === "voting-publik") return Response.json(this.hasilVoting());
    if (aksi === "pendukung") return Response.json(this.pendukung());
    if (aksi === "rumah") return Response.json(this.infoRumah(Math.max(0, Math.floor(+u.searchParams.get("no") || 0))));
    if (aksi === "rumah-suka") {
      const q = await request.json();
      const r = this.sql.exec("SELECT no FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      if (!r) return Response.json({ galat: "Masuk dulu sebagai warga." }, { status: 401 });
      const ke = Math.floor(+q.ke || 0), kini = Date.now(), hari = hariWib(kini), mg = mingguWib(kini);
      if (ke === r.no) return Response.json({ galat: "Itu rumahmu sendiri. Ajak tetangga memberi ❤️ ya!" }, { status: 400 });
      if (ke <= 1 || !this.sql.exec("SELECT 1 FROM warga WHERE no = ?", ke).toArray().length) return Response.json({ galat: "Rumah ini belum ikut lomba." }, { status: 400 });
      const pakai = this.sql.exec("SELECT ke FROM rumahSuka WHERE hari = ? AND dari = ?", hari, r.no).toArray().map((x) => x.ke);
      if (pakai.includes(ke)) return Response.json({ galat: "Kamu sudah memberi ❤️ ke rumah ini hari ini." }, { status: 400 });
      if (pakai.length >= RUMAH_SUKA_HARI) return Response.json({ galat: "❤️ hari ini sudah habis (" + RUMAH_SUKA_HARI + "/" + RUMAH_SUKA_HARI + "). Besok dapat lagi." }, { status: 400 });
      this.sql.exec("INSERT INTO rumahSuka (mg, hari, dari, ke, t) VALUES (?, ?, ?, ?, ?)", mg, hari, r.no, ke, kini);
      const suka = this.sql.exec("SELECT COUNT(*) AS n FROM rumahSuka WHERE mg = ? AND ke = ?", mg, ke).toArray()[0].n;
      const pos = 1 + this.sql.exec("SELECT COUNT(*) AS n FROM (SELECT ke, COUNT(*) AS c FROM rumahSuka WHERE mg = ? GROUP BY ke HAVING c > ?)", mg, suka).toArray()[0].n;
      return Response.json({ ok: 1, ke, suka, pos, sisa: RUMAH_SUKA_HARI - pakai.length - 1 });
    }
    if (aksi === "ajak") return Response.json(this.infoAjak(Math.max(0, Math.floor(+u.searchParams.get("no") || 0)), Math.max(0, Math.floor(+u.searchParams.get("dari") || 0))));
    if (aksi === "piala") return Response.json(this.piala(Math.max(0, Math.floor(+u.searchParams.get("no") || 0))));
    if (aksi === "iuran") {
      const q = await request.json();
      const r = this.sql.exec("SELECT no, koin, permata FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      if (!r) return Response.json({ galat: "Masuk dulu sebagai warga." }, { status: 401 });
      const kini = Date.now(), mg = new Date(kini + 7 * 3600e3 - ((new Date(kini + 7 * 3600e3).getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
      let saya = this.sql.exec("SELECT koin, permata, mg, mgn FROM iuran WHERE put = ? AND no = ?", PUTARAN_VOTING, r.no).toArray()[0] || { koin: 0, permata: 0, mg: mg, mgn: 0 };
      if (saya.mg !== mg) { saya.mg = mg; saya.mgn = 0; }
      const k = Math.max(0, Math.floor(+q.koin || 0)), pm = Math.max(0, Math.floor(+q.permata || 0));
      const galat = m => Response.json({ galat: m }, { status: 400 });
      if (k || pm) {
        const d = this.danaIuran(), sisa = d.target - d.total;
        if (sisa <= 0) return galat("Dana pembangunan sudah penuh. Fasum pemenang langsung dibangun begitu voting ditutup!");
        if (k > (r.koin || 0)) return galat("Koinmu kurang.");
        if (pm > (r.permata || 0)) return galat("Permatamu kurang.");
        if (saya.mgn + pm > IURAN_PERMATA_MINGGU) return galat("Iuran permata maks " + IURAN_PERMATA_MINGGU + " per minggu. Sisa minggu ini: " + (IURAN_PERMATA_MINGGU - saya.mgn) + " 💎.");
        if (k + pm * KOIN_PER_PERMATA > sisa) return galat("Dana tinggal kurang " + sisa + " koin lagi. Kecilkan iuranmu.");
        this.sql.exec("UPDATE warga SET koin = koin - ?, permata = permata - ? WHERE no = ?", k, pm, r.no);
        saya.koin += k; saya.permata += pm; saya.mgn += pm; this.arus("-koin:iuran", k); this.arus("-permata:iuran", pm);
        this.sql.exec("INSERT INTO iuran (put, no, koin, permata, mg, mgn) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (put, no) DO UPDATE SET koin = excluded.koin, permata = excluded.permata, mg = excluded.mg, mgn = excluded.mgn", PUTARAN_VOTING, r.no, saya.koin, saya.permata, saya.mg, saya.mgn);
      }
      const w = this.sql.exec("SELECT koin, permata FROM warga WHERE no = ?", r.no).toArray()[0];
      return Response.json({ koin: w.koin || 0, permata: w.permata || 0, saya: { koin: saya.koin, permata: saya.permata, sisaPermata: IURAN_PERMATA_MINGGU - saya.mgn }, dana: this.danaIuran() });
    }
    if (aksi === "detak") {
      const q = await request.json();
      const r = this.sql.exec("SELECT no, permata, misi, kebun FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      if (!r) return Response.json({ galat: "Masuk dulu sebagai warga." }, { status: 401 });
      const kini = Date.now(), hari = hariWib(kini);
      let ms = { t: hari, s: [] }; try { const m0 = r.misi ? JSON.parse(r.misi) : null; if (m0 && m0.t === hari && Array.isArray(m0.s)) ms = m0; } catch (e) {}
      const kb = this.bacaKebun(r); let permata = r.permata || 0, dapat = 0, siram = 0;
      const jeda = kini - (ms.dt || 0);
      if (jeda >= 50000) {
        if (jeda <= 180000) {
          ms.mm = (ms.mm || 0) + 1; this.arus("menit", 1); if (ms.mm === 1) this.arus("menit-warga", 1);
          ms.mh = ms.mh || [];
          for (const [m, p] of MENIT_TIER) if (ms.mm >= m && !ms.mh.includes(m)) { ms.mh.push(m); dapat += p; }
          if (JAM_KUMPUL.some(([a, b]) => menitWib(kini) >= a && menitWib(kini) < b)) { ms.mk = (ms.mk || 0) + 1; if (ms.mk % 10 === 0 && ms.mk / 10 <= MENIT_KUMPUL_MAKS) dapat += MENIT_KUMPUL_PERMATA; }
          if (ms.mm % SIRAM_TIAP === 0 && kb.b && kini < kb.t + PANEN_JEDA) { kb.t = Math.max(kb.t - SIRAM_MAJU, kini - PANEN_JEDA); siram = 1; }
        }
        ms.dt = kini;
        if (dapat) { permata += dapat; this.arus("+permata:menit", dapat); }
        this.sql.exec("UPDATE warga SET permata = ?, misi = ?, kebun = ?, aktif = ? WHERE no = ?", permata, JSON.stringify(ms), JSON.stringify(kb), kini, r.no);
      }
      return Response.json({ menit: { m: ms.mm || 0, h: ms.mh || [], k: Math.min(MENIT_KUMPUL_MAKS, Math.floor((ms.mk || 0) / 10)) }, dapat, permata, siram, kebun: this.infoKebun(kb) });
    }
    if (aksi === "panen" || aksi === "tanam" || aksi === "jual") {
      const q = await request.json();
      const r = this.sql.exec("SELECT no, permata, koin, koinTotal, panen, kebun, tas, pemula FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      if (!r) return Response.json({ galat: "Masuk dulu sebagai warga." }, { status: 401 });
      const kini = Date.now(), kb = this.bacaKebun(r), t = this.bacaTas(r);
      let koin = r.koin || 0, permata = r.permata || 0, info = {};
      if (aksi === "tanam") {
        const bb = BIBIT[q.bibit]; if (!bb) return Response.json({ galat: "Bibit tidak ada." }, { status: 400 });
        if (kb.b) return Response.json({ galat: "Kebunmu masih ada tanamannya." }, { status: 400 });
        // bibit tomat gratis kalau koin kurang dari 10, supaya warga baru / koin habis tetap bisa mulai berkebun
        // + gratis juga saat langkah "tanam" misi pemula (warga baru sudah dapat koin dari langkah sebelumnya)
        let pm = []; try { pm = r.pemula ? JSON.parse(r.pemula) : []; } catch (e) {}
        const pemulaTanam = Array.isArray(pm) && !pm.includes("tanam") && (pm.length > 0 || (r.koinTotal || r.koin || 0) < PEMULA_BATAS_KOIN || (r.koin || 0) < PEMULA_SALDO);
        const harga = q.bibit === "tomat" && (koin < bb.harga || pemulaTanam) ? 0 : bb.harga;
        if (koin < harga) return Response.json({ galat: "Koinmu kurang (" + harga + " koin)." }, { status: 400 });
        koin -= harga; kb.b = q.bibit; kb.t = kini; this.arus("-koin:bibit", harga);
        this.sql.exec("UPDATE warga SET koin = ?, kebun = ? WHERE no = ?", koin, JSON.stringify(kb), r.no);
      } else if (aksi === "panen") {
        if (!kb.b) return Response.json({ galat: "Tanam bibit dulu di kebunmu." }, { status: 400 });
        if (kini < kb.t + PANEN_JEDA) return Response.json({ galat: "Tanamanmu belum siap dipanen.", kebun: this.infoKebun(kb) }, { status: 400 });
        const bb = BIBIT[kb.b]; t.isi[bb.nama] = t.isi[bb.nama] || { ikon: bb.ikon, n: 0 }; t.isi[bb.nama].n += bb.hasil;
        permata += PANEN_PERMATA; this.arus("+permata:panen", PANEN_PERMATA); info = { dapat: PANEN_PERMATA, hasil: { ikon: bb.ikon, nama: bb.nama, n: bb.hasil } };
        if (!t._al[bb.nama] || t._al[bb.nama] === 1) { if (!t._al[bb.nama]) info.hasil.baru = 1; t._al[bb.nama] = kini; t._alb = albumBit(t._al); }
        kb.b = null; kb.t = 0;
        this.sql.exec("UPDATE warga SET permata = ?, panen = ?, kebun = ?, tas = ? WHERE no = ?", permata, kini, JSON.stringify(kb), JSON.stringify(t), r.no);
      } else {
        const hari = new Date(kini + 7 * 3600e3).toISOString().slice(0, 10); if (kb.jh !== hari) { kb.jh = hari; kb.jn = 0; }
        let n = 0, dapat = 0;
        for (const bb of Object.values(BIBIT)) { const x = t.isi[bb.nama]; if (!x) continue;
          const k = Math.min(x.n, BATAS_JUAL - kb.jn - n); if (k <= 0) continue;
          x.n -= k; if (x.n <= 0) delete t.isi[bb.nama]; n += k; dapat += k * bb.jual; }
        // ikan: yang mahal dijual dulu, 2 ikan termurah disisakan untuk kucing
        const ikan = Object.keys(JUAL_IKAN).filter((nm) => t.isi[nm] && t.isi[nm].n > 0);
        let bisa = ikan.reduce((a, nm) => a + t.isi[nm].n, 0) - SISA_IKAN;
        for (const nm of ikan.sort((a, b) => JUAL_IKAN[b] - JUAL_IKAN[a])) { if (bisa <= 0) break; const x = t.isi[nm];
          const k = Math.min(x.n, bisa, BATAS_JUAL - kb.jn - n); if (k <= 0) continue;
          x.n -= k; if (x.n <= 0) delete t.isi[nm]; n += k; bisa -= k; dapat += k * JUAL_IKAN[nm]; }
        if (!n) return Response.json({ galat: kb.jn >= BATAS_JUAL ? "Warungmu sudah laku " + BATAS_JUAL + " hasil hari ini. Jual lagi besok." : "Belum ada hasil panen atau ikan untuk dijual (2 ikan disisakan untuk kucing)." }, { status: 400 });
        kb.jn += n; koin += dapat; info = { terjual: n, dapatKoin: dapat }; this.arus("+koin:jual", dapat);
        this.sql.exec("UPDATE warga SET koin = ?, koinTotal = COALESCE(koinTotal, 0) + ?, kebun = ?, tas = ? WHERE no = ?", koin, dapat, JSON.stringify(kb), JSON.stringify(t), r.no);
      }
      return Response.json({ koin, permata, kebun: this.infoKebun(kb), tas: t.isi, album: t._al, ...info });
    }
    if (aksi === "pelari") {
      // Game Pelari Kalcer: op akun | mulai | selesai (setor koin lari) | beli (bayar koin/permata).
      const q = await request.json();
      const kini = Date.now(), hari = new Date(kini + 7 * 3600e3).toISOString().slice(0, 10);
      const r = this.sql.exec("SELECT * FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      // Papan peringkat asli (boleh dilihat tamu): rekor 1 KM tercepat sepanjang masa + tercepat hari ini.
      if (q.op === "papan") {
        const nama = (x) => x.ig || x.tiktok || "";
        const ambil = (kol, syarat, ...a) => this.sql.exec(`SELECT no, ig, tiktok, json_extract(pelari, '$.${kol}') AS t FROM warga WHERE pelari IS NOT NULL AND json_extract(pelari, '$.${kol}') > 0 ${syarat} ORDER BY t ASC, no ASC LIMIT 30`, ...a).toArray().map((x, i) => ({ r: i + 1, no: x.no, u: nama(x), t: x.t }));
        const semua = ambil("r", ""), harian = ambil("rh", "AND json_extract(pelari, '$.h') = ?", hari);
        let saya = null;
        if (r) { let p = {}; try { p = JSON.parse(r.pelari || "{}") || {}; } catch (e) {}
          if (p.r > 0) saya = { no: r.no, u: nama(r), t: p.r, r: 1 + this.sql.exec("SELECT COUNT(*) AS n FROM warga WHERE json_extract(pelari, '$.r') > 0 AND json_extract(pelari, '$.r') < ?", p.r).toArray()[0].n }; }
        const pelari = this.sql.exec("SELECT COUNT(*) AS n FROM warga WHERE json_extract(pelari, '$.r') > 0").toArray()[0].n;
        return Response.json({ semua, harian, saya, pelari });
      }
      if (!r) return Response.json({ galat: "Masuk dulu sebagai warga Dunia Kotak." }, { status: 401 });
      let p = {}; try { p = JSON.parse(r.pelari || "{}") || {}; } catch (e) {}
      if (!Array.isArray(p.punya)) p.punya = [];
      // statistik harian untuk misi: fh lari finish, km koin terbanyak 1 lari, pb posisi terbaik, rh rekor hari ini, iso, mulus, mk misi diklaim
      if (p.h !== hari) { p.h = hari; p.dapat = 0; p.fh = 0; p.km = 0; p.pb = 0; p.rh = 0; p.iso = 0; p.mulus = 0; p.mk = []; }
      if (!Array.isArray(p.mk)) p.mk = [];
      let koin = r.koin || 0, koinTotal = r.koinTotal || 0, permata = r.permata || 0;
      const kemarin = new Date(kini + 7 * 3600e3 - 864e5).toISOString().slice(0, 10);
      const streak = () => (p.sh === hari || p.sh === kemarin ? p.st || 0 : 0);
      const misi = () => pkMisiHari(hari).map((id) => ({ id, ok: PK_MISI[id](p), klaim: p.mk.includes(id) }));
      let misiDesa = null;
      const info = {}, jawab = (x = {}, st = 200) => Response.json({ no: r.no, ig: this.nm(r), koin, permata, punya: p.punya, sisaHari: PK_MAKS_HARI - p.dapat, rekor: p.r || 0, avatar: (() => { try { return r.avatar ? JSON.parse(r.avatar) : null; } catch (e) { return null; } })(), streak: streak(), lariHariIni: p.sh === hari, ruteBuka: p.rb || 0, misi: misi(), ...info, ...x }, { status: st });
      if (q.op === "mulai") p.m = kini;
      else if (q.op === "selesai") {
        const lama = p.m ? kini - p.m : 0; delete p.m;
        if (lama < PK_MIN_LARI) { this.sql.exec("UPDATE warga SET pelari = ? WHERE no = ?", JSON.stringify(p), r.no); return jawab({ galat: "Larinya tidak tercatat, koin tidak masuk. Coba lari lagi dari awal." }, 400); }
        // audit ekonomi #3: koin lari tidak boleh melebihi yang masuk akal untuk lama lari sungguhan (angka koin dikirim HP)
        const k = Math.max(0, Math.min(PK_MAKS_LARI, Math.floor(+q.koin || 0), PK_MAKS_HARI - p.dapat, Math.floor(lama / 1000 * PK_KOIN_DETIK)));
        this.arus("+koin:lari", k);
        p.dapat += k; koin += k; koinTotal += k; info.dapat = k;
        // lari sampai finish: catat rekor, streak & statistik misi
        const w = +q.waktu || 0;
        if (q.finish && w >= PK_REKOR_MIN && w <= 3600 && lama >= w / PK_SKALA_WAKTU * 1000 - 3000) {
          p.fh = (p.fh || 0) + 1; p.km = Math.max(p.km || 0, Math.min(PK_MAKS_LARI, Math.floor(+q.koin || 0)));
          const pos = Math.floor(+q.pos || 0); if (pos > 0) p.pb = p.pb ? Math.min(p.pb, pos) : pos;
          if (q.iso) p.iso = 1; if (q.mulus) p.mulus = 1;
          const ri = Math.max(0, Math.min(PK_RUTE.length - 1, Math.floor(+q.rute || 0)));
          if (ri === (p.rb || 0) && ri < PK_RUTE.length - 1) { p.rb = ri + 1; info.ruteBaru = PK_RUTE[ri + 1]; }
          const t = Math.round(w * 10) / 10; info.rekorBaru = !p.r || t < p.r; info.rekorHariBaru = !p.rh || t < p.rh;
          if (info.rekorBaru) p.r = t; if (info.rekorHariBaru) p.rh = t;
          const pl = this.tambahPiala(r.no, "lari"); if (pl) info.piala = pl;
          if (p.sh !== hari) { p.st = p.sh === kemarin ? (p.st || 0) + 1 : 1; p.sh = hari; info.streakNaik = true; }
          let mm = { t: hari, s: [] }; try { const m0 = r.misi ? JSON.parse(r.misi) : null; if (m0 && m0.t === hari && Array.isArray(m0.s)) mm = m0; } catch (e) {}
          if (!mm.s.includes("pelari")) { mm.s.push("pelari"); koin += PK_MISI_DESA; koinTotal += PK_MISI_DESA; info.misiDesa = PK_MISI_DESA; misiDesa = JSON.stringify(mm); this.arus("+koin:misi-lari", PK_MISI_DESA); }
          // kabar ke Chat Desa: finish pertama hari ini atau rekor baru (worker yang meneruskan ke ruang dusun)
          if (info.streakNaik || info.rekorBaru) { const fm = (x) => Math.floor(x / 60) + ":" + String(Math.floor(x % 60)).padStart(2, "0");
            info.kabar = { no: r.no, ig: r.ig || r.tiktok || "warga" + r.no, m: "🏃 Finish Pelari Kalcer 1 KM " + PK_RUTE[ri] + " " + fm(t) + (pos ? " · posisi #" + pos : "") + (info.rekorBaru ? " · REKOR BARU!" : "") + (p.st > 1 ? " · lari " + p.st + " hari beruntun" : "") + (pl ? " · +" + pl.dapat + " poin Piala Dusun" : "") }; }
        }
      } else if (q.op === "misi") {
        const id = String(q.id || "");
        if (!pkMisiHari(hari).includes(id)) return jawab({ galat: "Misi itu bukan misi hari ini." }, 400);
        if (p.mk.includes(id)) return jawab();
        if (!PK_MISI[id](p)) return jawab({ galat: "Misinya belum selesai." }, 400);
        p.mk.push(id); koin += PK_MISI_KOIN; koinTotal += PK_MISI_KOIN; info.dapat = PK_MISI_KOIN;
        permata += PK_MISI_PERMATA; info.dapatPermata = PK_MISI_PERMATA; this.arus("+koin:misi-lari", PK_MISI_KOIN); this.arus("+permata:misi-lari", PK_MISI_PERMATA);
      } else if (q.op === "beli") {
        const id = String(q.id || ""), h = PK_HARGA[id];
        if (!h) return jawab({ galat: "Barang tidak ada di toko." }, 400);
        const habis = PK_BEKAL.includes(id);
        if (!habis && p.punya.includes(id)) return jawab();
        if (pkPermata(id)) { const hp = Math.ceil(h / KOIN_PER_PERMATA); if (permata < hp) return jawab({ galat: "Permatamu kurang. Top up dulu di tab 💎." }, 400); permata -= hp; this.arus("-permata:toko-lari", hp); }
        else { if (koin < h) return jawab({ galat: "Koinmu kurang." }, 400); koin -= h; this.arus("-koin:toko-lari", h); }
        if (!habis) p.punya.push(id); info.beli = id;
      }
      this.sql.exec("UPDATE warga SET koin = ?, koinTotal = ?, permata = ?, pelari = ?, misi = COALESCE(?, misi) WHERE no = ?", koin, koinTotal, permata, JSON.stringify(p), misiDesa, r.no);
      return jawab();
    }
    if (aksi === "iklan") {
      // op "mulai" saat iklan mulai tampil, "selesai" saat Google melapor iklan ditonton (adViewed) → hadiah.
      const q = await request.json();
      const r = this.sql.exec("SELECT no, permata, iklan FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      if (!r) return Response.json({ galat: "Masuk dulu sebagai warga." }, { status: 401 });
      const kini = Date.now(), hari = new Date(kini + 7 * 3600e3).toISOString().slice(0, 10);
      let k = {}; try { k = JSON.parse(r.iklan || "{}") || {}; } catch (e) {}
      if (k.h !== hari) k = { h: hari, n: 0 };
      const info = () => ({ permata: r.permata || 0, sisa: Math.max(0, IKLAN_BATAS - k.n), hadiah: IKLAN_PERMATA });
      if (q.op === "mulai" || q.op === "selesai") {
        if (!q.aktif) return Response.json({ galat: "Iklan berhadiah belum dibuka.", ...info() }, { status: 400 });
        if (k.n >= IKLAN_BATAS) return Response.json({ galat: "Jatah iklan hari ini habis. Besok lagi ya!", ...info() }, { status: 400 });
        if (q.op === "mulai") k.m = kini;
        else {
          if (!k.m || kini - k.m < IKLAN_MIN) return Response.json({ galat: "Iklan belum selesai ditonton.", ...info() }, { status: 400 });
          k.n++; delete k.m; r.permata = (r.permata || 0) + IKLAN_PERMATA; this.arus("+permata:iklan", IKLAN_PERMATA);
          this.sql.exec("UPDATE warga SET permata = ? WHERE no = ?", r.permata, r.no);
        }
        this.sql.exec("UPDATE warga SET iklan = ? WHERE no = ?", JSON.stringify(k), r.no);
      }
      return Response.json(info());
    }
    if (aksi === "profesi") {
      const q = await request.json();
      const r = this.sql.exec("SELECT no, permata, koin, profesi FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      if (!r) return Response.json({ galat: "Masuk dulu sebagai warga." }, { status: 401 });
      const kini = Date.now(), hari = new Date(kini + 7 * 3600e3).toISOString().slice(0, 10), p = this.bacaProfesi(r), pr = PROFESI[q.id];
      let koin = r.koin || 0, permata = r.permata || 0, info = {}, tambahKoin = 0;
      const punya = id => PROFESI[id] && (PROFESI[id].harga === 0 || p.p.includes(id));
      const galat = m => Response.json({ galat: m, profesi: this.infoProfesi(p) }, { status: 400 });
      if (p.sd !== hari) { p.sd = hari; p.sn = 0; }
      if (q.op === "buka") {
        if (!pr) return galat("Profesi tidak ada.");
        if (pr.siap === false) return galat("Tempat kerja " + pr.nama + " belum berdiri. Menangkan dulu fasumnya di voting.");
        if (punya(q.id)) return galat("Kamu sudah punya profesi " + pr.nama + ".");
        if (p.sh) return galat("Selesaikan dulu shift kerjamu.");
        // audit ekonomi #3: profesi berbayar PERTAMA tiap warga setengah harga (sekali)
        const harga = p.p.length ? pr.harga : Math.ceil(pr.harga / 2);
        if (permata < harga) return galat("Permatamu kurang (" + harga + " 💎). Kumpulkan dari panen kebun, misi harian, dan hadir beruntun.");
        permata -= harga; p.p.push(q.id); p.a = q.id; this.arus("-permata:profesi", harga);
      } else if (q.op === "pakai") {
        if (!punya(q.id)) return galat("Buka dulu profesi ini di Kantor Desa.");
        if (p.sh) return galat("Selesaikan dulu shift kerjamu.");
        if (p.a !== q.id) { if (p.g === hari) return galat("Ganti profesi hanya bisa 1 kali per hari. Coba lagi besok."); p.a = q.id; p.g = hari; }
      } else if (q.op === "mulai") {
        if (!PROFESI[p.a].harga) return galat("Petani dan pedagang bekerja di kebun dan warung rumahnya sendiri.");
        if ((p.sn || 0) >= BATAS_SHIFT) return galat("Kamu sudah kerja " + BATAS_SHIFT + " shift hari ini. Istirahat, lanjut besok!");
        if (!p.sh || p.sh.p !== p.a || kini - p.sh.t0 > 3 * 3600e3) p.sh = { p: p.a, t0: kini };
      } else if (q.op === "selesai") {
        if (!p.sh) return galat("Belum mulai shift.");
        if (kini - p.sh.t0 < SHIFT_MIN) return galat("Shift belum selesai. Selesaikan semua tugas dulu.");
        if ((p.sn || 0) >= BATAS_SHIFT) { p.sh = null; return galat("Batas shift hari ini sudah habis."); }
        p.sh = null; p.sn = (p.sn || 0) + 1; koin += GAJI_SHIFT; tambahKoin = GAJI_SHIFT; info = { gaji: GAJI_SHIFT }; this.arus("+koin:gaji", GAJI_SHIFT);
      } else if (q.op === "batal") { p.sh = null; }
      else return galat("Perintah tidak dikenal.");
      this.sql.exec("UPDATE warga SET koin = ?, koinTotal = COALESCE(koinTotal, 0) + ?, permata = ?, profesi = ? WHERE no = ?", koin, tambahKoin, permata, JSON.stringify(p), r.no);
      return Response.json({ koin, permata, profesi: this.infoProfesi(p), ...info });
    }
    if (aksi === "pasar") {
      const q = await request.json(), kini = Date.now();
      if (!pasarBuka(kini)) return Response.json({ galat: "Pasar Malam buka tiap Sabtu 19.00–23.00 WIB di Stadion Kotak Wetan." }, { status: 400 });
      const r = this.sql.exec("SELECT no, koin, tas FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      if (!r) return Response.json({ galat: "Daftar jadi warga dulu supaya bisa jajan di Pasar Malam." }, { status: 401 });
      const t = this.bacaTas(r), hari = new Date(kini + 7 * 3600e3).toISOString().slice(0, 10);
      if (t._ph !== hari) { t._ph = hari; t._pj = 0; t._pg = 0; }
      let koin = r.koin || 0, hasil = null;
      if (q.op === "jajan") {
        const j = PASAR_JAJAN[q.id]; if (!j) return Response.json({ galat: "Jajanan tidak ada." }, { status: 400 });
        if (t._pj >= PASAR_JAJAN_HARI) return Response.json({ galat: "Sudah kenyang! Jajan lagi Sabtu depan ya." }, { status: 400 });
        if (koin < j[2]) return Response.json({ galat: "Koinmu kurang (" + j[2] + " koin)." }, { status: 400 });
        koin -= j[2]; t._pj++; this.arus("-koin:pasar", j[2]); hasil = { ikon: j[0], nama: j[1], harga: j[2] };
      } else if (q.op === "gelang") {
        if (t._pg >= PASAR_GELANG_HARI) return Response.json({ galat: "Gelangnya habis untuk malam ini. Main lagi Sabtu depan!" }, { status: 400 });
        if (koin < PASAR_GELANG) return Response.json({ galat: "Koinmu kurang (" + PASAR_GELANG + " koin)." }, { status: 400 });
        if (kini - (t._tg || 0) < 4000) return Response.json({ galat: "Pelan-pelan, satu-satu ya." }, { status: 429 });
        const kena = Math.max(0, Math.min(3, Math.floor(+q.kena || 0)));
        koin -= PASAR_GELANG; t._pg++; t._tg = kini; this.arus("-koin:pasar", PASAR_GELANG); hasil = { kena };
        if (kena >= 2) { const sv = SUVENIR[Math.floor(Math.random() * SUVENIR.length)]; t.isi[sv[1]] = t.isi[sv[1]] || { ikon: sv[0], n: 0 }; t.isi[sv[1]].n++;
          hasil.suvenir = { ikon: sv[0], nama: sv[1] }; if (!t._al[sv[1]] || t._al[sv[1]] === 1) { if (!t._al[sv[1]]) hasil.suvenir.baru = 1; t._al[sv[1]] = kini; t._alb = albumBit(t._al); } }
      } else return Response.json({ galat: "?" }, { status: 400 });
      this.sql.exec("UPDATE warga SET koin = ?, tas = ? WHERE no = ?", koin, JSON.stringify(t), r.no);
      return Response.json({ koin, tas: t.isi, album: t._al, hasil, sisa: { jajan: PASAR_JAJAN_HARI - t._pj, gelang: PASAR_GELANG_HARI - t._pg } });
    }
    if (aksi === "tas") {
      const q = await request.json();
      const r = this.sql.exec("SELECT no, tas FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      if (!r) return Response.json({ galat: "Masuk dulu sebagai warga." }, { status: 401 });
      const t = this.bacaTas(r), hari = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10), kini = Date.now();
      if (t._h !== hari) { t._h = hari; t._a = 0; t._m = 0; }
      const isi = t.isi, tambah = (nama, ikon) => { isi[nama] = isi[nama] || { ikon, n: 0 }; isi[nama].n++; };
      let hasil = null;
      if (q.op === "ambil") {
        if (!BARANG[q.nama]) return Response.json({ galat: "Barang tidak dikenal." }, { status: 400 });
        if (t._a >= BATAS_AMBIL) return Response.json({ galat: "Tasmu penuh untuk hari ini. Besok pungut lagi ya." }, { status: 400 });
        if (kini - (t._ta || 0) < 1200) return Response.json({ galat: "Pelan-pelan, satu-satu ya." }, { status: 429 });
        t._a++; t._ta = kini; tambah(q.nama, BARANG[q.nama]); hasil = { ikon: BARANG[q.nama], nama: q.nama };
      } else if (q.op === "mancing") {
        if (t._m >= BATAS_MANCING) return Response.json({ galat: "Ikan di sungai lagi habis. Mancing lagi besok ya." }, { status: 400 });
        if (kini - (t._tm || 0) < 3500) return Response.json({ galat: "Tunggu umpannya dulu." }, { status: 429 });
        let x = Math.random() * 100, h = IKAN[0]; for (const i of IKAN) { if ((x -= i[0]) < 0) { h = i; break; } }
        t._m++; t._tm = kini; tambah(h[2], h[1]); hasil = { ikon: h[1], nama: h[2] };
        if (!t._al[h[2]]) { t._al[h[2]] = kini; hasil.baru = 1; t._alb = albumBit(t._al); }
      } else if (q.op === "makan") {
        const ikan = Object.entries(isi).filter(([n, v]) => v.n > 0 && IKAN.some((i) => i[2] === n && i[1] !== "👟")).sort((a, b) => b[1].n - a[1].n)[0];
        if (!ikan) return Response.json({ galat: "🎣 Tidak ada ikan di inventori. Mancing dulu di sungai, baru bisa memberi makan kucing." }, { status: 400 });
        ikan[1].n--; if (ikan[1].n <= 0) delete isi[ikan[0]]; hasil = { ikon: ikan[1].ikon, nama: ikan[0] };
      } else if (q.op === "impor" && !t._impor) {
        // pindahan dari tas lama di HP (sekali), maks 10 per barang supaya tidak bisa diakali
        t._impor = 1; const lama = q.isi && typeof q.isi === "object" ? q.isi : {};
        for (const [n, v] of Object.entries(lama).slice(0, 20)) { const ik = BARANG[n] || (IKAN.find((i) => i[2] === n) || [])[1]; if (!ik) continue;
          const k = Math.max(0, Math.min(10, Math.floor(+(v && v.n) || 0))); if (k) { isi[n] = isi[n] || { ikon: ik, n: 0 }; isi[n].n += k; } }
      }
      this.sql.exec("UPDATE warga SET tas = ? WHERE no = ?", JSON.stringify(t), r.no);
      return Response.json({ tas: isi, hasil, album: t._al });
    }
    if (aksi === "dekor") {
      const q = await request.json();
      const r = this.sql.exec("SELECT * FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      if (!r) return Response.json({ galat: "Masuk dulu sebagai warga." }, { status: 401 });
      if (!DEKOR.includes(q.id) || !q.mode) return Response.json({ galat: "Hiasan tidak ada." }, { status: 400 });
      const h = this.bacaHias(r); h.punya.dekor = h.punya.dekor || []; h.dekor = (h.dekor || []).filter(x => DEKOR.includes(x));
      if (q.mode === "beli" && !h.punya.dekor.includes(q.id)) {
        const harga = DEKOR_KOIN[q.id]; if (!harga) return Response.json({ galat: "Hiasan tidak dijual." }, { status: 400 });
        if ((r.koin || 0) < harga) return Response.json({ galat: "Koinmu kurang (" + harga + " koin)." }, { status: 400 });
        r.koin = (r.koin || 0) - harga; this.sql.exec("UPDATE warga SET koin = ? WHERE no = ?", r.koin, r.no); this.arus("-koin:hiasan", harga);
        h.punya.dekor.push(q.id);
      }
      if (q.mode === "rakit" && !RESEP_DEKOR[q.id]) return Response.json({ galat: "Hiasan ini hanya bisa dibeli pakai koin." }, { status: 400 });
      if (q.mode === "rakit" && !h.punya.dekor.includes(q.id)) {
        const t = this.bacaTas(r), resep = RESEP_DEKOR[q.id];
        if (!Object.entries(resep).every(([n, k]) => (t.isi[n] && t.isi[n].n || 0) >= k)) return Response.json({ galat: "Bahannya belum cukup. Pungut barang bercahaya di jalan." }, { status: 400 });
        for (const [n, k] of Object.entries(resep)) { t.isi[n].n -= k; if (t.isi[n].n <= 0) delete t.isi[n]; }
        this.sql.exec("UPDATE warga SET tas = ? WHERE no = ?", JSON.stringify(t), r.no); r.tas = JSON.stringify(t);
        h.punya.dekor.push(q.id);
      }
      if (q.mode !== "lepas" && !h.punya.dekor.includes(q.id)) return Response.json({ galat: "Rakit dulu hiasannya." }, { status: 400 });
      h.dekor = h.dekor.filter(x => x !== q.id); if (q.mode !== "lepas") h.dekor.push(q.id);
      this.sql.exec("UPDATE warga SET hias = ? WHERE no = ?", JSON.stringify(h), r.no);
      return Response.json({ hias: h, tas: this.bacaTas(r).isi, koin: r.koin || 0 });
    }
    if (aksi === "toko") {
      const q = await request.json();
      const r = this.sql.exec("SELECT * FROM warga WHERE kunci = ?", String(q.kunci || "")).toArray()[0];
      if (!r) return Response.json({ galat: "Masuk dulu sebagai warga." }, { status: 401 });
      const h = this.bacaHias(r); let koin = r.koin || 0, permata = r.permata || 0;
      const j = q.jenis, id = q.id;
      if (j || id) {
        if (!TOKO_HIAS[j] || !(id in TOKO_HIAS[j])) return Response.json({ galat: "Barang tidak ada." }, { status: 400 });
        const harga = TOKO_HIAS[j][id];
        if (harga && !h.punya[j].includes(id)) {
          if (q.bayar === "koin") { const hk = harga * KOIN_PER_PERMATA; if (koin < hk) return Response.json({ galat: "Koinmu kurang (" + hk + " koin)." }, { status: 400 }); koin -= hk; this.arus("-koin:toko-hias", hk); }
          else { if (permata < harga) return Response.json({ galat: "Permatamu kurang (" + harga + " permata)." }, { status: 400 }); permata -= harga; this.arus("-permata:toko-hias", harga); }
          h.punya[j].push(id);
        }
        h[j] = id;   // langsung dipakai
        const av = j === "topi" ? this.pasangTopi(r.avatar, id) : r.avatar;
        this.sql.exec("UPDATE warga SET koin = ?, permata = ?, hias = ?, avatar = ? WHERE no = ?", koin, permata, JSON.stringify(h), av, r.no);
        r.avatar = av;
      }
      let av = null; try { av = r.avatar ? JSON.parse(r.avatar) : null; } catch (e) {}
      return Response.json({ koin, permata, hias: h, avatar: av, toko: TOKO_HIAS, kali: KOIN_PER_PERMATA });
    }
    // Hanya dipanggil worker (tidak ada rute publik yang meneruskan ke sini tanpa token).
    if (aksi === "rahasia-set") { const q = await request.json(); this.sql.exec("INSERT INTO rahasia (k, v, t) VALUES (?, ?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v, t = excluded.t", q.k, q.v, Date.now()); return Response.json({ ok: 1 }); }
    if (aksi === "rahasia-get") { const r = this.sql.exec("SELECT v, t FROM rahasia WHERE k = ?", u.searchParams.get("k")).toArray()[0]; return Response.json(r || {}); }
    if (aksi === "saweria" || aksi === "trakteer") {
      // Dipanggil worker SETELAH tanda tangan webhook Saweria / token webhook Trakteer dicek (Huda 8 Nov 2026: pindah ke Trakteer). Kode warga di pesan: DK123 (nomor kavling).
      const q = await request.json();
      if (this.sql.exec("SELECT 1 FROM donasi WHERE id = ?", q.id).toArray().length) return Response.json({ ok: 1, dobel: 1 });
      const m = /\bDK\s*[-.#:]?\s*(\d{1,5})\b/i.exec(q.pesan + " " + q.nama);
      let no = m ? +m[1] : 0;
      if (no && !this.sql.exec("SELECT 1 FROM warga WHERE no = ?", no).toArray().length) no = 0;
      // audit ekonomi #3: tanpa kode DK → cocokkan nama pendukung dengan username IG/TikTok warga (harus persis & hanya satu warga)
      if (!no) { const un = bersihUn(q.nama); if (/^[a-z0-9._]{3,30}$/.test(un)) { const c = this.sql.exec("SELECT no FROM warga WHERE ig = ? OR tiktok = ?", un, un).toArray(); if (c.length === 1) no = c[0].no; } }
      const b = Math.max(0, Math.floor(q.rp / 1000));
      this.sql.exec("INSERT INTO donasi (id, t, no, rp, bintang, nama, pesan) VALUES (?, ?, ?, ?, ?, ?, ?)", q.id, Date.now(), no || null, q.rp, no ? b : 0, q.nama, q.pesan);
      if (no && b) { this.sql.exec("UPDATE warga SET bintang = COALESCE(bintang, 0) + ?, permata = COALESCE(permata, 0) + ? WHERE no = ?", b, b * PERMATA_PER_RIBU, no); this.arus("+permata:bata", b * PERMATA_PER_RIBU); }
      this.sesudahDonasi(no);
      return Response.json({ ok: 1, no, bintang: no ? b : 0, permata: no ? b * PERMATA_PER_RIBU : 0 });
    }
    if (aksi === "donasi-misterius") {
      // Hanya dipanggil worker setelah token setel dicek. Tanpa nomor: daftar traktiran tanpa warga. Dengan id+no: pindahkan ke warga itu.
      const q = await request.json();
      if (q.id && q.no) {
        const d = this.sql.exec("SELECT id, no, rp FROM donasi WHERE id = ?", String(q.id)).toArray()[0];
        if (!d) return Response.json({ galat: "Traktiran tidak ditemukan." }, { status: 404 });
        if (d.no) return Response.json({ galat: "Traktiran ini sudah milik warga No. " + d.no + "." }, { status: 409 });
        const no = Math.floor(+q.no); if (!this.sql.exec("SELECT 1 FROM warga WHERE no = ?", no).toArray().length) return Response.json({ galat: "Warga No. " + no + " tidak ada." }, { status: 404 });
        const b = Math.max(0, Math.floor(d.rp / 1000));
        this.sql.exec("UPDATE donasi SET no = ?, bintang = ? WHERE id = ?", no, b, d.id);
        if (b) { this.sql.exec("UPDATE warga SET bintang = COALESCE(bintang, 0) + ?, permata = COALESCE(permata, 0) + ? WHERE no = ?", b, b * PERMATA_PER_RIBU, no); this.arus("+permata:bata", b * PERMATA_PER_RIBU); }
        this.sesudahDonasi(no);
        return Response.json({ ok: 1, no, bintang: b, permata: b * PERMATA_PER_RIBU });
      }
      return Response.json({ donasi: this.sql.exec("SELECT id, t, rp, nama, pesan FROM donasi WHERE no IS NULL ORDER BY t DESC LIMIT 50").toArray() });
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
    if (aksi === "peringkat") {
      // Papan peringkat warga (6 Nov 2026): koin terbanyak. Hanya username publik (IG/TikTok), nama asli tidak ditampilkan.
      // Avatar top 3 ikut dikirim (sama seperti yang terlihat warga lain di game) untuk podium + vlog Raka "warga teratas".
      // Audit ekonomi (Huda 6 Nov 2026): peringkat = TOTAL koin yang pernah didapat (koinTotal), jadi belanja tidak menurunkan peringkat.
      const top = this.sql.exec("SELECT no, ig, tiktok, koinTotal AS koin, avatar FROM warga WHERE COALESCE(koinTotal, 0) > 0 ORDER BY koinTotal DESC, no ASC LIMIT 100").toArray()
        .map((r, i) => { const o = { r: i + 1, no: r.no, u: r.ig || r.tiktok || "", koin: r.koin };
          if (i < 3 && r.avatar) { try { o.av = JSON.parse(r.avatar); } catch (e) {} }
          return o; });
      const jml = this.sql.exec("SELECT COUNT(*) AS n FROM warga WHERE COALESCE(koinTotal, 0) > 0").toArray()[0].n;
      const no = +u.searchParams.get("no") || 0;
      let saya = null;
      if (no) { const m = this.sql.exec("SELECT koinTotal FROM warga WHERE no = ?", no).toArray()[0];
        if (m) { const k = m.koinTotal || 0; saya = { no, koin: k, r: k > 0 ? this.sql.exec("SELECT COUNT(*) AS n FROM warga WHERE COALESCE(koinTotal, 0) > ? OR (COALESCE(koinTotal, 0) = ? AND no < ?)", k, k, no).toArray()[0].n + 1 : null }; } }
      return Response.json({ top, jml, saya });
    }
    if (aksi === "usulan-publik") {
      const rows = this.sql.exec("SELECT no, ig, tiktok, usulan FROM warga WHERE usulan IS NOT NULL AND usulan != '' ORDER BY no").toArray();
      return Response.json({ jumlah: rows.length, usulan: rows });
    }
    if (aksi === "warga-npc") {
      // Warga offline jadi NPC (Huda 6 Nov 2026): warga yang pernah main (paling baru dulu) di rentang nomor satu dusun,
      // hanya avatar + username publik (sama dengan yang terlihat saat mereka online). Klien menyembunyikan yang sedang online.
      const a = Math.max(0, +u.searchParams.get("a") || 0), b = Math.max(a, +u.searchParams.get("b") || 0);
      const rows = this.sql.exec("SELECT no, ig, tiktok, avatar FROM warga WHERE no > ? AND no <= ? AND avatar IS NOT NULL AND aktif IS NOT NULL ORDER BY aktif DESC LIMIT 40", a, b).toArray();
      const warga = []; for (const r of rows) { try { const av = JSON.parse(r.avatar); if (av && (r.ig || r.tiktok)) warga.push({ no: r.no, u: r.ig || r.tiktok, av }); } catch (e) {} }
      return Response.json({ warga });
    }
    if (aksi === "daftar-publik") {
      // Gabungkan warga terdaftar dengan 63 pengikut awal yang kavlingnya sudah disiapkan (sudah warga sejak video).
      const rows = this.sql.exec("SELECT no, sub, nama, ig, tiktok, usulan, dibuat, kucing, aktif, hias, json_extract(tas, '$._alb') AS alb FROM warga ORDER BY no").toArray();
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
const KATA_KASAR = ["anjing","anjir","anjrit","anjrot","anjim","anjay","anjeng","anying","anjg","ajg","njing","njir","bangsat","bangsad","bangset","bangsatt","bgst","bngst","bgsd","bajingan","bajingn","bjingan","bjgn","bajing","babi","monyet","kampret","kontol","kntl","kontl","memek","mmk","ngentot","ngntt","entot","ngewe","jancok","jancuk","jancik","jnck","janc","diancok","jiancok","dancok","dancuk","dancik","cok","cuk","jamput","asu","asw","asuw","bacot","tolol","tll","goblok","goblog","gblk","gblg","bego","idiot","tai","taik","tahi","setan","sialan","brengsek","bangke","bangkai","keparat","celeng","kirik","pantek","pepek","itil","lonte","pelacur","jablay","perek","bencong","banci","bodoh","dongo","kimak","pukimak","pukimai","cukimai","ngehe","coli","sange","bokep","porno","telanjang","jembut","jembud","silit","matamu","raimu","ndasmu","cangkem","cangkemmu","gathel","pecun","kafir","sundel","budeg","picek","cebong","kampang","tempik","turuk","tetek","toket","geblek","fuck","fck","shit","bitch","dick","pussy","sex","seks","wtf"];
const KASAR = new Set(KATA_KASAR.map((k) => k.replace(/(.)\1+/g, "$1")));
const AKHIRAN = ["mu","ne","e","lah","nya","an","i","k"];
const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i" };
function rapatKata(w) { return w.toLowerCase().replace(/[0134578@$!]/g, (c) => LEET[c] || c).replace(/[^a-z]/g, "").replace(/(.)\1+/g, "$1"); }
function kataKasar(n) {
  if (!n) return false;
  if (KASAR.has(n)) return true;
  for (const a of AKHIRAN) if (n.length > a.length + 2 && n.endsWith(a) && KASAR.has(n.slice(0, -a.length))) return true;
  for (const k of KASAR) if (k.length >= 5 && n.includes(k)) return true;
  return false;
}
function saringChat(teks) {
  let m = String(teks || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!m) return { galat: "Pesan kosong." };
  const rapat = m.replace(/[\s.\-_()+]/g, "");
  if (/\d{8,}/.test(rapat) || /(\+62|\b08)\d{6,}/.test(rapat)) return { galat: "Demi keamanan, nomor dan link tidak boleh dikirim." };
  if (/(https?:|www\.|\.com|\.id\b|\.net|\.org|\.ly|wa\.me|t\.me|bit\.ly|s\.id|lynk|linktr)/i.test(m)) return { galat: "Demi keamanan, nomor dan link tidak boleh dikirim." };
  if (/@[a-z0-9._]{2,}/i.test(m)) return { galat: "Demi keamanan, nomor dan link tidak boleh dikirim." };
  // Kata dipecah huruf per huruf ("b a n g s a t", "c.o.k") digabung dulu supaya tetap tersaring.
  const tok = m.split(/(\s+)/);
  const kotor = new Array(tok.length).fill(false);
  for (let i = 0; i < tok.length; i++) {
    if (/^\s+$/.test(tok[i])) continue;
    if (kataKasar(rapatKata(tok[i]))) { kotor[i] = true; continue; }
    // gabungan potongan pendek berurutan (1-2 huruf atau dipisah titik)
    let j = i, gab = "", idx = [];
    while (j < tok.length) {
      if (/^\s+$/.test(tok[j])) { j++; continue; }
      const r = rapatKata(tok[j]);
      if (r.length > 2 && !/[.\-_*]/.test(tok[j])) break;
      gab += r; idx.push(j); j++;
      if (idx.length >= 2 && kataKasar(gab.replace(/(.)\1+/g, "$1"))) { for (const x of idx) kotor[x] = true; break; }
    }
  }
  m = tok.map((w, i) => (kotor[i] ? "★★★" : w)).join("").replace(/★★★(\s*★★★)+/g, "★★★");
  return { m };
}
const DUSUN_RUANG = ["wetan", "kulon", "curug", "tlaga", "segara"];
export class Ruang extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER, no INTEGER, ig TEXT, ch TEXT, m TEXT)`);
    try { this.sql.exec("ALTER TABLE chat ADD COLUMN d TEXT"); } catch (e) {}   // asal dusun pesan (chat Desa lintas dusun)
    this.sql.exec(`CREATE TABLE IF NOT EXISTS lapor (pelapor INTEGER, terlapor INTEGER, t INTEGER, PRIMARY KEY (pelapor, terlapor))`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS bisu (no INTEGER PRIMARY KEY, sampai INTEGER)`);
    // Pencatat sesi main (dashboard Huda, 7 Nov 2026): jam masuk + jejak terakhir (detak posisi tiap ±30 dtk). Tidak tampil ke warga.
    this.sql.exec(`CREATE TABLE IF NOT EXISTS sesi (id INTEGER PRIMARY KEY AUTOINCREMENT, no INTEGER, masuk INTEGER, akhir INTEGER)`);
    this.pos = new Map();
    this.kirimTerakhir = 0;
  }
  // Sekali saja (Huda 6 Nov 2026): riwayat Chat Dusun lama dari semua dusun digabung jadi satu riwayat Chat Desa, tidak dihapus.
  async gabungRiwayat(nama) {
    this.sql.exec("CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)");
    if (this.sql.exec("SELECT v FROM meta WHERE k = 'gabung'").toArray()[0]) return;
    this.sql.exec("UPDATE chat SET d = ? WHERE ch = 'dusun' AND (d IS NULL OR d = '')", nama);
    if (!this.env.RUANG) return;
    let ok = true;
    for (const lain of DUSUN_RUANG.filter((x) => x !== nama)) {
      try {
        const rows = await (await this.env.RUANG.get(this.env.RUANG.idFromName(lain)).fetch("https://ruang/lama?nama=" + lain)).json();
        for (const c of rows) {
          if (this.sql.exec("SELECT 1 FROM chat WHERE ch = 'dusun' AND t = ? AND no = ?", c.t, c.no).toArray()[0]) continue;
          this.sql.exec("INSERT INTO chat (t, no, ig, ch, m, d) VALUES (?, ?, ?, 'dusun', ?, ?)", c.t, c.no, c.ig, c.m, lain);
        }
      } catch (e) { ok = false; }
    }
    if (ok) this.sql.exec("INSERT OR REPLACE INTO meta (k, v) VALUES ('gabung', '1')");
  }
  semua() { return this.ctx.getWebSockets().map((ws) => ({ ws, a: ws.deserializeAttachment() || {} })); }
  siar(o, kecuali) { const s = JSON.stringify(o); for (const { ws } of this.semua()) { if (ws !== kecuali) try { ws.send(s); } catch (e) {} } }
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      const u = new URL(request.url);
      // Chat Desa: pesan dari dusun lain (sudah disaring di dusun asal) → simpan + siarkan di dusun ini.
      if (u.pathname === "/desa" && request.method === "POST") {
        const c = await request.json();
        if (!c || !c.no || typeof c.m !== "string") return new Response("{}", { status: 400 });
        this.sql.exec("INSERT INTO chat (t, no, ig, ch, m, d) VALUES (?, ?, ?, 'dusun', ?, ?)", c.w, c.no, c.ig, c.m, c.d || "");
        this.siar({ t: "c", no: c.no, ig: c.ig, ch: "dusun", m: c.m, w: c.w, d: c.d || "" });
        return new Response("{}");
      }
      // Riwayat chat dusun milik ruang ini (pesan asli dusun ini, termasuk yang lama sebelum Chat Desa digabung).
      if (u.pathname === "/lama") {
        const nama = u.searchParams.get("nama") || "";
        return Response.json(this.sql.exec("SELECT t, no, ig, m FROM chat WHERE ch = 'dusun' AND (d IS NULL OR d = '' OR d = ?) ORDER BY id DESC LIMIT 200", nama).toArray());
      }
      // Statistik untuk dashboard Huda (dipanggil worker setelah kunci dashboard dicek).
      if (u.pathname === "/statistik") {
        const sejak = +u.searchParams.get("sejak") || Date.now() - 14 * 864e5, nama = u.searchParams.get("nama") || "";
        const sesi = this.sql.exec("SELECT no, masuk, akhir FROM sesi WHERE masuk >= ? ORDER BY masuk", sejak).toArray();
        const chat = this.sql.exec("SELECT date((t + 25200000) / 1000, 'unixepoch') AS h, COUNT(*) AS n, COUNT(DISTINCT no) AS w FROM chat WHERE ch = 'dusun' AND t >= ? AND (d IS NULL OR d = '' OR d = ?) GROUP BY h", sejak, nama).toArray();
        const sekitar = this.sql.exec("SELECT date((t + 25200000) / 1000, 'unixepoch') AS h, COUNT(*) AS n FROM chat WHERE ch = 'sekitar' AND t >= ? GROUP BY h", sejak).toArray();
        return Response.json({ sesi, chat, sekitar });
      }
      if (u.pathname === "/online") { const w = this.semua().filter((x) => x.a.no).map((x) => ({ no: x.a.no, ig: x.a.ig || "" })); return Response.json({ online: w.length, warga: w }); }
      return new Response("{}", { status: 404 });
    }
    const w = JSON.parse(request.headers.get("x-warga") || "{}");
    const [c, s] = Object.values(new WebSocketPair());
    // Satu warga = satu koneksi: tutup koneksi lama warga yang sama.
    for (const { ws, a } of this.semua()) if (a.no === w.no) { try { ws.close(4000, "Masuk dari tempat lain"); } catch (e) {} }
    this.ctx.acceptWebSocket(s);
    const p0 = { x: w.x || 0, z: w.z || 0, r: 0, a: 0 };
    const kini = Date.now();
    let sid = 0; try { sid = this.sql.exec("INSERT INTO sesi (no, masuk, akhir) VALUES (?, ?, ?) RETURNING id", w.no, kini, kini).toArray()[0].id; } catch (e) {}
    if (Math.random() < 0.02) this.sql.exec("DELETE FROM sesi WHERE masuk < ?", kini - 90 * 864e5);
    s.serializeAttachment({ no: w.no, ig: w.ig, av: w.avatar || null, d: w.d || "", ...p0, kirim: 0, sid, tulis: kini, simpan: kini });
    const lain = this.semua().filter((x) => x.ws !== s && x.a.no).map(({ a }) => ({ no: a.no, ig: a.ig, av: a.av, ...(this.pos.get(a.no) || { x: a.x, z: a.z, r: a.r || 0, a: 0 }) }));
    if (w.d) await this.gabungRiwayat(w.d);
    const riwayat = this.sql.exec("SELECT t, no, ig, ch, m, d FROM chat WHERE ch = 'dusun' ORDER BY t DESC LIMIT 60").toArray().reverse().map((r) => ({ ...r, m: saringChat(r.m).m || "★★★" }));
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
      if (now - (a.simpan || 0) > 5000) {
        // Detak sesi: posisi datang tiap ≤10 dtk selama game terbuka di layar (tab di belakang berhenti kirim).
        let tulis = a.tulis || 0;
        if (a.sid && now - tulis > 30000) { this.sql.exec("UPDATE sesi SET akhir = ? WHERE id = ?", now, a.sid); tulis = now; }
        ws.serializeAttachment({ ...a, ...p, simpan: now, tulis });
      }
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
      this.sql.exec("INSERT INTO chat (t, no, ig, ch, m, d) VALUES (?, ?, ?, ?, ?, ?)", now, a.no, a.ig, ch, h.m, a.d || "");
      if (Math.random() < 0.05) { this.sql.exec("DELETE FROM chat WHERE t < ?", now - 7 * 864e5); this.sql.exec("DELETE FROM lapor WHERE t < ?", now - 864e5); }
      this.siar({ t: "c", no: a.no, ig: a.ig, ch, m: h.m, w: now, d: a.d || "" });
      // Chat Desa tersambung semua dusun (Huda 6 Nov 2026): teruskan ke ruang dusun lain.
      if (ch === "dusun" && this.env.RUANG) {
        const isi = JSON.stringify({ no: a.no, ig: a.ig, m: h.m, w: now, d: a.d || "" });
        this.ctx.waitUntil(Promise.all(DUSUN_RUANG.filter((d) => d !== a.d).map((d) =>
          this.env.RUANG.get(this.env.RUANG.idFromName(d)).fetch("https://ruang/desa", { method: "POST", body: isi }).catch(() => {}))));
      }
      return;
    }
    if (q.t === "e" && q.e === "lompat") { if (now - (a.lompat || 0) > 500) { ws.serializeAttachment({ ...a, lompat: now }); this.siar({ t: "e", no: a.no, e: "lompat" }, ws); } return; }
    if (q.t === "e") { const e = ["sapa", "hati", "tawa", "main"].includes(q.e) ? q.e : null; if (e && now - (a.emote || 0) > 1500) { ws.serializeAttachment({ ...a, emote: now }); this.siar({ t: "e", no: a.no, e }); } return; }
    if (q.t === "bola") {   // bola stadion: tendangan warga diteruskan ke warga lain di dusun yang sama
      const b = { t: "bola", x: +q.x, z: +q.z, vx: +q.vx, vz: +q.vz };
      if (![b.x, b.z, b.vx, b.vz].every(Number.isFinite) || Math.abs(b.vx) > 80 || Math.abs(b.vz) > 80) return;
      if (now - (a.bola || 0) > 250) { ws.serializeAttachment({ ...a, bola: now }); this.siar(b, ws); }
      return;
    }
    if (q.t === "av") { const av = q.av && typeof q.av === "object" ? q.av : null; ws.serializeAttachment({ ...a, av }); this.siar({ t: "av", no: a.no, av }, ws); return; }
    if (q.t === "lapor") {
      const t = Math.floor(+q.no); if (!t || t === a.no) return;
      this.sql.exec("INSERT OR REPLACE INTO lapor (pelapor, terlapor, t) VALUES (?, ?, ?)", a.no, t, now);
      const n = this.sql.exec("SELECT COUNT(*) AS n FROM lapor WHERE terlapor = ? AND t > ?", t, now - 864e5).toArray()[0].n;
      if (n >= 3) { this.sql.exec("INSERT OR REPLACE INTO bisu (no, sampai) VALUES (?, ?)", t, now + 3600e3); this.sql.exec("DELETE FROM lapor WHERE terlapor = ?", t); }
      ws.send(JSON.stringify({ t: "info", m: "Laporan terkirim. Terima kasih sudah menjaga desa." }));
    }
  }
  async webSocketClose(ws) { const a = ws.deserializeAttachment() || {};
    // Akhir sesi = detak posisi terakhir (bukan saat koneksi putus, supaya tab yang ditinggal tidak terhitung main).
    if (a.sid && a.simpan) try { this.sql.exec("UPDATE sesi SET akhir = MAX(akhir, ?) WHERE id = ?", a.simpan, a.sid); } catch (e) {}
    if (a.no) { this.pos.delete(a.no); this.siar({ t: "keluar", no: a.no }, ws); } }
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

// Misi harian warga → koin (dicek di server: sekali per misi per hari WIB).
// Kolam misi + undian harian: urutan & cara undi HARUS sama dengan KOLAM_MISI/undiMisi di mabar/game.js.
// Lima menit pertama (7 Nov 2026): misi harian dibuka sepanjang hari (koin 1x), Jam Kumpul Warga koin 2x. false = kembali hanya di Jam Kumpul.
const MISI_SEPANJANG_HARI = true;
// Misi pemula: [id, koin, permata]. Urutan HARUS sama dengan PEMULA di mabar/game.js. Total 100 koin = cukup beli hiasan pertama.
const PEMULA = [["jalan", 10], ["tanam", 15], ["ambil", 15], ["sapa", 10], ["raka", 50, 10]];
const PEMULA_BATAS_KOIN = 300;   // warga lama yang sudah kumpul ≥300 koin tidak ikut misi pemula
const PEMULA_SALDO = 50;   // Huda 7 Nov: warga lama yang saldo koinnya < 50 juga ikut misi pemula
// Hadiah hadir beruntun hari ke-1..7 (koin), lalu berulang.
const HADIAH_HADIR = [10, 15, 20, 25, 30, 40, 60];
const MISI_KOLAM = [["jalan", 10], ["sapa", 10], ["raka", 5], ["tetangga", 10], ["foto", 10], ["ambil", 10], ["mancing", 10], ["sungai", 5], ["lari", 5], ["kucing", 5], ["lompat", 5], ["fasum", 10], ["stadion", 5], ["npc", 10], ["supermarket", 5], ["rs", 5], ["dusun", 15], ["khas", 15]];
function misiHari(hari) {
  let h = 2166136261; for (const c of "dk" + hari) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const r = () => { h = (h + 0x6D2B79F5) >>> 0; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = MISI_KOLAM.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return Object.fromEntries([...a.slice(0, 6), ["bonus", 20]]);
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
  const ajak = Math.max(0, Math.min(99999, Math.floor(+body.ajak || 0)));
  return { ig, tiktok, namaWarga, kerja, ajak };
}

// Gabungkan statistik warga (DO desa) + sesi main tiap dusun (DO ruang) untuk dashboard Huda.
async function statistikDashboard(env, stub) {
  const now = Date.now(), sejak = now - 14 * 864e5, DUSUN = ["wetan", "kulon", "curug", "tlaga", "segara"];
  const w = await (await stub.fetch("https://do/statistik")).json();
  const mentah = [], chat = {}, sekitar = {}, online = { total: 0, per: {} };
  await Promise.all(DUSUN.map(async (d) => {
    try {
      const ru = env.RUANG.get(env.RUANG.idFromName(d));
      const j = await (await ru.fetch("https://do/statistik?nama=" + d + "&sejak=" + sejak)).json();
      for (const x of j.sesi || []) mentah.push({ ...x, d });
      for (const x of j.chat || []) { chat[x.h] = chat[x.h] || { n: 0, w: 0 }; chat[x.h].n += x.n; chat[x.h].w += x.w; }
      for (const x of j.sekitar || []) sekitar[x.h] = (sekitar[x.h] || 0) + x.n;
      const o = await (await ru.fetch("https://do/online")).json(); online.per[d] = o.online || 0; online.total += o.online || 0;
    } catch (e) { online.per[d] = online.per[d] || 0; }
  }));
  // Pindah dusun = koneksi baru; sambungkan sesi warga yang jedanya < 2 menit jadi satu sesi main.
  mentah.sort((a, b) => a.no - b.no || a.masuk - b.masuk);
  const sesi = [];
  for (const x of mentah) {
    const t = sesi[sesi.length - 1];
    if (t && t.no === x.no && x.masuk - t.akhir < 120e3) { t.akhir = Math.max(t.akhir, x.akhir); continue; }
    sesi.push({ no: x.no, masuk: x.masuk, akhir: Math.max(x.akhir, x.masuk), d: x.d });
  }
  const hariWibT = (t) => new Date(t + 7 * 3600e3).toISOString().slice(0, 10);
  const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const perHari = {}, hariWarga = new Map(), jam = Array(24).fill(0), lama = [];
  for (const s of sesi) {
    const h = hariWibT(s.masuk), mnt = (s.akhir - s.masuk) / 60000;
    const p = perHari[h] = perHari[h] || { sesi: 0, menit: [], warga: new Set() };
    p.sesi++; p.menit.push(mnt); p.warga.add(s.no); lama.push(mnt);
    if (!hariWarga.has(s.no)) hariWarga.set(s.no, new Set()); hariWarga.get(s.no).add(h);
    // menit main per jam WIB (untuk tahu jam ramai)
    for (let t = s.masuk; t < s.akhir; t += 60000) jam[new Date(t + 7 * 3600e3).getUTCHours()]++;
  }
  // Puncak online per hari dari tumpang tindih sesi.
  const puncak = {};
  const ev = []; for (const s of sesi) { ev.push([s.masuk, 1]); ev.push([s.akhir + 1, -1]); }
  ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]); let c = 0;
  for (const [t, k] of ev) { c += k; const h = hariWibT(t); if (!puncak[h] || c > puncak[h]) puncak[h] = c; }
  const hari = Object.keys(perHari).sort().map((h) => {
    const p = perHari[h], menitWarga = p.menit.reduce((a, b) => a + b, 0);
    let lamaW = 0; for (const no of p.warga) { const hs = [...hariWarga.get(no)].sort(); if (hs[0] < h) lamaW++; }
    return { h, sesi: p.sesi, warga: p.warga.size, kembali: lamaW, rata: +(menitWarga / p.sesi).toFixed(1), median: +median(p.menit).toFixed(1), totalMenit: Math.round(menitWarga), puncak: puncak[h] || 0, chat: (chat[h] || {}).n || 0, chatWarga: (chat[h] || {}).w || 0, sekitar: sekitar[h] || 0, daftar: w.daftar[h] || 0 };
  });
  const b = [[0, 1], [1, 5], [5, 15], [15, 30], [30, 60], [60, 1e9]];
  const sebaran = b.map(([x, y]) => ({ dari: x, sampai: y, n: lama.filter((m) => m >= x && m < y).length }));
  const pemain = hariWarga.size, balik = [...hariWarga.values()].filter((s) => s.size >= 2).length;
  return { ...w, online, hari, jam, sebaran, ringkas: { sesi: sesi.length, pemain, balik, rata: lama.length ? +(lama.reduce((a, b) => a + b, 0) / lama.length).toFixed(1) : 0, median: +median(lama).toFixed(1), sesiPerPemain: pemain ? +(sesi.length / pemain).toFixed(2) : 0, mulaiCatat: mentah.length ? Math.min(...mentah.map((x) => x.masuk)) : 0 } };
}

// Hemat kuota Durable Objects (10 Nov 2026: semua API warga sempat mati, dugaan batas harian Cloudflare habis).
// GET publik yang sama untuk semua warga disimpan di cache Cloudflare beberapa detik, jadi ratusan HP berbagi satu
// panggilan ke database. Data pribadi (POST, sesi, kunci) tidak pernah di-cache.
const CACHE_API = { online: 15, warga: 60, "warga-npc": 120, peringkat: 60, usulan: 120, rumah: 60, ajak: 60, piala: 60, pendukung: 60, voting: 30 };
async function apiWarga(request, env, url, ctx) {
  const aksi = url.pathname.replace("/duniakotak/api/", ""), detik = CACHE_API[aksi];
  if (request.method !== "GET" || !detik || typeof caches === "undefined") return apiWargaInti(request, env, url);
  const kunci = new Request(url.toString(), { method: "GET" }), cache = caches.default;
  try { const ada = await cache.match(kunci); if (ada) return ada; } catch (e) {}
  const res = await apiWargaInti(request, env, url);
  if (res.status !== 200) return res;
  const h = new Headers(res.headers); h.set("cache-control", `public, max-age=${detik}`);
  const simpan = new Response(res.body, { status: 200, headers: h });
  try { const p = cache.put(kunci, simpan.clone()); if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p; } catch (e) {}
  return simpan;
}
async function apiWargaInti(request, env, url) {
  const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  const aksi = url.pathname.replace("/duniakotak/api/", "");
  if (aksi === "config") return json({ clientId: env.GOOGLE_CLIENT_ID || "", iklan: env.IKLAN_H5 === "1" ? 1 : 0 });
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
    const r = await stub.fetch("https://do/sesi?ws=1", { method: "POST", body: JSON.stringify({ kunci }) });
    if (!r.ok) return json({ galat: "Masuk dulu sebagai warga." }, 401);
    const w = await r.json();
    const dusun = DUSUN_RUANG.includes(url.searchParams.get("dusun")) ? url.searchParams.get("dusun") : "wetan";
    const h = new Headers(request.headers);
    h.set("x-warga", JSON.stringify({ no: w.no, ig: w.ig, avatar: w.avatar, d: dusun, x: +url.searchParams.get("x") || 0, z: +url.searchParams.get("z") || 0 }));
    return env.RUANG.get(env.RUANG.idFromName(dusun)).fetch(new Request("https://do/ws", { headers: h }));
  }
  if (aksi === "online" && request.method === "GET") {
    if (!env.RUANG) return json({ online: 0 });
    // gabungan semua dusun (Huda 6 Nov 2026: status online terlihat semua, jadi satu)
    const DUSUN = ["wetan", "kulon", "curug", "tlaga"], per = { segara: 0 }, warga = [], lihat = new Set();
    await Promise.all(DUSUN.map(async (d) => { try { const j = await (await env.RUANG.get(env.RUANG.idFromName(d)).fetch("https://do/online")).json(); per[d] = 0;
      for (const x of j.warga || []) if (!lihat.has(x.no)) { lihat.add(x.no); warga.push({ ...x, d }); per[d]++; } } catch (e) { per[d] = 0; } }));
    warga.sort((a, b) => a.no - b.no);
    return json({ online: warga.length, per, warga });
  }
  if (aksi === "peringkat" && request.method === "GET") {
    const no = Math.max(0, Math.min(99999, parseInt(url.searchParams.get("no") || "0", 10) || 0));
    return new Response((await stub.fetch("https://do/peringkat" + (no ? "?no=" + no : ""))).body, { headers: { "content-type": "application/json", "cache-control": no ? "no-store" : "public, max-age=30" } });
  }
  if (aksi === "warga-npc" && request.method === "GET") {
    const RENTANG = { wetan: [0, 260], kulon: [260, 460], curug: [460, 660], tlaga: [660, 860], segara: [860, 1e9] }, [a, b] = RENTANG[url.searchParams.get("dusun")] || RENTANG.wetan;
    return new Response((await stub.fetch(`https://do/warga-npc?a=${a}&b=${b}`)).body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=60" } });
  }
  if (aksi === "usulan" && request.method === "GET") {
    return new Response((await stub.fetch("https://do/usulan-publik")).body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=30", "access-control-allow-origin": "*" } });
  }
  if (aksi === "rumah" && request.method === "GET") {
    const no = Math.max(0, Math.min(99999, parseInt(url.searchParams.get("no") || "0", 10) || 0));
    return new Response((await stub.fetch("https://do/rumah" + (no ? "?no=" + no : ""))).body, { headers: { "content-type": "application/json", "cache-control": no ? "no-store" : "public, max-age=30", "access-control-allow-origin": "*" } });
  }
  if (aksi === "ajak" && request.method === "GET") {
    const no = Math.max(0, Math.min(99999, parseInt(url.searchParams.get("no") || "0", 10) || 0)), dari = Math.max(0, Math.min(99999, parseInt(url.searchParams.get("dari") || "0", 10) || 0));
    return new Response((await stub.fetch("https://do/ajak?no=" + no + "&dari=" + dari)).body, { headers: { "content-type": "application/json", "cache-control": no ? "no-store" : "public, max-age=30" } });
  }
  if (aksi === "piala" && request.method === "GET") {
    const no = Math.max(0, Math.min(99999, parseInt(url.searchParams.get("no") || "0", 10) || 0));
    return new Response((await stub.fetch("https://do/piala" + (no ? "?no=" + no : ""))).body, { headers: { "content-type": "application/json", "cache-control": no ? "no-store" : "public, max-age=30", "access-control-allow-origin": "*" } });
  }
  if (aksi === "pendukung" && request.method === "GET") {
    return new Response((await stub.fetch("https://do/pendukung")).body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=30", "access-control-allow-origin": "*" } });
  }
  if (aksi === "voting" && request.method === "GET") {
    return new Response((await stub.fetch("https://do/voting-publik")).body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=20" } });
  }
  if (request.method !== "POST") return json({ galat: "Metode salah" }, 405);
  let body;
  try { body = await request.json(); } catch (e) { return json({ galat: "Data tidak terbaca" }, 400); }
  const bersihUsulan = (v) => String(v || "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 140);
  // Dashboard pantau warga (Huda 7 Nov 2026: tanpa kunci). Halaman tidak ditautkan dari game.
  if (aksi === "statistik") return json(await statistikDashboard(env, stub));
  if (aksi === "jejak") {
    await stub.fetch("https://do/jejak", { method: "POST", body: JSON.stringify({ m: String(body.m || "").slice(0, 6), d: String(body.d || "").slice(0, 8), p: String(body.p || "").slice(0, 16) }) });
    return json({ ok: 1 });
  }
  if (aksi === "detak") {
    const r = await stub.fetch("https://do/detak", { method: "POST", body: JSON.stringify({ kunci: String(body.kunci || "").slice(0, 64) }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
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
  if (aksi === "kucing") {
    // Kucing warga: maks 2 ekor, 8 warna, nama maks 12 huruf (disaring), kandang warna dinding + atap.
    const WK = ["oranye", "hitam", "putih", "abu", "cokelat", "krem", "tuxedo", "telon"];
    const WD = ["krem", "putih", "kuning", "hijau", "biru", "merahMuda", "ungu", "kayu"];
    const WA = ["merah", "oranye", "cokelat", "hijau", "biru", "abu", "hitam", "ungu"];
    const b = body.kucing || {};
    const k = (Array.isArray(b.k) ? b.k : []).slice(0, 2).map((x) => ({
      w: WK.includes(x && x.w) ? x.w : "oranye",
      n: String((x && x.n) || "").replace(/<[^>]*>/g, "").replace(/[\u0000-\u001f<>@]/g, "").replace(/\s+/g, " ").trim().slice(0, 12),
    }));
    for (const x of k) if (x.n && saringChat(x.n).m !== x.n) return json({ galat: "Nama kucing itu tidak bisa dipakai. Pakai nama yang sopan ya." }, 400);
    const kc = k.length ? { k, d: WD.includes(b.d) ? b.d : "krem", a: WA.includes(b.a) ? b.a : "merah" } : null;
    const r = await stub.fetch("https://do/kucing", { method: "POST", body: JSON.stringify({ kunci: String(body.kunci || "").slice(0, 64), kucing: kc ? JSON.stringify(kc) : null }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "bagikan") {
    const r = await stub.fetch("https://do/bagikan", { method: "POST", body: JSON.stringify({ kunci: String(body.kunci || "").slice(0, 64) }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "rumah-suka") {
    const r = await stub.fetch("https://do/rumah-suka", { method: "POST", body: JSON.stringify({ kunci: String(body.kunci || "").slice(0, 64), ke: Math.max(0, Math.min(99999, Math.floor(+body.ke || 0))) }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "gol") {
    const r = await stub.fetch("https://do/gol", { method: "POST", body: JSON.stringify({ kunci: String(body.kunci || "").slice(0, 64) }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "panen" || aksi === "tanam" || aksi === "jual") {
    const r = await stub.fetch("https://do/" + aksi, { method: "POST", body: JSON.stringify({ kunci: String(body.kunci || "").slice(0, 64), bibit: String(body.bibit || "").slice(0, 10) }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "iuran") {
    const r = await stub.fetch("https://do/" + aksi, { method: "POST", body: JSON.stringify({ kunci: String(body.kunci || "").slice(0, 64), koin: +body.koin || 0, permata: +body.permata || 0 }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "pelari") {
    const q = { kunci: String(body.kunci || "").slice(0, 64), op: String(body.op || "").slice(0, 10), id: String(body.id || "").slice(0, 24), bayar: body.bayar === "permata" ? "permata" : "koin", koin: +body.koin || 0,
      finish: !!body.finish, waktu: +body.waktu || 0, pos: +body.pos || 0, iso: !!body.iso, mulus: !!body.mulus, rute: Math.max(0, Math.floor(+body.rute || 0)) };
    const r = await stub.fetch("https://do/pelari", { method: "POST", body: JSON.stringify(q) });
    const j = await r.json();
    // Hasil lari diumumkan di Chat Desa (semua dusun), lalu kabar dihapus dari jawaban.
    if (j.kabar && env.RUANG) { const isi = JSON.stringify({ ...j.kabar, w: Date.now(), d: "" });
      await Promise.all(DUSUN_RUANG.map((d) => env.RUANG.get(env.RUANG.idFromName(d)).fetch("https://ruang/desa", { method: "POST", body: isi }).catch(() => {}))); j.diumumkan = true; }
    delete j.kabar;
    return Response.json(j, { status: r.status, headers: { "cache-control": "no-store" } });
  }
  if (aksi === "iklan") {
    const r = await stub.fetch("https://do/iklan", { method: "POST", body: JSON.stringify({ kunci: String(body.kunci || "").slice(0, 64), op: String(body.op || "").slice(0, 10), aktif: env.IKLAN_H5 === "1" }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "profesi") {
    const r = await stub.fetch("https://do/profesi", { method: "POST", body: JSON.stringify({ kunci: String(body.kunci || "").slice(0, 64), op: String(body.op || "").slice(0, 10), id: String(body.id || "").slice(0, 12) }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "pasar") {
    const q = { kunci: String(body.kunci || "").slice(0, 64), op: String(body.op || "").slice(0, 10), id: String(body.id || "").slice(0, 12), kena: +body.kena || 0 };
    const r = await stub.fetch("https://do/pasar", { method: "POST", body: JSON.stringify(q) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "tas") {
    const q = { kunci: String(body.kunci || "").slice(0, 64), op: String(body.op || "").slice(0, 10), nama: String(body.nama || "").slice(0, 30) };
    if (q.op === "impor" && body.isi && typeof body.isi === "object") q.isi = body.isi;
    const r = await stub.fetch("https://do/tas", { method: "POST", body: JSON.stringify(q) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "dekor") {
    const q = { kunci: String(body.kunci || "").slice(0, 64), id: String(body.id || "").slice(0, 12), mode: ["rakit", "beli", "pasang", "lepas"].includes(body.mode) ? body.mode : "" };
    const r = await stub.fetch("https://do/dekor", { method: "POST", body: JSON.stringify(q) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "toko") {
    const q = { kunci: String(body.kunci || "").slice(0, 64), jenis: String(body.jenis || "").slice(0, 10), id: String(body.id || "").slice(0, 12), bayar: body.bayar === "koin" ? "koin" : "permata" };
    const r = await stub.fetch("https://do/toko", { method: "POST", body: JSON.stringify(q) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "voting") {
    const q = { kunci: String(body.kunci || "").slice(0, 64) };
    if (body.calon) { q.calon = String(body.calon).slice(0, 20); q.n = Math.max(1, Math.min(100000, Math.floor(+body.n || 1))); }
    const r = await stub.fetch("https://do/voting", { method: "POST", body: JSON.stringify(q) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "saweria-kunci") {
    // Setel Stream Key Saweria dari halaman atur-saweria (butuh token setel). Key tidak pernah dikirim balik.
    const tk = String(body.token || "").trim().toUpperCase(), key = String(body.key || "").trim();
    const h = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tk)))].map((b) => b.toString(16).padStart(2, "0")).join("");
    if (h !== HASH_TOKEN_SETEL) return json({ galat: "Token setel salah." }, 403);
    if (!/^[A-Za-z0-9_-]{8,200}$/.test(key)) return json({ galat: "Stream Key tidak terbaca. Tempel hanya kode setelah streamKey= (tanpa link)." }, 400);
    await stub.fetch("https://do/rahasia-set", { method: "POST", body: JSON.stringify({ k: "saweria", v: key }) });
    return json({ ok: 1, pesan: "Stream Key tersimpan. Donasi Saweria sekarang bisa menambah bintang." });
  }
  if (aksi === "trakteer-kunci") {
    // Setel Webhook Token Trakteer (Huda 8 Nov 2026: donasi pindah dari Saweria ke trakteer.id/duniakotak.id).
    const tk = String(body.token || "").trim().toUpperCase(), key = String(body.key || "").trim();
    const h = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tk)))].map((b) => b.toString(16).padStart(2, "0")).join("");
    if (h !== HASH_TOKEN_SETEL) return json({ galat: "Token setel salah." }, 403);
    if (!/^[A-Za-z0-9_.:-]{8,300}$/.test(key)) return json({ galat: "Webhook Token tidak terbaca. Salin token dari Trakteer > Integrasi > Webhook." }, 400);
    await stub.fetch("https://do/rahasia-set", { method: "POST", body: JSON.stringify({ k: "trakteer", v: key }) });
    return json({ ok: 1, pesan: "Webhook Token Trakteer tersimpan. Traktiran Bata sekarang masuk otomatis." });
  }
  if (aksi === "donasi-misterius") {
    // Huda (audit ekonomi #3): lihat traktiran tanpa kode DK dan pindahkan ke nomor warga. Butuh token setel yang sama dengan atur-saweria.html.
    const tk = String(body.token || "").trim().toUpperCase();
    const h = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tk)))].map((b) => b.toString(16).padStart(2, "0")).join("");
    if (h !== HASH_TOKEN_SETEL) return json({ galat: "Token setel salah." }, 403);
    const r = await stub.fetch("https://do/donasi-misterius", { method: "POST", body: JSON.stringify({ id: body.id ? String(body.id).slice(0, 90) : "", no: Math.floor(+body.no || 0) }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "trakteer-status") {
    const ada = !!(env.TRAKTEER_TOKEN || (await (await stub.fetch("https://do/rahasia-get?k=trakteer")).json()).v);
    return json({ siap: ada });
  }
  if (aksi === "trakteer") {
    // Webhook Trakteer: header X-Webhook-Token = token dari Trakteer > Integrasi > Webhook (disimpan lewat atur-saweria.html
    // atau Secret TRAKTEER_TOKEN). Isi: transaction_id, supporter_name, supporter_message, unit, quantity, price, net_amount.
    // Kode warga di pesan: DK123. Nilai dihitung dari harga kotor (price); bila price ternyata per unit, quantity x Rp5.000 dipakai.
    let kunciTk = env.TRAKTEER_TOKEN || (await (await stub.fetch("https://do/rahasia-get?k=trakteer")).json()).v;
    const tt = String(request.headers.get("X-Webhook-Token") || "");
    // Huda 8 Nov 2026 (pilih "Ya, otomatis"): token disimpan dari kiriman PERTAMA Trakteer (tombol Test, tidak dicatat sebagai donasi) supaya tidak perlu
    // ditempel di halaman atur. Setelah tersimpan, hanya token itu yang diterima. Ganti token lewat atur-saweria.html.
    if (!kunciTk && /^[A-Za-z0-9_.:-]{8,300}$/.test(tt)) { await stub.fetch("https://do/rahasia-set", { method: "POST", body: JSON.stringify({ k: "trakteer", v: tt }) }); return json({ ok: 1, pesan: "Webhook Token Trakteer tersimpan dari kiriman pertama (dianggap Test, tidak dicatat sebagai donasi)." }); }
    if (!kunciTk) return json({ galat: "Webhook belum disiapkan" }, 503);
    let beda = tt.length ^ kunciTk.length; for (let i = 0; i < kunciTk.length; i++) beda |= kunciTk.charCodeAt(i) ^ (tt.charCodeAt(i) || 0);
    if (!tt || beda) return json({ galat: "Token salah" }, 403);
    const jml = Math.max(0, Math.floor(+body.quantity || 0));
    const rp = Math.max(Math.floor(+body.price || 0), jml * BATA_RP);
    const q = { id: "tk:" + String(body.transaction_id || body.id || "").slice(0, 80), rp, nama: String(body.supporter_name || "").slice(0, 60), pesan: String(body.supporter_message || "").slice(0, 300) };
    if (q.id === "tk:") return json({ galat: "Tanpa transaction_id" }, 400);
    const r = await stub.fetch("https://do/trakteer", { method: "POST", body: JSON.stringify(q) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "saweria-status" ) {
    const ada = !!(env.SAWERIA_KEY || (await (await stub.fetch("https://do/rahasia-get?k=saweria")).json()).v);
    return json({ siap: ada });
  }
  if (aksi === "saweria") {
    // Webhook Saweria: header Saweria-Callback-Signature = HMAC-SHA256 (hex) dengan Stream Key atas
    // version + id + amount_raw + donator_name + donator_email. Stream Key disimpan sebagai Secret SAWERIA_KEY (bukan di kode).
    const kunciSw = env.SAWERIA_KEY || (await (await stub.fetch("https://do/rahasia-get?k=saweria")).json()).v;
    if (!kunciSw) return json({ galat: "Webhook belum disiapkan" }, 503);
    const tt = String(request.headers.get("Saweria-Callback-Signature") || "").toLowerCase();
    if (!tt) return json({ galat: "Tanpa tanda tangan" }, 401);
    const data = ["version", "id", "amount_raw", "donator_name", "donator_email"].map((k) => body[k] ?? "").join("");
    const kunciH = await crypto.subtle.importKey("raw", new TextEncoder().encode(kunciSw), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const hx = [...new Uint8Array(await crypto.subtle.sign("HMAC", kunciH, new TextEncoder().encode(data)))].map((b) => b.toString(16).padStart(2, "0")).join("");
    let beda = hx.length ^ tt.length; for (let i = 0; i < hx.length; i++) beda |= hx.charCodeAt(i) ^ (tt.charCodeAt(i) || 0);
    if (beda) return json({ galat: "Tanda tangan salah" }, 403);
    const q = { id: String(body.id || "").slice(0, 80), rp: Math.max(0, Math.floor(+body.amount_raw || 0)), nama: String(body.donator_name || "").slice(0, 60), pesan: String(body.message || "").slice(0, 300) };
    if (!q.id) return json({ galat: "Tanpa id" }, 400);
    const r = await stub.fetch("https://do/saweria", { method: "POST", body: JSON.stringify(q) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "misi" || aksi === "pemula" || aksi === "hadir") {
    const r = await stub.fetch("https://do/" + aksi, { method: "POST", body: JSON.stringify({ kunci: String(body.kunci || "").slice(0, 64), id: String(body.id || "").slice(0, 20) }) });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (aksi === "sesi" || aksi === "kode" || aksi === "avatar") {
    let q;
    if (aksi === "kode") {
      const raw = String(body.kode || "").slice(0, 120), un = bersihUn(raw);
      q = { kode: raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6), un: /^[a-z0-9._]{1,30}$/.test(un) ? un : "" };
    } else q = { kunci: String(body.kunci || "").slice(0, 64) };
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
    // Huda 7 Nov 2026: URL iklan Meta tidak bisa diubah → pengunjung beranda dari FB/IG
    // (fbclid atau utm_source meta/fb/ig) dibawa ke halaman iklan kaos kelas. Hapus blok ini kalau iklan ganti tema.
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const src = (url.searchParams.get("utm_source") || "").toLowerCase();
      if (url.searchParams.has("fbclid") || ["meta", "facebook", "instagram", "fb", "ig"].includes(src)) {
        url.pathname = "/kelas/";
        return Response.redirect(url.toString(), 302);
      }
    }
    // Halaman iklan kaos kelas: /kelas, /KELAS, /kelas. → /kelas/ (parameter iklan ikut).
    if (pendek === "/kelas" && url.pathname !== "/kelas/") {
      url.pathname = "/kelas/";
      return Response.redirect(url.toString(), 301);
    }
    // Alat rencana pesanan kaos semua kalangan: /pesan, /rencana, /order → /pesan/.
    if (["/pesan", "/rencana", "/order"].includes(pendek) && url.pathname !== "/pesan/") {
      url.pathname = "/pesan/";
      return Response.redirect(url.toString(), 301);
    }
    // Landing game edukasi Dunia Kotak: /edukasi, /belajar, /duniakotak/belajar → /duniakotak/belajar/.
    if (["/edukasi", "/belajar", "/duniakotak/belajar"].includes(pendek) && url.pathname !== "/duniakotak/belajar/") {
      url.pathname = "/duniakotak/belajar/";
      return Response.redirect(url.toString(), 301);
    }
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
    if (url.pathname.startsWith("/duniakotak/api/")) return apiWarga(request, env, url, ctx);
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
