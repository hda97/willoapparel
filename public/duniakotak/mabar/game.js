// Mabar Dunia Kotak — Dusun Kotak Wetan. Denah baku (village) + aset video (rumah, pekarangan, batu nama,
// warung panen, rumah kucing, avatar, Raka, Oyen). Online lewat /duniakotak/api/ruang (WebSocket).
import './js/putar.js'; // HP tegak -> otomatis tampil mendatar (harus paling awal)
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {raka, pose as rpose, reseed} from './js/lib.js';
import * as D from './js/desa.js';
import {warga, pose as wpose, KULIT, WARNA_RAMBUT, GAYA_RAMBUT} from './js/aset/avatar.js';
import {kucingMesh, WARNA_KUCING, DAFTAR_KUCING} from './js/aset/kucing.js';
import {warungMesh, rumahKucingMesh, WARNA_DINDING, WARNA_ATAP} from './js/aset/rumah.js';
import * as F from './js/aset/fasum.js';
import {buatNPC} from './js/npc.js?v=20261110dusun';
import {buatWargaNPC} from './js/wargaNpc.js';
import {kulon, JALAN_KULON, AWAL_KULON} from './js/kulon.js';
import {curug, JALAN_CURUG, AWAL_CURUG} from './js/curug.js';
import {tlaga, JALAN_TLAGA, AWAL_TLAGA} from './js/tlaga.js';
import {segara, AWAL_SEGARA, kodeUnit} from './js/segara.js';
import {buatNav, pecahRute} from './js/navigasi.js';
import {pasangDesaGabung, LETAK} from './js/desaGabung.js';

const $ = id => document.getElementById(id);
const VS = D.VS;
const LOT_D = 9;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const simpan = (k, v) => { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) {} };
const baca = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const bacaJ = k => { try { return JSON.parse(baca(k) || 'null'); } catch (e) { return null; } };
const toast = (m, ms = 2600) => { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), ms); };
const api = async (p, data) => { const r = await fetch('/duniakotak/api/' + p, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(data)}); const j = await r.json().catch(() => ({galat: 'Server tidak menjawab'})); if (!r.ok) throw new Error(j.galat || 'Gagal'); return j; };

// ---------- alamat (rumus Kotak Wetan) ----------
const JALAN = ['Melati','Mawar','Kenanga','Anggrek','Mangga','Rambutan','Durian','Salak','Jambu','Manggis','Sawo','Nangka','Belimbing','Kelengkeng','Sirsak'];
// Dusun: Kotak Wetan = warga No. 1–260, Kotak Kulon = No. 261–460 (3 Nov 2026), Kotak Curug = No. 461–660 (6 Nov 2026, saat Kulon penuh),
// Kotak Tlaga = No. 661–860 (8 Nov 2026, saat Curug penuh), Kotak Segara = No. 861+ (apartemen, tak terbatas; Huda 8 Nov 2026)
const dusunDari = n => n > AWAL_SEGARA ? 'segara' : n > AWAL_TLAGA ? 'tlaga' : n > AWAL_CURUG ? 'curug' : n > AWAL_KULON ? 'kulon' : 'wetan';
const NAMA_DUSUN = {wetan: 'Kotak Wetan', kulon: 'Kotak Kulon', curug: 'Kotak Curug', tlaga: 'Kotak Tlaga'};
// Segara TERKUNCI sampai 4 dusun lain benar-benar penuh (Huda 8 Nov 2026): baru ditambahkan ke NAMA_DUSUN (menu bus, gapura,
// Peta Desa, panel online, ?dusun=) setelah ada warga No. 861+. Lihat bukaSegara() di bangunDunia().
const bukaSegara = maks => { if (maks > AWAL_SEGARA) NAMA_DUSUN.segara = 'Kotak Segara'; };
const AWAL_DUSUN = {wetan: 0, kulon: AWAL_KULON, curug: AWAL_CURUG, tlaga: AWAL_TLAGA, segara: AWAL_SEGARA}, JALAN_DUSUN = {wetan: JALAN, kulon: JALAN_KULON, curug: JALAN_CURUG, tlaga: JALAN_TLAGA};
const alamat = n => { if (n > AWAL_SEGARA) return 'Apartemen Segara · ' + kodeUnit(n); const ds = dusunDari(n), k = n - AWAL_DUSUN[ds], rt = Math.ceil(k / 20), J = JALAN_DUSUN[ds];
  return `Jl. ${J[(rt - 1) % J.length]} No. ${((k - 1) % 20) + 1} · RT ${String(rt).padStart(2, '0')}/RW ${String(Math.ceil(rt / 5)).padStart(2, '0')}`; };
let DI = 'wetan';   // dusun yang sedang dibuka
let DG = null;      // desa gabungan: Peta Desa 5 dusun + jalan kaki lewat gapura (8 Nov 2026)

// ---------- avatar: hanya pilihan yang ada di aset ----------
const ATASAN = ['kaos','kaos-willo','kemeja','jaket','batik','seragam'];
const BAWAHAN = {L: ['celana','pendek','sarung'], P: ['celana','rok','rok-panjang']};
const WARNA_BAJU = ['#1d1d22','#f4f4f4','#3a7bd5','#d0442f','#2a9a5a','#f2c14e','#8a5ad8','#e06a9a'];
const WARNA_BAWAH = ['#2f3a52','#1d1d22','#6a5a48','#3a5a3a','#7a2a2a','#c8b89a'];
const hexOk = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
// ---------- Toko Hias (Permata 💎): warna sama dengan TOKO_HIAS di worker.js ----------
const WARNA_CAT = {krem: '#f1dcb4', putih: '#f4f1ea', biru: '#9cc4e8', hijau: '#a8d5a0', pink: '#f2b8c6', kuning: '#f5d76e', ungu: '#c3b1e1'};
const WARNA_PAGAR = {putih: '#ffffff', kayu: '#a0703c', hitam: '#3a3a40', biru: '#3a7bd5', merah: '#c8453a'};
const WARNA_TOPI = {merah: '#d8443a', biru: '#2f6fd8', hitam: '#24242a', kuning: '#f2c230'};
const HS = {};
// Hadiah pendukung Bata (Huda 8 Nov 2026): BT no → total Bata donasi, JR = nomor Juragan Bata (mahkota di atap)
const BT = {}, AL = {}; let JR = 0, TR = 0;   // AL = lencana Album lengkap (bit 1 🎣 ikan, bit 2 🧺 panen)
   // TR = rumah juara Lomba Rumah Terindah minggu lalu (piala emas di atas rumah)
const lencana = no => (AL[no] & 1 ? '🎣 ' : '') + (AL[no] & 2 ? '🧺 ' : '') + (AL[no] & 4 ? '🎪 ' : '') + (TR && TR === no ? '🏡 ' : '') + (JR && JR === no ? '👑 ' : '') + (BT[no] >= 1 ? '🧱 ' : '');   // no → {c: cat, p: pagar} (warga lain, dari /api/warga)
function bersihAv(a) {
  a = a && typeof a === 'object' ? a : {};
  const jenis = a.jenis === 'P' ? 'P' : 'L';
  const gaya = GAYA_RAMBUT[jenis].includes(a.rambut && a.rambut.gaya) ? a.rambut.gaya : GAYA_RAMBUT[jenis][0];
  return {
    jenis, kulit: KULIT.includes(a.kulit) ? a.kulit : KULIT[1],
    rambut: {gaya, warna: hexOk(a.rambut && a.rambut.warna) ? a.rambut.warna : WARNA_RAMBUT[0]},
    atasan: {jenis: ATASAN.includes(a.atasan && a.atasan.jenis) ? a.atasan.jenis : 'kaos', warna: hexOk(a.atasan && a.atasan.warna) ? a.atasan.warna : '#3a7bd5'},
    bawahan: {jenis: BAWAHAN[jenis].includes(a.bawahan && a.bawahan.jenis) ? a.bawahan.jenis : 'celana', warna: hexOk(a.bawahan && a.bawahan.warna) ? a.bawahan.warna : '#2f3a52'},
    ...(Object.values(WARNA_TOPI).includes(a.topi) ? {topi: a.topi} : {}),
  };
}
const avAcak = no => { const r = n => (no * 7919 + n * 104729) % 997; const jenis = r(1) % 2 ? 'P' : 'L';
  return bersihAv({jenis, kulit: KULIT[r(2) % 6], rambut: {gaya: GAYA_RAMBUT[jenis][r(3) % GAYA_RAMBUT[jenis].length], warna: WARNA_RAMBUT[r(4) % 6]}, atasan: {jenis: ATASAN[r(5) % 5], warna: WARNA_BAJU[r(6) % 8]}, bawahan: {jenis: BAWAHAN[jenis][0], warna: WARNA_BAWAH[r(7) % 6]}}); };

// ---------- keadaan ----------
const S = {saya: null, kunci: null, tamu: false, av: null, ws: null, others: new Map(), bisu: new Set(bacaJ('dk_bisu') || []), ch: 'sekitar', chat: {sekitar: [], dusun: []}};
const portrait = () => innerHeight > innerWidth;

// =====================================================================
// 1. MASUK
// =====================================================================
let wargaAwal = null;   // /api/warga diambil paralel dengan cek sesi supaya layar memuat lebih cepat
async function layarMasuk() {
  const isi = $('masukIsi');
  const lama = bacaJ('dk_warga');
  if ((lama && lama.kunci) || new URLSearchParams(location.search).has('tamu')) wargaAwal = fetch('/duniakotak/api/warga').then(r => r.json()).catch(() => null);
  if (lama && lama.kunci) {
    try { const s = await api('sesi', {kunci: lama.kunci}); if (!s.bagi) { location.replace('/duniakotak/?bagi=1#hasil'); return; } return selesaiMasuk(s); }
    catch (e) { /* kunci tidak berlaku: lanjut ke pintu masuk */ }
  }
  // Satu pintu: masuk/daftar lewat willoapparel.com/duniakotak. Game hanya terbuka langsung untuk tamu (?tamu=1).
  if (new URLSearchParams(location.search).has('tamu')) { S.tamu = true; return selesaiMasuk(null); }
  location.replace('/duniakotak/?masuk=1'); return;
  let clientId = '';
  try { clientId = (await (await fetch('/duniakotak/api/config')).json()).clientId || ''; } catch (e) {}
  const dalamApp = /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly|BytedanceWebview/i.test(navigator.userAgent || '');
  let h = '';
  if (clientId && dalamApp) {
    const url = location.href;
    const intent = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
    h += `<p class="sub">Login Google tidak bisa di dalam aplikasi Instagram/TikTok. Buka di Chrome atau browser HP-mu.</p>
      <a class="utama" style="text-decoration:none" href="${/Android/i.test(navigator.userAgent) ? intent : url}" target="_blank" rel="noopener">Buka di Chrome</a>
      <button class="tipis" id="salinLink">Salin link</button>`;
  } else if (clientId) {
    h += `<div id="gbtn" style="display:flex;justify-content:center;min-height:44px"></div>`;
  }
  h += `<p class="galat" id="galatMasuk"></p>
    <details ${clientId && !dalamApp ? '' : 'open'}><summary class="kecil" style="cursor:pointer">Masuk dengan username atau kode warga</summary>
    <div class="isian" style="margin-top:8px"><input id="kode" maxlength="80" placeholder="username IG/TikTok atau kode warga" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="go"><button class="utama" id="bKode">Masuk</button></div>
    <p class="kecil" style="margin-top:6px">Tulis username IG/TikTok yang dipakai saat daftar, atau kode warga dari Kartu Warga.</p></details>
    <a class="tipis" style="text-decoration:none" href="/duniakotak/">Belum jadi warga? Daftar dulu</a>
    <button class="tipis" id="bTamu">Lihat-lihat dulu (tanpa chat)</button>`;
  isi.innerHTML = h;
  const g = $('galatMasuk');
  if ($('salinLink')) $('salinLink').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(location.href); toast('Link disalin. Tempel di Chrome.'); };
  $('bKode').onclick = async () => {
    g.textContent = '';
    try { $('bKode').disabled = true; const s = await api('kode', {kode: $('kode').value}); simpan('dk_warga', {no: s.no, ig: s.ig, kunci: s.kunci}); selesaiMasuk(s); }
    catch (e) { g.textContent = e.message; } finally { $('bKode').disabled = false; }
  };
  $('kode').addEventListener('keydown', e => { if (e.key === 'Enter') $('bKode').click(); });
  $('bTamu').onclick = () => { S.tamu = true; selesaiMasuk(null); };
  if (clientId && !dalamApp) {
    const sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true;
    sc.onload = () => {
      google.accounts.id.initialize({client_id: clientId, auto_select: true, callback: r => masukGoogle(r.credential)});
      google.accounts.id.renderButton($('gbtn'), {theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', locale: 'id', width: 280});
    };
    document.head.appendChild(sc);
  }
}
async function masukGoogle(credential, isi) {
  const g = $('galatMasuk'); g.textContent = '';
  try {
    const lama = bacaJ('dk_warga') || {};
    const r = await api('google', {credential, kunci: lama.kunci || '', ...(isi || {})});
    if (r.perlu === 'ig') {
      $('masukIsi').innerHTML = `<p class="sub">Akun Google ini belum terhubung ke kavling. Tulis namamu. Kalau dulu daftar pakai Instagram atau TikTok, isi juga username-nya supaya kavling lamamu tersambung.</p>
        <div class="isian"><input id="namaTaut" maxlength="24" placeholder="Nama kamu"></div>
        <div class="isian" style="margin-top:8px"><input id="igTaut" maxlength="80" placeholder="@username Instagram" autocapitalize="none" autocorrect="off" spellcheck="false" inputmode="email"></div>
        <div class="isian" style="margin:8px 0"><input id="ttTaut" maxlength="80" placeholder="@username TikTok" autocapitalize="none" autocorrect="off" spellcheck="false" inputmode="email"></div>
        <button class="utama" id="bTaut">Hubungkan</button><p class="galat" id="galatMasuk"></p>`;
      const un = id => $(id).value.toLowerCase().replace(/\s+/g, '').replace(/^(https?:\/\/)?(www\.|m\.|vt\.)?(instagram\.com|tiktok\.com)\//, '').replace(/[?#].*$/, '').replace(/\/.*$/, '').replace(/^@+/, '');
      $('bTaut').onclick = () => {
        if (!$('namaTaut').value.trim()) { $('galatMasuk').textContent = 'Tulis namamu dulu.'; return; }
        masukGoogle(credential, {nama: $('namaTaut').value.trim(), ig: un('igTaut'), tiktok: un('ttTaut')});
      };
      return;
    }
    simpan('dk_warga', {no: r.no, ig: r.nm || r.ig, kunci: r.kunci});
    selesaiMasuk(await api('sesi', {kunci: r.kunci}));
  } catch (e) { const g2 = $('galatMasuk'); if (g2) g2.textContent = e.message; }
}
function selesaiMasuk(s) {
  if (s) { S.saya = s; S.kunci = s.kunci; S.hias = s.hias || null; muatPemula(s); aturHadir(s.hadir); simpan('dk_warga', {no: s.no, ig: s.ig, kunci: s.kunci}); muatTasServer(s); terimaMenit(s.menit);
    // Pulang kampung (audit ekonomi #3): bonus warga yang ≥3 hari tidak main
    if (s.pulang) setTimeout(() => { try { bunyi('masuk'); koinTerbang(`+${s.pulang.koin} 🪙 +${s.pulang.permata} 💎`); } catch (e) {} toast(`🏡 Selamat pulang kampung! ${s.pulang.hari} hari tidak ketemu, Oyen kangen. Bonus +${s.pulang.koin} koin dan +${s.pulang.permata} 💎.`, 6500); }, 4500); }
  $('masuk').hidden = true;
  if (!S.tamu && !baca('dk_aturan')) { $('aturan').hidden = false; $('setujuAturan').onclick = () => { simpan('dk_aturan', '1'); $('aturan').hidden = true; lanjutAvatar(); }; }
  else lanjutAvatar();
}
function lanjutAvatar() {
  if (S.tamu) { S.av = avAcak(7); return mulai(); }
  if (S.saya.avatar) { S.av = bersihAv(S.saya.avatar); return mulai(); }
  bukaPembuatAvatar(bersihAv({jenis: 'L'}), true);
}

// =====================================================================
// 2. PEMBUAT AVATAR (aset avatar.js)
// =====================================================================
let pv = null;
function bukaPembuatAvatar(av, pertama, cumaSiapkan) {
  $('buatAvatar').hidden = false; $('buatAvatar').querySelector('h2').textContent = 'Buat tokohmu';
  if (!pv) {
    const r = new THREE.WebGLRenderer({canvas: $('pratinjau'), antialias: true, alpha: true});
    r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); r.setSize(360, 420, false); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x88aa88, 1.6)); const d = new THREE.DirectionalLight(0xfff4e0, 2.2); d.position.set(4, 8, 10); sc.add(d);
    const cam = new THREE.PerspectiveCamera(30, 360 / 420, .1, 100); cam.position.set(0, 2.6, 13); cam.lookAt(0, 2.1, 0);
    pv = {r, sc, cam, obj: null, t: 0};
  }
  if (cumaSiapkan) return;
  pv.cam.position.set(0, 2.6, 13); pv.cam.lookAt(0, 2.1, 0);
  const gambar = () => { if (pv.obj) pv.sc.remove(pv.obj); pv.obj = warga(av); pv.obj.rotation.y = .5; pv.sc.add(pv.obj); pv.r.render(pv.sc, pv.cam); };
  const baris = (judul, list, aktif, pilih, warna) => `<div class="baris"><b>${judul}</b><div class="opsi">${list.map((v, i) => `<button data-k="${judul}" data-i="${i}" class="${warna ? 'w' : ''} ${v === aktif ? 'on' : ''}" ${warna ? `style="background:${v}" aria-label="${v}"` : ''}>${warna ? '' : esc(pilih ? pilih(v) : v)}</button>`).join('')}</div></div>`;
  const nama = {cepak: 'Cepak', belah: 'Belah', acak: 'Acak', keriting: 'Keriting', panjang: 'Panjang', kuncir: 'Kuncir', kepang: 'Kepang', bob: 'Bob', hijab: 'Hijab', kaos: 'Kaos', 'kaos-willo': 'Kaos Willo', kemeja: 'Kemeja', jaket: 'Jaket', batik: 'Batik', seragam: 'Seragam', celana: 'Celana', pendek: 'Celana pendek', sarung: 'Sarung', rok: 'Rok', 'rok-panjang': 'Rok panjang', L: 'Laki-laki', P: 'Perempuan'};
  const tulis = () => {
    $('pilihan').innerHTML = baris('Jenis', ['L', 'P'], av.jenis, v => nama[v]) + baris('Kulit', KULIT, av.kulit, null, 1) + baris('Rambut', GAYA_RAMBUT[av.jenis], av.rambut.gaya, v => nama[v]) +
      (av.rambut.gaya === 'hijab' ? baris('Warna hijab', WARNA_BAJU, av.rambut.warna, null, 1) : baris('Warna rambut', WARNA_RAMBUT, av.rambut.warna, null, 1)) +
      baris('Atasan', ATASAN, av.atasan.jenis, v => nama[v]) + baris('Warna atasan', WARNA_BAJU, av.atasan.warna, null, 1) +
      baris('Bawahan', BAWAHAN[av.jenis], av.bawahan.jenis, v => nama[v]) + baris('Warna bawahan', WARNA_BAWAH, av.bawahan.warna, null, 1);
    $('pilihan').querySelectorAll('button').forEach(b => b.onclick = () => {
      const k = b.dataset.k, i = +b.dataset.i;
      if (k === 'Jenis') { av.jenis = ['L', 'P'][i]; av = bersihAv({...av, rambut: {gaya: '', warna: av.rambut.warna}, bawahan: {jenis: '', warna: av.bawahan.warna}}); }
      if (k === 'Kulit') av.kulit = KULIT[i];
      if (k === 'Rambut') av.rambut.gaya = GAYA_RAMBUT[av.jenis][i];
      if (k === 'Warna rambut') av.rambut.warna = WARNA_RAMBUT[i];
      if (k === 'Warna hijab') av.rambut.warna = WARNA_BAJU[i];
      if (k === 'Atasan') av.atasan.jenis = ATASAN[i];
      if (k === 'Warna atasan') av.atasan.warna = WARNA_BAJU[i];
      if (k === 'Bawahan') av.bawahan.jenis = BAWAHAN[av.jenis][i];
      if (k === 'Warna bawahan') av.bawahan.warna = WARNA_BAWAH[i];
      tulis(); gambar();
    });
  };
  tulis(); gambar();
  $('simpanAvatar').textContent = pertama ? 'Simpan dan masuk desa' : 'Simpan';
  $('simpanAvatar').onclick = async () => {
    $('simpanAvatar').disabled = true;
    try { if (!S.tamu) await api('avatar', {kunci: S.kunci, avatar: av}); S.av = bersihAv({...av, topi: WARNA_TOPI[S.hias?.topi]}); $('buatAvatar').hidden = true; if (pertama) mulai(); else gantiAvatarSaya(); }
    catch (e) { toast(e.message); } finally { $('simpanAvatar').disabled = false; }
  };
}

// =====================================================================
// 3. DUNIA
// =====================================================================
// HP (termasuk browser bawaan IG/TikTok) = mode hemat: tanpa bayangan, resolusi 1x, jarak pandang lebih dekat.
// Dulu hanya dilihat dari jumlah inti prosesor, padahal HP sekarang rata-rata 8 inti -> mode hemat tidak pernah aktif.
const uaHP = /Android|iPhone|iPad|iPod|Mobile|Instagram|FBAN|FBAV|TikTok|musical_ly|BytedanceWebview/i.test(navigator.userAgent || '') || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent || ''));
const hemat = uaHP || (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 8) <= 4;
const R = new THREE.WebGLRenderer({canvas: $('layar'), antialias: !hemat, powerPreference: 'high-performance'});
const DPR = Math.min(hemat ? 1.5 : 1.75, devicePixelRatio || 1);
R.setPixelRatio(DPR);
R.shadowMap.enabled = !hemat; R.shadowMap.type = THREE.PCFSoftShadowMap;
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.25; R.outputColorSpace = THREE.SRGBColorSpace;
const sc = new THREE.Scene(); sc.background = new THREE.Color(0xbfe4ff); sc.fog = hemat ? new THREE.Fog(0xbfe4ff, 210, 430) : new THREE.Fog(0xbfe4ff, 260, 520);
const cam = new THREE.PerspectiveCamera(38, 1, 1, hemat ? 450 : 560);
let I = null, NM = {}, KC = {}, AK = {}, npc = null, wnpc = null;   // AK: no → terakhir main (ms)   // KC: no → kucing warga {k:[{w,n}], d, a}
const lotRuntime = new Map();   // no → {g, extra, rects}
const dekor = new Map();        // rects statis tambahan

// Kotak Wetan: 12 baris = kavling 1-200 (denah baku). Baris 13-15 = perluasan selatan untuk warga 201-260 (3 Nov 2026).
// Kavling lama tidak bergeser relatif satu sama lain; angka ini harus sama untuk semua pemain (posisi online).
const BARIS = 15;
// Baris 16 (3 Nov 2026) = baris FASUM tambahan di tepi selatan (denah lama tidak bergeser, nomor kavling tidak berubah):
// blok (1,15) Rumah Sakit, (2,15) Stadion, (0,15) Kampus (voting 6 Nov 2026), (3,15)/(4,15) lahan kosong untuk voting berikutnya.
// DENAH FASUM TERSEBAR (Huda 6 Nov 2026): fasum disebar merata ke seluruh lahan dusun (tidak bergerombol di tengah/ujung).
// Blok [kolom, baris] (5 kolom × 16 baris), urutan = indeks fas yang dipakai game (PASANG_FASUM, BANGUN_VOTING, npc.js). Nomor rumah tetap urut.
const FASUM_WETAN = [[1,0], [0,2], [3,1], [1,5], [3,6], [0,7], [4,9], [0,12], [4,14], [2,11,1], [1,10], [4,4], [2,13], [2,8], [1,15]];
// Bangunan fasum sama persis dengan video Hari 2 (aset fasum.js): fas[1..8]. fas[0] dekat rumah Raka = Supermarket (voting 3 Nov). fas[9] = terminal; fas[10..12] kampus, RS, stadion; fas[13] Taman Kota; fas[14] lahan voting berikutnya.
const PASANG_FASUM = [[0, 'supermarket', '🛒 Supermarket Dunia Kotak'], [10, 'kampus', '🎓 Kampus Dunia Kotak'], [11, 'rumahSakit', '🏥 Rumah Sakit'], [12, 'stadion', '🏟️ Stadion Dunia Kotak'], [1, 'sekolah', '🏫 SD Dunia Kotak'], [2, 'warung', '🛒 Warung Desa'], [3, 'masjid', '🕌 Masjid'], [4, 'gereja', '⛪ Gereja'], [5, 'katedral', '⛪ Gereja Katolik'], [6, 'pura', '🛕 Pura'], [7, 'vihara', '☸️ Vihara'], [8, 'klenteng', '🏮 Klenteng']];
// FASUM TERSEBAR (Huda 9 Nov 2026): beda dusun beda fasum, supaya warga main ke dusun lain. Tiap calon voting sudah punya
// lahan tetap: [dusun, lahan]. Wetan: lahan = indeks fas; dusun lain: indeks lahanKosong (lahan tanpa aset di kulon/curug/tlaga.js).
// Curug & Tlaga mulai dari lahan 1 (lahan 0 = tempat main anak NPC). Entri BANGUN_VOTING untuk dusun lain: {dusun, lahan, ...}.
const LOKASI_FASUM = {kafe: ['kulon', 0], polisi: ['curug', 1], hiburan: ['tlaga', 1], damkar: ['kulon', 1], perpus: ['curug', 0], renang: ['tlaga', 0], bioskop: ['wetan', 14]};
// aset & nama tiap calon (aset di js/aset/fasum.js). Fasum lain (damkar, perpus, renang, bioskop) asetnya dibuat saat jadi calon.
const ASET_CALON = {kafe: ['kafe', '☕ Kafe Bukit'], polisi: ['polisi', '👮 Kantor Polisi'], hiburan: ['hiburan', '🎡 Taman Hiburan']};
// Pemenang voting → entri BANGUN_VOTING di dusun tujuannya, mis. bangunCalon('kafe', Date.parse('2026-11-14T00:00:00+07:00')).
const bangunCalon = (c, mulai) => { const [dusun, lahan] = LOKASI_FASUM[c], [aset, nama] = ASET_CALON[c];
  return {id: c, dusun, lahan, fas: lahan, aset, nama, judul: 'PEMBANGUNAN ' + nama.replace(/^\S+ /, '').toUpperCase(), mulai, sampai: mulai + 7 * 864e5}; };
// Fasum pemenang voting yang sedang dibangun (Huda 6 Nov 2026: Taman Kota). Sebelum `sampai` lahannya jadi proyek
// (pagar seng, perancah, warga offline gotong royong); sesudahnya bangunan jadi otomatis berdiri. Fasum berikutnya: tambah entri baru.
const BANGUN_VOTING = [{id: 'taman', fas: 13, aset: 'tamanKota', nama: '🌳 Taman Kota', judul: 'PEMBANGUNAN TAMAN KOTA', mulai: Date.parse('2026-11-07T00:00:00+07:00'), sampai: Date.parse('2026-11-14T00:00:00+07:00')}];
// pratinjau: ?uji_fasum=kafe → fasum calon itu sudah jadi di dusun tujuannya (tambah &uji_tahap=0..2 untuk melihat proyeknya)
{ const u = new URLSearchParams(location.search), c = u.get('uji_fasum'); if (ASET_CALON[c]) BANGUN_VOTING.push(bangunCalon(c, u.get('uji_tahap') != null ? Date.now() - 864e5 : Date.now() - 8 * 864e5)); }
// Tukang Kotak (Huda 10 Nov 2026): warga yang ikut membangun lewat /duniakotak/bangun/ mempercepat fasum, jadi tanggal jadi
// diambil dari server (GET /api/bangun, di-cache 30 dtk). Gagal/lambat (>2,5 dtk) = pakai jadwal asli di atas.
try { const j = await (await fetch('/duniakotak/api/bangun', {signal: AbortSignal.timeout(2500)})).json();
  for (const b of BANGUN_VOTING) { const x = (j.proyek || []).find(p => p.id === b.id); if (x && x.sampai > b.mulai && x.sampai <= b.sampai) b.sampai = x.sampai; } } catch (e) {}
// tahap visual (Huda 6 Nov): sepertiga awal fondasi, sepertiga kedua pasang bata, sepertiga akhir setengah jadi, lalu jadi
const tahapBangun = b => { const uji = new URLSearchParams(location.search).get('uji_tahap'); if (uji != null) return +uji; const p = (Date.now() - b.mulai) / (b.sampai - b.mulai); return p < 1 / 3 ? 0 : p < 2 / 3 ? 1 : 2; };
const dusunBangun = b => b.dusun || 'wetan';
const lahanBangun = b => dusunBangun(b) === 'wetan' ? I.fas?.[b.fas] : (f => f && {x: f.x * VS, y: (f.y || 0) * VS, z: f.z * VS, g: f.g})(I.lahanKosong?.[b.lahan]);
const bangunAktif = () => BANGUN_VOTING.find(b => dusunBangun(b) === DI && Date.now() < b.sampai) || null;
const pasangVoting = () => BANGUN_VOTING.filter(b => dusunBangun(b) === DI).map(b => Date.now() < b.sampai ? [b, 'proyek', '🚧 ' + b.nama.replace(/^\S+ /, '') + ' (' + ['fondasi', 'pasang bata', 'setengah jadi'][tahapBangun(b)] + ')', [b.judul, tahapBangun(b), F[b.aset]]] : [b, b.aset, b.nama]);
// fasum khas yang SUDAH berdiri di tiap dusun (bahan misi "Kunjungi fasum khas", makin banyak fasum makin beragam misinya)
const FASUM_KHAS = () => [['wetan', 'Supermarket'], ['wetan', 'Kampus'], ['wetan', 'Rumah Sakit'], ['wetan', 'Stadion'],
  ...BANGUN_VOTING.filter(b => Date.now() >= b.sampai).map(b => [dusunBangun(b), b.nama.replace(/^\S+ /, '')])];
// bagian berputar (bianglala, komidi putar) dari aset fasum: userData.putar = [{o, ax, v}]
const PUTAR = [];
function catatPutar(m) { (m.userData.putar || []).forEach(p => PUTAR.push(p)); }
function animPutar(dt) { for (const p of PUTAR) { p.o.rotation[p.ax] += p.v * dt; if (p.ax === 'z') p.o.children.forEach(c => { if (c.userData.tegak) c.rotation.z = -p.o.rotation.z; }); } }
// fasum pemenang voting di dusun selain Wetan (dipanggil bangunKulon sebelum pasangAtasFasum)
function pasangVotingDusun() {
  const g = new THREE.Group(); sc.add(g); let ada = false;
  for (const [b, k, nama, judul] of pasangVoting()) {
    const f = lahanBangun(b); if (!f || !F[k]) continue;
    if (f.g) f.g.children.slice(1).forEach(c => f.g.remove(c));
    const m = Array.isArray(judul) ? F[k](...judul) : F[k](); m.scale.setScalar(VS); m.position.set(f.x, f.y, f.z); g.add(m); catatPutar(m); ada = true;
    fasumBangun.push({position: new THREE.Vector3(f.x, f.y, f.z), nama, ...F.pisahFasum(m)});
  }
  if (ada) { kumpulPijakan(g); bakeGroup(g); } else sc.remove(g);
}
const fasumBangun = [];   // {pos, nama, rect}
function pasangFasum() {
  const g = new THREE.Group(); sc.add(g);
  I.G.updateMatrixWorld(true);
  for (const [i, k, nama, judul] of [...PASANG_FASUM, ...pasangVoting().map(([b, ...r]) => [b.fas, ...r])]) {
    const f = I.fas && I.fas[i]; if (!f || !F[k]) continue;
    // kosongkan papan "LAHAN FASUM" + patok, sisakan tanahnya (seperti video)
    I.G.traverse(o => { if (o.isGroup && o.parent === I.G && Math.abs(o.position.x * VS - f.x) < 1 && Math.abs(o.position.z * VS - f.z) < 1) o.children.slice(1).forEach(c => o.remove(c)); });
    const m = Array.isArray(judul) ? F[k](...judul) : F[k](); m.scale.setScalar(VS); m.position.set(f.x, 0, f.z); g.add(m); catatPutar(m);
    // tabrakan per dinding (pintu terbuka & ruang dalam bisa dimasuki, 6 Nov 2026); bagian atas disembunyikan saat warga di dalam
    fasumBangun.push({position: new THREE.Vector3(f.x, 0, f.z), nama, ...F.pisahFasum(m)});
  }
  pasangGapuraCFD(g);
  kumpulPijakan(g);
  bakeGroup(g);
  pasangAtasFasum(fasumBangun);
}
// ---------- Gapura CFD Pelari Kalcer (Huda 8 Nov 2026): game lari terpisah (/pelarikalcer/), pintunya di Stadion Kotak Wetan ----------
// Gapura berdiri di ujung timur lapangan stadion (belakang gawang). Warga yang mendekat dapat tombol "Ikut Lari".
let GAPURA_CFD = null;
function pasangGapuraCFD(g) {
  const f = DI === 'wetan' && I.fas && I.fas[12]; if (!f) return;
  const gp = new THREE.Group(), O = 0xe0803a, N = 0x2c3150;
  for (const s of [-1, 1]) { gp.add(kotakD(.55, 3.6, .55, N, 0, 1.8, s * 2.1)); gp.add(kotakD(.7, .3, .7, O, 0, .15, s * 2.1)); gp.add(kotakD(.7, .3, .7, O, 0, 3.55, s * 2.1)); }
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#e0803a'; x.fillRect(0, 0, 1024, 256); x.fillStyle = '#2c3150'; x.fillRect(0, 196, 1024, 60);
  // ukuran huruf disesuaikan lebar papan supaya tidak terpotong di tepi (Huda 8 Nov 2026: tulisan kebesaran, terbaca "ELARI KALCE")
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const pas = (t, w, maks, tebal) => { let u = maks; x.font = `${tebal} ${u}px Montserrat, sans-serif`; while (x.measureText(t).width > w && u > 20) { u -= 2; x.font = `${tebal} ${u}px Montserrat, sans-serif`; } };
  pas('PELARI KALCER', 680, 84, 900); x.fillText('PELARI KALCER', 512, 100);
  pas('CFD 1 KM · START DI SINI', 680, 34, 800); x.fillText('CFD 1 KM · START DI SINI', 512, 226);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const papan = new THREE.Mesh(new THREE.BoxGeometry(.35, 1.15, 4.8), [0, 1, 2, 3, 4, 5].map(i => new THREE.MeshStandardMaterial(i < 2 ? {map: t, roughness: .8} : {color: N, roughness: .8})));
  papan.position.set(0, 3.05, 0); gp.add(papan);
  gp.scale.setScalar(VS); gp.position.set(f.x + 8.4 * VS, 0, f.z); sc.add(gp);   // tidak ikut bakeGroup supaya tulisan papan tetap ada
  GAPURA_CFD = {x: f.x + 8.4 * VS, z: f.z};
}
const dekatGapuraCFD = me => !!GAPURA_CFD && Math.hypot(me.position.x - GAPURA_CFD.x, me.position.z - GAPURA_CFD.z) < 4 * VS;
// Pintu Tukang Kotak: warga yang berdiri di lahan proyek fasum dapat tombol 🔨 Bangun → mini-game membangun (halaman terpisah).
const dekatProyek = me => !S.tamu && fasumBangun.some(f => {
  if (!/^🚧/.test(f.nama || '')) return false; const x = me.position.x, z = me.position.z, k = f.rect, d = 2 * VS;
  return k ? x > k[0] - d && x < k[1] + d && z > k[2] - d && z < k[3] + d : Math.hypot(x - f.position.x, z - f.position.z) < 6 * VS; });
function ikutBangun() { bunyi('masuk'); toast('🔨 Pakai helm dulu, menuju lahan proyek…', 1500); setTimeout(() => { location.href = '/duniakotak/bangun/?dari=desa&dusun=' + DI; }, 500); }
function ikutLari() { bunyi('masuk'); toast('🏃 Menuju garis start Pelari Kalcer…', 1500); setTimeout(() => { location.href = '/pelarikalcer/?dari=desa'; }, 500); }
// bagian atas tiap fasum (atap, dinding atas, lantai 2) = grup sendiri supaya bisa disembunyikan saat warga ada di dalam
function pasangAtasFasum(daftar) {
  for (const f of daftar) if (f.atas && !f.atas.parent) { sc.add(f.atas); kumpulPijakan(f.atas); bakeGroup(f.atas); }
}
// ---------- Masuk rumah (Huda 6 Nov 2026): rumah jadi "rumah boneka" saat warga di dalam ----------
// Badan rumah disembunyikan, diganti lantai kayu + dinding rendah + perabot (satuan fullHouse: lebar 5, dalam 4, pintu di depan +z).
function buatInterior(n) {
  const h = S.saya && n === S.saya.no && S.hias ? S.hias.cat : HS[n]?.c, dinding = (h && WARNA_CAT[h]) || 0xf1dcb4;
  const G = new THREE.Group(), k = (w, hh, d, c, x, y, z) => G.add(kotakD(w, hh, d, c, x, y, z));
  k(4.9, .06, 3.9, 0xc89a64, 0, .03, 0);                       // lantai kayu
  for (let i = -2; i <= 2; i++) k(.02, .061, 3.9, 0xa87a48, i, .031, 0);
  k(1.7, .02, 1.2, 0xc0463a, -.4, .07, .7); k(1.3, .021, .8, 0xe8c070, -.4, .075, .7);   // karpet
  const T = .75;                                               // dinding rendah supaya isi rumah terlihat
  k(5, T, .12, dinding, 0, T / 2, -1.96); k(.12, T, 4, dinding, -2.44, T / 2, 0); k(.12, T, 4, dinding, 2.44, T / 2, 0);
  k(1.95, T, .12, dinding, -1.53, T / 2, 1.96); k(1.95, T, .12, dinding, 1.53, T / 2, 1.96);
  [[-2.44, -1.96], [2.44, -1.96], [-2.44, 1.96], [2.44, 1.96], [-.55, 1.96], [.55, 1.96]].forEach(([x, z]) => k(.18, T + .06, .18, 0xffffff, x, (T + .06) / 2, z));
  // kasur (pojok kiri belakang)
  k(1.2, .3, 2, 0x8a5a3a, -1.75, .15, -.95); k(1.1, .14, 1.9, 0xf4f4f4, -1.75, .37, -.95); k(.8, .12, .35, 0xffffff, -1.75, .5, -1.7);
  k(1.14, .08, 1.15, 0x3a7bd5, -1.75, .48, -.45); k(1.2, .7, .12, 0x7a4a2a, -1.75, .35, -1.95);
  // lemari (pojok kanan belakang)
  k(1.2, 1.5, .55, 0x7a4a2a, 1.75, .75, -1.6); k(.03, 1.3, .02, 0x4a2a1a, 1.75, .78, -1.32); k(.06, .14, .04, 0xffd040, 1.66, .8, -1.31); k(.06, .14, .04, 0xffd040, 1.84, .8, -1.31);
  // TV di meja (tengah belakang)
  k(1.2, .4, .45, 0x5a3a2a, .1, .2, -1.7); k(1.05, .6, .08, 0x1d1d22, .1, .72, -1.72); k(.95, .5, .02, 0x2f6fd8, .1, .72, -1.675);
  // sofa menghadap TV (depan kiri)
  k(1.6, .32, .7, 0x2a9a5a, -.4, .16, .05); k(1.6, .45, .2, 0x2a9a5a, -.4, .45, .35); k(.18, .45, .7, 0x23804a, -1.2, .3, .05); k(.18, .45, .7, 0x23804a, .4, .3, .05);
  k(.5, .14, .5, 0xffd23a, -.8, .38, .05); k(.5, .14, .5, 0xff8a3a, 0, .38, .05);
  // meja makan + 2 kursi (kanan depan)
  k(1, .07, .75, 0xb07a48, 1.7, .62, .55); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => k(.07, .6, .07, 0x7a4a2a, 1.7 + a * .42, .3, .55 + b * .3));
  [[1.7, -.05], [1.7, 1.15]].forEach(([x, z]) => { k(.45, .06, .45, 0x8a5a3a, x, .38, z); k(.45, .4, .06, 0x8a5a3a, x, .6, z + (z < .55 ? -.2 : .2)); k(.05, .36, .05, 0x7a4a2a, x - .18, .18, z - .18); k(.05, .36, .05, 0x7a4a2a, x + .18, .18, z + .18); });
  k(.35, .12, .35, 0xffffff, 1.7, .72, .55); k(.18, .1, .18, 0xff5a3a, 1.7, .8, .55);   // piring + buah
  // lampu berdiri + pot tanaman dekat pintu
  k(.06, 1.2, .06, 0x2a2a2a, -2.2, .6, .9); const lm = new THREE.Mesh(new THREE.BoxGeometry(.4, .3, .4), new THREE.MeshBasicMaterial({color: 0xffe8a0})); lm.position.set(-2.2, 1.25, .9); G.add(lm);
  k(.35, .35, .35, 0xb0603a, 1.0, .18, 1.7); k(.5, .5, .5, 0x3f9a3a, 1.0, .6, 1.7); k(.3, .3, .3, 0x4fae3c, 1.05, .95, 1.65);
  // jam dinding + bingkai foto di dinding belakang bagian atas (melayang rendah di atas dinding pendek)
  k(.5, .4, .04, 0xffffff, -.9, .62, -1.88); k(.42, .32, .02, 0xffb347, -.9, .62, -1.86);
  G.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return G;
}
let rumahDalam = null;   // nomor kavling yang rumahnya sedang dimasuki
function cekDalamRumah(me) {
  const x = me.position.x, z = me.position.z; let di = null;
  for (const [n, rt] of lotRuntime) { const r = rt.dalam; if (r && x > r[0] && x < r[1] && z > r[2] && z < r[3]) { di = n; break; } }
  if (di === rumahDalam) return;
  const lama = rumahDalam != null && lotRuntime.get(rumahDalam); if (lama && lama.rumah) { lama.rumah.visible = true; if (lama.interior) lama.interior.visible = false; }
  rumahDalam = di; if (di == null) return;
  const rt = lotRuntime.get(di), H = rt.rumah; if (!H) return;
  if (!rt.interior) { const IG = buatInterior(di); H.parent.add(IG); bakeGroup(IG); rt.interior = IG; }
  H.visible = false; rt.interior.visible = true;
  const nm = di === S.saya?.no ? 'rumahmu' : 'rumah @' + (NM[di] || (di === 1 ? 'raka' : 'warga'));
  me.userData.gel = {m: '🏠 Masuk ' + nm, sampai: performance.now() + 2500};
}
let fasumDalam = null;
function cekDalamFasum(me) {
  const x = me.position.x, z = me.position.z;
  const di = fasumBangun.find(f => f.zona && f.zona.some(k => x > k[0] && x < k[1] && z > k[2] && z < k[3] && me.position.y < k[4] + 3 * VS)) || null;
  if (di === fasumDalam) return;
  if (fasumDalam && fasumDalam.atas) fasumDalam.atas.visible = true;
  if (di && di.atas) di.atas.visible = false;
  fasumDalam = di;
  if (di) me.userData.gel = {m: '🚪 Masuk ' + di.nama, sampai: performance.now() + 2500};
}
function bangunProksi() {
  // proksi rumah jauh: 1 kotak dinding + 1 atap per kavling berpenghuni (2 draw call untuk semua)
  const isi = Object.entries(I.lots).filter(([n]) => (+n === 1 && DI === 'wetan') || NM[n]);
  const geoW = new THREE.BoxGeometry(2 * VS, 1.3 * VS, 1.6 * VS), geoA = new THREE.ConeGeometry(1.55 * VS, .9 * VS, 4); geoA.rotateY(Math.PI / 4);
  const n0 = Math.max(1, isi.length);
  const imW = new THREE.InstancedMesh(geoW, new THREE.MeshStandardMaterial({color: 0xf1dcb4, roughness: .85}), n0);
  const imA = new THREE.InstancedMesh(geoA, new THREE.MeshStandardMaterial({color: 0xffffff, roughness: .85}), n0);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), roofs2 = [0xc8553d,0x3a7ad8,0x3aa860,0xe0a020,0x9a5ad8,0xd84a8a,0x2a9a9a,0xe06a2a];
  if (!isi.length) { imW.count = imA.count = 0; }
  isi.forEach(([n, L], i) => {
    const hx = L.c.x + L.dir * -2 * VS, hz = L.c.z + L.dir * -.6 * VS, y0 = L.c.y || 0;
    M.compose(new THREE.Vector3(hx, y0 + .65 * VS, hz), q, one); imW.setMatrixAt(i, M);
    M.compose(new THREE.Vector3(hx, y0 + 1.75 * VS, hz), q, new THREE.Vector3(1, 1, .8)); imA.setMatrixAt(i, M);
    imA.setColorAt(i, new THREE.Color(+n === 1 ? 0xc8553d : roofs2[(n * 5) % roofs2.length]));
    L.proxyIdx = i; L.n = +n;
  });
  imW.castShadow = imA.castShadow = false; sc.add(imW, imA); I.proxy = {imW, imA, isi};
}
// Dusun 2 Kotak Kulon (denah BAKU, bukit terasering) / Dusun 3 Kotak Curug (denah BAKU, lereng gunung + air terjun)
function bangunCurug() { return bangunKulon(curug); }
// Dusun 4 Kotak Tlaga (tepi danau, dibuka 8 Nov 2026)
function bangunTlaga() { return bangunKulon(tlaga); }
// Dusun 5 Kotak Segara (kota menara apartemen, 8 Nov 2026): tanpa proksi rumah; unit dibangun per lantai lewat bangunUnit()
function bangunSegara() {
  const maksNo = S.saya ? S.saya.no : 0;
  I = segara(sc, {names: NM, isFilled: n => !!NM[n], maksNo, sm: hemat ? 1024 : 2048, shadowR: 70, hemat});
  I.light.castShadow = !hemat;
  kumpulPijakan(I.G); kumpulPijakan(I.grupFasum);
  pecahInstanced(I.G); bakeGroup(I.G); bakeGroup(I.grupFasum);
  fasumBangun.push(...I.bangunan);
  pasangAtasFasum(fasumBangun);
  I.bangunUnit = bangunUnitSegara;
}
function bangunKulon(buat = kulon) {
  I = buat(sc, {names: NM, isFilled: n => !!NM[n], sm: hemat ? 1024 : 2048, shadowR: 70, hemat});
  I.light.castShadow = !hemat;
  kumpulPijakan(I.G); kumpulPijakan(I.grupFasum);
  pecahInstanced(I.G); bakeGroup(I.G); bakeGroup(I.grupFasum);
  fasumBangun.push(...I.bangunan);
  pasangVotingDusun();
  pasangAtasFasum(fasumBangun);
  bangunProksi();
}
async function bangunDunia() {
  try { const w = (wargaAwal && await wargaAwal) || await (await fetch('/duniakotak/api/warga')).json(); wargaAwal = null; w.warga.forEach(x => { if (x.ig || x.tiktok) NM[x.no] = '@' + (x.ig || x.tiktok); if (x.kc) KC[x.no] = x.kc; if (x.ak) AK[x.no] = x.ak; if (x.hs) HS[x.no] = x.hs; if (x.bt) BT[x.no] = x.bt; if (x.jr) JR = x.no; if (x.tr) TR = x.no; if (x.al) AL[x.no] = x.al; }); } catch (e) {}
  if (S.saya && S.saya.kucing) KC[S.saya.no] = S.saya.kucing;
  if (S.saya && S.saya.ig) NM[S.saya.no] = '@' + S.saya.ig;
  bukaSegara(Math.max(S.saya ? S.saya.no : 0, ...Object.keys(NM).map(Number)));
  await document.fonts.load('900 40px Montserrat').catch(() => {});
  const minta = new URLSearchParams(location.search).get('dusun');
  DI = NAMA_DUSUN[minta] ? minta : (S.saya ? dusunDari(S.saya.no) : 'wetan');
  if (DI === 'kulon') return bangunKulon();
  if (DI === 'curug') return bangunCurug();
  if (DI === 'tlaga') return bangunTlaga();
  if (DI === 'segara') return bangunSegara();
  reseed(301);
  I = D.village(sc, {cols: 5, rows: BARIS + 1, fasumB: FASUM_WETAN.filter(k => k.length === 2), fasumH: FASUM_WETAN.filter(k => k.length === 3), fasUrut: FASUM_WETAN, sungai: {gap: 6, w: 14, sawah: 40}, hutan: 1, tipis: .02,
    raka: 'done', filled: 999, isFilled: n => !!NM[n], names: NM, lazy: true, sm: hemat ? 1024 : 2048, shadowR: 70});
  I.light.castShadow = !hemat;
  pasangFasum();
  pasangPapanDana();
  pasangPlakat();
  // kubus kembar yang banyak (jalan, hutan, sawah): dipecah per petak supaya yang di luar layar tidak digambar,
  // bentuk kubus versi ringan, dan tidak ikut bayangan (hemat untuk HP)
  kumpulPijakan(I.G);
  pecahInstanced(I.G);
  // gabung benda statis (sungai, jembatan, fasum) supaya ringan
  bakeGroup(I.G);
  bangunProksi();
  // tepi dunia untuk gerak + sungai (dilarang menyeberang selain di jembatan)
  const ox = I.ox, oz = I.oz;
  I.batas = {x0: (ox - 4) * VS, x1: (ox + I.TW + 6 + 14 + 3 + 40 + 2) * VS, z0: (oz - 6) * VS, z1: (oz + I.TD + 6) * VS};
  // dek jembatan (lebih tinggi dari jalan): avatar naik ke atasnya, tidak tenggelam
  I.dek = {x0: (ox + I.TW + 6 - 2) * VS, x1: (ox + I.TW + 6 + 14 + 2) * VS, y: .65 * VS, z: I.hroads.filter(([a, b]) => b - a >= 3.9).map(([a, b]) => [(a + oz - .5) * VS, (b + oz + .5) * VS])};
  I.sungai = {x0: (ox + I.TW + 6 - 1.5) * VS, x1: (ox + I.TW + 6 + 14 + 1.5) * VS, jembatan: I.hroads.filter(([a, b]) => b - a >= 3.9).map(([a, b]) => [(a + oz) * VS + 2, (b + oz) * VS - 2])};
}

const GEO_RINGAN = new RoundedBoxGeometry(1, 1, 1, 1, .07), GEO_DATAR = new THREE.BoxGeometry(1, 1, 1);
function pecahInstanced(root) {
  root.updateMatrixWorld(true);
  const daftar = []; root.traverse(m => { if (m.isInstancedMesh && m.count > 300) daftar.push(m); });
  const M = new THREE.Matrix4(), W = new THREE.Matrix4(), P = new THREE.Vector3(), C = new THREE.Color();
  // Ringan untuk HP (8 Nov 2026): kubus dari semua kelompok (jalan, rumput, sawah, hutan) yang bahannya sama
  // digabung per petak 140x140, jadi satu petak = satu kali gambar (dulu satu petak bisa puluhan kali gambar).
  const sel = new Map(), CELL = 140;
  for (const im of daftar) {
    const datar = im.scale.y < .5;                      // jalan dicat: kubus pipih
    const mt = im.material, mk = [mt.type, mt.color.getHex(), mt.emissive ? mt.emissive.getHex() : 0, mt.roughness, mt.metalness, mt.transparent, mt.opacity, mt.map ? mt.map.id : 0, datar].join('|');
    for (let i = 0; i < im.count; i++) {
      im.getMatrixAt(i, M); W.multiplyMatrices(im.matrixWorld, M); P.setFromMatrixPosition(W);
      const k = Math.floor(P.x / CELL) + ',' + Math.floor(P.z / CELL) + '|' + mk;
      if (!sel.has(k)) sel.set(k, {mt, datar, isi: []}); if (im.instanceColor) im.getColorAt(i, C); else C.set(0xffffff); sel.get(k).isi.push([W.clone(), C.clone()]);
    }
    im.parent.remove(im);
  }
  for (const {mt, datar, isi} of sel.values()) {
    const c = new THREE.InstancedMesh(GEO_DATAR, mt, isi.length);
    isi.forEach(([w, col], i) => { c.setMatrixAt(i, w); c.setColorAt(i, col); });
    c.castShadow = false; c.receiveShadow = !datar; c.computeBoundingSphere(); c.userData.jangan = true; sc.add(c);
  }
}
// gabungkan mesh polos (tanpa tekstur) jadi sedikit draw call. Ringan untuk HP (8 Nov 2026): warna disimpan per titik
// (vertex color), jadi semua warna dengan bahan yang sama (kasar/kilap/nyala) cukup satu kali gambar, bukan satu per warna.
const LIN = new THREE.Color();
function bakeGroup(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const grup = new Map(), buang = [];
  root.traverse(m => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.jangan) return;
    const mt = m.material; if (Array.isArray(mt) || !mt.isMeshStandardMaterial || mt.map || mt.transparent || mt.vertexColors) return;
    const k = [mt.type, mt.emissive.getHex(), mt.emissiveIntensity, mt.roughness.toFixed(2), mt.metalness.toFixed(2), mt.side, mt.flatShading ? 1 : 0, mt.fog ? 1 : 0, m.castShadow ? 1 : 0].join('|');
    let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    for (const a of Object.keys(g.attributes)) if (a !== 'position' && a !== 'normal') g.deleteAttribute(a);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    LIN.copy(mt.color); const n = g.attributes.position.count, cl = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i += 3) { cl[i] = LIN.r; cl[i + 1] = LIN.g; cl[i + 2] = LIN.b; }
    g.setAttribute('color', new THREE.BufferAttribute(cl, 3));
    if (!grup.has(k)) grup.set(k, {mt, cast: m.castShadow, gs: []});
    grup.get(k).gs.push(g); buang.push(m);
  });
  buang.forEach(m => m.parent && m.parent.remove(m));
  for (const {mt, cast, gs} of grup.values()) {
    const bahan = mt.clone(); bahan.color.set(0xffffff); bahan.vertexColors = true;
    for (let i = 0; i < gs.length; i += 400) {
      const mg = mergeGeometries(gs.slice(i, i + 400), false); if (!mg) continue;
      const mesh = new THREE.Mesh(mg, bahan); mesh.castShadow = cast; mesh.receiveShadow = true; mesh.userData.jangan = true; root.add(mesh);
    }
    gs.forEach(g => g.dispose());
  }
}
function buang(o) { o.traverse(m => { if (m.isMesh) { if (m.userData.jangan || m.isInstancedMesh) m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => { if (x.map) x.map.dispose(); x.dispose(); }); } }); o.parent && o.parent.remove(o); }

// persegi tabrakan dalam koordinat kavling (satuan kavling), lalu diubah ke dunia
function rectLot(L, x0, x1, z0, z1) {
  const a = [L.c.x + L.dir * x0 * VS, L.c.x + L.dir * x1 * VS], b = [L.c.z + L.dir * z0 * VS, L.c.z + L.dir * z1 * VS];
  return [Math.min(...a), Math.max(...a), Math.min(...b), Math.max(...b)];
}
// persegi tabrakan satu kavling (rumah, sumur, tong, warung, batu nama, rumah Oyen) — juga dipakai peta navigasi
function rectsKavling(n) {
  if (I.gedung) return [];   // Segara: dinding unit dicatat per lantai (I.gedung.rects)
  const L = I.lots[n], isi = (n === 1 && DI === 'wetan') || !!NM[n], rects = []; if (!L || !isi) return rects;
  // rumah bisa dimasuki (Huda 6 Nov 2026): tabrakan per dinding, celah pintu depan (rumah x -3..-1, z -1.4..0.2 satuan kavling)
  rects.push(rectLot(L, -3.08, -2.98, -1.48, .26), rectLot(L, -1.02, -.92, -1.48, .26), rectLot(L, -3.08, -.92, -1.48, -1.38),
    rectLot(L, -3.08, -2.36, .16, .26), rectLot(L, -1.64, -.92, .16, .26));
  rects.push(rectLot(L, 3.15, 3.65, 2.75, 3.25), rectLot(L, 1.1, 2.1, 3.45, 4.1));
  if (n === 1 && DI === 'wetan') rects.push(rectLot(L, -4.35, -3.45, 3.0, 3.8));
  rects.push(rectLot(L, -.5, .9, 3.75, 4.25));
  return rects;
}
function bangunKavling(n) {
  if (I.bangunUnit) return I.bangunUnit(n);
  const L = I.lots[n]; const isi = (n === 1 && DI === 'wetan') || !!NM[n];
  const g = I.buildLot(n); if (!g) return;
  const extra = new THREE.Group(); extra.position.y = L.c.y || 0; sc.add(extra);
  const rects = rectsKavling(n);
  if (isi) {
    const w = warungMesh({nama: n === 1 ? 'WARUNG RAKA' : 'WARUNG PANEN', warna: ['#e0503a','#2f7fd8','#2a9a5a','#e0a020'][n % 4], isi: [0,1,2,3,4].map(k => ['tomat','jagung','wortel','terong','cabai','pisang','singkong','padi'][(n * 3 + k * 5) % 8])});
    w.scale.setScalar(1.8); w.position.set(L.c.x + L.dir * 1.6 * VS, 0, L.c.z + L.dir * 3.75 * VS); w.rotation.y = L.dir === 1 ? 0 : Math.PI; extra.add(w);
    if (n === 1 && DI === 'wetan') {
      const st = new THREE.Mesh(new THREE.BoxGeometry(1.4 * VS, 1.15 * VS, .45 * VS), [0,1,2,3,4,5].map(k => new THREE.MeshStandardMaterial({color: k === 4 ? 0xffffff : 0x9a9a9a, roughness: .9, map: k === 4 ? D.nameTex('Raka', 1) : null})));
      st.position.set(L.c.x + L.dir * .2 * VS, .58 * VS, L.c.z + L.dir * 4 * VS); st.rotation.y = L.dir === 1 ? 0 : Math.PI; st.castShadow = true; extra.add(st);
      const k = rumahKucingMesh({warna: 'krem', atap: 'merah', nama: 'OYEN'}); k.scale.setScalar(1 / .55); k.position.set(L.c.x + L.dir * -3.9 * VS, 0, L.c.z + L.dir * 3.4 * VS); k.rotation.y = L.dir === 1 ? 0 : Math.PI; extra.add(k);
    }
  }
  if (isi) pasangDekor(n, L, extra, rects);
  extra.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  lantaiDua(g, n); catKavling(g, n);
  let H = null; if (isi) g.traverse(o => { if (!H && o.userData && o.userData.rumah) H = o; });
  if (H) {   // badan rumah (tanpa halaman/pagar/pohon) dipisah & dipanggang sendiri supaya bisa disembunyikan saat warga masuk
    const badan = new THREE.Group();
    for (const c of [...H.children]) { const p = c.position, lebar = c.geometry?.parameters?.width || 0;
      if (Math.abs(p.x) < 2.75 && p.z > -2.3 && p.z < 3.3 && lebar < 6) badan.add(c); }
    H.add(badan); bakeGroup(badan); H = badan;
  }
  if (H && n !== 1 && (BT[n] >= BATA_BENDERA || JR === n || TR === n)) pasangHadiahRumah(n, L, H, extra, rects);
  bakeGroup(g); bakeGroup(extra);
  lotRuntime.set(n, {g, extra, rects, rumah: H, dalam: H ? rectLot(L, -3, -1, -1.4, .2) : null, interior: null});
  if (S.saya && n === S.saya.no) { kebunTahap = null; segarKebun(); }
  if (isi && n !== 1) pasangKucing(n);
  if (L.proxyIdx != null) setProxy(L, false);
}
// ---------- Unit apartemen Segara: interior rumah (×2) + balkon 4 pot hidroponik = kebun warga ----------
function bangunUnitSegara(n) {
  const L = I.lots[n]; if (!L) return; const isi = !!NM[n];
  const g = new THREE.Group(); g.position.copy(L.c); g.rotation.y = L.dir === 1 ? 0 : Math.PI; g.scale.setScalar(VS * 2); sc.add(g);
  const extra = new THREE.Group(); sc.add(extra);
  let bedeng = null;
  if (isi) {
    const IG = buatInterior(n); g.add(IG);
    // pot hidroponik di balkon (di balik dinding belakang); tanaman = kebun warga (🌱 Tanam / 🧺 Panen dari dalam unit)
    const pot = new THREE.Group(); pot.position.set(0, 0, -2.75); pot.scale.setScalar(.5); g.add(pot);
    const xs = [-3, -1, 1, 3]; xs.forEach(x => { pot.add(kotakD(1.2, .5, 1.2, 0xeef2f5, x, .25, 0)); pot.add(kotakD(1, .06, 1, 0x5a3a20, x, .52, 0)); });
    const k = S.saya && n === S.saya.no ? null : ['tomat', 'jagung', 'wortel', 'gandum'][n % 4];
    bedeng = D.tanamanBedeng(xs.map(x => ({p: {x, z: 0}})), k || 'tomat', k ? 3 : -1); bedeng.position.y = .5; pot.add(bedeng);
  }
  g.traverse(m => { if (m.isMesh) { m.castShadow = !hemat; m.receiveShadow = true; } });
  bakeGroup(g);
  if (bedeng && !bedeng.parent) bedeng = null;
  if (!bedeng) g.traverse(o => { if (!bedeng && o.isInstancedMesh && o.userData.bedeng) bedeng = o; });
  const kosong = new THREE.Group();
  lotRuntime.set(n, {g, extra, rects: [], rumah: isi ? kosong : null, interior: isi ? new THREE.Group() : null, bedeng,
    dalam: isi ? rectLot(L, -2.45 * 2, 2.45 * 2, -1.96 * 2, 1.96 * 2) : null});
  if (S.saya && n === S.saya.no) { kebunTahap = null; segarKebun(); }
}
// ---------- Lift & lantai Segara (Huda 8 Nov 2026): satu lantai dimuat sekaligus, lift = layar muat ----------
let zonaKini = 'luar';
function pindahZona(z, titik, lalu) {
  const me = tokoh.saya; if (!me || !I.gedung) return;
  const tirai = $('tiraiLift'); tirai.textContent = z ? `🛗 Menara ${z.t} · Lantai ${z.f}` : '🛗 Turun ke lobi…'; tirai.hidden = false; bunyi('masuk');
  setTimeout(() => {
    I.gedung.masuk(z); zonaKini = I.gedung.kunci(z); NAV = null; hapusRute();
    me.position.set(titik.x, 0, titik.z); me.position.y = tanah(titik.x, titik.z); lompat.vy = 0; lompat.diTanah = true;
    me.rotation.y = z ? Math.PI / 2 : Math.PI; yaw = yawNow = z ? -Math.PI / 2 : 0; gerak.tujuan = null;
    for (let i = 0; i < 12; i++) aturKavling(me.position.x, me.position.z);
    kirimPos(true);
    setTimeout(() => { tirai.hidden = true; if (lalu) lalu(); }, 350);
  }, 650);
}
function bukaLift(dekat) {
  const t = dekat.t, saya = S.saya && !S.tamu ? I.lots[S.saya.no]?.unit : null;
  const f0 = I.gedung.zona(tokoh.saya.position.x, tokoh.saya.position.z)?.f || 1;
  const tombol = f => { const h = f > 1 ? I.gedung.huni(t, f).length : 0, aku = saya && saya.t === t && saya.f === f;
    return `<button data-f="${f}" class="${f === f0 ? 'ini' : ''}${aku ? ' aku' : ''}"><b>${f === 1 ? 'Lobi' : 'Lt. ' + f}</b><small>${aku ? '⭐ unitmu' : f === 1 ? 'keluar' : h + '/10 warga'}</small></button>`; };
  const fs = [1]; for (let f = 2; f <= 21; f++) fs.push(f);
  $('isiLift').innerHTML = `<h2>🛗 Lift Menara ${t}</h2><p class="sub">Pilih lantai. Pintu unit ada di koridor, papan nama warga di samping pintu.</p><div class="liftGrid">${fs.map(tombol).join('')}</div>`;
  $('panelLift').hidden = false;
  $('isiLift').onclick = e => { const b = e.target.closest('[data-f]'); if (!b) return; const f = +b.dataset.f; $('panelLift').hidden = true; if (f === f0) return;
    pindahZona(f === 1 ? null : {t, f}, I.gedung.lift(t, f)); };
}

// ---------- Hadiah pendukung Bata (Huda 8 Nov 2026) ----------
// Total 2 Bata = Bendera Emas di pekarangan depan; Juragan Bata minggu ini = mahkota emas di atas atap. Hanya hiasan.
const BATA_RP = 5000, BATA_BENDERA = 2, BATA_PLAKAT = 20;
const EMAS = () => new THREE.MeshStandardMaterial({color: 0xffc928, roughness: .35, metalness: .55, emissive: 0x6a4a00, emissiveIntensity: .35});
function pasangHadiahRumah(n, L, H, extra, rects) {
  H.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(H); if (box.isEmpty()) return;
  const dasar = L.c.y || 0, atas = box.max.y - dasar, rot = L.dir === 1 ? 0 : Math.PI;
  if (BT[n] >= BATA_BENDERA) {   // tiang + kain emas berkibar (statis) di pojok depan rumah
    const G = new THREE.Group(), tinggi = atas * 1.35;
    const tiang = new THREE.Mesh(new THREE.BoxGeometry(.07 * VS, tinggi, .07 * VS), new THREE.MeshStandardMaterial({color: 0xe8e8ec, roughness: .5})); tiang.position.y = tinggi / 2; G.add(tiang);
    const pucuk = new THREE.Mesh(new THREE.BoxGeometry(.14 * VS, .14 * VS, .14 * VS), EMAS()); pucuk.position.y = tinggi + .05 * VS; G.add(pucuk);
    const kain = new THREE.Mesh(new THREE.BoxGeometry(1 * VS, .6 * VS, .04 * VS), EMAS()); kain.position.set(.53 * VS, tinggi - .36 * VS, 0); G.add(kain);
    const kain2 = new THREE.Mesh(new THREE.BoxGeometry(.32 * VS, .6 * VS, .04 * VS), EMAS()); kain2.position.set(1.15 * VS, tinggi - .44 * VS, .06 * VS); kain2.rotation.y = -.35; G.add(kain2);
    G.position.set(L.c.x + L.dir * -.62 * VS, 0, L.c.z + L.dir * .62 * VS); G.rotation.y = rot; extra.add(G);
    rects.push(rectLot(L, -.68, -.56, .56, .68));
  }
  if (TR === n) {   // Lomba Rumah Terindah: piala emas di atas atap (lebih tinggi bila rumah ini juga bermahkota)
    const G = new THREE.Group(), emas = EMAS(), k = VS;
    const add = (w, h, d, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w * k, h * k, d * k), emas); m.position.y = y * k; G.add(m); };
    add(.6, .12, .6, .06); add(.18, .3, .18, .27); add(.7, .12, .7, .48); add(.62, .5, .62, .78); add(.78, .1, .78, 1.08);
    for (const s of [-1, 1]) { const g = new THREE.Mesh(new THREE.BoxGeometry(.1 * k, .38 * k, .1 * k), emas); g.position.set(s * .45 * k, .82 * k, 0); G.add(g); const g2 = new THREE.Mesh(new THREE.BoxGeometry(.18 * k, .1 * k, .1 * k), emas); g2.position.set(s * .38 * k, 1.0 * k, 0); G.add(g2); }
    G.position.set((box.min.x + box.max.x) / 2, atas + (JR === n ? 1.5 : .35) * VS, (box.min.z + box.max.z) / 2); G.rotation.y = rot; extra.add(G);
  }
  if (JR === n) {   // mahkota emas melayang di atas atap
    const G = new THREE.Group(), w = .9 * VS, emas = EMAS();
    const cincin = new THREE.Mesh(new THREE.BoxGeometry(w, .22 * VS, w), emas); cincin.position.y = .11 * VS; G.add(cincin);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const ujung = new THREE.Mesh(new THREE.BoxGeometry(.14 * VS, (x && z ? .34 : .24) * VS, .14 * VS), emas);
      ujung.position.set(x * (w / 2 - .07 * VS), .22 * VS + (x && z ? .17 : .12) * VS, z * (w / 2 - .07 * VS)); G.add(ujung);
    }
    [[0, -1, 0xe0403a], [0, 1, 0x3a7ae0], [-1, 0, 0x2a9a5a], [1, 0, 0xe0403a]].forEach(([x, z, c]) => { const pm = new THREE.Mesh(new THREE.BoxGeometry(.12 * VS, .1 * VS, .12 * VS), new THREE.MeshStandardMaterial({color: c, roughness: .3}));
      pm.position.set(x * (w / 2 + .01 * VS), .11 * VS, z * (w / 2 + .01 * VS)); G.add(pm); });
    G.position.set((box.min.x + box.max.x) / 2, atas + .35 * VS, (box.min.z + box.max.z) / 2); G.rotation.y = rot + Math.PI / 4; extra.add(G);
  }
}
// Plakat pendukung di fasum yang sedang dibangun (Taman Kota, fas[13] Wetan): Bos fasum + pendukung 20 Bata + Juragan Bata.
const PLAKAT = {kanvas: null, tex: null};
let PD = null;   // data /api/pendukung
async function muatPendukung() { try { PD = await (await fetch('/duniakotak/api/pendukung')).json(); gambarPlakat(); } catch (e) {} return PD; }
function pasangPlakat() {
  const f = I.fas && I.fas[13]; if (!f) return;
  const g = new THREE.Group(), batu = new THREE.MeshStandardMaterial({color: 0x8a8f98, roughness: .95});
  const kaki = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 2.4), batu); kaki.position.y = 1.5; g.add(kaki);
  const c = document.createElement('canvas'); c.width = 640; c.height = 440;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const papan = new THREE.Mesh(new THREE.BoxGeometry(18, 12.4, .8), [batu, batu, batu, batu, new THREE.MeshBasicMaterial({map: tex}), batu]);
  papan.position.y = 9.2; g.add(papan);
  g.position.set(f.x + 16, 0, f.z + 14); sc.add(g);
  Object.assign(PLAKAT, {kanvas: c, tex}); gambarPlakat(); muatPendukung(); setInterval(muatPendukung, 5 * 60e3);
}
function gambarPlakat() {
  const c = PLAKAT.kanvas; if (!c) return; const x = c.getContext('2d'), d = PD || {};
  x.fillStyle = '#2c3150'; x.fillRect(0, 0, 640, 440); x.strokeStyle = '#ffc928'; x.lineWidth = 12; x.strokeRect(6, 6, 628, 428);
  x.textAlign = 'center'; x.fillStyle = '#ffc928'; x.font = '900 34px Montserrat, sans-serif'; x.fillText('PLAKAT TAMAN KOTA', 320, 58);
  const bos = d.bos && d.bos.taman; x.fillStyle = '#fff'; x.font = '800 26px Montserrat, sans-serif';
  x.fillText(bos ? `Bos Taman Kota: @${bos.nm}` : 'Bos Taman Kota: pengusul pertama', 320, 104);
  x.fillStyle = '#ffe39a'; x.font = '700 22px Montserrat, sans-serif'; x.fillText('Didukung oleh', 320, 150);
  const nama = (d.plakat || []).filter(p => p.fasum === 'taman').map(p => '@' + p.nm);
  x.fillStyle = '#fff'; x.font = '800 24px Montserrat, sans-serif';
  if (!nama.length) { x.fillStyle = '#b8bcd0'; x.font = '700 21px Montserrat, sans-serif'; x.fillText(`Namamu bisa di sini: dukung ${BATA_PLAKAT} Bata`, 320, 190); x.fillText('lewat Trakteer (⚙ Atur > Pendukung Desa)', 320, 220); }
  else { const baris = []; let b = ''; for (const n of nama.slice(0, 18)) { if ((b + '  ' + n).length > 34) { baris.push(b); b = n; } else b = b ? b + '  ' + n : n; } if (b) baris.push(b);
    baris.slice(0, 5).forEach((t, i) => x.fillText(t, 320, 190 + i * 32)); }
  const jr = d.juragan; x.fillStyle = '#ffc928'; x.font = '900 24px Montserrat, sans-serif';
  x.fillText(jr ? `👑 Juragan Bata: @${jr.nm}` : '👑 Juragan Bata: belum ada', 320, 375);
  x.fillStyle = '#b8bcd0'; x.font = '600 18px Montserrat, sans-serif'; x.fillText('Terima kasih sudah ikut membangun desa', 320, 410);
  PLAKAT.tex.needsUpdate = true;
}
// Panel Pendukung Desa (⚙ Atur): cara dapat Bata, hadiah, Juragan minggu ini, riwayat, plakat, daftar pendukung.
function tulisPendukung() {
  const d = PD; if (!d) { $('isiPendukung').innerHTML = '<p class="kecil">Memuat…</p>'; return; }
  const no = S.saya?.no, saya = no ? BT[no] || 0 : 0, rp = (d.harga || BATA_RP).toLocaleString('id-ID');
  // Papan Juragan minggu ini paling atas (Huda 9 Nov 2026), baru di bawahnya ajakan Pendukung Desa.
  const pm = d.papanMinggu || (d.juragan?.mingguIni ? [{no: d.juragan.no, nm: d.juragan.nm, bata: d.juragan.bataMinggu}] : []);
  const medali = ['👑', '🥈', '🥉'];
  let h = `<div class="pdPapan">${Array.from({length: Math.max(3, pm.length)}, (_, i) => { const x = pm[i];
    return x ? `<div class="pdPeringkat p${i + 1}${x.no === no ? ' aku' : ''}"><span class="pdMedali">${medali[i] || i + 1}</span><span class="pkNama">@${esc(x.nm || 'warga ' + x.no)}${x.no === no ? '<small>kamu</small>' : ''}</span><b>🧱 ${x.bata}</b></div>`
      : `<div class="pdPeringkat p${i + 1} kosong"><span class="pdMedali">${medali[i]}</span><span class="pkNama">${i ? 'Kursi kosong · kamu?' : 'Belum ada. Jadilah yang pertama!'}</span><b>🧱 0</b></div>`; }).join('')}</div>`
    + '<p class="kecil pdPapanKet">Peringkat Bata minggu ini (Senin–Minggu). Juara 1 dapat mahkota di atap rumahnya.</p>';
  if (d.riwayat?.length > 1) h += `<p class="kecil pdRiwayat"><b>Riwayat mahkota:</b> ${d.riwayat.map(r => `@${esc(r.nm)} (${new Date(r.sejak).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})})`).join(' ← ')}</p>`;
  h += '<h3 class="pdJudul">🧱 Pendukung Desa</h3><p class="kecil">Bantu Dunia Kotak terus dibangun. Tiap dukungan dihitung dalam Bata, dan namamu terlihat oleh seluruh desa.</p>';
  h += `<div class="pdHarga"><b>🧱 Dukung desa pakai Bata</b><small>Traktir sukarela lewat Trakteer; jumlah Bata dihitung otomatis. Tiap Bata juga jadi 5 ⭐ bintang voting + 50 💎 permata.</small></div>`;
  if (!S.tamu && no) h += `<div class="pdSaya">Bata kamu: <b>🧱 ${saya}</b>${saya < BATA_BENDERA ? ` · ${BATA_BENDERA - saya} Bata lagi untuk Bendera Emas` : saya < BATA_PLAKAT ? ` · ${BATA_PLAKAT - saya} Bata lagi untuk masuk plakat fasum` : ' · namamu ada di plakat fasum'}</div>`;
  h += `<div class="pdHadiah">${[['🧱', '1 Bata', 'Lencana 🧱 di namamu + ucapan terima kasih di video Dunia Kotak'], ['🚩', `${BATA_BENDERA} Bata`, 'Bendera Emas berkibar di rumahmu, selamanya'], ['👑', 'Juragan Bata', 'Pendukung terbesar minggu ini (Senin–Minggu) dapat mahkota di atap. Disalip? Mahkota pindah!'], ['🪧', `${BATA_PLAKAT} Bata`, 'Namamu terpasang di plakat fasum yang sedang dibangun'], ['🏗️', 'Gratis', 'Pengusul pertama fasum yang menang voting jadi Bos fasum itu']].map(([i, j, k]) => `<div><i>${i}</i><span><b>${j}</b><small>${k}</small></span></div>`).join('')}</div>`;
  h += '<p class="kecil pdSemua"><b>Semua pendukung</b> (total Bata sejak awal)</p>';
  if (d.pendukung?.length) h += `<div class="pkDaftar pdDaftar">${d.pendukung.map((x, i) => `<div class="pkBaris${x.no === no ? ' aku' : ''}"><span class="pkNo">${i + 1}</span><span class="pkNama">${d.juragan?.no === x.no ? '👑 ' : ''}@${esc(x.nm)}</span><b>🧱 ${x.bata}</b></div>`).join('')}</div>`;
  else h += '<p class="kecil">Belum ada pendukung. Jadilah yang pertama memasang Bata di desa ini!</p>';
  const kode = no ? 'DK' + no : '';
  h += `<a class="utama pdSaweria" href="https://trakteer.id/duniakotak.id" target="_blank" rel="noopener" data-pdkode="${kode}">🧱 Traktir Bata di Trakteer</a>`
    + (kode ? `<p class="kecil">Tulis kode <span class="vtKode" id="pdKode">${kode}</span> di pesan traktiran supaya Bata masuk ke rumahmu. Tanpa kode, kamu tercatat sebagai Pendukung Misterius.</p>` : '<p class="kecil">Daftar jadi warga dulu supaya Bata masuk ke rumahmu.</p>')
    + '<p class="kecil">Sukarela, bukan syarat main. Hadiahnya hanya hiasan dan gelar.</p>';
  $('isiPendukung').innerHTML = h;
}
async function bukaPendukung() { $('panelAtur').hidden = true; tulisPendukung(); $('panelPendukung').hidden = false; await muatPendukung(); tulisPendukung(); }
document.addEventListener('click', async e => {
  const k = e.target.closest?.('#pdKode'); if (k) { try { await navigator.clipboard.writeText(k.textContent); toast('Kode ' + k.textContent + ' disalin. Tempel di pesan traktiran Trakteer.', 3500); } catch (er) {} return; }
  const a = e.target.closest?.('[data-pdkode]'); if (a && a.dataset.pdkode) { try { navigator.clipboard.writeText(a.dataset.pdkode); } catch (er) {} toast(`Kode ${a.dataset.pdkode} sudah disalin. Tempel di pesan traktiran Trakteer. 1 Bata = Rp${BATA_RP.toLocaleString('id-ID')}.`, 6000); }
});
// ---------- Rakit Hiasan (Huda 6 Nov 2026): barang pungutan dirakit jadi hiasan pekarangan ----------
// posisi & ukuran dalam satuan kavling (pintu rumah ±0,76), lalu dikali VS
const kotakD = (w, h, d, c, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({color: c, roughness: .85})); m.position.set(x, y, z); return m; };
const DEKOR = [
  {id: 'bangku', ikon: '🪑', nama: 'Bangku taman', resep: {Kayu: 3, 'Batu kotak': 1}, pos: [-4.15, 1.7], rot: Math.PI / 2, rect: [.25, .45],
    buat: G => { G.add(kotakD(.8, .06, .26, 0xa0703c, 0, .2, 0), kotakD(.8, .22, .05, 0xa0703c, 0, .36, -.12)); [-.33, .33].forEach(x => G.add(kotakD(.06, .2, .22, 0x5a3a20, x, .1, 0))); }},
  {id: 'pot', ikon: '🌷', nama: 'Pot bunga', resep: {Bunga: 2, Daun: 1, 'Batu kotak': 1}, pos: [-.55, 1.35], rot: 0, rect: [.16, .16],
    buat: G => { G.add(kotakD(.26, .2, .26, 0xc8653a, 0, .1, 0), kotakD(.2, .05, .2, 0x5a3a20, 0, .21, 0), kotakD(.04, .16, .04, 0x3f9a3a, 0, .3, 0)); [[0xff5a7a, -.06, .04], [0xffd23a, .06, -.03], [0xb07aff, 0, .07]].forEach(([c, x, z]) => G.add(kotakD(.09, .09, .09, c, x, .4, z))); }},
  {id: 'lampu', ikon: '🏮', nama: 'Lampu taman', resep: {Kayu: 2, 'Batu kotak': 2}, pos: [-1.05, 3.1], rot: 0, rect: [.08, .08],
    buat: G => { G.add(kotakD(.16, .06, .16, 0x9aa0a8, 0, .03, 0), kotakD(.05, .62, .05, 0x2a2a2a, 0, .34, 0), kotakD(.14, .04, .14, 0x2a2a2a, 0, .73, 0));
      const l = new THREE.Mesh(new THREE.BoxGeometry(.11, .13, .11), new THREE.MeshBasicMaterial({color: 0xffe08a})); l.position.y = .65; G.add(l); }},
  {id: 'keranjang', ikon: '🧺', nama: 'Keranjang buah', resep: {Apel: 3, Kayu: 1, Daun: 1}, pos: [2.55, 2.15], rot: 0, rect: [.22, .16],
    buat: G => { G.add(kotakD(.4, .16, .28, 0xb8844a, 0, .08, 0)); [[-.1, -.05], [.08, .04], [.0, -.02], [-.04, .07], [.12, -.06]].forEach(([x, z], i) => G.add(kotakD(.1, .1, .1, i === 3 ? 0x5cc85c : 0xe0403a, x, .2, z))); }},
  {id: 'kolam', ikon: '🐟', nama: 'Kolam ikan', resep: null, pos: [-3.3, 3.0], rot: 0, rect: [.42, .32],
    buat: G => { G.add(kotakD(.9, .1, .7, 0x9aa0a8, 0, .05, 0)); const air = new THREE.Mesh(new THREE.BoxGeometry(.76, .04, .56), new THREE.MeshStandardMaterial({color: 0x3aa0d8, roughness: .2})); air.position.y = .1; G.add(air);
      [[-.18, -.1, 0xff8a2a], [.15, .08, 0xf4f4f4], [.02, -.15, 0xff8a2a]].forEach(([x, z, c]) => G.add(kotakD(.12, .04, .05, c, x, .13, z))); G.add(kotakD(.08, .14, .08, 0x3f9a3a, .3, .17, .2), kotakD(.12, .1, .12, 0x7a7a80, -.33, .15, .22)); }},
  {id: 'jamur', ikon: '🍄', nama: 'Taman jamur', resep: {Jamur: 3, Daun: 1}, pos: [-4.2, -.5], rot: 0, rect: [.25, .25],
    buat: G => { G.add(kotakD(.5, .04, .5, 0x6a4a2a, 0, .02, 0)); [[-.13, -.1, 1], [.12, -.05, .8], [0, .13, 1.2]].forEach(([x, z, k]) => { G.add(kotakD(.06 * k, .14 * k, .06 * k, 0xf4ecd8, x, .07 * k, z)); G.add(kotakD(.2 * k, .08 * k, .2 * k, 0xd84a4a, x, .16 * k, z)); }); }},
];
const DK_SKALA = 1.5;
// Hiasan pekarangan juga bisa dibeli pakai koin (audit ekonomi #2, harga sama dengan DEKOR_KOIN di server).
const HARGA_DEKOR = {bangku: 100, pot: 100, lampu: 150, keranjang: 120, jamur: 100, kolam: 800};
function dekorKavling(n) { return (S.saya && n === S.saya.no && S.hias ? S.hias.dekor : HS[n] && HS[n].d) || []; }
function pasangDekor(n, L, extra, rects) {
  for (const id of dekorKavling(n)) {
    const d = DEKOR.find(x => x.id === id); if (!d) continue;
    const G = new THREE.Group(); d.buat(G); G.scale.setScalar(VS * DK_SKALA);
    G.position.set(L.c.x + L.dir * d.pos[0] * VS, 0, L.c.z + L.dir * d.pos[1] * VS); G.rotation.y = (L.dir === 1 ? 0 : Math.PI) + d.rot; extra.add(G);
    const [rx, rz] = (d.rot ? [d.rect[1], d.rect[0]] : d.rect).map(v => v * DK_SKALA); rects.push(rectLot(L, d.pos[0] - rx, d.pos[0] + rx, d.pos[1] - rz, d.pos[1] + rz));
  }
}
let dkSibuk = false;
function tulisRakit() {
  const h = S.hias || {}, punya = (h.punya && h.punya.dekor) || [], pasang = h.dekor || [];
  $('isiRakit').innerHTML = DEKOR.map(d => {
    const ada = punya.includes(d.id), dipasang = pasang.includes(d.id), cukup = d.resep && Object.entries(d.resep).every(([b, k]) => (tas[b]?.n || 0) >= k);
    const harga = HARGA_DEKOR[d.id], koin = S.saya?.koin || 0;
    const bahan = (d.resep ? Object.entries(d.resep).map(([b, k]) => `<span class="${(tas[b]?.n || 0) >= k ? 'ok' : 'kurang'}">${ITEM.find(x => x.nama === b)?.ikon || ''} ${tas[b]?.n || 0}/${k}</span>`).join('') + ' atau ' : 'Hanya bisa dibeli · ') + `🪙 ${harga}`;
    const tombol = ada ? `<button data-dk="${d.id}" data-dkm="${dipasang ? 'lepas' : 'pasang'}">${dipasang ? 'Lepas' : 'Pasang'}</button>`
      : (d.resep ? `<button data-dk="${d.id}" data-dkm="rakit" ${cukup ? '' : 'disabled'}>🔨 Rakit</button>` : '') + `<button data-dk="${d.id}" data-dkm="beli" ${koin >= harga ? '' : 'disabled'}>🪙 ${harga}</button>`;
    return `<div class="rkBaris${dipasang ? ' on' : ''}"><i>${d.ikon}</i><div><b>${d.nama}</b><small>${ada ? (dipasang ? 'Terpasang di pekaranganmu' : 'Sudah dirakit') : bahan}</small></div>${tombol}</div>`;
  }).join('');
}
function bukaRakit() { if (S.tamu) return toast('Daftar jadi warga dulu supaya punya pekarangan.', 4000); $('panelProfil').hidden = true; tulisRakit(); $('panelRakit').hidden = false; }
document.addEventListener('click', async e => {
  const b = e.target.closest?.('[data-dk]'); if (!b || dkSibuk) return;
  const d = DEKOR.find(x => x.id === b.dataset.dk), mode = b.dataset.dkm; if (!d) return;
  if (mode === 'rakit' && !(d.resep && Object.entries(d.resep).every(([n, k]) => (tas[n]?.n || 0) >= k))) return toast('Bahannya belum cukup. Pungut barang bercahaya di jalan.', 3000);
  if (mode === 'beli' && !confirm(`Beli ${d.nama} seharga ${HARGA_DEKOR[d.id]} koin?`)) return;
  dkSibuk = true;
  try {
    const r = await api('dekor', {kunci: S.kunci, id: d.id, mode});
    if (r.tas) aturTas(r.tas); if (r.koin != null) { S.saya.koin = r.koin; try { hitungOnline(); } catch (e) {} }
    S.hias = r.hias; bangunUlangKavling(S.saya.no); tulisRakit();
    toast(mode === 'rakit' ? `🔨 ${d.nama} jadi! Sudah dipasang di pekaranganmu.` : mode === 'beli' ? `🪙 ${d.nama} dibeli dan dipasang di pekaranganmu!` : mode === 'pasang' ? `${d.ikon} ${d.nama} dipasang.` : `${d.ikon} ${d.nama} dilepas.`, 3000);
  } catch (er) { toast(er.message, 3500); } finally { dkSibuk = false; }
});
// Upgrade rumah 2 lantai (Huda 6 Nov 2026): lantai 2 disisipkan di antara dinding dan atap rumah aset video (fullHouse),
// jendela lantai 1 disalin ke atas; warna dinding sama (krem 0xf1dcb4) supaya ikut cat Toko Hias.
const TINGGI_L2 = 2.4;
function lantaiDua(g, n) {
  const l = S.saya && n === S.saya.no && S.hias ? (S.hias.rumah === 'dua' ? 2 : 1) : (HS[n] && HS[n].l) || 1; if (l < 2) return;
  let H = null; g.traverse(o => { if (!H && o.userData && o.userData.rumah) H = o; }); if (!H) return;
  const W = 5, D = 4, y1 = .35 + 2.8, kotak = (w, h, d, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({color: c, roughness: .85})); m.castShadow = m.receiveShadow = true; return m; };
  const naik = [], jendela = [];
  for (const c of H.children) { const p = c.position; if (Math.abs(p.x) < 3 && Math.abs(p.z) < 2.4) { if (p.y >= y1 - .05) naik.push(c); else if (c.isGroup && Math.abs(p.y - (.35 + 1.6)) < .05) jendela.push(c); } }
  naik.forEach(c => { c.position.y += TINGGI_L2; });
  const wl = kotak(W, TINGGI_L2, D, 0xf1dcb4); wl.position.y = y1 + TINGGI_L2 / 2; H.add(wl);
  const band = kotak(W + .3, .22, D + .3, 0xffffff); band.position.y = y1 + .02; H.add(band);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const c = kotak(.3, TINGGI_L2, .3, 0xffffff); c.position.set(a * W / 2, y1 + TINGGI_L2 / 2, b * D / 2); H.add(c); });
  jendela.forEach(j => { const k = j.clone(); k.position.y += TINGGI_L2 + .1; H.add(k); });
  // jendela tengah depan di atas pintu (lantai 1 bagian tengah = pintu)
  const dj = jendela.find(j => j.position.z > 1 && j.position.x < 0); if (dj) { const k = dj.clone(); k.position.set(0, dj.position.y + TINGGI_L2 + .1, dj.position.z); H.add(k); }
}
// cat dinding rumah (warna asli krem 0xf1dcb4) + pagar kavling (InstancedMesh putih) sesuai barang Toko Hias yang dipakai
function catKavling(g, n) {
  const h = S.saya && n === S.saya.no && S.hias ? {c: S.hias.cat, p: S.hias.pagar} : HS[n]; if (!h) return;
  const cw = WARNA_CAT[h.c], cp = WARNA_PAGAR[h.p];
  g.traverse(m => { if (!m.isMesh || Array.isArray(m.material) || !m.material.color) return; const hx = m.material.color.getHex();
    if (cw && h.c !== 'krem' && hx === 0xf1dcb4) { m.material = m.material.clone(); m.material.color.set(cw); }
    else if (cp && h.p !== 'putih' && m.isInstancedMesh && !m.instanceColor && hx === 0xffffff) { m.material = m.material.clone(); m.material.color.set(cp); } });
}
function bangunUlangKavling(n) {
  const ada = lotRuntime.get(n); if (!ada) return;
  buang(ada.g); buang(ada.extra); if (ada.kc) { kucingHidup = kucingHidup.filter(c => c.parent !== ada.kc); buang(ada.kc); }
  lotRuntime.delete(n); bangunKavling(n);
}
function setProxy(L, tampil) {
  const {imW, imA} = I.proxy; const M = new THREE.Matrix4();
  const hx = L.c.x + L.dir * -2 * VS, hz = L.c.z + L.dir * -.6 * VS, s = tampil ? 1 : 0, y0 = L.c.y || 0;
  M.compose(new THREE.Vector3(hx, y0 + .65 * VS, hz), new THREE.Quaternion(), new THREE.Vector3(s, s, s)); imW.setMatrixAt(L.proxyIdx, M);
  M.compose(new THREE.Vector3(hx, y0 + 1.75 * VS, hz), new THREE.Quaternion(), new THREE.Vector3(s, s, .8 * s)); imA.setMatrixAt(L.proxyIdx, M);
  imW.instanceMatrix.needsUpdate = imA.instanceMatrix.needsUpdate = true;
}
const jarak = {rx: hemat ? 115 : 150, zf: hemat ? 150 : 190};
function aturKavling(px, pz) {
  const RX = jarak.rx, ZF = jarak.zf, ZB = hemat ? 50 : 70;
  for (const [ns, L] of Object.entries(I.lots)) {
    const n = +ns, ddx = L.c.x - px, ddz = L.c.z - pz, sn = Math.sin(yawNow), cs = Math.cos(yawNow);
    const dx = Math.abs(ddx * cs - ddz * sn), dz = ddx * sn + ddz * cs;   // dz < 0 = di depan kamera
    const dekat = dx < RX && dz > -ZF && dz < ZB;
    const ada = lotRuntime.get(n);
    if (dekat && !ada) { bangunKavling(n); return; }       // satu kavling per giliran supaya tidak patah-patah
    if (!dekat && ada && (dx > RX + 40 || dz < -ZF - 40 || dz > ZB + 40)) { buang(ada.g); buang(ada.extra); if (ada.kc) { kucingHidup = kucingHidup.filter(c => c.parent !== ada.kc); buang(ada.kc); } lotRuntime.delete(n); if (L.proxyIdx != null) setProxy(L, true); }
  }
}

// ---------- kucing warga: kandang (warna pilihan) + maks 2 kucing di pekarangan depan ----------
let kucingHidup = [];
const POS_KUCING = [[-2.75, 4.35], [-5.0, 4.25]];
function pasangKucing(n) {
  const rt = lotRuntime.get(n); if (!rt) return;
  if (rt.kc) { kucingHidup = kucingHidup.filter(c => c.parent !== rt.kc); buang(rt.kc); rt.kc = null; rt.rects = rt.rects.filter(r => !r.kandang); }
  const kc = KC[n]; if (!kc || !kc.k || !kc.k.length) return;
  const L = I.lots[n], G = new THREE.Group(), rot = L.dir === 1 ? 0 : Math.PI; G.position.y = L.c.y || 0;
  const k = rumahKucingMesh({warna: kc.d || 'krem', atap: kc.a || 'merah', nama: (kc.k[0].n || '').toUpperCase()}); k.scale.setScalar(1 / .55);
  k.position.set(L.c.x + L.dir * -3.9 * VS, 0, L.c.z + L.dir * 3.4 * VS); k.rotation.y = rot; G.add(k);
  kc.k.slice(0, 2).forEach((x, i) => {
    const c = kucingMesh(WARNA_KUCING[x.w] ? x.w : 'oranye'); const [px, pz] = POS_KUCING[i];
    c.position.set(L.c.x + L.dir * px * VS, 0, L.c.z + L.dir * pz * VS); c.rotation.y = rot + (i ? -.6 : .5);
    c.userData = {ph: n * 1.7 + i * 2.1, nama: x.n || '', no: n, ry: c.rotation.y}; G.add(c); kucingHidup.push(c);
  });
  G.traverse(m => { if (m.isMesh) m.castShadow = !hemat; });
  sc.add(G); rt.kc = G;
  // kandang & kucing digabung per warna (kucing hanya bergerak utuh: lompat kecil + menoleh), hemat draw call di HP
  for (const o of G.children) bakeGroup(o);
  const r = rectLot(L, -4.35, -3.45, 3.0, 3.8); r.kandang = true; rt.rects.push(r);
}
function bukaKucing() {
  if (S.tamu) { toast('Daftar jadi warga dulu supaya punya rumah dan kucing.', 4000); return; }
  const kc = JSON.parse(JSON.stringify(S.saya.kucing || {k: [{w: 'abu', n: ''}], d: 'krem', a: 'merah'}));
  if (!kc.k || !kc.k.length) kc.k = [{w: 'abu', n: ''}];
  const panel = $('buatAvatar'); if (!pv) bukaPembuatAvatar(S.av, false, true);
  panel.hidden = false; panel.querySelector('h2').textContent = 'Kucing & kandangmu';
  const gambar = () => {
    if (pv.obj) pv.sc.remove(pv.obj);
    const g = new THREE.Group();
    const k = rumahKucingMesh({warna: kc.d, atap: kc.a, nama: (kc.k[0].n || '').toUpperCase()}); k.scale.setScalar(1.6); k.position.set(-.6, 0, -1); g.add(k);
    kc.k.forEach((x, i) => { const c = kucingMesh(x.w, {skala: 1}); c.scale.setScalar(.9); c.position.set(i ? -2.6 : 1.9, 0, 1.2); c.rotation.y = i ? .5 : -.5; g.add(c); });
    g.rotation.y = .35; pv.obj = g; pv.sc.add(g);
    pv.cam.position.set(0, 4.6, 16.5); pv.cam.lookAt(-.3, 1.2, 0); pv.r.render(pv.sc, pv.cam);
  };
  const sw = (key, i, warna, on, label) => `<button data-k="${key}" data-i="${i}" class="w ${on ? 'on' : ''}" style="background:${warna}" aria-label="${esc(label)}" title="${esc(label)}"></button>`;
  const tulis = () => {
    let h = `<div class="baris"><b>Jumlah kucing</b><div class="opsi"><button data-k="jml" data-i="1" class="${kc.k.length === 1 ? 'on' : ''}">1 ekor</button><button data-k="jml" data-i="2" class="${kc.k.length === 2 ? 'on' : ''}">2 ekor</button><button data-k="jml" data-i="0">Tidak punya</button></div></div>`;
    kc.k.forEach((x, j) => {
      h += `<div class="baris"><b>Kucing ${j + 1}: ${esc(WARNA_KUCING[x.w].nama)}</b><div class="opsi">${DAFTAR_KUCING.map((w, i) => sw('w' + j, i, WARNA_KUCING[w].bulu, w === x.w, WARNA_KUCING[w].nama)).join('')}</div>
        <input class="namaKucing" data-j="${j}" maxlength="12" placeholder="Nama kucing ${j + 1} (maks 12 huruf)" value="${esc(x.n || '')}" autocomplete="off" style="margin-top:6px;width:100%;box-sizing:border-box;padding:9px 12px;border-radius:10px;border:2px solid #cbbd9e;font:600 15px Montserrat,sans-serif"></div>`;
    });
    h += `<div class="baris"><b>Warna kandang</b><div class="opsi">${Object.entries(WARNA_DINDING).map(([k2, v], i) => sw('d', i, v, k2 === kc.d, k2)).join('')}</div></div>`;
    h += `<div class="baris"><b>Warna atap kandang</b><div class="opsi">${Object.entries(WARNA_ATAP).map(([k2, v], i) => sw('a', i, v, k2 === kc.a, k2)).join('')}</div></div>`;
    $('pilihan').innerHTML = h;
    $('pilihan').querySelectorAll('.namaKucing').forEach(inp => inp.oninput = () => { kc.k[+inp.dataset.j].n = inp.value; if (+inp.dataset.j === 0) gambar(); });
    $('pilihan').querySelectorAll('button').forEach(b => b.onclick = () => {
      const k2 = b.dataset.k, i = +b.dataset.i;
      if (k2 === 'jml') { if (!i) kc.k = []; else if (i === 1) kc.k = kc.k.slice(0, 1).concat(kc.k.length ? [] : [{w: 'abu', n: ''}]); else { if (!kc.k.length) kc.k.push({w: 'abu', n: ''}); if (kc.k.length < 2) kc.k.push({w: 'putih', n: ''}); } }
      if (k2 === 'w0' || k2 === 'w1') kc.k[+k2[1]].w = DAFTAR_KUCING[i];
      if (k2 === 'd') kc.d = Object.keys(WARNA_DINDING)[i];
      if (k2 === 'a') kc.a = Object.keys(WARNA_ATAP)[i];
      if (k2 === 'jml' && !kc.k.length) { simpanKucing(kc); return; }
      tulis(); gambar();
    });
  };
  tulis(); gambar();
  $('simpanAvatar').textContent = 'Simpan';
  $('simpanAvatar').onclick = () => simpanKucing(kc);
}
async function simpanKucing(kc) {
  $('simpanAvatar').disabled = true;
  try {
    const s = await api('kucing', {kunci: S.kunci, kucing: {...kc, k: kc.k.map(x => ({w: x.w, n: String(x.n || '').trim()}))}});
    S.saya.kucing = s.kucing; KC[S.saya.no] = s.kucing; pasangKucing(S.saya.no); if (s.kucing) misiMaju('kucing');
    $('buatAvatar').hidden = true; bunyi('kirim');
    toast(s.kucing ? 'Kucingmu sudah ada di depan rumah! Tekan 🏠 Rumah untuk melihatnya.' : 'Kucing dan kandang dihapus.', 4000);
  } catch (e) { toast(e.message, 4000); } finally { $('simpanAvatar').disabled = false; }
}

// ---------- misi harian (koin dicatat server, sekali per misi per hari WIB) ----------
// Kolam misi: tiap hari (WIB) diundi 6 misi + target berbeda. Urutan id & cara undi HARUS sama dengan MISI_KOLAM di worker.js.
const KOLAM_MISI = [
  {id: 'jalan', ikon: '👣', judul: 'Jalan-jalan keliling dusun', t: [200, 300, 500], satuan: 'langkah', koin: 10},
  {id: 'sapa', ikon: '👋', judul: 'Sapa warga: kirim pesan atau emote', t: [2, 3, 5], satuan: 'kali', koin: 10},
  {id: 'raka', ikon: '⭐', judul: 'Temui Raka dan Oyen', t: [1], koin: 5, info: 'Mereka ada di depan rumah No. 1 (Warung Raka), ujung Jl. Melati.', antar: 1},
  {id: 'tetangga', ikon: '🏡', judul: 'Mampir ke depan rumah tetangga', t: [2, 3, 5], satuan: 'rumah', koin: 10},
  {id: 'foto', ikon: '📸', judul: 'Foto pakai Kamera HP, lalu simpan atau bagikan', t: [1, 2], satuan: 'foto', koin: 10},
  {id: 'ambil', ikon: '✋', judul: 'Kumpulkan barang: kotak bercahaya di jalan', t: [3, 5, 8], satuan: 'barang', koin: 10},
  {id: 'mancing', ikon: '🎣', judul: 'Mancing di sungai sampai dapat ikan', t: [1, 2, 3], satuan: 'ikan', koin: 10, info: 'Sungai ada di sisi timur dusun, dekat sawah.'},
  {id: 'sungai', ikon: '🌊', judul: 'Jalan-jalan ke pinggir sungai', t: [1], koin: 5},
  {id: 'lari', ikon: '🏃', judul: 'Olahraga: lari (dorong joystick penuh)', t: [100, 150, 250], satuan: 'langkah', koin: 5},
  {id: 'kucing', ikon: '🐱', judul: 'Rawat kucing: beri makan kucing (tombol 🐟)', t: [1], koin: 5, info: 'Butuh ikan hasil mancing. Oyen ada di rumah Raka (No. 1), atau kucing di depan rumah warga.', antar: 1},
  {id: 'lompat', ikon: '🦘', judul: 'Lompat-lompat (tombol lompat)', t: [10, 20, 30], satuan: 'kali', koin: 5},
  {id: 'fasum', ikon: '🏛️', judul: 'Kunjungi fasilitas umum yang berbeda', t: [2, 3, 4], satuan: 'tempat', koin: 10, info: 'Fasilitas umum ada di baris paling selatan dusun.'},
  {id: 'stadion', ikon: '🏟️', judul: 'Nonton bola di Stadion Dunia Kotak', t: [1], koin: 5, info: 'Stadion ada di baris fasilitas umum, selatan Dusun Kotak Wetan.', ke: ['wetan', 'Stadion']},
  {id: 'npc', ikon: '💬', judul: 'Ngobrol dengan warga NPC yang berbeda', t: [2, 3, 4], satuan: 'NPC', koin: 10},
  {id: 'supermarket', ikon: '🛒', judul: 'Belanja ke Supermarket Dunia Kotak', t: [1], koin: 5, info: 'Supermarket ada di Dusun Kotak Wetan, dekat rumah Raka.', ke: ['wetan', 'Supermarket']},
  {id: 'rs', ikon: '🏥', judul: 'Jenguk teman di Rumah Sakit', t: [1], koin: 5, info: 'Rumah Sakit ada di baris fasilitas umum, selatan Dusun Kotak Wetan.', ke: ['wetan', 'Rumah Sakit']},
  // FASUM TERSEBAR (Huda 9 Nov 2026): misi lintas dusun. "khas" = satu fasum khas dusun yang berganti tiap hari (FASUM_KHAS),
  // makin banyak fasum dibangun di dusun-dusun, makin beragam misinya.
  {id: 'dusun', ikon: '🗺️', judul: 'Jelajah dusun yang berbeda (naik bus di terminal)', t: [2, 3], satuan: 'dusun', koin: 15},
  {id: 'khas', ikon: '📍', judul: 'Kunjungi fasum khas hari ini', t: [1], koin: 15},
];
function undiMisi(hari) {
  let h = 2166136261; for (const c of 'dk' + hari) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const r = () => { h = (h + 0x6D2B79F5) >>> 0; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = KOLAM_MISI.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  const pilih = a.slice(0, 6).map(m => ({...m, target: m.t[Math.floor(r() * m.t.length)]}));
  const kh = pilih.find(m => m.id === 'khas');
  if (kh) { const d = FASUM_KHAS(); let h2 = 0; for (const c of hari) h2 = (h2 * 31 + c.charCodeAt(0)) >>> 0; const [dd, nm] = d[h2 % d.length];
    Object.assign(kh, {judul: `Kunjungi ${nm} di Dusun ${NAMA_DUSUN[dd] || dd}`, info: `Fasum khas Dusun ${NAMA_DUSUN[dd] || dd}. Besok fasum lain!`, ke: [dd, nm]}); }
  return pilih;
}
let MISI = [];
const BONUS_MISI = 20;
// 7 Nov 2026 (lima menit pertama): misi harian dibuka sepanjang hari, koin 1x; saat Jam Kumpul Warga koin 2x. Sama dengan worker.js.
const MISI_SEPANJANG_HARI = true;
const kaliKoin = () => jamKumpul() ? 2 : 1;
const hariIni = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const MS = {p: {}, selesai: new Set(), kirim: new Set(), t: ''};
function muatMisi() {
  MS.t = hariIni(); MISI = undiMisi(MS.t);
  const l = bacaJ('dk_misi') || {}; MS.p = l.t === MS.t && l.no === S.saya?.no ? l.p || {} : {};
  MS.selesai = new Set(S.saya?.misi || []);
  tandaKoin();
}
function tandaKoin() {
  const n = MISI.filter(m => MS.selesai.has(m.id)).length;
  if ($('bMisi')) $('bMisi').innerHTML = `<i>📋</i>Misi ${n}/${MISI.length}`;
  hitungOnline();
}
let simpanMisiT = 0;
function misiMaju(id, n = 1, kunciUnik) {
  pemulaMaju(id, n);
  if (S.tamu || !S.saya || !(MISI_SEPANJANG_HARI || jamKumpul())) return;
  if (MS.t !== hariIni()) { MS.t = hariIni(); MISI = undiMisi(MS.t); MS.p = {}; MS.selesai = new Set(); }
  const m = MISI.find(x => x.id === id); if (!m || MS.selesai.has(id)) return;
  if (kunciUnik != null) { const a = MS.p[id] = Array.isArray(MS.p[id]) ? MS.p[id] : []; if (a.includes(kunciUnik)) return; a.push(kunciUnik); }
  else MS.p[id] = (+MS.p[id] || 0) + n;
  const now = performance.now(); if (now - simpanMisiT > 2000 || kunciUnik != null) { simpanMisiT = now; simpan('dk_misi', {t: MS.t, no: S.saya.no, p: MS.p}); }
  if (!$('panelMisi').hidden) tulisMisi();
  if (progresMisi(m) >= m.target) klaimMisi(id);
}
const progresMisi = m => Math.min(m.target, Array.isArray(MS.p[m.id]) ? MS.p[m.id].length : +MS.p[m.id] || 0);
async function klaimMisi(id) {
  if (MS.kirim.has(id) || MS.selesai.has(id)) return; MS.kirim.add(id);
  try {
    const s = await api('misi', {kunci: S.kunci, id});
    S.saya.koin = s.koin; MS.selesai = new Set(s.misi || []);
    if (s.dapat) { const m = MISI.find(x => x.id === id); toast(id === 'bonus' ? `🎉 Semua misi hari ini selesai! Bonus +${s.dapat} koin${s.dapatPermata ? ` +${s.dapatPermata} 💎` : ''}` : `✅ Misi selesai: ${m.judul}. +${s.dapat} koin`, 4000); bunyi('masuk'); }
    tandaKoin(); if (!$('panelMisi').hidden) tulisMisi();
    if (id !== 'bonus' && MISI.every(m => MS.selesai.has(m.id)) && !MS.selesai.has('bonus')) setTimeout(() => klaimMisi('bonus'), 1500);
  } catch (e) { /* coba lagi nanti */ } finally { MS.kirim.delete(id); }
}
function tulisMisi() {
  const total = MISI.reduce((a, m) => a + m.koin, 0) + BONUS_MISI;
  $('isiMisi').innerHTML = MISI.map(m => {
    const p = progresMisi(m), ok = MS.selesai.has(m.id);
    return `<div class="misi ${ok ? 'ok' : ''}"><span class="mi">${ok ? '✅' : m.ikon}</span><div><b>${esc(m.judul)}</b>
      <div class="bar"><i style="width:${Math.round(100 * (ok ? 1 : p / m.target))}%"></i></div><small>${ok ? 'Selesai' : m.target > 1 ? `${p}/${m.target} ${m.satuan || ''}` : 'Belum'}</small>${!ok && m.info ? `<small class="info">📍 ${esc(m.info)}</small>` : ''}${!ok && m.antar ? `<button class="antar" data-antar="${m.antar}">🧭 Antar ke sana</button>` : ''}${!ok && m.ke ? `<button class="antar" data-ke="${m.ke[0]}" data-kenama="${esc(m.ke[1])}">${m.ke[0] === DI ? '🧭 Antar ke sana' : `🚌 Naik bus ke Dusun ${esc(NAMA_DUSUN[m.ke[0]] || m.ke[0])}`}</button>` : ''}</div><span class="koin">+${m.koin * kaliKoin()} 🪙</span></div>`;
  }).join('') + `<div class="misi bonus ${MS.selesai.has('bonus') ? 'ok' : ''}"><span class="mi">🎁</span><div><b>Bonus: selesaikan semua misi</b><small>${MS.selesai.has('bonus') ? 'Sudah diambil' : `Otomatis masuk setelah ${MISI.length} misi selesai`}</small></div><span class="koin">+${BONUS_MISI * kaliKoin()} 🪙 +3 💎</span></div>`;
  // Misi tetap tiap hari (Huda 8 Nov): ikut lari Pelari Kalcer sampai finish, selesai otomatis di server saat finish.
  const okLari = MS.selesai.has('pelari');
  $('isiMisi').innerHTML += `<div class="misi ${okLari ? 'ok' : ''}"><span class="mi">${okLari ? '✅' : '🏃'}</span><div><b>Ikut lari Pelari Kalcer sampai finish</b><small>${okLari ? 'Selesai' : 'Belum'}</small>${okLari ? '' : '<small class="info">📍 Gapura CFD di belakang gawang timur Stadion Kotak Wetan.</small><button class="antar" data-lari="1">🏃 Ikut lari sekarang</button>'}</div><span class="koin">+15 🪙</span></div>`;
  $('isiMisi').innerHTML = barisPemula() + barisHadir() + barisMenit() + $('isiMisi').innerHTML;
  const isiTas = Object.entries(tas).map(([n, v]) => `${v.ikon} ${n} ×${v.n}`).join(' · ');
  $('isiMisi').innerHTML += `<div class="misi"><span class="mi">🎒</span><div><b>Tasmu</b><small>${isiTas ? esc(isiTas) : 'Masih kosong. Ambil barang di jalan atau mancing di sungai.'}</small></div><span></span></div>`;
  const buka = jamKumpul();
  $('ringkasMisi').textContent = buka ? `${sesiKini().ikon} ${sesiKini().nama}: koin misi 2x sampai ${jamTeks(sesiKini().j[1])} WIB! Koinmu: 🪙 ${S.saya?.koin || 0} · Hari ini bisa dapat ${total * 2} koin.`
    : MISI_SEPANJANG_HARI ? `Misi bisa dikerjakan kapan saja hari ini. Mau koin 2x? Kerjakan saat Jam Kumpul Warga: ${sesiBerikut().ikon} ${sesiBerikut().nama} ${jamTeks(sesiBerikut().j[0])} WIB. Koinmu: 🪙 ${S.saya?.koin || 0}.`
    : `🔒 Misi hanya bisa dikerjakan saat Jam Kumpul Warga (${daftarSesi()} WIB), bareng warga lain, koin 2x. Berikutnya: ${sesiBerikut().ikon} ${sesiBerikut().nama} ${jamTeks(sesiBerikut().j[0])}. Koinmu: 🪙 ${S.saya?.koin || 0}.`;
}
document.addEventListener('click', e => { if (e.target.closest?.('[data-lari]')) ikutLari(); });
document.addEventListener('click', e => { const b = e.target.closest?.('[data-antar]'); if (!b) return; $('panelMisi').hidden = true; pergiKe(+b.dataset.antar); });
// misi di dusun lain: naik bus (pindah dusun, misi lanjut di sana) atau diantar ke fasumnya bila sudah di dusun itu
document.addEventListener('click', e => { const b = e.target.closest?.('[data-ke]'); if (!b) return; $('panelMisi').hidden = true;
  if (b.dataset.ke !== DI) return pindahDusun(b.dataset.ke);
  const f = fasumBangun.find(x => x.nama && x.nama.includes(b.dataset.kenama)); if (f) mulaiRute({x: f.position.x, z: f.position.z, nama: b.dataset.kenama}, true); });
// ---------- Lima menit pertama (7 Nov 2026): misi pemula berurutan + hadiah hadir beruntun ----------
// Satu tujuan saja di layar (chip 🎯), tiap langkah langsung dapat koin. Urutan & koin HARUS sama dengan PEMULA di worker.js.
const PEMULA = [
  {id: 'jalan', ikon: '👣', judul: 'Jalan masuk ke pekaranganmu', petunjuk: 'Dorong joystick kiri bawah · laptop: WASD', target: 20, satuan: 'langkah', koin: 10},
  {id: 'tanam', ikon: '🌱', judul: 'Tanam tomat di kebunmu', petunjuk: 'Dekat rumah, tekan 🌱 Tanam (gratis) · ketuk untuk diantar', target: 1, koin: 15},
  {id: 'ambil', ikon: '✋', judul: 'Ambil kotak bercahaya', petunjuk: 'Dekati kotak yang menyala, tekan ✋ Ambil', target: 1, koin: 15},
  {id: 'sapa', ikon: '👋', judul: 'Sapa warga', petunjuk: 'Ketuk 👋 di kotak chat', target: 1, koin: 10},
  {id: 'raka', ikon: '⭐', judul: 'Temui Raka & Oyen', petunjuk: 'Ketuk di sini, kamu diantar', target: 1, koin: 50, permata: 10},
];
const PM = {s: [], boleh: false, p: {}, kirim: false, sorot: null};
const pemulaKini = () => PM.boleh ? PEMULA.find(x => !PM.s.includes(x.id)) || null : null;
function muatPemula(s) {
  PM.s = (s && s.pemula && s.pemula.s) || []; PM.boleh = !!(s && s.pemula && s.pemula.boleh);
  const l = bacaJ('dk_pemula') || {}; PM.p = l.no === S.saya?.no ? l.p || {} : {};
}
function pemulaMaju(id, n = 1) {
  const m = pemulaKini(); if (!m || m.id !== id || S.tamu || !S.saya) return;
  PM.p[id] = (PM.p[id] || 0) + n; simpan('dk_pemula', {no: S.saya.no, p: PM.p});
  if (PM.p[id] >= m.target) klaimPemula(m); else tulisTujuan();
}
async function klaimPemula(m) {
  if (PM.kirim) return; PM.kirim = true;
  try {
    const r = await api('pemula', {kunci: S.kunci, id: m.id});
    S.saya.koin = r.koin; S.saya.permata = r.permata; if (r.pemula) { PM.s = r.pemula.s; PM.boleh = r.pemula.boleh; }
    hitungOnline(); bunyi('masuk');
    if (r.ajak) setTimeout(() => toast(`🤝 Bonus diajak${r.ajak.dari ? ' @' + esc(r.ajak.dari) : ''}: +${r.ajak.permata} 💎 untukmu, temanmu juga dapat 💎`, 4500), 2800);
    if (r.pemula?.dapat) { koinTerbang(`+${r.pemula.dapat} 🪙${m.permata ? ` +${m.permata} 💎` : ''}`); toast(`✅ ${m.judul}! +${r.pemula.dapat} koin`, 2600); }
    if (!pemulaKini()) setTimeout(pemulaTamat, 900);
  } catch (e) { setTimeout(() => { PM.kirim = false; if (pemulaKini() === m && (PM.p[m.id] || 0) >= m.target) klaimPemula(m); }, 5000); return; }
  PM.kirim = false; tulisTujuan(); siapkanLangkah();
  if (rute.titik && rute.tujuan && /^(kotak bercahaya|kebunmu|Raka)/.test(rute.tujuan.nama)) hapusRute();   // tujuan sudah tercapai
}
// Langkah yang butuh bantuan: kotak bercahaya ditaruh dekat, tombol yang dipakai disorot.
function siapkanLangkah() {
  const m = pemulaKini();
  if (PM.sorot) PM.sorot.classList.remove('sorot'); PM.sorot = null;
  if (PM.bukaChat && m?.id !== 'sapa') { PM.bukaChat = false; $('chat').hidden = true; $('bBukaChat').hidden = false; tataHUD(); }   // chat dibuka otomatis untuk menyapa → kecilkan lagi
  if (!m) return;
  const b = {tanam: $('sTanam'), ambil: $('sAmbil'), sapa: $('chat').querySelector('.cepat [data-e="sapa"]')}[m.id];
  if (b) { b.classList.add('sorot'); PM.sorot = b; }
  if (m.id === 'sapa' && $('chat').hidden) { $('chat').hidden = false; $('bBukaChat').hidden = true; PM.bukaChat = true; tataHUD(); }
  if (m.id === 'ambil') taruhItemDekat();
}
function taruhItemDekat() {
  const me = tokoh.saya; if (!me || dekatItem(me)) return;
  const arah = me.rotation.y;
  for (let c = 0; c < 40; c++) {
    const a = arah + (c % 2 ? 1 : -1) * c * .18, r = (5 + (c % 4)) * VS, x = me.position.x + Math.sin(a) * r, z = me.position.z + Math.cos(a) * r;
    if (!bebas(x, z)) continue;
    const j = ITEM[c % ITEM.length]; j.mat = j.mat || new THREE.MeshLambertMaterial({color: j.w, emissive: j.w, emissiveIntensity: .35});
    const it = new THREE.Mesh(geomItem, j.mat), y0 = tanah(x, z); it.position.set(x, y0 + 1.4, z); it.userData = {jenis: j, ph: 0, y0}; sc.add(it); itemDunia.push(it);
    PM.item = it; return;
  }
}
function tulisTujuan() {
  const c = $('chipTujuan'), m = pemulaKini(); if (!c) return;
  if (!m || S.tamu) { c.hidden = true; return; }
  const i = PEMULA.indexOf(m) + 1, p = Math.min(m.target, PM.p[m.id] || 0);
  c.innerHTML = `<span class="tjNo">🎯 ${i}/${PEMULA.length}</span><span class="tjIsi"><b>${m.ikon} ${esc(m.judul)}${m.target > 1 ? ` ${p}/${m.target}` : ''}</b><small>${esc(m.petunjuk)}</small></span><span class="tjKoin">+${m.koin} 🪙</span>`;
  c.hidden = false; tataHUD();
}
function klikTujuan() {
  const m = pemulaKini(); if (!m) return;
  if (m.id === 'raka') pergiKe(1);
  else if (m.id === 'tanam') { if (bisaTanam(tokoh.saya)) bukaTanam(); else keKebun(); }
  else if (m.id === 'ambil') { taruhItemDekat(); const it = PM.item && itemDunia.includes(PM.item) ? PM.item : itemDunia[0]; if (it) mulaiRute({x: it.position.x, z: it.position.z, nama: 'kotak bercahaya'}, true); }
  else if (m.id === 'sapa') siapkanLangkah();
  else toast(m.petunjuk, 3000);
}
// Antar ke dalam pekarangan sendiri (cukup dekat untuk 🌱 Tanam).
function keKebun() {
  const L = I && S.saya && I.lots[S.saya.no]; if (!L) return pergiKe(S.saya.no);
  const dx = L.gate.x - L.c.x, dz = L.gate.z - L.c.z, d = Math.hypot(dx, dz) || 1, r = Math.min(d, 3.4 * VS);
  mulaiRute({x: L.c.x + dx / d * r, z: L.c.z + dz / d * r, nama: 'kebunmu', kav: S.saya.no}, true);
}
// Angka koin melayang dari chip ke dompet: hadiah terasa langsung.
function koinTerbang(teks) {
  const d = document.createElement('div'); d.className = 'koinTerbang'; d.textContent = teks; document.body.appendChild(d);
  setTimeout(() => d.remove(), 1700);
}
// ---------- Lama main (Huda 10 Nov 2026: target warga rata-rata 1 jam main/hari) ----------
// Detak tiap 1 menit selama layar terbuka & pemain masih menyentuh layar (diam >3 menit = tidak dihitung).
// Server menghitung menit harian: 15/30/60 menit → +2/+3/+5 💎, Jam Kumpul tiap 10 menit +1 💎 (maks 6),
// tiap 10 menit main kebun disiram (tumbuh 30 menit lebih cepat). Jejak: kapan & di layar mana game ditutup.
const MENIT_TIER = [[15, 2], [30, 3], [60, 5]];
const LM = {siap: 0, gerak: performance.now(), m: 0, h: [], k: 0, kirim: false, jejak: false};
['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(ev => addEventListener(ev, () => { LM.gerak = performance.now(); }, {passive: true, capture: true}));
const ember = (v, b, L) => { for (let i = 0; i < b.length; i++) if (v < b[i]) return L[i]; return L[L.length - 1]; };
function terimaMenit(m) { if (!m) return; LM.m = m.m || 0; LM.h = m.h || []; LM.k = m.k || 0; }
function panelTerbuka() {
  const p = [...document.querySelectorAll('.layarPenuh, .popup')].filter(e => !e.hidden && e.id).map(e => e.id);
  return (p[p.length - 1] || 'main').replace(/^panel/, '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 16) || 'main';
}
function kirimJejak() {
  if (LM.jejak) return; LM.jejak = true;
  const dt = performance.now() / 1000;
  const body = {d: ember(dt, [30, 60, 180, 300, 900], ['<30d', '30-60d', '1-3m', '3-5m', '5-15m', '15m+']), p: LM.siap ? panelTerbuka() : 'memuat'};
  if (!LM.siap) body.m = 'gagal';
  try { navigator.sendBeacon('/duniakotak/api/jejak', new Blob([JSON.stringify(body)], {type: 'application/json'})); } catch (e) {}
}
addEventListener('pagehide', kirimJejak);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') kirimJejak(); });
function mulaiLamaMain() {
  LM.siap = performance.now();
  api('jejak', {m: ember(LM.siap / 1000, [3, 6, 10, 20], ['<3', '3-6', '6-10', '10-20', '20+'])}).catch(() => {});
  if (S.tamu) return;
  setInterval(detak, 60e3); setTimeout(detak, 5e3);
}
async function detak() {
  if (S.tamu || !S.kunci || document.hidden || LM.kirim) return;
  if (performance.now() - LM.gerak > 180e3) return;
  LM.kirim = true;
  try {
    const r = await api('detak', {kunci: S.kunci}); const lama = LM.h.slice();
    terimaMenit(r.menit);
    if (r.permata != null && S.saya) S.saya.permata = r.permata;
    if (r.dapat) {
      const t = MENIT_TIER.find(([m]) => LM.h.includes(m) && !lama.includes(m));
      hitungOnline(); bunyi('masuk'); koinTerbang(`+${r.dapat} 💎`);
      toast(t ? `⏱ Sudah main ${t[0]} menit hari ini! +${r.dapat} 💎` : `🎉 Bonus Jam Kumpul: 10 menit main bareng warga, +${r.dapat} 💎`, 4500);
    }
    if (r.siram) { toast('💧 Kebunmu disiram! Tanamanmu tumbuh 30 menit lebih cepat.', 4000); hasilKebun({kebun: r.kebun}); }
    if (!$('panelMisi').hidden) tulisMisi();
  } catch (e) {} finally { LM.kirim = false; }
}
function barisMenit() {
  if (S.tamu) return '';
  const m = LM.m, ok = m >= 60, ki = jamKumpul();
  const tier = MENIT_TIER.map(([t, p]) => `${LM.h.includes(t) ? '✅' : '○'} ${t} mnt +${p}💎`).join(' · ');
  return `<div class="misi ${ok ? 'ok' : ''}"><span class="mi">${ok ? '✅' : '⏱'}</span><div><b>Main 15 / 30 / 60 menit hari ini</b>
    <div class="bar"><i style="width:${Math.min(100, Math.round(100 * m / 60))}%"></i></div><small>${m} menit · ${tier}</small><small class="info">${ki ? `🎉 Jam Kumpul sekarang: tiap 10 menit main +1 💎 (${LM.k}/6)` : `Saat Jam Kumpul Warga: tiap 10 menit main +1 💎 (${LM.k}/6). Tiap 10 menit main, kebunmu disiram otomatis.`}</small></div><span class="koin">+10 💎</span></div>`;
}
function pemulaTamat() {
  tulisTujuan(); if (PM.sorot) PM.sorot.classList.remove('sorot');
  const k = S.saya?.kebun, siap = k && k.siap ? jamTeks(((k.siap + 7 * 3600e3) % 864e5) / 3600e3) : '';
  const besok = HD.besok ? `+${HD.besok} 🪙` : 'koin';
  dialogRaka([
    `Keren, @${S.saya.ig}! Kamu sudah jadi warga beneran. Hadiah dariku: +50 🪙 dan +10 💎. Koinmu sekarang ${S.saya.koin} 🪙.`,
    `Koinmu cukup untuk beli bangku atau pot di pekaranganmu: ⚙ Atur → Toko Hias. Masih ada 📋 Misi hari ini kalau mau tambah koin.`,
    `Besok balik lagi ya! Ada hadiah hadir hari ke-${(HD.n || 0) + 1} (${besok}), misi baru${siap ? `, dan tomatmu siap dipanen jam ${siap} WIB` : ''}. Meong! kata Oyen.`,
  ]);
}
function barisPemula() {
  if (!PM.boleh || S.tamu) return '';
  const m = pemulaKini(), n = PEMULA.filter(x => PM.s.includes(x.id)).length;
  if (!m) return '';
  return `<div class="misi pemula"><span class="mi">🎯</span><div><b>Misi warga baru ${n}/${PEMULA.length}: ${m.ikon} ${esc(m.judul)}</b><div class="bar"><i style="width:${Math.round(100 * n / PEMULA.length)}%"></i></div><small>${esc(m.petunjuk)} · total hadiah 100 🪙 + 10 💎</small></div><span class="koin">+${m.koin} 🪙</span></div>`;
}
// Hadir beruntun: diambil otomatis saat masuk game sekali sehari.
const HD = {n: 0, besok: 0, daftar: []};
function aturHadir(h) { if (h) Object.assign(HD, h); }
async function ambilHadir() {
  if (S.tamu || !S.saya) return;
  try {
    const r = await api('hadir', {kunci: S.kunci}); S.saya.koin = r.koin; aturHadir(r.hadir); hitungOnline();
    if (r.hadir?.dapat) { bunyi('masuk'); koinTerbang(`+${r.hadir.dapat} 🪙`); toast(`📅 Hadir hari ke-${r.hadir.n}: +${r.hadir.dapat} koin${r.dapatPermata ? ` +${r.dapatPermata} 💎` : ''}. Besok +${r.hadir.besok}, jangan sampai putus!`, 5000); if (r.permata != null) S.saya.permata = r.permata; }
  } catch (e) {}
}
function barisHadir() {
  if (S.tamu || !HD.daftar.length) return '';
  const kotak = HD.daftar.map((v, i) => `<i class="${i < ((HD.n - 1) % 7) + 1 && HD.n ? 'ok' : ''}">${v}</i>`).join('');
  return `<div class="misi hadir"><span class="mi">📅</span><div><b>Hadir beruntun: hari ke-${HD.n || 0}</b><div class="hdKotak">${kotak}</div><small>Masuk tiap hari, hadiah naik. Besok +${HD.besok} 🪙. Hari ke-7 bonus +${HD.permata7 || 10} 💎. Bolos sehari = mulai lagi dari hari 1.</small></div><span></span></div>`;
}
// ---------- papan peringkat warga (total koin yang pernah dikumpulkan; belanja tidak mengurangi) ----------
async function bukaPeringkat(dariTab) {
  if (!dariTab) { tabPeringkat('piala'); return; }   // tombol 🏆 membuka tab Piala Dusun dulu (9 Nov 2026)
  $('panelPeringkat').hidden = false; $('isiPeringkat').innerHTML = '<p class="kecil">Memuat…</p>';
  let d = null; try { d = await (await fetch('/duniakotak/api/peringkat' + (S.saya ? '?no=' + S.saya.no : ''))).json(); } catch (e) {}
  if (!d || !d.top) { $('isiPeringkat').innerHTML = '<p class="kecil">Papan peringkat belum bisa dimuat. Coba lagi sebentar.</p>'; return; }
  // ringkas (Huda 6 Nov): kotak setinggi 10 baris, peringkat 11 dst. digeser ke bawah
  const medali = r => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : r;
  const baris = (x, aku) => `<div class="pkBaris${aku ? ' aku' : ''}${x.r <= 3 ? ' juara' : ''}"><span class="pkNo">${medali(x.r)}</span><span class="pkNama">${x.u ? '@' + esc(x.u) : 'Warga No. ' + x.no}${aku ? ' (kamu)' : ''}<small>${NAMA_DUSUN[dusunDari(x.no)]}</small></span><b>🪙 ${x.koin}</b></div>`;
  const aku = S.saya && d.top.some(x => x.no === S.saya.no);
  let h = d.top.length ? `<div class="pkDaftar" id="pkDaftar">${d.top.map(x => baris(x, S.saya && x.no === S.saya.no)).join('')}</div>` : '<p class="kecil">Belum ada warga yang punya koin. Jadilah yang pertama!</p>';
  if (S.saya && d.saya && !aku) h += `<div class="pkBaris aku pkSaya"><span class="pkNo">${d.saya.r || '–'}</span><span class="pkNama">@${esc(S.saya.ig || '')} (kamu)<small>${d.saya.r ? 'dari ' + d.jml + ' warga berkoin' : 'Belum punya koin'}</small></span><b>🪙 ${d.saya.koin}</b></div>`;
  $('isiPeringkat').innerHTML = h;
  $('ringkasPeringkat').textContent = `${d.jml} warga sudah punya koin. Geser daftar untuk melihat peringkat 6 dan seterusnya.`;
}
// ---------- Ajak Tetangga (Huda 9 Nov 2026) ----------
// Link willoapparel.com/duniakotak/?ajak=<no>. Teman yang daftar lewat link lalu menanam bibit pertama (misi pemula 🌱) →
// pengajak +10 💎 (maks 5 teman per hari), teman +5 💎. Bar = warga terdaftar menuju warga ke-861 (Dusun Segara dibuka).
const linkAjak = () => 'https://willoapparel.com/duniakotak/?ajak=' + (S.saya ? S.saya.no : '');
async function bukaAjak() {
  simpan('dk_ajak_lihat', '1'); $('bAtur').classList.remove('baru');
  $('panelAjak').hidden = false; $('isiAjak').innerHTML = '<p class="kecil">Memuat…</p>';
  let d = null; try { d = await (await fetch('/duniakotak/api/ajak' + (S.saya ? '?no=' + S.saya.no : ''), {cache: 'no-store'})).json(); } catch (e) {}
  if (!d || !d.target) { $('isiAjak').innerHTML = '<p class="kecil">Belum bisa dimuat. Coba lagi sebentar.</p>'; return; }
  const pct = Math.min(100, Math.round(d.maks / d.target * 100));
  let h = `<div class="ajBar"><div class="ajJudul">${d.kurang ? `Kurang <b>${d.kurang}</b> warga lagi, 🏙️ Dusun Segara dibuka!` : '🏙️ Dusun Segara sudah dibuka!'}</div>
    <div class="ajTrek"><i style="width:${pct}%"></i></div><div class="ajAngka"><span>Warga No. ${d.maks}</span><span>No. ${d.target}</span></div></div>`;
  if (S.tamu) h += '<p class="kecil">Daftar jadi warga dulu supaya punya link ajak sendiri.</p>';
  else {
    h += `<p class="kecil ajKet">Bagikan link ini. Teman yang daftar lewat linkmu lalu menanam bibit pertamanya: <b>kamu +${d.hadiah.pengajak} 💎</b>, <b>temanmu +${d.hadiah.baru} 💎</b> (maks ${d.hadiah.hari} teman berhadiah per hari).</p>
      <div class="ajLink" id="ajLink">${esc(linkAjak().replace('https://', ''))}</div>
      <div class="ajTombol"><button class="utama" id="ajBagi">📤 Bagikan</button><button id="ajWa">WhatsApp</button><button id="ajSalin">Salin link</button></div>`;
    if (d.saya) h += `<p class="kecil ajSaya">Temanmu yang daftar: <b>${d.saya.daftar}</b> · sudah mulai main: <b>${d.saya.main}</b>${d.saya.baru.length ? '<br>' + d.saya.baru.map(x => `${x.main ? '✅' : '⏳'} @${esc(x.u || 'warga ' + x.no)}`).join(' · ') : ''}</p>`;
  }
  if (d.top.length) h += `<p class="kecil plJudul">🏅 Pengajak terbanyak minggu ini</p><div class="pkDaftar">${d.top.map((x, i) => `<div class="pkBaris${S.saya && x.no === S.saya.no ? ' aku' : ''}${i < 3 ? ' juara' : ''}"><span class="pkNo">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="pkNama">@${esc(x.u || 'warga ' + x.no)}</span><b>${x.n} teman</b></div>`).join('')}</div>`;
  $('isiAjak').innerHTML = h;
  const teks = `Aku warga No. ${S.saya?.no || ''} di Desa Dunia Kotak 🏡 Daftar gratis lewat link ini, nanti kita sama-sama dapat permata 💎.${d.kurang ? ` Kurang ${d.kurang} warga lagi Dusun Segara dibuka!` : ''}`;
  const salin = async () => { try { await navigator.clipboard.writeText(teks + ' ' + linkAjak()); toast('🔗 Link ajak disalin. Tempel di chat, story, atau bio.', 3000); } catch (e) { prompt('Salin link ini:', linkAjak()); } };
  if ($('ajBagi')) $('ajBagi').onclick = async () => { try { if (navigator.share) { await navigator.share({title: 'Desa Dunia Kotak', text: teks, url: linkAjak()}); return; } } catch (e) { if (e && e.name === 'AbortError') return; } salin(); };
  if ($('ajWa')) $('ajWa').onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(teks + ' ' + linkAjak()), '_blank');
  if ($('ajSalin')) $('ajSalin').onclick = salin;
}
// Pengumuman fitur baru (Huda 9 Nov 2026 "pastikan warga tau"): pop up sekali per HP, menunggu sampai tidak ada pop up lain
// (voting harian, panduan, misi pemula). Tanda BARU di tombol Atur hilang setelah panel Ajak dibuka.
// Tiap fitur baru = satu .kbItem[data-k] di #panelKabar; item yang sudah pernah dilihat di HP ini disembunyikan.
const KABAR_LAMA = {ajak: 'dk_kabar_ajak1', piala: 'dk_kabar_ajak1', rumah: 'dk_kabar_rumah1', npc: 'dk_kabar_npc1', album: 'dk_kabar_album1', pasar: 'dk_kabar_pasar1', tersebar: 'dk_kabar_tersebar1', lamamain: 'dk_kabar_lamamain1', tukang: 'dk_kabar_tukang1'};
function kabarBaru(n = 0) {
  if (!baca('dk_ajak_lihat')) $('bAtur').classList.add('baru');
  const baru = [...document.querySelectorAll('#panelKabar .kbItem[data-k]')].filter(e => !baca(KABAR_LAMA[e.dataset.k]));
  if (!baru.length) return;
  const sibuk = [...document.querySelectorAll('.layarPenuh')].some(e => !e.hidden) || (typeof pemulaKini === 'function' && pemulaKini() && n < 40);
  if (sibuk) { if (n < 120) setTimeout(() => kabarBaru(n + 1), 5000); return; }
  document.querySelectorAll('#panelKabar .kbItem[data-k]').forEach(e => { e.hidden = !baru.includes(e); });
  $('kbTukangBtn').hidden = !baru.some(e => e.dataset.k === 'tukang'); $('kbAjakBtn').hidden = !baru.some(e => e.dataset.k === 'ajak'); $('kbRumahBtn').hidden = !baru.some(e => e.dataset.k === 'rumah'); $('kbAlbumBtn').hidden = !baru.some(e => e.dataset.k === 'album'); $('kbPasarBtn').hidden = !baru.some(e => e.dataset.k === 'pasar'); $('kbVotingBtn').hidden = !baru.some(e => e.dataset.k === 'tersebar'); $('kbNpcBtn').hidden = !baru.some(e => e.dataset.k === 'npc') || DI !== 'wetan' || !I.fas?.[11];
  baru.forEach(e => simpan(KABAR_LAMA[e.dataset.k], '1')); bunyi('masuk');
  ambilAjakSingkat();
  $('panelKabar').hidden = false;
  $('kbAjakBtn').onclick = () => { $('panelKabar').hidden = true; bukaAjak(); };
  $('kbPialaBtn').onclick = () => { $('panelKabar').hidden = true; bukaPeringkat(); };
  // NPC fasum (Huda 9 Nov 2026): antar ke pintu IGD Rumah Sakit (fas[11])
  $('kbNpcBtn').onclick = () => { $('panelKabar').hidden = true; const f = I.fas[11]; mulaiRute({x: f.x + 6.6 * VS, z: f.z + .6 * VS, nama: 'Rumah Sakit'}, true); };
  $('kbPasarBtn').onclick = () => { $('panelKabar').hidden = true; bukaPasar(); };
  $('kbTukangBtn').onclick = () => { $('panelKabar').hidden = true; ikutBangun(); };
  $('kbVotingBtn').onclick = () => { $('panelKabar').hidden = true; bukaVoting(); };
  $('kbAlbumBtn').onclick = () => { $('panelKabar').hidden = true; bukaAlbum(); };
  $('kbRumahBtn').onclick = () => { $('panelKabar').hidden = true; $('panelPeringkat').hidden = false; tabPeringkat('rumah'); };
}
async function ambilAjakSingkat() { try { const d = await (await fetch('/duniakotak/api/ajak')).json(); if (d.kurang) $('kbAjak').textContent = `Bagikan link ajakmu. Teman daftar & tanam bibit pertama: kamu +${d.hadiah.pengajak} 💎, temanmu +${d.hadiah.baru} 💎. Kurang ${d.kurang} warga lagi, Dusun Segara dibuka!`; } catch (e) {} }
// ---------- Piala Antardusun Mingguan (Huda 9 Nov 2026) ----------
// Finish Pelari Kalcer (+10, maks 3x/hari) & gol stadion (+2, maks 5/hari) = poin untuk dusun sendiri. Juara Senin–Minggu
// dapat bendera emas di gapura dusunnya selama seminggu berikutnya. Data: GET /duniakotak/api/piala[?no=].
const DUSUN_PIALA = {wetan: ['🌾', 'Kotak Wetan'], kulon: ['🍃', 'Kotak Kulon'], curug: ['💦', 'Kotak Curug'], tlaga: ['🛶', 'Kotak Tlaga'], segara: ['🏙️', 'Kotak Segara']};
const namaPiala = d => (DUSUN_PIALA[d] || ['', d])[1];
let PIALA = null;
async function ambilPiala() { try { PIALA = await (await fetch('/duniakotak/api/piala' + (S.saya ? '?no=' + S.saya.no : ''), {cache: 'no-store'})).json(); } catch (e) { PIALA = null; } return PIALA; }
function sisaWaktu(ms) { const j = Math.max(0, Math.floor(ms / 3600e3)); return j >= 24 ? Math.floor(j / 24) + ' hari ' + (j % 24) + ' jam' : j + ' jam ' + Math.max(0, Math.floor(ms % 3600e3 / 60e3)) + ' menit'; }
function tabPeringkat(t) {
  document.querySelectorAll('#tabPeringkat button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  if (t === 'piala') bukaPiala(); else if (t === 'rumah') bukaLombaRumah(); else bukaPeringkat(true);
}
async function bukaPiala() {
  $('panelPeringkat').hidden = false; $('isiPeringkat').innerHTML = '<p class="kecil">Memuat…</p>';
  $('ringkasPeringkat').textContent = 'Lari Pelari Kalcer sampai finish dan cetak gol di stadion untuk menambah poin dusunmu.';
  const d = await ambilPiala();
  if (!d || !d.klasemen) { $('isiPeringkat').innerHTML = '<p class="kecil">Klasemen Piala belum bisa dimuat. Coba lagi sebentar.</p>'; return; }
  const maks = Math.max(1, ...d.klasemen.map(x => x.poin)), medali = ['🥇', '🥈', '🥉', '4', '5'];
  const sayaD = S.saya ? dusunDari(S.saya.no) : '';
  let h = '';
  if (d.juara) h += `<div class="plJuara">🏆 Juara minggu lalu: <b>${DUSUN_PIALA[d.juara.d][0]} Dusun ${namaPiala(d.juara.d)}</b> (${d.juara.poin} poin). Bendera emas berkibar di gapuranya.${d.juara.top.length ? '<small>Penyumbang poin terbanyak: ' + d.juara.top.map(x => '@' + esc(x.u || 'warga ' + x.no)).join(', ') + '</small>' : ''}</div>`;
  h += `<div class="plDaftar">${d.klasemen.map((x, i) => `<div class="plBaris${x.d === sayaD ? ' aku' : ''}"><span class="plMedali">${x.poin ? medali[i] : '–'}</span><span class="plNama">${DUSUN_PIALA[x.d][0]} ${namaPiala(x.d)}${x.d === sayaD ? '<small>dusunmu</small>' : ''}<i style="width:${Math.round(x.poin / maks * 100)}%"></i></span><b>${x.poin}<small>${x.pemain} pemain</small></b></div>`).join('')}</div>`;
  if (d.saya) h += `<p class="kecil plSaya">Sumbanganmu minggu ini: <b>${d.saya.poin} poin</b> (${d.saya.lari} finish lari, ${d.saya.gol} gol). Sisa finish berpoin hari ini: ${Math.max(0, d.saya.sisaLari)}/${d.aturan.lariHari}.</p>`;
  if (d.top.length) h += `<p class="kecil plJudul">⭐ Pahlawan dusun minggu ini</p><div class="pkDaftar plTop">${d.top.map((x, i) => `<div class="pkBaris${S.saya && x.no === S.saya.no ? ' aku' : ''}${i < 3 ? ' juara' : ''}"><span class="pkNo">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="pkNama">@${esc(x.u || 'warga ' + x.no)}<small>${namaPiala(x.d)}</small></span><b>${x.poin}</b></div>`).join('')}</div>`;
  h += `<p class="kecil plAturan">🏃 Finish Pelari Kalcer = +${d.aturan.lari} poin (maks ${d.aturan.lariHari}x sehari) · ⚽ Gol di stadion = +${d.aturan.gol} poin (maks 5 sehari). Ditutup Minggu 23.59 WIB, sisa ${sisaWaktu(d.tutup - Date.now())}. Dusun juara dapat bendera emas di gapura selama seminggu.</p>`;
  if (!S.tamu) h += '<button class="antar plLari" id="plLari">🏃 Lari sekarang, tambah poin dusun</button>';
  $('isiPeringkat').innerHTML = h;
  const b = $('plLari'); if (b) b.onclick = () => { $('panelPeringkat').hidden = true; ikutLari(); };
}
// ---------- Lomba Rumah Terindah (Huda 9 Nov 2026) ----------
async function bukaLombaRumah() {
  $('panelPeringkat').hidden = false; $('isiPeringkat').innerHTML = '<p class="kecil">Memuat…</p>';
  $('ringkasPeringkat').textContent = 'Hias rumahmu (Toko Hias, rumah 2 lantai, rakit hiasan), lalu ajak tetangga mampir dan memberi ❤️.';
  let d = null; try { d = await (await fetch('/duniakotak/api/rumah' + (S.saya ? '?no=' + S.saya.no : ''), {cache: 'no-store'})).json(); } catch (e) {}
  if (!d || !d.top) { $('isiPeringkat').innerHTML = '<p class="kecil">Klasemen lomba belum bisa dimuat. Coba lagi sebentar.</p>'; return; }
  if (d.saya) { RS.sisa = d.saya.sisa; RS.sudah = d.saya.sudah; }
  let h = '';
  if (d.juara) h += `<div class="plJuara">🏡 Rumah Terindah minggu lalu: <b>@${esc(d.juara.u || 'warga ' + d.juara.no)}</b> (${d.juara.suka} ❤️). Piala emas melayang di atas rumahnya.<small><button class="rmKunjungi" data-no="${d.juara.no}">🧭 Kunjungi rumahnya</button></small></div>`;
  if (d.saya) h += `<p class="kecil plSaya">Rumahmu: <b>${d.saya.suka} ❤️</b> minggu ini · ❤️ yang bisa kamu berikan hari ini: <b>${d.saya.sisa}/${d.aturan.hari}</b></p>`;
  h += d.top.length ? `<div class="pkDaftar">${d.top.map((x, i) => `<div class="pkBaris${S.saya && x.no === S.saya.no ? ' aku' : ''}${i < 3 ? ' juara' : ''}"><span class="pkNo">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="pkNama">@${esc(x.u || 'warga ' + x.no)}<small>${NAMA_DUSUN[dusunDari(x.no)] || ''}</small></span><button class="rmKunjungi" data-no="${x.no}">🧭</button><b>${x.suka} ❤️</b></div>`).join('')}</div>`
    : '<p class="kecil">Belum ada ❤️ minggu ini. Jalan-jalan ke rumah tetangga dan jadilah yang pertama memberi ❤️!</p>';
  h += `<p class="kecil plAturan">❤️ Dekati rumah warga lain, tekan tombol <b>❤️ Suka</b>. Gratis ${d.aturan.hari} ❤️ per hari, 1 rumah sekali sehari, rumah sendiri tidak bisa. Ditutup Minggu 23.59 WIB, sisa ${sisaWaktu(d.tutup - Date.now())}. Juara dapat piala emas di atas rumah + lencana 🏡 seminggu, dan dikunjungi Raka di vlog!</p>`;
  $('isiPeringkat').innerHTML = h;
  $('isiPeringkat').querySelectorAll('.rmKunjungi').forEach(b => b.onclick = () => { $('panelPeringkat').hidden = true; pergiKe(+b.dataset.no); toast('🧭 Menuju rumah ' + (NM[+b.dataset.no] || 'No. ' + b.dataset.no) + '…', 2500); });
}
// bendera emas di gapura dusun juara minggu lalu (tidak ikut bakeGroup supaya kain bisa berkibar)
let BENDERA_PIALA = null;
async function pasangBenderaPiala() {
  const d = PIALA || await ambilPiala(); if (!d || !d.juara) return;
  const g = LETAK[DI] && LETAK[DI].gerbang;
  if (d.juara.d === DI && g) {
    const gp = new THREE.Group(), E = 0xf2c230;
    for (const s of [-1, 1]) {
      const tiang = kotakD(.1, 2.6, .1, 0xf4f1ea, 0, 1.3, 0), kaki = kotakD(.36, .16, .36, 0x2c3150, 0, .08, 0);
      const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d');
      x.fillStyle = '#f2c230'; x.fillRect(0, 0, 256, 160); x.fillStyle = '#2c3150'; x.fillRect(0, 128, 256, 32);
      x.font = '72px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('🏆', 128, 64);
      x.fillStyle = '#fff'; x.font = '900 22px Montserrat, sans-serif'; x.fillText('JUARA PIALA DUSUN', 128, 145);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      // depan & belakang berbagi satu geometri (ikut berkibar bersama); tekstur belakang dibalik supaya tulisan tidak terbalik
      const t2 = t.clone(); t2.wrapS = THREE.RepeatWrapping; t2.repeat.x = -1; t2.offset.x = 1;
      const geo = new THREE.PlaneGeometry(1.3, .82, 8, 1), bhn = (map, side) => new THREE.MeshStandardMaterial({map, side, roughness: .7, emissive: E, emissiveIntensity: .12});
      const kain = new THREE.Group(); kain.add(new THREE.Mesh(geo, bhn(t, THREE.FrontSide)), new THREE.Mesh(geo, bhn(t2, THREE.BackSide)));
      kain.position.set(s * .65, 2.15, 0); kain.userData.kibar = {geo, a: geo.attributes.position.array.slice(), s};
      const sub = new THREE.Group(); sub.add(tiang, kaki, kain); sub.position.set(s * 3, 0, 0); gp.add(sub);
    }
    gp.scale.setScalar(VS); const z = g[1] - 26; gp.position.set(g[0], tanah(g[0], z, 0), z); sc.add(gp); BENDERA_PIALA = gp;
    setTimeout(() => toast(`🏆 Dusun ${namaPiala(DI)} juara Piala Dusun minggu lalu! Bendera emas berkibar di gapura.`, 4500), 4000);
  }
}
function kibarPiala(t) {
  if (!BENDERA_PIALA) return;
  BENDERA_PIALA.traverse(o => { const k = o.userData && o.userData.kibar; if (!k) return; const p = k.geo.attributes.position;
    // simpangan nol di sisi tiang, makin besar ke ujung kain
    for (let i = 0; i < p.count; i++) { const x0 = k.a[i * 3], jauh = (k.s * x0 + .65) / 1.3; p.array[i * 3 + 2] = Math.sin(t * 3 - jauh * 5) * .09 * jauh; } p.needsUpdate = true; });
}
// ---------- voting fasum berbintang (Huda 6 Nov 2026) ----------
// 1 bintang gratis per hari; bintang donasi masuk otomatis dari webhook Trakteer (Saweria lama tetap diterima) bila pesan donasi memuat kode DK<no>.
const CALON = {kafe: ['☕', 'Kafe'], taman: ['🌳', 'Taman Kota'], hiburan: ['🎡', 'Taman Hiburan'], polisi: ['👮', 'Kantor Polisi'], damkar: ['🚒', 'Pemadam Kebakaran'], perpus: ['📚', 'Perpustakaan'], renang: ['🏊', 'Kolam Renang'], bioskop: ['🎬', 'Bioskop']};
let VT = null, vtSibuk = false;
// Voting WAJIB (Huda 6 Nov 2026): pop up harian tidak bisa ditutup sebelum warga menaruh bintang. Hanya berlaku bila
// warga masih punya bintang (bintang gratis harian selalu ada), jadi tidak pernah memaksa donasi.
let vtWajib = false;
function kunciVoting(on) {
  vtWajib = on; const b = $('tutupVoting');
  b.style.opacity = on ? '.6' : ''; b.textContent = on ? '⭐ Pilih fasum dulu untuk lanjut main' : 'Lanjut main';
}
// gambar bintang (SVG, sama di semua HP; emoji ⭐ kadang tampil beda)
const GBR_BINTANG = '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="gbB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a6"/><stop offset=".5" stop-color="#ffd23a"/><stop offset="1" stop-color="#f29a0c"/></linearGradient></defs><path d="M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7-6.3-3.4-6.3 3.4 1.3-7L1.8 9.2l7.1-.9z" fill="url(#gbB)" stroke="#a85f00" stroke-width="1.1" stroke-linejoin="round"/></svg>';
function tulisVoting() {
  const d = VT; if (!d) return;
  const urut = [...d.calon].sort((a, b) => (d.hasil[b] || 0) - (d.hasil[a] || 0)), maks = Math.max(1, ...urut.map(c => d.hasil[c] || 0)), saldo = d.saldo || 0;
  // pop up ringkas (Huda 8 Nov 2026): saldo bintang jadi chip di judul, satu baris per calon
  $('vtSaldo').hidden = !!S.tamu; $('vtSaldo').innerHTML = `Bintangmu <b>⭐ ${saldo}</b>`;
  let h = S.tamu ? '<p class="kecil">Daftar jadi warga dulu supaya bisa ikut voting.</p>' : '';
  h += '<div class="vtDaftar">' + urut.map(c => { const [ik, nm] = CALON[c] || ['🏗️', c], n = d.hasil[c] || 0, sy = d.saya?.[c] || 0;
    return `<div class="vtBaris"><span class="vtBar" style="width:${(n / maks * 100).toFixed(1)}%"></span><span class="vtIkon">${ik}</span><span class="vtNama">${esc(nm)}${LOKASI_FASUM[c] ? `<small class="vtLok" title="Dibangun di Dusun ${NAMA_DUSUN[LOKASI_FASUM[c][0]] || ''}">📍${(NAMA_DUSUN[LOKASI_FASUM[c][0]] || '').replace('Kotak ', '')}</small>` : ''}${sy ? `<small title="Bintangmu di sini">kamu ${sy}</small>` : ''}</span><span class="vtJml">⭐ ${n}</span>`
      + (S.tamu ? '' : `<button data-vt="${c}" data-n="1" ${saldo < 1 ? 'disabled' : ''}>+1</button>${saldo >= 5 ? `<button data-vt="${c}" data-n="${saldo}">+${saldo}</button>` : ''}`) + '</div>'; }).join('') + '</div>';
  $('isiVoting').innerHTML = h; tulisDana();
  // Siklus mingguan (Huda 8 Nov 2026): voting 1 minggu, pemenang langsung dibangun, lalu voting fasum lain.
  const sisa = d.tutup ? d.tutup - Date.now() : 0, tgl = d.tutup ? new Date(d.tutup).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta'}) : '';
  const waktu = !d.tutup ? '' : sisa <= 0 ? 'Voting minggu ini sudah ditutup, pemenangnya mulai dibangun. ' : `Ditutup ${tgl}, 00.00 WIB (${sisa > 864e5 ? 'sisa ' + Math.floor(sisa / 864e5) + ' hari' : 'kurang dari sehari'}). `;
  $('ringkasVoting').textContent = waktu + `Terbanyak langsung dibangun di dusun 📍 tujuannya, tiap dusun punya fasum berbeda. ${d.pemilih} warga sudah memilih` + (S.tamu ? '.' : ', 1 bintang gratis tiap hari.');
  if (sisa < 0 || d.ditutup) $('isiVoting').querySelectorAll('button[data-vt]').forEach(b => b.disabled = true);
  if (!S.tamu && d.no) {
    $('vtDonasiLipat').hidden = false;
    // Paket bintang: tombol membuka Trakteer (Huda 8 Nov 2026, satuan Bata = 5 bintang) + menyalin kode warga; jumlah Bata dipilih di Trakteer.
    $('vtDonasi').innerHTML = `<div class="vtPaket">${[[5, 1], [10, 2], [25, 3], [100, 5]].map(([n, k]) => `<a href="https://trakteer.id/duniakotak.id" target="_blank" rel="noopener" data-paket="${n}"><span class="vtBintang b${k}">${GBR_BINTANG.repeat(k)}</span><b>${n} bintang</b><small>🧱 ${n / 5} Bata</small></a>`).join('')}</div>Tulis kode <span class="vtKode" id="vtKode" title="Salin">DK${d.no}</span> di pesan traktiran Trakteer. 🧱 1 Bata = 5 bintang + 50 💎, masuk otomatis. Hadiah Bata: ⚙ Atur → Pendukung Desa.<br><small>Bintang gratis harian sudah cukup untuk memilih.</small>` + (d.donasi ? ` <b>Bintang dari donasimu: ${d.donasi}. Terima kasih!</b>` : '');
  } else $('vtDonasiLipat').hidden = true;
}
async function bukaVoting(wajib) {
  kunciVoting(false); $('panelVoting').hidden = !!wajib;   // pop up wajib baru tampil setelah tahu hak pilih hari ini belum dipakai $('isiVoting').innerHTML = '<p class="kecil">Memuat…</p>'; $('vtDonasiLipat').hidden = true;
  try {
    VT = S.tamu || !S.kunci ? await (await fetch('/duniakotak/api/voting')).json() : await api('voting', {kunci: S.kunci});
    if (VT.gratis) toast('⭐ Bintang gratis hari ini masuk!', 3000);
    tulisVoting();
    // wajib hanya bila hak pilih hari ini belum dipakai (dicek server, jadi berlaku di semua HP)
    if (wajib) { if (!S.tamu && !VT.sudahPilih && (VT.saldo || 0) >= 1) { kunciVoting(true); $('panelVoting').hidden = false; } else simpan('dk_vt', hariIni()); }
  } catch (e) { $('isiVoting').innerHTML = '<p class="kecil">Voting belum bisa dimuat. Coba lagi sebentar.</p>'; }
}
document.addEventListener('click', async e => {
  const k = e.target.closest?.('#vtKode'); if (k) { try { await navigator.clipboard.writeText(k.textContent); toast('Kode ' + k.textContent + ' disalin. Tempel di pesan traktiran Trakteer.', 3500); } catch (er) {} return; }
  const pk = e.target.closest?.('[data-paket]'); if (pk) { const n = +pk.dataset.paket, kd = 'DK' + (VT?.no || ''); try { navigator.clipboard.writeText(kd); } catch (er) {} toast(`Pilih ${n / 5} Bata di Trakteer dan tempel kode ${kd} di pesan (sudah disalin).`, 6000); return; }
  const b = e.target.closest?.('[data-vt]'); if (!b || vtSibuk) return;
  vtSibuk = true; const c = b.dataset.vt, n = +b.dataset.n;
  try { VT = await api('voting', {kunci: S.kunci, calon: c, n}); tulisVoting(); toast(`⭐ ${n} bintang untuk ${CALON[c]?.[1] || c}!`, 2500);
    // hak pilih harian sudah dipakai → pop up langsung hilang (Huda 6 Nov 2026)
    if (vtWajib) { kunciVoting(false); simpan('dk_vt', hariIni()); setTimeout(() => { $('panelVoting').hidden = true; toast('Terima kasih sudah memilih! Besok dapat 1 bintang gratis lagi ⭐', 3500); }, 900); } }
  catch (er) { toast(er.message, 3500); } finally { vtSibuk = false; }
});
// ---------- Toko Hias: barang dibeli permata 💎 (dari donasi) atau koin (x10); barang pertama tiap jenis gratis ----------
const NAMA_TOKO = {cat: ['🏠', 'Cat rumah'], pagar: ['🪵', 'Warna pagar'], topi: ['🧢', 'Topi avatar'], rumah: ['🏡', 'Rumah']};
const NAMA_BRG = {satu: '1 lantai', dua: '2 lantai'}, IKON_BRG = {satu: '🏠', dua: '🏡'};
const tandaBrg = (j, id, warna) => IKON_BRG[id] && j === 'rumah' ? `<span class="tkIkon">${IKON_BRG[id]}</span>` : `<span class="tkWarna${id === 'tanpa' ? ' kosong' : ''}" style="background:${warna[j][id]}"></span>`;
let TK = null, tkBayar = 'permata', tkSibuk = false;
function tulisToko() {
  const d = TK; if (!d) return;
  const warna = {cat: WARNA_CAT, pagar: WARNA_PAGAR, topi: {tanpa: 'transparent', ...WARNA_TOPI}, rumah: {}};
  let h = `<div class="vtSaldo"><span>Saldo</span><b>💎 ${d.permata} <small>· 🪙 ${d.koin}</small></b></div>
    <div class="tkBayar">Bayar pakai: <button data-tkbayar="permata" class="${tkBayar === 'permata' ? 'on' : ''}">💎 Permata</button><button data-tkbayar="koin" class="${tkBayar === 'koin' ? 'on' : ''}">🪙 Koin (×${d.kali})</button></div>`;
  for (const [j, daftar] of Object.entries(d.toko)) {
    h += `<div class="tkJenis"><b>${NAMA_TOKO[j][0]} ${NAMA_TOKO[j][1]}</b><div class="tkDaftar">` + Object.entries(daftar).map(([id, harga]) => {
      const punya = !harga || d.hias.punya[j].includes(id), pakai = (d.hias[j] || Object.keys(daftar)[0]) === id;
      const label = pakai ? 'Dipakai' : punya ? 'Pakai' : tkBayar === 'koin' ? `🪙 ${harga * d.kali}` : `💎 ${harga}`;
      return `<button class="tkBrg${pakai ? ' on' : ''}" data-tkj="${j}" data-tkid="${id}" ${pakai ? 'disabled' : ''}>${tandaBrg(j, id, warna)}${NAMA_BRG[id] || id}<small>${label}</small></button>`; }).join('') + '</div></div>';
  }
  h += `<p class="kecil tkInfo">💎 Permata didapat dari <b>panen kebun di rumahmu</b> (tanam bibit, lalu 🧺 Panen tiap 6 jam: +2 💎 + hasil yang bisa dijual) dan traktiran sukarela di Trakteer (1 Bata = 5 bintang voting + 50 permata, tulis kode DK${S.saya?.no || ''}). Permata tidak masuk peringkat.</p>`;
  h += `<button class="barisAtur" id="tkDekor"><i>🪑</i><span>Hiasan pekarangan<small>Bangku, pot, lampu taman, kolam ikan · beli pakai 🪙 koin atau rakit</small></span></button>`;
  $('isiToko').innerHTML = h;
  $('tkDekor').onclick = () => { $('panelToko').hidden = true; bukaRakit(); };
}
async function bukaToko() {
  if (S.tamu) { toast('Daftar jadi warga dulu supaya bisa menghias rumah.', 4000); return; }
  $('panelToko').hidden = false; $('isiToko').innerHTML = '<p class="kecil">Memuat…</p>';
  try { TK = await api('toko', {kunci: S.kunci}); tulisToko(); } catch (e) { $('isiToko').innerHTML = '<p class="kecil">Toko belum bisa dimuat. Coba lagi sebentar.</p>'; }
}
document.addEventListener('click', async e => {
  const bb = e.target.closest?.('[data-tkbayar]'); if (bb) { tkBayar = bb.dataset.tkbayar; tulisToko(); return; }
  const b = e.target.closest?.('[data-tkj]'); if (!b || tkSibuk) return;
  tkSibuk = true; const j = b.dataset.tkj, id = b.dataset.tkid;
  try {
    TK = await api('toko', {kunci: S.kunci, jenis: j, id, bayar: tkBayar});
    S.hias = TK.hias; S.saya.koin = TK.koin; S.saya.permata = TK.permata; hitungOnline(); tulisToko();
    if (j === 'topi') { S.av = bersihAv({...S.av, topi: WARNA_TOPI[id]}); gantiAvatarSaya(); }
    else bangunUlangKavling(S.saya.no);
    toast(j === 'rumah' ? (id === 'dua' ? '🏡 Rumahmu sekarang 2 lantai!' : '🏠 Rumahmu kembali 1 lantai.') : '✨ ' + NAMA_TOKO[j][1] + ' ' + id + ' dipakai!', 2500);
  } catch (er) { toast(er.message, 3500); } finally { tkSibuk = false; }
});
function bukaMisi() {
  if (S.tamu) { toast('Daftar jadi warga dulu supaya bisa ikut misi dan dapat koin.', 4000); return; }
  if (MS.t !== hariIni()) muatMisi();
  $('panelMisi').hidden = false; tulisMisi();
}
let cekMisiT = 0;
function cekMisiDekat(me) {
  const now = performance.now(); if (now - cekMisiT < 700 || S.tamu || !I) return; cekMisiT = now;
  if (tokoh.raka && me.position.distanceTo(tokoh.raka.position) < 4 * VS) misiMaju('raka');
  misiMaju('dusun', 1, DI);   // jelajah dusun: tiap dusun yang dimainkan hari ini dihitung sekali
  for (const [ns, rt] of lotRuntime) {
    const n = +ns, L = I.lots[n]; if (!L) continue;
    const dg = Math.hypot(me.position.x - L.gate.x, me.position.z - L.gate.z);
    if (dg < 2.6 * VS && n !== 1 && n !== S.saya.no && NM[n]) misiMaju('tetangga', 1, n);
    if (n === S.saya.no && rt.kc && Math.hypot(me.position.x - (L.c.x + L.dir * -3.9 * VS), me.position.z - (L.c.z + L.dir * 3.4 * VS)) < 2.4 * VS) misiMaju('kucing');
  }
  for (const f of fasumBangun) {
    const x = me.position.x, z = me.position.z, k = f.rect, d = 3 * VS;
    const dekat = k ? x > k[0] - d && x < k[1] + d && z > k[2] - d && z < k[3] + d : Math.hypot(x - f.position.x, z - f.position.z) < 6 * VS;
    if (!dekat) continue;
    misiMaju('fasum', 1, DI + ':' + f.nama);   // fasum bernama sama di dusun lain dihitung tempat berbeda
    const kh = MISI.find(m => m.id === 'khas'); if (kh && kh.ke && kh.ke[0] === DI && f.nama.includes(kh.ke[1]) && !/^🚧/.test(f.nama)) misiMaju('khas');
    if (/Stadion/.test(f.nama)) misiMaju('stadion'); else if (/Supermarket/.test(f.nama)) misiMaju('supermarket'); else if (/Rumah Sakit/.test(f.nama)) misiMaju('rs');
  }
}

// ---------- skill warga: ambil item, mancing di sungai, beri makan kucing ----------
const ITEM = [{id: 'apel', ikon: '🍎', nama: 'Apel', w: 0xe0403a}, {id: 'bunga', ikon: '🌼', nama: 'Bunga', w: 0xffd23a}, {id: 'kayu', ikon: '🪵', nama: 'Kayu', w: 0x9a6a3e},
  {id: 'jamur', ikon: '🍄', nama: 'Jamur', w: 0xd84a4a}, {id: 'batu', ikon: '🪨', nama: 'Batu kotak', w: 0x9aa0a8}, {id: 'daun', ikon: '🍃', nama: 'Daun', w: 0x5cc85c}];
const IKAN = [[35, '🐟', 'Ikan mas'], [28, '🐠', 'Ikan nila'], [18, '🐡', 'Ikan buntal kotak'], [11, '🦐', 'Udang'], [5, '👟', 'Sepatu bekas'], [3, '🦀', 'Kepiting langka']];
// Tas warga disimpan di server (audit ekonomi 6 Nov 2026); tamu tetap di HP.
const tas = bacaJ('dk_tas') || {};
function masukTas(ikon, nama) { tas[nama] = tas[nama] || {ikon, n: 0}; tas[nama].n++; simpan('dk_tas', tas); }
function aturTas(isi) { for (const k of Object.keys(tas)) delete tas[k]; Object.assign(tas, isi || {}); if (!$('panelProfil').hidden) tulisProfil(); if (!$('panelRakit').hidden) tulisRakit(); }
async function muatTasServer(s) {
  aturTas(s.tas); aturAlbum(s.album);
  const lama = bacaJ('dk_tas');
  if (!s.tasImpor && lama && Object.keys(lama).length) { try { const r = await api('tas', {kunci: S.kunci, op: 'impor', isi: lama}); aturTas(r.tas); } catch (e) {} }
  try { localStorage.removeItem('dk_tas'); } catch (e) {}
}
let itemDunia = [], itemT = 0;
const geomItem = new THREE.BoxGeometry(1.4, 1.4, 1.4);
function isiItem(me) {
  // jaga ±10 item di sekitar pemain, di tempat yang bisa diinjak
  itemDunia = itemDunia.filter(it => { if (it.position.distanceTo(me.position) > 260) { sc.remove(it); return false; } return true; });
  for (let c = 0; c < 30 && itemDunia.length < 10; c++) {
    const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 150, x = me.position.x + Math.cos(a) * r, z = me.position.z + Math.sin(a) * r;
    if (!bebas(x, z)) continue;
    const j = ITEM[Math.floor(Math.random() * ITEM.length)];
    j.mat = j.mat || new THREE.MeshLambertMaterial({color: j.w, emissive: j.w, emissiveIntensity: .35});
    const m = new THREE.Mesh(geomItem, j.mat);
    const y0 = tanah(x, z); m.position.set(x, y0 + 1.4, z); m.userData = {jenis: j, ph: Math.random() * 6, y0}; sc.add(m); itemDunia.push(m);
  }
}
const dekatItem = me => itemDunia.find(it => Math.hypot(it.position.x - me.position.x, it.position.z - me.position.z) < 2.6 * VS);
const dekatKucing = me => [tokoh.oyen, ...kucingHidup].filter(Boolean).find(c => Math.hypot(c.position.x - me.position.x, c.position.z - me.position.z) < 3.2 * VS);
function dekatAir(me) {
  if (I && I.dekatAir) return I.dekatAir(me.position.x, me.position.z);
  const s = I && I.sungai; if (!s) return false; const x = me.position.x, z = me.position.z;
  if (x > s.x0 - 3 * VS && x < s.x1 + 3 * VS && !(x > s.x0 && x < s.x1 && !s.jembatan.some(([a, c]) => z > a && z < c))) return true;
  return false;
}
function hadap(me, p) { me.rotation.y = Math.atan2(p.x - me.position.x, p.z - me.position.z); }
function skillAmbil() {
  const me = tokoh.saya; if (!me) return; const it = dekatItem(me);
  if (!it) { toast('Tidak ada barang di dekatmu. Cari kotak bercahaya di jalan, lalu dekati.', 3000); return; }
  hadap(me, it.position); sc.remove(it); itemDunia = itemDunia.filter(x => x !== it);
  const j = it.userData.jenis;
  if (S.tamu) { masukTas(j.ikon, j.nama); bunyi('emosi'); misiMaju('ambil'); toast(`${j.ikon} ${j.nama} masuk tas (${tas[j.nama].n})`, 2200); return; }
  api('tas', {kunci: S.kunci, op: 'ambil', nama: j.nama}).then(r => { aturTas(r.tas); bunyi('emosi'); misiMaju('ambil'); toast(`${j.ikon} ${j.nama} masuk tas (${tas[j.nama]?.n || 1})`, 2200); }).catch(e => toast(e.message, 3000));
}
const mancing = {on: false, teks: '', t: 0, joran: null, batal() { if (this.joran) { tokoh.saya.remove(this.joran); this.joran = null; } }};
function skillMancing() {
  const me = tokoh.saya; if (!me || mancing.on) return;
  if (!dekatAir(me)) { toast('Mancing harus di pinggir sungai. Sungai ada di sisi timur dusun, dekat sawah.', 3500); return; }
  // Kulon & Curug tidak punya I.sungai (dulu error -> tidak bisa mancing); tiap dusun memberi arah sungainya sendiri
  const s = I.sungai; if (s) hadap(me, new THREE.Vector3(me.position.x < s.x0 ? s.x0 + 9 : s.x1 - 9, 0, me.position.z)); else if (I.arahAir) hadap(me, I.arahAir(me.position.x, me.position.z));
  gerak.tujuan = null; mancing.on = true; mancing.teks = '🎣 …'; mancing.t = performance.now();
  const j = new THREE.Mesh(new THREE.BoxGeometry(.18, .18, 6), new THREE.MeshStandardMaterial({color: 0x6b3e22})); j.position.set(.9, 2.6, 2.6); j.rotation.x = -.5; me.add(j); mancing.joran = j;
  bunyi('buka');
  const tunggu = 1800 + Math.random() * 2200;
  setTimeout(() => { if (!mancing.on) return; mancing.teks = '❗ Strike!'; bunyi('pesan');
    setTimeout(() => { if (!mancing.on) return; mancing.on = false; mancing.batal();
      const dapat = (ik, nm, baru) => { bunyi('masuk'); if (ik !== '👟') misiMaju('mancing'); toast(`${ik} Dapat ${nm}! (punya ${tas[nm]?.n || 1})` + (baru ? ` 📖 Baru di Album! (${albumHitung().ikan}/${ALBUM_IKAN.length} ikan)` : ''), baru ? 4500 : 3000); if (baru) albumBaru(); };
      if (S.tamu) { let r = Math.random() * 100, hasil = IKAN[0]; for (const x of IKAN) { if ((r -= x[0]) < 0) { hasil = x; break; } } const baru = !albumPunya(hasil[2]); masukTas(hasil[1], hasil[2]); dapat(hasil[1], hasil[2], baru); }
      else api('tas', {kunci: S.kunci, op: 'mancing'}).then(r => { aturTas(r.tas); aturAlbum(r.album); dapat(r.hasil.ikon, r.hasil.nama, r.hasil.baru); }).catch(e => toast(e.message, 3000));
    }, 700);
  }, tunggu);
}
// ---------- Pasar Malam Sabtu (Huda 9 Nov 2026) ----------
// Tiap Sabtu 19.00–23.00 WIB di lapangan Stadion Kotak Wetan (fas[12]): lapak jajan, bianglala, lampu warna-warni, kembang api,
// pedagang NPC. Jajan & Lempar Gelang bayar koin (server /api/pasar). Suvenir Lempar Gelang masuk Album (lengkap = lencana 🎪).
// ?uji_pasar=1 memaksa pasar buka (hanya tampilan; server tetap menolak transaksi di luar jam).
const PASAR_UJI = new URLSearchParams(location.search).get('uji_pasar') === '1';
const PASAR_JAJAN = {sate: ['🍢', 'Sate', 6], martabak: ['🥞', 'Martabak', 8], dawet: ['🥤', 'Es dawet', 3], gulali: ['🍭', 'Gulali', 4], jagung: ['🌽', 'Jagung bakar', 5]};
const SUVENIR = [['🧸', 'Boneka beruang'], ['🐰', 'Boneka kelinci'], ['🎈', 'Balon'], ['🪀', 'Yoyo'], ['🏮', 'Lampion']];
const PASAR_GELANG = 10;
function pasarBuka(t = Date.now()) { if (PASAR_UJI) return true; const d = new Date(t + 7 * 3600e3); return d.getUTCDay() === 6 && d.getUTCHours() >= 19 && d.getUTCHours() < 23; }
function pasarBerikut() { const n = Date.now(); for (let k = 0; k < 8; k++) { const d = new Date(n + 7 * 3600e3 + k * 864e5); if (d.getUTCDay() === 6) { const t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 19) - 7 * 3600e3; if (t + 4 * 3600e3 > n) return t; } } return n; }
const PASAR = {g: null, roda: null, gondola: [], kembang: [], tK: 0, umum: false};
const LAPAK = [[-4.6, -3.2, 'SATE', 0xe0303a], [0, -3.2, 'MARTABAK', 0xf2a020], [4.6, -3.2, 'ES DAWET', 0x3aa860], [-4.6, 3.2, 'GULALI', 0xe06ab0], [0, 3.2, 'LEMPAR GELANG', 0x3a8ad8], [4.6, 3.2, 'JAGUNG BAKAR', 0x9a5ad8]];
function papanPasar(teks, warna) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#' + warna.toString(16).padStart(6, '0'); x.fillRect(0, 0, 512, 128); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  let u = 76; x.font = `900 ${u}px Montserrat, sans-serif`; while (x.measureText(teks).width > 470 && u > 20) { u -= 4; x.font = `900 ${u}px Montserrat, sans-serif`; } x.fillText(teks, 256, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({map: t});
}
function bangunPasar() {
  const f = I.fas[12], g = new THREE.Group(); g.scale.setScalar(VS); g.position.set(f.x, .48 * VS, f.z);
  const nyala = c => new THREE.MeshStandardMaterial({color: c, emissive: c, emissiveIntensity: .9});
  // lapak: meja, tiang, atap belang, papan nama, dagangan
  for (const [x, z, teks, w] of LAPAK) {
    const s = Math.sign(z), L = new THREE.Group(); L.position.set(x, 0, z); L.rotation.y = s > 0 ? Math.PI : 0; g.add(L);
    L.add(kotakD(1.9, .75, .55, 0x8a5a2a, 0, .38, .35));
    for (const [a, b] of [[-.9, -.45], [.9, -.45], [-.9, .6], [.9, .6]]) L.add(kotakD(.07, 1.9, .07, 0xdddddd, a, .95, b));
    for (let i = 0; i < 5; i++) { const m = kotakD(.4, .1, 1.3, i % 2 ? 0xffffff : w, -.8 + i * .4, 1.95, .08); m.rotation.x = -.18; L.add(m); }
    const pn = new THREE.Mesh(new THREE.PlaneGeometry(1.9, .45), papanPasar(teks, w)); pn.position.set(0, 2.32, .62); L.add(pn);
    for (let i = 0; i < 4; i++) L.add(kotakD(.22, .16, .22, [0xffd23a, 0xff6a3a, 0xffffff, w][i], -.6 + i * .4, .84, .38));
    const lampu = new THREE.Mesh(new THREE.BoxGeometry(.14, .14, .14), nyala(0xfff2a0)); lampu.position.set(0, 1.78, .4); L.add(lampu);
  }
  // bianglala di tengah lapangan
  const kaki = new THREE.MeshStandardMaterial({color: 0xdddddd, roughness: .6});
  for (const sz of [-.35, .35]) for (const sx of [-1, 1]) { const k = new THREE.Mesh(new THREE.BoxGeometry(.14, 3.4, .14), kaki); k.position.set(sx * .75, 1.6, sz); k.rotation.z = sx * .24; g.add(k); }
  const roda = new THREE.Group(); roda.position.set(0, 3.1, 0); g.add(roda); PASAR.roda = roda;
  const cincin = new THREE.Mesh(new THREE.TorusGeometry(2.3, .06, 6, 40), nyala(0xff4ab0)); roda.add(cincin);
  const cincin2 = new THREE.Mesh(new THREE.TorusGeometry(1.2, .04, 6, 28), nyala(0x4ad8ff)); roda.add(cincin2);
  PASAR.gondola = [];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, j = new THREE.Mesh(new THREE.BoxGeometry(.05, 2.3, .05), kaki); j.position.set(Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0); j.rotation.z = a - Math.PI / 2; roda.add(j);
    const go = new THREE.Group(); go.position.set(Math.cos(a) * 2.3, Math.sin(a) * 2.3, 0); roda.add(go);
    const kabin = kotakD(.42, .34, .42, [0xe0303a, 0xf2c14a, 0x3a8ad8, 0x3aa860][i % 4], 0, -.3, 0); go.add(kabin); go.add(kotakD(.46, .05, .46, 0xffffff, 0, -.1, 0));
    PASAR.gondola.push(go);
  }
  roda.add(new THREE.Mesh(new THREE.BoxGeometry(.25, .25, .9), nyala(0xffd23a)));
  // untaian lampu warna-warni dari tiang sudut ke puncak bianglala
  const bohlam = new THREE.InstancedMesh(new THREE.BoxGeometry(.13, .13, .13), new THREE.MeshBasicMaterial(), 96), mt = new THREE.Matrix4(), cw = new THREE.Color();
  const sudut = [[-6.4, -4.1], [6.4, -4.1], [-6.4, 4.1], [6.4, 4.1]]; let n = 0;
  for (const [x, z] of sudut) { g.add(kotakD(.1, 3.2, .1, 0x666666, x, 1.6, z));
    for (let i = 1; i <= 24; i++) { const t = i / 25, px = x * (1 - t), pz = z * (1 - t), py = 3.2 + (5.4 - 3.2) * t - Math.sin(t * Math.PI) * .8;
      mt.makeTranslation(px, py, pz); bohlam.setMatrixAt(n, mt); bohlam.setColorAt(n, cw.setHex([0xff4a4a, 0xffd23a, 0x4ad84a, 0x4aa8ff, 0xff6ad8][n % 5])); n++; } }
  g.add(bohlam);
  sc.add(g); PASAR.g = g;
}
function kembangApi(now) {
  if (now - PASAR.tK > 2600) { PASAR.tK = now;
    const f = I.fas[12], N = 48, pos = new Float32Array(N * 3), arah = [];
    const o = new THREE.Vector3(f.x + (Math.random() - .5) * 60, 70 + Math.random() * 30, f.z + (Math.random() - .5) * 40);
    for (let i = 0; i < N; i++) { const v = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize().multiplyScalar(14 + Math.random() * 6); arah.push(v); pos.set([o.x, o.y, o.z], i * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(geo, new THREE.PointsMaterial({color: [0xff4a4a, 0xffd23a, 0x4ad8ff, 0xff6ad8, 0x7bff7b][Math.floor(Math.random() * 5)], size: 2.2, transparent: true, depthWrite: false}));
    sc.add(p); PASAR.kembang.push({p, arah, o, t0: now});
  }
  PASAR.kembang = PASAR.kembang.filter(k => { const u = (now - k.t0) / 1000; if (u > 1.8) { sc.remove(k.p); k.p.geometry.dispose(); k.p.material.dispose(); return false; }
    const a = k.p.geometry.attributes.position; for (let i = 0; i < k.arah.length; i++) { const v = k.arah[i]; a.setXYZ(i, k.o.x + v.x * u, k.o.y + v.y * u - 6 * u * u, k.o.z + v.z * u); } a.needsUpdate = true; k.p.material.opacity = 1 - u / 1.8; return true; });
}
function animPasar(dt, me) {
  const ada = DI === 'wetan' && I.fas && I.fas[12] && pasarBuka();
  if (!ada) { if (PASAR.g) PASAR.g.visible = false; return; }
  const f = I.fas[12], dekat = Math.hypot(me.position.x - f.x, me.position.z - f.z) < 140 * VS;
  if (!PASAR.g) bangunPasar();
  PASAR.g.visible = dekat; if (!dekat) return;
  PASAR.roda.rotation.z += dt * .25; for (const go of PASAR.gondola) go.rotation.z = -PASAR.roda.rotation.z;
  if (!hemat) kembangApi(performance.now());
  if (!PASAR.umum) { PASAR.umum = true; if (!PASAR_UJI) toast('🎪 Pasar Malam sudah buka di Stadion! Jajan, naik bianglala, lempar gelang. Buka ⚙ Atur › 🎪 Pasar Malam.', 5000); }
}
function dekatPasar(me) { const f = DI === 'wetan' && I.fas && I.fas[12]; return !!(f && PASAR.g && PASAR.g.visible && Math.abs(me.position.x - f.x) < 7.6 * VS && Math.abs(me.position.z - f.z) < 5 * VS); }
const GL = {main: false, ke: 0, kena: 0, x: 0, v: 1, raf: 0};
function tulisPasar() {
  const buka = pasarBuka(), dekat = dekatPasar(tokoh.saya), koin = S.saya?.koin || 0;
  let h = '';
  if (!buka) { const t = pasarBerikut(), sisa = t - Date.now(), j = Math.floor(sisa / 36e5), hr = Math.floor(j / 24);
    h += `<p class="psStatus">🌙 Buka tiap <b>Sabtu 19.00–23.00 WIB</b> di Stadion Kotak Wetan.<br>Buka lagi ${hr ? hr + ' hari ' + (j % 24) + ' jam' : j ? j + ' jam ' + Math.floor(sisa / 6e4) % 60 + ' menit' : Math.floor(sisa / 6e4) + ' menit'} lagi.</p>`; }
  else if (DI !== 'wetan') h += `<p class="psStatus">🎪 Pasar Malam <b>sedang buka</b> di Kotak Wetan!</p><button class="utama" id="psKeWetan">🚌 Pindah ke Kotak Wetan</button>`;
  else if (!dekat) h += `<p class="psStatus">🎪 Pasar Malam <b>sedang buka</b> di lapangan Stadion sampai 23.00 WIB!</p><button class="utama" id="psAntar">🧭 Antar ke Pasar Malam</button>`;
  else h += `<p class="psStatus">🎪 Sedang buka sampai 23.00 WIB · koinmu <b>${koin} 🪙</b></p>`;
  const bisa = buka && dekat && !S.tamu;
  h += `<h3>🍢 Jajan</h3><div class="psJajan">${Object.entries(PASAR_JAJAN).map(([id, [ik, nm, hg]]) => `<button data-jajan="${id}" ${bisa && koin >= hg ? '' : 'disabled'}><i>${ik}</i><b>${nm}</b><small>${hg} 🪙</small></button>`).join('')}</div>
    <h3>🎯 Lempar Gelang <small>${PASAR_GELANG} 🪙 · 3 gelang</small></h3>
    <div class="psGelang"><div class="psBar"><span class="psZona"></span><span class="psJarum" id="psJarum"></span></div>
    <p class="kecil" id="psInfo">Tekan <b>Lempar!</b> saat jarum di zona kuning. Kena 2 dari 3 = suvenir acak (🧸 🐰 🎈 🪀 🏮) masuk Album. Lengkapi 5 suvenir untuk lencana 🎪!</p>
    <button class="utama" id="psMain" ${bisa && koin >= PASAR_GELANG ? '' : 'disabled'}>🎯 Main (${PASAR_GELANG} 🪙)</button></div>
    ${S.tamu ? '<p class="kecil">Daftar jadi warga dulu supaya bisa jajan &amp; main.</p>' : ''}`;
  $('isiPasar').innerHTML = h;
  if ($('psAntar')) $('psAntar').onclick = () => { $('panelPasar').hidden = true; const f = I.fas[12]; mulaiRute({x: f.x, z: f.z + 5.6 * VS, nama: 'Pasar Malam'}, true); };
  if ($('psKeWetan')) $('psKeWetan').onclick = () => { $('panelPasar').hidden = true; pindahDusun('wetan'); };
  $('psMain').onclick = mainGelang;
}
function bukaPasar() { GL.main = false; cancelAnimationFrame(GL.raf); tulisPasar(); $('panelPasar').hidden = false; }
function mainGelang() {
  if (GL.main) { // lempar
    const kena = GL.x > .4 && GL.x < .6; GL.kena += kena; GL.ke++; bunyi(kena ? 'masuk' : 'buka');
    $('psInfo').innerHTML = `Gelang ${GL.ke}/3: ${kena ? '<b class="ok">Kena! 🎯</b>' : 'Meleset…'} · kena ${GL.kena}`;
    if (GL.ke >= 3) { GL.main = false; cancelAnimationFrame(GL.raf); $('psMain').disabled = true; selesaiGelang(GL.kena); }
    return;
  }
  Object.assign(GL, {main: true, ke: 0, kena: 0, x: 0, v: 1}); $('psMain').textContent = '🎯 Lempar!'; $('psInfo').textContent = 'Tunggu jarum masuk zona kuning…';
  let t0 = performance.now();
  const jalan = now => { const dt = (now - t0) / 1000; t0 = now; GL.x += GL.v * dt * (1.1 + GL.ke * .35); if (GL.x > 1) { GL.x = 1; GL.v = -1; } if (GL.x < 0) { GL.x = 0; GL.v = 1; }
    const j = $('psJarum'); if (j) j.style.left = (GL.x * 100) + '%'; if (GL.main && !$('panelPasar').hidden) GL.raf = requestAnimationFrame(jalan); else GL.main = false; };
  GL.raf = requestAnimationFrame(jalan);
}
async function selesaiGelang(kena) {
  try { const r = await api('pasar', {kunci: S.kunci, op: 'gelang', kena}); S.saya.koin = r.koin; aturTas(r.tas); aturAlbum(r.album); hitungOnline();
    const sv = r.hasil.suvenir;
    $('psInfo').innerHTML = sv ? `<b class="ok">Hore! Kena ${kena}×, dapat ${sv.ikon} ${esc(sv.nama)}!</b>${sv.baru ? ' 📖 Baru di Album!' : ''}` : `Kena ${kena}×. Sayang sekali, kurang ${2 - kena} lagi. Coba lagi!`;
    if (sv) { bunyi('emosi'); tokoh.saya.userData.gel = {m: sv.ikon, emo: true, sampai: performance.now() + 2500}; if (sv.baru) albumBaru(); }
  } catch (e) { $('psInfo').textContent = e.message; }
  setTimeout(() => { if (!$('panelPasar').hidden && !GL.main) { const m = $('psMain'); if (m) { m.disabled = (S.saya?.koin || 0) < PASAR_GELANG; m.textContent = `🎯 Main lagi (${PASAR_GELANG} 🪙)`; } } }, 1200);
}
document.addEventListener('click', async e => {
  const b = e.target.closest?.('[data-jajan]'); if (!b || b.disabled) return; b.disabled = true;
  try { const r = await api('pasar', {kunci: S.kunci, op: 'jajan', id: b.dataset.jajan}); S.saya.koin = r.koin; hitungOnline();
    bunyi('emosi'); tokoh.saya.userData.gel = {m: r.hasil.ikon, emo: true, sampai: performance.now() + 2500}; toast(`${r.hasil.ikon} Nyam! ${r.hasil.nama} enak sekali. (-${r.hasil.harga} 🪙)`, 2500); tulisPasar(); }
  catch (err) { toast(err.message, 3000); b.disabled = false; }
});
// ---------- Album Ikan & Panen (Huda 9 Nov 2026) ----------
// Koleksi: tiap ikan/barang dari sungai & tiap hasil kebun yang pernah didapat (server: tas._al). Lengkap = lencana 🎣 / 🧺 di nama (tampilan saja).
const ALBUM_IKAN = IKAN.map(x => x[2]);
const ALBUM_PANEN = () => Object.values(S.saya?.bibit || {tomat: {nama: 'Tomat', ikon: '🍅', harga: 10}, jagung: {nama: 'Jagung', ikon: '🌽', harga: 20}, cabai: {nama: 'Cabai', ikon: '🌶️', harga: 30}});
let ALBUM = {};
function aturAlbum(a) { if (a && typeof a === 'object') ALBUM = a; if (!S.tamu && S.saya) { const h = albumHitung(); AL[S.saya.no] = (h.ikan === ALBUM_IKAN.length ? 1 : 0) | (h.panen === ALBUM_PANEN().length ? 2 : 0) | (h.suvenir === SUVENIR.length ? 4 : 0); } if ($('panelAlbum') && !$('panelAlbum').hidden) tulisAlbum(); }
const albumPunya = n => !!(ALBUM[n] || (S.tamu && tas[n]));
function albumHitung() { return {ikan: ALBUM_IKAN.filter(albumPunya).length, panen: ALBUM_PANEN().filter(b => albumPunya(b.nama)).length, suvenir: SUVENIR.filter(x => albumPunya(x[1])).length}; }
function albumBaru() { bunyi('emosi'); aturAlbum(); }
const tglAlbum = t => t > 1 ? new Date(t + 7 * 3600e3).toISOString().slice(5, 10).split('-').reverse().join('/') : '';
function tulisAlbum() {
  const h = albumHitung(), nI = ALBUM_IKAN.length, nP = ALBUM_PANEN().length + SUVENIR.length, total = h.ikan + h.panen + h.suvenir;
  const kartu = (punya, ikon, nama, info) => `<div class="alKartu${punya ? ' on' : ''}"><i>${punya ? ikon : '❓'}</i><b>${punya ? esc(nama) : '???'}</b><small>${info}</small></div>`;
  const ikan = IKAN.map(([p, ik, nm]) => kartu(albumPunya(nm), ik, nm, albumPunya(nm) ? (tglAlbum(ALBUM[nm]) ? 'pertama ' + tglAlbum(ALBUM[nm]) : 'sudah dapat') : p >= 28 ? 'umum · mancing di sungai' : p >= 11 ? 'agak jarang' : p >= 5 ? 'kadang nyangkut, he he' : '✨ langka sekali!')).join('');
  const panen = ALBUM_PANEN().map(b => kartu(albumPunya(b.nama), b.ikon, b.nama, albumPunya(b.nama) ? (tglAlbum(ALBUM[b.nama]) ? 'pertama ' + tglAlbum(ALBUM[b.nama]) : 'sudah panen') : `tanam bibit ${esc(b.nama)} (${b.harga} 🪙), panen 6 jam`)).join('');
  $('isiAlbum').innerHTML = `<div class="alBar"><span style="width:${Math.round(total / (nI + nP) * 100)}%"></span></div><p class="kecil">Terkumpul <b>${total}/${nI + nP}</b>${S.tamu ? ' · daftar jadi warga supaya albummu tersimpan' : ''}</p>
    <h3>🎣 Ikan & temuan sungai <small>${h.ikan}/${nI}</small></h3><div class="alGrid">${ikan}</div>
    <h3>🧺 Hasil kebun <small>${h.panen}/${ALBUM_PANEN().length}</small></h3><div class="alGrid">${panen}</div>
    <h3>🎪 Suvenir Pasar Malam <small>${h.suvenir}/${SUVENIR.length}</small></h3><div class="alGrid">${SUVENIR.map(([ik, nm]) => kartu(albumPunya(nm), ik, nm, albumPunya(nm) ? (tglAlbum(ALBUM[nm]) ? 'pertama ' + tglAlbum(ALBUM[nm]) : 'sudah dapat') : 'Lempar Gelang, Sabtu malam')).join('')}</div>
    <p class="kecil">Lengkapi semua ikan → lencana <b>🎣</b>. Semua hasil kebun → <b>🧺</b>. Semua suvenir → <b>🎪</b>. Lencana tampil di namamu!</p>`;
}
function bukaAlbum() { tulisAlbum(); $('panelAlbum').hidden = false; }
let makanT = 0;
function skillMakan() {
  const me = tokoh.saya; if (!me) return; const c = dekatKucing(me);
  if (!c) { toast('Dekati kucing dulu: Oyen di rumah Raka, atau kucing di depan rumah warga.', 3500); return; }
  if (performance.now() - makanT < 2500) return;
  // makanan kucing = ikan hasil mancing dari inventori (Huda 6 Nov 2026); tanpa ikan tidak bisa memberi makan
  const ikan = Object.entries(tas).filter(([n, v]) => v.n > 0 && IKAN.some(x => x[2] === n && x[1] !== '👟')).sort((a, b) => b[1].n - a[1].n)[0];
  if (!ikan) { toast('🎣 Tidak ada ikan di inventori. Mancing dulu di sungai, baru bisa memberi makan kucing.', 4000); return; }
  makanT = performance.now();
  if (S.tamu) { ikan[1].n--; if (ikan[1].n <= 0) delete tas[ikan[0]]; simpan('dk_tas', tas); beriMakan(me, c, ikan[0], ikan[1].ikon); }
  else api('tas', {kunci: S.kunci, op: 'makan'}).then(r => { aturTas(r.tas); beriMakan(me, c, r.hasil.nama, r.hasil.ikon); }).catch(e => toast(e.message, 3500));
}
function beriMakan(me, c, nama, ikon) {
  hadap(me, c.position); c.userData.senang = performance.now() + 2600; bunyi('emosi'); misiMaju('kucing');
  const sisa = Object.entries(tas).filter(([n]) => IKAN.some(x => x[2] === n && x[1] !== '👟')).reduce((a, [, v]) => a + v.n, 0);
  toast(`${ikon} ${c === tokoh.oyen ? 'Oyen makan ' + nama.toLowerCase() + ' dengan lahap. Meong!' : (c.userData.nama || 'Kucing') + ' senang diberi ' + nama.toLowerCase() + '!'} Sisa ikan: ${sisa}.`, 3000);
}
function animSkill(dt, me) {
  const now = performance.now();
  animPasar(dt, me); animPutar(dt);
  if (now - itemT > 1500) { itemT = now; isiItem(me); }
  for (const it of itemDunia) { const u = it.userData; u.ph += dt; it.position.y = (u.y0 || 0) + 1.4 + Math.sin(u.ph * 2) * .4; it.rotation.y += dt * 1.2; }
  for (const c of [tokoh.oyen, ...kucingHidup]) if (c && c.userData.senang > now) c.position.y = Math.abs(Math.sin(now / 90)) * .6;
  // tombol skill menyala bila bisa dipakai
  const t = now | 0; if (t % 4 === 0 || !animSkill.t || now - animSkill.t > 300) { animSkill.t = now;
    // tombol hanya muncul saat skill bisa dipakai; joran sedang dipakai = tombol Mancing hilang
    const air = dekatAir(me), bisa = {sTendang: dekatBola(me), sAmbil: !!dekatItem(me), sMancing: air && !mancing.on, sMakan: !!dekatKucing(me), sPanen: bisaPanen(me), sTanam: bisaTanam(me), sJual: bisaJual(me), sKerja: bisaKerja(me), sSuka: !!rumahTetangga(me), sLari: dekatGapuraCFD(me), sBangun: dekatProyek(me), sPasar: dekatPasar(me), sLift: !!(I.gedung && I.gedung.dekatLift(me.position.x, me.position.z))};
    for (const id in bisa) { const b = $(id); if (b.classList.contains('siap') !== bisa[id] || b.hidden === bisa[id]) { b.classList.toggle('siap', bisa[id]); b.hidden = !bisa[id]; } }
    if (air) misiMaju('sungai'); }
}

// =====================================================================
// 4. TOKOH
// =====================================================================
const tokoh = {};
function buatAvatarObj(av) { const o = warga(av); o.traverse(m => { if (m.isMesh) m.castShadow = true; }); return o; }
function jalanAnim(o, ph, amp, isRaka) { const p = {legL: Math.sin(ph) * amp, legR: -Math.sin(ph) * amp, armL: -Math.sin(ph) * amp * .8, armR: Math.sin(ph) * amp * .8}; (isRaka ? rpose : wpose)(o, p); }
function gantiAvatarSaya() {
  const p = tokoh.saya.position.clone(), r = tokoh.saya.rotation.y; sc.remove(tokoh.saya);
  tokoh.saya = buatAvatarObj(avKerja(S.av)); tokoh.saya.position.copy(p); tokoh.saya.rotation.y = r; sc.add(tokoh.saya);
  if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify({t: 'av', av: avKerja(S.av)}));
  fotoProfil();
}

// =====================================================================
// PETA DESA (ala gmaps): foto udara dirender sekali dari atas, lalu titik pemain/warga digambar di atasnya
// =====================================================================
const peta = {img: null, w: 0, h: 0, b: null, pilih: null, t: 0, u: 0, v: 0, z: 2.2};
function buatPeta() {
  // foto udara (render seluruh dusun dari atas) berat: dibuat sesudah desa tampil, bukan saat layar memuat
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(fotoUdaraPeta, 300)));
  pasangPeta();
}
function fotoUdaraPeta() {
  try {
    const b = I.batasLuar || I.batas, lebar = b.x1 - b.x0, tinggi = b.z1 - b.z0, k = 1400 / Math.max(lebar, tinggi);
    const W = Math.round(lebar * k), H = Math.round(tinggi * k);
    const rt = new THREE.WebGLRenderTarget(W, H);
    const oc = new THREE.OrthographicCamera(-lebar / 2, lebar / 2, tinggi / 2, -tinggi / 2, 1, 900);
    oc.position.set((b.x0 + b.x1) / 2, 600, (b.z0 + b.z1) / 2); oc.up.set(0, 0, -1); oc.lookAt((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2);
    const fog = sc.fog, bg = sc.background; sc.fog = null; sc.background = new THREE.Color(0x3f7a3a);
    R.setRenderTarget(rt); R.render(sc, oc); R.setRenderTarget(null); sc.fog = fog; sc.background = bg;
    const px = new Uint8Array(W * H * 4); R.readRenderTargetPixels(rt, 0, 0, W, H, px); rt.dispose();
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'), id = c.createImageData(W, H);
    for (let y = 0; y < H; y++) id.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
    c.putImageData(id, 0, 0);
    peta.w = W; peta.h = H; peta.b = b;
    // nomor rumah kecil + nama jalan utama
    c.font = `900 ${Math.max(10, Math.round(11 * k / 1.4))}px Montserrat,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const [n, L] of Object.entries(I.lots)) { const [u, v] = keP(L.c.x, L.c.z); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillText(n, u + 1, v + 1); c.fillStyle = NM[n] ? '#fff' : 'rgba(255,255,255,.6)'; c.fillText(n, u, v); }
    if (I.sungai) { c.font = `900 ${Math.round(16 * k / 1.4)}px Montserrat,sans-serif`; c.fillStyle = '#e8f6ff'; c.save(); const [su, sv] = keP((I.sungai.x0 + I.sungai.x1) / 2, (b.z0 + b.z1) / 2); c.translate(su, sv); c.rotate(-Math.PI / 2); c.fillText('S U N G A I', 0, 0); c.restore(); }
    // nama fasum di peta supaya warga tidak tersesat
    c.font = `900 ${Math.round(15 * k / 1.4)}px Montserrat,sans-serif`; c.lineJoin = 'round';
    for (const f of fasumBangun) { if (!f.nama) continue; const [u, v] = keP(f.position.x, f.position.z); c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(f.nama, u, v); c.fillStyle = '#fff6c8'; c.fillText(f.nama, u, v); }
    peta.img = cv; peta.w = W; peta.h = H; peta.b = b;
    if (!$('panelPeta').hidden) { const p = tokoh.saya.position; [peta.u, peta.v] = keP(p.x, p.z); gambarPetaBesar(); }
  } catch (e) { console.error('peta', e); $('petaMini').hidden = true; }
}
function pasangPeta() {
  $('petaMini').onclick = bukaPeta;
  $('tutupPeta').onclick = () => { $('panelPeta').hidden = true; };
  // peta besar: geser 1 jari = pindah, cubit/roda = zoom, ketuk = pilih rumah
  const cvB = $('petaBesar'), jr = new Map(); let geser = 0, jarak0 = 0, z0 = 0;
  const keGambar = (cx, cy) => { const r = cvB.getBoundingClientRect(), s = cvB.width / r.width; return [peta.u + ((cx - r.left) * s - cvB.width / 2) / peta.z, peta.v + ((cy - r.top) * s - cvB.height / 2) / peta.z]; };
  cvB.onpointerdown = e => { cvB.setPointerCapture(e.pointerId); jr.set(e.pointerId, {x: e.clientX, y: e.clientY}); geser = 0; if (jr.size === 2) { const [a, b2] = [...jr.values()]; jarak0 = Math.hypot(a.x - b2.x, a.y - b2.y); z0 = peta.z; } };
  cvB.onpointermove = e => { const p = jr.get(e.pointerId); if (!p) return; const r = cvB.getBoundingClientRect(), s = cvB.width / r.width;
    if (jr.size === 1) { const dx = e.clientX - p.x, dy = e.clientY - p.y; geser += Math.abs(dx) + Math.abs(dy); peta.u -= dx * s / peta.z; peta.v -= dy * s / peta.z; }
    p.x = e.clientX; p.y = e.clientY;
    if (jr.size === 2) { const [a, b2] = [...jr.values()]; peta.z = Math.max(.25, Math.min(6, z0 * Math.hypot(a.x - b2.x, a.y - b2.y) / (jarak0 || 1))); geser = 99; }
    gambarPetaBesar(); };
  cvB.onpointerup = cvB.onpointercancel = e => { jr.delete(e.pointerId); if (e.type === 'pointerup' && geser < 8 && !jr.size) {
    const [u, v] = keGambar(e.clientX, e.clientY); let best = null, bd = 1e9;
    for (const [n, L] of Object.entries(I.lots)) { const [a, c2] = keP(L.c.x, L.c.z), d = Math.hypot(a - u, c2 - v); if (d < bd) { bd = d; best = +n; } }
    let fb = null, fd = 1e9; for (const f of fasumBangun) { if (!f.nama) continue; const [a, c2] = keP(f.position.x, f.position.z), d = Math.hypot(a - u, c2 - v); if (d < fd) { fd = d; fb = f; } }
    if (fb && fd < 40 && fd < bd) pilihFasum(fb); else if (best && bd < 30) pilihRumah(best); else pilihTitik(u, v); } };
  cvB.onwheel = e => { e.preventDefault(); peta.z = Math.max(.25, Math.min(6, peta.z * (e.deltaY < 0 ? 1.15 : .87))); gambarPetaBesar(); };
  $('petaZoom').onclick = e => { const d = e.target.dataset.z; if (!d) return; if (d === 'aku') { [peta.u, peta.v] = keP(tokoh.saya.position.x, tokoh.saya.position.z); peta.z = 2.2; } else peta.z = Math.max(.25, Math.min(6, peta.z * (d === '+' ? 1.4 : .7))); gambarPetaBesar(); };
  $('cariPeta').onsubmit = e => { e.preventDefault(); const q = $('cariIsi').value.trim().toLowerCase().replace(/^@/, '').replace(/^no\.?\s*/, '');
    if (!q) return; let n = /^\d+$/.test(q) && I.lots[+q] ? +q : 0;
    if (!n) { const hit = Object.entries(NM).find(([, nm]) => nm.toLowerCase().replace(/^@/, '') === q) || Object.entries(NM).find(([, nm]) => nm.toLowerCase().includes(q)); if (hit) n = +hit[0]; }
    if (n) return pilihRumah(n);
    const f = fasumBangun.find(x => x.nama && x.nama.toLowerCase().includes(q)); if (f) return pilihFasum(f);
    $('petaInfo').textContent = `"${q}" tidak ketemu. Coba username, nomor rumah, atau nama fasum (mis. masjid).`; };
  $('petaRute').onclick = () => { if (!peta.tuju) return; $('panelPeta').hidden = true; mulaiRute(peta.tuju, false); };
  $('chipRute').onclick = e => { if (e.target.closest('.x')) { hapusRute(); toast('Rute dibatalkan.', 2000); } else bukaPeta(); };
}
function keP(x, z) { const b = peta.b || I.batas, W = peta.w || 1, H = peta.h || 1; return [(x - b.x0) / (b.x1 - b.x0) * W, (z - b.z0) / (b.z1 - b.z0) * H]; }
function pilihRumah(n) {
  const L = I.lots[n]; peta.pilih = n; [peta.u, peta.v] = keP(L.c.x, L.c.z); peta.z = Math.max(peta.z, 2.2); const nm = n === 1 ? 'Raka & Oyen (Warung Raka)' : NM[n] ? lencana(n) + NM[n] : 'kavling kosong';
  peta.tuju = {x: L.gate.x, z: L.gate.z + L.dir * 1.2 * VS, nama: 'No. ' + n, kav: n};
  tulisTuju(`📍 No. ${n} · ${nm} · ${alamat(n)}`);
}
function pilihFasum(f) {
  peta.pilih = null; [peta.u, peta.v] = keP(f.position.x, f.position.z); peta.z = Math.max(peta.z, 1.6);
  peta.tuju = {x: f.position.x, z: f.position.z, nama: f.nama.replace(/^\S+\s/, '')}; tulisTuju(`📍 ${f.nama}`);
}
function pilihTitik(u, v) {
  const b = peta.b || I.batas, x = b.x0 + u / peta.w * (b.x1 - b.x0), z = b.z0 + v / peta.h * (b.z1 - b.z0);
  if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return; peta.pilih = null;
  peta.tuju = {x, z, nama: 'titik pilihan'}; tulisTuju('📍 Titik pilihan di peta');
}
function tulisTuju(teks) {
  const me = tokoh.saya, m = Math.round(Math.hypot(peta.tuju.x - me.position.x, peta.tuju.z - me.position.z) / VS);
  $('petaInfo').textContent = `${teks} · ±${m} m dari kamu`; $('petaTombol').hidden = false; gambarPetaBesar();
}
function bukaPeta() { $('panelPeta').hidden = false; $('petaTombol').hidden = !peta.tuju; if (!peta.tuju) [peta.u, peta.v] = keP(tokoh.saya.position.x, tokoh.saya.position.z); gambarPetaBesar(); }

// ---------- Navigasi ala Gmaps (Huda 6 Nov 2026): rute lewat jalan + garis biru di tanah & di peta ----------
let NAV = null;
const rute = {titik: null, kum: null, idx: 0, tujuan: null, antar: false, garis: [], pin: null, cekT: 0, ulangT: 0, diam: 0, px: 0, pz: 0};
const KAVLING_LUAS = L => rectLot(L, -4.7, 4.7, -4.2, 4.2);
function navSiap() {
  if (NAV) return NAV;
  const m = 1.2, lebar = r => [r[0] - m, r[1] + m, r[2] - m, r[3] + m], blok = [], mahal = [];
  for (const [ns, L] of Object.entries(I.lots)) { for (const r of rectsKavling(+ns)) blok.push(lebar(r)); mahal.push(KAVLING_LUAS(L)); }
  for (const f of fasumBangun) if (f.rect) for (const k of f.dinding || [f.rect]) blok.push(lebar(k));
  if (I.gedung) for (const k of I.gedung.rects) blok.push(lebar(k));
  const s = I.sungai, b = I.batas;
  const dilarang = s ? (x, z) => x > s.x0 - 1 && x < s.x1 + 1 && !s.jembatan.some(([a, c]) => z > a + 1 && z < c - 1) : I.air ? (x, z) => I.air(x, z) : null;
  // Wetan: jalan desa lebih murah supaya rute ikut jalan seperti Gmaps (Kulon/Curug sudah dibatasi teras)
  const murah = []; if (I.vroads && I.hroads && I.ox != null) { const z0 = I.oz * VS, z1 = (I.oz + I.TD) * VS, x0 = I.ox * VS, x1 = (I.ox + I.TW) * VS;
    for (const [a, c] of I.vroads) murah.push([(a + I.ox) * VS, (c + I.ox) * VS, z0, z1]); for (const [a, c] of I.hroads) murah.push([x0, b.x1, (a + I.oz) * VS, (c + I.oz) * VS]); }
  NAV = buatNav({batas: {x0: b.x0 + 1.5, x1: b.x1 - 1.5, z0: b.z0 + 1.5, z1: b.z1 - 1.5}, blok, mahal, murah, dasar: murah.length ? 2 : 1, dilarang, tinggi: I.tanah ? (x, z) => I.tanah(x, z) : null});
  return NAV;
}
function mulaiRute(tj, antar) {
  const me = tokoh.saya; if (!me || !I) return;
  if (I.gedung) {   // Segara: tujuan di lantai/menara lain → naik lift dulu, lalu rute di lantai itu
    const za = I.gedung.zona(me.position.x, me.position.z), zb = I.gedung.zona(tj.x, tj.z);
    if (I.gedung.kunci(za) !== I.gedung.kunci(zb)) { const t = zb ? zb.t : za.t; pindahZona(zb, I.gedung.lift(t, zb ? zb.f : 1), () => mulaiRute(tj, antar)); return; }
  }
  let t = null; try { t = navSiap().cari(me.position.x, me.position.z, tj.x, tj.z, tj.kav && I.lots[tj.kav] ? [KAVLING_LUAS(I.lots[tj.kav])] : null); } catch (e) { console.error('rute', e); }
  if (!t || t.length < 2) t = [[me.position.x, me.position.z], [tj.x, tj.z]];
  hapusGaris();
  rute.titik = pecahRute(t, 2); rute.kum = [0]; for (let i = 1; i < rute.titik.length; i++) rute.kum.push(rute.kum[i - 1] + Math.hypot(rute.titik[i][0] - rute.titik[i - 1][0], rute.titik[i][1] - rute.titik[i - 1][1]));
  rute.idx = 0; rute.tujuan = tj; rute.antar = !!antar; rute.diam = 0; rute.px = me.position.x; rute.pz = me.position.z;
  gambarGaris(); tulisChipRute(rute.kum[rute.kum.length - 1]);
  if (!rute.ulang) toast(antar ? `🚶 Jalan otomatis ke ${tj.nama}… geser joystick untuk berhenti.` : `🧭 Ikuti garis biru ke ${tj.nama}.`, 3500);
}
function hapusGaris() { for (const g of rute.garis) buang(g); rute.garis = []; if (rute.pin) { buang(rute.pin); rute.pin = null; } }
function hapusRute() { hapusGaris(); if (rute.antar) gerak.tujuan = null; rute.titik = null; rute.antar = false; $('chipRute').hidden = true; }
function gambarGaris() {
  const P = rute.titik; let y = tokoh.saya.position.y;
  const ys = P.map(([x, z]) => (y = tanah(x, z, y)) + .14);
  for (const [lb, warna, urut] of [[2.6, 0xffffff, 1], [1.5, 0x4285f4, 2]]) {
    const pos = new Float32Array(P.length * 6), idx = [];
    for (let i = 0; i < P.length; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const nx = -dz * lb / 2, nz = dx * lb / 2, yy = ys[i] + (urut - 1) * .03; pos.set([P[i][0] + nx, yy, P[i][1] + nz, P[i][0] - nx, yy, P[i][1] - nz], i * 6);
      if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
    const mt = new THREE.MeshBasicMaterial({color: warna, transparent: true, opacity: urut === 2 ? .95 : .8, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2});
    const mesh = new THREE.Mesh(geo, mt); mesh.renderOrder = urut; mesh.frustumCulled = false; mesh.userData.bukanPijakan = true; sc.add(mesh); rute.garis.push(mesh);
  }
  // pin merah di tujuan
  const pin = new THREE.Group(), merah = new THREE.MeshBasicMaterial({color: 0xea4335});
  const bola = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 12), merah); bola.position.y = 5.2; pin.add(bola);
  const ujung = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 16), merah); ujung.rotation.x = Math.PI; ujung.position.y = 3.6; pin.add(ujung);
  const titik = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), new THREE.MeshBasicMaterial({color: 0xffffff})); titik.position.set(0, 5.2, 1.05); pin.add(titik);
  const [ex, ez] = P[P.length - 1]; pin.position.set(ex, ys[ys.length - 1], ez); pin.userData.y0 = pin.position.y; sc.add(pin); rute.pin = pin;
}
function tulisChipRute(sisa) {
  const c = $('chipRute'), m = Math.max(1, Math.round(sisa / VS)), h = `<span class="t">${rute.antar ? '🚶' : '🧭'} Ke <b>${esc(rute.tujuan.nama)}</b> · ${m} m</span><span class="x" title="Batalkan rute">✕</span>`;
  c.hidden = false; if (c._h !== h) { c._h = h; c.innerHTML = h; }
}
function jalanRute(t) {
  if (!rute.titik) return; const me = tokoh.saya, P = rute.titik, x = me.position.x, z = me.position.z;
  if (rute.pin) { rute.pin.position.y = rute.pin.userData.y0 + Math.sin(t / 260) * .7; rute.pin.rotation.y = t / 700; }
  if (t - rute.cekT < 120) return; rute.cekT = t;
  let bi = rute.idx, bd = 1e9; for (let i = rute.idx; i < Math.min(P.length, rute.idx + 45); i++) { const d = Math.hypot(P[i][0] - x, P[i][1] - z); if (d < bd) { bd = d; bi = i; } }
  if (bi !== rute.idx) { rute.idx = bi; for (const g of rute.garis) g.geometry.setDrawRange(bi * 6, Infinity); }
  const [ex, ez] = P[P.length - 1], sisa = rute.kum[rute.kum.length - 1] - rute.kum[bi] + bd;
  if (Math.hypot(ex - x, ez - z) < 2.2 * VS || bi >= P.length - 2) { const nm = rute.tujuan.nama; hapusRute(); bunyi('masuk'); toast(`📍 Sampai di ${nm}!`, 3000); return; }
  if (bd > 7 * VS && t - rute.ulangT > 1500) { rute.ulangT = t; rute.ulang = 1; mulaiRute(rute.tujuan, rute.antar); rute.ulang = 0; return; }   // keluar jalur → hitung ulang rute
  if (rute.antar) {
    const j = Math.min(P.length - 1, bi + 3); gerak.tujuan = new THREE.Vector3(P[j][0], 0, P[j][1]);
    if (Math.hypot(x - rute.px, z - rute.pz) < .3) { if (++rute.diam > 15) { rute.antar = false; gerak.tujuan = null; toast('Jalan otomatis berhenti. Ikuti garis biru ya.', 3000); } } else rute.diam = 0;
    rute.px = x; rute.pz = z;
  }
  tulisChipRute(sisa);
}
function titikPeta(c, k, me) {
  // warga online (hijau), Raka (bintang), saya (panah biru)
  for (const o of S.others.values()) { const [u, v] = keP(o.obj.position.x, o.obj.position.z); c.fillStyle = '#2ecc71'; c.strokeStyle = '#fff'; c.lineWidth = 2 * k; c.beginPath(); c.arc(u, v, 6 * k, 0, 7); c.fill(); c.stroke(); }
  if (tokoh.raka) { const [u, v] = keP(tokoh.raka.position.x, tokoh.raka.position.z); c.font = `${Math.round(18 * k)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⭐', u, v); }
  if (rute.titik) { c.lineJoin = c.lineCap = 'round'; for (const [w, col] of [[11, '#ffffff'], [7, '#4285f4']]) { c.strokeStyle = col; c.lineWidth = w * k; c.beginPath(); for (let i = rute.idx; i < rute.titik.length; i++) { const [u, v] = keP(rute.titik[i][0], rute.titik[i][1]); if (i === rute.idx) c.moveTo(u, v); else c.lineTo(u, v); } c.stroke(); } }
  const tj = rute.titik ? rute.tujuan : peta.tuju;
  if (tj) { const [u, v] = keP(tj.x, tj.z); c.fillStyle = '#ea4335'; c.strokeStyle = '#fff'; c.lineWidth = 2.5 * k; c.beginPath(); c.arc(u, v - 16 * k, 10 * k, Math.PI * .85, Math.PI * 2.15); c.lineTo(u, v); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(u, v - 16 * k, 4 * k, 0, 7); c.fill(); }
  if (me) { const [u, v] = keP(me.position.x, me.position.z); c.save(); c.translate(u, v); c.rotate(Math.PI - me.rotation.y);
    c.fillStyle = 'rgba(66,133,244,.25)'; c.beginPath(); c.arc(0, 0, 16 * k, 0, 7); c.fill();
    c.fillStyle = '#4285f4'; c.strokeStyle = '#fff'; c.lineWidth = 2.5 * k; c.beginPath(); c.moveTo(0, -11 * k); c.lineTo(8 * k, 8 * k); c.lineTo(0, 4 * k); c.lineTo(-8 * k, 8 * k); c.closePath(); c.fill(); c.stroke(); c.restore(); }
}
function gambarPetaBesar() {
  if (!peta.img) return; const cv = $('petaBesar'), r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  const W = Math.max(200, Math.round(r.width * dpr)), H = Math.max(160, Math.round(r.height * dpr)); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const c = cv.getContext('2d'); c.fillStyle = '#3f7a3a'; c.fillRect(0, 0, W, H);
  peta.u = Math.max(0, Math.min(peta.w, peta.u)); peta.v = Math.max(0, Math.min(peta.h, peta.v));
  c.save(); c.translate(W / 2, H / 2); c.scale(peta.z, peta.z); c.translate(-peta.u, -peta.v); c.imageSmoothingEnabled = peta.z < 2.5;
  c.drawImage(peta.img, 0, 0); titikPeta(c, 1.3 * dpr / peta.z, tokoh.saya); c.restore();
}
function gambarPetaMini(t) {
  if (!peta.img || t - peta.t < 150) return; peta.t = t;
  const me = tokoh.saya, cv = $('petaMini'), c = cv.getContext('2d'), S2 = cv.width, [u, v] = keP(me.position.x, me.position.z), lebar = 260;
  const zn = I.gedung && I.gedung.zona(me.position.x, me.position.z);
  if (zn) { c.fillStyle = '#101826'; c.fillRect(0, 0, S2, S2); c.textAlign = 'center'; c.fillStyle = '#5ff4ff'; c.font = `900 ${S2 * .13}px Montserrat,sans-serif`; c.fillText('MENARA ' + zn.t, S2 / 2, S2 * .4);
    c.fillStyle = '#fff'; c.font = `900 ${S2 * .24}px Montserrat,sans-serif`; c.fillText('Lt. ' + zn.f, S2 / 2, S2 * .68); return; }
  c.fillStyle = '#3f7a3a'; c.fillRect(0, 0, S2, S2);
  c.save(); const z = S2 / lebar; c.translate(S2 / 2, S2 / 2); c.scale(z, z); c.translate(-u, -v);
  c.drawImage(peta.img, 0, 0); titikPeta(c, 1.6 / z * .9, me); c.restore();
  if (!$('panelPeta').hidden) gambarPetaBesar();
}

// =====================================================================
// 5. LABEL & GELEMBUNG
// =====================================================================
const lab = $('label'); const pool = [];
// ---------- tata letak HUD: cegah kartu/tombol saling tumpuk di layar HP (ukuran apa pun, termasuk mode diputar) ----------
let kotakHUD = [], hudT = 0;
const ID_HUD = ['profil', 'tombolAtas', 'petaMini', 'chipDusun', 'chipKumpul', 'chipTujuan', 'bBukaChat', 'chat', 'stik', 'skill', 'jam'];
function tataHUD() {
  const el = id => document.getElementById(id), tampak = e => e && !e.hidden && !e.closest('[hidden]') && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getClientRects().length > 0;
  const prof = el('profil'), atas = el('tombolAtas'), chat = el('chat'), buka = el('bBukaChat'), stik = el('stik'), peta = el('petaMini'), chip = el('chipDusun');
  if (prof && atas) {
    const ra = atas.getBoundingClientRect(), rp0 = prof.getBoundingClientRect();
    // kartu profil tidak boleh menyentuh deret tombol atas (bila sebaris)
    prof.style.maxWidth = ra.top < rp0.bottom && ra.left > rp0.left ? Math.max(150, ra.left - rp0.left - 10) + 'px' : '';
    const rp = prof.getBoundingClientRect(), bawah = Math.max(rp.bottom, ra.top < rp.bottom + 4 && ra.left < rp.right ? ra.bottom : 0) + 8;
    if (buka) buka.style.top = bawah + 'px';
    if (chat) {
      chat.style.top = bawah + 'px';
      const isi = chat.querySelector('.isi');
      if (isi && stik && tampak(chat)) {
        // layar pendek (HP landscape): chat dibuat besar sampai bawah layar supaya tulisan terbaca; joystick disembunyikan selama chat terbuka
        isi.style.height = '';
        const rs = stik.getBoundingClientRect(), rc = chat.getBoundingClientRect(), ih = isi.getBoundingClientRect().height;
        const kiri = rc.right > rs.left && rc.left < rs.right && rc.bottom > rs.top - 10;
        if (kiri) isi.style.height = Math.max(90, innerHeight - 12 - (rc.bottom - ih)) + 'px';
        document.body.classList.toggle('chatPenuh', kiri);
      } else document.body.classList.remove('chatPenuh');
    }
  }
  const jm = el('jam');
  if (jm) { jm.style.visibility = ''; if (tampak(jm)) { const rj = jm.getBoundingClientRect(), tabrak = e => { if (!e) return false; const r = e.getBoundingClientRect(); return r.width && rj.left < r.right && rj.right > r.left && rj.top < r.bottom && rj.bottom > r.top; };
    if (tabrak(atas) || tabrak(prof) || tabrak(peta)) jm.style.visibility = 'hidden'; } }
  if (peta && chip) { const r = peta.getBoundingClientRect(); chip.style.top = (r.bottom + 6) + 'px'; chip.style.right = (innerWidth - r.right) + 'px'; chip.style.maxWidth = Math.max(r.width, 210) + 'px'; }
  infoKumpul();
  const tj = el('chipTujuan');
  if (tj && !tj.hidden) {   // chip tujuan di tengah atas; geser ke kanan kotak chat bila menabrak
    tj.style.left = ''; tj.style.transform = ''; tj.style.maxWidth = '';
    const r = tj.getBoundingClientRect(), rc = chat && tampak(chat) ? chat.getBoundingClientRect() : null;
    if (rc && r.left < rc.right && r.right > rc.left && r.top < rc.bottom && r.bottom > rc.top) {
      const kiri = rc.right + 8, kanan = peta && tampak(peta) ? peta.getBoundingClientRect().left - 8 : innerWidth - 8;
      tj.style.left = kiri + 'px'; tj.style.transform = 'none'; tj.style.maxWidth = Math.max(200, kanan - kiri) + 'px';
    }
  }
  const ck = el('chipKumpul');
  if (ck && chip && !ck.hidden) { const r = chip.getBoundingClientRect(); ck.style.top = (r.bottom + 6) + 'px'; ck.style.right = (innerWidth - r.right) + 'px'; }
  kotakHUD = ID_HUD.map(el).filter(tampak).map(e => e.getBoundingClientRect());
}
// ---------- Jam Kumpul Warga: tiap malam 20.00-20.30 WIB di Stadion, koin misi 2x (dicek server) ----------
// Jam Kumpul Warga: misi harian HANYA bisa dikerjakan di jam ramai ini, koin 2x (server ikut mengecek jam yang sama).
const SESI = [   // 5 event sehari (Huda 4 Nov)
  {j: [6, 7], nama: 'Senam Pagi', tempat: 'stadion', label: 'Stadion', ikon: '🤸'},
  {j: [12, 13], nama: 'Belanja Siang', tempat: 'supermarket', label: 'Supermarket', ikon: '🛒'},
  {j: [16, 17], nama: 'Mancing Bareng', tempat: 'sungai', label: 'Sungai', ikon: '🎣'},
  {j: [19, 20], nama: 'Nongkrong di Warung', tempat: 'warung', label: 'Warung Desa', ikon: '☕'},
  {j: [20, 21], nama: 'Main Bola Malam', tempat: 'stadion', label: 'Stadion', ikon: '⚽'},
];
const jamTeks = h => String(Math.floor(h)).padStart(2, '0') + '.' + String(Math.round(h % 1 * 60)).padStart(2, '0');
// Sabtu malam: sesi bola 20.00 di stadion jadi Pasar Malam (lapangan dipakai lapak & bianglala)
const sesiPasar = x => x && x.tempat === 'stadion' && x.j[0] === 20 && pasarBuka() ? {...x, nama: 'Pasar Malam', ikon: '🎪'} : x;
const sesiKini = () => { const j = jamWIB(); return sesiPasar(SESI.find(x => j >= x.j[0] && j < x.j[1]) || null); };
const sesiBerikut = () => { const j = jamWIB(); return sesiPasar(SESI.find(x => j < x.j[0]) || SESI[0]); };
const jamKumpul = () => !!sesiKini();
const daftarSesi = () => SESI.map(x => `${jamTeks(x.j[0])}–${jamTeks(x.j[1])}`).join(', ');
let kumpulDiumumkan = '';
function infoKumpul() {
  const ck = document.getElementById('chipKumpul'); if (!ck) return;
  const j = jamWIB(), ki = sesiKini(), be = sesiBerikut();
  let html = '';
  if (ki) {
    html = `${ki.ikon} <b>${ki.nama}!</b> Misi koin 2x · +1💎/10 mnt main · ${Math.ceil((ki.j[1] - j) * 60)} mnt`;
    const kunci = hariIni() + ki.nama; if (kumpulDiumumkan !== kunci) { kumpulDiumumkan = kunci; toast(`${ki.ikon} ${ki.nama} dimulai! Misi koin 2x sampai ${jamTeks(ki.j[1])} WIB.`, 4000); bunyi('masuk'); }
  } else if (be.j[0] - j > 0 && be.j[0] - j <= 1) html = `⏰ <b>${be.nama}</b> ${jamTeks(be.j[0])} · ${Math.ceil((be.j[0] - j) * 60)} mnt lagi`;
  ck.hidden = !html; ck.classList.toggle('mulai', !!ki);
  if (html && ck._h !== html) { ck._h = html; ck.innerHTML = html; }
}
function keKumpul() {
  const ki = sesiKini() || sesiBerikut(), tempat = ki.tempat;
  if (DI !== 'wetan') { if (confirm(`${ki.nama} ada di ${ki.label} Dusun Kotak Wetan. Naik bus ke sana?`)) { const u = new URL(location.href); u.searchParams.set('dusun', 'wetan'); u.searchParams.set('ke', tempat); location.href = u.toString(); } return; }
  keTempat(tempat);
}
function keTempat(tempat) {
  const me = tokoh.saya; if (!me || !I) return;
  let x, z, ry = Math.PI, nama;
  if (tempat === 'sungai' && I.sungai) { const s = I.sungai; x = s.x0 - 1.5; z = Math.min(I.batas.z1 - 10, Math.max(I.batas.z0 + 10, me.position.z)); ry = Math.PI / 2; nama = 'pinggir Sungai. Tekan 🎣 Mancing'; }
  else { const T = {supermarket: [0, 'Supermarket Dunia Kotak'], warung: [2, 'Warung Desa'], stadion: [12, 'Stadion Dunia Kotak']}[tempat] || [12, 'Stadion Dunia Kotak']; const f = I.fas && I.fas[T[0]]; if (!f) return; x = f.x; z = f.z + (T[0] === 12 ? 0 : 4 * VS); nama = T[1]; }
  $('panelMisi').hidden = true; gerak.tujuan = null;
  me.position.set(x, 0, z); me.position.y = tanah(x, z, 0); me.rotation.y = ry;
  bunyi('masuk'); toast(`🚌 Naik angkot desa… sampai di ${nama}!`, 3500);
}
// ---------- Bola di Stadion: bisa ditendang warga & pemain NPC, memantul di dalam lapangan, GOL bila masuk gawang ----------
const BOLA = {m: null, x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0, kirimT: 0, tendangT: 0, golT: 0, aku: false};
const BOLA_R = 1.5;
function bolaLapangan() { const f = I && DI === 'wetan' && I.fas && I.fas[12]; return f ? {cx: f.x, cz: f.z, hx: 6.8 * VS - BOLA_R, hz: 4.3 * VS - BOLA_R, gawang: 1.15 * VS, lantai: .48 * VS} : null; }
function bolaBuat(L) {
  const g = new THREE.Group();
  // bola klasik: putih dengan 12 segi lima abu tua RATA di permukaan (Huda 6 Nov: motif hitam jangan menonjol)
  const geo = new THREE.IcosahedronGeometry(BOLA_R, 2), pos = geo.attributes.position, warna = new Float32Array(pos.count * 3);
  const pusat = new THREE.IcosahedronGeometry(1, 0).attributes.position, titik = []; for (let i = 0; i < pusat.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pusat, i).normalize(); if (!titik.some(t => t.distanceTo(v) < 1e-3)) titik.push(v); }
  const a = new THREE.Vector3(), c = new THREE.Color();
  for (let f = 0; f < pos.count; f += 3) { a.set(0, 0, 0); for (let k = 0; k < 3; k++) a.add(new THREE.Vector3().fromBufferAttribute(pos, f + k)); a.normalize();
    const gelap = titik.some(t => t.dot(a) > .93); c.set(gelap ? 0x5a5f6a : 0xf7f7f4); for (let k = 0; k < 3; k++) warna.set([c.r, c.g, c.b], (f + k) * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(warna, 3));
  const bola = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({vertexColors: true, roughness: .55, flatShading: true}));
  g.add(bola);
  g.traverse(o => { if (o.isMesh) o.castShadow = !hemat; });
  sc.add(g); BOLA.m = g; BOLA.x = L.cx; BOLA.z = L.cz; BOLA.y = L.lantai + BOLA_R;
}
// skill Tendang (Huda 6 Nov: ganti skill Ngobrol): tombol muncul bila bola dekat; tendangan keras melambung ke arah hadap avatar
// Kebun sendiri (audit ekonomi 6 Nov 2026): 🌱 Tanam (beli bibit pakai koin) → 6 jam → 🧺 Panen (5 hasil + 2 permata) → 💰 Jual di warung depan rumah.
// Lomba Rumah Terindah: rumah warga lain (terdaftar, bukan Raka) yang sedang didekati → tombol ❤️ Suka
let RS = {sisa: null, sudah: []}, rtCache = {t: 0, n: 0};
function rumahTetangga(me) {
  if (S.tamu || !S.saya || !I) return 0;
  const t = performance.now(); if (t - rtCache.t < 400) return rtCache.n;
  let best = 0, bd = 4.5 * VS;
  for (const n of lotRuntime.keys()) { if (n === 1 || n === S.saya.no || !NM[n]) continue; const L = I.lots[n]; if (!L) continue;
    const d = Math.hypot(L.c.x - me.position.x, L.c.z - me.position.z); if (d < bd) { bd = d; best = n; } }
  rtCache = {t, n: best}; return best;
}
async function sukaRumah() {
  const n = rumahTetangga(tokoh.saya); if (!n) return;
  try { const r = await api('rumah-suka', {kunci: S.kunci, ke: n}); bunyi('masuk'); koinTerbang('❤️');
    RS.sisa = r.sisa; RS.sudah.push(n);
    toast(`❤️ Kamu suka rumah ${NM[n] || 'No. ' + n}! Kini ${r.suka} ❤️ minggu ini (peringkat #${r.pos}). Sisa ❤️ hari ini: ${r.sisa}`, 4200);
  } catch (e) { toast(e.message, 3200); }
}
function dekatRumah(me) {
  if (S.tamu || !S.saya || !I || !lotRuntime.has(S.saya.no)) return false;
  const L = I.lots[S.saya.no]; return !!L && Math.hypot(L.c.x - me.position.x, L.c.z - me.position.z) < 4.5 * VS;
}
const NAMA_HASIL = () => Object.values(S.saya?.bibit || {}).map(b => b.nama);
function bisaTanam(me) { return dekatRumah(me) && !(S.saya.kebun && S.saya.kebun.b); }
function bisaPanen(me) { const k = S.saya?.kebun; return dekatRumah(me) && !!(k && k.b) && Date.now() >= k.siap; }
// Audit ekonomi #2: ikan juga bisa dijual di warung (harga sama dengan server JUAL_IKAN); 2 ikan disisakan untuk kucing.
const JUAL_IKAN = {'Ikan mas': 2, 'Ikan nila': 3, 'Ikan buntal kotak': 5, 'Udang': 6, 'Kepiting langka': 15};
const ikanJual = () => Object.keys(JUAL_IKAN).reduce((a, n) => a + (tas[n]?.n || 0), 0) - 2;
function bisaJual(me) { return dekatRumah(me) && (NAMA_HASIL().some(n => tas[n]?.n > 0) || ikanJual() > 0); }
// Tampilan kebun ikut isi kebun warga (Huda 6 Nov 2026): kosong = tanah saja, lalu bibit → tunas → besar → berbuah (siap panen).
// Ukuran tanaman dewasa sama dengan tanaman bedeng lama (tinggi 0,55 satuan kavling).
let kebunTahap = null;
function tahapKebun(k) {
  if (!k || !k.b) return -1;
  const f = 1 - (k.siap - Date.now()) / (6 * 3600e3);
  return f >= 1 ? 3 : f >= .55 ? 2 : f >= .2 ? 1 : 0;
}
function segarKebun() {
  if (S.tamu || !S.saya) return; const rt = lotRuntime.get(S.saya.no); if (!rt) return;
  const k = S.saya.kebun, th = tahapKebun(k), kunci = (k && k.b || '') + th; if (kunci === kebunTahap) return;
  let lama = rt.bedeng; if (!lama) rt.g.traverse(o => { if (!lama && o.isInstancedMesh && o.userData.bedeng) lama = o; }); if (!lama || !lama.parent) return;
  const baru = D.tanamanBedeng(lama.userData.bedeng.l, k && k.b || 'tomat', th);
  baru.position.copy(lama.position); baru.rotation.copy(lama.rotation); baru.scale.copy(lama.scale);
  lama.parent.add(baru); lama.parent.remove(lama); lama.material.dispose(); lama.dispose?.();
  rt.bedeng = baru; kebunTahap = kunci;
}
setInterval(segarKebun, 30000);
let panenSibuk = false;
function hasilKebun(r) { aturAlbum(r.album); if (r.koin != null) S.saya.koin = r.koin; if (r.permata != null) S.saya.permata = r.permata; if (r.kebun) S.saya.kebun = r.kebun; if (r.tas) aturTas(r.tas); hitungOnline(); segarKebun(); }
async function skillPanen() {
  if (panenSibuk || !bisaPanen(tokoh.saya)) return; panenSibuk = true;
  try { const r = await api('panen', {kunci: S.kunci}); hasilKebun(r); bunyi('masuk'); toast(`🧺 Panen! +${r.hasil.n} ${r.hasil.ikon} ${r.hasil.nama} dan +${r.dapat} 💎.` + (r.hasil.baru ? ` 📖 Baru di Album! (${albumHitung().panen}/${ALBUM_PANEN().length} panen)` : ' Jual hasilnya di warung depan rumah (💰 Jual).'), 4500); if (r.hasil.baru) albumBaru(); }
  catch (e) { toast(e.message, 3000); } finally { panenSibuk = false; }
}
async function skillJual() {
  if (panenSibuk || !bisaJual(tokoh.saya)) return; panenSibuk = true;
  try { const r = await api('jual', {kunci: S.kunci}); hasilKebun(r); bunyi('masuk'); toast(`💰 ${r.terjual} hasil panen & ikan laku di warungmu: +${r.dapatKoin} 🪙`, 3500); }
  catch (e) { toast(e.message, 3500); } finally { panenSibuk = false; }
}
function bukaTanam() {
  const bb = S.saya?.bibit || {};
  $('isiTanam').innerHTML = Object.entries(bb).map(([id, b]) => `<div class="rkBaris"><i>${b.ikon}</i><div><b>Bibit ${esc(b.nama)}</b><small>Hasil ${b.hasil} × ${b.jual} 🪙 = ${b.hasil * b.jual} 🪙 · untung ${b.hasil * b.jual - b.harga} 🪙 · siap 6 jam</small></div><button data-tanam="${id}" ${(S.saya.koin || 0) < b.harga && id !== 'tomat' ? 'disabled' : ''}>${id === 'tomat' && ((S.saya.koin || 0) < b.harga || pemulaKini()?.id === 'tanam') ? 'Gratis' : '🪙 ' + b.harga}</button></div>`).join('');
  $('panelTanam').hidden = false;
}
document.addEventListener('click', async e => {
  const b = e.target.closest?.('[data-tanam]'); if (!b || panenSibuk) return; panenSibuk = true;
  try { const r = await api('tanam', {kunci: S.kunci, bibit: b.dataset.tanam}); hasilKebun(r); $('panelTanam').hidden = true; bunyi('emosi'); pemulaMaju('tanam'); toast(`🌱 Bibit ${S.saya.bibit[b.dataset.tanam].nama} ditanam. Panen 6 jam lagi.`, 3500); }
  catch (er) { toast(er.message, 3500); } finally { panenSibuk = false; }
});
// ---------- Profesi (audit ekonomi, Huda 6 Nov 2026) ----------
// Dibuka dengan menukar permata di Kantor Desa (⚙ Atur / Profil). Gaji sama semua profesi: 1 shift = 5 tugas (±6 menit) di
// fasum tempat kerjanya, maks 4 shift per hari (Huda 10 Nov: lebih lama main). Seragam dipakai otomatis selama shift. Petani & pedagang = kebun & warung rumah.
const TEMPAT_KERJA = {guru: /SD |Sekolah|Kampus/i, perawat: /Rumah Sakit/i, dokter: /Rumah Sakit/i, kasir: /Supermarket|Warung Desa/i, wasit: /Stadion/i, polisi: /Polisi/i, barista: /Kafe/i};
const TEMPAT_TEKS = {petani: 'kebun rumahmu', pedagang: 'warung depan rumahmu', guru: 'SD atau Kampus', perawat: 'Rumah Sakit', dokter: 'Rumah Sakit (IGD)', kasir: 'Supermarket atau Warung Desa', wasit: 'Stadion', polisi: 'Kantor Polisi', barista: 'Kafe'};
const TUGAS_TEKS = {petani: 'Tanam, panen, lalu jual hasilnya', pedagang: 'Jual hasil panen di warungmu', guru: 'Jawab pertanyaan murid', perawat: 'Antar kebutuhan pasien', dokter: 'Pilih obat yang cocok', kasir: 'Hitung belanjaan pembeli', wasit: 'Ambil keputusan di lapangan', polisi: 'Atur lalu lintas', barista: 'Racik pesanan minuman'};
const SERAGAM = {guru: {jenis: 'kemeja', warna: '#b89a6a'}, perawat: {jenis: 'seragam', warna: '#f4f4f4'}, dokter: {jenis: 'kemeja', warna: '#f4f4f4'}, kasir: {jenis: 'kaos', warna: '#d0442f'}, wasit: {jenis: 'kaos', warna: '#1d1d22'}, polisi: {jenis: 'kemeja', warna: '#6a5a48'}, barista: {jenis: 'kemeja', warna: '#2a9a5a'}};
const TUGAS_N = 5, TUGAS_JEDA = 90e3;
let SH = null;   // shift berjalan: {p, t0, n, next}
const avKerja = av => SH && SERAGAM[SH.p] ? {...av, atasan: SERAGAM[SH.p]} : av;
const PF = () => S.saya?.profesi || {a: 'petani', punya: ['petani', 'pedagang'], shift: 0, batas: 4, gaji: 50};
const DPF = () => S.saya?.daftarProfesi || {};
function simpanShift() { if (SH) simpan('dk_shift', SH); else { try { localStorage.removeItem('dk_shift'); } catch (e) {} } }
function pulihShift() {
  const sh = !S.tamu && PF().sh; if (!sh) { SH = null; return; }
  const lama = bacaJ('dk_shift'); SH = lama && lama.t0 === sh.t0 ? lama : {p: sh.p, t0: sh.t0, n: 0, next: 0};
}
const acak = a => a[Math.random() * a.length | 0];
const kocok = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
function pilihan(benar, salah) { const o = kocok([benar, ...kocok(salah.filter(x => x !== benar)).slice(0, 2)]); return {o, b: o.indexOf(benar)}; }
const angkaDekat = n => [n + 1, n - 1, n + 2, n - 2, n + 10].filter(x => x > 0);
const SOAL = {
  guru() { const k = Math.random() < .5, a = 2 + Math.random() * 8 | 0, b = 2 + Math.random() * 8 | 0, j = k ? a * b : a + b; return {s: `🧒 Murid bertanya: <b>${a} ${k ? '×' : '+'} ${b} = ?</b>`, ...pilihan(j, angkaDekat(j))}; },
  kasir() { const BR = [['🍅', 4], ['🥛', 6], ['🍞', 5], ['🍌', 3], ['🧃', 7], ['🍚', 9], ['🥚', 2]]; const b = kocok(BR).slice(0, 3), j = b.reduce((t, x) => t + x[1], 0);
    return {s: `🧺 Pembeli membawa: ${b.map(x => `${x[0]} ${x[1]} 🪙`).join(' + ')}<br><b>Totalnya berapa?</b>`, ...pilihan(j, angkaDekat(j))}; },
  perawat() { const D = [['Pasien kamar 2 haus', '💧 Air minum'], ['Suhu pasien perlu dicek', '🌡️ Termometer'], ['Lutut pasien lecet', '🩹 Plester'], ['Pasien kedinginan', '🧣 Selimut'], ['Waktunya minum obat', '💊 Obat'], ['Pasien mau duduk di taman', '🦽 Kursi roda']]; const d = acak(D);
    return {s: `🛏️ ${d[0]}. <b>Bawakan apa?</b>`, ...pilihan(d[1], D.map(x => x[1]))}; },
  dokter() { const D = [['Demam tinggi', '💊 Obat penurun panas'], ['Batuk berdahak', '🍯 Sirup batuk'], ['Luka di tangan', '🩹 Perban'], ['Sakit perut', '🍵 Obat maag'], ['Mata merah dan gatal', '💧 Obat tetes mata'], ['Kaki terkilir', '🧊 Kompres es']]; const d = acak(D);
    return {s: `🤒 Keluhan pasien: <b>${d[0]}</b>. Obat yang cocok?`, ...pilihan(d[1], D.map(x => x[1]))}; },
  wasit() { const D = [['Pemain menjegal lawan dengan keras', '🟨 Kartu kuning'], ['Bola masuk gawang', '⚽ Sahkan gol'], ['Bola keluar garis samping', '🙌 Lemparan ke dalam'], ['Waktu pertandingan habis', '📣 Peluit panjang'], ['Pemain terjatuh kesakitan', '⏸️ Hentikan permainan'], ['Bola keluar lewat belakang gawang', '🥅 Tendangan gawang']]; const d = acak(D);
    return {s: `🏟️ ${d[0]}. <b>Keputusanmu?</b>`, ...pilihan(d[1], D.map(x => x[1]))}; },
  polisi() { const D = [['Lampu merah menyala', '✋ Berhenti'], ['Lampu hijau menyala', '👉 Silakan jalan'], ['Ada anak mau menyeberang', '🚸 Hentikan kendaraan']]; const d = acak(D); return {s: `🚦 ${d[0]}. <b>Aba-abamu?</b>`, ...pilihan(d[1], D.map(x => x[1]))}; },
  barista() { const D = [['Kopi susu dingin', '🧊 Kopi + susu + es'], ['Teh manis hangat', '🍵 Teh + gula + air panas'], ['Cokelat panas', '🍫 Cokelat + susu panas']]; const d = acak(D); return {s: `☕ Pesanan: <b>${d[0]}</b>. Racikannya?`, ...pilihan(d[1], D.map(x => x[1]))}; },
};
function diTempatKerja(me, p) {
  const rx = TEMPAT_KERJA[p]; if (!rx || !me) return false;
  if (S.saya && dusunDari(S.saya.no) !== DI) return false;   // shift hanya di dusun sendiri
  if (fasumDalam && rx.test(fasumDalam.nama || '')) return true;
  return fasumBangun.some(f => f.nama && rx.test(f.nama) && Math.hypot(f.position.x - me.position.x, f.position.z - me.position.z) < 7 * VS);
}
function bisaKerja(me) {
  if (S.tamu || !S.saya) return false; const pf = PF(), p = SH ? SH.p : pf.a;
  return !!TEMPAT_KERJA[p] && (SH || pf.shift < pf.batas) && diTempatKerja(me, p);
}
const mmss = ms => { const d = Math.max(0, Math.ceil(ms / 1000)); return `${d / 60 | 0}:${String(d % 60).padStart(2, '0')}`; };
function labelKerja() {
  const b = $('sKerja'); if (!b) return; let t = 'Kerja';
  if (SH) t = Date.now() < SH.next ? mmss(SH.next - Date.now()) : `Tugas ${SH.n + 1}/${TUGAS_N}`;
  const l = b.lastChild; if (l && l.nodeType === 3 && l.textContent !== t) l.textContent = t;
  b.classList.toggle('tunggu', !!SH && Date.now() < SH.next);
}
let kerjaSibuk = false, soalKini = null;
// ---------- iklan berhadiah (Google H5 Games Ads / Ad Placement API) ----------
// Warga memilih sendiri menonton iklan → +3 💎 (maks 3x/hari, dicek server). Tidak ada iklan yang muncul sendiri saat main.
// Tombol tampil bila server menyalakan IKLAN_H5; ?ujiiklan=1 = mode uji Google (iklan contoh, tanpa hadiah).
const IKLAN_PUB = 'ca-pub-1933161577421164';
const IK = {aktif: false, uji: new URLSearchParams(location.search).has('ujiiklan'), sibuk: false};
async function siapIklan() {
  try { IK.aktif = !!(await (await fetch('/duniakotak/api/config')).json()).iklan; } catch (e) {}
  if ((!IK.aktif && !IK.uji) || S.tamu) return;
  const sc = document.createElement('script'); sc.async = true; sc.crossOrigin = 'anonymous';
  sc.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + IKLAN_PUB;
  sc.setAttribute('data-ad-client', IKLAN_PUB); sc.setAttribute('data-ad-frequency-hint', '60s');
  if (IK.uji) sc.setAttribute('data-adbreak-test', 'on');
  sc.setAttribute('data-tag-for-child-directed-treatment', '1');   // banyak pemain anak-anak: tanpa iklan personal
  document.head.appendChild(sc);
  window.adsbygoogle = window.adsbygoogle || []; window.adsbygoogle.requestNonPersonalizedAds = 1;
  window.adBreak = window.adConfig = o => window.adsbygoogle.push(o);
  window.adConfig({preloadAdBreaks: 'on', sound: 'on'});
  $('bIklan').hidden = false; $('bIklan').onclick = tontonIklan;
  if (IK.aktif) try { tulisIklan(await api('iklan', {kunci: S.kunci})); } catch (e) {}
}
function tulisIklan(r) {
  if (r.sisa != null) $('iklanSisa').textContent = r.sisa ? `+${r.hadiah} 💎 per iklan · sisa ${r.sisa}x hari ini · tidak wajib` : 'Jatah hari ini habis · besok lagi ya';
  if (r.permata != null) { S.saya.permata = r.permata; try { hitungOnline(); } catch (e) {} }
}
function tontonIklan() {
  if (IK.sibuk) return; IK.sibuk = true;
  let mulai = false, dapat = false;
  const lepas = () => { IK.sibuk = false; try { M.ctx && M.ctx.resume(); } catch (e) {} };
  // pemblokir iklan / jaringan lambat: Google tidak menjawab sama sekali → jangan menggantung
  setTimeout(() => { if (IK.sibuk && !mulai) { toast('Iklan tidak bisa dimuat. Matikan pemblokir iklan atau coba lagi nanti.'); IK.sibuk = false; } }, 8000);
  window.adBreak({type: 'reward', name: 'permata-harian',
    beforeAd: () => { try { M.ctx && M.ctx.suspend(); } catch (e) {} },
    afterAd: () => { try { M.ctx && M.ctx.resume(); } catch (e) {} },
    beforeReward: async (tampilkan) => {
      if (IK.aktif) { try { await api('iklan', {kunci: S.kunci, op: 'mulai'}); } catch (e) { toast(e.message); lepas(); return; } }
      mulai = true; $('panelAtur').hidden = true; tampilkan();
    },
    adDismissed: () => toast('Iklan ditutup sebelum selesai, jadi belum dapat 💎.'),
    adViewed: async () => {
      dapat = true;
      if (!IK.aktif) { toast('Mode uji: iklan selesai (tanpa hadiah).'); return; }
      try { const r = await api('iklan', {kunci: S.kunci, op: 'selesai'}); tulisIklan(r); toast(`Terima kasih sudah menonton! +${r.hadiah} 💎`, 3500); bunyi('emosi'); } catch (e) { toast(e.message); }
    },
    adBreakDone: () => { if (!IK.sibuk) return; if (!mulai && !dapat) toast('Belum ada iklan yang siap. Coba lagi sebentar lagi ya.'); lepas(); }
  });
}
function hasilProfesi(r) { if (r.koin != null) S.saya.koin = r.koin; if (r.permata != null) S.saya.permata = r.permata; if (r.profesi) S.saya.profesi = r.profesi; hitungOnline(); }
async function skillKerja() {
  if (kerjaSibuk || !bisaKerja(tokoh.saya)) return;
  if (!SH) {
    kerjaSibuk = true;
    try { const r = await api('profesi', {kunci: S.kunci, op: 'mulai'}); hasilProfesi(r); const sh = r.profesi.sh; SH = {p: sh.p, t0: sh.t0, n: 0, next: 0}; simpanShift(); gantiAvatarSaya();
      const d = DPF()[SH.p] || {}; toast(`${d.ikon || '💼'} Shift ${d.nama || ''} dimulai! Seragam terpasang. Selesaikan ${TUGAS_N} tugas untuk gaji ${PF().gaji} 🪙.`, 4000); bunyi('masuk'); }
    catch (e) { toast(e.message, 3500); kerjaSibuk = false; return; }
    kerjaSibuk = false;
  }
  if (Date.now() < SH.next) { toast(`⏳ Tugas berikutnya ${mmss(SH.next - Date.now())} lagi. Tetap di tempat kerja ya.`, 2500); return; }
  bukaSoal();
}
function bukaSoal() {
  const d = DPF()[SH.p] || {}; soalKini = (SOAL[SH.p] || SOAL.guru)();
  $('judulKerja').textContent = `${d.ikon || '💼'} Shift ${d.nama || ''} · tugas ${SH.n + 1}/${TUGAS_N}`;
  $('isiKerja').innerHTML = `<p class="soal">${soalKini.s}</p><div class="jawab">${soalKini.o.map((o, i) => `<button data-jawab="${i}">${esc(String(o))}</button>`).join('')}</div>`;
  $('panelKerja').hidden = false;
}
document.addEventListener('click', async e => {
  const b = e.target.closest?.('[data-jawab]'); if (!b || !SH || !soalKini) return;
  if (+b.dataset.jawab !== soalKini.b) { b.classList.add('salah'); b.disabled = true; bunyi('langkah'); return; }
  b.classList.add('benar'); bunyi('emosi'); SH.n++; soalKini = null; SH.next = Date.now() + TUGAS_JEDA; simpanShift();
  setTimeout(() => { $('panelKerja').hidden = true; }, 450);
  if (SH.n < TUGAS_N) { toast(`✅ Tugas ${SH.n}/${TUGAS_N} beres! Tugas berikutnya ${TUGAS_JEDA / 60e3 * 60 | 0} detik lagi.`, 2500); return; }
  selesaiShift();
});
async function selesaiShift() {
  if (kerjaSibuk) return; kerjaSibuk = true;
  try { const r = await api('profesi', {kunci: S.kunci, op: 'selesai'}); hasilProfesi(r); SH = null; simpanShift(); gantiAvatarSaya(); bunyi('masuk');
    toast(`💼 Shift selesai! Gaji +${r.gaji} 🪙. Shift hari ini ${PF().shift}/${PF().batas}.`, 4000); }
  catch (er) { if (/belum selesai/.test(er.message)) { SH.next = Date.now() + 20e3; simpanShift(); toast('⏳ Sebentar lagi shift selesai, tunggu sebentar di tempat kerja.', 3000); } else { toast(er.message, 3500); SH = null; simpanShift(); gantiAvatarSaya(); } }
  finally { kerjaSibuk = false; }
}
// shift yang tugasnya sudah lengkap selesai otomatis begitu waktunya cukup
setInterval(() => { labelKerja(); if (SH && SH.n >= TUGAS_N && Date.now() >= SH.next && !kerjaSibuk) selesaiShift(); }, 1000);
function bukaProfesi() {
  if (S.tamu) { toast('Daftar jadi warga dulu untuk punya profesi.', 3000); return; }
  const pf = PF(), D = DPF(), pm = S.saya.permata || 0;
  $('infoProfesi').innerHTML = `Gaji semua profesi sama: <b>${pf.gaji} 🪙 per shift</b> (${TUGAS_N} tugas, ±6 menit) di tempat kerjanya, maks ${pf.batas} shift per hari. Shift hari ini: <b>${pf.shift}/${pf.batas}</b>. Ganti profesi 1 kali per hari.`;
  // audit ekonomi #3: profesi berbayar pertama setengah harga
  if (pf.diskon) $('infoProfesi').innerHTML += ` <b>🎁 Profesi pertamamu setengah harga!</b>`;
  $('isiProfesi').innerHTML = Object.entries(D).map(([id, d0]) => {
    const d = pf.diskon && d0.harga ? {...d0, harga: Math.ceil(d0.harga / 2)} : d0;
    const punya = pf.punya.includes(id), aktif = pf.a === id;
    const tb = aktif ? `<button disabled class="aktif">✓ Aktif</button>` : d.siap === false ? `<button disabled>Tunggu voting</button>`
      : punya ? `<button data-pf="pakai" data-id="${id}" ${pf.gantiHariIni || SH ? 'disabled' : ''}>Pakai</button>` : `<button data-pf="buka" data-id="${id}" ${pm < d.harga || SH ? 'disabled' : ''}>💎 ${d.harga}</button>`;
    return `<div class="rkBaris${aktif ? ' pfAktif' : ''}"><i>${d.ikon}</i><div><b>${esc(d.nama)}${d.harga ? '' : ' <span class="lencana">gratis</span>'}</b><small>${TUGAS_TEKS[id] || ''} · di ${TEMPAT_TEKS[id] || '-'}${d.siap === false ? ' (fasum belum menang voting)' : ''}</small></div>${tb}</div>`;
  }).join('');
  $('panelProfesi').hidden = false;
}
document.addEventListener('click', async e => {
  const b = e.target.closest?.('[data-pf]'); if (!b || kerjaSibuk) return; kerjaSibuk = true;
  const id = b.dataset.id, d = DPF()[id] || {};
  try { const r = await api('profesi', {kunci: S.kunci, op: b.dataset.pf, id}); hasilProfesi(r); bunyi('emosi');
    toast(b.dataset.pf === 'buka' ? `🎉 Profesi ${d.nama} terbuka! Pergi ke ${TEMPAT_TEKS[id]} lalu tekan 💼 Kerja.` : `${d.ikon} Sekarang kamu ${d.nama}.`, 4000); kerjaSibuk = false; bukaProfesi(); }
  catch (er) { toast(er.message, 3500); kerjaSibuk = false; }
});
function teksProfesi() {
  if (S.tamu || !S.saya) return ''; const pf = PF(), D = DPF(), a = D[pf.a] || {};
  const lencana = pf.punya.filter(id => D[id]).map(id => `<span class="lencana" title="${esc(D[id].nama)}">${D[id].ikon} ${esc(D[id].nama)}</span>`).join(' ');
  return `${a.ikon || '🧑‍🌾'} Profesi: <b>${esc(a.nama || 'Petani')}</b>${SH ? ` · sedang shift (${SH.n}/${TUGAS_N})` : ''}<br>${lencana}`;
}
// ---------- Iuran pembangunan (Huda 6 Nov 2026: bar progres) ----------
// Pemenang voting dibangun 7 hari setelah voting ditutup; tiap 1.000 koin iuran mempercepat 1 hari. Iuran tidak menentukan pemenang.
let iuranSibuk = false, IU = null;
// Papan "Dana pembangunan" di lahan fasum voting berikutnya (audit ekonomi #2): calon unggul + bar iuran, diperbarui tiap 5 menit.
const PAPAN = {mesh: null, kanvas: null, tex: null, data: null};
function pasangPapanDana() {
  const f = I.fas && I.fas[14]; if (!f) return;   // lahan voting berikutnya (fas[13] = Taman Kota)
  const g = new THREE.Group(), kayu = new THREE.MeshStandardMaterial({color: 0x6a4a2a, roughness: .9});
  for (const x of [-9, 9]) { const t = new THREE.Mesh(new THREE.BoxGeometry(.9, 16, .9), kayu); t.position.set(x, 8, 0); g.add(t); }
  const c = document.createElement('canvas'); c.width = 640; c.height = 400;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const papan = new THREE.Mesh(new THREE.BoxGeometry(20, 12.5, .5), [kayu, kayu, kayu, kayu, new THREE.MeshBasicMaterial({map: tex}), kayu]);
  papan.position.y = 13; g.add(papan);
  g.position.set(f.x, 0, f.z + 14); sc.add(g);
  Object.assign(PAPAN, {mesh: g, kanvas: c, tex});
  gambarPapan(); segarPapan(); setInterval(segarPapan, 5 * 60e3);
}
async function segarPapan() { try { PAPAN.data = await (await fetch('/duniakotak/api/voting')).json(); gambarPapan(); aturProyek(); } catch (e) {} }
// ---------- warga offline jadi NPC + gotong royong pembangunan fasum (Huda 6 Nov 2026) ----------
async function muatWargaNPC() {
  try { const j = await (await fetch('/duniakotak/api/warga-npc?dusun=' + DI)).json(); wnpc.isi(j.warga || []); aturProyek(); } catch (e) {}
}
function aturProyek() {
  if (!wnpc) return;
  const uji = +new URLSearchParams(location.search).get('uji_bangun');   // pratinjau: ?uji_bangun=13
  const b = bangunAktif(), f = uji ? I.fas?.[uji] : b ? lahanBangun(b) : null;
  wnpc.setProyek(f ? {x: f.x, z: f.z} : null);
}
function gambarPapan() {
  const c = PAPAN.kanvas; if (!c) return; const x = c.getContext('2d'), d = PAPAN.data || {};
  x.fillStyle = '#f6ecd6'; x.fillRect(0, 0, 640, 400); x.strokeStyle = '#6a4a2a'; x.lineWidth = 14; x.strokeRect(7, 7, 626, 386);
  x.fillStyle = '#3a2a1a'; x.textAlign = 'center'; x.font = '900 40px Montserrat, sans-serif'; x.fillText('VOTING FASUM DESA', 320, 70);
  const hasil = Object.entries(d.hasil || {}).sort((a, b) => b[1] - a[1]), un = hasil[0];
  x.font = '800 34px Montserrat, sans-serif'; x.fillStyle = '#b4532a';
  x.fillText(un && un[1] ? `Unggul: ${(CALON[un[0]] || ['', un[0]])[1]} (${un[1]} bintang)` : 'Voting fasum sedang berjalan', 320, 135);
  const lk = un && un[1] && LOKASI_FASUM[un[0]]; if (lk) { x.font = '700 22px Montserrat, sans-serif'; x.fillStyle = '#6a5a48'; x.fillText(`Dibangun di Dusun ${NAMA_DUSUN[lk[0]] || lk[0]}`, 320, 168); }
  const dn = d.dana || {total: 0, target: 7000, hari: 7}, pr = Math.min(1, dn.total / dn.target);
  x.fillStyle = '#3a2a1a'; x.font = '700 28px Montserrat, sans-serif'; x.fillText('Dana pembangunan', 320, 200);
  x.fillStyle = '#d9cdb2'; x.fillRect(60, 220, 520, 48); x.fillStyle = '#2a9a5a'; x.fillRect(60, 220, 520 * pr, 48);
  x.fillStyle = '#1d1d22'; x.font = '800 28px Montserrat, sans-serif'; x.fillText(`${dn.total.toLocaleString('id-ID')} / ${dn.target.toLocaleString('id-ID')} koin`, 320, 254);
  x.font = '700 24px Montserrat, sans-serif'; x.fillText(`Dibangun ${dn.hari} hari setelah voting ditutup`, 320, 312);
  x.fillStyle = '#6a5a48'; x.fillText('Iuran: Atur > Voting Fasum', 320, 352);
  PAPAN.tex.needsUpdate = true;
}
// Pengingat koin sekali sehari (audit ekonomi #2): kasih tahu koinnya cukup untuk apa, supaya koin tidak cuma menumpuk.
function ingatKoin() {
  if (S.tamu || !S.saya || baca('dk_ingat') === hariIni()) return;
  const k = S.saya.koin || 0, h = S.hias || {}, p = h.punya || {}, dk = p.dekor || [];
  const pilih = [[1500, 'upgrade rumah 2 lantai', !(p.rumah || []).includes('dua')], [800, 'kolam ikan di pekarangan', !dk.includes('kolam')],
    [300, 'cat rumah warna baru', (p.cat || []).length < 6], [200, 'pagar atau topi baru', (p.pagar || []).length < 4], [100, 'bangku atau pot taman', !dk.includes('bangku') || !dk.includes('pot')]]
    .find(([hg, , ok]) => ok && k >= hg);
  if (!pilih) return;
  simpan('dk_ingat', hariIni());
  toast(`🪙 Koinmu ${k}, cukup untuk ${pilih[1]} di ⚙ Atur → Toko Hias. Bisa juga iuran bangun fasum di Voting.`, 6500);
}
function tulisDana() {
  if (VT && VT.dana && PAPAN.kanvas) { PAPAN.data = {...(PAPAN.data || {}), dana: VT.dana, hasil: VT.hasil || PAPAN.data?.hasil}; gambarPapan(); }
  const d = VT?.dana; if (!d) { $('vtDana').innerHTML = ''; $('vtDanaLipat').hidden = true; return; }
  const pr = Math.min(100, d.total / d.target * 100), penuh = d.total >= d.target, k = S.saya?.koin || 0, pm = S.saya?.permata || 0;
  // dilipat di pop up (Huda 8 Nov 2026): judul lipatan sudah memuat bar progres, isi dibuka bila ingin iuran
  $('vtDanaLipat').hidden = false;
  $('vtDanaRingkas').innerHTML = `<span>🏗️ Dana pembangunan</span><span class="danaBar mini"><span style="width:${pr.toFixed(1)}%"></span><em>${d.total.toLocaleString('id-ID')} / ${d.target.toLocaleString('id-ID')} 🪙</em></span>`;
  let h = `<small>${penuh ? 'Dana penuh! Pemenang langsung dibangun begitu voting ditutup.' : `Pemenang dibangun <b>${d.hari} hari</b> setelah voting ditutup${d.hemat ? ` (lebih cepat ${d.hemat} hari berkat iuran)` : ''}. Tiap ${d.perHari.toLocaleString('id-ID')} 🪙 iuran = 1 hari lebih cepat.`} ${d.penyumbang} warga sudah iuran. 1 💎 = 10 🪙, maks ${d.batasPermata} 💎/minggu.</small>`;
  if (d.top?.length) h += `<small class="danaTop">Penyumbang terbesar (masuk prasasti): ${d.top.map(x => `@${esc(x.ig)} ${x.v.toLocaleString('id-ID')}`).join(' · ')}</small>`;
  if (!S.tamu && !penuh) h += `<div class="danaTombol">${[50, 100, 500].map(n => `<button data-iuran="koin" data-n="${n}" ${k < n ? 'disabled' : ''}>🪙 ${n}</button>`).join('')}${[5, 10].map(n => `<button data-iuran="permata" data-n="${n}" ${pm < n || (IU && IU.sisaPermata < n) ? 'disabled' : ''}>💎 ${n}</button>`).join('')}</div>`
    + (IU && (IU.koin || IU.permata) ? `<small>Iuranmu putaran ini: ${IU.koin} 🪙 + ${IU.permata} 💎</small>` : '');
  $('vtDana').innerHTML = h;
}
document.addEventListener('click', async e => {
  const b = e.target.closest?.('[data-iuran]'); if (!b || iuranSibuk || S.tamu) return; iuranSibuk = true;
  const jenis = b.dataset.iuran, n = +b.dataset.n;
  try { const r = await api('iuran', {kunci: S.kunci, [jenis]: n}); S.saya.koin = r.koin; S.saya.permata = r.permata; IU = r.saya; VT.dana = r.dana; hitungOnline(); tulisDana(); bunyi('masuk');
    toast(`🏗️ Terima kasih! Iuran ${n} ${jenis === 'koin' ? '🪙' : '💎'} masuk dana pembangunan.`, 3500); }
  catch (er) { toast(er.message, 4000); } finally { iuranSibuk = false; }
});
function dekatBola(me) { const L = bolaLapangan(); return !!(L && BOLA.m && BOLA.m.visible && Math.hypot(BOLA.x - me.position.x, BOLA.z - me.position.z) < 2.2 * VS && BOLA.y < me.position.y + 4); }
function skillTendang() {
  const me = tokoh.saya; if (!me || !dekatBola(me)) return;
  const now = performance.now(); if (now - BOLA.tendangT < 250) return;
  let dx = Math.sin(me.rotation.y), dz = Math.cos(me.rotation.y);
  const bx = BOLA.x - me.position.x, bz = BOLA.z - me.position.z, bl = Math.hypot(bx, bz) || 1;
  if ((bx * dx + bz * dz) / bl < .3) { dx = bx / bl; dz = bz / bl; }   // bola di samping/belakang: tendang menjauh dari avatar
  BOLA.tendangT = now; BOLA.aku = true; bolaTendang(dx, dz, 58, true); BOLA.vy = 26; bunyi('langkah');
  wpose(me, {legR: -1.3, legL: .3, armL: -.8, armR: .6});
}
function bolaTendang(dx, dz, kuat, kirim) {
  const l = Math.hypot(dx, dz) || 1; BOLA.vx = dx / l * kuat; BOLA.vz = dz / l * kuat; BOLA.vy = kuat * .35;
  if (kirim && S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify({t: 'bola', x: +BOLA.x.toFixed(2), z: +BOLA.z.toFixed(2), vx: +BOLA.vx.toFixed(2), vz: +BOLA.vz.toFixed(2)}));
}
async function golKoin() {
  try {
    const r = await api('gol', {kunci: S.kunci}); S.saya.koin = r.koin; tandaKoin();
    toast(r.dapat ? `⚽ GOOOL! Kamu mencetak gol, +${r.dapat} koin (${r.gol}/5 hari ini)${r.piala ? ` · +${r.piala.dapat} poin Piala Dusun ${namaPiala(r.piala.d)}` : ''}` : (r.gol >= 5 ? '⚽ GOOOL! Koin gol hari ini sudah penuh (5/5), besok lagi ya.' : '⚽ GOOOL! Tunggu sebentar untuk koin gol berikutnya.'), 4000);
  } catch (e) { toast('⚽ GOOOL! Kamu mencetak gol!', 3000); }
}
function bolaTerima(q) {
  const L = bolaLapangan(); if (!L) return; if (!BOLA.m) bolaBuat(L);
  BOLA.aku = false; BOLA.x = q.x; BOLA.z = q.z; BOLA.vx = q.vx; BOLA.vz = q.vz; BOLA.vy = Math.hypot(q.vx, q.vz) * .35;
}
function bolaUpdate(dt, me) {
  const L = bolaLapangan(); if (!L || !me) return;
  if (!BOLA.m) bolaBuat(L);
  const jauh = Math.hypot(me.position.x - L.cx, me.position.z - L.cz) > 60 * VS || pasarBuka(); BOLA.m.visible = !jauh; if (jauh) return;
  dt = Math.min(dt, .05); const now = performance.now();
  // tendangan warga (aku): kaki menyentuh bola
  const dxm = BOLA.x - me.position.x, dzm = BOLA.z - me.position.z;
  if (Math.hypot(dxm, dzm) < BOLA_R + 1.3 && BOLA.y < me.position.y + 3 && now - BOLA.tendangT > 350) {
    BOLA.tendangT = now; BOLA.aku = true; bolaTendang(dxm, dzm, gerak.lari ? 46 : 30, true); bunyi('langkah');
  }
  // pemain NPC menyentuh bola: giring, OPER ke kawan yang lebih depan, atau tembak ke gawang (kiper membuang ke depan)
  if (npc && now - BOLA.tendangT > 380 && BOLA.y < L.lantai + BOLA_R + 2.5) for (const n of npc.daftar) {
    if (n.kerja !== 'bola' || !n.tim || !n.obj.visible || now - (n.tendT || 0) < 650) continue;
    const o = n.obj.position; if (Math.hypot(BOLA.x - o.x, BOLA.z - o.z) >= BOLA_R + 1.6) continue;
    BOLA.tendangT = n.tendT = now; BOLA.aku = false;
    const gx = L.cx + n.tim * (L.hx + BOLA_R), keGawang = Math.abs(gx - o.x);
    const kawan = npc.daftar.filter(k => k !== n && k.tim === n.tim && k.obj.visible && !k.kiper);
    const depan = kawan.find(k => (k.obj.position.x - o.x) * n.tim > 1.5 * VS);
    let tx, tz, kuat;
    if (keGawang < 4 * VS && !n.kiper) { tx = gx; tz = L.cz + (Math.random() - .5) * 1.7 * L.gawang; kuat = 40 + Math.random() * 12; }
    else if ((n.kiper || (depan && Math.random() < .65)) && (depan || kawan[0])) { const k = depan || kawan[0], kp = k.obj.position, d = Math.hypot(kp.x - o.x, kp.z - o.z);
      tx = kp.x + n.tim * 1.2 * VS; tz = kp.z; kuat = Math.max(16, Math.min(46, d * 1.05 + 6)); }
    else { tx = o.x + n.tim * 3 * VS; tz = o.z + (L.cz - o.z) * .25 + (Math.random() - .5) * 2.5 * VS; kuat = 12 + Math.random() * 5; }
    bolaTendang(tx - BOLA.x, tz - BOLA.z, kuat, false); if (kuat < 20) BOLA.vy = 3;
    break;
  }
  // gerak + gesekan rumput + pantulan dinding lapangan
  BOLA.x += BOLA.vx * dt; BOLA.z += BOLA.vz * dt; const gs = Math.exp(-.9 * dt); BOLA.vx *= gs; BOLA.vz *= gs;
  BOLA.vy -= 95 * dt; BOLA.y += BOLA.vy * dt; const y0 = L.lantai + BOLA_R; if (BOLA.y < y0) { BOLA.y = y0; BOLA.vy = Math.abs(BOLA.vy) > 4 ? -BOLA.vy * .45 : 0; }
  const rx = BOLA.x - L.cx, rz = BOLA.z - L.cz;
  if (Math.abs(rx) > L.hx) {
    if (Math.abs(rz) < L.gawang && now - BOLA.golT > 3000) {   // GOL!
      BOLA.golT = now; bunyi('masuk');
      if (BOLA.aku && !S.tamu && S.saya) { BOLA.aku = false; golKoin(); } else toast(`⚽ GOOOL! Masuk gawang ${rx > 0 ? 'timur' : 'barat'}!`, 3000);
      BOLA.x = L.cx; BOLA.z = L.cz; BOLA.vx = BOLA.vz = 0; BOLA.vy = 20;
    } else { BOLA.x = L.cx + Math.sign(rx) * L.hx; BOLA.vx = -BOLA.vx * .75; }
  }
  if (Math.abs(rz) > L.hz) { BOLA.z = L.cz + Math.sign(rz) * L.hz; BOLA.vz = -BOLA.vz * .75; }
  if (!Number.isFinite(BOLA.x + BOLA.z + BOLA.y)) { BOLA.x = L.cx; BOLA.z = L.cz; BOLA.y = y0; BOLA.vx = BOLA.vz = BOLA.vy = 0; }
  // bola menggelinding
  const v = Math.hypot(BOLA.vx, BOLA.vz); BOLA.m.position.set(BOLA.x, BOLA.y, BOLA.z);
  if (v > .05) { BOLA.m.rotation.z -= BOLA.vx * dt / BOLA_R; BOLA.m.rotation.x += BOLA.vz * dt / BOLA_R; }
}
function kenaHUD(a, b, c, d) {
  const now = performance.now(); if (now - hudT > 500) { hudT = now; tataHUD(); }
  return kotakHUD.some(r => a < r.right && c > r.left && b < r.bottom && d > r.top);
}
addEventListener('resize', () => setTimeout(tataHUD, 60)); setInterval(tataHUD, 1000);
const taruh = [];   // kotak label nama yang sudah dipasang frame ini (supaya tidak saling tumpuk)
const V = new THREE.Vector3();
function tempel(obj, tinggi, teks, cls, dy = 0) {
  V.copy(obj.position); V.y += tinggi; V.project(cam);
  if (V.z > 1 || V.x < -1.2 || V.x > 1.2 || V.y < -1.2 || V.y > 1.2) return null;
  let d = pool.find(x => !x.dipakai); if (!d) { d = {el: document.createElement('div')}; lab.appendChild(d.el); pool.push(d); }
  d.dipakai = true; if (d.el.className !== cls) d.el.className = cls; if (d.el._t !== teks) { d.el.textContent = teks; d.el._t = teks; d.el._w = 0; }
  const x = (V.x + 1) / 2 * innerWidth; let y = (1 - V.y) / 2 * innerHeight + dy;
  if (cls.startsWith('nm')) {
    const w = d.el._w || (d.el._w = d.el.offsetWidth || teks.length * 7.5 + 20), h = 24;
    for (let k = 0; k < 6; k++) { const tabrak = taruh.find(r => Math.abs(r.x - x) < (r.w + w) / 2 + 4 && Math.abs(r.y - y) < h); if (!tabrak) break; y = tabrak.y - h - 2; }
    taruh.push({x, y, w});
  }
  const w2 = (d.el._w || (d.el._w = d.el.offsetWidth || teks.length * 7.5 + 20)) / 2, xx = Math.min(innerWidth - w2 - 6, Math.max(w2 + 6, x));
  if (Math.abs(xx - x) > w2 * 1.5 || kenaHUD(xx - w2, y - 24, xx + w2, y)) { d.el.style.display = 'none'; return d.el; }   // label tidak boleh menimpa tombol/kartu
  d.el.style.transform = `translate(${xx | 0}px,${y | 0}px) translate(-50%,-100%)`; if (d.el.style.display) d.el.style.display = '';
  return d.el;
}

// =====================================================================
// 6. CHAT
// =====================================================================
const EMO = {sapa: '👋', hati: '❤️', tawa: '😂', main: '🏠'};
function tambahChat(ch, nama, m, kls) {
  const arr = S.chat[ch]; arr.push({nama, m, kls}); if (arr.length > 60) arr.shift();
  if (S.ch === ch) tulisChat();
}
function tulisChat() {
  const el = $('isiChat');
  el.innerHTML = S.chat[S.ch].map(x => x.kls === 'sistem' ? `<div class="sistem">${esc(x.m)}</div>` : `<div><b class="${x.kls || ''}">${esc(x.nama)}:</b> ${esc(x.m)}</div>`).join('') || '<div class="sistem">Belum ada pesan. Sapa warga lain!</div>';
  el.scrollTop = el.scrollHeight;
}
function gelembung(no, m, emo) { const t = no === 'raka' ? tokoh.raka : no === S.saya?.no ? tokoh.saya : S.others.get(no)?.obj; if (!t) return; t.userData.gel = {m, emo, sampai: performance.now() + (emo ? 2500 : 6000)}; }
function kirimChat(m) {
  m = String(m || '').trim(); if (!m) return;
  if (S.tamu) { toast('Daftar jadi warga dulu untuk ngobrol.'); return; }
  if (!S.ws || S.ws.readyState !== 1) { toast('Sedang menyambung ke desa…'); return; }
  S.ws.send(JSON.stringify({t: 'c', ch: S.ch, m})); misiMaju('sapa');
}

// =====================================================================
// 7. JARINGAN
// =====================================================================
let coba = 0;
function sambung() {
  if (S.tamu) return;
  const p = tokoh.saya.position;
  const u = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/duniakotak/api/ruang?dusun=' + DI + '&kunci=' + encodeURIComponent(S.kunci) + '&x=' + p.x.toFixed(1) + '&z=' + p.z.toFixed(1);
  const ws = new WebSocket(u); S.ws = ws;
  ws.onopen = () => { coba = 0; ws.send(JSON.stringify({t: 'av', av: avKerja(S.av)})); kirimPos(true); };
  ws.onmessage = e => { let q; try { q = JSON.parse(e.data); } catch (er) { return; } terima(q); };
  ws.onclose = e => {
    S.others.forEach(o => sc.remove(o.obj)); S.others.clear(); hitungOnline();
    if (e.code === 4000) { toast('Akunmu dibuka di tempat lain.', 5000); return; }
    setTimeout(sambung, Math.min(15000, 1000 * 2 ** coba++));
  };
}
function tambahWarga(w) {
  if (w.no === S.saya.no) return;
  const lama = S.others.get(w.no); if (lama) sc.remove(lama.obj);
  const obj = buatAvatarObj(bersihAv(w.av || avAcak(w.no))); obj.position.set(w.x, 0, w.z); obj.rotation.y = w.r || 0; sc.add(obj);
  S.others.set(w.no, {obj, ig: w.ig, av: w.av, tx: w.x, tz: w.z, tr: w.r || 0, a: 0, ph: 0});
}
// Chat Desa tersambung semua dusun: pesan dari dusun lain diberi label asal dusunnya.
function namaDesa(c) { return '@' + c.ig + (c.d && c.d !== DI && NAMA_DUSUN[c.d] ? ' (' + NAMA_DUSUN[c.d].replace('Kotak ', '') + ')' : ''); }
function terima(q) {
  if (q.t === 'bola') { bolaTerima(q); return; }
  if (q.t === 'halo') { q.warga.forEach(tambahWarga); S.chat.dusun = []; q.chat.forEach(c => tambahChat('dusun', namaDesa(c), c.m)); hitungOnline(); }
  else if (q.t === 'masuk') { tambahWarga(q.w); hitungOnline(); tambahChat('sekitar', '', '@' + q.w.ig + ' masuk ke desa', 'sistem'); bunyi('masuk'); }
  else if (q.t === 'keluar') { const o = S.others.get(q.no); if (o) { sc.remove(o.obj); S.others.delete(q.no); } hitungOnline(); }
  else if (q.t === 'p') { for (const [no, x, z, r, a] of q.d) { const o = S.others.get(no); if (o) { o.tx = x; o.tz = z; o.tr = r; o.a = a; o.akhir = performance.now(); } } }
  else if (q.t === 'av') { const o = S.others.get(q.no); if (o) { const p = o.obj.position.clone(); sc.remove(o.obj); o.obj = buatAvatarObj(bersihAv(q.av)); o.obj.position.copy(p); sc.add(o.obj); } }
  else if (q.t === 'c') {
    if (S.bisu.has(q.no)) return;
    const saya = q.no === S.saya.no; const o = S.others.get(q.no);
    const dekat = saya || (o && o.obj.position.distanceTo(tokoh.saya.position) < 120);
    if (q.ch === 'dusun') tambahChat('dusun', namaDesa(q), q.m);
    else if (dekat) tambahChat('sekitar', '@' + q.ig, q.m);
    if (dekat || q.ch === 'sekitar') gelembung(q.no, q.m);
    if (saya) bunyi('kirim'); else if (dekat || q.ch === 'dusun') bunyi('pesan');
  }
  else if (q.t === 'e' && q.e === 'lompat') { const o = S.others.get(q.no); if (o) o.lompat = {vy: 34, y: 0}; }
  else if (q.t === 'e') { if (!S.bisu.has(q.no)) { gelembung(q.no, EMO[q.e] || '👋', true); bunyi('emosi'); } }
  else if (q.t === 'tolak' || q.t === 'info') toast(q.m, 3500);
}
// warga online SEMUA dusun digabung (6 Nov 2026); angka dusun ini dari ruang sendiri, sisanya dari /api/online tiap 20 detik
const ON = {data: null, t: 0};
async function muatOnline() { try { ON.data = await (await fetch('/duniakotak/api/online')).json(); ON.t = Date.now(); } catch (e) {} hitungOnline(); if (!$('panelOnline').hidden) tulisOnline(); }
function jumlahOnline() {
  const d = ON.data; if (!d || !d.warga) return S.others.size + (S.tamu ? 0 : 1);
  const lain = d.warga.filter(x => x.d !== DI).length;   // dusun lain dari server; dusun ini langsung dari ruang (lebih baru)
  return lain + S.others.size + (S.tamu ? 0 : 1);
}
function hitungOnline() {
  // kartu profil dipersimpel (Huda 6 Nov 2026): avatar + nama, koin & permata di sampingnya; detail lain di panel Profil
  $('dompet').hidden = S.tamu || !S.saya;
  document.querySelector('#profil .pfNm').hidden = !S.tamu && !!S.saya;   // Huda: pojok cukup foto avatar + koin + permata
  if (!S.tamu && S.saya) { $('dKoin').textContent = '🪙 ' + (S.saya.koin || 0); $('dPermata').textContent = '💎 ' + (S.saya.permata || 0); }
  $('profOnline').textContent = `🟢 ${jumlahOnline()} online`; $('dOnline').innerHTML = `<i class="titikOn"></i>${jumlahOnline()}`; $('dOnline').title = jumlahOnline() + ' warga online · ketuk untuk lihat per dusun';
  if (!$('panelProfil').hidden) tulisProfil();
}
// ---------- panel Profil: avatar, saldo, inventori ----------
function fotoAvatar(wajah) {
  const tadi = $('buatAvatar').hidden; if (!pv) bukaPembuatAvatar(S.av, false, true); $('buatAvatar').hidden = tadi;
  const o = warga(S.av); o.rotation.y = .4; const lama = pv.obj; if (lama) lama.visible = false; pv.sc.add(o);
  if (wajah) { o.rotation.y = .25; pv.cam.position.set(0, 3.55, 5.2); pv.cam.lookAt(0, 3.45, 0); } else { pv.cam.position.set(0, 2.6, 13); pv.cam.lookAt(0, 2.1, 0); }
  pv.r.render(pv.sc, pv.cam);
  const url = pv.r.domElement.toDataURL('image/png'); pv.sc.remove(o); if (lama) lama.visible = true; pv.cam.position.set(0, 2.6, 13); pv.cam.lookAt(0, 2.1, 0); return url;
}
// foto profil = wajah avatar warga sendiri (Huda 6 Nov 2026)
function fotoProfil() {
  const a = $('profAva'); a.style.background = S.av.kulit;
  try { a.style.backgroundImage = `url(${fotoAvatar(true)})`; a.textContent = ''; } catch (e) { a.textContent = '🙂'; }
}
function tulisProfil() {
  const s = S.saya; if (!s) return;
  $('pfNama').textContent = lencana(s.no) + '@' + s.ig; $('pfAlamat').textContent = `No. ${s.no} · ${alamat(s.no)} · ${NAMA_DUSUN[dusunDari(s.no)]}`;
  $('pfKoin').textContent = s.koin || 0; $('pfPermata').textContent = s.permata || 0;
  const k = s.kebun || {}, sisa = (k.siap || 0) - Date.now(), bb = k.b && s.bibit ? s.bibit[k.b] : null;
  $('pfPanen').textContent = !k.b ? '🌱 Kebunmu kosong. Pulang ke rumah lalu tekan Tanam.' : sisa <= 0 ? `🧺 ${bb ? bb.nama : 'Tanaman'} siap dipanen. Pulang ke rumah lalu tekan Panen.` : `🌱 ${bb ? bb.nama : 'Tanaman'} siap panen ${sisa > 3600e3 ? Math.ceil(sisa / 3600e3) + ' jam' : Math.ceil(sisa / 60e3) + ' menit'} lagi.`;
  $('pfProfesi').innerHTML = teksProfesi();
  const brg = Object.entries(tas).map(([n, v]) => `<div class="pfBrg"><i>${v.ikon}</i><b>${esc(n)}</b><small>×${v.n}</small></div>`);
  const h = S.hias || {}, punya = h.punya || {}, warna = {cat: WARNA_CAT, pagar: WARNA_PAGAR, topi: WARNA_TOPI, rumah: {}};
  const awal = {cat: 'krem', pagar: 'putih', topi: 'tanpa', rumah: 'satu'};
  for (const j of ['rumah', 'cat', 'pagar', 'topi']) {
    const pakai = h[j] || awal[j];
    for (const id of new Set([awal[j], ...(punya[j] || [])])) {
      if (id === 'tanpa' || id === 'satu') continue;
      brg.push(`<div class="pfBrg${id === pakai ? ' on' : ''}"><i>${tandaBrg(j, id, warna)}</i><b>${NAMA_TOKO[j][1]} ${esc(NAMA_BRG[id] || id)}</b><small>${id === pakai ? 'Dipakai' : 'Dimiliki'}</small></div>`);
    }
  }
  $('pfInv').innerHTML = brg.length ? brg.join('') : '<p class="kecil">Inventori masih kosong.</p>';
}
document.addEventListener('click', e => { const b = e.target.closest?.('[data-tutup]'); if (b) $(b.dataset.tutup).hidden = true; });
function bukaProfil() {
  if (S.tamu) return toast('Daftar di willoapparel.com/duniakotak supaya dapat kavling.', 4000);
  try { $('pfAva').src = fotoAvatar(); } catch (e) { /* pratinjau gagal, panel tetap dibuka */ }
  tulisProfil(); $('panelProfil').hidden = false;
}
function tulisOnline() {
  const ini = [...S.others].map(([no, o]) => ({no, ig: o.ig, d: DI}));
  if (!S.tamu && S.saya) ini.unshift({no: S.saya.no, ig: S.saya.ig, d: DI, aku: true});
  const semua = [...ini, ...((ON.data && ON.data.warga) || []).filter(x => x.d !== DI)];
  $('ringkasOnline').textContent = `${semua.length} warga sedang main di semua dusun. Ketuk nama untuk mampir ke rumahnya.`;
  $('isiOnline').innerHTML = Object.keys(NAMA_DUSUN).map(d => {
    const w = semua.filter(x => x.d === d);
    return `<div class="misi"><span class="mi">${{wetan: '🌾', kulon: '🍃', curug: '💦', tlaga: '🛶', segara: '🏙️'}[d]}</span><div><b>Dusun ${NAMA_DUSUN[d]} · ${w.length} online</b><small>${w.length ? w.map(x => `<button class="chipOn" data-on="${x.no}">${x.aku ? '⭐ ' : ''}@${esc(x.ig || 'warga' + x.no)}</button>`).join(' ') : 'Sepi. Ajak temanmu main ke sini!'}</small></div><span></span></div>`;
  }).join('');
}
function bukaOnline() { $('panelOnline').hidden = false; tulisOnline(); muatOnline(); }
let kirimT = 0, posLama = '';
function kirimPos(paksa) {
  if (!S.ws || S.ws.readyState !== 1) return;
  const p = tokoh.saya.position, now = performance.now();
  const k = p.x.toFixed(1) + ',' + p.z.toFixed(1);
  // hemat kuota Durable Objects (10 Nov 2026): maks 4 posisi/detik saat jalan, diam cukup tiap 10 detik
  if (!paksa && (now - kirimT < 250 || (k === posLama && now - kirimT < 10000))) return;
  kirimT = now; posLama = k;
  S.ws.send(JSON.stringify({t: 'p', x: +p.x.toFixed(2), z: +p.z.toFixed(2), r: +tokoh.saya.rotation.y.toFixed(2), a: gerak.jalan ? 1 : 0}));
}

// =====================================================================
// 8. KONTROL
// =====================================================================
const gerak = {kunci: {}, stik: null, tujuan: null, jalan: false};
addEventListener('keydown', e => { if (document.activeElement && document.activeElement.tagName === 'INPUT') return; gerak.kunci[e.key.toLowerCase()] = true; if (e.key === 'q' || e.key === 'Q') putar(1); if (e.key === 'e' || e.key === 'E') putar(-1); const kk = e.key.toLowerCase(); if (kk === 'f') skillAmbil(); if (kk === 'r') skillMancing(); if (kk === 'g') skillMakan(); if (kk === 't') skillTendang(); if (e.key === ' ') { mulaiLompat(); e.preventDefault(); } if (kk === 'm' && peta.img) { if ($('panelPeta').hidden) bukaPeta(); else $('panelPeta').hidden = true; } if (e.key === 'Enter') { $('ketik').focus(); e.preventDefault(); } });
addEventListener('keyup', e => { gerak.kunci[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { gerak.kunci = {}; });
const stik = $('stik'), kenop = $('kenop');
stik.addEventListener('pointerdown', e => { stik.setPointerCapture(e.pointerId); gerak.stik = {id: e.pointerId, x: 0, y: 0}; gerak.tujuan = null; geserStik(e); });
stik.addEventListener('pointermove', e => { if (gerak.stik && gerak.stik.id === e.pointerId) geserStik(e); });
const lepasStik = e => { if (gerak.stik && gerak.stik.id === e.pointerId) { gerak.stik = null; kenop.style.transform = ''; stik.classList.remove('lari'); } };
stik.addEventListener('pointerup', lepasStik); stik.addEventListener('pointercancel', lepasStik);
function geserStik(e) { const r = stik.getBoundingClientRect(); let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2); const m = r.width / 2 - 20, l = Math.hypot(x, y); if (l > m) { x *= m / l; y *= m / l; } kenop.style.transform = `translate(${x}px,${y}px)`; gerak.stik.x = x / m; gerak.stik.y = y / m; gerak.stik.lari = Math.hypot(x, y) / m > .82; stik.classList.toggle('lari', gerak.stik.lari); }
// ketuk tanah = jalan ke titik itu; ketuk tokoh warga = menu
const ray = new THREE.Raycaster(), lantai = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
// geser 1 jari = putar kamera, cubit 2 jari = zoom, ketuk = jalan ke titik itu; roda mouse = zoom
const jari = new Map(); let cubit0 = 0, zoom0 = 1, geserJauh = 0;
$('layar').addEventListener('pointerdown', e => { $('layar').setPointerCapture(e.pointerId); jari.set(e.pointerId, {x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY}); geserJauh = jari.size > 1 ? 99 : 0;
  if (jari.size === 2) { const [a, b] = [...jari.values()]; cubit0 = Math.hypot(a.x - b.x, a.y - b.y) || 1; zoom0 = zoom; } });
$('layar').addEventListener('pointermove', e => { const j = jari.get(e.pointerId); if (!j) return; const dx = e.clientX - j.x; j.x = e.clientX; j.y = e.clientY;
  if (jari.size === 1) { geserJauh = Math.max(geserJauh, Math.hypot(e.clientX - j.x0, e.clientY - j.y0)); if (geserJauh > 8) { yaw -= dx * .0085; yawNow = yaw; } }
  else if (jari.size === 2) { const [a, b] = [...jari.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); zoom = Math.max(.55, Math.min(1.9, zoom0 * cubit0 / Math.max(20, d))); } });
const lepasJari = e => { jari.delete(e.pointerId); };
$('layar').addEventListener('pointercancel', lepasJari);
$('layar').addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(.55, Math.min(1.9, zoom * (e.deltaY > 0 ? 1.08 : .93))); }, {passive: false});
$('layar').addEventListener('pointerup', e => {
  const sisa = jari.size; lepasJari(e); if (geserJauh > 8 || sisa > 1) return;
  $('menuWarga').hidden = true;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const m = new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(m, cam);
  const titik = new THREE.Vector3(); if (ray.ray.intersectPlane(lantai, titik)) { gerak.tujuan = titik; rute.antar = false; }
});
lab.addEventListener('click', e => {
  const el = e.target.closest('.nm'); if (el && el.dataset.npc) { const n = npc && npc.daftar.find(x => x.id === el.dataset.npc); if (n) ngobrol(n); return; }
  if (!el || !el.dataset.no) return;
  const no = +el.dataset.no, o = S.others.get(no); if (!o) return;
  const mw = $('menuWarga'); mw.hidden = false; mw.style.left = Math.min(innerWidth - 200, e.clientX) + 'px'; mw.style.top = Math.min(innerHeight - 160, e.clientY + 10) + 'px';
  mw.innerHTML = `<b>${lencana(no)}@${esc(o.ig)} · No. ${no}</b><small class="kecil" style="padding:0 4px">${esc(alamat(no))}</small>
    <button data-a="rumah">🏠 Lihat rumahnya</button><button data-a="bisu">${S.bisu.has(no) ? '🔈 Batal bisukan' : '🔇 Bisukan'}</button><button data-a="lapor">🚩 Laporkan</button>`;
  mw.onclick = ev => { const a = ev.target.dataset.a; if (!a) return; mw.hidden = true;
    if (a === 'rumah') pergiKe(no);
    if (a === 'bisu') { S.bisu.has(no) ? S.bisu.delete(no) : S.bisu.add(no); simpan('dk_bisu', [...S.bisu]); toast(S.bisu.has(no) ? 'Pesan @' + o.ig + ' tidak tampil lagi di HP-mu.' : 'Bisukan dibatalkan.'); }
    if (a === 'lapor' && S.ws) S.ws.send(JSON.stringify({t: 'lapor', no}));
  };
});
// ---------- Kamera HP: foto 9:16 berbingkai + ajakan jadi warga ----------
var kArah = 'selfie', fotoBlob = null, terangNow = 1;
async function jepret() {
  // Render langsung ke kanvas layar (bukan render target) supaya tone mapping + sRGB sama persis dengan tampilan game (sebelumnya foto jadi gelap).
  const W = 720, H = 1280, me = tokoh.saya.position, ry = tokoh.saya.rotation.y;
  const kotakAv = new THREE.Box3().setFromObject(tokoh.saya), tAv = Math.max(2, kotakAv.max.y - kotakAv.min.y), dasar = kotakAv.min.y;
  // Lensa lebar ala kamera 0,5x HP (Huda 6 Nov 2026): sudut pandang vertikal 82° untuk selfie & kamera belakang.
  const FOV = 82, c2 = new THREE.PerspectiveCamera(FOV, W / H, .5, 600);
  if (kArah === 'selfie') {
    // avatar di tengah frame (sedikit di bawah tengah, aman dari bingkai teks atas & CTA bawah), tingginya ±30% frame (lebih lega, terasa wide)
    const jarak = tAv / .3 / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    c2.position.set(me.x + Math.sin(ry) * jarak, dasar + tAv * .75, me.z + Math.cos(ry) * jarak); c2.lookAt(me.x, dasar + tAv * .45, me.z);
  } else {
    // kamera belakang = dari balik punggung avatar (Huda 6 Nov 2026): avatar terlihat dari belakang menghadap pemandangan,
    // kamera agak rendah & lurus ke depan supaya pemandangan luas, bukan langit.
    const sn = Math.sin(yawNow), cs = Math.cos(yawNow), mundur = tAv * 2.2, tinggi = dasar + tAv * 1.3;
    c2.position.set(me.x + sn * mundur, tinggi, me.z + cs * mundur); c2.lookAt(me.x - sn * 40, tinggi - (40 + mundur) * Math.tan(THREE.MathUtils.degToRad(15)), me.z - cs * 40);
  }
  const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1920; const x = cv.getContext('2d');
  const ukur = R.getSize(new THREE.Vector2()), pr = R.getPixelRatio();
  // Foto selalu terang (Huda 6 Nov 2026: hasil foto gelap). Saat jepret, cahaya & exposure dinaikkan ke level siang
  // seperti mode malam/flash HP, langit tetap ikut jam. Setelah jepret semua dikembalikan.
  const exp0 = R.toneMappingExposure, cah0 = I.light.intensity;
  R.toneMappingExposure = Math.max(exp0, 1.3); I.light.intensity = Math.max(cah0, 2.4);
  // kamera belakang: avatar sementara diputar menghadap pemandangan (punggung ke kamera), dikembalikan setelah jepret
  const ry0 = tokoh.saya.rotation.y; if (kArah !== 'selfie') { tokoh.saya.rotation.y = yawNow + Math.PI; tokoh.saya.updateMatrixWorld(true); }
  R.setPixelRatio(1); R.setSize(W, H, false); R.render(sc, c2);
  tokoh.saya.rotation.y = ry0;
  x.filter = 'brightness(1.08) saturate(1.12)'; x.drawImage(R.domElement, 0, 0, 1080, 1920); x.filter = 'none';
  R.toneMappingExposure = exp0; I.light.intensity = cah0;
  R.setPixelRatio(pr); R.setSize(ukur.x, ukur.y, false);
  // bingkai atas
  const g = x.createLinearGradient(0, 0, 0, 380); g.addColorStop(0, 'rgba(19,20,31,.82)'); g.addColorStop(1, 'rgba(19,20,31,0)'); x.fillStyle = g; x.fillRect(0, 0, 1080, 380);
  x.strokeStyle = '#ffffff'; x.lineWidth = 14; x.strokeRect(28, 28, 1024, 1864);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '900 46px Montserrat, sans-serif'; x.fillText('@duniakotak.id', 540, 118);
  x.font = '900 64px Montserrat, sans-serif'; x.fillText(S.tamu ? 'Main di Dunia Kotak' : '@' + S.saya.ig, 540, 205);
  x.font = '700 36px Montserrat, sans-serif'; x.fillStyle = '#ffcf7a'; x.fillText(S.tamu ? 'Dusun ' + NAMA_DUSUN[DI] : alamat(S.saya.no).split(' · ')[0] + ', ' + NAMA_DUSUN[dusunDari(S.saya.no)], 540, 262);
  // ajakan (CTA) di atas zona aman story (teks maks y≈1620)
  const cy = 1430, cw = 900, ch = 190; x.fillStyle = 'rgba(19,20,31,.88)'; x.beginPath(); x.roundRect(540 - cw / 2, cy, cw, ch, 40); x.fill();
  x.fillStyle = '#fff'; x.font = '900 50px Montserrat, sans-serif'; x.fillText('Mau punya rumah di sini?', 540, cy + 78);
  x.fillStyle = '#5cb8ff'; x.font = '800 35px Montserrat, sans-serif'; x.fillText('Daftar gratis: willoapparel.com/duniakotak', 540, cy + 140);
  fotoBlob = await new Promise(r => cv.toBlob(r, 'image/jpeg', .9));
  $('foto').src = URL.createObjectURL(fotoBlob);
}
async function bukaKamera() { $('kamera').hidden = false; bunyi('jepret'); await jepret(); }
$('kArah').onclick = () => { kArah = kArah === 'selfie' ? 'pemandangan' : 'selfie'; jepret(); };
$('kTutup').onclick = () => { $('kamera').hidden = true; };
$('kSimpan').onclick = () => { if (!fotoBlob) return; misiMaju('foto'); const a = document.createElement('a'); a.href = URL.createObjectURL(fotoBlob); a.download = 'dunia-kotak.jpg'; a.click(); };
$('kBagi').onclick = async () => {
  if (!fotoBlob) return; misiMaju('foto'); const f = new File([fotoBlob], 'dunia-kotak.jpg', {type: 'image/jpeg'});
  if (navigator.canShare && navigator.canShare({files: [f]})) { try { await navigator.share({files: [f], text: 'Main di Dunia Kotak @duniakotak.id'}); } catch (e) {} }
  else { $('kSimpan').click(); toast('Foto disimpan. Unggah ke story dari galeri, lalu tag @duniakotak.id.', 4500); }
};
function putar(arah) { yaw += arah * Math.PI / 2; }
// antar = rute lewat jalan + garis biru, jalan otomatis (sama dengan navigasi peta)
function pergiKe(no) { const L = I.lots[no]; if (!L && no === 1 && tokoh.raka) { const p = tokoh.raka.position; mulaiRute({x: p.x, z: p.z + 1.5 * VS, nama: 'Raka & Oyen'}, true); return; } if (!L) { if (dusunDari(no) !== DI) pindahDusun(dusunDari(no), no); return; } mulaiRute({x: L.gate.x, z: L.gate.z + L.dir * 1.2 * VS, nama: 'No. ' + no, kav: no}, true); }

// =====================================================================
// 9. MULAI
// =====================================================================
let zoom = 1, yaw = 0, yawNow = 0;
// ---------- suara: musik latar (orisinal, loop) + efek suara (dibuat langsung, tanpa file) ----------
// Mulai setelah sentuhan pertama (aturan browser). Tombol Suara: Semua -> Efek saja -> Senyap; diingat di HP.
const M = {ctx: null, gain: null, fx: null, buf: null, src: null, mode: baca('dk_suara') || (baca('dk_musik') === '0' ? 'efek' : 'semua')};
const MODE = {semua: '<i>🔊</i>Suara: musik + efek', efek: '<i>🔉</i>Suara: efek saja', senyap: '<i>🔇</i>Suara: senyap'};
function tandaMusik() { $('bMusik').innerHTML = MODE[M.mode] || MODE.semua; }
function siapAudio() {
  if (!M.ctx) {
    M.ctx = new (window.AudioContext || window.webkitAudioContext)();
    M.gain = M.ctx.createGain(); M.gain.gain.value = 0; M.gain.connect(M.ctx.destination);
    M.fx = M.ctx.createGain(); M.fx.gain.value = M.mode === 'senyap' ? 0 : .6; M.fx.connect(M.ctx.destination);
  }
  if (M.ctx.state === 'suspended' && !document.hidden) M.ctx.resume();
  return M.ctx;
}
async function putarMusik() {
  try {
    const c = siapAudio();
    M.fx.gain.setTargetAtTime(M.mode === 'senyap' ? 0 : .6, c.currentTime, .05);
    if (M.mode === 'semua') {
      if (!M.buf) M.buf = await c.decodeAudioData(await (await fetch('musik.mp3')).arrayBuffer());
      if (!M.src) { M.src = c.createBufferSource(); M.src.buffer = M.buf; M.src.loop = true; M.src.connect(M.gain); M.src.start(); }
    }
    M.gain.gain.setTargetAtTime(M.mode === 'semua' ? .35 : 0, c.currentTime, .4);
  } catch (e) { /* tanpa suara kalau browser menolak */ }
}
// nada pendek: frekuensi awal->akhir, durasi, bentuk gelombang, keras
function nada(f0, f1, dur, tipe = 'sine', v = .3, tunda = 0) {
  const c = M.ctx; if (!c || M.mode === 'senyap' || c.state !== 'running') return;
  const t = c.currentTime + tunda, o = c.createOscillator(), g = c.createGain();
  o.type = tipe; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  o.connect(g).connect(M.fx); o.start(t); o.stop(t + dur + .02);
}
let derau = null;
function desis(dur, frek, q, v = .3, tunda = 0) {
  const c = M.ctx; if (!c || M.mode === 'senyap' || c.state !== 'running') return;
  if (!derau) { derau = c.createBuffer(1, c.sampleRate * .5, c.sampleRate); const d = derau.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = c.currentTime + tunda, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = derau; f.type = 'bandpass'; f.frequency.value = frek; f.Q.value = q;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  s.connect(f).connect(g).connect(M.fx); s.start(t, Math.random() * .3); s.stop(t + dur + .02);
}
const SFX = {
  klik: () => nada(1300, 900, .05, 'triangle', .12),
  langkah: () => desis(.07, 380 + Math.random() * 160, 1.2, .22),
  kirim: () => { nada(520, 880, .09, 'sine', .18); nada(880, 1320, .08, 'sine', .12, .06); },
  pesan: () => { nada(1180, 1180, .12, 'sine', .14); nada(1580, 1580, .16, 'sine', .11, .08); },
  emosi: () => nada(300, 900, .12, 'sine', .2),
  masuk: () => [784, 988, 1175].forEach((f, i) => nada(f, f, .35, 'triangle', .1, i * .09)),
  jepret: () => { desis(.05, 3000, .7, .5); nada(2200, 1200, .03, 'square', .06); desis(.08, 1800, .8, .35, .09); },
  buka: () => nada(440, 660, .14, 'triangle', .14),
};
function bunyi(n) { try { SFX[n] && SFX[n](); } catch (e) {} }
function musikSiap() {
  tandaMusik();
  const sekali = () => { removeEventListener('pointerdown', sekali); removeEventListener('keydown', sekali); putarMusik(); };
  addEventListener('pointerdown', sekali); addEventListener('keydown', sekali);
  putarMusik();
  $('bMusik').onclick = () => { M.mode = {semua: 'efek', efek: 'senyap', senyap: 'semua'}[M.mode] || 'semua'; simpan('dk_suara', M.mode); tandaMusik(); putarMusik(); };
  // bunyi klik untuk semua tombol
  document.addEventListener('click', e => { if (e.target.closest('button')) bunyi('klik'); }, true);
  document.addEventListener('visibilitychange', () => { if (M.ctx) document.hidden ? M.ctx.suspend() : (M.mode !== 'senyap' && M.ctx.resume()); });
}

async function mulai() {
  $('masuk').hidden = false; $('masukIsi').innerHTML = '<p class="muat">Membangun desa…</p>';
  await bangunDunia();
  const no = S.tamu ? 1 : S.saya.no; const L = I.lots[no] || I.lots[1] || {gate: I.spawn, dir: 1, c: I.spawn};
  if (I.gedung) { const z = I.gedung.zona(L.gate.x, L.gate.z); I.gedung.masuk(z); zonaKini = I.gedung.kunci(z); }
  pulihShift(); tokoh.saya = buatAvatarObj(avKerja(S.av)); tokoh.saya.position.set(L.gate.x + (S.tamu ? 3 * VS : 0), 0, L.gate.z + L.dir * 1.3 * VS); tokoh.saya.position.y = tanah(tokoh.saya.position.x, tokoh.saya.position.z); tokoh.saya.rotation.y = L.dir === 1 ? 0 : Math.PI; sc.add(tokoh.saya);
  yaw = yawNow = L.dir === 1 ? 0 : Math.PI;   // kamera menghadap depan rumah sendiri
  const L1 = I.lots[1] || {gate: I.spawn.clone().add(new THREE.Vector3(-5 * VS, 0, -2.2 * VS)), dir: 1};
  tokoh.raka = raka('senang'); tokoh.raka.traverse(m => { if (m.isMesh) m.castShadow = true; }); tokoh.raka.position.set(L1.gate.x + 1.6 * VS, 0, L1.gate.z + L1.dir * 1.1 * VS); tokoh.raka.rotation.y = L1.dir === 1 ? .3 : Math.PI + .3; sc.add(tokoh.raka);
  tokoh.oyen = kucingMesh('oranye'); tokoh.oyen.traverse(m => { if (m.isMesh) m.castShadow = true; }); tokoh.oyen.position.set(L1.gate.x + 2.4 * VS, 0, L1.gate.z + L1.dir * 1.7 * VS); sc.add(tokoh.oyen);
  tokoh.oyen.userData.ph = 0;
  npc = buatNPC({sc, I, VS, warga, pose: wpose, siapAv: bersihAv, bayangan: !hemat, tinggi: (x, z, r) => tanah(x, z, r), pasar: () => DI === 'wetan' && pasarBuka()});
  // warga offline jadi NPC (Huda 6 Nov 2026), dimuat di belakang supaya tidak menunda layar masuk
  wnpc = buatWargaNPC({sc, I, VS, warga, pose: wpose, siapAv: bersihAv, bayangan: false, tinggi: (x, z, r) => tanah(x, z, r)});
  muatWargaNPC();
  // kavling di sekitar pemain dibangun dulu sebelum layar dibuka
  for (let i = 0; i < 40; i++) aturKavling(tokoh.saya.position.x, tokoh.saya.position.z);
  $('masuk').hidden = true; $('hud').hidden = false;
  $('profNama').textContent = S.tamu ? 'Tamu' : '@' + S.saya.ig;
  document.querySelectorAll('.namaDusun').forEach(e => { e.textContent = NAMA_DUSUN[DI]; });
  fotoProfil();
  buatPeta();
  hitungOnline(); kabarWarga(); tulisChat(); aturHUD(); sambung();
  if (!baca('dk_panduan')) pemulaKini() ? panduanBaru() : panduan();
  // Voting Fasum muncul sebagai pop up saat masuk game, sekali per hari (Huda 6 Nov 2026), sekalian ambil bintang gratis harian.
  // Wajib pilih (Huda 6 Nov): tanda dk_vt baru disimpan setelah menaruh bintang, jadi muat ulang tidak melewati voting.
  else if (!S.tamu && baca('dk_vt') !== hariIni()) setTimeout(() => bukaVoting(true), 1200);
  if (!S.tamu && baca('dk_ingat') !== hariIni()) setTimeout(ingatKoin, 45e3);
  onResize(); requestAnimationFrame(loop);
  $('chipTujuan').onclick = klikTujuan; tulisTujuan(); siapkanLangkah(); setTimeout(ambilHadir, 2500);
  DG = pasangDesaGabung({DI, NAMA: NAMA_DUSUN, VS, tokoh, tanah, toast, bunyi, pindahBus: d => { const u = new URL(location.href); u.searchParams.set('dusun', d); u.searchParams.delete('ke'); location.href = u.toString(); }});
  { const ke = new URLSearchParams(location.search).get('ke'); if (ke === 'gapura') DG.tiba(); else if (ke) setTimeout(() => keTempat(ke), 1500); }
  $('chipKumpul').onclick = keKumpul;
  setTimeout(pasangBenderaPiala, 3000); setTimeout(kabarBaru, 8000);
  mulaiLamaMain();
}
function aturHUD() {
  $('chat').querySelectorAll('.tab button[data-ch]').forEach(b => b.onclick = () => { S.ch = b.dataset.ch; $('chat').querySelectorAll('.tab button[data-ch]').forEach(x => x.classList.toggle('on', x === b)); tulisChat(); });
  $('formChat').onsubmit = e => { e.preventDefault(); kirimChat($('ketik').value); $('ketik').value = ''; $('ketik').blur(); };
  $('chat').querySelectorAll('.cepat button').forEach(b => b.onclick = () => {
    if (b.dataset.q) return kirimChat(b.dataset.q);
    if (S.tamu) return toast('Daftar jadi warga dulu untuk menyapa.');
    if (S.ws && S.ws.readyState === 1) { S.ws.send(JSON.stringify({t: 'e', e: b.dataset.e})); misiMaju('sapa'); }
  });
  $('bTutupChat').onclick = () => { $('chat').hidden = true; $('bBukaChat').hidden = false; tataHUD(); };
  $('bBukaChat').onclick = () => { $('chat').hidden = false; $('bBukaChat').hidden = true; tataHUD(); };
  $('bRumah').onclick = () => pergiKe(S.tamu ? 1 : S.saya.no);
  $('bKamera').onclick = () => bukaKamera();
  $('profOnline').onclick = () => { $('panelProfil').hidden = true; bukaOnline(); };
  $('dOnline').onclick = e => { e.stopPropagation(); bukaOnline(); };
  $('pfAvatar').onclick = () => { $('panelProfil').hidden = true; bukaPembuatAvatar(JSON.parse(JSON.stringify(S.av)), false); };
  $('pfToko').onclick = () => { $('panelProfil').hidden = true; bukaToko(); };
 $('pfRakit').onclick = bukaRakit; $('tutupRakit').onclick = () => { $('panelRakit').hidden = true; };
  $('panelRakit').addEventListener('click', e => { if (e.target === $('panelRakit')) $('panelRakit').hidden = true; });
  $('pfKode').onclick = () => toast(`Kode wargamu: ${S.saya.kode} · pakai untuk masuk dari HP lain. Jangan dibagikan.`, 6000);
  $('tutupProfil').onclick = () => { $('panelProfil').hidden = true; };
  $('panelProfil').addEventListener('click', e => { if (e.target === $('panelProfil')) $('panelProfil').hidden = true; });
  $('tutupOnline').onclick = () => { $('panelOnline').hidden = true; };
  $('isiOnline').addEventListener('click', e => { const b = e.target.closest('[data-on]'); if (!b) return; $('panelOnline').hidden = true; pergiKe(+b.dataset.on); });
  muatOnline(); setInterval(() => { if (!document.hidden) muatOnline(); }, 60000);
  $('profil').style.cursor = 'pointer';
  $('profil').onclick = bukaProfil;
  $('bAvatar').onclick = () => { $('panelAtur').hidden = true; bukaPembuatAvatar(JSON.parse(JSON.stringify(S.av)), false); };
  $('pfKucing').onclick = () => { $('panelProfil').hidden = true; bukaKucing(); }; $('bDukung').onclick = bukaPendukung;   // Huda 8 Nov 2026: kucing pindah ke profil, deretan atas jadi 👑 Pendukung
  $('bPeringkat').onclick = () => bukaPeringkat(); document.querySelectorAll('#tabPeringkat button').forEach(b => b.onclick = () => tabPeringkat(b.dataset.t)); $('tutupPeringkat').onclick = () => { $('panelPeringkat').hidden = true; };
  $('bMisi').onclick = () => bukaMisi(); $('tutupMisi').onclick = () => { $('panelMisi').hidden = true; };
  muatMisi();
  $('bPanduan').onclick = () => { $('panelAtur').hidden = true; panduan(); };
  $('bAtur').onclick = () => { $('jamAtur').textContent = $('jam').textContent.replace(/\s+/g, ' ').trim(); $('panelAtur').hidden = false; }; $('tutupAtur').onclick = () => { $('panelAtur').hidden = true; };
  $('bVoting').onclick = () => { $('panelAtur').hidden = true; bukaVoting(); };
  $('bAlbum').onclick = () => { $('panelAtur').hidden = true; bukaAlbum(); }; $('tutupAlbum').onclick = () => { $('panelAlbum').hidden = true; };
  $('bAjak').onclick = () => { $('panelAtur').hidden = true; bukaAjak(); }; $('tutupAjak').onclick = () => { $('panelAjak').hidden = true; };
  $('bPendukung').onclick = bukaPendukung; $('tutupPendukung').onclick = () => { $('panelPendukung').hidden = true; };
  siapIklan();
  $('bProfesi').onclick = () => { $('panelAtur').hidden = true; bukaProfesi(); }; $('pfProfesiB').onclick = () => { $('panelProfil').hidden = true; bukaProfesi(); }; $('tutupProfesi').onclick = () => { $('panelProfesi').hidden = true; };
  $('bToko').onclick = () => { $('panelAtur').hidden = true; bukaToko(); }; $('tutupToko').onclick = () => { $('panelToko').hidden = true; }; $('tutupVoting').onclick = () => { if (vtWajib) return toast('Taruh 1 bintang gratismu di fasum pilihanmu dulu ya ⭐', 3000); $('panelVoting').hidden = true; };
  $('panelAtur').addEventListener('click', e => { if (e.target === $('panelAtur')) $('panelAtur').hidden = true; });
  $('bDusun').onclick = pilihDusun;
  musikSiap();
  // pointerdown (bukan click): click tidak terpicu di HP saat jari lain masih menahan joystick -> bisa lompat sambil lari
  $('sLari').onclick = ikutLari; $('sBangun').onclick = ikutBangun; $('sPasar').onclick = bukaPasar;
  $('bPasar').onclick = () => { $('panelAtur').hidden = true; bukaPasar(); }; $('tutupPasar').onclick = () => { $('panelPasar').hidden = true; };
  $('sLift').onclick = () => { const d = I.gedung && I.gedung.dekatLift(tokoh.saya.position.x, tokoh.saya.position.z); if (d) bukaLift(d); };
  $('sLompat').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); mulaiLompat(); }); $('sTendang').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); skillTendang(); }); $('sAmbil').onclick = () => skillAmbil(); $('sMancing').onclick = () => skillMancing(); $('sMakan').onclick = () => skillMakan(); $('sPanen').onclick = () => skillPanen(); $('sTanam').onclick = () => bukaTanam(); $('sJual').onclick = () => skillJual(); $('sKerja').onclick = () => skillKerja(); $('sSuka').onclick = () => sukaRumah(); $('tutupKerja').onclick = () => { $('panelKerja').hidden = true; }; $('tutupTanam').onclick = () => { $('panelTanam').hidden = true; };
  // semua tombol skill bereaksi saat disentuh (pointerdown), jadi tetap jalan walau jari lain menahan joystick
  for (const b of document.querySelectorAll('.zoom.skill button')) { const f = b.onclick; if (!f) continue; b.onclick = null; b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); f.call(b, e); }); }
  if (innerHeight < 500) { $('chat').hidden = true; $('bBukaChat').hidden = false; zoom = .85; }
  if (portrait() && innerWidth <= 700) { $('chat').hidden = true; $('bBukaChat').hidden = false; }
}
// Pemain baru: sambutan singkat (2 kalimat), sisanya diajarkan lewat tujuan 🎯 satu per satu. Panduan lengkap tetap di ⚙ Atur.
function panduanBaru() {
  dialogRaka([
    `Halo @${S.saya.ig}! Aku Raka, ini Oyen. Selamat datang di rumah barumu: ${alamat(S.saya.no)}.`,
    `Ikuti 🎯 tujuan di atas layar. Tiap tujuan selesai langsung dapat koin, total 100 🪙 + 10 💎 buat hias rumahmu. Pertama: pakai joystick, jalan masuk ke pekaranganmu.`,
  ], () => simpan('dk_panduan', '1'));
}
function dialogRaka(L, akhir) {
  let i = 0; const d = $('dialog');
  const tutup = () => { d.hidden = true; akhir && akhir(); };
  const tampil = () => { $('dialogTeks').textContent = L[i]; $('dLanjut').textContent = i === L.length - 1 ? 'Siap!' : 'Lanjut'; $('dLewati').hidden = L.length < 2 || i === L.length - 1; gelembung('raka', '👋', true); };
  d.hidden = false; tampil();
  $('dLanjut').onclick = () => { i++; if (i >= L.length) tutup(); else tampil(); };
  $('dLewati').onclick = tutup;
}
function panduan() {
  const nama = S.tamu ? 'tamu' : '@' + S.saya.ig;
  const L = [
    `Halo ${nama}! Aku Raka, ini Oyen. Selamat datang di Dusun ${NAMA_DUSUN[DI]}!`,
    S.tamu ? 'Kamu sedang lihat-lihat sebagai tamu. Daftar jadi warga di willoapparel.com/duniakotak supaya dapat kavling dan bisa ngobrol.' : `Rumahmu di ${alamat(S.saya.no)}. Batu di depan rumah sudah terukir namamu.`,
    'Jalan pakai joystick di kiri bawah, dorong penuh untuk lari. Geser layar untuk memutar kamera, cubit untuk zoom. Di laptop: WASD, Shift lari, roda mouse zoom.',
    'Tombol kanan bawah itu skill-mu: ✋ ambil barang di jalan, 🎣 mancing di pinggir sungai, 🐟 beri makan kucing pakai ikan hasil mancing. Tombolnya menyala kalau bisa dipakai.',
    'Chat Sekitar terlihat warga di dekatmu, Chat Desa untuk semua warga di semua dusun. Ketuk nama warga untuk lihat rumahnya, bisukan, atau laporkan.',
    'Cek 📋 Misi tiap hari untuk dapat koin. Sekarang ayo jalan-jalan dan sapa tetangga. Meong! kata Oyen.',
  ];
  dialogRaka(L, () => simpan('dk_panduan', '1'));
}

// =====================================================================
// 10. LOOP
// =====================================================================
const KEC = 15;
// tinggi pijakan: dek jembatan lebih tinggi dari jalan
const tanahDasar = (x, z) => { if (I.tanah) return I.tanah(x, z); const d = I.dek; return d && x > d.x0 && x < d.x1 && d.z.some(([a, c]) => z > a && z < c) ? d.y : 0; };
// Semua permukaan datar yang lebih tinggi (lantai fasum, tribun, bangku, tepi sungai, trotoar) bisa dipijak.
// Saat dunia dibangun (sebelum digabung), kotak tiap benda yang cukup lebar dicatat ke grid; tinggi pijakan = puncak kotak.
const PETAK_PJ = 10, NAIK_MAKS = .7 * VS, gridPJ = new Map();
function kumpulPijakan(root) {
  if (!root) return; root.updateMatrixWorld(true);
  const bb = new THREE.Box3(), m = new THREE.Matrix4(), im = new THREE.Matrix4();
  const catat = () => {
    if (bb.max.y <= .05 || bb.max.y > 40 * VS || bb.max.x - bb.min.x < 1.2 || bb.max.z - bb.min.z < 1.2) return;
    const k = [bb.min.x, bb.max.x, bb.min.z, bb.max.z, bb.max.y];
    for (let i = Math.floor(k[0] / PETAK_PJ); i <= Math.floor(k[1] / PETAK_PJ); i++) for (let j = Math.floor(k[2] / PETAK_PJ); j <= Math.floor(k[3] / PETAK_PJ); j++) {
      const key = i * 100003 + j; let a = gridPJ.get(key); if (!a) gridPJ.set(key, a = []); a.push(k);
    }
  };
  root.traverse(o => {
    if (!o.isMesh || !o.geometry || o.userData.bukanPijakan) return;
    const mt = o.material; if (mt && !Array.isArray(mt) && mt.transparent && mt.opacity < .9) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    if (o.isInstancedMesh) { for (let n = 0; n < o.count; n++) { o.getMatrixAt(n, im); m.multiplyMatrices(o.matrixWorld, im); bb.copy(o.geometry.boundingBox).applyMatrix4(m); catat(); } }
    else { bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); catat(); }
  });
}
function permukaan(x, z) { return gridPJ.get(Math.floor(x / PETAK_PJ) * 100003 + Math.floor(z / PETAK_PJ)) || []; }
// ref = tinggi kaki saat ini: hanya permukaan yang bisa dinaiki (≤ NAIK_MAKS di atas kaki) yang dipakai, jadi atap/pohon tidak ikut.
const tanah = (x, z, ref) => {
  const g = tanahDasar(x, z); if (!gridPJ.size) return g;
  const r = (ref == null ? g : ref) + NAIK_MAKS; let best = g;
  for (const k of permukaan(x, z)) if (x >= k[0] && x <= k[1] && z >= k[2] && z <= k[3] && k[4] <= r && k[4] > best) best = k[4];
  return best;
};
const lompat = {vy: 0, diTanah: true};
function mulaiLompat() { if (!lompat.diTanah || !tokoh.saya) return; lompat.vy = gerak.lari && gerak.jalan ? 38 : 34; lompat.diTanah = false; bunyi('langkah'); misiMaju('lompat'); if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify({t: 'e', e: 'lompat'})); }   // satuan dunia per detik (avatar setinggi pintu ≈ 4,1)
let tAkhir = performance.now(), tKav = 0, ph = 0, camY = 0;
const bebas = (x, z) => {
  const b = I.batas; if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return false;
  const s = I.sungai; if (s && x > s.x0 && x < s.x1 && !s.jembatan.some(([a, c]) => z > a && z < c)) return false;
  if (I.air && I.air(x, z)) return false;   // danau & sungai Kotak Tlaga (dermaga & jembatan boleh)
  if (I.tanah && tokoh.saya && Math.abs(I.tanah(x, z) - tokoh.saya.position.y) > 3.2 && lompat.diTanah) return false;   // dinding teras: lewat tanjakan
  if (I.gedung) for (const [x0, x1, z0, z1] of I.gedung.rects) if (x > x0 - 1.2 && x < x1 + 1.2 && z > z0 - 1.2 && z < z1 + 1.2) return false;
  for (const {rects} of lotRuntime.values()) for (const [x0, x1, z0, z1] of rects) if (x > x0 - 1.2 && x < x1 + 1.2 && z > z0 - 1.2 && z < z1 + 1.2) return false;
  for (const f of fasumBangun) { const r = f.rect; if (!r || x < r[0] - 1.2 || x > r[1] + 1.2 || z < r[2] - 1.2 || z > r[3] + 1.2) continue;
    for (const k of f.dinding || [r]) if (x > k[0] - 1.2 && x < k[1] + 1.2 && z > k[2] - 1.2 && z < k[3] + 1.2) return false; }
  return true;
};
// kualitas menyesuaikan HP: kalau rata-rata < 28 fps, turunkan resolusi lalu matikan bayangan
const kualitas = {n: 0, jml: 0, tingkat: 0, mulai: 0};
function aturKualitas(t, dtAsli) {
  if (document.hidden || dtAsli > .5) return;
  if (!kualitas.mulai) kualitas.mulai = t;
  kualitas.n++; kualitas.jml += dtAsli;
  if (t - kualitas.mulai < 4000) return;
  const fps = kualitas.n / kualitas.jml; kualitas.n = 0; kualitas.jml = 0; kualitas.mulai = t;
  if (fps >= 28 || kualitas.tingkat >= 3) return;
  kualitas.tingkat++;
  // tidak pernah di bawah 1x supaya gambar tetap tajam
  if (kualitas.tingkat === 1 && R.shadowMap.enabled) { R.shadowMap.enabled = false; I.light.castShadow = false; sc.traverse(m => { if (m.material) [].concat(m.material).forEach(x => { x.needsUpdate = true; }); }); }
  else if (kualitas.tingkat <= 2) R.setPixelRatio(Math.min(1.25, DPR));
  else { R.setPixelRatio(1); jarak.rx = 95; jarak.zf = 125; }
  onResize();
}
function loop(t) {
  requestAnimationFrame(loop);
  const dtAsli = (t - tAkhir) / 1000;
  const dt = Math.min(.05, dtAsli); tAkhir = t; if (I) aturKualitas(t, dtAsli);
  const me = tokoh.saya; let vx = 0, vz = 0;
  if (DG) DG.cek(me);
  if (BENDERA_PIALA) kibarPiala(t / 1000);
  const k = gerak.kunci;
  if (k['w'] || k['arrowup']) vz -= 1; if (k['s'] || k['arrowdown']) vz += 1; if (k['a'] || k['arrowleft']) vx -= 1; if (k['d'] || k['arrowright']) vx += 1;
  if (gerak.stik) { vx += gerak.stik.x; vz += gerak.stik.y; }
  if (vx || vz) { const sn = Math.sin(yawNow), cs = Math.cos(yawNow); const ax = vx * cs + vz * sn, az = -vx * sn + vz * cs; vx = ax; vz = az; }
  if (vx || vz) { gerak.tujuan = null; rute.antar = false; }
  else if (gerak.tujuan) { const dx = gerak.tujuan.x - me.position.x, dz = gerak.tujuan.z - me.position.z, l = Math.hypot(dx, dz); if (l < 1.5) gerak.tujuan = null; else { vx = dx / l; vz = dz / l; } }
  const l = Math.hypot(vx, vz); gerak.jalan = l > .15;
  if (gerak.jalan) {
    const lari = (gerak.stik && gerak.stik.lari) || k['shift']; gerak.lari = lari;
    const s = Math.min(1, l) * KEC * (lari ? 1.75 : 1) * dt / l; if (mancing.on) { mancing.on = false; mancing.batal(); } const nx = me.position.x + vx * s, nz = me.position.z + vz * s;
    let maju = false;
    if (bebas(nx, me.position.z)) { me.position.x = nx; maju = true; }
    if (bebas(me.position.x, nz)) { me.position.z = nz; maju = true; }
    if (!maju) gerak.tujuan = null;
    const tr = Math.atan2(vx, vz); let dr = tr - me.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); me.rotation.y += dr * Math.min(1, dt * 12);
    const lk = Math.floor(ph / Math.PI); ph += dt * (lari ? 17 : 11); if (Math.floor(ph / Math.PI) !== lk) { bunyi('langkah'); misiMaju('jalan'); if (lari) misiMaju('lari'); } jalanAnim(me, ph, lari ? 1.05 : .7);
  } else jalanAnim(me, 0, 0);
  { const g = tanah(me.position.x, me.position.z, me.position.y);
    if (lompat.diTanah) { me.position.y += (g - me.position.y) * Math.min(1, dt * 18); }
    else { lompat.vy -= 95 * dt; me.position.y += lompat.vy * dt; if (me.position.y <= g) { me.position.y = g; lompat.vy = 0; lompat.diTanah = true; } }
    if (!lompat.diTanah) { const a = Math.min(1, me.position.y / 6); wpose(me, {legL: -.5 * a, legR: .4 * a, armL: -2.4 * a, armR: -2.4 * a}); } }
  cekMisiDekat(me); cekDalamFasum(me); cekDalamRumah(me); jalanRute(t);
  // warga lain: interpolasi
  for (const o of S.others.values()) {
    const p = o.obj.position; const a = Math.min(1, dt * 8); if (Math.abs(o.tx - p.x) + Math.abs(o.tz - p.z) > 300) { p.x = o.tx; p.z = o.tz; } p.x += (o.tx - p.x) * a; p.z += (o.tz - p.z) * a;
    if (o.lompat) { o.lompat.vy -= 95 * dt; o.lompat.y += o.lompat.vy * dt; if (o.lompat.y <= 0) o.lompat = null; }
    p.y += (tanah(p.x, p.z, p.y - (o.lompat ? o.lompat.y : 0)) + (o.lompat ? o.lompat.y : 0) - p.y) * (o.lompat ? 1 : a);
    let dr = o.tr - o.obj.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); o.obj.rotation.y += dr * a;
    const jalan = o.a && performance.now() - (o.akhir || 0) < 600; if (jalan) { o.ph += dt * 11; jalanAnim(o.obj, o.ph, .7); } else jalanAnim(o.obj, 0, 0);
  }
  // Raka menghadap pemain bila dekat, Oyen mengibas
  const dR = tokoh.raka.position.distanceTo(me.position);
  if (dR < 40) { const tr = Math.atan2(me.position.x - tokoh.raka.position.x, me.position.z - tokoh.raka.position.z); let dr = tr - tokoh.raka.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); tokoh.raka.rotation.y += dr * Math.min(1, dt * 4); }
  if (dR < 25 && !tokoh.raka.userData.sapa) { tokoh.raka.userData.sapa = 1; gelembung('raka', S.tamu ? 'Halo! Yuk daftar jadi warga 😄' : 'Halo @' + S.saya.ig + '! Mampir ke warungku ya.'); }
  if (dR > 60) tokoh.raka.userData.sapa = 0;
  for (const c of kucingHidup) { const u = c.userData; u.ph += dt; c.position.y = Math.max(0, Math.sin(u.ph * 1.3)) * .12; c.rotation.y = u.ry + Math.sin(u.ph * .4) * .5; }
  animSkill(dt, me);
  if (wnpc) wnpc.update(dt, me, new Set(S.others.keys()), S.saya?.no, KEC);
  if (npc) { const L = BOLA.m && BOLA.m.visible ? bolaLapangan() : null; npc.update(dt, me, jamWIB(), KEC, L ? {L, x: BOLA.x, z: BOLA.z, vx: BOLA.vx, vz: BOLA.vz, golT: BOLA.golT} : null); sapaNPC(t, me); }
  bolaUpdate(dt, me);
  tokoh.oyen.userData.ph += dt; tokoh.oyen.position.y = Math.abs(Math.sin(tokoh.oyen.userData.ph * 1.3)) * .15;
  // kamera ikut pemain (dikunci di dalam hutan pembatas)
  const tx = me.position.x, tz = me.position.z, ty = me.position.y; camY += (ty - camY) * Math.min(1, dt * 5);
  let dy = yaw - yawNow; yawNow += dy * Math.min(1, dt * 6);
  const sn = Math.sin(yawNow), cs = Math.cos(yawNow);
  cam.position.set(tx + sn * 58 * zoom, camY + 40 * zoom, tz + cs * 58 * zoom); cam.lookAt(tx - sn * 14, camY + 2, tz - cs * 14);
  // bayangan ikut pemain
  I.light.position.set(tx + 60, camY + 100, tz + 72); I.light.target.position.set(tx, camY, tz); I.light.target.updateMatrixWorld();
  // kavling dekat dibangun bertahap
  if (t - tKav > (hemat ? 200 : 120) && dtAsli < .034) { tKav = t; aturKavling(tx, tz); }
  siangMalam(t);
  kirimPos(false);
  R.render(sc, cam);
  gambarPetaMini(t);
  // label
  pool.forEach(d => { d.dipakai = false; }); taruh.length = 0;
  const lbl = (o, h, teks, cls, no, idNpc) => { const el = tempel(o, h, teks, cls); if (el) { el.dataset.no = no || ''; el.dataset.npc = idNpc || ''; } return el; };
  lbl(me, 5.2, S.tamu ? 'Kamu (tamu)' : lencana(S.saya.no) + '@' + S.saya.ig, 'nm saya');
  lbl(tokoh.raka, 5.2, '★ Raka', 'nm raka'); lbl(tokoh.oyen, 2.6, 'Oyen', 'nm raka kucing');
  for (const c of [tokoh.oyen, ...kucingHidup]) if (c.userData.senang > performance.now()) tempel(c, 4.2, '❤️ nyam!', 'gel emo', -4);
  for (const it of itemDunia) if (it.position.distanceTo(me.position) < 45) tempel(it, 3.4, it.userData.jenis.ikon, 'nm item');
  if (mancing.on) tempel(me, 6.6, mancing.teks, 'gel emo', -4);
  for (const c of kucingHidup) if (c.userData.nama && c.position.distanceTo(me.position) < 60) lbl(c, 2.6, c.userData.nama, 'nm kucing');
  for (const [no, o] of S.others) if (o.obj.position.distanceTo(me.position) < 220) lbl(o.obj, 5.2, (S.bisu.has(no) ? '🔇 ' : '') + lencana(no) + '@' + o.ig, 'nm', no);
  if (npc) for (const n of npc.daftar) if (n.obj.visible && n.jauh < 130) { const lap = n.kerja === 'bola' || n.kerja === 'main' || n.wasit; lbl(n.obj, n.tinggi, n.nama + ' · ' + n.peran, lap ? 'nm' : 'nm npc', '', lap ? '' : n.id); }   // pemain & wasit sedang bertanding: tidak bisa diajak ngobrol
  if (wnpc) for (const n of wnpc.daftar) if (n.obj.visible && n.jauh < 110) lbl(n.obj, 5.2, (n.gotong >= 0 ? '🔨 ' : '') + '@' + n.u, 'nm npcw');
  for (const f of fasumBangun) { const d = Math.hypot(f.position.x - me.position.x, f.position.z - me.position.z); if (d < 170) lbl(f, f.tinggi, f.nama, 'nm fasum'); }
  jejakWarga(me);
  const now = performance.now();
  for (const o of [me, tokoh.raka, ...[...S.others.values()].map(x => x.obj), ...(npc ? npc.daftar.filter(n => n.obj.visible).map(n => n.obj) : [])]) { const g = o.userData.gel; if (g && g.sampai > now) tempel(o, 6.6, g.m, g.emo ? 'gel emo' : 'gel', -4); }
  pool.forEach(d => { if (!d.dipakai && d.el.style.display !== 'none') d.el.style.display = 'none'; });
}
// ---------- NPC: sapaan sekitar + obrolan pilihan jawaban ----------
const jamWIB = () => { const d = new Date(Date.now() + 7 * 3600e3); return d.getUTCHours() + d.getUTCMinutes() / 60; };
let sapaT = 0;
function sapaNPC(t, me) {
  if (t - sapaT < 7000) return; sapaT = t;
  const dekat = npc.daftar.filter(n => n.obj.visible && n.jauh < 70 && !n.ngobrol && n.kerja !== 'bola' && n.kerja !== 'main' && !n.wasit);   // pemain & wasit di lapangan tanpa gelembung obrolan (Huda 6 Nov)
  if (!dekat.length) return;
  const n = dekat[Math.floor(npc.acak() * dekat.length)];
  n.obj.userData.gel = {m: n.sapa[Math.floor(npc.acak() * n.sapa.length)], sampai: performance.now() + 4000};
}
const pernahSapa = new Set();
const lalu = ms => { const m = Math.max(1, Math.round((Date.now() - ms) / 60000)); return m < 60 ? m + ' menit lalu' : m < 1440 ? Math.round(m / 60) + ' jam lalu' : Math.round(m / 1440) + ' hari lalu'; };
function kabarDesa() {
  const jml = Object.keys(NM).length;
  const ak = Object.entries(AK).filter(([no]) => +no !== S.saya?.no && NM[no]).sort((a, b) => b[1] - a[1]);
  const L = [`Sekarang sudah ${jml} warga Dunia Kotak. Dusun Kotak Tlaga di tepi danau punya dermaga dan perahu, enak buat mancing.` + (NAMA_DUSUN.segara ? ' Warga baru sekarang tinggal di apartemen Dusun Kotak Segara, kota menara di tepi teluk. Naik liftnya, lihat pemandangannya!' : ' Kalau empat dusun sudah penuh, Dusun Kotak Segara di tepi teluk akan dibuka.')];
  if (ak[0]) L.push(`Tadi ${NM[ak[0][0]]} main ke desa, ${lalu(ak[0][1])}. Rumahnya No. ${ak[0][0]}, mampir saja.`);
  L.push('Sudah ada masjid, gereja, gereja Katolik, pura, vihara, klenteng, SD, dan Warung Desa. Hasil voting warga juga sudah berdiri: Supermarket dekat rumah Raka, lalu Rumah Sakit, Stadion, dan Kampus di ujung selatan desa. Pintunya terbuka, masuk saja!');
  L.push('Kebun sudah buka! Tanam bibit di pekarangan, panen 6 jam lagi, lalu jual di warung.');
  return L[Math.floor(npc.acak() * L.length)];
}
function petunjuk() {
  if (S.tamu) return 'Daftar jadi warga dulu di willoapparel.com/duniakotak, nanti dapat rumah, misi harian, dan koin.';
  const m = MISI.find(x => !MS.selesai.has(x.id));
  if (!m) return 'Wah, misimu hari ini sudah selesai semua. Hebat! Besok ada misi baru jam 00.00 WIB.';
  return `Misi yang belum: ${m.ikon} ${m.judul}. ${m.info || 'Cek tombol 📋 Misi untuk lihat semuanya.'}`;
}
let lawan = null;
function ngobrol(n) {
  if (lawan && lawan !== n) lawan.ngobrol = false;
  lawan = n; n.ngobrol = true; gerak.tujuan = null;
  if (!pernahSapa.has(n.id)) { pernahSapa.add(n.id); misiMaju('sapa'); } misiMaju('npc', 1, n.id);
  const j = jamWIB(), salam = j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 18.5 ? 'Selamat sore' : 'Selamat malam';
  const nama = S.tamu ? 'Nak' : '@' + S.saya.ig;
  tampilNgobrol(n, `${salam}, ${nama}! Aku ${n.nama}, ${n.peran.toLowerCase()} di sini.`);
  bunyi('pesan');
}
function tampilNgobrol(n, teks) {
  const d = $('ngobrol'); d.hidden = false;
  d.querySelector('.siapa').textContent = n.nama + ' · ' + n.peran + ' (NPC)';
  $('ngobrolTeks').textContent = teks;
  n.obj.userData.gel = {m: '💬', emo: true, sampai: performance.now() + 1500};
}
document.addEventListener('click', e => {
  const b = e.target.closest('#ngobrol [data-tanya]'); if (!b || !lawan) return;
  const q = b.dataset.tanya, n = lawan;
  if (q === 'dadah') { n.ngobrol = false; lawan = null; $('ngobrol').hidden = true; n.obj.userData.gel = {m: 'Dadah! 👋', sampai: performance.now() + 2500}; return; }
  const teks = q === 'apa' ? n.kegiatan[Math.floor(npc.acak() * n.kegiatan.length)] : q === 'kabar' ? kabarDesa() : petunjuk();
  tampilNgobrol(n, teks); bunyi('klik');
});
// ---------- pindah dusun lewat terminal bus ----------
// pilih dusun tujuan bus (3 dusun sejak 6 Nov 2026)
function pilihDusun() {
  let p = $('pilihDusun');
  if (!p) {
    p = document.createElement('div'); p.id = 'pilihDusun';
    p.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(10,12,20,.45)';
    p.innerHTML = `<div style="background:#fffaf0;border-radius:18px;padding:16px 16px 12px;min-width:250px;max-width:86vw;font:600 15px Montserrat,sans-serif;color:#2a2a2a;box-shadow:0 10px 30px rgba(0,0,0,.3)">
      <div style="font-weight:900;font-size:17px;margin-bottom:10px">🚌 Naik bus ke dusun mana?</div>
      ${Object.entries(NAMA_DUSUN).map(([k, n]) => `<button data-d="${k}" style="display:block;width:100%;margin:6px 0;padding:11px 12px;border-radius:12px;border:2px solid #cbbd9e;background:#fff;font:700 15px Montserrat,sans-serif;text-align:left;cursor:pointer">${{wetan: '🌾', kulon: '🍃', curug: '💦', tlaga: '🛶', segara: '🏙️'}[k]} Dusun ${n}<span class="ini" style="float:right;color:#2a9a5a;font-size:12px"></span></button>`).join('')}
      <button data-d="" style="display:block;width:100%;margin-top:8px;padding:9px;border:0;background:none;font:700 14px Montserrat,sans-serif;color:#777;cursor:pointer">Batal</button></div>`;
    p.onclick = e => { const b = e.target.closest('button'); if (e.target === p || (b && !b.dataset.d)) { p.hidden = true; return; } if (b && b.dataset.d && b.dataset.d !== DI) { const u = new URL(location.href); u.searchParams.set('dusun', b.dataset.d); u.searchParams.delete('ke'); location.href = u.toString(); } };
    document.body.appendChild(p);
  }
  p.querySelectorAll('button[data-d]').forEach(b => { const s = b.querySelector('.ini'); if (s) s.textContent = b.dataset.d === DI ? 'kamu di sini' : ''; });
  p.hidden = false;
}
function pindahDusun(ke, no) {
  if (ke === DI) return;
  if (!confirm(`Naik bus ke Dusun ${NAMA_DUSUN[ke]}?` + (no ? ` Rumah No. ${no} ada di sana.` : ''))) return;
  const u = new URL(location.href); u.searchParams.set('dusun', ke); location.href = u.toString();
}
// ---------- jejak warga asli: kapan terakhir main, tampil di depan rumahnya ----------
const titikRumah = {position: new THREE.Vector3()};
function jejakWarga(me) {
  if (!I.proxy) return;
  let k = 0;
  for (const [n, L] of I.proxy.isi) {
    const no = +n; if ((no === 1 && DI === 'wetan') || no === S.saya?.no || !NM[no]) continue;
    if (Math.abs(L.gate.x - me.position.x) > 45 || Math.abs(L.gate.z - me.position.z) > 45) continue;
    let online = false; for (const [x] of S.others) if (x === no) { online = true; break; }
    titikRumah.position.set(L.gate.x, L.c.y || 0, L.gate.z);
    const el = tempel(titikRumah, 3.2, online ? '🟢 sedang main' : AK[no] ? '🕓 main ' + lalu(AK[no]) : '🏠 rumah ' + NM[no], 'nm jejak'); if (el) { el.dataset.no = ''; el.dataset.npc = ''; }
    if (++k >= 6) break;
  }
}
function kabarWarga() {
  const ak = Object.entries(AK).filter(([no]) => +no !== S.saya?.no && NM[no]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (ak.length) tambahChat('sekitar', '', 'Baru-baru ini main: ' + ak.map(([no, t]) => `${NM[no]} (${lalu(t)})`).join(', '), 'sistem');
}

// siang/malam ikut jam WIB
let tSM = 0;
function siangMalam(t) {
  if (t - tSM < 5000 && tSM) return; tSM = t;
  const d = new Date(Date.now() + 7 * 3600e3), j = d.getUTCHours() + d.getUTCMinutes() / 60;
  const terang = j < 5 || j > 19.5 ? 0 : j < 6.5 ? (j - 5) / 1.5 : j > 18 ? (19.5 - j) / 1.5 : 1;
  terangNow = terang;
  const langit = new THREE.Color(0x1a2448).lerp(new THREE.Color(0xbfe4ff), terang);
  sc.background = langit; sc.fog.color = langit; I.light.intensity = .5 + 1.9 * terang; R.toneMappingExposure = .85 + .4 * terang;
  const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  if ($('chipDusun') && $('chipDusun')._d !== DI) { $('chipDusun')._d = DI; $('chipDusun').innerHTML = `📍 <b>Dusun ${NAMA_DUSUN[DI]}</b>`; }
  $('jam').innerHTML = `<span class="dsn">Dusun ${NAMA_DUSUN[DI]} · </span>${HARI[d.getUTCDay()]} ${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')} ${terang > .5 ? '☀️' : '🌙'}<small>🌱 Tanam di kebun rumahmu · jual di warung</small>`;
}
function onResize() {
  R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.fov = innerWidth / innerHeight < 1 ? 55 : 38; cam.updateProjectionMatrix();
  $('miring').hidden = !(portrait() && innerWidth < 760 && !tegakSesi);
}
addEventListener('resize', onResize);
// pilihan "tetap tegak" hanya untuk sekali buka game (Huda 3 Nov: jangan nyangkut di mode tegak)
var tegakSesi = false; try { localStorage.removeItem('dk_tegak'); } catch (e) {}
$('tetapTegak').onclick = () => { tegakSesi = true; $('miring').hidden = true; };
onResize();
layarMasuk();
window.__dk = {S, HS, segara: () => ({I, tokoh, bukaLift, pindahZona}), peta: () => peta, voting: w => bukaVoting(w), wnpc: () => wnpc, avAcak: n => avAcak(n), proyek: aturProyek, iklan: siapIklan, tonton: tontonIklan, rectLot: (n, a, b, c, d) => rectLot(I.lots[n], a, b, c, d), mancing: () => skillMancing(), dekatAir: () => dekatAir(tokoh.saya), tulisDana, VT: v => { VT = v; tulisVoting(); $('panelVoting').hidden = false; }, segarKebun, kebunSiap: () => { kebunTahap = null; segarKebun(); }, profil: bukaProfil, tanam: () => bukaTanam(), profesi: () => bukaProfesi(), kerja: () => skillKerja(), sh: () => SH, bisaKerja: () => bisaKerja(tokoh.saya), makan: () => skillMakan(), segar: hitungOnline, ulangKav: bangunUlangKavling, rute: () => rute, nav: () => navSiap(), npc: () => npc, fasum: fasumBangun, gerak, bebas: (x, z) => bebas(x, z), taruhBola: (x, z) => { BOLA.x = x; BOLA.z = z; BOLA.vx = BOLA.vz = 0; }, bola: () => { const f = I.fas[12]; return {dx: +(BOLA.x - f.x).toFixed(1), dz: +(BOLA.z - f.z).toFixed(1), v: +Math.hypot(BOLA.vx, BOLA.vz).toFixed(1)}; }, I: () => I, tanah: (x, z, r) => tanah(x, z, r), tokoh, lotRuntime, R, kamera: (z, y) => { zoom = z; if (y != null) yaw = y; }};
