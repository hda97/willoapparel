# Posting otomatis Instagram @duniakotak.id

- Antrean: `antrean/YYYY-MM-DD.json` (lihat docstring `posting.py`). Video MP4 ditaruh di `public/duniakotak/reel/` agar punya URL publik willoapparel.com.
- Workflow `.github/workflows/ig-posting.yml` mengecek tiap 30 menit pukul 18.00–20.30 WIB dan menerbitkan antrean hari itu setelah jamnya lewat. Bisa juga dijalankan manual (Run workflow) dengan tanggal tertentu, atau `cek_token` untuk uji koneksi tanpa posting.
- Secret repo: `IG_TOKEN`, `IG_APP_ID`, `IG_APP_SECRET` (diisi Huda; jangan ditulis di chat atau file). `token.enc` = token Halaman terenkripsi, dibuat otomatis.

Catatan 13 Nov 2026: cron GitHub sering telat; bila jadwal lewat, merge perubahan apa pun di konten-ig/ untuk memicu posting.
