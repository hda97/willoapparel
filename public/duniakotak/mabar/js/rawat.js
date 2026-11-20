// Rawat Rumah Tetangga — mini-game ±1 menit (Huda 20 Nov 2026: "rawat rumah warga lebih komplek setidaknya 1 menit").
// 5 tahap berurutan di atas layar game (pop up penuh, tanpa scroll):
//   1. 🌿 Cabut rumput liar  : tahan jari di tiap rumpun sampai tercabut
//   2. 🍂 Sapu daun kering   : seret tiap daun ke keranjang
//   3. 🪟 Lap jendela        : gosok kaca sampai bersih (≥ 85 %)
//   4. 💧 Siram bunga        : tahan di pot, lepas saat air di zona hijau (kebanyakan = air tumpah, ulang sedikit)
//   5. 🖌️ Cat pagar         : usap tiap papan pagar sampai tercat penuh
// Tidak ada kalah. Koordinat sentuh & getBoundingClientRect sudah disesuaikan putar.js (HP tegak), jadi cukup clientX/Y.
// mainRawat({nama, bunyi, selesai, batal}) → selesai() dipanggil sekali setelah tahap 5; batal() bila ditutup.

import {getar} from './rasa.js?v=20261120g';   // getar HP tiap tugas kecil selesai (Huda 20 Nov 2026)

const CSS = `
.rwLatar{position:fixed;inset:0;z-index:70;background:rgba(10,12,20,.55);display:flex;align-items:center;justify-content:center;padding:8px;font-family:Montserrat,sans-serif}
.rwPanel{position:relative;width:min(760px,calc(98*var(--vw,1vw)));height:min(430px,calc(96*var(--vh,1vh)));background:#fff6dc;border:3px solid #2a2218;border-radius:10px;box-shadow:0 6px 0 #2a2218;display:flex;flex-direction:column;overflow:hidden;color:#2a2218}
.rwAtas{display:flex;align-items:center;gap:8px;padding:6px 8px 4px}
.rwAtas b{font:900 14px/1.1 Montserrat,sans-serif;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rwTahap{display:flex;gap:4px}
.rwTahap i{font-style:normal;width:24px;height:24px;border:2px solid #2a2218;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;background:#fff;opacity:.45}
.rwTahap i.kini{opacity:1;background:#ffd34d;transform:scale(1.08)}
.rwTahap i.ok{opacity:1;background:#7ee08a}
.rwX{width:28px;height:28px;border:2px solid #2a2218;border-radius:6px;background:#e04848;color:#fff;font:900 13px Montserrat,sans-serif;box-shadow:0 3px 0 #2a2218;padding:0;cursor:pointer;flex:none}
.rwPetunjuk{margin:0 8px 6px;padding:4px 8px;border-radius:6px;background:#2a2218;color:#fff;font:800 12px/1.25 Montserrat,sans-serif;display:flex;gap:8px;align-items:center}
.rwPetunjuk span{flex:1}
.rwPetunjuk em{font-style:normal;color:#ffd34d;white-space:nowrap}
.rwArena{position:relative;flex:1;margin:0 8px 8px;border:2px solid #2a2218;border-radius:8px;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;background:#8fd26a}
.rwArena *{touch-action:none}
.rwBenda{position:absolute;transform:translate(-50%,-50%);line-height:1;cursor:pointer;transition:transform .15s}
.rwRumput{font-size:34px;filter:drop-shadow(0 2px 0 rgba(0,0,0,.25))}
.rwCincin{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;pointer-events:none;background:conic-gradient(#ffd34d var(--p,0%),transparent 0);-webkit-mask:radial-gradient(circle,transparent 17px,#000 18px);mask:radial-gradient(circle,transparent 17px,#000 18px)}
.rwTerbang{transition:left .45s ease-in,top .45s ease-in,transform .45s ease-in,opacity .45s;opacity:0!important;transform:translate(-50%,-50%) scale(.3) rotate(160deg)!important}
.rwDaun{font-size:28px}
.rwKeranjang{position:absolute;right:12px;bottom:10px;width:84px;height:64px;border:3px dashed #2a2218;border-radius:12px;background:rgba(255,255,255,.55);display:flex;align-items:center;justify-content:center;font-size:36px}
.rwKeranjang small{position:absolute;bottom:-1px;font:900 10px Montserrat,sans-serif}
.rwKeranjang.dekat{background:#ffd34d}
.rwRumah{position:absolute;inset:0;background:linear-gradient(#f3d9a8,#e9c98f);display:flex;align-items:center;justify-content:center;gap:6%}
.rwJendela{position:relative;width:34%;height:72%;border:6px solid #8a5a2a;border-radius:4px;background:linear-gradient(135deg,#bfe4ff,#e9f6ff 55%,#9fd0f5);box-shadow:inset 0 0 0 3px #a8743a}
.rwJendela:before,.rwJendela:after{content:"";position:absolute;background:#8a5a2a}
.rwJendela:before{left:50%;top:0;bottom:0;width:5px;margin-left:-2.5px}
.rwJendela:after{top:50%;left:0;right:0;height:5px;margin-top:-2.5px}
.rwJendela canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1}
.rwJendela .rwPersen{position:absolute;left:50%;bottom:-24px;transform:translateX(-50%);font:900 12px Montserrat,sans-serif;white-space:nowrap}
.rwJendela.ok{box-shadow:0 0 0 4px #7ee08a,inset 0 0 0 3px #a8743a}
.rwPot{position:absolute;bottom:10%;width:17%;display:flex;flex-direction:column;align-items:center;cursor:pointer}
.rwPot .tanaman{font-size:34px;line-height:1;margin-bottom:-12px;position:relative;z-index:1;transition:transform .3s,filter .3s;filter:grayscale(.8) brightness(.9)}
.rwPot.ok .tanaman{filter:none;transform:scale(1.18)}
.rwMeter{position:relative;width:26px;height:110px;border:3px solid #2a2218;border-radius:8px;background:#fff;overflow:hidden;margin-bottom:6px}
.rwMeter .zona{position:absolute;left:0;right:0;bottom:60%;height:28%;background:rgba(58,168,96,.35);border-top:2px dashed #3aa860;border-bottom:2px dashed #3aa860}
.rwMeter .air{position:absolute;left:0;right:0;bottom:0;height:0;background:#3a8ad8}
.rwPot .ket{font:900 10px Montserrat,sans-serif;height:14px;white-space:nowrap}
.rwPagar{position:absolute;inset:0;background:linear-gradient(#bfe4ff 0 55%,#8fd26a 55%);display:flex;align-items:flex-end;justify-content:center;gap:2.4%;padding:0 4% 10%}
.rwPapan{position:relative;width:10%;height:78%;background:#b9a68a;border:3px solid #2a2218;border-radius:10px 10px 3px 3px;overflow:hidden;cursor:pointer}
.rwPapan i{position:absolute;left:0;right:0;bottom:0;height:0;background:#fff;transition:height .08s}
.rwPapan.ok{box-shadow:0 0 0 3px #7ee08a}
.rwSelesai{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(255,246,220,.94);text-align:center;padding:10px}
.rwSelesai b{font:900 20px/1.15 Montserrat,sans-serif}
.rwSelesai small{font:700 12px/1.3 Montserrat,sans-serif;color:#5a4a30}
.rwTombol{border:3px solid #2a2218;border-radius:8px;background:#3aa860;color:#fff;font:900 14px Montserrat,sans-serif;padding:8px 18px;box-shadow:0 4px 0 #2a2218;cursor:pointer}
.rwTombol.abu{background:#8a8f99}
.rwPop{position:absolute;pointer-events:none;font:900 14px Montserrat,sans-serif;color:#fff;text-shadow:0 2px 0 #2a2218;transform:translate(-50%,-50%);animation:rwNaik .8s ease-out forwards}
@keyframes rwNaik{to{transform:translate(-50%,-160%);opacity:0}}
@media (max-height:340px){.rwRumput{font-size:28px}.rwDaun{font-size:24px}.rwMeter{height:80px}.rwPot .tanaman{font-size:28px}}
`;
let gayaDipasang = false;
const TAHAP = [
  {ikon: '🌿', judul: 'Cabut rumput liar', petunjuk: 'Tahan jari di tiap rumput sampai tercabut'},
  {ikon: '🍂', judul: 'Sapu daun kering', petunjuk: 'Seret tiap daun ke keranjang'},
  {ikon: '🪟', judul: 'Lap jendela', petunjuk: 'Gosok kaca yang berdebu sampai bersih'},
  {ikon: '💧', judul: 'Siram bunga', petunjuk: 'Tahan di pot, lepas saat air di zona hijau'},
  {ikon: '🖌️', judul: 'Cat pagar', petunjuk: 'Usap naik-turun tiap papan sampai putih'},
];
const acak = (a, b) => a + Math.random() * (b - a);

export function mainRawat({nama = 'tetangga', bunyi = () => {}, selesai = () => {}, batal = () => {}, tutup: diTutup = () => {}, dariTahap = 0} = {}) {
  const bunyiAsli = bunyi; bunyi = n => { bunyiAsli(n); if (n === 'klik') getar('klik'); else if (n === 'kirim') getar('tuk'); else if (n === 'emosi') getar('gagal'); };
  if (!gayaDipasang) { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); gayaDipasang = true; }
  const latar = document.createElement('div'); latar.className = 'rwLatar';
  latar.innerHTML = `<div class="rwPanel"><div class="rwAtas"><b>🧹 Rawat rumah ${esc(nama)}</b><div class="rwTahap">${TAHAP.map(t => `<i>${t.ikon}</i>`).join('')}</div><button class="rwX" aria-label="Berhenti">✕</button></div>
    <div class="rwPetunjuk"><span></span><em></em></div><div class="rwArena"></div></div>`;
  document.body.appendChild(latar);
  const arena = latar.querySelector('.rwArena'), pet = latar.querySelector('.rwPetunjuk span'), hit = latar.querySelector('.rwPetunjuk em'), chip = [...latar.querySelectorAll('.rwTahap i')];
  let tahap = Math.max(0, Math.min(4, dariTahap | 0)) - 1, habis = false, bersih = null;   // dariTahap: hanya untuk uji
  const t0 = performance.now();
  const tutup = () => { if (habis) return; habis = true; if (bersih) bersih(); latar.remove(); diTutup(); };
  latar.querySelector('.rwX').onclick = () => {
    if (tahap >= TAHAP.length) return;
    if (latar.querySelector('.rwSelesai')) return;
    const k = document.createElement('div'); k.className = 'rwSelesai';
    k.innerHTML = `<b>Berhenti merawat?</b><small>Pekerjaanmu di rumah ini belum tersimpan.</small><div style="display:flex;gap:10px"><button class="rwTombol abu" data-a="ya">Berhenti</button><button class="rwTombol" data-a="tidak">Lanjut kerja</button></div>`;
    arena.appendChild(k);
    k.onclick = e => { const a = e.target.dataset.a; if (a === 'ya') { tutup(); batal(); } else if (a === 'tidak') k.remove(); };
  };
  const pop = (x, y, teks) => { const p = document.createElement('div'); p.className = 'rwPop'; p.textContent = teks; p.style.left = x + 'px'; p.style.top = y + 'px'; arena.appendChild(p); setTimeout(() => p.remove(), 800); };
  const lokal = e => { const r = arena.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; };
  const progres = (n, total, satuan) => { hit.textContent = `${n}/${total} ${satuan}`; };

  function lanjut() {
    if (bersih) { bersih(); bersih = null; }
    tahap++; arena.innerHTML = '';
    chip.forEach((c, i) => { c.classList.toggle('ok', i < tahap); c.classList.toggle('kini', i === tahap); });
    if (tahap >= TAHAP.length) return akhir();
    const T = TAHAP[tahap]; pet.textContent = `${tahap + 1}/${TAHAP.length} ${T.ikon} ${T.judul}: ${T.petunjuk}`;
    bunyi('buka');
    [rumput, daun, jendela, siram, pagar][tahap]();
  }
  // ---- 1. cabut rumput: tahan 0,8 dtk per rumpun ----
  function rumput() {
    const N = 10, TAHAN = 900; let n = 0; progres(0, N, 'rumput');
    const r = arena.getBoundingClientRect();
    const titik = []; for (let i = 0; i < N; i++) { let x, y, k = 0; do { x = acak(.08, .92); y = acak(.15, .85); k++; } while (k < 40 && titik.some(([a, b]) => Math.hypot((a - x) * r.width, (b - y) * r.height) < 56)); titik.push([x, y]); }
    for (const [x, y] of titik) {
      const el = document.createElement('div'); el.className = 'rwBenda rwRumput'; el.style.left = x * 100 + '%'; el.style.top = y * 100 + '%';
      el.innerHTML = `${Math.random() < .5 ? '🌿' : '🌱'}<span class="rwCincin"></span>`; arena.appendChild(el);
      let mulai = 0, raf = 0;
      const henti = () => { mulai = 0; cancelAnimationFrame(raf); if (!el.dataset.ok) { el.querySelector('.rwCincin').style.setProperty('--p', '0%'); el.style.transform = ''; } };
      const jalan = () => { if (!mulai || habis) return; const p = Math.min(1, (performance.now() - mulai) / TAHAN);
        el.querySelector('.rwCincin').style.setProperty('--p', p * 100 + '%'); el.style.transform = `translate(-50%,-50%) rotate(${Math.sin(performance.now() / 40) * 8}deg)`;
        if (p >= 1) { el.dataset.ok = 1; mulai = 0; bunyi('klik'); pop(el.offsetLeft, el.offsetTop, '+1'); el.classList.add('rwTerbang'); el.style.top = '-10%';
          setTimeout(() => el.remove(), 460); n++; progres(n, N, 'rumput'); if (n >= N) setTimeout(lanjut, 600); return; }
        raf = requestAnimationFrame(jalan); };
      el.addEventListener('pointerdown', e => { e.preventDefault(); if (el.dataset.ok) return; try { el.setPointerCapture(e.pointerId); } catch (_) {} mulai = performance.now(); bunyi('langkah'); jalan(); });
      el.addEventListener('pointerup', henti); el.addEventListener('pointercancel', henti); el.addEventListener('pointerleave', henti);
    }
  }
  // ---- 2. sapu daun: seret ke keranjang ----
  function daun() {
    const N = 12; let n = 0; progres(0, N, 'daun');
    const kj = document.createElement('div'); kj.className = 'rwKeranjang'; kj.innerHTML = '🧺<small>keranjang</small>'; arena.appendChild(kj);
    for (let i = 0; i < N; i++) {
      const el = document.createElement('div'); el.className = 'rwBenda rwDaun'; el.textContent = Math.random() < .5 ? '🍂' : '🍁';
      el.style.left = acak(.07, .62) * 100 + '%'; el.style.top = acak(.12, .88) * 100 + '%'; el.style.transform = `translate(-50%,-50%) rotate(${acak(-40, 40)}deg)`; arena.appendChild(el);
      let geser = null;
      el.addEventListener('pointerdown', e => { e.preventDefault(); if (el.dataset.ok) return; try { el.setPointerCapture(e.pointerId); } catch (_) {} geser = 1; el.style.transition = 'none'; el.style.zIndex = 3; bunyi('langkah'); });
      el.addEventListener('pointermove', e => { if (!geser) return; const [x, y] = lokal(e); el.style.left = x + 'px'; el.style.top = y + 'px';
        const a = kj.getBoundingClientRect(), d = e.clientX > a.left - 10 && e.clientX < a.right + 10 && e.clientY > a.top - 10 && e.clientY < a.bottom + 10; kj.classList.toggle('dekat', d); });
      const lepas = e => { if (!geser) return; geser = null; el.style.zIndex = ''; kj.classList.remove('dekat');
        const a = kj.getBoundingClientRect();
        if (e.clientX > a.left - 10 && e.clientX < a.right + 10 && e.clientY > a.top - 10 && e.clientY < a.bottom + 10) {
          el.dataset.ok = 1; el.style.transition = ''; el.classList.add('rwTerbang'); bunyi('klik'); setTimeout(() => el.remove(), 460);
          n++; progres(n, N, 'daun'); kj.animate([{transform: 'scale(1.15)'}, {transform: 'scale(1)'}], 200); if (n >= N) setTimeout(lanjut, 600);
        } };
      el.addEventListener('pointerup', lepas); el.addEventListener('pointercancel', lepas);
    }
  }
  // ---- 3. lap jendela: gosok 2 kaca sampai ≥ 85 % bersih ----
  function jendela() {
    const rumah = document.createElement('div'); rumah.className = 'rwRumah'; arena.appendChild(rumah);
    let ok = 0; progres(0, 2, 'jendela');
    for (let j = 0; j < 2; j++) {
      const w = document.createElement('div'); w.className = 'rwJendela'; w.innerHTML = '<canvas width="120" height="120"></canvas><span class="rwPersen">0%</span>'; rumah.appendChild(w);
      const cv = w.querySelector('canvas'), g = cv.getContext('2d'), persen = w.querySelector('.rwPersen');
      g.fillStyle = '#8a7a58'; g.fillRect(0, 0, 120, 120);
      for (let i = 0; i < 90; i++) { const c = 110 + Math.random() * 50; g.fillStyle = `rgba(${c},${c * .88},${c * .68},${acak(.35, .75)})`; g.beginPath(); g.arc(acak(0, 120), acak(0, 120), acak(4, 14), 0, 7); g.fill(); }
      let gosok = false, selesaiJ = false, cekT = 0, bunyiT = 0;
      const hapus = e => { const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 120, y = (e.clientY - r.top) / r.height * 120;
        g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over';
        const t = performance.now(); if (t - bunyiT > 160) { bunyiT = t; bunyi('langkah'); }
        if (t - cekT > 120) { cekT = t; const d = g.getImageData(0, 0, 120, 120).data; let k = 0; for (let i = 3; i < d.length; i += 16) if (d[i] < 40) k++;
          const p = Math.round(k / (d.length / 16) * 100); persen.textContent = Math.min(100, Math.round(p / .85)) + '%';
          if (p >= 85 && !selesaiJ) { selesaiJ = true; g.clearRect(0, 0, 120, 120); persen.textContent = '✨ kinclong'; w.classList.add('ok'); bunyi('kirim'); ok++; progres(ok, 2, 'jendela'); if (ok >= 2) setTimeout(lanjut, 700); } } };
      w.addEventListener('pointerdown', e => { e.preventDefault(); if (selesaiJ) return; try { w.setPointerCapture(e.pointerId); } catch (_) {} gosok = true; hapus(e); });
      w.addEventListener('pointermove', e => { if (gosok && !selesaiJ) hapus(e); });
      const henti = () => { gosok = false; }; w.addEventListener('pointerup', henti); w.addEventListener('pointercancel', henti);
    }
  }
  // ---- 4. siram bunga: tahan → air naik; lepas di zona hijau (60–88 %) ----
  function siram() {
    const N = 4, Z0 = 60, Z1 = 88; let n = 0; progres(0, N, 'pot');
    const bunga = ['🌷', '🌻', '🌼', '🌹'];
    for (let i = 0; i < N; i++) {
      const el = document.createElement('div'); el.className = 'rwPot'; el.style.left = (8 + i * 23.5) + '%';
      el.innerHTML = `<div class="ket"></div><div class="rwMeter"><div class="zona"></div><div class="air"></div></div><div class="tanaman">🥀</div><div style="font-size:26px;line-height:1">🪴</div>`; arena.appendChild(el);
      const air = el.querySelector('.air'), ket = el.querySelector('.ket'), tn = el.querySelector('.tanaman');
      let isi = 0, tahan = false, raf = 0, lalu = 0, bunyiT = 0;
      const gambar = () => { air.style.height = isi + '%'; air.style.background = isi > Z1 ? '#d84a3a' : isi >= Z0 ? '#3aa860' : '#3a8ad8'; };
      const jalan = t => { if (!tahan || habis) return; const dt = lalu ? (t - lalu) / 1000 : 0; lalu = t; isi = Math.min(100, isi + dt * 38); gambar();
        if (t - bunyiT > 220) { bunyiT = t; bunyi('langkah'); }
        if (isi >= 100) { tahan = false; tumpah(); return; } raf = requestAnimationFrame(jalan); };
      const tumpah = () => { ket.textContent = '💦 kebanyakan!'; bunyi('emosi'); setTimeout(() => { if (!el.classList.contains('ok')) { isi = 30; gambar(); ket.textContent = 'coba lagi'; } }, 600); };
      el.addEventListener('pointerdown', e => { e.preventDefault(); if (el.classList.contains('ok')) return; try { el.setPointerCapture(e.pointerId); } catch (_) {} tahan = true; lalu = 0; ket.textContent = '🚿'; raf = requestAnimationFrame(jalan); });
      const lepas = () => { if (!tahan) return; tahan = false; cancelAnimationFrame(raf);
        if (isi >= Z0 && isi <= Z1) { el.classList.add('ok'); tn.textContent = bunga[i]; ket.textContent = '✅ pas!'; bunyi('kirim'); n++; progres(n, N, 'pot'); if (n >= N) setTimeout(lanjut, 700); }
        else if (isi < Z0) ket.textContent = 'kurang, tahan lagi'; else tumpah(); };
      el.addEventListener('pointerup', lepas); el.addEventListener('pointercancel', lepas);
      gambar();
    }
  }
  // ---- 5. cat pagar: usap naik-turun tiap papan sampai penuh ----
  function pagar() {
    const N = 7, PERLU = 1000; let n = 0; progres(0, N, 'papan');
    const p = document.createElement('div'); p.className = 'rwPagar'; arena.appendChild(p);
    let aktif = null, py = 0;
    for (let i = 0; i < N; i++) {
      const el = document.createElement('div'); el.className = 'rwPapan'; el.innerHTML = '<i></i>'; p.appendChild(el);
      el.dataset.jarak = 0;
    }
    // satu pointer bisa menyapu beberapa papan berurutan: papan dicari dari posisi jari
    const papanDi = (x, y) => [...p.children].find(el => { const r = el.getBoundingClientRect(); return x >= r.left - 4 && x <= r.right + 4 && y >= r.top && y <= r.bottom; });
    let bunyiT = 0;
    const usap = e => { const el = papanDi(e.clientX, e.clientY); if (!el || el.classList.contains('ok')) { py = e.clientY; return; }
      const d = Math.abs(e.clientY - py) + Math.abs(e.movementX || 0) * .3; py = e.clientY;
      const j = Math.min(PERLU, +el.dataset.jarak + d); el.dataset.jarak = j; el.firstChild.style.height = j / PERLU * 100 + '%';
      const t = performance.now(); if (t - bunyiT > 180) { bunyiT = t; bunyi('langkah'); }
      if (j >= PERLU) { el.classList.add('ok'); bunyi('klik'); n++; progres(n, N, 'papan'); if (n >= N) setTimeout(lanjut, 700); } };
    p.addEventListener('pointerdown', e => { e.preventDefault(); aktif = e.pointerId; py = e.clientY; try { p.setPointerCapture(e.pointerId); } catch (_) {} });
    p.addEventListener('pointermove', e => { if (aktif === e.pointerId) usap(e); });
    const henti = () => { aktif = null; }; p.addEventListener('pointerup', henti); p.addEventListener('pointercancel', henti);
  }
  function akhir() {
    const det = Math.round((performance.now() - t0) / 1000); getar('dapat');
    pet.textContent = '✨ Rumah ' + nama + ' rapi lagi!'; hit.textContent = det + ' dtk';
    const k = document.createElement('div'); k.className = 'rwSelesai';
    k.innerHTML = `<div style="font-size:44px">🏡✨</div><b>Rumah ${esc(nama)} rapi lagi!</b><small>Rumput dicabut, daun disapu, jendela kinclong, bunga disiram, pagar dicat. Waktu kerja ${det} detik.</small><small class="rwStatus">Menyimpan…</small>`;
    arena.appendChild(k);
    Promise.resolve(selesai(det)).then(teks => { const s = k.querySelector('.rwStatus'); if (s) s.textContent = teks || 'Tersimpan!';
      const b = document.createElement('button'); b.className = 'rwTombol'; b.textContent = 'Kembali ke desa'; b.onclick = tutup; k.appendChild(b); setTimeout(() => { if (!habis) tutup(); }, 6000); },
      err => { const s = k.querySelector('.rwStatus'); if (s) s.textContent = '⚠️ ' + ((err && err.message) || 'Gagal menyimpan'); const b = document.createElement('button'); b.className = 'rwTombol'; b.textContent = 'Tutup'; b.onclick = tutup; k.appendChild(b); });
  }
  lanjut();
  return {tutup};
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); }
