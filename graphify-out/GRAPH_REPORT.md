# Graph Report - willoapparel  (2026-11-09)

## Corpus Check
- 102 files · ~779,923 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: .glb 5, (none) 4, .css 4)

## Summary
- 2454 nodes · 5693 edges · 99 communities (90 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 163 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ad22510`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- duniakotak/js/desa.js
- mabar/game.js
- worker.js
- paud/src/inti.js
- toast
- mabar/js/desa.js
- lintasan.js
- box
- rumah.js
- ktp.js
- skillKerja
- binatang/game.js
- loop
- tanaman.js
- main.js
- security-check.yml
- mulai
- pasangPeta
- bentuk/game.js
- tlaga.js
- angka/game.js
- with
- mabar/js/lib.js
- huruf/game.js
- esc
- hitung-rpg/game.js
- langkahMusik
- steps
- putar.js
- acak
- tulisMisi
- Vox
- bangunDunia
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
- bangunKavling
- isiMenu
- bot.py
- petualang.js
- mulai
- kotak
- panel.py
- render.js
- unit_economics.py
- segara.js
- Warga
- mulaiTarung
- $
- inti-sd.js
- akhirSesi
- pelayaran-nusantara.js
- selesai
- simpan
- coding-quest.js
- bukaJawaban
- pelari.js
- desaGabung.js
- jalankan
- bersama.js
- perbaruiLobi
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
- setorLari
- Ruang
- langkah
- .pendukung
- jalan.js
- rnd
- cekSalip
- kotakBulat.js
- Pengunjung
- kelasduniakotak
- siapkanHantu

## God Nodes (most connected - your core abstractions)
1. `box()` - 66 edges
2. `$` - 47 edges
3. `mulai()` - 39 edges
4. `toast()` - 39 edges
5. `V3()` - 39 edges
6. `rnd()` - 38 edges
7. `aturHUD()` - 33 edges
8. `box()` - 31 edges
9. `soal()` - 29 edges
10. `bunyi()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `tulis()` --indirect_call--> `KUNCI()`  [INFERRED]
  pelarikalcer/src/game.js → edukasi/smp/src/inti.js
- `rumah()` --calls--> `rumahMesh()`  [EXTRACTED]
  pelarikalcer-kotak/src/main.js → public/duniakotak/mabar/js/aset/rumah.js
- `kucing()` --calls--> `kucingMesh()`  [EXTRACTED]
  pelarikalcer-kotak/src/main.js → public/duniakotak/mabar/js/aset/kucing.js
- `wargaAcak()` --calls--> `warga()`  [EXTRACTED]
  pelarikalcer-kotak/src/main.js → public/duniakotak/mabar/js/aset/avatar.js
- `buatPemain()` --calls--> `warga()`  [EXTRACTED]
  pelarikalcer-kotak/src/main.js → public/duniakotak/mabar/js/aset/avatar.js

## Import Cycles
- None detected.

## Communities (99 total, 9 thin omitted)

### Community 0 - "duniakotak/js/desa.js"
Cohesion: 0.06
Nodes (108): ANIM, base(), bigYard(), blockWorld(), blue(), boxHouse(), btree(), C01() (+100 more)

### Community 1 - "mabar/game.js"
Cohesion: 0.02
Nodes (113): AK, ATASAN, aturProyek(), AWAL_DUSUN, BANGUN_VOTING, bangunAktif(), BAWAHAN, BOLA (+105 more)

### Community 2 - "worker.js"
Cohesion: 0.06
Nodes (41): AKHIRAN, apiWarga(), bacaAkun(), BANGUN_SEKARANG, BARANG, bersihUn(), BIBIT, BOS_TETAP (+33 more)

### Community 3 - "paud/src/inti.js"
Cohesion: 0.05
Nodes (31): aturMusik(), bersihRonde(), bisaKetuk, _bx, daftarKetuk(), DATA_BAWAAN, efek, FONT (+23 more)

### Community 4 - "toast"
Cohesion: 0.10
Nodes (53): ambilHadir(), api(), aturHadir(), aturHUD(), aturTas(), baca(), bacaJ(), beriMakan() (+45 more)

### Community 5 - "mabar/js/desa.js"
Cohesion: 0.07
Nodes (89): tanamanSel(), ANIM, base(), bigYard(), blockWorld(), blue(), boxHouse(), btree() (+81 more)

### Community 6 - "lintasan.js"
Cohesion: 0.09
Nodes (47): akarSamping(), angkot(), batuBesar(), borobudur(), bromo(), candiBentar(), candiBorobudur(), candiKecil() (+39 more)

### Community 7 - "box"
Cohesion: 0.26
Nodes (35): bangku(), BAWAH, bunga(), daun(), fin(), G(), gereja(), jaring() (+27 more)

### Community 8 - "rumah.js"
Cohesion: 0.08
Nodes (45): cam, d, g, r, sc, warungDepan(), ambil(), at() (+37 more)

### Community 9 - "ktp.js"
Cohesion: 0.12
Nodes (30): alamat(), ATASAN, avAcak(), BAWAHAN, bersihAv(), dusun(), foto(), gambarKTP() (+22 more)

### Community 10 - "skillKerja"
Cohesion: 0.22
Nodes (13): bisaKerja(), bukaProfesi(), bukaSoal(), diTempatKerja(), DPF(), hasilProfesi(), labelKerja(), mmss() (+5 more)

### Community 11 - "binatang/game.js"
Cohesion: 0.13
Nodes (23): benar(), buatHewan(), buatMakanan(), bunyiHewan(), dodo, HEWAN_ADA, hewanDiKandang(), infoHewan() (+15 more)

### Community 12 - "loop"
Cohesion: 0.07
Nodes (32): animSkill(), aturKualitas(), bebas(), bisaJual(), bisaPanen(), bisaTanam(), bolaBuat(), bolaLapangan() (+24 more)

### Community 13 - "tanaman.js"
Cohesion: 0.19
Nodes (22): bibit(), cabai(), CG, cubes(), DAFTAR_TANAMAN, grassBed(), hsl(), island() (+14 more)

### Community 14 - "main.js"
Cohesion: 0.03
Nodes (76): A, akar(), AKOR, ATAP, BALAS, BALON, batu(), BAWAH (+68 more)

### Community 15 - "security-check.yml"
Cohesion: 0.09
Nodes (21): concurrency, cancel-in-progress, group, jobs, syntax-and-regression, name, on, pull_request (+13 more)

### Community 16 - "mulai"
Cohesion: 0.14
Nodes (26): avAcak(), avKerja(), bersihAv(), buatAvatarObj(), bukaPembuatAvatar(), bukaProfil(), dialogRaka(), fotoAvatar() (+18 more)

### Community 17 - "pasangPeta"
Cohesion: 0.19
Nodes (19): alamat(), buatPeta(), bukaPeringkat(), bukaPeta(), dusunDari(), fotoUdaraPeta(), gambarPetaBesar(), gambarPetaMini() (+11 more)

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

### Community 22 - "mabar/js/lib.js"
Cohesion: 0.12
Nodes (16): chest(), dust(), faces, flashlight(), floor(), gc, house(), lantern() (+8 more)

### Community 23 - "huruf/game.js"
Cohesion: 0.23
Nodes (14): awan, bima, jawabCari(), jenisRonde(), kataHTML(), mulaiMain(), putaran(), rondeCari() (+6 more)

### Community 24 - "esc"
Cohesion: 0.11
Nodes (31): barisPemula(), bukaLift(), bukaOnline(), bukaTanam(), esc(), gambarGaris(), hapusGaris(), hapusRute() (+23 more)

### Community 25 - "hitung-rpg/game.js"
Cohesion: 0.04
Nodes (48): AIR, ANTRE, _arah, awan, balai, BARANG, BATAS, buatNpc() (+40 more)

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
Cohesion: 0.29
Nodes (12): barisHadir(), daftarSesi(), infoKumpul(), jamKumpul(), jamTeks(), jamWIB(), kaliKoin(), keKumpul() (+4 more)

### Community 31 - "Vox"
Cohesion: 0.33
Nodes (4): alasBatu(), bungaVoxel(), geoKubus(), Vox

### Community 32 - "bangunDunia"
Cohesion: 0.25
Nodes (17): bakeGroup(), bangunCurug(), bangunDunia(), bangunKulon(), bangunProksi(), bangunSegara(), bangunTlaga(), bangunUnitSegara() (+9 more)

### Community 33 - "json"
Cohesion: 0.11
Nodes (13): bundel(), main(), html_rpg(), html_sd(), main(), bundel(), data_game(), rakit_game() (+5 more)

### Community 34 - "script.js"
Cohesion: 0.22
Nodes (8): fadeEls, fadeObserver, hamburger, navbar, navItems, navLinks, observer, sections

### Community 35 - "src/game.js"
Cohesion: 0.04
Nodes (65): CHAT_AWAL, CHAT_BANK, EXPO_BOOTHS, GAMBAR_GEAR, GEAR_CATALOG, GEAR_TABS, HAIR_COLORS, HAIRSTYLES (+57 more)

### Community 36 - "gambarGuru"
Cohesion: 0.25
Nodes (8): acakInt(), ajakanBeli(), aturBintang(), bacaDraf(), bukaGerbangGuru(), bukaGuru(), gambarGuru(), pasangGuru()

### Community 37 - "siapPanggung"
Cohesion: 0.33
Nodes (6): gradasi(), objekDi(), pasangKetuk(), posisiPilihan(), siapPanggung(), tegak()

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
Cohesion: 0.10
Nodes (33): bangunDunia(), gapuraGambar(), strip(), CADANGAN_LANTAI, LANTAI_HUDA, TEX, tex(), texAsap (+25 more)

### Community 46 - "main.go"
Cohesion: 0.07
Nodes (13): acakHex(), alamatLokal(), bersihNama(), bukaBrowser(), dariLaptopIni(), layaniGuru(), layaniMurid(), layaniWS() (+5 more)

### Community 47 - "smp/src/inti.js"
Cohesion: 0.05
Nodes (30): animasi(), ATUR, buatSiswa(), bunyiAlat(), dasiSMP(), DATA_BAWAAN, efek, frek() (+22 more)

### Community 48 - "hitung/game.js"
Cohesion: 0.10
Nodes (36): awan, BARANG, barangDari(), benar(), buatUang(), dimas, gerbang, jawabanDari() (+28 more)

### Community 49 - "bangunKavling"
Cohesion: 0.09
Nodes (29): aturKavling(), bangunKavling(), bangunUlangKavling(), buang(), catKavling(), dekorKavling(), EMAS(), KAVLING_LUAS() (+21 more)

### Community 51 - "isiMenu"
Cohesion: 0.23
Nodes (15): aktif, aturWarga(), bayar(), cukup(), gantiPemain(), hargaPm(), hargaTeks(), isiDompet() (+7 more)

### Community 52 - "bot.py"
Cohesion: 0.14
Nodes (24): ambil_json(), angka(), beli(), boleh_beli(), cari_dan_beli(), catat_riwayat(), cek_rugcheck(), data_hari_ini() (+16 more)

### Community 53 - "petualang.js"
Cohesion: 0.14
Nodes (33): adaEmoji(), AYO, bacaKelompok(), benarPT(), DEPAN, esc(), JENIS_UMUM, KANAN (+25 more)

### Community 54 - "mulai"
Cohesion: 0.15
Nodes (23): aksiBooth(), aturMain(), avatar(), bersihkanEfek(), buka(), gambarBooth(), gambarRambut(), hariIni() (+15 more)

### Community 55 - "kotak"
Cohesion: 0.14
Nodes (21): buatPemain(), fotoMedali(), gapura(), kerucut(), kotak(), landmark(), langitRute(), letak() (+13 more)

### Community 56 - "panel.py"
Cohesion: 0.17
Nodes (19): _answer_ok(), check(), deal(), init(), load_state(), main(), _num(), PanelError (+11 more)

### Community 57 - "render.js"
Cohesion: 0.17
Nodes (25): buatDaftar(), foto(), g(), handuk(), jam(), kanvas(), lootBox(), M() (+17 more)

### Community 58 - "unit_economics.py"
Cohesion: 0.17
Nodes (15): analyse(), load(), main(), _money(), NumbersError, report(), sensitivity(), _sum() (+7 more)

### Community 59 - "segara.js"
Cohesion: 0.13
Nodes (20): AWAL_SEGARA, COLX, DERMAGA, FASUM_PETAK, FO(), kanvas(), kodeUnit(), LANTAI_HUNI (+12 more)

### Community 60 - "Warga"
Cohesion: 0.18
Nodes (6): hariWib(), kavlingSiap(), misiHari(), pkMisiHari(), pkPermata(), Warga

### Community 61 - "mulaiTarung"
Cohesion: 0.17
Nodes (26): aturFokusTarung(), banner(), bebas(), bicaraKoki(), bukaTas(), bukaToko(), catatJawab(), kalah() (+18 more)

### Community 62 - "$"
Cohesion: 0.15
Nodes (21): ambil(), ambilIsotonik(), aturUlangAngin(), gambarNyawa(), kameraIkut(), ketukDrill(), langkah(), mulaiDrill() (+13 more)

### Community 63 - "inti-sd.js"
Cohesion: 0.12
Nodes (10): aturNyawa(), bacaAngka(), bintangFase(), FASE, kunciSimpan(), kurangNyawa(), papanAngka(), pilihFase() (+2 more)

### Community 64 - "akhirSesi"
Cohesion: 0.24
Nodes (20): akhirSesi(), alamatMurid(), aturBermain(), esc(), gambarLobi(), gambarQR(), lanjutSoal(), layarAtur() (+12 more)

### Community 65 - "pelayaran-nusantara.js"
Cohesion: 0.16
Nodes (19): aturPosisi(), bangunKapal(), bangunPeta(), gx(), gz(), jarakRuas(), jawabanKini(), kapalVoxel() (+11 more)

### Community 66 - "selesai"
Cohesion: 0.15
Nodes (24): ambil(), ambilAir(), bangunDunia(), buang(), bukaLaci(), bukaRayakan(), bunyi(), gagal() (+16 more)

### Community 67 - "simpan"
Cohesion: 0.17
Nodes (20): akhirCerita(), aturMisi(), bangunJembatan(), bicara(), bicaraLurah(), bicaraMbah(), bicaraSari(), bicaraTukang() (+12 more)

### Community 68 - "coding-quest.js"
Cohesion: 0.20
Nodes (17): aturPosisi(), bangunLintas(), bangunRobot(), jawabanKini(), layarJawab(), layarSiap(), layarSoal(), lebarPetak() (+9 more)

### Community 69 - "bukaJawaban"
Cohesion: 0.17
Nodes (20): angka(), bukaJawaban(), gambarHitungJawab(), gambarJawabTim(), gambarPapan(), keadaanUntuk(), keMurid(), kirimKeadaanKe() (+12 more)

### Community 70 - "pelari.js"
Cohesion: 0.29
Nodes (16): W, buatPelari(), kaki(), lengan(), cGeo, cLathe, cMat, cTex (+8 more)

### Community 71 - "desaGabung.js"
Cohesion: 0.18
Nodes (14): ARAH(), CABANG, global(), IKON, IMG, keGambar(), LETAK, panjang() (+6 more)

### Community 72 - "jalankan"
Cohesion: 0.15
Nodes (16): aturJeda(), aturMusik(), cekServer(), infoLobi(), jalankan(), kirim(), loop(), pasangHUD() (+8 more)

### Community 73 - "bersama.js"
Cohesion: 0.17
Nodes (7): _asap, buatEnt(), _ga, hapusEnt(), M, pasangHookUmum(), rupaTim()

### Community 74 - "perbaruiLobi"
Cohesion: 0.16
Nodes (21): biayaUpgrade(), cari(), cfgSaya(), chatMasuk(), gambarChat(), gambarGear(), gambarPeta(), gambarRank() (+13 more)

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
Cohesion: 0.14
Nodes (17): ambilSoal(), cekContoh(), keMenuFase(), kunciSave(), muat(), mulaiMain(), opsiAngka(), pasangHero() (+9 more)

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

### Community 87 - "setorLari"
Cohesion: 0.24
Nodes (13): apiPk(), daftarMisi(), hariWIB(), hitungMundur(), isiMisi(), isiMisiTag(), jamAktif(), klaimMisi() (+5 more)

### Community 89 - "langkah"
Cohesion: 0.25
Nodes (11): angkaTier(), aturKilau(), gengsiAktif(), langkah(), posHantu(), putar(), sepatuAktif(), tingkatLangka() (+3 more)

### Community 91 - "jalan.js"
Cohesion: 0.29
Nodes (3): { chromium }, fs, path

### Community 92 - "rnd"
Cohesion: 0.29
Nodes (11): buatNPC(), isiLintasan(), kucing(), muatDunia(), penonton(), pilih(), resetLari(), rnd() (+3 more)

### Community 93 - "cekSalip"
Cohesion: 0.33
Nodes (6): aturSuara(), balon(), cekSalip(), siapAudio(), teriak(), tombolSuara()

### Community 98 - "siapkanHantu"
Cohesion: 0.33
Nodes (6): fmtWaktu(), hud(), isiPapan(), muatPapan(), peringkat(), siapkanHantu()

## Knowledge Gaps
- **1 isolated node(s):** `kelasduniakotak`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 798 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lepas()` connect `hitung-rpg/game.js` to `src/game.js`, `$`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `mulai()` (e.g. with `ambilHadir()` and `bersihAv()`) actually correct?**
  _`mulai()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `kelasduniakotak` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `duniakotak/js/desa.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06289506953223767 - nodes in this community are weakly interconnected._
- **Why does `warga()` connect `ktp.js` to `mabar/game.js`, `main.js`, `smp/src/inti.js`, `mulai`, `kotak`, `rnd`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `mabar/game.js` be split into smaller, more focused modules?**
  _Cohesion score 0.01835824809861002 - nodes in this community are weakly interconnected._
- **Why does `$` connect `$` to `src/game.js`, `pelari.js`, `rumah.js`, `perbaruiLobi`, `dunia.js`, `mulai`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._