"""Bank soal Informatika SMP (Kurikulum Merdeka) untuk Coding Quest.

Tiap soal: (topik, soal, jawaban benar, [3 pengecoh], penjelasan singkat).
"""
import random

S = {
    '7': [
        # Algoritma
        ('Algoritma', 'Langkah-langkah logis dan berurutan untuk menyelesaikan masalah disebut …', 'Algoritma', ['Aplikasi', 'Hardware', 'Database'], 'Algoritma adalah urutan langkah yang jelas untuk menyelesaikan masalah.'),
        ('Algoritma', 'Urutan yang benar untuk menyeduh teh adalah …', 'Rebus air, masukkan teh ke gelas, tuang air panas, aduk', ['Aduk, tuang air, rebus air, masukkan teh', 'Tuang air dingin, aduk, rebus gelas, minum', 'Minum, aduk, tuang air, rebus air'], 'Algoritma harus berurutan dan masuk akal.'),
        ('Algoritma', 'Pada diagram alir (flowchart), simbol belah ketupat dipakai untuk …', 'Keputusan atau percabangan', ['Mulai dan selesai', 'Proses', 'Input dan output'], 'Belah ketupat = decision (keputusan ya/tidak).'),
        ('Algoritma', 'Simbol oval (terminator) pada flowchart menandai …', 'Mulai atau selesai', ['Perulangan', 'Keputusan', 'Penyimpanan data'], 'Terminator dipakai di awal (mulai) dan akhir (selesai).'),
        ('Algoritma', 'Robot di (0,0) menjalankan: maju, maju, belok kanan, maju. Robot sudah maju sebanyak …', '3 kotak', ['2 kotak', '4 kotak', '1 kotak'], 'Ada tiga perintah maju.'),
        ('Algoritma', 'Algoritma yang baik harus …', 'Jelas, berurutan, dan punya akhir', ['Panjang dan rumit', 'Boleh berulang tanpa henti', 'Hanya bisa dimengerti komputer'], 'Algoritma yang baik tidak ambigu dan pasti berhenti.'),
        # Perangkat Komputer
        ('Perangkat Komputer', 'Otak komputer yang memproses data adalah …', 'CPU (prosesor)', ['Monitor', 'Keyboard', 'Speaker'], 'CPU menjalankan perintah dan memproses data.'),
        ('Perangkat Komputer', 'Yang termasuk perangkat input adalah …', 'Mouse', ['Printer', 'Monitor', 'Speaker'], 'Input memasukkan data ke komputer. Mouse memberi masukan gerak dan klik.'),
        ('Perangkat Komputer', 'Yang termasuk perangkat output adalah …', 'Printer', ['Scanner', 'Mikrofon', 'Keyboard'], 'Printer mengeluarkan hasil ke kertas.'),
        ('Perangkat Komputer', 'Memori yang isinya hilang saat komputer dimatikan adalah …', 'RAM', ['Hard disk', 'Flashdisk', 'SSD'], 'RAM bersifat sementara (volatile).'),
        ('Perangkat Komputer', 'Windows, Android, dan Linux adalah contoh …', 'Sistem operasi', ['Perangkat keras', 'Antivirus', 'Browser'], 'Sistem operasi mengatur perangkat keras dan menjalankan aplikasi.'),
        ('Perangkat Komputer', '1 kilobyte (KB) kira-kira sama dengan …', '1.000 byte', ['100 byte', '10 byte', '1.000.000 byte'], 'Kilo = seribu (tepatnya 1.024 byte).'),
        # Berpikir Komputasional
        ('Berpikir Komputasional', 'Memecah masalah besar menjadi bagian-bagian kecil disebut …', 'Dekomposisi', ['Abstraksi', 'Pengenalan pola', 'Debugging'], 'Dekomposisi = memecah masalah.'),
        ('Berpikir Komputasional', 'Pola: 2, 4, 8, 16, … Bilangan berikutnya …', '32', ['18', '24', '20'], 'Setiap bilangan dikali 2.'),
        ('Berpikir Komputasional', 'Fokus pada informasi penting dan mengabaikan detail yang tidak perlu disebut …', 'Abstraksi', ['Dekomposisi', 'Iterasi', 'Kompilasi'], 'Abstraksi menyaring hal penting.'),
        ('Berpikir Komputasional', 'Mencari dan memperbaiki kesalahan dalam program disebut …', 'Debugging', ['Download', 'Upload', 'Booting'], 'Bug = kesalahan, debugging = memperbaikinya.'),
        ('Berpikir Komputasional', 'Urutkan dari kecil ke besar: 7, 2, 9, 4. Hasilnya …', '2, 4, 7, 9', ['9, 7, 4, 2', '2, 7, 4, 9', '4, 2, 7, 9'], 'Mengurutkan (sorting) dari terkecil.'),
        # Etika Digital
        ('Etika Digital', 'Sikap yang benar saat menerima berita yang belum jelas sumbernya adalah …', 'Cek kebenarannya sebelum dibagikan', ['Langsung sebarkan ke semua grup', 'Tambahkan cerita supaya seru', 'Abaikan dan sebarkan nanti'], 'Berita tanpa sumber bisa hoaks. Saring sebelum sharing.'),
        ('Etika Digital', 'Mengejek teman berulang kali di media sosial termasuk …', 'Perundungan siber (cyberbullying)', ['Candaan biasa', 'Promosi', 'Diskusi'], 'Cyberbullying menyakiti orang lain secara daring.'),
        ('Etika Digital', 'Memakai foto karya orang lain sebaiknya …', 'Meminta izin dan menyebut sumbernya', ['Langsung dipakai karena ada di internet', 'Diakui sebagai karya sendiri', 'Dihapus tanda airnya'], 'Hargai hak cipta pembuat karya.'),
        ('Etika Digital', 'Informasi yang TIDAK boleh dibagikan ke orang asing di internet adalah …', 'Alamat rumah dan kata sandi', ['Hobi membaca', 'Warna kesukaan', 'Film favorit'], 'Data pribadi bisa disalahgunakan.'),
        # Internet
        ('Internet', 'Aplikasi untuk membuka situs web disebut …', 'Browser', ['Spreadsheet', 'Antivirus', 'Compiler'], 'Contoh browser: Chrome, Firefox, Safari.'),
        ('Internet', 'Alamat sebuah situs web, misalnya www.willoapparel.com, disebut …', 'URL', ['CPU', 'RAM', 'USB'], 'URL = alamat lengkap halaman web.'),
        ('Internet', 'Mesin pencari (search engine) contohnya adalah …', 'Google', ['Microsoft Word', 'Paint', 'Kalkulator'], 'Google membantu mencari informasi di web.'),
        ('Internet', 'Kata kunci yang paling tepat untuk mencari resep nasi goreng adalah …', 'resep nasi goreng', ['makanan', 'aku lapar', 'dapur'], 'Kata kunci spesifik memberi hasil yang relevan.'),
    ],
    '8': [
        # Perulangan
        ('Perulangan', 'Perintah "ulangi 4 kali: maju 1, belok kanan" membuat robot berjalan membentuk …', 'Persegi', ['Garis lurus', 'Segitiga', 'Lingkaran'], 'Empat sisi sama dan empat belokan 90° membentuk persegi.'),
        ('Perulangan', 'Perintah yang menjalankan langkah yang sama berkali-kali disebut …', 'Perulangan (loop)', ['Percabangan', 'Variabel', 'Komentar'], 'Loop mengulang perintah.'),
        ('Perulangan', '"ulangi 3 kali: maju 2" sama dengan robot maju sebanyak …', '6 langkah', ['5 langkah', '3 langkah', '2 langkah'], '3 × 2 = 6.'),
        ('Perulangan', 'Untuk menggambar segitiga sama sisi, robot berbelok sebesar … setiap sudut', '120°', ['90°', '60°', '180°'], 'Sudut luar segitiga sama sisi = 360° / 3 = 120°.'),
        ('Perulangan', 'Keuntungan memakai perulangan adalah …', 'Program lebih singkat', ['Program lebih lambat', 'Program jadi error', 'Komputer cepat panas'], 'Tidak perlu menulis perintah yang sama berulang-ulang.'),
        # Bilangan Biner
        ('Bilangan Biner', 'Bilangan biner hanya memakai angka …', '0 dan 1', ['0 sampai 9', '1 dan 2', 'A sampai F'], 'Biner = basis 2.'),
        ('Bilangan Biner', 'Bilangan biner 101 sama dengan desimal …', '5', ['3', '6', '101'], '1×4 + 0×2 + 1×1 = 5.'),
        ('Bilangan Biner', 'Bilangan desimal 6 dalam biner adalah …', '110', ['101', '011', '111'], '6 = 4 + 2 = 110.'),
        ('Bilangan Biner', 'Bilangan biner 1111 sama dengan desimal …', '15', ['4', '11', '16'], '8 + 4 + 2 + 1 = 15.'),
        ('Bilangan Biner', '1 byte terdiri dari …', '8 bit', ['2 bit', '10 bit', '16 bit'], '1 byte = 8 bit.'),
        ('Bilangan Biner', 'Bilangan biner 1000 sama dengan desimal …', '8', ['1.000', '4', '16'], 'Angka 1 di posisi keempat bernilai 2³ = 8.'),
        # Jaringan Komputer
        ('Jaringan Komputer', 'Jaringan komputer dalam satu gedung sekolah disebut …', 'LAN', ['WAN', 'Internet', 'Bluetooth'], 'LAN = Local Area Network, jangkauan kecil.'),
        ('Jaringan Komputer', 'Alat yang memancarkan WiFi di rumah atau sekolah adalah …', 'Router', ['Printer', 'Scanner', 'Proyektor'], 'Router menghubungkan perangkat ke jaringan.'),
        ('Jaringan Komputer', 'Alamat unik setiap perangkat di jaringan disebut …', 'Alamat IP', ['Nama file', 'Kata sandi', 'Nomor seri monitor'], 'Contoh alamat IP: 192.168.1.5.'),
        ('Jaringan Komputer', 'Kelebihan jaringan komputer adalah …', 'Bisa berbagi data dan printer', ['Komputer tidak perlu listrik', 'Tidak butuh kabel atau sinyal', 'Data tidak bisa hilang'], 'Jaringan memudahkan berbagi sumber daya.'),
        ('Jaringan Komputer', 'Kabel jaringan yang umum dipakai di LAN adalah kabel …', 'UTP', ['HDMI', 'VGA', 'Charger'], 'Kabel UTP dengan konektor RJ45.'),
        # Spreadsheet / Analisis Data
        ('Analisis Data', 'Aplikasi pengolah angka dalam bentuk tabel adalah …', 'Spreadsheet (misalnya Excel)', ['Paint', 'Browser', 'Pemutar video'], 'Spreadsheet untuk menghitung dan mengolah data.'),
        ('Analisis Data', 'Rumus Excel untuk menjumlahkan sel A1 sampai A5 adalah …', '=SUM(A1:A5)', ['=ADD(A1-A5)', 'SUM A1 A5', '=TOTAL(A1+A5)'], 'Fungsi SUM menjumlahkan rentang sel.'),
        ('Analisis Data', 'Rumus =AVERAGE(B1:B4) menghitung …', 'Rata-rata', ['Nilai terbesar', 'Jumlah', 'Nilai terkecil'], 'AVERAGE = rata-rata.'),
        ('Analisis Data', 'Pertemuan kolom C dan baris 3 disebut sel …', 'C3', ['3C', 'CC3', 'C:3'], 'Nama sel = huruf kolom + nomor baris.'),
        ('Analisis Data', 'Grafik yang paling cocok untuk menunjukkan persentase bagian dari keseluruhan adalah …', 'Diagram lingkaran', ['Diagram garis', 'Tabel kosong', 'Peta'], 'Diagram lingkaran menunjukkan bagian dari 100%.'),
        # Pemrograman blok
        ('Pemrograman Blok', 'Scratch adalah contoh bahasa pemrograman …', 'Berbasis blok', ['Mesin', 'Biner murni', 'Rakitan (assembly)'], 'Di Scratch kode disusun dari balok-balok.'),
        ('Pemrograman Blok', 'Wadah untuk menyimpan nilai, misalnya skor, disebut …', 'Variabel', ['Loop', 'Sprite', 'Browser'], 'Variabel menyimpan data yang bisa berubah.'),
        ('Pemrograman Blok', 'Skor awal 0. Setiap jawaban benar skor ditambah 10. Setelah 3 jawaban benar skornya …', '30', ['10', '13', '3'], '0 + 10 + 10 + 10 = 30.'),
        ('Pemrograman Blok', 'Perintah "ketika bendera hijau diklik" di Scratch dipakai untuk …', 'Memulai program', ['Menghapus program', 'Menyimpan file', 'Mematikan komputer'], 'Itu blok awal (event) untuk menjalankan program.'),
    ],
    '9': [
        # Percabangan
        ('Percabangan', 'JIKA hujan MAKA bawa payung. Struktur ini disebut …', 'Percabangan (if)', ['Perulangan', 'Variabel', 'Fungsi'], 'Percabangan memilih tindakan berdasarkan kondisi.'),
        ('Percabangan', 'JIKA nilai ≥ 75 MAKA "Lulus" SELAIN ITU "Remedial". Nilai 70 menghasilkan …', 'Remedial', ['Lulus', 'Error', 'Tidak ada'], '70 kurang dari 75, jadi masuk bagian "selain itu".'),
        ('Percabangan', 'JIKA x > 10 MAKA x = x - 5. Jika x = 12, nilai x akhir …', '7', ['12', '17', '5'], '12 > 10 benar, jadi 12 - 5 = 7.'),
        ('Percabangan', 'Kondisi "umur ≥ 17 DAN punya SIM" bernilai benar jika …', 'Kedua syarat terpenuhi', ['Salah satu syarat terpenuhi', 'Tidak ada syarat terpenuhi', 'Umur kurang dari 17'], 'Operator DAN (AND) butuh semua syarat benar.'),
        ('Percabangan', 'Kondisi "libur ATAU hujan" bernilai benar jika …', 'Minimal salah satu benar', ['Keduanya harus benar', 'Keduanya harus salah', 'Tidak pernah benar'], 'Operator ATAU (OR) cukup satu syarat benar.'),
        # Keamanan Akun
        ('Keamanan Akun', 'Kata sandi yang paling kuat adalah …', 'Kucing#Biru27!Rumah', ['123456', 'password', 'namaku'], 'Sandi kuat panjang dan campuran huruf, angka, simbol.'),
        ('Keamanan Akun', 'Pesan "Akunmu diblokir, klik link ini dan masukkan kata sandi" kemungkinan besar adalah …', 'Phishing (penipuan)', ['Pesan resmi', 'Iklan biasa', 'Pembaruan sistem'], 'Phishing memancing korban memberikan data pribadi.'),
        ('Keamanan Akun', 'Verifikasi dua langkah (2FA) berguna untuk …', 'Menambah lapisan keamanan akun', ['Mempercepat internet', 'Menghemat kuota', 'Menghapus virus'], 'Selain sandi, perlu kode tambahan.'),
        ('Keamanan Akun', 'Kode OTP dari bank sebaiknya …', 'Tidak diberikan kepada siapa pun', ['Diberikan ke petugas yang menelepon', 'Dibagikan di grup kelas', 'Ditulis di media sosial'], 'OTP bersifat rahasia.'),
        ('Keamanan Akun', 'Setelah memakai komputer di warnet atau lab, kita sebaiknya …', 'Keluar (logout) dari semua akun', ['Membiarkan akun tetap masuk', 'Menyimpan sandi di browser', 'Mematikan monitor saja'], 'Logout supaya akun tidak dipakai orang lain.'),
        ('Keamanan Akun', 'Program jahat yang merusak atau mencuri data disebut …', 'Malware', ['Firmware', 'Freeware', 'Hardware'], 'Malware termasuk virus, worm, trojan.'),
        # Data dan Informasi
        ('Data dan Informasi', 'Data yang sudah diolah sehingga bermakna disebut …', 'Informasi', ['Hardware', 'Bit', 'Kabel'], 'Data mentah diolah menjadi informasi.'),
        ('Data dan Informasi', 'Data nilai ulangan: 80, 70, 90. Rata-ratanya …', '80', ['70', '90', '240'], '(80 + 70 + 90) / 3 = 80.'),
        ('Data dan Informasi', 'Contoh data kualitatif adalah …', 'Warna favorit siswa', ['Tinggi badan', 'Jumlah buku', 'Suhu ruangan'], 'Data kualitatif berupa kategori, bukan angka.'),
        ('Data dan Informasi', 'Menyimpan salinan file penting di tempat lain disebut …', 'Backup (cadangan)', ['Format', 'Delete', 'Restart'], 'Backup mencegah data hilang.'),
        ('Data dan Informasi', 'Tempat menyimpan file secara daring, misalnya Google Drive, disebut …', 'Penyimpanan awan (cloud storage)', ['RAM', 'Prosesor', 'Monitor'], 'Cloud storage menyimpan file di server internet.'),
        # Dampak Sosial Informatika
        ('Dampak Sosial', 'Contoh dampak positif teknologi informasi adalah …', 'Belajar bisa dari mana saja', ['Kecanduan gim', 'Penyebaran hoaks', 'Kurang tidur'], 'TIK memudahkan akses belajar.'),
        ('Dampak Sosial', 'Jejak digital adalah …', 'Rekam aktivitas kita di internet yang sulit dihapus', ['Bekas sepatu di lantai', 'Kabel internet', 'Nama aplikasi'], 'Yang diunggah bisa tersimpan lama dan dilihat orang lain.'),
        ('Dampak Sosial', 'Kecerdasan buatan (AI) sebaiknya dipakai siswa untuk …', 'Membantu belajar dan tetap memeriksa hasilnya', ['Menyalin jawaban ujian', 'Membuat berita palsu', 'Meniru suara orang tanpa izin'], 'AI alat bantu, tetap perlu dipikirkan dan diperiksa.'),
        ('Dampak Sosial', 'Batas sehat bermain gawai untuk remaja adalah …', 'Diatur waktunya dan diselingi aktivitas fisik', ['Seharian penuh', 'Sampai larut malam', 'Saat pelajaran berlangsung'], 'Keseimbangan menjaga kesehatan mata dan tubuh.'),
        # Pemrograman
        ('Pemrograman', 'Bahasa pemrograman teks yang populer untuk pemula adalah …', 'Python', ['HTML Paint', 'Excel', 'Windows'], 'Python mudah dibaca dan banyak dipakai.'),
        ('Pemrograman', 'Pada Python, print("Halo") akan …', 'Menampilkan tulisan Halo', ['Mencetak ke printer', 'Menghapus kata Halo', 'Menyimpan file Halo'], 'print menampilkan teks ke layar.'),
        ('Pemrograman', 'Hasil dari 7 % 3 (sisa bagi) adalah …', '1', ['2', '3', '0'], '7 dibagi 3 = 2 sisa 1.'),
        ('Pemrograman', 'x = 5, lalu x = x + 3. Nilai x sekarang …', '8', ['5', '3', '53'], 'x diperbarui menjadi 5 + 3 = 8.'),
        ('Pemrograman', 'Kesalahan penulisan kode yang membuat program tidak bisa berjalan disebut …', 'Syntax error', ['Hardware error', 'Paper jam', 'Low battery'], 'Syntax error = salah aturan penulisan.'),
    ],
}


def bank():
    r = random.Random(2029)
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
