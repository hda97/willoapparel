---
name: uji-bisnis-willo
description: Menguji ide, produk, harga, atau penawaran Willo (kaos custom, game edukasi lynk.id, Dunia Kotak) sebelum keluar uang: dewan 3 kacamata, panel pembeli simulasi, harga, penawaran, hitungan untung, vonis.
---

# Uji Bisnis Willo

Diadaptasi dari founder-skill (Jake Schincariol, MIT, github.com/Jakeschincariol/founder-skill; salinan lengkapnya ada di `.claude/skills/founder-*`). Semua jawaban dalam Bahasa Indonesia, semua uang dalam Rupiah.

Pakai saat Huda bertanya "laku nggak?", "harganya berapa?", "untung nggak?", "uji ide ini", "kenapa nggak ada yang beli?", atau sebelum membuat produk baru (paket game, varian kaos, paket bintang). Untuk tahap yang lebih dalam, skill asli bisa dipakai langsung: founder-board, founder-competitors, founder-consumer, founder-pricing, founder-offer, founder-cfo, founder-marketing, founder-brand, founder-ops, founder-launch, founder-plan.

Konteks tetap: Willo Apparel berdiri 2020, situs willoapparel.com. Harga kaos custom: satuan mulai 55K, kelas mulai 65K, komunitas mulai 70K. Produk digital dijual di lynk.id. Dunia Kotak: bintang Rp1.000, pemain banyak anak.

## Aturan dasar

1. Uji dulu, baru keluar uang. Simulasi menemukan keberatan; pembeli nyata (pre-order, waitlist, DM berharga) yang membuktikan.
2. Setiap angka punya sumber: dari Huda, dari harga publik bertautan, atau ditandai PERKIRAAN dengan alasannya. Jangan mengarang pesaing, harga, rating, atau ulasan.
3. Vonis dihitung, bukan dirasa.
4. Pembeli simulasi adalah riset, bukan testimoni. AI cenderung mengiyakan: tingkat beli = batas atas. Kutipan panel tidak boleh masuk iklan.
5. Tanpa trik palsu: tidak ada ulasan palsu, hitung mundur palsu, "sisa 3", harga coret yang tak pernah berlaku. Untuk produk yang dibeli anak (Dunia Kotak), tanpa urgensi yang menekan.
6. Kerangka dewan adalah ringkasan buku yang terbit. Tulis "kacamata Penawaran", jangan "kata Hormozi".

Simpan hasil di `/mnt/project-files/uji-bisnis/<nama-produk>/` (atau di pesan bila tidak ada folder).

## Langkah 0: kartu ide

Tulis 5 baris: apa itu (1 kalimat), untuk siapa (spesifik), jual apa dan harga berapa, di mana dan bagaimana sampai ke pembeli, anggaran dan batasan. Bila nama, pembeli, produk, atau harga kosong, tanya paling banyak 3 pertanyaan dalam satu pesan.

## Langkah 1: dewan (3 kacamata)

Nilai ide dari tiga sisi, masing-masing skor 1-10, 3 risiko pembunuh, pertanyaan untuk pendiri, dan voting DANAI / DANAI JIKA (dengan syarat) / TOLAK. Rincian kacamata ada di `.claude/skills/founder-board/lenses.md`.

- Penawaran (dari $100M Offers): pasarnya sakit, punya uang, mudah dijangkau, tumbuh? Value equation: hasil impian x keyakinan berhasil, dibagi waktu x usaha. Jangan bersaing hanya di harga.
- Monopoli (dari Zero to One): pasar kecil apa yang bisa dikuasai dulu? Apa rahasianya? Bagaimana 100 pembeli pertama datang dan berapa biayanya? Apa yang mencegah peniru di bulan ke-6?
- Produk (dari biografi Steve Jobs): satu hal apa yang harus luar biasa? Bagaimana 5 menit pertama pembeli? Apa yang dibuang? Di mana sambungan antar orang/sistem yang rawan rusak?

Kalau Huda minta pendapat yang tidak terpengaruh, jalankan tiap kacamata sebagai sub-agent terpisah. Rangkum: hasil voting, risiko yang disebut lebih dari satu kacamata, daftar syarat sebagai checklist, dan versi terkuat bisnis ini. Pertahankan perbedaan pendapat.

## Langkah 2: pesaing

Langsung, tidak langsung, pengganti (contoh kaos kelas: konveksi lokal, toko kaos di Shopee/Tokopedia, beli kaos polos lalu sablon sendiri). 5-10 nama dengan harga barang sebanding, slogan mereka, rating, tautan. Baca ulasan bintang 1-3 dulu, kelompokkan keluhan dengan jumlahnya. Akhiri dengan celah yang bisa Willo kuasai, atau katakan terus terang bila tidak ada celah.

## Langkah 3: panel pembeli simulasi

Susun profil pembeli: 2-4 segmen (porsi + rentang penghasilan), 4-8 perilaku membeli, 4-8 keberatan nyata. Tunjukkan profil ke Huda dulu untuk dikoreksi. Contoh keberatan kaos kelas: "di marketplace lebih murah", "takut sablon luntur", "minimal order berapa?", "jadinya lama", "hasil beda dari desain". Contoh guru (game edukasi): "kelas tidak ada proyektor", "internet sekolah lemot", "harus izin kepsek", "uang pribadi".

Tulis pitch 3-6 baris persis seperti yang dilihat pembeli. Jalankan 20 pembeli (cepat) sebagai sub-agent, masing-masing dengan kartu persona berbeda; 100 hanya bila Huda minta, karena boros token. Alat `panel.py` di `.claude/skills/founder-consumer/` bisa membagikan kartu dan menghitung hasil (penghasilan ditulis per tahun = bulanan x 12). Tiap pembeli menjawab: beli (ya/tidak), jumlah beli bulan pertama, alasan dengan kata-katanya, keberatan utama, apa yang mengubah pikirannya, dan 4 harga (terlalu murah, murah, mulai mahal, terlalu mahal). Jangan pernah menjawab untuk pembeli.

Laporkan: "8 beli, 12 tidak", segmen yang paling beda, 3 alasan menolak teratas dengan satu kutipan, apa yang paling sering mengubah "tidak", dan satu hal yang perlu diubah.

## Langkah 4: harga

Dari 4 jawaban harga, hitung rentang Van Westendorp (alat: `.claude/skills/founder-pricing/van_westendorp.py`): PMC (di bawah ini dianggap murahan), OPP (paling sedikit penolakan), IPP (seimbang murah vs mahal), PME (di atas ini banyak yang mundur). Bandingkan dengan harga pesaing sebanding dan margin dari langkah 6. Hasil: harga yang disarankan, tangga harga (contoh game: 1 game / paket jenjang / lisensi sekolah; kaos: satuan / kelas / komunitas), promo pembukaan dengan tanggal berakhir, dan 2 harga untuk diuji ke pembeli nyata.

## Langkah 5: penawaran

Daftar 15-30 hambatan pembeli (sebelum, saat, sesudah beli), ubah jadi solusi, nilai tiap solusi (manfaat 1-5, biaya 1-5), simpan yang manfaat tinggi biaya rendah. Susun: inti (ditulis sebagai hasil, bukan bahan), 2-3 bonus yang masing-masing mematikan satu keberatan, garansi yang biayanya sudah dihitung, urgensi hanya bila benar, dan nama penawaran. Nilai value equation sebelum dan sesudah, lalu uji ulang ke panel cepat dengan persona yang sama.

## Langkah 6: hitungan untung

Kumpulkan: satuan jual, harga, biaya per unit (rinci), biaya tetap bulanan, modal awal, target per hari, perkiraan 12 bulan pertama, kapasitas per hari. Hitung:
- Kontribusi per unit = harga - biaya per unit.
- Impas per hari = biaya tetap bulanan / kontribusi / hari kerja per bulan.
- Margin pada target, laba tahun 1 per bulan, modal kas yang dibutuhkan sebelum balik modal, bulan balik modal.
- Skenario: harga -10%, penjualan -20%, biaya per unit +15%.

Tandai: harga di bawah biaya per unit, impas di atas kapasitas, tahun 1 rugi, balik modal lebih dari 12 bulan. Untuk produk digital lynk.id, biaya per unit utamanya potongan platform dan pajak; tanyakan angkanya, jangan ditebak.

Alat: `python3 .claude/skills/founder-cfo/unit_economics.py <numbers.json>` (format contoh: `founder-cfo/example.json`). Tulis angka polos (55000, bukan Rp55.000) karena titik dibaca sebagai desimal; label "$" di laporan dibaca sebagai Rp.

## Langkah 7: vonis

- MENGUNTUNGKAN: kontribusi per unit positif DAN tahun 1 untung DAN impas di bawah kapasitas DAN tingkat beli panel minimal 25%.
- BELUM: sebutkan angka yang gagal dan langkah mana yang memperbaikinya.
- BELUM LENGKAP: data apa yang kurang.

Jangan membulatkan angka gagal jadi lulus.

## Langkah 8: uji nyata dan peluncuran

Pilih uji termurah: kaos = pre-order kelas dengan DP dan tanggal; game = halaman lynk.id pre-order atau 3 guru pilot berbayar; fitur Dunia Kotak = nyalakan untuk sebagian kecil pemain. Tulis garis sukses sebelum mulai (contoh: 5 kelas DP dalam 2 minggu). Bila pembeli nyata jauh di bawah panel, percaya pembeli nyata dan kembali ke langkah 4 atau 5. Lalu kalender 30 hari dan 10 hook yang masing-masing menjawab satu keberatan panel.

## Batasan

Iklan berbayar dipasang Huda sendiri di Ads Manager; skill ini hanya menyiapkan bahan dan membaca hasil. Bukan nasihat keuangan, hukum, atau pajak.
