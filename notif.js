// Notifikasi HP Dunia Kotak (Huda 11 Nov 2026: "tambah pemain harian" → pengingat panen, Pasar Malam, voting, pulang kampung).
// Web Push standar (RFC 8030 + VAPID RFC 8292 + enkripsi aes128gcm RFC 8291) hanya pakai WebCrypto, tanpa pustaka luar.
// Kunci VAPID dibuat sekali oleh database warga dan disimpan di tabel rahasia (bukan di kode).

const enc = new TextEncoder();
export const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const unb64u = (s) => { const t = String(s).replace(/-/g, "+").replace(/_/g, "/"); const b = atob(t + "===".slice((t.length + 3) % 4)); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };
const gabung = (...a) => { const n = a.reduce((x, y) => x + y.length, 0), o = new Uint8Array(n); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
async function hmac(kunci, data) {
  const k = await crypto.subtle.importKey("raw", kunci, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}

// Pasangan kunci VAPID baru: { pub: kunci publik 65 byte (base64url, untuk applicationServerKey), jwk: kunci privat }.
export async function buatVapid() {
  const p = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  return { pub: b64u(await crypto.subtle.exportKey("raw", p.publicKey)), jwk: await crypto.subtle.exportKey("jwk", p.privateKey) };
}

// Header Authorization VAPID untuk satu layanan push (aud = asal endpoint).
async function headerVapid(endpoint, vapid) {
  const aud = new URL(endpoint).origin;
  const kepala = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const isi = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "https://willoapparel.com/duniakotak/" })));
  const k = await crypto.subtle.importKey("jwk", vapid.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const ttd = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, k, enc.encode(kepala + "." + isi));
  return `vapid t=${kepala}.${isi}.${b64u(ttd)}, k=${vapid.pub}`;
}

// Enkripsi isi pesan untuk satu langganan (RFC 8291, satu rekaman aes128gcm).
export async function enkripsi(teks, p256dh, auth) {
  const uaPub = unb64u(p256dh), rahasiaAuth = unb64u(auth);
  const as = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", as.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, as.privateKey, 256));
  const prkKey = await hmac(rahasiaAuth, ecdh);
  const ikm = (await hmac(prkKey, gabung(enc.encode("WebPush: info\0"), uaPub, asPub, new Uint8Array([1])))).slice(0, 32);
  const garam = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(garam, ikm);
  const cek = (await hmac(prk, gabung(enc.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, gabung(enc.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);
  const k = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const sandi = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, gabung(enc.encode(teks), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]);   // 4096
  return gabung(garam, rs, new Uint8Array([asPub.length]), asPub, sandi);
}

// Kirim satu notifikasi. Hasil: status HTTP layanan push (201 = terkirim, 404/410 = langganan sudah mati).
export async function kirimPush(sub, pesan, vapid, ttl = 6 * 3600) {
  const body = await enkripsi(JSON.stringify(pesan), sub.p256dh, sub.auth);
  const r = await fetch(sub.ep, { method: "POST", body, headers: {
    authorization: await headerVapid(sub.ep, vapid), "content-encoding": "aes128gcm", "content-type": "application/octet-stream",
    ttl: String(ttl), urgency: "normal", topic: String(pesan.tag || "dk").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || "dk" } });
  return r.status;
}

// Hanya layanan push resmi browser yang diterima (mencegah server dipakai mengirim ke alamat sembarang).
export const endpointSah = (ep) => { try { const u = new URL(ep); return u.protocol === "https:" && ep.length <= 800 &&
  /(^|\.)(fcm\.googleapis\.com|android\.googleapis\.com|push\.services\.mozilla\.com|push\.apple\.com|notify\.windows\.com)$/.test(u.hostname); } catch (e) { return false; } };
