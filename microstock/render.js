// Menggambar ulang satu batch dari kode (scenes.html atau svg/*.svg) menjadi JPG 4000x3000.
// Pakai: node render.js batches/<nama>.json <folder-keluaran>
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright-core')); } catch (e) { ({ chromium } = require('playwright')); }

(async () => {
  const [batchFile, outDir] = process.argv.slice(2);
  if (!batchFile || !outDir) { console.error('Pakai: node render.js <batch.json> <folder>'); process.exit(2); }
  const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {});
  const page = await browser.newPage({ viewport: { width: 4000, height: 3000 } });
  const galat = [];
  page.on('pageerror', (e) => galat.push(e.message));
  await page.goto('file://' + path.join(__dirname, 'scenes.html'));
  // Gambar gaya SVG (entri punya "svg"): dirender langsung dari file SVG di folder svg/.
  const svgPage = await browser.newPage({ viewport: { width: 4000, height: 3000 } });
  for (const g of batch.gambar.filter((x) => x.svg)) {
    const nama = path.basename(g.svg);
    const isi = fs.readFileSync(path.join(__dirname, 'svg', nama), 'utf8');
    await svgPage.setContent(`<body style="margin:0;overflow:hidden"><style>svg{display:block;width:4000px;height:3000px}</style>${isi}</body>`);
    const buf = await svgPage.screenshot({ type: 'jpeg', quality: 95 });
    fs.writeFileSync(path.join(outDir, g.file), buf);
    console.log(`${g.file}  ${(buf.length / 1e6).toFixed(1)} MB`);
  }
  await svgPage.close();
  for (const g of batch.gambar.filter((x) => !x.svg)) {
    const data = await page.evaluate((n) => {
      window.render(n);
      // Bintik halus (+-2) supaya gradasi tidak bergaris saat dibesarkan.
      const c = document.getElementById('c'), k = c.getContext('2d');
      const im = k.getImageData(0, 0, c.width, c.height), d = im.data;
      let s = 12345 + n;
      for (let i = 0; i < d.length; i += 4) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        const v = (s >> 16) % 5 - 2;
        d[i] += v; d[i + 1] += v; d[i + 2] += v;
      }
      k.putImageData(im, 0, 0);
      return c.toDataURL('image/jpeg', 0.96);
    }, g.adegan);
    const buf = Buffer.from(data.split(',')[1], 'base64');
    fs.writeFileSync(path.join(outDir, g.file), buf);
    console.log(`${g.file}  ${(buf.length / 1e6).toFixed(1)} MB`);
  }
  await browser.close();
  if (galat.length) { console.error('Galat saat menggambar:', galat); process.exit(1); }
})();
