// ===================================================================
// Tambahan mesin untuk game edukasi SD (dipakai bersama inti.js PAUD).
// SD: kamera isometrik, 3 fase (A kelas 1-2, B kelas 3-4, C kelas 5-6),
// nyawa ❤, papan angka (numpad), pilih fase, simpan bintang per fase.
// ===================================================================
const YAW_ISO = Math.PI / 4;
// glyph tambahan untuk teksVoxel (soal hitung)
Object.assign(FONT, {
  '+': '.....|..#..|..#..|#####|..#..|..#..|.....', '-': '.....|.....|.....|#####|.....|.....|.....',
  '=': '.....|.....|#####|.....|#####|.....|.....', '×': '.....|#...#|.#.#.|..#..|.#.#.|#...#|.....',
  ':': '.....|..#..|.....|.....|.....|..#..|.....', '.': '.....|.....|.....|.....|.....|.....|..#..',
  ',': '.....|.....|.....|.....|.....|..#..|.#...', ' ': '.....|.....|.....|.....|.....|.....|.....',
});

// ---------- angka & ekspresi ----------
// "1.000" -> 1000, "2,5" -> 2.5
function bacaAngka(s) { s = String(s ?? '').trim().replace(/^rp\.?\s*/i, ''); if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, ''); return parseFloat(s.replace(',', '.')); }
const rupiah = n => 'Rp' + Math.round(n).toLocaleString('id-ID');
const fmt = n => (Math.round(n * 1000) / 1000).toLocaleString('id-ID');
// rapikan tampilan soal: * -> ×, / -> :
const tampilSoal = s => String(s).replace(/\s*[x×*]\s*/gi, ' × ').replace(/\s*[:÷]\s*/g, ' : ').replace(/\s*\+\s*/g, ' + ').replace(/(\d)\s*-\s*(\d)/g, '$1 - $2').replace(/\s+/g, ' ').trim();
// hitung ekspresi aman: angka, + - × : ( ) saja
function hitungEkspresi(s) {
  let t = String(s).replace(/=\s*\?*\s*$/, '').trim(); if (!t) return NaN;
  t = t.replace(/(\d)\.(?=\d{3}\b)/g, '$1').replace(/(\d),(\d)/g, '$1.$2').replace(/[x×]/gi, '*').replace(/[:÷]/g, '/');
  if (!/^[\d.+\-*/()\s]+$/.test(t)) return NaN;
  try { const v = Function('"use strict";return (' + t + ')')(); return typeof v === 'number' && isFinite(v) ? v : NaN; } catch (e) { return NaN; }
}
const sama = (a, b) => Math.abs(a - b) < 1e-6;
// pengecoh di sekitar jawaban (untuk pilihan ganda)
function pengecoh(jaw, n = 3) {
  const s = new Set([jaw]); const besar = Math.abs(jaw) >= 20, bulat = Number.isInteger(jaw);
  const geser = bulat ? (besar ? [-10, 10, -1, 1, -2, 2, 5, -5, 100, -100] : [-1, 1, -2, 2, 3, -3]) : [-.5, .5, -1, 1, .25, -.25];
  for (const g of kocok(geser)) { if (s.size >= n) break; const v = jaw + g; if (v >= 0) s.add(Math.round(v * 100) / 100); }
  let i = 4; while (s.size < n) s.add(jaw + i++);
  return kocok([...s]);
}
const ucapAngka = s => String(s).replace(/×/g, ' kali ').replace(/ : /g, ' dibagi ').replace(/ - /g, ' kurang ').replace(/\+/g, ' tambah ').replace(/=/g, ' sama dengan ').replace(/\?/g, ' berapa');

// ---------- nyawa ----------
let NYAWA = 3;
function aturNyawa(n) { NYAWA = n; const e = $('nyawa'); if (e) e.innerHTML = Array.from({length: 3}, (_, i) => `<span class="${i < n ? '' : 'habis'}">❤</span>`).join(''); }
function kurangNyawa() { aturNyawa(Math.max(0, NYAWA - 1)); const e = $('nyawa'); if (e) { e.classList.remove('kedip'); void e.offsetWidth; e.classList.add('kedip'); } return NYAWA; }

// ---------- papan angka (numpad) ----------
// tampilkan papan; resolve tiap kali anak menekan ✔ dengan angka yang diketik
let _np = null;
function papanAngka({satuan = '', awalan = '', desimal = false} = {}) {
  const w = $('numpad'); w.hidden = false; let isi = '';
  const tulis = () => { $('npIsi').innerHTML = `<small>${awalan}</small>${isi || '<i>?</i>'}<small>${satuan}</small>`; };
  tulis();
  const tombol = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', desimal ? ',' : '00', '⌫'];
  $('npTombol').innerHTML = tombol.map(t => `<button data-t="${t}">${t}</button>`).join('') + '<button data-t="ok" class="ok">✔ Jawab</button>';
  return new Promise(res => {
    _np = t => {
      if (kunci) return;
      if (t === 'ok') { if (!isi) return; efek.ketuk(); res(bacaAngka(isi)); return; }
      efek.ketuk(); if (t === '⌫') isi = isi.slice(0, -1); else if (isi.replace(/\D/g, '').length < 9) { if (t === ',' && isi.includes(',')) return; isi += t; }
      tulis();
    };
    papanAngka.ulang = () => { isi = ''; tulis(); };
    $('npTombol').querySelectorAll('button').forEach(b => b.onclick = () => _np && _np(b.dataset.t));
  });
}
function tutupPapan() { $('numpad').hidden = true; _np = null; }
addEventListener('keydown', e => { if (!_np || $('numpad').hidden || !$('panelGuru').hidden) return; if (/^[0-9]$/.test(e.key)) _np(e.key); else if (e.key === 'Backspace') _np('⌫'); else if (e.key === 'Enter') _np('ok'); else if (e.key === ',' || e.key === '.') _np(','); });

// ---------- soal kartu (teks besar soal) ----------
function kartuSoal(html) { const k = $('kartu'); k.innerHTML = html; k.hidden = false; }

// ---------- pilih fase ----------
const FASE = {A: {nama: 'Fase A', kelas: 'Kelas 1–2', warna: '#2f9e44'}, B: {nama: 'Fase B', kelas: 'Kelas 3–4', warna: '#1c7ed6'}, C: {nama: 'Fase C', kelas: 'Kelas 5–6', warna: '#ae3ec9'}};
const kunciSimpan = k => k + ':' + location.pathname + ':' + (DATA_BAWAAN.id || '');
function bintangFase() { try { return JSON.parse(localStorage.getItem(kunciSimpan('bintang')) || '{}'); } catch (e) { return {}; } }
function simpanBintangFase(f, n) { const b = bintangFase(); b[f] = Math.max(b[f] || 0, n); try { localStorage.setItem(kunciSimpan('bintang'), JSON.stringify(b)); } catch (e) {} }
function pilihFase(jumlah, fn) {
  const b = bintangFase(); pastikanDukung();
  $('faseDaftar').innerHTML = Object.entries(FASE).map(([k, f]) => `<button class="fase" data-f="${k}" style="--w:${f.warna}" ${jumlah[k] ? '' : 'disabled'}>
    <b>${f.nama}</b><span>${f.kelas}</span><em>${jumlah[k] || 0} tantangan</em><i>${'★'.repeat(b[k] || 0)}${'☆'.repeat(3 - (b[k] || 0))}</i></button>`).join('');
  $('layarFase').hidden = false;
  $('faseDaftar').querySelectorAll('.fase').forEach(el => el.onclick = () => { efek.ketuk(); $('layarFase').hidden = true; fn(el.dataset.f); });
}

// ---------- pohon/rumah di antara kamera & tokoh jadi transparan ----------
const _pudar = [];
function bisaPudar(o, r = 2.4) {
  const mats = []; o.traverse(m => { if (m.isMesh) (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => { x.transparent = true; mats.push(x); }); });
  o.userData.mats = mats; o.userData.rPudar = r; o.userData.op = 1; _pudar.push(o); return o;
}
function updatePudar(dt) {
  if (!P.cam || !P.tokoh) return;
  const titik = [P.tokoh.position, P.pusat || P.tokoh.position];
  for (const o of _pudar) {
    let tutup = false;
    for (const f of titik) {
      const cx = P.cam.position.x - f.x, cz = P.cam.position.z - f.z, L = Math.hypot(cx, cz) || 1, ux = cx / L, uz = cz / L;
      const dx = o.position.x - f.x, dz = o.position.z - f.z, t = dx * ux + dz * uz, perp = Math.abs(dx * uz - dz * ux);
      if (t > .6 && perp < o.userData.rPudar + t * .12) { tutup = true; break; }
    }
    const tuju = tutup ? .16 : 1; if (Math.abs(o.userData.op - tuju) < .01) continue;
    o.userData.op += (tuju - o.userData.op) * Math.min(1, dt * 6);
    o.userData.mats.forEach(x => { x.opacity = o.userData.op; x.depthWrite = o.userData.op > .9; });
  }
}
