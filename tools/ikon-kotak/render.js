const {chromium} = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader']}); const p = await b.newPage({deviceScaleFactor: 2});
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://127.0.0.1:8787/duniakotak/mabar/?tamu=1');
  const src = fs.readFileSync(__dirname + '/model.js', 'utf8'); const UK = +process.env.UK || 128;
  const out = await p.evaluate(async ({src, UK}) => {
    const T = await import('three'); const url = URL.createObjectURL(new Blob([src], {type: 'text/javascript'})); const {MODEL} = await import(url);
    const R = new T.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true}); R.setSize(UK, UK); R.setClearColor(0, 0); R.outputColorSpace = T.SRGBColorSpace;
    const hasil = {};
    for (const [k, daftar] of Object.entries(MODEL)) {
      const sc = new T.Scene(); sc.add(new T.HemisphereLight(0xffffff, 0x8090a0, 1.6)); const d = new T.DirectionalLight(0xffffff, 1.9); d.position.set(3, 6, 5); sc.add(d);
      const g = new T.Group();
      const kotak = (it, induk) => { const [x, y, z, w, h, dd, c] = it; const m = new T.Mesh(new T.BoxGeometry(w, h, dd), new T.MeshStandardMaterial({color: c, roughness: .75, flatShading: true})); m.position.set(x, y + h / 2, z); induk.add(m);
        m.add(new T.LineSegments(new T.EdgesGeometry(m.geometry), new T.LineBasicMaterial({color: 0x1a222c, transparent: true, opacity: .35}))); return m; };
      for (const it of daftar) {
        if (it[0] === 'rot') { const m = kotak(it[2], g); m.rotation.z = it[1]; }
        else if (it[0] === 'grup') { const gg = new T.Group(); it[2].forEach(k => kotak(k, gg)); const bb = new T.Box3().setFromObject(gg), cc = bb.getCenter(new T.Vector3()); gg.children.forEach(ch => ch.position.sub(cc)); gg.position.copy(cc); gg.rotation.z = it[1]; g.add(gg); }
        else kotak(it, g); }
      g.rotation.y = -Math.PI / 5; g.rotation.x = Math.PI / 9;
      const box = new T.Box3().setFromObject(g), s = new T.Vector3(), c0 = new T.Vector3(); box.getSize(s); box.getCenter(c0); g.position.sub(c0); sc.add(g);
      const r = Math.max(s.x, s.y) / 2 * 1.12; const cam = new T.OrthographicCamera(-r, r, r, -r, .1, 100); cam.position.set(0, 0, 20); cam.lookAt(0, 0, 0);
      R.render(sc, cam); hasil[k] = R.domElement.toDataURL('image/png');
    }
    return hasil; }, {src, UK});
  fs.mkdirSync(__dirname + '/png', {recursive: true});
  for (const [k, v] of Object.entries(out)) fs.writeFileSync(`${__dirname}/png/${k}.png`, Buffer.from(v.split(',')[1], 'base64'));
  // lembar contoh di atas tombol gelap
  const html = '<body style="margin:0;background:#2b3442;display:flex;flex-wrap:wrap;gap:14px;padding:16px;width:1000px">' + Object.entries(out).map(([k, v]) => `<div style="width:84px;text-align:center;color:#fff;font:600 12px sans-serif"><div style="width:70px;height:70px;margin:auto;border-radius:50%;background:#1e2733;display:grid;place-items:center"><img src="${v}" width="52" height="52"></div>${k}</div>`).join('') + '</body>';
  await p.setViewportSize({width: 1032, height: 400}); await p.setContent(html); await p.screenshot({path: __dirname + '/lembar3d.png', fullPage: true});
  await b.close(); console.log(Object.keys(out).length);
})();
