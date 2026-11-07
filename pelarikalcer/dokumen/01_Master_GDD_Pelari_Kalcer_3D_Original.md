# MASTER GAME DESIGN DOCUMENT (GDD): PELARI KALCER 3D
**Judul Proyek:** Pelari Kalcer 3D: Edisi Nusantara & Running Culture  
**Genre:** 3D Endless / Event Runner, Sports Simulation, Social MMORPG  
**Platform Target:** Mobile (iOS & Android) & WebGL (HTML5 Cross-Platform)  
**Orientasi Layar:** Landscape (Widescreen Horizontal) & Responsif Mobile  
**Kolaborasi Resmi:** Willo Apparel (`www.willoapparel.com/pelarikalcer`)

---

## 1. RINGKASAN EKSEKUTIF & VISI GAME
**Pelari Kalcer 3D** adalah game lari 3D yang mengangkat fenomena budaya lari modern di Indonesia (*Car Free Day / CFD, skena running crew, koleksi sepatu lari, disiplin pace, hingga kuliner pasca-lari*) ke dalam pengalaman bermain yang seru, membumi, dan kompetitif. 

Pemain tidak sekadar berlari menghindari rintangan, tetapi juga merasakan ritual pelari dunia nyata: melakukan pemanasan *ABC Drills*, menunggu sinyal jam tangan GPS mengunci (*GPS Green Light*), mengatur *pacing* dan stamina agar tidak terkena *The Wall*, mengambil isotonik di *Water Station*, hingga mencetak struk **Race Receipt (Finisher Card)** yang dapat diunduh dan dibagikan ke media sosial.

---

## 2. MEKANIK UTAMA & FISIOLOGI LARI (CORE GAMEPLAY)

### 2.1 Kontrol Taktis Dua Jempol (Landscape Ergonomic Controls)
*   **Jempol Kiri (Navigasi Jalur):**
    *   `⬅️ Kiri` / `➡️ Kanan`: Berpindah antara $3$ lajur jalan untuk menyalip kerumunan pelari (*peloton*), mengambil koin Garuda, atau menghindari rintangan jalanan.
*   **Jempol Kanan (Aksi & Kecepatan):**
    *   `⬆️ Lompat`: Melompati kerucut lalu lintas (*traffic cone*), pembatas jalan, atau lubang aspal/paving rusak.
    *   `⚡ Power Sprint`: Meningkatkan kecepatan lari secara drastis namun menguras bar Stamina lebih cepat ($2.3\times$ lipat).

### 2.2 Sistem Pemanasan: Mode Training (ABC Drills)
Sebelum memasuki lintasan lomba, pemain dapat mengikuti *mini-game* ketukan ritme (*tap cadence*) yang menyimulasikan gerakan pemanasan biomekanik lari:
1.  **High Knees:** Mengangkat lutut tinggi dengan postur dada tegap.
2.  **Butt Kicks & Arm Swing:** Menjaga ayunan siku tangan pada sudut ergonomis $90^\circ$.
3.  **A-Skips & Straight-Leg Bounds:** Mengoptimalkan frekuensi langkah (*cadence*).
*   **Reward Mekanik:** Menyelesaikan *ABC Drills* hingga $100\%$ memberikan efek **Warm-Up Pace Boost** ($+12\%$ kecepatan dasar).

### 2.3 Ritual Jam Tangan GPS (Real-Life Runner Behavior)
Meniru kebiasaan pelari sebelum mulai berlari di pagi hari:
*   Layar menampilkan jam tangan pintar olahraga pada pukul `10:08` (`Kamis, 17 Agu`) dengan indikator langkah `8420`.
*   Lingkaran sensor awalnya berwarna merah (`MENCARI GPS...`), lalu berubah menjadi hijau menyala (`GPS LOCKED`) disertai bunyi peluit/bip jam sebelum karakter melesat di lintasan.

### 2.4 Manajemen Stamina, Fase "The Wall", dan Drafting Train
*   **Stamina Bar Dinamis:** Bergradasi dari hijau ke kuning hingga merah.
*   **Fase "The Wall" (Stamina $< 22\%$):** Jika pemain memaksakan *sprint* tanpa menjaga hidrasi, karakter akan mengalami kelelahan ekstrem (*hitting the wall*). Postur tubuh membungkuk, kecepatan turun hingga $35\%$, dan muncul peringatan visual.
*   **Drafting Train (Slipstream):** Berlari tepat di belakang NPC pelari lain (*peloton*) dalam jarak dekat akan memotong hambatan angin dan menghemat konsumsi Stamina sebesar $15\%$.

---

## 3. WATER STATION & QUICK TIME EVENT (QTE)
*   Muncul di pertengahan rute (sekitar jarak $0.45\text{ KM} - 0.65\text{ KM}$) dengan gerbang biru bertuliskan **Water Station**.
*   **Notifikasi Interaktif:** Muncul pop-up *"💧 DEPAN ADA WATER STATION! Ambil Isotonik!"*.
*   **Efek Klaim QTE:** Menekan tombol tepat waktu akan memulihkan $+35\%$ Stamina dan memberikan bonus $+50$ Koin.

---

## 4. SPESIFIKASI KARAKTER & KUSTOMISASI MODULAR (3D TURNAROUND)

Karakter dirancang dengan sistem modular yang dapat diinspeksi dari **5 Sudut Pandang Asset Sheet** (*Tampak Depan, Tampak Belakang, Tampak Samping, Tampak Atas, dan Tampak Bawah/Sol*) serta rotasi bebas $360^\circ$.

### 4.1 Profil Karakter Utama
1.  **Pelari Pria:** Postur atletis proporsional, potongan rambut *taper fade* dengan *sport headband* hitam, celana pendek *split running shorts* hitam bergaris putih, kaos kaki lari putih.
2.  **Pelari Wanita:** Postur atletis dengan *white sport visor cap*, rambut *high ponytail*, *running waist bag* (tas pinggang), serta celana *split shorts* yang dipadukan dengan *full-length compression leggings* hitam.

### 4.2 Pilihan Jersey & Apparel Utama
1.  **Jersey Merah Putih Nasional (Edisi Garuda):**
    *   *Tampak Depan:* Kombinasi putih-merah diagonal di bagian bawah, kerah dan lengan merah dengan list putih, serta bendera Merah Putih di dada kiri.
    *   *Tampak Belakang:* Latar merah menyala dengan siluet besar **Burung Garuda Putih** di punggung.
2.  **Singlet Hitam Pelari Kalcer (Willo Apparel Official Collab):**
    *   *Tampak Depan:* Singlet aerodinamis hitam dengan tipografi kuning **PELARI KALCER** dan nomor dada **Skena BIB `#0088`**.
    *   *Tampak Belakang:* Branding **WILLO APPAREL** & identitas komunitas.

### 4.3 Slot Aksesoris Tambahan
*   **Tas Ransel Lari:** Ransel merah *sporty* di punggung.
*   **Handuk Leher:** Handuk olahraga dwiwarna Merah-Putih.
*   **Tas Hidrasi (Hydration Vest Lokal):** Rompi lari hitam dengan $2$ botol air (*soft flask*) di dada depan.

---

## 5. KATALOG SEPATU LARI & JAM TANGAN PINTAR

### 5.1 Asset Sepatu Lari (Lengkap dengan Tekstur Outsole Bawah)
| Nama Sepatu | Kombinasi Warna | Spesialisasi & Efek Status |
| :--- | :--- | :--- |
| **1. Sepatu 1 (Putih Merah)** | Putih, Aksen Merah, Sol Abu | Edisi Indonesia • Pace Dasar $+20\%$ |
| **2. Sepatu 2 (Hitam Merah)** | Hitam Pekat, Aksen Merah, Sol Putih | Carbon Speed • Kecepatan Sprint $+25\%$ |
| **3. Sepatu 3 (Biru Putih)** | Biru Elektrik, Aksen Biru Muda, Sol Putih | Daily Cruiser • Efisiensi Pace $+18\%$ |
| **4. Sepatu 4 (Hijau Army)** | Hijau Army, Aksen Lime, Sol Krem | Trail Grip • Pace $+22\%$ & **Kebal Lubang Jalan/Batu** |
| **5. Nyx Hyperfoam (Grail)** | Merah Menyala, Aksen & Sol Kuning | Super-Shoe Gacha • Pace Dasar $+30\%$ |
| **6. Solomate Carbon** | Hijau Neon, Garis Hitam, Sol Lime | Aero Plate • Pace Dasar $+28\%$ |

### 5.2 Asset Jam Tangan Pintar (Smartwatch `10:08`)
*   Menampilkan layar bundar digital `10:08`, tanggal `Kamis, 17 Agu`, ikon pelari merah, dan penghitung langkah `8420`.
*   Tersedia dalam **4 Varian Warna Strap:**
    1.  **Varian 1:** Hitam (*Stealth Black*)
    2.  **Varian 2:** Putih (*Clean White*)
    3.  **Varian 3:** Merah (*Garuda Red*)
    4.  **Varian 4:** Hijau Army (*Outdoor Olive*)

---

## 6. DESAIN 7 LINTASAN (TRACK) & LANDMARK NUSANTARA

Setiap lintasan memiliki palet warna permukaan jalan, cuaca pagi yang cerah, elevasi berbeda, serta objek samping jalan khas Indonesia:

1.  **Lintasan 1: Jalan Aspal (Sudirman CFD Pagi)**
    *   *Suasana:* Jalan raya aspal abu-abu gelap dengan marka putih, trotoar, **Angkot Hijau**, dan **Gerobak Jajanan Bakso**.
    *   *Elevasi:* $+14\text{ m}$.
2.  **Lintasan 2: Jalan Tanah (Pedesaan & Joglo)**
    *   *Suasana:* Jalur tanah cokelat dengan rumput hijau, batu alam, dan arsitektur **Rumah Joglo**.
    *   *Elevasi:* $+28\text{ m}$.
3.  **Lintasan 3: Pantai (Sanur Bali)**
    *   *Suasana:* Jalur pasir kuning di tepi air laut biru jernih dengan gerbang ikonik **Candi Bentar (Bali Gate)**.
    *   *Elevasi:* $+8\text{ m}$.
4.  **Lintasan 4: Kota (Monas & Jalur Sepeda)**
    *   *Suasana:* Jalanan perkotaan modern dengan **Tugu Monas**, lampu jalan klasik, bangku taman, dan sepeda.
    *   *Elevasi:* $+12\text{ m}$.
5.  **Lintasan 5: Hutan (Borobudur Trail)**
    *   *Suasana:* Jalur tanah hutan rimbun dengan pepohonan teduh dan kemegahan **Candi Borobudur**.
    *   *Elevasi:* $+65\text{ m}$.
6.  **Lintasan 6: Jembatan (Flyover Merah Putih)**
    *   *Suasana:* Lintasan jembatan layang dengan pagar pembatas baja berwarna Merah-Putih.
    *   *Elevasi:* $+24\text{ m}$.
7.  **Lintasan 7: Rel Kereta (Heritage Track)**
    *   *Suasana:* Jalur inspeksi di samping rel baja dan bantalan kayu kereta api.
    *   *Elevasi:* $+19\text{ m}$.

*Objek Pendukung Lainnya di Lintasan:* **Bendera Merah Putih** berkibar di tiang, **Rambu Jalan Hijau (`Jakarta ➔ / ⬅ Bandung`)**, **Kerucut Lalu Lintas (Traffic Cone)**, dan **Lubang Jalan / Paving Rusak**.

---

## 7. ITEM KOLEKSI, KULINER SKENA & POWER-UP LINTASAN

### 7.1 Item Koleksi & Kuliner (Toko Skena)
*   🍼 **Botol Minum (Isotonik Biru):** Mengisi ulang penuh Stamina ke $100\%$ ($150$ Koin).
*   ⚡ **Energy Gel (Kemasan Merah):** Meningkatkan kecepatan lari sebesar $+14\%$ ($200$ Koin).
*   🍌 **Pisang:** Menambah cadangan $+1$ Heart / Nyawa ($100$ Koin).
*   ☕ **Kopi Skena Kaki (Es Kopi Cup Plastik):** Mengurangi pengurasan Stamina sebesar $25\%$ ($250$ Koin).
*   🍜 **Bakmi Carbo-Load (Mangkok Ayam Jago):** *Carbo-loading buff* yang meningkatkan kecepatan sebesar $+18\%$ ($300$ Koin).
*   🎁 **Loot Box Garuda (Peti Merah Putih):** Kotak *gacha* berhadiah Koin Garuda melimpah dan bonus Heart ($500$ Koin).

### 7.2 Pickup Aktif di Atas Lintasan
*   🪙 **Koin Emas Garuda:** Mata uang utama yang berputar di sepanjang jalur ($+25$ Koin).
*   ⚡ **Power Up (Petir Hijau):** Memulihkan $+30\%$ Stamina secara instan saat disentuh.
*   🧲 **Magnet (Merah-Putih):** Menarik seluruh Koin Garuda di semua jalur secara otomatis selama $8\text{ detik}$.
*   🛡️ **Shield (Perisai Biru):** Melindungi pelari dari $1\times$ benturan *traffic cone* atau lubang jalan selama $8\text{ detik}$.
*   ❤️ **Heart (Hati Merah):** Menambah $+1$ nyawa pelari.

---

## 8. FITUR KOMUNITAS & VIRAL LOOP (FINISHER RACE RECEIPT)

Setiap kali pemain menyelesaikan lari ($1.00\text{ KM}$ pada mode *vertical slice* / $5\text{K}$ event), game menghasilkan **Finisher Card** berbentuk **Struk Kertas Putih (Race Receipt)** yang memuat:
1.  **Identitas Pelari:** Username (`SkenaRunner_ID`), Nomor Dada (`BIB #0088`), serta Jersey dan Sepatu yang digunakan.
2.  **Telemetri Lari:** *Average Pace* (misal $4:45\text{ /km}$), *Elevation Gain* ($+\text{m}$), *Waktu Tempuh*, dan *Kalori Terbakar* ($\text{kcal}$).
3.  **Integrasi Kampanye Web:** Tautan langsung ke `www.willoapparel.com/pelarikalcer` beserta kode QR pendaftaran komunitas.
4.  **Fitur Ekspor Instan:** Tombol **Unduh Struk (`.PNG`)** untuk langsung menyimpan gambar struk ke HP/PC dan tombol **Salin Caption** untuk dibagikan ke Instagram Story, Reels, atau TikTok.