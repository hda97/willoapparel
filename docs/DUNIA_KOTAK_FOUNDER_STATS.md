# Dashboard Statistik Founder DUNIA KOTAK

## Tujuan dan batasan
- Dashboard berada di `/duniakotak/founder-stats.html` dan tidak ditautkan dari halaman publik.
- API: `GET /duniakotak/api/founder/stats`.
- API wajib memakai header `Authorization: Bearer <FOUNDER_STATS_TOKEN>`.
- Token hanya disimpan sebagai Cloudflare Worker secret, tidak di-commit dan tidak disimpan oleh halaman.
- Statistik hanya-baca; tidak mengubah baris, rumah/kavling, koin, inventaris, sesi, maupun progres warga.
- Respons tidak memuat nama, username, email, nomor warga, kode login, atau data pribadi.

## Metrik
1. Total akun terdaftar: `COUNT(*)` pada tabel `warga`; tidak memakai jumlah kavling publik yang juga memuat kavling yang disiapkan.
2. Pendaftar hari ini: jumlah baris dengan `dibuat >=` awal hari WIB (00:00 WIB).
3. Menunggu persetujuan: ditampilkan sebagai "Belum tersedia". Skema saat ini belum memiliki status persetujuan sehingga angka tidak boleh ditebak.

## Konfigurasi secret
Buat token acak minimal 32 karakter di password manager atau generator kriptografis. Jangan kirim token melalui chat dan jangan menaruhnya di file repo.

Pasang secret secara terpisah pada environment staging:
`npx wrangler secret put FOUNDER_STATS_TOKEN --env staging`

Untuk produksi, secret harus dipasang secara terpisah dan hanya setelah PR ditinjau, staging diuji, dan ada persetujuan deploy produksi:
`npx wrangler secret put FOUNDER_STATS_TOKEN`

Jika secret belum dipasang, endpoint gagal-tertutup (401). Jangan pernah menaruh nilai token pada `vars`, HTML, GitHub Actions log, atau commit.

## Uji penerimaan
- Tanpa token / token salah: 401 dan tidak ada statistik.
- Metode selain GET: 405.
- Token benar: mengembalikan hanya total, pendaftar hari ini WIB, status persetujuan unavailable, dan waktu pembaruan.
- Periksa bahwa akun baru yang dibuat pada staging menambah total dan pendaftar hari ini.
- Periksa bahwa halaman warga dan data game tetap tidak berubah.
- Uji di staging terisolasi. Jangan salin data produksi ke staging.
- Jangan deploy ke produksi sebelum persetujuan eksplisit founder.
