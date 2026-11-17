---
name: ig-terbit
description: >-
  Jadwalkan dan terbitkan reel atau carousel ke @duniakotak.id atau @miftakhul_hda
  lewat Instagram Graph API resmi (gratis) memakai antrean JSON di konten-ig/ dan
  workflow GitHub yang sudah ada. Pakai setelah naskah/video/caption dari skill ig-*
  disetujui Huda dan saat diminta "posting", "jadwalkan", "antre-kan", atau "upload ke IG".
---

# ig-terbit

Pengganti langkah "copy-ready block, kamu posting sendiri" di paket aslinya. Tidak pakai
Blotato, PostZen, Metricool, atau layanan berbayar lain. Semua lewat repo ini.

**Tidak ada yang terbit tanpa Huda.** File antrean baru masuk lewat PR; workflow hanya
membaca cabang `main`, jadi konten terbit setelah PR di-merge sesuai aturan merge proyek.

## Peta akun

| akun | antrean | media | workflow | slot |
| --- | --- | --- | --- | --- |
| @duniakotak.id | `konten-ig/antrean/YYYY-MM-DD.json` | `public/duniakotak/reel/` | `.github/workflows/ig-posting.yml` | dicek 18.00–20.30 WIB |
| @miftakhul_hda (Lumbung) | `konten-ig/antrean-miftakhul_hda/YYYY-MM-DD-N.json` | `lumbung-ig/` | `.github/workflows/ig-posting-lumbung.yml` | dicek 05.00–06.30, 11.00–13.30, 18.00–21.30 WIB |

Tanggal = tanggal WIB terbit (nama file saja, JANGAN tulis tanggal/hari di caption atau video).

## Isi file antrean

Reel:
```json
{
  "video": "https://raw.githubusercontent.com/hda97/willoapparel/main/public/duniakotak/reel/NAMA.mp4",
  "sampul": "https://raw.githubusercontent.com/hda97/willoapparel/main/public/duniakotak/reel/NAMA-sampul.jpg",
  "caption": "teks dari ig-caption, sudah lewat ig-human",
  "jam": "19:00"
}
```
Carousel:
```json
{"jenis": "CAROUSEL", "gambar": ["https://.../1.jpg", "https://.../2.jpg"], "caption": "...", "jam": "12:00"}
```
- Video MP4 9:16, H.264 + AAC. Gambar carousel JPG 4:5 (1080×1350).
- Sampul tidak bisa diganti setelah terbit; pastikan benar sebelum PR.
- Setelah terbit, workflow menambah kolom `"terbit"` (id, permalink, waktu) dan meng-commit-nya.
  File yang sudah punya `"terbit"` tidak diterbitkan ulang.

## Langkah

1. Pastikan naskah/caption sudah lolos: `hookscore.py`, `beats.py`, `caption.py`, `humanize.py`
   + `detect.py`, dan `.claude/instagram/ATURAN.md`.
2. Taruh media di folder media akun dan buat file antrean, di cabang kerja (bukan `main`).
3. Uji JSON: `python3 -c "import json,sys;json.load(open(sys.argv[1]))" FILE`.
4. Buka PR berisi media + antrean. Sebutkan akun, slot, dan hook di deskripsi.
5. Kirim video ke bot Telegram @Willo_video_bot (`telegram/tg_kirim.py`) agar Huda bisa menonton.
6. Tunggu Huda bilang "merge" (atau ikuti aturan merge khusus tugas harian yang sudah ia izinkan).
7. Setelah slot lewat, cek kolom `"terbit"` di file antrean di `main`. Bila belum terbit karena
   cron GitHub telat, minta Huda menjalankan workflow manual (Actions → Run workflow, isi tanggal).

## Setelah terbit

- Insight: `konten-ig/insight.py` menulis `konten-ig/insight/terbaru.json`. Bawa ke `ig-audit`.
- Catat di `.claude/instagram/<akun>/log.md`: hook, format, durasi, permalink.
- Balas komentar: @duniakotak.id otomatis oleh `konten-ig/komentar.py`; kata kunci Lumbung oleh
  `konten-ig/kata_kunci.py`. `ig-reply` dipakai hanya untuk komentar yang butuh jawaban manual.

## Jangan

- Jangan isi atau tampilkan token (`IG_TOKEN`, `IG_APP_SECRET`, `token*.enc`).
- Jangan posting lewat otomasi browser atau login akun; itu melanggar ketentuan Instagram.
- Jangan tambah layanan pihak ketiga berbayar.
