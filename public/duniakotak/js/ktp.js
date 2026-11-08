// Kartu Warga Dunia Kotak: kartu identitas warga versi desa kotak, digambar di kanvas (bisa disimpan/dibagikan ke story).
// Foto = avatar warga (aset avatar.js yang sama dengan game). Tanpa lambang negara: ini kartu desa fiksi.
import * as THREE from 'three';
import {warga, pose, KULIT, WARNA_RAMBUT, GAYA_RAMBUT} from '../mabar/js/aset/avatar.js';
export {KULIT, WARNA_RAMBUT, GAYA_RAMBUT};

// Pilihan avatar = sama persis dengan pembuat avatar di game mabar.
export const ATASAN = ['kaos','kaos-willo','kemeja','jaket','batik','seragam'];
export const BAWAHAN = {L: ['celana','pendek','sarung'], P: ['celana','rok','rok-panjang']};
export const WARNA_BAJU = ['#1d1d22','#f4f4f4','#3a7bd5','#d0442f','#2a9a5a','#f2c14e','#8a5ad8','#e06a9a'];
export const WARNA_BAWAH = ['#2f3a52','#1d1d22','#6a5a48','#3a5a3a','#7a2a2a','#c8b89a'];
const hexOk = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
export function bersihAv(a) {
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
// Avatar bawaan sebelum warga memilih (sama dengan game).
export const avAcak = no => { const r = n => (no * 7919 + n * 104729) % 997; const jenis = r(1) % 2 ? 'P' : 'L';
  return bersihAv({jenis, kulit: KULIT[r(2) % 6], rambut: {gaya: GAYA_RAMBUT[jenis][r(3) % GAYA_RAMBUT[jenis].length], warna: WARNA_RAMBUT[r(4) % 6]}, atasan: {jenis: ATASAN[r(5) % 5], warna: WARNA_BAJU[r(6) % 8]}, bawahan: {jenis: BAWAHAN[jenis][0], warna: WARNA_BAWAH[r(7) % 6]}}); };

const JALAN = ['Melati','Mawar','Kenanga','Anggrek','Mangga','Rambutan','Durian','Salak','Jambu','Manggis','Sawo','Nangka','Belimbing','Kelengkeng','Sirsak'];
// Kotak Wetan = warga No. 1–260; Kotak Kulon (bukit teh) = No. 261–460; Kotak Curug (lereng gunung) = No. 461–660 (dibuka 6 Nov 2026);
// Kotak Tlaga (tepi danau) = No. 661–860 (dibuka 8 Nov 2026); Kotak Segara (apartemen tepi teluk) = No. 861+ tak terbatas
const AWAL_KULON = 260, AWAL_CURUG = 460, AWAL_TLAGA = 660, AWAL_SEGARA = 860;
const JALAN_KULON = ['Teh','Kopi','Cengkeh','Kayu Manis','Pala','Lada','Vanili','Kakao','Jahe','Kunyit'];
const JALAN_CURUG = ['Pinus','Cemara','Jati','Mahoni','Damar','Rasamala','Puspa','Pakis','Edelweis','Akasia'];
const JALAN_TLAGA = ['Nila','Mujair','Gurami','Lele','Patin','Bawal','Tawes','Nilem','Wader','Betok'];
export const dusun = n => n > AWAL_SEGARA ? 'Kotak Segara' : n > AWAL_TLAGA ? 'Kotak Tlaga' : n > AWAL_CURUG ? 'Kotak Curug' : n > AWAL_KULON ? 'Kotak Kulon' : 'Kotak Wetan';
export const alamat = n => { if (n > AWAL_SEGARA) { const u = n - AWAL_SEGARA, i = (u - 1) % 200, p2 = v => String(v).padStart(2, '0');
    return {jalan: `Apt. Segara Menara ${Math.ceil(u / 200)} Unit ${p2(Math.floor(i / 10) + 2)}-${p2(i % 10 + 1)}`, rtrw: '000/000', dusun: dusun(n)}; }
  const tl = n > AWAL_TLAGA, cg = !tl && n > AWAL_CURUG, kl = !tl && !cg && n > AWAL_KULON, k = tl ? n - AWAL_TLAGA : cg ? n - AWAL_CURUG : kl ? n - AWAL_KULON : n, J = tl ? JALAN_TLAGA : cg ? JALAN_CURUG : kl ? JALAN_KULON : JALAN, rt = Math.ceil(k / 20);
  return {jalan: `Jl. ${J[(rt - 1) % J.length]} No. ${((k - 1) % 20) + 1}`, rtrw: `${String(rt).padStart(3, '0')}/${String(Math.ceil(rt / 5)).padStart(3, '0')}`, dusun: dusun(n)}; };

const W = 1012, H = 638;

// Foto avatar setengah badan, latar merah seperti pas foto.
function foto(av) {
  const w = 300, h = 380;
  const r = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true, alpha: false});
  r.setPixelRatio(1); r.setSize(w, h, false); r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
  const sc = new THREE.Scene(); sc.background = new THREE.Color('#d8372f');
  sc.add(new THREE.HemisphereLight(0xffffff, 0x8a6a5a, 1.6));
  const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(2, 5, 6); sc.add(d);
  const A = warga(av || {}); try { pose(A, {}); } catch (e) {}
  sc.add(A);
  const box = new THREE.Box3().setFromObject(A); const top = box.max.y;
  const cam = new THREE.PerspectiveCamera(24, w / h, .1, 100);
  cam.position.set(0, top - 1.05, 7.2); cam.lookAt(0, top - 1.25, 0);
  r.render(sc, cam);
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(r.domElement, 0, 0);
  r.dispose(); try { r.forceContextLoss(); } catch (e) {} return c;
}

function muatGambar(src) { return new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }); }

// o: {no, nama, ig, tiktok, dibuat, avatar}
export async function gambarKTP(cv, o) {
  await Promise.all([document.fonts.load('900 40px Montserrat'), document.fonts.load('700 20px Montserrat')]);
  cv.width = W; cv.height = H; const x = cv.getContext('2d');
  // latar: langit biru ke rumput hijau + pola kotak samar
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#bfe6ff'); g.addColorStop(.55, '#e6f6ff'); g.addColorStop(1, '#cdeeb8');
  x.save(); x.beginPath(); x.roundRect(0, 0, W, H, 34); x.clip();
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.globalAlpha = .07; x.fillStyle = '#1d4a7a';
  for (let i = 0; i < 26; i++) for (let j = 0; j < 17; j++) if ((i * 7 + j * 3) % 5 === 0) x.fillRect(i * 40 + 6, j * 40 + 6, 26, 26);
  x.globalAlpha = 1;
  // pita atas
  x.fillStyle = '#2f6b28'; x.fillRect(0, 0, W, 112); x.fillStyle = '#4f9a3a'; x.fillRect(0, 104, W, 8);
  const logo = await muatGambar('/duniakotak/logo.jpg');
  if (logo) { x.save(); x.beginPath(); x.roundRect(28, 18, 76, 76, 18); x.clip(); x.drawImage(logo, 28, 18, 76, 76); x.restore(); }
  x.fillStyle = '#fff'; x.textAlign = 'center';
  x.font = '900 34px Montserrat, sans-serif'; x.fillText('KARTU WARGA DUNIA KOTAK', W / 2 + 30, 52);
  x.font = '800 24px Montserrat, sans-serif'; x.fillStyle = '#ffe9a8'; x.fillText('DUSUN ' + dusun(o.no).toUpperCase(), W / 2 + 30, 88);
  x.textAlign = 'left';
  // NIK
  const t = o.dibuat ? new Date(o.dibuat) : new Date();
  const dd = String(t.getDate()).padStart(2, '0'), mm = String(t.getMonth() + 1).padStart(2, '0'), yy = String(t.getFullYear()).slice(2);
  const kodeKotak = `DK-${String(o.no).padStart(4, '0')}-${dd}${mm}${yy}`;
  x.fillStyle = '#16301a'; x.font = '900 30px Montserrat, sans-serif'; x.fillText('No. Kotak', 40, 162);
  x.fillText(': ' + kodeKotak, 200, 162);
  // isian
  const a = alamat(o.no);
  const un = o.ig ? '@' + o.ig : (o.tiktok ? '@' + o.tiktok + ' (TikTok)' : '-');
  const baris = [
    ['Nama', (o.nama || '-').toUpperCase()],
    ['Username', un],
    ['Alamat', a.jalan],
    ['RT/RW', a.rtrw],
    ['Kavling', 'No. ' + o.no],
    ['Pekerjaan', o.kerja || 'Petani / Pedagang'],
    ['Status', 'Warga Resmi'],
    ['Bergabung', `${dd} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][t.getMonth()]} ${t.getFullYear()}`],
  ];
  let y = 214;
  for (const [k, v] of baris) {
    x.font = '700 22px Montserrat, sans-serif'; x.fillStyle = '#2b4a33'; x.fillText(k, 40, y);
    x.fillText(':', 176, y);
    x.font = '800 23px Montserrat, sans-serif'; x.fillStyle = '#111';
    let s = v; while (x.measureText(s).width > 470 && s.length > 4) s = s.slice(0, -2);
    x.fillText(s === v ? s : s + '…', 194, y);
    y += 46;
  }
  // foto
  // foto warga = avatar pilihan warga (tanpa unggah foto asli)
  const fx = 722, fy = 132, fw = 222, fh = 278;
  try { x.drawImage(foto(bersihAv(o.avatar || avAcak(o.no))), fx, fy, fw, fh); } catch (e) { x.fillStyle = '#d8372f'; x.fillRect(fx, fy, fw, fh); }
  x.lineWidth = 4; x.strokeStyle = '#fff'; x.strokeRect(fx, fy, fw, fh);
  // nama warga di bawah foto
  x.textAlign = 'center'; x.fillStyle = '#111';
  let nm = (o.nama || '').toUpperCase(), fs = 24;
  do { x.font = `900 ${fs}px Montserrat, sans-serif`; fs--; } while (x.measureText(nm).width > fw + 30 && fs > 14);
  x.fillText(nm, fx + fw / 2, 442);
  // tanggal & tanda tangan kepala desa
  x.fillStyle = '#16301a';
  x.font = '700 17px Montserrat, sans-serif'; x.fillText(`Dunia Kotak, ${dd}-${mm}-${t.getFullYear()}`, fx + fw / 2, 486);
  x.font = '700 15px Montserrat, sans-serif'; x.fillText('Kepala Desa', fx + fw / 2, 508);
  x.font = 'italic 900 32px Montserrat, sans-serif'; x.fillStyle = '#1d3d8a'; x.fillText('Raka', fx + fw / 2, 552);
  x.strokeStyle = '#1d3d8a'; x.lineWidth = 3; x.beginPath(); x.moveTo(fx + 50, 560); x.quadraticCurveTo(fx + fw / 2, 574, fx + fw - 40, 554); x.stroke();
  x.font = '700 15px Montserrat, sans-serif'; x.fillStyle = '#2b4a33'; x.fillText('RAKA', fx + fw / 2, 592);
  // kaki kartu
  x.textAlign = 'left'; x.font = '800 18px Montserrat, sans-serif'; x.fillStyle = '#2f6b28';
  x.fillText('willoapparel.com/duniakotak  ·  @duniakotak.id', 40, 606);
  x.restore();
  x.lineWidth = 6; x.strokeStyle = '#2f6b28'; x.beginPath(); x.roundRect(3, 3, W - 6, H - 6, 32); x.stroke();
  return cv;
}

// Versi story 9:16 (IG/TikTok): kartu + ajakan. Teks di antara y 250-1620 supaya tidak tertutup tombol aplikasi.
export function gambarStory(kartu, o) {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 1920); g.addColorStop(0, '#5fb8ff'); g.addColorStop(.6, '#bfe6ff'); g.addColorStop(.6, '#7cc95a'); g.addColorStop(1, '#4f9a3a');
  x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
  x.globalAlpha = .12; x.fillStyle = '#fff';
  for (let i = 0; i < 14; i++) for (let j = 0; j < 8; j++) if ((i * 5 + j * 3) % 4 === 0) x.fillRect(j * 140 + 20, i * 140 + 20, 90, 90);
  x.globalAlpha = 1; x.textAlign = 'center';
  x.fillStyle = '#fff'; x.font = '900 70px Montserrat, sans-serif';
  x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = 12;
  x.fillText('Aku resmi jadi', 540, 400); x.fillText('warga Dunia Kotak!', 540, 485);
  x.font = '800 40px Montserrat, sans-serif'; x.fillStyle = '#16301a'; x.shadowBlur = 0;
  x.fillText('Kavling No. ' + o.no + ' · Dusun ' + dusun(o.no), 540, 560);
  x.save(); x.translate(540, 940); x.rotate(-.035);
  x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 40; x.shadowOffsetY = 18;
  const w = 960, h = w * kartu.height / kartu.width; x.drawImage(kartu, -w / 2, -h / 2, w, h); x.restore();
  x.shadowBlur = 0; x.fillStyle = '#fff'; x.beginPath(); x.roundRect(110, 1340, 860, 220, 40); x.fill();
  x.fillStyle = '#16301a'; x.font = '800 40px Montserrat, sans-serif'; x.fillText('Mau punya rumah juga? Daftar gratis', 540, 1420);
  x.fillStyle = '#2f6b28'; x.font = '900 50px Montserrat, sans-serif'; x.fillText('willoapparel.com/duniakotak', 540, 1495);
  x.fillStyle = '#fff'; x.font = '900 44px Montserrat, sans-serif'; x.fillText('@duniakotak.id', 540, 1610);
  return c;
}
