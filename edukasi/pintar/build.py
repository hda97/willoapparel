#!/usr/bin/env python3
"""Rakit DUNIA KOTAK PINTAR: 3 game kuis kelas, masing-masing SATU file HTML mandiri.

  python3 edukasi/pintar/build.py

Sumber : edukasi/pintar/src/inti.js (bersama) + src/<game>.js + bank.py (bank soal bawaan)
Hasil  : public/edukasi/pintar/<game>/index.html + beranda public/edukasi/pintar/index.html
Three.js & aset Dunia Kotak ikut dibundel (esbuild), jadi game jalan TANPA internet.
Persiapan sekali: cd edukasi/paud && npm install   (esbuild + three dipakai bersama)
"""
import hashlib, json, os, pathlib, subprocess, sys

AKAR = pathlib.Path(__file__).resolve().parent
NM = AKAR.parent / 'paud' / 'node_modules'
KELUAR = AKAR.parent.parent / 'public' / 'edukasi' / 'pintar'
sys.path.insert(0, str(AKAR))
import bank  # noqa: E402

GAME = {
    'balap-kucing': dict(judul='Balap Kucing', ikon='🐱', aksen='#e8590c', latar='#fff0e0',
                         desk='Dua pemain adu cepat menjawab soal. Jawaban benar membuat kucingmu berlari ke garis finis.'),
    'pawai-juara': dict(judul='Pawai Juara', ikon='🚩', aksen='#1c7ed6', latar='#e7f5ff',
                        desk='Pimpin barisan pawai ke petak jawaban yang benar. Setiap jawaban benar menambah satu warga.'),
    'daki-puncak': dict(judul='Daki Puncak Pintar', ikon='⛰️', aksen='#2f9e44', latar='#ebfbee',
                        desk='Ular tangga gunung 64 petak untuk 2 sampai 4 siswa. Lempar dadu, jawab Tantangan Ilmu, capai puncak.'),
}

CSS = r"""
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%;overflow:hidden;background:var(--latar);font-family:'Baloo 2','Comic Sans MS',system-ui,sans-serif;color:#2b2b2b;touch-action:manipulation;user-select:none;-webkit-user-select:none}
button{font-family:inherit;color:inherit}
#layar{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none}
[hidden]{display:none!important}
body:not([data-layar=main]) #ui{display:none}
/* HUD */
#hud{position:fixed;top:max(10px,env(safe-area-inset-top));right:max(10px,env(safe-area-inset-right));display:flex;gap:8px;z-index:6}
#hud button{width:46px;height:46px;border-radius:50%;border:0;background:#fff;font-size:20px;letter-spacing:-2px;box-shadow:0 4px 0 rgba(0,0,0,.15);cursor:pointer;display:grid;place-items:center;font-weight:800}
#hud button:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.15)}
/* layar penuh */
.layar{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:max(14px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));z-index:5}
.redup{background:rgba(20,30,45,.5)}
.kotak{background:#fff;border-radius:26px;padding:22px;box-shadow:0 10px 0 rgba(0,0,0,.15);max-width:520px;width:100%;max-height:100%;overflow:auto;text-align:center}
.kotak h1,.kotak h2{margin:0 0 6px;color:var(--aksen);line-height:1.05}.kotak h1{font-size:clamp(30px,7vw,44px)}.kotak h2{font-size:clamp(24px,5vw,32px)}
.besar{border:0;border-radius:22px;background:var(--aksen);color:#fff!important;font-size:clamp(22px,5vw,28px);font-weight:800;padding:12px 34px;box-shadow:0 6px 0 rgba(0,0,0,.22);cursor:pointer}
.besar:active,.kecil:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.2)}
.besar.abu{background:#495057}
.kecil{border:0;border-radius:14px;background:#e9ecef;font-size:16px;font-weight:800;padding:9px 14px;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.12)}
.kecil.utama{background:var(--aksen);color:#fff}
.dukung{margin-top:14px;padding:4px 14px;border-radius:99px;background:rgba(255,255,255,.94);font-size:14px;font-weight:700;color:#666!important;text-decoration:none}.dukung b{color:#e8590c}
/* judul */
#lJudul{flex-direction:column;justify-content:space-between;background:linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,255,255,0) 30%);padding-top:calc(30px + env(safe-area-inset-top));padding-bottom:calc(20px + env(safe-area-inset-bottom))}
.jAtas{text-align:center;animation:jatuh .8s cubic-bezier(.3,1.7,.5,1) both}
.jSeri{display:inline-block;background:#fff;border-radius:99px;padding:3px 16px;font-weight:800;color:#555;font-size:clamp(14px,3.6vw,18px);box-shadow:0 4px 0 rgba(0,0,0,.1)}
#jJudul{margin:6px 0 8px;font-size:clamp(42px,12vw,86px);line-height:1;font-weight:800}
#jJudul .kata{white-space:nowrap;font-weight:inherit}#jJudul span{display:inline-block;animation:loncat 1.8s ease-in-out infinite;text-shadow:0 3px 0 #fff,0 -3px 0 #fff,3px 0 0 #fff,-3px 0 0 #fff,0 8px 0 rgba(0,0,0,.18)}
#jAjak{display:inline-block;margin:0;background:#fff;border-radius:99px;padding:6px 18px;font-size:clamp(16px,4.2vw,21px);font-weight:700;box-shadow:0 5px 0 rgba(0,0,0,.12);max-width:92vw}
.jBawah{display:flex;flex-direction:column;align-items:center}
#bMulai{font-size:clamp(30px,8vw,40px);padding:14px 60px;border:6px solid #fff;animation:denyut 1.3s ease-in-out infinite}
@keyframes jatuh{from{transform:translateY(-60px) scale(.7);opacity:0}to{transform:none;opacity:1}}
@keyframes loncat{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-10px) rotate(-4deg)}}
@keyframes denyut{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
/* pengaturan */
#lAtur{background:var(--latar)}
#lAtur .kotak,#lPemain .kotak{max-width:980px;text-align:left;display:flex;flex-direction:column;gap:12px}
.aGrid{display:grid;grid-template-columns:1fr 1fr;gap:16px 22px}
@media (max-width:700px){.aGrid{grid-template-columns:1fr}}
#aTopik{display:flex;flex-direction:column;gap:7px}
.pilT{display:flex;justify-content:space-between;align-items:center;gap:8px;text-align:left;border:3px solid #e9ecef;background:#fff;border-radius:14px;padding:8px 12px;font-size:18px;font-weight:800;cursor:pointer}
.pilT small{font-size:14px;color:#868e96;white-space:nowrap}.pilT.on{border-color:var(--aksen);background:var(--latar)}.pilT.on small{color:var(--aksen)}
.lbl{font-size:13px;font-weight:800;color:#868e96;letter-spacing:.8px;text-transform:uppercase;margin-top:6px}.lbl small{text-transform:none;letter-spacing:0;font-weight:600}
.seg{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.seg button{border:3px solid #e9ecef;background:#fff;border-radius:12px;padding:5px 12px;font-size:17px;font-weight:800;cursor:pointer}
.seg button.on{background:var(--aksen);border-color:var(--aksen);color:#fff}
.aBaris{display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap}
/* jeda & bantuan */
#lJeda .kotak,#lBantu .kotak{max-width:420px}
#bantuIsi{text-align:left;font-family:system-ui,sans-serif;font-size:16px;line-height:1.5}#bantuIsi li{margin:4px 0}
/* kartu soal */
.kSoal{position:relative;background:#fff;border-radius:22px;padding:12px 14px 14px;box-shadow:0 7px 0 rgba(0,0,0,.14);display:flex;flex-direction:column;gap:10px;pointer-events:auto}
.kTeks{font-size:var(--fsSoal,clamp(20px,4.6vw,30px));font-weight:800;line-height:1.15;text-align:center;padding:2px 4px}
.kTeks.panjang{font-size:calc(var(--fsSoal,clamp(20px,4.6vw,30px)) * .78)}
.kOpsi{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.op{display:flex;align-items:center;gap:8px;border:0;background:#f1f3f5;border-radius:16px;padding:8px 10px;font-size:var(--fsOpsi,clamp(17px,3.8vw,23px));font-weight:800;text-align:left;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.12);min-height:52px;line-height:1.1}
.op i{font-style:normal;color:#fff;border-radius:10px;min-width:1.6em;height:1.6em;display:grid;place-items:center;flex:none}
.op:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.12)}
.op.benar{background:#b2f2bb;animation:goyang .5s}.op.salah{background:#ffc9c9;animation:geleng .45s}.op.pudar{opacity:.45}
.op:disabled{cursor:default}
@keyframes geleng{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
@keyframes goyang{30%{transform:scale(1.06)}}
.kWaktu{height:8px;border-radius:99px;background:#e9ecef;overflow:hidden}.kWaktu i{display:block;height:100%;background:#51cf66;transition:width .1s linear}.kWaktu.kritis i{background:#ff6b6b}
.kUmpan{position:absolute;left:0;right:0;top:0;min-height:100%;z-index:3;box-shadow:0 7px 0 rgba(0,0,0,.14);border-radius:22px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:12px;animation:muncul .3s ease-out;text-align:center}
.uIsi{display:flex;flex-direction:column;align-items:center;gap:2px;max-height:100%;overflow:auto}
.uIsi.adaMaskot{flex-direction:row;gap:12px;text-align:left}
.uMaskot{width:clamp(54px,12vw,84px);height:auto;flex:none;animation:goyang 1s}
.uJudul{font-size:clamp(24px,5vw,36px);font-weight:800;line-height:1.05}.uJudul.benar{color:#2f9e44}.uJudul.salah{color:#e03131}
.uJelas{font-family:system-ui,sans-serif;font-size:clamp(14px,3.2vw,18px);line-height:1.35;font-weight:500}.uJelas b{color:#2f9e44}
.uTambah{font-weight:800;font-size:clamp(16px,3.6vw,22px);color:#495057}
.uLanjut{border:0;border-radius:16px;background:#2f9e44;color:#fff!important;font-size:clamp(18px,4vw,24px);font-weight:800;padding:7px 26px;box-shadow:0 5px 0 rgba(0,0,0,.2);cursor:pointer}
@keyframes muncul{from{transform:scale(.88);opacity:.2}to{transform:none;opacity:1}}
/* hasil */
#lHasil{flex-direction:column;justify-content:space-between;padding-top:calc(16px + env(safe-area-inset-top));padding-bottom:calc(16px + env(safe-area-inset-bottom))}
#lHasil .hAtas{background:#fff;border-radius:22px;padding:8px 22px;box-shadow:0 6px 0 rgba(0,0,0,.14);text-align:center;max-width:94vw}
#hJudul{margin:0;font-size:clamp(28px,7vw,48px);color:var(--aksen);line-height:1.05}
#hIsi{font-size:clamp(16px,3.8vw,20px);font-weight:700}
.hBawah{display:flex;flex-direction:column;align-items:center;gap:10px}.hTombol{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.hTabel{border-collapse:collapse;margin:4px auto 0;font-size:clamp(15px,3.6vw,19px)}.hTabel td{padding:2px 10px;text-align:left}.hTabel td:last-child{text-align:right}
/* pemain */
.pGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.pKartu{border:3px solid #e9ecef;border-radius:18px;padding:12px;display:flex;flex-direction:column;gap:8px}
.pKartu input[type=text]{font-family:inherit;font-size:19px;font-weight:700;border:2px solid #dee2e6;border-radius:12px;padding:6px 10px;width:100%}
.pal{display:flex;flex-wrap:wrap;gap:8px}.pal button{width:38px;height:38px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #dee2e6;cursor:pointer;padding:0}
.pal button.on{box-shadow:0 0 0 4px var(--aksen)}
.tokohPil{display:flex;flex-wrap:wrap;gap:6px}.tokohPil button{border:3px solid #e9ecef;background:#fff;border-radius:12px;padding:4px 10px;font-size:15px;font-weight:800;cursor:pointer}.tokohPil button.on{border-color:var(--aksen);background:var(--latar)}
/* Mode guru */
#guruGerbang .kotak{max-width:340px}#gJawab{font-size:28px;width:130px;text-align:center;border:2px solid #ccc;border-radius:14px;padding:6px;margin:6px 0 14px;font-family:inherit}
#panelGuru{align-items:stretch;user-select:text;-webkit-user-select:text;z-index:9}
#panelGuru .kotak{max-width:1100px;text-align:left;display:flex;flex-direction:column;gap:6px;padding:16px}
.gGulir{overflow:auto;flex:1 1 auto;min-height:160px;border:1px solid #eee;border-radius:12px}
#guruTabel{border-collapse:collapse;width:100%;font-size:15px;font-family:system-ui,sans-serif}
#guruTabel th{position:sticky;top:0;background:var(--latar);text-align:left;padding:6px;z-index:1}
#guruTabel td{padding:2px 3px;border-top:1px solid #f0f0f0}
#guruTabel input{width:100%;font-family:inherit;font-size:15px;border:1px solid #ddd;border-radius:7px;padding:4px 6px;min-width:60px}
#guruTabel .c-soal input{min-width:220px}#guruTabel .c-jelas input{min-width:180px}#guruTabel .c-topik input{min-width:130px}#guruTabel .c-kunci input,#guruTabel .c-tingkat input{min-width:56px}
.gHapus{border:0;background:#ffe3e3;border-radius:8px;cursor:pointer;padding:4px 8px}
#guruExcel{width:100%;height:60px;font-family:monospace;font-size:13px;border:1px solid #ddd;border-radius:10px;padding:6px}
.gBaris{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.gInfo{font-size:13.5px;color:#666;font-family:system-ui,sans-serif}
#guruSaring{font-family:inherit;font-size:16px;border:1px solid #ddd;border-radius:10px;padding:5px 8px}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
"""

HTML = r"""<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<title>{judul} · Dunia Kotak Pintar</title>
<meta name="description" content="{desk} Game kuis kelas bergaya Dunia Kotak, soal bisa diubah guru, jalan tanpa internet.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap" rel="stylesheet">
<style>:root{{--aksen:{aksen};--latar:{latar}}}{css}{css_game}</style>
<!-- BANK SOAL: guru boleh mengubah bagian ini langsung, atau lewat tombol "Guru" di layar pengaturan. -->
<script type="application/json" id="data-soal">
{data}
</script>
</head>
<body data-layar="lJudul">
<canvas id="layar"></canvas>
<div id="ui"></div>
<div id="hud" hidden>
  <button id="bSuara" title="Suara">🎵</button><button id="bJeda" title="Jeda">❚❚</button><button id="bBantu" title="Bantuan">?</button><button id="bKembali" title="Kembali ke pengaturan">⟵</button>
</div>
<div class="layar" id="lJudul">
  <div class="jAtas"><span class="jSeri">{ikon} Dunia Kotak Pintar</span><h1 id="jJudul">{judul}</h1><p id="jAjak"></p></div>
  <div class="jBawah"><button class="besar" id="bMulai">▶ Mulai</button><a class="dukung" href="https://www.willoapparel.com" target="_blank" rel="noopener">Supported by <b>www.willoapparel.com</b></a></div>
</div>
<div class="layar" id="lAtur" hidden><div class="kotak">
  <h2>Pengaturan Soal</h2>
  <div class="aGrid"><div><div class="lbl">Topik / bank soal</div><div id="aTopik"></div></div><div id="aKanan"></div></div>
  <div class="aBaris"><button class="kecil" id="aGuru">✎ Mode Guru: ubah soal</button><button class="besar" id="aLanjut">Lanjut ▶</button></div>
</div></div>
<div class="layar" id="lPemain" hidden><div class="kotak"><div id="pIsi"></div></div></div>
<div class="layar" id="lHasil" hidden>
  <div class="hAtas"><h1 id="hJudul"></h1><div id="hIsi"></div></div>
  <div class="hBawah"><div class="hTombol"><button class="besar" id="hUlang">↻ Main lagi</button><button class="besar abu" id="hAtur">⚙ Pengaturan</button></div>
  <a class="dukung" href="https://www.willoapparel.com" target="_blank" rel="noopener">Supported by <b>www.willoapparel.com</b></a></div>
</div>
<div class="layar redup" id="lJeda" hidden><div class="kotak"><h2>⏸ Jeda</h2><p style="font-size:18px;margin:0 0 14px">Permainan berhenti sebentar.</p>
  <div class="hTombol"><button class="besar" id="jLanjut">▶ Lanjut</button><button class="besar abu" id="jMenu">⚙ Pengaturan</button></div></div></div>
<div class="layar redup" id="lBantu" hidden><div class="kotak"><h2>Cara bermain</h2><div id="bantuIsi"></div><button class="besar" id="bantuTutup">Mengerti</button></div></div>
<div class="layar redup" id="guruGerbang" hidden><div class="kotak">
  <h2>Mode Guru</h2><div id="gTanya" style="font-size:18px"></div>
  <input id="gJawab" inputmode="numeric" autocomplete="off"><br>
  <button class="kecil utama" id="gMasuk">Masuk</button> <button class="kecil" id="gBatal">Batal</button>
</div></div>
<div class="layar redup" id="panelGuru" hidden><div class="kotak">
  <h2 style="margin:0">Mode Guru: bank soal</h2>
  <div class="gInfo">Bank soal ini dipakai bersama oleh Balap Kucing, Pawai Juara, dan Daki Puncak Pintar di perangkat ini.</div>
  <div class="gBaris"><select id="guruSaring"></select><button class="kecil" id="guruTambah">+ Tambah soal</button><button class="kecil" id="guruTemplate">⬇ Template Excel (CSV)</button></div>
  <div class="gGulir"><table id="guruTabel"></table></div>
  <div class="gInfo" id="guruInfo"></div>
  <textarea id="guruExcel" placeholder="Blok baris soal di Excel / Google Sheets, salin (Ctrl+C), lalu tempel di sini (Ctrl+V)…"></textarea>
  <div class="gBaris">
    <button class="kecil" id="guruTempel">Masukkan tempelan</button>
    <label class="gInfo" style="display:flex;gap:4px;align-items:center"><input type="checkbox" id="guruGanti"> ganti semua soal lama</label>
    <label class="kecil">📄 Buka file CSV<input type="file" id="guruFile" accept=".csv,.txt,.tsv" hidden></label>
    <span class="gInfo" id="guruPesan"></span>
  </div>
  <div class="gBaris" style="justify-content:space-between">
    <div class="gBaris"><button class="kecil utama" id="guruSimpan">✔ Simpan & pakai</button><button class="kecil" id="guruUnduh">⬇ Unduh HTML berisi soal ini</button></div>
    <div class="gBaris"><button class="kecil" id="guruBawaan">Kembalikan soal bawaan</button><button class="kecil" id="guruTutup">Tutup</button></div>
  </div>
  <div class="gInfo">“Simpan & pakai” menyimpan soal di perangkat ini. “Unduh HTML” membuat file game baru berisi soal Anda untuk dibagikan ke murid (bisa dibuka tanpa internet).</div>
</div></div>
<script type="module">
{kode}
</script>
</body>
</html>
"""


def bundel(kode, gid):
    masuk = AKAR / 'src' / f'_masuk_{gid}.js'
    masuk.write_text(kode.replace("from 'three/addons/", "from 'three/examples/jsm/"))
    try:
        hasil = subprocess.run([str(NM / '.bin' / 'esbuild'), str(masuk), '--bundle', '--minify', '--format=esm', '--target=es2020', '--legal-comments=none'],
                               cwd=AKAR, check=True, capture_output=True, text=True, env={**os.environ, 'NODE_PATH': str(NM)}).stdout
    finally:
        masuk.unlink()
    return hasil.replace('</script', '<\\/script')


def main():
    soal = bank.bank()
    data = {'judul': 'Bank soal Dunia Kotak Pintar', 'soal': soal}
    data['sidik'] = 'bawaan-' + hashlib.sha1(json.dumps(soal, sort_keys=True).encode()).hexdigest()[:10]
    data_json = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('},{', '},\n{')
    inti = (AKAR / 'src' / 'inti.js').read_text()
    pilih = sys.argv[1:] or list(GAME)
    for gid in pilih:
        m = GAME[gid]
        src = (AKAR / 'src' / f'{gid}.js').read_text()
        css_game = ''
        if '/*CSS*/' in src:
            css_game = src.split('/*CSS*/')[1].split('/*AKHIR-CSS*/')[0].strip().strip('`')
        kode = bundel(inti + '\n// ================= GAME: ' + gid + ' =================\n' + src, gid)
        html = HTML.format(css=CSS, css_game=css_game, data=data_json, kode=kode, **m)
        out = KELUAR / gid / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html)
        print('✓', out.relative_to(AKAR.parent.parent), f'{len(html) // 1024} KB')
    kartu = ''.join(f'<a class="k" style="--w:{m["aksen"]}" href="{gid}/"><div class="ik">{m["ikon"]}</div><h2>{m["judul"]}</h2><p>{m["desk"]}</p></a>' for gid, m in GAME.items())
    (KELUAR / 'index.html').write_text(BERANDA.replace('{kartu}', kartu).replace('{n}', str(len(soal))))


BERANDA = r"""<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dunia Kotak Pintar · Game Kuis Kelas</title>
<meta name="description" content="Tiga game kuis kelas bergaya Dunia Kotak: Balap Kucing, Pawai Juara, dan Daki Puncak Pintar. Satu bank soal, Mode Guru tempel dari Excel, jalan tanpa internet.">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap" rel="stylesheet">
<style>
:root{--bg:#eef6fb;--teks:#1f2a33;--kartu:#ffffff;--redup:#5b6a76}
@media (prefers-color-scheme:dark){:root{--bg:#121a21;--teks:#e8eef3;--kartu:#1b252e;--redup:#9fb0bd}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--teks);font-family:'Baloo 2',system-ui,sans-serif;padding:26px max(16px,env(safe-area-inset-right)) 40px max(16px,env(safe-area-inset-left))}
h1{text-align:center;margin:6px 0 2px;font-size:clamp(34px,8vw,56px);line-height:1}h1 b{color:#e8590c}h1 i{font-style:normal;color:#1c7ed6}
p.sub{text-align:center;margin:6px auto 22px;font-size:18px;color:var(--redup);max-width:640px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;max-width:1000px;margin:0 auto}
a.k{display:block;background:var(--kartu);border-radius:24px;padding:20px;text-decoration:none;color:inherit;box-shadow:0 7px 0 rgba(0,0,0,.12);border-top:10px solid var(--w)}
a.k:active{transform:translateY(3px)}.ik{font-size:50px;line-height:1}.k h2{margin:6px 0 2px;color:var(--w);font-size:27px}.k p{margin:0;font-size:17px;line-height:1.35}
.cat{max-width:760px;margin:24px auto 0;font-size:16px;color:var(--redup);text-align:center}
</style></head><body>
<h1><b>Dunia Kotak</b> <i>Pintar</i></h1><p class="sub">Tiga game kuis untuk kelas. Satu bank soal ({n} soal bawaan), pengaturan guru, dan bisa dimainkan tanpa internet.</p>
<div class="grid">{kartu}</div>
<p class="cat">Untuk guru: buka game, ketuk <b>Mode Guru</b> di layar Pengaturan Soal untuk menempel soal dari Excel, lalu unduh file HTML berisi soal Anda.</p>
<p class="cat"><a href="https://www.willoapparel.com" style="color:#e8590c;font-weight:800;text-decoration:none">Supported by www.willoapparel.com</a></p>
</body></html>
"""

if __name__ == '__main__':
    main()
