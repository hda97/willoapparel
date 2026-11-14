// Logika hitung tagihan Splitbill Cerdas. Fungsi murni, tanpa React, supaya bisa diuji di Node.

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function formatRp(n) {
  const v = Math.round(Number(n) || 0);
  const s = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (v < 0 ? '-Rp' : 'Rp') + s;
}

// "25.000" / "25,000" / "Rp 25.000,00" / "25000" -> 25000
export function parseAngka(teks) {
  if (teks == null) return 0;
  let s = String(teks).replace(/[^\d.,]/g, '');
  if (!s) return 0;
  s = s.replace(/[.,]\d{1,2}$/, ''); // sen (",00" / ".5") dibuang
  s = s.replace(/[.,]/g, '');
  const n = parseInt(s, 10);
  return isFinite(n) ? n : 0;
}

export function bulatkan(n, ke) {
  if (!ke || ke <= 1) return Math.round(n);
  return Math.ceil(Math.round(n) / ke) * ke;
}

export function subtotalItem(item) {
  return (Number(item.harga) || 0) * (Number(item.qty) || 1);
}

/**
 * tagihan = { orang:[{id,nama}], item:[{id,nama,harga,qty,ikut:[idOrang]}],
 *   pajakPersen, servicePersen, diskon, ongkir, mode:'item'|'rata', pembulatan, penalang }
 * Hasil: { subtotal, pajak, service, diskon, ongkir, total, perOrang:[{id,nama,item:[{nama,porsi}],subtotal,pajak,service,diskon,ongkir,total,totalBulat}], selisihBulat }
 */
export function hitungTagihan(t) {
  const orang = t.orang || [];
  const items = t.item || [];
  const n = orang.length;
  const subtotal = items.reduce((a, it) => a + subtotalItem(it), 0);
  const service = subtotal * (Number(t.servicePersen) || 0) / 100;
  // Pajak (PB1/PPN) dihitung setelah service, seperti struk restoran di Indonesia.
  const pajak = (subtotal + service) * (Number(t.pajakPersen) || 0) / 100;
  const diskon = Math.min(Number(t.diskon) || 0, subtotal + service + pajak);
  const ongkir = Number(t.ongkir) || 0;
  const total = subtotal + service + pajak - diskon + ongkir;

  const per = orang.map((o) => ({ id: o.id, nama: o.nama, item: [], subtotal: 0 }));
  const idx = Object.fromEntries(orang.map((o, i) => [o.id, i]));

  if (t.mode === 'rata') {
    per.forEach((p) => { p.subtotal = n ? subtotal / n : 0; });
  } else {
    for (const it of items) {
      const ikut = (it.ikut && it.ikut.length ? it.ikut : orang.map((o) => o.id)).filter((id) => id in idx);
      if (!ikut.length) continue;
      const porsi = subtotalItem(it) / ikut.length;
      for (const id of ikut) {
        const p = per[idx[id]];
        p.subtotal += porsi;
        p.item.push({ nama: it.nama || 'Item', porsi, bagi: ikut.length, qty: Number(it.qty) || 1 });
      }
    }
  }

  const pembagi = subtotal || 1;
  let totalBulatSemua = 0;
  for (const p of per) {
    const r = t.mode === 'rata' ? 1 / (n || 1) : p.subtotal / pembagi;
    p.service = service * r;
    p.pajak = pajak * r;
    p.diskon = diskon * r;
    p.ongkir = n ? ongkir / n : 0; // ongkir dibagi rata
    p.total = p.subtotal + p.service + p.pajak - p.diskon + p.ongkir;
    p.totalBulat = bulatkan(p.total, Number(t.pembulatan) || 0);
    totalBulatSemua += p.totalBulat;
  }
  const tidakTerbagi = items.length && t.mode !== 'rata'
    ? items.filter((it) => !((it.ikut && it.ikut.length ? it.ikut : orang.map((o) => o.id)).some((id) => id in idx))).length
    : 0;
  return { subtotal, service, pajak, diskon, ongkir, total, perOrang: per, selisihBulat: totalBulatSemua - Math.round(total), tidakTerbagi };
}

export function statusTagihan(t) {
  const h = hitungTagihan(t);
  const lunas = t.lunas || {};
  const penagih = t.penalang;
  const wajib = h.perOrang.filter((p) => p.id !== penagih);
  const sudah = wajib.filter((p) => lunas[p.id]).length;
  const sisa = wajib.filter((p) => !lunas[p.id]).reduce((a, p) => a + p.totalBulat, 0);
  return { ...h, jumlahWajib: wajib.length, sudahLunas: sudah, sisa, selesai: wajib.length > 0 && sudah === wajib.length };
}

export function infoBayarTeks(pengaturan) {
  const b = (pengaturan && pengaturan.pembayaran) || [];
  const baris = b.filter((x) => x && x.nomor).map((x) => `• ${x.jenis}${x.jenis ? ': ' : ''}${x.nomor}${x.atasNama ? ' a.n. ' + x.atasNama : ''}`);
  return baris.length ? '\nTransfer ke:\n' + baris.join('\n') : '';
}

export function pesanPerOrang(t, p, pengaturan) {
  const h = hitungTagihan(t);
  const baris = [];
  baris.push(`Halo ${p.nama}! 👋`);
  baris.push(`Tagihan *${t.judul || 'Patungan'}*${t.tanggal ? ' (' + t.tanggal + ')' : ''}:`);
  if (t.mode === 'rata') {
    baris.push(`• Bagi rata ${h.perOrang.length} orang: ${formatRp(p.subtotal)}`);
  } else {
    for (const it of p.item) baris.push(`• ${it.qty > 1 ? it.qty + 'x ' : ''}${it.nama}${it.bagi > 1 ? ' (÷' + it.bagi + ')' : ''}: ${formatRp(it.porsi)}`);
  }
  if (p.service) baris.push(`• Service: ${formatRp(p.service)}`);
  if (p.pajak) baris.push(`• Pajak: ${formatRp(p.pajak)}`);
  if (p.diskon) baris.push(`• Diskon: -${formatRp(p.diskon)}`);
  if (p.ongkir) baris.push(`• Ongkir: ${formatRp(p.ongkir)}`);
  baris.push(`*Total kamu: ${formatRp(p.totalBulat)}*`);
  baris.push(infoBayarTeks(pengaturan));
  baris.push('Makasih ya! 🙏');
  return baris.filter(Boolean).join('\n');
}

export function pesanRingkasan(t, pengaturan) {
  const h = hitungTagihan(t);
  const lunas = t.lunas || {};
  const baris = [`🧾 *${t.judul || 'Patungan'}*${t.tanggal ? ' (' + t.tanggal + ')' : ''}`, `Total: ${formatRp(h.total)}`, ''];
  for (const p of h.perOrang) {
    const tanda = p.id === t.penalang ? '💳 (bayar dulu)' : lunas[p.id] ? '✅' : '⏳';
    baris.push(`${tanda} ${p.nama}: ${formatRp(p.totalBulat)}`);
  }
  baris.push(infoBayarTeks(pengaturan));
  baris.push('_Dihitung pakai Splitbill Cerdas_');
  return baris.filter((x) => x !== undefined).join('\n');
}

export function nomorWA(no) {
  let d = String(no || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return d;
}
