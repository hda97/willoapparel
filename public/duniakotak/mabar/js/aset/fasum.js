// Aset fasum Dunia Kotak (gaya kotak besar membulat, satuan kavling; skala VS di pemanggil)
import {THREE,box} from '../lib.js';
function roof(w,h,d,c){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});g.translate(0,0,-d/2);return new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.8}))}
function G(){const g=new THREE.Group();g.ad=(m,x,y,z,ry=0)=>{m.position.set(x,y,z);m.rotation.y=ry;g.add(m);return m};return g}
function fin(g){g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g}
const P=0xf4f1e8,KACA=0x5aa8d8;
function pagar(g,w,d,col=0xffffff,gap=2){for(let x=-w/2;x<=w/2+.01;x+=1){if(Math.abs(x)>gap){g.ad(box(.18,.9,.18,col,.02),x,.8,d/2);}}for(let z=-d/2;z<d/2;z+=1){g.ad(box(.18,.9,.18,col,.02),-w/2,.8,z);g.ad(box(.18,.9,.18,col,.02),w/2,.8,z)}}
function lantai(g,w,d,c=0xd8d2c2){g.ad(box(w,.35,d,c,.03),0,.18,0)}
// ---- Ruang dalam (6 Nov 2026): badan gedung jadi cangkang berongga. Ukuran & warna luar SAMA seperti video, pintu depan terbuka,
// isi ruangan di dalam. Dinding dipecah: bawah (selalu tampak) & atas (disembunyikan game saat warga di dalam, supaya kamera bisa melihat).
// sisi: 'd' depan (+z), 'b' belakang (-z), 'ki' (-x), 'ka' (+x). bukaan p = geser dari tengah sisi.
export const BAWAH=1.25;
function ruang(g,{x=0,z=0,w,d,y0=.35,h,c,t=.3,bukaan=[],tanpa=[],lantaiC=null,zona=true}){
 const ud=g.userData;if(zona){(ud.zona||(ud.zona=[])).push([x-w/2,x+w/2,z-d/2,z+d/2,y0])}
 const sisi=[['d',w,(a,b)=>[x+(a+b)/2,z+d/2-t/2,b-a,t]],['b',w,(a,b)=>[x+(a+b)/2,z-d/2+t/2,b-a,t]],['ki',d-2*t,(a,b)=>[x-w/2+t/2,z+(a+b)/2,t,b-a]],['ka',d-2*t,(a,b)=>[x+w/2-t/2,z+(a+b)/2,t,b-a]]];
 const keping=(f,a,b,ya,yb)=>{if(b-a<.02||yb-ya<.02)return;const [cx,cz,sx,sz]=f(a,b);const m=g.ad(box(sx,yb-ya,sz,c,.01),cx,(ya+yb)/2,cz);m.userData.dinding=true;return m};
 for(const [s,len,f] of sisi){if(tanpa.includes(s))continue;const L=-len/2,R=len/2,bk=bukaan.filter(o=>o.s===s).map(o=>[o.p-o.w/2,o.p+o.w/2,o.h]).sort((a,b)=>a[0]-b[0]);
  let a=L;const yB=y0+Math.min(BAWAH,h),yT=y0+h;
  const pejal=(a1,b1)=>{keping(f,a1,b1,y0,yB);keping(f,a1,b1,yB,yT)};
  for(const [o0,o1,oh] of bk){pejal(a,o0);const yl=y0+oh;if(yl<yB){keping(f,o0,o1,yl,yB);keping(f,o0,o1,yB,yT)}else keping(f,o0,o1,yl,yT);a=o1}
  pejal(a,R)}
 if(lantaiC!=null)perabot(g,box(w-2*t,.04,d-2*t,lantaiC,.01),x,y0+.02,z);
}
// isi ruangan: tidak dipijak, tidak menghalangi (kecuali diberi dinding)
function perabot(g,m,x,y,z,ry=0){g.ad(m,x,y,z,ry);m.userData.bukanPijakan=true;m.userData.perabot=true;return m}
// daun pintu terbuka 90° ke dalam (engsel di kiri bukaan, sisi depan)
function daun(g,x,zMuka,w,h,col,y0=.35){const m=g.ad(box(.1,h,w,col,.02),x-w/2+.08,y0+h/2,zMuka-w/2-.05);m.userData.bukanPijakan=true;return m}
const kayu=0x8a5a2a,putih=0xf4f4f0;
function bangku(g,x,z,w,col=kayu,ry=0){perabot(g,box(w,.06,.32,col,.02),x,.6,z,ry);perabot(g,box(w,.28,.06,col,.02),x,.76,z-(ry?0:.15),ry);[-1,1].forEach(s=>perabot(g,box(.06,.25,.3,col,.01),x+s*(w/2-.1),.47,z,ry))}
function meja(g,x,z,w,dd,col=kayu,ht=.5){perabot(g,box(w,.06,dd,col,.02),x,.35+ht,z);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>perabot(g,box(.06,ht,.06,col,.01),x+a*(w/2-.06),.35+ht/2,z+b*(dd/2-.06)))}
function kursi(g,x,z,col=0x3a6ab8,dy=0){perabot(g,box(.32,.05,.32,col,.02),x,.6+dy,z);perabot(g,box(.32,.3,.05,col,.02),x,.78+dy,z+.15);perabot(g,box(.26,.25,.26,0x555555,.02),x,.47+dy,z)}
function rak(g,x,z,w,dd,ht,cols){const m=perabot(g,box(w,ht,dd,0xe8e4dc,.03),x,.35+ht/2,z);m.userData.dinding=true;for(let k=0;k<3;k++)for(let i=0;i<Math.floor(w/.35);i++)perabot(g,box(.26,.18,dd+.04,cols[(i+k)%cols.length],.03),x-w/2+.2+i*.35,.35+.25+k*(ht/3.2),z);return m}
function lampuGantung(g,x,y,z){perabot(g,box(.04,.6,.04,0x555555,.01),x,y-.3,z);perabot(g,box(.4,.18,.4,0xfff2c0,.05,{emissive:0xffe08a,emissiveIntensity:.6}),x,y-.65,z)}
export function masjid(){const g=G();const H=0x2f9a5a,E=0xd9b44a;lantai(g,17,15);
 ruang(g,{x:0,z:-1,w:10,d:9,h:4.2,c:P,bukaan:[{s:'d',p:0,w:1.6,h:2.2}],lantaiC:0x2f7a4a});g.ad(box(10.4,.4,9.4,0xe3dccb,.04),0,4.75,-1);
 [[6.4,.9],[5,.9],[3.6,.8],[2.2,.7]].forEach(([s,h],i,a)=>{const y=4.95+a.slice(0,i).reduce((t,q)=>t+q[1],0)+h/2;g.ad(box(s,h,s,H,.08),0,y,-1)});
 g.ad(box(.22,.9,.22,E,.03),0,8.7,-1);const bl=new THREE.Mesh(new THREE.SphereGeometry(.38,12,10),new THREE.MeshStandardMaterial({color:E,roughness:.4,metalness:.3}));g.ad(bl,0,9.35,-1);g.ad(box(.14,.5,.14,E,.02),0,9.9,-1);
 ruang(g,{x:0,z:5,w:10,d:3,h:2.6,c:P,tanpa:['d','b'],lantaiC:0xe9e3d4});g.ad(box(10.4,.3,3.4,0xe3dccb,.03),0,3.1,5);
 [-4.3,-1.45,1.45,4.3].forEach(x=>g.ad(box(.5,2.6,.5,0xffffff,.04),x,1.65,6.3));
 [-2.9,2.9].forEach(x=>g.ad(box(1.6,2.2,.12,0x2a6a4a,.04),x,1.45,3.52));daun(g,0,3.2,1.6,2.2,0x2a6a4a);
 for(let k=0;k<6;k++)perabot(g,box(9.2,.012,.08,0xe8d890,.004),0,.4,-4.6+k*1.3);perabot(g,box(1.6,2.6,.12,0xd9b44a,.03),0,1.65,-5.12);perabot(g,box(1.2,2.2,.14,0x2a6a4a,.03),0,1.45,-5.08);perabot(g,box(.8,.9,.8,kayu,.03),2,.8,-4.55);perabot(g,box(.8,.3,.4,kayu,.02),2,.5,-3.95);[-3.4,0,3.4].forEach(x=>g.ad(box(1.3,1.6,.12,KACA,.04),x,3.2,3.52));
 [-1,1].forEach(s=>[-3.5,-1,1.5].forEach(z=>g.ad(box(.12,1.6,1.3,KACA,.04),s*5.03,3,z-1)));
 const mx=6.5,mz=-4.5;g.ad(box(2,10,2,P,.05),mx,5.35,mz);g.ad(box(2.8,.4,2.8,0xe3dccb,.04),mx,8,mz);g.ad(box(2.2,1.2,2.2,P,.05),mx,9,mz);
 [[1.8,.6],[1.2,.5],[.6,.4]].forEach(([s,h],i)=>g.ad(box(s,h,s,H,.06),mx,9.9+i*.55,mz));const b2=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),new THREE.MeshStandardMaterial({color:E,roughness:.4,metalness:.3}));g.ad(b2,mx,11.3,mz);
 g.ad(box(3,1.4,2,0xe9e3d4,.04),-6,1.05,-4.5);pagar(g,17,15);return fin(g)}
export function gereja(){const g=G();const W=0xfaf6ee,R=0xc8553d;lantai(g,17,15);
 ruang(g,{x:0,z:-1.5,w:8,d:11,h:4.5,c:W,bukaan:[{s:'d',p:0,w:2,h:2.6}],lantaiC:0xc8b89a});const r=roof(9,3.2,11.6,R);g.ad(r,0,4.85,-1.5);
 ruang(g,{x:0,z:5,w:3.2,d:3.2,h:8,c:W,bukaan:[{s:'d',p:0,w:1.8,h:2.8}],tanpa:['b'],lantaiC:0xc8b89a});const sp=new THREE.Mesh(new THREE.ConeGeometry(2.1,3.6,4),new THREE.MeshStandardMaterial({color:R,roughness:.8}));sp.rotation.y=Math.PI/4;g.ad(sp,0,10.15,5);
 g.ad(box(.3,1.8,.3,0xd9b44a,.03),0,12.8,5);g.ad(box(1.2,.3,.3,0xd9b44a,.03),0,13.1,5);
 daun(g,0,6.3,1.8,2.8,0x7a4a26);
 for(let z=-5.2;z<=2.4;z+=1.1)[-1,1].forEach(s=>bangku(g,s*2.1,z,2.6));perabot(g,box(2.4,.5,.9,putih,.04),0,.6,-6.2);perabot(g,box(.14,1.5,.08,0xd9b44a,.02),0,2.4,-6.65);perabot(g,box(.8,.14,.08,0xd9b44a,.02),0,2.75,-6.65);perabot(g,box(1,.012,8,0xb8322a,.004),0,.38,-1.5);g.ad(box(1.4,1.4,.15,KACA,.3),0,6,6.62);
 [-1,1].forEach(s=>[-5,-2,1].forEach(z=>g.ad(box(.15,2.2,1,0xa8d0f0,.04),s*4.05,2.9,z)));pagar(g,17,15);return fin(g)}
export function katedral(){const g=G();const S=0xd9d4cc,B=0x4a5a7a;lantai(g,17,15);
 ruang(g,{x:0,z:-2,w:9,d:10,h:5,c:S,bukaan:[{s:'d',p:0,w:1.8,h:2.8}],lantaiC:0xb8b0a4});g.ad(roof(10,3.4,10.6,B),0,5.35,-2);
 [-1,1].forEach(s=>{g.ad(box(2.6,9,2.6,S,.05),s*3.2,4.85,4);const c=new THREE.Mesh(new THREE.ConeGeometry(1.8,3.4,4),new THREE.MeshStandardMaterial({color:B,roughness:.8}));c.rotation.y=Math.PI/4;g.ad(c,s*3.2,11.05,4);g.ad(box(.25,1.4,.25,0xd9b44a,.03),s*3.2,13.4,4);g.ad(box(.9,.25,.25,0xd9b44a,.03),s*3.2,13.6,4)});
 ruang(g,{x:0,z:4.3,w:3.8,d:1.4,h:6,c:S,bukaan:[{s:'d',p:0,w:1.8,h:2.8}],tanpa:['b'],lantaiC:0xb8b0a4});g.ad(roof(4.2,1.8,1.6,B),0,6.35,4.3);
 const ros=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,.2,16),new THREE.MeshStandardMaterial({color:0x6a8ad8,roughness:.3}));ros.rotation.x=Math.PI/2;g.ad(ros,0,4.9,5.05);
 daun(g,0,4.7,1.8,2.8,0x5a3a1e);
 for(let z=-5.4;z<=1.8;z+=1.1)[-1,1].forEach(s=>bangku(g,s*2.3,z,2.8,0x6a4426));perabot(g,box(1.1,.012,8.6,0x3a5aa8,.004),0,.38,-2);perabot(g,box(2.6,.55,1,putih,.04),0,.62,-6.1);perabot(g,box(.16,1.7,.08,0xd9b44a,.02),0,2.6,-6.6);perabot(g,box(.9,.16,.08,0xd9b44a,.02),0,3,-6.6);[[-2.6,-6],[2.6,-6]].forEach(([x,z])=>perabot(g,box(.18,.7,.18,0xfaf0d0,.03,{emissive:0xffd070,emissiveIntensity:.5}),x,.7,z));[-1,1].forEach(s=>[-5,-2].forEach(z=>g.ad(box(.15,2.6,1,0x9ab8e8,.04),s*4.55,3.2,z)));pagar(g,17,15,0x9a9a9a);return fin(g)}
export function pura(){const g=G();const BT=0xb5532e,BS=0x8a8478,IJ=0x2a2a24;lantai(g,17,15,0xcfc6b0);
 for(let x=-8.3;x<=8.3;x+=1.1)[[x,-7.2],[x,7.2]].forEach(([a,b])=>{if(b>0&&Math.abs(a)<2.2)return;g.ad(box(1.05,1.4,.6,BT,.04),a,1,b)});for(let z=-7.2;z<=7.2;z+=1.1)[-8.3,8.3].forEach(a=>g.ad(box(.6,1.4,1.05,BT,.04),a,1,z));
 [-1,1].forEach(s=>{[[2.2,1.4],[1.9,1.4],[1.6,1.2],[1.2,1],[.8,.8]].forEach(([w,h],i,a)=>{const y=.35+a.slice(0,i).reduce((t,q)=>t+q[1],0)+h/2;g.ad(box(w,h,1.4,i%2?BS:BT,.04),s*(1.1+w/2),y,7.2)})});
 g.ad(box(4,.8,4,BS,.04),0,.75,-2.5);g.ad(box(2.6,2.2,2.6,BT,.04),0,2.25,-2.5);
 [[5.2,.5],[4.4,.5],[3.6,.5],[2.8,.5],[2,.5]].forEach(([w,h],i)=>{g.ad(box(w,h,w,IJ,.06),0,3.6+i*1.05,-2.5);g.ad(box(w*.35,.55,w*.35,0x5a4a3a,.03),0,4.1+i*1.05,-2.5)});
 g.ad(box(.3,.9,.3,0xd9b44a,.03),0,9.2,-2.5);
 [[-5,-4],[5,-4]].forEach(([x,z])=>{g.ad(box(2.4,.6,2.4,BS,.04),x,.65,z);[-1,1].forEach(a=>[-1,1].forEach(b=>g.ad(box(.25,2,.25,0x7a4a26,.02),x+a*.9,1.9,z+b*.9)));g.ad(roof(3,1.3,3,IJ),x,2.9,z)});
 const pj=box(.15,4,.15,0x6a4426,.02);g.ad(pj,4.5,2.35,5.5);g.ad(box(.1,1.4,.6,0xffffff,.01),4.5,3.6,5.85);return fin(g)}
export function vihara(){const g=G();const K=0xf2c14a,M=0xb8322a,P2=0xfaf0dc;lantai(g,17,15);
 ruang(g,{x:0,z:-1.5,w:9,d:8,h:4,c:K,bukaan:[{s:'d',p:0,w:2,h:2.6}],lantaiC:0xc8a070});g.ad(box(10.4,.6,9.4,M,.06),0,4.65,-1.5);g.ad(box(7,2,6,K,.05),0,5.95,-1.5);g.ad(box(8.2,.5,7.2,M,.06),0,7.2,-1.5);g.ad(box(4,1.4,3.4,K,.05),0,8.15,-1.5);g.ad(box(5,.4,4.4,M,.06),0,9.05,-1.5);g.ad(box(.5,1.2,.5,0xd9b44a,.04),0,9.85,-1.5);
 [-3,-1,1,3].forEach(x=>g.ad(box(.45,3.6,.45,M,.04),x,2.15,2.8));daun(g,0,2.2,2,2.6,M);
 perabot(g,box(2,.45,1.2,M,.04),0,.58,-4.6);perabot(g,box(1.4,.35,.9,0xd9b44a,.08),0,.98,-4.6);perabot(g,box(.9,1,.6,0xe8c050,.25,{metalness:.3}),0,1.65,-4.6);perabot(g,box(.55,.55,.5,0xe8c050,.2,{metalness:.3}),0,2.42,-4.6);perabot(g,box(.3,.25,.3,0x3a2a1a,.1),0,2.75,-4.6);
 for(let r=0;r<3;r++)for(let i=-2;i<=2;i++)perabot(g,box(.55,.05,.55,0xb8322a,.02),i*1.2,.4,-2.4+r*1.4);[-1.6,1.6].forEach(x=>perabot(g,box(.16,.5,.16,0xfff0c0,.03,{emissive:0xffc050,emissiveIntensity:.6}),x,.85,-4.4));
 const sx=5.6,sz=4.4;g.ad(box(2.6,.6,2.6,P2,.05),sx,.65,sz);g.ad(box(2.2,1.6,2.2,P2,.3),sx,1.75,sz);g.ad(box(1.2,.5,1.2,P2,.05),sx,2.8,sz);[.9,.7,.5,.3].forEach((w,i)=>g.ad(box(w,.35,w,0xd9b44a,.05),sx,3.2+i*.4,sz));
 pagar(g,17,15,0xb8322a);return fin(g)}
export function klenteng(){const g=G();const M=0xc8322a,HJ=0x2a8a5a,E=0xd9b44a;lantai(g,17,15,0xd8c8a8);
 ruang(g,{x:0,z:-1.5,w:10,d:7,h:3.8,c:M,bukaan:[{s:'d',p:0,w:2.2,h:2.6}],lantaiC:0xb89a6a});g.ad(box(11.6,.6,8.6,HJ,.06),0,4.45,-1.5);g.ad(roof(11,1.8,7.6,HJ),0,4.75,-1.5);
 [-1,1].forEach(s=>{g.ad(box(1,.5,.6,HJ,.06),s*5.6,5.1,2.6);g.ad(box(1,.5,.6,HJ,.06),s*5.6,5.1,-5.6)});
 g.ad(box(10.6,.35,.5,E,.03),0,6.55,-1.5);[-1,1].forEach(s=>g.ad(box(.8,.9,.6,E,.05),s*5,6.9,-1.5));
 [-3.6,-1.2,1.2,3.6].forEach(x=>g.ad(box(.5,3.6,.5,0x9a1a1a,.04),x,2.15,2.4));daun(g,0,1.7,2.2,2.6,0x5a1a10);
 perabot(g,box(3.4,.55,.9,0x9a1a1a,.04),0,.62,-4.2);perabot(g,box(.7,.45,.7,0xd9b44a,.1,{metalness:.3}),0,1.12,-4.2);[-1.1,1.1].forEach(x=>perabot(g,box(.5,.8,.4,0xd9b44a,.15),x,1.3,-4.3));perabot(g,box(1,.5,1,0x6a5a3a,.1),0,.6,-1.6);perabot(g,box(.08,.6,.08,0xc83a2a,.01),0,1.15,-1.6);
 [-3,3].forEach(x=>{const l=perabot(g,new THREE.Mesh(new THREE.SphereGeometry(.32,10,8),new THREE.MeshStandardMaterial({color:0xff3a2a,emissive:0x8a1a10,roughness:.5})),x,3,-2.5);l.scale.y=1.2});
 [-2.4,2.4].forEach(x=>{const l=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8),new THREE.MeshStandardMaterial({color:0xff3a2a,emissive:0x8a1a10,roughness:.5}));l.scale.y=1.2;g.ad(l,x,3.4,2.6)});
 g.ad(box(1.6,1,1.6,0x6a5a3a,.1),0,.85,5);g.ad(box(1.9,.2,1.9,0x5a4a2a,.04),0,1.45,5);
 [-1,1].forEach(s=>{g.ad(box(1,.5,1,0x9a9a9a,.04),s*2.8,.6,3.6);g.ad(box(.7,1,.8,0xb0b0b0,.15),s*2.8,1.35,3.6)});pagar(g,17,15,0xc8322a);return fin(g)}
export function sekolah(){const g=G();const W=0xf6f2ea,R=0xc8553d,H=0x3a8a5a;lantai(g,19,17,0xd9c9a0);
 ruang(g,{x:0,z:-5,w:14,d:4.5,h:3,c:W,bukaan:[-2.6,0,2.6].map(p=>({s:'d',p,w:.9,h:1.9})),lantaiC:0xd8cfbf});g.ad(box(14,3,4.5,W,.05),0,4.85,-5);g.ad(roof(15,2.4,5.4,R),0,6.35,-5);
 g.ad(box(14.4,.25,1.6,0xd8cfbf,.02),0,3.4,-2.2);for(let x=-6.5;x<=6.5;x+=2.6){g.ad(box(1.6,1.2,.12,KACA,.03),x,2.2,-2.7);g.ad(box(1.6,1.2,.12,KACA,.03),x,5.2,-2.7);if(Math.abs(x+1.3)<3)daun(g,x+1.3,-3.05,.9,1.9,0x7a4a26);else g.ad(box(.9,1.9,.12,0x7a4a26,.03),x+1.3,1.3,-2.7)}
 perabot(g,box(4,1,.05,0x2a4a3a,.02),0,1.55,-6.92);perabot(g,box(4.2,.08,.08,kayu,.01),0,1.02,-6.9);meja(g,-3.2,-6.2,1,.5,kayu,.38);kursi(g,-3.2,-5.8,0x7a4a26);
 for(let r=0;r<2;r++)for(let i=-3;i<=3;i++){if(i===0)continue;meja(g,i*1.5,-5.3+r*1.25,.8,.45,0xc8a070,.32);kursi(g,i*1.5,-4.95+r*1.25,[0x3a6ab8,0xe04a3a,0x3aa860][(i+r+9)%3])}
 [-6.8,6.8].forEach(x=>g.ad(box(.3,3,.3,0xeeeeee,.03),x,4.85,-2.4));
 g.ad(box(11,.12,6.5,0xc9b48a,.02),0,.42,3.2);g.ad(box(.18,7.5,.18,0xdddddd,.02),0,4.1,3);g.ad(box(1.8,.6,.06,0xd8202a,.01),.95,7.4,3);g.ad(box(1.8,.6,.06,0xffffff,.01),.95,6.8,3);
 [-1,1].forEach(s=>{g.ad(box(.2,3,.2,0xdddddd,.02),s*7.5,1.85,5.5);g.ad(box(.2,1.6,1.4,0xffffff,.02),s*7.5,3.4,5.5)});
 [[-7.5,-1],[7.5,-1],[-8,6.5],[8,6.5]].forEach(([x,z])=>{g.ad(box(.6,2.4,.6,0x6a4426,.04),x,1.55,z);g.ad(box(2.6,2.2,2.6,H,.3),x,3.6,z)});pagar(g,19,17,0x3a7ad8,1.8);return fin(g)}
export function warung(){const g=G();const A=[0xe04a3a,0x3a8ad8,0xe0a020,0x3aa860,0x9a5ad8];lantai(g,19,17,0xd9c9a0);
 for(let i=0;i<5;i++){const x=-7.2+i*3.6;const W=[0xf2e2c4,0xe8f0f6,0xfaf0d8,0xe8f4e4,0xf0e6f6][i];ruang(g,{x,z:-5.2,w:3.4,d:4,h:3.2,c:W,bukaan:[{s:'d',p:0,w:2.4,h:2.65}],lantaiC:0xd8c8a8});rak(g,x,-6.8,2.6,.4,1,[0xff5a3a,0xffd23a,0x7ad04a,0x3a8ad8]);g.ad(box(3.6,.35,4.4,0x8a6a4a,.04),x,3.7,-5.2);
  const aw=box(3.4,.18,1.9,A[i],.04);aw.rotation.x=.35;g.ad(aw,x,3.05,-2.45);for(let k=0;k<3;k++)g.ad(box(.4,.2,1.8,0xffffff,.02),x-1.15+k*1.15,3.16+.0,-2.42).rotation.x=.35;
  g.ad(box(3,1,.9,0x9a6a3a,.04),x,.85,-2.9);[0,1,2].forEach(k=>g.ad(box(.5,.5,.5,[0xff5a3a,0xffd23a,0x7ad04a][(i+k)%3],.08),x-.9+k*.9,1.6,-2.9));}
 for(let i=0;i<3;i++){const x=-5+i*5;g.ad(box(2.4,.2,1.4,0x9a6a3a,.04),x,1.1,3);[-1,1].forEach(s=>g.ad(box(1.8,.5,.4,0x7a4a26,.03),x,.65,3+s*1.1));g.ad(box(.12,2.6,.12,0xdddddd,.02),x,1.65,3);const u=new THREE.Mesh(new THREE.ConeGeometry(1.8,.8,8),new THREE.MeshStandardMaterial({color:A[i+1],roughness:.7}));g.ad(u,x,3.2,3)}
 g.ad(box(2,1.2,1.4,0xe04a3a,.1),7.5,1,4);g.ad(box(1.6,.5,1,0x333333,.05),7.5,1.9,4);return fin(g)}
// Supermarket Dunia Kotak (hasil voting warga 3 Nov 2026)
function papanTeks(w,h,txt,bg,fg){const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);let fs=Math.round(c.height*.62);x.font='900 '+fs+'px Montserrat, sans-serif';while(x.measureText(txt).width>c.width-60){fs-=4;x.font='900 '+fs+'px Montserrat, sans-serif'}x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';x.fillText(txt,c.width/2,c.height/2+4);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
 return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.7}))}
export function supermarket(){const g=G();const W=0xf3efe6,A=0x2f6fb8,O=0xf0a020,K=0x6fb6e0;lantai(g,19,17,0xcfcac0);
 // gedung utama 2 lantai + atap datar
 ruang(g,{x:0,z:-4.6,w:16,d:7,h:7.6,c:W,bukaan:[{s:'d',p:0,w:3.4,h:2.5}],lantaiC:0xe8e8e4});g.ad(box(16.6,.5,7.6,0xdcd6ca,.05),0,8.2,-4.6);g.ad(box(5,1.2,3,0xb8b2a6,.05),-4,9,-5.5);
 // dinding kaca depan (2 lantai) dengan rangka
 for(let i=0;i<7;i++){const x=-6.6+i*2.2;if(i!==3)g.ad(box(2,2.6,.14,K,.02),x,2.1,-1.08);g.ad(box(2,2.6,.14,K,.02),x,5.4,-1.08)}
 for(let i=0;i<8;i++)if(i!==3&&i!==4)g.ad(box(.22,6.8,.24,0xe8e4dc,.02),-7.7+i*2.2,3.75,-1.02);[-1.8,1.8].forEach(x=>g.ad(box(.22,3.4,.24,0xe8e4dc,.02),x,2.05,-1.02));g.ad(box(16,.3,.3,0xe8e4dc,.02),0,3.75,-1.0);
 // pintu otomatis + kanopi
 [-1,1].forEach(s=>g.ad(box(1.7,2.5,.12,0x9fd6f2,.02),s*2.75,1.6,-.86));
 [-6.8,-5.2,-3.6].forEach(z=>[-5.2,5.2].forEach(x=>rak(g,x,z,3.6,.6,1.1,[0xe04a3a,0xf2c14a,0x3a8ad8,0x3aa860,0xffffff])));[-6.8,-5.2].forEach(z=>rak(g,0,z,3,.6,1.1,[0xff8a3a,0x9a5ad8,0x3a8ad8,0xf2c14a]));
 [-2.6,2.6].forEach(x=>{perabot(g,box(1.4,.5,.6,A,.04),x,.6,-2.2).userData.dinding=true;perabot(g,box(.4,.3,.3,0x333333,.03),x+.3,1,-2.2)});g.ad(box(6,.35,2.6,A,.05),0,3.35,.2);[-2.7,2.7].forEach(x=>g.ad(box(.25,3,.25,0xdddddd,.02),x,1.85,1.3));
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
 ruang(g,{x:-1.5,z:-4.8,w:13,d:6.5,h:9.6,c:W,bukaan:[{s:'ka',p:.6,w:2,h:2.4}],lantaiC:0xeef2f2});
 for(let i=0;i<5;i++){const x=-6.8+i*2.3;perabot(g,box(.8,.25,1.3,putih,.05),x,.62,-7.1);perabot(g,box(.8,.1,.8,0x6ab0e0,.03),x,.8,-6.9);perabot(g,box(.6,.12,.3,putih,.05),x,.82,-7.55);perabot(g,box(.04,.9,1.4,0xa8d8c8,.01),x+1.15,.9,-7)}g.ad(box(13.6,.5,7.1,0xe2e2dc,.05),-1.5,10.2,-4.8);
 ruang(g,{x:6.6,z:-4.2,w:4.6,d:5.4,h:5,c:W,bukaan:[{s:'d',p:0,w:3,h:2},{s:'ki',p:0,w:2,h:2.4}],lantaiC:0xeef2f2});perabot(g,box(1.8,.55,.6,H,.04),6.8,.62,-6.1).userData.dinding=true;perabot(g,box(.4,.3,.3,0x333333,.03),7.2,1.05,-6.1);perabot(g,box(.8,.25,1.3,putih,.05),8,.62,-3.6);g.ad(box(5,.4,5.8,0xe2e2dc,.05),6.6,5.55,-4.2);
 for(let f=0;f<3;f++)for(let i=0;i<5;i++)g.ad(box(1.6,1.5,.12,0x8fd0ec,.02),-6.6+i*2.55,2.1+f*3.05,-1.5);
 for(let f=0;f<3;f++)g.ad(box(13.1,.22,.3,H,.02),-1.5,3.35+f*3.05,-1.45);
 // salib merah besar + papan nama
 g.ad(box(2.8,.9,.4,M,.08),-1.5,11.4,-4.8);g.ad(box(.9,2.8,.4,M,.08),-1.5,11.4,-4.8);
 const pn=papanTeks(8.6,1.2,'RUMAH SAKIT','#2fa58a','#ffffff');pn.position.set(-1.5,9.15,-1.3);g.add(pn);
 // IGD: kanopi + pintu + salib kecil
 [-1,1].forEach(s=>g.ad(box(.8,1.5,.12,0x9fd6f2,.02),6.6+s*1.9,1.2,-1.4));g.ad(box(5.6,.35,3.2,M,.05),6.6,3.1,-.4);[4.2,9].forEach(x=>g.ad(box(.25,2.7,.25,0xdddddd,.02),x,1.7,1));
 const ig=papanTeks(2.6,.8,'IGD','#e0303a','#ffffff');ig.position.set(6.6,4.4,-1.48);g.add(ig);
 // ambulans
 g.ad(box(2,1.5,3.4,0xffffff,.2),6.6,1.2,3.4);g.ad(box(1.8,.8,1.1,0xbfe2f2,.15),6.6,1.6,5.05);g.ad(box(2.02,.3,3.42,M,.05),6.6,1.1,3.4);g.ad(box(.6,.25,.3,0x3a8ad8,.05),6.6,2.05,3.6);
 [[-.9,-1.1],[.9,-1.1],[-.9,1.1],[.9,1.1]].forEach(([a,b])=>g.ad(box(.25,.6,.6,0x222222,.1),6.6+a,.7,3.4+b));
 // taman depan + bangku
 g.ad(box(9,.3,4,0x7cc46a,.05),-3,.5,3.6);[[-6,4.6],[-1,4.6]].forEach(([x,z])=>g.ad(box(2,.4,.7,0x9a6a3a,.04),x,.9,z));
 [[-8.3,-1],[-8.3,6.8],[1.6,6.8]].forEach(([x,z])=>{g.ad(box(.6,2.4,.6,0x6a4426,.04),x,1.55,z);g.ad(box(2.4,2.2,2.4,0x3a8a5a,.3),x,3.6,z)});
 pagar(g,19,17,0xffffff,3);return fin(g)}
// Stadion mini Dunia Kotak (hasil voting warga 3 Nov 2026). Tribun rendah (<2,4) supaya lapangan bisa dimasuki.
// gawang: tiang + jaring (6 Nov 2026, Huda: bukan kubus). Tiang depan di x=±6.9, jaring menjorok ke belakang sampai ±7.6.
function jaring(g,s){const L=0xffffff,N=0xe6e6e6,x0=s*6.9,x1=s*7.6,y0=.42,y1=1.9,zA=-1.2,zB=1.2,t=.025;
 [zA,zB].forEach(z=>{g.ad(box(.08,y1-y0,.08,L,.01),x1,(y0+y1)/2,z);g.ad(box(.7,.08,.08,L,.01),(x0+x1)/2,y1,z);g.ad(box(.7,.06,.06,L,.01),(x0+x1)/2,y0+.03,z)});
 g.ad(box(.08,.08,2.4,L,.01),x1,y1,0);
 for(let z=zA+.2;z<zB-.01;z+=.2){g.ad(box(t,y1-y0,t,N,.004),x1,(y0+y1)/2,z);g.ad(box(.7,t,t,N,.004),(x0+x1)/2,y1,z)}
 for(let y=y0+.2;y<y1-.01;y+=.2){g.ad(box(t,t,2.4,N,.004),x1,y,0);[zA,zB].forEach(z=>g.ad(box(.7,t,t,N,.004),(x0+x1)/2,y,z))}
 for(let k=1;k<4;k++){const x=x0+(x1-x0)*k/3.5;[zA,zB].forEach(z=>g.ad(box(t,y1-y0,t,N,.004),x,(y0+y1)/2,z));g.ad(box(t,t,2.4,N,.004),x,y1,0)}}
export function stadion(){const g=G();const R=0x3aa04a,R2=0x2f8a3e,T=[0xe0303a,0x3a8ad8,0xf2c14a];lantai(g,19,17,0xb8b2a6);
 for(let i=0;i<8;i++)g.ad(box(1.7,.12,8.6,i%2?R:R2,.01),-5.95+i*1.7,.42,0);
 const L=0xffffff;g.ad(box(13.6,.05,.14,L,.01),0,.5,-4.25);g.ad(box(13.6,.05,.14,L,.01),0,.5,4.25);g.ad(box(.14,.05,8.6,L,.01),-6.8,.5,0);g.ad(box(.14,.05,8.6,L,.01),6.8,.5,0);g.ad(box(.14,.05,8.6,L,.01),0,.5,0);
 const ci=new THREE.Mesh(new THREE.TorusGeometry(1.4,.07,4,32),new THREE.MeshStandardMaterial({color:L}));ci.rotation.x=Math.PI/2;g.ad(ci,0,.49,0);
 [-1,1].forEach(s=>{g.ad(box(.14,.05,4,L,.01),s*5.4,.5,0);g.ad(box(1.4,.05,.14,L,.01),s*6.1,.5,-2);g.ad(box(1.4,.05,.14,L,.01),s*6.1,.5,2);
  g.ad(box(.15,1.5,.15,L,.02),s*6.9,1.15,-1.2);g.ad(box(.15,1.5,.15,L,.02),s*6.9,1.15,1.2);g.ad(box(.15,.15,2.55,L,.02),s*6.9,1.9,0);jaring(g,s)});
 // tribun bertingkat kiri-kanan lapangan (depan & belakang)
 [-1,1].forEach(s=>{for(let k=0;k<3;k++){g.ad(box(14,.6,1,0xcfcac0,.03),0,.55+k*.6,s*(5.2+k*1));for(let x=-6;x<=6;x+=1.5)g.ad(box(1.1,.25,.6,T[(k+Math.round((x+6)/1.5))%3],.05),x,1+k*.6,s*(5.2+k*1))}});
 // lampu sorot 4 sudut + papan skor
 [[-8.6,-7.6],[8.6,-7.6],[-8.6,7.6],[8.6,7.6]].forEach(([x,z])=>{g.ad(box(.3,9,.3,0x777777,.02),x,4.9,z);g.ad(box(1.8,1,.4,0xfff6c8,.05),x,9.6,z)});
 g.ad(box(.3,4,.3,0x555555,.02),-8.6,2.4,0);const sk=papanTeks(3.4,1.6,'2 - 1','#1b1c21','#ffd23a');sk.rotation.y=Math.PI/2;sk.position.set(-8.4,4.6,0);g.add(sk);g.ad(box(.3,1.8,3.6,0x1b1c21,.05),-8.6,4.6,0);
 const pn=papanTeks(6,1,'STADION DUNIA KOTAK','#e0303a','#ffffff');pn.position.set(0,2.6,8.15);g.add(pn);
 pagar(g,19,17,0xe0303a,2.4);return fin(g)}
// Kampus Dunia Kotak (hasil voting warga, 6 Nov 2026): gedung kuliah 2 lantai + serambi bertiang + menara jam; di dalam aula kuliah & perpustakaan.
export function kampus(){const g=G();const W=0xf4efe2,B=0x8a2a2a,N=0x1f3a6a,E=0xd9b44a;lantai(g,19,17,0xd6cfbf);
 ruang(g,{x:0,z:-4.2,w:16,d:7.6,h:6.4,c:W,bukaan:[{s:'d',p:0,w:2.6,h:2.8}],lantaiC:0xc8b08a});
 g.ad(box(16.6,.5,8.2,0xe2dccb,.05),0,6.95,-4.2);g.ad(roof(16.4,2.4,7.8,B),0,7.2,-4.2);
 // jendela 2 lantai + pita
 for(let f=0;f<2;f++)for(let i=0;i<6;i++){const x=-6.6+i*2.64;if(f===0&&Math.abs(x)<2)continue;g.ad(box(1.5,1.6,.12,KACA,.03),x,1.9+f*3,-.36)}
 g.ad(box(16.1,.25,.3,N,.02),0,3.7,-.34);
 // serambi bertiang + segitiga atap (gaya kampus)
 g.ad(box(7,.3,2.4,0xe2dccb,.03),0,.5,1.1);g.ad(box(7.4,.4,2.8,W,.04),0,5.6,1);[-3,-1.2,1.2,3].forEach(x=>g.ad(box(.5,5,.5,0xffffff,.04),x,3.1,1.9));g.ad(roof(7.6,1.5,2.8,W),0,5.8,1);
 const pn=papanTeks(6.4,.8,'KAMPUS DUNIA KOTAK','#1f3a6a','#ffffff');pn.position.set(0,4.8,2.42);g.add(pn);g.userData.zona.push([-3.7,3.7,-.4,2.4,.65]);
 daun(g,-.65,-.7,1.3,2.8,0x6a4426);daun(g,.65,-.7,1.3,2.8,0x6a4426).position.x=1.22;
 // menara jam di belakang tengah
 g.ad(box(3,4,3,W,.05),0,11,-6.2);g.ad(box(3.4,.3,3.4,0xe2dccb,.03),0,13.1,-6.2);const jm=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,.12,20),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5}));jm.rotation.x=Math.PI/2;g.ad(jm,0,11.6,-4.68);g.ad(box(.08,.6,.06,0x222222,.01),0,11.85,-4.6);g.ad(box(.45,.08,.06,0x222222,.01),.2,11.6,-4.6);
 const pk=new THREE.Mesh(new THREE.ConeGeometry(2.3,2.2,4),new THREE.MeshStandardMaterial({color:B,roughness:.8}));pk.rotation.y=Math.PI/4;g.ad(pk,0,14.35,-6.2);g.ad(box(.2,.8,.2,E,.03),0,15.8,-6.2);
 // isi: aula kuliah (kiri) — kursi bertingkat menghadap layar; perpustakaan (kanan) — rak buku & meja baca
 perabot(g,box(3.6,1.8,.06,0xffffff,.01),-4.6,2.2,-7.66);perabot(g,box(1.4,.6,.6,N,.04),-4.6,.66,-7.1).userData.dinding=true;
 for(let r=0;r<4;r++){g.ad(box(6.4,.1*(r+1),1,0xb89a70,.02),-4.6,.35+.05*(r+1),-5.6+r*1.05);for(let i=0;i<6;i++)kursi(g,-7.1+i*1,-5.7+r*1.05,[N,0x3a6ab8][r%2],.1*(r+1))}
 for(const z of [-7.3,-5.8])rak(g,4.6,z,5,.4,1.3,[0xe04a3a,0x3a8ad8,0xf2c14a,0x3aa860,0x9a5ad8,0xffffff]);
 [[3.4,-3.4],[5.8,-3.4]].forEach(([x,z])=>{meja(g,x,z,1.6,.8,kayu,.38);[-1,1].forEach(s=>kursi(g,x+s*.5,z+.6,0x7a4a26))});
 perabot(g,box(.12,1.2,3.6,W,.02),.1,.95,-5.6).userData.dinding=true;
 // halaman: tiang bendera, bangku, pohon, lampu
 g.ad(box(.18,7.5,.18,0xdddddd,.02),-6.5,4.1,4.6);g.ad(box(1.8,.6,.06,0xd8202a,.01),-5.55,7.4,4.6);g.ad(box(1.8,.6,.06,0xffffff,.01),-5.55,6.8,4.6);
 [[-3,6.2],[3,6.2]].forEach(([x,z])=>g.ad(box(2,.4,.7,0x9a6a3a,.04),x,.9,z));
 [[-8.3,-1],[8.3,-1],[-8.3,6.8],[8.3,6.8],[6,6.8]].forEach(([x,z])=>{g.ad(box(.6,2.4,.6,0x6a4426,.04),x,1.55,z);g.ad(box(2.4,2.2,2.4,0x3a8a5a,.3),x,3.6,z)});
 [-4.5,4.5].forEach(x=>{g.ad(box(.2,3.6,.2,0x555555,.02),x,2.2,3.4);g.ad(box(.8,.3,.5,0xfff2c0,.05),x,4.1,3.4)});
 pagar(g,19,17,N,3);return fin(g)}
// ---- Taman Kota (hasil voting warga, dibangun 6-14 Nov 2026; pilihan Huda: taman bagus dengan fasilitas taman) ----
// Rumput + jalan salib berpaving, jalur jogging keliling, air mancur di tengah, gazebo, taman bermain (ayunan, perosotan, jungkat-jungkit),
// kolam ikan + jembatan kecil, bedeng bunga, bangku, lampu taman, pohon rindang, gerbang "TAMAN KOTA". Semua bisa dilewati/dimasuki.
function pohonT(g,x,z,s=1,c=0x3a8a5a){g.ad(box(.55*s,2.2*s,.55*s,0x6a4426,.04),x,.35+1.1*s,z);g.ad(box(2.6*s,2*s,2.6*s,c,.3),x,.35+3*s,z);g.ad(box(1.6*s,1.2*s,1.6*s,c,.25),x,.35+4.4*s,z)}
function lampuT(g,x,z){g.ad(box(.16,2.6,.16,0x2a2a2a,.02),x,1.65,z);g.ad(box(.5,.4,.5,0xfff2c0,.06,{emissive:0xffe08a,emissiveIntensity:.7}),x,3.1,z);g.ad(box(.6,.08,.6,0x2a2a2a,.02),x,3.34,z)}
function bunga(g,x,z,w,d){g.ad(box(w,.3,d,0x7a5a3a,.04),x,.5,z);const C=[0xff5a7a,0xffd23a,0xffffff,0xb06ae0,0xff8a3a];let k=0;for(let i=-w/2+.35;i<w/2-.1;i+=.55)for(let j=-d/2+.35;j<d/2-.1;j+=.55){g.ad(box(.12,.3,.12,0x3a8a3a,.02),x+i,.8,z+j);g.ad(box(.3,.25,.3,C[k++%C.length],.08),x+i,1.02,z+j)}}
export function tamanKota(){const g=G();const RUMPUT=0x6fbf5a,PAV=0xe2d6b8,JOG=0xc8875a,BATU=0xbdb6a6;lantai(g,19,17,RUMPUT);
 // jalan salib berpaving & jalur jogging keliling
 g.ad(box(19,.06,2.2,PAV,.02),0,.38,0);g.ad(box(2.2,.06,17,PAV,.02),0,.38,0);
 [[0,-7.2,17,1],[0,7.2,17,1]].forEach(([x,z,w,d])=>g.ad(box(w,.05,d,JOG,.02),x,.375,z));[[-8.4,0,1,15.4],[8.4,0,1,15.4]].forEach(([x,z,w,d])=>g.ad(box(w,.05,d,JOG,.02),x,.375,z));
 // air mancur bertingkat di tengah
 const cyl=(r,h,c,y,o={})=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),new THREE.MeshStandardMaterial({color:c,roughness:.6,...o}));m.castShadow=m.receiveShadow=true;g.ad(m,0,y,0);return m};
 cyl(2.5,.6,BATU,.65);cyl(2.2,.08,0x4aa8e0,.96,{emissive:0x1a5a8a,emissiveIntensity:.25});cyl(.45,1.6,BATU,1.7);cyl(1.2,.25,BATU,2.5);cyl(1,.06,0x6ac0f0,2.64,{emissive:0x2a6a9a,emissiveIntensity:.3});cyl(.22,.9,0xa8dcf8,3.1,{transparent:true,opacity:.75});
 // gazebo (kiri belakang)
 const gx=-5,gz=-4;g.ad(box(4.2,.3,4.2,0xc8a878,.04),gx,.5,gz);[[-1.8,-1.8],[1.8,-1.8],[-1.8,1.8],[1.8,1.8]].forEach(([a,b])=>g.ad(box(.28,2.8,.28,0xf4f0e6,.03),gx+a,2.05,gz+b));
 const atap=new THREE.Mesh(new THREE.ConeGeometry(3.4,1.8,4),new THREE.MeshStandardMaterial({color:0xb84a3a,roughness:.8}));atap.rotation.y=Math.PI/4;atap.castShadow=true;g.ad(atap,gx,4.35,gz);g.ad(box(4.4,.25,4.4,0xf4f0e6,.03),gx,3.5,gz);
 bangku(g,gx,gz-1.2,2.6,kayu);bangku(g,gx,gz+1.4,2.6,kayu,Math.PI);
 // taman bermain (kanan belakang): pasir, ayunan, perosotan, jungkat-jungkit
 const px=5.2,pz=-4.2;g.ad(box(6.4,.06,5.4,0xe8d29a,.02),px,.38,pz);
g.ad(box(.18,2.6,.18,0xe04a3a,.02),px-2.6,1.65,pz-1.6);g.ad(box(.18,2.6,.18,0xe04a3a,.02),px-.2,1.65,pz-1.6);g.ad(box(2.6,.18,.18,0xe04a3a,.02),px-1.4,2.95,pz-1.6);
 [-2,-.8].forEach(dx=>{[-.25,.25].forEach(t=>g.ad(box(.04,1.9,.04,0x444444,.01),px+dx+t,1.95,pz-1.6));g.ad(box(.7,.08,.35,0x3a8ad8,.02),px+dx,1,pz-1.6)});
 g.ad(box(1.2,2.2,1.2,0x3aa860,.04),px+1.9,1.45,pz-1.5);g.ad(box(1.3,.2,1.3,0xffd23a,.03),px+1.9,2.65,pz-1.5);
 const pr=box(.9,.1,3.2,0xffd23a,.03);pr.rotation.x=-.55;g.ad(pr,px+1.9,1.55,pz+.6);[-1,1].forEach(s=>{const r2=box(.06,.25,3.2,0xe0a020,.02);r2.rotation.x=-.55;g.ad(r2,px+1.9+s*.45,1.7,pz+.6)});
 g.ad(box(.3,.5,.3,0x9a5ad8,.03),px-1.2,.6,pz+1.4);const jj=box(3,.12,.4,0x9a5ad8,.03);jj.rotation.z=.12;g.ad(jj,px-1.2,.9,pz+1.4);
 // kolam ikan + jembatan (kanan depan)
 const kx=5.4,kz=4.3;g.ad(box(5.4,.3,3.6,BATU,.1),kx,.45,kz);g.ad(box(5,.06,3.2,0x3a8ac0,.05,{emissive:0x0a3a5a,emissiveIntensity:.2}),kx,.6,kz);
 [[-1.6,-.6,0xff7a2a],[.4,.7,0xffffff],[1.5,-.4,0xff4a2a]].forEach(([a,b,c])=>g.ad(box(.45,.14,.22,c,.05),kx+a,.68,kz+b));[[-.6,.9],[1.9,.9],[-2,.3]].forEach(([a,b])=>g.ad(box(.6,.04,.6,0x4aa84a,.1),kx+a,.65,kz+b));
 g.ad(box(1.2,.15,3.8,kayu,.03),kx,.85,kz);[-1,1].forEach(s=>g.ad(box(.08,.5,3.8,kayu,.02),kx+s*.6,1.15,kz));
 // bedeng bunga di sekitar air mancur & sepanjang jalan
 [[-3.2,-2.6],[3.2,-2.6],[-3.2,2.6],[3.2,2.6]].forEach(([x,z])=>bunga(g,x,z,2.6,1.4));bunga(g,-5.4,4.6,3.6,1.6);bunga(g,-2.5,7.95,3,.6);bunga(g,2.5,7.95,3,.6);
 // bangku di tepi jalan
 [[-6,1.6,0],[6,1.6,0],[-1.8,5.2,Math.PI/2],[1.8,-5.6,Math.PI/2]].forEach(([x,z,r])=>bangku(g,x,z,2,kayu,r));
 // lampu taman
 [[-1.6,-1.6],[1.6,-1.6],[-1.6,1.6],[1.6,1.6],[-8.4,-7.2],[8.4,-7.2],[-8.4,7.2],[8.4,7.2],[0,-7.2],[-8.4,0],[8.4,0]].forEach(([x,z])=>lampuT(g,x+(Math.abs(x)>8?0:0),z+(Math.abs(z)>7?(z>0?.75:-.75):0)));
 // pohon rindang di sudut & tepi
 [[-8.6,-7.8,1],[8.6,-7.8,1],[-8.6,4,.9],[-2.8,-6.6,.8],[2.8,-6.6,.8],[8.7,1.6,.8],[-8.7,-3.6,.85]].forEach(([x,z,s])=>pohonT(g,x,z,s,[0x3a8a5a,0x2f7a4a,0x4a9a5a][Math.round(Math.abs(x*z))%3]));
 // gerbang depan "TAMAN KOTA"
 [-1.6,1.6].forEach(x=>g.ad(box(.45,4.2,.45,0x2f7a4a,.04),x,2.45,8.3));g.ad(box(3.9,.35,.5,0x2f7a4a,.04),0,4.55,8.3);
 const pn=papanTeks(3.4,.75,'TAMAN KOTA','#2f7a4a','#ffffff');pn.position.set(0,4.05,8.58);g.add(pn);
 // pagar tanaman pendek keliling (gerbang terbuka di depan)
 for(const [x,z,w,d] of [[0,-8.35,19,.4],[-9.35,0,.4,17],[9.35,0,.4,17],[-5.6,8.35,7.8,.4],[5.6,8.35,7.8,.4]])g.ad(box(w,.7,d,0x3f9a4a,.15),x,.7,z);
 g.userData.zona=[];return fin(g)}
// Arena Pelari Kalcer (Huda 10 Nov 2026: "Pelari kalcer buatkan tempat sendiri jangan di stadion"). Berdiri di Dusun Kotak Kulon.
// Lintasan lari oval (2 lajur) + gapura START/FINISH, gerbang depan "PELARI KALCER", tribun belakang, meja water station, podium juara.
// Warna gapura sama dengan gapura CFD lama (oranye-navy) supaya warga langsung kenal. Warga di dalam arena dapat tombol 🏃 Ikut Lari.
export function arenaLari(){const g=G();const RUMPUT=0x6fbf5a,RUMPUT2=0x5fae4c,TRACK=0xb5532e,L=0xffffff,O=0xe0803a,N=0x2c3150;lantai(g,19,17,RUMPUT);
 const datar=(geo,c,y)=>{const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:c,roughness:.85}));m.rotation.x=-Math.PI/2;m.receiveShadow=true;g.ad(m,0,y,0);m.rotation.x=-Math.PI/2;return m};
 const XS=3.6,RI=3.1,RO=5.3,RM=4.2;
 // lapangan dalam (rumput bergaris) + lintasan oval: dua lurus + dua setengah lingkaran
 for(let i=0;i<5;i++)g.ad(box(1.44,.04,6.2,i%2?RUMPUT:RUMPUT2,.01),-2.88+i*1.44,.37,0);
 [-1,1].forEach(s=>{g.ad(box(XS*2,.05,RO-RI,TRACK,.01),0,.38,s*RM);
  const r=datar(new THREE.RingGeometry(RI,RO,28,1,s>0?-Math.PI/2:Math.PI/2,Math.PI),TRACK,.385);r.position.x=s*XS;
  const ln=datar(new THREE.RingGeometry(RM-.04,RM+.04,28,1,s>0?-Math.PI/2:Math.PI/2,Math.PI),L,.41);ln.position.x=s*XS;
  [RI+.06,RO-.06].forEach(rr=>{const e=datar(new THREE.RingGeometry(rr-.05,rr+.05,28,1,s>0?-Math.PI/2:Math.PI/2,Math.PI),L,.41);e.position.x=s*XS});
  [RI+.06,RM,RO-.06].forEach(zz=>g.ad(box(XS*2,.03,.09,L,.005),0,.41,s*zz))});
 // garis START/FINISH kotak-kotak di lintasan depan
 for(let a=0;a<2;a++)for(let b=0;b<6;b++)g.ad(box(.3,.03,.36,(a+b)%2?0x1b1c21:L,.005),-.15+a*.3,.42,RI+.2+b*.36);
 // gapura START/FINISH melintang di lintasan depan
 [RI-.35,RO+.35].forEach(z=>{g.ad(box(.4,3.4,.4,N,.03),0,2.05,z);g.ad(box(.55,.3,.55,O,.03),0,.5,z)});
 g.ad(box(.35,.9,RO-RI+1.1,N,.04),0,3.55,RM);
 [1,-1].forEach(s=>{const p=papanTeks(2.9,.62,'START · FINISH',s>0?'#e0803a':'#2c3150','#ffffff');p.rotation.y=s*Math.PI/2;p.position.set(s*.19,3.55,RM);g.add(p)});
 // jam race di atas gapura start
 g.ad(box(.3,.5,1.4,0x1b1c21,.04),0,4.25,RM);[1,-1].forEach(s=>{const j=papanTeks(1.2,.36,'00:00','#1b1c21','#ffd23a');j.rotation.y=s*Math.PI/2;j.position.set(s*.16,4.25,RM);g.add(j)});
 // kerucut pembatas di tikungan
 [[-XS-RM,0],[XS+RM,0],[-XS-2.97,2.97],[XS+2.97,2.97],[-XS-2.97,-2.97],[XS+2.97,-2.97]].forEach(([x,z])=>{const k=new THREE.Mesh(new THREE.ConeGeometry(.2,.55,10),new THREE.MeshStandardMaterial({color:O,roughness:.7}));k.castShadow=true;g.ad(k,x,.65,z);g.ad(box(.42,.06,.42,L,.01),x,.4,z)});
 // podium juara 1-2-3 di tengah lapangan
 [[0,.9,0xf2c14a],[-1.1,.6,0xc8ccd2],[1.1,.4,0xc8875a]].forEach(([x,h,c])=>g.ad(box(1.05,h,1,c,.05),x,.35+h/2,-.6));
 [['1',0,.9],['2',-1.1,.6],['3',1.1,.4]].forEach(([t,x,h])=>{const p=papanTeks(.6,.4,t,'#2c3150','#ffffff');p.position.set(x,.35+h/2,-.09);g.add(p)});
 // tribun bertingkat di belakang lintasan
 for(let k=0;k<3;k++){g.ad(box(13,.5,.8,0xcfcac0,.03),0,.6+k*.5,-6.2-k*.8);for(let x=-5.7;x<=5.7;x+=1.27)g.ad(box(.9,.22,.5,[O,N,0xf4f1e8][(k+Math.round((x+5.7)/1.27))%3],.05),x,.97+k*.5,-6.2-k*.8)}
 const pb=papanTeks(6,.8,'PELARI KALCER · 1 KM','#2c3150','#ffffff');pb.position.set(0,2.95,-7.6);g.add(pb);g.ad(box(6.2,.95,.2,N,.04),0,2.95,-7.75);
 // water station (meja + gelas) di tepi lintasan depan kiri
 meja(g,-7.2,6.8,2.2,.8,0xf4f1e8,.55);for(let i=0;i<6;i++)perabot(g,box(.16,.22,.16,i%2?0x3a8ad8:0x8fd0ec,.03),-7.95+i*.3,1.03,6.8);
 const ws=papanTeks(2,.4,'WATER STATION','#3a8ad8','#ffffff');ws.position.set(-7.2,1.55,7.25);g.add(ws);
 // lampu sorot di 4 sudut
 [[-8.6,-7.9],[8.6,-7.9],[-8.6,7.9],[8.6,7.9]].forEach(([x,z])=>{g.ad(box(.26,6.5,.26,0x777777,.02),x,3.6,z);g.ad(box(1.3,.7,.35,0xfff6c8,.05),x,7,z)});
 // gerbang depan "PELARI KALCER" (menghadap jalan) + pagar tanaman keliling, gerbang terbuka di depan
 [-2.3,2.3].forEach(x=>{g.ad(box(.5,4.4,.5,N,.04),x,2.55,8.3);g.ad(box(.65,.3,.65,O,.03),x,.5,8.3)});g.ad(box(5.3,1.1,.5,O,.04),0,4.6,8.3);
 const pn=papanTeks(4.7,.9,'PELARI KALCER','#e0803a','#ffffff');pn.position.set(0,4.6,8.56);g.add(pn);
 const sub=papanTeks(4.2,.45,'ARENA LARI · START DI SINI','#2c3150','#ffffff');sub.position.set(0,3.8,8.56);g.add(sub);g.ad(box(4.4,.55,.3,N,.03),0,3.8,8.38);
 for(const [x,z,w,d] of [[0,-8.35,19,.4],[-9.35,0,.4,17],[9.35,0,.4,17],[-5.95,8.35,7.1,.4],[5.95,8.35,7.1,.4]])g.ad(box(w,.7,d,0x3f9a4a,.15),x,.7,z);
 [[-8.5,-3.5,.8],[8.5,-3.5,.8],[8.4,4.4,.75]].forEach(([x,z,s])=>pohonT(g,x,z,s,0x3a8a5a));
 g.userData.zona=[];return fin(g)}
// Sirkuit Reli Kotak (Huda 10 Nov 2026: game mobil reli versi Dunia Kotak). Berdiri di depan kaki gunung Dusun Kotak Curug, dekat
// jalan kaki gunung. Pintu masuk ke game reli terpisah (/duniakotak/reli/): gerbang START, lintasan tanah mini, mobil reli kotak
// (hatchback 80-an + sayap belakang, original), paddock beratap oranye, tumpukan ban, jerami, rambu panah kuning, bendera finish.
// Warga yang masuk area sirkuit dapat tombol 🏁 Reli.
export function sirkuitReli(){const g=G();const RUMPUT=0x6fbf5a,TANAH=0xc9a77a,ALUR=0xa88660,O=0xe0803a,N=0x2c3150,M=0xb8252c,H=0x1d1e24;lantai(g,19,17,RUMPUT);
 const datar=(geo,c,y)=>{const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:c,roughness:.95}));m.rotation.x=-Math.PI/2;m.receiveShadow=true;g.ad(m,0,y,0);m.rotation.x=-Math.PI/2;return m};
 // lintasan tanah mini berbentuk oval + dua alur ban
 const XS=3.4,RI=2.6,RO=5.6;[-1,1].forEach(s=>{g.ad(box(XS*2,.05,RO-RI,TANAH,.01),0,.38,s*(RI+RO)/2);
  const r=datar(new THREE.RingGeometry(RI,RO,28,1,s>0?-Math.PI/2:Math.PI/2,Math.PI),TANAH,.385);r.position.x=s*XS;
  [3.5,4.7].forEach(rr=>{const a=datar(new THREE.RingGeometry(rr-.12,rr+.12,28,1,s>0?-Math.PI/2:Math.PI/2,Math.PI),ALUR,.39);a.position.x=s*XS;g.ad(box(XS*2,.02,.24,ALUR,.005),0,.4,s*rr)})});
 // garis start kotak-kotak di lintasan depan
 for(let a=0;a<2;a++)for(let b=0;b<9;b++)g.ad(box(.3,.03,.33,(a+b)%2?0x1b1c21:0xffffff,.005),-.15+a*.3,.41,RI+.1+b*.33);
 // gapura START melintang di lintasan depan
 [RI-.3,RO+.3].forEach(z=>{g.ad(box(.4,3.4,.4,N,.03),0,2.05,z);g.ad(box(.55,.3,.55,O,.03),0,.5,z)});g.ad(box(.35,.9,RO-RI+1,N,.04),0,3.55,(RI+RO)/2);
 [1,-1].forEach(s=>{const p=papanTeks(3.1,.62,'START · RELI',s>0?'#e0803a':'#2c3150','#ffffff');p.rotation.y=s*Math.PI/2;p.position.set(s*.19,3.55,(RI+RO)/2);g.add(p)});
 // mobil reli kotak di garis start (hatchback merah, bumper hitam, sayap belakang, lampu reli)
 const mb=new THREE.Group();mb.add(box(1.8,.56,3.9,M,.08));mb.children[0].position.y=.74;
 const tb=(w,h,d,c,x,y,z,r=.04)=>{const o=box(w,h,d,c,r);o.position.set(x,y,z);mb.add(o);return o};
 tb(1.56,.52,2.05,M,0,1.28,-.62);tb(1.5,.08,1.7,M,0,1.57,-.55);tb(1.6,.36,.12,0x23324a,0,1.3,.46,.02);tb(1.6,.36,.12,0x23324a,0,1.3,-1.68,.02);[-1,1].forEach(s=>tb(.08,.32,1.7,0x23324a,s*.79,1.33,-.5,.02));
 tb(1.86,.24,.22,H,0,.5,2.0);tb(1.86,.24,.22,H,0,.5,-2.0);[-.6,.6].forEach(x=>tb(.08,.26,.12,H,x,1.17,-1.82,.02));tb(1.9,.07,.42,M,0,1.32,-1.86,.02);
 [-1,1].forEach(s=>{tb(.42,.16,.06,0xff3a2a,s*.6,.86,-1.98,.02);tb(.42,.16,.06,0xfff2c0,s*.6,.86,1.98,.02)});[-.5,-.17,.17,.5].forEach(x=>tb(.2,.2,.08,0xfff6c0,x,.62,2.12,.04));
 for(const [x,z] of [[-.92,1.25],[.92,1.25],[-.92,-1.25],[.92,-1.25]]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.34,14),new THREE.MeshStandardMaterial({color:0x1b1c21,roughness:.9}));w.rotation.z=Math.PI/2;w.position.set(x,.4,z);mb.add(w);tb(.16,.3,1.05,M,x,.9,z)}
 const pl=papanTeks(.62,.16,'DK RELI','#f4f4f0','#1b1c21');pl.rotation.y=Math.PI;pl.position.set(0,.55,-2.12);mb.add(pl);
 const st=papanTeks(1.48,.13,'WILLOAPPAREL.COM','#f2c14a','#1d1e24');st.position.set(0,1.5,.53);st.rotation.x=-.3;mb.add(st);
 mb.position.set(-1.6,.35,(RI+RO)/2+.1);mb.rotation.y=Math.PI/2;mb.scale.setScalar(.95);g.add(mb);
 // paddock beratap oranye di belakang + papan nama
 [[-7.6,-6.6],[-2.6,-6.6],[-7.6,-3.6],[-2.6,-3.6]].forEach(([x,z])=>g.ad(box(.2,2.8,.2,0xdddddd,.02),x,1.75,z));g.ad(box(5.6,.35,3.8,O,.05),-5.1,3.25,-5.1);g.ad(box(5.7,.55,.12,N,.02),-5.1,2.85,-3.2);
 const pd=papanTeks(5.2,.5,'PADDOCK RELI','#2c3150','#f2c14a');pd.position.set(-5.1,2.85,-3.13);g.add(pd);
 meja(g,-5.1,-5.6,2.4,.8,0xf4f1e8,.55);[[-6.2,-5.6],[-4,-5.6]].forEach(([x,z])=>perabot(g,box(.5,.5,.5,0xe0503a,.05),x,1.15,z));
 // papan nama besar di belakang lintasan
 g.ad(box(6.6,1.05,.2,N,.04),3.6,3.1,-7.75);[-1,1].forEach(s=>g.ad(box(.25,2.7,.25,N,.02),3.6+s*3,1.7,-7.7));
 const pn=papanTeks(6.3,.85,'SIRKUIT RELI KOTAK','#e0803a','#ffffff');pn.position.set(3.6,3.1,-7.64);g.add(pn);
 // tumpukan ban hitam & jerami di tikungan
 for(const [x,z] of [[-XS-RO-.7,0],[XS+RO+.7,0],[-XS-4.2,4.8],[XS+4.2,4.8],[-XS-4.2,-4.8],[XS+4.2,-4.8]]){for(let k=0;k<3;k++){const b=new THREE.Mesh(new THREE.TorusGeometry(.32,.16,6,12),new THREE.MeshStandardMaterial({color:0x1b1c21,roughness:.9}));b.rotation.x=Math.PI/2;g.ad(b,x,.5+k*.3,z)}}
 [[-1.5,-1.2],[0,-1.2],[1.5,-1.2]].forEach(([x,z])=>{const j=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,1.2,10),new THREE.MeshStandardMaterial({color:0xe8c66a,roughness:.9}));j.rotation.z=Math.PI/2;g.ad(j,x,.9,z)});
 // rambu panah kuning di sisi luar tikungan
 [[XS+RO+.4,-2.4,-1],[-XS-RO-.4,-2.4,1]].forEach(([x,z,s])=>{g.ad(box(.1,1.3,.1,0x555555,.02),x,1,z);const r=papanTeks(1.1,.8,s>0?'<<':'>>','#f2c230','#1b1c21');r.position.set(x,1.85,z+.06);g.add(r)});
 // bendera finish kotak-kotak
 g.ad(box(.12,4,.12,0xdddddd,.02),7.8,2.35,6.5);{const c=document.createElement('canvas');c.width=128;c.height=96;const x=c.getContext('2d');for(let i=0;i<8;i++)for(let j=0;j<6;j++){x.fillStyle=(i+j)%2?'#1b1c21':'#fff';x.fillRect(i*16,j*16,16,16)}
  const t=new THREE.CanvasTexture(c);const f=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.2),new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide}));g.ad(f,8.6,3.7,6.5)}
 // gerbang depan "RELI KOTAK" menghadap jalan + pagar tanaman, gerbang terbuka di depan
 [-2.3,2.3].forEach(x=>{g.ad(box(.5,4.4,.5,N,.04),x,2.55,8.3);g.ad(box(.65,.3,.65,O,.03),x,.5,8.3)});g.ad(box(5.3,1.1,.5,O,.04),0,4.6,8.3);
 const gp=papanTeks(4.7,.9,'RELI KOTAK','#e0803a','#ffffff');gp.position.set(0,4.6,8.56);g.add(gp);
 const sb=papanTeks(4.2,.45,'SIRKUIT · BALAP MOBIL','#2c3150','#ffffff');sb.position.set(0,3.8,8.56);g.add(sb);g.ad(box(4.4,.55,.3,N,.03),0,3.8,8.38);
 for(const [x,z,w,d] of [[0,-8.35,19,.4],[-9.35,0,.4,17],[9.35,0,.4,17],[-5.95,8.35,7.1,.4],[5.95,8.35,7.1,.4]])g.ad(box(w,.7,d,0x3f9a4a,.15),x,.7,z);
 [[-8.5,-7.5,.8],[8.4,-3,.75]].forEach(([x,z,s])=>pohonT(g,x,z,s,0x2f6a3a));
 g.userData.zona=[];return fin(g)}
// ---- Lahan proyek pembangunan (selama 7 hari setelah voting ditutup): pagar seng, fondasi, perancah, bahan, molen, papan proyek ----
// tahap (Huda 6 Nov 2026): 0 fondasi, 1 pasang bata (seperempat), 2 setengah jadi. jadi = fungsi aset bangunan jadi (untuk tahap 1-2
// bagian bawah bangunan aslinya ikut tampil, terpotong setinggi tahapnya, supaya bentuk akhirnya mulai kelihatan).
export function proyek(judul='PEMBANGUNAN FASUM',tahap=0,jadi=null){const g=G();lantai(g,19,17,0xb89c78);
 // pagar seng keliling (pintu masuk depan terbuka)
 const SENG=[0x2f6fb8,0xd8d8d0];let k=0;
 for(let x=-9;x<=9.01;x+=2){if(Math.abs(x)>2)g.ad(box(1.9,2.2,.1,SENG[k++%2],.01),x,1.45,8.3);g.ad(box(1.9,2.2,.1,SENG[k++%2],.01),x,1.45,-8.3)}
 for(let z=-7.3;z<=7.31;z+=2){g.ad(box(.1,2.2,1.9,SENG[k++%2],.01),-9.3,1.45,z);g.ad(box(.1,2.2,1.9,SENG[k++%2],.01),9.3,1.45,z)}
 // tahap 0: galian + fondasi + patok & benang ukur; tiang beton mulai berdiri
 if(tahap===0){g.ad(box(11,.5,8,0xa8a8a0,.03),0,.6,-2.4);for(const x of [-5,-1.7,1.7,5])for(const z of [-6,1.2])g.ad(box(.45,1.2,.45,0x9a9a92,.02),x,1.45,z-.2);
  for(const [x,z] of [[-8,-7.4],[8,-7.4],[-8,6.8],[8,6.8]])g.ad(box(.12,1,.12,0xc8a050,.01),x,.85,z);g.ad(box(16,.03,.03,0xffffff,0),0,1.25,-7.4);g.ad(box(16,.03,.03,0xffffff,0),0,1.25,6.8);g.ad(box(.03,.03,14.2,0xffffff,0),-8,1.25,-.3);g.ad(box(.03,.03,14.2,0xffffff,0),8,1.25,-.3);}
 // tahap 1-2: bagian bawah bangunan asli (dipotong setinggi tahap) + dinding bata keliling yang sedang dipasang
 if(tahap>=1&&jadi){const j=jadi(),batas=tahap===1?.9:1.6;j.updateMatrixWorld(true);const bb=new THREE.Box3(),hapus=[];
  j.traverse(o=>{if(!o.isMesh)return;bb.setFromObject(o);if(bb.min.y>batas||(tahap===1&&bb.max.y>batas+.6))hapus.push(o)});hapus.forEach(o=>o.parent&&o.parent.remove(o));
  j.traverse(o=>{if(o.isMesh&&tahap===1&&o.material&&o.material.color){o.material=o.material.clone();o.material.color.lerp(new THREE.Color(0xa89c88),.35)}});g.add(j);}
 if(tahap===1){const BATA=0xb84a32;for(let x=-8;x<=8.01;x+=1.6)for(let l=0;l<2;l++)if(Math.abs(x)>1.5)g.ad(box(1.5,.32,.4,BATA,.02),x+(l%2)*.4,.55+l*.34,7.4);}
 // perancah bambu/besi + papan pijakan (mulai tahap bata)
 const T=0xc8a050;if(tahap>=1){for(const x of [-5.6,-2,2,5.6])for(const z of [1.8,2.8])g.ad(box(.1,5,.1,T,.01),x,2.85,z);
 for(const y of [1.8,3.4,5])g.ad(box(11.4,.08,.08,T,.01),0,y,1.8),g.ad(box(11.4,.08,.08,T,.01),0,y,2.8),g.ad(box(11.2,.1,1,0x8a6a40,.02),0,y+.08,2.3);}
 // tumpukan bata, kayu, pasir, semen, molen, gerobak
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)for(let l=0;l<2;l++)g.ad(box(.55,.3,.3,0xb84a32,.02),-7.4+i*.6,.55+l*.32,4.4+j*.34);
 for(let l=0;l<4;l++)g.ad(box(3,.2,.25,0xc89060,.02),-3.6,.45+l*.21,5.4-l*.02);
 const ps=new THREE.Mesh(new THREE.ConeGeometry(1.6,1.4,10),new THREE.MeshStandardMaterial({color:0xd8b880,roughness:1}));ps.castShadow=true;g.ad(ps,1.2,1.05,5);
 for(let l=0;l<2;l++)for(let i=0;i<3;i++)g.ad(box(.6,.25,.4,0xe8e4d8,.04),4+i*.65,.48+l*.26,5.6);
 const mo=new THREE.Mesh(new THREE.CylinderGeometry(.6,.9,1.3,12),new THREE.MeshStandardMaterial({color:0xf08a20,roughness:.6}));mo.rotation.z=.6;mo.castShadow=true;g.ad(mo,7,1.6,4.2);g.ad(box(1.4,.8,.9,0x555555,.03),7.2,.75,4.2);
 g.ad(box(.9,.4,.6,0x3a6ab8,.04),-6.4,.75,1.6);g.ad(box(.08,.08,1,0x333333,.01),-6.4,.7,2.3);
 // papan proyek di depan gerbang
 [-2.4,2.4].forEach(x=>g.ad(box(.25,3.6,.25,0x6a4a2a,.02),x,2.15,9.1));
 const pn=papanTeks(5,1.1,judul,'#ffd23a','#1d1d22');pn.position.set(0,3.2,9.25);g.add(pn);
 g.userData.zona=[];return fin(g)}
// ==== FASUM TERSEBAR (Huda 9 Nov 2026): fasum khas tiap dusun, calon voting putaran 2026-11 ====
// Kafe Bukit (Kotak Kulon): kafe satu lantai berdinding kaca, meja bar & mesin kopi di dalam, teras payung menghadap jalan.
export function kafe(){const g=G();const W=0xf6ead6,C=0x6a3f22,H=0x2f7a5a,K=0x8fd0ec;lantai(g,19,17,0xd9c6a4);
 ruang(g,{x:0,z:-4.4,w:14,d:7,h:4.2,c:W,bukaan:[{s:'d',p:-2.5,w:2.4,h:2.6}],lantaiC:0xc89a6a});
 g.ad(box(14.6,.45,7.6,C,.05),0,4.8,-4.4);g.ad(box(15.2,.25,8.2,0xe8dcc4,.05),0,5.15,-4.4);
 // jendela kaca besar depan + kusen
 for(let i=0;i<4;i++){const x=-.3+i*1.95;g.ad(box(1.75,2.3,.12,K,.02),x,1.95,-.95)}for(let i=0;i<5;i++)g.ad(box(.16,2.6,.2,C,.02),-1.27+i*1.95,1.85,-.92);
 // tenda bergaris di atas teras
 for(let i=0;i<10;i++){const a=box(1.4,.14,2.4,i%2?0xffffff:H,.02);a.rotation.x=.32;g.ad(a,-6.3+i*1.4,4.05,.25)}
 // papan nama + cangkir besar di atap
 g.ad(box(7.4,1.4,.3,C,.06),0,6.1,-1.2);const pn=papanTeks(7,1.1,'KAFE BUKIT','#6a3f22','#ffe9c4');pn.position.set(0,6.1,-1.03);g.add(pn);
 const cg=new THREE.Mesh(new THREE.CylinderGeometry(.9,.75,1.4,16),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5}));cg.castShadow=true;g.ad(cg,5.6,6.1,-5);
 const ks=new THREE.Mesh(new THREE.CylinderGeometry(.82,.82,.06,16),new THREE.MeshStandardMaterial({color:0x4a2a14,roughness:.6}));g.ad(ks,5.6,6.78,-5);
 const tg=new THREE.Mesh(new THREE.TorusGeometry(.42,.13,6,14),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5}));g.ad(tg,6.55,6.15,-5);
 // isi: meja bar + mesin kopi + rak cangkir, meja bundar & kursi
 perabot(g,box(5.2,1,.7,C,.04),2.6,.85,-6.6).userData.dinding=true;perabot(g,box(5.4,.08,.9,0xe8dcc4,.02),2.6,1.39,-6.6);
 perabot(g,box(.9,.8,.6,0x9a9a9a,.05),1.2,1.83,-6.8);perabot(g,box(.5,.3,.4,0x333333,.03),3.2,1.6,-6.7);
 rak(g,2.6,-7.65,4,.3,1.2,[0xffffff,0xd8402a,0x3a8ad8,0xf2c14a]);
 [[-5,-6],[-5,-3.4],[-2.4,-6.2],[-2.4,-3.6]].forEach(([x,z])=>{perabot(g,new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.06,14),new THREE.MeshStandardMaterial({color:0xffffff})),x,1.05,z);perabot(g,box(.1,.6,.1,0x333333,.01),x,.68,z);[-1,1].forEach(s=>kursi(g,x+s*.85,z,H))});
 lampuGantung(g,-3.7,4.2,-4.8);lampuGantung(g,2.6,4.2,-5.6);
 // teras: meja payung
 [-5.5,-1.5,2.5,6.5].forEach((x,i)=>{meja(g,x,3.8,1.3,1.1,0xffffff,.45);[-1,1].forEach(s=>kursi(g,x+s*.95,3.8,[H,0xd8402a][i%2]));g.ad(box(.1,2.4,.1,0xdddddd,.01),x,1.9,3.8);
  const p=new THREE.Mesh(new THREE.ConeGeometry(1.5,.7,8),new THREE.MeshStandardMaterial({color:[0xd8402a,H,0xf2c14a,0xffffff][i],roughness:.7}));p.castShadow=true;g.ad(p,x,3.3,3.8)});
 // pot tanaman, lampu taman, pohon
 [[-7.4,-.2],[7.4,-.2],[-7.4,6.6],[7.4,6.6]].forEach(([x,z])=>{g.ad(box(.9,.7,.9,0xb06a3a,.1),x,.7,z);g.ad(box(1.1,1,1.1,0x3a8a3a,.35),x,1.5,z)});
 [-4,4].forEach(x=>{g.ad(box(.16,2.6,.16,0x2a2a2a,.02),x,1.65,6.6);g.ad(box(.5,.4,.5,0xfff2c0,.06,{emissive:0xffe08a,emissiveIntensity:.7}),x,3.1,6.6)});
 pagar(g,19,17,C,3);return fin(g)}
// Taman Hiburan (Kotak Tlaga): gerbang, bianglala & komidi putar (berputar; g.userData.putar dianimasikan game), loket, kios, lampu warna.
export function hiburan(){const g=G();const PAV=0xe8d8b8,M=0xe0303a,B=0x3a8ad8,K=0xf2c14a;lantai(g,19,17,PAV);g.userData.zona=[];g.userData.putar=[];
 g.ad(box(17,.05,1.6,0xc8875a,.02),0,.38,4.6);g.ad(box(1.6,.05,9,0xc8875a,.02),0,.38,.5);
 // gerbang depan
 [-3.5,3.5].forEach(x=>{g.ad(box(.6,5,.6,M,.05),x,2.85,7.8);g.ad(box(.9,.5,.9,K,.1),x,5.55,7.8)});g.ad(box(6.6,1.4,.3,0xffffff,.05),0,4.6,7.8);const pn=papanTeks(6.2,1.1,'TAMAN HIBURAN','#e0303a','#ffffff');pn.position.set(0,4.6,7.97);g.add(pn);
 // bianglala (kiri belakang): kaki A + roda berputar dengan 8 kabin
 [-1,1].forEach(s=>{const k=box(.3,8.6,.3,0xdddddd,.02);k.rotation.x=s*.22;g.ad(k,-4.6,4.6,-5.6+s*.95)});g.ad(box(.3,.3,2.4,0xaaaaaa,.02),-4.6,8.7,-5.6);
 const roda=new THREE.Group();roda.position.set(-4.6,8.7,-5.6);g.add(roda);const rr=4.2;
 const cin=new THREE.Mesh(new THREE.TorusGeometry(rr,.12,6,40),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5}));roda.add(cin);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2,j=box(.1,rr*2,.1,0xffffff,.01);j.rotation.z=a;roda.add(j);
  const kb=box(1,1,1,[M,B,K,0x3aa860][i%4],.2);kb.position.set(Math.cos(a)*rr,Math.sin(a)*rr-.6,0);kb.userData.tegak=1;roda.add(kb)}
 g.userData.putar.push({o:roda,ax:'z',v:.25});
 // komidi putar (kanan belakang)
 const km=new THREE.Group();km.position.set(4.6,0,-4.6);g.add(km);
 const cy=(r,h,c,y)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,20),new THREE.MeshStandardMaterial({color:c,roughness:.6}));m.castShadow=m.receiveShadow=true;m.position.y=y;return m};
 km.add(cy(3.3,.4,0xf6f0e2,.55));km.add(cy(.35,3.6,0xffd23a,2.4));
 const at=new THREE.Mesh(new THREE.ConeGeometry(3.6,1.6,12),new THREE.MeshStandardMaterial({color:M,roughness:.6}));at.position.y=4.9;at.castShadow=true;km.add(at);km.add(cy(3.5,.35,0xffffff,4));
 const kuda=new THREE.Group();km.add(kuda);for(let i=0;i<6;i++){const a=i/6*Math.PI*2,x=Math.cos(a)*2.3,z=Math.sin(a)*2.3;const t=box(.08,3.2,.08,0xffd23a,.01);t.position.set(x,2.4,z);kuda.add(t);const h=box(.5,.6,1.1,[0xffffff,B,K][i%3],.15);h.position.set(x,1.5,z);h.rotation.y=-a;kuda.add(h)}
 g.userData.putar.push({o:km,ax:'y',v:.5});
 // loket + kios jajan
 ruang(g,{x:-6.6,z:3,w:3,d:2.4,h:2.6,c:0xffffff,bukaan:[{s:'d',p:0,w:1.2,h:2.1}],zona:false});g.ad(box(3.4,.3,2.8,B,.04),-6.6,3.1,3);const lk=papanTeks(2.6,.6,'LOKET','#3a8ad8','#ffffff');lk.position.set(-6.6,2.55,4.22);g.add(lk);
 [[6.4,3,M],[3.6,3,K]].forEach(([x,z,c])=>{g.ad(box(2.2,1,1.2,0x9a6a3a,.04),x,.85,z);g.ad(box(.1,2.2,.1,0xdddddd,.01),x-1,1.45,z-.5);g.ad(box(.1,2.2,.1,0xdddddd,.01),x+1,1.45,z-.5);const a=box(2.6,.15,1.8,c,.03);a.rotation.x=-.25;g.ad(a,x,2.6,z)});
 // tali lampu warna-warni
 const LW=[0xff5a5a,0xffd23a,0x5ad0ff,0x7aff7a];for(let i=0;i<14;i++){const x=-8+i*1.23;g.ad(box(.22,.22,.22,LW[i%4],.1,{emissive:LW[i%4],emissiveIntensity:.8}),x,4.2-Math.sin(i/13*Math.PI)*.6,6.6)}
 [-8.2,8.2].forEach(x=>g.ad(box(.14,4.4,.14,0x555555,.02),x,2.5,6.6));
 [[-8.3,-1],[8.3,-1]].forEach(([x,z])=>{g.ad(box(.6,2.4,.6,0x6a4426,.04),x,1.55,z);g.ad(box(2.4,2.2,2.4,0x3a8a5a,.3),x,3.6,z)});
 g.userData.putar.forEach(p=>p.o.traverse(o=>{o.userData.jangan=true}));
 pagar(g,19,17,K,3);return fin(g)}
// Kantor Polisi (Kotak Curug): gedung 2 lantai biru-putih, lampu sirene di atap, meja pelayanan di dalam, mobil patroli & tiang bendera.
export function polisi(){const g=G();const W=0xf4f6f8,B=0x1f3f8a,B2=0x2f5fba,K=0x8fd0ec;lantai(g,19,17,0xc8ccd2);
 ruang(g,{x:-1,z:-4.4,w:13,d:7,h:7,c:W,bukaan:[{s:'d',p:0,w:2.6,h:2.6}],lantaiC:0xdfe4ea});
 g.ad(box(13.6,.5,7.6,0xdde2ea,.05),-1,7.3,-4.4);g.ad(box(13.1,.6,.3,B,.02),-1,3.6,-.86);g.ad(box(13.1,.6,.3,B,.02),-1,6.9,-.86);
 for(let f=0;f<2;f++)for(let i=0;i<5;i++){const x=-6.2+i*2.6;if(f===0&&Math.abs(x+1)<1.6)continue;g.ad(box(1.6,1.6,.12,K,.02),x,1.95+f*3.2,-.95)}
 // serambi + papan nama
 g.ad(box(5.2,.3,2.6,B,.04),-1,3.3,.4);[-3.2,1.2].forEach(x=>g.ad(box(.3,2.8,.3,0xffffff,.02),x,1.8,1.5));
 const pn=papanTeks(6.6,1,'KANTOR POLISI','#1f3f8a','#ffffff');pn.position.set(-1,5.35,-.7);g.add(pn);
 // lambang & sirene di atap
 g.ad(box(1.4,1.4,.3,0xf2c14a,.3),-6,5.35,-.75);g.ad(box(.8,.8,.32,B,.2),-6,5.35,-.72);
 g.ad(box(2.4,.4,1,0x333333,.05),-1,7.75,-4);g.ad(box(1,.5,.8,0xff2a2a,.15,{emissive:0xff2a2a,emissiveIntensity:.8}),-1.6,8.2,-4);g.ad(box(1,.5,.8,0x2a6aff,.15,{emissive:0x2a6aff,emissiveIntensity:.8}),-.4,8.2,-4);
 // isi: meja pelayanan, kursi tunggu, lemari arsip
 perabot(g,box(5,1,.7,B2,.04),-1,.85,-5.4).userData.dinding=true;perabot(g,box(5.2,.08,.9,0xffffff,.02),-1,1.39,-5.4);[-2.6,-1,.6].forEach(x=>{perabot(g,box(.5,.35,.08,0x222222,.02),x,1.62,-5.6);kursi(g,x,-6.4,B)});
 for(let i=0;i<4;i++)kursi(g,-6.2+i*.8,-2,0x8a8a8a);rak(g,4.2,-7.5,2.6,.5,1.8,[0x8a8a8a,0x6a6a6a,0xb8b8b8]);
 // mobil patroli (kanan depan)
 [[6.6,2.6],[6.6,6]].forEach(([x,z])=>{g.ad(box(2,.8,3.2,0xffffff,.25),x,.95,z);g.ad(box(2.02,.3,3.22,B,.05),x,1.05,z);g.ad(box(1.6,.6,1.6,0xbfe2f2,.2),x,1.6,z-.2);g.ad(box(.9,.22,.3,0xff2a2a,.05,{emissive:0xff2a2a,emissiveIntensity:.6}),x-.25,2.02,z-.2);g.ad(box(.9,.22,.3,0x2a6aff,.05,{emissive:0x2a6aff,emissiveIntensity:.6}),x+.25,2.02,z-.2);
  [[-.9,-1],[.9,-1],[-.9,1],[.9,1]].forEach(([a,b])=>g.ad(box(.22,.55,.55,0x222222,.1),x+a,.65,z+b))});
 // tiang bendera, taman kecil, lampu
 g.ad(box(.18,7.5,.18,0xdddddd,.02),-7,4.1,4.4);g.ad(box(1.8,.6,.06,0xd8202a,.01),-6.05,7.4,4.4);g.ad(box(1.8,.6,.06,0xffffff,.01),-6.05,6.8,4.4);
 g.ad(box(6,.3,2.4,0x7cc46a,.05),-2.4,.5,5.2);[[-8.3,-1],[8.3,-1.4]].forEach(([x,z])=>{g.ad(box(.6,2.4,.6,0x6a4426,.04),x,1.55,z);g.ad(box(2.4,2.2,2.4,0x3a8a5a,.3),x,3.6,z)});
 [-4.5,2].forEach(x=>{g.ad(box(.2,3.6,.2,0x555555,.02),x,2.2,3.2);g.ad(box(.8,.3,.5,0xfff2c0,.05),x,4.1,3.2)});
 pagar(g,19,17,B,3);return fin(g)}
// Toko Willo Apparel (Huda 10 Nov 2026): toko kaos ASLI di lahan fasum setengah blok Kotak Wetan (fas[9], 21×9 petak).
// Warga masuk lewat pintu kaca depan (+z), di dalam ada rak kaos gantung, rak lipat, manekin, cermin, meja kasir & meja sablon.
function sablonTeks(w,h,baris,bg,fg){const c=document.createElement('canvas');c.width=256;c.height=Math.round(256*h/w);const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';
 baris.forEach(([t,u,y])=>{x.font='900 '+u+'px Montserrat, sans-serif';while(x.measureText(t).width>c.width*.9&&u>8){u-=2;x.font='900 '+u+'px Montserrat, sans-serif'}x.fillText(t,c.width/2,c.height*y)});const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tx,roughness:.8}))}
// kaos (badan + 2 lengan) menghadap +z; cetak = tulisan WILLO di dada
function kaos(g,x,y,z,col,sk=1,cetak=false,ry=0){const k=new THREE.Group();k.position.set(x,y,z);k.rotation.y=ry;k.scale.setScalar(sk);
 const b=box(.62,.78,.08,col,.02);k.add(b);[-1,1].forEach(s=>{const l=box(.26,.24,.08,col,.02);l.position.set(s*.4,.24,0);l.rotation.z=s*-.5;k.add(l)});
 if(cetak){const t=sablonTeks(.42,.2,[['WILLO',150,.55]],'rgba(0,0,0,0)',col===0xf4f4f0||col===0xf2c14e?'#1d1d22':'#ffffff');t.material.transparent=true;t.position.set(0,.12,.045);k.add(t)}
 k.traverse(o=>{if(o.isMesh){o.userData.bukanPijakan=true;o.userData.perabot=true}});g.add(k);return k}
export function tokoWillo(){const g=G();const W=0xf6f6f2,H=0x1d1d22,BIRU=0x2f5bff,K=0x9fd2ee;const WARNA=[0x1d1d22,0xf4f4f0,0x2f5bff,0xd0442f,0x2a9a5a,0xf2c14e,0x2f3a52,0x8a8a90];
 lantai(g,20,8.6,0xd6d2ca);
 ruang(g,{x:0,z:-1.2,w:16,d:5.8,h:4.2,c:W,bukaan:[{s:'d',p:0,w:2.6,h:2.7}],lantaiC:0xd9b98c});
 // atap datar hitam + list biru, kaca etalase kiri-kanan pintu, kusen hitam
 g.ad(box(16.6,.4,6.4,H,.04),0,4.75,-1.2);g.ad(box(16.7,.16,6.5,BIRU,.03),0,4.5,-1.2);
 for(const s of [-1,1]){g.ad(box(5.2,2.3,.12,K,.02),s*4.6,1.85,1.76);g.ad(box(5.5,.16,.2,H,.02),s*4.6,.78,1.8);g.ad(box(5.5,.16,.2,H,.02),s*4.6,3.06,1.8);g.ad(box(.16,2.4,.2,H,.02),s*1.95,1.9,1.8);g.ad(box(.16,2.4,.2,H,.02),s*7.25,1.9,1.8)}
 // kaos pajangan di balik etalase, menghadap ke dalam toko
 [-6.4,-5.3,-4.2,-3.1].forEach((x,i)=>kaos(g,x,1.9,1.2,WARNA[i],1,i%2===0,Math.PI));[3.1,4.2,5.3,6.4].forEach((x,i)=>kaos(g,x,1.9,1.2,WARNA[i+4],1,i%2===1,Math.PI));
 // tenda garis hitam-putih di atas etalase + papan nama besar WILLO APPAREL
 for(let i=0;i<12;i++){const a=box(1.3,.12,1.3,i%2?0xffffff:H,.02);a.rotation.x=.35;g.ad(a,-7.15+i*1.3,3.5,2.25)}
 g.ad(box(11,1.5,.3,H,.05),0,5.75,1.35);const pn=sablonTeks(10.4,1.2,[['WILLO APPAREL',150,.42],['KAOS CUSTOM · SABLON NGAWI',46,.86]],'#1d1d22','#ffffff');pn.position.set(0,5.75,1.51);g.add(pn);
 // kaos raksasa biru di atap (ikon toko, terlihat dari jauh)
 const kr=kaos(g,5.6,6.6,-2.2,BIRU,3.2,true);kr.traverse(o=>{if(o.isMesh){o.userData.perabot=false;o.castShadow=true}});
 // ---- isi toko ----
 // rak gantung kaos di dinding belakang kiri
 perabot(g,box(5.6,.06,.06,0x9a9a9a,.02),-4.6,2.75,-3.55);[-7.2,-2].forEach(x=>perabot(g,box(.08,2.4,.08,0x9a9a9a,.02),x,1.55,-3.55));
 for(let i=0;i<9;i++)kaos(g,-6.95+i*.6,2.25,-3.5,WARNA[i%WARNA.length],.95,false,0);
 // rak kaos lipat di dinding belakang kanan
 rak(g,4.9,-3.72,4.6,.4,1.9,WARNA);
 // meja pajang tengah kiri: tumpukan kaos lipat
 meja(g,-3.6,-.9,2.4,1.2,0xc8a070,.5);for(let i=0;i<4;i++)for(let j=0;j<3;j++)perabot(g,box(.48,.1,.38,WARNA[(i+j*2)%WARNA.length],.02),-4.45+i*.57,.94+j*.11,-.9);
 // meja kasir (tengah belakang) + mesin kasir + papan KASIR
 perabot(g,box(3.2,1,.7,H,.04),0,.85,-2.85).userData.dinding=true;perabot(g,box(3.4,.08,.9,0xffffff,.02),0,1.39,-2.85);
 perabot(g,box(.6,.35,.45,0x3a3a40,.03),.8,1.6,-2.85);perabot(g,box(.5,.3,.05,0x5aa8d8,.01),.8,1.86,-3.05);
 const pk=sablonTeks(1.6,.45,[['KASIR · PESAN DI SINI',34,.55]],'#2f5bff','#ffffff');pk.position.set(0,1.0,-2.49);perabot(g,pk,0,1.0,-2.49);
 // manekin pakai kaos Willo (kanan depan)
 [[3.4,BIRU],[5.2,H],[7,0xf4f4f0]].forEach(([x,c])=>{perabot(g,box(.6,.08,.6,0x9a9a9a,.02),x,.41,-.4);perabot(g,box(.08,1.1,.08,0x9a9a9a,.01),x,.95,-.4);perabot(g,box(.5,.3,.3,0xe8dcc8,.04),x,1.55,-.4);kaos(g,x,2.05,-.4,c,1.05,true);perabot(g,box(.3,.34,.3,0xe8dcc8,.1),x,2.75,-.4)});
 // cermin coba kaos (dinding kanan) + meja sablon (pojok kiri depan)
 perabot(g,box(.1,2.2,1.2,0xc0c0c8,.02),7.6,1.6,-2.4);perabot(g,box(.04,2,1,0xdff0ff,.01),7.53,1.6,-2.4);
 perabot(g,box(1.2,.8,.9,0x3a3a40,.04),-6.6,.75,.5).userData.dinding=true;perabot(g,box(.9,.06,.7,0x2a2a2a,.01),-6.6,1.18,.5);perabot(g,box(1,.08,.8,0xb0b0b8,.01),-6.6,1.32,.5);kaos(g,-6.6,1.24,.5,0xf4f4f0,.9,true).rotation.x=-Math.PI/2;
 [-1,1].forEach(s=>perabot(g,box(.08,.9,.08,0x777777,.01),-6.6+s*.45,1.7,.1));perabot(g,box(1,.08,.08,0x777777,.01),-6.6,2.15,.1);
 lampuGantung(g,-3.6,4.2,-1.2);lampuGantung(g,3.6,4.2,-1.2);lampuGantung(g,0,4.2,-1.6);
 // teras: pot tanaman, bangku tunggu, papan berdiri "PESAN KAOS"
 [[-8.6,2.4],[8.6,2.4]].forEach(([x,z])=>{g.ad(box(.8,.7,.8,H,.1),x,.7,z);g.ad(box(1,1,1,0x3a8a3a,.35),x,1.45,z)});
 bangku(g,-5.5,3.2,2.2,H);
 const ab=sablonTeks(1.1,1.3,[['PESAN',58,.3],['KAOS',58,.55],['SABLON',34,.82]],'#2f5bff','#ffffff');ab.position.set(2.6,1.2,3.1);ab.rotation.x=-.12;g.add(ab);g.ad(box(1.2,1.4,.06,H,.02),2.6,1.2,3.05).rotation.x=-.12;
 pagar(g,20,8.6,H,2);return fin(g)}
// Calon voting putaran berikutnya (Huda 11 Nov 2026: "Ganti stasiun pemadam dan bandara", menggantikan kolam renang & bioskop).
// Stasiun Pemadam Kebakaran: garasi 2 pintu terbuka dengan truk merah di dalam, menara latihan, truk siaga di halaman, hidran.
function trukPemadam(g,x,z,ry=0){const t=new THREE.Group();t.position.set(x,0,z);t.rotation.y=ry;const M=0xd6322a,P=0xf4f1ea;
 const a=(m,px,py,pz)=>{m.position.set(px,py,pz);t.add(m);return m};
 a(box(2.1,1.5,4.4,M,.15),0,1.3,-.2);a(box(2.12,.22,4.42,P,.03),0,1.05,-.2);a(box(2.1,1.2,1.5,M,.15),0,1.75,2.4);a(box(1.7,.6,.1,0xbfe2f2,.05),0,2.05,3.16);
 a(box(.5,.18,4,0xc8ccd2,.03),-.4,2.15,-.4);a(box(.5,.18,4,0xc8ccd2,.03),.4,2.15,-.4);for(let i=0;i<6;i++)a(box(1.1,.06,.08,0xc8ccd2,.01),0,2.25,-2.1+i*.7);
 a(box(.8,.22,.3,0xff2a2a,.05,{emissive:0xff2a2a,emissiveIntensity:.7}),-.45,2.47,2.4);a(box(.8,.22,.3,0x2a6aff,.05,{emissive:0x2a6aff,emissiveIntensity:.7}),.45,2.47,2.4);
 [[-1,-1.6],[1,-1.6],[-1,.4],[1,.4],[-1,2.4],[1,2.4]].forEach(([u,v])=>a(box(.24,.62,.62,0x222222,.1),u,.66,v));g.add(t);return t}
export function damkar(){const g=G();const M=0xd6322a,M2=0xb02822,W=0xf4f1ea;lantai(g,19,17,0xc9c4ba);
 ruang(g,{x:-1.5,z:-3.8,w:14,d:8.4,h:6.4,c:M,bukaan:[{s:'d',p:-4,w:3.4,h:3.8},{s:'d',p:.2,w:3.4,h:3.8},{s:'d',p:4.4,w:1.8,h:2.6}],lantaiC:0xb8b4ac});
 g.ad(box(14.6,.5,9,W,.05),-1.5,7,-3.8);g.ad(box(14.1,.5,.3,W,.02),-1.5,4.55,.48);
 const pn=papanTeks(9,1.1,'PEMADAM KEBAKARAN','#b02822','#ffffff');pn.position.set(-1.5,5.6,.66);g.add(pn);
 [-5.5,-1.3].forEach(x=>g.ad(box(3.6,.3,.5,W,.04),x,4.25,.62));
 // sirene & lambang di atap
 g.ad(box(2.2,.4,1,0x333333,.05),-1.5,7.45,-3.6);g.ad(box(.9,.5,.8,0xff2a2a,.15,{emissive:0xff2a2a,emissiveIntensity:.8}),-2,7.9,-3.6);g.ad(box(.9,.5,.8,0xff8a1a,.15,{emissive:0xff8a1a,emissiveIntensity:.8}),-1,7.9,-3.6);
 // menara latihan (kanan belakang)
 g.ad(box(2.6,10,2.6,M2,.05),7.2,5.35,-5.2);g.ad(box(3,.4,3,W,.05),7.2,10.55,-5.2);for(let k=0;k<4;k++)g.ad(box(1,1,.12,0x2a2a30,.02),7.2,2.6+k*2.1,-3.86);
 // isi garasi: truk, rak helm & seragam
 trukPemadam(g,-5.5,-4.4);rak(g,3.6,-7.4,3,.5,1.8,[0xf2c14a,0xd6322a,0x333333]);[2.6,3.6,4.6].forEach(x=>perabot(g,box(.4,.3,.4,0xf2c14a,.15),x,2.4,-7.4));
 // halaman: truk siaga, hidran, gulungan selang, pohon, lampu
 g.ad(box(19,.04,6.6,0xb0aba2,.01),0,.38,4.6);trukPemadam(g,4.6,4.4,Math.PI/2);
 g.ad(box(.45,.8,.45,0xf2c14a,.1),-8,.75,6.4);g.ad(box(.7,.18,.18,0xf2c14a,.05),-8,.9,6.4);
 g.ad(box(.9,.9,.3,0xd6322a,.15),-6.6,.8,2.2);g.ad(box(.6,.6,.32,0xf4f1ea,.15),-6.6,.8,2.22);
 [[-8.3,-1],[8.6,1.8]].forEach(([x,z])=>{g.ad(box(.6,2.4,.6,0x6a4426,.04),x,1.55,z);g.ad(box(2.4,2.2,2.4,0x3a8a5a,.3),x,3.6,z)});
 [-3.4,1].forEach(x=>{g.ad(box(.2,3.6,.2,0x555555,.02),x,2.2,7.6);g.ad(box(.8,.3,.5,0xfff2c0,.05),x,4.1,7.6)});
 pagar(g,19,17,M,3.5);return fin(g)}
// Bandara Dunia Kotak: terminal kaca + menara kontrol di belakang, apron dengan pesawat baling-baling (tanpa merek), landasan di depan, kantong angin.
function pesawat(g,x,z,ry=0){const t=new THREE.Group();t.position.set(x,0,z);t.rotation.y=ry;const W=0xf6f7f9,B=0x2f6fb8;
 const a=(m,px,py,pz)=>{m.position.set(px,py,pz);t.add(m);return m};
 a(box(5.6,1.15,1.25,W,.4),0,1.55,0);a(box(5.62,.28,1.27,B,.05),0,1.38,0);a(box(1,.8,1,W,.35),3.1,1.5,0);
 for(let i=0;i<6;i++)[-1,1].forEach(s=>a(box(.3,.26,.04,0x2a3440,.05),-1.6+i*.6,1.82,s*.63));a(box(.5,.35,1.1,0x2a3440,.1),2.55,1.95,0);
 a(box(1.5,.14,7.6,W,.05),.3,1.95,0);a(box(1.52,.15,.6,B,.03),.3,1.96,3.5);a(box(1.52,.15,.6,B,.03),.3,1.96,-3.5);
 [-2.2,2.8].forEach(w=>{a(box(1,.6,.6,0xd8dbe0,.2),.6,1.75,w);a(box(.08,1.6,.22,0x333333,.03),1.15,1.75,w)});
 a(box(.9,1.3,.16,B,.05),-2.7,2.65,0);a(box(.8,.1,2.8,W,.03),-2.7,1.9,0);a(box(.12,1.8,.22,0x333333,.03),3.65,1.5,0);
 [[2.6,0],[-.2,-1],[-.2,1]].forEach(([u,v])=>{a(box(.08,.5,.08,0x555555,.01),u,.75,v);a(box(.36,.36,.2,0x222222,.15),u,.55,v)});g.add(t);return t}
export function bandara(){const g=G();const W=0xf2f4f6,B=0x2f6fb8,K=0x8fd0ec,AS=0x4a4e56;lantai(g,19,17,0xcfd2d6);
 ruang(g,{x:-3,z:-5.4,w:12,d:5.6,h:5,c:W,bukaan:[{s:'d',p:0,w:2.8,h:2.8}],lantaiC:0xe6e8ea});
 g.ad(box(12.8,.45,6.4,B,.05),-3,5.57,-5.4);for(let i=0;i<5;i++){const x=-7.6+i*2.3;if(Math.abs(x+3)<1.6)continue;g.ad(box(1.8,1.8,.12,K,.02),x,2.2,-2.62)}
 for(let i=0;i<5;i++)g.ad(box(1.8,1.2,.12,K,.02),-7.6+i*2.3,4.3,-2.62);
 const pn=papanTeks(8,1,'BANDARA DUNIA KOTAK','#2f6fb8','#ffffff');pn.position.set(-3,6.35,-2.62);g.add(pn);
 // isi terminal: konter check-in, kursi tunggu, papan jadwal
 perabot(g,box(3.6,1,.7,B,.04),-6,.85,-6.9).userData.dinding=true;for(let i=0;i<5;i++)kursi(g,-2.6+i*.8,-4.6,0x3a6ab8);perabot(g,box(2.4,1,.1,0x1d1d22,.02,{emissive:0x2a4a2a,emissiveIntensity:.3}),.4,3.4,-8);
 // menara kontrol (kanan belakang)
 g.ad(box(1.6,8,1.6,W,.05),6.6,4.35,-5.6);g.ad(box(3.2,1.6,3.2,K,.1),6.6,9.15,-5.6);g.ad(box(3.6,.3,3.6,AS,.03),6.6,10.1,-5.6);g.ad(box(.1,1.4,.1,0x888888,.01),6.6,10.95,-5.6);
 g.ad(box(.3,.3,.3,0xff2a2a,.1,{emissive:0xff2a2a,emissiveIntensity:.9}),6.6,11.7,-5.6);
 // apron & landasan
 g.ad(box(19,.04,4,0x9aa0a8,.01),0,.38,.4);g.ad(box(19,.05,4.6,AS,.01),0,.39,5.4);
 [3.25,7.55].forEach(z=>g.ad(box(19,.06,.14,0xffffff,.01),0,.42,z));for(let x=-8;x<=8.1;x+=2.7)g.ad(box(1.4,.06,.28,0xffffff,.01),x,.42,5.4);
 for(let i=0;i<5;i++)g.ad(box(.3,.06,1,0xffffff,.01),8.4,.42,3.9+i*.75);
 pesawat(g,-1.5,.6);
 // kantong angin & lampu landasan
 g.ad(box(.12,3.2,.12,0xdddddd,.02),8.4,1.95,-1.6);g.ad(box(1.1,.45,.45,0xff7a1a,.15),8.95,3.3,-1.6);g.ad(box(.3,.46,.46,0xffffff,.1),9.2,3.3,-1.6);
 for(let x=-8.5;x<=8.6;x+=3.4)[3,7.8].forEach(z=>g.ad(box(.18,.18,.18,0xffe08a,.05,{emissive:0xffe08a,emissiveIntensity:.8}),x,.48,z));
 [[-8.4,-1.6]].forEach(([x,z])=>{g.ad(box(.6,2.4,.6,0x6a4426,.04),x,1.55,z);g.ad(box(2.4,2.2,2.4,0x3a8a5a,.3),x,3.6,z)});
 pagar(g,19,17,B,3);return fin(g)}
// Bandara Besar 5 terminal (Huda 11 Nov 2026: "Bandaranya kurang besar" → "Bandara dengan 5 terminal"). Kawasan sendiri ±64×44
// (bukan lahan fasum biasa): gedung utama kaca memanjang, 5 dermaga gerbang T1–T5 dengan garbarata & jet di tiap gerbang,
// landasan pacu penuh lebar di depan dengan 1 jet siap lepas landas, menara kontrol tinggi, area antar-jemput & taksi di belakang.
function jet(g,x,z,ry=0,s=1,warna=0x2f6fb8){const t=new THREE.Group();t.position.set(x,0,z);t.rotation.y=ry;t.scale.setScalar(s);const W=0xf6f7f9,KC=0x26313d,AB=0xc9ced6;
 const a=(m,px,py,pz)=>{m.position.set(px,py,pz);t.add(m);return m};
 a(box(10.4,1.9,1.9,W,.7),0,2.75,0);a(box(10.42,.4,1.92,warna,.1),0,2.0,0);a(box(10.4,.12,1.93,0xf2c14a,.03),0,2.27,0);
 a(box(1.4,1.66,1.74,W,.6),5.6,2.68,0);a(box(.9,1.2,1.3,W,.5),6.5,2.55,0);a(box(.45,.7,.8,W,.3),7.05,2.45,0);
 a(box(.7,.42,1.5,KC,.12),5.75,3.28,0);
 a(box(1.6,1.6,1.6,W,.6),-6,2.95,0);a(box(1.2,1.1,1.1,W,.4),-7.2,3.25,0);a(box(.6,.6,.6,AB,.2),-7.9,3.4,0);
 for(let i=0;i<14;i++)[-1,1].forEach(q=>a(box(.32,.38,.04,KC,.08),-4.4+i*.66,3.08,q*.96));
 [[3.9],[-4.9]].forEach(([u])=>[-1,1].forEach(q=>{a(box(.62,1.2,.05,AB,.05),u,2.6,q*.97)}));
 a(box(2.4,3.2,.24,warna,.08),-6.7,5.2,0);a(box(1.2,.5,.26,0xf2c14a,.05),-7.1,6.55,0);
 a(box(1.5,.16,5,W,.06),-7,3.6,0);[-1,1].forEach(q=>a(box(.6,.17,.5,warna,.03),-7.2,3.61,q*2.3));
 a(box(2.6,.24,13.2,W,.12),-.6,2.05,0);[-1,1].forEach(q=>{a(box(1,.26,.8,warna,.05),-1.1,2.06,q*6.3);a(box(.6,1.1,.14,warna,.05),-1.5,2.65,q*6.65)});
 [-1,1].forEach(q=>{const zz=q*3.2;a(box(2.4,1.25,1.25,0xdfe3e8,.5),.6,1.35,zz);a(box(.08,1.05,1.05,0x1b1f25,.4),1.82,1.35,zz);a(box(.5,.5,.5,0x9aa2ac,.2),-.75,1.35,zz);a(box(.9,.6,.2,AB,.05),.2,1.95,zz)});
 const roda=(u,v)=>{a(box(.12,1.1,.12,0x666a70,.02),u,1.25,v);a(box(.5,.5,.3,0x1e1e1e,.15),u,.6,v)};
 roda(5.4,0);[[-.8,-.9],[-.8,.9]].forEach(([u,v])=>{roda(u,v);roda(u-.6,v)});
 a(box(.16,.16,.16,0xff2a2a,.05,{emissive:0xff2a2a,emissiveIntensity:.9}),-1.1,2.1,-6.7);a(box(.16,.16,.16,0x2aff6a,.05,{emissive:0x2aff6a,emissiveIntensity:.9}),-1.1,2.1,6.7);
 g.add(t);return t}
export function bandaraBesar(){const g=G();const W=0xf2f4f6,B=0x2f6fb8,K=0x8fd0ec,AS=0x3e434a,AP=0x9aa0a8,KN=0xf2c14a;
 g.ad(box(64,.35,44,0xc9ccd0,.03),0,.18,0);
 // gedung utama (belakang): kaca memanjang, atap biru melengkung bertingkat
 ruang(g,{x:0,z:-16.5,w:58,d:8,h:7,c:W,bukaan:[-24,-12,0,12,24].map(p=>({s:'d',p,w:3,h:3})).concat([{s:'b',p:0,w:6,h:3.2}]),lantaiC:0xe6e8ea});
 g.ad(box(59,.5,9,B,.08),0,7.6,-16.5);g.ad(box(40,.6,6,0x3a80c8,.15),0,8.2,-16.5);g.ad(box(22,.6,4,0x4a90d8,.2),0,8.8,-16.5);
 for(let i=0;i<24;i++){const x=-27.6+i*2.4;if([-24,-12,0,12,24].some(p=>Math.abs(x-p)<1.8))continue;g.ad(box(2,2.4,.12,K,.02),x,2.3,-12.47)}
 for(let i=0;i<24;i++)g.ad(box(2,2,.12,K,.02),-27.6+i*2.4,5.4,-12.47);
 const pn=papanTeks(18,1.6,'BANDARA DUNIA KOTAK','#2f6fb8','#ffffff');pn.position.set(0,9.9,-12.9);g.add(pn);
 for(let i=0;i<10;i++)kursi(g,-6+i*1.3,-17.5,0x3a6ab8);perabot(g,box(6,1,.8,B,.04),-18,.85,-19.5).userData.dinding=true;perabot(g,box(6,1,.8,B,.04),18,.85,-19.5).userData.dinding=true;
 perabot(g,box(5,1.6,.1,0x1d1d22,.02,{emissive:0x2a4a2a,emissiveIntensity:.35}),0,4.2,-20.2);
 // 5 dermaga gerbang T1–T5 + garbarata + jet
 const WJ=[0x2f6fb8,0xd6322a,0x2fa58a,0xe0a020,0x8a4ad8];
 [-24,-12,0,12,24].forEach((x,i)=>{
  ruang(g,{x,z:-10,w:7,d:4.4,h:4.2,c:W,bukaan:[{s:'d',p:0,w:2.2,h:2.6},{s:'b',p:0,w:3,h:3}],lantaiC:0xe6e8ea,zona:true});
  g.ad(box(7.6,.4,5,B,.05),x,4.75,-10);g.ad(box(5.6,1.4,.12,K,.02),x,2.8,-7.78).position.x=x;
  const tp=papanTeks(2.6,1.3,'T'+(i+1),'#f2c14a','#1d2a3a');tp.position.set(x,5.6,-7.6);g.add(tp);
  g.ad(box(1.6,1.6,4.4,0xdfe3e8,.1),x+2.2,3.2,-5.6);g.ad(box(1.7,.3,4.5,AS,.03),x+2.2,4.1,-5.6);for(let k=0;k<3;k++)g.ad(box(.06,.6,.6,K,.01),x+3.02,3.3,-7.2+k*1.4);
  g.ad(box(.4,2.4,.4,0x777b82,.02),x+2.2,1.55,-4);g.ad(box(1.4,.5,.8,0x333333,.1),x+2.2,.6,-4);
  jet(g,x,2.6,Math.PI/2,.88,WJ[i]);
  for(let k=0;k<6;k++)g.ad(box(.18,.05,.9,KN,.01),x,.4,-2+k*1.6);
 });
 // apron, landasan pacu, taxiway
 g.ad(box(64,.04,13,AP,.01),0,.37,1.5);g.ad(box(64,.05,9,AS,.01),0,.38,15.5);g.ad(box(64,.04,2.4,0x6e747c,.01),0,.37,9.4);
 [11.2,19.8].forEach(z=>g.ad(box(64,.06,.16,0xffffff,.01),0,.42,z));for(let x=-28;x<=28;x+=4)g.ad(box(2,.06,.3,0xffffff,.01),x,.42,15.5);
 [-30.5,30.5].forEach(x=>{for(let i=0;i<8;i++)g.ad(box(1.6,.06,.4,0xffffff,.01),x,.42,12+i*1)});
 g.ad(box(64,.05,.16,KN,.01),0,.41,9.4);
 for(let x=-31;x<=31.1;x+=3.1)[11,20].forEach(z=>g.ad(box(.2,.2,.2,0xffe08a,.05,{emissive:0xffe08a,emissiveIntensity:.8}),x,.48,z));
 const pl=papanTeks(5,1.6,'09','#3e434a','#ffffff');pl.rotation.x=-Math.PI/2;pl.position.set(-26.5,.43,15.5);g.add(pl);
 jet(g,-14,15.5,0,1.15,0x2f6fb8);
 // menara kontrol (kanan)
 g.ad(box(2.6,15,2.6,W,.06),29,7.85,-3);g.ad(box(3.4,.5,3.4,B,.05),29,10,-3);g.ad(box(5.2,2.2,5.2,K,.12),29,16.5,-3);g.ad(box(5.8,.4,5.8,AS,.03),29,15.2,-3);g.ad(box(5.8,.4,5.8,AS,.03),29,17.8,-3);
 g.ad(box(.15,2,.15,0x888888,.01),29,19,-3);g.ad(box(.4,.4,.4,0xff2a2a,.1,{emissive:0xff2a2a,emissiveIntensity:.9}),29,20.1,-3);g.ad(box(1.2,.8,1.2,0xdddddd,.3),27.6,18.4,-1.6);
 // kantong angin, truk BBM, mobil bagasi
 g.ad(box(.14,3.6,.14,0xdddddd,.02),30.5,2.15,7.6);g.ad(box(1.3,.5,.5,0xff7a1a,.15),31.1,3.7,7.6);g.ad(box(.35,.52,.52,0xffffff,.1),31.4,3.7,7.6);
 g.ad(box(4,1.6,1.6,0xe8e8e8,.4),-28.5,1.3,4);g.ad(box(1.6,1.8,1.7,0xd6322a,.15),-26,1.35,4);[-29.8,-27.3,-26].forEach(x=>[-1,1].forEach(q=>g.ad(box(.6,.6,.25,0x1e1e1e,.1),x,.66,4+q*.85)));
 [[-6,-4],[18,-4]].forEach(([x,z])=>{g.ad(box(1.4,.8,.9,0xf2c14a,.1),x,.8,z);[1,2,3].forEach(k=>g.ad(box(1.4,.5,.9,0x9a7a5a,.05),x-k*1.7,.7,z));});
 // antar-jemput & taksi (belakang gedung)
 g.ad(box(64,.05,1.6,0xf4f4f0,.01),0,.4,-21.2);[-20,-8,8,20].forEach((x,i)=>{g.ad(box(2.4,.8,1.2,[0xf2c14a,0x3a8ad8,0xf2c14a,0xe8e8e8][i],.3),x,.9,-21.2);g.ad(box(1.4,.55,1.1,0x26313d,.2),x-.1,1.5,-21.2)});
 [-31,31].forEach(x=>[-8,-20].forEach(z=>{g.ad(box(.8,2.8,.8,0x6a4426,.04),x,1.75,z);g.ad(box(3,2.6,3,0x3a8a5a,.3),x,4.2,z)}));
 pagar(g,64,44,B,4);return fin(g)}
export const SEMUA={masjid,gereja,katedral,pura,vihara,klenteng,sekolah,warung,supermarket,rumahSakit,stadion,kampus,tamanKota,kafe,hiburan,polisi,tokoWillo,arenaLari,sirkuitReli,damkar,bandara,bandaraBesar};
// Dipakai game: pisahkan bagian "atas" (dinding atas, atap, lantai 2) supaya bisa disembunyikan saat warga di dalam,
// dan hitung kotak tabrakan per dinding (pintu & ruang dalam bisa dilewati). m sudah diskalakan & diposisikan.
export function pisahFasum(m){
 m.updateMatrixWorld(true);const sk=m.scale.x,y0=m.position.y,zl=m.userData.zona||[];
 const zona=zl.map(([a,b,c,d,f])=>{const p=new THREE.Vector3(a,0,c).applyMatrix4(m.matrixWorld),q=new THREE.Vector3(b,0,d).applyMatrix4(m.matrixWorld);return [Math.min(p.x,q.x),Math.max(p.x,q.x),Math.min(p.z,q.z),Math.max(p.z,q.z),y0+f*sk]});
 const atas=new THREE.Group(),dinding=[],semua=new THREE.Box3(),bb=new THREE.Box3(),sz=new THREE.Vector3(),pindah=[];
 m.traverse(o=>{if(!o.isMesh)return;bb.setFromObject(o);bb.getSize(sz);semua.union(bb);
  const bawah=(bb.min.y-y0)/sk,atasY=(bb.max.y-y0)/sk;
  if(bawah<1&&(o.userData.dinding||(sz.y>2.4*sk&&sz.x>1.5*sk&&sz.z>1.5*sk)))dinding.push([bb.min.x,bb.max.x,bb.min.z,bb.max.z]);
  if(!o.userData.perabot&&zona.some(z=>atasY>(z[4]-y0)/sk+BAWAH+.1&&bb.max.x>z[0]-.5*sk&&bb.min.x<z[1]+.5*sk&&bb.max.z>z[2]-.5*sk&&bb.min.z<z[3]+.5*sk))pindah.push(o)});
 pindah.forEach(o=>atas.attach(o));
 const r=dinding.length?dinding.reduce((a,k)=>[Math.min(a[0],k[0]),Math.max(a[1],k[1]),Math.min(a[2],k[2]),Math.max(a[3],k[3])],[1e9,-1e9,1e9,-1e9]):null;
 return {atas:pindah.length?atas:null,dinding,zona,rect:r,tinggi:semua.isEmpty()?8*sk:semua.max.y-y0+1};
}
