// Mabar Dunia Kotak — Dusun Kotak Wetan. Denah baku (village) + aset video (rumah, pekarangan, batu nama,
// warung panen, rumah kucing, avatar, Raka, Oyen). Online lewat /duniakotak/api/ruang (WebSocket).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {raka, pose as rpose, reseed} from './js/lib.js';
import * as D from './js/desa.js';
import {warga, pose as wpose, KULIT, WARNA_RAMBUT, GAYA_RAMBUT} from './js/aset/avatar.js';
import {kucingMesh} from './js/aset/kucing.js';
import {warungMesh, rumahKucingMesh} from './js/aset/rumah.js';

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
const JALAN = ['Melati','Mawar','Kenanga','Anggrek','Mangga','Rambutan','Durian','Salak','Jambu','Manggis'];
const alamat = n => { const rt = Math.ceil(n / 20); return `Jl. ${JALAN[(rt - 1) % 10]} No. ${((n - 1) % 20) + 1} · RT ${String(rt).padStart(2, '0')}/RW ${rt <= 5 ? '01' : '02'}`; };

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
    try { const s = await api('sesi', {kunci: lama.kunci}); return selesaiMasuk(s); }
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
function bukaPembuatAvatar(av, pertama) {
  $('buatAvatar').hidden = false;
  if (!pv) {
    const r = new THREE.WebGLRenderer({canvas: $('pratinjau'), antialias: true, alpha: true});
    r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); r.setSize(360, 420, false); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x88aa88, 1.6)); const d = new THREE.DirectionalLight(0xfff4e0, 2.2); d.position.set(4, 8, 10); sc.add(d);
    const cam = new THREE.PerspectiveCamera(30, 360 / 420, .1, 100); cam.position.set(0, 2.6, 13); cam.lookAt(0, 2.1, 0);
    pv = {r, sc, cam, obj: null, t: 0};
  }
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
const hemat = (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) <= 3;
const R = new THREE.WebGLRenderer({canvas: $('layar'), antialias: !hemat, powerPreference: 'high-performance'});
R.setPixelRatio(Math.min(hemat ? 1.25 : 1.75, devicePixelRatio || 1));
R.shadowMap.enabled = true; R.shadowMap.type = hemat ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.25; R.outputColorSpace = THREE.SRGBColorSpace;
const sc = new THREE.Scene(); sc.background = new THREE.Color(0xbfe4ff); sc.fog = new THREE.Fog(0xbfe4ff, 260, 520);
const cam = new THREE.PerspectiveCamera(38, 1, 1, 560);
let I = null, NM = {};
const lotRuntime = new Map();   // no → {g, extra, rects}
const dekor = new Map();        // rects statis tambahan

async function bangunDunia() {
  try { const w = await (await fetch('/duniakotak/api/warga')).json(); w.warga.forEach(x => { if (x.ig || x.tiktok) NM[x.no] = '@' + (x.ig || x.tiktok); }); } catch (e) {}
  if (S.saya && S.saya.ig) NM[S.saya.no] = '@' + S.saya.ig;
  await document.fonts.load('900 40px Montserrat').catch(() => {});
  reseed(301);
  I = D.village(sc, {cols: 5, rows: 12, fasumB: [[2,4],[2,5],[1,6],[2,6],[3,6],[1,7],[2,7],[3,7]], fasumH: [[2,11,1]], sungai: {gap: 6, w: 14, sawah: 40}, hutan: 1, tipis: .02,
    raka: 'done', filled: 999, isFilled: n => !!NM[n], names: NM, lazy: true, sm: hemat ? 1024 : 2048, shadowR: 70});
  I.light.castShadow = true;
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
  if (L.proxyIdx != null) setProxy(L, false);
}
function setProxy(L, tampil) {
  const {imW, imA} = I.proxy; const M = new THREE.Matrix4();
  const hx = L.c.x + L.dir * -2 * VS, hz = L.c.z + L.dir * -.6 * VS, s = tampil ? 1 : 0;
  M.compose(new THREE.Vector3(hx, .65 * VS, hz), new THREE.Quaternion(), new THREE.Vector3(s, s, s)); imW.setMatrixAt(L.proxyIdx, M);
  M.compose(new THREE.Vector3(hx, 1.75 * VS, hz), new THREE.Quaternion(), new THREE.Vector3(s, s, .8 * s)); imA.setMatrixAt(L.proxyIdx, M);
  imW.instanceMatrix.needsUpdate = imA.instanceMatrix.needsUpdate = true;
}
function aturKavling(px, pz) {
  const RX = hemat ? 120 : 150, ZF = hemat ? 150 : 190, ZB = 70;
  for (const [ns, L] of Object.entries(I.lots)) {
    const n = +ns, ddx = L.c.x - px, ddz = L.c.z - pz, sn = Math.sin(yawNow), cs = Math.cos(yawNow);
    const dx = Math.abs(ddx * cs - ddz * sn), dz = ddx * sn + ddz * cs;   // dz < 0 = di depan kamera
    const dekat = dx < RX && dz > -ZF && dz < ZB;
    const ada = lotRuntime.get(n);
    if (dekat && !ada) { bangunKavling(n); return; }       // satu kavling per giliran supaya tidak patah-patah
    if (!dekat && ada && (dx > RX + 40 || dz < -ZF - 40 || dz > ZB + 40)) { buang(ada.g); buang(ada.extra); lotRuntime.delete(n); if (L.proxyIdx != null) setProxy(L, true); }
  }
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
// 5. LABEL & GELEMBUNG
// =====================================================================
const lab = $('label'); const pool = [];
const V = new THREE.Vector3();
function tempel(obj, tinggi, teks, cls, dy = 0) {
  V.copy(obj.position); V.y += tinggi; V.project(cam);
  if (V.z > 1 || V.x < -1.2 || V.x > 1.2 || V.y < -1.2 || V.y > 1.2) return null;
  let d = pool.find(x => !x.dipakai); if (!d) { d = {el: document.createElement('div')}; lab.appendChild(d.el); pool.push(d); }
  d.dipakai = true; if (d.el.className !== cls) d.el.className = cls; if (d.el._t !== teks) { d.el.textContent = teks; d.el._t = teks; }
  d.el.style.left = ((V.x + 1) / 2 * innerWidth) + 'px'; d.el.style.top = ((1 - V.y) / 2 * innerHeight + dy) + 'px'; d.el.style.display = '';
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
  S.ws.send(JSON.stringify({t: 'c', ch: S.ch, m}));
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
  else if (q.t === 'e') { if (!S.bisu.has(q.no)) { gelembung(q.no, EMO[q.e] || '👋', true); bunyi('emosi'); } }
  else if (q.t === 'tolak' || q.t === 'info') toast(q.m, 3500);
}
function hitungOnline() { $('profOnline').textContent = S.tamu ? 'Mode tamu · daftar untuk ngobrol' : `● ${S.others.size + 1} warga online`; }
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
addEventListener('keydown', e => { if (document.activeElement && document.activeElement.tagName === 'INPUT') return; gerak.kunci[e.key.toLowerCase()] = true; if (e.key === 'q' || e.key === 'Q') putar(1); if (e.key === 'e' || e.key === 'E') putar(-1); if (e.key === 'Enter') { $('ketik').focus(); e.preventDefault(); } });
addEventListener('keyup', e => { gerak.kunci[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { gerak.kunci = {}; });
const stik = $('stik'), kenop = $('kenop');
stik.addEventListener('pointerdown', e => { stik.setPointerCapture(e.pointerId); gerak.stik = {id: e.pointerId, x: 0, y: 0}; gerak.tujuan = null; geserStik(e); });
stik.addEventListener('pointermove', e => { if (gerak.stik && gerak.stik.id === e.pointerId) geserStik(e); });
const lepasStik = e => { if (gerak.stik && gerak.stik.id === e.pointerId) { gerak.stik = null; kenop.style.transform = ''; } };
stik.addEventListener('pointerup', lepasStik); stik.addEventListener('pointercancel', lepasStik);
function geserStik(e) { const r = stik.getBoundingClientRect(); let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2); const m = r.width / 2 - 20, l = Math.hypot(x, y); if (l > m) { x *= m / l; y *= m / l; } kenop.style.transform = `translate(${x}px,${y}px)`; gerak.stik.x = x / m; gerak.stik.y = y / m; }
// ketuk tanah = jalan ke titik itu; ketuk tokoh warga = menu
const ray = new THREE.Raycaster(), lantai = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
$('layar').addEventListener('pointerup', e => {
  $('menuWarga').hidden = true;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const m = new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(m, cam);
  const titik = new THREE.Vector3(); if (ray.ray.intersectPlane(lantai, titik)) { gerak.tujuan = titik; }
});
lab.addEventListener('click', e => {
  const el = e.target.closest('.nm'); if (!el || !el.dataset.no) return;
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
$('kSimpan').onclick = () => { if (!fotoBlob) return; const a = document.createElement('a'); a.href = URL.createObjectURL(fotoBlob); a.download = 'dunia-kotak.jpg'; a.click(); };
$('kBagi').onclick = async () => {
  if (!fotoBlob) return; const f = new File([fotoBlob], 'dunia-kotak.jpg', {type: 'image/jpeg'});
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
  // kavling di sekitar pemain dibangun dulu sebelum layar dibuka
  for (let i = 0; i < 40; i++) aturKavling(tokoh.saya.position.x, tokoh.saya.position.z);
  $('masuk').hidden = true; $('hud').hidden = false;
  $('profNama').textContent = S.tamu ? 'Tamu' : '@' + S.saya.ig + ' · No. ' + S.saya.no;
  $('profAlamat').textContent = S.tamu ? 'Dusun Kotak Wetan' : alamat(S.saya.no) + ' · Kotak Wetan';
  $('profAva').style.background = S.av.kulit;
  hitungOnline(); tulisChat(); aturHUD(); sambung();
  if (!baca('dk_panduan')) panduan();
  onResize(); requestAnimationFrame(loop);
}
function aturHUD() {
  $('chat').querySelectorAll('.tab button[data-ch]').forEach(b => b.onclick = () => { S.ch = b.dataset.ch; $('chat').querySelectorAll('.tab button[data-ch]').forEach(x => x.classList.toggle('on', x === b)); tulisChat(); });
  $('formChat').onsubmit = e => { e.preventDefault(); kirimChat($('ketik').value); $('ketik').value = ''; $('ketik').blur(); };
  $('chat').querySelectorAll('.cepat button').forEach(b => b.onclick = () => {
    if (b.dataset.q) return kirimChat(b.dataset.q);
    if (S.tamu) return toast('Daftar jadi warga dulu untuk menyapa.');
    if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify({t: 'e', e: b.dataset.e}));
  });
  $('bTutupChat').onclick = () => { $('chat').hidden = true; $('bBukaChat').hidden = false; };
  $('bBukaChat').onclick = () => { $('chat').hidden = false; $('bBukaChat').hidden = true; };
  $('bRumah').onclick = () => pergiKe(S.tamu ? 1 : S.saya.no);
  $('bKamera').onclick = () => bukaKamera();
  $('profil').style.cursor = 'pointer';
  $('profil').onclick = () => { if (S.tamu) return toast('Daftar di willoapparel.com/duniakotak supaya dapat kavling.', 4000); toast(`Kode wargamu: ${S.saya.kode} · pakai untuk masuk dari HP lain. Jangan dibagikan.`, 6000); };
  $('bAvatar').onclick = () => bukaPembuatAvatar(JSON.parse(JSON.stringify(S.av)), false);
  $('bPanduan').onclick = () => panduan();
  musikSiap();
  $('putKiri').onclick = () => putar(1); $('putKanan').onclick = () => putar(-1);
  $('zIn').onclick = () => { zoom = Math.max(.6, zoom - .15); };
  $('zOut').onclick = () => { zoom = Math.min(1.8, zoom + .15); };
  if (innerHeight < 500) { $('chat').hidden = true; $('bBukaChat').hidden = false; zoom = .85; }
  if (portrait() && innerWidth <= 700) { $('chat').hidden = true; $('bBukaChat').hidden = false; }
}
function panduan() {
  const nama = S.tamu ? 'tamu' : '@' + S.saya.ig;
  const L = [
    `Halo ${nama}! Aku Raka, ini Oyen. Selamat datang di Dusun Kotak Wetan!`,
    S.tamu ? 'Kamu sedang lihat-lihat sebagai tamu. Daftar jadi warga di willoapparel.com/duniakotak supaya dapat kavling dan bisa ngobrol.' : `Rumahmu di ${alamat(S.saya.no)}. Batu di depan rumah sudah terukir namamu.`,
    'Jalan pakai joystick di kiri bawah, atau ketuk tanah tujuanmu. Di laptop pakai tombol panah atau WASD.',
    'Chat Sekitar terlihat warga di dekatmu, Chat Dusun untuk semua warga dusun. Ketuk nama warga untuk lihat rumahnya, bisukan, atau laporkan.',
    'Kebun, koin, dan Pasar Desa segera dibuka. Sekarang ayo jalan-jalan dan sapa tetangga. Meong! kata Oyen.',
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
const KEC = 15;   // satuan dunia per detik (avatar setinggi pintu ≈ 4,1)
let tAkhir = performance.now(), tKav = 0, ph = 0;
const bebas = (x, z) => {
  const b = I.batas; if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return false;
  const s = I.sungai; if (x > s.x0 && x < s.x1 && !s.jembatan.some(([a, c]) => z > a && z < c)) return false;
  for (const {rects} of lotRuntime.values()) for (const [x0, x1, z0, z1] of rects) if (x > x0 - 1.2 && x < x1 + 1.2 && z > z0 - 1.2 && z < z1 + 1.2) return false;
  return true;
};
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (t - tAkhir) / 1000); tAkhir = t;
  const me = tokoh.saya; let vx = 0, vz = 0;
  const k = gerak.kunci;
  if (k['w'] || k['arrowup']) vz -= 1; if (k['s'] || k['arrowdown']) vz += 1; if (k['a'] || k['arrowleft']) vx -= 1; if (k['d'] || k['arrowright']) vx += 1;
  if (gerak.stik) { vx += gerak.stik.x; vz += gerak.stik.y; }
  if (vx || vz) { const sn = Math.sin(yawNow), cs = Math.cos(yawNow); const ax = vx * cs + vz * sn, az = -vx * sn + vz * cs; vx = ax; vz = az; }
  if (vx || vz) gerak.tujuan = null;
  else if (gerak.tujuan) { const dx = gerak.tujuan.x - me.position.x, dz = gerak.tujuan.z - me.position.z, l = Math.hypot(dx, dz); if (l < 1.5) gerak.tujuan = null; else { vx = dx / l; vz = dz / l; } }
  const l = Math.hypot(vx, vz); gerak.jalan = l > .15;
  if (gerak.jalan) {
    const s = Math.min(1, l) * KEC * dt / l; const nx = me.position.x + vx * s, nz = me.position.z + vz * s;
    let maju = false;
    if (bebas(nx, me.position.z)) { me.position.x = nx; maju = true; }
    if (bebas(me.position.x, nz)) { me.position.z = nz; maju = true; }
    if (!maju) gerak.tujuan = null;
    const tr = Math.atan2(vx, vz); let dr = tr - me.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); me.rotation.y += dr * Math.min(1, dt * 12);
    const lk = Math.floor(ph / Math.PI); ph += dt * 11; if (Math.floor(ph / Math.PI) !== lk) bunyi('langkah'); jalanAnim(me, ph, .7);
  } else jalanAnim(me, 0, 0);
  // warga lain: interpolasi
  for (const o of S.others.values()) {
    const p = o.obj.position; const a = Math.min(1, dt * 8); p.x += (o.tx - p.x) * a; p.z += (o.tz - p.z) * a;
    let dr = o.tr - o.obj.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); o.obj.rotation.y += dr * a;
    const jalan = o.a && performance.now() - (o.akhir || 0) < 600; if (jalan) { o.ph += dt * 11; jalanAnim(o.obj, o.ph, .7); } else jalanAnim(o.obj, 0, 0);
  }
  // Raka menghadap pemain bila dekat, Oyen mengibas
  const dR = tokoh.raka.position.distanceTo(me.position);
  if (dR < 40) { const tr = Math.atan2(me.position.x - tokoh.raka.position.x, me.position.z - tokoh.raka.position.z); let dr = tr - tokoh.raka.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); tokoh.raka.rotation.y += dr * Math.min(1, dt * 4); }
  if (dR < 25 && !tokoh.raka.userData.sapa) { tokoh.raka.userData.sapa = 1; gelembung('raka', S.tamu ? 'Halo! Yuk daftar jadi warga 😄' : 'Halo @' + S.saya.ig + '! Mampir ke warungku ya.'); }
  if (dR > 60) tokoh.raka.userData.sapa = 0;
  tokoh.oyen.userData.ph += dt; tokoh.oyen.position.y = Math.abs(Math.sin(tokoh.oyen.userData.ph * 1.3)) * .15;
  // kamera ikut pemain (dikunci di dalam hutan pembatas)
  const tx = me.position.x, tz = me.position.z;
  let dy = yaw - yawNow; yawNow += dy * Math.min(1, dt * 6);
  const sn = Math.sin(yawNow), cs = Math.cos(yawNow);
  cam.position.set(tx + sn * 58 * zoom, 40 * zoom, tz + cs * 58 * zoom); cam.lookAt(tx - sn * 14, 2, tz - cs * 14);
  // bayangan ikut pemain
  I.light.position.set(tx + 60, 100, tz + 72); I.light.target.position.set(tx, 0, tz); I.light.target.updateMatrixWorld();
  // kavling dekat dibangun bertahap
  if (t - tKav > 120) { tKav = t; aturKavling(tx, tz); }
  siangMalam(t);
  kirimPos(false);
  R.render(sc, cam);
  // label
  pool.forEach(d => { d.dipakai = false; });
  const lbl = (o, h, teks, cls, no) => { const el = tempel(o, h, teks, cls); if (el) el.dataset.no = no || ''; };
  lbl(me, 5.2, S.tamu ? 'Kamu (tamu)' : '@' + S.saya.ig, 'nm saya');
  lbl(tokoh.raka, 5.2, '★ Raka', 'nm raka'); lbl(tokoh.oyen, 2.6, 'Oyen', 'nm raka kucing');
  for (const [no, o] of S.others) if (o.obj.position.distanceTo(me.position) < 220) lbl(o.obj, 5.2, (S.bisu.has(no) ? '🔇 ' : '') + '@' + o.ig, 'nm', no);
  const now = performance.now();
  for (const o of [me, tokoh.raka, ...[...S.others.values()].map(x => x.obj)]) { const g = o.userData.gel; if (g && g.sampai > now) tempel(o, 6.6, g.m, g.emo ? 'gel emo' : 'gel', -4); }
  pool.forEach(d => { if (!d.dipakai) d.el.style.display = 'none'; });
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
