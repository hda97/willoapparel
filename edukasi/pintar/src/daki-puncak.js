// ===================================================================
// DAKI PUNCAK PINTAR: ular tangga gunung 64 petak untuk 2-4 siswa bergiliran.
// Lempar dadu -> Tantangan Ilmu. Benar: maju sebanyak dadu. Salah: mundur setengah dadu.
// Petak hijau = tangga naik, petak merah = perosotan turun.
// ===================================================================
const CSS_GAME = /*CSS*/`
#tim{position:fixed;left:max(10px,env(safe-area-inset-left));top:max(10px,env(safe-area-inset-top));background:#fff;border-radius:18px;padding:8px 10px;box-shadow:0 6px 0 rgba(0,0,0,.14);min-width:170px;font-weight:800}
#tim h3{margin:0 0 4px;font-size:17px;color:#2f9e44}
.tBaris{display:flex;align-items:center;gap:8px;padding:3px 8px;border-radius:12px;font-size:16px;transition:background .2s}
.tBaris i{width:14px;height:14px;border-radius:50%;flex:none}.tBaris b{margin-left:auto;font-variant-numeric:tabular-nums}
.tBaris.aktif{background:#fff3bf}.tBaris.aktif::before{content:'▶';font-size:11px;margin-right:-4px}
@media (max-width:620px){#tim{top:calc(max(10px,env(safe-area-inset-top)) + 54px);min-width:0;padding:6px 8px}#tim h3{font-size:14px}.tBaris{font-size:14px;padding:2px 6px}}
#bDadu{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));border:5px solid #fff;border-radius:24px;background:#e8590c;color:#fff;font-size:clamp(22px,5vw,30px);font-weight:800;padding:12px 26px;box-shadow:0 7px 0 rgba(0,0,0,.22);cursor:pointer;animation:denyut 1.3s ease-in-out infinite}
#bDadu:disabled{animation:none;opacity:.0;pointer-events:none}
#giliran{position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);background:#fff;border-radius:99px;padding:5px 18px;font-weight:800;font-size:clamp(16px,3.6vw,21px);box-shadow:0 5px 0 rgba(0,0,0,.14);white-space:nowrap}
@media (max-width:620px){#giliran{left:max(10px,env(safe-area-inset-left));transform:none;bottom:calc(max(14px,env(safe-area-inset-bottom)) + 8px)}}
#dadu{position:fixed;left:50%;top:45%;transform:translate(-50%,-50%);width:120px;height:120px;background:#fff;border-radius:26px;box-shadow:0 10px 0 rgba(0,0,0,.2),inset 0 -8px 0 #e9ecef;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:18px;gap:6px}
#dadu span{border-radius:50%;background:transparent}#dadu span.on{background:#e03131}
#dadu.putar{animation:putar .25s linear infinite}@keyframes putar{50%{transform:translate(-50%,-50%) rotate(12deg) scale(1.05)}}
#tantangan{position:fixed;inset:0;background:rgba(20,30,45,.45);display:flex;align-items:center;justify-content:center;padding:14px;z-index:4}
.tKotak{width:100%;max-width:640px;display:flex;flex-direction:column;gap:8px}
.tKepala{background:#fff;border-radius:20px;padding:8px 16px;box-shadow:0 6px 0 rgba(0,0,0,.14);display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px}
.tKepala h3{margin:0;color:#e8590c;font-size:clamp(22px,5vw,30px)}.tKepala .td{font-size:clamp(22px,5vw,30px);margin-left:auto}
.tTaruh{flex-basis:100%;font-family:system-ui,sans-serif;font-size:clamp(14px,3.4vw,17px);color:#495057}.tTaruh b.n{color:#2f9e44}.tTaruh b.t{color:#e03131}
#kabar{position:fixed;left:50%;top:30%;transform:translate(-50%,-50%);background:#fff;border-radius:18px;padding:6px 18px;font-weight:800;font-size:clamp(20px,5vw,30px);box-shadow:0 6px 0 rgba(0,0,0,.15);pointer-events:none;white-space:nowrap;animation:muncul .3s}
/*AKHIR-CSS*/`;

const WARNA_TIM = ['#e8590c', '#1c7ed6', '#2f9e44', '#ae3ec9'];
const TIER = [[9.6, '#58b947', '#b9864f'], [7.8, '#4caf50', '#a87543'], [6.1, '#7cc24a', '#9c6a3d'], [4.5, '#a5cf4a', '#8f6038'], [3.0, '#c7d96b', '#8a8a94'], [1.7, '#ffffff', '#b0b4bc']];
const TINGGI = 1.2, PER_CINCIN = [22, 17, 12, 8, 4];
const TANGGA_AWAL = [6, 17, 30, 45], PEROSOT_AWAL = [27, 37, 49, 57, 62];
const DK = {pos: [], tangga: {}, perosot: {}, pemain: bacaLS('dkpintar:puncak', {n: 2, daftar: [{nama: 'Siswa 1', t: 0}, {nama: 'Siswa 2', t: 1}, {nama: 'Siswa 3', t: 2}, {nama: 'Siswa 4', t: 3}]}), bidak: [], cur: 0, sesi: 0, camT: new THREE.Vector3(), camSudut: 0, selesai: false};

function petakPos(i) { return DK.pos[i]; }
Object.assign(GAME, {
  id: 'daki-puncak', judul: 'Daki Puncak Pintar', ajak: 'Lempar dadu, jawab tantangan, capai puncak!',
  jumlah: null,
  musik: {bpm: 104, nada: 57, alat: 'kotakmusik', progresi: [0, 3, 5, 4], benih: 64, skala: [0, 2, 4, 5, 7, 9, 10]},
  bantuan: `<ul><li>2 sampai 4 siswa bermain bergiliran. Lihat giliran siapa di panel Tim Ekspedisi.</li>
    <li>Ketuk <b>Lempar Dadu</b>, lalu jawab Tantangan Ilmu.</li><li>Benar: maju sebanyak angka dadu. Salah: mundur setengah angka dadu.</li>
    <li>Berhenti di petak <b style="color:#2f9e44">hijau</b>: naik tangga. Petak <b style="color:#e03131">merah</b>: meluncur turun di perosotan.</li><li>Siswa pertama yang sampai di petak 64 (puncak) menang!</li></ul>`,
  siapkan() {
    siapPanggung({langit: '#74c8ff', bayangan: 16});
    const sc = P.sc; sc.add(tanah('#5cbf4a', 220));
    // gunung bertingkat: atas rumput, sisi tanah
    TIER.forEach(([r, atas, sisi], i) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r + .25, TINGGI, 12), [new THREE.MeshStandardMaterial({color: sisi, roughness: .95, flatShading: true}), new THREE.MeshStandardMaterial({color: atas, roughness: .9, flatShading: true}), new THREE.MeshStandardMaterial({color: sisi})]);
      m.position.y = TINGGI / 2 + i * TINGGI; m.castShadow = m.receiveShadow = true; sc.add(m);
      const lip = new THREE.Mesh(new THREE.CylinderGeometry(r + .04, r + .04, .16, 12), new THREE.MeshStandardMaterial({color: atas, roughness: .9, flatShading: true})); lip.position.y = (i + 1) * TINGGI - .08; lip.receiveShadow = true; sc.add(lip); });
    // jalur 64 petak melingkar naik
    let sudut = -Math.PI / 2 - .3; DK.pos[0] = new THREE.Vector3(Math.cos(sudut) * 11, 0, -Math.sin(sudut) * 11 * -1);
    let n = 1; const sudutPetak = [];
    PER_CINCIN.forEach((cnt, ci) => { const r = (TIER[ci][0] + TIER[ci + 1][0]) / 2, y = (ci + 1) * TINGGI, langkah = Math.PI * 2 * .9 / cnt;
      for (let k = 0; k < cnt; k++, n++) { DK.pos[n] = new THREE.Vector3(Math.cos(sudut) * r, y, Math.sin(sudut) * r); sudutPetak[n] = sudut; sudut += langkah; } sudut += langkah * .2; });
    DK.pos[64] = new THREE.Vector3(0, 6 * TINGGI, 0);
    DK.pos[0] = new THREE.Vector3(Math.cos(sudutPetak[1]) * 11.2, 0, Math.sin(sudutPetak[1]) * 11.2);
    DK.sudutPetak = sudutPetak;
    // tangga & perosotan: tujuan = petak cincin sebelah dengan sudut terdekat
    const cincin = i => { let c = 0, a = 0; for (; c < PER_CINCIN.length; c++) { a += PER_CINCIN[c]; if (i <= a) return c; } return 5; };
    const awalCincin = c => 1 + PER_CINCIN.slice(0, c).reduce((a, b) => a + b, 0);
    const terdekat = (i, c) => { let best = 0, bd = 9; for (let j = awalCincin(c); j < awalCincin(c) + PER_CINCIN[c]; j++) { let d = Math.abs(Math.atan2(Math.sin(sudutPetak[j] - sudutPetak[i]), Math.cos(sudutPetak[j] - sudutPetak[i]))); if (d < bd) { bd = d; best = j; } } return best; };
    TANGGA_AWAL.forEach(a => { DK.tangga[a] = terdekat(a, cincin(a) + 1); });
    PEROSOT_AWAL.forEach(a => { DK.perosot[a] = terdekat(a, cincin(a) - 1); });
    for (let i = 1; i <= 64; i++) {
      const c = i === 64 ? '#ffd43b' : DK.tangga[i] ? '#51cf66' : DK.perosot[i] ? '#ff6b6b' : i % 2 ? '#ffe8a3' : '#ffd08a';
      const u = ubin(i === 64 ? 1.3 : .92, i === 64 ? 1.3 : .92, c, String(i), DK.tangga[i] || DK.perosot[i] || i === 64 ? '#fff' : '#7a4a1a', {ukuran: 70, tebal: .16});
      const p = DK.pos[i]; u.position.set(p.x, p.y, p.z); u.rotation.y = i === 64 ? 0 : -Math.atan2(p.z, p.x) + Math.PI / 2; sc.add(u);
    }
    Object.entries(DK.tangga).forEach(([a, b]) => sc.add(this.buatTangga(DK.pos[a], DK.pos[b])));
    Object.entries(DK.perosot).forEach(([a, b]) => sc.add(this.buatPerosot(DK.pos[a], DK.pos[b])));
    // bendera di puncak
    const bd = new THREE.Group(); bd.add(di(kotak(.1, 2.2, .1, '#e9ecef', .03), 0, 1.1, 0)); bd.add(di(kotak(.05, .4, .8, '#e03131', .02), 0, 1.95, .42)); bd.add(di(kotak(.05, .4, .8, '#ffffff', .02), 0, 1.55, .42)); bd.position.set(.45, 6 * TINGGI + .16, -.45); sc.add(bd);
    // pohon di gunung (permintaan Huda): di tepi luar & dalam tiap tingkat, di sela petak
    const terpakai = (x, z, y) => DK.pos.some(p => p && Math.abs(p.y - y) < .2 && Math.hypot(p.x - x, p.z - z) < .95);
    for (let ci = 0; ci < 4; ci++) { const r0 = TIER[ci][0], r1 = TIER[ci + 1][0], y = (ci + 1) * TINGGI, jum = [26, 20, 15, 10][ci];
      for (let k = 0; k < jum; k++) { const a = k / jum * Math.PI * 2 + ci * .4, rr = k % 2 ? r0 - .38 : r1 + .42; const x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (terpakai(x, z, y)) continue;
        const t = k % 5 === 4 ? bunga(pilih(['#ff6fa3', '#ffd23f', '#a78bfa', '#ff922b'])) : pohon(acak(.26, .36) * (ci < 3 ? 1 : .8)); t.position.set(x, y, z); if (k % 5 === 4) t.scale.setScalar(1.6); sc.add(t); } }
    // kaki gunung: hutan, bunga, tenda base camp
    for (let k = 0; k < 44; k++) { const a = k / 44 * Math.PI * 2, r = acak(14.5, 20); const x = Math.cos(a) * r, z = Math.sin(a) * r; const p = pohon(acak(.45, .7)); p.position.set(x, 0, z); sc.add(p); }
    for (let i = 0; i < 80; i++) { const a = acak(0, Math.PI * 2), r = acak(10, 16); const b = bunga(pilih(['#ff6fa3', '#ffd23f', '#a78bfa', '#ff922b', '#ffffff'])); b.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); b.scale.setScalar(1.4); sc.add(b); }
    const tenda = new THREE.Group(); const kain = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.3, 4), new THREE.MeshStandardMaterial({color: '#ff922b', roughness: .8, flatShading: true})); kain.position.y = .65; kain.rotation.y = Math.PI / 4; kain.castShadow = true; tenda.add(kain);
    const b0 = DK.pos[0]; tenda.position.set(b0.x * 1.12 + 1.2, 0, b0.z * 1.12); sc.add(tenda);
    for (let i = 0; i < 7; i++) { const a = awan(acak(1.2, 2)); a.position.set(acak(-20, 20), acak(11, 16), acak(-30, -18)); sc.add(a); }
    this.buatBidak();
  },
  buatTangga(a, b) {
    const g = new THREE.Group(), d = b.clone().sub(a), L = d.length(); const pa = a.clone().add(new THREE.Vector3(0, .2, 0));
    [-.28, .28].forEach(s => g.add(di(kotak(.09, .09, L, '#8b5a2b', .03), s, 0, 0)));
    for (let t = .25; t < L; t += .32) g.add(di(kotak(.6, .07, .08, '#c08a4a', .02), 0, 0, t - L / 2));
    g.position.copy(pa).add(d.clone().multiplyScalar(.5)); g.lookAt(b.clone().add(new THREE.Vector3(0, .2, 0))); return g;
  },
  buatPerosot(a, b) {
    const g = new THREE.Group(), L = a.distanceTo(b);
    g.add(di(kotak(.55, .08, L, '#ff6b6b', .04), 0, 0, 0)); [-.3, .3].forEach(s => g.add(di(kotak(.07, .2, L, '#fa5252', .03), s, .1, 0)));
    g.position.copy(a).add(b).multiplyScalar(.5); g.position.y += .22; g.lookAt(b.x, b.y + .22, b.z); return g;
  },
  buatBidak() {
    DK.bidak.forEach(b => P.sc.remove(b)); DK.bidak = [];
    for (let i = 0; i < DK.pemain.n; i++) { const s = SISWA[DK.pemain.daftar[i].t % SISWA.length]; const t = buatTokoh(s.o, .22);
      const alas = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .05, 16), new THREE.MeshStandardMaterial({color: WARNA_TIM[i]})); alas.position.y = .03; t.add(alas);
      t.userData.no = i; t.userData.petak = 0; P.sc.add(t); DK.bidak.push(t); }
    this.aturLetak(true);
  },
  // beberapa bidak di petak yang sama digeser sedikit
  letak(i, petak) { const p = petakPos(petak).clone(); const sama = DK.bidak.filter(b => b.userData.petak === petak); const k = sama.indexOf(DK.bidak[i]), n = sama.length;
    if (n > 1) { const a = k / n * Math.PI * 2; p.x += Math.cos(a) * .24; p.z += Math.sin(a) * .24; } p.y += petak === 0 ? 0 : .16; return p; },
  aturLetak(langsung) { DK.bidak.forEach((b, i) => { const p = this.letak(i, b.userData.petak); if (langsung) b.position.copy(p); else animasi(.25, e => b.position.lerp(p, e)); this.hadapKamera(b); }); },
  hadapKamera(b) { b.rotation.y = Math.atan2(P.cam.position.x - b.position.x, P.cam.position.z - b.position.z); },
  layarPemain(el, lanjut) {
    const pm = DK.pemain;
    const gambar = () => {
      el.innerHTML = `<h2 style="margin:0">Tim Ekspedisi</h2><div class="lbl">Jumlah siswa</div><div class="seg" id="pJumlah">${[2, 3, 4].map(v => `<button data-v="${v}" class="${pm.n === v ? 'on' : ''}">${v} siswa</button>`).join('')}</div>
      <div class="pGrid">${pm.daftar.slice(0, pm.n).map((p, i) => `<div class="pKartu" style="border-color:${WARNA_TIM[i]}"><b style="color:${WARNA_TIM[i]}">Siswa ${i + 1}</b>
        <input type="text" id="pNama${i}" maxlength="12" value="${esc(p.nama)}" aria-label="Nama siswa ${i + 1}">
        <div class="tokohPil" data-i="${i}">${SISWA.map((s, j) => `<button data-j="${j}" class="${p.t === j ? 'on' : ''}">${s.nama}</button>`).join('')}</div></div>`).join('')}</div>
      <div class="aBaris"><span class="gInfo">Tokoh di belakang ikut berganti.</span><button class="besar" id="pMulai">▶ Mulai Mendaki</button></div>`;
      const simpanNama = () => pm.daftar.slice(0, pm.n).forEach((p, i) => { const v = $('pNama' + i); if (v) p.nama = (v.value.trim() || 'Siswa ' + (i + 1)).slice(0, 12); });
      el.querySelectorAll('#pJumlah button').forEach(b => b.onclick = () => { efek.ketuk(); simpanNama(); pm.n = +b.dataset.v; this.buatBidak(); gambar(); });
      el.querySelectorAll('.tokohPil').forEach(tp => tp.querySelectorAll('button').forEach(b => b.onclick = () => { efek.pop(); simpanNama(); pm.daftar[+tp.dataset.i].t = +b.dataset.j; this.buatBidak(); setMode(DK.bidak[+tp.dataset.i], 'senang', .8); gambar(); }));
      $('pMulai').onclick = () => { efek.ketuk(); simpanNama(); simpanLS('dkpintar:puncak', pm); lanjut(); };
    };
    gambar();
  },
  mulai() {
    const sesi = ++DK.sesi; DK.selesai = false; DK.cur = 0; this.buatBidak(); DK.skor = DK.bidak.map(() => ({benar: 0, salah: 0}));
    const ui = $('ui'); ui.innerHTML = `<div id="tim"><h3>Tim Ekspedisi</h3><div id="timIsi"></div></div><div id="giliran"></div><button id="bDadu" disabled>🎲 Lempar Dadu</button>`;
    this.tulisTim(); this.putaran(sesi);
  },
  tulisTim() { if (!$('timIsi')) return; $('timIsi').innerHTML = DK.bidak.map((b, i) => `<div class="tBaris ${i === DK.cur && !DK.selesai ? 'aktif' : ''}"><i style="background:${WARNA_TIM[i]}"></i>${esc(DK.pemain.daftar[i].nama)}<b>${b.userData.petak || '–'}</b></div>`).join('');
    $('giliran').innerHTML = `Giliran <span style="color:${WARNA_TIM[DK.cur]}">${esc(DK.pemain.daftar[DK.cur].nama)}</span>`; },
  kabar(teks, lama = 1.6) { const k = document.createElement('div'); k.id = 'kabar'; k.innerHTML = teks; $('ui').appendChild(k); return tunggu(lama).then(() => k.remove()); },
  async putaran(sesi) {
    while (sesi === DK.sesi && !DK.selesai) {
      const i = DK.cur, b = DK.bidak[i], nama = DK.pemain.daftar[i].nama; this.tulisTim(); setMode(b, 'senang', .8);
      // tunggu tombol dadu
      await new Promise(res => { const bt = $('bDadu'); bt.disabled = false; bt.onclick = () => { if (JEDA) return; bt.disabled = true; res(); }; }); if (sesi !== DK.sesi) return;
      const n = await this.lemparDadu(); if (sesi !== DK.sesi) return;
      const dari = b.userData.petak, maju = Math.min(64, dari + n), mundur = Math.max(0, dari - Math.ceil(n / 2));
      // Tantangan Ilmu
      const tt = document.createElement('div'); tt.id = 'tantangan';
      tt.innerHTML = `<div class="tKotak"><div class="tKepala"><h3>Tantangan Ilmu</h3><span style="font-weight:800;color:${WARNA_TIM[i]}">${esc(nama)}</span><span class="td">🎲 ${n}</span>
        <div class="tTaruh">Benar: <b class="n">${dari || 'Start'} → ${maju}</b> &nbsp;·&nbsp; Salah: <b class="t">${dari || 'Start'} → ${mundur || 'Start'}</b></div></div></div>`;
      $('ui').appendChild(tt); const k = buatKartu(tt.firstChild);
      const h = await tanya(k, ambilSoal(0)); if (sesi !== DK.sesi) return;
      if (h.benar) { efek.benar(); DK.skor[i].benar++; setMode(b, 'senang', 1.2); } else { efek.salah(); DK.skor[i].salah++; setMode(b, 'geleng', 1.2); }
      await umpan(k, h, {tambahan: h.benar ? `${esc(nama)} maju ke petak ${maju}` : `${esc(nama)} mundur ke ${mundur ? 'petak ' + mundur : 'Start'}`}); tt.remove(); if (sesi !== DK.sesi) return;
      await this.jalan(i, h.benar ? maju : mundur); if (sesi !== DK.sesi) return;
      const p = b.userData.petak;
      if (DK.tangga[p]) { await this.kabar(`🪜 Naik tangga! ${p} → ${DK.tangga[p]}`, .2); efek.naik(); await this.pindahLurus(i, DK.tangga[p], 1.1); await this.kabar(`🪜 Naik tangga! ${p} → ${DK.tangga[p]}`, 1); }
      else if (DK.perosot[p]) { efek.turun(); await this.pindahLurus(i, DK.perosot[p], .9); await this.kabar(`🛝 Meluncur turun! ${p} → ${DK.perosot[p]}`, 1.2); }
      if (sesi !== DK.sesi) return;
      if (b.userData.petak >= 64) { this.menang(i); return; }
      DK.cur = (DK.cur + 1) % DK.bidak.length;
    }
  },
  async lemparDadu() {
    const d = document.createElement('div'); d.id = 'dadu'; d.className = 'putar'; d.innerHTML = '<span></span>'.repeat(9); $('ui').appendChild(d);
    const POLA = {1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]};
    const tulis = v => [...d.children].forEach((s, j) => s.classList.toggle('on', POLA[v].includes(j)));
    efek.dadu(); for (let t = 0; t < 10; t++) { tulis(acakInt(1, 6)); await tunggu(.08); }
    const n = acakInt(1, 6); tulis(n); d.classList.remove('putar'); efek.pop(); await tunggu(.8); d.remove(); return n;
  },
  async jalan(i, ke) {
    const b = DK.bidak[i]; let p = b.userData.petak; const arah = Math.sign(ke - p);
    while (p !== ke) { p += arah; b.userData.petak = p; const t = this.letak(i, p); efek.langkah(); await lompatKe(b, t, .3, .45); this.hadapKamera(b); }
    this.aturLetak(); this.tulisTim();
  },
  async pindahLurus(i, ke, lama) { const b = DK.bidak[i]; b.userData.petak = ke; const t = this.letak(i, ke); await lompatKe(b, t, lama, .3); this.aturLetak(); this.tulisTim(); },
  async menang(i) {
    DK.selesai = true; this.tulisTim(); const b = DK.bidak[i]; setMode(b, 'senang', 99); efek.menang(); konfeti(b.position.clone().add(new THREE.Vector3(0, 1, 0)), 60);
    $('bDadu') && $('bDadu').remove(); await tunggu(1.8);
    const urut = DK.bidak.map((x, j) => j).sort((a, c) => DK.bidak[c].userData.petak - DK.bidak[a].userData.petak);
    const med = ['🥇', '🥈', '🥉', '4.'];
    layarHasil(`${DK.pemain.daftar[i].nama} sampai di puncak!`, `<table class="hTabel">${urut.map((j, r) => `<tr><td>${med[r]} <b style="color:${WARNA_TIM[j]}">${esc(DK.pemain.daftar[j].nama)}</b></td><td>petak ${DK.bidak[j].userData.petak || 'Start'} · ${DK.skor[j].benar} benar</td></tr>`).join('')}</table>`);
  },
  keMenu() { DK.sesi++; DK.selesai = true; $('ui').innerHTML = ''; this.buatBidak(); },
  update(dt, t) {
    DK.bidak.forEach(b => animTokoh(b, dt));
    const lay = document.body.dataset.layar, tg = tegak(); let fokus, sudut, jarak, tinggi;
    if (lay === 'main' || lay === 'lHasil') {
      const b = DK.bidak[DK.selesai ? DK.bidak.findIndex(x => x.userData.petak >= 64) : DK.cur] || DK.bidak[0]; fokus = b.position.clone();
      const r = Math.hypot(fokus.x, fokus.z); sudut = r < .5 ? .6 : Math.atan2(fokus.z, fokus.x); jarak = tg ? 10 : 7.5; tinggi = tg ? 9 : 6.5; fokus.multiplyScalar(r > 5 ? .8 : .9); fokus.y += tg ? 1.2 : .6;
    } else { fokus = new THREE.Vector3(0, 2.6, 0); sudut = (DK.camSudut += dt * .12); jarak = tg ? 25 : 18; tinggi = tg ? 18 : 12; }
    let da = sudut - DK.camA; if (DK.camA === undefined) { DK.camA = sudut; da = 0; } da = Math.atan2(Math.sin(da), Math.cos(da)); DK.camA += da * Math.min(1, dt * 2.5);
    DK.camT.lerp(fokus, Math.min(1, dt * 3)); const rr = Math.hypot(DK.camT.x, DK.camT.z);
    P.cam.position.set(Math.cos(DK.camA) * (rr + jarak), DK.camT.y + tinggi, Math.sin(DK.camA) * (rr + jarak)); P.cam.lookAt(DK.camT);
    P.cam.fov = tg ? 46 : 38; P.cam.updateProjectionMatrix(); ikutCahaya(DK.camT.x, DK.camT.y, DK.camT.z);
  },
});
GAME.uji = DK;
jalankan();
