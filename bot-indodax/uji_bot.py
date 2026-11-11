#!/usr/bin/env python3
"""Uji otomatis bot Indodax (tanpa internet, data harga tiruan).  python3 uji_bot.py"""
import os
import tempfile
import time
import unittest
from datetime import datetime

os.environ["BOT_FOLDER"] = tempfile.mkdtemp(prefix="uji-indodax-")
import bot  # noqa: E402

SENIN = datetime(2026, 11, 9, 8, 0, tzinfo=bot.WIB)


def lilin(tutup_terakhir, dasar=100.0, n=60):
    kini = int(time.time())
    data = [{"Time": kini - (n - i + 1) * 86400, "Close": dasar} for i in range(n)]
    data[-1]["Close"] = tutup_terakhir
    data.append({"Time": kini - 3600, "Close": 1.0})  # lilin berjalan, harus diabaikan
    return data


class Uji(unittest.TestCase):
    def setUp(self):
        for f in (bot.FILE_STATE, bot.FILE_RIWAYAT, bot.FILE_LOG):
            if os.path.exists(f):
                os.remove(f)
        self.cfg = dict(bot.CONFIG_DEFAULT, koin={"BTC": 1.0})
        self.tutup, self.harga, self.mati = 120.0, 120.0, False
        self._asli = bot.ambil_json
        bot.ambil_json = self.jawab

    def tearDown(self):
        bot.ambil_json = self._asli

    def jawab(self, url, timeout=20):
        if self.mati:
            return None
        if "history_v2" in url:
            return lilin(self.tutup)
        return {"ticker": {"buy": str(self.harga), "sell": str(self.harga * 1.0001)}}

    def test_setor_sekali_per_minggu_dan_beli_di_atas_sma(self):
        st = bot.satu_cek(self.cfg, SENIN)
        self.assertEqual(st["total_setor"], 100000)
        self.assertEqual(st["kantong"]["BTC"]["kas"], 0)
        self.assertGreater(st["kantong"]["BTC"]["koin"], 0)
        koin = st["kantong"]["BTC"]["koin"]
        st = bot.satu_cek(self.cfg, SENIN.replace(day=11))  # hari lain, minggu sama
        self.assertEqual(st["total_setor"], 100000)
        self.assertEqual(st["kantong"]["BTC"]["koin"], koin)
        st = bot.satu_cek(self.cfg, SENIN.replace(day=16))  # minggu berikut
        self.assertEqual(st["total_setor"], 200000)

    def test_biaya_dihitung(self):
        st = bot.satu_cek(self.cfg, SENIN)
        nilai = st["kantong"]["BTC"]["koin"] * self.harga
        self.assertLess(nilai, 100000)
        self.assertGreater(nilai, 99000)

    def test_di_bawah_sma_tidak_beli_dan_jual_semua(self):
        st = bot.satu_cek(self.cfg, SENIN)
        self.tutup = self.harga = 80.0
        st = bot.satu_cek(self.cfg, SENIN.replace(day=10))
        self.assertEqual(st["kantong"]["BTC"]["koin"], 0)
        self.assertGreater(st["kantong"]["BTC"]["kas"], 0)
        self.assertGreater(st["polos"]["BTC"]["koin"], 0)  # pembanding tetap pegang
        kas = st["kantong"]["BTC"]["kas"]
        st = bot.satu_cek(self.cfg, SENIN.replace(day=16))  # setor lagi, tetap tidak beli
        self.assertEqual(st["kantong"]["BTC"]["koin"], 0)
        self.assertAlmostEqual(st["kantong"]["BTC"]["kas"], kas + 100000)
        self.tutup = self.harga = 130.0                     # tren pulih: beli lagi
        st = bot.satu_cek(self.cfg, SENIN.replace(day=17))
        self.assertEqual(st["kantong"]["BTC"]["kas"], 0)

    def test_data_gagal_tidak_ada_tindakan(self):
        st = bot.satu_cek(self.cfg, SENIN)
        koin = st["kantong"]["BTC"]["koin"]
        self.mati = True
        st = bot.satu_cek(self.cfg, SENIN.replace(day=10))
        self.assertEqual(st["kantong"]["BTC"]["koin"], koin)

    def test_harga_aneh_ditolak(self):
        bot.ambil_json = lambda url, timeout=20: {"ticker": {"buy": "100", "sell": "200"}}
        self.assertIsNone(bot.harga_sekarang("BTC"))
        bot.ambil_json = lambda url, timeout=20: {"ticker": {"buy": "0", "sell": "0"}}
        self.assertIsNone(bot.harga_sekarang("BTC"))

    def test_lilin_berjalan_diabaikan_dan_data_kurang(self):
        data = bot.lilin_harian("BTC", 50)
        self.assertEqual(data[-1][1], 120.0)
        self.assertIsNone(bot.sinyal(data[:10], 50))

    def test_sebelum_hari_setor_belum_setor(self):
        cfg = dict(self.cfg, hari_setor=2)
        st = bot.satu_cek(cfg, SENIN)
        self.assertEqual(st["total_setor"], 0)
        st = bot.satu_cek(cfg, SENIN.replace(day=12))
        self.assertEqual(st["total_setor"], 100000)

    def test_laporan_dan_bobot(self):
        cfg = bot.muat_config()
        self.assertAlmostEqual(sum(cfg["koin"].values()), 1.0)
        bot.satu_cek(self.cfg, SENIN)
        bot.laporan(self.cfg)


if __name__ == "__main__":
    unittest.main(verbosity=1)
