# Posting otomatis Instagram @duniakotak.id

- Antrean: `antrean/YYYY-MM-DD.json` (lihat docstring `posting.py`). Video MP4 ditaruh di `public/duniakotak/reel/` agar punya URL publik willoapparel.com.
- Workflow `.github/workflows/ig-posting.yml` mengecek tiap 30 menit pukul 18.00–20.30 WIB dan menerbitkan antrean hari itu setelah jamnya lewat. Bisa juga dijalankan manual (Run workflow) dengan tanggal tertentu, atau `cek_token` untuk uji koneksi tanpa posting.
- Secret repo: `IG_TOKEN`, `IG_APP_ID`, `IG_APP_SECRET` (diisi Huda; jangan ditulis di chat atau file). `token.enc` = token Halaman terenkripsi, dibuat otomatis.

Catatan 13 Nov 2026: cron GitHub sering telat; bila jadwal lewat, merge perubahan apa pun di konten-ig/ untuk memicu posting.

Sampul reel: taruh JPG 9:16 di public/duniakotak/reel/<tanggal>-sampul.jpg (di PR yang sama dengan video). posting.py otomatis memasangnya sebagai cover_url. Sampul tidak bisa diganti lewat API setelah terbit.
<!-- picu posting 2026-11-14 19.05 WIB -->

## Balas komentar + DM otomatis (15 Nov 2026)
`komentar.py` (workflow `ig-komentar.yml`, tiap 30 menit) membalas SETIAP komentar baru di 15 reel terakhir dan mengirim DM berisi link https://www.willoapparel.com/warga lewat Private Reply (`POST me/messages`, `recipient={"comment_id": ...}`).
- Syarat DM: token punya izin `instagram_manage_messages` (+ `pages_manage_metadata`), IG @duniakotak.id menyalakan "Izinkan akses ke pesan" (Pengaturan → Pesan → Alat yang terhubung), dan app Meta "Dunia kotak poster" mode Live + Advanced Access untuk `instagram_manage_messages` (App Review). Sebelum itu DM hanya sampai ke akun yang punya peran di app.
- Kalau DM ditolak, balasan publik otomatis kembali ke "link di bio" (tidak ada yang rusak).
- Satu orang maksimal 1 DM per 24 jam (`dikirim-dm.json`). Private Reply hanya bisa untuk komentar ≤7 hari, 1 kali per komentar (aturan Meta).
- Matikan DM sementara: tambahkan env `IG_DM: "0"` di workflow.
<!-- picu posting 15 Nov (cron telat) -->

## Balas kata kunci, pengganti ManyChat (16 Nov 2026)
`kata_kunci.py` (workflow `ig-kata-kunci.yml`, tiap ±10 menit) membalas komentar dan DM yang berisi kata kunci Lumbung (KASIR, WARUNG, LAUNDRY, CUKUR, KATERING, TANI, KONTER, STEAM) dengan link willoapparel.com/alat/.
- Ubah kata kunci, link, dan teks balasan di `kata-kunci.json`. Akun yang dilayani: kolom `"akun"` (username IG tanpa @). Jangan isi `duniakotak.id` di sini, akun itu sudah dibalas semua komentarnya oleh `komentar.py`.
- Cek akun & izin token: Actions → "Balas Kata Kunci Instagram" → Run workflow → centang "cek".
- Token akun lain disimpan terenkripsi di `token-<akun>.enc` (kunci = IG_APP_SECRET). Catatan pesan yang sudah dibalas disimpan di cache Actions, tidak di-commit.
- Syarat Meta sama dengan DM di atas: balas komentar bisa langsung; DM ke orang lain menunggu Advanced Access `instagram_manage_messages`. Sebelum itu bot otomatis menulis link di balasan komentar.
