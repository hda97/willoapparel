// KTP Dunia Kotak: kartu tanda penduduk versi desa kotak, digambar di kanvas (bisa disimpan/dibagikan).
// Foto = avatar warga (aset avatar.js yang sama dengan game). Tanpa lambang negara: ini kartu desa fiksi.
import * as THREE from 'three';
import {warga, pose} from '../mabar/js/aset/avatar.js';

const JALAN = ['Melati','Mawar','Kenanga','Anggrek','Mangga','Rambutan','Durian','Salak','Jambu','Manggis'];
export const alamat = n => { const rt = Math.ceil(n / 20); return {jalan: `Jl. ${JALAN[(rt - 1) % 10]} No. ${((n - 1) % 20) + 1}`, rtrw: `${String(rt).padStart(3, '0')}/${rt <= 5 ? '001' : '002'}`}; };

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
  r.dispose(); return c;
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
  x.font = '900 34px Montserrat, sans-serif'; x.fillText('DESA DUNIA KOTAK', W / 2 + 30, 52);
  x.font = '800 24px Montserrat, sans-serif'; x.fillStyle = '#ffe9a8'; x.fillText('DUSUN KOTAK WETAN', W / 2 + 30, 88);
  x.textAlign = 'left';
  // NIK
  const t = o.dibuat ? new Date(o.dibuat) : new Date();
  const dd = String(t.getDate()).padStart(2, '0'), mm = String(t.getMonth() + 1).padStart(2, '0'), yy = String(t.getFullYear()).slice(2);
  const nik = `DK ${String(o.no).padStart(4, '0')} ${dd}${mm}${yy}`;
  x.fillStyle = '#16301a'; x.font = '900 32px Montserrat, sans-serif'; x.fillText('NIK', 40, 162);
  x.fillText(': ' + nik, 160, 162);
  // isian
  const a = alamat(o.no);
  const un = o.ig ? '@' + o.ig : (o.tiktok ? '@' + o.tiktok + ' (TikTok)' : '-');
  const baris = [
    ['Nama', (o.nama || '-').toUpperCase()],
    ['Username', un],
    ['Alamat', a.jalan],
    ['RT/RW', a.rtrw],
    ['Kavling', 'No. ' + o.no],
    ['Pekerjaan', 'Petani / Pedagang'],
    ['Status', 'Warga Resmi'],
    ['Berlaku', 'SEUMUR HIDUP'],
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
  const fx = 700, fy = 136, fw = 262, fh = 332;
  try { const f = foto(o.avatar); x.drawImage(f, fx, fy, fw, fh); }
  catch (e) { x.fillStyle = '#d8372f'; x.fillRect(fx, fy, fw, fh); }
  x.lineWidth = 4; x.strokeStyle = '#fff'; x.strokeRect(fx, fy, fw, fh);
  // tanggal & tanda tangan kepala desa
  x.textAlign = 'center'; x.fillStyle = '#16301a';
  x.font = '700 18px Montserrat, sans-serif'; x.fillText(`Dunia Kotak, ${dd}-${mm}-${t.getFullYear()}`, fx + fw / 2, 500);
  x.font = '700 16px Montserrat, sans-serif'; x.fillText('Kepala Desa', fx + fw / 2, 524);
  x.font = 'italic 900 34px Montserrat, sans-serif'; x.fillStyle = '#1d3d8a'; x.fillText('Raka', fx + fw / 2, 570);
  x.strokeStyle = '#1d3d8a'; x.lineWidth = 3; x.beginPath(); x.moveTo(fx + 70, 578); x.quadraticCurveTo(fx + fw / 2, 592, fx + fw - 60, 572); x.stroke();
  x.font = '700 15px Montserrat, sans-serif'; x.fillStyle = '#2b4a33'; x.fillText('RAKA', fx + fw / 2, 606);
  // kaki kartu
  x.textAlign = 'left'; x.font = '800 18px Montserrat, sans-serif'; x.fillStyle = '#2f6b28';
  x.fillText('willoapparel.com/duniakotak  ·  @duniakotak.id', 40, 606);
  x.restore();
  x.lineWidth = 6; x.strokeStyle = '#2f6b28'; x.beginPath(); x.roundRect(3, 3, W - 6, H - 6, 32); x.stroke();
  return cv;
}
