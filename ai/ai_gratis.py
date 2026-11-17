"""AI gratis bersama untuk semua skrip Willo (Huda 15 Nov 2026: "Pasang", "Gunakan di semua proyek").

Urutan penyedia (semua gratis, tanpa kartu kredit):
1. Google Gemini  -> secret GEMINI_API_KEY (ambil di aistudio.google.com/apikey)
2. Groq (Llama & Qwen) -> secret GROQ_API_KEY (ambil di console.groq.com/keys)
Kalau satu penyedia habis kuota / error, otomatis pindah ke berikutnya. Kalau semua gagal
atau kunci belum dipasang, tanya() mengembalikan None, jadi skrip pemanggil WAJIB punya
cadangan (template lama). AI tidak pernah membuat skrip berhenti.

Pakai:
    sys.path.insert(0, "<akar repo>/ai"); from ai_gratis import tanya
    teks = tanya("Ringkas ini: ...", sistem="Kamu admin toko kaos.", maks_token=200)

Model bisa diganti tanpa ubah kode lewat env GEMINI_MODEL / GROQ_MODEL (pisahkan koma).
Hanya pustaka bawaan Python (urllib), tanpa pip install.
"""
import json, os, re, sys, urllib.error, urllib.request

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-lite-latest,gemini-flash-latest").split(",")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile,qwen/qwen3-32b,llama-3.1-8b-instant").split(",")
BATAS_DETIK = 25


def _post(url, data, header):
    r = urllib.request.Request(url, json.dumps(data).encode(), {"Content-Type": "application/json", **header})
    with urllib.request.urlopen(r, timeout=BATAS_DETIK) as f:
        return json.load(f)


def _gemini(kunci, model, sistem, prompt, maks, suhu):
    data = {"contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": max(maks, 256), "temperature": suhu}}
    if sistem:
        data["systemInstruction"] = {"parts": [{"text": sistem}]}
    j = _post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
              data, {"x-goog-api-key": kunci})
    parts = ((j.get("candidates") or [{}])[0].get("content") or {}).get("parts") or []
    return "".join(p.get("text", "") for p in parts if not p.get("thought"))


def _groq(kunci, model, sistem, prompt, maks, suhu):
    pesan = ([{"role": "system", "content": sistem}] if sistem else []) + [{"role": "user", "content": prompt}]
    j = _post("https://api.groq.com/openai/v1/chat/completions",
              {"model": model, "messages": pesan, "max_tokens": maks, "temperature": suhu},
              {"Authorization": f"Bearer {kunci}", "User-Agent": "willo-ai/1.0"})
    # Qwen3 kadang menulis proses berpikir di <think>...</think>: buang.
    return re.sub(r"<think>.*?</think>", "", j["choices"][0]["message"]["content"] or "", flags=re.S)


def ada_kunci():
    return bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GROQ_API_KEY"))


def tanya(prompt, sistem=None, maks_token=300, suhu=0.7):
    """Jawaban teks dari AI gratis pertama yang berhasil, atau None."""
    jalur = [(_gemini, os.environ.get("GEMINI_API_KEY"), GEMINI_MODEL),
             (_groq, os.environ.get("GROQ_API_KEY"), GROQ_MODEL)]
    for fungsi, kunci, model in jalur:
        if not kunci:
            continue
        for m in model:
            m = m.strip()
            try:
                t = (fungsi(kunci, m, sistem, prompt, maks_token, suhu) or "").strip()
                if t:
                    return t
            except urllib.error.HTTPError as e:
                print(f"[ai] {fungsi.__name__[1:]} {m}: HTTP {e.code}", file=sys.stderr)
            except Exception as e:  # jaringan putus, JSON aneh, dsb.
                print(f"[ai] {fungsi.__name__[1:]} {m}: {e}", file=sys.stderr)
    return None


if __name__ == "__main__":
    # Tes cepat: GEMINI_API_KEY=... python3 ai/ai_gratis.py "halo"
    print(tanya(" ".join(sys.argv[1:]) or "Jawab satu kata: AI siap?") or "(tidak ada jawaban: kunci belum dipasang atau kuota habis)")
