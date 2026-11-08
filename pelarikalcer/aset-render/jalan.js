// node aset-render/jalan.js [filter] -> PNG di aset-render/hasil/
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const out = path.join(__dirname, 'hasil'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage(); pg.on('pageerror', (e) => console.log('PE', e.message)); pg.on('console', (m) => m.type() === 'error' && console.log('CE', m.text()));
  await pg.setContent('<!doctype html><body style="margin:0"><script>' + fs.readFileSync(path.join(__dirname, 'bundel.js'), 'utf8').replace(/<\/script/g, '<\\/script') + '</script></body>');
  const nama = await pg.evaluate(() => window.daftarSiap());
  const f = process.argv[2] ? new RegExp(process.argv[2]) : null;
  for (const n of nama) { if (f && !f.test(n)) continue; const d = await pg.evaluate((n) => window.ambil(n), n); fs.writeFileSync(path.join(out, n + '.png'), Buffer.from(d.split(',')[1], 'base64')); console.log(n); }
  await b.close();
})();
