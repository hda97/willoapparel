# Aturan bersama skill Instagram (penyesuaian Willo)

Berlaku untuk semua skill `ig-*` di `.claude/skills/`. Skill aslinya berbahasa Inggris
(paket instagram-agent-skill, MIT); aturan di file ini menang bila berbeda.

## Umum
- Semua hasil (naskah, caption, balasan, DM, rencana) dalam **Bahasa Indonesia** santai.
- **Jangan cantumkan tanggal atau hari** di ide konten, storyboard, naskah, maupun video.
- **Tanpa alat berbayar.** Tidak pakai Blotato, PostZen, Apify berbayar, ManyChat, Metricool,
  atau layanan sejenis. Riset, tulis, dan posting pakai alat di repo ini saja.
- Jangan pakai karakter/merek berhak cipta milik orang lain. Jangan tiru nama akun referensi.
- Jangan mengarang angka atau testimoni. Bila bukti kosong, tulis `{{angka asli}}`.
- **Tidak ada yang terbit tanpa persetujuan Huda.** Posting hanya lewat skill `ig-terbit`
  (antrean JSON + workflow GitHub, Instagram Graph API resmi, gratis).
- Video dan teks tidak menyebut harga produk Willo apparel.

## Aturan video (semua reel)
- Struktur Hook, Tunda, Rehook, Jawaban. Detik 0–1 langsung kejadian/angka yang bikin kaget
  (bukan umpatan, bukan salam, bukan kartu judul diam).
- CTA (komen kata kunci / bagikan) sebelum detik 10. Outro paling lama 2 detik. Akhir menyambung
  ke awal (loop).
- Subtitle satu kata. Visual ganti tiap 1–2 detik. Bar progres. Tanpa hening.
- Zona aman: atas ≥250 px, tepi ≥80 px, teks maksimal sampai y≈1620 dari 1920.
- Latar DILARANG oranye.
- Situs disebut di VO sebagai "we we we dot willoapparel dot kom".
- Hasil video wajib dikirim juga ke bot Telegram @Willo_video_bot (`telegram/tg_kirim.py`).

## Alat yang dipakai (semua gratis, lokal)
| tugas | alat |
| --- | --- |
| skor hook | `python3 .claude/skills/ig-reel/hookscore.py hooks.txt` (kosakata Indonesia sudah ditambah) |
| waktu naskah | `python3 .claude/skills/ig-reel/beats.py naskah.txt --target 20` |
| cek caption | `python3 .claude/skills/ig-caption/caption.py caption.txt` |
| buang gaya AI | `python3 .claude/skills/ig-human/humanize.py draf.txt` lalu `detect.py` |
| angka reel yang sudah tayang | `konten-ig/insight/terbaru.json` (dari `konten-ig/insight.py`) |
| posting | skill `ig-terbit` |

Catatan: `hookscore.py` aslinya dilatih pada hook Inggris. Daftar kata Indonesia sudah
ditambahkan, tapi skornya tetap panduan kasar. Percayai grafik retensi Instagram di atas skor.
