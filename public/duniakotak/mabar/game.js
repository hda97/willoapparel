// Mabar Dunia Kotak — Dusun Kotak Wetan. Denah baku (village) + aset video (rumah, pekarangan, batu nama,
// warung panen, rumah kucing, avatar, Raka, Oyen). Online lewat /duniakotak/api/ruang (WebSocket).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {raka, pose as rpose, reseed} from './js/lib.js';
import * as D from './js/desa.js';
import {warga, pose as wpose, KULIT, WARNA_RAMBUT, GAYA_RAMBUT} from './js/aset/avatar.js';
import {kucingMesh, WARNA_KUCING, DAFTAR_KUCING} from './js/aset/kucing.js';
import {warungMesh, rumahKucingMesh, WARNA_DINDING, WARNA_ATAP} from './js/aset/rumah.js';
import * as F from './js/aset/fasum.js';
import {buatNPC} from './js/npc.js';

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
const alamat = n => { const rt = Math.ceil(n / 20); return `Jl. ${JALAN[(rt - 1) % JALAN.length]} No. ${((n - 1) % 20) + 1} · RT ${String(rt).padStart(2, '0')}/RW ${String(Math.ceil(rt / 5)).padStart(2, '0')}`; };

// ---------- avatar: hanya pilihan yang ada di aset ----------
const ATASAN = ['kaos','kaos-willo','kemeja','jaket','batik','seragam'];
const BAWAHAN = {L: ['celana','pendek','sarung'], P: ['celana','rok','rok-panjang']};
const WARNA_BAJU = ['#1d1d22','#f4f4f4','#3a7bd5','#d0442f','#2a9a5a','#f2c14e','#8a5ad8','#e06a9a'];
const WARNA_BAWAH = ['#2f3a52','#1d1d22','#6a5a48','#3a5a3a','#7a2a2a','#c8b89a'];
const hexOk = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
function bersihAv(a) {
  a = a && typeof a === 'object' ? a : {};
  const jenis = a.jenis === 'P' ? 'P' : 'L';
  const gaya = GAYA_RAMBUT[jenis].includes(a.rambut && a.rambut.gaya) ? a.rambut.gaya : GAYA_RAMBUT[jenis][0];
  return {
    jenis, kulit: KULIT.includes(a.kulit) ? a.kulit : KULIT[1],
    rambut: {gaya, warna: hexOk(a.rambut && a.rambut.warna) ? a.rambut.warna : WARNA_RAMBUT[0]},
    atasan: {jenis: ATASAN.includes(a.atasan && a.atasan.jenis) ? a.atasan.jenis : 'kaos', warna: hexOk(a.atasan && a.atasan.warna) ? a.atasan.warna : '#3a7bd5'},
    bawahan: {jenis: BAWAHAN[jenis].includes(a.bawahan && a.bawahan.jenis) ? a.bawahan.jenis : 'celana', warna: hexOk(a.bawahan && a.bawahan.warna) ? a.bawahan.warna : '#2f3a52'},
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
async function layarMasuk() {
  const isi = $('masukIsi');
  const lama = bacaJ('dk_warga');
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
  if (s) { S.saya = s; S.kunci = s.kunci; simpan('dk_warga', {no: s.no, ig: s.ig, kunci: s.kunci}); }
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
    try { if (!S.tamu) await api('avatar', {kunci: S.kunci, avatar: av}); S.av = bersihAv(av); $('buatAvatar').hidden = true; if (pertama) mulai(); else gantiAvatarSaya(); }
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
let I = null, NM = {}, KC = {}, AK = {}, npc = null;   // AK: no → terakhir main (ms)   // KC: no → kucing warga {k:[{w,n}], d, a}
const lotRuntime = new Map();   // no → {g, extra, rects}
const dekor = new Map();        // rects statis tambahan

// Kotak Wetan: 12 baris = kavling 1-200 (denah baku). Baris 13-15 = perluasan selatan untuk warga 201-260 (3 Nov 2026).
// Kavling lama tidak bergeser relatif satu sama lain; angka ini harus sama untuk semua pemain (posisi online).
const BARIS = 15;
// Bangunan fasum sama persis dengan video Hari 2 (aset fasum.js): fas[1..8]. fas[0] dekat rumah Raka tetap lahan kosong untuk voting.
const PASANG_FASUM = [[1, 'sekolah', '🏫 SD Dunia Kotak'], [2, 'warung', '🛒 Warung Desa'], [3, 'masjid', '🕌 Masjid'], [4, 'gereja', '⛪ Gereja'], [5, 'katedral', '⛪ Gereja Katolik'], [6, 'pura', '🛕 Pura'], [7, 'vihara', '☸️ Vihara'], [8, 'klenteng', '🏮 Klenteng']];
const fasumBangun = [];   // {pos, nama, rect}
function pasangFasum() {
  const g = new THREE.Group(); sc.add(g);
  I.G.updateMatrixWorld(true);
  for (const [i, k, nama] of PASANG_FASUM) {
    const f = I.fas && I.fas[i]; if (!f || !F[k]) continue;
    // kosongkan papan "LAHAN FASUM" + patok, sisakan tanahnya (seperti video)
    I.G.traverse(o => { if (o.isGroup && o.parent === I.G && Math.abs(o.position.x * VS - f.x) < 1 && Math.abs(o.position.z * VS - f.z) < 1) o.children.slice(1).forEach(c => o.remove(c)); });
    const m = F[k](); m.scale.setScalar(VS); m.position.set(f.x, 0, f.z); g.add(m); m.updateMatrixWorld(true);
    // tabrakan: dinding utama saja (lantai & pagar boleh diinjak)
    const kotak = new THREE.Box3(), b = new THREE.Box3();
    m.traverse(o => { if (!o.isMesh) return; b.setFromObject(o); const sz = b.getSize(new THREE.Vector3()); if (sz.y > 2.4 * VS && sz.x > 1.5 * VS && sz.z > 1.5 * VS) kotak.union(b); });
    fasumBangun.push({position: new THREE.Vector3(f.x, 0, f.z), nama, tinggi: kotak.isEmpty() ? 8 * VS : kotak.max.y + 1, rect: kotak.isEmpty() ? null : [kotak.min.x, kotak.max.x, kotak.min.z, kotak.max.z]});
  }
  bakeGroup(g);
}
async function bangunDunia() {
  try { const w = await (await fetch('/duniakotak/api/warga')).json(); w.warga.forEach(x => { if (x.ig || x.tiktok) NM[x.no] = '@' + (x.ig || x.tiktok); if (x.kc) KC[x.no] = x.kc; if (x.ak) AK[x.no] = x.ak; }); } catch (e) {}
  if (S.saya && S.saya.kucing) KC[S.saya.no] = S.saya.kucing;
  if (S.saya && S.saya.ig) NM[S.saya.no] = '@' + S.saya.ig;
  await document.fonts.load('900 40px Montserrat').catch(() => {});
  reseed(301);
  I = D.village(sc, {cols: 5, rows: BARIS, fasumB: [[2,4],[2,5],[1,6],[2,6],[3,6],[1,7],[2,7],[3,7]], fasumH: [[2,11,1]], sungai: {gap: 6, w: 14, sawah: 40}, hutan: 1, tipis: .02,
    raka: 'done', filled: 999, isFilled: n => !!NM[n], names: NM, lazy: true, sm: hemat ? 1024 : 2048, shadowR: 70});
  I.light.castShadow = !hemat;
  pasangFasum();
  // kubus kembar yang banyak (jalan, hutan, sawah): dipecah per petak supaya yang di luar layar tidak digambar,
  // bentuk kubus versi ringan, dan tidak ikut bayangan (hemat untuk HP)
  pecahInstanced(I.G);
  // gabung benda statis (sungai, jembatan, fasum) supaya ringan
  bakeGroup(I.G);
  // proksi rumah jauh: 1 kotak dinding + 1 atap per kavling berpenghuni (2 draw call untuk semua)
  const isi = Object.entries(I.lots).filter(([n]) => +n === 1 || NM[n]);
  const geoW = new THREE.BoxGeometry(2 * VS, 1.3 * VS, 1.6 * VS), geoA = new THREE.ConeGeometry(1.55 * VS, .9 * VS, 4); geoA.rotateY(Math.PI / 4);
  const imW = new THREE.InstancedMesh(geoW, new THREE.MeshStandardMaterial({color: 0xf1dcb4, roughness: .85}), isi.length);
  const imA = new THREE.InstancedMesh(geoA, new THREE.MeshStandardMaterial({color: 0xffffff, roughness: .85}), isi.length);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), roofs2 = [0xc8553d,0x3a7ad8,0x3aa860,0xe0a020,0x9a5ad8,0xd84a8a,0x2a9a9a,0xe06a2a];
  isi.forEach(([n, L], i) => {
    const hx = L.c.x + L.dir * -2 * VS, hz = L.c.z + L.dir * -.6 * VS;
    M.compose(new THREE.Vector3(hx, .65 * VS, hz), q, one); imW.setMatrixAt(i, M);
    M.compose(new THREE.Vector3(hx, 1.75 * VS, hz), q, new THREE.Vector3(1, 1, .8)); imA.setMatrixAt(i, M);
    imA.setColorAt(i, new THREE.Color(+n === 1 ? 0xc8553d : roofs2[(n * 5) % roofs2.length]));
    L.proxyIdx = i; L.n = +n;
  });
  imW.castShadow = imA.castShadow = false; sc.add(imW, imA); I.proxy = {imW, imA, isi};
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
  for (const im of daftar) {
    const datar = im.scale.y < .5;                      // jalan dicat: kubus pipih
    const sel = new Map(), CELL = 140;
    for (let i = 0; i < im.count; i++) {
      im.getMatrixAt(i, M); W.multiplyMatrices(im.matrixWorld, M); P.setFromMatrixPosition(W);
      const k = Math.floor(P.x / CELL) + ',' + Math.floor(P.z / CELL);
      if (!sel.has(k)) sel.set(k, []); im.getColorAt(i, C); sel.get(k).push([W.clone(), C.clone()]);
    }
    for (const isi of sel.values()) {
      const c = new THREE.InstancedMesh(GEO_DATAR, im.material, isi.length);
      isi.forEach(([w, col], i) => { c.setMatrixAt(i, w); c.setColorAt(i, col); });
      c.castShadow = false; c.receiveShadow = !datar; c.computeBoundingSphere(); c.userData.jangan = true; sc.add(c);
    }
    im.parent.remove(im);
  }
}
// gabungkan mesh polos (tanpa tekstur) per warna jadi sedikit draw call
function bakeGroup(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const grup = new Map(), buang = [];
  root.traverse(m => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.jangan) return;
    const mt = m.material; if (Array.isArray(mt) || !mt.isMeshStandardMaterial || mt.map || mt.transparent) return;
    const k = [mt.color.getHex(), mt.emissive.getHex(), mt.roughness.toFixed(2), mt.metalness.toFixed(2), m.castShadow ? 1 : 0].join('|');
    let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    for (const a of Object.keys(g.attributes)) if (a !== 'position' && a !== 'normal') g.deleteAttribute(a);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    if (!grup.has(k)) grup.set(k, {mt, cast: m.castShadow, gs: []});
    grup.get(k).gs.push(g); buang.push(m);
  });
  buang.forEach(m => m.parent && m.parent.remove(m));
  for (const {mt, cast, gs} of grup.values()) {
    for (let i = 0; i < gs.length; i += 400) {
      const mg = mergeGeometries(gs.slice(i, i + 400), false); if (!mg) continue;
      const mesh = new THREE.Mesh(mg, mt); mesh.castShadow = cast; mesh.receiveShadow = true; mesh.userData.jangan = true; root.add(mesh);
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
function bangunKavling(n) {
  const L = I.lots[n]; const isi = n === 1 || !!NM[n];
  const g = I.buildLot(n); if (!g) return;
  const extra = new THREE.Group(); sc.add(extra);
  const rects = [];
  if (isi) {
    rects.push(rectLot(L, -3.1, -.9, -1.5, .7), rectLot(L, 2.4, 3.6, -.7, .3), rectLot(L, 3.15, 3.65, 2.75, 3.25));
    const w = warungMesh({nama: n === 1 ? 'WARUNG RAKA' : 'WARUNG PANEN', warna: ['#e0503a','#2f7fd8','#2a9a5a','#e0a020'][n % 4], isi: [0,1,2,3,4].map(k => ['tomat','jagung','wortel','terong','cabai','pisang','singkong','padi'][(n * 3 + k * 5) % 8])});
    w.scale.setScalar(1.8); w.position.set(L.c.x + L.dir * 1.6 * VS, 0, L.c.z + L.dir * 3.75 * VS); w.rotation.y = L.dir === 1 ? 0 : Math.PI; extra.add(w);
    rects.push(rectLot(L, 1.1, 2.1, 3.45, 4.1));
    if (n === 1) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(1.4 * VS, 1.15 * VS, .45 * VS), [0,1,2,3,4,5].map(k => new THREE.MeshStandardMaterial({color: k === 4 ? 0xffffff : 0x9a9a9a, roughness: .9, map: k === 4 ? D.nameTex('Raka', 1) : null})));
      st.position.set(L.c.x + L.dir * .2 * VS, .58 * VS, L.c.z + L.dir * 4 * VS); st.rotation.y = L.dir === 1 ? 0 : Math.PI; st.castShadow = true; extra.add(st);
      const k = rumahKucingMesh({warna: 'krem', atap: 'merah', nama: 'OYEN'}); k.scale.setScalar(1 / .55); k.position.set(L.c.x + L.dir * -3.9 * VS, 0, L.c.z + L.dir * 3.4 * VS); k.rotation.y = L.dir === 1 ? 0 : Math.PI; extra.add(k);
      rects.push(rectLot(L, -4.35, -3.45, 3.0, 3.8));
    }
    rects.push(rectLot(L, -.5, .9, 3.75, 4.25));
  }
  extra.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  bakeGroup(g); bakeGroup(extra);
  lotRuntime.set(n, {g, extra, rects});
  if (isi && n !== 1) pasangKucing(n);
  if (L.proxyIdx != null) setProxy(L, false);
}
function setProxy(L, tampil) {
  const {imW, imA} = I.proxy; const M = new THREE.Matrix4();
  const hx = L.c.x + L.dir * -2 * VS, hz = L.c.z + L.dir * -.6 * VS, s = tampil ? 1 : 0;
  M.compose(new THREE.Vector3(hx, .65 * VS, hz), new THREE.Quaternion(), new THREE.Vector3(s, s, s)); imW.setMatrixAt(L.proxyIdx, M);
  M.compose(new THREE.Vector3(hx, 1.75 * VS, hz), new THREE.Quaternion(), new THREE.Vector3(s, s, .8 * s)); imA.setMatrixAt(L.proxyIdx, M);
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
  const L = I.lots[n], G = new THREE.Group(), rot = L.dir === 1 ? 0 : Math.PI;
  const k = rumahKucingMesh({warna: kc.d || 'krem', atap: kc.a || 'merah', nama: (kc.k[0].n || '').toUpperCase()}); k.scale.setScalar(1 / .55);
  k.position.set(L.c.x + L.dir * -3.9 * VS, 0, L.c.z + L.dir * 3.4 * VS); k.rotation.y = rot; G.add(k);
  kc.k.slice(0, 2).forEach((x, i) => {
    const c = kucingMesh(WARNA_KUCING[x.w] ? x.w : 'oranye'); const [px, pz] = POS_KUCING[i];
    c.position.set(L.c.x + L.dir * px * VS, 0, L.c.z + L.dir * pz * VS); c.rotation.y = rot + (i ? -.6 : .5);
    c.userData = {ph: n * 1.7 + i * 2.1, nama: x.n || '', no: n, ry: c.rotation.y}; G.add(c); kucingHidup.push(c);
  });
  G.traverse(m => { if (m.isMesh) m.castShadow = !hemat; });
  sc.add(G); rt.kc = G;
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
const MISI = [
  {id: 'jalan', ikon: '👣', judul: 'Jalan-jalan keliling dusun', target: 300, satuan: 'langkah', koin: 10},
  {id: 'sapa', ikon: '👋', judul: 'Sapa warga: kirim pesan atau emote', target: 3, satuan: 'kali', koin: 10},
  {id: 'raka', ikon: '⭐', judul: 'Temui Raka dan Oyen', target: 1, koin: 5, info: 'Mereka ada di depan rumah No. 1 (Warung Raka), ujung Jl. Melati.', antar: 1},
  {id: 'tetangga', ikon: '🏡', judul: 'Mampir ke depan rumah tetangga', target: 3, satuan: 'rumah', koin: 10},
  {id: 'foto', ikon: '📸', judul: 'Foto pakai Kamera HP, lalu simpan atau bagikan', target: 1, koin: 10},
  {id: 'ambil', ikon: '✋', judul: 'Kumpulkan barang: kotak bercahaya di jalan', target: 5, satuan: 'barang', koin: 10},
  {id: 'mancing', ikon: '🎣', judul: 'Mancing di sungai sampai dapat ikan', target: 2, satuan: 'ikan', koin: 10, info: 'Sungai ada di sisi timur dusun, dekat sawah.'},
  {id: 'sungai', ikon: '🌊', judul: 'Jalan-jalan ke pinggir sungai', target: 1, koin: 5},
  {id: 'lari', ikon: '🏃', judul: 'Olahraga: lari (dorong joystick penuh)', target: 150, satuan: 'langkah', koin: 5},
  {id: 'kucing', ikon: '🐱', judul: 'Rawat kucing: beri makan kucing (tombol 🐟)', target: 1, koin: 5, info: 'Oyen ada di rumah Raka (No. 1), atau kucing di depan rumah warga.', antar: 1},
];
const BONUS_MISI = 20;
const hariIni = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const MS = {p: {}, selesai: new Set(), kirim: new Set(), t: ''};
function muatMisi() {
  MS.t = hariIni();
  const l = bacaJ('dk_misi') || {}; MS.p = l.t === MS.t && l.no === S.saya?.no ? l.p || {} : {};
  MS.selesai = new Set(S.saya?.misi || []);
  tandaKoin();
}
function tandaKoin() {
  const n = MISI.filter(m => MS.selesai.has(m.id)).length;
  if ($('bMisi')) $('bMisi').innerHTML = `<i>📋</i>Misi ${n}/${MISI.length}`;
  if (!S.tamu && S.saya) $('profOnline').dataset.koin = '🪙 ' + (S.saya.koin || 0);
  hitungOnline();
}
let simpanMisiT = 0;
function misiMaju(id, n = 1, kunciUnik) {
  if (S.tamu || !S.saya) return;
  if (MS.t !== hariIni()) { MS.t = hariIni(); MS.p = {}; MS.selesai = new Set(); }
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
    if (s.dapat) { const m = MISI.find(x => x.id === id); toast(id === 'bonus' ? `🎉 Semua misi hari ini selesai! Bonus +${s.dapat} koin` : `✅ Misi selesai: ${m.judul}. +${s.dapat} koin`, 4000); bunyi('masuk'); }
    tandaKoin(); if (!$('panelMisi').hidden) tulisMisi();
    if (id !== 'bonus' && MISI.every(m => MS.selesai.has(m.id)) && !MS.selesai.has('bonus')) setTimeout(() => klaimMisi('bonus'), 1500);
  } catch (e) { /* coba lagi nanti */ } finally { MS.kirim.delete(id); }
}
function tulisMisi() {
  const total = MISI.reduce((a, m) => a + m.koin, 0) + BONUS_MISI;
  $('isiMisi').innerHTML = MISI.map(m => {
    const p = progresMisi(m), ok = MS.selesai.has(m.id);
    return `<div class="misi ${ok ? 'ok' : ''}"><span class="mi">${ok ? '✅' : m.ikon}</span><div><b>${esc(m.judul)}</b>
      <div class="bar"><i style="width:${Math.round(100 * (ok ? 1 : p / m.target))}%"></i></div><small>${ok ? 'Selesai' : m.target > 1 ? `${p}/${m.target} ${m.satuan || ''}` : 'Belum'}</small>${!ok && m.info ? `<small class="info">📍 ${esc(m.info)}</small>` : ''}${!ok && m.antar ? `<button class="antar" data-antar="${m.antar}">🧭 Antar ke sana</button>` : ''}</div><span class="koin">+${m.koin} 🪙</span></div>`;
  }).join('') + `<div class="misi bonus ${MS.selesai.has('bonus') ? 'ok' : ''}"><span class="mi">🎁</span><div><b>Bonus: selesaikan semua misi</b><small>${MS.selesai.has('bonus') ? 'Sudah diambil' : `Otomatis masuk setelah ${MISI.length} misi selesai`}</small></div><span class="koin">+${BONUS_MISI} 🪙</span></div>`;
  const isiTas = Object.entries(tas).map(([n, v]) => `${v.ikon} ${n} ×${v.n}`).join(' · ');
  $('isiMisi').innerHTML += `<div class="misi"><span class="mi">🎒</span><div><b>Tasmu</b><small>${isiTas ? esc(isiTas) : 'Masih kosong. Ambil barang di jalan atau mancing di sungai.'}</small></div><span></span></div>`;
  $('ringkasMisi').textContent = `Koinmu: 🪙 ${S.saya?.koin || 0} · Hari ini bisa dapat ${total} koin. Misi baru tiap pukul 00.00 WIB.`;
}
document.addEventListener('click', e => { const b = e.target.closest?.('[data-antar]'); if (!b) return; $('panelMisi').hidden = true; pergiKe(+b.dataset.antar); toast('Jalan otomatis ke rumah Raka… geser joystick untuk berhenti.', 3500); });
function bukaMisi() {
  if (S.tamu) { toast('Daftar jadi warga dulu supaya bisa ikut misi dan dapat koin.', 4000); return; }
  if (MS.t !== hariIni()) muatMisi();
  $('panelMisi').hidden = false; tulisMisi();
}
let cekMisiT = 0;
function cekMisiDekat(me) {
  const now = performance.now(); if (now - cekMisiT < 700 || S.tamu || !I) return; cekMisiT = now;
  if (tokoh.raka && me.position.distanceTo(tokoh.raka.position) < 4 * VS) misiMaju('raka');
  for (const [ns, rt] of lotRuntime) {
    const n = +ns, L = I.lots[n]; if (!L) continue;
    const dg = Math.hypot(me.position.x - L.gate.x, me.position.z - L.gate.z);
    if (dg < 2.6 * VS && n !== 1 && n !== S.saya.no && NM[n]) misiMaju('tetangga', 1, n);
    if (n === S.saya.no && rt.kc && Math.hypot(me.position.x - (L.c.x + L.dir * -3.9 * VS), me.position.z - (L.c.z + L.dir * 3.4 * VS)) < 2.4 * VS) misiMaju('kucing');
  }
}

// ---------- skill warga: ambil item, mancing di sungai, beri makan kucing ----------
const ITEM = [{id: 'apel', ikon: '🍎', nama: 'Apel', w: 0xe0403a}, {id: 'bunga', ikon: '🌼', nama: 'Bunga', w: 0xffd23a}, {id: 'kayu', ikon: '🪵', nama: 'Kayu', w: 0x9a6a3e},
  {id: 'jamur', ikon: '🍄', nama: 'Jamur', w: 0xd84a4a}, {id: 'batu', ikon: '🪨', nama: 'Batu kotak', w: 0x9aa0a8}, {id: 'daun', ikon: '🍃', nama: 'Daun', w: 0x5cc85c}];
const IKAN = [[35, '🐟', 'Ikan mas'], [28, '🐠', 'Ikan nila'], [18, '🐡', 'Ikan buntal kotak'], [11, '🦐', 'Udang'], [5, '👟', 'Sepatu bekas'], [3, '🦀', 'Kepiting langka']];
const tas = bacaJ('dk_tas') || {};
function masukTas(ikon, nama) { tas[nama] = tas[nama] || {ikon, n: 0}; tas[nama].n++; simpan('dk_tas', tas); }
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
    m.position.set(x, 1.4, z); m.userData = {jenis: j, ph: Math.random() * 6}; sc.add(m); itemDunia.push(m);
  }
}
const dekatItem = me => itemDunia.find(it => Math.hypot(it.position.x - me.position.x, it.position.z - me.position.z) < 2.6 * VS);
const dekatKucing = me => [tokoh.oyen, ...kucingHidup].filter(Boolean).find(c => Math.hypot(c.position.x - me.position.x, c.position.z - me.position.z) < 3.2 * VS);
function dekatAir(me) {
  const s = I && I.sungai; if (!s) return false; const x = me.position.x, z = me.position.z;
  if (x > s.x0 - 3 * VS && x < s.x1 + 3 * VS && !(x > s.x0 && x < s.x1 && !s.jembatan.some(([a, c]) => z > a && z < c))) return true;
  return false;
}
function hadap(me, p) { me.rotation.y = Math.atan2(p.x - me.position.x, p.z - me.position.z); }
function skillAmbil() {
  const me = tokoh.saya; if (!me) return; const it = dekatItem(me);
  if (!it) { toast('Tidak ada barang di dekatmu. Cari kotak bercahaya di jalan, lalu dekati.', 3000); return; }
  hadap(me, it.position); sc.remove(it); itemDunia = itemDunia.filter(x => x !== it);
  const j = it.userData.jenis; masukTas(j.ikon, j.nama); bunyi('emosi'); misiMaju('ambil');
  toast(`${j.ikon} ${j.nama} masuk tas (${tas[j.nama].n})`, 2200);
}
const mancing = {on: false, teks: '', t: 0, joran: null, batal() { if (this.joran) { tokoh.saya.remove(this.joran); this.joran = null; } }};
function skillMancing() {
  const me = tokoh.saya; if (!me || mancing.on) return;
  if (!dekatAir(me)) { toast('Mancing harus di pinggir sungai. Sungai ada di sisi timur dusun, dekat sawah.', 3500); return; }
  const s = I.sungai; hadap(me, new THREE.Vector3(me.position.x < s.x0 ? s.x0 + 9 : s.x1 - 9, 0, me.position.z));
  gerak.tujuan = null; mancing.on = true; mancing.teks = '🎣 …'; mancing.t = performance.now();
  const j = new THREE.Mesh(new THREE.BoxGeometry(.18, .18, 6), new THREE.MeshStandardMaterial({color: 0x6b3e22})); j.position.set(.9, 2.6, 2.6); j.rotation.x = -.5; me.add(j); mancing.joran = j;
  bunyi('buka');
  const tunggu = 1800 + Math.random() * 2200;
  setTimeout(() => { if (!mancing.on) return; mancing.teks = '❗ Strike!'; bunyi('pesan');
    setTimeout(() => { if (!mancing.on) return; mancing.on = false; mancing.batal();
      let r = Math.random() * 100, hasil = IKAN[0]; for (const x of IKAN) { if ((r -= x[0]) < 0) { hasil = x; break; } }
      masukTas(hasil[1], hasil[2]); bunyi('masuk'); if (hasil[1] !== '👟') misiMaju('mancing'); toast(`${hasil[1]} Dapat ${hasil[2]}! (punya ${tas[hasil[2]].n})`, 3000);
    }, 700);
  }, tunggu);
}
let makanT = 0;
function skillMakan() {
  const me = tokoh.saya; if (!me) return; const c = dekatKucing(me);
  if (!c) { toast('Dekati kucing dulu: Oyen di rumah Raka, atau kucing di depan rumah warga.', 3500); return; }
  if (performance.now() - makanT < 2500) return; makanT = performance.now();
  hadap(me, c.position); c.userData.senang = performance.now() + 2600; bunyi('emosi'); misiMaju('kucing');
  toast(c === tokoh.oyen ? '🐟 Oyen makan dengan lahap. Meong!' : `🐟 ${c.userData.nama || 'Kucing'} senang diberi makan!`, 2500);
}
function animSkill(dt, me) {
  const now = performance.now();
  if (now - itemT > 1500) { itemT = now; isiItem(me); }
  for (const it of itemDunia) { const u = it.userData; u.ph += dt; it.position.y = 1.4 + Math.sin(u.ph * 2) * .4; it.rotation.y += dt * 1.2; }
  for (const c of [tokoh.oyen, ...kucingHidup]) if (c && c.userData.senang > now) c.position.y = Math.abs(Math.sin(now / 90)) * .6;
  // tombol skill menyala bila bisa dipakai
  const t = now | 0; if (t % 4 === 0 || !animSkill.t || now - animSkill.t > 300) { animSkill.t = now;
    // tombol hanya muncul saat skill bisa dipakai; joran sedang dipakai = tombol Mancing hilang
    const air = dekatAir(me), bisa = {sNgobrol: !!(npc && npc.terdekat(me, 7 * VS)), sAmbil: !!dekatItem(me), sMancing: air && !mancing.on, sMakan: !!dekatKucing(me)};
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
  tokoh.saya = buatAvatarObj(S.av); tokoh.saya.position.copy(p); tokoh.saya.rotation.y = r; sc.add(tokoh.saya);
  if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify({t: 'av', av: S.av}));
  $('profAva').style.background = S.av.kulit;
}

// =====================================================================
// PETA DESA (ala gmaps): foto udara dirender sekali dari atas, lalu titik pemain/warga digambar di atasnya
// =====================================================================
const peta = {img: null, w: 0, h: 0, b: null, pilih: null, t: 0, u: 0, v: 0, z: 2.2};
function buatPeta() {
  try {
    const b = I.batas, lebar = b.x1 - b.x0, tinggi = b.z1 - b.z0, k = 1400 / Math.max(lebar, tinggi);
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
    c.font = `900 ${Math.round(16 * k / 1.4)}px Montserrat,sans-serif`; c.fillStyle = '#e8f6ff'; c.save(); const [su, sv] = keP((I.sungai.x0 + I.sungai.x1) / 2, (b.z0 + b.z1) / 2); c.translate(su, sv); c.rotate(-Math.PI / 2); c.fillText('S U N G A I', 0, 0); c.restore();
    peta.img = cv; peta.w = W; peta.h = H; peta.b = b;
  } catch (e) { console.error('peta', e); $('petaMini').hidden = true; }
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
    for (const [n, L] of Object.entries(I.lots)) { const [a, c2] = keP(L.c.x, L.c.z), d = Math.hypot(a - u, c2 - v); if (d < bd) { bd = d; best = +n; } } if (best && bd < 30) pilihRumah(best); } };
  cvB.onwheel = e => { e.preventDefault(); peta.z = Math.max(.25, Math.min(6, peta.z * (e.deltaY < 0 ? 1.15 : .87))); gambarPetaBesar(); };
  $('petaZoom').onclick = e => { const d = e.target.dataset.z; if (!d) return; if (d === 'aku') { [peta.u, peta.v] = keP(tokoh.saya.position.x, tokoh.saya.position.z); peta.z = 2.2; } else peta.z = Math.max(.25, Math.min(6, peta.z * (d === '+' ? 1.4 : .7))); gambarPetaBesar(); };
  $('cariPeta').onsubmit = e => { e.preventDefault(); const q = $('cariIsi').value.trim().toLowerCase().replace(/^@/, '').replace(/^no\.?\s*/, '');
    if (!q) return; let n = /^\d+$/.test(q) && I.lots[+q] ? +q : 0;
    if (!n) { const hit = Object.entries(NM).find(([, nm]) => nm.toLowerCase().replace(/^@/, '') === q) || Object.entries(NM).find(([, nm]) => nm.toLowerCase().includes(q)); if (hit) n = +hit[0]; }
    if (n) pilihRumah(n); else $('petaInfo').textContent = `"${q}" tidak ketemu. Coba username lain atau nomor rumah.`; };
  $('petaAntar').onclick = () => { if (!peta.pilih) return; $('panelPeta').hidden = true; pergiKe(peta.pilih); toast('Jalan otomatis ke rumah No. ' + peta.pilih + '… geser joystick untuk berhenti.', 3500); };
}
function keP(x, z) { const b = peta.b || I.batas, W = peta.w || 1, H = peta.h || 1; return [(x - b.x0) / (b.x1 - b.x0) * W, (z - b.z0) / (b.z1 - b.z0) * H]; }
function pilihRumah(n) {
  peta.pilih = n; [peta.u, peta.v] = keP(I.lots[n].c.x, I.lots[n].c.z); peta.z = Math.max(peta.z, 2.2); const nm = n === 1 ? 'Raka & Oyen (Warung Raka)' : NM[n] || 'kavling kosong';
  $('petaInfo').textContent = `📍 No. ${n} · ${nm} · ${alamat(n)}`; $('petaAntar').hidden = false; gambarPetaBesar();
}
function bukaPeta() { $('panelPeta').hidden = false; $('petaAntar').hidden = !peta.pilih; if (!peta.pilih) [peta.u, peta.v] = keP(tokoh.saya.position.x, tokoh.saya.position.z); gambarPetaBesar(); }
function titikPeta(c, k, me) {
  // warga online (hijau), Raka (bintang), saya (panah biru)
  for (const o of S.others.values()) { const [u, v] = keP(o.obj.position.x, o.obj.position.z); c.fillStyle = '#2ecc71'; c.strokeStyle = '#fff'; c.lineWidth = 2 * k; c.beginPath(); c.arc(u, v, 6 * k, 0, 7); c.fill(); c.stroke(); }
  if (tokoh.raka) { const [u, v] = keP(tokoh.raka.position.x, tokoh.raka.position.z); c.font = `${Math.round(18 * k)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⭐', u, v); }
  if (peta.pilih && I.lots[peta.pilih]) { const L = I.lots[peta.pilih], [u, v] = keP(L.c.x, L.c.z); c.fillStyle = '#ea4335'; c.strokeStyle = '#fff'; c.lineWidth = 2.5 * k; c.beginPath(); c.arc(u, v - 16 * k, 10 * k, Math.PI * .85, Math.PI * 2.15); c.lineTo(u, v); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(u, v - 16 * k, 4 * k, 0, 7); c.fill(); }
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
  c.fillStyle = '#3f7a3a'; c.fillRect(0, 0, S2, S2);
  c.save(); const z = S2 / lebar; c.translate(S2 / 2, S2 / 2); c.scale(z, z); c.translate(-u, -v);
  c.drawImage(peta.img, 0, 0); titikPeta(c, 1.6 / z * .9, me); c.restore();
  if (!$('panelPeta').hidden) gambarPetaBesar();
}

// =====================================================================
// 5. LABEL & GELEMBUNG
// =====================================================================
const lab = $('label'); const pool = [];
const V = new THREE.Vector3();
function tempel(obj, tinggi, teks, cls, dy = 0) {
  V.copy(obj.position); V.y += tinggi; V.project(cam);
  if (V.z > 1 || V.x < -1.2 || V.x > 1.2 || V.y < -1.2 || V.y > 1.2) return null;
  let d = pool.find(x => !x.dipakai); if (!d) { d = {el: document.createElement('div')}; lab.appendChild(d.el); pool.push(d); }
  d.dipakai = true; if (d.el.className !== cls) d.el.className = cls; if (d.el._t !== teks) { d.el.textContent = teks; d.el._t = teks; }
  d.el.style.transform = `translate(${((V.x + 1) / 2 * innerWidth) | 0}px,${((1 - V.y) / 2 * innerHeight + dy) | 0}px) translate(-50%,-100%)`; if (d.el.style.display) d.el.style.display = '';
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
  const u = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/duniakotak/api/ruang?dusun=wetan&kunci=' + encodeURIComponent(S.kunci) + '&x=' + p.x.toFixed(1) + '&z=' + p.z.toFixed(1);
  const ws = new WebSocket(u); S.ws = ws;
  ws.onopen = () => { coba = 0; ws.send(JSON.stringify({t: 'av', av: S.av})); kirimPos(true); };
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
function terima(q) {
  if (q.t === 'halo') { q.warga.forEach(tambahWarga); S.chat.dusun = []; q.chat.forEach(c => tambahChat('dusun', '@' + c.ig, c.m)); hitungOnline(); }
  else if (q.t === 'masuk') { tambahWarga(q.w); hitungOnline(); tambahChat('sekitar', '', '@' + q.w.ig + ' masuk ke desa', 'sistem'); bunyi('masuk'); }
  else if (q.t === 'keluar') { const o = S.others.get(q.no); if (o) { sc.remove(o.obj); S.others.delete(q.no); } hitungOnline(); }
  else if (q.t === 'p') { for (const [no, x, z, r, a] of q.d) { const o = S.others.get(no); if (o) { o.tx = x; o.tz = z; o.tr = r; o.a = a; o.akhir = performance.now(); } } }
  else if (q.t === 'av') { const o = S.others.get(q.no); if (o) { const p = o.obj.position.clone(); sc.remove(o.obj); o.obj = buatAvatarObj(bersihAv(q.av)); o.obj.position.copy(p); sc.add(o.obj); } }
  else if (q.t === 'c') {
    if (S.bisu.has(q.no)) return;
    const saya = q.no === S.saya.no; const o = S.others.get(q.no);
    const dekat = saya || (o && o.obj.position.distanceTo(tokoh.saya.position) < 120);
    if (q.ch === 'dusun') tambahChat('dusun', '@' + q.ig, q.m);
    else if (dekat) tambahChat('sekitar', '@' + q.ig, q.m);
    if (dekat || q.ch === 'sekitar') gelembung(q.no, q.m);
    if (saya) bunyi('kirim'); else if (dekat || q.ch === 'dusun') bunyi('pesan');
  }
  else if (q.t === 'e' && q.e === 'lompat') { const o = S.others.get(q.no); if (o) o.lompat = {vy: 34, y: 0}; }
  else if (q.t === 'e') { if (!S.bisu.has(q.no)) { gelembung(q.no, EMO[q.e] || '👋', true); bunyi('emosi'); } }
  else if (q.t === 'tolak' || q.t === 'info') toast(q.m, 3500);
}
function hitungOnline() { $('profOnline').textContent = S.tamu ? 'Mode tamu · daftar untuk ngobrol' : `● ${S.others.size + 1} online · 🪙 ${S.saya?.koin || 0} koin`; }
let kirimT = 0, posLama = '';
function kirimPos(paksa) {
  if (!S.ws || S.ws.readyState !== 1) return;
  const p = tokoh.saya.position, now = performance.now();
  const k = p.x.toFixed(1) + ',' + p.z.toFixed(1);
  if (!paksa && (now - kirimT < 170 || (k === posLama && now - kirimT < 4000))) return;
  kirimT = now; posLama = k;
  S.ws.send(JSON.stringify({t: 'p', x: +p.x.toFixed(2), z: +p.z.toFixed(2), r: +tokoh.saya.rotation.y.toFixed(2), a: gerak.jalan ? 1 : 0}));
}

// =====================================================================
// 8. KONTROL
// =====================================================================
const gerak = {kunci: {}, stik: null, tujuan: null, jalan: false};
addEventListener('keydown', e => { if (document.activeElement && document.activeElement.tagName === 'INPUT') return; gerak.kunci[e.key.toLowerCase()] = true; if (e.key === 'q' || e.key === 'Q') putar(1); if (e.key === 'e' || e.key === 'E') putar(-1); const kk = e.key.toLowerCase(); if (kk === 'f') skillAmbil(); if (kk === 'r') skillMancing(); if (kk === 'g') skillMakan(); if (kk === 't') $('sNgobrol').click(); if (e.key === ' ') { mulaiLompat(); e.preventDefault(); } if (kk === 'm' && peta.img) { if ($('panelPeta').hidden) bukaPeta(); else $('panelPeta').hidden = true; } if (e.key === 'Enter') { $('ketik').focus(); e.preventDefault(); } });
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
  const titik = new THREE.Vector3(); if (ray.ray.intersectPlane(lantai, titik)) { gerak.tujuan = titik; }
});
lab.addEventListener('click', e => {
  const el = e.target.closest('.nm'); if (el && el.dataset.npc) { const n = npc && npc.daftar.find(x => x.id === el.dataset.npc); if (n) ngobrol(n); return; }
  if (!el || !el.dataset.no) return;
  const no = +el.dataset.no, o = S.others.get(no); if (!o) return;
  const mw = $('menuWarga'); mw.hidden = false; mw.style.left = Math.min(innerWidth - 200, e.clientX) + 'px'; mw.style.top = Math.min(innerHeight - 160, e.clientY + 10) + 'px';
  mw.innerHTML = `<b>@${esc(o.ig)} · No. ${no}</b><small class="kecil" style="padding:0 4px">${esc(alamat(no))}</small>
    <button data-a="rumah">🏠 Lihat rumahnya</button><button data-a="bisu">${S.bisu.has(no) ? '🔈 Batal bisukan' : '🔇 Bisukan'}</button><button data-a="lapor">🚩 Laporkan</button>`;
  mw.onclick = ev => { const a = ev.target.dataset.a; if (!a) return; mw.hidden = true;
    if (a === 'rumah') pergiKe(no);
    if (a === 'bisu') { S.bisu.has(no) ? S.bisu.delete(no) : S.bisu.add(no); simpan('dk_bisu', [...S.bisu]); toast(S.bisu.has(no) ? 'Pesan @' + o.ig + ' tidak tampil lagi di HP-mu.' : 'Bisukan dibatalkan.'); }
    if (a === 'lapor' && S.ws) S.ws.send(JSON.stringify({t: 'lapor', no}));
  };
});
// ---------- Kamera HP: foto 9:16 berbingkai + ajakan jadi warga ----------
let kArah = 'selfie', fotoBlob = null;
async function jepret() {
  const W = 720, H = 1280, rt = new THREE.WebGLRenderTarget(W, H, {samples: 4});
  const c2 = new THREE.PerspectiveCamera(46, W / H, 1, 600), me = tokoh.saya.position, ry = tokoh.saya.rotation.y;
  if (kArah === 'selfie') { c2.position.set(me.x + Math.sin(ry) * 26, 11, me.z + Math.cos(ry) * 26); c2.lookAt(me.x, 5.5, me.z); }
  else { const sn = Math.sin(yawNow), cs = Math.cos(yawNow); c2.position.set(me.x + sn * 22, 14, me.z + cs * 22); c2.lookAt(me.x - sn * 60, 3, me.z - cs * 60); }
  R.setRenderTarget(rt); R.render(sc, c2); const px = new Uint8Array(W * H * 4); R.readRenderTargetPixels(rt, 0, 0, W, H, px); R.setRenderTarget(null); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1920; const x = cv.getContext('2d');
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const id = tmp.getContext('2d').createImageData(W, H);
  for (let y = 0; y < H; y++) id.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);   // balik atas-bawah
  tmp.getContext('2d').putImageData(id, 0, 0); x.drawImage(tmp, 0, 0, 1080, 1920);
  // bingkai atas
  const g = x.createLinearGradient(0, 0, 0, 380); g.addColorStop(0, 'rgba(19,20,31,.82)'); g.addColorStop(1, 'rgba(19,20,31,0)'); x.fillStyle = g; x.fillRect(0, 0, 1080, 380);
  x.strokeStyle = '#ffffff'; x.lineWidth = 14; x.strokeRect(28, 28, 1024, 1864);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '900 46px Montserrat, sans-serif'; x.fillText('@duniakotak.id', 540, 118);
  x.font = '900 64px Montserrat, sans-serif'; x.fillText(S.tamu ? 'Main di Dunia Kotak' : '@' + S.saya.ig, 540, 205);
  x.font = '700 36px Montserrat, sans-serif'; x.fillStyle = '#ffcf7a'; x.fillText(S.tamu ? 'Dusun Kotak Wetan' : alamat(S.saya.no).split(' · ')[0] + ', Kotak Wetan', 540, 262);
  // ajakan (CTA) di atas zona aman story (teks maks y≈1620)
  const cy = 1430, cw = 900, ch = 190; x.fillStyle = 'rgba(19,20,31,.88)'; x.beginPath(); x.roundRect(540 - cw / 2, cy, cw, ch, 40); x.fill();
  x.fillStyle = '#fff'; x.font = '900 50px Montserrat, sans-serif'; x.fillText('Mau punya rumah di sini?', 540, cy + 78);
  x.fillStyle = '#5cb8ff'; x.font = '800 40px Montserrat, sans-serif'; x.fillText('Daftar gratis: willoapparel.com/duniakotak', 540, cy + 140);
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
function pergiKe(no) { const L = I.lots[no]; if (!L) return; gerak.tujuan = new THREE.Vector3(L.gate.x, 0, L.gate.z + L.dir * 1.2 * VS); }

// =====================================================================
// 9. MULAI
// =====================================================================
let zoom = 1, yaw = 0, yawNow = 0;
// ---------- suara: musik latar (orisinal, loop) + efek suara (dibuat langsung, tanpa file) ----------
// Mulai setelah sentuhan pertama (aturan browser). Tombol Suara: Semua -> Efek saja -> Senyap; diingat di HP.
const M = {ctx: null, gain: null, fx: null, buf: null, src: null, mode: baca('dk_suara') || (baca('dk_musik') === '0' ? 'efek' : 'semua')};
const MODE = {semua: '<i>🔊</i>Suara', efek: '<i>🔉</i>Efek', senyap: '<i>🔇</i>Senyap'};
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
  $('masuk').hidden = false; $('masukIsi').innerHTML = '<p class="muat">Membangun Dusun Kotak Wetan…</p>';
  await bangunDunia();
  const no = S.tamu ? 1 : S.saya.no; const L = I.lots[no] || I.lots[1];
  tokoh.saya = buatAvatarObj(S.av); tokoh.saya.position.set(L.gate.x + (S.tamu ? 3 * VS : 0), 0, L.gate.z + L.dir * 1.3 * VS); tokoh.saya.rotation.y = L.dir === 1 ? 0 : Math.PI; sc.add(tokoh.saya);
  yaw = yawNow = L.dir === 1 ? 0 : Math.PI;   // kamera menghadap depan rumah sendiri
  const L1 = I.lots[1];
  tokoh.raka = raka('senang'); tokoh.raka.traverse(m => { if (m.isMesh) m.castShadow = true; }); tokoh.raka.position.set(L1.gate.x + 1.6 * VS, 0, L1.gate.z + L1.dir * 1.1 * VS); tokoh.raka.rotation.y = L1.dir === 1 ? .3 : Math.PI + .3; sc.add(tokoh.raka);
  tokoh.oyen = kucingMesh('oranye'); tokoh.oyen.traverse(m => { if (m.isMesh) m.castShadow = true; }); tokoh.oyen.position.set(L1.gate.x + 2.4 * VS, 0, L1.gate.z + L1.dir * 1.7 * VS); sc.add(tokoh.oyen);
  tokoh.oyen.userData.ph = 0;
  npc = buatNPC({sc, I, VS, warga, pose: wpose, siapAv: bersihAv, bayangan: !hemat});
  // kavling di sekitar pemain dibangun dulu sebelum layar dibuka
  for (let i = 0; i < 40; i++) aturKavling(tokoh.saya.position.x, tokoh.saya.position.z);
  $('masuk').hidden = true; $('hud').hidden = false;
  $('profNama').textContent = S.tamu ? 'Tamu' : '@' + S.saya.ig + ' · No. ' + S.saya.no;
  $('profAlamat').textContent = S.tamu ? 'Dusun Kotak Wetan' : alamat(S.saya.no) + ' · Kotak Wetan';
  $('profAva').style.background = S.av.kulit;
  buatPeta();
  hitungOnline(); kabarWarga(); tulisChat(); aturHUD(); sambung();
  if (!baca('dk_panduan')) panduan();
  onResize(); requestAnimationFrame(loop);
}
function aturHUD() {
  $('chat').querySelectorAll('.tab button[data-ch]').forEach(b => b.onclick = () => { S.ch = b.dataset.ch; $('chat').querySelectorAll('.tab button[data-ch]').forEach(x => x.classList.toggle('on', x === b)); tulisChat(); });
  $('formChat').onsubmit = e => { e.preventDefault(); kirimChat($('ketik').value); $('ketik').value = ''; $('ketik').blur(); };
  $('chat').querySelectorAll('.cepat button').forEach(b => b.onclick = () => {
    if (b.dataset.q) return kirimChat(b.dataset.q);
    if (S.tamu) return toast('Daftar jadi warga dulu untuk menyapa.');
    if (S.ws && S.ws.readyState === 1) { S.ws.send(JSON.stringify({t: 'e', e: b.dataset.e})); misiMaju('sapa'); }
  });
  $('bTutupChat').onclick = () => { $('chat').hidden = true; $('bBukaChat').hidden = false; };
  $('bBukaChat').onclick = () => { $('chat').hidden = false; $('bBukaChat').hidden = true; };
  $('bRumah').onclick = () => pergiKe(S.tamu ? 1 : S.saya.no);
  $('bKamera').onclick = () => bukaKamera();
  $('profil').style.cursor = 'pointer';
  $('profil').onclick = () => { if (S.tamu) return toast('Daftar di willoapparel.com/duniakotak supaya dapat kavling.', 4000); toast(`Kode wargamu: ${S.saya.kode} · pakai untuk masuk dari HP lain. Jangan dibagikan.`, 6000); };
  $('bAvatar').onclick = () => bukaPembuatAvatar(JSON.parse(JSON.stringify(S.av)), false);
  $('bKucing').onclick = () => bukaKucing();
  $('bMisi').onclick = () => bukaMisi(); $('tutupMisi').onclick = () => { $('panelMisi').hidden = true; };
  muatMisi();
  $('bPanduan').onclick = () => panduan();
  musikSiap();
  $('sLompat').onclick = () => mulaiLompat(); $('sNgobrol').onclick = () => { const n = npc && npc.terdekat(tokoh.saya, 7 * VS); if (n) ngobrol(n); }; $('sAmbil').onclick = () => skillAmbil(); $('sMancing').onclick = () => skillMancing(); $('sMakan').onclick = () => skillMakan();
  if (innerHeight < 500) { $('chat').hidden = true; $('bBukaChat').hidden = false; zoom = .85; }
  if (portrait() && innerWidth <= 700) { $('chat').hidden = true; $('bBukaChat').hidden = false; }
}
function panduan() {
  const nama = S.tamu ? 'tamu' : '@' + S.saya.ig;
  const L = [
    `Halo ${nama}! Aku Raka, ini Oyen. Selamat datang di Dusun Kotak Wetan!`,
    S.tamu ? 'Kamu sedang lihat-lihat sebagai tamu. Daftar jadi warga di willoapparel.com/duniakotak supaya dapat kavling dan bisa ngobrol.' : `Rumahmu di ${alamat(S.saya.no)}. Batu di depan rumah sudah terukir namamu.`,
    'Jalan pakai joystick di kiri bawah, dorong penuh untuk lari. Geser layar untuk memutar kamera, cubit untuk zoom. Di laptop: WASD, Shift lari, roda mouse zoom.',
    'Tombol kanan bawah itu skill-mu: ✋ ambil barang di jalan, 🎣 mancing di pinggir sungai, 🐟 beri makan kucing. Tombolnya menyala kalau bisa dipakai.',
    'Chat Sekitar terlihat warga di dekatmu, Chat Dusun untuk semua warga dusun. Ketuk nama warga untuk lihat rumahnya, bisukan, atau laporkan.',
    'Cek 📋 Misi tiap hari untuk dapat koin. Sekarang ayo jalan-jalan dan sapa tetangga. Meong! kata Oyen.',
  ];
  let i = 0; const d = $('dialog');
  const tampil = () => { $('dialogTeks').textContent = L[i]; $('dLanjut').textContent = i === L.length - 1 ? 'Selesai' : 'Lanjut'; gelembung('raka', '👋', true); };
  d.hidden = false; tampil();
  $('dLanjut').onclick = () => { i++; if (i >= L.length) { d.hidden = true; simpan('dk_panduan', '1'); } else tampil(); };
  $('dLewati').onclick = () => { d.hidden = true; simpan('dk_panduan', '1'); };
}

// =====================================================================
// 10. LOOP
// =====================================================================
const KEC = 15;
// tinggi pijakan: dek jembatan lebih tinggi dari jalan
const tanah = (x, z) => { const d = I.dek; return d && x > d.x0 && x < d.x1 && d.z.some(([a, c]) => z > a && z < c) ? d.y : 0; };
const lompat = {vy: 0, diTanah: true};
function mulaiLompat() { if (!lompat.diTanah || !tokoh.saya) return; lompat.vy = 34; lompat.diTanah = false; bunyi('langkah'); if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify({t: 'e', e: 'lompat'})); }   // satuan dunia per detik (avatar setinggi pintu ≈ 4,1)
let tAkhir = performance.now(), tKav = 0, ph = 0;
const bebas = (x, z) => {
  const b = I.batas; if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return false;
  const s = I.sungai; if (x > s.x0 && x < s.x1 && !s.jembatan.some(([a, c]) => z > a && z < c)) return false;
  for (const {rects} of lotRuntime.values()) for (const [x0, x1, z0, z1] of rects) if (x > x0 - 1.2 && x < x1 + 1.2 && z > z0 - 1.2 && z < z1 + 1.2) return false;
  for (const {rect} of fasumBangun) if (rect && x > rect[0] - 1.2 && x < rect[1] + 1.2 && z > rect[2] - 1.2 && z < rect[3] + 1.2) return false;
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
  const k = gerak.kunci;
  if (k['w'] || k['arrowup']) vz -= 1; if (k['s'] || k['arrowdown']) vz += 1; if (k['a'] || k['arrowleft']) vx -= 1; if (k['d'] || k['arrowright']) vx += 1;
  if (gerak.stik) { vx += gerak.stik.x; vz += gerak.stik.y; }
  if (vx || vz) { const sn = Math.sin(yawNow), cs = Math.cos(yawNow); const ax = vx * cs + vz * sn, az = -vx * sn + vz * cs; vx = ax; vz = az; }
  if (vx || vz) gerak.tujuan = null;
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
  { const g = tanah(me.position.x, me.position.z);
    if (lompat.diTanah) { me.position.y += (g - me.position.y) * Math.min(1, dt * 18); }
    else { lompat.vy -= 95 * dt; me.position.y += lompat.vy * dt; if (me.position.y <= g) { me.position.y = g; lompat.vy = 0; lompat.diTanah = true; } }
    if (!lompat.diTanah) { const a = Math.min(1, me.position.y / 6); wpose(me, {legL: -.5 * a, legR: .4 * a, armL: -2.4 * a, armR: -2.4 * a}); } }
  cekMisiDekat(me);
  // warga lain: interpolasi
  for (const o of S.others.values()) {
    const p = o.obj.position; const a = Math.min(1, dt * 8); p.x += (o.tx - p.x) * a; p.z += (o.tz - p.z) * a;
    if (o.lompat) { o.lompat.vy -= 95 * dt; o.lompat.y += o.lompat.vy * dt; if (o.lompat.y <= 0) o.lompat = null; }
    p.y += (tanah(p.x, p.z) + (o.lompat ? o.lompat.y : 0) - p.y) * (o.lompat ? 1 : a);
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
  if (npc) { npc.update(dt, me, jamWIB(), KEC); sapaNPC(t, me); }
  tokoh.oyen.userData.ph += dt; tokoh.oyen.position.y = Math.abs(Math.sin(tokoh.oyen.userData.ph * 1.3)) * .15;
  // kamera ikut pemain (dikunci di dalam hutan pembatas)
  const tx = me.position.x, tz = me.position.z;
  let dy = yaw - yawNow; yawNow += dy * Math.min(1, dt * 6);
  const sn = Math.sin(yawNow), cs = Math.cos(yawNow);
  cam.position.set(tx + sn * 58 * zoom, 40 * zoom, tz + cs * 58 * zoom); cam.lookAt(tx - sn * 14, 2, tz - cs * 14);
  // bayangan ikut pemain
  I.light.position.set(tx + 60, 100, tz + 72); I.light.target.position.set(tx, 0, tz); I.light.target.updateMatrixWorld();
  // kavling dekat dibangun bertahap
  if (t - tKav > (hemat ? 200 : 120) && dtAsli < .034) { tKav = t; aturKavling(tx, tz); }
  siangMalam(t);
  kirimPos(false);
  R.render(sc, cam);
  gambarPetaMini(t);
  // label
  pool.forEach(d => { d.dipakai = false; });
  const lbl = (o, h, teks, cls, no, idNpc) => { const el = tempel(o, h, teks, cls); if (el) { el.dataset.no = no || ''; el.dataset.npc = idNpc || ''; } return el; };
  lbl(me, 5.2, S.tamu ? 'Kamu (tamu)' : '@' + S.saya.ig, 'nm saya');
  lbl(tokoh.raka, 5.2, '★ Raka', 'nm raka'); lbl(tokoh.oyen, 2.6, 'Oyen', 'nm raka kucing');
  for (const c of [tokoh.oyen, ...kucingHidup]) if (c.userData.senang > performance.now()) tempel(c, 4.2, '❤️ nyam!', 'gel emo', -4);
  for (const it of itemDunia) if (it.position.distanceTo(me.position) < 45) tempel(it, 3.4, it.userData.jenis.ikon, 'nm item');
  if (mancing.on) tempel(me, 6.6, mancing.teks, 'gel emo', -4);
  for (const c of kucingHidup) if (c.userData.nama && c.position.distanceTo(me.position) < 60) lbl(c, 2.6, c.userData.nama, 'nm kucing');
  for (const [no, o] of S.others) if (o.obj.position.distanceTo(me.position) < 220) lbl(o.obj, 5.2, (S.bisu.has(no) ? '🔇 ' : '') + '@' + o.ig, 'nm', no);
  if (npc) for (const n of npc.daftar) if (n.obj.visible && n.jauh < 130) lbl(n.obj, n.tinggi, n.nama + ' · ' + n.peran, 'nm npc', '', n.id);
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
  const dekat = npc.daftar.filter(n => n.obj.visible && n.jauh < 70 && !n.ngobrol);
  if (!dekat.length) return;
  const n = dekat[Math.floor(npc.acak() * dekat.length)];
  n.obj.userData.gel = {m: n.sapa[Math.floor(npc.acak() * n.sapa.length)], sampai: performance.now() + 4000};
}
const pernahSapa = new Set();
const lalu = ms => { const m = Math.max(1, Math.round((Date.now() - ms) / 60000)); return m < 60 ? m + ' menit lalu' : m < 1440 ? Math.round(m / 60) + ' jam lalu' : Math.round(m / 1440) + ' hari lalu'; };
function kabarDesa() {
  const jml = Object.keys(NM).length;
  const ak = Object.entries(AK).filter(([no]) => +no !== S.saya?.no && NM[no]).sort((a, b) => b[1] - a[1]);
  const L = [`Sekarang sudah ${jml} warga yang punya rumah di Kotak Wetan. Makin ramai saja!`];
  if (ak[0]) L.push(`Tadi ${NM[ak[0][0]]} main ke desa, ${lalu(ak[0][1])}. Rumahnya No. ${ak[0][0]}, mampir saja.`);
  L.push('Sudah ada masjid, gereja, gereja Katolik, pura, vihara, klenteng, SD, dan Warung Desa. Lahan dekat rumah Raka masih kosong, nanti diisi dari voting komentar.');
  L.push('Kata Pak RT, Kebun dan Pasar Desa segera dibuka. Siap-siap tanam tomat!');
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
  if (!pernahSapa.has(n.id)) { pernahSapa.add(n.id); misiMaju('sapa'); }
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
// ---------- jejak warga asli: kapan terakhir main, tampil di depan rumahnya ----------
const titikRumah = {position: new THREE.Vector3()};
function jejakWarga(me) {
  if (!I.proxy) return;
  let k = 0;
  for (const [n, L] of I.proxy.isi) {
    const no = +n; if (no === 1 || no === S.saya?.no || !NM[no]) continue;
    if (Math.abs(L.gate.x - me.position.x) > 45 || Math.abs(L.gate.z - me.position.z) > 45) continue;
    let online = false; for (const [x] of S.others) if (x === no) { online = true; break; }
    titikRumah.position.set(L.gate.x, 0, L.gate.z);
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
  const langit = new THREE.Color(0x1a2448).lerp(new THREE.Color(0xbfe4ff), terang);
  sc.background = langit; sc.fog.color = langit; I.light.intensity = .5 + 1.9 * terang; R.toneMappingExposure = .85 + .4 * terang;
  const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  $('jam').innerHTML = `<span class="dsn">Dusun Kotak Wetan · </span>${HARI[d.getUTCDay()]} ${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')} ${terang > .5 ? '☀️' : '🌙'}<small>Kebun & Pasar Desa segera dibuka</small>`;
}
function onResize() {
  R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.fov = innerWidth / innerHeight < 1 ? 55 : 38; cam.updateProjectionMatrix();
  $('miring').hidden = !(portrait() && innerWidth < 760 && !baca('dk_tegak'));
}
addEventListener('resize', onResize);
$('tetapTegak').onclick = () => { simpan('dk_tegak', '1'); $('miring').hidden = true; };
onResize();
layarMasuk();
window.__dk = {S, I: () => I, tokoh, lotRuntime, R};
