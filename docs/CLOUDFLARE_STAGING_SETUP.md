# Cloudflare staging setup — DUNIA KOTAK

## Tujuan dan batas keselamatan

Staging adalah Worker terpisah bernama `willoapparel-staging`, menggunakan URL `workers.dev`. Konfigurasi staging tidak memasang route `willoapparel.com` atau wildcard domain produksi. Binding Durable Objects `PENGUNJUNG`, `WARGA`, dan `RUANG` dideklarasikan ulang pada environment staging sehingga mengarah ke Worker/environment staging, bukan namespace produksi.

**Jangan** menguji recovery, login, WebSocket, atau migrasi menggunakan Worker produksi, database produksi, atau data warga nyata. Gunakan akun uji sintetis.

## 1. Siapkan akses Cloudflare

1. Masuk ke Cloudflare Dashboard dan pilih akun yang mengelola `willoapparel.com`.
2. Pastikan akun memiliki akses untuk deploy Workers.
3. Pastikan subdomain `workers.dev` sudah diaktifkan untuk akun. Staging tidak memerlukan custom domain.
4. Jangan ubah DNS atau route domain produksi.

## 2. Deploy staging dari branch keamanan

Jalankan dari root repository setelah branch `security/patch-1-account-recovery` tersedia secara lokal:

```bash
npx wrangler@4 whoami
npx wrangler@4 deploy --env staging
```

Periksa output deployment dan pastikan nama Worker adalah **`willoapparel-staging`** serta URL berakhiran **`.workers.dev`**. Jika output menunjukkan `willoapparel`, domain `willoapparel.com`, atau route produksi, hentikan proses dan jangan lanjutkan.

Konfigurasi `wrangler.jsonc` menyiapkan asset `./public` dan binding DO staging. Migrasi kelas DO yang sudah didefinisikan pada root config berlaku untuk Worker staging; penyimpanan DO-nya tetap terpisah karena binding environment staging tidak menunjuk ke script produksi.

## 3. Tambahkan secret founder khusus staging

Buat secret acak lokal minimal 32 karakter. Jangan kirim secret ke chat, jangan masukkan ke Git, dan jangan gunakan secret produksi yang sama.

Contoh membuat secret di terminal:

```bash
openssl rand -hex 32
```

Simpan langsung ke environment staging:

```bash
npx wrangler@4 secret put FOUNDER_RECOVERY_SECRET --env staging
```

Paste nilai hasil generator ke prompt terminal. Jangan menaruh nilainya di command history, file repository, atau log CI. Secret produksi harus dikelola terpisah.

## 4. Google Sign-In (opsional untuk pengujian OAuth)

Staging menggunakan Google Client ID yang sama seperti konfigurasi saat ini. Setelah URL `.workers.dev` diketahui, tambahkan origin staging tersebut pada **Authorized JavaScript origins** di Google Cloud Console. Jangan mengubah atau menghapus origin produksi. Jika tidak ingin mengubah OAuth sekarang, lewati pengujian Google Sign-In dan gunakan skenario yang tidak memerlukan OAuth.

## 5. Smoke test staging

Setelah deploy, gunakan URL `.workers.dev` yang diberikan Wrangler:

- Buka halaman utama dan pastikan asset tampil.
- Panggil endpoint konfigurasi publik `/duniakotak/api/config`; pastikan respons JSON berisi konfigurasi client ID (bukan secret).
- Pastikan endpoint warga merespons dari database staging yang masih kosong/berisi data sintetis.
- Uji login, recovery, founder recovery, dan WebSocket hanya dengan akun sintetis.
- Pastikan recovery code sekali pakai, kedaluwarsa, dan rotasi sesi sesuai rencana uji.
- Ulangi pemeriksaan setelah deployment baru untuk memastikan tidak ada regresi.

Jangan menjalankan brute-force atau pengujian destruktif terhadap produksi. Jangan mengimpor data warga produksi ke staging.

## 6. GitHub Actions (opsional)

Untuk deployment otomatis staging, buat GitHub Actions secrets/repository variables khusus:
- `CLOUDFLARE_API_TOKEN`: token dengan izin minimum Workers Scripts: Edit pada akun yang tepat.
- `CLOUDFLARE_ACCOUNT_ID`: account ID Cloudflare.

Workflow deployment staging harus dibatasi ke branch keamanan atau workflow_dispatch, memakai `--env staging`, dan tidak boleh memiliki job deployment produksi. Jangan menambahkan token ke file YAML atau commit.

## Status

Konfigurasi staging sudah ditambahkan ke `wrangler.jsonc` pada branch keamanan. Resource Cloudflare belum dibuat/deploy dari sesi ini karena akun Cloudflare belum terhubung. Setelah deploy pertama, catat URL staging dan hasil smoke test di PR; jangan tandai integrasi lulus sebelum seluruh skenario runtime dijalankan.
