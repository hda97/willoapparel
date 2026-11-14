const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const dusun = process.argv[2] || '';
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--js-flags=--max-old-space-size=8192']});
  const p = await b.newPage({viewport:{width:1280,height:720}});
  p.on('pageerror', e => console.log('ERR '+String(e).slice(0,400)));
  await p.route('**/mabar/game.js*', async r => {
    let s = fs.readFileSync('/home/user/willoapparel/public/duniakotak/mabar/game.js','utf8');
    s = s.replace("const cam = new THREE.PerspectiveCamera(38, 1, 1, hemat ? 450 : 560);", "const cam = new THREE.PerspectiveCamera(38, 1, 1, hemat ? 450 : 560); window.__sc = sc; window.__THREE = THREE; window.__cam = cam;");
    if (!s.includes("function bakeGroup(root) {")) throw new Error('bake'); s = s.replace("function bakeGroup(root) {", "function bakeGroup(root) { return;");
    s += '\n;window.__g={bangunKavling, lotRuntime, tokoh, get I(){return I}, get fasum(){return typeof fasumBangun !== "undefined" ? fasumBangun : []}};';
    r.fulfill({body:s, contentType:'application/javascript'});
  });
  await p.addInitScript(() => { Object.defineProperty(navigator, 'hardwareConcurrency', {get: () => 8}); Object.defineProperty(navigator, 'deviceMemory', {get: () => 8}); });
  await p.route('**/mabar/js/kotakBulat.js*', r => r.fulfill({contentType:'application/javascript', body: "import {BoxGeometry} from 'three'; export const HP = false; export class RoundedBoxGeometry extends BoxGeometry { constructor(w = 1, h = 1, d = 1) { super(w, h, d); } }"}));
  await p.route('**/aset/mobil.js*', async r => { let s = fs.readFileSync('/home/user/willoapparel/public/duniakotak/mabar/js/aset/mobil.js','utf8'); if (!s.includes('function gabung(grup) {')) throw new Error('gabung'); r.fulfill({contentType:'application/javascript', body: s.replace('function gabung(grup) {', 'function gabung(grup) { return;')}); });
  await p.route('**/duniakotak/api/**', async r => {
    const u = new URL(r.request().url());
    if (r.request().method()==='GET' && u.pathname.endsWith('/api/warga')) return r.fulfill({body: fs.readFileSync('warga.json'), contentType:'application/json'});
    try { const resp = await r.fetch({url: 'https://willoapparel.com'+u.pathname+u.search}); return r.fulfill({response: resp}); } catch(e) { return r.fulfill({status:500, body:'{}', contentType:'application/json'}); }
  });
  await p.goto('http://localhost:8765/duniakotak/mabar/?tamu=1' + (dusun?('&dusun='+dusun):''), {waitUntil:'load'});
  await p.waitForTimeout(20000);
  const info = await p.evaluate(async () => {
    const sc = window.__sc, g = window.__g, T = window.__THREE;
    let built=0; for (const ns of Object.keys(g.I.lots)) { if(!g.lotRuntime.get(+ns)) { try{ g.bangunKavling(+ns); built++; }catch(e){} } }
    await new Promise(r=>setTimeout(r,4000));
    sc.updateMatrixWorld(true);
    const lotOf = new Map(); for (const [n, rt] of g.lotRuntime) { for (const k of ['g','extra','kc']) if (rt[k]) lotOf.set(rt[k], n); }
    const skip = new Set(); for (const k in g.tokoh) if (g.tokoh[k] && g.tokoh[k].isObject3D) skip.add(g.tokoh[k]);
    const N = 16; let cap = 1<<20, out = new Float32Array(cap*N), n = 0;
    const push = (c, ax, ay, az, col, tipe, grp, lot) => { if (n >= cap) { cap *= 2; const o2 = new Float32Array(cap*N); o2.set(out); out = o2; }
      const o = n*N; out[o]=c.x; out[o+1]=c.y; out[o+2]=c.z; out[o+3]=ax.x; out[o+4]=ax.y; out[o+5]=ax.z; out[o+6]=ay.x; out[o+7]=ay.y; out[o+8]=ay.z; out[o+9]=az.x; out[o+10]=az.y; out[o+11]=az.z;
      out[o+12]=col; out[o+13]=tipe; out[o+14]=grp; out[o+15]=lot; n++; };
    const texAvg = new Map();
    const avgMap = map => { if (texAvg.has(map)) return texAvg.get(map); let c = null; try { const im = map.image; if (im && im.width) { const cv = document.createElement('canvas'); cv.width = cv.height = 16; const x = cv.getContext('2d'); x.drawImage(im, 0, 0, 16, 16); const d = x.getImageData(0,0,16,16).data; let r=0,gg=0,bb=0,a=0; for (let i=0;i<d.length;i+=4){ const w=d[i+3]/255; r+=d[i]*w; gg+=d[i+1]*w; bb+=d[i+2]*w; a+=w; } if (a>1) c = new T.Color().setRGB(r/a/255, gg/a/255, bb/a/255, T.SRGBColorSpace); } } catch(e){} texAvg.set(map, c); return c; };
    const hexOf = c => { const q = c.clone().convertLinearToSRGB(); return (Math.round(Math.min(1,Math.max(0,q.r))*255)<<16) | (Math.round(Math.min(1,Math.max(0,q.g))*255)<<8) | Math.round(Math.min(1,Math.max(0,q.b))*255); };
    const names = []; const m4 = new T.Matrix4(), im4 = new T.Matrix4(), v = new T.Vector3();
    const tops = sc.children; const stat = {};
    const faceC = (pos, s, k) => { const o = new T.Vector3(); for (let i=0;i<4;i++) o.add(v.fromBufferAttribute(pos, s+k*4+i)); return o.multiplyScalar(.25); };
    const walk = (o, grp, lot, vis) => {
      if (!o.visible || skip.has(o)) return; if (lotOf.has(o)) lot = lotOf.get(o);
      if (o.isMesh) {
        const gm = o.geometry, pos = gm.attributes.position, mats = Array.isArray(o.material) ? o.material : [o.material]; const mt = mats[0];
        if (!pos || mt.visible === false || mt.side === T.BackSide || (mt.transparent && mt.opacity < .15)) { for (const ch of o.children) walk(ch, grp, lot); return; }
        const base = mt.color ? mt.color.clone() : new T.Color(1,1,1); let tipe = 0;
        if (mt.map) { const a = avgMap(mt.map); if (a) base.multiply(a); tipe = 4; }
        if (mt.transparent && mt.opacity < .95) tipe += 8;
        const vc = gm.attributes.color, idx = gm.index;
        const chunks = []; let kotak = false;
        const vcol = (s, e) => { if (!vc) return null; const col = new T.Color(0,0,0); const st = Math.max(1, Math.floor((e-s)/60)); let k=0; for (let i=s;i<e;i+=st){ col.r+=vc.getX(i); col.g+=vc.getY(i); col.b+=vc.getZ(i); k++; } return col.multiplyScalar(1/k); };
        const coba = s => { if (s + 24 > pos.count) return null; const px = faceC(pos,s,0), nx = faceC(pos,s,1), py = faceC(pos,s,2), ny = faceC(pos,s,3), pz = faceC(pos,s,4), nz = faceC(pos,s,5);
          const c = px.clone().add(nx).multiplyScalar(.5), c2 = py.clone().add(ny).multiplyScalar(.5), c3 = pz.clone().add(nz).multiplyScalar(.5);
          const ax = px.sub(nx), ay = py.sub(ny), az = pz.sub(nz); const L = ax.length() + ay.length() + az.length(); if (L < 1e-9) return null; const tol = L * 1e-3;
          if (c.distanceTo(c2) > tol || c.distanceTo(c3) > tol) return null;
          if (Math.abs(ax.dot(ay)) > tol*L || Math.abs(ax.dot(az)) > tol*L || Math.abs(ay.dot(az)) > tol*L) return null;
          const r2 = (ax.lengthSq() + ay.lengthSq() + az.lengthSq()) / 4; for (let i = 0; i < 24; i += 5) { if (Math.abs(v.fromBufferAttribute(pos, s+i).distanceToSquared(c) - r2) > tol*L) return null; }
          return [c, ax, ay, az, vcol(s, s+24), 0]; };
        const aabb = (s, e) => { const bb = new T.Box3(); for (let i = s; i < e; i++) bb.expandByPoint(v.fromBufferAttribute(pos, i)); const c = bb.getCenter(new T.Vector3()), z = bb.getSize(new T.Vector3());
          let t2 = gm.type === 'ConeGeometry' ? 1 : gm.type === 'CylinderGeometry' ? 2 : gm.type === 'TorusGeometry' ? 7 : gm.type === 'SphereGeometry' || gm.type === 'IcosahedronGeometry' ? 8 : (gm.type === 'PlaneGeometry' || gm.type === 'CircleGeometry') ? 3 : 5;
          if (gm.type === 'ExtrudeGeometry') { try { const sh = gm.parameters.shapes, pts = (Array.isArray(sh) ? sh[0] : sh).getPoints(); const u = []; for (const q of pts) if (!u.some(w => Math.abs(w.x-q.x)+Math.abs(w.y-q.y) < 1e-6)) u.push(q);
            if (u.length === 3) { const ys = u.map(q => q.y), y0 = Math.min(...ys), y1 = Math.max(...ys); const bawah = u.filter(q => Math.abs(q.y-y0) < 1e-6), atas = u.filter(q => Math.abs(q.y-y1) < 1e-6);
              if (bawah.length === 2 && atas.length === 1 && Math.abs(atas[0].x - (bawah[0].x+bawah[1].x)/2) < 1e-4) t2 = 6; } } catch (e) {} }
          return [c, new T.Vector3(z.x,0,0), new T.Vector3(0,z.y,0), new T.Vector3(0,0,z.z), vcol(s, e), t2]; };
        // kotak tak berindeks (hasil toNonIndexed): 36 titik per kotak, tiap sisi = (a,b,d),(b,c,d)
        const faceC6 = (s, k) => { const o = new T.Vector3(), q = s + k*6; for (const i of [0,1,2,4]) o.add(v.fromBufferAttribute(pos, q+i)); return o.multiplyScalar(.25); };
        const coba36 = s => { if (s + 36 > pos.count) return null; const px = faceC6(s,0), nx = faceC6(s,1), py = faceC6(s,2), ny = faceC6(s,3), pz = faceC6(s,4), nz = faceC6(s,5);
          const c = px.clone().add(nx).multiplyScalar(.5), c2 = py.clone().add(ny).multiplyScalar(.5), c3 = pz.clone().add(nz).multiplyScalar(.5);
          const ax = px.sub(nx), ay = py.sub(ny), az = pz.sub(nz); const L = ax.length() + ay.length() + az.length(); if (L < 1e-9) return null; const tol = L * 1e-3;
          if (c.distanceTo(c2) > tol || c.distanceTo(c3) > tol) return null;
          if (Math.abs(ax.dot(ay)) > tol*L || Math.abs(ax.dot(az)) > tol*L || Math.abs(ay.dot(az)) > tol*L) return null;
          const r2 = (ax.lengthSq() + ay.lengthSq() + az.lengthSq()) / 4; for (let i = 0; i < 36; i += 5) { if (Math.abs(v.fromBufferAttribute(pos, s+i).distanceToSquared(c) - r2) > tol*L) return null; }
          return [c, ax, ay, az, vcol(s, s+36), 0]; };
        // sisa (bukan kotak): pecah per gugus segitiga yang saling menyambung, tiap gugus jadi satu kotak pembatas
        const gugus = (s, e) => { const par = new Map(); const cari = k => { let r = k; while (par.get(r) !== r) r = par.get(r); while (par.get(k) !== r) { const n = par.get(k); par.set(k, r); k = n; } return r; };
          const kunci = i => { v.fromBufferAttribute(pos, i); return Math.round(v.x*200) + ',' + Math.round(v.y*200) + ',' + Math.round(v.z*200); };
          const tris = []; if (idx) { for (let i = 0; i + 2 < idx.count; i += 3) { const p = idx.getX(i), q = idx.getX(i+1), r = idx.getX(i+2); if (p >= s && p < e && q >= s && q < e && r >= s && r < e) tris.push([p,q,r]); } }
          else for (let i = s; i + 2 < e; i += 3) tris.push([i, i+1, i+2]);
          if (tris.length > 60000 || !tris.length) return [aabb(s, e)];
          for (const t of tris) { const ks = t.map(kunci); for (const k of ks) if (!par.has(k)) par.set(k, k); const r0 = cari(ks[0]); par.set(cari(ks[1]), r0); par.set(cari(ks[2]), r0); }
          const kotakG = new Map(); for (const t of tris) { const r = cari(kunci(t[0])); let g = kotakG.get(r); if (!g) { g = {bb: new T.Box3(), col: new T.Color(0,0,0), n: 0}; kotakG.set(r, g); }
            for (const i of t) { g.bb.expandByPoint(v.fromBufferAttribute(pos, i)); if (vc) { g.col.r += vc.getX(i); g.col.g += vc.getY(i); g.col.b += vc.getZ(i); } g.n++; } }
          const out = []; for (const g of kotakG.values()) { const c = g.bb.getCenter(new T.Vector3()), z = g.bb.getSize(new T.Vector3()); out.push([c, new T.Vector3(z.x,0,0), new T.Vector3(0,z.y,0), new T.Vector3(0,0,z.z), vc ? g.col.multiplyScalar(1/g.n) : null, 5]); } return out; };
        if (gm.type === 'BoxGeometry' || gm.type === 'BufferGeometry') { let s = 0, sisa = -1; const langkah = idx ? 24 : 36, uji = idx ? coba : coba36, maju = idx ? 1 : 3;
          while (s < pos.count) { const k = uji(s); if (k) { if (sisa >= 0) { chunks.push(...gugus(sisa, s)); sisa = -1; } chunks.push(k); kotak = true; s += langkah; } else { if (sisa < 0) sisa = s; s += maju; } }
          if (sisa >= 0) chunks.push(...gugus(sisa, pos.count)); }
        else chunks.push(aabb(0, pos.count));
        const key = gm.type + (kotak ? '|k' : '|x'); stat[key] = (stat[key]||0);
        const emit = (M, icol) => { for (const [c, ax, ay, az, col, t2] of chunks) { const cc = base.clone(); if (icol) cc.multiply(icol); if (col) cc.multiply(col);
            const C = c.clone().applyMatrix4(M); const e = M.elements; const lin = w => new T.Vector3(e[0]*w.x+e[4]*w.y+e[8]*w.z, e[1]*w.x+e[5]*w.y+e[9]*w.z, e[2]*w.x+e[6]*w.y+e[10]*w.z);
            const A = lin(ax), B = lin(ay), D = lin(az); if (A.lengthSq() + B.lengthSq() + D.lengthSq() < 1e-8) continue;
            push(C, A, B, D, hexOf(cc), tipe + t2 * 16, grp, lot); stat[key]++; } };
        if (o.isInstancedMesh) { const ic = new T.Color(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, im4); m4.multiplyMatrices(o.matrixWorld, im4); let c2 = null; if (o.instanceColor) { o.getColorAt(i, ic); c2 = ic; } emit(m4, c2); } }
        else emit(o.matrixWorld, null);
      }
      for (const ch of o.children) walk(ch, grp, lot);
    };
    tops.forEach((o, i) => { names.push((o.name||'')+'/'+o.type+'/'+o.children.length); walk(o, i, -1); });
    window.__out = out.subarray(0, n*N);
    const I = g.I; const lots = {}; for (const [k, L] of Object.entries(I.lots)) lots[k] = {c:[L.c.x, L.c.y||0, L.c.z], dir:L.dir, g: L.gate ? [L.gate.x, L.gate.y||0, L.gate.z] : null, s: L.stone ? [L.stone.x, L.stone.y||0, L.stone.z] : null};
    const me = g.tokoh.saya; const bb = new T.Box3().setFromObject(me);
    const bangunan = []; try { for (const f of g.fasum) if (f && f.nama && f.position) bangunan.push({nama: f.nama, p: [f.position.x, f.position.y || 0, f.position.z]}); } catch (e) {}
    const meta = {n, names, stat, lots, bangunan, me:[bb.min.toArray(), bb.max.toArray()], pos: me.position.toArray(), TW:I.TW, TD:I.TD, ox:I.ox, oz:I.oz, fog: sc.fog ? [sc.fog.near, sc.fog.far] : null};
    for (const k of ['fas','fasum','entry','cross','batas','vroads','hroads','xs','zs','river','sungai']) { try { meta[k] = JSON.parse(JSON.stringify(I[k], (kk, vv) => (vv && vv.isObject3D) ? undefined : vv)); } catch(e) { meta[k] = 'x'; } }
    return meta;
  });
  const nama = dusun || 'wetan';
  fs.writeFileSync(nama + '.meta.json', JSON.stringify(info));
  const total = info.n * 16; const parts = []; const STEP = 1500000;
  for (let s = 0; s < total; s += STEP) { const b64 = await p.evaluate(([s, e]) => { const a = window.__out.subarray(s, e); const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); let r = ''; for (let i = 0; i < u.length; i += 32768) r += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(r); }, [s, Math.min(total, s + STEP)]); parts.push(Buffer.from(b64, 'base64')); }
  fs.writeFileSync(nama + '.f32', Buffer.concat(parts));
  console.log(nama, info.n, JSON.stringify(info.stat), JSON.stringify(info.me));
  await b.close();
})();
