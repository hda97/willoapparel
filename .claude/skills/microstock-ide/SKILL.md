---
name: microstock-ide
description: Mengubah kata kunci dari data riset microstock (Adobe Stock/Shutterstock) menjadi konsep gambar yang unik, kreatif, dan tidak mirip gambar lain, lalu mengecek gambar kembar sebelum dikirim. Pakai saat membuat batch microstock baru dari data riset, atau saat diminta "ide liar", "jangan similar", "buat unik".
---

# Ide microstock yang unik

Turunan ringan dari skill `adhd` (MIT, UditAkhourii/adhd) dengan sudut pandang khusus gambar stok. Untuk keputusan besar (arah satu batch penuh) boleh pakai `/adhd` asli. Untuk tiap kata kunci, ikuti alur di bawah.

## Aturan tetap

- Sumber kata kunci: data riset di `/mnt/project-files/microstock-adobe/riset/`.
- Satu konsep satu gambar. Tanpa merek, tokoh berhak cipta, wajah orang asli.
- Lewati tiruan dokumen resmi dan uang (cek, kartu identitas, tiket, pelat nomor, resep dokter), meme milik orang lain, peta tanpa data geografi akurat.
- Template, ikon, bagan, kalender dibuat VEKTOR datar (SVG tanpa filter, teks jadi outline). Mockup produk dibuat JPEG.
- Tiga ide pertama yang terpikir DILARANG dipakai. Itu ide yang juga dipakai semua kontributor lain.

## Tahap 1. Menyebar (tanpa menilai)

Untuk tiap kata kunci, tulis minimal 2 ide dari tiap sudut pandang berikut. Jangan menilai dulu.

| Sudut | Pertanyaan |
|---|---|
| Pembeli | Siapa yang mengetik kata ini (guru, pemilik toko online, desainer undangan, HRD)? Apa yang akan mereka tempel di atas gambar? |
| Kebalikan | Semua orang menggambar versi rapi dan baru. Bagaimana versi kusut, setengah jadi, terbongkar, atau dilihat dari belakang? |
| Pinjam dunia lain | Kalau kata ini digambar oleh pembuat kue, tukang kayu, astronom, atau perajin batik, apa yang berubah? |
| Ganti bahan | Kertas menjadi kain, kayu, kaca, tanah liat, neon, atau lipatan origami. |
| Ganti sudut pandang | Dari atas, potongan melintang, terurai (exploded view), isometrik, sangat dekat. |
| Set, bukan satuan | Jadikan keluarga: 3 ukuran, 4 musim, sebelum dan sesudah, kosong dan terisi. |
| Khas Indonesia | Motif, benda, atau warna lokal yang jarang ada di koleksi stok. |
| Guna ekstra | Area kosong untuk teks, garis potong, panduan cetak, versi cetak hitam putih. |

## Tahap 2. Memilih (kritikus menyala)

Nilai tiap ide 0 sampai 10 untuk:

- **Beda**: seberapa jauh dari gambar yang pasti sudah ada ratusan.
- **Laku**: apakah pembeli tadi benar-benar bisa memakainya.
- **Bisa digambar kode**: bentuk geometris, pola, tata letak kuat; orang, hewan, makanan realistis lemah.

Skor = Beda 0,35 + Laku 0,40 + Bisa 0,25. Buang ide jebakan (terlihat menarik tetapi tidak berguna bagi pembeli, atau melanggar aturan tetap). Ambil satu ide teratas per kata kunci dan catat satu kalimat alasan pembeli mau mengunduhnya.

## Tahap 3. Cek kembar

Setelah gambar jadi dan sebelum dikirim:

```
python3 microstock/cek_kembar.py <folder-batch-baru> /mnt/project-files/microstock-adobe/
```

Skrip membandingkan tiap gambar baru dengan semua gambar lama dan sesama gambar baru. Pasangan berlabel KEMBAR wajib diganti; MIRIP wajib dilihat mata lalu diputuskan.

Batas: skrip hanya mengenal gambar kita sendiri. Kemiripan dengan koleksi Adobe hanya bisa dicek Huda dengan mencari kata kuncinya di stock.adobe.com.
