# AI gratis bersama (Gemini + Groq)

Satu pintu AI gratis untuk semua proyek Willo. Tanpa kartu kredit, tanpa biaya.

| Urutan | Penyedia | Model | Kunci (secret) |
|---|---|---|---|
| 1 | Google Gemini | gemini-flash-lite-latest, gemini-flash-latest | `GEMINI_API_KEY` |
| 2 | Groq | Llama 3.3 70B, Qwen3 32B, Llama 3.1 8B | `GROQ_API_KEY` |

Kalau kuota satu penyedia habis, otomatis pindah ke berikutnya. Kalau semua gagal, fitur kembali ke cara lama (template), jadi tidak ada yang rusak.

## Sudah dipakai di
- **Bot komentar IG @duniakotak.id** (`konten-ig/komentar.py`): komentar yang tidak cocok aturan dibalas AI gaya Raka, disaring dulu (tanpa link/harga/janji fitur).
- **Bot kata kunci IG** (`konten-ig/kata_kunci.py`): pesan tanpa kata kunci tapi jelas minta alat (mis. "ada aplikasi catat utang?") ditebak AI ke kata kunci yang cocok, lalu dibalas teks resmi dari `kata-kunci.json`.
- **Lumbung Kasir** (`/alat/kasir/` > Laporan > ✨ Saran AI): 3 saran usaha dari angka laporan. Diproses di `worker.js` (`apiAI`, `aiGratis`), kunci tidak pernah sampai ke HP. Batas 12 kali/jam per pengguna.

## Pakai di skrip baru
Python (GitHub Actions):
```python
sys.path.insert(0, "ai"); from ai_gratis import tanya
teks = tanya("...", sistem="...", maks_token=200) or "cadangan template"
```
Worker (Cloudflare): `await aiGratis(env, { sistem, prompt, maks })` → teks atau `null`.

## Tempat kunci
- GitHub: Settings > Secrets and variables > Actions > New repository secret.
- Cloudflare: Workers & Pages > willoapparel > Settings > Variables and Secrets > Add (tipe Secret).

## Gambar AI (Flux, Cloudflare Workers AI)
- Halaman: https://willoapparel.com/alat/gambar/ (noindex, dikunci PIN).
- API: `POST /alat/api/ai/gambar` `{prompt, pin, kirim}` → `{gambar: base64 JPEG, prompt, terkirim}`.
- Model `@cf/black-forest-labs/flux-1-schnell` (Apache 2.0, boleh komersial), kuota gratis harian Workers AI.
- Prompt bahasa Indonesia diterjemahkan dulu ke bahasa Inggris oleh `aiGratis`.
- Secret di Cloudflare (Workers & Pages > willoapparel > Settings > Variables and Secrets):
  - `GAMBAR_PIN` (wajib): PIN halaman.
  - `TG_VIDEO` (opsional): token @Willo_video_bot, supaya hasil ikut terkirim ke Telegram (chat id di `vars.TG_CHAT_ID`).
