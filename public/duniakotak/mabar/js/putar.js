// Dunia Kotak: HP dipegang tegak -> game OTOMATIS tampil mendatar (landscape) tanpa tombol (Huda 3 Nov 2026).
// Cara kerja: body diputar 90° lewat CSS; innerWidth/innerHeight, koordinat sentuh, dan getBoundingClientRect
// ditukar supaya kode game tetap mengira layarnya mendatar. Saat HP benar-benar dimiringkan, putaran dimatikan.
const proto = Window.prototype;
const ambil = n => (Object.getOwnPropertyDescriptor(window, n) || Object.getOwnPropertyDescriptor(proto, n) || {}).get;
const gW = ambil('innerWidth'), gH = ambil('innerHeight');
const asliW = () => gW ? gW.call(window) : document.documentElement.clientWidth;
const asliH = () => gH ? gH.call(window) : document.documentElement.clientHeight;
const sentuh = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
let aktif = false;
export const diputar = () => aktif;

function perlu() { return sentuh && asliH() > asliW() && asliW() < 760; }
function kelasMedia() {
  const W = innerWidth, H = innerHeight, c = document.documentElement.classList;
  c.toggle('mq-pendek', H <= 500); c.toggle('mq-w900', W <= 900); c.toggle('mq-w700', W <= 700); c.toggle('mq-tegak', H > W && W <= 700);
}
function terapkan() {
  const mau = perlu(), html = document.documentElement, b = document.body;
  if (mau !== aktif) { aktif = mau; html.classList.toggle('putar', aktif); }
  if (aktif) {
    const W = asliW(), H = asliH();
    Object.assign(b.style, {position: 'fixed', left: '0', top: '0', width: H + 'px', height: W + 'px', transformOrigin: '0 0', transform: `translateX(${W}px) rotate(90deg)`});
    html.style.setProperty('--vw', H / 100 + 'px'); html.style.setProperty('--vh', W / 100 + 'px');
  } else {
    for (const k of ['position', 'left', 'top', 'width', 'height', 'transformOrigin', 'transform']) b.style[k] = '';
    html.style.removeProperty('--vw'); html.style.removeProperty('--vh');
  }
  kelasMedia();
}
// ukuran layar versi game (mendatar saat diputar)
Object.defineProperty(window, 'innerWidth', {configurable: true, get: () => aktif ? asliH() : asliW()});
Object.defineProperty(window, 'innerHeight', {configurable: true, get: () => aktif ? asliW() : asliH()});
// koordinat sentuh/klik: layar asli (x,y) -> layar game (u,v) = (y, W - x)
const tukar = e => {
  if (!aktif || e.__dkPutar) return; const W = asliW();
  const x = e.clientX, y = e.clientY;
  Object.defineProperty(e, '__dkPutar', {value: 1});
  for (const [k, v] of [['clientX', y], ['clientY', W - x], ['pageX', y], ['pageY', W - x], ['x', y], ['y', W - x]]) Object.defineProperty(e, k, {value: v, configurable: true});
  const mx = e.movementX || 0, my = e.movementY || 0; Object.defineProperty(e, 'movementX', {value: my}); Object.defineProperty(e, 'movementY', {value: -mx});
};
for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'click', 'dblclick', 'contextmenu', 'mousedown', 'mousemove', 'mouseup', 'wheel']) window.addEventListener(t, tukar, {capture: true});
const asliRect = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function () {
  const r = asliRect.call(this); if (!aktif) return r;
  const W = asliW(); return new DOMRect(r.top, W - r.right, r.height, r.width);
};
let tunda = 0;
const ubah = () => { const lama = aktif; terapkan(); if (lama !== aktif) dispatchEvent(new Event('resize')); };
addEventListener('resize', () => { if (tunda) return; tunda = requestAnimationFrame(() => { tunda = 0; ubah(); }); }, {capture: true});
addEventListener('orientationchange', () => setTimeout(ubah, 250));
if (document.body) terapkan(); else addEventListener('DOMContentLoaded', terapkan);
