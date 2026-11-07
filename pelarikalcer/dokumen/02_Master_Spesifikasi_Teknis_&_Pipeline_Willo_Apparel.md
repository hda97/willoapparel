# DOKUMEN SPESIFIKASI TEKNIS, PIPELINE ASET 3D, & ARSITEKTUR UI/UX
**Proyek:** Pelari Kalcer 3D — Willo Apparel Official Edition (`www.willoapparel.com/pelarikalcer`)  
**Genre:** 3D Endless / Event Runner, Sports Simulation, Massive Social MMORPG (2.000+ Pelari)  
**Arah Seni (Art Direction):** *Refined Earthy, Monochrome, & Muted Skena Running Palette* (Tanpa warna neon mencolok, tanpa atribut Garuda/bendera negara—seluruh identitas terfokus pada **Willo Apparel** & **Pelari Kalcer BIB `#0088`**).

---

## 1. PALET WARNA MASTER (EARTHY & MONOCHROME — PBR MATERIAL GUIDE)

| Nama Swatch | Kode Hex Utama | Kode Hex Aksen | Roughness PBR | Penerapan Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Matte Onyx & Washed Charcoal** | `#1E2022` / `#34373B` | `#EFECE6` (Bone Cream) | `0.80 - 0.88` | Pro Race Singlet, Boxy Skena Tee, Split Shorts, Inner Liner |
| **Oat Milk & Bone Cream** | `#EFECE6` / `#DFD8C8` | `#B8AC99` (Warm Stone) | `0.75 - 0.82` | UV-Shield Long Sleeve, Pleated Skena Skort, Daily Cruiser (Gum Sole `#A67B5B`) |
| **Muted Sage & Pine Olive** | `#849483` / `#4A5844` | `#C7B299` (Sandstone) | `0.78 - 0.85` | Aero Short-Sleeve, Trail Half-Zip, Trail Cargo Skort, Sepatu Trail Grip |
| **Warm Taupe & Espresso** | `#9C8470` / `#3B2F2A` | `#D5C7B8` (Warm Sand) | `0.70 - 0.82` | Everyday Run Tee, Compression Half-Tights, Tali Jam Earthy |
| **Dusty Terracotta & Rose** | `#A46358` / `#8C524A` | `#E8E2D5` (Alabaster) | `0.75 - 0.80` | Aero-Wrap Running Skort & Atasan Wanita |
| **Dusty Slate Blue** | `#516270` / `#2A323B` | `#8F9FA8` (Mist Grey) | `0.75 - 0.82` | Modest Hijab-Friendly Running Set & Ultralight Windbreaker Shell |
| **Alabaster & Brushed Copper/Titanium** | `#F5F4F0` / `#8C7D70` | `#C5A890` (Champagne) | `0.35 - 0.45` | Sepatu Grail Nyx Hyperfoam, Bodi Willo Titanium Watch, Kacamata Matte |

---

## 2. PIPELINE KARAKTER 3D MODULAR, RAMBUT, & KULIT NUSANTARA

1. **Target Polycount & Topologi:**
   - **Karakter Utama (LOD0):** `8.000 - 12.000 triangles` (Mobile/WebGL), minimal 3 *edge loops* pada bahu, siku, pinggul, lutut, dan pergelangan kaki.
   - **Sistem Sub-Mesh Modular:** Kepala, Rambut/Hijab (`head_socket`), Torso/Jersey, Bawahan (Rok Skort / Split Shorts / Legging), Jam Tangan GPS (`lowerarm_l`), dan Sepatu.
2. **Enam Gaya Rambut Pria & Wanita:**
   - **Pria:** *Taper Fade + Headband*, *Comma Hair Skena*, *Modern Mullet / Wolf Cut*, *Curly Crop (Ikal)*, *Buzz Cut (Cepak)*, *Man Bun*.
   - **Wanita:** *High Ponytail + Visor*, *Double Boxer Braids (Kepang Dua)*, *Short Wavy Bob*, *Sporty High Bun (Cepol)*, *Bubble Ponytail*, *Aerodynamic Sport Hijab*.
3. **Enam Warna Rambut Kalem:** *Natural Jet Black* (`#18181A`), *Dark Espresso* (`#2E221D`), *Warm Chestnut* (`#5C3C28`), *Ash Milk-Tea* (`#78675A`), *Deep Auburn* (`#542A24`), *Charcoal Silver* (`#8A8D91`).
4. **Enam Spektrum Warna Kulit Nusantara:** *Kuning Langsat Cerah* (`#F0CCB0`), *Kuning Langsat Natural* (`#E2B492`), *Sawo Matang Muda* (`#CC9670`), *Sawo Matang Klasik* (`#B37B56`), *Cokelat Eksotis* (`#945E3D`), *Cokelat Gelap Timur* (`#6E4228`).

---

## 3. KATALOG JERSEY, ROK PENDEK LARI (SKORT), & EVOLUSI UPGRADE (TIER 1 - 4)

### 3.1 Delapan Varian Jersey Willo Apparel (Earthy Collection)
1. **Pro Race Singlet (Matte Onyx & Bone Cream)** — Tanpa lengan, perforasi laser punggung (`-15% Stamina Drain`).
2. **Boxy Skena Tee (Washed Charcoal & Oat)** — Potongan *oversized drop-shoulder* khas CFD (`+20% Bonus Koin W`).
3. **Aero Short-Sleeve (Muted Sage & Stone)** — Jahitan pipih *flatlock anti-chafing* (`+10% Swipe Speed`).
4. **Everyday Run Tee (Warm Taupe & Espresso)** — Kaos latihan harian *quick-dry*.
5. **UV-Shield Long Sleeve (Oat Milk & Sand)** — Lengan panjang *UPF 50+* dengan *thumbhole* untuk rute terik.
6. **Trail Half-Zip (Pine Olive & Sandstone)** — Ritsleting dada, silikon bahu anti-selip *Hydration Vest*, & saku *Energy Gel*.
7. **Modest Hijab-Friendly Set (Slate Blue & Charcoal)** — Tunik panjang sejuk + *Sport Hijab* aerodinamis.
8. **Ultralight Windbreaker Shell (Mist Grey & Olive)** — Jaket *ripstop* semi-transparan tahan angin gunung.

### 3.2 Empat Varian Rok Pendek Lari (*Running Skort*) & Bawahan
1. **Willo Pleated Skena Skort (Bone Cream / Matte Black):** Rok lipit mikro 2-in-1 dengan *inner spandex shorts* & saku paha (8 *Spring Bones* radial + *Capsule Collider* paha anti-*clipping*).
2. **Willo Aero-Wrap Skort (Muted Terracotta & Sand):** Rok *high-waist* asimetris dengan belahan samping.
3. **Willo Trail Cargo Skort (Sage Olive & Mocha):** Rok gunung *ripstop* dengan ban pinggang saku jaring 360°.
4. **Willo Modest Skirt-Legging 2-in-1 & Carbon Half-Tights:** Rok menyatu di atas *full legging* serta celana kompresi *Espresso*.

### 3.3 Matriks Evolusi Upgrade Gear (Basic ➔ High-End Grail)
- **Jam GPS:** *Basic Fitness Band* ➔ *Willo Sport Watch (`10:08`)* ➔ *Willo Coro-Pro Dual-GPS* ➔ **Willo Titanium Ultra Sapphire** (GPS Instan `0 dtk` + Peta Topografi 3D).
- **Sepatu Lari:** *Starter Jogger* ➔ *Willo Daily Cruiser (Gum Sole)* / *Trail Grip (Kebal Batu/Akar)* ➔ *Solomate Carbon* ➔ **Nyx Hyperfoam Grail (Alabaster & Copper, +36% Pace)**.
- **Item Bergengsi:** *Waist Bag* ➔ *Matte Tortoiseshell Sunglasses* ➔ *Hydration Vest 2 Soft Flask* ➔ **Carbon Vest + Bone Conduction Audio + Folding Carbon Trekking Poles**.

---

## 4. DAFTAR MAP EVENT LARI INDONESIA (ISOLASI LANDMARK PER KOTA & TRAIL)

### 4.1 Kategori Road Marathon
1. **Map Jakarta (Sudirman CFD & Monas • `+14m D+`):** Eksklusif hanya Tugu Monas, gedung pencakar langit Jakarta, lampu jalan kota, bangku taman, & Angkot.
2. **Map Jogja / Magelang (Borobudur & Desa Joglo • `+65m D+`):** Eksklusif hanya Candi Borobudur, Rumah Joglo kayu, pohon beringin, & Gerobak Bakso.
3. **Map Bali (Pantai Sanur & Candi Bentar • `+8m D+`):** Eksklusif hanya Gapura Candi Bentar (*Bali Gate*), pantai pasir putih, ombak laut biru, perahu jukung, & pohon kelapa.

### 4.2 Kategori Mountain Trail & Ultra Run
4. **Map Siksorogo Lawu Ultra (Gunung Lawu • `+1,200m D+`, Grade `18%`):** Tanjakan tanah merah curam, akar pohon pinus, anak tangga kayu, terasering kebun teh Kemuning, pita *Willo Trail Marker*, & sabana puncak Lawu di atas awan.
5. **Map Mantra116 (Arjuno–Welirang • `+2,400m D+`, `3.300 mdpl`):** Jalur batu vulkanik terjal, hutan cemara gunung, & asap belerang kawah Welirang.
6. **Map Bromo Tengger Trail (`+850m D+`):** Lautan pasir vulkanik hitam (*Sea of Sand*), dinding kaldera Tengger, & kawah Bromo.
7. **Map Dieng Caldera Race (`+2,330m D+`) & Rinjani 100 (`3.726 mdpl`):** Kabut "Negeri di Atas Awan", sabana Sembalun, & tanjakan kerikil *scree* Plawangan.
8. **Map Coast to Coast Night Trail (Parangtritis Jogja) & Tahura Trail (Bandung):** Lari malam gumuk pasir dengan *Headlamp* serta jalur jembatan hutan pinus.

---

## 5. EFEK ANGIN (VFX), MULTIPLAYER 2.000+ PELARI, LEADERBOARD & 6 BOOTH EXPO

1. **Enam Modul VFX Efek Angin:** *Base Run Wind Ribbons* (`Trail Renderer` bahu & tumit), *Sonic Wind Vortex* saat *Power Sprint*, *Drafting Slipstream Tunnel* (`-15%` s/d `-20%` kuras Stamina di belakang *Pacer*), *Lane-Switch Wind Swoosh* saat *Swipe Kiri/Kanan*, *Jump Updraft Vortex* saat *Swipe Atas*, dan *Terrain Wind Gusts* (daun pinus, pasir, riak udara).
2. **Optimasi Crowd 2.000+ Pelari (60 FPS):**
   - `LOD0 (<12m)`: *Full Modular Mesh* + *Nameplate* & *Speech Bubble*.
   - `LOD1 (12-35m)`: *Merged Mesh* + *Simplified Rig*.
   - `LOD2 (35-90m)`: *Low-Poly VAT (Vertex Animation Texture)*.
   - `LOD3 (>90m)`: *GPU Instanced Impostor Crowd* (1 *Draw Call*).
3. **Enam Booth Interaktif di Race Expo / Social Hub:**
   - **Booth 1:** *Willo Apparel Official Pop-Up Store*
   - **Booth 2:** *Race Pack Collection (RPC & BIB Counter `#0088`)*
   - **Booth 3:** *Booth Kopi Kalcer & Carbo Bar*
   - **Booth 4:** *Booth Photo Wall Finisher & Giant Digital Timer (`01:42:15`)*
   - **Booth 5:** *Booth Recovery & Physio Zone (Massage Gun & Ice Bath)*
   - **Booth 6:** *Booth Pendaftaran Crew & Pacer Station (`PACER 4:30 / 5:00`)*
