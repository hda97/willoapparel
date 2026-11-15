"""Balas otomatis komentar baru di reel @duniakotak.id (Instagram Graph API resmi).

Jalan dari .github/workflows/ig-komentar.yml. Butuh izin instagram_manage_comments
pada token (secret IG_TOKEN). Komentar yang sudah dibalas dicatat di dibalas.json.
Balasan berbasis kata kunci, gaya Raka (warga No. 1), selalu ajak "link di bio".

DM otomatis (Private Reply, Huda 15 Nov 2026): tiap komentar baru juga dikirimi DM
berisi link pendaftaran warga (LINK_WARGA) lewat POST me/messages dengan
recipient={"comment_id": ...}. Butuh izin instagram_manage_messages pada token dan
"Izinkan akses ke pesan" menyala di pengaturan IG. Kalau DM berhasil, balasan publik
bilang "cek DM"; kalau gagal (izin belum ada), balasan publik tetap "link di bio".
Satu orang paling banyak 1 DM per DM_JEDA_JAM jam (catatan di dikirim-dm.json).

AI gratis (ai/ai_gratis.py, Gemini lalu Groq; Huda 15 Nov 2026): komentar yang tidak cocok
aturan mana pun dibalas AI gaya Raka, nyambung dengan isi komentar. Balasan AI disaring
(pendek, tanpa link/angka harga/mention lain); kalau gagal saring, kunci belum ada, atau
kuota habis, kembali ke template UMUM. Matikan dengan env AI_KOMENTAR=0.
"""
import datetime as dt, json, os, random, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from posting import req, muat_token, AKUN, DIR
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ai"))
try:
    from ai_gratis import tanya, ada_kunci
except ImportError:  # folder ai/ tidak ikut di-checkout
    tanya, ada_kunci = (lambda *a, **k: None), (lambda: False)

CATAT = os.path.join(DIR, "dibalas.json")
CATAT_DM = os.path.join(DIR, "dikirim-dm.json")
LINK_WARGA = "https://www.willoapparel.com/warga"
DM_AKTIF = os.environ.get("IG_DM", "1") != "0"
DM_JEDA_JAM = 24
MAKS_PER_JALAN = int(os.environ.get("MAKS_BALAS", "25"))
UMUR_HARI = 7
AI_AKTIF = os.environ.get("AI_KOMENTAR", "1") != "0"
AI_SISA = [int(os.environ.get("AI_MAKS", "15"))]  # batas panggilan AI per jalan
SISTEM_AI = (
    "Kamu Raka, warga No. 1 di Dunia Kotak, game desa santai yang dimainkan langsung di HP tanpa instal; "
    "warga daftar gratis, dapat rumah, dan voting fasilitas yang dibangun tiap minggu. Balas komentar Instagram "
    "dengan bahasa Indonesia santai, ramah, 1 kalimat (maks 20 kata), boleh 1 emoji. Nyambung dengan isi komentar. "
    "Jangan tulis link, angka harga, tanggal, atau mention akun lain. Jangan pernah menjanjikan fitur atau bangunan akan dibuat; "
    "kalau komentar mengusulkan bangunan/fitur, bilang usulnya bisa menang lewat voting warga mingguan. Jangan menyinggung SARA/politik. "
    "Akhiri dengan ajakan {ajakan}.")

ATURAN = [
    (r"gak bisa|ga bisa|nggak bisa|tidak bisa|gk bisa|error|gagal|kok gak|kok ga|eror|nyangkut|loading", [
        "Waduh maaf, @{u} 🙏 Coba buka lewat link di bio pakai Chrome/Safari ya. Kalau masih gagal, DM kami, langsung kami bantu!",
        "Maaf ya, @{u} 🙏 Coba buka ulang dari link di bio (Chrome/Safari). Masih belum bisa? DM aja, kami bantu cek."]),
    (r"kafe|cafe|polisi|pemadam|damkar|taman|hiburan|bioskop|kolam|bandara|pelabuhan|pasar|sekolah|masjid|rumah sakit|stadion", [
        "Pilihan bagus, @{u}! 🗳️ Biar suaramu dihitung, ikut voting fasum lewat link di bio ya, tutup tiap Sabtu.",
        "Dicatat, @{u}! Yang terbanyak di voting minggu ini kami bangun 🔨 Voting lewat link di bio ya!"]),
    (r"kereta|rel\b|stasiun|🚆|🚂", [
        "Dicatat, @{u}! 🚆 Kereta masuk calon voting. Daftar jadi warga lewat link di bio, terus ikut voting ya!",
        "Suara kereta nambah satu, @{u}! 🚂 Biar makin kuat, daftar jadi warga lewat link di bio lalu voting.",
        "Siap, @{u}! Rel kereta lagi ditimbang warga 🚆 Ikut voting lewat link di bio ya!"]),
    (r"cara|gimana|gmn|bagaimana|link|main(in)?\b|download|install|daftar|dimana|di mana|apk|play ?store", [
        "Mainnya langsung di HP, nggak usah install, @{u} 🎮 Link-nya di bio ya!",
        "Gampang, @{u}! Klik link di bio, daftar gratis, langsung jadi warga Dunia Kotak 🏠",
        "@{u} tinggal buka link di bio, daftar gratis, dapat rumah sendiri di desa 😄"]),
    (r"bangun|buat(in|kan)?\b|tambah|minta|request|usul|bikin|pengen|ingin|mau ada", [
        "Usulan diterima, @{u}! 📝 Tiap Sabtu warga voting, yang terbanyak kami bangun. Daftar dulu lewat link di bio ya!",
        "Dicatat ke daftar usulan, @{u}! Kamu komen, kami bangun 🔨 Ikut voting lewat link di bio.",
        "Wah ide bagus, @{u}! 💡 Masuk catatan usulan warga. Biar kepilih, ikut voting lewat link di bio ya!"]),
    (r"keren|mantap|mantul|bagus|seru|wow|gokil|gila|anjay|asik|asyik|lucu|🔥|😍|👍|❤|🤩|👏", [
        "Makasih, @{u}! 🙌 Yuk jadi warga juga, link di bio!",
        "Hehe makasih, @{u} 😄 Ditunggu di desa ya, daftar gratis lewat link di bio!",
        "Makasih banyak, @{u}! Masih banyak yang mau dibangun, ikutan yuk, link di bio 🏗️"]),
]
UMUM = [
    "Halo, @{u}! 👋 Komenmu kami baca semua. Mau ikut bangun desanya? Link di bio ya!",
    "Makasih udah mampir, @{u}! Daftar jadi warga Dunia Kotak gratis lewat link di bio 🏠",
    "Siap, @{u}! Kamu komen, kami bangun 🔨 Daftar dulu lewat link di bio ya!"]

# Balasan publik saat link sudah terkirim ke DM.
ATURAN_DM = [
    (r"gak bisa|ga bisa|nggak bisa|tidak bisa|gk bisa|error|gagal|kok gak|kok ga|eror|nyangkut|loading", [
        "Maaf ya, @{u} 🙏 Linknya aku kirim ke DM, coba buka pakai Chrome/Safari ya!",
        "Waduh maaf, @{u} 🙏 Cek DM ya, aku kirim link langsung. Masih gagal? Balas DM-nya, kami bantu."]),
    (r"kafe|cafe|polisi|pemadam|damkar|taman|hiburan|bioskop|kolam|bandara|pelabuhan|pasar|sekolah|masjid|rumah sakit|stadion|kereta|stasiun|bangun|usul|request|minta", [
        "Dicatat, @{u}! 🗳️ Link daftar warga & voting aku kirim ke DM ya 📩",
        "Usulan masuk, @{u}! Kamu komen, kami bangun 🔨 Cek DM, linknya udah aku kirim 📩"]),
]
UMUM_DM = [
    "Siap, warga! Linknya aku kirim ke DM ya 📩",
    "Siap, @{u}! Cek DM ya, linknya udah aku kirim 📩",
    "Udah aku kirim ke DM, @{u}! Daftar gratis, langsung jadi warga 🏠",
    "Cek DM ya, @{u} 📩 Link daftar warga udah meluncur!"]

PESAN_DM = [
    "Ini dia! 🎉 Daftar jadi warga gratis, langsung main di HP tanpa instal.\n👉 " + LINK_WARGA,
    "Halo, warga baru! 🏠 Daftar gratis di sini, dapat rumah sendiri & ikut voting bangun desa:\n👉 " + LINK_WARGA,
    "Ini linknya ya! 🎮 Gratis, langsung main di HP tanpa instal. Sampai ketemu di desa!\n👉 " + LINK_WARGA]


def balasan_ai(teks, user, dm):
    """Balasan AI untuk komentar yang tak cocok aturan, atau None (pakai template)."""
    teks = (teks or "").strip()
    if not (AI_AKTIF and ada_kunci()) or AI_SISA[0] <= 0 or len(teks) < 3:
        return None
    AI_SISA[0] -= 1
    ajakan = "cek DM (link sudah dikirim)" if dm else "daftar lewat link di bio"
    t = tanya(f"Komentar dari @{user}: \"{teks[:300]}\"", sistem=SISTEM_AI.format(ajakan=ajakan), maks_token=80, suhu=0.8)
    t = re.sub(r"\s+", " ", (t or "")).strip().strip('"')
    t = re.sub(r"@\w[\w.]*", "", t).strip()
    if not t or len(t) > 180 or re.search(r"https?:|www\.|\.com|rp ?\d|\d{3,}", t, re.I):
        return None
    if not re.search(r"bio|dm", t, re.I):
        t += " Cek DM ya 📩" if dm else " Link di bio ya!"
    return f"@{user} {t}"


def balasan_dm(teks, user):
    t = teks.lower()
    for pola, pilihan in ATURAN_DM:
        if re.search(pola, t):
            return random.choice(pilihan).format(u=user)
    return balasan_ai(teks, user, True) or random.choice(UMUM_DM).format(u=user)


def kirim_dm(token, comment_id):
    """Private Reply ke pengomentar. True kalau terkirim; SystemExit kalau ditolak."""
    req("POST", "me/messages", access_token=token,
        recipient=json.dumps({"comment_id": comment_id}),
        message=json.dumps({"text": random.choice(PESAN_DM)}, ensure_ascii=False))
    return True


def balasan(teks, user):
    t = teks.lower()
    for pola, pilihan in ATURAN:
        if re.search(pola, t):
            return random.choice(pilihan).format(u=user)
    return balasan_ai(teks, user, False) or random.choice(UMUM).format(u=user)


def main():
    token, ig_id = muat_token()
    catat = set(json.load(open(CATAT))) if os.path.exists(CATAT) else set()
    dm = json.load(open(CATAT_DM)) if os.path.exists(CATAT_DM) else {}
    sekarang = dt.datetime.now(dt.timezone.utc)
    dm = {u: w for u, w in dm.items() if sekarang - dt.datetime.fromisoformat(w) < dt.timedelta(days=30)}
    dm_bisa = DM_AKTIF
    n_dm = 0
    batas = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=UMUR_HARI)
    media = req("GET", f"{ig_id}/media", fields="id,timestamp,caption", limit=15, access_token=token)["data"]
    n = 0
    for m in media:
        if dt.datetime.fromisoformat(m["timestamp"].replace("+0000", "+00:00")) < batas - dt.timedelta(days=30):
            continue
        kom = req("GET", f"{m['id']}/comments", fields="id,text,username,timestamp,replies{username}",
                  limit=50, access_token=token).get("data", [])
        for c in kom:
            if n >= MAKS_PER_JALAN:
                break
            if c["id"] in catat or c.get("username", "").lower() == AKUN.lower():
                continue
            if any(r.get("username", "").lower() == AKUN.lower() for r in (c.get("replies") or {}).get("data", [])):
                catat.add(c["id"]); continue
            if dt.datetime.fromisoformat(c["timestamp"].replace("+0000", "+00:00")) < batas:
                catat.add(c["id"]); continue
            user = c.get("username", "kak")
            terkirim = False
            terakhir = dm.get(user.lower())
            baru_dm = terakhir and sekarang - dt.datetime.fromisoformat(terakhir) < dt.timedelta(hours=DM_JEDA_JAM)
            if dm_bisa and not baru_dm:
                try:
                    terkirim = kirim_dm(token, c["id"])
                    dm[user.lower()] = sekarang.isoformat(timespec="seconds"); n_dm += 1
                except SystemExit as e:
                    print(f"DM gagal, sisa jalan ini pakai 'link di bio': {e}")
                    dm_bisa = False
            teks = balasan_dm(c.get("text", ""), user) if (terkirim or baru_dm) else balasan(c.get("text", ""), user)
            req("POST", f"{c['id']}/replies", message=teks, access_token=token)
            catat.add(c["id"]); n += 1
            print(f"Balas @{user}{' +DM' if terkirim else ''}: {c.get('text','')[:60]!r} -> {teks}")
    json.dump(sorted(catat), open(CATAT, "w"), indent=0)
    json.dump(dm, open(CATAT_DM, "w"), indent=0, sort_keys=True)
    print(f"Selesai: {n} komentar dibalas, {n_dm} DM terkirim.")


if __name__ == "__main__":
    main()
