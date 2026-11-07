#!/usr/bin/env python3
"""Rakit PAKET GAME SMP DUNIA KOTAK (main bersama).

  cd edukasi/smp && npm install        (sekali: esbuild, three, qrcode-generator)
  python3 edukasi/smp/build.py         -> game HTML + halaman HP murid
  python3 edukasi/smp/build.py --server -> juga aplikasi Kelas Dunia Kotak (Windows, Mac, Linux)

Sumber : src/inti.js (bersama) + src/<game>.js + bank.py, src/murid.html (HP murid), server/ (Go)
Hasil  : public/edukasi/smp/<game>/index.html (versi situs: mode CONTOH 3 soal)
         edukasi/smp/server/dist/  (berkas yang dibundel ke aplikasi server)
         edukasi/smp/keluar/       (aplikasi server siap bagikan, tidak masuk git)
"""
import hashlib, json, os, pathlib, shutil, subprocess, sys

AKAR = pathlib.Path(__file__).resolve().parent
NM = AKAR / 'node_modules'
KELUAR = AKAR.parent.parent / 'public' / 'edukasi' / 'smp'
DIST = AKAR / 'server' / 'dist'
sys.path.insert(0, str(AKAR))

LINK_BELI = 'https://www.willoapparel.com/duniakotak/belajar/'
WA = '0858-1690-0722'

GAME = {
    'menara-hitung': dict(judul='Menara Hitung', mapel='Matematika', kunci='matematika', bank='bank', ikon='🏯', aksen='#1c7ed6', latar='#e7f5ff',
                          desk='Panjat menara bersama satu kelas. Jawaban benar naik satu lantai, petak yang salah runtuh.'),
    'lab-ajaib': dict(judul='Lab Ajaib', mapel='IPA', kunci='ipa', bank='bank_ipa', ikon='🧪', aksen='#2f9e44', latar='#ebfbee', bersama=True,
                      desk='Tebak hasil percobaan IPA bersama satu kelas. Meja benar bersinar dan mengisi Energi Lab.'),
    'english-quest': dict(judul='English Quest', mapel='Bahasa Inggris', kunci='inggris', bank='bank_inggris', ikon='💬', aksen='#e8590c', latar='#fff4e6', bersama=True,
                          desk='Balapan menyusuri kota. Jawaban bahasa Inggris yang tepat berlari maju satu blok menuju garis finis.'),
}
SEGERA = [('Coding Quest', 'Informatika', '🤖')]

IKLAN = (f'<a class="iklanWillo" href="https://www.willoapparel.com/kaos-kelas.html?utm_source=game-smp" target="_blank" rel="noopener">'
         '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 8l-14 7-6 14 9 4 3-6v31h36V27l3 6 9-4-6-14-14-7c-1 5-5 8-10 8s-9-3-10-8z" fill="#ffd43b" stroke="#1f2a5a" stroke-width="2.5" stroke-linejoin="round"/>'
         '<text x="32" y="44" text-anchor="middle" font-size="13" font-weight="900" fill="#1f2a5a" font-family="sans-serif">IX-A</text></svg>'
         f'<span><b>Kaos kelas custom, pesan mulai 1 pcs</b><i>Desain gratis · WA {WA}</i></span><em>Lihat</em></a>')

CSS = r"""
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%;overflow:hidden;background:var(--latar);font-family:'Baloo 2','Trebuchet MS',system-ui,sans-serif;color:#1d2b44;touch-action:manipulation;user-select:none;-webkit-user-select:none}
button{font-family:inherit;color:inherit}
#layar{position:fixed;inset:0;width:100%;height:100%;display:block}
[hidden]{display:none!important}
.layar{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:max(14px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));z-index:5}
.redup{background:rgba(20,30,45,.55)}
.kotak{background:#fff;border-radius:26px;padding:22px;box-shadow:0 10px 0 rgba(0,0,0,.15);max-width:560px;width:100%;max-height:100%;overflow:auto;text-align:center}
.kotak h1,.kotak h2{margin:0 0 6px;color:var(--aksen);line-height:1.05}.kotak h1{font-size:clamp(30px,6vw,44px)}.kotak h2{font-size:clamp(24px,4vw,32px)}
.besar{border:0;border-radius:22px;background:var(--aksen);color:#fff!important;font-size:clamp(20px,3vw,28px);font-weight:800;padding:10px 32px;box-shadow:0 6px 0 rgba(0,0,0,.22);cursor:pointer}
.besar:active,.kecil:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.2)}
.besar.abu{background:#495057}.besar:disabled{opacity:.45;cursor:default}
.kecil{border:0;border-radius:14px;background:#e9ecef;font-size:16px;font-weight:800;padding:8px 14px;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.12)}
.kecil.utama{background:var(--aksen);color:#fff}
.dukung{margin-top:12px;padding:4px 14px;border-radius:99px;background:rgba(255,255,255,.94);font-size:14px;font-weight:700;color:#666!important;text-decoration:none}.dukung b{color:#e8590c}
.gInfo{font-size:14px;color:#5a6b85;font-family:system-ui,sans-serif;line-height:1.4}
.lbl{font-size:13px;font-weight:800;color:#868e96;letter-spacing:.8px;text-transform:uppercase;margin-top:8px}.lbl small{text-transform:none;letter-spacing:0;font-weight:600}
.seg{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.seg button{border:3px solid #e9ecef;background:#fff;border-radius:12px;padding:4px 12px;font-size:17px;font-weight:800;cursor:pointer}
.seg button.on{background:var(--aksen);border-color:var(--aksen);color:#fff}
/* iklan Willo */
.iklanWillo{display:flex;align-items:center;gap:10px;background:#fff;border-radius:16px;padding:8px 12px;text-decoration:none;color:#1f2a5a!important;box-shadow:0 4px 0 rgba(0,0,0,.12);max-width:420px;text-align:left}
.iklanWillo svg{width:44px;height:44px;flex:none}.iklanWillo span{display:flex;flex-direction:column;line-height:1.15;flex:1}.iklanWillo b{font-size:16px}.iklanWillo i{font-style:normal;font-size:13px;color:#5a6b85;font-family:system-ui,sans-serif}
.iklanWillo em{font-style:normal;background:#e8590c;color:#fff;border-radius:10px;padding:3px 10px;font-weight:800;font-size:14px}
/* judul */
#lJudul{flex-direction:column;justify-content:space-between;background:linear-gradient(180deg,rgba(255,255,255,.4),rgba(255,255,255,0) 32%);padding-top:calc(26px + env(safe-area-inset-top));padding-bottom:calc(18px + env(safe-area-inset-bottom))}
.jAtas{text-align:center;animation:jatuh .8s cubic-bezier(.3,1.7,.5,1) both}
.jSeri{display:inline-block;background:#fff;border-radius:99px;padding:3px 16px;font-weight:800;color:#555;font-size:clamp(14px,2.4vw,18px);box-shadow:0 4px 0 rgba(0,0,0,.1)}
#jJudul{margin:6px 0 8px;font-size:clamp(46px,10vw,96px);line-height:1;font-weight:800}
#jJudul .kata{white-space:nowrap;font-weight:inherit}#jJudul span{display:inline-block;animation:loncat 1.8s ease-in-out infinite;text-shadow:0 3px 0 #fff,0 -3px 0 #fff,3px 0 0 #fff,-3px 0 0 #fff,0 8px 0 rgba(0,0,0,.18)}
#jAjak{display:inline-block;margin:0;background:#fff;border-radius:99px;padding:6px 18px;font-size:clamp(16px,2.6vw,21px);font-weight:700;box-shadow:0 5px 0 rgba(0,0,0,.12);max-width:92vw}
.jBawah{display:flex;flex-direction:column;align-items:center;gap:10px}
#bMulai{font-size:clamp(30px,6vw,40px);padding:12px 60px;border:6px solid #fff;animation:denyut 1.3s ease-in-out infinite}
@keyframes jatuh{from{transform:translateY(-60px) scale(.7);opacity:0}to{transform:none;opacity:1}}
@keyframes loncat{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-10px) rotate(-4deg)}}
@keyframes denyut{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
/* pengaturan */
#lAtur{background:var(--latar)}
#lAtur .kotak,#lTim .kotak{max-width:1000px;text-align:left;display:flex;flex-direction:column;gap:10px}
.aGrid{display:grid;grid-template-columns:1fr 1.15fr;gap:12px 24px}
@media (max-width:760px){.aGrid{grid-template-columns:1fr}}
#aTopik{display:flex;flex-direction:column;gap:6px;max-height:42vh;overflow:auto;margin-top:4px}
.pilT{display:flex;justify-content:space-between;align-items:center;gap:8px;text-align:left;border:3px solid #e9ecef;background:#fff;border-radius:14px;padding:6px 12px;font-size:17px;font-weight:800;cursor:pointer}
.pilT small{font-size:14px;color:#868e96;white-space:nowrap}.pilT.on{border-color:var(--aksen);background:var(--latar)}.pilT.on small{color:var(--aksen)}
.cara{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px}
.pilC{display:flex;flex-direction:column;gap:2px;text-align:left;border:3px solid #e9ecef;background:#fff;border-radius:16px;padding:10px 12px;cursor:pointer}
.pilC b{font-size:18px}.pilC small{font-size:13.5px;color:#5a6b85;font-family:system-ui,sans-serif;line-height:1.3}
.pilC.on{border-color:var(--aksen);background:var(--latar)}.pilC.mati{opacity:.55}
.aBaris{display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap;position:sticky;bottom:-22px;background:#fff;padding:8px 0 4px;z-index:2}
/* tim */
.tGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
.tKartu{border:4px solid var(--w);border-radius:18px;padding:10px;display:flex;flex-direction:column;gap:6px}
.tKartu input{font-family:inherit;font-size:20px;font-weight:800;color:var(--w);border:2px solid #dee2e6;border-radius:12px;padding:4px 10px;width:100%}
.tKunci{font-size:14px;color:#5a6b85}
/* lobi HP */
#lLobi{align-items:flex-start}
.lobi{display:grid;grid-template-columns:minmax(260px,.75fr) 1.4fr;gap:16px;width:100%;max-width:1300px;margin:0 auto;max-height:64vh}
@media (max-width:820px){.lobi{grid-template-columns:1fr;overflow:auto}}
.lKiri,.lKanan{background:rgba(255,255,255,.96);border-radius:26px;padding:14px 18px;box-shadow:0 10px 0 rgba(0,0,0,.15);display:flex;flex-direction:column;gap:10px;min-width:0}
.lKiri{align-items:center;text-align:center}
#lQR canvas{width:min(26vh,260px);height:auto;image-rendering:pixelated;border-radius:12px}
#lAlamat{font-size:clamp(24px,3.6vw,40px);font-weight:800;color:#1d2b44;line-height:1;user-select:text;-webkit-user-select:text}
.lLangkah{font-size:16px;text-align:left;margin:0;padding-left:20px;font-family:system-ui,sans-serif;line-height:1.45}
#lJumlah{font-size:clamp(22px,3vw,30px);font-weight:800;color:var(--aksen)}
#lDaftar{display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start;overflow:auto;flex:1;min-height:120px}
#lDaftar .nm{border:3px solid #e9ecef;background:#f8f9fa;border-radius:99px;padding:2px 12px;font-size:17px;font-weight:800;cursor:pointer;animation:muncul .3s}
#lDaftar .nm.off{opacity:.45}
.lTim{width:100%;border-left:8px solid var(--w);padding:2px 0 6px 10px}.lTim b{color:var(--w);font-size:18px}.lTim>div{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
@keyframes muncul{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}
/* HUD */
#hud{position:fixed;top:max(10px,env(safe-area-inset-top));right:max(10px,env(safe-area-inset-right));display:flex;gap:8px;z-index:6}
#hud button{width:44px;height:44px;border-radius:50%;border:0;background:#fff;font-size:19px;box-shadow:0 4px 0 rgba(0,0,0,.15);cursor:pointer;display:grid;place-items:center;font-weight:800}
#papan{position:fixed;left:max(12px,env(safe-area-inset-left));top:max(12px,env(safe-area-inset-top));background:rgba(255,255,255,.94);border-radius:18px;padding:8px 12px;min-width:200px;max-width:26vw;z-index:4;box-shadow:0 5px 0 rgba(0,0,0,.12);font-variant-numeric:tabular-nums}
#papan .pbJudul{font-size:13px;font-weight:800;color:#868e96;letter-spacing:.6px;text-transform:uppercase}
#papan div:not(.pbJudul){display:flex;justify-content:space-between;gap:10px;font-size:17px;font-weight:700}#papan span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#papan i,.tt{display:inline-block;width:12px;height:12px;border-radius:4px;margin-right:5px;vertical-align:-1px}
#alamatKecil{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));background:#1d2b44;color:#fff;border-radius:99px;padding:4px 14px;font-weight:800;font-size:17px;z-index:4}
/* kartu soal */
#kartu{position:fixed;top:max(10px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:min(860px,calc(100vw - 2*max(240px,26vw)));min-width:min(560px,94vw);z-index:4;background:#fff;border-radius:24px;padding:10px 16px 14px;box-shadow:0 8px 0 rgba(0,0,0,.14);display:flex;flex-direction:column;gap:8px}
@media (max-width:1100px){#kartu{top:auto;bottom:max(10px,env(safe-area-inset-bottom));width:96vw;min-width:0}#papan{max-width:40vw}}
.kAtas{display:flex;justify-content:space-between;align-items:center;font-weight:800;color:#868e96;font-size:15px}
#kDetik{background:#1d2b44;color:#fff;border-radius:99px;min-width:46px;text-align:center;padding:0 10px;font-size:20px}
#kTeks{font-size:clamp(22px,2.6vw,38px);font-weight:800;line-height:1.15;text-align:center}
#kTeks.panjang{font-size:clamp(18px,2vw,30px)}
#kOpsi{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.op{display:flex;align-items:center;gap:10px;background:#f1f3f5;border-radius:16px;padding:6px 10px;font-size:clamp(18px,2vw,28px);font-weight:800;line-height:1.1;min-height:50px;transition:opacity .3s,background .3s}
.op i{font-style:normal;color:#fff;border-radius:10px;min-width:1.6em;height:1.6em;display:grid;place-items:center;flex:none}
.op.benar{background:#b2f2bb;animation:goyang .5s}.op.pudar{opacity:.35}
@keyframes goyang{30%{transform:scale(1.05)}}
#kWaktu{height:9px;border-radius:99px;background:#e9ecef;overflow:hidden}#kWaktu i{display:block;height:100%;background:#51cf66;transition:width .1s linear}#kWaktu.kritis i{background:#ff6b6b}
.kBawah{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
#hitungJawab{font-weight:800;font-size:18px;color:#1d2b44}
/* jawab tim (layar) */
#jawabTim{position:fixed;left:0;right:0;margin:0 auto;width:fit-content;bottom:max(10px,env(safe-area-inset-bottom));display:flex;gap:10px;z-index:4;flex-wrap:wrap;justify-content:center;max-width:98vw}
@media (max-width:1100px){#jawabTim{bottom:auto;top:max(10px,env(safe-area-inset-top))}}
.jt{background:#fff;border-radius:18px;border-top:8px solid var(--w);padding:6px 10px 8px;box-shadow:0 5px 0 rgba(0,0,0,.14);display:flex;flex-direction:column;align-items:center;gap:4px;position:relative}
.jt b{color:var(--w);font-size:18px;line-height:1}
.jt>div{display:flex;gap:6px}
.jt button{border:0;background:#f1f3f5;border-radius:12px;padding:4px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;box-shadow:0 3px 0 rgba(0,0,0,.12)}
.jt button i{font-style:normal;color:#fff;border-radius:9px;width:42px;height:38px;display:grid;place-items:center;font-size:22px;font-weight:800}
.jt button small{font-size:12px;color:#868e96;font-weight:800}
.jt.sudah button{opacity:.3}.jt.sudah button.pil{opacity:1;outline:3px solid var(--w)}
.jt .cek{position:absolute;inset:0;display:grid;place-items:center;font-size:20px;font-weight:800;color:var(--w);background:rgba(255,255,255,.72);border-radius:18px}
/* pembahasan */
#pembahasan{position:fixed;left:50%;transform:translateX(-50%);bottom:max(14px,env(safe-area-inset-bottom));background:#fff;border-radius:22px;padding:12px 18px;box-shadow:0 8px 0 rgba(0,0,0,.15);z-index:5;width:min(760px,94vw);display:flex;gap:14px;align-items:center;animation:muncul .3s}
#pIsi{flex:1;display:flex;flex-direction:column;gap:2px}.pJudul{font-size:clamp(18px,2vw,26px);font-weight:800;line-height:1.1}.pJelas{font-family:system-ui,sans-serif;font-size:clamp(14px,1.5vw,18px);line-height:1.35}.pStat{font-weight:800;color:#5a6b85}
/* tata letak saat bermain: arena 3D dan panel soal terpisah, tidak saling menutupi */
#sisi{display:contents}
body.bermain #sisi{display:flex;flex-direction:column;gap:10px;position:fixed;z-index:4;overflow:auto;background:#eaf3fb;padding:12px;
  right:0;top:0;bottom:0;width:var(--sisiW,400px);border-left:4px solid #d0e2f2}
body.bermain #sisi>*{position:static;transform:none;left:auto;right:auto;top:auto;bottom:auto;margin:0;width:auto;min-width:0;max-width:none;box-shadow:0 4px 0 rgba(0,0,0,.1)}
body.bermain #kTeks{font-size:clamp(20px,2vw,30px)}body.bermain #kTeks.panjang{font-size:clamp(17px,1.6vw,24px)}
body.bermain .op{font-size:clamp(17px,1.6vw,24px);min-height:46px}
body.bermain #jawabTim{display:grid;grid-template-columns:1fr 1fr;gap:8px}body.bermain #jawabTim[hidden]{display:none}
body.bermain .jt{padding:5px 6px 7px;min-width:0}body.bermain .jt>div{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;width:100%}body.bermain .jt button{padding:3px;min-width:0}body.bermain .jt button i{width:100%;max-width:40px;height:32px;font-size:19px}
body.bermain #pembahasan{flex-direction:column;align-items:stretch;animation:none}
body.bermain #papan{flex:none}
body.bermain #hud{right:auto;left:max(10px,env(safe-area-inset-left))}
body.bermain #alamatKecil{left:max(12px,env(safe-area-inset-left))}
body.bermain.tegak #sisi{left:0;right:0;top:auto;width:auto;height:var(--sisiH,52vh);border-left:0;border-top:4px solid #d0e2f2}
body.bermain.tegak #kOpsi{grid-template-columns:1fr 1fr}
body.bermain.tegak #alamatKecil{bottom:calc(var(--sisiH,52vh) + 10px)}
/* akhir */
#lAkhir{flex-direction:column;justify-content:center;align-items:flex-end;gap:8px;padding-right:max(24px,env(safe-area-inset-right))}
#lAkhir .kotak{max-width:470px;padding:14px 18px;max-height:76vh;display:flex;flex-direction:column;overflow:hidden}
#lAkhir #akIsi{overflow:auto;min-height:0;flex:1}
#lAkhir .hTombol{flex-wrap:wrap;justify-content:center;gap:8px;margin-top:8px}
#lAkhir .hTombol .besar{font-size:18px;padding:10px 16px}
@media (max-width:800px){#lAkhir{align-items:center;justify-content:flex-end}}
.hTabel{border-collapse:collapse;margin:4px auto 0;font-size:clamp(15px,1.6vw,19px);font-variant-numeric:tabular-nums}.hTabel td{padding:1px 10px;text-align:left}.hTabel td:last-child{text-align:right}
.hTombol{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px}
/* jeda, bantuan, beli */
#lJeda .kotak,#lBantu .kotak,#lBeli .kotak{max-width:460px}
#bantuIsi{text-align:left;font-family:system-ui,sans-serif;font-size:16px;line-height:1.5}#bantuIsi li{margin:4px 0}
#lBeli .kotak{display:flex;flex-direction:column;gap:10px;align-items:center}
/* Mode guru */
#guruGerbang .kotak{max-width:340px}#gJawab{font-size:28px;width:130px;text-align:center;border:2px solid #ccc;border-radius:14px;padding:6px;margin:6px 0 14px;font-family:inherit}
#panelGuru{align-items:stretch;user-select:text;-webkit-user-select:text;z-index:9}
#panelGuru .kotak{max-width:1180px;text-align:left;display:flex;flex-direction:column;gap:6px;padding:16px}
.gGulir{overflow:auto;flex:1 1 auto;min-height:160px;border:1px solid #eee;border-radius:12px}
#guruTabel{border-collapse:collapse;width:100%;font-size:15px;font-family:system-ui,sans-serif}
#guruTabel th{position:sticky;top:0;background:var(--latar);text-align:left;padding:6px;z-index:1}
#guruTabel td{padding:2px 3px;border-top:1px solid #f0f0f0}
#guruTabel input{width:100%;font-family:inherit;font-size:15px;border:1px solid #ddd;border-radius:7px;padding:4px 6px;min-width:56px}
#guruTabel .c-soal input{min-width:240px}#guruTabel .c-jelas input{min-width:180px}#guruTabel .c-topik input{min-width:130px}#guruTabel .c-kunci input,#guruTabel .c-kelas input{min-width:44px;width:52px}
.gHapus{border:0;background:#ffe3e3;border-radius:8px;cursor:pointer;padding:4px 8px}
#guruExcel{width:100%;height:60px;font-family:monospace;font-size:13px;border:1px solid #ddd;border-radius:10px;padding:6px}
.gBaris{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
#guruSaring{font-family:inherit;font-size:16px;border:1px solid #ddd;border-radius:10px;padding:5px 8px}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
"""

HTML = r"""<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<title>{judul} · Dunia Kotak SMP</title>
<meta name="description" content="{desk} Game {mapel} SMP kelas 7, 8, 9 untuk dimainkan berkelompok atau satu kelas lewat HP, bergaya Dunia Kotak.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap" rel="stylesheet">
<style>:root{{--aksen:{aksen};--latar:{latar}}}{css}</style>
<!-- BANK SOAL: guru boleh mengubah bagian ini langsung, atau lewat tombol "Mode Guru" di layar pengaturan. -->
<script type="application/json" id="data-soal">
{data}
</script>
<script>window.PAKET_BELI='{link_beli}'</script>
</head>
<body data-layar="lJudul">
<canvas id="layar"></canvas>
<div id="hud" hidden><button id="bSuara" title="Suara">🎵</button><button id="bLayarPenuh" title="Layar penuh">⛶</button><button id="bJeda" title="Jeda">❚❚</button><button id="bBantu" title="Bantuan">?</button></div>
<div id="alamatKecil" hidden></div>
<div id="sisi">
<div id="kartu" hidden>
  <div class="kAtas"><span id="kNo"></span><span id="kDetik">30</span></div>
  <div id="kTeks"></div><div id="kOpsi"></div>
  <div id="kWaktu"><i></i></div>
  <div class="kBawah"><span id="hitungJawab" hidden></span><button class="kecil utama" id="bBuka">Buka jawaban ▶</button></div>
</div>
<div id="jawabTim" hidden></div>
<div id="pembahasan" hidden><div id="pIsi"></div><button class="besar" id="pLanjut">Lanjut ▶</button></div>
<div id="papan" hidden></div>
</div>

<div class="layar" id="lJudul">
  <div class="jAtas"><span class="jSeri">{ikon} Dunia Kotak SMP · {mapel} kelas 7, 8, 9</span><h1 id="jJudul">{judul}</h1><p id="jAjak"></p></div>
  <div class="jBawah"><button class="besar" id="bMulai">▶ Mulai</button>{iklan}<a class="dukung" href="https://www.willoapparel.com" target="_blank" rel="noopener">Supported by <b>www.willoapparel.com</b></a></div>
</div>
<div class="layar" id="lAtur" hidden><div class="kotak">
  <h2>Pengaturan</h2>
  <div class="aGrid"><div id="aKiri"></div><div id="aKanan"></div></div>
  <div class="aBaris"><button class="kecil" id="aGuru">✎ Mode Guru: ubah soal</button><button class="besar" id="aLanjut">Lanjut ▶</button></div>
</div></div>
<div class="layar" id="lTim" hidden><div class="kotak">
  <h2>Kelompok di layar ini</h2><div id="tIsi"></div>
  <div class="aBaris"><button class="kecil" id="tKembali">⟵ Pengaturan</button><button class="besar" id="tMulai">▶ Mulai main</button></div>
</div></div>
<div class="layar" id="lLobi" hidden><div class="lobi">
  <div class="lKiri">
    <h2 style="margin:0;color:var(--aksen)">Masuk lewat HP</h2>
    <div id="lQR"></div>
    <div class="gInfo">atau ketik di browser HP:</div><div id="lAlamat"></div>
    <ol class="lLangkah"><li>Sambungkan HP ke <b>WiFi yang sama</b> dengan laptop ini.</li><li>Scan QR atau ketik alamat di atas.</li><li>Tulis nama, pilih avatar, lalu tunggu guru menekan Mulai.</li></ol>
    <div id="lJaringan" class="gInfo"></div>
  </div>
  <div class="lKanan">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span id="lJumlah"></span><div id="lAtur2"></div></div>
    <div id="lDaftar"></div>
    <div class="gInfo">Ketuk nama untuk mengeluarkan murid (misalnya nama tidak pantas). Murid yang terputus bisa masuk lagi dengan HP yang sama.</div>
    <div class="aBaris" style="position:static"><button class="kecil" id="lKembali">⟵ Pengaturan</button>{iklan}<button class="besar" id="lMulai">▶ Mulai</button></div>
    <a class="dukung" style="align-self:center" href="https://www.willoapparel.com" target="_blank" rel="noopener">Supported by <b>www.willoapparel.com</b></a>
  </div>
</div></div>
<div class="layar" id="lAkhir" hidden>
  <div class="kotak"><h1 id="akJudul"></h1><div id="akIsi"></div>
    <div class="hTombol"><button class="besar" id="akUnduh">⬇ Unduh nilai (Excel)</button><button class="besar" id="akUlang">↻ Main lagi</button><button class="besar abu" id="akAtur">⚙ Pengaturan</button></div></div>
  {iklan}<a class="dukung" href="https://www.willoapparel.com" target="_blank" rel="noopener">Supported by <b>www.willoapparel.com</b></a>
</div>
<div class="layar redup" id="lJeda" hidden><div class="kotak"><h2>⏸ Jeda</h2><p style="font-size:18px;margin:0 0 14px">Permainan berhenti sebentar.</p>
  <div class="hTombol"><button class="besar" id="jLanjut">▶ Lanjut</button><button class="besar abu" id="jMenu">⚙ Pengaturan</button></div></div></div>
<div class="layar redup" id="lBantu" hidden><div class="kotak"><h2>Cara bermain</h2><div id="bantuIsi"></div><button class="besar" id="bantuTutup">Mengerti</button></div></div>
<div class="layar redup" id="lBeli" hidden><div class="kotak">
  <h2>Suka dengan {judul}?</h2><p id="beliAlasan" style="margin:0;font-size:17px"></p>
  <p class="gInfo" style="margin:0">Paket lengkap untuk guru berisi 4 game SMP (Matematika, IPA, Bahasa Inggris, Informatika), semua soal kelas 7, 8, 9, mode satu kelas lewat HP dengan laptop guru sebagai server, Mode Guru untuk ganti soal, dan jalan tanpa internet.</p>
  <a class="besar" id="beliLink" href="#" target="_blank" rel="noopener" style="text-decoration:none">🛒 Lihat paket game</a>
  <button class="kecil" id="beliTutup">Kembali</button>
  <a class="dukung" href="https://www.willoapparel.com" target="_blank" rel="noopener">Supported by <b>www.willoapparel.com</b></a>
</div></div>
<div class="layar redup" id="guruGerbang" hidden><div class="kotak">
  <h2>Mode Guru</h2><div id="gTanya" style="font-size:18px"></div>
  <input id="gJawab" inputmode="numeric" autocomplete="off"><br>
  <button class="kecil utama" id="gMasuk">Masuk</button> <button class="kecil" id="gBatal">Batal</button>
</div></div>
<div class="layar redup" id="panelGuru" hidden><div class="kotak">
  <h2 style="margin:0">Mode Guru: bank soal {mapel}</h2>
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
  <div class="gInfo">“Simpan & pakai” menyimpan soal di laptop ini. “Unduh HTML” membuat file game baru berisi soal Anda.</div>
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


def data_game(m):
    """bank soal lengkap + versi contoh (5 soal per kelas, untuk situs) satu game"""
    import importlib
    soal = importlib.import_module(m['bank']).bank()
    data = {'judul': f'Bank soal {m["mapel"]} SMP', 'mapel': m['kunci'], 'soal': soal}
    data['sidik'] = 'bawaan-' + hashlib.sha1(json.dumps(soal, sort_keys=True).encode()).hexdigest()[:10]
    jsn = lambda d: json.dumps(d, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('},{', '},\n{')
    contoh = []
    for k in ('7', '8', '9'):
        per = [x for x in soal if str(x['kelas']) == k]
        topik = []
        for x in per:
            if x['topik'] not in topik:
                topik.append(x['topik'])
        contoh += [next(x for x in per if x['topik'] == t) for t in topik[:5]]
    return jsn(data), jsn({**data, 'soal': contoh, 'varian': 'contoh', 'sidik': 'contoh'}), len(soal)


def rakit_game():
    total = 0
    inti = (AKAR / 'src' / 'inti.js').read_text()
    DIST.mkdir(parents=True, exist_ok=True)
    for gid, m in GAME.items():
        data_json, data_contoh, n = data_game(m)
        total += n
        src = (AKAR / 'src' / f'{gid}.js').read_text()
        if m.get('bersama'):
            src = (AKAR / 'src' / 'bersama.js').read_text() + '\n' + src
        kode = bundel(inti + '\n// ================= GAME: ' + gid + ' =================\n' + src, gid)
        html = HTML.format(css=CSS, data=data_json, kode=kode, iklan=IKLAN, link_beli=LINK_BELI, **m)
        situs = HTML.format(css=CSS, data=data_contoh, kode=kode, iklan=IKLAN, link_beli=LINK_BELI, **m)
        out = KELUAR / gid / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(situs)
        (DIST / f'{gid}.html').write_text(html)
        (AKAR / 'keluar').mkdir(exist_ok=True)
        (AKAR / 'keluar' / f'{gid}.html').write_text(html)  # untuk paket: dibuka langsung tanpa aplikasi
        print('✓', out.relative_to(AKAR.parent.parent), f'{len(html) // 1024} KB', f'{n} soal')
    murid = (AKAR / 'src' / 'murid.html').read_text().replace('{{IKLAN}}', IKLAN.replace('game-smp', 'game-smp-hp'))
    (DIST / 'murid.html').write_text(murid)
    print('✓ server/dist/murid.html', f'{len(murid) // 1024} KB')
    kartu = ''.join(f'<a class="k" style="--w:{m["aksen"]}" href="/{gid}/"><div class="ik">{m["ikon"]}</div><small>{m["mapel"]}</small><h2>{m["judul"]}</h2><p>{m["desk"]}</p><b class="main">▶ Mainkan</b></a>' for gid, m in GAME.items())
    kartu += ''.join(f'<div class="k segera"><div class="ik">{ik}</div><small>{mp}</small><h2>{jd}</h2><p>Segera hadir di pembaruan paket.</p></div>' for jd, mp, ik in SEGERA)
    (DIST / 'menu.html').write_text(MENU.replace('{kartu}', kartu).replace('{iklan}', IKLAN))
    print('✓ server/dist/menu.html')
    return total


def rakit_server():
    keluar = AKAR / 'keluar'
    keluar.mkdir(exist_ok=True)
    target = [('windows', 'amd64', 'KelasDuniaKotak-Windows.exe'), ('darwin', 'arm64', 'KelasDuniaKotak-Mac-AppleSilicon'),
              ('darwin', 'amd64', 'KelasDuniaKotak-Mac-Intel'), ('linux', 'amd64', 'KelasDuniaKotak-Linux')]
    for goos, arch, nama in target:
        env = {**os.environ, 'GOOS': goos, 'GOARCH': arch, 'CGO_ENABLED': '0'}
        subprocess.run(['go', 'build', '-trimpath', '-ldflags=-s -w', '-o', str(keluar / nama), '.'], cwd=AKAR / 'server', check=True, env=env)
        print('✓ keluar/' + nama, f'{(keluar / nama).stat().st_size // 1024 // 1024} MB')


MENU = r"""<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kelas Dunia Kotak · Paket Game SMP</title>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;background:#eaf6ff;color:#1d2b44;font-family:'Baloo 2','Trebuchet MS',system-ui,sans-serif;padding:24px max(16px,env(safe-area-inset-right)) 40px max(16px,env(safe-area-inset-left))}
h1{text-align:center;margin:4px 0 0;font-size:clamp(34px,6vw,56px);line-height:1}h1 b{color:#e8590c}h1 i{font-style:normal;color:#1c7ed6}
p.sub{text-align:center;margin:6px auto 20px;font-size:18px;color:#5a6b85;max-width:700px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;max-width:1100px;margin:0 auto}
.k{display:flex;flex-direction:column;gap:2px;background:#fff;border-radius:24px;padding:18px;text-decoration:none;color:inherit;box-shadow:0 7px 0 rgba(0,0,0,.12);border-top:10px solid var(--w,#adb5bd)}
.k .ik{font-size:46px;line-height:1}.k small{font-weight:800;color:#868e96;text-transform:uppercase;letter-spacing:.6px}.k h2{margin:0;font-size:28px;color:var(--w,#495057)}.k p{margin:0;font-size:16px;line-height:1.35;flex:1}
.k .main{margin-top:8px;background:var(--w);color:#fff;border-radius:14px;padding:6px 14px;align-self:flex-start;font-size:18px}
.segera{opacity:.6}
.cat{max-width:760px;margin:22px auto 0;font-size:16px;color:#5a6b85;text-align:center;line-height:1.45}
.iklanWillo{display:flex;align-items:center;gap:10px;background:#fff;border-radius:16px;padding:8px 12px;text-decoration:none;color:#1f2a5a;box-shadow:0 4px 0 rgba(0,0,0,.12);max-width:420px;margin:18px auto 0}
.iklanWillo svg{width:44px;height:44px;flex:none}.iklanWillo span{display:flex;flex-direction:column;line-height:1.15;flex:1}.iklanWillo i{font-style:normal;font-size:13px;color:#5a6b85}
.iklanWillo em{font-style:normal;background:#e8590c;color:#fff;border-radius:10px;padding:3px 10px;font-weight:800}
.dukung{display:block;text-align:center;margin-top:14px;color:#e8590c;font-weight:800;text-decoration:none}
</style></head><body>
<h1><b>Kelas</b> <i>Dunia Kotak</i></h1><p class="sub">Paket game SMP untuk main bersama satu kelas. Pilih game, tampilkan layar ini ke proyektor, lalu murid masuk lewat HP.</p>
<div class="grid">{kartu}</div>
<p class="cat">Biarkan jendela hitam aplikasi tetap terbuka selama kelas berlangsung. Menutupnya akan menghentikan permainan.</p>
{iklan}
<a class="dukung" href="https://www.willoapparel.com" target="_blank" rel="noopener">Supported by www.willoapparel.com</a>
</body></html>
"""

if __name__ == '__main__':
    n = rakit_game()
    print(f'  bank soal bawaan: {n} soal')
    if '--server' in sys.argv:
        rakit_server()
