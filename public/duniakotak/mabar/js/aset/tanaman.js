// ASET TANAMAN DUNIA KOTAK (video + game) — dibuat dari kotak kecil (VX = 1/4 kotak rumah 0.5)
// Pakai: import {tanamanMesh} from './tanaman.js'; sc.add(tanamanMesh('tomat',{tahap:3}))
// Tiap fungsi tanaman mengembalikan daftar sel [x,y,z,warna] dalam satuan voxel; toMesh() -> posisi dunia.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
let _s=1;export function reseed(n){_s=n}function rnd(){_s=(_s*16807)%2147483647;return (_s-1)/2147483646}
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);const hsl=(h,s,l)=>new THREE.Color().setHSL(h,s,l);
const CG=new RoundedBoxGeometry(1,1,1,2,.07),M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new THREE.Vector3();
export function cubes(list,m={}){const im=new THREE.InstancedMesh(CG,new THREE.MeshStandardMaterial({roughness:.85,...m}),list.length);im.castShadow=im.receiveShadow=true;
 list.forEach((o,i)=>{Q.setFromEuler(o.r||new THREE.Euler());S.setScalar(o.s||1);M4.compose(o.p,Q,S);im.setMatrixAt(i,M4);im.setColorAt(i,o.c)});im.instanceMatrix.needsUpdate=true;return im}
// ===== CONTOH TANAMAN KOTAK KECIL =====
export const VX=.125;
export function tomat(st=3){reseed(5);const c=[];const S=hsl(.3,.55,.28),Lf=()=>hsl(.29+rnd()*.04,.62,.26+rnd()*.08);const H=[3,7,11,15][st];
 for(let y=0;y<H;y++)c.push([0,y,0,S]);
 const lv=[[2,1],[4,-1],[6,1],[8,-1],[10,1],[12,-1],[14,1]].filter(([y])=>y<H);
 lv.forEach(([y,s],i)=>{const a=i*2.1;const dx=Math.round(Math.cos(a)*2),dz=Math.round(Math.sin(a)*2);for(let k=0;k<14;k++){const f=k/5;const ox=Math.round(dx*f+(rnd()*2-1)*1.2),oz=Math.round(dz*f+(rnd()*2-1)*1.2);c.push([ox,y+(k>9?-1:0)+(rnd()<.3?1:0),oz,Lf()])}});
 if(st===0){c.push([1,2,0,Lf()],[-1,2,0,Lf()])}
 if(st>=3){[[2,5,1],[-2,8,-1],[1,10,-2],[-1,4,2],[2,12,0]].forEach(([x,y,z],i)=>{const R=i===4?hsl(.12,.8,.55):hsl(.0,.8,.5);for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let d=0;d<2;d++)c.push([x+a,y-b,z+d,R]);c.push([x,y+1,z,S])});
  for(let y=0;y<17;y++)c.push([-3,y,-1,hsl(.08,.45,.42)]);}
 return c}
export function jagung(){reseed(7);const c=[];const S=hsl(.27,.55,.35),Lf=()=>hsl(.27+rnd()*.03,.58,.3+rnd()*.07);
 for(let y=0;y<30;y++){c.push([0,y,0,S]);if(y<6){c.push([1,y,0,S],[0,y,1,S],[1,y,1,S])}}
 [[5,[1,0]],[9,[0,1]],[13,[-1,0]],[17,[0,-1]],[21,[1,0]],[24,[0,1]]].forEach(([y,[dx,dz]])=>{for(let i=1;i<=8;i++){const yy=y+Math.round(i*.9-i*i*.13);c.push([dx*i,yy,dz*i,Lf()]);if(i<6)c.push([dx*i+dz,yy,dz*i+dx,Lf()])}});
 for(let y=12;y<18;y++)for(let a=0;a<2;a++)for(let b=0;b<2;b++){const top=y>=16;c.push([1+a,y,1+b,(a+b+y)%3===0||top?hsl(.25,.5,.45):hsl(.13,.85,.58)])}
 for(let k=0;k<5;k++){c.push([0,30+k,0,hsl(.11,.5,.7)]);if(k>1){c.push([k-1,30+k-1,0,hsl(.11,.5,.7)],[-(k-1),30+k-1,0,hsl(.11,.5,.65)],[0,30+k-1,k-1,hsl(.11,.5,.68)])}}
 return c}
// Cabai (6 Nov 2026, kebun warga): perdu rimbun pendek; tahap 2 berbunga putih + cabai hijau kecil, tahap 3 cabai merah bergantung.
export function cabai(st=3){reseed(11);const c=[];const S=hsl(.3,.5,.27),Lf=()=>hsl(.3+rnd()*.04,.6,.22+rnd()*.07);const H=[3,5,7,8][st],R=[0,2,3,4][st];
 for(let y=0;y<H;y++)c.push([0,y,0,S]);
 if(st===0)c.push([1,H,0,Lf()],[-1,H,0,Lf()],[0,H,0,Lf()]);
 // perdu bulat-lonjong rimbun dari dekat tanah sampai pucuk
 const cy=(H+2)/2,ry=H/2+.5;if(R)for(let y=1;y<=H+1;y++)for(let x=-R;x<=R;x++)for(let z=-R;z<=R;z++){if((x*x+z*z)/(R*R+.3)+((y-cy)/ry)**2>1||rnd()<.18)continue;c.push([x,y,z,Lf()])}
 const pod=(x,y,z,col,n)=>{c.push([x,y+1,z,S]);for(let k=0;k<n;k++)c.push([x,y-k,z,col])};
 const titik=[0,1,2,3,4,5,6].map(i=>{const a=i*.9+.4,r=R+1;return [Math.round(Math.cos(a)*r),Math.round(cy+(i%3-1)),Math.round(Math.sin(a)*r)]});
 if(st===2)titik.forEach(([x,y,z],i)=>i%2?c.push([x,y+1,z,hsl(.15,.1,.95)]):pod(x,y,z,hsl(.28,.75,.4),2));
 if(st>=3)titik.forEach(([x,y,z],i)=>pod(x,y,z,i===5?hsl(.28,.75,.4):hsl(.0,.85,.45+(i%2)*.06),3));
 return c}
// Bibit (6 Nov 2026): kecambah 2 daun di atas gundukan tanah kecil, dipakai di bedeng sesaat setelah tanam (semua jenis tanaman).
export function bibit(){const c=[];const S=hsl(.28,.55,.4),D1=hsl(.27,.65,.45),D2=hsl(.29,.6,.38),T=hsl(.07,.45,.2);
 for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)if(!(x&&z))c.push([x,0,z,T]);
 for(let y=1;y<4;y++)c.push([0,y,0,S]);
 c.push([1,4,0,D1],[2,4,0,D1],[2,5,0,D1],[-1,4,0,D2],[-2,4,0,D2],[-2,5,0,D2],[0,4,0,S],[0,5,0,hsl(.25,.7,.55)]);
 return c}
export function matahari(){reseed(9);const c=[];const S=hsl(.29,.5,.32),Lf=()=>hsl(.29+rnd()*.03,.58,.27+rnd()*.07);
 for(let y=0;y<26;y++)c.push([0,y,0,S]);
 [[6,[1,0]],[10,[0,1]],[14,[-1,0]],[18,[0,-1]],[21,[1,0]]].forEach(([y,[dx,dz]])=>{for(let i=1;i<=5;i++)for(let w=-2;w<=2;w++){if(Math.abs(w)>Math.min(i,6-i))continue;const yy=y+Math.round(i*.7-i*i*.18);c.push([dx*i+dz*w,yy,dz*i+dx*w,Lf()])}});
 for(let y=-6;y<=6;y++)for(let z=-6;z<=6;z++){const r=Math.hypot(y,z);const ang=Math.atan2(y,z);
  if(r<=3.2)c.push([1,28+y,z,(Math.round(y+z)%2?hsl(.07,.6,.22):hsl(.07,.55,.3))]);
  else if(r<=6.2&&Math.cos(ang*12)>-0.2)c.push([1,28+y,z,hsl(.13,.95,.55-(r>5.2?.04:0))]);
  if(r<=4.5)c.push([0,28+y,z,hsl(.28,.5,.3)])}
 return c}
export function plot(c,n=5){const g=[];for(let x=-n;x<=n;x++)for(let z=-n;z<=n;z++){const row=(x+20)%3===0;g.push([x,-1,z,row?hsl(.07,.45,.24):hsl(.07,.42,.32+rnd()*.03)])}return g}
export function island(R){const g=grassBed(R);for(let x=-R;x<=R;x++)for(let z=-R;z<=R;z++){if(Math.abs(x)!==R&&Math.abs(z)!==R)continue;for(let y=2;y<=3;y++)g.push([x,-y,z,y===3?hsl(.07,.35,.3):hsl(.08,.42,.42+rnd()*.05)])}return g}
export function grassBed(R){const g=[];for(let x=-R;x<=R;x++)for(let z=-R;z<=R;z++)g.push([x,-1,z,hsl(.28+rnd()*.03,.6,.4+rnd()*.05)]);return g}
export function toMesh(cells,off){return cells.map(([x,y,z,col])=>({p:V3(off.x+x*VX,off.y+(y+.5)*VX,off.z+z*VX),s:VX*.98,c:col}))}

// tahap: 0 bibit, 1 tunas, 2 besar, 3 berbuah (siap panen). Jagung & bunga matahari: tahap disimulasikan dengan memotong tinggi.
const RESEP={tomat:t=>tomat(t),jagung:()=>jagung(),matahari:()=>matahari(),cabai:t=>cabai(t),bibit:()=>bibit()};
export function tanamanSel(nama,tahap=3){let c=RESEP[nama](tahap);if(nama==='tomat'||nama==='cabai'||nama==='bibit')return c;
 const hsv=v=>{const o={};v[3].getHSL(o);return o};
 if(tahap<3){c=c.filter(v=>{const o=hsv(v);if(nama==='jagung')return !(o.h>.1&&o.h<.17&&o.s>.6)&&!(o.h>.1&&o.h<.12&&o.l>.6);return v[1]<22})}
 const H=Math.max(...c.map(v=>v[1]));const batas=[.2,.5,.85,1.01][tahap]*H;return c.filter(v=>v[1]<=batas)}
export function tanamanMesh(nama,{tahap=3,petak=true}={}){const g=new THREE.Group();const sel=tanamanSel(nama,tahap);g.add(cubes(toMesh(sel,V3(0,0,0))));
 if(nama==='matahari')g.children[0].rotation.y=-Math.PI/4;if(petak)g.add(cubes(toMesh(plot(null,6),V3(0,.01,0))));g.userData={nama,tahap};return g}
export const DAFTAR_TANAMAN=['tomat','jagung','matahari','cabai'];
