# Graph Report - willoapparel  (2026-11-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1045 nodes · 2635 edges · 51 communities (44 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `105990b5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49

## God Nodes (most connected - your core abstractions)
1. `box()` - 62 edges
2. `rnd()` - 34 edges
3. `V3()` - 33 edges
4. `toast()` - 33 edges
5. `aturHUD()` - 32 edges
6. `box()` - 31 edges
7. `mulai()` - 31 edges
8. `rnd()` - 27 edges
9. `V3()` - 26 edges
10. `loop()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `rondeTebak()` --indirect_call--> `putar()`  [INFERRED]
  edukasi/paud/src/huruf/game.js → public/duniakotak/mabar/game.js
- `gambarKTP()` --indirect_call--> `H()`  [INFERRED]
  public/duniakotak/js/ktp.js → public/duniakotak/js/desa.js
- `pastel()` --calls--> `grad()`  [EXTRACTED]
  public/duniakotak/mabar/js/desa.js → public/duniakotak/mabar/js/lib.js
- `hutanRing()` --calls--> `rnd()`  [EXTRACTED]
  public/duniakotak/mabar/js/desa.js → public/duniakotak/mabar/js/lib.js
- `mulai()` --indirect_call--> `warga()`  [INFERRED]
  public/duniakotak/mabar/game.js → public/duniakotak/mabar/js/aset/avatar.js

## Import Cycles
- None detected.

## Communities (51 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (108): ANIM, base(), bigYard(), blockWorld(), blue(), boxHouse(), btree(), C01() (+100 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (84): AK, ATASAN, AWAL_DUSUN, BANGUN_VOTING, BAWAHAN, BOLA, CALON, cam (+76 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (34): AKHIRAN, apiWarga(), bacaAkun(), BARANG, bersihUn(), BIBIT, CALON_FASUM, cekGoogle() (+26 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (26): aturMusik(), bisaKetuk, _bx, DATA_BAWAAN, efek, FONT, _geo, gerakKarakter() (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (42): api(), aturHUD(), aturTas(), baca(), bacaJ(), beriMakan(), bukaKamera(), bukaKucing() (+34 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (37): tanamanSel(), ANIM, C01(), carve(), catFace(), CG, clock(), clockTex() (+29 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (32): description, devDependencies, esbuild@0.24.0, three@0.169.0, name, private, box(), DAFTAR_KUCING (+24 more)

### Community 7 - "Community 7"
Cohesion: 0.26
Nodes (35): bangku(), BAWAH, bunga(), daun(), fin(), G(), gereja(), jaring() (+27 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (35): aturKavling(), bangunKavling(), bangunUlangKavling(), buang(), catKavling(), dekorKavling(), hapusGaris(), lantaiDua() (+27 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (30): alamat(), ATASAN, avAcak(), BAWAHAN, bersihAv(), dusun(), foto(), gambarKTP() (+22 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (29): alamat(), bisaKerja(), bukaOnline(), bukaPeringkat(), bukaProfesi(), bukaProfil(), bukaSoal(), bukaTanam() (+21 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (23): benar(), buatHewan(), buatMakanan(), bunyiHewan(), dodo, HEWAN_ADA, hewanDiKandang(), infoHewan() (+15 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (24): aturKualitas(), bolaBuat(), bolaLapangan(), bolaTendang(), bolaTerima(), bolaUpdate(), cekDalamFasum(), cekMisiDekat() (+16 more)

### Community 13 - "Community 13"
Cohesion: 0.19
Nodes (22): bibit(), cabai(), CG, cubes(), DAFTAR_TANAMAN, grassBed(), hsl(), island() (+14 more)

### Community 14 - "Community 14"
Cohesion: 0.30
Nodes (23): bigYard(), boxHouse(), btree(), cropField(), cubes(), droneWorld(), fasumLot(), giantList() (+15 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (21): concurrency, cancel-in-progress, group, jobs, syntax-and-regression, name, on, pull_request (+13 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (22): avAcak(), avKerja(), bersihAv(), buatAvatarObj(), bukaPembuatAvatar(), fotoAvatar(), fotoProfil(), gantiAvatarSaya() (+14 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (21): buatPeta(), bukaPeta(), gambarGaris(), gambarPetaBesar(), gambarPetaMini(), hapusRute(), jalanRute(), KAVLING_LUAS() (+13 more)

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (16): benar(), bendaBentuk(), BENTUK, bentukVoxel(), garisBentuk(), kotakMainan(), lala, mulaiMain() (+8 more)

### Community 19 - "Community 19"
Cohesion: 0.24
Nodes (14): curug(), FASUM_TERAS, aturTipis(), fasum2(), hutan(), hutanPts(), lot2(), nameTex() (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (18): awan, benar(), BUAH, buatBuah(), buatKeranjang(), KATA, mulaiMain(), NAMA_BUAH (+10 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (17): runs-on, steps, timeout-minutes, jobs, deploy-staging, name, on, workflow_dispatch (+9 more)

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (16): chest(), dust(), faces, flashlight(), floor(), gc, house(), lantern() (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.21
Nodes (15): awan, bima, jawabCari(), jenisRonde(), kataHTML(), mulaiMain(), putaran(), rondeCari() (+7 more)

### Community 24 - "Community 24"
Cohesion: 0.14
Nodes (16): animSkill(), bebas(), bisaJual(), bisaPanen(), bisaTanam(), dekatAir(), dekatItem(), dekatKucing() (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.38
Nodes (15): base(), blue(), cat(), CATSHOT(), DRONE(), HOOK(), HOUSE(), look() (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.14
Nodes (14): aturVolMusik(), bunyiAlat(), bunyiHat(), bunyiKick(), frek(), langkahMusik(), layarMulai(), layarSelesai() (+6 more)

### Community 27 - "Community 27"
Cohesion: 0.14
Nodes (13): runs-on, steps, jobs, indexnow, name, on, push, workflow_dispatch (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.24
Nodes (10): asliH(), asliW(), gH, gW, kelasMedia(), kunciLandscape(), perlu(), terapkan() (+2 more)

### Community 29 - "Community 29"
Cohesion: 0.21
Nodes (12): acak(), awanVoxel(), batuVoxel(), konfeti(), kotak(), lempeng(), mataK(), pilih() (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.27
Nodes (12): daftarSesi(), infoKumpul(), jamKumpul(), jamTeks(), jamWIB(), keKumpul(), ngobrol(), progresMisi() (+4 more)

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (4): alasBatu(), bungaVoxel(), geoKubus(), Vox

### Community 32 - "Community 32"
Cohesion: 0.36
Nodes (11): bakeGroup(), bangunCurug(), bangunDunia(), bangunKulon(), bangunProksi(), kumpulPijakan(), pasangAtasFasum(), pasangFasum() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (8): fadeEls, fadeObserver, hamburger, navbar, navItems, navLinks, observer, sections

### Community 35 - "Community 35"
Cohesion: 0.32
Nodes (8): fruitTree(), fullHouse(), kandang(), lot(), lumbung(), numTex(), prism(), roofPlanes()

### Community 36 - "Community 36"
Cohesion: 0.33
Nodes (6): acakInt(), bacaDraf(), bukaGerbangGuru(), bukaGuru(), gambarGuru(), pasangGuru()

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (6): gradasi(), objekDi(), pasangKetuk(), posisiPilihan(), siapPanggung(), tegak()

### Community 38 - "Community 38"
Cohesion: 0.40
Nodes (6): aturProyek(), bangunAktif(), gambarPapan(), muatWargaNPC(), pasangPapanDana(), segarPapan()

### Community 39 - "Community 39"
Cohesion: 0.47
Nodes (6): blockWorld(), cloud(), H(), lights(), terrain(), world()

### Community 40 - "Community 40"
Cohesion: 0.40
Nodes (5): animasi(), goyang(), lompat(), muncul(), terbangKe()

### Community 41 - "Community 41"
Cohesion: 0.40
Nodes (5): batasUI(), bingkaiDrone(), loop(), updatePartikel(), updateTween()

### Community 44 - "Community 44"
Cohesion: 0.50
Nodes (4): bukaRakit(), tandaBrg(), tulisRakit(), tulisToko()

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (3): bersihRonde(), hapusKetuk(), pilihanUI()

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (3): buatInterior(), cekDalamRumah(), kotakD()

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `Community 6` to `Community 0`, `Community 1`, `Community 3`, `Community 5`, `Community 8`, `Community 9`, `Community 13`, `Community 22`?**
  _High betweenness centrality (0.311) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06289506953223767 - nodes in this community are weakly interconnected._
- **Why does `putar()` connect `Community 23` to `Community 1`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.02127659574468085 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05552617662612375 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.04983388704318937 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.13124274099883856 - nodes in this community are weakly interconnected._