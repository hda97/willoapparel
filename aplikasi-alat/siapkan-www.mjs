// Salin alat usaha dari public/alat ke www/ supaya aplikasi jalan TANPA internet.
// Server lokal Capacitor tidak membuka index.html sebuah folder, jadi tautan "/alat/kasir/"
// ditulis ulang menjadi "/alat/kasir/index.html". Tautan ke halaman situs lain dibuka di browser.
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const akar = dirname(fileURLToPath(import.meta.url));
const pub = join(akar, "..", "public");
const www = join(akar, "www");
const ALAT = ["index.html", "alat.css", "printer.js", "ikon.js", "owner.js", "sinkron.js", "kasir", "antrian", "nota", "tagihan", "buku-kas", "pengaturan", "stok", "hpp", "pro", "impor", "lib", "absen", "pembelian"];
const SITUS = "https://willoapparel.com";

rmSync(www, { recursive: true, force: true });
mkdirSync(join(www, "alat"), { recursive: true });
for (const a of ALAT) cpSync(join(pub, "alat", a), join(www, "alat", a), { recursive: true });
cpSync(join(pub, "logo-willo.png"), join(www, "logo-willo.png"));

const lokal = new Set(["kasir", "antrian", "nota", "tagihan", "buku-kas", "pengaturan", "stok", "hpp", "pro", "impor", "absen", "pembelian"]);
function tulisUlang(html) {
  return html
    // Analitik situs tidak dipakai di aplikasi (jalan offline).
    .replace(/<script async src="https:\/\/www\.googletagmanager\.com[^>]*><\/script>\s*<script>[\s\S]*?<\/script>/g, "")
    .replace(/(href|src)="\/alat\/([a-z-]+)\/"/g, (m, at, nama) => lokal.has(nama) ? `${at}="/alat/${nama}/index.html"` : `${at}="${SITUS}/alat/${nama}/"`)
    .replace(/href="\/alat\/"/g, 'href="/alat/index.html"')
    .replace(/href="\/"/g, `href="${SITUS}/"`)
    .replace(/href="\/([a-z0-9-]+\.html)"/g, `href="${SITUS}/$1"`);
}
function jelajah(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) jelajah(p);
    else if (n.endsWith(".html")) writeFileSync(p, tulisUlang(readFileSync(p, "utf8")));
  }
}
jelajah(www);
writeFileSync(join(www, "index.html"),
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Lumbung by Willo Studio</title><script>location.replace("/alat/index.html")</script>');
console.log("www siap:", ALAT.join(", "));
