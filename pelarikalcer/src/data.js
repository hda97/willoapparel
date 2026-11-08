// Data game dari Master Bundle Willo Apparel (02_Master_Spesifikasi_Teknis & prototipe Huda).

export const HAIRSTYLES = [
  { id: 'taper_headband', name: 'Taper Fade + Headband', desc: 'Rapi + headband matte' },
  { id: 'comma', name: 'Comma Hair Skena', desc: 'Belah tengah kasual CFD' },
  { id: 'mullet', name: 'Modern Mullet / Wolf', desc: 'Bagian belakang berkibar' },
  { id: 'curly', name: 'Curly Crop (Ikal)', desc: 'Ikal bervolume natural' },
  { id: 'buzz', name: 'Buzz Cut (Cepak)', desc: 'Cepak rapi, ringan' },
  { id: 'manbun', name: 'Man Bun', desc: 'Cepol kecil di belakang' },
  { id: 'ponytail_visor', name: 'High Ponytail + Visor', desc: 'Kuncir tinggi + visor Willo' },
  { id: 'boxer_braids', name: 'Double Boxer Braids', desc: 'Kepang dua anti-kusut' },
  { id: 'wavy_bob', name: 'Short Wavy Bob', desc: 'Sebahu bertekstur kalem' },
  { id: 'high_bun', name: 'Sporty High Bun', desc: 'Cepol tinggi' },
  { id: 'bubble_pony', name: 'Bubble Ponytail', desc: 'Kuncir bergelembung' },
  { id: 'sport_hijab', name: 'Sport Hijab Aerodinamis', desc: 'Penutup kepala breathable' },
];

export const HAIR_COLORS = [
  { name: 'Jet Black', hex: '#18181A' },
  { name: 'Dark Espresso', hex: '#2E221D' },
  { name: 'Warm Chestnut', hex: '#5C3C28' },
  { name: 'Ash Milk-Tea', hex: '#78675A' },
  { name: 'Deep Auburn', hex: '#542A24' },
  { name: 'Charcoal Silver', hex: '#8A8D91' },
];

export const SKIN_TONES = [
  { name: 'Kuning Langsat Cerah', hex: '#F0CCB0' },
  { name: 'Kuning Langsat Natural', hex: '#E2B492' },
  { name: 'Sawo Matang Muda', hex: '#CC9670' },
  { name: 'Sawo Matang Klasik', hex: '#B37B56' },
  { name: 'Cokelat Eksotis', hex: '#945E3D' },
  { name: 'Cokelat Gelap Timur', hex: '#6E4228' },
];

export const GEAR_TABS = [
  { id: 'jersey', nama: '👕 Jersey' },
  { id: 'bottom', nama: '🩳 Rok Skort & Celana' },
  { id: 'shoe', nama: '👟 Sepatu Lari' },
  { id: 'watch', nama: '⌚ Jam GPS' },
  { id: 'prestige', nama: '🕶️ Item Bergengsi' },
];

export const GEAR_CATALOG = {
  jersey: [
    { id: 'jersey_basic', name: 'Basic Cotton Tee (Warm Grey)', tier: 'TIER 1 • BASIC', style: 'short', color: '#6E7073', accent: '#DFD8C8', paceBonus: 5, staminaSave: 5, costW: 0, desc: 'Kaos lari komunitas dasar warna abu hangat.' },
    { id: 'everyday_taupe', name: 'Willo Everyday Run Tee (Warm Taupe)', tier: 'TIER 1 • BASIC', style: 'short', color: '#9C8470', accent: '#3B2F2A', paceBonus: 9, staminaSave: 8, costW: 150, desc: 'Kaos latihan harian quick-dry, list espresso.' },
    { id: 'boxy_charcoal', name: 'Willo Boxy Skena Tee (Washed Charcoal)', tier: 'TIER 2 • SPORT', style: 'boxy', color: '#2F3236', accent: '#EFECE6', paceBonus: 14, staminaSave: 12, coinBonus: 20, costW: 400, desc: 'Potongan boxy drop-shoulder CFD, tipografi PELARI KALCER krem. Bonus Koin W +20%.' },
    { id: 'singlet_onyx', name: 'Willo Pro Race Singlet (#0088 Onyx)', tier: 'TIER 3 • PRO SKENA', style: 'singlet', color: '#1A1C1E', accent: '#DFD8C8', paceBonus: 22, staminaSave: 18, costW: 650, desc: 'Singlet tanpa lengan laser-cut ringan dengan list Bone Cream.' },
    { id: 'aero_sage', name: 'Willo Aero Short-Sleeve (Muted Sage)', tier: 'TIER 2 • SPORT', style: 'short', color: '#7A8B7A', accent: '#EFECE6', paceBonus: 16, staminaSave: 14, costW: 450, desc: 'Jahitan flatlock anti-chafing warna sage kalem.' },
    { id: 'uv_long_oat', name: 'Willo UV-Shield Long Sleeve (Oat Milk)', tier: 'TIER 3 • PRO SKENA', style: 'long', color: '#E8E2D5', accent: '#9C8470', paceBonus: 20, staminaSave: 22, costW: 700, desc: 'Lengan panjang UPF 50+ dengan thumbhole untuk rute terik.' },
    { id: 'trail_halfzip', name: 'Willo Trail Half-Zip (Pine Olive & Sand)', tier: 'TIER 3 • PRO TRAIL', style: 'long', color: '#4A5844', accent: '#C7B299', paceBonus: 24, staminaSave: 25, costW: 850, desc: 'Ritsleting dada, silikon bahu anti-selip, saku energy gel.' },
    { id: 'modest_hijab_set', name: 'Willo Modest Running Tunic (Slate Blue)', tier: 'TIER 3 • PRO SKENA', style: 'tunic', color: '#4E5F6E', accent: '#222528', paceBonus: 22, staminaSave: 24, costW: 750, desc: 'Tunik lari lengan panjang sopan & sejuk.' },
    { id: 'windbreaker_mist', name: 'Willo Ultralight Windbreaker (Grail)', tier: 'TIER 4 • HIGH-END GRAIL', style: 'jacket', color: '#B8BEC2', accent: '#4A5844', paceBonus: 32, staminaSave: 30, costW: 1800, desc: 'Jaket ripstop semi-transparan tahan angin gunung & hujan.' },
  ],
  bottom: [
    { id: 'shorts_basic', name: 'Basic Running Shorts (Black)', tier: 'TIER 1 • BASIC', type: 'shorts', color: '#1E2022', accent: '#1E2022', paceBonus: 4, staminaSave: 4, costW: 0, desc: 'Celana lari polos karet pinggang.' },
    { id: 'split_onyx', name: 'Willo Pro Split Shorts (Matte Onyx)', tier: 'TIER 2 • SPORT', type: 'shorts', color: '#1E2022', accent: '#DFD8C8', paceBonus: 10, staminaSave: 10, costW: 300, desc: 'Celana pendek belah samping dengan inner spandex.' },
    { id: 'skort_pleated_cream', name: 'Willo Pleated Skena Skort (Bone Cream)', tier: 'TIER 3 • PRO SKENA', type: 'skort', color: '#E8E2D5', accent: '#1E2022', paceBonus: 18, staminaSave: 16, costW: 550, desc: 'Rok lipit 2-in-1 dengan inner spandex & saku ponsel.' },
    { id: 'skort_pleated_onyx', name: 'Willo Pleated Skena Skort (Matte Black)', tier: 'TIER 3 • PRO SKENA', type: 'skort', color: '#1E2022', accent: '#C5A890', paceBonus: 18, staminaSave: 16, costW: 550, desc: 'Rok lipit hitam yang mengembang tertiup angin.' },
    { id: 'skort_wrap_terracotta', name: 'Willo Aero-Wrap Skort (Muted Terracotta)', tier: 'TIER 3 • PRO SKENA', type: 'skort', color: '#9E5B53', accent: '#E8E2D5', paceBonus: 20, staminaSave: 18, costW: 650, desc: 'Rok high-waist asimetris warna terracotta lembut.' },
    { id: 'skort_trail_olive', name: 'Willo Trail Cargo Skort (Sage Olive)', tier: 'TIER 4 • HIGH-END TRAIL', type: 'skort', color: '#556052', accent: '#6E5A4F', paceBonus: 24, staminaSave: 24, costW: 950, desc: 'Rok gunung ripstop, ban pinggang saku jaring 360°.' },
    { id: 'skirt_legging_modest', name: 'Willo Modest Skirt-Legging 2-in-1', tier: 'TIER 3 • PRO SKENA', type: 'skirt_legging', color: '#384652', accent: '#1E2022', paceBonus: 20, staminaSave: 22, costW: 700, desc: 'Rok sporty menyatu di atas full-length legging.' },
    { id: 'halftights_espresso', name: 'Willo Carbon Half-Tights (Deep Espresso)', tier: 'TIER 4 • HIGH-END GRAIL', type: 'tights', color: '#3B2F2A', accent: '#C5A890', paceBonus: 26, staminaSave: 25, costW: 1100, desc: 'Celana kompresi sepaha warna kopi pekat.' },
  ],
  shoe: [
    { id: 'shoe_starter', name: 'Starter Jogger (Stone Grey)', tier: 'TIER 1 • BASIC', color: '#8A8D91', sole: '#DFD8C8', paceBonus: 8, trailProof: false, costW: 0, desc: 'Sepatu lari dasar sol busa EVA standar.' },
    { id: 'daily_oat', name: 'Willo Daily Cruiser (Oat Cream & Gum)', tier: 'TIER 2 • SPORT', color: '#EAE4D7', sole: '#A67B5B', paceBonus: 18, trailProof: false, costW: 500, desc: 'Sepatu harian krem gandum, sol karet gum klasik.' },
    { id: 'trail_sandstone', name: 'Willo Trail Grip (Sandstone & Sage)', tier: 'TIER 3 • PRO TRAIL', color: '#B8A692', sole: '#4A5844', paceBonus: 24, trailProof: true, costW: 850, desc: 'Sol bergerigi. KEBAL batu & akar pohon.' },
    { id: 'solomate_carbon', name: 'Solomate Carbon (Matte Onyx & Bone)', tier: 'TIER 3 • PRO CARBON', color: '#222528', sole: '#EFECE6', paceBonus: 28, trailProof: false, costW: 1400, desc: 'Pelat karbon monokrom untuk mengejar PB di jalan raya.' },
    { id: 'nyx_hyperfoam', name: 'Nyx Hyperfoam Grail (Alabaster & Copper)', tier: 'TIER 4 • HIGH-END GRAIL', color: '#F5F4F0', sole: '#C5A890', paceBonus: 36, trailProof: true, costW: 2400, desc: 'Super-shoe kasta tertinggi. +36% pace.' },
  ],
  watch: [
    { id: 'watch_basic', name: 'Basic Fitness Band (Monokrom)', tier: 'TIER 1 • BASIC', color: '#2A2D30', gpsTime: 3.0, staminaSave: 5, costW: 0, desc: 'Gelang pintar standar, kunci GPS 3 detik.' },
    { id: 'willo_sport', name: 'Willo Sport Watch 10:08 (Onyx/Olive)', tier: 'TIER 2 • SPORT', color: '#4A5844', gpsTime: 1.5, staminaSave: 12, costW: 450, desc: 'Layar AMOLED bundar 10:08, langkah 8420.' },
    { id: 'coro_pro', name: 'Willo Coro-Pro Dual-Band (Warm Sand)', tier: 'TIER 3 • PRO SKENA', color: '#B8A692', gpsTime: 0.5, staminaSave: 20, costW: 950, desc: 'Sensor detak jantung & peringatan dini The Wall.' },
    { id: 'titanium_ultra', name: 'Willo Titanium Ultra Sapphire (Grail)', tier: 'TIER 4 • HIGH-END GRAIL', color: '#8C7D70', gpsTime: 0.0, staminaSave: 30, costW: 2200, desc: 'Bodi titanium, peta kontur 3D, GPS lock instan.' },
  ],
  prestige: [
    { id: 'none', name: 'Tanpa Aksesori', tier: 'TIER 1 • BASIC', paceBonus: 0, staminaSave: 0, costW: 0, desc: 'Lari polos tanpa aksesori.' },
    { id: 'waist_bag', name: 'Running Waist Bag (Matte Onyx)', tier: 'TIER 1 • BASIC', hasWaistBag: true, paceBonus: 2, staminaSave: 5, costW: 150, desc: 'Tas pinggang tipis untuk HP & gel.' },
    { id: 'sunglasses_matte', name: 'Kacamata Lari Matte Tortoiseshell', tier: 'TIER 2 • SPORT', hasGlasses: true, paceBonus: 6, staminaSave: 8, costW: 350, desc: 'Frame matte kalem anti-silau.' },
    { id: 'hydration_vest', name: 'Hydration Vest Lokal (2 Soft Flask)', tier: 'TIER 3 • PRO TRAIL', hasGlasses: true, hasVest: true, paceBonus: 12, staminaSave: 22, costW: 750, desc: 'Rompi hidrasi earth-olive, 2 botol di dada.' },
    { id: 'grail_trail_pack', name: 'Carbon Vest + Bone Conduction + Poles', tier: 'TIER 4 • HIGH-END GRAIL', hasGlasses: true, hasVest: true, hasPoles: true, paceBonus: 22, staminaSave: 35, costW: 1900, desc: 'Paket sultan skena: kacamata, audio open-ear, carbon vest, tongkat lipat.' },
  ],
};

// gambar katalog untuk item yang tidak punya foto sendiri
export const GAMBAR_GEAR = { none: 'item_kopi' };

export const MAPS = [
  { id: 'jakarta', name: 'JAKARTA — Sudirman CFD & Monas', shortName: 'Jakarta Monas', category: 'road', gain: 14, grade: '1.2% Flat Road',
    sky: ['#6E8CA0', '#D8CFC2'], fog: [70, 260], landmarkDesc: 'Tugu Monas, gedung pencakar langit, lampu kota & angkot', recGear: 'Willo Daily Cruiser / Solomate Carbon', staminaDrainMult: 1.0 },
  { id: 'jogja', name: 'JOGJA / MAGELANG — Borobudur & Desa Joglo', shortName: 'Jogja Borobudur', category: 'road', gain: 65, grade: '4.5% Rolling Heritage',
    sky: ['#7A9086', '#E2D9C8'], fog: [60, 240], landmarkDesc: 'Candi Borobudur, rumah joglo, beringin & gerobak bakso', recGear: 'Trail Grip / Daily Cruiser', staminaDrainMult: 1.15 },
  { id: 'bali', name: 'BALI — Pantai Sanur & Candi Bentar', shortName: 'Bali Sanur', category: 'road', gain: 8, grade: '1.0% Coastal Path',
    sky: ['#5E8C9E', '#E8DEC8'], fog: [80, 280], landmarkDesc: 'Gapura Candi Bentar, pasir pantai, laut & kelapa', recGear: 'UV-Shield Long Sleeve + Pleated Skort', staminaDrainMult: 1.05 },
  { id: 'lawu', name: 'SIKSOROGO LAWU ULTRA — Gunung Lawu', shortName: 'Siksorogo Lawu', category: 'trail', gain: 1200, grade: '18% Steep Mountain Trail',
    sky: ['#4E5D53', '#C9C6BC'], fog: [40, 170], landmarkDesc: 'Tanah merah, akar pinus, kebun teh Kemuning & sabana', recGear: 'Wajib: Trail Grip + Hydration Vest + Poles', staminaDrainMult: 1.45 },
  { id: 'bromo', name: 'BROMO TENGGER TRAIL — Lautan Pasir', shortName: 'Bromo Trail', category: 'trail', gain: 850, grade: '12% Volcanic Sand Sea',
    sky: ['#525861', '#C2B6A7'], fog: [60, 230], landmarkDesc: 'Lautan pasir vulkanik, dinding kaldera & kawah Bromo', recGear: 'Wajib: Trail Grip / Nyx Hyperfoam + Windbreaker', staminaDrainMult: 1.35 },
  { id: 'dieng_rinjani', name: 'DIENG CALDERA & RINJANI 100 — Summit Ultra', shortName: 'Dieng & Rinjani', category: 'trail', gain: 2330, grade: '22% Extreme Volcanic Ridge',
    sky: ['#424E5B', '#D5D0C5'], fog: [30, 150], landmarkDesc: 'Kabut negeri di atas awan, sabana Sembalun & Plawangan', recGear: 'Wajib: Titanium Ultra GPS + Grail Trail Pack', staminaDrainMult: 1.55 },
];

export const EXPO_BOOTHS = [
  { id: 'booth_willo', name: '1. Booth Utama Willo Apparel', subtitle: 'Official Pop-Up Store & Upgrade Gear', desc: 'Koleksi jersey earthy, skort, sepatu Nyx Hyperfoam, dan jam titanium.', btnText: 'Buka Katalog Gear', action: 'open_shop' },
  { id: 'booth_rpc', name: '2. Booth Race Pack Collection', subtitle: 'Pengambilan BIB & Tote Bag', desc: 'Klaim tote bag RPC (+400 Koin W, sekali sehari) dan ganti nomor BIB.', btnText: 'Klaim RPC & Ganti BIB', action: 'claim_rpc' },
  { id: 'booth_kopi', name: '3. Booth Kopi Kalcer & Carbo Bar', subtitle: 'Kuliner Skena & Pre-Race Buff', desc: 'Kopi Skena Kaki + Bakmi Carbo-Load: +18% pace & hemat stamina 25% untuk lari berikutnya.', btnText: 'Beli Paket Buff (200 W)', action: 'buy_buff' },
  { id: 'booth_photowall', name: '4. Booth Photo Wall & Giant Timer', subtitle: 'Cetak Struk Finisher', desc: 'Lihat lagi struk Race Receipt lari terakhirmu.', btnText: 'Buka Struk Terakhir', action: 'open_receipt' },
  { id: 'booth_recovery', name: '5. Booth Recovery & Physio Zone', subtitle: 'Massage Gun & Ice Bath', desc: '+1 cadangan nyawa untuk lari berikutnya dan Warm-Up Boost langsung penuh.', btnText: 'Recovery Penuh (Gratis)', action: 'do_recovery' },
  { id: 'booth_pacer', name: '6. Booth Crew & Pacer Station', subtitle: 'Bendera Pacer 4:30 / 5:00', desc: 'Pasang bendera pacer di punggung avatar. Ganti: tanpa → 4:30 → 5:00.', btnText: 'Ganti Bendera Pacer', action: 'toggle_pacer' },
];

export const LEADERBOARD_DATA = [
  { name: 'Arya_Sub4', crew: 'WILLO ELITE BDG', tier: '5. Titanium Ultra', pace: '3:34', map: 'lawu' },
  { name: 'NadiaKalcer', crew: 'SCBD RUN CLUB', tier: '5. Titanium Ultra', pace: '3:41', map: 'jakarta' },
  { name: 'RakaLawu100', crew: 'SOLO TRAIL RUN', tier: '4. Sage Elite', pace: '3:48', map: 'lawu' },
  { name: 'SintaHijabRun', crew: 'JOGJA PLAYON', tier: '4. Sage Elite', pace: '3:55', map: 'jogja' },
  { name: 'BimaSanur', crew: 'BALI DAWN PACER', tier: '3. Gold Sub-4', pace: '4:05', map: 'bali' },
  { name: 'ClaraSkort', crew: 'SURABAYA MARATHON', tier: '3. Gold Sub-4', pace: '4:12', map: 'jakarta' },
];

export const CHAT_AWAL = [
  { user: 'DimasSub4', ch: 'publik', text: 'Gas ikut rombongan Pacer 4:30 biar hemat stamina 15%!' },
  { user: 'NadiaKalcer', ch: 'publik', text: 'Warna rok lipit Bone Cream & jersey Sage Willo adem banget dilihat.' },
  { user: 'RakaLawu100', ch: 'pacer', text: 'Map Siksorogo Lawu tanjakannya +1,200m, wajib Sepatu Trail Grip!' },
  { user: 'SintaHijabRun', ch: 'crew', text: 'Habis finish kumpul di Booth Kopi Kalcer & Photo Wall ya!' },
];

export const CHAT_BANK = [
  'Pagi skena! Pace santai dulu, jangan langsung sprint 🏃',
  'Water station di 0.5K, siap-siap tap ya',
  'Siapa yang pakai Nyx Hyperfoam? Ngebut banget',
  'Drafting di belakang pacer beneran hemat stamina',
  'Kerucut di lajur kiri, awas!',
  'Habis ini ngopi di Booth Kopi Kalcer ☕',
  'Struk finisher-ku masuk story, mantap',
  'Jangan lupa ABC drills biar dapat +12% pace',
  'Cuacanya enak buat PB hari ini',
  'Ada yang crew Willo Elite? Bareng yuk',
  'Rok lipit Willo kebawa angin, estetik 😆',
  'Stamina kuning, ambil petir hijau!',
];

export const NAMA_NPC = ['DimasSub4', 'NadiaKalcer', 'RakaLawu100', 'SintaHijabRun', 'BimaSanur', 'ClaraSkort', 'Arya_Sub4', 'TomiPace5', 'Laras.run', 'YogaCFD', 'PutriTrail', 'Fajar_LSD', 'Wulan10K', 'AditTempo', 'RinaSkort', 'Kevin.Kalcer', 'MayaHalf', 'Bayu_Ultra', 'Nisa.Jog', 'Reza4.30'];
