"""Posting reel/carousel ke Instagram lewat Instagram Graph API resmi.

Akun utama @duniakotak.id (antrean konten-ig/antrean/). Akun lain dipilih dengan env IG_USERNAME
dan memakai antrean konten-ig/antrean-<akun>/ (mis. Lumbung di @miftakhul_hda). Satu tanggal boleh
punya beberapa file: YYYY-MM-DD.json, YYYY-MM-DD-1.json, YYYY-MM-DD-2.json, ... masing-masing dengan "jam".
Carousel: {"jenis": "CAROUSEL", "gambar": ["https://...1.jpg", ...], "caption": ..., "jam": ...}.

Dijalankan oleh .github/workflows/ig-posting.yml. Tanpa layanan pihak ketiga, gratis.

Antrean: konten-ig/antrean/YYYY-MM-DD.json
  {"video": "https://willoapparel.com/....mp4",   # URL publik MP4 9:16 (H.264 + AAC)
   "caption": "teks caption",
   "jam": "18:31",                                  # WIB, opsional (default 18:31)
   "sampul": "https://.../2026-11-14-sampul.jpg",   # opsional: sampul JPG 9:16 (default: <video>-sampul.jpg bila ada)
   "sampul_ms": 0}                                  # opsional: bingkai sampul (milidetik) bila tak ada gambar
Setelah terbit, file diberi kolom "terbit": {"id", "permalink", "waktu"}.

Token: secret IG_TOKEN (token pengguna dari Graph API Explorer) + IG_APP_ID + IG_APP_SECRET.
Run pertama menukarnya jadi token Halaman jangka panjang (tidak kedaluwarsa), lalu
menyimpannya terenkripsi (kunci = IG_APP_SECRET) di konten-ig/token.enc.
"""
import base64, datetime as dt, glob, hashlib, json, os, re, subprocess, sys, time, urllib.parse, urllib.request

API = "https://graph.facebook.com/v21.0"
DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(DIR, "token.enc")
WIB = dt.timezone(dt.timedelta(hours=7))
UTAMA = "duniakotak.id"  # akun yang token-nya di token.enc dan antrean-nya di antrean/
AKUN = os.environ.get("IG_USERNAME") or UTAMA


def req(method, path, **params):
    url = path if path.startswith("http") else f"{API}/{path}"
    data = None
    if method == "GET":
        url += "?" + urllib.parse.urlencode(params)
    else:
        data = urllib.parse.urlencode(params).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=data, method=method), timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        raise SystemExit(f"Graph API {method} {path.split('?')[0]} gagal ({e.code}): {body}")


def openssl(args, data):
    return subprocess.run(["openssl", "enc", "-aes-256-cbc", "-pbkdf2", "-a", "-A", *args,
                           "-pass", "env:IG_APP_SECRET"], input=data, capture_output=True, check=True).stdout


def sidik(tok):
    return hashlib.sha256((tok or "").encode()).hexdigest()[:16]


def file_token(akun=None):
    """token.enc untuk akun utama (@duniakotak.id), token-<akun>.enc untuk akun lain."""
    akun = (akun or AKUN).lower()
    return TOKEN_FILE if akun == UTAMA else os.path.join(DIR, f"token-{akun}.enc")


def simpan_token(page_token, ig_id, src=None, akun=None):
    src = src or sidik(os.environ.get("IG_TOKEN"))
    blob = json.dumps({"page_token": page_token, "ig_id": ig_id, "src": src}).encode()
    with open(file_token(akun), "wb") as f:
        f.write(openssl([], blob))


def muat_token(akun=None):
    """Token Halaman dari token.enc. Kalau secret IG_TOKEN diganti (mis. izin baru),
    token Halaman diturunkan ulang; gagal -> tetap pakai token.enc lama."""
    user = os.environ.get("IG_TOKEN")
    f = file_token(akun)
    if os.path.exists(f):
        d = json.loads(openssl(["-d"], open(f, "rb").read()))
        if not user or d.get("src") == sidik(user):
            return d["page_token"], d["ig_id"]
        try:
            return turunkan(user, akun)
        except SystemExit as e:
            print(f"IG_TOKEN baru tidak bisa dipakai, tetap pakai token lama: {e}")
            simpan_token(d["page_token"], d["ig_id"], akun=akun)
            return d["page_token"], d["ig_id"]
    return turunkan(user, akun)


def cadangan(akun=None):
    """Token Halaman akun ini rusak (mis. sesi dibatalkan Facebook) dan IG_TOKEN kedaluwarsa:
    coba turunkan ulang dari token pengguna jangka panjang yang tersimpan di token*.enc akun lain
    (token.enc @duniakotak.id menyimpan token pengguna bila IG_USER_ID dipakai)."""
    akun = (akun or AKUN).lower()
    for f in [TOKEN_FILE] + sorted(glob.glob(os.path.join(DIR, "token-*.enc"))):
        if f == file_token(akun) or not os.path.exists(f):
            continue
        try:
            tok = json.loads(openssl(["-d"], open(f, "rb").read()))["page_token"]
            for p in daftar_halaman(tok):
                ig = p.get("instagram_business_account") or {}
                if ig.get("username", "").lower() == akun:
                    d = json.loads(openssl(["-d"], open(file_token(akun), "rb").read())) if os.path.exists(file_token(akun)) else {}
                    simpan_token(p["access_token"], ig["id"], src=d.get("src"), akun=akun)
                    print(f"Token Halaman @{akun} diturunkan ulang dari {os.path.basename(f)}.")
                    return p["access_token"], ig["id"]
        except (SystemExit, Exception) as e:
            print(f"Cadangan {os.path.basename(f)} tidak bisa dipakai: {str(e)[:160]}")
    raise SystemExit(f"Tidak ada token cadangan yang menjangkau @{akun}. Perbarui secret IG_TOKEN.")


def daftar_halaman(user):
    """Semua Halaman + akun IG yang bisa dijangkau token pengguna (untuk cek akun)."""
    return req("GET", "me/accounts", access_token=user,
               fields="name,access_token,instagram_business_account{id,username}")["data"]


def turunkan(user, akun=None):
    akun = akun or AKUN
    if not user:
        raise SystemExit("Secret IG_TOKEN belum diisi.")
    # 1) token pengguna jangka pendek -> jangka panjang (60 hari). Token yang tidak bisa
    #    ditukar (mis. token pengguna sistem / sudah jangka panjang) dipakai apa adanya.
    try:
        long_user = req("GET", "oauth/access_token", grant_type="fb_exchange_token",
                        client_id=os.environ["IG_APP_ID"], client_secret=os.environ["IG_APP_SECRET"],
                        fb_exchange_token=user)["access_token"]
    except SystemExit as e:
        print(f"Tukar token dilewati: {e}")
        long_user = user
    ig_manual = os.environ.get("IG_USER_ID", "").strip() if akun.lower() == UTAMA else ""
    if ig_manual:
        simpan_token(long_user, ig_manual)
        return long_user, ig_manual
    # 2) token Halaman dari token pengguna jangka panjang = tidak kedaluwarsa
    pages = daftar_halaman(long_user)
    for p in pages:
        ig = p.get("instagram_business_account") or {}
        if ig.get("username", "").lower() == akun.lower():
            simpan_token(p["access_token"], ig["id"], akun=akun)
            print(f"Token Halaman '{p['name']}' untuk @{akun} disimpan.")
            return p["access_token"], ig["id"]
    names = [(p.get("name"), (p.get("instagram_business_account") or {}).get("username")) for p in pages]
    raise SystemExit(f"Akun @{akun} tidak ditemukan di Halaman yang diizinkan token: {names}")


def jatuh_tempo(item, now):
    jam = item.get("jam", "18:31")
    h, m = map(int, jam.split(":"))
    return now >= now.replace(hour=h, minute=m, second=0, microsecond=0)


def tebak_sampul(video):
    """.../reel/2026-11-14.mp4 -> .../reel/2026-11-14-sampul.jpg bila gambar itu ada (cek lewat HTTP)."""
    if not (video or "").endswith(".mp4"):
        return None
    url = video[:-4] + "-sampul.jpg"
    try:
        with urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=20) as r:
            return url if r.status == 200 else None
    except Exception:
        return None


def tunggu(token, cid):
    for _ in range(60):  # tunggu Instagram memproses media, maks ±10 menit
        st = req("GET", cid, fields="status_code,status", access_token=token)
        if st.get("status_code") == "FINISHED":
            return
        if st.get("status_code") == "ERROR":
            raise SystemExit(f"Instagram menolak media: {st}")
        time.sleep(10)
    raise SystemExit("Media tidak selesai diproses dalam 10 menit.")


def terbitkan_carousel(token, ig_id, item):
    gambar = item["gambar"]
    if not 2 <= len(gambar) <= 10:
        raise SystemExit("Carousel butuh 2–10 gambar.")
    anak = [req("POST", f"{ig_id}/media", image_url=u, is_carousel_item="true", access_token=token)["id"] for u in gambar]
    for c in anak:
        tunggu(token, c)
    cid = req("POST", f"{ig_id}/media", media_type="CAROUSEL", children=",".join(anak),
              caption=item.get("caption", ""), access_token=token)["id"]
    tunggu(token, cid)
    mid = req("POST", f"{ig_id}/media_publish", creation_id=cid, access_token=token)["id"]
    link = req("GET", mid, fields="permalink", access_token=token).get("permalink", "")
    return mid, link


def terbitkan(token, ig_id, item):
    if item.get("jenis", "").upper() == "CAROUSEL":
        return terbitkan_carousel(token, ig_id, item)
    p = dict(media_type="REELS", video_url=item["video"], caption=item.get("caption", ""),
             share_to_feed="true", access_token=token)
    # Sampul: "sampul" = URL gambar JPG 9:16 (dipasang sebagai cover_url, tidak bisa diganti lewat API setelah terbit).
    # Bila kosong, otomatis pakai <video tanpa .mp4>-sampul.jpg kalau file itu ada. "sampul_ms" = ambil bingkai video.
    sampul = item.get("sampul") or tebak_sampul(item["video"])
    if sampul:
        p["cover_url"] = sampul
    elif item.get("sampul_ms") is not None:
        p["thumb_offset"] = str(int(item["sampul_ms"]))
    cid = req("POST", f"{ig_id}/media", **p)["id"]
    for _ in range(60):  # tunggu Instagram memproses video, maks ±10 menit
        st = req("GET", cid, fields="status_code,status", access_token=token)
        if st.get("status_code") == "FINISHED":
            break
        if st.get("status_code") == "ERROR":
            raise SystemExit(f"Instagram menolak video: {st}")
        time.sleep(10)
    else:
        raise SystemExit("Video tidak selesai diproses dalam 10 menit.")
    mid = req("POST", f"{ig_id}/media_publish", creation_id=cid, access_token=token)["id"]
    link = req("GET", mid, fields="permalink", access_token=token).get("permalink", "")
    return mid, link


def uji(video, sampul, gambar):
    """Uji jalur posting TANPA menerbitkan: token, izin terbit, dan Instagram mau memproses
    media (reel + carousel). Kontainer yang tidak diterbitkan hangus sendiri dalam 24 jam."""
    token, ig_id = muat_token()
    print(f"Token OK untuk IG id {ig_id}.")
    me = req("GET", ig_id, fields="username", access_token=token)
    print(f"Akun: @{me.get('username')}")
    lim = req("GET", f"{ig_id}/content_publishing_limit", fields="quota_usage,config", access_token=token)
    print(f"Izin terbit OK, kuota 24 jam: {lim}")
    p = dict(media_type="REELS", video_url=video, access_token=token)
    if sampul:
        p["cover_url"] = sampul
    cid = req("POST", f"{ig_id}/media", **p)["id"]
    tunggu(token, cid)
    print("Reel: diproses Instagram (FINISHED), TIDAK diterbitkan.")
    if gambar:
        anak = [req("POST", f"{ig_id}/media", image_url=u, is_carousel_item="true", access_token=token)["id"] for u in gambar]
        for c in anak:
            tunggu(token, c)
        cid = req("POST", f"{ig_id}/media", media_type="CAROUSEL", children=",".join(anak), access_token=token)["id"]
        tunggu(token, cid)
        print("Carousel: diproses Instagram (FINISHED), TIDAK diterbitkan.")
    print("UJI LULUS")


def main():
    if os.environ.get("UJI_VIDEO"):
        return uji(os.environ["UJI_VIDEO"], os.environ.get("UJI_SAMPUL"),
                   [u for u in os.environ.get("UJI_GAMBAR", "").split() if u])
    paksa = os.environ.get("PAKSA_TANGGAL", "").strip()
    now = dt.datetime.now(WIB)
    folder = os.path.join(DIR, "antrean" if AKUN.lower() == UTAMA else f"antrean-{AKUN.lower()}")
    tgl = paksa or f"{now:%Y-%m-%d}"
    files = sorted(set(glob.glob(os.path.join(folder, f"{tgl}.json")) + glob.glob(os.path.join(folder, f"{tgl}-*.json"))))
    if not files:
        files = [os.path.join(folder, f"{tgl}.json")]
    todo = []
    for f in files:
        if not os.path.exists(f):
            print(f"Tidak ada antrean {os.path.basename(f)}.")
            continue
        item = json.load(open(f))
        if item.get("terbit"):
            print(f"{os.path.basename(f)} sudah terbit: {item['terbit'].get('permalink')}")
        elif paksa or jatuh_tempo(item, now):
            todo.append((f, item))
        else:
            print(f"{os.path.basename(f)} belum waktunya ({item.get('jam', '18:31')} WIB).")
    if os.environ.get("CEK_TOKEN") == "1" or todo:
        token, ig_id = muat_token()
        print(f"Token OK untuk IG id {ig_id}.")
    # Satu run satu postingan: kalau cron telat sampai dua slot jatuh tempo bersamaan,
    # yang lebih awal terbit sekarang dan sisanya di run berikutnya (tidak terbit beruntun).
    for f, item in todo[:1]:
        try:
            mid, link = terbitkan(token, ig_id, item)
        except SystemExit as e:
            if '"code":190' not in str(e):
                raise
            print(f"Token Halaman ditolak, coba token cadangan: {str(e)[:200]}")
            token, ig_id = cadangan()
            mid, link = terbitkan(token, ig_id, item)
        item["terbit"] = {"id": mid, "permalink": link, "waktu": dt.datetime.now(WIB).isoformat(timespec="seconds")}
        json.dump(item, open(f, "w"), ensure_ascii=False, indent=2)
        print(f"TERBIT: {link}")
        with open(os.environ.get("GITHUB_STEP_SUMMARY", os.devnull), "a") as s:
            s.write(f"Reel terbit: {link}\n")


if __name__ == "__main__":
    main()
