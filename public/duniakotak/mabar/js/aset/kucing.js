// ASET KUCING DUNIA KOTAK (video + game) — model Oyen asli (kotak besar membulat), 8 warna bulu. Hadap ke +x.
// Kotak kecil HANYA untuk tanaman (keputusan Huda 2026-11-02).
// Pakai: import {kucingMesh} from './kucing.js'; sc.add(kucingMesh('telon'))
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const gc={};
function box(w,h,d,c,rad=.06){const k=[w,h,d,rad].join();const g=gc[k]||(gc[k]=new RoundedBoxGeometry(w,h,d,3,Math.min(rad,w/2-.001,h/2-.001,d/2-.001)));
 const o=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.8}));o.castShadow=o.receiveShadow=true;return o}
function prism(w,h,d,col){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});g.translate(0,0,-d/2);
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:col,roughness:.85}));m.castShadow=m.receiveShadow=true;return m}
// bulu, belang, terang (kaki/moncong), mata, garis wajah, belang khusus
export const WARNA_KUCING={
 oranye:{nama:'Oranye (Oyen)',bulu:'#f0a050',belang:'#c87830',terang:'#fff3e0',mata:'#1a1a1a',garis:'#3a2210'},
 hitam:{nama:'Hitam',bulu:'#2b2b31',belang:'#1f1f24',terang:'#3a3a42',mata:'#8ad04a',garis:'#8a8a94'},
 putih:{nama:'Putih',bulu:'#f4f1ec',belang:'#e4e0d8',terang:'#ffffff',mata:'#3a9ae0',garis:'#8a7a70'},
 abu:{nama:'Abu-abu',bulu:'#a0a4ac',belang:'#6c7078',terang:'#e2e4e8',mata:'#1a1a1a',garis:'#3a3a40'},
 cokelat:{nama:'Cokelat',bulu:'#8e5c36',belang:'#5e3a1e',terang:'#e2c09a',mata:'#1a1a1a',garis:'#2a160a'},
 krem:{nama:'Krem',bulu:'#ecd6ab',belang:'#d2b27c',terang:'#fff8ea',mata:'#1a1a1a',garis:'#6a4a2a'},
 tuxedo:{nama:'Belang hitam-putih',bulu:'#26262c',belang:'#26262c',terang:'#f6f3ee',mata:'#e8c040',garis:'#6a6a72',dada:true},
 telon:{nama:'Belang tiga',bulu:'#f6f3ee',belang:['#f08a30','#26262c'],terang:'#ffffff',mata:'#1a1a1a',garis:'#6a5040',tambal:['#f08a30','#26262c']},
};
function wajah(W){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle=W.bulu;x.fillRect(0,0,128,128);
 if(W.tambal){x.fillStyle=W.tambal[0];x.fillRect(0,0,52,56);x.fillStyle=W.tambal[1];x.fillRect(84,0,44,40)}
 x.fillStyle=W.terang;x.fillRect(34,66,60,40);if(W.dada){x.fillRect(48,50,32,30)}
 const iris=W.mata!=='#1a1a1a';[[30,44],[82,44]].forEach(([a,b])=>{x.fillStyle=iris?W.mata:'#1a1a1a';x.fillRect(a,b,16,20);if(iris){x.fillStyle='#111';x.fillRect(a+5,b+2,6,16)}x.fillStyle='#fff';x.fillRect(a+4,b+2,5,6)});
 x.fillStyle='#ff7a8a';x.fillRect(58,70,12,8);
 x.strokeStyle=W.garis;x.lineWidth=4;x.beginPath();x.moveTo(64,78);x.lineTo(64,86);x.moveTo(52,90);x.quadraticCurveTo(64,96,76,90);x.stroke();
 x.lineWidth=2;[[20,74,4,70],[20,82,4,84],[108,74,124,70],[108,82,124,84]].forEach(([a,b,c2,d])=>{x.beginPath();x.moveTo(a,b);x.lineTo(c2,d);x.stroke()});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
export function kucingMesh(warna='oranye',{skala=1}={}){const W=WARNA_KUCING[warna];const g=new THREE.Group();const fur=W.bulu;
 const body=box(1.6,.9,.9,fur,.12);body.position.set(0,.75,0);g.add(body);
 if(W.dada){const b=box(1.5,.3,.86,W.terang,.1);b.position.set(.05,.45,0);g.add(b);const ch=box(.12,.6,.7,W.terang,.05);ch.position.set(.78,.85,0);g.add(ch)}
 [-.55,.55].forEach(x=>[-.3,.3].forEach(z=>{const l=box(.28,.5,.28,fur,.06);l.position.set(x,.25,z);g.add(l);const p=box(.3,.12,.32,W.terang,.04);p.position.set(x,.06,z+.02);g.add(p)}));
 const bel=Array.isArray(W.belang)?W.belang:[W.belang,W.belang];
 [-.3,.3].forEach((x,i)=>{if(bel[i]===fur)return;const s=box(.2,.92,.92,bel[i],.06);s.position.set(x,.76,0);s.scale.set(i&&W.tambal?1.6:.5,1,1);g.add(s)});
 const head=new THREE.Group();head.position.set(.95,1.3,0);g.add(head);head.add(box(.9,.8,.85,fur,.1));
 const fm=new THREE.Mesh(new THREE.PlaneGeometry(.8,.7),new THREE.MeshStandardMaterial({map:wajah(W),roughness:.7}));fm.position.set(.455,0,0);fm.rotation.y=Math.PI/2;head.add(fm);
 [-.25,.25].forEach((z,i)=>{const ec=W.tambal?W.tambal[i]:fur;const e=prism(.3,.32,.14,ec);e.position.set(0,.4,z);e.rotation.y=Math.PI/2;head.add(e);const ei=prism(.16,.18,.15,0xff9aa8);ei.position.set(.02,.42,z);ei.rotation.y=Math.PI/2;head.add(ei)});
 const tail=new THREE.Group();tail.position.set(-.8,1,0);g.add(tail);for(let i=0;i<4;i++){const t=box(.2,.2,.2,i%2?bel[1]:fur,.05);t.position.set(-.1-i*.08,i*.2,0);tail.add(t)}
 g.scale.setScalar(skala);g.userData={warna,head,tail};return g}
export const DAFTAR_KUCING=Object.keys(WARNA_KUCING);
