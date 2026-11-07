# Model 3D prop (Sand3D)

Prop dibuat dengan [Sand3D](https://github.com/Sandflow-ai/sand3d) (Apache 2.0): tiap model adalah program Python pendek di `src/`.

    python3 -m venv /tmp/s3d && /tmp/s3d/bin/pip install sand3d   # memasang Blender bpy
    cd aset3d/src && for f in *.py; do /tmp/s3d/bin/python $f; done  # -> ../*.glb

`build.py` menyisipkan semua `*.glb` ke halaman (window.ASET3D). Bila model gagal dimuat, game kembali ke gambar datar.
Pratinjau: bundel `pratinjau-src.js` dengan esbuild ke `pratinjau.js`, lalu buka `pratinjau.html` lewat server lokal.
