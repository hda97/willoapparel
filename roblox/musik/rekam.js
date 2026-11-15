// Rekam lagu latar tiap dusun dari js/suara.js (game web) jadi file loop mulus untuk Roblox.
// Pakai: node roblox/musik/rekam.js lalu ubah .raw ke .ogg:
//   ffmpeg -f s16le -ar 44100 -ac 1 -i wetan.raw -c:a libvorbis -q:a 5 wetan.ogg
// Yang diambil putaran besar kedua (3 putaran lagu), jadi gema dari putaran sebelumnya ikut dan sambungan loop tidak terdengar.
const { chromium } = require('playwright'); const fs = require('fs'); const http = require('http'); const path = require('path');
const srv = http.createServer((q, r) => { const f = q.url === '/' ? path.join(__dirname, 'rekam.html') : path.join(__dirname, '../../public/duniakotak/mabar/js', path.basename(q.url)); r.setHeader('Content-Type', f.endsWith('.js') ? 'text/javascript' : 'text/html'); r.end(fs.readFileSync(f)); }).listen(8765);
(async () => { const b = await chromium.launch(); const p = await b.newPage(); p.on('console', m => console.log('page', m.text()));
  await p.goto('http://localhost:8765/'); await p.waitForFunction('window.siap');
  for (const d of ['wetan','kulon','curug','tlaga','segara']) { const r = await p.evaluate(x => window.render(x), d);
    fs.writeFileSync(path.join(__dirname, d + '.raw'), Buffer.from(r.b64, 'base64')); console.log(d, r.C.toFixed(2), 'peak', r.pk.toFixed(3)); }
  await b.close(); srv.close(); })();
