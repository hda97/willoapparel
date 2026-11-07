#!/usr/bin/env python3
"""
Bot Meme Coin Solana - MODE PAPER TRADING (uang bohongan).

Yang dilakukan bot ini:
  1. Memantau token Solana yang baru muncul / sedang dipromosikan di DexScreener.
  2. Menyaring token berbahaya (likuiditas kecil, umur terlalu muda, kontrak
     masih bisa cetak/bekukan koin, pemegang besar dominan, LP tidak dikunci,
     tanda rug pull dari RugCheck).
  3. "Membeli" token yang lolos pakai saldo bohongan, lalu menjual otomatis
     saat take profit, stop loss, trailing stop, waktu tahan habis, atau
     likuiditas tiba-tiba anjlok.
  4. Mencatat semua transaksi ke riwayat_transaksi.csv.

Bot ini TIDAK memegang private key dan TIDAK bisa bertransaksi sungguhan.

Cara pakai:
  python bot.py            -> jalan terus (pemantauan + paper trading)
  python bot.py --sekali   -> satu putaran saja lalu berhenti
  python bot.py --laporan  -> ringkasan hasil paper trading
  python bot.py --reset    -> mulai ulang saldo bohongan dari awal

Tombol berhenti: buat file bernama STOP di folder ini, bot berhenti di
putaran berikutnya. Hapus file STOP untuk menjalankan lagi.

Hanya memakai pustaka bawaan Python 3.9+, tidak perlu install apa pun.
"""

import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone, timedelta

# Folder data (config, status, riwayat). Bisa diganti lewat env BOT_FOLDER
# supaya beberapa varian strategi jalan berdampingan.
FOLDER = os.path.abspath(os.environ.get("BOT_FOLDER") or os.path.dirname(os.path.abspath(__file__)))
FILE_CONFIG = os.path.join(FOLDER, "config.json")
FILE_STATE = os.path.join(FOLDER, "status_paper.json")
FILE_RIWAYAT = os.path.join(FOLDER, "riwayat_transaksi.csv")
FILE_LOG = os.path.join(FOLDER, "log_bot.txt")
FILE_STOP = os.path.join(FOLDER, "STOP")

WIB = timezone(timedelta(hours=7))

DEX = "https://api.dexscreener.com"
RUGCHECK = "https://api.rugcheck.xyz/v1"

CONFIG_DEFAULT = {
    "saldo_awal_usd": 100.0,
    "ukuran_beli_usd": 10.0,
    "maks_posisi_terbuka": 3,
    "biaya_dan_slippage_persen": 2.0,
    "jeda_putaran_detik": 60,

    "filter": {
        "likuiditas_min_usd": 20000,
        "umur_min_menit": 15,
        "umur_maks_jam": 48,
        "volume_1jam_min_usd": 10000,
        "transaksi_1jam_min": 50,
        "rasio_beli_jual_min": 1.1,
        "kenaikan_1jam_maks_persen": 300,
        "kenaikan_6jam_maks_persen": 100000,
        "kenaikan_5menit_maks_persen": 50,
        "pakai_rugcheck": True,
        "rugcheck_skor_maks": 50,
        "top10_pemegang_maks_persen": 35,
        "lp_terkunci_min_persen": 80,
        "tolak_jika_mint_authority_aktif": True,
        "tolak_jika_freeze_authority_aktif": True
    },

    "keluar": {
        "take_profit_persen": 40,
        "stop_loss_persen": 20,
        "trailing_stop_persen": 15,
        "trailing_aktif_setelah_naik_persen": 20,
        "maks_tahan_menit": 240,
        "jual_jika_likuiditas_turun_persen": 40
    },

    "pengaman": {
        "batas_rugi_harian_usd": 20,
        "maks_beli_per_hari": 10,
        "jeda_beli_ulang_token_jam": 24
    }
}


# ---------------------------------------------------------------- utilitas

def sekarang():
    return datetime.now(WIB)


def log(pesan):
    baris = f"[{sekarang():%Y-%m-%d %H:%M:%S}] {pesan}"
    print(baris, flush=True)
    try:
        with open(FILE_LOG, "a", encoding="utf-8") as f:
            f.write(baris + "\n")
    except OSError:
        pass


def gabung_dict(dasar, tambahan):
    hasil = dict(dasar)
    for k, v in (tambahan or {}).items():
        if isinstance(v, dict) and isinstance(hasil.get(k), dict):
            hasil[k] = gabung_dict(hasil[k], v)
        else:
            hasil[k] = v
    return hasil


def muat_config():
    if not os.path.exists(FILE_CONFIG):
        with open(FILE_CONFIG, "w", encoding="utf-8") as f:
            json.dump(CONFIG_DEFAULT, f, indent=2)
        return CONFIG_DEFAULT
    with open(FILE_CONFIG, encoding="utf-8") as f:
        return gabung_dict(CONFIG_DEFAULT, json.load(f))


def angka(x, default=0.0):
    try:
        return float(x)
    except (TypeError, ValueError):
        return default


def ambil_json(url, timeout=15):
    """GET JSON dengan sekali coba ulang. Mengembalikan None jika gagal."""
    req = urllib.request.Request(url, headers={
        "User-Agent": "paper-trading-bot/1.0",
        "Accept": "application/json",
    })
    for percobaan in range(2):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(5)
                continue
            if e.code == 404:
                return None
            log(f"  ! HTTP {e.code} dari {url[:80]}")
            return None
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as e:
            if percobaan == 0:
                time.sleep(2)
                continue
            log(f"  ! Gagal ambil {url[:80]}: {e}")
            return None
    return None


# ---------------------------------------------------------------- state

def state_baru(cfg):
    return {
        "saldo_usd": cfg["saldo_awal_usd"],
        "saldo_awal_usd": cfg["saldo_awal_usd"],
        "posisi": {},
        "terakhir_dibeli": {},
        "harian": {},
        "dibuat": sekarang().isoformat(),
    }


def muat_state(cfg):
    if os.path.exists(FILE_STATE):
        with open(FILE_STATE, encoding="utf-8") as f:
            return json.load(f)
    return state_baru(cfg)


def simpan_state(state):
    tmp = FILE_STATE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
    os.replace(tmp, FILE_STATE)


def data_hari_ini(state):
    kunci = sekarang().strftime("%Y-%m-%d")
    return state["harian"].setdefault(kunci, {"rugi_laba_usd": 0.0, "jumlah_beli": 0})


def catat_riwayat(baris):
    baru = not os.path.exists(FILE_RIWAYAT)
    with open(FILE_RIWAYAT, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if baru:
            w.writerow(["waktu_wib", "aksi", "simbol", "token", "harga_usd",
                        "nilai_usd", "laba_rugi_usd", "laba_rugi_persen",
                        "alasan", "link"])
        w.writerow(baris)


# ---------------------------------------------------------------- data pasar

def kandidat_token():
    """Alamat token Solana dari profil terbaru dan boost terbaru DexScreener."""
    alamat = []
    for jalur in ("/token-profiles/latest/v1", "/token-boosts/latest/v1"):
        data = ambil_json(DEX + jalur)
        if isinstance(data, dict):
            data = [data]
        for item in data or []:
            if item.get("chainId") == "solana" and item.get("tokenAddress"):
                if item["tokenAddress"] not in alamat:
                    alamat.append(item["tokenAddress"])
    return alamat


def pasangan_terbaik(daftar_alamat):
    """Ambil pasangan dengan likuiditas terbesar untuk tiap token (maks 30 per panggilan)."""
    hasil = {}
    for i in range(0, len(daftar_alamat), 30):
        potong = ",".join(daftar_alamat[i:i + 30])
        data = ambil_json(f"{DEX}/tokens/v1/solana/{potong}")
        if isinstance(data, dict):
            data = data.get("pairs") or []
        for p in data or []:
            if p.get("chainId") != "solana":
                continue
            token = (p.get("baseToken") or {}).get("address")
            if not token or token not in daftar_alamat:
                continue
            lama = hasil.get(token)
            if lama is None or angka((p.get("liquidity") or {}).get("usd")) > angka((lama.get("liquidity") or {}).get("usd")):
                hasil[token] = p
    return hasil


def ringkas_pasangan(p):
    txn_h1 = (p.get("txns") or {}).get("h1") or {}
    buys, sells = int(angka(txn_h1.get("buys"))), int(angka(txn_h1.get("sells")))
    dibuat = p.get("pairCreatedAt")
    umur_menit = (time.time() * 1000 - dibuat) / 60000 if dibuat else None
    return {
        "simbol": (p.get("baseToken") or {}).get("symbol", "?"),
        "harga": angka(p.get("priceUsd")),
        "likuiditas": angka((p.get("liquidity") or {}).get("usd")),
        "volume_1jam": angka((p.get("volume") or {}).get("h1")),
        "buys_1jam": buys,
        "sells_1jam": sells,
        "naik_5m": angka((p.get("priceChange") or {}).get("m5")),
        "naik_1jam": angka((p.get("priceChange") or {}).get("h1")),
        "naik_6jam": angka((p.get("priceChange") or {}).get("h6")),
        "umur_menit": umur_menit,
        "link": p.get("url", ""),
    }


def cek_rugcheck(token, f):
    """Mengembalikan (lolos, alasan)."""
    r = ambil_json(f"{RUGCHECK}/tokens/{token}/report")
    if not isinstance(r, dict):
        return False, "rugcheck tidak bisa dibaca (anggap berbahaya)"
    if r.get("rugged"):
        return False, "rugcheck: sudah ditandai RUGGED"
    if f["tolak_jika_mint_authority_aktif"] and r.get("mintAuthority"):
        return False, "mint authority aktif (pembuat bisa cetak koin baru)"
    if f["tolak_jika_freeze_authority_aktif"] and r.get("freezeAuthority"):
        return False, "freeze authority aktif (koin bisa dibekukan = honeypot)"
    skor = r.get("score_normalised", r.get("score"))
    if skor is not None and angka(skor) > f["rugcheck_skor_maks"]:
        return False, f"skor risiko rugcheck {angka(skor):.0f}/100 > {f['rugcheck_skor_maks']}"
    for risk in r.get("risks") or []:
        if str(risk.get("level", "")).lower() == "danger":
            return False, f"rugcheck bahaya: {risk.get('name', '?')}"
    # Abaikan akun pool AMM / locker yang dikenal (bukan pemegang sungguhan).
    dikenal = set((r.get("knownAccounts") or {}).keys())
    holders = [h for h in (r.get("topHolders") or [])
               if h.get("owner") not in dikenal and h.get("address") not in dikenal]
    if any(h.get("insider") for h in holders[:10]):
        return False, "rugcheck: ada pemegang orang dalam (insider) di 10 besar"
    if holders:
        top10 = sum(angka(h.get("pct")) for h in holders[:10])
        if top10 > f["top10_pemegang_maks_persen"]:
            return False, f"10 pemegang teratas menguasai {top10:.0f}%"
    lp = None
    for m in r.get("markets") or []:
        nilai = (m.get("lp") or {}).get("lpLockedPct")
        if nilai is not None:
            lp = max(lp or 0.0, angka(nilai))
    if lp is not None and lp < f["lp_terkunci_min_persen"]:
        return False, f"LP terkunci hanya {lp:.0f}%"
    return True, "lolos rugcheck"


def saring(info, f):
    """Filter pasar. Mengembalikan (lolos, alasan)."""
    if info["harga"] <= 0:
        return False, "harga tidak ada"
    if info["likuiditas"] < f["likuiditas_min_usd"]:
        return False, f"likuiditas ${info['likuiditas']:,.0f} terlalu kecil"
    if info["umur_menit"] is None:
        return False, "umur pasangan tidak diketahui"
    if info["umur_menit"] < f["umur_min_menit"]:
        return False, f"terlalu baru ({info['umur_menit']:.0f} menit)"
    if info["umur_menit"] > f["umur_maks_jam"] * 60:
        return False, "sudah terlalu lama"
    if info["volume_1jam"] < f["volume_1jam_min_usd"]:
        return False, f"volume 1 jam ${info['volume_1jam']:,.0f} kecil"
    total = info["buys_1jam"] + info["sells_1jam"]
    if total < f["transaksi_1jam_min"]:
        return False, f"cuma {total} transaksi/jam"
    rasio = info["buys_1jam"] / max(info["sells_1jam"], 1)
    if rasio < f["rasio_beli_jual_min"]:
        return False, f"tekanan jual (rasio beli/jual {rasio:.2f})"
    if info["sells_1jam"] == 0:
        return False, "tidak ada yang jual sama sekali (curiga honeypot)"
    if info["naik_1jam"] <= 0:
        return False, "harga 1 jam tidak naik"
    if info["naik_1jam"] > f["kenaikan_1jam_maks_persen"]:
        return False, f"sudah terbang {info['naik_1jam']:.0f}% (telat masuk)"
    if info["naik_6jam"] > f.get("kenaikan_6jam_maks_persen", 100000):
        return False, f"sudah naik {info['naik_6jam']:.0f}% dalam 6 jam (beli di pucuk)"
    if info["naik_5m"] > f["kenaikan_5menit_maks_persen"]:
        return False, f"lonjakan 5 menit {info['naik_5m']:.0f}% (rawan dump)"
    return True, "lolos filter pasar"


# ---------------------------------------------------------------- trading

def beli(state, cfg, token, info, hari):
    ukuran = min(cfg["ukuran_beli_usd"], state["saldo_usd"])
    if ukuran <= 0:
        return
    biaya = cfg["biaya_dan_slippage_persen"] / 100
    harga_efektif = info["harga"] * (1 + biaya)
    state["saldo_usd"] -= ukuran
    state["posisi"][token] = {
        "simbol": info["simbol"],
        "harga_beli": harga_efektif,
        "jumlah": ukuran / harga_efektif,
        "modal_usd": ukuran,
        "harga_tertinggi": info["harga"],
        "likuiditas_awal": info["likuiditas"],
        "waktu_beli": time.time(),
        "link": info["link"],
    }
    state["terakhir_dibeli"][token] = time.time()
    hari["jumlah_beli"] += 1
    log(f"  + BELI (bohongan) {info['simbol']} ${ukuran:.2f} @ {info['harga']:.10g} | {info['link']}")
    catat_riwayat([sekarang().strftime("%Y-%m-%d %H:%M:%S"), "BELI", info["simbol"], token,
                   f"{info['harga']:.10g}", f"{ukuran:.2f}", "", "", "", info["link"]])


def jual(state, cfg, token, harga, alasan, hari):
    pos = state["posisi"].pop(token)
    biaya = cfg["biaya_dan_slippage_persen"] / 100
    hasil = pos["jumlah"] * harga * (1 - biaya)
    laba = hasil - pos["modal_usd"]
    persen = laba / pos["modal_usd"] * 100
    state["saldo_usd"] += hasil
    hari["rugi_laba_usd"] += laba
    tanda = "UNTUNG" if laba >= 0 else "RUGI"
    log(f"  - JUAL (bohongan) {pos['simbol']} {tanda} ${laba:+.2f} ({persen:+.1f}%) karena {alasan}")
    catat_riwayat([sekarang().strftime("%Y-%m-%d %H:%M:%S"), "JUAL", pos["simbol"], token,
                   f"{harga:.10g}", f"{hasil:.2f}", f"{laba:.2f}", f"{persen:.1f}", alasan, pos["link"]])


def kelola_posisi(state, cfg, hari):
    if not state["posisi"]:
        return
    k = cfg["keluar"]
    data = pasangan_terbaik(list(state["posisi"].keys()))
    for token in list(state["posisi"].keys()):
        pos = state["posisi"][token]
        p = data.get(token)
        menit = (time.time() - pos["waktu_beli"]) / 60
        if p is None:
            # Pasangan hilang dari DexScreener: anggap rug, harga nol.
            if menit > 10:
                jual(state, cfg, token, 0.0, "pasangan hilang (kemungkinan rug pull)", hari)
            continue
        info = ringkas_pasangan(p)
        harga = info["harga"]
        if harga <= 0:
            continue
        pos["harga_tertinggi"] = max(pos["harga_tertinggi"], harga)
        naik = (harga / pos["harga_beli"] - 1) * 100
        dari_puncak = (1 - harga / pos["harga_tertinggi"]) * 100
        naik_puncak = (pos["harga_tertinggi"] / pos["harga_beli"] - 1) * 100
        turun_lp = (1 - info["likuiditas"] / pos["likuiditas_awal"]) * 100 if pos["likuiditas_awal"] else 0

        alasan = None
        if turun_lp >= k["jual_jika_likuiditas_turun_persen"]:
            alasan = f"likuiditas anjlok {turun_lp:.0f}% (tanda rug pull)"
        elif naik <= -k["stop_loss_persen"]:
            alasan = f"stop loss ({naik:.1f}%)"
        elif naik >= k["take_profit_persen"]:
            alasan = f"take profit ({naik:.1f}%)"
        elif naik_puncak >= k["trailing_aktif_setelah_naik_persen"] and dari_puncak >= k["trailing_stop_persen"]:
            alasan = f"trailing stop (turun {dari_puncak:.0f}% dari puncak)"
        elif menit >= k["maks_tahan_menit"]:
            alasan = f"waktu tahan habis ({menit:.0f} menit)"

        if alasan:
            jual(state, cfg, token, harga, alasan, hari)
        else:
            log(f"  = tahan {pos['simbol']} {naik:+.1f}% ({menit:.0f} menit)")


def boleh_beli(state, cfg, hari):
    p = cfg["pengaman"]
    if hari["rugi_laba_usd"] <= -p["batas_rugi_harian_usd"]:
        return False, f"batas rugi harian ${p['batas_rugi_harian_usd']} tercapai, tidak beli lagi sampai besok"
    if hari["jumlah_beli"] >= p["maks_beli_per_hari"]:
        return False, "jumlah beli harian maksimal tercapai"
    if len(state["posisi"]) >= cfg["maks_posisi_terbuka"]:
        return False, "posisi terbuka penuh"
    if state["saldo_usd"] < cfg["ukuran_beli_usd"] * 0.5:
        return False, "saldo bohongan habis"
    return True, ""


def cari_dan_beli(state, cfg, hari):
    ok, alasan = boleh_beli(state, cfg, hari)
    if not ok:
        log(f"  (tidak cari token baru: {alasan})")
        return
    f = cfg["filter"]
    jeda = cfg["pengaman"]["jeda_beli_ulang_token_jam"] * 3600
    alamat = [a for a in kandidat_token()
              if a not in state["posisi"]
              and time.time() - state["terakhir_dibeli"].get(a, 0) > jeda]
    if not alamat:
        log("  (tidak ada kandidat baru)")
        return
    data = pasangan_terbaik(alamat)
    lolos_pasar = []
    for token, p in data.items():
        info = ringkas_pasangan(p)
        ok, alasan = saring(info, f)
        if ok:
            lolos_pasar.append((token, info))
        else:
            log(f"  x {info['simbol']:<10} {alasan}")
    lolos_pasar.sort(key=lambda t: t[1]["volume_1jam"], reverse=True)
    for token, info in lolos_pasar:
        ok, _ = boleh_beli(state, cfg, hari)
        if not ok:
            break
        if f["pakai_rugcheck"]:
            aman, alasan = cek_rugcheck(token, f)
            if not aman:
                log(f"  x {info['simbol']:<10} {alasan}")
                continue
        beli(state, cfg, token, info, hari)


# ---------------------------------------------------------------- laporan

def laporan(cfg):
    state = muat_state(cfg)
    nilai_posisi = sum(p["modal_usd"] for p in state["posisi"].values())
    print("\n=== LAPORAN PAPER TRADING (uang bohongan) ===")
    print(f"Mulai           : {state.get('dibuat', '?')[:16]}")
    print(f"Saldo awal      : ${state['saldo_awal_usd']:.2f}")
    print(f"Saldo kas       : ${state['saldo_usd']:.2f}")
    print(f"Posisi terbuka  : {len(state['posisi'])} (modal ${nilai_posisi:.2f})")
    if not os.path.exists(FILE_RIWAYAT):
        print("Belum ada transaksi.\n")
        return
    with open(FILE_RIWAYAT, encoding="utf-8") as fh:
        jual_rows = [r for r in csv.DictReader(fh) if r["aksi"] == "JUAL"]
    if not jual_rows:
        print("Belum ada posisi yang ditutup.\n")
        return
    laba = [angka(r["laba_rugi_usd"]) for r in jual_rows]
    menang = [x for x in laba if x > 0]
    kalah = [x for x in laba if x <= 0]
    print(f"Transaksi tutup : {len(laba)}  (menang {len(menang)}, kalah {len(kalah)}, "
          f"win rate {len(menang) / len(laba) * 100:.0f}%)")
    print(f"Total laba/rugi : ${sum(laba):+.2f}")
    if menang:
        print(f"Rata-rata menang: ${sum(menang) / len(menang):+.2f}")
    if kalah:
        print(f"Rata-rata kalah : ${sum(kalah) / len(kalah):+.2f}")
    print(f"Terbaik/terburuk: ${max(laba):+.2f} / ${min(laba):+.2f}")
    print("\nPer hari:")
    for tgl, d in sorted(state["harian"].items()):
        print(f"  {tgl}: {d['jumlah_beli']} beli, laba/rugi ${d['rugi_laba_usd']:+.2f}")
    print()


# ---------------------------------------------------------------- main

def satu_putaran(cfg):
    state = muat_state(cfg)
    hari = data_hari_ini(state)
    log(f"Putaran | saldo ${state['saldo_usd']:.2f} | posisi {len(state['posisi'])} | "
        f"laba/rugi hari ini ${hari['rugi_laba_usd']:+.2f}")
    kelola_posisi(state, cfg, hari)
    simpan_state(state)
    cari_dan_beli(state, cfg, hari)
    simpan_state(state)


def main():
    ap = argparse.ArgumentParser(description="Bot meme coin Solana, mode paper trading")
    ap.add_argument("--sekali", action="store_true", help="jalankan satu putaran saja")
    ap.add_argument("--laporan", action="store_true", help="tampilkan ringkasan hasil")
    ap.add_argument("--reset", action="store_true", help="mulai ulang saldo bohongan")
    ap.add_argument("--durasi-menit", type=float, default=0,
                    help="berhenti sendiri setelah N menit (dipakai GitHub Actions)")
    args = ap.parse_args()
    cfg = muat_config()

    if args.laporan:
        laporan(cfg)
        return
    if args.reset:
        for fp in (FILE_STATE, FILE_RIWAYAT):
            if os.path.exists(fp):
                os.replace(fp, fp + f".lama-{int(time.time())}")
        simpan_state(state_baru(cfg))
        print("Saldo bohongan direset. Data lama disimpan dengan akhiran .lama-*")
        return

    log("=== Bot mulai (MODE PAPER TRADING, tidak ada uang asli) ===")
    batas = time.time() + args.durasi_menit * 60 if args.durasi_menit else None
    while True:
        if os.path.exists(FILE_STOP):
            log("File STOP ditemukan. Bot berhenti.")
            break
        try:
            satu_putaran(cfg)
        except KeyboardInterrupt:
            raise
        except Exception as e:  # jangan sampai bot mati karena satu error
            log(f"  ! Error putaran: {e!r}")
        if args.sekali:
            break
        if batas and time.time() + cfg["jeda_putaran_detik"] > batas:
            log("Durasi habis, bot berhenti (akan dilanjutkan jadwal berikutnya).")
            break
        time.sleep(cfg["jeda_putaran_detik"])


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("Dihentikan manual (Ctrl+C).")
        sys.exit(0)
