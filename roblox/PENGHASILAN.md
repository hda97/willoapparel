# Penghasilan Robux Dunia Kotak (Roblox)

Aturan kita: semua yang dijual hanya hiasan. Tidak menjual koin, tidak membuat pemain lebih cepat maju, dan tidak ada
tautan pembayaran di luar Roblox di dalam game.

Angka biaya dan syarat di bawah berasal dari ingatan dan bisa berubah. Angka yang tampil di Creator Dashboard saat
Mas Huda membukanya adalah yang benar.

## Yang sudah disiapkan di repo

| No | Sumber | Yang sudah ada | Yang perlu tangan Huda |
|---|---|---|---|
| 1 | Premium Payouts | Tanda "Premium" di gelar pemain Premium | Rilis game ke publik |
| 2 | 4 Game Pass hiasan | Efeknya dan panel beli di Kotak Dukungan (`DukungDesa.server.lua`) | Buat pass, kirim nomornya |
| 3 | 3 Developer Product | Bata, Tembok Pendukung 10 besar, kembang api, pencatatan struk | Buat produk, kirim nomornya |
| 4 | 6 kaos untuk avatar | Gambar di `roblox/aset/kaos-willo/` | Unggah dan pasang harga |
| 5 | Server pribadi berbayar | Tidak perlu kode | Nyalakan di pengaturan game |

## Daftar barang dan saran harga

Game Pass (sekali beli):

| Nama | Deskripsi untuk dashboard | Saran harga |
|---|---|---|
| Pendukung Desa | Gelar emas Pendukung Desa di atas kepalamu. Hanya hiasan. | 49 Robux |
| Jejak Bintang | Percik bintang mengikuti langkahmu. Hanya hiasan. | 79 Robux |
| Gelar Pelangi | Tulisan gelarmu berwarna pelangi. Hanya hiasan. | 99 Robux |
| Lentera Malam | Cahaya hangat di sekitar tokohmu. Hanya hiasan. | 59 Robux |

Developer Product (bisa dibeli berulang):

| Nama | Deskripsi untuk dashboard | Saran harga |
|---|---|---|
| 1 Bata | Pasang satu bata atas namamu di Tembok Pendukung. Hanya hiasan. | 25 Robux |
| 5 Bata | Pasang lima bata sekaligus di Tembok Pendukung. Hanya hiasan. | 99 Robux |
| Kembang Api | Nyalakan kembang api yang terlihat semua warga. Hanya hiasan. | 15 Robux |

Kaos klasik (sekitar 5 Robux per kaos): WILLO kuning, hitam, putih, biru, dan Dunia Kotak hijau dan gelap.

Harga di atas saran saya, bukan aturan. Mulai murah lalu naikkan kalau laku biasanya lebih aman.

## Langkah Huda

Semua dilakukan di https://create.roblox.com, masuk dengan akun hooda1997, lalu Creations dan pilih game Dunia Kotak.

### 1. Premium Payouts
1. Rilis game ke publik (tombol "Release publicly" di Roblox Studio atau ubah Audience menjadi Public di dashboard).
2. Selesai. Roblox menghitung sendiri berapa lama pemain Premium bermain. Hasilnya terlihat di menu Analytics.

### 2. Game Pass
1. Menu Monetization, pilih Passes, lalu Create a Pass.
2. Isi nama dan deskripsi dari tabel di atas, lalu simpan.
3. Buka pass itu, menu Sales, nyalakan Item for Sale, isi harga.
4. Ulangi untuk pass lain. Tidak harus semuanya sekaligus, satu pass dulu juga boleh.
5. Salin nomor tiap pass (angka di alamat halaman) dan kirim ke saya bersama namanya.

### 3. Developer Product
1. Menu Monetization, pilih Developer Products, lalu Create a Developer Product.
2. Isi nama, deskripsi, dan harga dari tabel di atas.
3. Salin nomor tiap produk dan kirim ke saya bersama namanya.

Setelah nomor saya terima, saya isi kolom `id` di tabel `PASS` dan `PRODUK` pada `DukungDesa.server.lua`, pasang ke
Studio, dan coba beli di mode uji Studio (pembelian uji di Studio tidak memotong Robux).

### 4. Kaos WILLO
Yang disiapkan adalah kaos klasik (gambar 2D yang menempel di badan avatar), karena item 3D butuh verifikasi identitas
dan biaya lebih besar.
1. Buka Creations, tab Avatar Items, pilih Classic Shirts, lalu unggah salah satu file di `roblox/aset/kaos-willo/`
   (kuning, hitam, putih).
2. Roblox meminta biaya unggah (seingat saya 10 Robux per kaos) dan bisa meminta verifikasi akun. Lihat syarat yang
   tampil di halaman itu.
3. Setelah lolos pemeriksaan, nyalakan On Sale dan isi harga. Kaos klasik biasanya dijual sangat murah, sekitar 5 Robux.
4. Kirim nomor kaosnya kalau mau saya pajang di Toko Willo dalam game supaya pemain bisa membelinya dari sana.

### 5. Server pribadi berbayar
1. Buka pengaturan game, menu Access (atau Monetization, tergantung tampilan), cari Private Servers.
2. Nyalakan, lalu isi harga per bulan. Saran saya 50 Robux. Harga 0 juga boleh kalau hanya ingin fiturnya ada.
3. Selesai. Pemain menyewa dari halaman game, tidak ada yang perlu dipasang di dalam game.

## Mencairkan Robux
Lewat Developer Exchange (DevEx) di Creator Dashboard. Seingat saya butuh minimal 30.000 Robux hasil penjualan dan akun
terverifikasi. Cek syarat terbaru di halaman DevEx sebelum berharap pada angka ini.
