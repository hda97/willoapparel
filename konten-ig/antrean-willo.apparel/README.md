Antrean posting otomatis Willo Apparel ke @willo.apparel (dibaca konten-ig/posting.py lewat workflow ig-posting-willo.yml).
Nama file: YYYY-MM-DD.json atau YYYY-MM-DD-1.json (tanggal WIB). Isi: video/sampul/caption/jam.
Media disimpan di willo-ig/ dan dirujuk lewat URL raw.githubusercontent.com.
Token Halaman disimpan terenkripsi di konten-ig/token-willo.apparel.enc (dibuat otomatis saat run pertama dari secret IG_TOKEN).
Cron GitHub bisa terlewat; kalau antrean belum terbit, ubah file di folder ini (push) untuk memicu run, yang tetap menerbitkan antrean yang sudah lewat jam.
Jika token Halaman ditolak (kode 190), posting.py menurunkan ulang token dari token*.enc akun lain (PR #445).
