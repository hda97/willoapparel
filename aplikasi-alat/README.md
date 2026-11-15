# Kasir Willo (Android)

Aplikasi Android untuk alat usaha gratis Willo: **Kasir, Antrian, Nota & Buku Kas** (sumbernya `public/alat/`).

- **Jalan tanpa internet.** `siapkan-www.mjs` menyalin `public/alat` ke `www/` dan menulis ulang tautan
  `/alat/kasir/` menjadi `/alat/kasir/index.html`, karena server lokal Capacitor tidak membuka index sebuah folder.
  Tautan ke halaman situs lain dibuka di browser. Data tetap di HP (localStorage aplikasi).
- **Cetak langsung ke printer termal Bluetooth classic** (yang tidak bisa dijangkau Chrome) lewat plugin lokal
  `PrinterWilloPlugin.java` (RFCOMM/SPP). `public/alat/printer.js` memakainya otomatis bila berjalan di aplikasi:
  daftar printer yang sudah dipasangkan, sekali pilih lalu diingat (`willo_printer_v1`). Tidak perlu RawBT.
- Ubah halaman cukup di `public/alat/`, maka situs dan aplikasi ikut berubah.

## Build

APK dibangun oleh `.github/workflows/aplikasi-alat.yml` dan diunggah ke Release
[`kasir-willo-uji`](https://github.com/hda97/willoapparel/releases/tag/kasir-willo-uji).

```bash
npm ci
node siapkan-www.mjs && npx cap sync android
cd android && ./gradlew assembleRelease
```

APK uji ditandatangani `kunci/uji.p12`. Kunci ini sengaja tidak rahasia, supaya update bisa dipasang tanpa menghapus
aplikasi. Rilis Play Store nanti memakai kunci unggah sendiri.
