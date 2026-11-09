// NPC WARGA DESA (bukan pemain): berlabel "NPC", punya rutinitas pagi–malam, bisa diajak ngobrol dengan pilihan jawaban.
// NPC tidak dihitung sebagai warga online dan tidak pernah memakai nama/username warga asli.
import * as THREE from 'three';

// a = penampilan (avatar.js), peran = label, kerja = 'jalan' (keliling jalan desa) atau tempat diam,
// jam = [mulai, selesai] WIB saat NPC ada di luar rumah
const DATA = [
  {id: 'siti', nama: 'Bu Siti', peran: 'Pedagang sayur', kerja: 'warung', jam: [5.5, 17],
    a: {jenis: 'P', kulit: '#e0aa7e', rambut: {gaya: 'hijab', warna: '#2f7a4a'}, atasan: {jenis: 'kemeja', warna: '#e06a9a'}, bawahan: {jenis: 'rok-panjang', warna: '#6a5a48'}},
    kegiatan: ['Lagi nata sayur. Bayamnya baru dipetik subuh tadi, masih segar!', 'Nunggu pembeli. Nanti kalau Pasar Desa buka, hasil panen warga bisa dijual di sini.', 'Hitung kembalian, he he. Mau beli tomat? Bercanda, belum bisa beli kok.'],
    sapa: ['Sayur, sayur! Segar-segar!', 'Mampir, Nak!', 'Tomatnya merah-merah hari ini']},
  {id: 'darto', nama: 'Pak Darto', peran: 'Petani', kerja: 'sawah', jam: [5.5, 17.5],
    a: {jenis: 'L', kulit: '#a86e44', rambut: {gaya: 'cepak', warna: '#8a8a90'}, atasan: {jenis: 'kaos', warna: '#c8b89a'}, bawahan: {jenis: 'pendek', warna: '#2f3a52'}},
    kegiatan: ['Nyangkul sawah. Habis ini mau tanam padi lagi.', 'Ngecek air irigasi. Kalau sungai lancar, padi cepat tumbuh.', 'Istirahat sebentar, punggung pegal. Ha ha.'],
    sapa: ['Panas, tapi padi senang', 'Ayo bertani!', 'Sawahnya hijau, kan?']},
  {id: 'bayu', nama: 'Mas Bayu', peran: 'Tukang pos', kerja: 'jalan', cepat: 1.6, jam: [7, 16],
    a: {jenis: 'L', kulit: '#e0aa7e', rambut: {gaya: 'belah', warna: '#0b0b0e'}, atasan: {jenis: 'seragam', warna: '#f2c14e'}, bawahan: {jenis: 'celana', warna: '#2f3a52'}},
    kegiatan: ['Antar surat ke rumah-rumah warga. Dusun ini makin besar, jalanku makin jauh!', 'Cari alamat. Untung tiap rumah ada batu nama di depannya.', 'Lagi buru-buru, masih banyak paket!'],
    sapa: ['Pos! Pos!', 'Permisi, numpang lewat!', 'Ada surat buat kamu? Belum, he he']},
  {id: 'rina', nama: 'Bu Rina', peran: 'Guru SD', kerja: 'dalam', di: {f: 1, x: 0, z: -6.3, gaya: 'guru'}, jam: [7, 16],
    a: {jenis: 'P', kulit: '#f2c7a0', rambut: {gaya: 'bob', warna: '#3a2416'}, atasan: {jenis: 'batik', warna: '#c88a3a'}, bawahan: {jenis: 'rok-panjang', warna: '#1d1d22'}},
    kegiatan: ['Lagi mengajar matematika. Berapa 7 × 8? Ayo jawab!', 'Nulis di papan tulis. Anak-anak, dicatat ya!', 'Habis ini istirahat, terus pelajaran Bahasa Indonesia.'],
    sapa: ['Selamat pagi!', 'Rajin-rajin belajar ya', 'Ssst, kelas sedang belajar']},
  {id: 'joko', nama: 'Pak Joko', peran: 'Ketua RT', kerja: 'balai', jam: [7, 20],
    a: {jenis: 'L', kulit: '#c98c5e', rambut: {gaya: 'belah', warna: '#3a2416'}, atasan: {jenis: 'batik', warna: '#7a2a2a'}, bawahan: {jenis: 'celana', warna: '#1d1d22'}},
    kegiatan: ['Ngecek supermarket, rumah sakit, sama stadion baru. Semua hasil voting warga!', 'Mendata warga baru. Tiap hari ada saja yang pindah ke sini!', 'Siapkan kerja bakti. Kamu ikut ya nanti.'],
    sapa: ['Warga baru? Selamat datang!', 'Jaga kebersihan dusun ya', 'Ayo kerja bakti!']},
  {id: 'karto', nama: 'Mbah Karto', peran: 'Pemancing', kerja: 'sungai', jam: [6, 18],
    a: {jenis: 'L', kulit: '#a86e44', rambut: {gaya: 'cepak', warna: '#f4f4f4'}, atasan: {jenis: 'kemeja', warna: '#3a5a3a'}, bawahan: {jenis: 'sarung', warna: '#7a2a2a'}},
    kegiatan: ['Mancing, Le. Sabar itu kuncinya. Kemarin dapat kepiting langka!', 'Nunggu umpan disambar. Ssst, jangan berisik.', 'Dulu sungai ini lebih lebar. Sekarang ada jembatan, enak.'],
    sapa: ['Ssst… ikannya kabur', 'Mancing yuk, Le', 'Sungainya jernih hari ini']},
  {id: 'dimas', nama: 'Dimas', peran: 'Anak', kerja: 'main', kecil: 1, jam: [7, 17.5],
    a: {jenis: 'L', kulit: '#e0aa7e', rambut: {gaya: 'acak', warna: '#0b0b0e'}, atasan: {jenis: 'kaos', warna: '#d0442f'}, bawahan: {jenis: 'pendek', warna: '#2f3a52'}},
    kegiatan: ['Main kejar-kejaran sama Sari! Ayo ikut!', 'Nyari kotak bercahaya. Katanya isinya apel!', 'Aku mau jadi tukang pos kayak Mas Bayu.'],
    sapa: ['Kejar aku!', 'Hore!', 'Sari curang!']},
  {id: 'sari', nama: 'Sari', peran: 'Anak', kerja: 'main', kecil: 1, jam: [7, 17.5],
    a: {jenis: 'P', kulit: '#f2c7a0', rambut: {gaya: 'kuncir', warna: '#3a2416'}, atasan: {jenis: 'kaos', warna: '#f2c14e'}, bawahan: {jenis: 'rok', warna: '#3a7bd5'}},
    kegiatan: ['Main kejar-kejaran! Dimas larinya lambat, he he.', 'Aku mau kasih makan Oyen nanti sore.', 'Lagi ngumpulin bunga buat Ibu.'],
    sapa: ['Hihi!', 'Ayo main!', 'Dimas, tunggu!']},
  {id: 'ani', nama: 'Bu Ani', peran: 'Penjual jamu', kerja: 'jalan', jam: [6, 11],
    a: {jenis: 'P', kulit: '#c98c5e', rambut: {gaya: 'kepang', warna: '#0b0b0e'}, atasan: {jenis: 'batik', warna: '#2a9a5a'}, bawahan: {jenis: 'rok-panjang', warna: '#6a5a48'}},
    kegiatan: ['Keliling jual jamu kunyit asam. Biar sehat dan kuat jalan-jalan!', 'Habis dari RT 3, sekarang mau ke RT 5.', 'Jamunya tinggal sedikit, laris hari ini!'],
    sapa: ['Jamu, jamu!', 'Kunyit asam segar!', 'Biar sehat, Nak']},
  {id: 'ujang', nama: 'Kang Ujang', peran: 'Tukang bakso', kerja: 'jalan', cepat: .7, jam: [15, 21.5],
    a: {jenis: 'L', kulit: '#e0aa7e', rambut: {gaya: 'keriting', warna: '#3a2416'}, atasan: {jenis: 'kaos', warna: '#f4f4f4'}, bawahan: {jenis: 'celana', warna: '#3a5a3a'}},
    kegiatan: ['Jualan bakso keliling. Tok tok tok!', 'Sore-sore enaknya makan bakso, kan?', 'Nunggu pelanggan langganan di RT 2.'],
    sapa: ['Tok tok tok! Bakso!', 'Baksonya anget!', 'Sore, Mas! Sore, Mbak!']},
  {id: 'wati', nama: 'Mbak Wati', peran: 'Penjahit', kerja: 'jalan', jam: [8, 18],
    a: {jenis: 'P', kulit: '#e0aa7e', rambut: {gaya: 'panjang', warna: '#6a4026'}, atasan: {jenis: 'kaos-willo', warna: '#1d1d22'}, bawahan: {jenis: 'celana', warna: '#2f3a52'}},
    kegiatan: ['Antar jahitan ke warga. Kaos ini? Sablon Willo, bagus kan!', 'Cari kain buat seragam kerja bakti.', 'Jalan-jalan sore, lihat rumah-rumah baru.'],
    sapa: ['Halo!', 'Bajumu keren!', 'Mau dijahitkan apa?']},
  {id: 'slamet', nama: 'Pak Slamet', peran: 'Ronda malam', kerja: 'jalan', jam: [20, 29.5],
    a: {jenis: 'L', kulit: '#a86e44', rambut: {gaya: 'cepak', warna: '#0b0b0e'}, atasan: {jenis: 'jaket', warna: '#2f3a52'}, bawahan: {jenis: 'sarung', warna: '#3a5a3a'}},
    kegiatan: ['Ronda malam, jaga dusun biar aman. Tidur saja, aku yang jaga.', 'Keliling RT. Tadi ada kucing lewat, kirain maling, ha ha.', 'Ngopi dulu di pos ronda, habis itu keliling lagi.'],
    sapa: ['Siskamling!', 'Aman, aman!', 'Jangan lupa kunci pintu']},
  {id: 'udin', nama: 'Pak Udin', peran: 'Ronda malam', kerja: 'jalan', jam: [20, 29.5],
    a: {jenis: 'L', kulit: '#c98c5e', rambut: {gaya: 'belah', warna: '#8a8a90'}, atasan: {jenis: 'jaket', warna: '#7a2a2a'}, bawahan: {jenis: 'celana', warna: '#1d1d22'}},
    kegiatan: ['Ronda bareng Pak Slamet. Malam ini dingin, untung pakai jaket.', 'Pukul kentongan tiap jam. Tong, tong!', 'Ngantuk, tapi tugas tetap tugas.'],
    sapa: ['Tong, tong, tong!', 'Malam, Nak', 'Sudah malam, istirahat ya']},
  // --- NPC tambahan 3 Nov 2026 (Huda: perbanyak NPC): penjaga fasum hasil voting + pejalan kaki ---
  // Supermarket: kasir di balik meja kasir, pembeli keliling rak lalu antre bayar (Huda 9 Nov 2026)
  {id: 'lina', nama: 'Mbak Lina', peran: 'Kasir', kerja: 'dalam', di: {f: 0, x: -2.6, z: -1.62, ry: Math.PI, gaya: 'kasir'}, jam: [8, 22],
    a: {jenis: 'P', kulit: '#f2c7a0', rambut: {gaya: 'kuncir', warna: '#3a2416'}, atasan: {jenis: 'seragam', warna: '#3a7bd5'}, bawahan: {jenis: 'rok-panjang', warna: '#1d1d22'}},
    kegiatan: ['Jaga kasir. Tit, tit! Belanjaannya sudah dihitung.', 'Supermarket ini hasil voting warga, lho, usulan terbanyak!', 'Antre dulu ya, satu-satu.'],
    sapa: ['Selamat datang!', 'Belanja apa hari ini?', 'Ada promo, he he']},
  {id: 'dodi', nama: 'Mas Dodi', peran: 'Kasir', kerja: 'dalam', di: {f: 0, x: 2.6, z: -1.62, ry: Math.PI, gaya: 'kasir'}, jam: [9, 21],
    a: {jenis: 'L', kulit: '#c98c5e', rambut: {gaya: 'belah', warna: '#0b0b0e'}, atasan: {jenis: 'seragam', warna: '#3a7bd5'}, bawahan: {jenis: 'celana', warna: '#1d1d22'}},
    kegiatan: ['Scan barang satu-satu. Tit!', 'Kembaliannya pas ya, Bu.', 'Mau pakai kantong? Bawa tas sendiri lebih hemat!'],
    sapa: ['Kasir 2 kosong!', 'Silakan, Kak', 'Terima kasih sudah belanja']},
  {id: 'mirna', nama: 'Bu Mirna', peran: 'Pembeli', kerja: 'dalam', di: {f: 0, gaya: 'belanja', mulai: 0}, jam: [8.5, 21],
    a: {jenis: 'P', kulit: '#c98c5e', rambut: {gaya: 'kepang', warna: '#0b0b0e'}, atasan: {jenis: 'kemeja', warna: '#9a5ad8'}, bawahan: {jenis: 'rok-panjang', warna: '#3a3a3a'}},
    kegiatan: ['Belanja bulanan. Beras, minyak, gula… apa lagi ya?', 'Cari kecap. Raknya di mana sih?', 'Mau bayar dulu, antre di kasir.'],
    sapa: ['Murah-murah!', 'Permisi, Nak', 'Ada diskon?']},
  {id: 'yoga', nama: 'Mas Yoga', peran: 'Pembeli', kerja: 'dalam', di: {f: 0, gaya: 'belanja', mulai: 5}, jam: [9, 22],
    a: {jenis: 'L', kulit: '#e0aa7e', rambut: {gaya: 'acak', warna: '#3a2416'}, atasan: {jenis: 'kaos-willo', warna: '#1d1d22'}, bawahan: {jenis: 'celana', warna: '#2f3a52'}},
    kegiatan: ['Beli camilan buat nonton bola di stadion.', 'Nyari mi instan rasa soto. Habis terus!', 'Antre kasir, semoga cepat.'],
    sapa: ['Halo!', 'Belanja juga?', 'Ramai ya hari ini']},
  {id: 'nia', nama: 'Mbak Nia', peran: 'Pembeli', kerja: 'dalam', di: {f: 0, gaya: 'belanja', mulai: 10}, jam: [10, 21.5],
    a: {jenis: 'P', kulit: '#f2c7a0', rambut: {gaya: 'panjang', warna: '#6a4026'}, atasan: {jenis: 'kaos', warna: '#3aa860'}, bawahan: {jenis: 'celana', warna: '#1d1d22'}},
    kegiatan: ['Cari sabun sama sampo. Stok di rumah habis.', 'Bandingin harga dulu, biar hemat.', 'Titip salam buat Mbak Lina di kasir!'],
    sapa: ['Hai!', 'Permisi, mau lewat', 'Buahnya segar-segar']},
  {id: 'harto', nama: 'Pak Harto', peran: 'Satpam supermarket', kerja: 'supermarket', dx: 3, jam: [7, 23],
    a: {jenis: 'L', kulit: '#a86e44', rambut: {gaya: 'cepak', warna: '#0b0b0e'}, atasan: {jenis: 'seragam', warna: '#2f3a52'}, bawahan: {jenis: 'celana', warna: '#1d1d22'}},
    kegiatan: ['Jaga parkiran supermarket. Mobilnya rapi semua, kan?', 'Bantu warga angkat belanjaan.', 'Pantau pintu masuk. Aman!'],
    sapa: ['Parkir di sini, Mas!', 'Aman terkendali', 'Hati-hati di jalan']},
  // Rumah Sakit: dokter keliling bangsal periksa pasien, perawat jaga IGD & menemani pasien, pasien berbaring di ranjang (Huda 9 Nov 2026)
  {id: 'ayu', nama: 'dr. Ayu', peran: 'Dokter', kerja: 'dalam', di: {f: 11, gaya: 'dokter'}, jam: [6, 24],
    a: {jenis: 'P', kulit: '#e0aa7e', rambut: {gaya: 'hijab', warna: '#f4f4f4'}, hijab: '#f4f4f4', kacamata: true, atasan: {jenis: 'kemeja', warna: '#f4f4f4'}, bawahan: {jenis: 'rok-panjang', warna: '#4a5a7a'}},
    kegiatan: ['Keliling bangsal, periksa pasien satu-satu. Rumah sakit ini hasil voting warga!', 'Pak Karyo sudah membaik, besok boleh pulang.', 'Jangan lupa minum air putih dan istirahat cukup ya.'],
    sapa: ['Sehat selalu!', 'Sudah cuci tangan?', 'Jaga kesehatan ya']},
  {id: 'rani', nama: 'Suster Rani', peran: 'Perawat IGD', kerja: 'dalam', di: {f: 11, x: 6.8, z: -6.5, gaya: 'jaga'}, jam: [0, 24],
    a: {jenis: 'P', kulit: '#f2c7a0', rambut: {gaya: 'bob', warna: '#0b0b0e'}, atasan: {jenis: 'seragam', warna: '#7ad0c0'}, bawahan: {jenis: 'celana', warna: '#7ad0c0'}},
    kegiatan: ['Jaga meja IGD. Daftar dulu di sini ya kalau berobat.', 'Mas Tono kakinya keseleo main bola, sudah aku perban.', 'Tensi darahmu berapa? Sini aku cek, he he.'],
    sapa: ['Halo, ada keluhan?', 'Semangat sehat!', 'Pelan-pelan ya']},
  {id: 'dewi', nama: 'Suster Dewi', peran: 'Perawat', kerja: 'dalam', di: {f: 11, x: -1.05, z: -6.3, ry: Math.PI / 2, gaya: 'rawat'}, jam: [0, 24],
    a: {jenis: 'P', kulit: '#e0aa7e', rambut: {gaya: 'kuncir', warna: '#3a2416'}, atasan: {jenis: 'seragam', warna: '#7ad0c0'}, bawahan: {jenis: 'rok-panjang', warna: '#7ad0c0'}},
    kegiatan: ['Ganti infus Bu Nah. Pelan-pelan ya, Bu.', 'Catat suhu badan pasien. Sudah turun, alhamdulillah.', 'Antar obat ke tiap ranjang.'],
    sapa: ['Ssst, pasien istirahat', 'Semoga lekas sembuh', 'Halo!']},
  {id: 'karyo', nama: 'Pak Karyo', peran: 'Pasien', kerja: 'dalam', di: {f: 11, x: -4.5, z: -6.92, gaya: 'baring'}, jam: [0, 24],
    a: {jenis: 'L', kulit: '#a86e44', rambut: {gaya: 'cepak', warna: '#8a8a90'}, atasan: {jenis: 'kemeja', warna: '#9fc8e8'}, bawahan: {jenis: 'celana', warna: '#9fc8e8'}},
    kegiatan: ['Lagi dirawat, kecapekan habis panen. Kata dr. Ayu besok boleh pulang!', 'Makanan rumah sakit enak juga, he he.', 'Tolong bilang ke Pak Darto, sawahku dititip dulu.'],
    sapa: ['Uhuk… halo', 'Doakan cepat sembuh ya', 'Terima kasih sudah jenguk']},
  {id: 'nah', nama: 'Bu Nah', peran: 'Pasien', kerja: 'dalam', di: {f: 11, x: .1, z: -6.92, gaya: 'baring'}, jam: [0, 24],
    a: {jenis: 'P', kulit: '#c98c5e', rambut: {gaya: 'kepang', warna: '#8a8a90'}, atasan: {jenis: 'kemeja', warna: '#9fc8e8'}, bawahan: {jenis: 'celana', warna: '#9fc8e8'}},
    kegiatan: ['Lagi diinfus, kemarin demam. Sekarang sudah enakan.', 'Cucuku Sari belum jenguk, ya?', 'Suster Dewi baik sekali.'],
    sapa: ['Halo, Nak', 'Sudah makan?', 'Jaga kesehatan ya']},
  {id: 'tono', nama: 'Mas Tono', peran: 'Pasien IGD', kerja: 'dalam', di: {f: 11, x: 8, z: -4.1, gaya: 'dudukRanjang'}, jam: [7, 22],
    a: {jenis: 'L', kulit: '#e0aa7e', rambut: {gaya: 'keriting', warna: '#0b0b0e'}, atasan: {jenis: 'kaos', warna: '#e0303a'}, bawahan: {jenis: 'pendek', warna: '#f4f4f4'}},
    kegiatan: ['Kakiku keseleo main bola di stadion. Aduh!', 'Kata Suster Rani cukup dikompres es, besok sembuh.', 'Lain kali pemanasan dulu sebelum main.'],
    sapa: ['Aduh, aduh…', 'Hati-hati main bola ya', 'Halo!']},
  {id: 'bambang', nama: 'Pak Bambang', peran: 'Sopir ambulans', kerja: 'rs', dx: 2, dz: 3.5, jam: [6, 24],
    a: {jenis: 'L', kulit: '#c98c5e', rambut: {gaya: 'belah', warna: '#3a2416'}, atasan: {jenis: 'kemeja', warna: '#f4f4f4'}, bawahan: {jenis: 'celana', warna: '#2f3a52'}},
    kegiatan: ['Lap ambulans biar kinclong. Siaga 24 jam!', 'Cek bensin ambulans. Penuh!', 'Nunggu panggilan. Semoga sepi terus.'],
    sapa: ['Nguing nguing!', 'Siaga!', 'Minggir dikit ya, he he']},
  {id: 'rizky', nama: 'Rizky', peran: 'Pemain bola', kerja: 'bola', tim: 1, fase: 0, jam: [15, 18.5],
    a: {jenis: 'L', kulit: '#e0aa7e', rambut: {gaya: 'acak', warna: '#0b0b0e'}, atasan: {jenis: 'kaos', warna: '#e0303a'}, bawahan: {jenis: 'pendek', warna: '#f4f4f4'}},
    kegiatan: ['Latihan sore di stadion baru! Lapangannya mantap.', 'Kejar bola! Oper sini!', 'Tim merah pasti menang!'],
    sapa: ['Oper!', 'Gol!', 'Ayo main bola!']},
  {id: 'fajar', nama: 'Fajar', peran: 'Pemain bola', kerja: 'bola', tim: -1, fase: 1.6, jam: [15, 18.5],
    a: {jenis: 'L', kulit: '#a86e44', rambut: {gaya: 'cepak', warna: '#0b0b0e'}, atasan: {jenis: 'kaos', warna: '#3a8ad8'}, bawahan: {jenis: 'pendek', warna: '#1d1d22'}},
    kegiatan: ['Main bola sama Rizky. Skornya 2-1, kami kalah dulu.', 'Pemanasan dulu biar tidak keseleo.', 'Kiper kami jago, tapi tadi kebobolan.'],
    sapa: ['Tahan bolanya!', 'Ayo, tim biru!', 'Hampir!']},
  {id: 'andi', nama: 'Andi', peran: 'Pemain bola', kerja: 'bola', tim: 1, fase: 3.2, jam: [15, 18.5],
    a: {jenis: 'L', kulit: '#f2c7a0', rambut: {gaya: 'keriting', warna: '#3a2416'}, atasan: {jenis: 'kaos', warna: '#e0303a'}, bawahan: {jenis: 'pendek', warna: '#f4f4f4'}},
    kegiatan: ['Aku striker! Tadi cetak satu gol.', 'Minum dulu, haus banget.', 'Besok ada pertandingan antar-RT, nonton ya!'],
    sapa: ['Gol!', 'Lihat tendanganku!', 'Hore!']},
  {id: 'bima', nama: 'Bima', peran: 'Pemain bola', kerja: 'bola', tim: -1, kiper: true, fase: 4.8, jam: [15, 18.5],
    a: {jenis: 'L', kulit: '#c98c5e', rambut: {gaya: 'belah', warna: '#0b0b0e'}, atasan: {jenis: 'kaos', warna: '#3a8ad8'}, bawahan: {jenis: 'pendek', warna: '#1d1d22'}},
    kegiatan: ['Jaga gawang. Bolanya jangan masuk!', 'Latihan tangkap bola.', 'Stadionnya keren, ada lampu sorot buat main malam.'],
    sapa: ['Tangkap!', 'Awas!', 'Main yuk!']},
  {id: 'darno', nama: 'Pak Darno', peran: 'Wasit', kerja: 'stadion', wasit: true, dz: -2.5, jam: [15, 18.5],
    a: {jenis: 'L', kulit: '#a86e44', rambut: {gaya: 'cepak', warna: '#8a8a90'}, atasan: {jenis: 'kaos', warna: '#1d1d22'}, bawahan: {jenis: 'pendek', warna: '#1d1d22'}},
    kegiatan: ['Jadi wasit latihan sore. Priit!', 'Awas pelanggaran! Main yang sportif.', 'Skornya masih 2-1.'],
    sapa: ['Priit!', 'Sportif ya!', 'Pelanggaran!']},
  {id: 'yuni', nama: 'Mbak Yuni', peran: 'Penjual es', kerja: 'stadion', dz: 10, dx: -4, jam: [10, 19],
    a: {jenis: 'P', kulit: '#e0aa7e', rambut: {gaya: 'panjang', warna: '#3a2416'}, atasan: {jenis: 'kaos', warna: '#f2c14e'}, bawahan: {jenis: 'rok-panjang', warna: '#6a5a48'}},
    kegiatan: ['Jualan es teh di depan stadion. Habis main bola pasti haus!', 'Esnya tinggal sedikit, laris!', 'Nunggu anak-anak selesai latihan.'],
    sapa: ['Es teh, es teh!', 'Seger!', 'Haus, Mas?']},
  {id: 'tini', nama: 'Bu Tini', peran: 'Ibu rumah tangga', kerja: 'jalan', jam: [7, 17],
    a: {jenis: 'P', kulit: '#c98c5e', rambut: {gaya: 'hijab', warna: '#7a2a2a'}, hijab: '#b0507a', atasan: {jenis: 'batik', warna: '#c88a3a'}, bawahan: {jenis: 'rok-panjang', warna: '#3a3a3a'}},
    kegiatan: ['Mau belanja ke supermarket baru. Katanya lengkap!', 'Pulang dari warung Bu Siti, beli bayam.', 'Jemput Sari, sudah sore.'],
    sapa: ['Mari, Nak', 'Belanja dulu', 'Sudah makan?']},
  {id: 'eko', nama: 'Mas Eko', peran: 'Pelari pagi', kerja: 'jalan', cepat: 1.9, jam: [5, 9],
    a: {jenis: 'L', kulit: '#e0aa7e', rambut: {gaya: 'cepak', warna: '#0b0b0e'}, atasan: {jenis: 'kaos-willo', warna: '#1d1d22'}, bawahan: {jenis: 'pendek', warna: '#2f3a52'}},
    kegiatan: ['Lari pagi keliling dusun. Sudah 3 putaran!', 'Biar sehat, nanti mampir stadion.', 'Hah… hah… istirahat sebentar.'],
    sapa: ['Pagi!', 'Ayo olahraga!', 'Semangat!']},
  {id: 'gilang', nama: 'Mas Gilang', peran: 'Kurir paket', kerja: 'jalan', cepat: 1.5, jam: [9, 18],
    a: {jenis: 'L', kulit: '#a86e44', rambut: {gaya: 'belah', warna: '#0b0b0e'}, atasan: {jenis: 'jaket', warna: '#3aa860'}, bawahan: {jenis: 'celana', warna: '#1d1d22'}},
    kegiatan: ['Antar paket ke warga baru. Banyak sekali yang pindah ke sini!', 'Cari rumah nomor 240-an, di ujung selatan.', 'Paketnya kaos sablon, pasti dari Willo.'],
    sapa: ['Paket!', 'Permisi!', 'Tanda tangan di sini ya']},
  {id: 'lastri', nama: 'Mbak Lastri', peran: 'Penjual gorengan', kerja: 'jalan', cepat: .8, jam: [14, 20.5],
    a: {jenis: 'P', kulit: '#f2c7a0', rambut: {gaya: 'kepang', warna: '#3a2416'}, atasan: {jenis: 'kemeja', warna: '#e06a2a'}, bawahan: {jenis: 'rok-panjang', warna: '#6a5a48'}},
    kegiatan: ['Jualan gorengan keliling. Tahu isi masih panas!', 'Mau ke stadion, anak-anak bola suka gorengan.', 'Tinggal pisang goreng tiga.'],
    sapa: ['Gorengan, gorengan!', 'Masih anget!', 'Tahu isi, Mas?']},
  // Sekolah: murid duduk di bangku kelas, Bu Rina mengajar di depan papan tulis (Huda 9 Nov 2026)
  {id: 'putri', nama: 'Putri', peran: 'Murid SD', kerja: 'dalam', kecil: 1, di: {f: 1, x: -4.5, z: -4.95, ry: Math.PI, gaya: 'murid'}, jam: [7, 16],
    a: {jenis: 'P', kulit: '#f2c7a0', rambut: {gaya: 'kuncir', warna: '#0b0b0e'}, atasan: {jenis: 'seragam', warna: '#f4f4f4'}, bawahan: {jenis: 'rok', warna: '#c8202a'}},
    kegiatan: ['Lagi belajar berhitung. 7 × 8 = 56!', 'Nyontek? Nggak dong, aku belajar semalam.', 'Nanti istirahat main kejar-kejaran sama Dimas.'],
    sapa: ['Halo, Kak!', 'Ssst, lagi belajar', 'Hihi']},
  {id: 'bagas', nama: 'Bagas', peran: 'Murid SD', kerja: 'dalam', kecil: 1, di: {f: 1, x: -1.5, z: -4.95, ry: Math.PI, gaya: 'murid'}, jam: [7, 16],
    a: {jenis: 'L', kulit: '#e0aa7e', rambut: {gaya: 'acak', warna: '#0b0b0e'}, atasan: {jenis: 'seragam', warna: '#f4f4f4'}, bawahan: {jenis: 'pendek', warna: '#c8202a'}},
    kegiatan: ['Lagi nyatet pelajaran dari Bu Rina.', 'Aku suka pelajaran olahraga, bisa main bola di stadion!', 'PR-ku sudah selesai, dong.'],
    sapa: ['Halo, Kak!', 'Ssst, lagi belajar', 'Hihi']},
  {id: 'laras', nama: 'Laras', peran: 'Murid SD', kerja: 'dalam', kecil: 1, di: {f: 1, x: 3.0, z: -4.95, ry: Math.PI, gaya: 'murid'}, jam: [7, 16],
    a: {jenis: 'P', kulit: '#c98c5e', rambut: {gaya: 'bob', warna: '#0b0b0e'}, atasan: {jenis: 'seragam', warna: '#f4f4f4'}, bawahan: {jenis: 'rok', warna: '#c8202a'}},
    kegiatan: ['Lagi menggambar peta Dunia Kotak buat tugas.', 'Cita-citaku jadi dokter kayak dr. Ayu.', 'Ssst, nanti dimarahi Bu Rina.'],
    sapa: ['Halo, Kak!', 'Ssst, lagi belajar', 'Hihi']},
  {id: 'raffi', nama: 'Raffi', peran: 'Murid SD', kerja: 'dalam', kecil: 1, di: {f: 1, x: -3.0, z: -3.70, ry: Math.PI, gaya: 'murid'}, jam: [7, 16],
    a: {jenis: 'L', kulit: '#a86e44', rambut: {gaya: 'cepak', warna: '#0b0b0e'}, atasan: {jenis: 'seragam', warna: '#f4f4f4'}, bawahan: {jenis: 'pendek', warna: '#c8202a'}},
    kegiatan: ['Ngantuk… semalam main Pelari Kalcer.', 'Aku mau jadi pemain bola kayak Rizky!', 'Bu Rina, boleh ke toilet?'],
    sapa: ['Halo, Kak!', 'Ssst, lagi belajar', 'Hihi']},
  {id: 'nisa', nama: 'Nisa', peran: 'Murid SD', kerja: 'dalam', kecil: 1, di: {f: 1, x: 1.5, z: -3.70, ry: Math.PI, gaya: 'murid'}, jam: [7, 16],
    a: {jenis: 'P', kulit: '#e0aa7e', rambut: {gaya: 'kepang', warna: '#0b0b0e'}, atasan: {jenis: 'seragam', warna: '#f4f4f4'}, bawahan: {jenis: 'rok', warna: '#c8202a'}},
    kegiatan: ['Lagi baca buku cerita. Seru!', 'Aku ranking satu di kelas, he he.', 'Nanti pulang sekolah bantu Ibu di warung.'],
    sapa: ['Halo, Kak!', 'Ssst, lagi belajar', 'Hihi']},
  {id: 'budi', nama: 'Budi', peran: 'Murid SD', kerja: 'dalam', kecil: 1, di: {f: 1, x: 4.5, z: -3.70, ry: Math.PI, gaya: 'murid'}, jam: [7, 16],
    a: {jenis: 'L', kulit: '#f2c7a0', rambut: {gaya: 'belah', warna: '#0b0b0e'}, atasan: {jenis: 'seragam', warna: '#f4f4f4'}, bawahan: {jenis: 'pendek', warna: '#c8202a'}},
    kegiatan: ['Lagi ngerjain soal. Susah tapi seru!', 'Aku mau jadi tukang pos kayak Mas Bayu.', 'Bel istirahat kapan bunyi, ya?'],
    sapa: ['Halo, Kak!', 'Ssst, lagi belajar', 'Hihi']},
];

export function buatNPC({sc, I, VS, warga, pose, siapAv, bayangan, tinggi = () => 0}) {
  const J = I.jalur;
  const xs = J ? J.xs : I.vroads.map(([a, b]) => ((a + b) / 2 + I.ox) * VS), zs = J ? J.zs : I.hroads.map(([a, b]) => ((a + b) / 2 + I.oz) * VS);
  const bolehNaik = J ? J.bolehNaik : () => true;
  const node = (i, j) => new THREE.Vector3(xs[i], tinggi(xs[i], zs[j]), zs[j]);
  let biji = 17; const acak = () => { biji = (biji * 16807) % 2147483647; return (biji - 1) / 2147483646; };
  const fas = I.fas || [];
  // fas[2] = Warung Desa, fas[0] = Supermarket, fas[12] = Stadion (voting 3 Nov): anak-anak main bola di stadion
  const fasA = fas[2] || node(1, 1), fasB = fas[0] || node(2, 2), fasC = fas[0] || fasA;
  const sungai = I.sungai || {x0: 0, x1: 0, jembatan: []}, jb = sungai.jembatan[Math.min(2, sungai.jembatan.length - 1)] || [zs[2], zs[2]];
  const tempat = I.tempatNPC || {
    warung: new THREE.Vector3(fasA.x + 4 * VS, 0, fasA.z + 7.5 * VS),
    balai: new THREE.Vector3(fasC.x - 6 * VS, 0, fasC.z + 5 * VS),
    sungai: new THREE.Vector3(sungai.x0 - .8 * VS, 0, jb[1] + 3 * VS),
    sawah: new THREE.Vector3(sungai.x1 + 6 * VS, 0, jb[1] + 4 * VS),
    main: fas[12] ? fas[12].clone() : fasB.clone(),
    ...(fas[0] && fas[11] && fas[12] && !I.tempatNPC ? {supermarket: new THREE.Vector3(fas[0].x, 0, fas[0].z + 1.8 * VS), rs: new THREE.Vector3(fas[11].x + 6.6 * VS, 0, fas[11].z + 1.4 * VS), stadion: fas[12].clone(), bola: fas[12].clone()} : {}),
  };
  // ---- NPC dalam gedung: kelas SD (fas[1]), supermarket (fas[0]), rumah sakit (fas[11]) ----
  const LANTAI = .39 * VS;   // lantai ruang dalam fasum (lantai .35 + ubin .04)
  const DUDUK = .625 * VS, KASUR = .85 * VS, RANJANG_IGD = .745 * VS;   // dudukan kursi kelas, kasur bangsal RS, ranjang IGD
  // rute pembeli (lokal supermarket): [x, z, hadap, tunggu] — keliling lorong rak, berhenti pilih barang, antre di kasir 1 & 2
  const RUTE_BELANJA = [[-2.5, -2.95, 0, 4], [-2.5, -4.4], [-5.2, -4.4, Math.PI, 2.5], [-2.5, -4.4], [-2.5, -6], [-5.2, -6, Math.PI, 2.5], [-2.5, -6], [0, -6, 0, 2.5], [2.5, -6], [5.2, -6, Math.PI, 2.5], [2.5, -6], [2.5, -4.4], [5.2, -4.4, 0, 2.5], [2.5, -4.4], [2.5, -2.95, 0, 4]];
  // dokter keliling ujung ranjang bangsal (pasien di ranjang -4.5 & 0.1 diperiksa lebih lama)
  const RUTE_DOKTER = [[-6.8, -5.9, Math.PI, 2], [-4.5, -5.9, Math.PI, 6], [-2.2, -5.9, Math.PI, 2], [.1, -5.9, Math.PI, 6], [2.4, -5.9, Math.PI, 2], [.1, -5.9, Math.PI, 3], [-2.2, -5.9, Math.PI, 2], [-4.5, -5.9, Math.PI, 3]];
  const SELIMUT = new THREE.MeshStandardMaterial({color: 0xdfeef6, roughness: .9});
  function taruhDalam(n) {
    const d = n.di, o = n.obj, s = n.kecil ? .72 : 1;
    n.rute = d.gaya === 'belanja' ? RUTE_BELANJA : d.gaya === 'dokter' ? RUTE_DOKTER : null;
    if (n.rute) { n.idx = (d.mulai || 0) % n.rute.length; const [x, z] = n.rute[n.idx]; o.position.copy(lw(d.f, x, z)); n.pusat = o.position.clone(); return; }
    const p = lw(d.f, d.x, d.z);
    if (d.gaya === 'murid') p.y = DUDUK + .25 * s - 1.37 * s;
    else if (d.gaya === 'dudukRanjang') p.y = RANJANG_IGD + .25 - 1.37;
    else if (d.gaya === 'baring') {
      p.y = KASUR + .42; o.rotation.x = -Math.PI / 2; n.tinggi = 2.6;   // kepala di bantal (arah -z), wajah ke atas
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.34, 2.1, .78), SELIMUT); b.position.set(0, .95, .06); o.add(b);
    }
    if (d.gaya === 'murid') n.tinggi = 3.2; else if (d.gaya === 'dudukRanjang') n.tinggi = 4.2;
    o.position.copy(p); o.rotation.y = d.ry || 0; n.pusat = p.clone();
  }
  const POSE_DIAM = {murid: 1, baring: 1, dudukRanjang: 1, kasir: 1, jaga: 1, rawat: 1};
  function jalanKe(n, o, tx, tz, sp, dt) {
    const dx = tx - o.position.x, dz = tz - o.position.z, l = Math.hypot(dx, dz);
    if (l <= sp) { o.position.x = tx; o.position.z = tz; return false; }
    o.position.x += dx / l * sp; o.position.z += dz / l * sp; hadapi(o, tx, tz, Math.min(1, dt * 8)); return true;
  }
  function dalam(n, o, dt, me, kec) {
    const d = n.di, g = d.gaya, t = n.ph;
    if (n.ngobrol) {
      if (POSE_DIAM[g]) { if (o.visible) gayaDiam(n, o, t, true); return; }
      hadapi(o, me.position.x, me.position.z, Math.min(1, dt * 6)); if (o.visible) pose(o, {}); return;
    }
    if (n.rute) {
      if (n.tunggu > 0) { n.tunggu -= dt; const ry = n.rute[n.idx][2]; if (ry != null) { let dr = ry - o.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); o.rotation.y += dr * Math.min(1, dt * 6); }
        if (o.visible) pose(o, g === 'dokter' ? {armR: -1.25 + Math.sin(t * 2) * .1, armL: -.5, head: .25} : n.rute[n.idx][0] === -2.5 || n.rute[n.idx][0] === 2.5 ? {armL: -.9, armR: -.9} : {armR: Math.sin(t * 1.6) > .2 ? -1.9 : -.3, head: -.1}); return; }
      const [x, z] = n.rute[(n.idx + 1) % n.rute.length], w = lw(d.f, x, z);
      if (!jalanKe(n, o, w.x, w.z, kec * .32 * dt, dt)) { n.idx = (n.idx + 1) % n.rute.length; n.tunggu = n.rute[n.idx][3] || 0; }
      if (o.visible) { const a = Math.sin(t * 8) * .6; pose(o, g === 'belanja' ? {legL: a, legR: -a, armL: -.9, armR: a * .7} : {legL: a, legR: -a, armL: -a * .7, armR: a * .7}); }
      return;
    }
    if (g === 'guru') {
      // 16 dtk: jalan ke kanan papan → menulis di papan → jalan balik → menerangkan ke murid
      const c = t % 16, x0 = lw(d.f, -1.7, d.z).x, x1 = lw(d.f, 1.7, d.z).x;
      if (c < 4 || (c >= 8 && c < 12)) { const k = c < 4 ? c / 4 : 1 - (c - 8) / 4; o.position.x = x0 + (x1 - x0) * k; hadapi(o, c < 4 ? x1 + 9 : x0 - 9, o.position.z, Math.min(1, dt * 8)); if (o.visible) { const a = Math.sin(t * 8) * .5; pose(o, {legL: a, legR: -a, armL: -a * .6, armR: a * .6}); } }
      else if (c < 8) { hadapi(o, o.position.x, o.position.z - 9, Math.min(1, dt * 6)); if (o.visible) pose(o, {armR: -2.3 + Math.sin(t * 9) * .15, armRz: .25 * Math.sin(t * 3), head: -.1}); }
      else { hadapi(o, o.position.x, o.position.z + 9, Math.min(1, dt * 6)); if (o.visible) pose(o, {armL: -1.2 + Math.sin(t * 2.4) * .5, armR: -.4, headY: Math.sin(t * .9) * .4}); }
      return;
    }
    if (o.visible) gayaDiam(n, o, t, false);
  }
  function gayaDiam(n, o, t, obrol) {
    const g = n.di.gaya, b = n.ph + (n.id.length * 1.7);
    if (g === 'murid') {
      const angkat = !obrol && (b % 17) < 1.6;   // sesekali angkat tangan menjawab soal Bu Rina
      pose(o, {legL: -1.5, legR: -1.5, armL: -1.05, armR: angkat ? -3 : -1.05 + Math.sin(t * 7) * .1, head: obrol ? 0 : .3, headY: obrol ? .5 : 0});
    } else if (g === 'baring') pose(o, {armL: 0, armR: 0, head: Math.sin(t * .4) * .08, headY: obrol ? .6 : 0});
    else if (g === 'dudukRanjang') pose(o, {legL: -1.5, legR: -1.35, armL: -.25, armR: (b % 9) < 3 ? -1.2 : -.3, head: (b % 9) < 3 ? .5 : 0});
    else if (g === 'kasir') pose(o, {armL: -1.15, armR: -1.15 + Math.max(0, Math.sin(t * 3)) * .5, head: .2});
    else if (g === 'jaga') pose(o, {armL: -1, armR: -1 + Math.sin(t * 5) * .15, head: .25, headY: Math.sin(t * .6) * .3});
    else if (g === 'rawat') pose(o, {armL: -.4, armR: -2.1 + Math.sin(t * 1.2) * .2, head: -.15});
  }
  // NPC di DALAM fasum (Huda 9 Nov 2026): koordinat lokal aset fasum.js × VS dari titik fas[f]. Hanya Kotak Wetan (fasum asli).
  const adaDalam = d => d.kerja === 'dalam' && !I.tempatNPC && fas[d.di.f];
  const lw = (f, x, z) => new THREE.Vector3(fas[f].x + x * VS, LANTAI, fas[f].z + z * VS);
  const daftar = DATA.filter(d => d.kerja === 'jalan' || tempat[d.kerja] || adaDalam(d)).map((d, k) => {
    const obj = warga(siapAv(d.a)); obj.traverse(m => { if (m.isMesh) { m.castShadow = bayangan && d.kerja !== 'dalam'; m.receiveShadow = false; } });
    if (d.kecil) obj.scale.setScalar(.72);
    const n = {...d, obj, ph: acak() * 6, tunggu: 0, ngobrol: false, gel: 0, tinggi: d.kecil ? 3.9 : 5.2};
    if (d.kerja === 'dalam') { taruhDalam(n); obj.visible = false; sc.add(obj); return n; }
    if (d.kerja === 'jalan') {
      n.i = 1 + Math.floor(acak() * (xs.length - 2)); n.j = 1 + Math.floor(acak() * (zs.length - 2));
      obj.position.copy(node(n.i, n.j)); n.tuju = null;
    } else {
      const p = tempat[d.kerja].clone(); if (d.id === 'sari') p.x += 3 * VS; if (d.dx) p.x += d.dx * VS; if (d.dz) p.z += d.dz * VS; p.y = tinggi(p.x, p.z, p.y); obj.position.copy(p); n.pusat = p.clone();
      obj.rotation.y = d.kerja === 'sungai' ? Math.PI / 2 : 0;
    }
    obj.visible = false; sc.add(obj); return n;
  });
  const di = (n, j) => { const [a, b] = n.jam; return (j >= a && j < b) || (j + 24 >= a && j + 24 < b) || ((n.kerja === 'bola' || n.kerja === 'stadion') && j >= 20 && j < 21); };   // Jam Kumpul Warga 20.00-21.00: pertandingan malam di stadion
  function pilihTuju(n) {
    const opsi = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [n.i + a, n.j + b]).filter(([i, j]) => i >= 0 && j >= 0 && i < xs.length && j < zs.length && !(i === n.pi && j === n.pj) && (j === n.j || bolehNaik(n.i)));
    const [i, j] = opsi[Math.floor(acak() * opsi.length)] || [n.pi, n.pj];
    n.pi = n.i; n.pj = n.j; n.i = i; n.j = j; n.tuju = node(i, j);
  }
  const hadapi = (o, x, z, a) => { let dr = Math.atan2(x - o.position.x, z - o.position.z) - o.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); o.rotation.y += dr * a; };
  // ---- sepak bola NPC (Huda 6 Nov 2026): berebut bola, oper, kiper jaga gawang, wasit mengikuti bola ----
  // tim 1 (merah: Rizky, Andi) menyerang ke timur (+x); tim -1 (biru: Fajar, Bima kiper) ke barat. Tendangan diatur game.js.
  const jepit = (v, a, b) => Math.max(a, Math.min(b, v));
  function langkah(n, o, tx, tz, s, dt, bx, bz) {
    const dx = tx - o.position.x, dz = tz - o.position.z, l = Math.hypot(dx, dz);
    if (l > .4) { const m = Math.min(l, s); o.position.x += dx / l * m; o.position.z += dz / l * m; }
    o.position.y = tinggi(o.position.x, o.position.z, n.pusat.y);
    hadapi(o, l > 2 ? tx : bx, l > 2 ? tz : bz, Math.min(1, dt * 10));
    return l > .4;
  }
  function mainBola(n, o, b, dt, kec) {
    const L = b.L, maju = n.tim, kanan = L.cx + L.hx, kiri = L.cx - L.hx;
    // perkiraan bola sebentar lagi (dikejar ke depan arah gulirnya)
    const px = jepit(b.x + b.vx * .35, kiri, kanan), pz = jepit(b.z + b.vz * .35, L.cz - L.hz, L.cz + L.hz);
    let tx, tz, cepat;
    if (n.kiper) {
      const gx = L.cx - maju * (L.hx - .7 * VS), dekat = Math.abs(b.x - gx) < 3.2 * VS;
      if (dekat) { tx = px - maju * 1.1; tz = pz; cepat = .95; }   // bola masuk kotak penalti: kiper maju merebut
      else { tx = gx; tz = L.cz + jepit(b.z - L.cz, -L.gawang * 1.1, L.gawang * 1.1); cepat = .6; }
    } else {
      // pemain lapangan terdekat dari tiap tim mengejar bola → dua tim berebut; kawannya membuka ruang di depan
      let kejar = n, kd = 1e9; for (const k of daftar) { if (k.kerja !== 'bola' || k.kiper || k.tim !== n.tim || !k.obj.visible) continue; const d = Math.hypot(k.obj.position.x - px, k.obj.position.z - pz); if (d < kd) { kd = d; kejar = k; } }
      if (kejar === n) { tx = px - maju * 1.1; tz = pz; cepat = 1; }   // datang dari belakang bola supaya tendangannya ke depan
      else { tx = jepit(b.x + maju * 3.6 * VS, kiri + VS, kanan - VS); tz = L.cz + (b.z > L.cz ? -1 : 1) * 2.2 * VS; cepat = .7; }
    }
    // jangan saling tumpuk
    for (const k of daftar) { if (k === n || k.kerja !== 'bola' || !k.obj.visible) continue; const dx = o.position.x - k.obj.position.x, dz = o.position.z - k.obj.position.z, d = Math.hypot(dx, dz); if (d > 0 && d < 2.2) { tx += dx / d * 1.5; tz += dz / d * 1.5; } }
    tx = jepit(tx, kiri - VS, kanan + VS); tz = jepit(tz, L.cz - L.hz - VS, L.cz + L.hz + VS);
    const lari = langkah(n, o, tx, tz, kec * cepat * dt, dt, b.x, b.z);
    if (o.visible) { if (lari) { const a = Math.sin(n.ph * 13 * Math.max(.7, cepat)) * (cepat > .8 ? 1 : .7); pose(o, {legL: a, legR: -a, armL: -a, armR: a}); } else pose(o, n.kiper ? {armL: -.5, armR: -.5} : {}); }
  }
  function wasit(n, o, b, dt, kec) {
    const L = b.L, sisi = b.z > L.cz ? -1 : 1;
    const tx = jepit(b.x - Math.sign(b.x - L.cx || 1) * 1.5 * VS, L.cx - L.hx + VS, L.cx + L.hx - VS), tz = jepit(b.z + sisi * 3 * VS, L.cz - L.hz - .5 * VS, L.cz + L.hz + .5 * VS);
    const d = Math.hypot(tx - o.position.x, tz - o.position.z), lari = d > 1.2 && langkah(n, o, tx, tz, kec * (d > 4 * VS ? .8 : .5) * dt, dt, b.x, b.z);
    if (!lari) hadapi(o, b.x, b.z, Math.min(1, dt * 6));
    if (o.visible) { const tiup = performance.now() - (b.golT || 0) < 2500; if (lari) { const a = Math.sin(n.ph * 11) * .7; pose(o, {legL: a, legR: -a, armL: -a * .7, armR: tiup ? -2.9 : a * .7}); } else pose(o, {armR: tiup ? -2.9 : -.2, armL: -.2}); }
  }
  function update(dt, me, jam, kec, bola) {
    for (const n of daftar) {
      const o = n.obj, ada = di(n, jam);
      const jauh = Math.hypot(o.position.x - me.position.x, o.position.z - me.position.z);
      o.visible = ada && jauh < (n.kerja === 'dalam' ? 140 : 300); n.jauh = jauh;
      if (!ada) { n.ngobrol = false; continue; }
      if (n.kerja === 'dalam') { n.ph += dt; dalam(n, o, dt, me, kec); continue; }
      if (n.ngobrol) { hadapi(o, me.position.x, me.position.z, Math.min(1, dt * 6)); if (o.visible) pose(o, {}); continue; }
      n.ph += dt;
      if (n.kerja === 'jalan') {
        if (n.tunggu > 0) { n.tunggu -= dt; if (o.visible) pose(o, {}); continue; }
        if (!n.tuju) pilihTuju(n);
        const dx = n.tuju.x - o.position.x, dz = n.tuju.z - o.position.z, l = Math.hypot(dx, dz), s = kec * .45 * (n.cepat || 1) * dt;
        if (l <= s) { o.position.copy(n.tuju); n.tuju = null; if (acak() < .3) n.tunggu = 1 + acak() * 3; }
        else { o.position.x += dx / l * s; o.position.z += dz / l * s; o.position.y = tinggi(o.position.x, o.position.z, o.position.y); hadapi(o, n.tuju.x, n.tuju.z, Math.min(1, dt * 8)); }
        if (o.visible) { const a = Math.sin(n.ph * 9 * (n.cepat || 1)) * .7; pose(o, {legL: a, legR: -a, armL: -a * .8, armR: a * .8}); }
      } else if (n.kerja === 'bola' && bola && n.tim) { mainBola(n, o, bola, dt, kec);
      } else if (n.wasit && bola) { wasit(n, o, bola, dt, kec);
      } else if (n.kerja === 'bola') {
        // main bola (tanpa bola: berlari elips): berlari elips di lapangan stadion
        const t = n.ph * .7 + n.fase;
        o.position.set(n.pusat.x + Math.cos(t) * 4.5 * VS, 0, n.pusat.z + Math.sin(t * 1.3) * 2.6 * VS); o.position.y = tinggi(o.position.x, o.position.z, n.pusat.y);   // berdiri di lantai fasum, tidak tenggelam
        o.rotation.y = Math.atan2(-Math.sin(t) * 4.5, Math.cos(t * 1.3) * 3.4);
        if (o.visible) { const a = Math.sin(n.ph * 13) * 1; pose(o, {legL: a, legR: -a, armL: -a, armR: a}); }
      } else if (n.kerja === 'main') {
        // kejar-kejaran melingkar di lahan fasum
        const r = 4 * VS, t = n.ph * .55 + (n.id === 'sari' ? Math.PI * .7 : 0);
        o.position.set(n.pusat.x - (n.id === 'sari' ? 3 * VS : 0) + Math.cos(t) * r, 0, n.pusat.z + Math.sin(t) * r); o.position.y = tinggi(o.position.x, o.position.z, n.pusat.y) + Math.abs(Math.sin(n.ph * 10)) * .3;
        o.rotation.y = Math.atan2(-Math.sin(t), Math.cos(t));
        if (o.visible) { const a = Math.sin(n.ph * 14) * 1; pose(o, {legL: a, legR: -a, armL: -a, armR: a}); }
      } else if (o.visible) {
        if (n.kerja === 'sawah') { const a = Math.sin(n.ph * 3); pose(o, {armL: -1.9 + a * .9, armR: -1.9 + a * .9, head: .2}); }
        else if (n.kerja === 'sungai') pose(o, {armL: -1.2, armR: -1.2 + Math.sin(n.ph * .8) * .05});
        else if (n.kerja === 'warung') pose(o, {armR: Math.sin(n.ph * 1.3) > .8 ? -2.6 : -.2});
        else pose(o, {head: Math.sin(n.ph * .5) * .2});
      }
    }
  }
  const terdekat = (me, maks) => { let b = null; for (const n of daftar) if (n.obj.visible && n.kerja !== 'bola' && n.kerja !== 'main' && !n.wasit && n.jauh < maks && (!b || n.jauh < b.jauh)) b = n; return b; };
  return {daftar, update, terdekat, acak};
}
