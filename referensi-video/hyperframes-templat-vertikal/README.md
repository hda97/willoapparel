# Templat video vertikal HyperFrames (uji 14 Nov 2026)

Video 9:16, 16 detik: teks satu kata Montserrat Black bergaris hitam, hook di detik 0
(frame pertama sudah berisi kata + gambar), bar progres, ending kembali ke frame pertama (loop).
Latar biru tua (bukan oranye). Semua gratis dan dirender lokal, tanpa akun HeyGen.

## Cara pakai
1. Ubah daftar `words` (kata, detik mulai, lama) di `buat_html.py`, lalu `python3 buat_html.py`.
2. `python3 buat_sfx.py` untuk bunyi latar (atau ganti `assets/sfx.wav` dengan VO Gemini).
3. Cek: `npx --yes hyperframes@0.9.44 check --json` (perbaiki error, pertimbangkan warning).
4. Render: `npx --yes hyperframes@0.9.44 render -o renders/hasil.mp4 --quiet` (±45 dtk di cloud).
5. Kirim ke @Willo_video_bot: `python3 /mnt/project-files/telegram/tg_kirim.py TG_VIDEO video renders/hasil.mp4 "caption"`.

Panduan lengkap: skill `.claude/skills/hyperframes` (baca `references/types/vertical.md`)
dan `hyperframes-registry` (450 blok siap pakai: transisi, caption, judul kinetik).
Jangan pakai fitur cloud/berbayar HeyGen (`cloud`, `lambda`, HeyGen TTS/avatar).
