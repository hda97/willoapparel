#!/usr/bin/env python3
"""Bank soal bawaan Dunia Kotak Pintar (dipakai ketiga game).

Soal Matematika dibuat otomatis (benih tetap, hasil selalu sama); topik lain ditulis tangan.
Setiap soal: topik, tingkat (mudah/sedang/sulit), soal, a-d, kunci (A-D), jelas (penjelasan singkat).
Guru bisa mengganti semuanya lewat tombol Guru di dalam game.
"""
import random

R = random.Random(2026)


def acak_opsi(benar, salah):
    """Kocok pilihan; kembalikan (a, b, c, d, kunci)."""
    ops = [benar] + list(salah)
    R.shuffle(ops)
    ops = [str(o) for o in ops] + [''] * (4 - len(ops))
    return ops[0], ops[1], ops[2], ops[3], 'ABCD'[ops.index(str(benar))]


def soal(topik, tingkat, teks, benar, salah, jelas=''):
    salah = [x for x in dict.fromkeys(salah) if x != benar]
    if isinstance(benar, int):
        for x in pengecoh(benar, 0, 999, 4):
            if len(salah) < 3 and x not in salah: salah.append(x)
    a, b, c, d, k = acak_opsi(benar, salah)
    return dict(topik=topik, tingkat=tingkat, soal=teks, a=a, b=b, c=c, d=d, kunci=k, jelas=jelas)


def pengecoh(n, lo=0, hi=999, lebar=3):
    hasil = set()
    while len(hasil) < 3:
        x = n + R.choice([i for i in range(-lebar, lebar + 1) if i])
        if lo <= x <= hi and x != n:
            hasil.add(x)
    return sorted(hasil)


def matematika_1():
    T = 'Matematika Kelas 1'
    out, lihat = [], set()
    # mudah: tambah/kurang sampai 10
    while len(out) < 34:
        a, b = R.randint(1, 9), R.randint(1, 9)
        if R.random() < .5 and a + b <= 10:
            k = (a, '+', b)
            if k in lihat: continue
            lihat.add(k); out.append(soal(T, 'mudah', f'{a} + {b} = …', a + b, pengecoh(a + b, 0, 20), f'{a} ditambah {b} sama dengan {a + b}.'))
        elif a > b:
            k = (a, '-', b)
            if k in lihat: continue
            lihat.add(k); out.append(soal(T, 'mudah', f'{a} − {b} = …', a - b, pengecoh(a - b, 0, 20), f'{a} dikurangi {b} sama dengan {a - b}.'))
    # sedang: sampai 20
    while len(out) < 68:
        a, b = R.randint(6, 14), R.randint(3, 9)
        if R.random() < .5 and a + b <= 20:
            k = (a, '+', b)
            if k in lihat: continue
            lihat.add(k); out.append(soal(T, 'sedang', f'{a} + {b} = …', a + b, pengecoh(a + b, 0, 30),
                                          f'Genapkan dulu ke 10: {a} + {10 - a if a < 10 else 0} = {max(a, 10)}, lalu tambah sisanya. Hasilnya {a + b}.' if a < 10 else f'{a} + {b} = {a + b}.'))
        elif a > b:
            k = (a, '-', b)
            if k in lihat: continue
            lihat.add(k); out.append(soal(T, 'sedang', f'{a} − {b} = …', a - b, pengecoh(a - b, 0, 30), f'Mundur {b} langkah dari {a}, sampai di {a - b}.'))
    # sulit: bilangan hilang & soal cerita
    benda = [('kelereng', 'Dimas'), ('permen', 'Sari'), ('buku', 'Bima'), ('apel', 'Ibu'), ('ikan', 'Pak Tani'), ('balon', 'Lala'), ('pensil', 'Raka')]
    while len(out) < 100:
        a, b = R.randint(3, 12), R.randint(2, 8)
        jenis = R.choice(['hilang', 'tambah', 'kurang'])
        k = (jenis, a, b)
        if k in lihat: continue
        lihat.add(k)
        if jenis == 'hilang':
            out.append(soal(T, 'sulit', f'{a} + … = {a + b}', b, pengecoh(b, 0, 20), f'{a + b} − {a} = {b}, jadi yang hilang adalah {b}.'))
        else:
            bd, org = R.choice(benda)
            if jenis == 'tambah':
                out.append(soal(T, 'sulit', f'{org} punya {a} {bd}, lalu diberi {b} lagi. Sekarang ada berapa?', a + b, pengecoh(a + b, 0, 30), f'Diberi berarti ditambah: {a} + {b} = {a + b}.'))
            else:
                a2 = a + b
                out.append(soal(T, 'sulit', f'{org} punya {a2} {bd}, lalu {b} diberikan ke teman. Sisa berapa?', a, pengecoh(a, 0, 30), f'Diberikan berarti dikurangi: {a2} − {b} = {a}.'))
    return out


def matematika_3():
    T = 'Matematika Kelas 3'
    out, lihat = [], set()
    while len(out) < 20:
        a, b = R.randint(2, 5), R.randint(2, 10)
        if (a, b) in lihat: continue
        lihat.add((a, b)); out.append(soal(T, 'mudah', f'{a} × {b} = …', a * b, sorted({a * b + a, a * b - a, a * b + 1} - {a * b}), f'{a} × {b} artinya {b} dijumlah {a} kali = {a * b}.'))
    while len(out) < 40:
        a, b = R.randint(6, 10), R.randint(3, 10)
        if R.random() < .5:
            if ('x', a, b) in lihat: continue
            lihat.add(('x', a, b)); out.append(soal(T, 'sedang', f'{a} × {b} = …', a * b, sorted({a * b + a, a * b - b, a * b + 2} - {a * b}), f'{a} × {b} = {a * b}.'))
        else:
            if (':', a, b) in lihat: continue
            lihat.add((':', a, b)); out.append(soal(T, 'sedang', f'{a * b} : {a} = …', b, pengecoh(b, 1, 20, 2), f'{a} × {b} = {a * b}, jadi {a * b} : {a} = {b}.'))
    benda = [('kue', 'piring'), ('kelereng', 'kantong'), ('buku', 'rak'), ('telur', 'keranjang'), ('pensil', 'kotak')]
    while len(out) < 60:
        a, b = R.randint(3, 9), R.randint(3, 9)
        bd, wd = R.choice(benda)
        if R.random() < .5:
            if ('cx', a, b, bd) in lihat: continue
            lihat.add(('cx', a, b, bd)); out.append(soal(T, 'sulit', f'Ada {a} {wd}, setiap {wd} berisi {b} {bd}. Jumlah semua {bd}?', a * b, sorted({a * b + b, a * b - a, a + b} - {a * b}), f'{a} {wd} × {b} {bd} = {a * b} {bd}.'))
        else:
            if ('c:', a, b, bd) in lihat: continue
            lihat.add(('c:', a, b, bd)); out.append(soal(T, 'sulit', f'{a * b} {bd} dibagi rata ke {a} {wd}. Setiap {wd} berisi berapa?', b, pengecoh(b, 1, 20, 2), f'{a * b} : {a} = {b}.'))
    return out


# (tingkat, soal, benar, [salah...], penjelasan)
TULIS = {
    'Bahasa Indonesia SD': [
        ('mudah', 'Lawan kata "besar" adalah…', 'kecil', ['tinggi', 'luas', 'berat'], 'Besar berlawanan dengan kecil.'),
        ('mudah', 'Lawan kata "siang" adalah…', 'malam', ['sore', 'pagi', 'terang'], 'Siang berlawanan dengan malam.'),
        ('mudah', 'Huruf vokal ada di pilihan…', 'A, I, U, E, O', ['B, C, D, F, G', 'K, L, M, N, P', 'R, S, T, V, W'], 'Huruf vokal ada lima: a, i, u, e, o.'),
        ('mudah', 'Kata yang ditulis dengan benar adalah…', 'sekolah', ['sekola', 'sekolha', 'sekholah'], 'Penulisan yang benar: sekolah.'),
        ('mudah', '"Ibu memasak di …". Kata yang tepat adalah…', 'dapur', ['kamar mandi', 'garasi', 'atap'], 'Memasak dilakukan di dapur.'),
        ('mudah', 'Persamaan kata "pandai" adalah…', 'pintar', ['malas', 'lambat', 'bodoh'], 'Pandai sama artinya dengan pintar.'),
        ('mudah', 'Kalimat tanya diakhiri tanda…', 'tanya (?)', ['titik (.)', 'koma (,)', 'seru (!)'], 'Kalimat tanya selalu diakhiri tanda tanya.'),
        ('mudah', 'Hewan yang berkokok di pagi hari adalah…', 'ayam jantan', ['kucing', 'sapi', 'bebek'], 'Ayam jantan berkokok "kukuruyuk".'),
        ('sedang', 'Huruf kapital dipakai pada…', 'awal kalimat', ['tengah kata', 'akhir kalimat', 'setiap huruf'], 'Awal kalimat dan nama orang/tempat memakai huruf kapital.'),
        ('sedang', 'Penulisan nama kota yang benar adalah…', 'Bandung', ['bandung', 'BANDung', 'banDung'], 'Nama tempat diawali huruf kapital.'),
        ('sedang', 'Sinonim kata "gembira" adalah…', 'senang', ['sedih', 'marah', 'takut'], 'Gembira sama artinya dengan senang.'),
        ('sedang', '"Adik … susu setiap pagi." Kata kerja yang tepat…', 'minum', ['makan', 'tidur', 'menulis'], 'Susu diminum, jadi kata yang tepat "minum".'),
        ('sedang', 'Kata dasar dari "bermain" adalah…', 'main', ['bermai', 'ber', 'mainan'], 'Awalan ber- ditambah kata dasar main.'),
        ('sedang', 'Kalimat perintah yang sopan adalah…', 'Tolong tutup pintunya.', ['Tutup!', 'Pintu tutup.', 'Kamu tutup pintu?'], 'Kata "tolong" membuat perintah lebih sopan.'),
        ('sedang', 'Tanda baca di akhir kalimat berita adalah…', 'titik (.)', ['tanya (?)', 'seru (!)', 'koma (,)'], 'Kalimat berita diakhiri tanda titik.'),
        ('sedang', 'Antonim kata "rajin" adalah…', 'malas', ['tekun', 'giat', 'pintar'], 'Rajin berlawanan dengan malas.'),
        ('sulit', 'Kata baku yang benar adalah…', 'nasihat', ['nasehat', 'nashat', 'nasihad'], 'Bentuk baku menurut KBBI: nasihat.'),
        ('sulit', 'Kata baku yang benar adalah…', 'apotek', ['apotik', 'apothek', 'apoteek'], 'Bentuk baku menurut KBBI: apotek.'),
        ('sulit', 'Gagasan utama sebuah paragraf disebut…', 'ide pokok', ['kalimat penutup', 'judul buku', 'kata sambung'], 'Ide pokok adalah inti yang dibahas paragraf.'),
        ('sulit', 'Kata "membaca" mendapat imbuhan…', 'me-', ['ber-', 'di-', 'ter-'], 'mem- (bentuk me-) + baca = membaca.'),
        ('sulit', 'Kalimat yang memakai kata depan dengan benar…', 'Ayah pergi ke pasar.', ['Ayah pergi kepasar.', 'Ayah pergi kePasar.', 'Ayah pergike pasar.'], 'Kata depan "ke" ditulis terpisah dari kata tempat.'),
        ('sulit', 'Pantun terdiri dari sampiran dan…', 'isi', ['judul', 'bait', 'rima'], 'Dua baris awal sampiran, dua baris akhir isi.'),
        ('sulit', '"Rumah itu sangat megah." Kata "megah" artinya…', 'besar dan mewah', ['kecil dan sederhana', 'tua dan rusak', 'jauh dan sepi'], 'Megah berarti tampak besar, indah, dan mewah.'),
        ('sulit', 'Kata ulang yang tepat untuk "banyak buku" adalah…', 'buku-buku', ['bukubuku', 'buku buku', 'bu-buku'], 'Kata ulang ditulis dengan tanda hubung.'),
    ],
    'IPAS SD': [
        ('mudah', 'Hewan pemakan tumbuhan disebut…', 'herbivora', ['karnivora', 'omnivora', 'predator'], 'Herbivora memakan tumbuhan, contohnya sapi dan kambing.'),
        ('mudah', 'Bagian tumbuhan yang menyerap air dari tanah adalah…', 'akar', ['daun', 'bunga', 'buah'], 'Akar menyerap air dan zat hara dari tanah.'),
        ('mudah', 'Matahari terbit dari arah…', 'timur', ['barat', 'utara', 'selatan'], 'Matahari terbit di timur dan terbenam di barat.'),
        ('mudah', 'Alat indra untuk mencium bau adalah…', 'hidung', ['telinga', 'mata', 'lidah'], 'Hidung adalah indra penciuman.'),
        ('mudah', 'Air yang dibekukan akan menjadi…', 'es', ['uap', 'awan', 'embun'], 'Air membeku menjadi es pada suhu 0 °C.'),
        ('mudah', 'Hewan yang berkembang biak dengan bertelur adalah…', 'ayam', ['kucing', 'sapi', 'kambing'], 'Ayam bertelur, kucing dan sapi melahirkan.'),
        ('mudah', 'Kita bernapas menghirup…', 'oksigen', ['karbon dioksida', 'asap', 'debu'], 'Tubuh butuh oksigen dari udara.'),
        ('mudah', 'Bagian tumbuhan tempat memasak makanan adalah…', 'daun', ['akar', 'batang', 'biji'], 'Daun memasak makanan lewat fotosintesis.'),
        ('sedang', 'Planet terdekat dengan Matahari adalah…', 'Merkurius', ['Venus', 'Mars', 'Bumi'], 'Merkurius paling dekat dengan Matahari, sekitar 58 juta km.'),
        ('sedang', 'Proses tumbuhan membuat makanan disebut…', 'fotosintesis', ['respirasi', 'evaporasi', 'metamorfosis'], 'Fotosintesis butuh cahaya matahari, air, dan karbon dioksida.'),
        ('sedang', 'Perubahan wujud air menjadi uap disebut…', 'menguap', ['membeku', 'mencair', 'mengembun'], 'Air dipanaskan lalu menguap.'),
        ('sedang', 'Kupu-kupu mengalami metamorfosis…', 'sempurna', ['tidak sempurna', 'setengah', 'tidak ada'], 'Telur, ulat, kepompong, kupu-kupu: metamorfosis sempurna.'),
        ('sedang', 'Hewan omnivora memakan…', 'tumbuhan dan daging', ['hanya daging', 'hanya rumput', 'hanya biji'], 'Omnivora pemakan segala, contohnya ayam dan beruang.'),
        ('sedang', 'Contoh energi terbarukan adalah…', 'tenaga surya', ['minyak bumi', 'batu bara', 'gas alam'], 'Sinar matahari tidak akan habis.'),
        ('sedang', 'Organ yang memompa darah ke seluruh tubuh adalah…', 'jantung', ['paru-paru', 'lambung', 'ginjal'], 'Jantung memompa darah terus-menerus.'),
        ('sedang', 'Benda yang dapat ditarik magnet adalah…', 'paku besi', ['kertas', 'kayu', 'plastik'], 'Magnet menarik benda dari besi atau baja.'),
        ('sulit', 'Lapisan Bumi paling luar disebut…', 'kerak bumi', ['inti bumi', 'mantel', 'magma'], 'Kerak bumi adalah lapisan tempat kita tinggal.'),
        ('sulit', 'Gaya yang membuat benda jatuh ke bawah disebut…', 'gravitasi', ['gaya gesek', 'gaya magnet', 'gaya pegas'], 'Gravitasi Bumi menarik benda ke bawah.'),
        ('sulit', 'Bunyi merambat paling cepat melalui…', 'benda padat', ['udara', 'ruang hampa', 'benda gas'], 'Partikel benda padat rapat, bunyi merambat lebih cepat.'),
        ('sulit', 'Hewan yang bernapas dengan insang adalah…', 'ikan', ['katak dewasa', 'paus', 'cacing'], 'Ikan mengambil oksigen dari air lewat insang.'),
        ('sulit', 'Rantai makanan selalu dimulai dari…', 'produsen (tumbuhan)', ['karnivora', 'pengurai', 'herbivora'], 'Tumbuhan membuat makanan sendiri, jadi produsen.'),
        ('sulit', 'Satuan suhu yang biasa dipakai di Indonesia adalah…', 'derajat Celsius', ['kilogram', 'meter', 'liter'], 'Termometer di Indonesia memakai °C.'),
        ('sulit', 'Peristiwa Bulan menutupi Matahari disebut…', 'gerhana matahari', ['gerhana bulan', 'pasang surut', 'rotasi'], 'Bulan berada di antara Bumi dan Matahari.'),
        ('sulit', 'Bumi berputar pada porosnya menyebabkan…', 'siang dan malam', ['empat musim', 'gerhana', 'pasang surut'], 'Rotasi Bumi menyebabkan siang dan malam.'),
    ],
    'Bahasa Inggris SD': [
        ('mudah', '"Kucing" dalam bahasa Inggris adalah…', 'cat', ['dog', 'bird', 'fish'], 'Cat = kucing.'),
        ('mudah', '"Merah" dalam bahasa Inggris adalah…', 'red', ['blue', 'green', 'yellow'], 'Red = merah.'),
        ('mudah', '"One, two, three". Angka setelah three adalah…', 'four', ['five', 'six', 'ten'], 'One, two, three, four.'),
        ('mudah', '"Book" artinya…', 'buku', ['pensil', 'meja', 'tas'], 'Book = buku.'),
        ('mudah', '"Good morning" diucapkan pada…', 'pagi hari', ['malam hari', 'sore hari', 'siang hari'], 'Morning = pagi.'),
        ('mudah', '"Mother" artinya…', 'ibu', ['ayah', 'kakak', 'nenek'], 'Mother = ibu, father = ayah.'),
        ('mudah', '"Apple" artinya…', 'apel', ['jeruk', 'pisang', 'anggur'], 'Apple = apel.'),
        ('mudah', '"Thank you" artinya…', 'terima kasih', ['maaf', 'tolong', 'selamat'], 'Thank you = terima kasih.'),
        ('sedang', '"Senin" dalam bahasa Inggris adalah…', 'Monday', ['Sunday', 'Friday', 'Tuesday'], 'Monday = Senin.'),
        ('sedang', '"I … a student." Kata yang tepat…', 'am', ['is', 'are', 'be'], 'Untuk "I" memakai "am".'),
        ('sedang', '"Kitchen" adalah ruangan untuk…', 'memasak', ['tidur', 'mandi', 'belajar'], 'Kitchen = dapur.'),
        ('sedang', 'Bahasa Inggris dari "dua puluh" adalah…', 'twenty', ['twelve', 'two', 'thirty'], 'Twenty = 20, twelve = 12.'),
        ('sedang', '"What is your name?" artinya…', 'Siapa namamu?', ['Berapa umurmu?', 'Di mana rumahmu?', 'Apa kabar?'], 'Name = nama.'),
        ('sedang', '"Elephant" adalah hewan…', 'gajah', ['jerapah', 'harimau', 'monyet'], 'Elephant = gajah.'),
        ('sedang', '"She … my sister." Kata yang tepat…', 'is', ['am', 'are', 'be'], 'Untuk "she" memakai "is".'),
        ('sedang', 'Lawan kata "hot" adalah…', 'cold', ['warm', 'big', 'fast'], 'Hot = panas, cold = dingin.'),
        ('sulit', '"They … playing football." Kata yang tepat…', 'are', ['is', 'am', 'was'], 'Untuk "they" memakai "are".'),
        ('sulit', '"Jam setengah tujuh" dalam bahasa Inggris…', 'half past six', ['half past seven', 'six o\'clock', 'seven o\'clock'], 'Half past six = 6.30.'),
        ('sulit', 'Bentuk jamak dari "child" adalah…', 'children', ['childs', 'childes', 'child'], 'Child tidak memakai -s, jamaknya children.'),
        ('sulit', '"Where do you live?" artinya…', 'Di mana kamu tinggal?', ['Kapan kamu pulang?', 'Siapa kamu?', 'Apa kesukaanmu?'], 'Where = di mana, live = tinggal.'),
        ('sulit', '"The cat is … the table." (di bawah meja)', 'under', ['on', 'in', 'behind'], 'Under = di bawah.'),
        ('sulit', 'Bulan kedua dalam setahun adalah…', 'February', ['January', 'March', 'April'], 'January, February, March…'),
        ('sulit', '"Doctor" bekerja di…', 'hospital', ['school', 'market', 'farm'], 'Dokter bekerja di rumah sakit (hospital).'),
        ('sulit', '"I have two … ." Kata yang tepat…', 'pencils', ['pencil', 'a pencil', 'pencilses'], 'Lebih dari satu memakai akhiran -s.'),
    ],
    'Pengetahuan Umum Indonesia': [
        ('mudah', 'Ibu kota negara Indonesia saat ini adalah…', 'Jakarta', ['Bandung', 'Surabaya', 'Medan'], 'Jakarta masih menjadi ibu kota sambil IKN Nusantara dibangun.'),
        ('mudah', 'Bendera Indonesia berwarna…', 'merah putih', ['merah biru', 'hijau putih', 'kuning merah'], 'Sang Saka Merah Putih.'),
        ('mudah', 'Lambang negara Indonesia adalah…', 'Garuda Pancasila', ['Harimau', 'Komodo', 'Elang Jawa'], 'Garuda Pancasila dengan semboyan Bhinneka Tunggal Ika.'),
        ('mudah', 'Hari Kemerdekaan Indonesia diperingati setiap tanggal…', '17 Agustus', ['1 Juni', '28 Oktober', '10 November'], 'Indonesia merdeka 17 Agustus 1945.'),
        ('mudah', 'Lagu kebangsaan Indonesia adalah…', 'Indonesia Raya', ['Garuda Pancasila', 'Tanah Airku', 'Halo-Halo Bandung'], 'Indonesia Raya diciptakan W.R. Supratman.'),
        ('mudah', 'Pancasila terdiri dari … sila.', '5', ['3', '4', '6'], 'Pancasila punya lima sila.'),
        ('mudah', 'Komodo hidup di pulau…', 'Komodo (NTT)', ['Jawa', 'Kalimantan', 'Papua'], 'Komodo hidup di Pulau Komodo dan Rinca, NTT.'),
        ('mudah', 'Alat musik dari bambu yang digoyang adalah…', 'angklung', ['gamelan', 'sasando', 'kolintang'], 'Angklung dari Jawa Barat, diakui UNESCO.'),
        ('sedang', 'Ibu kota provinsi Jawa Barat adalah…', 'Bandung', ['Semarang', 'Serang', 'Surabaya'], 'Bandung adalah ibu kota Jawa Barat.'),
        ('sedang', 'Semboyan "Bhinneka Tunggal Ika" artinya…', 'berbeda-beda tetapi tetap satu', ['bersatu kita teguh', 'maju terus pantang mundur', 'gotong royong'], 'Bhinneka Tunggal Ika dari kitab Sutasoma.'),
        ('sedang', 'Proklamator kemerdekaan Indonesia adalah…', 'Soekarno dan Hatta', ['Sudirman dan Hatta', 'Soekarno dan Sudirman', 'Kartini dan Hatta'], 'Soekarno-Hatta membacakan proklamasi 1945.'),
        ('sedang', 'Pulau terbesar di Indonesia adalah…', 'Papua', ['Jawa', 'Sumatra', 'Bali'], 'Papua (Nugini) bagian Indonesia paling luas.'),
        ('sedang', 'Candi Borobudur terletak di provinsi…', 'Jawa Tengah', ['Jawa Timur', 'Bali', 'DI Yogyakarta'], 'Borobudur ada di Magelang, Jawa Tengah.'),
        ('sedang', 'Mata uang Indonesia adalah…', 'Rupiah', ['Ringgit', 'Peso', 'Baht'], 'Rupiah dikeluarkan Bank Indonesia.'),
        ('sedang', 'Hari Pendidikan Nasional diperingati tanggal…', '2 Mei', ['21 April', '1 Oktober', '22 Desember'], 'Hari lahir Ki Hajar Dewantara.'),
        ('sedang', 'Rumah adat Minangkabau disebut…', 'Rumah Gadang', ['Joglo', 'Honai', 'Tongkonan'], 'Rumah Gadang dari Sumatra Barat.'),
        ('sulit', 'Sumpah Pemuda diikrarkan pada tahun…', '1928', ['1908', '1945', '1950'], '28 Oktober 1928.'),
        ('sulit', 'Gunung tertinggi di Indonesia adalah…', 'Puncak Jaya', ['Semeru', 'Rinjani', 'Kerinci'], 'Puncak Jaya di Papua, sekitar 4.884 m.'),
        ('sulit', 'Danau terbesar di Indonesia adalah…', 'Danau Toba', ['Danau Poso', 'Danau Sentani', 'Danau Maninjau'], 'Danau Toba di Sumatra Utara.'),
        ('sulit', 'Tokoh emansipasi wanita dari Jepara adalah…', 'R.A. Kartini', ['Cut Nyak Dien', 'Dewi Sartika', 'Martha Christina'], 'Hari Kartini diperingati 21 April.'),
        ('sulit', 'Indonesia terletak di antara dua samudra, yaitu…', 'Hindia dan Pasifik', ['Atlantik dan Pasifik', 'Hindia dan Atlantik', 'Arktik dan Hindia'], 'Letak silang Indonesia: dua benua, dua samudra.'),
        ('sulit', 'Sila ke-3 Pancasila berbunyi…', 'Persatuan Indonesia', ['Keadilan sosial bagi seluruh rakyat Indonesia', 'Ketuhanan Yang Maha Esa', 'Kemanusiaan yang adil dan beradab'], 'Lambangnya pohon beringin.'),
        ('sulit', 'Tari Saman berasal dari…', 'Aceh', ['Bali', 'Papua', 'Jawa Tengah'], 'Tari Saman dari suku Gayo, Aceh.'),
        ('sulit', 'Jumlah provinsi di Indonesia (2024) adalah…', '38', ['34', '36', '33'], 'Sejak 2022 ada provinsi baru di Papua, totalnya 38.'),
    ],
}


def bank():
    s = matematika_1() + matematika_3()
    for topik, daftar in TULIS.items():
        for t, teks, benar, salah, jelas in daftar:
            s.append(soal(topik, t, teks, benar, salah, jelas))
    return s


if __name__ == '__main__':
    import collections
    b = bank()
    print(len(b), collections.Counter((x['topik'], x['tingkat']) for x in b))
