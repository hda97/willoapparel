"""Ambil insight reel @duniakotak.id (Instagram Graph API) -> konten-ig/insight/.

Butuh izin instagram_manage_insights pada token (secret IG_TOKEN).
Hasil: insight/terbaru.json (ditimpa) + insight/<YYYY-MM-DD>.json (arsip harian).
"""
import datetime as dt, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from posting import req, muat_token, DIR, WIB

METRIK = ["views", "reach", "likes", "comments", "saved", "shares", "total_interactions",
          "ig_reels_avg_watch_time", "ig_reels_video_view_total_time", "follows", "profile_visits"]


def insight(mid, token):
    try:
        data = req("GET", f"{mid}/insights", metric=",".join(METRIK), access_token=token)["data"]
    except SystemExit:
        data = []
        for m in METRIK:  # metrik yang tidak didukung untuk media ini dilewati satu per satu
            try:
                data += req("GET", f"{mid}/insights", metric=m, access_token=token)["data"]
            except SystemExit as e:
                if "permission" in str(e).lower() or "(#10)" in str(e):
                    raise
    return {d["name"]: (d.get("values") or [{}])[0].get("value", d.get("total_value", {}).get("value")) for d in data}


def main():
    token, ig_id = muat_token()
    akun = req("GET", ig_id, fields="username,followers_count,media_count", access_token=token)
    media = req("GET", f"{ig_id}/media", fields="id,caption,timestamp,permalink,media_type,media_product_type,like_count,comments_count",
                limit=int(os.environ.get("JUMLAH", "25")), access_token=token)["data"]
    hasil = []
    for m in media:
        row = {"id": m["id"], "waktu": m["timestamp"], "link": m.get("permalink"), "jenis": m.get("media_product_type"),
               "judul": (m.get("caption") or "").split("\n")[0][:80]}
        try:
            row.update(insight(m["id"], token))
        except SystemExit as e:
            row["error"] = str(e)[:300]
        if row.get("ig_reels_avg_watch_time") is not None:
            row["rata_tonton_dtk"] = round(row["ig_reels_avg_watch_time"] / 1000, 1)
        hasil.append(row)
    out = {"diambil": dt.datetime.now(WIB).isoformat(timespec="minutes"), "akun": akun, "media": hasil}
    d = os.path.join(DIR, "insight"); os.makedirs(d, exist_ok=True)
    for f in ("terbaru.json", f"{dt.datetime.now(WIB):%Y-%m-%d}.json"):
        json.dump(out, open(os.path.join(d, f), "w"), ensure_ascii=False, indent=1)
    print(f"@{akun.get('username')} pengikut {akun.get('followers_count')}")
    for r in hasil[:12]:
        print(f"{r['waktu'][:10]} {r.get('views')} tayang, jangkau {r.get('reach')}, tonton {r.get('rata_tonton_dtk')} dtk, "
              f"simpan {r.get('saved')}, bagikan {r.get('shares')} | {r['judul'][:40]} {r.get('error','')[:80]}")


if __name__ == "__main__":
    main()
