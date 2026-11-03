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
  {id: 'rina', nama: 'Bu Rina', peran: 'Guru', kerja: 'jalan', jam: [6.5, 15],
    a: {jenis: 'P', kulit: '#f2c7a0', rambut: {gaya: 'bob', warna: '#3a2416'}, atasan: {jenis: 'batik', warna: '#c88a3a'}, bawahan: {jenis: 'rok-panjang', warna: '#1d1d22'}},
    kegiatan: ['Jalan ke lahan sekolah. Nanti kalau sekolahnya jadi, aku yang mengajar.', 'Keliling lihat anak-anak, jangan main jauh-jauh ke sungai.', 'Mikirin soal ujian. Berapa 7 × 8? Ayo jawab!'],
    sapa: ['Selamat pagi!', 'Rajin-rajin belajar ya', 'Sudah sarapan?']},
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
  {id: 'lina', nama: 'Mbak Lina', peran: 'Kasir supermarket', kerja: 'supermarket', dx: -3, jam: [8, 21],
    a: {jenis: 'P', kulit: '#f2c7a0', rambut: {gaya: 'kuncir', warna: '#3a2416'}, atasan: {jenis: 'seragam', warna: '#3a7bd5'}, bawahan: {jenis: 'rok-panjang', warna: '#1d1d22'}},
    kegiatan: ['Jaga kasir supermarket. Ini hasil voting warga, lho, usulan terbanyak!', 'Nata barang di rak. Nanti hasil panen warga juga bisa dititip di sini.', 'Istirahat sebentar, kakiku pegal berdiri terus.'],
    sapa: ['Selamat datang!', 'Belanja apa hari ini?', 'Ada promo, he he']},
  {id: 'harto', nama: 'Pak Harto', peran: 'Satpam supermarket', kerja: 'supermarket', dx: 3, jam: [7, 23],
    a: {jenis: 'L', kulit: '#a86e44', rambut: {gaya: 'cepak', warna: '#0b0b0e'}, atasan: {jenis: 'seragam', warna: '#2f3a52'}, bawahan: {jenis: 'celana', warna: '#1d1d22'}},
    kegiatan: ['Jaga parkiran supermarket. Mobilnya rapi semua, kan?', 'Bantu warga angkat belanjaan.', 'Pantau pintu masuk. Aman!'],
    sapa: ['Parkir di sini, Mas!', 'Aman terkendali', 'Hati-hati di jalan']},
  {id: 'ayu', nama: 'dr. Ayu', peran: 'Dokter', kerja: 'rs', dx: -9, jam: [7, 20],
    a: {jenis: 'P', kulit: '#e0aa7e', rambut: {gaya: 'hijab', warna: '#f4f4f4'}, hijab: '#f4f4f4', kacamata: true, atasan: {jenis: 'kemeja', warna: '#f4f4f4'}, bawahan: {jenis: 'rok-panjang', warna: '#4a5a7a'}},
    kegiatan: ['Selesai periksa pasien. Rumah sakit ini juga hasil voting warga!', 'Jangan lupa minum air putih dan istirahat cukup ya.', 'Cek stok obat di apotek.'],
    sapa: ['Sehat selalu!', 'Sudah cuci tangan?', 'Jaga kesehatan ya']},
  {id: 'rani', nama: 'Suster Rani', peran: 'Perawat', kerja: 'rs', dx: -2.5, jam: [6, 22],
    a: {jenis: 'P', kulit: '#f2c7a0', rambut: {gaya: 'bob', warna: '#0b0b0e'}, atasan: {jenis: 'seragam', warna: '#7ad0c0'}, bawahan: {jenis: 'celana', warna: '#7ad0c0'}},
    kegiatan: ['Jaga di depan IGD. Semoga hari ini tidak ada yang sakit.', 'Antar pasien kontrol. Pelan-pelan jalannya, Pak.', 'Tensi darahmu berapa? Sini aku cek, he he.'],
    sapa: ['Halo, ada keluhan?', 'Semangat sehat!', 'Pelan-pelan ya']},
  {id: 'bambang', nama: 'Pak Bambang', peran: 'Sopir ambulans', kerja: 'rs', dx: 2, dz: 3.5, jam: [6, 24],
    a: {jenis: 'L', kulit: '#c98c5e', rambut: {gaya: 'belah', warna: '#3a2416'}, atasan: {jenis: 'kemeja', warna: '#f4f4f4'}, bawahan: {jenis: 'celana', warna: '#2f3a52'}},
    kegiatan: ['Lap ambulans biar kinclong. Siaga 24 jam!', 'Cek bensin ambulans. Penuh!', 'Nunggu panggilan. Semoga sepi terus.'],
    sapa: ['Nguing nguing!', 'Siaga!', 'Minggir dikit ya, he he']},
  {id: 'rizky', nama: 'Rizky', peran: 'Pemain bola', kerja: 'bola', fase: 0, jam: [15, 18.5],
    a: {jenis: 'L', kulit: '#e0aa7e', rambut: {gaya: 'acak', warna: '#0b0b0e'}, atasan: {jenis: 'kaos', warna: '#e0303a'}, bawahan: {jenis: 'pendek', warna: '#f4f4f4'}},
    kegiatan: ['Latihan sore di stadion baru! Lapangannya mantap.', 'Kejar bola! Oper sini!', 'Tim merah pasti menang!'],
    sapa: ['Oper!', 'Gol!', 'Ayo main bola!']},
  {id: 'fajar', nama: 'Fajar', peran: 'Pemain bola', kerja: 'bola', fase: 1.6, jam: [15, 18.5],
    a: {jenis: 'L', kulit: '#a86e44', rambut: {gaya: 'cepak', warna: '#0b0b0e'}, atasan: {jenis: 'kaos', warna: '#3a8ad8'}, bawahan: {jenis: 'pendek', warna: '#1d1d22'}},
    kegiatan: ['Main bola sama Rizky. Skornya 2-1, kami kalah dulu.', 'Pemanasan dulu biar tidak keseleo.', 'Kiper kami jago, tapi tadi kebobolan.'],
    sapa: ['Tahan bolanya!', 'Ayo, tim biru!', 'Hampir!']},
  {id: 'andi', nama: 'Andi', peran: 'Pemain bola', kerja: 'bola', fase: 3.2, jam: [15, 18.5],
    a: {jenis: 'L', kulit: '#f2c7a0', rambut: {gaya: 'keriting', warna: '#3a2416'}, atasan: {jenis: 'kaos', warna: '#e0303a'}, bawahan: {jenis: 'pendek', warna: '#f4f4f4'}},
    kegiatan: ['Aku striker! Tadi cetak satu gol.', 'Minum dulu, haus banget.', 'Besok ada pertandingan antar-RT, nonton ya!'],
    sapa: ['Gol!', 'Lihat tendanganku!', 'Hore!']},
  {id: 'bima', nama: 'Bima', peran: 'Pemain bola', kerja: 'bola', fase: 4.8, jam: [15, 18.5],
    a: {jenis: 'L', kulit: '#c98c5e', rambut: {gaya: 'belah', warna: '#0b0b0e'}, atasan: {jenis: 'kaos', warna: '#3a8ad8'}, bawahan: {jenis: 'pendek', warna: '#1d1d22'}},
    kegiatan: ['Jaga gawang. Bolanya jangan masuk!', 'Latihan tangkap bola.', 'Stadionnya keren, ada lampu sorot buat main malam.'],
    sapa: ['Tangkap!', 'Awas!', 'Main yuk!']},
  {id: 'darno', nama: 'Pak Darno', peran: 'Wasit', kerja: 'stadion', dz: -2.5, jam: [15, 18.5],
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
  const daftar = DATA.filter(d => d.kerja === 'jalan' || tempat[d.kerja]).map((d, k) => {
    const obj = warga(siapAv(d.a)); obj.traverse(m => { if (m.isMesh) { m.castShadow = bayangan; m.receiveShadow = false; } });
    if (d.kecil) obj.scale.setScalar(.72);
    const n = {...d, obj, ph: acak() * 6, tunggu: 0, ngobrol: false, gel: 0, tinggi: d.kecil ? 3.9 : 5.2};
    if (d.kerja === 'jalan') {
      n.i = 1 + Math.floor(acak() * (xs.length - 2)); n.j = 1 + Math.floor(acak() * (zs.length - 2));
      obj.position.copy(node(n.i, n.j)); n.tuju = null;
    } else {
      const p = tempat[d.kerja].clone(); if (d.id === 'sari') p.x += 3 * VS; if (d.dx) p.x += d.dx * VS; if (d.dz) p.z += d.dz * VS; obj.position.copy(p); n.pusat = p.clone();
      obj.rotation.y = d.kerja === 'sungai' ? Math.PI / 2 : 0;
    }
    obj.visible = false; sc.add(obj); return n;
  });
  const di = (n, j) => { const [a, b] = n.jam; return (j >= a && j < b) || (j + 24 >= a && j + 24 < b); };
  function pilihTuju(n) {
    const opsi = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [n.i + a, n.j + b]).filter(([i, j]) => i >= 0 && j >= 0 && i < xs.length && j < zs.length && !(i === n.pi && j === n.pj) && (j === n.j || bolehNaik(n.i)));
    const [i, j] = opsi[Math.floor(acak() * opsi.length)] || [n.pi, n.pj];
    n.pi = n.i; n.pj = n.j; n.i = i; n.j = j; n.tuju = node(i, j);
  }
  const hadapi = (o, x, z, a) => { let dr = Math.atan2(x - o.position.x, z - o.position.z) - o.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); o.rotation.y += dr * a; };
  function update(dt, me, jam, kec) {
    for (const n of daftar) {
      const o = n.obj, ada = di(n, jam);
      const jauh = Math.hypot(o.position.x - me.position.x, o.position.z - me.position.z);
      o.visible = ada && jauh < 300; n.jauh = jauh;
      if (!ada) { n.ngobrol = false; continue; }
      if (n.ngobrol) { hadapi(o, me.position.x, me.position.z, Math.min(1, dt * 6)); if (o.visible) pose(o, {}); continue; }
      n.ph += dt;
      if (n.kerja === 'jalan') {
        if (n.tunggu > 0) { n.tunggu -= dt; if (o.visible) pose(o, {}); continue; }
        if (!n.tuju) pilihTuju(n);
        const dx = n.tuju.x - o.position.x, dz = n.tuju.z - o.position.z, l = Math.hypot(dx, dz), s = kec * .45 * (n.cepat || 1) * dt;
        if (l <= s) { o.position.copy(n.tuju); n.tuju = null; if (acak() < .3) n.tunggu = 1 + acak() * 3; }
        else { o.position.x += dx / l * s; o.position.z += dz / l * s; o.position.y = tinggi(o.position.x, o.position.z); hadapi(o, n.tuju.x, n.tuju.z, Math.min(1, dt * 8)); }
        if (o.visible) { const a = Math.sin(n.ph * 9 * (n.cepat || 1)) * .7; pose(o, {legL: a, legR: -a, armL: -a * .8, armR: a * .8}); }
      } else if (n.kerja === 'bola') {
        // main bola: berlari elips di lapangan stadion
        const t = n.ph * .7 + n.fase;
        o.position.set(n.pusat.x + Math.cos(t) * 4.5 * VS, n.pusat.y, n.pusat.z + Math.sin(t * 1.3) * 2.6 * VS);
        o.rotation.y = Math.atan2(-Math.sin(t) * 4.5, Math.cos(t * 1.3) * 3.4);
        if (o.visible) { const a = Math.sin(n.ph * 13) * 1; pose(o, {legL: a, legR: -a, armL: -a, armR: a}); }
      } else if (n.kerja === 'main') {
        // kejar-kejaran melingkar di lahan fasum
        const r = 4 * VS, t = n.ph * .55 + (n.id === 'sari' ? Math.PI * .7 : 0);
        o.position.set(n.pusat.x - (n.id === 'sari' ? 3 * VS : 0) + Math.cos(t) * r, n.pusat.y + Math.abs(Math.sin(n.ph * 10)) * .3, n.pusat.z + Math.sin(t) * r);
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
  const terdekat = (me, maks) => { let b = null; for (const n of daftar) if (n.obj.visible && n.jauh < maks && (!b || n.jauh < b.jauh)) b = n; return b; };
  return {daftar, update, terdekat, acak};
}
