// Aset fasum Dunia Kotak (gaya kotak besar membulat, satuan kavling; skala VS di pemanggil)
import {THREE,box} from '../lib.js';
function roof(w,h,d,c){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});g.translate(0,0,-d/2);return new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.8}))}
function G(){const g=new THREE.Group();g.ad=(m,x,y,z,ry=0)=>{m.position.set(x,y,z);m.rotation.y=ry;g.add(m);return m};return g}
function fin(g){g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g}
const P=0xf4f1e8,KACA=0x5aa8d8;
function pagar(g,w,d,col=0xffffff,gap=2){for(let x=-w/2;x<=w/2+.01;x+=1){if(Math.abs(x)>gap){g.ad(box(.18,.9,.18,col,.02),x,.8,d/2);}}for(let z=-d/2;z<d/2;z+=1){g.ad(box(.18,.9,.18,col,.02),-w/2,.8,z);g.ad(box(.18,.9,.18,col,.02),w/2,.8,z)}}
function lantai(g,w,d,c=0xd8d2c2){g.ad(box(w,.35,d,c,.03),0,.18,0)}
export function masjid(){const g=G();const H=0x2f9a5a,E=0xd9b44a;lantai(g,17,15);
 g.ad(box(10,4.2,9,P,.05),0,2.45,-1);g.ad(box(10.4,.4,9.4,0xe3dccb,.04),0,4.75,-1);
 [[6.4,.9],[5,.9],[3.6,.8],[2.2,.7]].forEach(([s,h],i,a)=>{const y=4.95+a.slice(0,i).reduce((t,q)=>t+q[1],0)+h/2;g.ad(box(s,h,s,H,.08),0,y,-1)});
 g.ad(box(.22,.9,.22,E,.03),0,8.7,-1);const bl=new THREE.Mesh(new THREE.SphereGeometry(.38,12,10),new THREE.MeshStandardMaterial({color:E,roughness:.4,metalness:.3}));g.ad(bl,0,9.35,-1);g.ad(box(.14,.5,.14,E,.02),0,9.9,-1);
 g.ad(box(10,2.6,3,P,.04),0,1.65,5);g.ad(box(10.4,.3,3.4,0xe3dccb,.03),0,3.1,5);
 [-4.3,-1.45,1.45,4.3].forEach(x=>g.ad(box(.5,2.6,.5,0xffffff,.04),x,1.65,6.3));
 [-2.9,0,2.9].forEach(x=>g.ad(box(1.6,2.2,.12,0x2a6a4a,.04),x,1.45,3.52));[-3.4,0,3.4].forEach(x=>g.ad(box(1.3,1.6,.12,KACA,.04),x,3.2,3.52));
 [-1,1].forEach(s=>[-3.5,-1,1.5].forEach(z=>g.ad(box(.12,1.6,1.3,KACA,.04),s*5.03,3,z-1)));
 const mx=6.5,mz=-4.5;g.ad(box(2,10,2,P,.05),mx,5.35,mz);g.ad(box(2.8,.4,2.8,0xe3dccb,.04),mx,8,mz);g.ad(box(2.2,1.2,2.2,P,.05),mx,9,mz);
 [[1.8,.6],[1.2,.5],[.6,.4]].forEach(([s,h],i)=>g.ad(box(s,h,s,H,.06),mx,9.9+i*.55,mz));const b2=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),new THREE.MeshStandardMaterial({color:E,roughness:.4,metalness:.3}));g.ad(b2,mx,11.3,mz);
 g.ad(box(3,1.4,2,0xe9e3d4,.04),-6,1.05,-4.5);pagar(g,17,15);return fin(g)}
export function gereja(){const g=G();const W=0xfaf6ee,R=0xc8553d;lantai(g,17,15);
 g.ad(box(8,4.5,11,W,.05),0,2.6,-1.5);const r=roof(9,3.2,11.6,R);g.ad(r,0,4.85,-1.5);
 g.ad(box(3.2,8,3.2,W,.05),0,4.35,5);const sp=new THREE.Mesh(new THREE.ConeGeometry(2.1,3.6,4),new THREE.MeshStandardMaterial({color:R,roughness:.8}));sp.rotation.y=Math.PI/4;g.ad(sp,0,10.15,5);
 g.ad(box(.3,1.8,.3,0xd9b44a,.03),0,12.8,5);g.ad(box(1.2,.3,.3,0xd9b44a,.03),0,13.1,5);
 g.ad(box(1.8,2.8,.15,0x7a4a26,.04),0,1.75,6.62);g.ad(box(1.4,1.4,.15,KACA,.3),0,6,6.62);
 [-1,1].forEach(s=>[-5,-2,1].forEach(z=>g.ad(box(.15,2.2,1,0xa8d0f0,.04),s*4.05,2.9,z)));pagar(g,17,15);return fin(g)}
export function katedral(){const g=G();const S=0xd9d4cc,B=0x4a5a7a;lantai(g,17,15);
 g.ad(box(9,5,10,S,.05),0,2.85,-2);g.ad(roof(10,3.4,10.6,B),0,5.35,-2);
 [-1,1].forEach(s=>{g.ad(box(2.6,9,2.6,S,.05),s*3.2,4.85,4);const c=new THREE.Mesh(new THREE.ConeGeometry(1.8,3.4,4),new THREE.MeshStandardMaterial({color:B,roughness:.8}));c.rotation.y=Math.PI/4;g.ad(c,s*3.2,11.05,4);g.ad(box(.25,1.4,.25,0xd9b44a,.03),s*3.2,13.4,4);g.ad(box(.9,.25,.25,0xd9b44a,.03),s*3.2,13.6,4)});
 g.ad(box(3.8,6,1.4,S,.05),0,3.35,4.3);g.ad(roof(4.2,1.8,1.6,B),0,6.35,4.3);
 const ros=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,.2,16),new THREE.MeshStandardMaterial({color:0x6a8ad8,roughness:.3}));ros.rotation.x=Math.PI/2;g.ad(ros,0,4.9,5.05);
 g.ad(box(1.8,2.8,.15,0x5a3a1e,.04),0,1.75,5.05);[-1,1].forEach(s=>[-5,-2].forEach(z=>g.ad(box(.15,2.6,1,0x9ab8e8,.04),s*4.55,3.2,z)));pagar(g,17,15,0x9a9a9a);return fin(g)}
export function pura(){const g=G();const BT=0xb5532e,BS=0x8a8478,IJ=0x2a2a24;lantai(g,17,15,0xcfc6b0);
 for(let x=-8.3;x<=8.3;x+=1.1)[[x,-7.2],[x,7.2]].forEach(([a,b])=>{if(b>0&&Math.abs(a)<2.2)return;g.ad(box(1.05,1.4,.6,BT,.04),a,1,b)});for(let z=-7.2;z<=7.2;z+=1.1)[-8.3,8.3].forEach(a=>g.ad(box(.6,1.4,1.05,BT,.04),a,1,z));
 [-1,1].forEach(s=>{[[2.2,1.4],[1.9,1.4],[1.6,1.2],[1.2,1],[.8,.8]].forEach(([w,h],i,a)=>{const y=.35+a.slice(0,i).reduce((t,q)=>t+q[1],0)+h/2;g.ad(box(w,h,1.4,i%2?BS:BT,.04),s*(1.1+w/2),y,7.2)})});
 g.ad(box(4,.8,4,BS,.04),0,.75,-2.5);g.ad(box(2.6,2.2,2.6,BT,.04),0,2.25,-2.5);
 [[5.2,.5],[4.4,.5],[3.6,.5],[2.8,.5],[2,.5]].forEach(([w,h],i)=>{g.ad(box(w,h,w,IJ,.06),0,3.6+i*1.05,-2.5);g.ad(box(w*.35,.55,w*.35,0x5a4a3a,.03),0,4.1+i*1.05,-2.5)});
 g.ad(box(.3,.9,.3,0xd9b44a,.03),0,9.2,-2.5);
 [[-5,-4],[5,-4]].forEach(([x,z])=>{g.ad(box(2.4,.6,2.4,BS,.04),x,.65,z);[-1,1].forEach(a=>[-1,1].forEach(b=>g.ad(box(.25,2,.25,0x7a4a26,.02),x+a*.9,1.9,z+b*.9)));g.ad(roof(3,1.3,3,IJ),x,2.9,z)});
 const pj=box(.15,4,.15,0x6a4426,.02);g.ad(pj,4.5,2.35,5.5);g.ad(box(.1,1.4,.6,0xffffff,.01),4.5,3.6,5.85);return fin(g)}
export function vihara(){const g=G();const K=0xf2c14a,M=0xb8322a,P2=0xfaf0dc;lantai(g,17,15);
 g.ad(box(9,4,8,K,.05),0,2.35,-1.5);g.ad(box(10.4,.6,9.4,M,.06),0,4.65,-1.5);g.ad(box(7,2,6,K,.05),0,5.95,-1.5);g.ad(box(8.2,.5,7.2,M,.06),0,7.2,-1.5);g.ad(box(4,1.4,3.4,K,.05),0,8.15,-1.5);g.ad(box(5,.4,4.4,M,.06),0,9.05,-1.5);g.ad(box(.5,1.2,.5,0xd9b44a,.04),0,9.85,-1.5);
 [-3,-1,1,3].forEach(x=>g.ad(box(.45,3.6,.45,M,.04),x,2.15,2.8));g.ad(box(2,2.6,.15,M,.04),0,1.65,2.58);
 const sx=5.6,sz=4.4;g.ad(box(2.6,.6,2.6,P2,.05),sx,.65,sz);g.ad(box(2.2,1.6,2.2,P2,.3),sx,1.75,sz);g.ad(box(1.2,.5,1.2,P2,.05),sx,2.8,sz);[.9,.7,.5,.3].forEach((w,i)=>g.ad(box(w,.35,w,0xd9b44a,.05),sx,3.2+i*.4,sz));
 pagar(g,17,15,0xb8322a);return fin(g)}
export function klenteng(){const g=G();const M=0xc8322a,HJ=0x2a8a5a,E=0xd9b44a;lantai(g,17,15,0xd8c8a8);
 g.ad(box(10,3.8,7,M,.05),0,2.25,-1.5);g.ad(box(11.6,.6,8.6,HJ,.06),0,4.45,-1.5);g.ad(roof(11,1.8,7.6,HJ),0,4.75,-1.5);
 [-1,1].forEach(s=>{g.ad(box(1,.5,.6,HJ,.06),s*5.6,5.1,2.6);g.ad(box(1,.5,.6,HJ,.06),s*5.6,5.1,-5.6)});
 g.ad(box(10.6,.35,.5,E,.03),0,6.55,-1.5);[-1,1].forEach(s=>g.ad(box(.8,.9,.6,E,.05),s*5,6.9,-1.5));
 [-3.6,-1.2,1.2,3.6].forEach(x=>g.ad(box(.5,3.6,.5,0x9a1a1a,.04),x,2.15,2.4));g.ad(box(2.2,2.6,.15,0x5a1a10,.04),0,1.65,2.02);
 [-2.4,2.4].forEach(x=>{const l=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8),new THREE.MeshStandardMaterial({color:0xff3a2a,emissive:0x8a1a10,roughness:.5}));l.scale.y=1.2;g.ad(l,x,3.4,2.6)});
 g.ad(box(1.6,1,1.6,0x6a5a3a,.1),0,.85,5);g.ad(box(1.9,.2,1.9,0x5a4a2a,.04),0,1.45,5);
 [-1,1].forEach(s=>{g.ad(box(1,.5,1,0x9a9a9a,.04),s*2.8,.6,3.6);g.ad(box(.7,1,.8,0xb0b0b0,.15),s*2.8,1.35,3.6)});pagar(g,17,15,0xc8322a);return fin(g)}
export function sekolah(){const g=G();const W=0xf6f2ea,R=0xc8553d,H=0x3a8a5a;lantai(g,19,17,0xd9c9a0);
 g.ad(box(14,3,4.5,W,.05),0,1.85,-5);g.ad(box(14,3,4.5,W,.05),0,4.85,-5);g.ad(roof(15,2.4,5.4,R),0,6.35,-5);
 g.ad(box(14.4,.25,1.6,0xd8cfbf,.02),0,3.4,-2.2);for(let x=-6.5;x<=6.5;x+=2.6){g.ad(box(1.6,1.2,.12,KACA,.03),x,2.2,-2.7);g.ad(box(1.6,1.2,.12,KACA,.03),x,5.2,-2.7);g.ad(box(.9,1.9,.12,0x7a4a26,.03),x+1.3,1.3,-2.7)}
 [-6.8,6.8].forEach(x=>g.ad(box(.3,3,.3,0xeeeeee,.03),x,4.85,-2.4));
 g.ad(box(11,.12,6.5,0xc9b48a,.02),0,.42,3.2);g.ad(box(.18,7.5,.18,0xdddddd,.02),0,4.1,3);g.ad(box(1.8,.6,.06,0xd8202a,.01),.95,7.4,3);g.ad(box(1.8,.6,.06,0xffffff,.01),.95,6.8,3);
 [-1,1].forEach(s=>{g.ad(box(.2,3,.2,0xdddddd,.02),s*7.5,1.85,5.5);g.ad(box(.2,1.6,1.4,0xffffff,.02),s*7.5,3.4,5.5)});
 [[-7.5,-1],[7.5,-1],[-8,6.5],[8,6.5]].forEach(([x,z])=>{g.ad(box(.6,2.4,.6,0x6a4426,.04),x,1.55,z);g.ad(box(2.6,2.2,2.6,H,.3),x,3.6,z)});pagar(g,19,17,0x3a7ad8,1.8);return fin(g)}
export function warung(){const g=G();const A=[0xe04a3a,0x3a8ad8,0xe0a020,0x3aa860,0x9a5ad8];lantai(g,19,17,0xd9c9a0);
 for(let i=0;i<5;i++){const x=-7.2+i*3.6;const W=[0xf2e2c4,0xe8f0f6,0xfaf0d8,0xe8f4e4,0xf0e6f6][i];g.ad(box(3.4,3.2,4,W,.05),x,1.95,-5.2);g.ad(box(3.6,.35,4.4,0x8a6a4a,.04),x,3.7,-5.2);
  const aw=box(3.4,.18,1.9,A[i],.04);aw.rotation.x=.35;g.ad(aw,x,3.05,-2.45);for(let k=0;k<3;k++)g.ad(box(.4,.2,1.8,0xffffff,.02),x-1.15+k*1.15,3.16+.0,-2.42).rotation.x=.35;
  g.ad(box(3,1,.9,0x9a6a3a,.04),x,.85,-2.9);[0,1,2].forEach(k=>g.ad(box(.5,.5,.5,[0xff5a3a,0xffd23a,0x7ad04a][(i+k)%3],.08),x-.9+k*.9,1.6,-2.9));g.ad(box(2.4,1.8,.12,0x4a3a2a,.03),x,2.1,-3.22)}
 for(let i=0;i<3;i++){const x=-5+i*5;g.ad(box(2.4,.2,1.4,0x9a6a3a,.04),x,1.1,3);[-1,1].forEach(s=>g.ad(box(1.8,.5,.4,0x7a4a26,.03),x,.65,3+s*1.1));g.ad(box(.12,2.6,.12,0xdddddd,.02),x,1.65,3);const u=new THREE.Mesh(new THREE.ConeGeometry(1.8,.8,8),new THREE.MeshStandardMaterial({color:A[i+1],roughness:.7}));g.ad(u,x,3.2,3)}
 g.ad(box(2,1.2,1.4,0xe04a3a,.1),7.5,1,4);g.ad(box(1.6,.5,1,0x333333,.05),7.5,1.9,4);return fin(g)}
// Supermarket Dunia Kotak (hasil voting warga 3 Nov 2026)
function papanTeks(w,h,txt,bg,fg){const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);let fs=Math.round(c.height*.62);x.font='900 '+fs+'px Montserrat, sans-serif';while(x.measureText(txt).width>c.width-60){fs-=4;x.font='900 '+fs+'px Montserrat, sans-serif'}x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';x.fillText(txt,c.width/2,c.height/2+4);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
 return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.7}))}
export function supermarket(){const g=G();const W=0xf3efe6,A=0x2f6fb8,O=0xf0a020,K=0x6fb6e0;lantai(g,19,17,0xcfcac0);
 // gedung utama 2 lantai + atap datar
 g.ad(box(16,7.6,7,W,.08),0,4.15,-4.6);g.ad(box(16.6,.5,7.6,0xdcd6ca,.05),0,8.2,-4.6);g.ad(box(5,1.2,3,0xb8b2a6,.05),-4,9,-5.5);
 // dinding kaca depan (2 lantai) dengan rangka
 for(let i=0;i<7;i++){const x=-6.6+i*2.2;g.ad(box(2,2.6,.14,K,.02),x,2.1,-1.08);g.ad(box(2,2.6,.14,K,.02),x,5.4,-1.08)}
 for(let i=0;i<8;i++)g.ad(box(.22,6.8,.24,0xe8e4dc,.02),-7.7+i*2.2,3.75,-1.02);g.ad(box(16,.3,.3,0xe8e4dc,.02),0,3.75,-1.0);
 // pintu otomatis + kanopi
 g.ad(box(3.4,2.5,.18,0x9fd6f2,.02),0,1.6,-.95);g.ad(box(.12,2.5,.2,0x5a5a5a,.01),0,1.6,-.88);g.ad(box(6,.35,2.6,A,.05),0,3.35,.2);[-2.7,2.7].forEach(x=>g.ad(box(.25,3,.25,0xdddddd,.02),x,1.85,1.3));
 // papan nama
 g.ad(box(10.4,1.8,.4,A,.06),0,7.05,-1.0);const pn=papanTeks(9.8,1.4,'SUPERMARKET','#2f6fb8','#ffffff');pn.position.set(0,7.05,-.78);g.add(pn);
 g.ad(box(1.6,1.6,.3,O,.3),-6.6,7.05,-.95);g.ad(box(1.6,1.6,.3,O,.3),6.6,7.05,-.95);
 // parkir: garis + mobil kecil + troli
 g.ad(box(15,.1,5.4,0x8a8a8a,.02),0,.42,4.6);for(let i=0;i<6;i++)g.ad(box(.14,.03,2.4,0xffffff,.01),-6+i*2.4,.49,5.6);
 [[-4.8,0xd8402a],[-.0,0x3a8ad8],[4.8,0xf2c14a]].forEach(([x,c])=>{g.ad(box(1.7,.8,2.4,c,.25),x+1.2,.95,5.6);g.ad(box(1.4,.6,1.3,0xbfe2f2,.2),x+1.2,1.6,5.4);[[-.8,-.8],[.8,-.8],[-.8,.8],[.8,.8]].forEach(([a,b])=>g.ad(box(.2,.5,.5,0x222222,.1),x+1.2+a,.65,5.6+b))});
 [-1.2,-.4].forEach(x=>{g.ad(box(.7,.5,.9,0xc8c8c8,.05),x-6.2,1,1.8);g.ad(box(.06,.5,.06,0x999999,.01),x-6.2,.6,2.2)});
 // pohon & lampu
 [[-8.3,-1],[8.3,-1],[-8.3,7],[8.3,7]].forEach(([x,z])=>{g.ad(box(.6,2.4,.6,0x6a4426,.04),x,1.55,z);g.ad(box(2.4,2.2,2.4,0x3a8a5a,.3),x,3.6,z)});
 [-6.5,6.5].forEach(x=>{g.ad(box(.2,3.6,.2,0x555555,.02),x,2.2,2.6);g.ad(box(.8,.3,.5,0xfff2c0,.05),x,4.1,2.6)});
 pagar(g,19,17,0x3a6ab8,3);return fin(g)}
// Rumah Sakit Dunia Kotak (hasil voting warga 3 Nov 2026)
export function rumahSakit(){const g=G();const W=0xf7f7f4,H=0x2fa58a,M=0xe0303a;lantai(g,19,17,0xd6d2c8);
 g.ad(box(13,9.6,6.5,W,.08),-1.5,5.15,-4.8);g.ad(box(13.6,.5,7.1,0xe2e2dc,.05),-1.5,10.2,-4.8);
 g.ad(box(4.6,5,5.4,W,.08),6.6,2.85,-4.2);g.ad(box(5,.4,5.8,0xe2e2dc,.05),6.6,5.55,-4.2);
 for(let f=0;f<3;f++)for(let i=0;i<5;i++)g.ad(box(1.6,1.5,.12,0x8fd0ec,.02),-6.6+i*2.55,2.1+f*3.05,-1.5);
 for(let f=0;f<3;f++)g.ad(box(13.1,.22,.3,H,.02),-1.5,3.35+f*3.05,-1.45);
 // salib merah besar + papan nama
 g.ad(box(2.8,.9,.4,M,.08),-1.5,11.4,-4.8);g.ad(box(.9,2.8,.4,M,.08),-1.5,11.4,-4.8);
 const pn=papanTeks(8.6,1.2,'RUMAH SAKIT','#2fa58a','#ffffff');pn.position.set(-1.5,9.15,-1.3);g.add(pn);
 // IGD: kanopi + pintu + salib kecil
 g.ad(box(4.6,1.5,.12,0x9fd6f2,.02),6.6,1.2,-1.45);g.ad(box(5.6,.35,3.2,M,.05),6.6,3.1,-.4);[4.2,9].forEach(x=>g.ad(box(.25,2.7,.25,0xdddddd,.02),x,1.7,1));
 const ig=papanTeks(2.6,.8,'IGD','#e0303a','#ffffff');ig.position.set(6.6,4.4,-1.48);g.add(ig);
 // ambulans
 g.ad(box(2,1.5,3.4,0xffffff,.2),6.6,1.2,3.4);g.ad(box(1.8,.8,1.1,0xbfe2f2,.15),6.6,1.6,5.05);g.ad(box(2.02,.3,3.42,M,.05),6.6,1.1,3.4);g.ad(box(.6,.25,.3,0x3a8ad8,.05),6.6,2.05,3.6);
 [[-.9,-1.1],[.9,-1.1],[-.9,1.1],[.9,1.1]].forEach(([a,b])=>g.ad(box(.25,.6,.6,0x222222,.1),6.6+a,.7,3.4+b));
 // taman depan + bangku
 g.ad(box(9,.3,4,0x7cc46a,.05),-3,.5,3.6);[[-6,4.6],[-1,4.6]].forEach(([x,z])=>g.ad(box(2,.4,.7,0x9a6a3a,.04),x,.9,z));
 [[-8.3,-1],[-8.3,6.8],[1.6,6.8]].forEach(([x,z])=>{g.ad(box(.6,2.4,.6,0x6a4426,.04),x,1.55,z);g.ad(box(2.4,2.2,2.4,0x3a8a5a,.3),x,3.6,z)});
 pagar(g,19,17,0xffffff,3);return fin(g)}
// Stadion mini Dunia Kotak (hasil voting warga 3 Nov 2026). Tribun rendah (<2,4) supaya lapangan bisa dimasuki.
export function stadion(){const g=G();const R=0x3aa04a,R2=0x2f8a3e,T=[0xe0303a,0x3a8ad8,0xf2c14a];lantai(g,19,17,0xb8b2a6);
 for(let i=0;i<8;i++)g.ad(box(1.7,.12,8.6,i%2?R:R2,.01),-5.95+i*1.7,.42,0);
 const L=0xffffff;g.ad(box(13.6,.05,.14,L,.01),0,.5,-4.25);g.ad(box(13.6,.05,.14,L,.01),0,.5,4.25);g.ad(box(.14,.05,8.6,L,.01),-6.8,.5,0);g.ad(box(.14,.05,8.6,L,.01),6.8,.5,0);g.ad(box(.14,.05,8.6,L,.01),0,.5,0);
 const ci=new THREE.Mesh(new THREE.TorusGeometry(1.4,.07,4,32),new THREE.MeshStandardMaterial({color:L}));ci.rotation.x=Math.PI/2;g.ad(ci,0,.49,0);
 [-1,1].forEach(s=>{g.ad(box(.14,.05,4,L,.01),s*5.4,.5,0);g.ad(box(1.4,.05,.14,L,.01),s*6.1,.5,-2);g.ad(box(1.4,.05,.14,L,.01),s*6.1,.5,2);
  g.ad(box(.15,1.5,.15,L,.02),s*6.9,1.15,-1.2);g.ad(box(.15,1.5,.15,L,.02),s*6.9,1.15,1.2);g.ad(box(.15,.15,2.55,L,.02),s*6.9,1.9,0);g.ad(box(.6,1.4,2.4,0xe8e8e8,.02),s*7.25,1.1,0)});
 // tribun bertingkat kiri-kanan lapangan (depan & belakang)
 [-1,1].forEach(s=>{for(let k=0;k<3;k++){g.ad(box(14,.6,1,0xcfcac0,.03),0,.55+k*.6,s*(5.2+k*1));for(let x=-6;x<=6;x+=1.5)g.ad(box(1.1,.25,.6,T[(k+Math.round((x+6)/1.5))%3],.05),x,1+k*.6,s*(5.2+k*1))}});
 // lampu sorot 4 sudut + papan skor
 [[-8.6,-7.6],[8.6,-7.6],[-8.6,7.6],[8.6,7.6]].forEach(([x,z])=>{g.ad(box(.3,9,.3,0x777777,.02),x,4.9,z);g.ad(box(1.8,1,.4,0xfff6c8,.05),x,9.6,z)});
 g.ad(box(.3,4,.3,0x555555,.02),-8.6,2.4,0);const sk=papanTeks(3.4,1.6,'2 - 1','#1b1c21','#ffd23a');sk.rotation.y=Math.PI/2;sk.position.set(-8.4,4.6,0);g.add(sk);g.ad(box(.3,1.8,3.6,0x1b1c21,.05),-8.6,4.6,0);
 const pn=papanTeks(6,1,'STADION DUNIA KOTAK','#e0303a','#ffffff');pn.position.set(0,2.6,8.15);g.add(pn);
 pagar(g,19,17,0xe0303a,2.4);return fin(g)}
export const SEMUA={masjid,gereja,katedral,pura,vihara,klenteng,sekolah,warung,supermarket,rumahSakit,stadion};
