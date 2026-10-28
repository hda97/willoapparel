# Aturan bersama semua agent Willo

File ini bukan agent. Ini pegangan yang dibaca setiap agent di folder ini sebelum bekerja.

## Fakta Willo Apparel (jangan diubah tanpa konfirmasi Huda)
- Jasa sablon kaos custom di Ngawi, melayani Madiun, Magetan, Ponorogo, Sragen dan sekitarnya. Berdiri 2020 ("6+ tahun").
- Jam buka Senin–Sabtu 08.00–16.00, Minggu libur.
- WhatsApp 0858-1690-0722. Situs willoapparel.com (dibaca "willoapparel dot kom" di VO).
- Kaos kelas/komunitas mulai Rp55.000. Halaman desain-kaos: MOQ 1 pcs, desain dibantu gratis, mockup disetujui dulu, 3–7 hari kerja, mulai Rp65.000. Harga lengkap disampaikan admin di WhatsApp.
- Satu metrik utama: **chat WhatsApp dari situs dan konten** (event GA4 `klik_whatsapp`).

## Aturan klaim dan konten
- Jangan mengarang testimoni, rating, jumlah pelanggan, atau angka performa. Kalau butuh angka, minta ke Huda.
- Jangan menjanjikan sablon awet atau "paling bagus". Jawab keraguan dengan proses (desain dibantu, mockup dikirim dulu, bisa revisi).
- Video/caption: jangan sebut harga, jenis sablon, klaim awet, atau klaim produk sejenis. Tanpa karakter berhak cipta (mis. Disney/Stitch).
- Kalimat pertama konten = masalah pelanggan, Willo muncul sesudahnya sebagai jalan keluar, lalu ajakan ke WhatsApp atau "Kunjungi willoapparel dot kom".
- Bahasa: Indonesia yang santai dan jelas, sapaan "kamu".

## Situs
- Repo ini: halaman di `public/`, push ke `main` = langsung tayang di willoapparel.com lewat Cloudflare Worker.
- Title artikel maks 60 karakter termasuk " | Willo Apparel"; meta description 70–158 karakter; satu H1; schema BlogPosting + FAQ + Breadcrumb.
- Gaya visual: tinta #161513, oranye #D9541F, krem #EEEAE2; font Anton/Archivo/JetBrains Mono.

## Struktur tim
Agent di sini adalah pelaksana. Setiap agent melapor ke anggota **Dewan Ahli** yang tertulis di deskripsinya (Gus, Walter, Saul Goodman, Chuck, Johan, Dr. Gillen, Minelli, Hightower).

Disadur dari repo terbuka msitarzewski/agency-agents (lisensi MIT), disesuaikan untuk Willo.
