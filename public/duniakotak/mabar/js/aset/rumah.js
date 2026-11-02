// ASET RUMAH WARGA DUNIA KOTAK (video + game) — gaya kotak besar membulat seperti rumah Raka. Pintu menghadap +z.
// Rumah awal = kecil; upgrade (pakai poin) = duaLantai. (Panggung & limasan dihapus atas permintaan Huda 2026-11-02.) Plus warungPanen() untuk depan rumah.
// Pakai: import {rumahMesh,warungMesh} from './rumah.js'; sc.add(rumahMesh('duaLantai',{dinding:'hijau',atap:'cokelat',pintu:'putih'}))
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const gc={};
function box(w,h,d,c,rad=.05,m={}){const k=[w,h,d,rad].join();const g=gc[k]||(gc[k]=new RoundedBoxGeometry(w,h,d,3,Math.min(rad,w/2-.001,h/2-.001,d/2-.001)));
 const o=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.8,...m}));o.castShadow=o.receiveShadow=true;return o}
const at=(o,x,y,z)=>{o.position.set(x,y,z);return o};
function prism(w,h,d,col){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});g.translate(0,0,-d/2);
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:col,roughness:.85}));m.castShadow=m.receiveShadow=true;return m}
const gelap=(c,k=.7)=>new THREE.Color(c).multiplyScalar(k);
// atap pelana (2 bidang + bubungan)
function atapPelana(w,h,d,col){const g=new THREE.Group();const L=Math.hypot(w/2+.35,h+.1);const a=Math.atan2(h,w/2);
 [-1,1].forEach(s=>{const p=box(L,.22,d+.8,col);p.position.set(s*(w/4+.08),h/2+.05,0);p.rotation.z=-s*a;g.add(p)});
 g.add(at(box(.35,.3,d+.9,gelap(col,.6),.06),0,h+.12,0));return g}
export const WARNA_DINDING={krem:'#f1dcb4',putih:'#f6f3ee',kuning:'#f6d77a',hijau:'#a9d8a0',biru:'#a8cdf0',merahMuda:'#f4b6c2',ungu:'#c9b6ec',kayu:'#b07a48'};
export const WARNA_ATAP={merah:'#c8553d',oranye:'#e0803a',cokelat:'#7a4a2e',hijau:'#3f8a5a',biru:'#3a6ab8',abu:'#5a6068',hitam:'#2e2e34',ungu:'#7a52b8'};
export const WARNA_PINTU={cokelat:'#6b3e22',putih:'#f2efe8',hijau:'#2f7a4a',biru:'#2f5a9a'};
export const DAFTAR_RUMAH=[['kecil','Rumah kecil'],['duaLantai','Rumah 2 lantai']];
const DEF={kecil:{dinding:'krem',atap:'merah',pintu:'cokelat'},duaLantai:{dinding:'biru',atap:'abu',pintu:'putih'}};
const ambil=(tbl,v)=>tbl[v]||v; // nama warna atau kode hex
const TRIM=0xffffff;

function jendela(g,x,y,z,ry=0,o={}){const w=new THREE.Group();const f=box(1,1,.12,o.trim??TRIM,.03);w.add(f);
 const gl=new THREE.Mesh(new THREE.PlaneGeometry(.76,.76),new THREE.MeshStandardMaterial({color:0x9fd6ff,roughness:.15,metalness:.2,emissive:0x203040}));gl.position.z=.07;w.add(gl);
 w.add(at(box(.07,.76,.04,o.trim??TRIM,.01),0,0,.09));w.add(at(box(.76,.07,.04,o.trim??TRIM,.01),0,0,.09));w.add(at(box(1.2,.11,.28,o.trim??TRIM,.02),0,-.56,.1));
 if(o.bunga!==false){w.add(at(box(1.1,.22,.26,0x7a4a2a,.03),0,-.72,.2));[-.36,0,.36].forEach((dx,i)=>w.add(at(box(.2,.2,.2,[0xff5a7a,0xffd23a,0xff8a3a][i],.06),dx,-.52,.22)))}
 if(o.daun){[-1,1].forEach(s=>w.add(at(box(.36,1.04,.08,o.daun,.02),s*.7,0,.04)))}
 w.position.set(x,y,z);w.rotation.y=ry;g.add(w)}
function pintu(g,x,y0,z,col,trim=TRIM){g.add(at(box(1,1.9,.12,col,.04),x,y0+.95,z));g.add(at(box(.1,.1,.08,0xffd040,.02),x+.33,y0+.95,z+.09));
 g.add(at(box(1.26,.16,.16,trim,.03),x,y0+1.96,z+.01))}
function sudut(g,W,D,y0,H,c=TRIM){[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>g.add(at(box(.28,H,.28,c,.03),a*W/2,y0+H/2,b*D/2)))}

// ---------- 1. RUMAH KECIL ----------
function kecil(c){const G=new THREE.Group();const W=4,D=3.4,H=2.4,RH=1.6,y0=.3;
 G.add(at(box(W+.4,y0,D+.4,0x8d8d8d,.04),0,y0/2,0));G.add(at(box(W,H,D,c.dinding),0,y0+H/2,0));sudut(G,W,D,y0,H);
 const gb=prism(W,RH,D,c.dinding);gb.position.y=y0+H;G.add(gb);const rf=atapPelana(W,RH,D,c.atap);rf.position.y=y0+H;G.add(rf);
 pintu(G,-.7,y0,D/2+.03,c.pintu);jendela(G,.9,y0+1.35,D/2+.04);jendela(G,W/2+.04,y0+1.35,0,Math.PI/2);jendela(G,-W/2-.04,y0+1.35,0,-Math.PI/2);
 const lw=new THREE.Mesh(new THREE.CircleGeometry(.28,6),new THREE.MeshStandardMaterial({color:0x9fd6ff,emissive:0x203040}));lw.position.set(0,y0+H+.6,D/2+.01);G.add(lw);
 G.add(at(box(1.4,.18,.7,0xb08050,.04),-.7,.09,D/2+.45));return G}

// ---------- 2. RUMAH 2 LANTAI ----------
function duaLantai(c){const G=new THREE.Group();const W=5,D=4,H1=2.6,H2=2.4,RH=1.8,y0=.3;
 G.add(at(box(W+.4,y0,D+.4,0x8d8d8d,.04),0,y0/2,0));
 G.add(at(box(W,H1,D,c.dinding),0,y0+H1/2,0));G.add(at(box(W,H2,D,c.dinding),0,y0+H1+H2/2,0));sudut(G,W,D,y0,H1+H2);
 G.add(at(box(W+.2,.2,D+.2,TRIM,.04),0,y0+H1,0)); // lis antar lantai
 const yT=y0+H1+H2;const gb=prism(W,RH,D,c.dinding);gb.position.y=yT;G.add(gb);const rf=atapPelana(W,RH,D,c.atap);rf.position.y=yT;G.add(rf);
 G.add(at(box(.6,1.5,.6,0x9a5a40,.04),1.4,yT+1.2,-.9));G.add(at(box(.75,.18,.75,0x6a3a2a,.03),1.4,yT+2,-.9));
 pintu(G,0,y0,D/2+.03,c.pintu);jendela(G,-1.6,y0+1.4,D/2+.04);jendela(G,1.6,y0+1.4,D/2+.04);
 // balkon lantai 2
 const yb=y0+H1;G.add(at(box(2.6,.16,1,0xb08050,.03),0,yb+.08,D/2+.5));
 for(let x=-1.2;x<=1.21;x+=.3)G.add(at(box(.08,.7,.08,TRIM,.02),x,yb+.5,D/2+.95));G.add(at(box(2.6,.1,.1,TRIM,.02),0,yb+.86,D/2+.95));
 [-1,1].forEach(s=>G.add(at(box(.1,.1,1,TRIM,.02),s*1.25,yb+.86,D/2+.5)));
 G.add(at(box(1,1.8,.1,0x9fd6ff,.03,{roughness:.15,metalness:.2,emissive:0x203040}),0,yb+1.0,D/2+.03));G.add(at(box(1.2,.14,.14,TRIM,.02),0,yb+1.95,D/2+.04));
 jendela(G,-1.7,yb+1.3,D/2+.04,0,{bunga:false});jendela(G,1.7,yb+1.3,D/2+.04,0,{bunga:false});
 [-1,1].forEach(s=>{jendela(G,s*(W/2+.04),y0+1.4,0,s*Math.PI/2);jendela(G,s*(W/2+.04),yb+1.3,0,s*Math.PI/2,{bunga:false})});
 // kanopi pintu bawah balkon (tiang)
 [-1.2,1.2].forEach(x=>G.add(at(box(.14,H1,.14,TRIM,.02),x,y0+H1/2,D/2+.95)));
 G.add(at(box(1.4,.18,1,0xb08050,.04),0,.09,D/2+.55));return G}

const BENTUK={kecil,duaLantai};
// rumahMesh(bentuk,{dinding,atap,pintu}) — warna boleh nama (lihat WARNA_*) atau hex '#rrggbb'
export function rumahMesh(bentuk='kecil',o={}){const d=DEF[bentuk];const c={dinding:new THREE.Color(ambil(WARNA_DINDING,o.dinding||d.dinding)),atap:new THREE.Color(ambil(WARNA_ATAP,o.atap||d.atap)),pintu:new THREE.Color(ambil(WARNA_PINTU,o.pintu||d.pintu))};
 const G=BENTUK[bentuk](c);G.userData={rumah:bentuk};return G}

// ---------- WARUNG PANEN (depan rumah) ----------
const tex=(w,h,f)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;f(cv.getContext('2d'),w,h);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t};
// warungMesh({nama:'WARUNG RAKA', warna:'#e0503a', isi:['tomat','jagung','cabai','wortel','terong']})
export function warungMesh(o={}){const G=new THREE.Group();const warna=new THREE.Color(o.warna||'#e0503a');const kayu=0x9a6a3e;const nama=(o.nama||'WARUNG PANEN').slice(0,16);
 G.add(at(box(2.4,1,1,kayu,.05),0,.5,0));G.add(at(box(2.6,.12,1.2,0xc8955a,.03),0,1.06,.05));
 [[-1.15,-.45],[1.15,-.45],[-1.15,.5],[1.15,.5]].forEach(([x,z])=>G.add(at(box(.12,2.3,.12,kayu,.02),x,1.15,z)));
 // atap belang
 for(let i=0;i<6;i++){const s=box(.44,.12,1.5,i%2?0xffffff:warna,.03);s.position.set(-1.1+i*.44,2.4,.15);s.rotation.x=-.22;G.add(s)}
 for(let i=0;i<6;i++)G.add(at(box(.44,.22,.06,i%2?0xffffff:warna,.03),-1.1+i*.44,2.2,.9));
 // papan nama
 const t=tex(512,96,(x,w,h)=>{x.fillStyle='#fff6e0';x.fillRect(0,0,w,h);x.strokeStyle='#6b3e22';x.lineWidth=10;x.strokeRect(5,5,w-10,h-10);x.fillStyle='#6b3e22';x.font='900 52px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(nama,w/2,h/2+3)});
 const pb=new THREE.Mesh(new THREE.BoxGeometry(2.2,.42,.08),[0,0,0,0,0,0].map((_,i)=>new THREE.MeshStandardMaterial(i===4?{map:t,roughness:.8}:{color:0x6b3e22})));pb.position.set(0,2.72,.75);pb.rotation.x=-.12;pb.castShadow=true;G.add(pb);
 // keranjang hasil panen di meja (isi = warna buah; tetap kotak, bukan model tanaman)
 const BUAH={tomat:0xe0402e,jagung:0xf4c430,cabai:0xd8202a,wortel:0xf08a24,terong:0x6a3a9a,pisang:0xf2d84a,singkong:0xc8a070,padi:0xe8c860};
 const isi=o.isi||['tomat','jagung','wortel','terong','cabai'];
 isi.slice(0,5).forEach((n,i)=>{const x=-.96+i*.48;G.add(at(box(.42,.2,.5,0x8a5a2a,.04),x,1.22,.15));const c=BUAH[n]||0x88cc44;
  [[-.09,-.1],[.09,-.1],[-.09,.1],[.09,.1],[0,0]].forEach(([a,b],k)=>G.add(at(box(.15,.15,.15,c,.05),x+a,1.36+(k===4?.1:0),.15+b)))});
 // timbangan kecil + peti di tanah
 G.add(at(box(.6,.4,.5,0x8a5a2a,.04),1.6,.2,.6));[[-.12,0],[.12,0]].forEach(([a])=>G.add(at(box(.2,.2,.2,BUAH.tomat,.06),1.6+a,.48,.6)));
 G.userData={warung:true};return G}

// ---------- RUMAH KUCING (pekarangan) ----------
// rumahKucingMesh({warna:'#f4b6c2', atap:'#c8553d', nama:'MOCHI'}) — muat 1 kucing (skala 1), pintu bulat menghadap +z
export function rumahKucingMesh(o={}){const G=new THREE.Group();const w=new THREE.Color(ambil(WARNA_DINDING,o.warna||'merahMuda')),a=new THREE.Color(ambil(WARNA_ATAP,o.atap||'merah'));
 const W=1.5,D=1.3,H=1.05,y0=.12;G.add(at(box(W+.2,y0,D+.2,0x9a6a3e,.03),0,y0/2,0));
 // dinding: kotak dengan lubang pintu bulat (pakai shape berlubang di depan)
 G.add(at(box(W,H,D-.1,w),0,y0+H/2,-.05));
 const s=new THREE.Shape();s.moveTo(-W/2,0);s.lineTo(W/2,0);s.lineTo(W/2,H);s.lineTo(-W/2,H);s.lineTo(-W/2,0);const hole=new THREE.Path();hole.absarc(0,.48,.32,0,Math.PI*2,true);s.holes.push(hole);
 const fg=new THREE.ExtrudeGeometry(s,{depth:.12,bevelEnabled:false});const fr=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({color:w,roughness:.8}));fr.position.set(0,y0,D/2-.12);fr.castShadow=fr.receiveShadow=true;G.add(fr);
 const inn=new THREE.Mesh(new THREE.CircleGeometry(.32,24),new THREE.MeshBasicMaterial({color:0x2a1a14}));inn.position.set(0,y0+.48,D/2-.09);G.add(inn);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.34,.05,8,28),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.6}));ring.position.set(0,y0+.48,D/2+.01);G.add(ring);
 sudut(G,W,D,y0,H);
 const gb=prism(W,.6,D,w);gb.position.y=y0+H;G.add(gb);const rf=atapPelana(W,.6,D-.75,a);rf.position.y=y0+H;G.add(rf);
 // papan nama + jejak kaki
 const nama=(o.nama||'').slice(0,12);if(nama){const t=tex(256,64,(x,w2,h)=>{x.fillStyle='#fff6e0';x.fillRect(0,0,w2,h);x.fillStyle='#6b3e22';x.font='900 40px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(nama,w2/2,h/2+2)});
  const pb=new THREE.Mesh(new THREE.BoxGeometry(.9,.24,.05),[0,0,0,0,0,0].map((_,i)=>new THREE.MeshStandardMaterial(i===4?{map:t}:{color:0x6b3e22})));pb.position.set(0,y0+H+.24,D/2+.06);G.add(pb)}
 // bantal di dalam + mangkuk makan & minum di depan
 G.add(at(box(.9,.12,.6,0x7ab8e8,.05),0,y0+.08,0));
 [[-.55,0xffb020],[.55,0x5ab0f0]].forEach(([x,c])=>{G.add(at(box(.34,.14,.34,0xd84040,.05),x,.07,D/2+.45));G.add(at(box(.24,.04,.24,c,.02),x,.15,D/2+.45))});
 // tiang garukan kecil di samping
 G.add(at(box(.2,1.1,.2,0xd8c090,.03),W/2+.45,.55,.1));G.add(at(box(.5,.08,.5,0x9a6a3e,.02),W/2+.45,1.12,.1));G.add(at(box(.5,.08,.5,0x9a6a3e,.02),W/2+.45,.04,.1));
 G.userData={rumahKucing:true};return G}
