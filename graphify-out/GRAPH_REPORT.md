# Graph Report - willoapparel  (2026-11-10)

## Corpus Check
- 118 files · ~827,130 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 34 file(s) not represented in the graph (top: .xml 11, (none) 7, .glb 5)

## Summary
- 2811 nodes · 6486 edges · 124 communities (107 shown, 17 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 187 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `38baf3c5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- duniakotak/js/desa.js
- mabar/game.js
- worker.js
- paud/src/inti.js
- kotak
- mabar/js/desa.js
- lintasan.js
- box
- render.js
- ktp.js
- animSkill
- binatang/game.js
- pasangPeta
- tanaman.js
- main.js
- security-check.yml
- toast
- bangunDunia
- bentuk/game.js
- tlaga.js
- angka/game.js
- with
- rnd
- huruf/game.js
- esc
- hitung-rpg/game.js
- langkahMusik
- steps
- putar.js
- acak
- tulisMisi
- Vox
- rumah.js
- json
- script.js
- src/game.js
- gambarGuru
- siapPanggung
- english/game.js
- paper-trading
- animasi
- loop
- info
- info
- bank.py
- dunia.js
- main.go
- smp/src/inti.js
- hitung/game.js
- $
- isiMenu
- bot.py
- petualang.js
- mulai
- reli.js
- panel.py
- mulaiRute
- unit_economics.py
- segara.js
- .layani
- mulaiTarung
- bangun.js
- inti-sd.js
- akhirSesi
- pelayaran-nusantara.js
- kotak
- simpan
- coding-quest.js
- bukaJawaban
- pelari.js
- desaGabung.js
- mulai
- bersama.js
- soalMisi
- van_westendorp.py
- lab-ajaib.js
- random
- acak
- menara-hitung.js
- ikon.js
- mulaiMain
- smp/package.json
- english-quest.js
- pelarikalcer/package.json
- pasangGuru
- paud/package.json
- Warga
- Ruang
- loop
- jalankan
- jalan.js
- kabarBaru
- reseed
- kotakBulat.js
- V3
- kelasduniakotak
- langkah
- warga
- pose
- wargaNpc.js
- selesai
- buatMobil
- buatNPC
- ref_three
- finish
- with
- bangunKavling
- fisika
- aplikasi-android/package.json
- loop
- yTanah
- ExampleInstrumentedTest.java
- cekSalip
- MainActivity.java

## God Nodes (most connected - your core abstractions)
1. `box()` - 73 edges
2. `toast()` - 51 edges
3. `$` - 47 edges
4. `Warga` - 44 edges
5. `mulai()` - 43 edges
6. `bunyi()` - 39 edges
7. `aturHUD()` - 39 edges
8. `V3()` - 39 edges
9. `rnd()` - 38 edges
10. `box()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `tulis()` --indirect_call--> `KUNCI()`  [INFERRED]
  pelarikalcer/src/game.js → edukasi/smp/src/inti.js
- `ukur()` --indirect_call--> `tegak()`  [INFERRED]
  pelarikalcer-kotak/src/main.js → edukasi/paud/src/inti.js
- `buatSiswa()` --calls--> `warga()`  [EXTRACTED]
  edukasi/smp/src/inti.js → public/duniakotak/mabar/js/aset/avatar.js
- `rumah()` --calls--> `rumahMesh()`  [EXTRACTED]
  pelarikalcer-kotak/src/main.js → public/duniakotak/mabar/js/aset/rumah.js
- `kucing()` --calls--> `kucingMesh()`  [EXTRACTED]
  pelarikalcer-kotak/src/main.js → public/duniakotak/mabar/js/aset/kucing.js

## Import Cycles
- None detected.

## Communities (124 total, 17 thin omitted)

### Community 0 - "duniakotak/js/desa.js"
Cohesion: 0.06
Nodes (108): ANIM, base(), bigYard(), blockWorld(), blue(), boxHouse(), btree(), C01() (+100 more)

### Community 1 - "mabar/game.js"
Cohesion: 0.02
Nodes (128): ADMOB, AK, AL, ALBUM, ALBUM_IKAN, ASET_CALON, ATASAN, AWAL_DUSUN (+120 more)

### Community 2 - "worker.js"
Cohesion: 0.04
Nodes (50): AKHIRAN, ALBUM_IKAN, apiWarga(), apiWargaInti(), bacaAkun(), BANGUN_SEKARANG, BARANG, bersihUn() (+42 more)

### Community 3 - "paud/src/inti.js"
Cohesion: 0.05
Nodes (31): aturMusik(), bersihRonde(), bisaKetuk, _bx, daftarKetuk(), DATA_BAWAAN, efek, FONT (+23 more)

### Community 4 - "kotak"
Cohesion: 0.33
Nodes (7): debu(), kotak(), munculBagian(), NPC, siapAvatar(), susunPunggung(), tumbuhSampai()

### Community 5 - "mabar/js/desa.js"
Cohesion: 0.06
Nodes (43): ANIM, blockWorld(), C01(), carve(), catFace(), CG, clock(), clockTex() (+35 more)

### Community 6 - "lintasan.js"
Cohesion: 0.09
Nodes (47): akarSamping(), angkot(), batuBesar(), borobudur(), bromo(), candiBentar(), candiBorobudur(), candiKecil() (+39 more)

### Community 7 - "box"
Cohesion: 0.24
Nodes (44): kayu(), arenaLari(), bangku(), BAWAH, bunga(), daun(), fin(), G() (+36 more)

### Community 8 - "render.js"
Cohesion: 0.16
Nodes (26): buatDaftar(), foto(), g(), handuk(), jam(), kanvas(), lootBox(), M() (+18 more)

### Community 9 - "ktp.js"
Cohesion: 0.14
Nodes (20): alamat(), ATASAN, avAcak(), BAWAHAN, bersihAv(), dusun(), foto(), gambarKTP() (+12 more)

### Community 10 - "animSkill"
Cohesion: 0.12
Nodes (20): animPutar(), animSkill(), arenaLari(), bisaJual(), bisaPanen(), bisaTanam(), dekatAir(), dekatGapuraCFD() (+12 more)

### Community 11 - "binatang/game.js"
Cohesion: 0.13
Nodes (23): benar(), buatHewan(), buatMakanan(), bunyiHewan(), dodo, HEWAN_ADA, hewanDiKandang(), infoHewan() (+15 more)

### Community 12 - "pasangPeta"
Cohesion: 0.35
Nodes (12): buatPeta(), bukaPeta(), fotoUdaraPeta(), gambarPetaBesar(), gambarPetaMini(), keP(), pasangPeta(), pilihFasum() (+4 more)

### Community 13 - "tanaman.js"
Cohesion: 0.18
Nodes (23): bibit(), cabai(), CG, cubes(), DAFTAR_TANAMAN, grassBed(), hsl(), island() (+15 more)

### Community 14 - "main.js"
Cohesion: 0.03
Nodes (75): A, akar(), AKOR, ATAP, BALAS, BALON, batu(), BAWAH (+67 more)

### Community 15 - "security-check.yml"
Cohesion: 0.09
Nodes (21): concurrency, cancel-in-progress, group, jobs, syntax-and-regression, name, on, pull_request (+13 more)

### Community 16 - "toast"
Cohesion: 0.10
Nodes (57): aksiWillo(), ALBUM_PANEN(), albumBaru(), albumHitung(), albumPunya(), ambilHadir(), api(), aturAlbum() (+49 more)

### Community 17 - "bangunDunia"
Cohesion: 0.15
Nodes (26): aturProyek(), bakeGroup(), bangunAktif(), bangunCurug(), bangunDunia(), bangunKulon(), bangunProksi(), bangunSegara() (+18 more)

### Community 18 - "bentuk/game.js"
Cohesion: 0.18
Nodes (16): benar(), bendaBentuk(), BENTUK, bentukVoxel(), garisBentuk(), kotakMainan(), lala, mulaiMain() (+8 more)

### Community 19 - "tlaga.js"
Cohesion: 0.15
Nodes (23): curug(), FASUM_TERAS, aturTipis(), fasum2(), hutan(), hutanPts(), lot2(), nameTex() (+15 more)

### Community 20 - "angka/game.js"
Cohesion: 0.22
Nodes (18): awan, benar(), BUAH, buatBuah(), buatKeranjang(), KATA, mulaiMain(), NAMA_BUAH (+10 more)

### Community 21 - "with"
Cohesion: 0.11
Nodes (17): runs-on, steps, timeout-minutes, jobs, deploy-staging, name, on, workflow_dispatch (+9 more)

### Community 22 - "rnd"
Cohesion: 0.13
Nodes (19): hutanRing(), stoneBase(), chest(), dust(), faces, flashlight(), floor(), gc (+11 more)

### Community 23 - "huruf/game.js"
Cohesion: 0.23
Nodes (14): awan, bima, jawabCari(), jenisRonde(), kataHTML(), mulaiMain(), putaran(), rondeCari() (+6 more)

### Community 24 - "esc"
Cohesion: 0.08
Nodes (38): alamat(), ambilPiala(), bisaKerja(), bukaLombaRumah(), bukaPiala(), bukaProfesi(), bukaRakit(), bukaSoal() (+30 more)

### Community 25 - "hitung-rpg/game.js"
Cohesion: 0.04
Nodes (47): AIR, ANTRE, _arah, awan, balai, BARANG, BATAS, buatNpc() (+39 more)

### Community 26 - "langkahMusik"
Cohesion: 0.14
Nodes (14): aturVolMusik(), bunyiAlat(), bunyiHat(), bunyiKick(), frek(), langkahMusik(), layarMulai(), layarSelesai() (+6 more)

### Community 27 - "steps"
Cohesion: 0.14
Nodes (13): runs-on, steps, jobs, indexnow, name, on, push, workflow_dispatch (+5 more)

### Community 28 - "putar.js"
Cohesion: 0.24
Nodes (10): asliH(), asliW(), gH, gW, kelasMedia(), kunciLandscape(), perlu(), terapkan() (+2 more)

### Community 29 - "acak"
Cohesion: 0.21
Nodes (12): acak(), awanVoxel(), batuVoxel(), konfeti(), kotak(), lempeng(), mataK(), pilih() (+4 more)

### Community 30 - "tulisMisi"
Cohesion: 0.15
Nodes (20): animPasar(), bangunPasar(), barisHadir(), barisMenit(), barisPemula(), daftarSesi(), infoKumpul(), jamKumpul() (+12 more)

### Community 31 - "Vox"
Cohesion: 0.33
Nodes (4): alasBatu(), bungaVoxel(), geoKubus(), Vox

### Community 32 - "rumah.js"
Cohesion: 0.21
Nodes (23): warungDepan(), ambil(), at(), atapPelana(), BENTUK, box(), DAFTAR_RUMAH, DEF (+15 more)

### Community 33 - "json"
Cohesion: 0.11
Nodes (13): bundel(), main(), html_rpg(), html_sd(), main(), bundel(), data_game(), rakit_game() (+5 more)

### Community 34 - "script.js"
Cohesion: 0.22
Nodes (8): fadeEls, fadeObserver, hamburger, navbar, navItems, navLinks, observer, sections

### Community 35 - "src/game.js"
Cohesion: 0.04
Nodes (63): CHAT_AWAL, CHAT_BANK, EXPO_BOOTHS, GAMBAR_GEAR, GEAR_CATALOG, GEAR_TABS, HAIR_COLORS, HAIRSTYLES (+55 more)

### Community 36 - "gambarGuru"
Cohesion: 0.25
Nodes (8): acakInt(), ajakanBeli(), aturBintang(), bacaDraf(), bukaGerbangGuru(), bukaGuru(), gambarGuru(), pasangGuru()

### Community 37 - "siapPanggung"
Cohesion: 0.29
Nodes (7): gradasi(), objekDi(), pasangKetuk(), posisiPilihan(), siapPanggung(), tegak(), ukur()

### Community 38 - "english/game.js"
Cohesion: 0.04
Nodes (36): awan, bayu, katak, kebun, kolam, kupu, menara, petani (+28 more)

### Community 39 - "paper-trading"
Cohesion: 0.04
Nodes (48): concurrency, cancel-in-progress, group, run, BOT_FOLDER, GH_TOKEN, cache, folder (+40 more)

### Community 40 - "animasi"
Cohesion: 0.40
Nodes (5): animasi(), goyang(), lompat(), muncul(), terbangKe()

### Community 41 - "loop"
Cohesion: 0.33
Nodes (6): batasUI(), bingkaiDrone(), layarLebar(), loop(), updatePartikel(), updateTween()

### Community 44 - "bank.py"
Cohesion: 0.09
Nodes (36): akar(), aljabar_sederhana(), bank(), bulat(), bulat_cerita(), desimal_persen(), fmt(), garis_titik() (+28 more)

### Community 45 - "dunia.js"
Cohesion: 0.11
Nodes (31): bangunDunia(), gapuraGambar(), strip(), CADANGAN_LANTAI, LANTAI_HUDA, TEX, tex(), texAsap (+23 more)

### Community 46 - "main.go"
Cohesion: 0.07
Nodes (13): acakHex(), alamatLokal(), bersihNama(), bukaBrowser(), dariLaptopIni(), layaniGuru(), layaniMurid(), layaniWS() (+5 more)

### Community 47 - "smp/src/inti.js"
Cohesion: 0.06
Nodes (29): animasi(), ATUR, buatSiswa(), bunyiAlat(), dasiSMP(), DATA_BAWAAN, efek, frek() (+21 more)

### Community 48 - "hitung/game.js"
Cohesion: 0.10
Nodes (36): awan, BARANG, barangDari(), benar(), buatUang(), dimas, gerbang, jawabanDari() (+28 more)

### Community 49 - "$"
Cohesion: 0.13
Nodes (23): ambil(), ambilIsotonik(), aturUlangAngin(), chatMasuk(), gambarNyawa(), kameraIkut(), ketukDrill(), langkah() (+15 more)

### Community 51 - "isiMenu"
Cohesion: 0.16
Nodes (25): aktif, apiPk(), aturWarga(), bayar(), cukup(), daftarMisi(), gantiPemain(), hargaPm() (+17 more)

### Community 52 - "bot.py"
Cohesion: 0.14
Nodes (24): ambil_json(), angka(), beli(), boleh_beli(), cari_dan_beli(), catat_riwayat(), cek_rugcheck(), data_hari_ini() (+16 more)

### Community 53 - "petualang.js"
Cohesion: 0.14
Nodes (33): adaEmoji(), AYO, bacaKelompok(), benarPT(), DEPAN, esc(), JENIS_UMUM, KANAN (+25 more)

### Community 54 - "mulai"
Cohesion: 0.09
Nodes (46): KUNCI(), aksiBooth(), aturMain(), audio(), avatar(), bersihkanEfek(), biayaUpgrade(), buka() (+38 more)

### Community 55 - "reli.js"
Cohesion: 0.05
Nodes (41): baca(), bekas, cam, debu, _E, GARIS, GERBANG_OBJ, GIGI (+33 more)

### Community 56 - "panel.py"
Cohesion: 0.17
Nodes (19): _answer_ok(), check(), deal(), init(), load_state(), main(), _num(), PanelError (+11 more)

### Community 57 - "mulaiRute"
Cohesion: 0.11
Nodes (31): bebas(), bukaLift(), bukaPasar(), bukaTanam(), dekatItem(), dekatPasar(), gambarGaris(), hapusGaris() (+23 more)

### Community 58 - "unit_economics.py"
Cohesion: 0.17
Nodes (15): analyse(), load(), main(), _money(), NumbersError, report(), sensitivity(), _sum() (+7 more)

### Community 59 - "segara.js"
Cohesion: 0.14
Nodes (19): COLX, DERMAGA, FASUM_PETAK, FO(), kanvas(), kodeUnit(), LANTAI_HUNI, noDari() (+11 more)

### Community 60 - ".layani"
Cohesion: 0.13
Nodes (9): albumBit(), dusunNo(), hariWib(), menitWib(), mingguWib(), misiHari(), pasarBuka(), pkMisiHari() (+1 more)

### Community 61 - "mulaiTarung"
Cohesion: 0.18
Nodes (24): aturFokusTarung(), banner(), bebas(), bicaraKoki(), bicaraSari(), bukaTas(), bukaToko(), kalah() (+16 more)

### Community 62 - "bangun.js"
Cohesion: 0.07
Nodes (33): apiB(), BAHAN, BLN, cakram, cam, catatSesi(), cincin, DEBU (+25 more)

### Community 63 - "inti-sd.js"
Cohesion: 0.12
Nodes (10): aturNyawa(), bacaAngka(), bintangFase(), FASE, kunciSimpan(), kurangNyawa(), papanAngka(), pilihFase() (+2 more)

### Community 64 - "akhirSesi"
Cohesion: 0.23
Nodes (21): akhirSesi(), alamatMurid(), aturBermain(), esc(), gambarLobi(), gambarQR(), lanjutSoal(), layarAtur() (+13 more)

### Community 65 - "pelayaran-nusantara.js"
Cohesion: 0.16
Nodes (19): aturPosisi(), bangunKapal(), bangunPeta(), gx(), gz(), jarakRuas(), jawabanKini(), kapalVoxel() (+11 more)

### Community 66 - "kotak"
Cohesion: 0.11
Nodes (33): bangunDunia(), buang(), buatNPC(), buatPemain(), fotoMedali(), gapura(), gengsiAktif(), isiLintasan() (+25 more)

### Community 67 - "simpan"
Cohesion: 0.19
Nodes (19): akhirCerita(), aturMisi(), bangunJembatan(), bicara(), bicaraLurah(), bicaraMbah(), bicaraTukang(), bukaGerbang() (+11 more)

### Community 68 - "coding-quest.js"
Cohesion: 0.20
Nodes (17): aturPosisi(), bangunLintas(), bangunRobot(), jawabanKini(), layarJawab(), layarSiap(), layarSoal(), lebarPetak() (+9 more)

### Community 69 - "bukaJawaban"
Cohesion: 0.18
Nodes (19): angka(), bukaJawaban(), gambarHitungJawab(), gambarJawabTim(), gambarPapan(), keadaanUntuk(), keMurid(), kirimKeadaanKe() (+11 more)

### Community 70 - "pelari.js"
Cohesion: 0.27
Nodes (17): buatPelari(), kaki(), lengan(), cGeo, cLathe, cMat, cTex, geo() (+9 more)

### Community 71 - "desaGabung.js"
Cohesion: 0.18
Nodes (14): ARAH(), CABANG, global(), IKON, IMG, keGambar(), LETAK, panjang() (+6 more)

### Community 72 - "mulai"
Cohesion: 0.13
Nodes (27): avAcak(), avKerja(), bersihAv(), buatAvatarObj(), bukaPembuatAvatar(), bukaProfil(), dialogRaka(), fotoAvatar() (+19 more)

### Community 73 - "bersama.js"
Cohesion: 0.17
Nodes (7): _asap, buatEnt(), _ga, hapusEnt(), M, pasangHookUmum(), rupaTim()

### Community 74 - "soalMisi"
Cohesion: 0.25
Nodes (8): ambilSoal(), catatJawab(), opsiAngka(), soalAcak(), soalMisi(), soalPilihan(), tampilSoal3(), ubahSoal()

### Community 75 - "van_westendorp.py"
Cohesion: 0.24
Nodes (8): analyse(), cross(), curves(), _f(), main(), PricingError, read(), report()

### Community 76 - "lab-ajaib.js"
Cohesion: 0.24
Nodes (10): aturPosisi(), bangunTabung(), jawabanKini(), kaca(), labu(), pasangAlat(), siapkanDunia(), topikKe() (+2 more)

### Community 77 - "random"
Cohesion: 0.21
Nodes (4): bank(), bank(), bank(), bank()

### Community 78 - "acak"
Cohesion: 0.19
Nodes (13): acak(), acakInt(), awan(), bukaGerbangGuru(), bukaGuru(), di(), konfeti(), kotak() (+5 more)

### Community 79 - "menara-hitung.js"
Cohesion: 0.21
Nodes (9): aturPosisi(), bangunMenara(), buatEnt(), hapusEnt(), M, POS_PETAK, rupaTim(), siapkanDunia() (+1 more)

### Community 80 - "ikon.js"
Cohesion: 0.21
Nodes (12): cache, EMO, esc(), gambarIkon(), ikonkan(), namaEmoji(), PAL, pasangIkonOtomatis() (+4 more)

### Community 81 - "mulaiMain"
Cohesion: 0.21
Nodes (12): cekContoh(), keMenuFase(), kunciSave(), muat(), mulaiMain(), pasangHero(), pilihHero(), pilihMapel() (+4 more)

### Community 82 - "smp/package.json"
Cohesion: 0.24
Nodes (10): description, devDependencies, esbuild@0.24.0, qrcode-generator@1.4.4, three@0.169.0, esbuild, qrcode-generator, three (+2 more)

### Community 83 - "english-quest.js"
Cohesion: 0.29
Nodes (10): aturKamera(), aturPosisi(), bangunJalan(), jawabanKini(), LAJUR, rumahToko(), siapkanDunia(), TOKO (+2 more)

### Community 84 - "pelarikalcer/package.json"
Cohesion: 0.24
Nodes (10): description, devDependencies, esbuild@0.24.0, qrcode-generator@1.4.4, three@0.169.0, esbuild, qrcode-generator, three (+2 more)

### Community 85 - "pasangGuru"
Cohesion: 0.27
Nodes (10): bacaTempel(), bersihDraf(), daftarTopik(), gambarGuru(), kocok(), KUNCI_BANK(), normKelas(), pasangGuru() (+2 more)

### Community 86 - "paud/package.json"
Cohesion: 0.28
Nodes (8): description, devDependencies, esbuild@0.24.0, three@0.169.0, esbuild, three, name, private

### Community 88 - "Ruang"
Cohesion: 0.24
Nodes (5): kataKasar(), rapatKata(), Ruang, saringChat(), teksKaos()

### Community 89 - "loop"
Cohesion: 0.12
Nodes (20): aturKualitas(), bolaBuat(), bolaLapangan(), bolaTendang(), bolaTerima(), bolaUpdate(), cekDalamFasum(), cekMisiDekat() (+12 more)

### Community 90 - "jalankan"
Cohesion: 0.15
Nodes (16): aturJeda(), aturMusik(), cekServer(), infoLobi(), jalankan(), kirim(), loop(), pasangHUD() (+8 more)

### Community 91 - "jalan.js"
Cohesion: 0.29
Nodes (3): { chromium }, fs, path

### Community 92 - "kabarBaru"
Cohesion: 0.16
Nodes (22): ambilAjakSingkat(), aturHadir(), baca(), bacaJ(), bukaAjak(), bukaMisi(), bukaPeringkat(), bukaVoting() (+14 more)

### Community 93 - "reseed"
Cohesion: 0.31
Nodes (19): base(), blue(), cat(), CATSHOT(), cloud(), DRONE(), droneWorld(), HOOK() (+11 more)

### Community 96 - "V3"
Cohesion: 0.24
Nodes (23): bigYard(), boxHouse(), btree(), cropField(), cubes(), fasumLot(), fruitTree(), hsl() (+15 more)

### Community 98 - "langkah"
Cohesion: 0.14
Nodes (22): ambil(), ambilAir(), angkaTier(), aturKilau(), bunyi(), gagal(), geser(), hitungMundur() (+14 more)

### Community 99 - "warga"
Cohesion: 0.33
Nodes (12): box(), dada(), gc, hijab(), limb(), lukisSablon(), rambut(), rnd() (+4 more)

### Community 100 - "pose"
Cohesion: 0.30
Nodes (12): bunyi(), esc(), kabar(), langkah(), loop(), misiSelesai(), mulaiKerja(), pasangTanda() (+4 more)

### Community 101 - "wargaNpc.js"
Cohesion: 0.32
Nodes (10): alat(), buatWargaNPC(), aturGotong(), isi(), setProyek(), kotak(), lepasTukang(), mat() (+2 more)

### Community 102 - "selesai"
Cohesion: 0.14
Nodes (20): bukaLaci(), bukaRayakan(), fmtWaktu(), gambarStory(), hud(), isiMaps(), isiPapan(), isiRute() (+12 more)

### Community 103 - "buatMobil"
Cohesion: 0.21
Nodes (13): buatMobil(), gantiWarna(), garisTepi(), jerami(), kotak(), kotakKotak(), matS(), nomorTex() (+5 more)

### Community 104 - "buatNPC"
Cohesion: 0.38
Nodes (9): buatNPC(), dalam(), gayaDiam(), jalanKe(), langkah(), mainBola(), pilihTuju(), update() (+1 more)

### Community 105 - "ref_three"
Cohesion: 0.22
Nodes (6): cam, d, g, r, sc, DATA

### Community 106 - "finish"
Cohesion: 0.26
Nodes (12): apiR(), bunyi(), esc(), finish(), jamTeks(), lewatGerbang(), mulaiBalap(), siapSuara() (+4 more)

### Community 107 - "with"
Cohesion: 0.07
Nodes (29): defaults, runs-on, steps, timeout-minutes, run, jobs, apk, name (+21 more)

### Community 108 - "bangunKavling"
Cohesion: 0.08
Nodes (33): aturKavling(), bangunKavling(), bangunUlangKavling(), bangunUnitSegara(), buang(), buatInterior(), catKavling(), cekDalamRumah() (+25 more)

### Community 109 - "fisika"
Cohesion: 0.24
Nodes (10): fisika(), kabar(), kamera(), letup(), proyeksi(), semburDebu(), tandaiBekas(), taruhDiStart() (+2 more)

### Community 110 - "aplikasi-android/package.json"
Cohesion: 0.13
Nodes (18): dependencies, @capacitor/android@8.6.0, @capacitor-community/admob@8.3.0, @capacitor/core@8.6.0, description, devDependencies, @capacitor/cli@8.6.0, name (+10 more)

### Community 111 - "loop"
Cohesion: 0.33
Nodes (6): gambarPeta(), gambarSpido(), loop(), pX(), pZ(), updateDebu()

### Community 112 - "yTanah"
Cohesion: 0.40
Nodes (5): basah(), bukit(), pantaiX(), terdekat(), yTanah()

### Community 114 - "cekSalip"
Cohesion: 0.33
Nodes (6): aturSuara(), balon(), cekSalip(), siapAudio(), teriak(), tombolSuara()

## Knowledge Gaps
- **1 isolated node(s):** `kelasduniakotak`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 934 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lepas()` connect `$` to `hitung-rpg/game.js`, `src/game.js`, `bangun.js`, `reli.js`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `mulai()` (e.g. with `ambilHadir()` and `bersihAv()`) actually correct?**
  _`mulai()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `kelasduniakotak` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `duniakotak/js/desa.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06289506953223767 - nodes in this community are weakly interconnected._
- **Why does `warga()` connect `warga` to `mabar/game.js`, `kotak`, `kotak`, `buatMobil`, `mulai`, `ktp.js`, `main.js`, `smp/src/inti.js`, `reli.js`, `bangun.js`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `mabar/game.js` be split into smaller, more focused modules?**
  _Cohesion score 0.015416238437821172 - nodes in this community are weakly interconnected._
- **Why does `Vox` connect `Vox` to `paud/src/inti.js`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._