#!/usr/bin/env python3
"""Rakit Pelari Kalcer 3D menjadi SATU file HTML.

  cd pelarikalcer && npm install      # sekali
  python3 pelarikalcer/potong_aset.py # bila gambar sumber berubah
  python3 pelarikalcer/build.py

Hasil:
  public/pelarikalcer/index.html   halaman situs (dokumen lengkap)
  pelarikalcer/dist/artifact.html  versi pratinjau artifact (tanpa doctype/html/body)
Three.js + qrcode-generator dibundel (esbuild); aset gambar disisipkan sebagai data URI WebP.
"""
import base64, io, json, pathlib, subprocess
from PIL import Image

AKAR = pathlib.Path(__file__).resolve().parent
SITUS = AKAR.parent / 'public' / 'pelarikalcer' / 'index.html'
ARTIFACT = AKAR / 'dist' / 'artifact.html'


# gambar Huda yang sudah dipotong tapi belum dipakai di game (rute baru / ide lanjutan) -> tidak disisipkan
BELUM_DIPAKAI = {'headlamp', 'pos_cp', 'asap_belerang', 'gedung', 'tex_tangga', 'tex_batu_vulkanik'}


def aset_data_uri():
    hasil = {}
    for f in sorted((AKAR / 'aset').glob('*.png')):
        if f.stem in BELUM_DIPAKAI:
            continue
        im = Image.open(f).convert('RGBA')
        buf = io.BytesIO()
        im.save(buf, 'WEBP', quality=86, method=6)
        hasil[f.stem] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
    return hasil


def model_data_uri():
    return {f.stem: 'data:model/gltf-binary;base64,' + base64.b64encode(f.read_bytes()).decode()
            for f in sorted((AKAR / 'aset3d').glob('*.glb'))}


def bundel():
    keluar = subprocess.run(
        [str(AKAR / 'node_modules' / '.bin' / 'esbuild'), str(AKAR / 'src' / 'game.js'), '--bundle', '--minify',
         '--format=iife', '--target=es2019', '--legal-comments=none'],
        check=True, capture_output=True, text=True).stdout
    return keluar.replace('</script', '<\\/script')


def main():
    isi = (AKAR / 'src' / 'template.html').read_text()
    aset = aset_data_uri()
    js = bundel()
    model = model_data_uri()
    badan = (isi + '\n<script>window.ASET=' + json.dumps(aset) + ';window.ASET3D=' + json.dumps(model) + ';</script>\n<script>' + js + '</script>\n')
    ARTIFACT.parent.mkdir(exist_ok=True)
    ARTIFACT.write_text(badan)
    SITUS.parent.mkdir(parents=True, exist_ok=True)
    SITUS.write_text('<!doctype html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n'
                     '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">\n'
                     '<meta name="theme-color" content="#15181d">\n<link rel="canonical" href="https://www.willoapparel.com/pelarikalcer/">\n'
                     '</head>\n<body>\n' + badan + '</body>\n</html>\n')
    print(f'model 3D {len(model)} ({sum(len(v) for v in model.values())//1024} KB); aset {len(aset)} gambar, {sum(len(v) for v in aset.values())//1024} KB; js {len(js)//1024} KB')
    print('ditulis:', SITUS, ARTIFACT)


if __name__ == '__main__':
    main()
