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
export const SEMUA={masjid,gereja,katedral,pura,vihara,klenteng,sekolah,warung,supermarket,rumahSakit,stadion,kampus};
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
