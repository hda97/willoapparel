import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export {THREE};
// angka acak tetap (seed) supaya tiap frame sama
let seed=1;export const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};export const reseed=s=>{seed=s};
const gc={};
export function box(w,h,d,c,rad=.06,m={}){const k=[w,h,d,rad].join();const g=gc[k]||(gc[k]=new RoundedBoxGeometry(w,h,d,3,Math.min(rad,w/2-.001,h/2-.001,d/2-.001)));
 const o=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.8,...m}));o.castShadow=o.receiveShadow=true;return o}
export function grad(stops){const c=document.createElement('canvas');c.width=4;c.height=512;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,512);stops.forEach(([p,col])=>g.addColorStop(p,col));x.fillStyle=g;x.fillRect(0,0,4,512);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const faces={};
export function face(expr){if(faces[expr])return faces[expr];const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#f2c7a0';x.fillRect(0,0,256,256);
 const big=expr==='kaget'||expr==='takut';const ey=big?122:124;
 const eye=(ex)=>{x.fillStyle='#1a1a1a';x.beginPath();if(expr==='senang'){x.lineWidth=9;x.strokeStyle='#1a1a1a';x.arc(ex,ey+8,15,Math.PI*1.1,Math.PI*1.9);x.stroke();return}
  if(expr==='seram'){x.fillStyle='#ff2a1a';x.shadowColor='#ff2a1a';x.shadowBlur=20}x.ellipse(ex,ey,big?17:13,big?23:18,0,0,7);x.fill();x.shadowBlur=0;x.fillStyle='#fff';x.beginPath();x.arc(ex+4,ey-6,big?5:4,0,7);x.fill()};
 eye(88);eye(168);x.lineCap='round';x.strokeStyle='#2a1a12';x.lineWidth=9;x.beginPath();
 if(expr==='serius'||expr==='seram'){x.moveTo(66,90);x.lineTo(108,97);x.moveTo(148,97);x.lineTo(190,90)}
 else if(expr==='takut'){x.moveTo(66,92);x.lineTo(108,80);x.moveTo(148,80);x.lineTo(190,92)}
 else if(expr==='kaget'){x.moveTo(68,80);x.lineTo(108,74);x.moveTo(148,74);x.lineTo(188,80)}
 else {x.moveTo(68,92);x.lineTo(108,88);x.moveTo(148,88);x.lineTo(188,92)}
 x.stroke();x.lineWidth=7;x.beginPath();
 if(expr==='senang'){x.fillStyle='#5a2420';x.moveTo(98,176);x.quadraticCurveTo(128,222,158,176);x.closePath();x.fill();x.fillStyle='#fff';x.fillRect(106,176,44,9)}
 else if(expr==='kaget'){x.fillStyle='#5a2420';x.ellipse(128,192,16,21,0,0,7);x.fill()}
 else if(expr==='takut'){x.fillStyle='#5a2420';x.moveTo(104,200);x.quadraticCurveTo(128,170,152,200);x.closePath();x.fill()}
 else if(expr==='serius'){x.moveTo(110,190);x.lineTo(146,188);x.stroke()}
 else if(expr==='seram'){x.moveTo(104,186);x.quadraticCurveTo(136,196,156,176);x.stroke()}
 else {x.moveTo(108,186);x.quadraticCurveTo(128,196,150,186);x.stroke()}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return faces[expr]=t}
// pivot: bagian tubuh berputar dari sendi
function limb(w,h,d,c,end,endC){const p=new THREE.Group();const m=box(w,h,d,c);m.position.y=-h/2;p.add(m);if(end){const e=box(w*.92,.3,d*.92,endC);e.position.y=-h-.12;p.add(e)}return p}
export function raka(expr='normal'){const g=new THREE.Group();const skin=0xf2c7a0,hood=0x1b1c21,pants=0x3a3b2e;
 const legL=limb(.48,1.25,.5,pants,true,0x121212),legR=limb(.48,1.25,.5,pants,true,0x121212);legL.position.set(-.27,1.37,0);legR.position.set(.27,1.37,0);g.add(legL,legR);
 const body=new THREE.Group();body.position.y=1.37;g.add(body);
 const torso=box(1.1,1.2,.6,hood);torso.position.y=.6;body.add(torso);
 const pocket=box(.6,.28,.04,0x24262c);pocket.position.set(0,.3,.31);body.add(pocket);
 [-.15,.15].forEach(x=>{const s=box(.04,.3,.04,0xcccccc,.01);s.position.set(x,1.0,.32);body.add(s)});
 [-.33,.33].forEach(x=>{const s=box(.12,1.1,.05,0x6b5530,.02);s.position.set(x,.62,.31);body.add(s)});
 const pack=box(.9,1.0,.42,0x4f4a32);pack.position.set(0,.65,-.5);body.add(pack);const flap=box(.92,.35,.46,0x5d5838);flap.position.set(0,1.05,-.5);body.add(flap);
 const armL=limb(.45,1.05,.48,hood,true,skin),armR=limb(.45,1.05,.48,hood,true,skin);armL.position.set(-.79,1.1,0);armR.position.set(.79,1.1,0);body.add(armL,armR);
 const head=new THREE.Group();head.position.y=1.2;body.add(head);
 const hm=Array.from({length:6},()=>new THREE.MeshStandardMaterial({color:skin,roughness:.6}));const fm=new THREE.MeshStandardMaterial({map:face(expr),roughness:.6});hm[4]=fm;
 const hd=new THREE.Mesh(new RoundedBoxGeometry(.95,.95,.95,2,.08),new THREE.MeshStandardMaterial({color:skin,roughness:.6}));hd.position.y=.55;hd.castShadow=true;head.add(hd);
 const fp=new THREE.Mesh(new THREE.PlaneGeometry(.86,.86),fm);fp.position.set(0,.55,.476);head.add(fp);
 const hair=0x07070a,hm2={roughness:.95};reseed(7);
 const cap=box(1.05,.38,1.05,hair,.14,hm2);cap.position.y=1.06;head.add(cap);
 for(let i=0;i<16;i++){const sp=box(.3,.3+rnd()*.18,.3,hair,.1,hm2);const a=i/16*Math.PI*2;sp.position.set(Math.cos(a)*.42,1.02+rnd()*.14,Math.sin(a)*.42);sp.rotation.set(rnd()*.5,a,rnd()*.4);head.add(sp)}
 for(let i=0;i<5;i++){const f=box(.24,.34,.14,hair,.06,hm2);f.position.set(-.36+i*.18,.93,.5);f.rotation.z=(i-2)*.14;head.add(f)}
 const back=box(1.02,.9,.24,hair,.08,hm2);back.position.set(0,.62,-.43);head.add(back);
 [-.5,.5].forEach(x=>{const s=box(.14,.45,.7,hair,.06,hm2);s.position.set(x,.85,-.05);head.add(s)});
 g.userData={legL,legR,armL,armR,head,body,setFace:e=>{fm.map=face(e);fm.needsUpdate=true}};return g}
export function pose(R,p){const u=R.userData;const d={legL:0,legR:0,armL:0,armR:0,armLz:.08,armRz:-.08,head:0,headY:0,lean:0,...p};
 u.legL.rotation.x=d.legL;u.legR.rotation.x=d.legR;u.armL.rotation.set(d.armL,0,d.armLz);u.armR.rotation.set(d.armR,0,d.armRz);u.head.rotation.set(d.head,d.headY,0);u.body.rotation.x=d.lean}
export function run(R,ph,amp=.9){pose(R,{legL:Math.sin(ph)*amp,legR:-Math.sin(ph)*amp,armL:-Math.sin(ph)*amp,armR:Math.sin(ph)*amp,lean:.2})}
// senter di tangan kanan + sinar
export function flashlight(R,int=60){const f=box(.16,.5,.16,0x2c2c2c,.03);f.position.set(0,-1.35,0);R.userData.armR.add(f);
 const sp=new THREE.SpotLight(0xfff1c8,int,22,.32,.45,1.3);sp.position.set(0,-1.62,0);sp.castShadow=true;sp.shadow.mapSize.set(1024,1024);R.userData.armR.add(sp);const tg=new THREE.Object3D();tg.position.set(0,-8,0);R.userData.armR.add(tg);sp.target=tg;
 const cone=new THREE.Mesh(new THREE.ConeGeometry(1.6,6,24,1,true),new THREE.MeshBasicMaterial({color:0xfff0c0,transparent:true,opacity:.07,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
 cone.position.set(0,-4.62,0);R.userData.armR.add(cone);return sp}
export function torch(parent,y=-1.25){const g=new THREE.Group();const st=box(.12,.7,.12,0x5a3a1e,.02);g.add(st);const fl=new THREE.Mesh(new THREE.IcosahedronGeometry(.17,0),new THREE.MeshBasicMaterial({color:0xffb040}));fl.position.y=.45;fl.scale.y=1.6;g.add(fl);
 const fl2=new THREE.Mesh(new THREE.IcosahedronGeometry(.1,0),new THREE.MeshBasicMaterial({color:0xfff2a0}));fl2.position.y=.42;g.add(fl2);
 const l=new THREE.PointLight(0xff9a40,14,9,1.5);l.position.y=.6;l.castShadow=true;g.add(l);g.position.y=y;g.position.z=.15;parent.add(g);g.rotation.x=Math.PI/2;return g}
export function monster(){const g=new THREE.Group();const c=0x16141a,mm={roughness:.6,metalness:.2};
 const mk=(w,h,d,x,y,z)=>{const b=box(w,h,d,c,.08,mm);b.position.set(x,y,z);g.add(b);return b};
 mk(.8,2,.8,-.55,1,0);mk(.8,2,.8,.55,1,0);mk(2.2,2,1.1,0,3,0);const head=mk(1.3,1.2,1.2,0,4.65,0);
 const aL=new THREE.Group();aL.position.set(-1.45,3.8,0);const a1=box(.7,2.4,.7,c,.08,mm);a1.position.y=-1.1;aL.add(a1);g.add(aL);const aR=aL.clone();aR.position.x=1.45;g.add(aR);
 [[-1.3,2.7],[1.0,3.4],[.3,1.4]].forEach(([x,y])=>{const k=box(.18,.18,.05,0xff2a1a,.02,{emissive:0xff2a1a,emissiveIntensity:2});k.position.set(x,y,.56);g.add(k)});
 const em=new THREE.MeshBasicMaterial({color:0xff3020});[-.3,.3].forEach(x=>{const e=new THREE.Mesh(new THREE.BoxGeometry(.32,.12,.05),em);e.position.set(x,4.75,.62);e.rotation.z=x>0?.25:-.25;g.add(e)});
 const l=new THREE.PointLight(0xff2010,12,7,1.4);l.position.set(0,4.7,1.2);g.add(l);g.userData={aL,aR,head};return g}
export function chest(open=.9,glow=true){const g=new THREE.Group();const wood=0x6a4220,gold=0xd4a020;
 const b=box(1.5,.8,1,wood,.05);b.position.y=.4;g.add(b);[-.6,.6].forEach(x=>{const s=box(.12,.84,1.04,gold,.02,{metalness:.8,roughness:.3});s.position.set(x,.4,0);g.add(s)});
 const lid=new THREE.Group();lid.position.set(0,.8,-.5);const l=box(1.5,.35,1,wood,.08);l.position.set(0,.17,.5);lid.add(l);lid.rotation.x=-open*1.6;g.add(lid);
 if(glow){const gl=new THREE.Mesh(new THREE.BoxGeometry(1.3,.12,.8),new THREE.MeshBasicMaterial({color:0xffd060}));gl.position.y=.82;g.add(gl);
  for(let i=0;i<14;i++){const c=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.03,10),new THREE.MeshStandardMaterial({color:0xffc830,metalness:.9,roughness:.25,emissive:0x664400}));c.position.set((rnd()-.5)*1.2,.88+rnd()*.15,(rnd()-.5)*.6);c.rotation.set(rnd(),0,rnd());g.add(c)}
  const pl=new THREE.PointLight(0xffb030,18,8,1.4);pl.position.y=1.6;g.add(pl)}
 return g}
export function dust(sc,n,col,size,box3){const pg=new THREE.BufferGeometry();const pa=[];for(let i=0;i<n;i++)pa.push(box3[0]+rnd()*box3[1],box3[2]+rnd()*box3[3],box3[4]+rnd()*box3[5]);pg.setAttribute('position',new THREE.Float32BufferAttribute(pa,3));
 const p=new THREE.Points(pg,new THREE.PointsMaterial({color:col,size,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending}));sc.add(p);return p}
export function runeTex(col='#5fd4ff'){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.strokeStyle=col;x.lineWidth=10;x.shadowColor=col;x.shadowBlur=24;x.lineCap='round';
 x.beginPath();x.moveTo(128,30);x.lineTo(128,226);x.moveTo(60,90);x.lineTo(128,140);x.lineTo(196,90);x.moveTo(80,200);x.lineTo(176,200);x.stroke();x.beginPath();x.arc(128,140,40,0,7);x.stroke();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
export function rune(col=0x5fd4ff,s=1){const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s),new THREE.MeshBasicMaterial({map:runeTex('#'+col.toString(16).padStart(6,'0')),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));return m}
export function stoneWall(sc,x0,x1,y1,z,rot=0,col=.11){const g=new THREE.Group();for(let y=0;y<y1;y+=.9)for(let x=x0+((y/.9)%2)*.6;x<x1;x+=1.2){const b=box(1.15,.85,.8,new THREE.Color().setHSL(.6,.12,col+rnd()*.05),.05,{roughness:.95});b.position.set(x,y+.45,(rnd()-.5)*.15);g.add(b)}g.rotation.y=rot;g.position.z=z;sc.add(g);return g}
export function floor(sc,x0,x1,z0,z1,h=.6,l=.12,y=0,s=.08){for(let i=x0;i<=x1;i++)for(let j=z0;j<=z1;j++){const t=box(.97,.3,.97,new THREE.Color().setHSL(h,s,l+rnd()*.04),.04,{roughness:.95});t.position.set(i,y-.15-rnd()*.05,j);sc.add(t)}}
export function tree(sc,x,z,s=1){const g=new THREE.Group();const t=box(.5*s,4*s,.5*s,0x2a1e14,.05);t.position.y=2*s;g.add(t);
 for(let i=0;i<4;i++){const l=box((2.4-i*.45)*s,.9*s,(2.4-i*.45)*s,new THREE.Color().setHSL(.36,.4,.08+rnd()*.04),.1);l.position.y=(3.3+i*.75)*s;l.rotation.y=rnd();g.add(l)}g.position.set(x,0,z);sc.add(g);return g}
export function house(sc,x,z,rot=0,lit=true){const g=new THREE.Group();const w=box(3,2.4,2.6,0x5a4636,.05);w.position.y=1.2;g.add(w);
 const r=new THREE.Mesh(new THREE.ConeGeometry(2.4,1.6,4),new THREE.MeshStandardMaterial({color:0x3a2a22,roughness:.9}));r.rotation.y=Math.PI/4;r.position.y=3.2;r.castShadow=true;g.add(r);
 if(lit){const wi=new THREE.Mesh(new THREE.PlaneGeometry(.6,.6),new THREE.MeshBasicMaterial({color:0xffb050}));wi.position.set(.7,1.5,1.31);g.add(wi);const w2=wi.clone();w2.position.x=-.7;g.add(w2)}
 g.position.set(x,0,z);g.rotation.y=rot;sc.add(g);return g}
export function lantern(sc,x,y,z,col=0xffa040,i=8){const p=box(.12,y,.12,0x2a2018,.02);p.position.set(x,y/2,z);sc.add(p);const b=new THREE.Mesh(new THREE.BoxGeometry(.3,.4,.3),new THREE.MeshBasicMaterial({color:col}));b.position.set(x,y+.2,z);sc.add(b);const l=new THREE.PointLight(col,i,8,1.6);l.position.set(x,y+.2,z);sc.add(l)}
