# Splitbill Cerdas v2

Aplikasi bagi tagihan (patungan) milik Huda, dibangun ulang dari nol dengan Expo SDK 51.

- Scan struk **offline** pakai Google ML Kit (foto tidak dikirim ke server), atau tempel teks struk.
- Bagi **sesuai pesanan** (tiap item dipilih siapa yang ikut) atau **bagi rata**.
- Service, pajak/PB1, diskon dibagi proporsional; ongkir dibagi rata; pembulatan 100/500/1.000.
- Tandai siapa yang **sudah lunas**, total "uang belum kembali" di beranda, utang per teman.
- Tagih via WhatsApp per orang (langsung ke nomornya kalau disimpan) + info rekening/e-wallet.
- Daftar teman tersimpan, mode gelap, semua data hanya di HP.
- **Catatan pengeluaran pribadi** dengan 8 kategori; bagian kamu dari tiap patungan otomatis tercatat.
- **Grafik bulanan**: donat per kategori, tren 6 bulan, banding bulan lalu, teman paling sering patungan.
- **Kirim tagihan sebagai gambar struk** ke WA, dan **simpan foto struk** di tiap tagihan.
- **Ekspor ke Excel (.xlsx)** berwarna: lembar Pengeluaran Saya, Rekap Bulanan, Ringkasan, Per Teman, Per Orang, Item (dari beranda, detail tagihan, atau Atur).

## Uji & build

```bash
npm ci
npm test                 # uji logika hitung & pembaca struk
npx expo export -p web   # cek tampilan cepat di browser (scan kamera hanya jalan di HP)
```

APK dibangun oleh workflow `.github/workflows/aplikasi-splitbill.yml` dan diunggah ke Release
[`splitbill-uji`](https://github.com/hda97/willoapparel/releases/tag/splitbill-uji).
APK ditandatangani **kunci rilis resmi** (`kunci/splitbill-rilis.p12.enc`, AES-256 terenkripsi; sandinya disimpan
di secret repo `SPLITBILL_KUNCI`). Kunci yang sama wajib dipakai di setiap rilis supaya pembeli bisa update tanpa
menghapus aplikasi. Jangan hapus file kunci ini dan jangan kehilangan sandinya.
Sidik jari SHA-256 sertifikat: `76:E4:13:6A:D7:10:9D:18:21:45:C3:FF:C8:92:D1:D8:D8:EC:CF:0A:73:2C:40:B7:0D:07:7E:AE:F8:D8:B1:CB`.
