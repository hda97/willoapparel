# Penghasilan Robux Dunia Kotak (Roblox)

Aturan kita: semua yang dijual hanya hiasan. Tidak menjual koin, tidak membuat pemain lebih cepat maju, dan tidak ada
tautan pembayaran di luar Roblox di dalam game.

Angka biaya dan syarat di bawah berasal dari ingatan dan bisa berubah. Angka yang tampil di Creator Dashboard saat
Mas Huda membukanya adalah yang benar.

## Yang sudah disiapkan di repo

| No | Sumber | Yang sudah ada | Yang perlu tangan Huda |
|---|---|---|---|
| 1 | Premium Payouts | Tanda "Premium" di gelar pemain Premium (`DukungDesa.server.lua`) | Rilis game ke publik |
| 2 | Game Pass "Pendukung Desa" | Gelar emas di atas kepala, panel beli di Kotak Dukungan | Buat pass, kirim nomornya |
| 3 | Developer Product "1 Bata" | Hitungan bata, Tembok Pendukung 10 besar, pencatatan struk | Buat produk, kirim nomornya |
| 4 | Kaos WILLO untuk avatar | 3 gambar kaos di `roblox/aset/kaos-willo/` | Unggah dan pasang harga |
| 5 | Server pribadi berbayar | Tidak perlu kode | Nyalakan di pengaturan game |

## Langkah Huda

Semua dilakukan di https://create.roblox.com, masuk dengan akun hooda1997, lalu Creations dan pilih game Dunia Kotak.

### 1. Premium Payouts
1. Rilis game ke publik (tombol "Release publicly" di Roblox Studio atau ubah Audience menjadi Public di dashboard).
2. Selesai. Roblox menghitung sendiri berapa lama pemain Premium bermain. Hasilnya terlihat di menu Analytics.

### 2. Game Pass "Pendukung Desa"
1. Menu Monetization, pilih Passes, lalu Create a Pass.
2. Nama: `Pendukung Desa`. Deskripsi: `Gelar emas Pendukung Desa di atas kepalamu. Hanya hiasan.`
3. Simpan, buka pass itu, menu Sales, nyalakan Item for Sale, isi harga. Saran saya 49 Robux.
4. Salin nomor pass (angka di alamat halaman) dan kirim ke saya.

### 3. Developer Product "1 Bata"
1. Menu Monetization, pilih Developer Products, lalu Create a Developer Product.
2. Nama: `1 Bata`. Deskripsi: `Pasang satu bata atas namamu di Tembok Pendukung. Hanya hiasan.`
3. Isi harga. Saran saya 25 Robux.
4. Salin nomor produk dan kirim ke saya.

Setelah dua nomor itu saya terima, saya isi `ID_PASS` dan `ID_BATA` di `DukungDesa.server.lua`, pasang ke Studio, dan
coba beli di mode uji Studio (pembelian uji di Studio tidak memotong Robux).

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
