"""Balas otomatis komentar baru di reel @duniakotak.id (Instagram Graph API resmi).

Jalan dari .github/workflows/ig-komentar.yml. Butuh izin instagram_manage_comments
pada token (secret IG_TOKEN). Komentar yang sudah dibalas dicatat di dibalas.json.
Balasan berbasis kata kunci, gaya Raka (warga No. 1), selalu ajak "link di bio".
"""
import datetime as dt, json, os, random, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from posting import req, muat_token, AKUN, DIR

CATAT = os.path.join(DIR, "dibalas.json")
MAKS_PER_JALAN = int(os.environ.get("MAKS_BALAS", "25"))
UMUR_HARI = 7

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


def balasan(teks, user):
    t = teks.lower()
    for pola, pilihan in ATURAN:
        if re.search(pola, t):
            return random.choice(pilihan).format(u=user)
    return random.choice(UMUM).format(u=user)


def main():
    token, ig_id = muat_token()
    catat = set(json.load(open(CATAT))) if os.path.exists(CATAT) else set()
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
            teks = balasan(c.get("text", ""), c.get("username", "kak"))
            req("POST", f"{c['id']}/replies", message=teks, access_token=token)
            catat.add(c["id"]); n += 1
            print(f"Balas @{c.get('username')}: {c.get('text','')[:60]!r} -> {teks}")
    json.dump(sorted(catat), open(CATAT, "w"), indent=0)
    print(f"Selesai: {n} komentar dibalas.")


if __name__ == "__main__":
    main()
