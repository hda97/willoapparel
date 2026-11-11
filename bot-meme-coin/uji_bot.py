#!/usr/bin/env python3
"""Uji otomatis bot (tanpa internet, data pasar tiruan).

Jalankan:  python3 uji_bot.py
"""
import os
import tempfile
import time
import unittest

os.environ["BOT_FOLDER"] = tempfile.mkdtemp(prefix="uji-bot-")
import bot  # noqa: E402

TOKEN = "TokenUji1111111111111111111111111111111pump"


def pasangan(harga=1.0, lik=50000, pair="PoolA", token=TOKEN):
    return {
        "chainId": "solana", "pairAddress": pair, "url": "https://contoh/" + pair,
        "baseToken": {"address": token, "symbol": "UJI"},
        "priceUsd": str(harga), "liquidity": {"usd": lik},
        "volume": {"h1": 50000}, "txns": {"h1": {"buys": 80, "sells": 40}},
        "priceChange": {"m5": 5, "h1": 30, "h6": 40},
        "pairCreatedAt": (time.time() - 3600) * 1000,
    }


def laporan_rc(**ganti):
    r = {
        "rugged": False, "mintAuthority": None, "freezeAuthority": None,
        "score_normalised": 1, "risks": [], "knownAccounts": {}, "totalHolders": 900,
        "topHolders": [{"owner": f"o{i}", "address": f"a{i}", "pct": 2} for i in range(10)],
        "markets": [{"lp": {"lpLockedPct": 100, "quoteUSD": 25000, "baseUSD": 25000}}],
    }
    r.update(ganti)
    return r


class Dasar(unittest.TestCase):
    def setUp(self):
        self.cfg = bot.gabung_dict(bot.CONFIG_DEFAULT, {})
        self.state = bot.state_baru(self.cfg)
        self.hari = bot.data_hari_ini(self.state)
        self.jawaban = {}
        self._asli = bot.ambil_json
        bot.ambil_json = lambda url, timeout=15: self.jawab(url)
        for f in (bot.FILE_RIWAYAT, bot.FILE_LOG):
            if os.path.exists(f):
                os.remove(f)

    def tearDown(self):
        bot.ambil_json = self._asli

    def jawab(self, url):
        for kunci, nilai in self.jawaban.items():
            if kunci in url:
                return nilai
        return None

    def beli(self, harga=1.0, lik=50000):
        info = bot.ringkas_pasangan(pasangan(harga, lik))
        bot.beli(self.state, self.cfg, TOKEN, info, self.hari)
        return self.state["posisi"][TOKEN]


class UjiPosisi(Dasar):
    def test_api_gagal_tidak_dijual_nol(self):
        pos = self.beli()
        pos["waktu_beli"] -= 3600
        for _ in range(10):  # API mati terus
            bot.kelola_posisi(self.state, self.cfg, self.hari)
        self.assertIn(TOKEN, self.state["posisi"])
        self.assertEqual(self.hari["rugi_laba_usd"], 0.0)

    def test_pasangan_benar_hilang_dijual_setelah_3_putaran(self):
        pos = self.beli()
        pos["waktu_beli"] -= 3600
        self.jawaban["/tokens/v1/"] = []  # API menjawab, token tidak ada
        bot.kelola_posisi(self.state, self.cfg, self.hari)
        bot.kelola_posisi(self.state, self.cfg, self.hari)
        self.assertIn(TOKEN, self.state["posisi"])
        bot.kelola_posisi(self.state, self.cfg, self.hari)
        self.assertNotIn(TOKEN, self.state["posisi"])
        self.assertAlmostEqual(self.hari["rugi_laba_usd"], -10.0)

    def test_hilang_sekali_lalu_muncul_lagi(self):
        pos = self.beli()
        pos["waktu_beli"] -= 3600 / 2
        self.jawaban["/tokens/v1/"] = []
        bot.kelola_posisi(self.state, self.cfg, self.hari)
        self.jawaban["/tokens/v1/"] = [pasangan(1.05)]
        bot.kelola_posisi(self.state, self.cfg, self.hari)
        self.assertEqual(self.state["posisi"][TOKEN]["hilang"], 0)

    def test_stop_loss_take_profit_trailing_waktu(self):
        kasus = [(0.75, "stop loss"), (1.5, "take profit")]
        for harga, kata in kasus:
            self.state = bot.state_baru(self.cfg)
            self.hari = bot.data_hari_ini(self.state)
            self.beli()
            self.jawaban["/tokens/v1/"] = [pasangan(harga)]
            bot.kelola_posisi(self.state, self.cfg, self.hari)
            self.assertNotIn(TOKEN, self.state["posisi"], kata)
        # trailing: naik 30% lalu turun 16% dari puncak
        self.state = bot.state_baru(self.cfg)
        self.hari = bot.data_hari_ini(self.state)
        self.beli()
        self.jawaban["/tokens/v1/"] = [pasangan(1.33)]
        bot.kelola_posisi(self.state, self.cfg, self.hari)
        self.assertIn(TOKEN, self.state["posisi"])
        self.jawaban["/tokens/v1/"] = [pasangan(1.33 * 0.83)]
        bot.kelola_posisi(self.state, self.cfg, self.hari)
        self.assertNotIn(TOKEN, self.state["posisi"])
        # waktu tahan
        self.state = bot.state_baru(self.cfg)
        self.hari = bot.data_hari_ini(self.state)
        self.beli()["waktu_beli"] -= 241 * 60
        self.jawaban["/tokens/v1/"] = [pasangan(1.03)]
        bot.kelola_posisi(self.state, self.cfg, self.hari)
        self.assertNotIn(TOKEN, self.state["posisi"])

    def test_likuiditas_pakai_pool_yang_sama(self):
        self.beli(lik=50000)  # beli di PoolA
        # PoolA masih sehat, ada pool lain yang lebih besar: jangan salah baca.
        self.jawaban["/tokens/v1/"] = [pasangan(1.02, 48000, "PoolA"), pasangan(1.02, 900000, "PoolB")]
        bot.kelola_posisi(self.state, self.cfg, self.hari)
        self.assertIn(TOKEN, self.state["posisi"])
        # PoolA dikuras 90%: jual walau PoolB besar.
        self.jawaban["/tokens/v1/"] = [pasangan(1.02, 5000, "PoolA"), pasangan(1.02, 900000, "PoolB")]
        bot.kelola_posisi(self.state, self.cfg, self.hari)
        self.assertNotIn(TOKEN, self.state["posisi"])

    def test_saldo_dan_biaya(self):
        self.beli()
        self.assertAlmostEqual(self.state["saldo_usd"], 90.0)
        bot.jual(self.state, self.cfg, TOKEN, 1.0, "uji", self.hari)
        # harga tetap: rugi hanya biaya 2% beli + 2% jual
        self.assertAlmostEqual(self.state["saldo_usd"], 90 + 10 / 1.02 * 0.98, places=6)
        self.assertLess(self.hari["rugi_laba_usd"], 0)


class UjiPengaman(Dasar):
    def test_batas_harian_hitung_posisi_terbuka(self):
        self.hari["rugi_laba_usd"] = -15.0
        ok, _ = bot.boleh_beli(self.state, self.cfg, self.hari)
        self.assertTrue(ok)  # -15 - 2 = -17, masih di dalam batas 20
        self.beli()
        self.state["posisi"]["lain"] = dict(self.state["posisi"][TOKEN])
        ok, alasan = bot.boleh_beli(self.state, self.cfg, self.hari)
        self.assertFalse(ok, alasan)  # -15 - (2+2+2) = -21, melewati batas

    def test_batas_harian_tercapai(self):
        self.hari["rugi_laba_usd"] = -20.0
        self.assertFalse(bot.boleh_beli(self.state, self.cfg, self.hari)[0])

    def test_maks_posisi_dan_maks_beli(self):
        self.hari["jumlah_beli"] = 10
        self.assertFalse(bot.boleh_beli(self.state, self.cfg, self.hari)[0])


class UjiRugcheck(Dasar):
    def cek(self, **ganti):
        self.jawaban["/report"] = laporan_rc(**ganti)
        return bot.cek_rugcheck(TOKEN, self.cfg["filter"])

    def test_lolos(self):
        ok, alasan = self.cek()
        self.assertTrue(ok, alasan)
        self.assertIn("pemegang=900", alasan)

    def test_gagal_baca_ditolak(self):
        self.assertFalse(bot.cek_rugcheck(TOKEN, self.cfg["filter"])[0])

    def test_tanpa_data_lp_ditolak(self):
        self.assertFalse(self.cek(markets=[])[0])
        self.assertFalse(self.cek(markets=[{"lp": {}}])[0])

    def test_lp_dinilai_di_pool_terbesar(self):
        pasar = [{"lp": {"lpLockedPct": 100, "quoteUSD": 50, "baseUSD": 50}},
                 {"lp": {"lpLockedPct": 0, "quoteUSD": 40000, "baseUSD": 40000}}]
        self.assertFalse(self.cek(markets=pasar)[0])
        pasar[1]["lp"]["lpLockedPct"] = 100
        pasar[0]["lp"]["lpLockedPct"] = 0
        self.assertTrue(self.cek(markets=pasar)[0])

    def test_bahaya_lain(self):
        self.assertFalse(self.cek(rugged=True)[0])
        self.assertFalse(self.cek(mintAuthority="x")[0])
        self.assertFalse(self.cek(freezeAuthority="x")[0])
        self.assertFalse(self.cek(score_normalised=80)[0])
        self.assertFalse(self.cek(risks=[{"level": "danger", "name": "x"}])[0])
        besar = [{"owner": f"o{i}", "address": f"a{i}", "pct": 5} for i in range(10)]
        self.assertFalse(self.cek(topHolders=besar)[0])


class UjiStrategiBaru(Dasar):
    def test_default_tidak_mengubah_perilaku_lama(self):
        f = bot.CONFIG_DEFAULT["filter"]
        self.assertEqual((f["umur_token_min_jam"], f["pemegang_min"]), (0, 0))
        self.assertEqual(bot.CONFIG_DEFAULT["jeda_posisi_detik"], 0)
        self.assertEqual(bot.CONFIG_DEFAULT["pengaman"]["jeda_antar_beli_menit"], 0)

    def test_umur_token(self):
        from datetime import datetime, timezone, timedelta
        iso = lambda jam: (datetime.now(timezone.utc) - timedelta(hours=jam)).isoformat().replace("+00:00", "Z")
        self.assertAlmostEqual(bot.umur_token_jam(iso(5)), 5, places=1)
        self.assertAlmostEqual(bot.umur_token_jam("2026-11-08T05:00:00.123456789Z") is not None, True)
        self.assertIsNone(bot.umur_token_jam(None))
        f = dict(self.cfg["filter"], umur_token_min_jam=2)
        self.jawaban["/report"] = laporan_rc(detectedAt=iso(0.5))
        self.assertFalse(bot.cek_rugcheck(TOKEN, f)[0])
        self.jawaban["/report"] = laporan_rc(detectedAt=iso(3))
        self.assertTrue(bot.cek_rugcheck(TOKEN, f)[0])
        self.jawaban["/report"] = laporan_rc()  # tanpa detectedAt
        self.assertFalse(bot.cek_rugcheck(TOKEN, f)[0])

    def test_pemegang_min(self):
        f = dict(self.cfg["filter"], pemegang_min=500)
        self.jawaban["/report"] = laporan_rc(totalHolders=120)
        self.assertFalse(bot.cek_rugcheck(TOKEN, f)[0])
        self.jawaban["/report"] = laporan_rc(totalHolders=800)
        self.assertTrue(bot.cek_rugcheck(TOKEN, f)[0])

    def test_jeda_antar_beli(self):
        self.cfg["pengaman"]["jeda_antar_beli_menit"] = 30
        self.assertTrue(bot.boleh_beli(self.state, self.cfg, self.hari)[0])
        self.beli()
        self.assertFalse(bot.boleh_beli(self.state, self.cfg, self.hari)[0])
        self.state["waktu_beli_terakhir"] -= 31 * 60
        self.assertTrue(bot.boleh_beli(self.state, self.cfg, self.hari)[0])

    def test_sedang_jatuh_ditolak(self):
        f = dict(self.cfg["filter"], kenaikan_5menit_min_persen=-5)
        p = pasangan()
        p["priceChange"]["m5"] = -12
        self.assertFalse(bot.saring(bot.ringkas_pasangan(p), f)[0])

    def test_boost_teratas(self):
        self.jawaban["/token-boosts/top/"] = [{"chainId": "solana", "tokenAddress": "X"}]
        self.assertEqual(bot.kandidat_token(self.cfg), [])
        self.assertEqual(bot.kandidat_token(dict(self.cfg, pakai_boost_teratas=True)), ["X"])

    def test_cek_posisi_cepat(self):
        self.cfg["jeda_posisi_detik"] = 0.05
        bot.simpan_state(self.state)
        self.beli()
        bot.simpan_state(self.state)
        self.jawaban["/tokens/v1/"] = [pasangan(0.7)]
        bot.tunggu_sambil_jaga_posisi(self.cfg, 0.2)
        self.assertNotIn(TOKEN, bot.muat_state(self.cfg)["posisi"])

    def test_config_selektif_terbaca(self):
        import json
        jalur = os.path.join(os.path.dirname(os.path.abspath(bot.__file__)), "selektif", "config.json")
        with open(jalur, encoding="utf-8") as fh:
            cfg = bot.gabung_dict(bot.CONFIG_DEFAULT, json.load(fh))
        self.assertEqual(cfg["filter"]["umur_token_min_jam"], 2)
        self.assertEqual(cfg["jeda_posisi_detik"], 15)


class UjiPutaran(Dasar):
    def test_satu_putaran_beli_dan_catat(self):
        self.jawaban["/token-profiles/"] = [{"chainId": "solana", "tokenAddress": TOKEN}]
        self.jawaban["/tokens/v1/"] = [pasangan()]
        self.jawaban["/report"] = laporan_rc()
        if os.path.exists(bot.FILE_STATE):
            os.remove(bot.FILE_STATE)
        bot.satu_putaran(self.cfg)
        state = bot.muat_state(self.cfg)
        self.assertIn(TOKEN, state["posisi"])
        self.assertEqual(state["posisi"][TOKEN]["pair"], "PoolA")
        with open(bot.FILE_RIWAYAT, encoding="utf-8") as f:
            isi = f.read()
        self.assertIn("pemegang=900", isi)
        bot.satu_putaran(self.cfg)  # putaran kedua tidak beli ulang token yang sama
        self.assertEqual(bot.data_hari_ini(bot.muat_state(self.cfg))["jumlah_beli"], 1)
        bot.laporan(self.cfg)

    def test_filter_pasar(self):
        f = self.cfg["filter"]
        self.assertTrue(bot.saring(bot.ringkas_pasangan(pasangan()), f)[0])
        self.assertFalse(bot.saring(bot.ringkas_pasangan(pasangan(lik=100)), f)[0])
        self.assertFalse(bot.saring(bot.ringkas_pasangan(pasangan(harga=0)), f)[0])


if __name__ == "__main__":
    unittest.main(verbosity=1)
