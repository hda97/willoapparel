"""Bank soal IPS SMP (Kurikulum Merdeka) untuk Pelayaran Nusantara.

Tiap soal: (topik, soal, jawaban benar, [3 pengecoh], penjelasan singkat).
"""
import random

S = {
    '7': [
        # Letak Indonesia
        ('Letak Indonesia', 'Secara astronomis Indonesia terletak di antara …', '6° LU - 11° LS dan 95° BT - 141° BT', ['6° LS - 11° LU dan 95° BB - 141° BB', '11° LU - 6° LS dan 141° BT - 195° BT', '0° - 6° LU dan 95° BT - 120° BT'], 'Indonesia membentang dari 6° LU sampai 11° LS dan 95° BT sampai 141° BT.'),
        ('Letak Indonesia', 'Indonesia diapit oleh dua benua, yaitu …', 'Asia dan Australia', ['Asia dan Afrika', 'Eropa dan Asia', 'Amerika dan Australia'], 'Letak geografis Indonesia di antara Benua Asia dan Australia.'),
        ('Letak Indonesia', 'Dua samudra yang mengapit Indonesia adalah …', 'Samudra Hindia dan Samudra Pasifik', ['Samudra Atlantik dan Pasifik', 'Samudra Arktik dan Hindia', 'Samudra Atlantik dan Hindia'], 'Samudra Hindia di barat daya, Samudra Pasifik di timur laut.'),
        ('Letak Indonesia', 'Karena dilalui garis khatulistiwa, Indonesia beriklim …', 'Tropis', ['Kutub', 'Sedang', 'Gurun'], 'Daerah di sekitar khatulistiwa beriklim tropis.'),
        ('Letak Indonesia', 'Indonesia terbagi menjadi tiga zona waktu, yaitu …', 'WIB, WITA, WIT', ['WIB, WIS, WIT', 'WIA, WIB, WIC', 'GMT, WIB, WIT'], 'Waktu Indonesia Barat, Tengah, dan Timur.'),
        ('Letak Indonesia', 'Pulau terbesar milik Indonesia yang wilayahnya dibagi dengan negara lain adalah …', 'Kalimantan', ['Jawa', 'Sumatra', 'Sulawesi'], 'Kalimantan dibagi dengan Malaysia dan Brunei. Papua dibagi dengan Papua Nugini.'),
        # Sumber Daya Alam
        ('Sumber Daya Alam', 'Contoh sumber daya alam yang dapat diperbarui adalah …', 'Hutan', ['Minyak bumi', 'Batu bara', 'Emas'], 'Hutan dapat tumbuh kembali jika dirawat dan ditanam ulang.'),
        ('Sumber Daya Alam', 'Tambang emas dan tembaga terkenal di Papua adalah di daerah …', 'Grasberg (Mimika)', ['Bangka', 'Sawahlunto', 'Cilacap'], 'Tambang Grasberg berada di Kabupaten Mimika, Papua Tengah.'),
        ('Sumber Daya Alam', 'Pulau Bangka dan Belitung terkenal sebagai penghasil …', 'Timah', ['Nikel', 'Batu bara', 'Aspal'], 'Bangka Belitung adalah penghasil timah terbesar di Indonesia.'),
        ('Sumber Daya Alam', 'Aspal alam Indonesia banyak dihasilkan di Pulau …', 'Buton', ['Bali', 'Madura', 'Lombok'], 'Buton di Sulawesi Tenggara terkenal dengan aspal alamnya.'),
        ('Sumber Daya Alam', 'Cara menjaga hutan agar tetap lestari adalah …', 'Tebang pilih dan reboisasi', ['Membakar hutan untuk lahan', 'Menebang semua pohon sekaligus', 'Berburu satwa langka'], 'Tebang pilih dan menanam kembali menjaga hutan.'),
        # Interaksi Sosial
        ('Interaksi Sosial', 'Syarat terjadinya interaksi sosial adalah …', 'Kontak sosial dan komunikasi', ['Uang dan barang', 'Rumah dan tanah', 'Sekolah dan buku'], 'Interaksi sosial butuh kontak sosial dan komunikasi.'),
        ('Interaksi Sosial', 'Gotong royong membersihkan lingkungan termasuk bentuk interaksi …', 'Kerja sama', ['Persaingan', 'Konflik', 'Kontravensi'], 'Kerja sama adalah usaha bersama untuk tujuan bersama.'),
        ('Interaksi Sosial', 'Dua pihak yang bertikai didamaikan oleh pihak ketiga yang netral. Ini disebut …', 'Mediasi', ['Koersi', 'Asimilasi', 'Kompetisi'], 'Mediasi menggunakan pihak ketiga sebagai penengah.'),
        ('Interaksi Sosial', 'Perpaduan dua budaya yang melahirkan budaya baru tanpa menghilangkan ciri asli disebut …', 'Akulturasi', ['Asimilasi', 'Akomodasi', 'Kompromi'], 'Contohnya Masjid Menara Kudus yang memadukan unsur Hindu dan Islam.'),
        ('Interaksi Sosial', 'Lembaga sosial pertama yang dikenal seorang anak adalah …', 'Keluarga', ['Sekolah', 'Pasar', 'Partai'], 'Keluarga adalah tempat sosialisasi pertama.'),
        # Kegiatan Ekonomi
        ('Kegiatan Ekonomi', 'Kegiatan menghasilkan atau menambah nilai guna barang disebut …', 'Produksi', ['Konsumsi', 'Distribusi', 'Investasi'], 'Produksi menciptakan atau menambah kegunaan barang.'),
        ('Kegiatan Ekonomi', 'Pedagang yang menyalurkan barang dari produsen ke konsumen melakukan kegiatan …', 'Distribusi', ['Produksi', 'Konsumsi', 'Ekspor'], 'Distribusi menyalurkan barang ke konsumen.'),
        ('Kegiatan Ekonomi', 'Kebutuhan yang harus dipenuhi untuk bertahan hidup (makan, pakaian, rumah) disebut kebutuhan …', 'Primer', ['Sekunder', 'Tersier', 'Rohani'], 'Sandang, pangan, papan adalah kebutuhan primer.'),
        ('Kegiatan Ekonomi', 'Kelangkaan terjadi karena …', 'Kebutuhan tidak terbatas, alat pemuas terbatas', ['Barang terlalu banyak', 'Harga selalu turun', 'Semua orang kaya'], 'Inilah masalah pokok ekonomi.'),
        ('Kegiatan Ekonomi', 'Pasar tempat penjual dan pembeli bertemu langsung dan tawar-menawar disebut pasar …', 'Tradisional', ['Saham', 'Modern', 'Abstrak'], 'Di pasar tradisional harga bisa ditawar.'),
        # Praaksara
        ('Zaman Praaksara', 'Zaman praaksara adalah masa ketika manusia …', 'Belum mengenal tulisan', ['Sudah memakai mesin', 'Hidup di kota besar', 'Sudah membuat kerajaan'], 'Praaksara = sebelum ada aksara (tulisan).'),
        ('Zaman Praaksara', 'Fosil Pithecanthropus erectus ditemukan oleh Eugene Dubois di …', 'Trinil, Ngawi', ['Sangiran, Bali', 'Leang-Leang, Maros', 'Gua Harimau, Sumatra'], 'Dubois menemukan fosil itu di Trinil, Jawa Timur, tahun 1891.'),
        ('Zaman Praaksara', 'Situs manusia purba Sangiran yang diakui UNESCO terletak di …', 'Jawa Tengah', ['Jawa Barat', 'Sumatra Utara', 'Nusa Tenggara Timur'], 'Sangiran berada di Sragen dan Karanganyar, Jawa Tengah.'),
        ('Zaman Praaksara', 'Bangunan batu besar untuk memuja roh nenek moyang (menhir, dolmen) berasal dari zaman …', 'Megalitikum', ['Mesolitikum', 'Paleolitikum', 'Zaman logam'], 'Mega = besar, lithos = batu.'),
        ('Zaman Praaksara', 'Kehidupan manusia purba yang berpindah-pindah mengikuti sumber makanan disebut …', 'Nomaden', ['Sedenter', 'Urbanisasi', 'Transmigrasi'], 'Nomaden = berpindah-pindah, sedenter = menetap.'),
    ],
    '8': [
        # Hindu-Buddha
        ('Kerajaan Hindu-Buddha', 'Kerajaan Hindu tertua di Indonesia adalah …', 'Kutai', ['Majapahit', 'Singasari', 'Mataram Kuno'], 'Kutai di Kalimantan Timur, bukti prasasti Yupa abad ke-4.'),
        ('Kerajaan Hindu-Buddha', 'Prasasti Yupa merupakan peninggalan Kerajaan …', 'Kutai', ['Tarumanegara', 'Sriwijaya', 'Kediri'], 'Yupa adalah tiang batu peninggalan Kutai.'),
        ('Kerajaan Hindu-Buddha', 'Kerajaan maritim besar yang berpusat di Palembang adalah …', 'Sriwijaya', ['Majapahit', 'Demak', 'Kalingga'], 'Sriwijaya menguasai jalur perdagangan Selat Malaka.'),
        ('Kerajaan Hindu-Buddha', 'Candi Borobudur dibangun pada masa Dinasti …', 'Syailendra', ['Sanjaya', 'Rajasa', 'Isyana'], 'Borobudur dibangun Dinasti Syailendra abad ke-8 sampai 9.'),
        ('Kerajaan Hindu-Buddha', 'Patih Majapahit yang terkenal dengan Sumpah Palapa adalah …', 'Gajah Mada', ['Ken Arok', 'Hayam Wuruk', 'Raden Wijaya'], 'Gajah Mada bersumpah menyatukan Nusantara.'),
        ('Kerajaan Hindu-Buddha', 'Raja Majapahit yang membawa kerajaan ke masa kejayaan adalah …', 'Hayam Wuruk', ['Jayanegara', 'Kertanegara', 'Airlangga'], 'Bersama Gajah Mada, Hayam Wuruk membawa Majapahit berjaya.'),
        # Kerajaan Islam
        ('Kerajaan Islam', 'Kerajaan Islam pertama di Indonesia adalah …', 'Samudera Pasai', ['Demak', 'Banten', 'Gowa'], 'Samudera Pasai di Aceh berdiri abad ke-13.'),
        ('Kerajaan Islam', 'Kerajaan Islam pertama di Pulau Jawa adalah …', 'Demak', ['Mataram Islam', 'Cirebon', 'Pajang'], 'Demak didirikan Raden Patah.'),
        ('Kerajaan Islam', 'Sultan Hasanuddin yang dijuluki "Ayam Jantan dari Timur" adalah raja …', 'Gowa-Tallo', ['Ternate', 'Banten', 'Aceh'], 'Ia memimpin perlawanan Gowa-Tallo melawan VOC.'),
        ('Kerajaan Islam', 'Islam masuk ke Nusantara terutama melalui jalur …', 'Perdagangan', ['Peperangan', 'Penjajahan', 'Penerbangan'], 'Pedagang Gujarat, Arab, dan Persia singgah di pelabuhan Nusantara.'),
        ('Kerajaan Islam', 'Para penyebar Islam di Jawa yang terkenal disebut …', 'Wali Songo', ['Pujangga', 'Brahmana', 'Patih'], 'Wali Songo berdakwah melalui budaya, misalnya wayang dan gamelan.'),
        # Kolonialisme
        ('Kolonialisme', 'Persekutuan dagang Belanda yang didirikan tahun 1602 adalah …', 'VOC', ['EIC', 'KNIL', 'NHM'], 'Vereenigde Oostindische Compagnie.'),
        ('Kolonialisme', 'Bangsa Eropa pertama yang sampai di Maluku untuk mencari rempah adalah …', 'Portugis', ['Inggris', 'Prancis', 'Jerman'], 'Portugis tiba di Maluku tahun 1512.'),
        ('Kolonialisme', 'Sistem tanam paksa (cultuurstelsel) diterapkan oleh …', 'Van den Bosch', ['Daendels', 'Raffles', 'Jan Pieterszoon Coen'], 'Gubernur Jenderal Van den Bosch memulainya tahun 1830.'),
        ('Kolonialisme', 'Jalan Raya Pos Anyer-Panarukan dibangun pada masa …', 'Daendels', ['Raffles', 'Van den Bosch', 'Van Heutsz'], 'Daendels membangunnya dengan kerja paksa (rodi).'),
        ('Kolonialisme', 'Pangeran Diponegoro memimpin perang melawan Belanda di …', 'Jawa (1825-1830)', ['Aceh (1873-1904)', 'Bali (1846)', 'Maluku (1817)'], 'Perang Jawa atau Perang Diponegoro.'),
        # Mobilitas Penduduk
        ('Mobilitas Penduduk', 'Perpindahan penduduk dari desa ke kota disebut …', 'Urbanisasi', ['Transmigrasi', 'Emigrasi', 'Ruralisasi'], 'Urbanisasi = desa ke kota.'),
        ('Mobilitas Penduduk', 'Perpindahan penduduk dari pulau padat ke pulau jarang penduduk yang diatur pemerintah disebut …', 'Transmigrasi', ['Urbanisasi', 'Imigrasi', 'Remigrasi'], 'Contohnya dari Jawa ke Kalimantan atau Sumatra.'),
        ('Mobilitas Penduduk', 'Pulau dengan penduduk terpadat di Indonesia adalah …', 'Jawa', ['Papua', 'Kalimantan', 'Sulawesi'], 'Lebih dari separuh penduduk Indonesia tinggal di Jawa.'),
        ('Mobilitas Penduduk', 'Faktor pendorong orang pindah dari desa adalah …', 'Lapangan kerja di desa terbatas', ['Upah kota lebih tinggi', 'Fasilitas kota lengkap', 'Hiburan kota banyak'], 'Faktor pendorong berasal dari daerah asal. Yang lain faktor penarik kota.'),
        # Keragaman Budaya
        ('Keragaman Budaya', 'Rumah adat Minangkabau dari Sumatra Barat adalah …', 'Rumah Gadang', ['Tongkonan', 'Honai', 'Joglo'], 'Rumah Gadang beratap gonjong seperti tanduk kerbau.'),
        ('Keragaman Budaya', 'Rumah adat Tongkonan berasal dari suku …', 'Toraja', ['Dayak', 'Batak', 'Sasak'], 'Tongkonan ada di Sulawesi Selatan.'),
        ('Keragaman Budaya', 'Honai adalah rumah adat dari …', 'Papua', ['Kalimantan Barat', 'Bali', 'Aceh'], 'Honai berbentuk bulat beratap jerami di pegunungan Papua.'),
        ('Keragaman Budaya', 'Tari Saman berasal dari …', 'Aceh', ['Bali', 'Jawa Barat', 'Papua'], 'Tari Saman dari suku Gayo, Aceh, diakui UNESCO.'),
        ('Keragaman Budaya', 'Semboyan "Bhinneka Tunggal Ika" berasal dari kitab …', 'Sutasoma karya Mpu Tantular', ['Negarakertagama karya Mpu Prapanca', 'Arjunawiwaha karya Mpu Kanwa', 'Pararaton'], 'Artinya berbeda-beda tetapi tetap satu.'),
    ],
    '9': [
        # Pergerakan Nasional
        ('Pergerakan Nasional', 'Organisasi Budi Utomo berdiri pada tanggal …', '20 Mei 1908', ['28 Oktober 1928', '17 Agustus 1945', '1 Juni 1945'], 'Tanggal ini diperingati sebagai Hari Kebangkitan Nasional.'),
        ('Pergerakan Nasional', 'Sumpah Pemuda diikrarkan pada tanggal …', '28 Oktober 1928', ['20 Mei 1908', '10 November 1945', '2 Mei 1928'], 'Kongres Pemuda II di Jakarta.'),
        ('Pergerakan Nasional', 'Lagu "Indonesia Raya" pertama kali diperdengarkan oleh …', 'W.R. Supratman', ['Ismail Marzuki', 'C. Simanjuntak', 'Kusbini'], 'Dimainkan dengan biola pada Kongres Pemuda II.'),
        ('Pergerakan Nasional', 'Tokoh pendiri Taman Siswa yang dijuluki Bapak Pendidikan adalah …', 'Ki Hajar Dewantara', ['Dr. Wahidin', 'H.O.S. Cokroaminoto', 'Douwes Dekker'], 'Hari lahirnya, 2 Mei, menjadi Hari Pendidikan Nasional.'),
        ('Pergerakan Nasional', 'Tiga Serangkai pendiri Indische Partij adalah Douwes Dekker, Cipto Mangunkusumo, dan …', 'Suwardi Suryaningrat', ['Soekarno', 'Moh. Hatta', 'Sutan Syahrir'], 'Suwardi Suryaningrat kemudian dikenal sebagai Ki Hajar Dewantara.'),
        # Proklamasi
        ('Proklamasi', 'Teks proklamasi diketik oleh …', 'Sayuti Melik', ['Soekarno', 'Moh. Hatta', 'Ahmad Soebardjo'], 'Sayuti Melik mengetik naskah tulisan tangan Soekarno.'),
        ('Proklamasi', 'Peristiwa para pemuda membawa Soekarno-Hatta ke luar Jakarta disebut peristiwa …', 'Rengasdengklok', ['Bandung Lautan Api', 'Ambarawa', 'Sumpah Pemuda'], 'Terjadi 16 Agustus 1945.'),
        ('Proklamasi', 'Proklamasi kemerdekaan dibacakan di …', 'Jalan Pegangsaan Timur 56, Jakarta', ['Lapangan Ikada', 'Rumah Laksamana Maeda', 'Gedung Sate'], 'Di rumah Soekarno, Jumat 17 Agustus 1945.'),
        ('Proklamasi', 'Bendera Merah Putih pada saat proklamasi dijahit oleh …', 'Fatmawati', ['Ibu Inggit', 'Kartini', 'Dewi Sartika'], 'Ibu Fatmawati menjahit bendera pusaka.'),
        ('Proklamasi', 'Pertempuran 10 November 1945 yang diperingati sebagai Hari Pahlawan terjadi di …', 'Surabaya', ['Bandung', 'Semarang', 'Medan'], 'Arek-arek Suroboyo melawan pasukan Sekutu.'),
        # ASEAN dan Kerja Sama
        ('ASEAN', 'ASEAN didirikan melalui Deklarasi Bangkok pada tahun …', '1967', ['1945', '1955', '1975'], 'Tanggal 8 Agustus 1967.'),
        ('ASEAN', 'Wakil Indonesia yang menandatangani Deklarasi Bangkok adalah …', 'Adam Malik', ['Soekarno', 'B.J. Habibie', 'Ali Alatas'], 'Adam Malik saat itu Menteri Luar Negeri.'),
        ('ASEAN', 'Sekretariat ASEAN berkantor pusat di …', 'Jakarta', ['Bangkok', 'Kuala Lumpur', 'Singapura'], 'Gedung Sekretariat ASEAN ada di Jakarta Selatan.'),
        ('ASEAN', 'Konferensi Asia Afrika tahun 1955 diselenggarakan di kota …', 'Bandung', ['Jakarta', 'Yogyakarta', 'Bogor'], 'Menghasilkan Dasasila Bandung.'),
        ('ASEAN', 'Negara ASEAN yang tidak pernah dijajah bangsa Barat adalah …', 'Thailand', ['Vietnam', 'Filipina', 'Malaysia'], 'Thailand (dulu Siam) tetap merdeka.'),
        # Globalisasi
        ('Globalisasi', 'Globalisasi adalah proses …', 'Mendunianya berbagai aspek kehidupan', ['Menutup diri dari negara lain', 'Kembali ke zaman praaksara', 'Hanya memakai produk desa'], 'Batas antarnegara terasa makin tipis.'),
        ('Globalisasi', 'Contoh dampak positif globalisasi adalah …', 'Ilmu pengetahuan dan teknologi cepat menyebar', ['Lunturnya budaya lokal', 'Gaya hidup konsumtif', 'Munculnya individualisme'], 'Pilihan lain merupakan dampak negatif.'),
        ('Globalisasi', 'Sikap yang tepat menghadapi budaya asing adalah …', 'Menyaring sesuai nilai Pancasila', ['Menerima semuanya', 'Menolak semuanya', 'Meniru tanpa berpikir'], 'Budaya asing yang baik diambil, yang buruk ditolak.'),
        ('Globalisasi', 'Batik ditetapkan UNESCO sebagai warisan budaya tak benda dari Indonesia pada tahun …', '2009', ['1999', '2015', '2020'], 'Tanggal 2 Oktober 2009, kini diperingati sebagai Hari Batik Nasional.'),
        ('Globalisasi', 'Contoh produk lokal Indonesia yang mendunia adalah …', 'Kopi Gayo', ['Pizza', 'Sushi', 'Burger'], 'Kopi Gayo dari Aceh terkenal hingga mancanegara.'),
        # Perdagangan Internasional
        ('Perdagangan Internasional', 'Menjual barang ke luar negeri disebut …', 'Ekspor', ['Impor', 'Barter', 'Monopoli'], 'Ekspor = jual ke luar negeri, impor = beli dari luar negeri.'),
        ('Perdagangan Internasional', 'Pajak yang dikenakan pada barang impor disebut …', 'Bea masuk (tarif)', ['Pajak bumi', 'Retribusi parkir', 'Pajak penghasilan'], 'Bea masuk melindungi produk dalam negeri.'),
        ('Perdagangan Internasional', 'Komoditas ekspor utama Indonesia dari perkebunan adalah …', 'Kelapa sawit', ['Gandum', 'Anggur', 'Apel'], 'Indonesia produsen minyak sawit terbesar dunia.'),
        ('Perdagangan Internasional', 'Pembatasan jumlah barang impor disebut …', 'Kuota', ['Subsidi', 'Dumping', 'Embargo'], 'Kuota membatasi jumlah barang yang boleh masuk.'),
        ('Perdagangan Internasional', 'Larangan berdagang dengan suatu negara disebut …', 'Embargo', ['Kuota', 'Tarif', 'Devisa'], 'Embargo menghentikan perdagangan dengan negara tertentu.'),
    ],
}


def bank():
    r = random.Random(2030)
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
