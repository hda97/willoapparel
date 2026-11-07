// ===================================================================
// Mesin petualangan umum game SD (Petualang Kata, Penjelajah Alam, English Explorer).
// Dipakai setelah inti.js + inti-sd.js. Game cukup membangun dunia & pos, lalu
// memanggil mulaiPetualang({...}). Empat jenis tantangan:
//  pilih    : 3 papan jawaban di dunia 3D, ketuk yang benar (soal | jawaban | pilihan salah a;b)
//  susun    : ketuk kepingan sesuai urutan (soal "bu-ku" / "telur, ulat, kepompong" / "I | like | cats")
//  kelompok : masukkan benda ke keranjang yang tepat (soal "Padat: batu, kayu ; Cair: air, susu")
//  bacaan   : baca teks pendek lalu jawab (soal "Teks bacaan. | Pertanyaan?")
// ===================================================================
const KANAN = new THREE.Vector3(Math.cos(YAW_ISO), 0, -Math.sin(YAW_ISO));   // kanan layar
const DEPAN = new THREE.Vector3(Math.sin(YAW_ISO), 0, Math.cos(YAW_ISO));    // ke arah kamera
const PT = {tokoh: null, POS: {}, stasiun: {}, jalan: ['Ayo ke pos berikutnya!', 'Jalan terus!', 'Tantangan baru menunggu!'], namaTokoh: 'kamu', bahasaKata: 'id-ID', pusatTuju: new THREE.Vector3()};
const JENIS_UMUM = ['pilih', 'susun', 'kelompok', 'bacaan'];

GURU.kolom = [
  {k: 'fase', label: 'Fase (A/B/C)', contoh: 'A'},
  {k: 'jenis', label: 'Jenis (pilih/susun/kelompok/bacaan)', contoh: 'pilih'},
  {k: 'soal', label: 'Soal', contoh: ''},
  {k: 'jawaban', label: 'Jawaban benar (susun: petunjuk)', contoh: ''},
  {k: 'pilihan', label: 'Pilihan salah (pisah dengan ;)', contoh: ''},
];
GURU.pengaturan = [{k: 'urutan', label: 'Urutan soal', tipe: 'pilih', opsi: [['berurutan', 'Berurutan'], ['acak', 'Acak']]}];
GURU.terapkan = () => { bersihRonde(); tutupPapan(); keFasePT(); };

// ---------- suara bahasa lain (English Explorer) ----------
let _suaraLain = {};
function ucapBahasa(teks, lang = 'en-US', {tampil = false, cepat = .85} = {}) {
  if (tampil) tulisGelembung(teks); teks = String(teks).replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '').trim();
  return new Promise(res => {
    const vs = ('speechSynthesis' in window) ? speechSynthesis.getVoices() : [];
    if (!vs.length || !SUARA_ON) { setTimeout(res, Math.min(3000, 400 + teks.length * 60)); return; }
    const k = lang.slice(0, 2); _suaraLain[k] = _suaraLain[k] || vs.find(v => v.lang.replace('_', '-').startsWith(lang)) || vs.find(v => v.lang.startsWith(k)) || null;
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(teks); u.lang = lang; if (_suaraLain[k]) u.voice = _suaraLain[k]; u.rate = cepat;
    let s = false; const done = () => { if (!s) { s = true; redamMusik(false); res(); } };
    redamMusik(true); u.onend = done; u.onerror = done; setTimeout(done, 1500 + teks.length * 120); speechSynthesis.speak(u);
  });
}
const ucapKata = t => PT.bahasaKata === 'id-ID' ? ucap(t, {tampil: false}) : ucapBahasa(t, PT.bahasaKata);

// ---------- papan teks (kanvas) ----------
const adaEmoji = s => /\p{Extended_Pictographic}/u.test(s);
function teksKanvas(teks, {w = 512, h = 320, latar = '#ffffff', warna = '#2b2b2b', tepi = '#ffd43b', font = 'Baloo 2'} = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = tepi; x.fillRect(0, 0, w, h); x.fillStyle = latar; const m = Math.round(h * .07); x.beginPath(); x.roundRect ? x.roundRect(m, m, w - 2 * m, h - 2 * m, h * .12) : x.rect(m, m, w - 2 * m, h - 2 * m); x.fill();
  x.fillStyle = warna; x.textAlign = 'center'; x.textBaseline = 'middle';
  const s = String(teks); const hanyaEmoji = adaEmoji(s) && s.replace(/[\p{Extended_Pictographic}‍️\s]/gu, '').length === 0;
  let uk = hanyaEmoji ? h * .62 : h * .38, baris = [s];
  const ukur = () => { x.font = `800 ${uk}px "${font}", system-ui, sans-serif`; };
  ukur();
  // bungkus kata bila terlalu lebar, kecilkan sampai muat
  for (let i = 0; i < 30; i++) {
    const kata = s.split(/\s+/); baris = []; let b = '';
    kata.forEach(k => { const c2 = b ? b + ' ' + k : k; if (x.measureText(c2).width > w * .84 && b) { baris.push(b); b = k; } else b = c2; }); baris.push(b);
    const lebar = Math.max(...baris.map(b => x.measureText(b).width));
    if (lebar <= w * .86 && baris.length * uk * 1.12 <= h * .8) break; uk *= .9; ukur();
  }
  baris.forEach((b, i) => x.fillText(b, w / 2, h / 2 + (i - (baris.length - 1) / 2) * uk * 1.12 + uk * .04));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// papan berdiri menghadap kamera; o.tiang: tinggi tiang (0 = tanpa)
function papan(teks, {lebar = 2.0, tinggi = 1.2, tiang = 1.0, latar = '#ffffff', warna = '#2b2b2b', tepi = '#ffd43b', kayu = '#8a5a32'} = {}) {
  const g = new THREE.Group(); const tex = teksKanvas(teks, {w: 512, h: Math.round(512 * tinggi / lebar), latar, warna, tepi});
  const sisi = new THREE.MeshStandardMaterial({color: tepi, roughness: .7});
  const m = new THREE.Mesh(new THREE.BoxGeometry(lebar, tinggi, .1), [sisi, sisi, sisi, sisi, new THREE.MeshStandardMaterial({map: tex, roughness: .8}), sisi]);
  m.castShadow = true; const muka = new THREE.Group(); muka.add(m); m.position.y = tiang + tinggi / 2; muka.rotation.y = YAW_ISO;
  if (tiang > 0) { const t = kotak(.14, tiang + .1, .14, kayu, .03); t.position.y = (tiang + .1) / 2; muka.add(t); }
  g.add(muka); g.userData.muka = muka; g.userData.papan = m; return g;
}
function posisiBaris(pst, n, jarak, maju = 0) { if (tegak()) jarak *= .8; return Array.from({length: n}, (_, i) => new THREE.Vector3(pst[0], 0, pst[1]).addScaledVector(KANAN, (i - (n - 1) / 2) * jarak).addScaledVector(DEPAN, maju)); }

// ---------- pos & perjalanan ----------
async function keStasiunPT(nama) {
  const p = PT.POS[nama]; PT.pusatTuju.set(p.pusat[0], 0, p.pusat[1]);
  const sisi = p.sisi ?? 3.0, maju = tegak() ? 2.6 : 1.4, x = p.x ?? p.pusat[0] + DEPAN.x * maju - KANAN.x * sisi, z = p.z ?? p.pusat[1] + DEPAN.z * maju - KANAN.z * sisi;
  if (Math.hypot(PT.tokoh.position.x - x, PT.tokoh.position.z - z) > .1) await jalanKe(PT.tokoh, x, z, 5.2);
}
const pisahDaftar = s => String(s || '').split(';').map(t => t.trim()).filter(Boolean);
function soalSahPT(f) {
  return (DATA.soal || []).map(s => ({fase: String(s.fase || 'A').trim().toUpperCase().charAt(0), jenis: String(s.jenis || 'pilih').trim().toLowerCase(), soal: String(s.soal ?? '').trim(), jawaban: String(s.jawaban ?? '').trim(), pilihan: String(s.pilihan ?? '').trim()}))
    .filter(s => s.soal && (!f || s.fase === f)).map(s => ({...s, jenis: JENIS_UMUM.includes(s.jenis) ? s.jenis : 'pilih'}));
}
let urut = [], idx = 0, skor = 0, N = 0, faseNow = 'A';
function keFasePT() {
  bersihRonde(); tutupPapan(); window.__ulangSuara = null; tulisGelembung('Pilih fase untuk mulai.'); P.seret = null;
  const j = {}; soalSahPT().forEach(s => { j[s.fase] = (j[s.fase] || 0) + 1; });
  const a = PT.POS.awal; PT.pusatTuju.set(a.pusat[0], 0, a.pusat[1]); jalanKe(PT.tokoh, a.x, a.z, 5.2); setMode(PT.tokoh, 'lambai');
  pilihFase(j, mainFasePT);
}
function mainFasePT(f) { faseNow = f; urut = soalSahPT(f); if (DATA.urutan === 'acak') urut = kocok(urut); N = urut.length; idx = 0; skor = 0; aturNyawa(3); aturBintang(0, N); putaranPT(); }
async function putaranPT() {
  bersihRonde(); tutupPapan(); kunci = true; P.seret = null; window.__ulangSuara = null;
  if (idx >= N) {
    const bt = Math.max(1, NYAWA); simpanBintangFase(faseNow, bt);
    const a = PT.POS.awal; PT.pusatTuju.set(a.pusat[0], 0, a.pusat[1]); await jalanKe(PT.tokoh, a.x, a.z, 5.2);
    setMode(PT.tokoh, 'senang', 3); konfeti(PT.tokoh.position.clone().setY(2), undefined, 90);
    await ucap(`Hebat! ${FASE[faseNow].nama} selesai dengan ${bt} bintang!`);
    layarSelesai(skor, N, keFasePT); $('selesaiBintang').innerHTML = '★'.repeat(bt) + '<span style="color:#dee2e6;text-shadow:none">' + '★'.repeat(3 - bt) + '</span>';
    return;
  }
  const q = urut[idx]; tulisGelembung(PT.jalan[idx % PT.jalan.length]);
  await keStasiunPT(PT.stasiun[q.jenis]);
  ({pilih: rondePilih, susun: rondeSusun, kelompok: rondeKelompok, bacaan: rondeBacaan})[q.jenis](q);
}
async function benarPT(teks, pos) {
  kunci = true; tutupPapan(); efek.benar(); setMode(PT.tokoh, 'senang', 1.8); konfeti(pos || PT.tokoh.position.clone().setY(2)); skor++; aturBintang(skor, N);
  if (PT.saatBenar) PT.saatBenar(urut[idx]);
  if (PT.bahasaKata !== 'id-ID') { tulisGelembung(pilih(PUJI_EN)); await ucapBahasa($('gelembung').textContent, PT.bahasaKata); } else await ucap(teks); idx++; putaranPT();
}
async function salahPT(teks) {
  kunci = true; efek.salah(); setMode(PT.tokoh, 'geleng', 1.2);
  if (kurangNyawa() <= 0) { await ucap('Yah, nyawamu habis.'); tutupPapan(); bersihRonde(); $('layarKalah').hidden = false;
    $('bCobaLagi').onclick = () => { $('layarKalah').hidden = true; mainFasePT(faseNow); };
    $('bKeFase').onclick = () => { $('layarKalah').hidden = true; keFasePT(); }; return false; }
  await ucap(teks); kunci = false; return true;
}
const PUJI = ['Hebat!', 'Pintar!', 'Betul sekali!', 'Keren!', 'Mantap!'], PUJI_EN = ['Great job!', 'Well done!', 'Excellent!', 'Good job!'], AYO = ['Coba lagi ya.', 'Hampir! Ayo lagi.', 'Tidak apa-apa, coba lagi.'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// pengecoh: kolom pilihan, atau jawaban soal lain yang sejenis
function pilihanDari(q, n = 3) {
  let salah = pisahDaftar(q.pilihan).filter(s => s.toLowerCase() !== q.jawaban.toLowerCase());
  if (salah.length < n - 1) { const lain = kocok(soalSahPT().filter(s => s.jenis === q.jenis && s.jawaban && s.jawaban.toLowerCase() !== q.jawaban.toLowerCase()).map(s => s.jawaban)); for (const l of lain) { if (salah.length >= n - 1) break; if (!salah.includes(l)) salah.push(l); } }
  return kocok([q.jawaban, ...kocok(salah).slice(0, n - 1)]);
}

// --- 1. pilih: papan jawaban di dunia ---
async function rondePilih(q) {
  if (!q.jawaban) { idx++; return putaranPT(); }
  const st = PT.POS[PT.stasiun.pilih]; const opsi = pilihanDari(q, 3);
  kartuSoal(adaEmoji(q.soal) && q.soal.length < 6 ? `<span style="font-size:1.5em">${esc(q.soal)}</span>` : `<small style="color:#2b2b2b;font-size:clamp(18px,4.6vw,26px)">${esc(q.soal)}</small>`);
  const pos = posisiBaris(st.pusat, opsi.length, st.jarak || 2.4);
  opsi.forEach((v, i) => {
    const g = (st.buatPilihan || papan)(v, {tiang: st.tiang ?? .8}); g.position.copy(pos[i]); g.userData.v = v; tambahRonde(g); muncul(g);
    daftarKetuk(g, async o => {
      if (kunci) return; kunci = true;
      if (PT.bahasaKata !== 'id-ID' && !adaEmoji(v)) await ucapBahasa(v, PT.bahasaKata);
      if (o.userData.v === q.jawaban) {
        lompat(o, .5, .5); efek.pop();
        await benarPT(`${pilih(PUJI)} Jawabannya ${PT.bahasaKata === 'id-ID' ? v : 'itu'}.`, o.position.clone().setY(2.4));
      } else {
        hapusKetuk(o); goyang(o.userData.muka, .5); await tunggu(450); const y = o.position.y; animasi(.6, e => { o.position.y = y - e * 2.4; o.scale.setScalar(Math.max(.01, 1 - e)); });
        await salahPT(`Bukan ${PT.bahasaKata === 'id-ID' ? v : 'yang itu'}. ${pilih(AYO)}`);
      }
    });
  });
  window.__ulangSuara = () => ucap(q.soal.replace(/\p{Extended_Pictographic}/gu, ''), {tampil: false});
  tulisGelembung('Ketuk papan jawaban yang benar!'); await (st.bicara ? st.bicara(q) : ucap(st.ajak ? st.ajak(q) : q.soal, {tampil: false})); kunci = false;
}

// --- 2. susun: kepingan berurutan ---
function pisahSusun(s) { if (s.includes('|')) return s.split('|'); if (s.includes(',')) return s.split(','); if (/\S-\S/.test(s) && !/\s/.test(s.trim())) return s.split('-'); return s.split(/\s+/); }
async function rondeSusun(q) {
  const bag = pisahSusun(q.soal).map(t => t.trim()).filter(Boolean); if (bag.length < 2 || bag.length > 8) { idx++; return putaranPT(); }
  const st = PT.POS[PT.stasiun.susun]; let k = 0; const sambung = st.sambung ?? (q.soal.includes('-') && !q.soal.includes(' ') ? '' : ' ');
  const tulis = () => kartuSoal(`${bag.map((b, i) => i < k ? `<b style="color:#2f9e44">${esc(b)}</b>` : '<span style="color:#ced4da">＿</span>').join(sambung ? ' ' : ' ')}${q.jawaban ? `<small>${esc(q.jawaban)}</small>` : ''}`);
  tulis();
  const acakB = kocok(bag.map((b, i) => ({b, i}))); if (acakB.every((o, j) => o.i === j)) acakB.reverse();
  const n = acakB.length, dua = n > 4, per = dua ? Math.ceil(n / 2) : n;
  acakB.forEach((o, j) => {
    const baris = dua ? Math.floor(j / per) : 0, kol = dua ? j % per : j, nb = dua ? (baris ? n - per : per) : n;
    const p = posisiBaris(st.pusat, nb, st.jarak || 1.75, (baris ? 1 : 0) * -1.5 + (dua ? .6 : 0))[kol];
    const g = (st.buatKeping || ((t) => papan(t, {lebar: 1.5, tinggi: 1.0, tiang: .5, tepi: '#74c0fc'})))(o.b); g.position.copy(p); g.userData.i = o.i; g.userData.b = o.b; tambahRonde(g); muncul(g);
    daftarKetuk(g, async ob => {
      if (kunci) return;
      if (PT.bahasaKata !== 'id-ID') ucapBahasa(ob.userData.b, PT.bahasaKata); else efek.pop();
      if (bag[ob.userData.i] === bag[k]) {
        hapusKetuk(ob); k++; tulis(); const ke = new THREE.Vector3(st.pusat[0], 0, st.pusat[1]).addScaledVector(DEPAN, 3.6).addScaledVector(KANAN, (k - 1 - (bag.length - 1) / 2) * .55).setY(2.6);
        terbangKe(ob, ke, .45, .8).then(() => { ob.scale.setScalar(.4); });
        if (k >= bag.length) { kunci = true; await tunggu(500); await benarPT(`${pilih(PUJI)} ${PT.bahasaKata === 'id-ID' ? bag.join(sambung) : ''}`.trim(), new THREE.Vector3(st.pusat[0], 2, st.pusat[1])); }
      } else { goyang(ob.userData.muka, .5); await salahPT(`Belum urut. Cari yang ke-${k + 1}.`); }
    });
  });
  await (st.bicara ? st.bicara(q) : ucap(st.ajak ? st.ajak(q) : `Ketuk kepingan sesuai urutan yang benar!${q.jawaban ? ' ' + q.jawaban : ''}`)); kunci = false;
}

// --- 3. kelompok: keranjang ---
function bacaKelompok(s) {
  return s.split(';').map(b => { const i = b.indexOf(':'); return i < 0 ? null : {nama: b.slice(0, i).trim(), isi: b.slice(i + 1).split(',').map(t => t.trim()).filter(Boolean)}; }).filter(k => k && k.nama && k.isi.length);
}
async function rondeKelompok(q) {
  const kel = bacaKelompok(q.soal).slice(0, 3); if (kel.length < 2) { idx++; return putaranPT(); }
  const st = PT.POS[PT.stasiun.kelompok]; const benda = kocok(kel.flatMap((k, i) => k.isi.map(t => ({t, i})))).slice(0, 8); let b = 0;
  const tulis = () => kartuSoal(`${esc(benda[b] ? benda[b].t : '')}<small>${esc(q.jawaban || 'Masukkan ke keranjang yang tepat')} · ${b}/${benda.length}</small>`);
  const kr = posisiBaris(st.pusat, kel.length, st.jarak || 2.9, -.6).map((p, i) => {
    const g = (st.buatKeranjang || keranjangPT)(kel[i].nama, i); g.position.copy(p); g.userData.i = i; tambahRonde(g); muncul(g); return g;
  });
  const tempat = new THREE.Vector3(st.pusat[0], 0, st.pusat[1]).addScaledVector(DEPAN, 3.0);
  let item = null;
  const tampil = () => { tulis(); if (!benda[b]) return; item = papan(benda[b].t, {lebar: 1.8, tinggi: 1.1, tiang: 0, tepi: '#ff922b'}); item.position.copy(tempat).setY(.9); const it0 = item; pembaru.push(function f(dt, t) { if (it0.parent !== P.sc) { pembaru.splice(pembaru.indexOf(f), 1); return; } if (it0 === item) it0.position.y = .9 + Math.sin(t * 3) * .1; }); tambahRonde(item); muncul(item); if (PT.bahasaKata !== 'id-ID') ucapBahasa(benda[b].t, PT.bahasaKata); };
  kr.forEach(g => daftarKetuk(g, async o => {
    if (kunci || !item) return; kunci = true;
    if (o.userData.i === benda[b].i) {
      efek.pop(); const it = item; item = null; await terbangKe(it, o.position.clone().setY(1), .45, 1.2); P.sc.remove(it); lompat(o, .25, .35); b++;
      if (b >= benda.length) { tulis(); await benarPT(`${pilih(PUJI)} Semua masuk keranjang yang tepat.`, o.position.clone().setY(2)); return; }
      tampil(); kunci = false;
    } else { goyang(o, .5); await salahPT(`${benda[b].t} bukan termasuk ${kel[o.userData.i].nama}.`); }
  }));
  tampil();
  await (st.bicara ? st.bicara(q, kel) : ucap(st.ajak ? st.ajak(q) : `Masukkan setiap benda ke keranjang yang tepat: ${kel.map(k => k.nama).join(' atau ')}.`)); kunci = false;
}
function keranjangPT(nama, i) {
  const g = new THREE.Group(); const w = ['#f08c00', '#1c7ed6', '#2f9e44'][i % 3];
  tambah(g, 1.9, .95, 1.3, 0, .48, 0, variasi('#c98a4a', .03), .12); tambah(g, 2.0, .12, 1.4, 0, .97, 0, '#a0703e', .05);
  for (let x = -.6; x <= .6; x += .6) tambah(g, .08, .75, 1.34, x, .48, 0, '#a0703e', .02); g.rotation.y = YAW_ISO;
  const p = papan(nama, {lebar: 2.2, tinggi: .95, tiang: 0, tepi: w}); p.position.y = 1.05; p.userData.muka.rotation.y = 0; g.add(p); g.userData.muka = p.userData.muka; return g;
}

// --- 4. bacaan: teks pendek + pertanyaan (pilihan di layar) ---
async function rondeBacaan(q) {
  if (!q.jawaban) { idx++; return putaranPT(); }
  const st = PT.POS[PT.stasiun.bacaan]; const [teks, tanya] = q.soal.includes('|') ? q.soal.split('|').map(s => s.trim()) : ['', q.soal];
  kartuSoal(`<small style="color:#2b2b2b;text-align:left;line-height:1.35">${teks ? esc(teks) + '<br><br>' : ''}<b>${esc(tanya)}</b></small>`); $('kartu').classList.add('bacaan');
  if (st.saatBaca) st.saatBaca(q);
  const buku = (st.buatBuku || (() => papan(st.ikon || '📖', {lebar: 1.6, tinggi: 1.2, tiang: .9, tepi: '#f783ac'})))(); buku.position.set(st.pusat[0], 0, st.pusat[1]); tambahRonde(buku); muncul(buku);
  const opsi = pilihanDari(q, 3);
  const pasang = () => pilihanUI(opsi.map(v => ({html: esc(v), v})), async (d, el) => {
    if (PT.bahasaKata !== 'id-ID') { kunci = true; await ucapBahasa(d.v, PT.bahasaKata); kunci = false; }
    if (d.v === q.jawaban) { pilihanUI(null); await benarPT(`${pilih(PUJI)} Jawabannya ${d.v}.`); }
    else { el.disabled = true; el.style.opacity = .35; opsi.splice(opsi.indexOf(d.v), 1); if (await salahPT(`${pilih(AYO)} Baca lagi pelan-pelan.`)) pasang(); }
  });
  pasang(); $('pilihan').querySelectorAll('.pil').forEach(b => { b.style.fontSize = '20px'; b.style.minHeight = '0'; });
  tulisGelembung('Baca, lalu pilih jawabannya.');
  await (PT.bahasaKata !== 'id-ID' ? ucapBahasa(teks ? teks + ' ' + tanya : tanya, PT.bahasaKata) : ucap(teks ? `${teks} ${tanya}` : tanya, {tampil: false})); kunci = false;
}

// ---------- mulai ----------
function mulaiPetualang({tokoh, POS, stasiun, judul, ajakan, namaTokoh, bahasaKata = 'id-ID', jalan, npc = []}) {
  Object.assign(PT, {tokoh, POS, stasiun, namaTokoh: namaTokoh || PT.namaTokoh, bahasaKata}); if (jalan) PT.jalan = jalan;
  P.tokoh = tokoh; P.pusat = new THREE.Vector3(POS.awal.pusat[0], 0, POS.awal.pusat[1]); PT.pusatTuju.copy(P.pusat);
  tokoh.position.set(POS.awal.x, 0, POS.awal.z); hadapDepan(tokoh, YAW_ISO - .35);
  pembaru.push(dt => { gerakKarakter(tokoh, dt); animasiKarakter(tokoh, dt); npc.forEach(k => animasiKarakter(k, dt)); P.pusat.lerp(PT.pusatTuju, Math.min(1, dt * 1.6)); updatePudar(dt); });
  pasangGuru(); aturNyawa(3); aturBintang(0, 0); tulisGelembung('Ketuk Main untuk mulai'); setMode(tokoh, 'lambai'); loop();
  layarMulai(DATA.judul || judul, ajakan, keFasePT);
  if (location.hash === '#uji') window.__uji = {P, objRonde, get kunci() { return kunci; }, get urut() { return urut; }, get idx() { return idx; }};
}
