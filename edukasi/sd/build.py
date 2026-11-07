#!/usr/bin/env python3
"""Rakit game edukasi SD menjadi SATU file HTML per game (jalan offline).

  python3 edukasi/sd/build.py

Memakai mesin & kerangka HTML game PAUD (edukasi/paud/src/inti.js + build.py),
ditambah edukasi/sd/src/inti-sd.js (kamera isometrik, fase A/B/C, nyawa, papan angka).
Sumber per game: edukasi/sd/src/<game>/game.js + soal.json
Hasil: public/edukasi/sd/<game>/index.html
Persiapan sekali: cd edukasi/paud && npm install
"""
import importlib.util, json, pathlib

AKAR = pathlib.Path(__file__).resolve().parent
PAUD = AKAR.parent / 'paud'
KELUAR = AKAR.parent.parent / 'public' / 'edukasi' / 'sd'

_spec = importlib.util.spec_from_file_location('paud_build', PAUD / 'build.py')
pb = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(pb)

GAME = {
    'hitung': dict(judul='Petualang Hitung', aksen='#e8590c', aksen2='#fff1e0', ikon='🧮', mapel='Matematika',
                   ajak='Jelajahi Pulau Angka bersama Dimas!',
                   desk='Matematika SD fase A, B, C: operasi hitung, uang, pecahan, luas dan keliling.'),
    'kata': dict(judul='Petualang Kata', aksen='#c2255c', aksen2='#fff0f6', ikon='📖', mapel='Bahasa Indonesia', umum=True,
                 ajak='Jelajahi Kampung Kata bersama Sari!',
                 desk='Bahasa Indonesia SD fase A, B, C: suku kata, kosakata, membaca pemahaman, jenis kata.'),
    'alam': dict(judul='Penjelajah Alam', aksen='#2b8a3e', aksen2='#ebfbee', ikon='🌿', mapel='IPAS', umum=True,
                 ajak='Jelajahi Lembah Alam bersama Bayu!',
                 desk='IPAS SD fase A, B, C: tumbuhan, hewan, wujud benda, siklus, tubuh, energi, sosial budaya.'),
    'english': dict(judul='English Explorer', aksen='#1971c2', aksen2='#e7f5ff', ikon='🗺️', mapel='Bahasa Inggris', umum=True,
                    ajak='Jelajahi English Harbor bersama Nina!',
                    desk='Bahasa Inggris SD fase A, B, C: vocabulary, spelling, kalimat sederhana, percakapan, membaca.'),
    # Adventure RPG Matematika (produk baru, disetujui Huda 7 Nov)
    'hitung-rpg': dict(judul='Legenda Pulau Angka', aksen='#7048e8', aksen2='#efeaff', ikon='⚔️', mapel='Matematika', rpg=True, baru=True,
                       soal='hitung', ajak='Kalahkan Raja Galat dengan kekuatan hitungan!',
                       desk='Adventure RPG Matematika SD fase A, B, C: jelajahi pulau, kalahkan monster dengan menjawab soal.'),
}

CSS_SD = r"""
#nyawa{background:#fff;border-radius:18px;padding:4px 12px;font-size:20px;box-shadow:0 4px 0 rgba(0,0,0,.12);letter-spacing:2px;color:#e03131}
#nyawa .habis{color:#dee2e6}#nyawa.kedip{animation:gelengUI .45s}
#kartu{font-size:clamp(30px,8.5vw,52px);font-weight:800;padding:8px 22px;white-space:nowrap}
#kartu small{display:block;font-size:clamp(15px,4vw,19px);font-weight:700;color:#777;white-space:normal;max-width:80vw}
#kartu .uang{display:block;font-size:clamp(18px,5vw,26px);color:#2f9e44}
#gelembung{font-size:clamp(17px,4.6vw,24px)}
.pil{font-size:40px;min-width:88px;min-height:80px}
.pil.uang{font-size:20px;min-width:0;min-height:0;padding:10px 14px;border-radius:16px}
#numpad{background:#fff;border-radius:24px;padding:10px;box-shadow:0 6px 0 rgba(0,0,0,.12);width:min(460px,94vw)}
#npIsi{font-size:34px;font-weight:800;text-align:center;background:#f8f9fa;border-radius:14px;padding:2px 10px;margin-bottom:8px;min-height:52px}
#npIsi i{color:#ced4da;font-style:normal}#npIsi small{font-size:18px;color:#868e96;margin:0 4px}
#npTombol{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
#npTombol button{border:0;border-radius:14px;background:#f1f3f5;font-family:inherit;font-size:26px;font-weight:800;padding:6px 0;box-shadow:0 4px 0 rgba(0,0,0,.12);cursor:pointer}
#npTombol button:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.12)}
#npTombol .ok{grid-column:1/-1;background:var(--aksen);color:#fff;font-size:24px}
#layarFase .kotak{max-width:640px}
#faseDaftar{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:12px 0 4px}
.fase{border:0;border-radius:22px;background:#fff;border-top:10px solid var(--w);box-shadow:0 6px 0 rgba(0,0,0,.14),0 0 0 2px #f1f3f5 inset;font-family:inherit;padding:14px 10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px}
.fase:active{transform:translateY(3px)}.fase:disabled{opacity:.4}
.fase b{font-size:28px;color:var(--w)}.fase span{font-size:19px;font-weight:700}.fase em{font-style:normal;font-size:15px;color:#777}.fase i{font-style:normal;color:#ffc107;font-size:24px;text-shadow:0 2px 0 #b07d00;letter-spacing:2px}
@media (min-aspect-ratio:1/1) and (min-width:700px),(orientation:landscape) and (min-width:560px) and (max-height:500px){#kartu{max-width:30vw;font-size:clamp(22px,2.8vw,38px);white-space:normal}
 #numpad{position:fixed;right:14px;top:78px;width:min(290px,30vw)}#npTombol{grid-template-columns:repeat(3,1fr)}#npTombol button{padding:3px 0;font-size:22px}#npIsi{min-height:44px;font-size:28px}
 body:has(#numpad:not([hidden])) #gelembung{margin-right:min(300px,31vw);max-width:calc(100vw - min(300px,31vw) - 40px)}}
#kartu.bacaan small{font-size:clamp(15px,3.9vw,20px)}
@media (min-aspect-ratio:1/1) and (min-width:700px),(orientation:landscape) and (min-width:560px) and (max-height:500px){#kartu.bacaan{max-width:36vw;max-height:62vh;overflow:auto}body:has(#kartu.bacaan:not([hidden])) #pilihan{padding-left:min(38vw,460px)}#kartu.bacaan small{font-size:clamp(14px,1.5vw,19px)}}
@media (orientation:landscape) and (min-width:560px) and (max-height:500px){#numpad{top:70px;padding:6px}#npTombol{grid-template-columns:repeat(4,1fr);gap:4px}#npTombol button{font-size:18px;padding:2px 0}#npIsi{min-height:34px;font-size:22px;margin-bottom:4px}}
@media (max-width:520px){#numpad{padding:8px}#npTombol button{font-size:22px;padding:4px 0}#npIsi{font-size:28px;min-height:44px}}
"""

UI_SD = r"""
<div class="layar" id="layarFase" hidden><div class="kotak">
  <h1>Pilih Fase</h1><p>Pilih sesuai kelasmu. Kumpulkan 3 bintang di tiap fase!</p>
  <div id="faseDaftar"></div>
  <a class="dukung" href="https://www.willoapparel.com" target="_blank" rel="noopener">Supported by <b>www.willoapparel.com</b></a>
</div></div>
<div class="layar" id="layarKalah" hidden><div class="kotak">
  <div class="ikonBesar">💔</div><h1>Nyawa habis</h1><p>Tidak apa-apa, ayo coba lagi!</p>
  <button class="besar" id="bCobaLagi">↻ Coba lagi</button><br><button class="kecil" id="bKeFase" style="margin-top:12px">Pilih fase lain</button>
</div></div>
"""


def html_sd(m, data, kode):
    h = pb.HTML.replace('· Game Edukasi PAUD', '· Game Edukasi SD').replace('Game edukasi PAUD bergaya voxel 3D', 'Game edukasi SD Kurikulum Merdeka bergaya voxel 3D')
    h = h.replace('<div id="bintang"></div>', '<div id="nyawa"></div>\n  <div id="bintang"></div>')
    h = h.replace('<div id="gelembung">Memuat…</div>', '<div id="numpad" hidden><div id="npIsi"></div><div id="npTombol"></div></div>\n  <div id="gelembung">Memuat…</div>')
    # link beli paket SD untuk mode CONTOH (inti.js membaca window.PAKET_BELI, PR #163)
    h = h.replace('<script type="module">', UI_SD + '<script>window.PAKET_BELI=\'https://lynk.id/creator.store/vwkejw00pj39\'</script>\n<script type="module">', 1)
    h = h.replace('Untuk guru/orang tua', 'Untuk guru').replace('>Support by <b>', '>Supported by <b>')
    # banner kaos kelas Willo: tanpa harga (permintaan Huda), sumber kunjungan game-sd
    h = h.replace('utm_source=game-paud', 'utm_source=game-sd').replace('Desain gratis · mulai Rp65rb/pcs', 'Desain gratis, bisa custom nama kelas')
    assert 'Rp65' not in h
    return h.format(css=pb.CSS + CSS_SD, data=json.dumps(data, ensure_ascii=False, indent=1).replace('<', '\\u003c'), kode=kode, **m)


def html_rpg(m, data, kode):
    h = html_sd(m, data, kode).replace('· Game Edukasi SD', '· Adventure RPG Edukasi SD')
    h = h.replace('</style>', CSS_RPG + '</style>', 1)
    h = h.replace('<script type="module">', UI_RPG + '<script type="module">', 1)
    return h


def main():
    inti = (PAUD / 'src' / 'inti.js').read_text() + '\n' + (AKAR / 'src' / 'inti-sd.js').read_text()
    for gid, m in GAME.items():
        src = AKAR / 'src' / gid
        data = json.loads((AKAR / 'src' / m.get('soal', gid) / 'soal.json').read_text())
        data.setdefault('id', 'sd-' + gid)
        data.setdefault('judul', m['judul'])
        if m.get('soal'):  # game yang meminjam soal game lain tetap memakai judulnya sendiri
            data['judul'] = m['judul']
            data['id'] = 'sd-' + gid
        umum = ('\n' + (AKAR / 'src' / 'petualang.js').read_text()) if m.get('umum') else ''
        kode = pb.bundel(inti + umum + '\n// ================= GAME SD: ' + gid + ' =================\n' + (src / 'game.js').read_text(), 'sd_' + gid)
        out = KELUAR / gid / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text((html_rpg if m.get('rpg') else html_sd)(m, data, kode))
        print('✓', out.relative_to(AKAR.parent.parent), f'{out.stat().st_size // 1024} KB')
    urut = sorted((g for g in GAME.items() if not g[1].get('proto')), key=lambda g: not g[1].get('baru'))
    kartu = ''.join(f'<a class="k{" kBaru" if m.get("baru") else ""}" style="--w:{m["aksen"]}" href="{gid}/">{"<span class=baru>BARU · Adventure RPG</span>" if m.get("baru") else ""}<div class="ik">{m["ikon"]}</div><small>{m["mapel"]}</small><h2>{m["judul"]}</h2><p>{m["desk"]}</p></a>' for gid, m in urut)
    (KELUAR / 'index.html').write_text(BERANDA.replace('{kartu}', kartu))


CSS_RPG = open(AKAR / 'src' / 'hitung-rpg' / 'rpg.css').read() if (AKAR / 'src' / 'hitung-rpg' / 'rpg.css').exists() else ''
UI_RPG = open(AKAR / 'src' / 'hitung-rpg' / 'rpg.html').read() if (AKAR / 'src' / 'hitung-rpg' / 'rpg.html').exists() else ''

BERANDA = r"""<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Game Edukasi SD Voxel 3D · Willo</title>
<meta name="description" content="Game edukasi SD Kurikulum Merdeka bergaya voxel 3D untuk fase A, B, dan C. Soal bisa diubah guru dan ditempel dari Excel, jalan tanpa internet.">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap" rel="stylesheet">
<style>
:root{--bg:#fff8ec;--teks:#2b2b2b;--kartu:#ffffff}
@media (prefers-color-scheme:dark){:root{--bg:#1d1b18;--teks:#f3efe6;--kartu:#2a2723}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--teks);font-family:'Baloo 2',system-ui,sans-serif;padding:24px 16px 40px}
h1{text-align:center;margin:8px 0 2px;font-size:clamp(28px,7vw,44px)}p.sub{text-align:center;margin:0 0 22px;font-size:18px;opacity:.8}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;max-width:1000px;margin:0 auto}
a.k{display:block;background:var(--kartu);border-radius:26px;padding:22px 20px;text-decoration:none;color:inherit;box-shadow:0 7px 0 rgba(0,0,0,.12);border-top:10px solid var(--w)}
a.k:active{transform:translateY(3px)}.ik{font-size:54px;line-height:1}.k small{font-weight:800;opacity:.6}.k h2{margin:2px 0 2px;color:var(--w);font-size:26px}.k p{margin:0;font-size:17px}
a.k{position:relative}.baru{position:absolute;top:-14px;right:14px;background:#ffd43b;color:#2b2b2b;font-weight:800;font-size:13px;padding:3px 10px;border-radius:99px;box-shadow:0 3px 0 rgba(0,0,0,.15)}a.kBaru{grid-column:1/-1;background:linear-gradient(135deg,#7048e8,#5f3dc4);color:#fff}a.kBaru h2{color:#ffd43b}a.kBaru small{opacity:.85}
.cat{max-width:760px;margin:26px auto 0;font-size:16px;opacity:.85;text-align:center}
.beli{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px 18px;max-width:760px;margin:28px auto 0;padding:18px 20px;border-radius:24px;background:#e8590c;color:#fff;text-align:center;box-shadow:0 7px 0 rgba(0,0,0,.15)}.beli b{display:block;font-size:22px}.beli span{font-size:16px;opacity:.95}.beli a{display:inline-block;background:#ffd43b;color:#2b2b2b;font-weight:800;font-size:19px;padding:10px 22px;border-radius:16px;text-decoration:none}
</style></head><body>
<h1>Game Edukasi SD</h1><p class="sub">Dunia voxel 3D isometrik, tiga fase: A (kelas 1–2), B (kelas 3–4), C (kelas 5–6).</p>
<div class="grid">{kartu}</div>
<div class="beli"><div><b>📦 Paket offline untuk guru</b><span>4 game 4 mapel (Matematika, Bahasa Indonesia, IPAS, Bahasa Inggris), bisa tanpa internet, + panduan bergambar untuk guru, dalam satu file zip</span></div><a href="https://lynk.id/creator.store/vwkejw00pj39" target="_blank" rel="noopener">Dapatkan paketnya</a></div>
<p class="cat">Untuk guru: tombol <b>Guru</b> di setiap game untuk mengubah soal per fase, menempel soal dari Excel, lalu mengunduh file HTML berisi soal Anda. <a href="../paud/" style="color:inherit">Game PAUD ada di sini.</a></p>
<p class="cat"><a href="https://www.willoapparel.com" style="color:#e8590c;font-weight:800;text-decoration:none">Supported by www.willoapparel.com</a></p>
</body></html>
"""


if __name__ == '__main__':
    main()
