// Ikon UI piksel kotak khas Dunia Kotak (Huda 8 Nov 2026: UI tidak boleh pakai emoji).
// Tiap ikon = grid 10x10 huruf palet; '.' = transparan. Dipakai sebagai SVG di HTML dan digambar ke kanvas untuk 3D.
export const PAL = { K: '#2a2218', Y: '#f2c14a', L: '#fff1b8', D: '#d9a32e', O: '#a8761a', B: '#5ab4ff', b: '#2f7fd0', N: '#1b4f8a', W: '#ffffff', w: '#c9d2de',
  R: '#e0803a', r: '#a8541f', E: '#e04848', e: '#9c2a2a', G: '#c8c6c0', g: '#6c6f74', H: '#3aa860', h: '#24733f', S: '#e9b48a', s: '#b07850', C: '#8a5a3c', c: '#4f2f1c',
  P: '#23252b', p: '#454a55', T: '#9bb07a', t: '#5f7a45', V: '#8a6ad8', A: '#e2b955' };
export const PIX = {
  kilau: ['....Y.....', '....Y.....', '...YLY....', 'YYYLWLYYY.', '...YLY..B.', '....Y..BWB', '....Y...B.', '.B........', 'BWB.......', '.B........'],
  suara: ['..........', '....W..W..', '...WW...W.', 'WWWWW.W.W.', 'WWWWW.W.W.', 'WWWWW.W.W.', 'WWWWW.W.W.', '...WW...W.', '....W..W..', '..........'],
  bisu: ['..........', '....W.....', '...WW.....', 'WWWWW.E..E', 'WWWWW..EE.', 'WWWWW..EE.', 'WWWWW.E..E', '...WW.....', '....W.....', '..........'],
  hantu: ['...wwww...', '..wWWWWw..', '.wWWWWWWw.', '.wWPWWPWw.', '.wWPWWPWw.', '.wWWWWWWw.', '.wWWWWWWw.', '.wWWWWWWw.', '.wWwWWwWw.', '.w.w..w.w.'],
  target: ['...EEEE...', '..EWWWWE..', '.EWEEEEWE.', 'EWEWWWWEWE', 'EWEWEEWEWE', 'EWEWEEWEWE', 'EWEWWWWEWE', '.EWEEEEWE.', '..EWWWWE..', '...EEEE...'],
  chat: ['..........', '.WWWWWWWW.', 'WWWWWWWWWW', 'WWPWWPWWPW', 'WWWWWWWWWW', '.WWWWWWWW.', '..WW......', '.WW.......', 'W.........', '..........'],
  koin: ['...KKKK...', '..KYYYYK..', '.KYYLLYYK.', 'KYYLLLLYYK', 'KYDDLLOOYK', 'KYDDDOOOYK', 'KYDDDOOOYK', '.KYYDOYYK.', '..KYYYYK..', '...KKKK...'],
  permata: ['..........', '..NNNNNN..', '.NWBBBbbN.', 'NWWBBBbbbN', 'NNNNNNNNNN', '.NBBBBbbN.', '..NBBBbN..', '...NBbN...', '....NN....', '..........'],
  bintang: ['....KK....', '....YY....', '...KYYK...', 'KKKYYYYKKK', 'KYYYLYYYYK', '.KYYYYYYK.', '..KYYYYK..', '..KYKKYK..', '.KYK..KYK.', '.KK....KK.'],
  kaos: ['..........', '.RRR..RRR.', 'RRRRWWRRRR', 'RRRRRRRRRR', '.r.RRRRr.r', '...RRRR...', '...RRRR...', '...RRRR...', '...rrrr...', '..........'],
  toko: ['RWRWRWRWRW', 'RWRWRWRWRW', 'rrrrrrrrrr', '.C......C.', '.C.YYYY.C.', '.C.YYYY.C.', '.CCCCCCCC.', '.CLLLLLLC.', '.CLLLLLLC.', '.CCCCCCCC.'],
  piala: ['..........', 'YYYYYYYYYY', 'Y.YLYYOY.Y', 'Y.YLYYOY.Y', '.YYYYYYOY.', '..YYYYOO..', '....YO....', '....YO....', '..OOOOOO..', '..OOOOOO..'],
  tutup: ['..........', '.WW....WW.', '.WWW..WWW.', '..WWWWWW..', '...WWWW...', '...WWWW...', '..WWWWWW..', '.WWW..WWW.', '.WW....WW.', '..........'],
  pisang: ['........C.', '.......CY.', '......YYY.', '.....YYYO.', '....YYYO..', '..YYYYYO..', 'YYYYYYO...', '.YYYOO....', '..OOO.....', '..........'],
  sepatu: ['..........', '..........', '..RRR.....', '..RWRR....', '..RWRRRR..', '.RRRRRRRRR', 'RRrrRRRRRR', 'WWWWWWWWWW', 'wwwwwwwwww', '..........'],
  jam: ['...pppp...', '...pppp...', '..PPPPPP..', '.PPHHHHPP.', '.PPHWWHPPp', '.PPHHHHPP.', '..PPPPPP..', '...pppp...', '...pppp...', '..........'],
  kacamata: ['..........', '..........', 'C........C', 'CCCCCCCCCC', 'CPPPCCPPPC', 'CPpPC.PpPC', 'CPPPC.PPPC', '.CCC...CCC', '..........', '..........'],
  api: ['....R.....', '....RR....', '...RRR..R.', '..RRYRR.R.', '..RRYRRRR.', '.RRYYYRRR.', '.RYYLYYRR.', '.RYLLLYRR.', '..RYLLYR..', '...RRRR...'],
  petir: ['.....YYY..', '....YYY...', '...YYY....', '..YYYYYYY.', '.....YYY..', '....YYY...', '...YYO....', '..YYO.....', '.YO.......', '..........'],
  tetes: ['....B.....', '....B.....', '...BBB....', '...BBB....', '..BWBBB...', '..WBBBBb..', '.BWBBBBBb.', '.BBBBBBbb.', '..BBBbbb..', '...bbbb...'],
  kiri: ['..........', '....W.....', '...WW.....', '..WWWWWWW.', '.WWWWWWWW.', '..WWWWWWW.', '...WW.....', '....W.....', '..........', '..........'],
  kanan: ['..........', '.....W....', '.....WW...', '.WWWWWWW..', '.WWWWWWWW.', '.WWWWWWW..', '.....WW...', '.....W....', '..........', '..........'],
  atas: ['....WW....', '...WWWW...', '..WWWWWW..', '.WWWWWWWW.', '....WW....', '....WW....', '....WW....', '....WW....', '....WW....', '..........'],
  panah: ['..........', '.....W....', '.....WW...', '.WWWWWWW..', '.WWWWWWWW.', '.WWWWWWW..', '.....WW...', '.....W....', '..........', '..........'],
  tap: ['...SS.....', '..S..S....', '...SS.....', '...SS.....', '...SSSSS..', '.S.SSSSSS.', '.SSSSSSSS.', '..SSSSSSs.', '...SSSSs..', '...ssss...'],
  lari: ['.....SS...', '.....SS...', '...RRRR...', '..R.RR.R..', '....RR..S.', '...PPPP...', '..PP..PP..', '.PP....P..', 'RR.....RR.', '..........'],
  lelah: ['..........', '.SSSSSSSS.', '.SSSSSSSS.', '.SPPSSPPS.', '.SSSSSSSS.', '.SSSSSSSS.', '.SSSPPSSS.', '.SSSSSSSS.', '.SSSSSSSB.', '........B.'],
  kamera: ['..........', '..pp......', 'PPPPPPPPPP', 'PppPPPPpYP', 'PpPPWWPPpP', 'PpPWBBWPpP', 'PpPWBNWPpP', 'PpPPWWPPpP', 'PPPPPPPPPP', '..........'],
  botol: ['...WWWW...', '...RRRR...', '..BBBBBB..', '..BWBBBB..', '..BWWWWB..', '..BWRRWB..', '..BWWWWB..', '..BBBBBB..', '..BBBBBB..', '..bbbbbb..'],
  kopi: ['.......P..', '......P...', '..WWWWWW..', '..CCCCCC..', '..CLLLLC..', '..CLCCLC..', '..CCCCCC..', '..CLLLLC..', '...CCCC...', '...cccc...'],
  mangkok: ['..C....C..', '...C..C...', '....CC....', 'YAYAYAYAYA', 'WWWWWWWWWW', 'WRWRWRWRWW', '.WWWWWWWW.', '..wWWWWw..', '...wwww...', '..........'],
  ulang: ['..........', '..HHHHH...', '.HH...HH..', 'HH.....H..', 'H.......H.', 'H.......H.', '.H.....HH.', '..HH...HH.', '...HHHHH..', '..........'],
  centang: ['..........', '..........', '........H.', '.......HH.', 'H.....HH..', 'HH...HH...', '.HH.HH....', '..HHH.....', '...H......', '..........'],
  rumah: ['....RR....', '...RRRR...', '..RRRRRR..', '.RRRRRRRR.', 'RRRRRRRRRR', '.LLLLLLLL.', '.LBBLLCCL.', '.LBBLLCCL.', '.LLLLLCCL.', '.LLLLLCCL.'],
  kota: ['..ww......', '..ww..ggg.', '.wwww.gBg.', '.wBww.ggg.', '.wwww.gBg.', 'gwBwwggggg', 'gwwww.gBgg', 'gwBwwgggBg', 'gwwwwggggg', 'gggggggggg'],
  candi: ['....GG....', '....GG....', '...GGGG...', '...gGGg...', '..GGGGGG..', '..gGGGGg..', '.GGGGGGGG.', '.gGGGGGGg.', 'GGGGGGGGGG', 'gggggggggg'],
  pulau: ['......HH..', '....HHHHH.', '...H..C..H', '......C...', '.....C....', '.....C....', '..AAAAAA..', 'BAAAAAAAAB', 'BBBBBBBBBB', 'bbbbbbbbbb'],
  pohon: ['....HH....', '...HHHH...', '..HHHHHH..', '...hHHh...', '..HHHHHH..', '.HHHHHHHH.', '..hhhhhh..', '....CC....', '....CC....', '....CC....'],
  gunungapi: ['...R..R...', '....RR....', '....RR....', '...CRRC...', '..CCCCCC..', '..CCCCCC..', '.CCcCCcCC.', '.CCCCCCCC.', 'CCcCCCCcCC', 'cccccccccc'],
  gunung: ['....W.....', '...WWW....', '...gWg....', '..gggg..g.', '..gggg.ggg', '.gggggggg.', '.gTTgggggg', 'gTTTTggggg', 'TTTTTTTTTT', 'tttttttttt'],
  hati: ['..........', '.EE...EE..', 'EWEE.EEEE.', 'EWEEEEEEE.', 'EEEEEEEEE.', '.EEEEEEe..', '..EEEEe...', '...EEe....', '....e.....', '..........'],
  hatiKosong: ['..........', '.ww...ww..', 'w..w.w..w.', 'w...w...w.', 'w.......w.', '.w.....w..', '..w...w...', '...w.w....', '....w.....', '..........'],
  perisai: ['.bbbbbbbb.', '.bBBBBBBb.', '.bBWBBBBb.', '.bBWBBBBb.', '.bBBBBBBb.', '.bBBBBBBb.', '..bBBBBb..', '..bBBBBb..', '...bBBb...', '....bb....'],
  magnet: ['..........', '.EEEEEEEE.', 'EEEEEEEEEE', 'EEe....eEE', 'EEe....eEE', 'EEe....eEE', 'WWw....wWW', 'WWw....wWW', '..........', '..........'],
  angin: ['..........', '.WWWWWW...', '.......W..', '.WWWWWWW..', '..........', '.WWWWWWWW.', '.........W', '.WWWWWWW..', '..........', '..........'],
  bata: ['RRRrRRRRrR', 'rrrrrrrrrr', 'RrRRRRrRRR', 'rrrrrrrrrr', 'RRRrRRRRrR', 'rrrrrrrrrr', 'RrRRRRrRRR', 'rrrrrrrrrr', 'RRRrRRRRrR', 'rrrrrrrrrr'],
};
// emoji lama → nama ikon (teks UI yang masih memuat emoji otomatis diganti ikon)
const EMO = { '🪙': 'koin', '💎': 'permata', '⭐': 'bintang', '👕': 'kaos', '🛒': 'toko', '🏆': 'piala', '✕': 'tutup', '🍌': 'pisang', '👟': 'sepatu', '⌚': 'jam', '🕶': 'kacamata',
  '🔥': 'api', '⚡': 'petir', '💧': 'tetes', '⇠': 'kiri', '⇢': 'kanan', '⇡': 'atas', '→': 'panah', '👆': 'tap', '🏃': 'lari', '😮‍💨': 'lelah', '📸': 'kamera', '🧃': 'botol', '🧋': 'kopi',
  '🍜': 'mangkok', '🔄': 'ulang', '✓': 'centang', '🏘': 'rumah', '🏙': 'kota', '🛕': 'candi', '🏝': 'pulau', '🌲': 'pohon', '🌋': 'gunungapi', '⛰': 'gunung', '❤': 'hati', '🤍': 'hatiKosong',
  '🛡': 'perisai', '🧲': 'magnet', '🌬': 'angin', '🧱': 'bata', '🔊': 'suara', '🔇': 'bisu', '👻': 'hantu', '🎯': 'target', '💬': 'chat', '✨': 'kilau' };
const RE = new RegExp('(' + Object.keys(EMO).sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(\\u200D[\\u2640\\u2642])?\\uFE0F?', 'gu');
const cache = {};
export function svgIkon(n) {
  if (cache[n]) return cache[n]; const g = PIX[n]; if (!g) return '';
  let r = ''; g.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') r += `<rect x="${x}" y="${y}" width="1.04" height="1.04" fill="${PAL[ch]}"/>`; }));
  return (cache[n] = `<svg class="pi" viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`);
}
export function gambarIkon(x, n, ox, oy, sel) { const g = PIX[n]; if (!g) return; g.forEach((row, y) => [...row].forEach((ch, i) => { if (ch !== '.') { x.fillStyle = PAL[ch]; x.fillRect(ox + i * sel, oy + y * sel, sel + .5, sel + .5); } })); }
export const namaEmoji = (e) => EMO[e.replace(/️/g, '')];
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
export function ikonkan(root) {
  if (!root || root.closest?.('svg')) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const ns = [];
  while (w.nextNode()) { RE.lastIndex = 0; if (RE.test(w.currentNode.data)) ns.push(w.currentNode); }
  ns.forEach((n) => { if (!n.parentNode) return; const sp = document.createElement('span'); sp.className = 'pt'; sp.innerHTML = esc(n.data).replace(RE, (m, e) => svgIkon(EMO[e])); n.replaceWith(sp); });
}
export function pasangIkonOtomatis() {
  ikonkan(document.body);
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 3) ikonkan(n.parentNode); else if (n.nodeType === 1 && n.tagName !== 'svg' && !(n.className === 'pt')) ikonkan(n); }))).observe(document.body, { childList: true, subtree: true });
}
