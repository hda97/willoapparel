# Microstock Adobe Stock

Gambar stok digambar dengan kode (canvas) di `scenes.html`. Folder ini tidak tayang di situs (situs hanya `public/`).

- `scenes.html`: semua adegan, fungsi `S[n]`.
- `svg/*.svg`: gambar gaya baru (SVG dengan gradasi banyak titik, bayangan berwarna, grain). Entri batch memakai `{"svg": "<nama>.svg", "file": "<nama>.jpg"}`. `svg/gen.py` dan `svg/gen2.py` adalah kode pembuat SVG-nya (`python3 gen2.py`).
- `batches/<nama>.json`: daftar adegan dan nama file satu batch.
- `batches/<nama>.csv`: judul dan kata kunci untuk diunggah di portal Adobe.
- `render.js`: `node render.js batches/<nama>.json <folder>` menghasilkan JPG 4000x3000.
- Workflow `.github/workflows/microstock-kirim.yml`: menggambar ulang lalu mengirim lewat SFTP.

Aturan isi: satu konsep satu gambar, ide tak terduga dengan objek khas Indonesia, tanpa teks, merek, atau tokoh berhak cipta. Batas akun 50 gambar per minggu.

Langkah manual yang tersisa setelah file terkirim: unggah CSV di portal kontributor, centang "Created using generative AI tools", Submit.
