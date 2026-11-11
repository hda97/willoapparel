# Bot Indodax (paper trading)

Bot ini berlatih trading di Indodax dengan **uang bohongan**. Ia hanya membaca harga publik Indodax. Tidak ada kunci API, tidak login, dan tidak bisa bertransaksi sungguhan. Folder ini tidak ikut tayang di situs (situs hanya menyajikan `public/`).

## Strategi: nabung mingguan dengan sabuk pengaman tren

1. Tiap Senin bot menyetor Rp100.000 bohongan: 70% untuk BTC, 30% untuk SOL.
2. Selama harga penutupan harian di atas rata-rata 50 hari (SMA50), uangnya dibelikan koin.
3. Begitu harga penutupan harian turun di bawah SMA50, koin itu dijual semua ke rupiah. Bot menunggu, setoran tetap dikumpulkan, dan baru beli lagi saat harga kembali di atas SMA50.

Sebagai pembanding, bot juga mencatat hasil "nabung polos" (selalu beli, tidak pernah jual).

## Dasar pemilihan (riset 11 November 2026)

Data: harga harian Indodax 2018 sampai 11 Nov 2026, biaya 0,5% tiap beli dan tiap jual.

- **BTC** paling ramai di Indodax (sekitar Rp34 miliar per hari) dengan selisih beli-jual 0,01%. Sejak 2023 naik +412% dengan penurunan terdalam 49%. SOL +862% tetapi sempat turun 73%. ETH +97%.
- Koin kecil punya selisih beli-jual 0,5% sampai 2,6%, jadi tidak dipakai.
- Dari 8 aturan trading pada 8 koin, **tidak ada yang konsisten mengalahkan beli-lalu-tahan dari sisi untung**. Aturan tren terutama memangkas kerugian.
- Nabung mingguan BTC dua tahun terakhir: polos -8,4% (terdalam -35%); dengan sabuk SMA50 +6,4% (terdalam -15%). Sejak 2023: polos +61,5%, dengan sabuk +76,7%. Pola serupa di ETH dan SOL.

Kelemahan: saat harga naik-turun tipis di sekitar SMA50, bot sering keluar-masuk dan kena biaya. Hasil masa lalu bukan jaminan.

## Cara pakai

- `python3 bot.py` satu kali cek (aman dijalankan berkali-kali sehari).
- `python3 bot.py --laporan` ringkasan hasil.
- `python3 bot.py --reset` mulai dari nol.
- `python3 uji_bot.py` uji otomatis tanpa internet.

Pengaturan ada di `config.json`: jumlah setoran, hari setor, bobot koin, panjang SMA, biaya.

Bot butuh `curl`, karena API publik Indodax menolak klien bawaan Python tetapi menerima curl.

## Jalan otomatis

Workflow `.github/workflows/bot-indodax.yml` mengecek pasar beberapa kali sehari. Laporan ada di tab Actions > "Bot Indodax (paper trading)" > run terbaru > Summary. Karena jadwal GitHub di repo ini sering dilewati, tiap run menunggu sekitar 3 jam lalu memicu run berikutnya (rantai otomatis), jadi selalu ada satu run berstatus "in progress" dan itu normal. Hentikan lewat tombol "..." > Disable workflow, lalu Cancel run yang sedang menunggu.

## Sebelum uang asli

Syarat yang disepakati: paper trading berjalan minimal beberapa minggu dan hasilnya sesuai uji data historis. Bila nanti lanjut: kunci API Indodax dibuat dengan izin trade saja (izin tarik dana dimatikan), disimpan sebagai secret GitHub, dan tidak pernah ditempel di chat.
