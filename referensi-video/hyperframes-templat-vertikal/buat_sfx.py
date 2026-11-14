"""Bunyi latar gratis (tanpa layanan luar): pop tiap kata + ketukan 120 BPM.
Pakai: python3 buat_html.py && python3 buat_sfx.py  -> assets/sfx.wav"""
import json, wave, numpy as np
t = json.load(open('waktu_kata.json')); sr = 44100; D = 16; a = np.zeros(sr * D)
for s in t:
    n = int(.12 * sr); x = np.arange(n) / sr
    p = np.sin(2 * np.pi * (900 - 3000 * x) * x) * np.exp(-x * 40) * .5
    i = int(s * sr); a[i:i + n] += p[:len(a) - i]
for k in np.arange(0, D, 0.5):
    n = int(.2 * sr); x = np.arange(n) / sr
    kk = np.sin(2 * np.pi * (110 * np.exp(-x * 18)) * x) * np.exp(-x * 14) * .45
    i = int(k * sr); a[i:i + n] += kk[:len(a) - i]
x = np.arange(len(a)) / sr; a += 0.06 * np.sin(2 * np.pi * 55 * x) * (0.6 + 0.4 * np.sin(2 * np.pi * x / 2))
a = np.clip(a, -1, 1)
import os; os.makedirs('assets', exist_ok=True)
w = wave.open('assets/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((a * 30000).astype(np.int16).tobytes()); w.close()
