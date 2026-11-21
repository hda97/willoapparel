# Susun png/*.png (hasil render.js, UK=96) jadi lembar sprite public/duniakotak/mabar/ikon-kotak.png.
# Jalankan: wrangler dev di 127.0.0.1:8787, lalu `UK=96 node render.js && python3 susun.py`. Posisi sel dicetak; salin ke POS di js/ikon.js.
from PIL import Image
import os, json
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'png')
names = [n[:-4] for n in sorted(os.listdir(d))]
uniq = [n for n in names if n not in ('lomba', 'jog', 'naik', 'dealer')] + ['mobil']
C, S = 8, 96; R = (len(uniq) + C - 1) // C
sheet = Image.new('RGBA', (C * S, R * S), (0, 0, 0, 0)); pos = {}
for i, n in enumerate(uniq):
    sheet.paste(Image.open(f'{d}/{"naik" if n == "mobil" else n}.png').convert('RGBA'), ((i % C) * S, (i // C) * S)); pos[n] = [i % C, i // C]
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../public/duniakotak/mabar/ikon-kotak.png')
sheet.save(out, optimize=True); print(C, R, json.dumps(pos))
