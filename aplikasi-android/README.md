# Aplikasi Android Dunia Kotak (Capacitor)

Aplikasi Google Play untuk game Dunia Kotak. Rencana lengkap: `/mnt/project-files/desa-kotak/playstore/rencana-play-store-dunia-kotak.md` (folder proyek).

- Nama paket: `com.willoapparel.duniakotak` (permanen setelah diunggah ke Play).
- Aplikasi membuka `https://willoapparel.com/duniakotak/mabar/?app=android`. Update game tetap lewat situs (tidak perlu unggah ulang), kecuali bagian native (ikon, plugin, AdMob, versi Android).
- User agent ditambah `DuniaKotakAndroid`. `public/duniakotak/js/modeapp.js` lalu menyembunyikan Bata/Trakteer (aturan pembayaran Google Play) dan tombol login Google web (diblokir di WebView). Versi web tidak berubah.
- Iklan: AdMob (AdSense tidak boleh di WebView). App ID ada di `android/app/src/main/AndroidManifest.xml`, unit iklan di `public/duniakotak/mabar/game.js` (`ADMOB`). Reward 💎 hanya menyala bila variabel worker `IKLAN_APP = "1"`; sebelum itu iklan uji tanpa hadiah. Banner hanya tampil saat panel ⚙ Atur terbuka.
- Tanpa internet: `www/offline.html`.

## Build

APK uji otomatis lewat GitHub Actions (`.github/workflows/aplikasi-android.yml`). Setelah merge ke main, file siap pasang ada di Release **apk-uji**: https://github.com/hda97/willoapparel/releases/tag/apk-uji (`dunia-kotak-uji.apk`). Di PR: tab Actions → run → Artifacts.

Lokal (butuh JDK 21 + Android SDK):

```
cd aplikasi-android
npm ci
npm run apk     # APK debug
npm run aab     # AAB rilis untuk Play (butuh kunci unggah; JANGAN commit keystore)
```

## Belum

- Login Google native (butuh OAuth client Android + sidik jari SHA-1 dari Play Console).
- Google Play Billing untuk 💎.
- Tanda tangan rilis + Play App Signing.

## Halaman kebijakan (untuk Play Console)

- Kebijakan privasi: https://willoapparel.com/duniakotak/privasi.html
- Syarat penggunaan: https://willoapparel.com/duniakotak/syarat.html
- Hapus akun (URL wajib di formulir Keamanan Data): https://willoapparel.com/duniakotak/hapus-akun.html — juga dari game: ⚙ Atur → Privasi & hapus akun.
- Chat: ketuk nama warga → 🔇 Bisukan / 🚩 Laporkan (3 laporan = bisu 1 jam).
