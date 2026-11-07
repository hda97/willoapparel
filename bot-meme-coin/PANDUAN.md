# Bot Meme Coin Solana: Tahap 1 (Paper Trading)

Bot ini **tidak memakai uang asli** dan **tidak butuh private key**. Bot hanya memantau pasar sungguhan lalu berpura-pura beli/jual dengan saldo bohongan $100, supaya kita tahu strateginya untung atau rugi sebelum keluar uang.

## Cara menjalankan (Windows)

1. Pasang Python dari https://www.python.org/downloads/ (centang **"Add Python to PATH"** saat instal).
2. Unduh folder ini (bot.py, config.json, jalankan.bat, laporan.bat) ke satu folder di komputer.
3. Klik dua kali **jalankan.bat**. Bot mengecek pasar tiap 60 detik. Biarkan jendelanya terbuka.
4. Untuk lihat hasil, klik dua kali **laporan.bat**.

Di Mac/Linux: buka Terminal di folder itu, jalankan `python3 bot.py` dan `python3 bot.py --laporan`.

## Cara menghentikan

- Tekan **Ctrl+C** di jendela bot, atau
- Buat file kosong bernama **STOP** (tanpa ekstensi) di folder bot. Bot berhenti di putaran berikutnya. Hapus file itu untuk menjalankan lagi.

## Cara kerja bot

**Mencari kandidat:** token Solana yang baru dipromosikan di DexScreener.

**Menyaring (semua harus lolos):**
- Likuiditas minimal $20.000
- Umur pasangan 15 menit sampai 48 jam
- Volume 1 jam minimal $10.000 dan minimal 50 transaksi
- Lebih banyak pembeli daripada penjual, tapi tetap ada yang bisa jual (kalau tidak ada yang jual sama sekali = curiga honeypot)
- Harga naik dalam 1 jam, tapi belum terbang lebih dari 300% (telat masuk)
- Cek RugCheck: tidak ditandai rug, pembuat tidak bisa mencetak koin baru, koin tidak bisa dibekukan, 10 pemegang teratas maksimal 35%, LP terkunci minimal 80%

**Beli (bohongan):** $10 per token, maksimal 3 posisi sekaligus, sudah dipotong biaya + slippage 2%.

**Jual otomatis saat:**
- Untung +40% (take profit)
- Rugi -20% (stop loss)
- Turun 15% dari puncak setelah sempat naik 20% (trailing stop)
- Sudah ditahan 4 jam
- Likuiditas anjlok 40% (tanda rug pull)

**Pengaman:** berhenti beli kalau rugi hari itu sudah $20, maksimal 10 kali beli per hari, tidak membeli ulang token yang sama dalam 24 jam.

Semua angka di atas bisa diubah di **config.json**.

## File yang muncul

- `riwayat_transaksi.csv`: semua beli/jual, bisa dibuka di Excel
- `status_paper.json`: saldo dan posisi saat ini
- `log_bot.txt`: catatan lengkap, termasuk alasan token ditolak

Mulai ulang dari saldo $100: `python bot.py --reset`.

## Langkah berikutnya

Jalankan 1-2 minggu, lalu kirim isi `riwayat_transaksi.csv` (atau hasil laporan) ke Claude. Kita evaluasi dan setel filternya. Uang asli baru dipertimbangkan kalau hasil paper trading konsisten bagus, dan tetap dengan nominal kecil.

**Catatan penting:** hasil paper trading biasanya lebih bagus daripada kenyataan, karena di dunia nyata harga bisa bergerak saat transaksi diproses dan sebagian token jebakan lolos filter. Jangan pernah kirim private key atau seed phrase ke siapa pun, termasuk ke chat.

## Jalan otomatis di GitHub Actions (tanpa VPS)

Bot juga dijalankan otomatis oleh workflow `.github/workflows/bot-meme-coin.yml` di repo ini: tiap 10 menit bot jalan ±9 menit (cek pasar tiap menit), status disimpan di cache Actions dan dilanjutkan jadwal berikutnya. Tidak ada secret atau private key yang dipakai. Folder ini tidak ikut tayang di situs (situs hanya menyajikan `public/`).

- Lihat hasil: tab **Actions** > "Bot meme coin (paper trading)" > buka run terbaru > bagian Summary berisi laporan.
- Hentikan: tab Actions > workflow itu > tombol "..." > **Disable workflow**.
- Jadwal GitHub kadang telat beberapa menit, jadi ada jeda kecil antar run; hasil paper trading tetap tercatat.
