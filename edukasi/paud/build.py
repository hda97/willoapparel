#!/usr/bin/env python3
"""Rakit game edukasi PAUD menjadi SATU file HTML per game.

  python3 edukasi/paud/build.py

Sumber: edukasi/paud/src/inti.js (bersama) + src/<game>/game.js + src/<game>/soal.json
Hasil : public/edukasi/paud/<game>/index.html. Three.js ikut dibundel ke dalam file
        (esbuild), jadi game bisa dibuka & diedit TANPA internet.
Persiapan sekali: cd edukasi/paud && npm install
"""
import json, os, pathlib, subprocess

AKAR = pathlib.Path(__file__).resolve().parent
KELUAR = AKAR.parent.parent / 'public' / 'edukasi' / 'paud'

GAME = {
    'huruf': dict(judul='Petualang Huruf', aksen='#2f9e44', aksen2='#d3f9d8', ikon='🔤',
                  ajak='Bantu Bima mencari huruf di taman!', desk='Mengenal huruf A sampai Z dan bunyi awal kata.'),
    'angka': dict(judul='Petualang Angka', aksen='#e8590c', aksen2='#fff0e0', ikon='🍎',
                  ajak='Bantu Kiko si kucing memetik buah!', desk='Berhitung 1 sampai 20, banyak dan sedikit.'),
    'bentuk': dict(judul='Pelangi Bentuk', aksen='#7048e8', aksen2='#ede7ff', ikon='🔺',
                   ajak='Main warna dan bentuk bersama Lala!', desk='Mengenal warna dan bentuk dasar.'),
    'binatang': dict(judul='Kebun Binatang Suara', aksen='#c27c0e', aksen2='#fff3bf', ikon='🐮',
                     ajak='Tebak suara hewan bersama Dodo!', desk='Mengenal hewan, suara, dan makanannya.'),
}

CSS = r"""
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%;overflow:hidden;background:var(--latar);font-family:'Baloo 2','Comic Sans MS',system-ui,sans-serif;color:#2b2b2b;touch-action:none;user-select:none;-webkit-user-select:none}
#layar{position:fixed;inset:0;width:100%;height:100%;display:block}
.atas{position:fixed;top:0;left:0;right:0;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:max(10px,env(safe-area-inset-top)) 12px 8px;pointer-events:none}
.atas .spasi{flex:1}
.atas>*{pointer-events:auto}
.chip{background:#fff;border-radius:18px;padding:6px 14px;font-weight:800;font-size:18px;box-shadow:0 4px 0 rgba(0,0,0,.12);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40vw}
#bintang{order:9;flex-basis:100%;text-align:center;font-size:clamp(18px,5vw,26px);letter-spacing:1px;color:rgba(0,0,0,.18);text-shadow:0 2px 0 #fff;white-space:nowrap}
#bintang .isi{color:#ffc107;text-shadow:0 2px 0 #b07d00}
.bulat{width:54px;height:54px;border-radius:50%;border:0;background:#fff;font-size:26px;box-shadow:0 5px 0 rgba(0,0,0,.15);cursor:pointer;flex:none}
.bulat:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.15)}
#bDengar{background:var(--aksen);color:#fff;width:64px;height:64px;font-size:30px}
#bGuru{width:44px;height:44px;font-size:13px;font-weight:800;background:rgba(255,255,255,.85)}
.bawah{position:fixed;left:0;right:0;bottom:0;padding:8px 14px max(14px,env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:none}
.bawah>*{pointer-events:auto}
#gelembung{background:#fff;border-radius:24px;padding:12px 22px;font-size:clamp(20px,5.4vw,30px);font-weight:800;text-align:center;max-width:720px;box-shadow:0 6px 0 rgba(0,0,0,.12);line-height:1.2;min-height:56px}
#gelembung.muncul{animation:muncul .35s ease-out}
@keyframes muncul{from{transform:scale(.85);opacity:.3}to{transform:scale(1);opacity:1}}
#kartu{background:#fff;border-radius:26px;padding:6px 20px;font-size:clamp(44px,13vw,72px);box-shadow:0 6px 0 rgba(0,0,0,.12);line-height:1.15;text-align:center}
#kartu .kata{display:block;font-size:clamp(22px,6vw,34px);font-weight:800;letter-spacing:2px}
#kartu .kata b{color:var(--aksen);font-size:1.25em}
#pilihan{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
.pil{min-width:96px;min-height:96px;border:0;border-radius:28px;background:#fff;font-family:inherit;font-size:48px;font-weight:800;color:#2b2b2b;box-shadow:0 7px 0 rgba(0,0,0,.16);cursor:pointer;padding:6px 16px}
.pil:active{transform:translateY(4px);box-shadow:0 3px 0 rgba(0,0,0,.16)}
.pil.benar{background:#b2f2bb}.pil.salah{animation:gelengUI .45s}
@keyframes gelengUI{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
.layar{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(20,20,30,.35);padding:16px;z-index:5}
.layar[hidden],[hidden]{display:none!important}
.kotak{background:#fff;border-radius:30px;padding:26px 26px 22px;text-align:center;max-width:420px;width:100%;box-shadow:0 10px 0 rgba(0,0,0,.15)}
.kotak h1{margin:0 0 4px;font-size:clamp(30px,8vw,42px);color:var(--aksen);line-height:1.05}
.kotak p{margin:4px 0 16px;font-size:20px;font-weight:600}
.besar{border:0;border-radius:26px;background:var(--aksen);color:#fff;font-family:inherit;font-size:30px;font-weight:800;padding:14px 40px;box-shadow:0 7px 0 rgba(0,0,0,.22);cursor:pointer}
.iklanWillo{display:flex;align-items:center;gap:12px;margin:16px auto 0;max-width:420px;padding:10px 12px;border-radius:16px;background:linear-gradient(135deg,#1f2a5a,#2f5bff);color:#fff;text-decoration:none;text-align:left;box-shadow:0 4px 0 rgba(0,0,0,.15)}.iklanWillo svg{flex:none;width:52px;height:52px}.iklanWillo span{flex:1;display:flex;flex-direction:column;line-height:1.25}.iklanWillo b{font-size:16px;font-weight:800}.iklanWillo i{font-style:normal;font-size:13px;opacity:.9}.iklanWillo em{flex:none;font-style:normal;font-weight:800;font-size:14px;background:#ffd43b;color:#1f2a5a;padding:8px 12px;border-radius:12px}
.dukung{display:block;margin-top:16px;font-size:14px;font-weight:600;color:#777;text-decoration:none;letter-spacing:.2px}.dukung b{color:#e8590c}
/* menu awal ceria untuk anak: tokoh 3D tetap terlihat di tengah */
#layarMulai{flex-direction:column;justify-content:space-between;background:linear-gradient(180deg,rgba(255,255,255,.7),rgba(255,255,255,0) 34%,rgba(255,255,255,0) 66%,rgba(255,255,255,.75));padding:calc(64px + env(safe-area-inset-top)) 16px calc(26px + env(safe-area-inset-bottom));overflow:hidden}
body:has(#layarMulai:not([hidden])) .bawah,body:has(#layarMulai:not([hidden])) #bintang{visibility:hidden}
.mAtas{text-align:center;position:relative;z-index:1;animation:jatuh .8s cubic-bezier(.3,1.7,.5,1) both}
.mAtas .ikonBesar{font-size:clamp(52px,13vw,76px);display:inline-block;animation:ayun 2.4s ease-in-out infinite;filter:drop-shadow(0 5px 0 rgba(0,0,0,.15))}
#mulaiJudul{margin:2px 0 8px;font-size:clamp(40px,11.5vw,78px);line-height:1;font-weight:800;letter-spacing:1px}
#mulaiJudul .kata{white-space:nowrap;font-weight:inherit}#mulaiJudul span{display:inline-block;animation:loncat 1.8s ease-in-out infinite;text-shadow:0 3px 0 #fff,0 -3px 0 #fff,3px 0 0 #fff,-3px 0 0 #fff,0 8px 0 rgba(0,0,0,.18)}
#mulaiAjak{display:inline-block;margin:0;background:#fff;border-radius:99px;padding:7px 20px;font-size:clamp(17px,4.6vw,22px);font-weight:700;box-shadow:0 5px 0 rgba(0,0,0,.12)}
.mBawah{background:none!important;box-shadow:none!important;padding:0!important;position:relative;z-index:1}
#bMulai{font-size:clamp(34px,9vw,44px);padding:16px 62px;border:6px solid #fff;animation:denyut 1.3s ease-in-out infinite;box-shadow:0 8px 0 rgba(0,0,0,.22),0 0 0 0 var(--aksen)}
.hias{position:absolute;inset:0;pointer-events:none}
.hias i{position:absolute;bottom:-60px;font-style:normal;font-size:30px;opacity:.85;animation:naik 9s linear infinite;text-shadow:0 3px 0 rgba(0,0,0,.12)}
.hias i:nth-child(6n+1){color:#ff6b6b}.hias i:nth-child(6n+2){color:#ffd43b}.hias i:nth-child(6n+3){color:#51cf66}.hias i:nth-child(6n+4){color:#4dabf7}.hias i:nth-child(6n+5){color:#b197fc}.hias i:nth-child(6n){color:#ff922b}
.hias i:nth-child(1){left:4%;animation-delay:0s}.hias i:nth-child(2){left:14%;animation-delay:-3s;font-size:22px}.hias i:nth-child(3){left:24%;animation-delay:-6s}.hias i:nth-child(4){left:34%;animation-delay:-1.5s;font-size:24px}
.hias i:nth-child(5){left:46%;animation-delay:-7.5s;font-size:20px}.hias i:nth-child(6){left:56%;animation-delay:-4.5s}.hias i:nth-child(7){left:66%;animation-delay:-2s;font-size:26px}.hias i:nth-child(8){left:76%;animation-delay:-5.5s}
.hias i:nth-child(9){left:86%;animation-delay:-.8s;font-size:22px}.hias i:nth-child(10){left:94%;animation-delay:-8.2s}.hias i:nth-child(11){left:9%;animation-delay:-4s;font-size:18px}.hias i:nth-child(12){left:90%;animation-delay:-6.6s;font-size:20px}
@keyframes jatuh{from{transform:translateY(-60px) scale(.7);opacity:0}to{transform:none;opacity:1}}
@keyframes loncat{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-10px) rotate(-4deg)}}
@keyframes ayun{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg) scale(1.06)}}
@keyframes denyut{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes naik{from{transform:translateY(0) rotate(0)}to{transform:translateY(-115vh) rotate(360deg)}}
@media (orientation:landscape) and (max-height:820px){#mulaiJudul{font-size:clamp(34px,8.5vh,64px)}.mAtas .ikonBesar{font-size:clamp(40px,8vh,60px)}#layarMulai{padding-top:54px}}
@media (prefers-reduced-motion:reduce){#layarMulai *{animation:none!important}}
.besar:active{transform:translateY(4px);box-shadow:0 3px 0 rgba(0,0,0,.22)}
#selesaiBintang{font-size:60px;color:#ffc107;text-shadow:0 3px 0 #b07d00;letter-spacing:6px}
.ikonBesar{font-size:64px;line-height:1}
/* Mode guru */
#guruGerbang .kotak{max-width:340px}#gJawab{font-size:28px;width:120px;text-align:center;border:2px solid #ccc;border-radius:14px;padding:6px;margin:6px 0 14px;font-family:inherit}
.kecil{border:0;border-radius:14px;background:#eee;font-family:inherit;font-size:17px;font-weight:700;padding:9px 16px;cursor:pointer;margin:3px}
.kecil.utama{background:var(--aksen);color:#fff}
#panelGuru{align-items:stretch;user-select:text;-webkit-user-select:text;touch-action:auto}
#panelGuru .kotak{max-width:900px;text-align:left;display:flex;flex-direction:column;max-height:100%;overflow:auto;padding:18px}
#panelGuru h2{margin:0 0 6px;color:var(--aksen)}
.gGulir{overflow:auto;flex:1 0 auto;min-height:180px;max-height:45vh;border:1px solid #eee;border-radius:12px;margin:8px 0}
#guruTabel{border-collapse:collapse;width:100%;font-size:16px}
#guruTabel th{position:sticky;top:0;background:var(--aksen2);text-align:left;padding:6px}
#guruTabel td{padding:3px 4px;border-top:1px solid #f0f0f0}
#guruTabel input{width:100%;font-family:inherit;font-size:17px;border:1px solid #ddd;border-radius:8px;padding:5px 7px;min-width:70px}
.gHapus{border:0;background:#ffe3e3;border-radius:8px;cursor:pointer;padding:5px 9px}
#guruAtur{display:flex;gap:10px;flex-wrap:wrap}
#guruAtur label,.gBaris label{font-size:15px;font-weight:700;display:flex;flex-direction:column}
#guruAtur input,#guruAtur select,#guruJudul{font-family:inherit;font-size:17px;border:1px solid #ddd;border-radius:8px;padding:5px 7px}
#guruExcel{width:100%;height:64px;font-family:monospace;font-size:14px;border:1px solid #ddd;border-radius:10px;padding:6px}
.gBaris{display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin:4px 0}
.gInfo{font-size:14px;color:#666;margin:2px 0}
@media (min-aspect-ratio:1/1) and (min-width:700px){#kartu{position:fixed;left:18px;top:50%;transform:translateY(-50%)}}
@media (max-width:420px){.nmGame{display:none}}
@media (max-height:520px){.pil{min-width:76px;min-height:76px;font-size:38px}#kartu{font-size:42px}#gelembung{font-size:20px;padding:8px 16px}}
"""

HTML = r"""<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<title>{judul} · Game Edukasi PAUD</title>
<meta name="description" content="{desk} Game edukasi PAUD bergaya voxel 3D, soal bisa diubah guru.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap" rel="stylesheet">
<style>:root{{--aksen:{aksen};--aksen2:{aksen2};--latar:{aksen2}}}{css}</style>
<!-- SOAL: guru boleh mengubah bagian ini langsung, atau lewat tombol "Guru" di dalam game. -->
<script type="application/json" id="data-soal">
{data}
</script>
</head>
<body>
<canvas id="layar"></canvas>
<div class="atas">
  <div class="chip">{ikon} <span class="nmGame">{judul}</span></div>
  <div class="spasi"></div>
  <div id="bintang"></div>
  <button class="bulat" id="bSuara" title="Suara nyala/mati">🔈</button>
  <button class="bulat" id="bDengar" title="Dengar lagi">🔊</button>
  <button class="bulat" id="bGuru" title="Mode guru">Guru</button>
</div>
<div class="bawah">
  <div id="kartu" hidden></div>
  <div id="pilihan" hidden></div>
  <div id="gelembung">Memuat…</div>
</div>
<div class="layar" id="layarMulai"><div class="hias" aria-hidden="true"><i>★</i><i>●</i><i>▲</i><i>♥</i><i>★</i><i>■</i><i>●</i><i>♥</i><i>▲</i><i>★</i><i>●</i><i>■</i></div>
  <div class="mAtas"><div class="ikonBesar">{ikon}</div><h1 id="mulaiJudul">{judul}</h1><p id="mulaiAjak">{ajak}</p></div>
  <div class="kotak mBawah"><button class="besar" id="bMulai">▶ Main</button>
  <a class="dukung" href="https://www.willoapparel.com" target="_blank" rel="noopener">Supported by <b>www.willoapparel.com</b></a></div>
</div>
<div class="layar" id="layarSelesai" hidden><div class="kotak">
  <div id="selesaiBintang">★★★</div><h1>Hebat sekali!</h1><p>Kamu sudah menyelesaikan semua soal.</p>
  <button class="besar" id="bUlang">↻ Main lagi</button>
  <a class="iklanWillo" href="https://www.willoapparel.com/kaos-kelas.html?utm_source=game-paud" target="_blank" rel="noopener"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 8l-14 7-6 14 9 4 3-6v31h36V27l3 6 9-4-6-14-14-7c-1 5-5 8-10 8s-9-3-10-8z" fill="#ffd43b" stroke="#1f2a5a" stroke-width="2.5" stroke-linejoin="round"/><text x="32" y="44" text-anchor="middle" font-size="13" font-weight="900" fill="#1f2a5a" font-family="sans-serif">XI-A</text></svg><span><b>Kaos kelas custom untuk sekolah</b><i>Desain gratis, bisa custom nama kelas</i></span><em>Lihat</em></a>
  <a class="dukung" href="https://www.willoapparel.com" target="_blank" rel="noopener">Supported by <b>www.willoapparel.com</b></a>
</div></div>
<div class="layar" id="guruGerbang" hidden><div class="kotak">
  <h2 style="margin:0 0 6px">Mode Guru</h2><div id="gTanya"></div>
  <input id="gJawab" inputmode="numeric" autocomplete="off"><br>
  <button class="kecil utama" id="gMasuk">Masuk</button><button class="kecil" id="gBatal">Batal</button>
</div></div>
<div class="layar" id="panelGuru" hidden><div class="kotak">
  <h2>Mode Guru: ubah soal</h2>
  <a class="iklanWillo" style="margin:0 0 10px;max-width:none" href="https://www.willoapparel.com/kaos-kelas.html?utm_source=game-paud" target="_blank" rel="noopener"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 8l-14 7-6 14 9 4 3-6v31h36V27l3 6 9-4-6-14-14-7c-1 5-5 8-10 8s-9-3-10-8z" fill="#ffd43b" stroke="#1f2a5a" stroke-width="2.5" stroke-linejoin="round"/><text x="32" y="44" text-anchor="middle" font-size="13" font-weight="900" fill="#1f2a5a" font-family="sans-serif">XI-A</text></svg><span><b>Kaos kelas custom untuk sekolah</b><i>Desain gratis, bisa custom nama kelas</i></span><em>Lihat</em></a>
  <div class="gBaris"><label>Judul game<input id="guruJudul"></label><div id="guruAtur"></div></div>
  <div class="gGulir"><table id="guruTabel"></table></div>
  <div class="gBaris"><button class="kecil" id="guruTambah">+ Tambah soal</button></div>
  <div class="gInfo">Tempel dari Excel/Google Sheets (blok sel, salin, tempel di sini) atau pilih file .csv/.txt. <span id="guruKolomInfo"></span></div>
  <textarea id="guruExcel" placeholder="Tempel baris soal dari Excel di sini…"></textarea>
  <div class="gBaris">
    <button class="kecil" id="guruTempel">Masukkan tempelan</button>
    <label style="flex-direction:row;align-items:center;gap:4px;font-weight:600"><input type="checkbox" id="guruGanti"> ganti semua soal lama</label>
    <label class="kecil" style="display:inline-block">📄 File CSV<input type="file" id="guruFile" accept=".csv,.txt,.tsv" hidden></label>
  </div>
  <div class="gBaris" style="justify-content:space-between">
    <div><button class="kecil utama" id="guruSimpan">✔ Simpan & main</button><button class="kecil" id="guruUnduh">⬇ Unduh HTML berisi soal ini</button></div>
    <div><button class="kecil" id="guruBawaan">Soal bawaan</button><button class="kecil" id="guruTutup">Tutup</button></div>
  </div>
  <div class="gInfo">“Simpan & main” menyimpan soal di perangkat ini. “Unduh HTML” membuat file game baru berisi soal Anda untuk dibagikan ke murid.</div>
</div></div>
<script type="module">
{kode}
</script>
</body>
</html>
"""


def bundel(kode, gid):
    """Gabung kode game + Three.js jadi satu skrip (tanpa CDN) dengan esbuild."""
    masuk = AKAR / f'_masuk_{gid}.js'
    masuk.write_text(kode.replace("from 'three/addons/", "from 'three/examples/jsm/"))
    try:
        hasil = subprocess.run([str(AKAR / 'node_modules' / '.bin' / 'esbuild'), str(masuk), '--bundle', '--minify', '--format=esm',
                                '--target=es2020', '--legal-comments=none'], cwd=AKAR, check=True, capture_output=True, text=True,
                                env={**os.environ, 'NODE_PATH': str(AKAR / 'node_modules')}).stdout
    finally:
        masuk.unlink()
    return hasil.replace('</script', '<\\/script')


def main():
    inti = (AKAR / 'src' / 'inti.js').read_text()
    for gid, m in GAME.items():
        src = AKAR / 'src' / gid
        if not (src / 'game.js').exists():
            continue
        data = json.loads((src / 'soal.json').read_text())
        data.setdefault('id', gid)
        data.setdefault('judul', m['judul'])
        kode = bundel(inti + '\n// ================= GAME: ' + gid + ' =================\n' + (src / 'game.js').read_text(), gid)
        html = HTML.format(css=CSS, data=json.dumps(data, ensure_ascii=False, indent=1).replace('<', '\\u003c'), kode=kode, **m)
        out = KELUAR / gid / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html)
        print('✓', out.relative_to(AKAR.parent.parent), f'{len(html)//1024} KB')
    kartu = ''.join(f'<a class="k" style="--w:{m["aksen"]}" href="{gid}/"><div class="ik">{m["ikon"]}</div><h2>{m["judul"]}</h2><p>{m["desk"]}</p></a>' for gid, m in GAME.items())
    (KELUAR / 'index.html').write_text(BERANDA.replace('{kartu}', kartu))


BERANDA = r"""<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Game Edukasi PAUD Voxel 3D · Willo</title>
<meta name="description" content="Empat game edukasi PAUD bergaya voxel 3D: huruf, angka, warna dan bentuk, serta hewan. Ada suara pembaca soal, tombol besar, dan soal bisa diubah guru.">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap" rel="stylesheet">
<style>
:root{--bg:#fff8ec;--teks:#2b2b2b;--kartu:#ffffff}
@media (prefers-color-scheme:dark){:root{--bg:#1d1b18;--teks:#f3efe6;--kartu:#2a2723}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--teks);font-family:'Baloo 2',system-ui,sans-serif;padding:24px 16px 40px}
h1{text-align:center;margin:8px 0 2px;font-size:clamp(28px,7vw,44px)}p.sub{text-align:center;margin:0 0 22px;font-size:18px;opacity:.8}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;max-width:1000px;margin:0 auto}
a.k{display:block;background:var(--kartu);border-radius:26px;padding:22px 20px;text-decoration:none;color:inherit;box-shadow:0 7px 0 rgba(0,0,0,.12);border-top:10px solid var(--w)}
a.k:active{transform:translateY(3px)}.ik{font-size:54px;line-height:1}.k h2{margin:6px 0 2px;color:var(--w);font-size:26px}.k p{margin:0;font-size:17px}
.cat{max-width:760px;margin:26px auto 0;font-size:16px;opacity:.85;text-align:center}
.beli{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px 18px;max-width:760px;margin:28px auto 0;padding:18px 20px;border-radius:24px;background:#2f9e44;color:#fff;text-align:center;box-shadow:0 7px 0 rgba(0,0,0,.15)}.beli b{display:block;font-size:22px}.beli span{font-size:16px;opacity:.95}.beli a{display:inline-block;background:#ffd43b;color:#2b2b2b;font-weight:800;font-size:19px;padding:10px 22px;border-radius:16px;text-decoration:none}
</style></head><body>
<h1>Game Edukasi PAUD</h1><p class="sub">Dunia voxel 3D, suara pembaca soal, boleh coba lagi sampai bisa.</p>
<div class="grid">{kartu}</div>
<div class="beli"><div><b>📦 Paket offline untuk guru</b><span>4 game (bisa tanpa internet) + video tutorial guru, dalam satu file zip</span></div><a href="https://lynk.id/creator.store/qx7nj352km6d" target="_blank" rel="noopener">Dapatkan paketnya</a></div>
<p class="cat">Untuk guru: setiap game punya tombol <b>Guru</b> untuk mengubah soal, menempel soal dari Excel, lalu mengunduh file HTML berisi soal Anda.</p>
<p class="cat"><a href="https://www.willoapparel.com" style="color:#e8590c;font-weight:800;text-decoration:none">Supported by www.willoapparel.com</a></p>
</body></html>
"""


if __name__ == '__main__':
    main()
