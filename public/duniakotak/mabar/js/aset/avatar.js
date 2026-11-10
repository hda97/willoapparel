// ASET AVATAR WARGA DUNIA KOTAK (video + game) — gaya kotak besar seperti Raka. Hadap ke +z.
// Pakai: import {warga,pose} from './avatar.js'; sc.add(warga({jenis:'P',rambut:{gaya:'kuncir',warna:'#3a2416'},atasan:{jenis:'kaos-willo',warna:'#1d1d22'}}))
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const gc={};
function box(w,h,d,c,rad=.06,m={}){const k=[w,h,d,rad].join();const g=gc[k]||(gc[k]=new RoundedBoxGeometry(w,h,d,3,Math.min(rad,w/2-.001,h/2-.001,d/2-.001)));
 const o=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.8,...m}));o.castShadow=o.receiveShadow=true;return o}
let _s=7;const rnd=()=>{_s=(_s*16807)%2147483647;return (_s-1)/2147483646};
const tex=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
export const KULIT=['#f6d6b8','#f2c7a0','#e0aa7e','#c98c5e','#a86e44','#7a4a2a'];
export const WARNA_RAMBUT=['#0b0b0e','#3a2416','#6a4026','#a0622e','#d8b070','#8a8a90','#b03a2e','#2a3a6a'];
export const GAYA_RAMBUT={L:['cepak','belah','acak','keriting'],P:['panjang','kuncir','kepang','bob','hijab']};
function wajah(o){const {kulit,jenis,ekspresi='normal',mata='#1a1a1a',kacamata=false}=o;return tex(256,256,(x)=>{x.fillStyle=kulit;x.fillRect(0,0,256,256);
 const eye=ex=>{if(ekspresi==='senang'){x.lineWidth=9;x.strokeStyle='#1a1a1a';x.beginPath();x.arc(ex,132,15,Math.PI*1.1,Math.PI*1.9);x.stroke();return}
  x.fillStyle=mata;x.beginPath();x.ellipse(ex,124,13,18,0,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(ex+4,118,4,0,7);x.fill();
  if(jenis==='P'){x.strokeStyle='#1a1a1a';x.lineWidth=4;x.beginPath();x.moveTo(ex+10,108);x.lineTo(ex+20,100);x.moveTo(ex+13,114);x.lineTo(ex+23,109);x.stroke()}};
 eye(88);eye(168);x.lineCap='round';x.strokeStyle='#2a1a12';x.lineWidth=jenis==='P'?6:9;x.beginPath();x.moveTo(68,92);x.lineTo(108,88);x.moveTo(148,88);x.lineTo(188,92);x.stroke();
 if(jenis==='P'){x.fillStyle='rgba(255,120,120,.35)';x.beginPath();x.ellipse(66,160,16,10,0,0,7);x.ellipse(190,160,16,10,0,0,7);x.fill()}
 x.lineWidth=7;x.strokeStyle=jenis==='P'?'#b0474a':'#2a1a12';
 if(ekspresi==='senang'){x.fillStyle='#5a2420';x.beginPath();x.moveTo(98,176);x.quadraticCurveTo(128,222,158,176);x.closePath();x.fill();x.fillStyle='#fff';x.fillRect(106,176,44,9)}
 else{x.beginPath();x.moveTo(108,186);x.quadraticCurveTo(128,196,150,186);x.stroke()}
 if(kacamata){x.strokeStyle='#1a1a1a';x.lineWidth=7;x.fillStyle='rgba(200,230,255,.25)';[[88],[168]].forEach(([cx])=>{x.beginPath();x.roundRect(cx-30,98,60,50,10);x.fill();x.stroke()});x.beginPath();x.moveTo(118,116);x.lineTo(138,116);x.stroke()}})}
// Sablon kaos Willo (Toko Willo Apparel di game, 10 Nov 2026): sb = willo | polos | dk | dusun | tulisan; teks = nama dusun / tulisan warga.
// Dipakai tekstur avatar (128 px) dan pratinjau di toko (ukuran bebas). sisi 'b' = punggung (tulisan besar ala kaos kelas).
export const SABLON=['willo','polos','dk','dusun','tulisan'];
export function lukisSablon(x,w,h,warna,sb='willo',teks='',sisi='d'){const k=w/128,tinta=['#f4f4f4','#f4f4f0','#f2c14e','#ffffff'].includes(String(warna).toLowerCase())?'#1d1d22':'#ffffff';
 x.fillStyle=tinta;x.strokeStyle=tinta;x.textAlign='center';x.textBaseline='alphabetic';const f=(u,t,y,b=900)=>{let z=u*k;x.font=b+' '+z+'px Montserrat, sans-serif';while(x.measureText(t).width>w*.84&&z>6){z-=1;x.font=b+' '+z+'px Montserrat, sans-serif'}x.fillText(t,w/2,y*k)};
 teks=String(teks||'').toUpperCase().replace(/[^A-Z0-9 ]/g,'').slice(0,10);
 if(sisi==='b'){if(sb==='tulisan'&&teks){f(13,'WILLO',30,800);f(34,teks,74)}else if(sb==='dusun'&&teks){f(12,'DUNIA KOTAK',40,800);f(28,teks,76)}return}
 if(sb==='polos')return;
 if(sb==='dk'){x.lineWidth=4*k;x.strokeRect(50*k,22*k,28*k,24*k);x.fillRect(57*k,32*k,14*k,14*k);f(22,'DUNIA',72);f(22,'KOTAK',96);return}
 if(sb==='dusun'){f(11,'KOTAK',46,800);f(26,teks||'WETAN',74);x.fillRect(34*k,82*k,60*k,3*k);return}
 if(sb==='tulisan'){x.font='900 '+(12*k)+'px Montserrat, sans-serif';x.textAlign='left';x.fillText('WILLO',22*k,44*k);x.fillRect(22*k,48*k,30*k,2*k);return}
 f(30,'WILLO',62);f(12,'APPAREL',80,800)}
function dada(jenis,warna,sb,teks,sisi='d'){ // tekstur sisi depan atasan
 return tex(128,128,(x,w,h)=>{x.fillStyle=warna;x.fillRect(0,0,w,h);
  if(jenis==='kaos-willo')lukisSablon(x,w,h,warna,sb,teks,sisi);
  if(jenis==='kemeja'||jenis==='seragam'){x.fillStyle='rgba(0,0,0,.25)';for(let i=0;i<4;i++)x.fillRect(62,24+i*24,5,5);x.fillStyle=jenis==='seragam'?'#8a1a1a':'rgba(0,0,0,.12)';if(jenis==='seragam'){x.fillRect(58,6,12,46)}
   x.fillStyle='rgba(255,255,255,.6)';x.beginPath();x.moveTo(40,0);x.lineTo(64,18);x.lineTo(88,0);x.fill()}
  if(jenis==='jaket'){x.fillStyle='rgba(0,0,0,.35)';x.fillRect(62,0,4,128);x.fillStyle='rgba(255,255,255,.15)';x.fillRect(14,70,36,24);x.fillRect(78,70,36,24)}
  if(jenis==='batik'){x.strokeStyle='rgba(60,30,10,.7)';x.lineWidth=3;for(let i=0;i<4;i++)for(let j=0;j<4;j++){const cx=16+i*32,cy=16+j*32;x.beginPath();x.arc(cx,cy,10,0,7);x.stroke();x.beginPath();x.moveTo(cx-14,cy);x.lineTo(cx+14,cy);x.moveTo(cx,cy-14);x.lineTo(cx,cy+14);x.stroke()}}})}
function limb(w,h,d,c,end,endC,mid){const p=new THREE.Group();if(mid){const a=box(w,mid.h,d,c);a.position.y=-mid.h/2;p.add(a);const b=box(w*.9,h-mid.h,d*.9,mid.c);b.position.y=-mid.h-(h-mid.h)/2;p.add(b)}else{const m=box(w,h,d,c);m.position.y=-h/2;p.add(m)}
 if(end){const e=box(w*.92,.3,d*.92,endC);e.position.y=-h-.12;p.add(e)}return p}
function rambut(head,o){const {gaya,warna}=o;const hm={roughness:.95};_s=11;const B=(w,h,d,x,y,z,r=.08)=>{const b=box(w,h,d,warna,r,hm);b.position.set(x,y,z);head.add(b);return b};
 if(gaya==='hijab')return;
 B(1.05,gaya==='cepak'?.22:.34,1.05,0,gaya==='cepak'?1.0:1.06,0,.12); // atap
 if(gaya==='cepak'){B(1.0,.5,.16,0,.78,-.44)}
 if(gaya==='belah'){B(.6,.2,.3,-.2,.98,.42).rotation.z=.25;B(.36,.24,.24,.3,.95,.43);B(1.02,.7,.2,0,.72,-.44);[-.5,.5].forEach(x=>B(.12,.35,.7,x,.9,-.05))}
 if(gaya==='acak'){for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const b=B(.3,.3+rnd()*.18,.3,Math.cos(a)*.42,1.02+rnd()*.14,Math.sin(a)*.42,.1);b.rotation.set(rnd()*.5,a,rnd()*.4)}for(let i=0;i<5;i++){const f=B(.24,.34,.14,-.36+i*.18,.93,.5,.06);f.rotation.z=(i-2)*.14}B(1.02,.9,.24,0,.62,-.43)}
 if(gaya==='keriting'){for(let i=0;i<26;i++){const a=rnd()*Math.PI*2,r=.25+rnd()*.3;B(.28,.28,.28,Math.cos(a)*r,1.05+rnd()*.25,Math.sin(a)*r-.05,.12)}B(1.06,.7,.3,0,.72,-.4,.12)}
 if(['panjang','kuncir','kepang','bob'].includes(gaya)){for(let i=0;i<5;i++){const f=B(.24,.3,.14,-.36+i*.18,.95,.5,.06);f.rotation.z=(i-2)*.1}
  if(gaya==='panjang'){B(1.08,1.5,.3,0,.35,-.42);[-.53,.53].forEach(x=>B(.18,1.35,.85,x,.4,-.02))}
  if(gaya==='bob'){B(1.1,.85,.3,0,.68,-.42);[-.54,.54].forEach(x=>B(.18,.8,.95,x,.62,0))}
  if(gaya==='kuncir'){B(1.02,.8,.22,0,.68,-.44);[-.5,.5].forEach(x=>B(.14,.75,.5,x,.62,.12));B(.26,.26,.26,0,1.15,-.5,.06);const t=B(.36,1.1,.36,0,.62,-.78,.16);t.rotation.x=.35;const t2=B(.3,.4,.3,0,.08,-.95,.14);t2.rotation.x=.2}
  if(gaya==='kepang'){B(1.02,.8,.22,0,.68,-.44);[-.5,.5].forEach(x=>{B(.14,.5,.7,x,.75,-.05);for(let k=0;k<6;k++)B(.24,.2,.24,x*1.08+(k%2?.03:-.03),.42-k*.19,.12,.1);B(.16,.1,.16,x*1.08,-.72,.12,.03).material.color.set(0xff6a8a)})}}}
function hijab(head,warna){const hm={roughness:.9};const B=(w,h,d,x,y,z,r=.1)=>{const b=box(w,h,d,warna,r,hm);b.position.set(x,y,z);head.add(b)};
 B(1.12,.3,1.12,0,1.08,0,.14);B(1.12,1.0,.26,0,.6,-.46);[-.54,.54].forEach(x=>B(.18,1.0,1.0,x,.6,-.02));B(1.12,.18,.12,0,.98,.5,.06);B(1.3,.5,1.0,0,-.05,-.05,.16);B(1.0,.55,.2,0,-.35,.36,.1)}
export function warga(o={}){const d={jenis:'L',kulit:KULIT[1],ekspresi:'normal',rambut:{gaya:'acak',warna:WARNA_RAMBUT[0]},atasan:{jenis:'kaos',warna:'#3a7bd5'},bawahan:{jenis:'celana',warna:'#2f3a52'},sepatu:'#1a1a1a',kacamata:false,hijab:null,topi:null,...o};
 if(d.rambut.gaya==='hijab'){if(!d.hijab)d.hijab='#6a8fb0';if(o.lenganPanjang===undefined)d.lenganPanjang=true;if(!o.bawahan)d.bawahan={jenis:'rok-panjang',warna:'#4a5a7a'}}
 const g=new THREE.Group();const skin=d.kulit,top=d.atasan.warna,bot=d.bawahan.warna;const bj=d.bawahan.jenis;
 const legC=(bj==='celana'||bj==='rok-panjang')?bot:skin;const legMid=bj==='pendek'?{h:.55,c:skin}:null;
 const legL=limb(.48,1.25,.5,bj==='pendek'?bot:legC,true,d.sepatu,legMid),legR=limb(.48,1.25,.5,bj==='pendek'?bot:legC,true,d.sepatu,legMid);legL.position.set(-.27,1.37,0);legR.position.set(.27,1.37,0);g.add(legL,legR);
 if(bj==='rok'){const r=box(1.2,.7,.75,bot,.1);r.position.y=1.12;g.add(r)}
 if(bj==='rok-panjang'){const r=box(1.22,1.42,.78,bot,.12);r.position.y=.8;g.add(r);const k=box(1.3,.12,.86,bot,.05);k.position.y=.1;g.add(k)}
 if(bj==='sarung'){const s=box(1.2,1.25,.72,bot,.1);s.position.y=.82;g.add(s);const p=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.15),new THREE.MeshStandardMaterial({map:tex(64,64,(x)=>{x.fillStyle=bot;x.fillRect(0,0,64,64);x.fillStyle='rgba(255,255,255,.25)';for(let i=0;i<64;i+=16){x.fillRect(i,0,5,64);x.fillRect(0,i,64,5)}}),roughness:.85}));p.position.set(0,.82,.365);g.add(p)}
 const body=new THREE.Group();body.position.y=1.37;g.add(body);
 const tm=Array.from({length:6},()=>new THREE.MeshStandardMaterial({color:top,roughness:.8}));tm[4]=new THREE.MeshStandardMaterial({map:dada(d.atasan.jenis,top,d.atasan.sablon,d.atasan.teks),roughness:.8});if(d.atasan.jenis==='kaos-willo'&&['tulisan','dusun'].includes(d.atasan.sablon)&&d.atasan.teks)tm[5]=new THREE.MeshStandardMaterial({map:dada('kaos-willo',top,d.atasan.sablon,d.atasan.teks,'b'),roughness:.8});
 if(d.atasan.jenis==='batik')tm.forEach((m,i)=>{if(i!==4){m.map=dada('batik',top);m.color.set(0xffffff)}});
 const torso=new THREE.Mesh(new RoundedBoxGeometry(1.1,1.2,.6,2,.06),tm);torso.position.y=.6;torso.castShadow=true;body.add(torso);
 if(d.jenis==='P'&&!['jaket'].includes(d.atasan.jenis)){}
 const lengan=(!d.lenganPanjang&&['kaos','kaos-willo','seragam'].includes(d.atasan.jenis))?{h:.45,c:skin}:null;const armC=d.atasan.jenis==='batik'?top:top;
 const armL=limb(.45,1.05,.48,armC,true,skin,lengan),armR=limb(.45,1.05,.48,armC,true,skin,lengan);armL.position.set(-.79,1.1,0);armR.position.set(.79,1.1,0);body.add(armL,armR);
 if(d.atasan.jenis==='jaket'){const hd=box(1.0,.3,.4,top,.1);hd.position.set(0,1.15,-.3);body.add(hd)}
 const head=new THREE.Group();head.position.y=1.2;body.add(head);
 const hd=new THREE.Mesh(new RoundedBoxGeometry(.95,.95,.95,2,.08),new THREE.MeshStandardMaterial({color:skin,roughness:.6}));hd.position.y=.55;hd.castShadow=true;head.add(hd);
 const fm=new THREE.MeshStandardMaterial({map:wajah({kulit:skin,jenis:d.jenis,ekspresi:d.ekspresi,kacamata:d.kacamata}),roughness:.6});const fp=new THREE.Mesh(new THREE.PlaneGeometry(.86,.86),fm);fp.position.set(0,.55,.476);head.add(fp);
 if(d.hijab)hijab(head,d.hijab);else rambut(head,d.rambut);

 if(d.topi){const t=box(1.08,.3,1.08,d.topi,.1);t.position.y=1.12;head.add(t);const v=box(1.0,.07,.5,d.topi,.03);v.position.set(0,1.0,.7);head.add(v)}
 g.userData={legL,legR,armL,armR,head,body,opsi:d};return g}
export function pose(R,p){const u=R.userData;const d={legL:0,legR:0,armL:0,armR:0,armLz:.08,armRz:-.08,head:0,headY:0,...p};
 u.legL.rotation.x=d.legL;u.legR.rotation.x=d.legR;u.armL.rotation.x=d.armL;u.armR.rotation.x=d.armR;u.armL.rotation.z=d.armLz;u.armR.rotation.z=d.armRz;u.head.rotation.x=d.head;u.head.rotation.y=d.headY}
