"""Balas otomatis kata kunci Instagram, pengganti ManyChat (gratis, Graph API resmi Meta).

Jalan dari .github/workflows/ig-kata-kunci.yml (tiap ±10 menit). Daftar kata kunci, link,
dan teks balasan ada di kata-kunci.json, jadi mengubah balasan cukup edit file itu.

Untuk tiap akun di kata-kunci.json -> "akun":
1. KOMENTAR: komentar baru (≤7 hari) di 15 postingan terakhir yang berisi kata kunci
   (mis. "KASIR") -> DM link lewat Private Reply + balasan publik "cek DM".
   Kalau DM ditolak Meta, balasan publik langsung memuat linknya.
2. DM: pesan masuk yang berisi kata kunci -> dibalas DM berisi link.
   Pesan tanpa kata kunci dibiarkan (dibaca dan dibalas pemilik akun sendiri).

Mode cek (python3 kata_kunci.py --cek): daftar akun IG yang bisa dijangkau token
dan izin (scope) yang dimiliki token, tanpa membalas apa pun.

Syarat dari Meta (bukan dari kode ini):
- Akun IG harus akun profesional (Kreator/Bisnis) yang tersambung ke Halaman Facebook
  yang dikelola pemilik token.
- Balas komentar butuh izin instagram_manage_comments (sudah dipakai @duniakotak.id).
- DM ke orang lain butuh instagram_manage_messages dengan Advanced Access (App Review)
  dan "Izinkan akses ke pesan" menyala di pengaturan IG. Sebelum itu DM hanya sampai
  ke akun yang punya peran di app Meta; bot otomatis kembali ke balasan publik.
"""
import datetime as dt, json, os, random, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from posting import req, muat_token, daftar_halaman, DIR

CONFIG = os.path.join(DIR, "kata-kunci.json")
CATAT = os.path.join(DIR, "catatan-kata-kunci.json")  # disimpan di cache Actions, tidak di-commit
UMUR_HARI = 7
MAKS_PER_JALAN = int(os.environ.get("MAKS_BALAS", "40"))
DM_AKTIF = os.environ.get("IG_DM", "1") != "0"


def waktu(s):
    return dt.datetime.fromisoformat(s.replace("+0000", "+00:00"))


def cocok(teks, cfg):
    """Kata kunci pertama yang muncul sebagai kata utuh di teks, atau None."""
    t = " " + re.sub(r"[^a-z0-9]+", " ", (teks or "").lower()) + " "
    for k in cfg["kata_kunci"]:
        for kata in k["kata"]:
            if f" {kata.lower()} " in t:
                return k
    return None


def isi_dm(k, cfg):
    return k["dm"].format(link=k.get("link") or cfg["link_umum"])


def pendek(url):
    return re.sub(r"^https?://(www\.)?", "", url).rstrip("/")


def kirim_dm(token, penerima, teks):
    req("POST", "me/messages", access_token=token, recipient=json.dumps(penerima),
        message=json.dumps({"text": teks}, ensure_ascii=False))


def layani_komentar(akun, token, ig_id, cfg, catat, sisa):
    sudah = set(catat.setdefault("komentar", []))
    batas = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=UMUR_HARI)
    media = req("GET", f"{ig_id}/media", fields="id,timestamp", limit=15, access_token=token)["data"]
    dm_bisa, n = DM_AKTIF, 0
    for m in media:
        kom = req("GET", f"{m['id']}/comments", fields="id,text,username,timestamp,replies{username}",
                  limit=50, access_token=token).get("data", [])
        for c in kom:
            if n >= sisa:
                break
            if c["id"] in sudah or c.get("username", "").lower() == akun.lower():
                continue
            k = cocok(c.get("text"), cfg)
            if not k or waktu(c["timestamp"]) < batas or any(
                    r.get("username", "").lower() == akun.lower() for r in (c.get("replies") or {}).get("data", [])):
                sudah.add(c["id"]); continue
            user = c.get("username", "kak")
            terkirim = False
            if dm_bisa:
                try:
                    kirim_dm(token, {"comment_id": c["id"]}, isi_dm(k, cfg)); terkirim = True
                except SystemExit as e:
                    print(f"DM ke @{user} ditolak Meta, pakai balasan publik: {e}")
                    dm_bisa = False
            link = k.get("link") or cfg["link_umum"]
            pilihan = cfg["publik_dm"] if terkirim else cfg["publik_tanpa_dm"]
            teks = random.choice(pilihan).format(u=user, link=link, link_pendek=pendek(link))
            req("POST", f"{c['id']}/replies", message=teks, access_token=token)
            sudah.add(c["id"]); n += 1
            print(f"[{akun}] komentar @{user}{' +DM' if terkirim else ''}: {c.get('text','')[:50]!r} -> {k['kata'][0]}")
    catat["komentar"] = sorted(sudah)[-3000:]
    return n


def layani_dm(akun, token, ig_id, cfg, catat, sisa):
    sudah = set(catat.setdefault("dm", []))
    mulai = waktu(catat.setdefault("mulai_dm", (dt.datetime.now(dt.timezone.utc) - dt.timedelta(minutes=30)).isoformat()))
    try:
        conv = req("GET", "me/conversations", platform="instagram", limit=20, access_token=token,
                   fields="updated_time,messages.limit(5){id,message,from,created_time}").get("data", [])
    except SystemExit as e:
        print(f"[{akun}] DM belum bisa dibaca (izin pesan belum ada): {e}")
        return 0
    n = 0
    for cv in conv:
        for msg in (cv.get("messages") or {}).get("data", []):
            if n >= sisa:
                break
            dari = msg.get("from") or {}
            if msg["id"] in sudah or dari.get("id") == ig_id or dari.get("username", "").lower() == akun.lower():
                continue
            sudah.add(msg["id"])
            if waktu(msg["created_time"]) < mulai:
                continue
            k = cocok(msg.get("message"), cfg)
            if not k:
                continue
            try:
                kirim_dm(token, {"id": dari["id"]}, isi_dm(k, cfg)); n += 1
                print(f"[{akun}] DM @{dari.get('username')}: {msg.get('message','')[:50]!r} -> {k['kata'][0]}")
            except SystemExit as e:
                print(f"[{akun}] balas DM gagal: {e}")
    catat["dm"] = sorted(sudah)[-3000:]
    return n


def cek():
    user = os.environ.get("IG_TOKEN")
    app = f"{os.environ.get('IG_APP_ID')}|{os.environ.get('IG_APP_SECRET')}"
    try:
        info = req("GET", "debug_token", input_token=user, access_token=app)["data"]
        print("Token pengguna:", "masih berlaku" if info.get("is_valid") else "KEDALUWARSA/tidak berlaku")
        print("Izin token:", ", ".join(sorted(info.get("scopes", []))))
    except SystemExit as e:
        print(f"Cek token gagal: {e}")
    try:
        for p in daftar_halaman(user):
            ig = (p.get("instagram_business_account") or {}).get("username")
            print(f"Halaman '{p.get('name')}' -> IG: {'@' + ig if ig else '(belum tersambung akun IG profesional)'}")
    except SystemExit as e:
        print(f"Daftar Halaman tidak bisa dibaca dengan IG_TOKEN: {e}")
    for akun in json.load(open(CONFIG)).get("akun", []):
        try:
            muat_token(akun)
            print(f"@{akun}: token Halaman siap.")
        except SystemExit as e:
            print(f"@{akun}: BELUM bisa dipakai: {e}")


def main():
    if "--cek" in sys.argv:
        return cek()
    cfg = json.load(open(CONFIG))
    if not cfg.get("akun"):
        print("Belum ada akun di kata-kunci.json -> 'akun'. Jalankan mode cek untuk melihat akun yang tersedia.")
        return cek()
    semua = json.load(open(CATAT)) if os.path.exists(CATAT) else {}
    sisa, total = MAKS_PER_JALAN, 0
    for akun in cfg["akun"]:
        catat = semua.setdefault(akun.lower(), {})
        try:
            token, ig_id = muat_token(akun)
        except SystemExit as e:
            print(f"@{akun} dilewati: {e}"); continue
        for fungsi in (layani_komentar, layani_dm):
            try:
                n = fungsi(akun, token, ig_id, cfg, catat, sisa)
            except SystemExit as e:
                print(f"[{akun}] {fungsi.__name__} gagal: {e}"); n = 0
            sisa -= n; total += n
    json.dump(semua, open(CATAT, "w"), indent=0)
    print(f"Selesai: {total} balasan kata kunci.")


if __name__ == "__main__":
    main()
