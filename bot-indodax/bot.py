#!/usr/bin/env python3
"""
Bot Indodax - MODE PAPER TRADING (uang bohongan, rupiah).

Strategi "nabung mingguan dengan sabuk pengaman tren":
  1. Tiap minggu menyetor rupiah bohongan, dibagi ke tiap koin sesuai bobot.
  2. Selama harga penutupan harian di ATAS rata-rata N hari (SMA), uang di
     kantong koin itu dibelikan koin.
  3. Begitu harga penutupan harian turun di BAWAH SMA, semua koin itu dijual
     ke rupiah dan bot menunggu sampai harga kembali di atas SMA.

Bot hanya membaca data harga publik Indodax. Bot ini TIDAK memegang kunci API,
tidak login, dan TIDAK bisa bertransaksi sungguhan.

Cara pakai:
  python bot.py            -> satu kali cek (aman dijalankan berkali-kali sehari)
  python bot.py --laporan  -> ringkasan hasil
  python bot.py --reset    -> mulai ulang dari nol

Hanya memakai pustaka bawaan Python 3.9+.
"""

import argparse
import csv
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone, timedelta

FOLDER = os.path.abspath(os.environ.get("BOT_FOLDER") or os.path.dirname(os.path.abspath(__file__)))
FILE_CONFIG = os.path.join(FOLDER, "config.json")
FILE_STATE = os.path.join(FOLDER, "status_paper.json")
FILE_RIWAYAT = os.path.join(FOLDER, "riwayat_transaksi.csv")
FILE_LOG = os.path.join(FOLDER, "log_bot.txt")

WIB = timezone(timedelta(hours=7))
INDODAX = "https://indodax.com"

CONFIG_DEFAULT = {
    "setoran_mingguan_idr": 100000,
    "hari_setor": 0,                      # 0 = Senin ... 6 = Minggu (WIB)
    "koin": {"BTC": 0.7, "SOL": 0.3},     # bobot pembagian setoran
    "pembanding_tanpa_sabuk": True,       # catat juga hasil "nabung polos"
    "sma_hari": 50,
    "biaya_dan_selisih_persen": 0.5,      # tiap beli dan tiap jual
    "beli_minimal_idr": 10000,
}


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


def rp(x):
    return "Rp" + f"{x:,.0f}".replace(",", ".")


def muat_config():
    cfg = dict(CONFIG_DEFAULT)
    if os.path.exists(FILE_CONFIG):
        with open(FILE_CONFIG, encoding="utf-8") as f:
            cfg.update(json.load(f))
    total = sum(cfg["koin"].values())
    if total <= 0:
        raise ValueError("bobot koin di config harus lebih dari nol")
    cfg["koin"] = {k.upper(): v / total for k, v in cfg["koin"].items()}
    return cfg


def ambil_json(url, timeout=20):
    """GET JSON lewat curl, coba sampai 3 kali. Mengembalikan None jika gagal.

    Memakai curl apa adanya (tanpa menyamar jadi browser): API publik Indodax
    menolak klien bawaan Python tetapi menerima curl.
    """
    for percobaan in range(3):
        try:
            hasil = subprocess.run(
                ["curl", "-sS", "--fail", "--max-time", str(timeout),
                 "-H", "Accept: application/json", url],
                capture_output=True, text=True, timeout=timeout + 10)
            if hasil.returncode == 0:
                return json.loads(hasil.stdout)
            galat = hasil.stderr.strip()[:120]
        except (OSError, subprocess.SubprocessError, json.JSONDecodeError) as e:
            galat = repr(e)
        if percobaan == 2:
            log(f"  ! Gagal ambil {url[:70]}: {galat}")
            return None
        time.sleep(3)
    return None


# ---------------------------------------------------------------- data pasar

def lilin_harian(koin, hari):
    """Lilin harian yang SUDAH SELESAI, urut lama ke baru: [(waktu, tutup)]."""
    kini = int(time.time())
    data = ambil_json(f"{INDODAX}/tradingview/history_v2?symbol={koin}IDR&tf=1D"
                      f"&from={kini - (hari + 15) * 86400}&to={kini}")
    if not isinstance(data, list):
        return None
    lilin = []
    for d in data:
        try:
            t, tutup = int(d["Time"]), float(d["Close"])
        except (KeyError, TypeError, ValueError):
            continue
        if tutup > 0 and t + 86400 <= kini:      # buang lilin hari yang masih berjalan
            lilin.append((t, tutup))
    lilin.sort()
    return lilin


def harga_sekarang(koin):
    """(harga untuk beli, harga untuk jual) dari buku order, atau None."""
    d = ambil_json(f"{INDODAX}/api/ticker/{koin.lower()}idr")
    try:
        t = d["ticker"]
        beli, jual = float(t["sell"]), float(t["buy"])   # kita beli di harga penjual
    except (KeyError, TypeError, ValueError):
        return None
    if beli <= 0 or jual <= 0 or beli < jual or (beli - jual) / beli > 0.05:
        return None                                       # data aneh: jangan dipakai
    return beli, jual


def sinyal(lilin, n):
    """(di_atas_sma, tutup_terakhir, sma) atau None bila data kurang."""
    if not lilin or len(lilin) < n:
        return None
    tutup = [c for _, c in lilin[-n:]]
    sma = sum(tutup) / n
    return tutup[-1] > sma, tutup[-1], sma


# ---------------------------------------------------------------- state

def state_baru(cfg):
    kosong = lambda: {k: {"kas": 0.0, "koin": 0.0} for k in cfg["koin"]}
    return {"dibuat": sekarang().isoformat(), "total_setor": 0.0,
            "kantong": kosong(), "polos": kosong(),
            "minggu_setor": "", "hari_cek": "", "posisi": {}}


def muat_state(cfg):
    if os.path.exists(FILE_STATE):
        with open(FILE_STATE, encoding="utf-8") as f:
            st = json.load(f)
    else:
        st = state_baru(cfg)
    for bagian in ("kantong", "polos"):
        for k in cfg["koin"]:
            st[bagian].setdefault(k, {"kas": 0.0, "koin": 0.0})
    return st


def simpan_state(st):
    tmp = FILE_STATE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(st, f, indent=2)
    os.replace(tmp, FILE_STATE)


def catat(aksi, koin, harga, nilai, alasan):
    baru = not os.path.exists(FILE_RIWAYAT)
    with open(FILE_RIWAYAT, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if baru:
            w.writerow(["waktu_wib", "aksi", "koin", "harga_idr", "nilai_idr", "alasan"])
        w.writerow([sekarang().strftime("%Y-%m-%d %H:%M:%S"), aksi, koin,
                    f"{harga:.0f}", f"{nilai:.0f}", alasan])


# ---------------------------------------------------------------- inti

def setor_bila_waktunya(st, cfg, kini):
    """Setor sekali per minggu, pada/sesudah hari setor. Mengembalikan True jika setor."""
    tahun, minggu, _ = kini.isocalendar()
    kunci = f"{tahun}-W{minggu:02d}"
    if st["minggu_setor"] == kunci or kini.weekday() < cfg["hari_setor"]:
        return False
    jumlah = cfg["setoran_mingguan_idr"]
    for k, bobot in cfg["koin"].items():
        st["kantong"][k]["kas"] += jumlah * bobot
        st["polos"][k]["kas"] += jumlah * bobot
    st["total_setor"] += jumlah
    st["minggu_setor"] = kunci
    log(f"  $ SETOR (bohongan) {rp(jumlah)} untuk minggu {kunci}")
    catat("SETOR", "IDR", 1, jumlah, f"setoran mingguan {kunci}")
    return True


def beli(kantong, harga, biaya):
    koin = kantong["kas"] / (harga * (1 + biaya))
    kantong["koin"] += koin
    nilai, kantong["kas"] = kantong["kas"], 0.0
    return nilai


def jual(kantong, harga, biaya):
    nilai = kantong["koin"] * harga * (1 - biaya)
    kantong["kas"] += nilai
    kantong["koin"] = 0.0
    return nilai


def satu_cek(cfg, kini=None):
    kini = kini or sekarang()
    st = muat_state(cfg)
    biaya = cfg["biaya_dan_selisih_persen"] / 100
    n = cfg["sma_hari"]
    setor_bila_waktunya(st, cfg, kini)
    simpan_state(st)

    for k in cfg["koin"]:
        lilin = lilin_harian(k, n)
        s = sinyal(lilin, n)
        harga = harga_sekarang(k)
        if s is None or harga is None:
            log(f"  ? {k}: data harga tidak lengkap, tidak ada tindakan")
            continue
        di_atas, tutup, sma = s
        harga_beli, harga_jual = harga
        kantong, polos = st["kantong"][k], st["polos"][k]
        jarak = (tutup / sma - 1) * 100
        status = "DI ATAS" if di_atas else "DI BAWAH"
        log(f"  {k}: tutup {rp(tutup)} {status} SMA{n} {rp(sma)} ({jarak:+.1f}%)")

        # Pembanding: nabung polos, selalu beli, tidak pernah jual.
        if cfg["pembanding_tanpa_sabuk"] and polos["kas"] >= cfg["beli_minimal_idr"]:
            beli(polos, harga_beli, biaya)

        if di_atas and kantong["kas"] >= cfg["beli_minimal_idr"]:
            nilai = beli(kantong, harga_beli, biaya)
            log(f"  + BELI (bohongan) {k} {rp(nilai)} @ {rp(harga_beli)}")
            catat("BELI", k, harga_beli, nilai, f"tutup {jarak:+.1f}% di atas SMA{n}")
        elif not di_atas and kantong["koin"] > 0:
            nilai = jual(kantong, harga_jual, biaya)
            log(f"  - JUAL (bohongan) {k} semua, dapat {rp(nilai)} @ {rp(harga_jual)}")
            catat("JUAL", k, harga_jual, nilai, f"tutup {jarak:+.1f}% di bawah SMA{n}")
        st["posisi"][k] = {"di_atas_sma": di_atas, "tutup": tutup, "sma": sma,
                           "harga_jual": harga_jual, "jarak_persen": jarak}
        simpan_state(st)

    st["hari_cek"] = kini.strftime("%Y-%m-%d %H:%M")
    simpan_state(st)
    return st


def nilai_total(st, bagian):
    total = 0.0
    for k, kt in st[bagian].items():
        harga = (st["posisi"].get(k) or {}).get("harga_jual", 0)
        total += kt["kas"] + kt["koin"] * harga
    return total


def laporan(cfg):
    st = muat_state(cfg)
    setor = st["total_setor"]
    print("\n=== LAPORAN PAPER TRADING INDODAX (uang bohongan) ===")
    print(f"Mulai         : {st.get('dibuat', '?')[:16]}")
    print(f"Cek terakhir  : {st.get('hari_cek') or 'belum pernah'} WIB")
    print(f"Total setoran : {rp(setor)}")
    if setor <= 0:
        print("Belum ada setoran.\n")
        return
    for nama, bagian in (("Dengan sabuk pengaman", "kantong"), ("Nabung polos (pembanding)", "polos")):
        nilai = nilai_total(st, bagian)
        print(f"{nama:<26}: {rp(nilai)} ({(nilai / setor - 1) * 100:+.1f}%)")
    print("\nPer koin (dengan sabuk pengaman):")
    for k, kt in st["kantong"].items():
        p = st["posisi"].get(k) or {}
        arah = "di atas" if p.get("di_atas_sma") else "di bawah"
        pegang = f"pegang {kt['koin']:.8f} {k}" if kt["koin"] > 0 else "tidak pegang koin"
        print(f"  {k}: {pegang}, kas {rp(kt['kas'])}, harga {arah} SMA{cfg['sma_hari']} "
              f"({p.get('jarak_persen', 0):+.1f}%)")
    print()


def main():
    ap = argparse.ArgumentParser(description="Bot Indodax, mode paper trading")
    ap.add_argument("--laporan", action="store_true")
    ap.add_argument("--reset", action="store_true")
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
        print("Direset. Data lama disimpan dengan akhiran .lama-*")
        return
    log("=== Cek bot Indodax (MODE PAPER TRADING, tidak ada uang asli) ===")
    satu_cek(cfg)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
