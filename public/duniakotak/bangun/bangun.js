// Tukang Kotak (Huda 10 Nov 2026): warga ikut MEMBANGUN fasum pemenang voting. Masuk dari lahan proyek 🚧 di desa
// (tombol 🔨 Bangun), seperti gapura Pelari Kalcer. 1 sesi = 3 tugas: aduk semen (ritme), susun batako (tumpuk 3D), cat dinding (gosok).
// Tiap sesi selesai (warga terdaftar): fasum jadi lebih cepat + koin sesuai skor + poin Piala dusun (aturan & batas di worker.js TK_*).
// Tamu boleh main sebagai latihan (tanpa hadiah, tidak mempercepat).
import '../mabar/js/putar.js'; // HP tegak -> tampil mendatar, sama seperti game desa
import * as THREE from 'three';
import * as F from '../mabar/js/aset/fasum.js';
import {warga, pose} from '../mabar/js/aset/avatar.js';

const $ = id => document.getElementById(id);
const VS = 5;   // skala fasum di game desa
const u = new URLSearchParams(location.search);
const DUSUN = /^(wetan|kulon|curug|tlaga|segara)$/.test(u.get('dusun') || '') ? u.get('dusun') : 'wetan';
for (const a of [$('bDesa'), $('bDesa2')]) a.href = '/duniakotak/mabar/?dusun=' + DUSUN;
let AKUN = null; try { const w = JSON.parse(localStorage.getItem('dk_warga') || 'null'); if (w && w.kunci) AKUN = {no: w.no, kunci: w.kunci}; } catch (e) {}
let INFO = null;
const NAMA_DUSUN = {wetan: 'Kotak Wetan', kulon: 'Kotak Kulon', curug: 'Kotak Curug', tlaga: 'Kotak Tlaga', segara: 'Kotak Segara'};
const WARNA_CAT = {taman: '#a8d5a0', kafe: '#f6ead6', polisi: '#9cc4e8', hiburan: '#f2b8c6'};

// ---------- suara kecil (WebAudio, tanpa file) ----------
let AC = null;
function bunyi(f = 660, d = .08, tipe = 'square', v = .06) {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain();
    o.type = tipe; o.frequency.value = f; g.gain.setValueAtTime(v, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d);
    o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + d + .02); } catch (e) {}
}

// ---------- API ----------
async function apiB(op, data = {}) {
  try {
    if (!AKUN) { const r = await fetch('/duniakotak/api/bangun'); return await r.json(); }
    const r = await fetch('/duniakotak/api/bangun', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({kunci: AKUN.kunci, op, ...data})});
    const j = await r.json(); if (r.status === 401 && op === 'info') AKUN = null; return j;
  } catch (e) { return {galat: 'Sinyal putus. Coba lagi sebentar.'}; }
}

// ---------- 3D: lahan proyek + halaman kerja di depan gerbang ----------
const kanvas = $('kanvas');
const R = new THREE.WebGLRenderer({canvas: kanvas, antialias: true});
R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
R.outputColorSpace = THREE.SRGBColorSpace;
const sc = new THREE.Scene(); sc.background = new THREE.Color(0xbfe4ff); sc.fog = new THREE.Fog(0xbfe4ff, 160, 320);
const cam = new THREE.PerspectiveCamera(45, 1, .5, 600);
sc.add(new THREE.HemisphereLight(0xffffff, 0x6a8a5a, 1.15));
const mat = new THREE.DirectionalLight(0xfff2dc, 1.6); mat.position.set(-60, 110, 70); mat.castShadow = true;
mat.shadow.mapSize.set(1024, 1024); Object.assign(mat.shadow.camera, {left: -80, right: 80, top: 80, bottom: -80, near: 10, far: 300}); sc.add(mat);
const kotak = (w, h, d, c, x = 0, y = 0, z = 0, m = {}) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({color: c, roughness: .85, ...m})); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
{ const t = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({color: 0x7cc46a, roughness: 1})); t.rotation.x = -Math.PI / 2; t.receiveShadow = true; sc.add(t);
  const jl = new THREE.Mesh(new THREE.PlaneGeometry(700, 16), new THREE.MeshStandardMaterial({color: 0xcfc2a2, roughness: 1})); jl.rotation.x = -Math.PI / 2; jl.position.set(0, .03, 78); jl.receiveShadow = true; sc.add(jl);
  const hl = new THREE.Mesh(new THREE.PlaneGeometry(64, 30), new THREE.MeshStandardMaterial({color: 0xc8ab80, roughness: 1})); hl.rotation.x = -Math.PI / 2; hl.position.set(0, .04, 57); hl.receiveShadow = true; sc.add(hl);
  // pohon kotak di sekeliling supaya tidak kosong
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = 92 + (i % 3) * 14, x = Math.cos(a) * r, z = Math.sin(a) * r * .8 - 6; if (z > 60 && Math.abs(x) < 60) continue;
    const s = .8 + (i * 37 % 10) / 20; sc.add(kotak(1.6 * s, 6 * s, 1.6 * s, 0x7a4a2a, x, 3 * s, z)); sc.add(kotak(7 * s, 6 * s, 7 * s, i % 2 ? 0x4f9a4a : 0x3f8a3e, x, 8 * s, z)); } }
let LAHAN = null;
function pasangLahan(info) {
  if (LAHAN) sc.remove(LAHAN);
  const a = info && info.aktif;
  LAHAN = a ? F.proyek('PEMBANGUNAN ' + a.nama.replace(/^\S+ /, '').toUpperCase(), tahapDari(a), F[a.aset] || null) : F.proyek('MENUNGGU VOTING', 0);
  LAHAN.scale.setScalar(VS); sc.add(LAHAN);
}
const tahapDari = a => { const p = (Date.now() - a.mulai) / (a.sampai - a.mulai); return p < 1 / 3 ? 0 : p < 2 / 3 ? 1 : 2; };

// avatar warga + perlengkapan tukang (helm kuning, rompi oranye, alat di tangan kanan; sama dengan tukang NPC di desa)
let AV = null;
function alat(jenis) {
  const g = new THREE.Group(); g.position.set(0, -1.25, .05);
  if (jenis === 'sekop') g.add(kotak(.12, .12, 1.8, 0x8a5a2a, 0, 0, .7), kotak(.55, .08, .6, 0x6a6e74, 0, -.05, 1.6));
  else if (jenis === 'roll') g.add(kotak(.1, .1, 1.3, 0x3a3a40, 0, 0, .55), kotak(.9, .3, .3, 0xffffff, 0, 0, 1.2));
  else g.add(kotak(.1, .1, .7, 0x8a5a2a, 0, 0, .3), kotak(.45, .05, .5, 0xc8ccd2, 0, 0, .75));   // cetok
  return g;
}
function pasangAvatar(av) {
  if (AV) sc.remove(AV.o);
  const o = warga(av || {}); o.traverse(m => { if (m.isMesh) m.castShadow = true; });
  const d = o.userData;
  if (d.head) { const h = new THREE.Group(); h.add(kotak(1.16, .34, 1.16, 0xf2c230, 0, 1.16, 0), kotak(1, .07, .45, 0xf2c230, 0, 1, .72)); d.head.add(h); }
  if (d.body) d.body.add(kotak(1.18, .95, .76, 0xff7a1a, 0, .62, 0));
  sc.add(o); AV = {o, alat: null}; pegang('cetok');
}
function pegang(jenis) { if (!AV || !AV.o.userData.armR) return; if (AV.alat) AV.alat.parent?.remove(AV.alat); AV.alat = alat(jenis); AV.o.userData.armR.add(AV.alat); }
pasangAvatar(null);

// molen (aduk semen) & alas tumpukan (susun batako) di halaman kerja
const MOLEN = new THREE.Group();
{ MOLEN.add(kotak(4, 2, 2.6, 0x555555, 0, 1, 0)); const t = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.4, 3.4, 14), new THREE.MeshStandardMaterial({color: 0xf08a20, roughness: .6}));
  t.rotation.z = .7; t.position.set(0, 3.4, 0); t.castShadow = true; MOLEN.add(t); MOLEN.userData.tabung = t; MOLEN.position.set(-18, 0, 57); sc.add(MOLEN); }
const ALAS = kotak(9, 1.2, 9, 0x9a9a92, 14, .6, 56); sc.add(ALAS);
for (let i = 0; i < 6; i++) sc.add(kotak(2.4, .9, 1.3, 0xd8d2c2, 22 + (i % 2) * 2.6, .45 + Math.floor(i / 2) * .92, 62));   // tumpukan semen

// ---------- kamera ----------
const KAM = {pos: new THREE.Vector3(70, 62, 120), lihat: new THREE.Vector3(0, 6, 20), tPos: new THREE.Vector3(), tLihat: new THREE.Vector3(), orbit: true};
KAM.tPos.copy(KAM.pos); KAM.tLihat.copy(KAM.lihat);
function kameraKe(pos, lihat) { KAM.orbit = false; KAM.tPos.set(...pos); KAM.tLihat.set(...lihat); }
function kameraLobi() { KAM.orbit = true; }
function ukur() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', ukur); ukur();

// ---------- loop ----------
let tLalu = performance.now(), TUGAS = null;
function loop(t) {
  const dt = Math.min(.05, (t - tLalu) / 1000); tLalu = t;
  if (KAM.orbit) { const a = Math.sin(t / 14000) * .55, sempit = innerWidth < 700; KAM.tPos.set(Math.sin(a) * 135 - (sempit ? 0 : 30), 62, Math.cos(a) * 135 + 20); KAM.tLihat.set(sempit ? 0 : -24, 4, 18); }   // kamera berayun pelan di depan gerbang, tidak pernah melintas di atas proyek
  KAM.pos.lerp(KAM.tPos, 1 - Math.pow(.02, dt)); KAM.lihat.lerp(KAM.tLihat, 1 - Math.pow(.02, dt));
  cam.position.copy(KAM.pos); cam.lookAt(KAM.lihat);
  if (TUGAS && TUGAS.tik) TUGAS.tik(dt, t);
  else if (AV) { AV.o.position.set(-6, 0, 60); AV.o.rotation.y = Math.PI * .15; pose(AV.o, {armR: Math.sin(t / 300) * .3, armL: -Math.sin(t / 300) * .2}); }
  R.render(sc, cam); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- format ----------
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const tglWib = t => { const d = new Date(t + 7 * 3600e3); return `${HARI[d.getUTCDay()]} ${d.getUTCDate()} ${BLN[d.getUTCMonth()]}, ${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')} WIB`; };
const lama = ms => { const m = Math.round(ms / 60e3), h = Math.floor(m / 1440), j = Math.floor(m % 1440 / 60), mn = m % 60; return [h && h + ' hari', j && j + ' jam', (!h && mn) && mn + ' menit'].filter(Boolean).join(' ') || '0 menit'; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

// ---------- lobi ----------
function tulisLobi() {
  const d = INFO || {}, a = d.aktif, s = d.saya, at = d.aturan || {};
  $('lNama').textContent = a ? a.nama.replace(/^\S+ /, '') : 'fasum';
  if (!a) {
    $('lStatus').innerHTML = `<b>🎉 Semua fasum sudah jadi!</b><p class="kecil">Proyek berikutnya dimulai begitu voting fasum ditutup. Taruh ⭐ bintangmu di menu ⚙ Atur → Voting di desa.</p>`;
    $('bMulai').disabled = true; $('bMulai').textContent = '🔨 Belum ada proyek';
  } else {
    const kini = Date.now(), p = Math.max(0, Math.min(1, (kini - a.mulai) / (a.sampai - a.mulai))), th = tahapDari(a);
    $('lStatus').innerHTML = `<div class="tahap">${['Fondasi', 'Pasang bata', 'Setengah jadi', 'Jadi'].map((n, i) => `<i class="${i === th ? 'on' : i < th ? 'lewat' : ''}">${n}</i>`).join('')}</div>
      <div class="bar"><span style="width:${(p * 100).toFixed(1)}%"></span><em>${Math.round(p * 100)}% · jadi ${lama(a.sampai - kini)} lagi</em></div>
      <p class="kecil">📍 ${NAMA_DUSUN[a.dusun] || 'Dunia Kotak'} · jadi <b style="color:#fff">${tglWib(a.sampai)}</b></p>
      ${a.maju > 0 ? `<div class="cepat">⚡ ${lama(a.maju)} lebih cepat berkat ${a.sesi} sesi dari ${a.tukang} tukang</div>` : '<div class="cepat">⚡ Belum ada yang ikut kerja. Ayo jadi tukang pertama!</div>'}`;
    $('bMulai').disabled = false; $('bMulai').textContent = AKUN ? '🔨 MULAI KERJA' : '🔨 MAIN LATIHAN';
  }
  const ms = at.maju ? Math.round(at.maju / 60e3) : 20;
  $('lAturan').innerHTML = AKUN && s
    ? `1 sesi = 3 tugas (±1 menit). Tiap sesi: fasum <b>${ms} menit lebih cepat</b>${s.sisaMaju ? '' : ' (jatah hari ini habis)'}. Hadiah koin (maks ${at.koinMaks || 40} 🪙) + poin Piala ${NAMA_DUSUN[dusunNo(s.no)] || 'dusunmu'}: sisa <b>${s.sisaKoin}/${at.sesiKoin || 3}</b> sesi hari ini.`
    : `Kamu main sebagai tamu, jadi ini latihan saja. <a href="/duniakotak/mabar/" style="color:var(--kuning)">Masuk sebagai warga</a> supaya kerjamu mempercepat fasum dan dapat koin.`;
  const top = a?.top || [];
  $('lTop').innerHTML = top.length ? top.map((x, i) => `<div class="${s && x.no === s.no ? 'saya' : ''}"><span>${i + 1}</span><b>@${esc(x.u)}</b><em>${x.sesi} sesi</em></div>`).join('') : '<div><b>Belum ada tukang. Jadilah yang pertama!</b></div>';
  if (s) { $('dompet').hidden = false; $('dompet').textContent = `🪙 ${s.koin} · 💎 ${s.permata}`; }
}
const dusunNo = no => no > 860 ? 'segara' : no > 660 ? 'tlaga' : no > 460 ? 'curug' : no > 260 ? 'kulon' : 'wetan';
async function muat() {
  INFO = await apiB('info');
  if (INFO.saya?.avatar) pasangAvatar(INFO.saya.avatar);
  pasangLahan(INFO); tulisLobi();
}

// ---------- alur sesi ----------
const tunggu = ms => new Promise(r => setTimeout(r, ms));
let SESI = null;
const DAFTAR = [
  {id: 'aduk', ikon: '🪣', judul: 'Aduk semen', ket: 'Ketuk saat jarum masuk zona hijau. Tengah zona = sempurna!'},
  {id: 'susun', ikon: '🧱', judul: 'Susun batako', ket: 'Ketuk untuk menaruh 12 batako. Makin lurus, makin kokoh!'},
  {id: 'cat', ikon: '🖌️', judul: 'Cat dinding', ket: 'Gosok jarimu di dinding sampai rata. 20 detik!'},
];
function titik(i) { [...document.querySelectorAll('#hud .titik i')].forEach((e, k) => { e.className = k < i ? 'ok' : k === i ? 'on' : ''; }); }
function nilai(teks, warna = '#fff') { const n = $('nilai'); n.textContent = teks; n.style.color = warna; n.style.opacity = 1; n.style.transform = 'translate(-50%,-50%) scale(1.15)';
  clearTimeout(nilai.t); nilai.t = setTimeout(() => { n.style.opacity = 0; n.style.transform = 'translate(-50%,-80%) scale(1)'; }, 450); }
async function mulaiSesi() {
  if (SESI) return;
  SESI = {skor: [], batal: false};
  $('lobi').hidden = true; $('dompet').hidden = true; $('hasil').hidden = true; $('kabur').hidden = false; $('hud').hidden = false; $('info').hidden = false;
  if (AKUN && INFO?.aktif) apiB('mulai');
  for (let i = 0; i < DAFTAR.length; i++) {
    const t = DAFTAR[i]; titik(i); $('hTahap').textContent = `TUGAS ${i + 1} DARI 3`; $('hJudul').textContent = t.judul;
    $('bIkon').textContent = t.ikon; $('bJudul').textContent = t.judul; $('bKet').textContent = t.ket; $('banner').hidden = false; bunyi(520, .1); bunyi(780, .12);
    siapkan(t.id); await tunggu(2200); $('banner').hidden = true; if (SESI.batal) return;
    const sk = await jalankan(t.id); if (SESI.batal) return;
    SESI.skor.push(sk); nilai(sk + ' poin', sk >= 80 ? '#9ef0a0' : sk >= 50 ? '#ffe08a' : '#ffb0a0'); await tunggu(900);
  }
  titik(3); await selesaiSesi();
}
function bersih() { TUGAS = null; for (const id of ['meter', 'cat', 'petunjuk', 'banner']) $(id).hidden = true; susun.hapus(); }
function berhenti() { if (!SESI) return; SESI.batal = true; if (TUGAS && TUGAS.akhiri) TUGAS.akhiri(0); bersih(); SESI = null;
  for (const id of ['kabur', 'hud', 'info']) $(id).hidden = true; $('lobi').hidden = false; tulisLobi(); kameraLobi(); pegang('cetok'); }
async function selesaiSesi() {
  bersih(); for (const id of ['kabur', 'hud', 'info']) $(id).hidden = true;
  const skor = Math.round(SESI.skor.reduce((a, b) => a + b, 0) / SESI.skor.length);
  const rinci = DAFTAR.map((t, i) => `<div class="baris"><span>${t.ikon} ${t.judul}</span><b>${SESI.skor[i]}</b></div>`).join('') + `<div class="baris besar"><span>Skor kerja</span><b>${skor}</b></div>`;
  $('hsJudul').textContent = skor >= 85 ? 'Tukang jempolan! 🏆' : skor >= 60 ? 'Kerja bagus! 💪' : 'Lumayan, besok lebih rapi! 🙂';
  $('hsRinci').innerHTML = rinci; $('hsHadiah').innerHTML = '<p class="kecil">Mencatat kerjamu…</p>'; $('hasil').hidden = false; kameraLobi();
  let h = '';
  if (AKUN && INFO?.aktif) {
    const r = await apiB('selesai', {skor});
    if (r.galat) h = `<p class="kecil" style="color:#ffb0a0">${esc(r.galat)}</p>`;
    else {
      const nm = (r.aktif?.nama || INFO.aktif.nama).replace(/^\S+ /, '');
      if (r.maju) h += `<div class="cepat">⚡ ${esc(nm)} jadi ${Math.round(r.maju / 60e3)} menit lebih cepat!</div>`;
      else if (!r.aktif) h += `<div class="cepat">🎉 ${esc(nm)} JADI! Terima kasih, tukang!</div>`;
      else h += `<p class="kecil">Jatah mempercepat hari ini sudah habis. Besok lanjut ya!</p>`;
      if (r.dapat) h += `<div>+${r.dapat} 🪙 koin</div>`; else h += `<p class="kecil">Sesi berhadiah koin hari ini sudah habis (${r.aturan?.sesiKoin || 3}/hari).</p>`;
      if (r.piala) h += `<div>🏆 +${r.piala.dapat} poin Piala untuk ${NAMA_DUSUN[r.piala.d] || r.piala.d}</div>`;
      INFO = r; tulisLobi(); $('dompet').hidden = true;
      if (r.aktif) pasangLahan(r);
    }
  } else h = `<p class="kecil">Ini latihan, jadi belum mempercepat fasum. <a href="/duniakotak/mabar/" style="color:var(--kuning)">Masuk sebagai warga</a> supaya kerjamu tercatat dan dapat koin.</p>`;
  $('hsHadiah').innerHTML = h; bunyi(660, .1); setTimeout(() => bunyi(990, .16), 120);
  SESI = null;
}
function siapkan(id) {
  if (id === 'aduk') { pegang('sekop'); kameraKe([-4, 14, 84], [-14, 4, 57]); }
  if (id === 'susun') { pegang('cetok'); susun.siap(); kameraKe([30, 19, 80], [14, 5, 56]); }
  if (id === 'cat') { pegang('roll'); kameraKe([0, 26, 110], [0, 8, 30]); }
}
function jalankan(id) { return new Promise(selesai => { ({aduk: aduk, susun: susun.main, cat: cat})[id](selesai); }); }

// ---------- TUGAS 1: aduk semen (ritme) ----------
function aduk(selesai) {
  const N = 10; let ke = 0, total = 0, pos = 0, arah = 1, laju = .75, zona = .5, lebar = .24, tLalu = 0;
  const z = $('zona'), j = $('jarum');
  const aturZona = () => { lebar = Math.max(.13, .24 - ke * .012); zona = lebar / 2 + .05 + Math.random() * (.9 - lebar); z.style.left = (zona - lebar / 2) * 100 + '%'; z.style.width = lebar * 100 + '%'; };
  aturZona(); $('meter').hidden = false; $('petunjuk').hidden = false; $('petunjuk').textContent = 'Ketuk layar (atau Spasi) saat jarum di zona hijau';
  $('iAngka').textContent = `0/${N}`; $('iLabel').textContent = 'adukan';
  const ketuk = e => {
    if (e && e.target && e.target.closest && e.target.closest('#kabur')) return;
    const kini = performance.now(); if (kini - tLalu < 450) return; tLalu = kini;
    const jarak = Math.abs(pos - zona); let n = 0;
    if (jarak <= lebar * .15) { n = 100; nilai('SEMPURNA!', '#9ef0a0'); bunyi(990, .09); }
    else if (jarak <= lebar / 2) { n = 70; nilai('Pas!', '#ffe08a'); bunyi(760, .08); }
    else if (jarak <= lebar / 2 + .05) { n = 30; nilai('Hampir', '#ffd0a0'); bunyi(420, .08); }
    else { nilai('Meleset', '#ffb0a0'); bunyi(200, .12, 'sawtooth'); }
    total += n; ke++; laju += .07; MOLEN.userData.putar = (MOLEN.userData.putar || 0) + n / 25;
    $('iAngka').textContent = `${ke}/${N}`;
    if (ke >= N) akhiri(Math.round(total / N)); else aturZona();
  };
  const tombol = e => { if (e.code === 'Space') { e.preventDefault(); ketuk(); } };
  const akhiri = sk => { removeEventListener('pointerdown', ketuk); removeEventListener('keydown', tombol); $('meter').hidden = true; $('petunjuk').hidden = true; TUGAS = null; selesai(sk); };
  addEventListener('pointerdown', ketuk); addEventListener('keydown', tombol);
  TUGAS = {akhiri, tik(dt, t) {
    pos += arah * laju * dt; if (pos > 1) { pos = 1; arah = -1; } if (pos < 0) { pos = 0; arah = 1; } j.style.left = pos * 100 + '%';
    const tb = MOLEN.userData.tabung; tb.rotation.y += dt * (1 + (MOLEN.userData.putar || 0)); MOLEN.userData.putar = Math.max(0, (MOLEN.userData.putar || 0) - dt * 2);
    AV.o.position.set(-12, 0, 61); AV.o.rotation.y = -Math.PI * .45; pose(AV.o, {armR: -.9 + Math.sin(t / 160) * .5, armL: -.6 + Math.sin(t / 160) * .4});
  }};
}

// ---------- TUGAS 2: susun batako (tumpuk 3D) ----------
const susun = (() => {
  const LAPIS = 12, TINGGI = 1.1, ALAS_Y = 1.2, PUSAT = {x: 14, z: 56};
  let grup = null, jatuh = [];
  const warna = () => { const a = INFO?.aktif; const th = a ? tahapDari(a) : 1; return [0x9a9a92, 0xb84a32, 0xd8d0be][th]; };
  function hapus() { if (grup) sc.remove(grup); grup = null; jatuh = []; }
  function siap() { hapus(); grup = new THREE.Group(); sc.add(grup); }
  function main(selesai) {
    if (!grup) siap();
    const c = warna(); let lap = 0, coba = 0, total = 0, ukuran = {x: 7, z: 7}, pusat = {x: PUSAT.x, z: PUSAT.z}, gerak = null, t0 = performance.now(), tLalu = 0;
    $('petunjuk').hidden = false; $('petunjuk').textContent = 'Ketuk layar (atau Spasi) untuk menaruh batako'; $('iAngka').textContent = `0/${LAPIS}`; $('iLabel').textContent = 'batako';
    susun.geser = () => gerak ? Math.abs(gerak.m.position[gerak.sumbu] - pusat[gerak.sumbu]) : 99;   // dipakai uji otomatis
    const baru = () => {
      const sumbu = lap % 2 ? 'z' : 'x', m = kotak(ukuran.x, TINGGI, ukuran.z, c); m.position.set(pusat.x, ALAS_Y + lap * TINGGI + TINGGI / 2, pusat.z);
      grup.add(m); gerak = {m, sumbu, fase: Math.random() * Math.PI * 2, laju: 1.2 + lap * .08};
    };
    const taruh = e => {
      if (e && e.target && e.target.closest && e.target.closest('#kabur')) return;
      if (!gerak) return; const kini = performance.now(); if (kini - tLalu < 280) return; tLalu = kini;
      const {m, sumbu} = gerak, uk = ukuran[sumbu], d = m.position[sumbu] - pusat[sumbu];
      let tumpang = uk - Math.abs(d);
      // meleset: batako jatuh, lapis ini 0 poin, coba lagi di lapis yang sama (tidak langsung kalah, ramah untuk HP)
      if (tumpang <= 0) { jatuh.push({m, v: 0}); gerak = null; coba++; nilai('Jatuh!', '#ffb0a0'); bunyi(160, .2, 'sawtooth'); $('iAngka').textContent = `${coba}/${LAPIS}`; if (coba >= LAPIS) return akhiri(); return baru(); }
      if (Math.abs(d) < .45) { m.position[sumbu] = pusat[sumbu]; tumpang = uk; nilai('LURUS!', '#9ef0a0'); bunyi(880 + lap * 30, .09); }
      else {
        // potong bagian yang menggantung, lalu jatuhkan potongannya
        const sisa = Math.abs(d), tengahBaru = pusat[sumbu] + d / 2;
        const pt = kotak(sumbu === 'x' ? sisa : ukuran.x, TINGGI, sumbu === 'z' ? sisa : ukuran.z, c);
        pt.position.copy(m.position); pt.position[sumbu] = tengahBaru + Math.sign(d) * (tumpang + sisa) / 2; grup.add(pt); jatuh.push({m: pt, v: 0});
        m.scale[sumbu] = tumpang / uk; m.position[sumbu] = tengahBaru; pusat[sumbu] = tengahBaru; ukuran[sumbu] = tumpang;
        // skala geometri: ganti dengan kotak baru supaya bayangan & ukuran rapi
        const g2 = kotak(ukuran.x, TINGGI, ukuran.z, c); g2.position.copy(m.position); grup.remove(m); grup.add(g2);
        nilai(tumpang / uk > .8 ? 'Rapi' : 'Miring', tumpang / uk > .8 ? '#ffe08a' : '#ffd0a0'); bunyi(620 + lap * 20, .07);
      }
      total += tumpang / uk; lap++; coba++; gerak = null; $('iAngka').textContent = `${coba}/${LAPIS}`;
      KAM.tPos.y = 19 + lap * TINGGI; KAM.tLihat.y = 5 + lap * TINGGI;
      if (coba >= LAPIS) return akhiri(); baru();
    };
    const tombol = e => { if (e.code === 'Space') { e.preventDefault(); taruh(); } };
    let beres = false;
    const akhiri = sk => { if (beres) return; beres = true; removeEventListener('pointerdown', taruh); removeEventListener('keydown', tombol); $('petunjuk').hidden = true;
      setTimeout(() => { TUGAS = null; selesai(sk ?? Math.round(total / LAPIS * 100)); }, sk === 0 ? 0 : 500); };
    addEventListener('pointerdown', taruh); addEventListener('keydown', tombol); baru();
    TUGAS = {akhiri: () => akhiri(0), tik(dt, t) {
      if (gerak) { const g = gerak, w = Math.sin((t - t0) / 1000 * g.laju + g.fase) * 9; g.m.position[g.sumbu] = pusat[g.sumbu] + w; }
      for (const j of jatuh) { j.v += dt * 30; j.m.position.y -= j.v * dt; j.m.rotation.x += dt * 1.5; }
      jatuh = jatuh.filter(j => { if (j.m.position.y < -6) { grup?.remove(j.m); return false; } return true; });
      AV.o.position.set(5, 0, 60); AV.o.rotation.y = Math.PI * .4; pose(AV.o, {armR: -1.2 + Math.sin(t / 200) * .3, armL: -.3});
    }};
  }
  return {siap, main, hapus};
})();

// ---------- TUGAS 3: cat dinding (gosok) ----------
function cat(selesai) {
  const kv = $('tembok'); $('cat').hidden = false;
  const r = kv.getBoundingClientRect(), W = Math.round(r.width), H = Math.round(r.height), dpr = Math.min(devicePixelRatio || 1, 2);
  kv.width = W * dpr; kv.height = H * dpr; const x = kv.getContext('2d'); x.scale(dpr, dpr);
  // dinding plester abu + 2 jendela (tidak perlu dicat) + retak tipis
  x.fillStyle = '#c9c3b6'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 1; for (let i = 0; i < 9; i++) { x.beginPath(); const a = Math.random() * W, b = Math.random() * H; x.moveTo(a, b); x.lineTo(a + 20 - Math.random() * 40, b + 20 - Math.random() * 40); x.stroke(); }
  const jendela = [[.16, .22, .2, .42], [.64, .22, .2, .42]];
  const gambarJendela = () => { for (const [a, b, c, d] of jendela) { x.fillStyle = '#5a7a9a'; x.fillRect(a * W - 4, b * H - 4, c * W + 8, d * H + 8); x.fillStyle = '#8fd0ec'; x.fillRect(a * W, b * H, c * W, d * H); x.fillStyle = '#5a7a9a'; x.fillRect((a + c / 2) * W - 2, b * H, 4, d * H); } };
  gambarJendela();
  const GX = 32, GY = 16, sel = new Uint8Array(GX * GY); let perlu = 0;
  const diJendela = (px, py) => jendela.some(([a, b, c, d]) => px >= a && px <= a + c && py >= b && py <= b + d);
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) { if (diJendela((i + .5) / GX, (j + .5) / GY)) sel[j * GX + i] = 2; else perlu++; }
  const warna = WARNA_CAT[INFO?.aktif?.id] || '#f1dcb4', R0 = Math.max(18, W * .07);
  let kena = 0, turun = false, akhir = performance.now() + 20000, beres = false, lalu = null;
  $('petunjuk').hidden = false; $('petunjuk').textContent = 'Gosok jarimu di dinding sampai rata';
  const oles = (px, py) => {
    x.fillStyle = warna; x.beginPath(); x.arc(px, py, R0, 0, Math.PI * 2); x.fill();
    if (lalu) { x.strokeStyle = warna; x.lineWidth = R0 * 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(lalu[0], lalu[1]); x.lineTo(px, py); x.stroke(); }
    const ax = lalu ? lalu[0] : px, ay = lalu ? lalu[1] : py, langkah = Math.max(1, Math.ceil(Math.hypot(px - ax, py - ay) / (R0 / 2)));
    for (let s = 0; s <= langkah; s++) { const cx = ax + (px - ax) * s / langkah, cy = ay + (py - ay) * s / langkah;
      for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) { const k = j * GX + i; if (sel[k]) continue; const sx = (i + .5) / GX * W, sy = (j + .5) / GY * H; if (Math.hypot(sx - cx, sy - cy) < R0) { sel[k] = 1; kena++; } } }
    lalu = [px, py]; gambarJendela();
    if (Math.random() < .25) bunyi(300 + Math.random() * 80, .03, 'triangle', .03);
    if (kena / perlu >= .97) akhiri();
  };
  const titikDi = e => { const b = kv.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * H]; };
  const bawah = e => { turun = true; lalu = null; oles(...titikDi(e)); }, geser = e => { if (turun) oles(...titikDi(e)); }, atas = () => { turun = false; lalu = null; };
  kv.addEventListener('pointerdown', bawah); addEventListener('pointermove', geser); addEventListener('pointerup', atas);
  const akhiri = (paksa) => { if (beres) return; beres = true; kv.removeEventListener('pointerdown', bawah); removeEventListener('pointermove', geser); removeEventListener('pointerup', atas);
    $('petunjuk').hidden = true; setTimeout(() => { $('cat').hidden = true; TUGAS = null; selesai(paksa === 0 ? 0 : Math.min(100, Math.round(kena / perlu / .95 * 100))); }, paksa === 0 ? 0 : 400); };
  TUGAS = {akhiri: () => akhiri(0), tik(dt, t) {
    const sisa = Math.max(0, akhir - performance.now()); $('iAngka').textContent = Math.round(kena / perlu * 100) + '%'; $('iLabel').textContent = `rata · ${Math.ceil(sisa / 1000)} dtk`;
    if (!sisa) akhiri();
    AV.o.position.set(-6, 0, 60); AV.o.rotation.y = Math.PI; pose(AV.o, {armR: -2.2 + Math.sin(t / 140) * .5, armL: -.2});
  }};
}

// ---------- tombol ----------
$('bMulai').onclick = () => { bunyi(660, .08); mulaiSesi(); };
$('bLagi').onclick = () => { bunyi(660, .08); $('hasil').hidden = true; if (INFO?.aktif) mulaiSesi(); else { $('lobi').hidden = false; tulisLobi(); } };
$('kabur').onclick = e => { e.stopPropagation(); berhenti(); };
$('hasil').addEventListener('click', e => { if (e.target === $('hasil')) { $('hasil').hidden = true; $('lobi').hidden = false; tulisLobi(); } });
muat();
window.__tk = {INFO: () => INFO, mulai: mulaiSesi, berhenti, geser: () => susun.geser ? susun.geser() : 99};
