"""Bank soal IPA SMP (Kurikulum Merdeka) untuk Lab Ajaib.

Tiap soal: (topik, soal, jawaban benar, [3 pengecoh], penjelasan singkat).
Urutan pilihan diacak tetap (benih 2027) supaya kunci tersebar di A-D.
"""
import random

S = {
    '7': [
        # Zat dan Wujudnya
        ('Zat dan Wujudnya', 'Es batu dibiarkan di meja lalu menjadi air. Peristiwa ini disebut …', 'Mencair', ['Membeku', 'Menguap', 'Menyublim'], 'Padat berubah menjadi cair disebut mencair (melebur).'),
        ('Zat dan Wujudnya', 'Kapur barus di lemari lama-lama habis tanpa meninggalkan cairan. Peristiwa ini disebut …', 'Menyublim', ['Mencair', 'Mengembun', 'Membeku'], 'Padat langsung menjadi gas disebut menyublim.'),
        ('Zat dan Wujudnya', 'Bagian luar gelas berisi es menjadi basah karena …', 'Uap air di udara mengembun', ['Es merembes keluar gelas', 'Gelas berkeringat', 'Air menguap dari dalam gelas'], 'Uap air di udara mendingin saat menyentuh gelas dingin lalu mengembun menjadi titik air.'),
        ('Zat dan Wujudnya', 'Zat yang bentuk dan volumenya selalu tetap adalah zat …', 'Padat', ['Cair', 'Gas', 'Plasma'], 'Partikel zat padat tersusun rapat dan teratur, jadi bentuk dan volumenya tetap.'),
        ('Zat dan Wujudnya', 'Massa jenis air 1 g/cm³. Benda yang massa jenisnya 0,6 g/cm³ jika dimasukkan ke air akan …', 'Terapung', ['Tenggelam', 'Melayang', 'Larut'], 'Massa jenis benda lebih kecil dari air, jadi benda terapung.'),
        ('Zat dan Wujudnya', 'Contoh perubahan kimia adalah …', 'Kayu dibakar menjadi arang', ['Es mencair', 'Gula larut dalam air', 'Kertas digunting'], 'Pada perubahan kimia terbentuk zat baru. Arang adalah zat baru dari kayu.'),
        # Suhu dan Kalor
        ('Suhu dan Kalor', 'Alat untuk mengukur suhu adalah …', 'Termometer', ['Barometer', 'Higrometer', 'Speedometer'], 'Termometer mengukur suhu. Barometer mengukur tekanan udara.'),
        ('Suhu dan Kalor', 'Suhu 30 °C sama dengan … K', '303', ['243', '30', '330'], 'K = °C + 273, jadi 30 + 273 = 303 K.'),
        ('Suhu dan Kalor', 'Sendok logam yang dicelup ke teh panas ujungnya ikut panas. Perpindahan kalor ini disebut …', 'Konduksi', ['Konveksi', 'Radiasi', 'Evaporasi'], 'Konduksi adalah perpindahan kalor melalui zat tanpa disertai perpindahan zatnya.'),
        ('Suhu dan Kalor', 'Hangatnya sinar matahari sampai ke bumi melalui …', 'Radiasi', ['Konduksi', 'Konveksi', 'Isolasi'], 'Radiasi memindahkan kalor tanpa zat perantara, bisa melewati ruang hampa.'),
        ('Suhu dan Kalor', 'Kabel listrik dipasang agak kendur pada siang hari supaya …', 'Tidak putus saat menyusut di malam dingin', ['Lebih mudah dialiri listrik', 'Tidak tersambar petir', 'Terlihat lebih rapi'], 'Logam menyusut saat dingin. Kabel kendur memberi ruang untuk menyusut.'),
        ('Suhu dan Kalor', 'Air mendidih pada suhu 100 °C. Dalam skala Fahrenheit suhu itu adalah …', '212 °F', ['100 °F', '180 °F', '373 °F'], '°F = (9/5 × °C) + 32 = 180 + 32 = 212 °F.'),
        # Klasifikasi Makhluk Hidup
        ('Klasifikasi Makhluk Hidup', 'Urutan takson dari yang paling luas adalah …', 'Kingdom, filum, kelas, ordo', ['Spesies, genus, famili, ordo', 'Kelas, kingdom, filum, ordo', 'Filum, kingdom, ordo, kelas'], 'Urutan takson: kingdom, filum/divisi, kelas, ordo, famili, genus, spesies.'),
        ('Klasifikasi Makhluk Hidup', 'Penulisan nama ilmiah padi yang benar adalah …', 'Oryza sativa', ['oryza sativa', 'Oryza Sativa', 'ORYZA SATIVA'], 'Nama genus diawali huruf kapital, nama spesies huruf kecil, dan dicetak miring.'),
        ('Klasifikasi Makhluk Hidup', 'Jamur tidak dimasukkan ke kingdom tumbuhan karena …', 'Tidak berklorofil', ['Tidak bisa tumbuh', 'Hidup di air', 'Berukuran kecil'], 'Jamur tidak punya klorofil sehingga tidak bisa berfotosintesis.'),
        ('Klasifikasi Makhluk Hidup', 'Hewan yang termasuk vertebrata adalah …', 'Katak', ['Cacing tanah', 'Ubur-ubur', 'Kupu-kupu'], 'Katak punya tulang belakang. Tiga lainnya avertebrata.'),
        ('Klasifikasi Makhluk Hidup', 'Ciri hewan mamalia adalah …', 'Menyusui anaknya', ['Bertelur di air', 'Bernapas dengan insang', 'Berdarah dingin'], 'Mamalia memiliki kelenjar susu untuk menyusui anaknya.'),
        # Ekosistem
        ('Ekosistem', 'Dalam rantai makanan, tumbuhan hijau berperan sebagai …', 'Produsen', ['Konsumen I', 'Pengurai', 'Predator'], 'Tumbuhan hijau membuat makanan sendiri lewat fotosintesis.'),
        ('Ekosistem', 'Rantai makanan: padi → tikus → ular → elang. Konsumen tingkat II adalah …', 'Ular', ['Tikus', 'Elang', 'Padi'], 'Tikus konsumen I, ular konsumen II, elang konsumen III.'),
        ('Ekosistem', 'Hubungan bunga dan lebah yang saling menguntungkan disebut simbiosis …', 'Mutualisme', ['Parasitisme', 'Komensalisme', 'Kompetisi'], 'Lebah mendapat nektar, bunga terbantu penyerbukannya.'),
        ('Ekosistem', 'Makhluk hidup yang menguraikan sisa organisme mati adalah …', 'Bakteri dan jamur', ['Rumput dan lumut', 'Ulat dan belalang', 'Burung dan kelelawar'], 'Bakteri dan jamur adalah pengurai (dekomposer).'),
        ('Ekosistem', 'Contoh komponen abiotik dalam ekosistem sawah adalah …', 'Air dan cahaya matahari', ['Padi dan rumput', 'Katak dan ular', 'Bakteri tanah'], 'Abiotik berarti tidak hidup, misalnya air, tanah, suhu, dan cahaya.'),
        # Pengukuran
        ('Pengukuran', 'Satuan besaran pokok massa dalam SI adalah …', 'Kilogram', ['Gram', 'Newton', 'Liter'], 'Satuan SI untuk massa adalah kilogram (kg).'),
        ('Pengukuran', 'Alat ukur panjang yang paling teliti di antara berikut adalah …', 'Mikrometer sekrup', ['Mistar', 'Jangka sorong', 'Meteran kain'], 'Ketelitian mikrometer sekrup 0,01 mm, lebih teliti dari jangka sorong (0,1 mm).'),
        ('Pengukuran', 'Yang termasuk besaran turunan adalah …', 'Kecepatan', ['Panjang', 'Waktu', 'Suhu'], 'Kecepatan diturunkan dari panjang dan waktu (m/s).'),
        ('Pengukuran', '2,5 kg sama dengan … gram', '2.500', ['250', '25', '25.000'], '1 kg = 1.000 g, jadi 2,5 × 1.000 = 2.500 g.'),
    ],
    '8': [
        # Gaya dan Gerak
        ('Gaya dan Gerak', 'Sepeda menempuh 120 m dalam 20 detik. Kecepatannya …', '6 m/s', ['2.400 m/s', '100 m/s', '0,6 m/s'], 'v = s / t = 120 / 20 = 6 m/s.'),
        ('Gaya dan Gerak', 'Penumpang bus terdorong ke depan saat bus direm mendadak. Ini contoh Hukum Newton …', 'I (kelembaman)', ['II', 'III (aksi-reaksi)', 'Gravitasi'], 'Benda cenderung mempertahankan geraknya (inersia).'),
        ('Gaya dan Gerak', 'Gaya 20 N bekerja pada benda 4 kg. Percepatan benda adalah …', '5 m/s²', ['80 m/s²', '24 m/s²', '0,2 m/s²'], 'a = F / m = 20 / 4 = 5 m/s².'),
        ('Gaya dan Gerak', 'Saat mendayung perahu, dayung mendorong air ke belakang dan perahu bergerak maju. Ini Hukum Newton …', 'III (aksi-reaksi)', ['I (kelembaman)', 'II', 'Archimedes'], 'Gaya aksi dayung pada air dibalas gaya reaksi air pada dayung.'),
        ('Gaya dan Gerak', 'Berat benda bermassa 5 kg di bumi (g = 10 m/s²) adalah …', '50 N', ['5 N', '0,5 N', '15 N'], 'w = m × g = 5 × 10 = 50 N.'),
        ('Gaya dan Gerak', 'Ban kendaraan dibuat beralur supaya …', 'Gaya gesek dengan jalan lebih besar', ['Ban lebih ringan', 'Gaya gesek hilang', 'Ban cepat panas'], 'Alur ban menambah gesekan sehingga tidak mudah tergelincir.'),
        # Pesawat Sederhana
        ('Pesawat Sederhana', 'Gunting termasuk tuas jenis …', 'Pertama (titik tumpu di tengah)', ['Kedua', 'Ketiga', 'Katrol'], 'Pada gunting titik tumpu berada di antara beban dan kuasa.'),
        ('Pesawat Sederhana', 'Beban 600 N diangkat dengan katrol tetap. Gaya minimal yang diperlukan …', '600 N', ['300 N', '1.200 N', '200 N'], 'Keuntungan mekanis katrol tetap = 1, jadi gaya sama dengan beban.'),
        ('Pesawat Sederhana', 'Jalan berkelok di pegunungan memanfaatkan prinsip …', 'Bidang miring', ['Katrol', 'Roda berporos', 'Tuas'], 'Jalan berkelok memperpanjang lintasan seperti bidang miring sehingga tanjakan lebih ringan.'),
        ('Pesawat Sederhana', 'Tuas dengan lengan kuasa 2 m dan lengan beban 0,5 m. Keuntungan mekanisnya …', '4', ['1', '2,5', '0,25'], 'KM = lengan kuasa / lengan beban = 2 / 0,5 = 4.'),
        # Tekanan
        ('Tekanan', 'Gaya 100 N bekerja pada luas 2 m². Tekanannya …', '50 Pa', ['200 Pa', '102 Pa', '98 Pa'], 'P = F / A = 100 / 2 = 50 Pa.'),
        ('Tekanan', 'Pisau tajam mudah memotong karena …', 'Luas bidang tekannya kecil', ['Pisau lebih berat', 'Luas bidang tekannya besar', 'Gaya gesek pisau besar'], 'Luas kecil membuat tekanan besar dengan gaya yang sama.'),
        ('Tekanan', 'Semakin dalam penyelam menyelam, tekanan air yang dirasakan …', 'Semakin besar', ['Semakin kecil', 'Tetap', 'Hilang'], 'Tekanan hidrostatis sebanding dengan kedalaman: P = ρ g h.'),
        ('Tekanan', 'Dongkrak hidrolik bekerja berdasarkan hukum …', 'Pascal', ['Archimedes', 'Newton', 'Ohm'], 'Tekanan pada zat cair tertutup diteruskan ke segala arah sama besar.'),
        ('Tekanan', 'Kapal laut dari besi bisa terapung karena …', 'Gaya angkat air sebanding dengan air yang dipindahkan badan kapal', ['Besi lebih ringan dari air', 'Kapal didorong angin', 'Air laut sangat asin saja'], 'Hukum Archimedes: badan kapal berongga memindahkan banyak air sehingga gaya angkatnya besar.'),
        # Sistem Pencernaan
        ('Sistem Pencernaan', 'Enzim ptialin (amilase) di mulut mengubah …', 'Amilum menjadi gula sederhana', ['Protein menjadi asam amino', 'Lemak menjadi asam lemak', 'Vitamin menjadi mineral'], 'Ptialin mencerna amilum (karbohidrat) menjadi maltosa.'),
        ('Sistem Pencernaan', 'Penyerapan sari makanan terutama terjadi di …', 'Usus halus', ['Lambung', 'Kerongkongan', 'Usus besar'], 'Jonjot usus halus menyerap sari makanan ke dalam darah.'),
        ('Sistem Pencernaan', 'Gerak meremas yang mendorong makanan di kerongkongan disebut …', 'Gerak peristaltik', ['Gerak refleks', 'Gerak rotasi', 'Gerak lurus'], 'Otot kerongkongan berkontraksi bergelombang mendorong makanan ke lambung.'),
        ('Sistem Pencernaan', 'Asam klorida (HCl) di lambung berfungsi …', 'Membunuh kuman dalam makanan', ['Menyerap air', 'Mengunyah makanan', 'Membuat empedu'], 'HCl membunuh kuman dan mengaktifkan enzim pepsin.'),
        ('Sistem Pencernaan', 'Kekurangan serat makanan dapat menyebabkan …', 'Sembelit', ['Rabun senja', 'Anemia', 'Gondok'], 'Serat membantu gerak usus. Kurang serat membuat feses keras.'),
        # Sistem Peredaran Darah
        ('Sistem Peredaran Darah', 'Sel darah yang berfungsi mengangkut oksigen adalah …', 'Sel darah merah', ['Sel darah putih', 'Keping darah', 'Plasma darah'], 'Sel darah merah mengandung hemoglobin yang mengikat oksigen.'),
        ('Sistem Peredaran Darah', 'Keping darah (trombosit) berperan dalam …', 'Pembekuan darah', ['Melawan kuman', 'Mengangkut oksigen', 'Mengangkut sari makanan'], 'Trombosit membantu menutup luka dengan membekukan darah.'),
        ('Sistem Peredaran Darah', 'Pembuluh darah yang membawa darah keluar dari jantung adalah …', 'Arteri', ['Vena', 'Kapiler', 'Limfa'], 'Arteri membawa darah meninggalkan jantung, vena membawa darah menuju jantung.'),
        ('Sistem Peredaran Darah', 'Peredaran darah kecil adalah peredaran darah dari jantung ke …', 'Paru-paru lalu kembali ke jantung', ['Seluruh tubuh lalu ke jantung', 'Otak lalu ke kaki', 'Hati lalu ke ginjal'], 'Peredaran kecil: bilik kanan → paru-paru → serambi kiri.'),
        ('Sistem Peredaran Darah', 'Bilik jantung yang dindingnya paling tebal adalah bilik kiri, karena …', 'Memompa darah ke seluruh tubuh', ['Menerima darah dari paru-paru', 'Menyimpan darah', 'Membuat sel darah'], 'Bilik kiri butuh otot kuat untuk memompa darah ke seluruh tubuh.'),
    ],
    '9': [
        # Listrik
        ('Listrik', 'Hambatan 6 ohm dialiri arus 2 A. Tegangannya …', '12 V', ['3 V', '8 V', '4 V'], 'Hukum Ohm: V = I × R = 2 × 6 = 12 V.'),
        ('Listrik', 'Dua lampu dirangkai seri. Jika satu lampu putus, lampu lainnya …', 'Ikut padam', ['Tetap menyala', 'Menyala lebih terang', 'Berkedip'], 'Pada rangkaian seri hanya ada satu jalur arus.'),
        ('Listrik', 'Lampu di rumah dipasang paralel supaya …', 'Satu lampu mati tidak memadamkan lampu lain', ['Hemat kabel', 'Semua lampu menyala bergantian', 'Arus listrik lebih kecil'], 'Rangkaian paralel punya banyak jalur arus.'),
        ('Listrik', 'Bahan yang termasuk konduktor listrik adalah …', 'Tembaga', ['Plastik', 'Karet', 'Kayu kering'], 'Logam seperti tembaga mudah menghantarkan listrik.'),
        ('Listrik', 'Setrika 300 W dipakai 2 jam. Energi listrik yang dipakai …', '0,6 kWh', ['600 kWh', '150 kWh', '6 kWh'], 'W = P × t = 300 W × 2 jam = 600 Wh = 0,6 kWh.'),
        ('Listrik', 'Penggaris plastik yang digosok ke rambut bisa menarik sobekan kertas karena …', 'Penggaris bermuatan listrik statis', ['Penggaris menjadi magnet', 'Kertas menjadi berat', 'Ada angin dari rambut'], 'Gosokan memindahkan elektron sehingga penggaris bermuatan.'),
        # Kemagnetan
        ('Kemagnetan', 'Dua kutub magnet yang sejenis jika didekatkan akan …', 'Tolak-menolak', ['Tarik-menarik', 'Diam saja', 'Menjadi satu kutub'], 'Kutub sejenis tolak-menolak, kutub berbeda tarik-menarik.'),
        ('Kemagnetan', 'Benda yang dapat ditarik magnet dengan kuat adalah …', 'Paku besi', ['Pensil kayu', 'Gelas kaca', 'Penghapus karet'], 'Besi termasuk bahan feromagnetik.'),
        ('Kemagnetan', 'Kompas menunjuk arah utara karena …', 'Jarum kompas dipengaruhi medan magnet bumi', ['Ditiup angin dari utara', 'Tertarik cahaya matahari', 'Jarumnya berat di satu sisi'], 'Bumi berperilaku seperti magnet besar.'),
        ('Kemagnetan', 'Cara membuat elektromagnet adalah …', 'Melilitkan kawat berarus listrik pada besi', ['Memanaskan besi', 'Menggosok besi dengan kain', 'Merendam besi dalam air'], 'Arus listrik dalam kumparan menimbulkan medan magnet.'),
        ('Kemagnetan', 'Alat yang memakai prinsip elektromagnet adalah …', 'Bel listrik', ['Termometer', 'Lup', 'Cermin'], 'Bel listrik memakai elektromagnet untuk menarik pemukul.'),
        # Pewarisan Sifat
        ('Pewarisan Sifat', 'Pembawa sifat keturunan yang terdapat di dalam kromosom disebut …', 'Gen', ['Sel', 'Enzim', 'Hormon'], 'Gen adalah unit pewarisan sifat yang terletak di kromosom.'),
        ('Pewarisan Sifat', 'Ilmuwan yang dikenal sebagai Bapak Genetika adalah …', 'Gregor Mendel', ['Charles Darwin', 'Isaac Newton', 'Louis Pasteur'], 'Mendel meneliti persilangan kacang ercis.'),
        ('Pewarisan Sifat', 'Persilangan TT (tinggi) dengan tt (pendek) menghasilkan keturunan F1 …', '100% tinggi (Tt)', ['100% pendek', '50% tinggi : 50% pendek', '75% tinggi : 25% pendek'], 'Semua F1 bergenotipe Tt dan sifat tinggi dominan.'),
        ('Pewarisan Sifat', 'F1 Tt disilangkan sesamanya. Perbandingan fenotipe F2 tinggi : pendek adalah …', '3 : 1', ['1 : 1', '1 : 2 : 1', '9 : 3 : 3 : 1'], 'TT, Tt, Tt tinggi dan tt pendek, jadi 3 : 1.'),
        ('Pewarisan Sifat', 'Sifat yang tertutupi oleh sifat lain disebut sifat …', 'Resesif', ['Dominan', 'Intermediet', 'Mutan'], 'Sifat resesif hanya muncul bila tidak ada alel dominan.'),
        # Tata Surya
        ('Tata Surya', 'Planet yang paling dekat dengan matahari adalah …', 'Merkurius', ['Venus', 'Bumi', 'Mars'], 'Urutan dari matahari: Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, Neptunus.'),
        ('Tata Surya', 'Planet terbesar di tata surya adalah …', 'Jupiter', ['Saturnus', 'Bumi', 'Neptunus'], 'Diameter Jupiter sekitar 11 kali diameter bumi.'),
        ('Tata Surya', 'Pergantian siang dan malam disebabkan oleh …', 'Rotasi bumi', ['Revolusi bumi', 'Revolusi bulan', 'Gerhana matahari'], 'Bumi berputar pada porosnya sekali dalam sekitar 24 jam.'),
        ('Tata Surya', 'Gerhana bulan terjadi ketika …', 'Bumi berada di antara matahari dan bulan', ['Bulan berada di antara matahari dan bumi', 'Matahari berada di antara bumi dan bulan', 'Bulan berada di belakang matahari'], 'Bayangan bumi menutupi bulan.'),
        ('Tata Surya', 'Satu kali revolusi bumi mengelilingi matahari memerlukan waktu sekitar …', '365 hari', ['24 jam', '30 hari', '12 jam'], 'Revolusi bumi kira-kira 365¼ hari, karena itu ada tahun kabisat.'),
        # Reproduksi
        ('Reproduksi', 'Perkembangbiakan tumbuhan dengan cara mencangkok termasuk …', 'Vegetatif buatan', ['Vegetatif alami', 'Generatif', 'Fragmentasi'], 'Mencangkok dilakukan manusia tanpa melalui biji.'),
        ('Reproduksi', 'Bagian bunga yang menghasilkan serbuk sari adalah …', 'Benang sari', ['Putik', 'Mahkota', 'Kelopak'], 'Kepala sari pada benang sari menghasilkan serbuk sari.'),
        ('Reproduksi', 'Kentang berkembang biak secara vegetatif alami dengan …', 'Umbi batang', ['Spora', 'Biji', 'Geragih'], 'Mata tunas pada umbi kentang tumbuh menjadi tanaman baru.'),
        ('Reproduksi', 'Hewan yang berkembang biak dengan bertelur disebut …', 'Ovipar', ['Vivipar', 'Ovovivipar', 'Herbivor'], 'Ovipar bertelur, vivipar melahirkan, ovovivipar bertelur-melahirkan.'),
    ],
}


def bank():
    r = random.Random(2027)
    hasil = []
    for kelas, daftar in S.items():
        for topik, teks, benar, salah, jelas in daftar:
            ops = [benar] + list(salah)
            assert len(set(ops)) == 4, teks
            r.shuffle(ops)
            hasil.append({'kelas': kelas, 'topik': topik, 'soal': teks, 'a': ops[0], 'b': ops[1], 'c': ops[2], 'd': ops[3],
                          'kunci': 'ABCD'[ops.index(benar)], 'jelas': jelas})
    return hasil


if __name__ == '__main__':
    b = bank()
    print(len(b), {k: sum(1 for x in b if x['kelas'] == k) for k in '789'}, {h: sum(1 for x in b if x['kunci'] == h) for h in 'ABCD'})
