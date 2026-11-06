import {THREE,box,grad,raka,pose,run,face,rnd,reseed,dust} from './lib.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {tanamanSel, VX} from './aset/tanaman.js';
const L=(a,b,t)=>a+(b-a)*t, E=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2, C01=x=>Math.max(0,Math.min(1,x));
function base(bg,fogC,fogD){const sc=new THREE.Scene();sc.background=bg;if(fogC!=null)sc.fog=new THREE.Fog(fogC,fogD[0],fogD[1]);const cam=new THREE.PerspectiveCamera(50,1080/1920,.1,400);return {sc,cam}}
const pastel=()=>grad([[0,'#ffd6f0'],[.5,'#e6d8ff'],[1,'#b9c6ff']]);
const blue=()=>grad([[0,'#4aa8ff'],[.6,'#9fd6ff'],[1,'#e4f6ff']]);
const lights=(sc,i=1,warm=0xfff4ff)=>{const h=new THREE.HemisphereLight(0xffffff,0xa8c8a0,1.3*i);sc.add(h);const d=new THREE.DirectionalLight(warm,2.4*i);d.position.set(10,24,14);d.castShadow=true;d.shadow.mapSize.set(2048,2048);Object.assign(d.shadow.camera,{left:-30,right:30,top:30,bottom:-30,far:90});sc.add(d)};
// kubus instanced (satu draw call untuk ratusan kotak)
const CG=new RoundedBoxGeometry(1,1,1,1,.07),M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),S=new THREE.Vector3();
function cubes(list,m={}){const im=new THREE.InstancedMesh(CG,new THREE.MeshStandardMaterial({roughness:.85,...m}),list.length);im.castShadow=im.receiveShadow=true;
 im.place=(i,p,s,rot)=>{Q.setFromEuler(rot||new THREE.Euler());S.setScalar(s);M4.compose(p,Q,S);im.setMatrixAt(i,M4)};
 list.forEach((o,i)=>{im.place(i,o.p,o.s||1,o.r);im.setColorAt(i,o.c)});im.instanceMatrix.needsUpdate=true;return im}
const hsl=(h,s,l)=>new THREE.Color().setHSL(h,s,l);
// dunia kotak: tanah rumput bertingkat
const H=(x,z)=>((Math.abs(x)<10&&z>-12&&z<12)||(x>-28&&x<-2&&z>-28&&z<-2))?0:Math.max(0,Math.round(1.2*Math.sin(x*.21)+1.2*Math.cos(z*.17)+(z<-22?(-z-22)*.35:0)+(Math.abs(x)>16?(Math.abs(x)-16)*.4:0)));
function terrain(sc,s=2){const top=[],dirt=[];for(let x=-36;x<=36;x+=s)for(let z=-60;z<=16;z+=s){const h=H(x,z);const y=h*s-s/2;
  top.push({p:new THREE.Vector3(x,y,z),s:s*.98,c:hsl(.29+rnd()*.05,.7,.34+rnd()*.07)});for(let k=1;k<=Math.min(h,3);k++)dirt.push({p:new THREE.Vector3(x,y-k*s,z),s:s*.98,c:hsl(.08,.4,.3+rnd()*.06)})}
 sc.add(cubes(top));if(dirt.length)sc.add(cubes(dirt));return top}
function btree(sc,x,z,s=1){const l=[];const y0=H(x,z)*2;for(let k=0;k<4;k++)l.push({p:new THREE.Vector3(x,y0+(k+.5)*s,z),s,c:hsl(.08,.45,.28)});
 for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(let k=0;k<2;k++)if(!(k===1&&i&&j))l.push({p:new THREE.Vector3(x+i*s,y0+(4.5+k)*s,z+j*s),s,c:hsl(.3+rnd()*.04,.6,.3+rnd()*.08)});sc.add(cubes(l));}
function cloud(sc,x,y,z,n=6){const l=[];for(let i=0;i<n;i++)l.push({p:new THREE.Vector3(x+(rnd()-.5)*8,y+(rnd()-.3)*1.6,z+(rnd()-.5)*4),s:2.2+rnd()*1.6,c:hsl(0,0,.97)});const c=cubes(l,{roughness:1});sc.add(c);return c}
function sun(sc,pos,s=7){const m=new THREE.Mesh(new THREE.BoxGeometry(s,s,s),new THREE.MeshBasicMaterial({color:0xfff07a}));m.position.copy(pos);sc.add(m);
 const g=new THREE.Mesh(new THREE.BoxGeometry(s*1.5,s*1.5,s*1.5),new THREE.MeshBasicMaterial({color:0xffe060,transparent:true,opacity:.25,depthWrite:false}));m.add(g);return m}
function clockTex(n){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#fff8ff';x.beginPath();x.arc(256,256,250,0,7);x.fill();x.strokeStyle='#5a2ce0';x.lineWidth=14;
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;x.beginPath();x.moveTo(256+Math.sin(a)*200,256-Math.cos(a)*200);x.lineTo(256+Math.sin(a)*235,256-Math.cos(a)*235);x.stroke()}
 x.fillStyle='#ff2a3a';x.font='900 230px K, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(String(n),256,270);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function clock(sc,pos,s=1){const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.CircleGeometry(4,48),new THREE.MeshBasicMaterial({map:clockTex(0)})));
 g.add(new THREE.Mesh(new THREE.TorusGeometry(4.1,.35,12,64),new THREE.MeshStandardMaterial({color:0xffc84a,metalness:.8,roughness:.25,emissive:0x664400})));g.position.copy(pos);g.scale.setScalar(s);sc.add(g);return g}
// lantai dunia cermin (pastel) yang bisa runtuh
function mirrorFloor(sc,x0,x1,z0,z1){const l=[];for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)l.push({p:new THREE.Vector3(x,-.25,z),s:.97,c:new THREE.Color((x+z)%2?0xf4f0ff:0xd9ccff)});const m=cubes(l,{roughness:.6});sc.add(m);m.list=l;return m}
function collapse(m,t,start,k=3){const r=new THREE.Euler();m.list.forEach((o,i)=>{const d=C01((t-start(o.p))*k);const fall=d*d*30;r.set(d*3*((i%3)-1),0,d*2*((i%2)-.5));m.place(i,new THREE.Vector3(o.p.x,o.p.y-fall,o.p.z),o.s*(1-d*.3),r)});m.instanceMatrix.needsUpdate=true}
// raksasa kotak (bentuknya mirip Raka: celana zaitun, badan gelap, kepala kulit + rambut)
function giantList(){const s=1.2,l=[];
 const blk=(x0,x1,y0,y1,z0,z1,col)=>{const nx=Math.round((x1-x0)/s),ny=Math.round((y1-y0)/s),nz=Math.round((z1-z0)/s);
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++)for(let k=0;k<nz;k++){if(i&&j&&k&&i<nx-1&&j<ny-1&&k<nz-1)continue;l.push({p:new THREE.Vector3(x0+(i+.5)*s,y0+(j+.5)*s,z0+(k+.5)*s),s:s*.97,c:col()})}};
 const moss=b=>()=>rnd()<.18?hsl(.3,.5,.35+rnd()*.1):b();
 blk(-3.6,-1.2,0,7.2,-1.8,1.8,moss(()=>hsl(.17,.25,.24+rnd()*.05)));blk(1.2,3.6,0,7.2,-1.8,1.8,moss(()=>hsl(.17,.25,.24+rnd()*.05)));
 blk(-4.8,4.8,7.2,15.6,-2.4,2.4,moss(()=>hsl(.62,.08,.13+rnd()*.05)));
 blk(-7.2,-4.8,6,15.6,-1.2,1.2,moss(()=>hsl(.62,.08,.15+rnd()*.05)));blk(4.8,7.2,6,15.6,-1.2,1.2,moss(()=>hsl(.62,.08,.15+rnd()*.05)));
 blk(-3.6,3.6,15.6,22.8,-3.6,3.6,()=>hsl(.07,.55,.72+rnd()*.05));
 blk(-3.6,3.6,22.8,24,-3.6,3.6,()=>hsl(.7,.1,.05+rnd()*.03));blk(-3.6,3.6,16.8,22.8,-3.6,-2.4,()=>hsl(.7,.1,.05+rnd()*.03));
 return l}
function giant(sc,pos,u=1,o={}){reseed(77);let tgt=giantList();if(o.noArmR)tgt=tgt.filter(c=>!(c.p.x>4.8&&c.p.y<15.6));
 const from=tgt.map(o=>new THREE.Vector3((rnd()-.5)*90,-4-rnd()*6,(rnd()-.5)*60+10));
 // tiap kotak punya waktu lepas & arah terbang sendiri (untuk retak)
 const brk=tgt.map(c=>({d:.08+rnd()*.92-(c.p.z<0?.25:0)-(Math.abs(c.p.x)>4.7?.1:0),v:new THREE.Vector3(c.p.x*.25+(rnd()-.5)*3,2+rnd()*5,(c.p.z<0?-1:1)*(1+rnd()*3)),r:rnd()}));
 const g=new THREE.Group();g.position.copy(pos);sc.add(g);const m=cubes(tgt);g.add(m);
 const fm=new THREE.MeshStandardMaterial({map:face('normal'),roughness:.7,transparent:true});const fp=new THREE.Mesh(new THREE.PlaneGeometry(7.1,7.1),fm);fp.position.set(0,19.2,3.62);g.add(fp);
 const r=new THREE.Euler();
 g.assemble=u=>{tgt.forEach((o,i)=>{const d=E(C01(u*1.6-(o.p.y/24)*.6));const p=new THREE.Vector3().lerpVectors(g.worldToLocal(from[i].clone()),o.p,d);p.y+=Math.sin(d*Math.PI)*6;r.set((1-d)*4,(1-d)*3,0);m.place(i,p,o.s,r)});m.instanceMatrix.needsUpdate=true;fm.opacity=C01((u-.85)/.15);fp.visible=fm.opacity>0};
 const hot=new THREE.Color(0xff5a2a);
 g.crack=u=>{tgt.forEach((o,i)=>{const b=brk[i];const k=u-b.d;if(k<=0){m.place(i,o.p,o.s);return}
   const T=k*3.2;const p=o.p.clone().addScaledVector(b.v,T*2.2);p.y-=T*T*9;r.set(T*3*b.r,T*2,T*1.5);m.place(i,p,o.s*(k<.06?1:Math.max(.5,1-T*.25)),r);
   if(k<.08)m.setColorAt(i,hot)});m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true};
 g.setFace=e=>{fm.map=face(e);fm.needsUpdate=true};g.assemble(u);return g}
function mapTex(){const c=document.createElement('canvas');c.width=512;c.height=384;const x=c.getContext('2d');x.fillStyle='#e8cf98';x.fillRect(0,0,512,384);x.strokeStyle='#8a5a2a';x.lineWidth=10;x.strokeRect(10,10,492,364);
 x.fillStyle='#6a9a4a';[[90,110],[150,80],[120,160]].forEach(([a,b])=>x.fillRect(a,b,40,40));x.fillStyle='#4a8ad8';x.fillRect(300,60,60,140);
 x.setLineDash([16,14]);x.strokeStyle='#5a3a1a';x.lineWidth=8;x.beginPath();x.moveTo(110,300);x.bezierCurveTo(220,330,260,200,380,250);x.stroke();x.setLineDash([]);
 x.strokeStyle='#e0202a';x.lineWidth=16;x.fillStyle='#7a6a5a';x.fillRect(372,40,26,70);x.fillStyle='#ffc830';x.fillRect(366,30,38,16);x.beginPath();x.moveTo(360,230);x.lineTo(410,280);x.moveTo(410,230);x.lineTo(360,280);x.stroke();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const shot=(cam,t,cuts)=>{let k=0;while(k<cuts.length-1&&t>=cuts[k+1][0])k++;const [t0,f]=cuts[k];const t1=k+1<cuts.length?cuts[k+1][0]:1;f(cam,C01((t-t0)/(t1-t0)))};
function blockWorld(sc,o={}){lights(sc,.78,0xfff2d8);terrain(sc);
 [[13,-16],[-18,-30],[20,-34],[-8,-40],[10,-6],[-14,4],[24,-4]].forEach(([x,z])=>btree(sc,x,z,1.4));
 [[-20,40,-60],[18,46,-70],[0,52,-90],[-30,34,-40],[30,36,-46]].forEach(([x,y,z])=>cloud(sc,x,y,z,7));}
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
// papan nama kayu dengan teks
function signTex(txt,w=512,h=192){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#b9824a';x.fillRect(0,0,w,h);
 for(let i=0;i<6;i++){x.fillStyle=i%2?'#a8743f':'#c08a52';x.fillRect(0,i*h/6,w,h/6)}x.strokeStyle='#6a4220';x.lineWidth=12;x.strokeRect(6,6,w-12,h-12);
 x.fillStyle='#3a2210';let fs=Math.round(h*.42);x.font='900 '+fs+'px Montserrat, sans-serif';while(x.measureText(txt).width>w-60){fs-=2;x.font='900 '+fs+'px Montserrat, sans-serif'}x.textAlign='center';x.textBaseline='middle';x.fillText(txt,w/2,h/2+4);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function sign(sc,pos,txt,s=1,rot=0){const g=new THREE.Group();[-1.4,1.4].forEach(x=>{const p=box(.3,3.4,.3,0x6a4426,.04);p.position.set(x*s,1.7*s,0);p.scale.setScalar(s);g.add(p)});
 const b=box(3.4*s,1.3*s,.25*s,0x8a5a30,.04);b.position.y=2.9*s;g.add(b);const f=new THREE.Mesh(new THREE.PlaneGeometry(3.25*s,1.2*s),new THREE.MeshStandardMaterial({map:signTex(txt),roughness:.8}));f.position.set(0,2.9*s,.2*s);g.add(f);
 g.position.copy(pos);g.rotation.y=rot;sc.add(g);g.setText=t=>{f.material.map=signTex(t);f.material.needsUpdate=true};return g}
// rumah kotak pertama; u = progres bangun 0..1 (kotak muncul dari bawah ke atas)
function boxHouse(sc,pos,u=1){const l=[];const s=.5;
 for(let y=0;y<8;y++)for(let x=-4;x<=4;x++)for(let z=-3;z<=3;z++){const edge=Math.abs(x)===4||Math.abs(z)===3;if(!edge)continue;
  if(z===3&&Math.abs(x)<=1&&y<5)continue; if(Math.abs(x)===4&&Math.abs(z)<=1&&y>=3&&y<5)continue;
  const log=(Math.abs(x)===4&&Math.abs(z)===3);l.push({p:V3(x*s,(y+.5)*s,z*s),s:s*.98,c:log?hsl(.07,.45,.22):hsl(.08,.5,.45+rnd()*.06)})}
 for(let k=0;k<5;k++)for(let x=-5+k;x<=5-k;x++)for(let z=-4;z<=4;z++)if(k===4||Math.abs(x)===5-k)l.push({p:V3(x*s,(8.5+k)*s,z*s),s:s*.98,c:hsl(.02,.6,.38+rnd()*.06)});
 l.sort((a,b)=>a.p.y-b.p.y);const n=Math.round(l.length*C01(u));const m=cubes(l.slice(0,Math.max(1,n)));const g=new THREE.Group();g.add(m);
 if(u>=1){const d=box(1.4,2.4,.1,0x5a3a20,.03);d.position.set(0,1.2,1.52);g.add(d);const w=new THREE.Mesh(new THREE.PlaneGeometry(.9,.9),new THREE.MeshBasicMaterial({color:0xffd27a}));w.position.set(2.27,2,0);w.rotation.y=Math.PI/2;g.add(w)}
 g.position.copy(pos);sc.add(g);return g}
// tumpukan blok bahan bangunan
function pile(sc,pos){const l=[];for(let i=0;i<9;i++)l.push({p:V3((i%3)*.55,Math.floor(i/3)*.55+.27,0),s:.52,c:hsl(.08,.5,.45+rnd()*.06)});const m=cubes(l);m.position.copy(pos);sc.add(m)}
function world(sc){lights(sc,.85,0xfff2d8);terrain(sc);[[13,-16],[-18,-30],[20,-34],[-8,-40],[14,-2],[-15,6],[24,-4],[-24,-8]].forEach(([x,z])=>btree(sc,x,z,1.4));
 [[-20,40,-60],[18,46,-70],[0,52,-90],[-30,34,-40],[30,36,-46]].forEach(([x,y,z])=>cloud(sc,x,y,z,7))}
const look=(cam,p,t)=>{cam.position.copy(p);cam.lookAt(t)};
export const SHOTS=[
 // 1 langit + tanah kosong
 ()=>{reseed(1);const {sc,cam}=base(blue(),0xcfeaff,[60,200]);world(sc);sun(sc,V3(-20,46,-80),8);look(cam,V3(0,6,16),V3(0,10,-30));return sc.cam=cam,{sc,cam}},
 // 2 Raka mendarat
 ()=>{reseed(2);const {sc,cam}=base(blue(),0xcfeaff,[60,200]);world(sc);const R=raka('senang');R.position.set(0,0,0);pose(R,{armR:-2.7,armRz:-.35});sc.add(R);pile(sc,V3(1.6,0,-.6));look(cam,V3(1,2.8,8.5),V3(0,2,0));return {sc,cam}},
 // 3 papan PENDUDUK: 1, raksasa mengintip di belakang
 ()=>{reseed(3);const {sc,cam}=base(blue(),0xcfeaff,[60,200]);world(sc);sign(sc,V3(-.6,0,0),'PENDUDUK: 1',.9,.1);const R=raka('normal');R.position.set(1.3,0,1.6);R.rotation.y=-.3;pose(R,{armR:-.3});sc.add(R);
  const G=giant(sc,V3(-7,-15,-12),1);G.setFace('senang');G.rotation.y=.35;look(cam,V3(.3,3.4,13),V3(0,4.5,0));return {sc,cam}},
 // 4 aturan main (gerbang + Raka)
 ()=>{reseed(4);const {sc,cam}=base(blue(),0xcfeaff,[60,200]);world(sc);sign(sc,V3(-.4,0,-1.5),'DUNIA KOTAK',.9);const R=raka('senang');R.position.set(1.9,0,1.2);R.rotation.y=-.35;sc.add(R);pose(R,{armR:-1.2,armRz:-.6});look(cam,V3(0,3,10),V3(0,2.2,0));return {sc,cam}},
 // 5 timelapse bangun rumah (setengah jadi)
 ()=>{reseed(5);const {sc,cam}=base(blue(),0xcfeaff,[60,200]);world(sc);boxHouse(sc,V3(0,0,-1),.45);pile(sc,V3(3,0,1));const R=raka('serius');R.position.set(2.4,0,1.6);R.rotation.y=-.9;pose(R,{armL:-1.6,armR:-1.6});sc.add(R);look(cam,V3(3,4,13),V3(0,1.8,0));return {sc,cam}},
 // 6 rumah jadi, Raka di pintu, close
 ()=>{reseed(6);const {sc,cam}=base(grad([[0,'#ff9a5a'],[.6,'#ffc98a'],[1,'#ffe7c4']]),0xffd8b0,[50,180]);world(sc);boxHouse(sc,V3(0,0,-1),1);const R=raka('normal');R.position.set(0,0,1.1);sc.add(R);look(cam,V3(1.2,2.8,8.5),V3(0,2.6,0));return {sc,cam}},
 // 7 kamera naik: tanah luas
 ()=>{reseed(7);const {sc,cam}=base(blue(),0xcfeaff,[90,260]);world(sc);boxHouse(sc,V3(0,0,-1),1);sign(sc,V3(-4,0,2),'PENDUDUK: 1',1,.2);const R=raka('normal');R.position.set(1.6,0,2);sc.add(R);look(cam,V3(0,42,30),V3(0,0,-6));return {sc,cam}},
 // 8 papan close: PENDUDUK 1 -> ?
 ()=>{reseed(8);const {sc,cam}=base(blue(),0xcfeaff,[60,200]);world(sc);sign(sc,V3(0,0,0),'PENDUDUK: 1 → ?',1);look(cam,V3(0,3.2,7.5),V3(0,3.2,0));return {sc,cam}},
];
export const PROF=[
 // A: wajah Raka + langit
 ()=>{reseed(11);const {sc,cam}=base(blue(),0xcfeaff,[60,200]);cam.aspect=1;cam.updateProjectionMatrix();world(sc);boxHouse(sc,V3(-3.4,0,-4),1);const R=raka('senang');R.position.set(.3,0,0);R.rotation.y=-.15;pose(R,{armR:-2.7,armRz:-.35});sc.add(R);look(cam,V3(.4,3.3,4.6),V3(.2,2.9,0));return {sc,cam}},
 // B: pulau kotak satu blok rumput dengan rumah (ikon)
 ()=>{reseed(12);const sc=new THREE.Scene();sc.background=grad([[0,'#5ab4ff'],[1,'#d8f0ff']]);const cam=new THREE.PerspectiveCamera(32,1,.1,300);lights(sc,1,0xfff2d8);
  const l=[];for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++){l.push({p:V3(x,-.5,z),s:.98,c:hsl(.29+rnd()*.05,.7,.36+rnd()*.07)});for(let k=1;k<=3;k++)if(Math.abs(x)===4||Math.abs(z)===4||k===3)l.push({p:V3(x,-.5-k,z),s:.98,c:hsl(.08,.4,.3+rnd()*.06)})}
  sc.add(cubes(l));const h=boxHouse(sc,V3(-.6,0,-.8),1);h.scale.setScalar(.75);btree(sc,2.8,-2.6,.55);const R=raka('senang');R.scale.setScalar(.9);R.position.set(1.9,0,1.8);R.rotation.y=.7;pose(R,{armR:-2.7,armRz:-.35});sc.add(R);
  const sg=sign(sc,V3(-2.6,0,2.4),'1',.45,.4);look(cam,V3(13,11,15),V3(0,-.4,0));return {sc,cam}},
];
// ---- profil versi logo (kamera ortografis, isometrik bersih) ----
function islandLogo(sc,o={}){const l=[];const N=3;for(let x=-N;x<=N;x++)for(let z=-N;z<=N;z++){l.push({p:V3(x,-.5,z),s:.97,c:hsl(.3+rnd()*.03,.75,.36+rnd()*.05)});
  for(let k=1;k<=3;k++){const r=N-k+1;if(Math.abs(x)<=r&&Math.abs(z)<=r&&(Math.abs(x)===r||Math.abs(z)===r||k===3))l.push({p:V3(x,-.5-k,z),s:.97,c:k===3?hsl(.07,.35,.32):hsl(.08,.42,.4+rnd()*.05)})}}
 sc.add(cubes(l));const h=boxHouse(sc,V3(-.9,0,-.9),1);h.scale.setScalar(.55);btree(sc,1.9,-2.1,.42);
 if(o.raka){const R=raka('senang');R.scale.setScalar(.85);R.position.set(1.2,0,1.3);R.rotation.y=Math.PI/4;pose(R,{armR:-.5,armRz:-.25});sc.add(R)}}
function logoScene(bg){reseed(21);const sc=new THREE.Scene();sc.background=bg;const z=5.7;const cam=new THREE.OrthographicCamera(-z,z,z,-z,.1,200);
 sc.add(new THREE.HemisphereLight(0xffffff,0x8899aa,1.5));const d=new THREE.DirectionalLight(0xfff4e0,2.6);d.position.set(8,18,6);d.castShadow=true;d.shadow.mapSize.set(2048,2048);Object.assign(d.shadow.camera,{left:-10,right:10,top:10,bottom:-10,far:60});sc.add(d);
 islandLogo(sc,{raka:true});const k=30;cam.position.set(k,k*.82,k);cam.lookAt(0,-.3,0);return {sc,cam}}
export const LOGO=[
 ()=>logoScene(grad([[0,'#ffb347'],[1,'#ff6a1a']])),
 ()=>logoScene(grad([[0,'#5cc0ff'],[1,'#1f6fe0']])),
 ()=>logoScene(grad([[0,'#2e3350'],[1,'#121424']])),
];
// ---- story 9:16 ----
function logoTall(bg){const s=logoScene(bg);const z=10.5;Object.assign(s.cam,{left:-z*.5625,right:z*.5625,top:z,bottom:-z});s.cam.updateProjectionMatrix();const k=30;s.cam.position.set(k,k*.82,k);s.cam.lookAt(0,.6,0);return s}
export const STORY=[()=>logoTall(grad([[0,'#ffb347'],[1,'#ff6a1a']])),()=>SHOTS[1](),()=>SHOTS[0]()];
// story 1 versi pemandangan: langit luas di atas, Raka depan rumah + papan penduduk di bawah
export const STORY1B=()=>{reseed(31);const {sc,cam}=base(blue(),0xcfeaff,[70,220]);world(sc);sun(sc,V3(16,40,-70),7);boxHouse(sc,V3(-1.2,0,-2.5),1);sign(sc,V3(2.4,0,-.2),'PENDUDUK: 1',.8,-.3);
 const R=raka('senang');R.position.set(.2,0,.6);R.rotation.y=.12;pose(R,{armR:-2.7,armRz:-.35});sc.add(R);pile(sc,V3(-3.4,0,.4));look(cam,V3(.4,3.2,19),V3(.3,6.2,0));return {sc,cam}};
// ---- lahan petak warga (drone) ----
function numTex(n){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#9a9a9a';x.fillRect(0,0,128,128);x.fillStyle='#8a8a8a';x.fillRect(0,96,128,32);
 x.fillStyle='#2a2a2a';x.font='900 '+(n>99?54:70)+'px Montserrat, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(String(n),64,60);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function plotLand(sc){const S=5,NX=7,NZ=8,road=2;const grass=[],dirt=[],fence=[];const x0=-(NX*S)/2;
 // tanah datar luas
 for(let x=-60;x<=60;x+=2)for(let z=-80;z<=30;z+=2){const edge=Math.max(0,Math.max(Math.abs(x)-26,-(z+50),z-18));const h=edge>0?Math.round(edge*.18+Math.sin(x*.3)*.6):0;
  grass.push({p:V3(x,h*2-1,z),s:1.98,c:hsl(.29+rnd()*.04,.7,.36+rnd()*.06)})}
 sc.add(cubes(grass));
 // jalan tanah tengah (sumbu z)
 for(let z=-46;z<=16;z++)for(let x=-1;x<=1;x++)dirt.push({p:V3(x,.02,z),s:.99,c:hsl(.08,.42,.42+rnd()*.05)});
 const plots=[];let n=1;
 for(let j=0;j<NZ;j++)for(let side of [-1,1])for(let i=0;i<Math.floor(NX/2);i++){const cx=side*(road+S/2+i*(S+.6)),cz=10-j*(S+.6);plots.push({cx,cz,n:n++})}
 plots.forEach(({cx,cz,n})=>{ // pagar patok tiap sudut + garis tanah
  for(let t=-S/2;t<=S/2;t+=1){[[cx+t,cz-S/2],[cx+t,cz+S/2],[cx-S/2,cz+t],[cx+S/2,cz+t]].forEach(([x,z])=>dirt.push({p:V3(x,.03,z),s:.5,c:hsl(.08,.45,.34)}))}
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>fence.push({p:V3(cx+a*S/2,.5,cz+b*S/2),s:.35,c:hsl(.07,.5,.3)}));
  const st=new THREE.Mesh(new THREE.BoxGeometry(1.4,1,1.4),[0,1,2,3,4,5].map(k=>new THREE.MeshStandardMaterial({color:0x9a9a9a,roughness:.9,map:(k===4||k===2)?numTex(n):null})));st.position.set(cx+(cx<0?S/2-1.1:-S/2+1.1),.5,cz+S/2-1.1);st.castShadow=true;sc.add(st)});
 sc.add(cubes(dirt));const f=cubes(fence);sc.add(f);return plots}
function droneWorld(sc){sc.add(new THREE.HemisphereLight(0xffffff,0xa8c8a0,1.25));const d=new THREE.DirectionalLight(0xfff2d8,2.3);d.position.set(20,40,16);d.castShadow=true;d.shadow.mapSize.set(4096,4096);Object.assign(d.shadow.camera,{left:-50,right:50,top:50,bottom:-50,far:150});sc.add(d);
 const plots=plotLand(sc);
 // petak 1 = rumah Raka
 const p1=plots[0];const h=boxHouse(sc,V3(p1.cx,0,p1.cz-.4),1);h.scale.setScalar(.7);const R=raka('senang');R.position.set(p1.cx+1.6,0,p1.cz+1.6);R.rotation.y=.6;pose(R,{armR:-2.7,armRz:-.35});sc.add(R);
 sign(sc,V3(0,0,17.5),'LAHAN WARGA',1.2,0);
 [[-34,-20],[34,-30],[-30,8],[32,6],[-20,-60],[22,-62],[0,-70],[-40,-44],[40,-50]].forEach(([x,z])=>btree(sc,x,z,1.4));
 [[-20,40,-60],[18,46,-70],[0,52,-90],[-30,34,-40],[30,36,-46]].forEach(([x,y,z])=>cloud(sc,x,y,z,7));return {plots,R}}
// t 0..1: drone naik dari Raka ke lebar seluruh lahan
export const DRONE=t=>{reseed(41);const {sc,cam}=base(blue(),0xcfeaff,[90,260]);const W=droneWorld(sc);const e=E(t);
 const from=V3(1.5,2.8,17),to=V3(8,34,36);cam.position.lerpVectors(from,to,e);const tf=V3(W.plots[0].cx,1.6,W.plots[0].cz),tt=V3(-3,0,-16);cam.lookAt(new THREE.Vector3().lerpVectors(tf,tt,e));return {sc,cam}};
// ---- rumah lengkap: kotak + segitiga (atap prisma), pagar, pekarangan ----
function prism(w,h,d,col){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});g.translate(0,0,-d/2);const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:col,roughness:.85}));m.castShadow=m.receiveShadow=true;return m}
function roofPlanes(w,h,d,col){const g=new THREE.Group();const L=Math.hypot(w/2+.35,h+.1);const a=Math.atan2(h,w/2);
 [-1,1].forEach(s=>{const p=box(L,.22,d+.8,col,.05);p.position.set(s*(w/4+.08),h/2+.05,0);p.rotation.z=-s*a;g.add(p)});
 const ridge=box(.35,.3,d+.9,0x7a2a1e,.06);ridge.position.y=h+.12;g.add(ridge);return g}
export function fullHouse(sc,pos,o={}){const G=new THREE.Group();G.position.copy(pos);sc.add(G);
 const W=5,D=4,Hh=2.8,RH=2,wall=0xf1dcb4,trim=0xffffff,roofC=o.roof||0xc8553d;
 // fondasi + dinding (kotak)
 const base0=box(W+.4,.35,D+.4,0x8d8d8d,.04);base0.position.y=.17;G.add(base0);
 const wl=box(W,Hh,D,wall,.05);wl.position.y=.35+Hh/2;G.add(wl);
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{const c=box(.3,Hh,.3,trim,.03);c.position.set(a*W/2,.35+Hh/2,b*D/2);G.add(c)});
 // segitiga gable + atap
 const gb=prism(W,RH,D,wall);gb.position.y=.35+Hh;G.add(gb);const rf=roofPlanes(W,RH,D,roofC);rf.position.y=.35+Hh;G.add(rf);
 const ch=box(.6,1.6,.6,0x9a5a40,.04);ch.position.set(1.3,.35+Hh+1.4,-.8);G.add(ch);const chc=box(.75,.18,.75,0x6a3a2a,.03);chc.position.set(1.3,.35+Hh+2.25,-.8);G.add(chc);
 // pintu, jendela, teras
 const door=box(1,1.9,.12,0x6b3e22,.04);door.position.set(0,.35+.95,D/2+.03);G.add(door);const knob=box(.1,.1,.08,0xffd040,.02);knob.position.set(.35,.35+.95,D/2+.12);G.add(knob);
 const dtr=box(1.3,.18,.16,trim,.03);dtr.position.set(0,.35+1.98,D/2+.04);G.add(dtr);
 const win=(x,z,ry)=>{const g=new THREE.Group();const f=box(1.1,1.1,.12,trim,.03);g.add(f);const gl=new THREE.Mesh(new THREE.PlaneGeometry(.85,.85),new THREE.MeshStandardMaterial({color:0x9fd6ff,roughness:.15,metalness:.2,emissive:0x203040}));gl.position.z=.07;g.add(gl);
  const cx=box(.08,.85,.04,trim,.01);cx.position.z=.09;g.add(cx);const cy=box(.85,.08,.04,trim,.01);cy.position.z=.09;g.add(cy);const sill=box(1.3,.12,.3,trim,.02);sill.position.set(0,-.6,.1);g.add(sill);
  const fb=box(1.2,.25,.3,0x7a4a2a,.03);fb.position.set(0,-.78,.22);g.add(fb);[-.4,0,.4].forEach((dx,i)=>{const fl=box(.22,.22,.22,[0xff5a7a,0xffd23a,0xff8a3a][i],.06);fl.position.set(dx,-.56,.25);g.add(fl)});
  g.position.set(x,.35+1.6,z);g.rotation.y=ry;G.add(g)};
 win(-1.6,D/2+.04,0);win(1.6,D/2+.04,0);win(W/2+.04,0,Math.PI/2);win(-W/2-.04,0,-Math.PI/2);
 const gw=new THREE.Mesh(new THREE.CircleGeometry(.35,6),new THREE.MeshStandardMaterial({color:0x9fd6ff,emissive:0x203040}));gw.position.set(0,.35+Hh+.8,D/2+.01);G.add(gw);
 const porch=box(2.2,.25,1.2,0xb08050,.04);porch.position.set(0,.47,D/2+.6);G.add(porch);
 [-.95,.95].forEach(x=>{const p=box(.16,1.9,.16,trim,.02);p.position.set(x,.35+1.2,D/2+1.1);G.add(p)});const aw=prism(2.4,.6,1.3,roofC);aw.rotation.y=Math.PI/2;aw.rotation.z=0;aw.position.set(0,.35+2.2,D/2+.6);aw.rotation.set(0,0,0);G.add(aw);
 // pekarangan: rumput rapi, jalan batu, pagar kayu putih, gerbang, semak, pohon, kotak surat, lampu
 const YW=13,YD=12;const lawn=box(YW,.12,YD,0x6cc24a,.02);lawn.position.set(0,.02,1.5);lawn.receiveShadow=true;G.add(lawn);
 for(let z=D/2+1.4;z<YD/2+1.3;z+=.9){const s=box(.8,.08,.6,0xc9c2b4,.05);s.position.set((Math.round(z*7)%2?.12:-.12),.12,z);G.add(s)}
 const fz=YD/2+1.5,fx=YW/2;const picket=(x,z,ry)=>{const p=box(.16,1,.1,trim,.03);p.position.set(x,.55,z);p.rotation.y=ry;G.add(p);const tip=prism(.16,.15,.1,trim);tip.position.set(x,1.05,z);tip.rotation.y=ry;G.add(tip)};
 for(let x=-fx;x<=fx+.01;x+=.4){if(Math.abs(x)<.9)continue;picket(x,fz,0);picket(x,fz-YD,0)}
 for(let z=fz-YD;z<=fz+.01;z+=.4){picket(-fx,z,Math.PI/2);picket(fx,z,Math.PI/2)}
 [[0,fz,YW],[0,fz-YD,YW]].forEach(([x,z,w])=>[.35,.8].forEach(y=>{const r=box(w,.1,.06,trim,.02);r.position.set(x,y,z-.07);G.add(r)}));
 [-fx,fx].forEach(x=>[.35,.8].forEach(y=>{const r=box(.06,.1,YD,trim,.02);r.position.set(x+.07*(x<0?1:-1),y,fz-YD/2);G.add(r)}));
 [-.95,.95].forEach(x=>{const p=box(.3,1.4,.3,trim,.04);p.position.set(x,.7,fz);G.add(p);const c=box(.4,.15,.4,trim,.03);c.position.set(x,1.45,fz);G.add(c)});
 const bush=(x,z,s=1)=>{const g=new THREE.Group();[[0,0,0,.9],[.4,.1,.2,.7],[-.35,.05,-.2,.7],[0,.45,0,.6]].forEach(([a,b,c,k])=>{const m=box(k*s,k*s,k*s,0x3f9a3a,.15);m.position.set(a*s,.35*s+b*s,c*s);g.add(m)});g.position.set(x,0,z);G.add(g)};
 [[-3.6,D/2+.8],[-2.6,D/2+.9],[2.6,D/2+.9],[3.6,D/2+.8],[-5.4,-3],[5.4,-3]].forEach(([x,z])=>bush(x,z,.9));
 for(let i=0;i<9;i++){const fl=box(.2,.2,.2,[0xff5a7a,0xffd23a,0xffffff,0xb07aff][i%4],.05);fl.position.set(-5.6+i*.35,.22,fz-.6);G.add(fl);const fr=fl.clone();fr.position.x=2.8+i*.35;G.add(fr)}
 const tr=new THREE.Group();const tk=box(.5,2.6,.5,0x7a4a2a,.04);tk.position.y=1.3;tr.add(tk);[[0,3,0,2.2],[.7,2.7,.4,1.4],[-.7,2.8,-.3,1.5],[0,3.9,0,1.4]].forEach(([a,b,c,k])=>{const m=box(k,k,k,0x4fae3c,.12);m.position.set(a,b,c);tr.add(m)});tr.position.set(-4.6,0,-2.6);G.add(tr);
 const mb=new THREE.Group();const mp=box(.12,1.1,.12,0x6b4a2a,.02);mp.position.y=.55;mb.add(mp);const mx=box(.45,.35,.6,0x3a7ad8,.06);mx.position.y=1.2;mb.add(mx);const fl=box(.05,.25,.12,0xff3a3a,.01);fl.position.set(.25,1.35,.1);mb.add(fl);mb.position.set(1.6,0,fz+.4);G.add(mb);
 const lp=new THREE.Group();const lpp=box(.12,1.6,.12,0x2a2a2a,.02);lpp.position.y=.8;lp.add(lpp);const lb=new THREE.Mesh(new THREE.BoxGeometry(.3,.35,.3),new THREE.MeshBasicMaterial({color:0xffe08a}));lb.position.y=1.75;lp.add(lb);lp.position.set(-1.6,0,fz+.4);G.add(lp);
 G.userData.rumah=1;return G}
export const HOUSE=n=>{reseed(51);const {sc,cam}=base(blue(),0xcfeaff,[60,200]);lights(sc,.9,0xfff2d8);
 const gr=[];for(let x=-30;x<=30;x+=2)for(let z=-30;z<=24;z+=2)gr.push({p:V3(x,-1,z),s:1.98,c:hsl(.29+rnd()*.04,.7,.36+rnd()*.06)});sc.add(cubes(gr));
 [[-20,40,-60],[18,46,-70],[0,52,-90]].forEach(([x,y,z])=>cloud(sc,x,y,z,7));fullHouse(sc,V3(0,0,0));
 const R=raka('senang');R.position.set(1.9,0,9.8);R.rotation.y=-.05;pose(R,{armR:-2.7,armRz:-.35});sc.add(R);
 [[-14,-14],[12,-16],[-22,-4],[20,-6],[4,-22],[-8,-24]].forEach(([x,z])=>{const t=new THREE.Group();const k=box(.8,4,.8,0x7a4a2a,.05);k.position.y=1;t.add(k);[[0,4,0,3.2],[1,3.6,.6,2],[-1,3.7,-.4,2.2],[0,5.4,0,2]].forEach(([a,b,c,q])=>{const m=box(q,q,q,0x4fae3c,.15);m.position.set(a,b,c);t.add(m)});t.position.set(x,0,z);sc.add(t)});
 const views=[[V3(15,9,22),V3(-1,2,2)],[V3(0,4.5,19),V3(0,2.6,0)],[V3(-13,15,17),V3(1,1,1)]];const [p,t]=views[n];look(cam,p,t);return {sc,cam}};
// ---- pekarangan luas warga (konsep game kebun, orisinal) ----
function cropField(G,x0,z0,nx,nz,kind){const l=[],c=[];for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const x=x0+i*1.1,z=z0+j*1.1;l.push({p:V3(x,.12,z),s:1,c:hsl(.07,.45,.25+rnd()*.04)});
  if(kind==='gandum'){for(let k=0;k<3;k++)c.push({p:V3(x+(k-1)*.28,.55+rnd()*.1,z+(rnd()-.5)*.3),s:.22,c:hsl(.13,.85,.55+rnd()*.08)})}
  else if(kind==='wortel'){c.push({p:V3(x,.42,z),s:.32,c:hsl(.33,.7,.38)});c.push({p:V3(x,.26,z),s:.26,c:hsl(.07,.9,.55)})}
  else if(kind==='jagung'){c.push({p:V3(x,.7,z),s:.25,c:hsl(.3,.6,.35)});c.push({p:V3(x,1.15,z),s:.28,c:hsl(.3,.6,.4)});c.push({p:V3(x+.18,.95,z),s:.2,c:hsl(.14,.9,.55)})}
  else {c.push({p:V3(x,.4,z),s:.42,c:hsl(.32,.6,.35+rnd()*.06)});if(rnd()<.6)c.push({p:V3(x+.12,.55,z+.1),s:.17,c:hsl(0,.8,.5)})}}
 const a=cubes(l);G.add(a);if(TIPIS){a.scale.y=.1;G.add(tanamanBedeng(l,kind));return}const b=cubes(c);G.add(b)}
// Game (6 Nov 2026, Huda): tanaman kebun samping rumah pakai ASET TANAMAN kotak kecil (aset/tanaman.js), bukan kubus besar.
// Satu tanaman per petak bedeng, tinggi ±0,55 (di bawah lutut-pinggang avatar); kubus polos (12 segitiga) supaya ringan di HP.
const GEO_TANAMAN=new THREE.BoxGeometry(1,1,1),SEL_TANAMAN={};
const PETA_TANAMAN={tomat:['tomat',3],jagung:['jagung',3],gandum:['matahari',3],wortel:['tomat',2]};
function tanamanBedeng(l,kind){const [nm,th]=PETA_TANAMAN[kind]||['tomat',3];const k=nm+th;
 const sel=SEL_TANAMAN[k]||(SEL_TANAMAN[k]=tanamanSel(nm,th));const H=Math.max(...sel.map(v=>v[1]))+1,sk=.55/(H*VX),u=VX*sk;
 const im=new THREE.InstancedMesh(GEO_TANAMAN,new THREE.MeshStandardMaterial({roughness:.85}),sel.length*l.length);im.castShadow=true;im.receiveShadow=true;
 const M=new THREE.Matrix4(),P=new THREE.Vector3(),Q=new THREE.Quaternion(),S=new THREE.Vector3(u*.98,u*.98,u*.98);let i=0;
 for(const b of l){const ry=(b.p.x*7+b.p.z*13)%6;Q.setFromAxisAngle(new THREE.Vector3(0,1,0),ry);for(const [x,y,z,col] of sel){P.set(x*u,(y+.5)*u,z*u).applyQuaternion(Q);P.x+=b.p.x;P.z+=b.p.z;P.y+=.02;M.compose(P,Q,S);im.setMatrixAt(i,M);im.setColorAt(i++,col)}}
 im.instanceMatrix.needsUpdate=true;return im}
function lumbung(G,x,z){const g=new THREE.Group();const w=box(5,3.4,4,0xa8432f,.05);w.position.y=1.7;g.add(w);const gb=prism(5,1.8,4,0xa8432f);gb.position.y=3.4;g.add(gb);const rf=roofPlanes(5,1.8,4,0x5a4a3a);rf.position.y=3.4;g.add(rf);
 const dr=box(2.2,2.4,.1,0xf0e6d6,.03);dr.position.set(0,1.2,2.03);g.add(dr);[[0,1.2,.02,2.2,.14],[0,1.2,.02,.14,2.4]].forEach(([a,b,c,w2,h2])=>{const s=box(w2,h2,.06,0xa8432f,.01);s.position.set(a,b,2.1);g.add(s)});
 const hay=box(1.4,.9,.9,0xe8c860,.08);hay.position.set(2.9,.45,1.8);g.add(hay);const hay2=hay.clone();hay2.position.set(3.1,1.3,1.8);g.add(hay2);g.position.set(x,0,z);G.add(g)}
function kandang(G,x,z){const g=new THREE.Group();const c=box(2.4,1.6,2,0xd9b07a,.05);c.position.y=1;g.add(c);const r=prism(2.8,.9,2.3,0x6a8ad8);r.position.y=1.8;g.add(r);
 [[-.5,.2],[.6,.5],[1.6,1.4],[-1.4,1.6],[.3,2.3]].forEach(([a,b],i)=>{const ch=new THREE.Group();const bd=box(.45,.4,.55,0xffffff,.1);bd.position.y=.3;ch.add(bd);const hd=box(.25,.25,.25,0xffffff,.06);hd.position.set(0,.6,.25);ch.add(hd);const cm=box(.1,.12,.12,0xff3030,.02);cm.position.set(0,.78,.25);ch.add(cm);const bk=box(.1,.08,.12,0xffb020,.02);bk.position.set(0,.58,.42);ch.add(bk);ch.position.set(a,0,b+1.2);ch.rotation.y=i;g.add(ch)});
 for(let i=-2;i<=2;i+=.5){[[i,3.6],[i,-.9]].forEach(([a,b])=>{const p=box(.1,.6,.1,0xc8a070,.01);p.position.set(a,.3,b);g.add(p)})}g.position.set(x,0,z);G.add(g)}
function kolam(G,x,z){const g=new THREE.Group();const rim=[];for(let i=-3;i<=3;i++)for(let j=-2;j<=2;j++){if(Math.abs(i)===3||Math.abs(j)===2)rim.push({p:V3(i*.9,.2,j*.9),s:.88,c:hsl(0,0,.6+rnd()*.1)})}g.add(cubes(rim));
 const w=new THREE.Mesh(new THREE.PlaneGeometry(5,3.2),new THREE.MeshStandardMaterial({color:0x3aa0e8,roughness:.1,metalness:.3,transparent:true,opacity:.9}));w.rotation.x=-Math.PI/2;w.position.y=.3;g.add(w);
 [[-1,.4],[1.2,-.5]].forEach(([a,b])=>{const lp=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.04,8),new THREE.MeshStandardMaterial({color:0x4fae3c}));lp.position.set(a,.33,b);g.add(lp)});
 const dk=box(.5,.5,.3,0xffd23a,.08);dk.position.set(.3,.45,.3);g.add(dk);const dh=box(.25,.25,.25,0x3a8a3a,.05);dh.position.set(.3,.75,.5);g.add(dh);g.position.set(x,0,z);G.add(g)}
function fruitTree(G,x,z,fc){const t=new THREE.Group();const k=box(.5,2,.5,0x7a4a2a,.04);k.position.y=1;t.add(k);const cr=box(2.2,1.8,2.2,0x3f9a3a,.2);cr.position.y=2.6;t.add(cr);
 for(let i=0;i<7;i++){const f=box(.25,.25,.25,fc,.06);const a=i/7*Math.PI*2;f.position.set(Math.cos(a)*1.12,2.3+(i%3)*.4,Math.sin(a)*1.12);t.add(f)}t.position.set(x,0,z);G.add(t)}
export function bigYard(sc){const G=new THREE.Group();sc.add(G);const YW=34,YD=28;
 const lawn=box(YW,.12,YD,0x7ccc52,.02);lawn.position.set(0,.02,0);lawn.receiveShadow=true;G.add(lawn);
 const h=fullHouse(sc,V3(-8,0,-6));// rumah + halaman kecil sendiri
 for(let z=-YD/2+1;z<YD/2;z+=.9){const s=box(.8,.08,.6,0xc9c2b4,.05);s.position.set(-8+(Math.round(z*7)%2?.1:-.1),.12,z+20);}
 const path=[];for(let x=-14;x<=14;x++)path.push({p:V3(x,.1,6),s:.95,c:hsl(.08,.35,.55+rnd()*.05)});for(let z=-12;z<=6;z++)path.push({p:V3(4,.1,z),s:.95,c:hsl(.08,.35,.55+rnd()*.05)});G.add(cubes(path));
 cropField(G,6,-12,5,4,'gandum');cropField(G,12.2,-12,3,4,'jagung');cropField(G,6,-6.5,5,3,'wortel');cropField(G,12.2,-6.5,3,3,'tomat');
 lumbung(G,10,10);kandang(G,-1,9);kolam(G,-11,10);
 [[ -15,-11,0xff3a3a],[-15,-3,0xffa020],[15,1,0xff3a3a],[-15,4,0xffd020]].forEach(([x,z,c])=>fruitTree(G,x,z,c));
 // pagar keliling luar
 const fx=YW/2,fz=YD/2;const pk=[];for(let x=-fx;x<=fx;x+=.5){if(Math.abs(x-4)<1.2)continue;pk.push({p:V3(x,.5,fz),s:1,c:new THREE.Color(0xffffff)});pk.push({p:V3(x,.5,-fz),s:1,c:new THREE.Color(0xffffff)})}
 for(let z=-fz;z<=fz;z+=.5){pk.push({p:V3(-fx,.5,z),s:1,c:new THREE.Color(0xffffff)});pk.push({p:V3(fx,.5,z),s:1,c:new THREE.Color(0xffffff)})}
 const pm=new THREE.InstancedMesh(new THREE.BoxGeometry(.14,1,.14),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.7}),pk.length);pk.forEach((o,i)=>{M4.compose(o.p,new THREE.Quaternion(),new THREE.Vector3(1,1,1));pm.setMatrixAt(i,M4)});pm.castShadow=true;G.add(pm);
 // gerbang dengan papan nama warga
 const gs=sign(sc,V3(4,0,fz+.6),'RUMAH @WARGA',.9,0);
 const R=raka('senang');R.position.set(5.6,0,fz-1.6);R.rotation.y=.4;pose(R,{armR:-2.7,armRz:-.35});sc.add(R);return G}
export const YARD=n=>{reseed(61);const sc=new THREE.Scene();sc.background=grad([[0,'#7cc8ff'],[1,'#d8f0ff']]);
 sc.add(new THREE.HemisphereLight(0xffffff,0x9ab890,1.3));const d=new THREE.DirectionalLight(0xfff2d8,2.4);d.position.set(18,34,22);d.castShadow=true;d.shadow.mapSize.set(4096,4096);Object.assign(d.shadow.camera,{left:-30,right:30,top:30,bottom:-30,far:120});sc.add(d);
 const gr=[];for(let x=-50;x<=50;x+=2)for(let z=-50;z<=50;z+=2)gr.push({p:V3(x,-1,z),s:1.98,c:hsl(.29+rnd()*.04,.6,.4+rnd()*.06)});sc.add(cubes(gr));
 [[-30,-26],[26,-30],[-34,-6],[4,-34]].forEach(([x,z])=>btree(sc,x,z,1.4));
 bigYard(sc);const asp=n===0?1080/1920:1;const z=n===0?34:19;const cam=new THREE.OrthographicCamera(-z*asp,z*asp,z,-z,.1,300);const k=60;cam.position.set(k,k*.85,k);cam.lookAt(0,0,0);return {sc,cam}};
// ---- denah desa: kavling warga + gang + lahan fasum kosong ----
function lot(G,cx,cz,o){const LW=10,LD=9;const g=new THREE.Group();g.position.set(cx,0,cz);G.add(g);
 const lawn=box(LW,.1,LD,o.filled?0x7ccc52:0x9ad870,.02);lawn.position.y=.05;g.add(lawn);
 const pk=[];for(let x=-LW/2;x<=LW/2+.01;x+=.5){if(Math.abs(x)>.8)pk.push(V3(x,.4,LD/2));pk.push(V3(x,.4,-LD/2))}for(let z=-LD/2;z<=LD/2+.01;z+=.5){pk.push(V3(-LW/2,.4,z));pk.push(V3(LW/2,.4,z))}
 const pm=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,.8,.12),new THREE.MeshStandardMaterial({color:o.filled?0xffffff:0xd8c8a8}),pk.length);pk.forEach((p,i)=>{M4.compose(p,new THREE.Quaternion(),new THREE.Vector3(1,1,1));pm.setMatrixAt(i,M4)});pm.castShadow=true;g.add(pm);
 if(o.filled){const h=fullHouse(new THREE.Group(),V3(0,0,0),{roof:o.roof});h.scale.setScalar(.42);h.position.set(-2,0,-1.6);
   // fullHouse menambah dirinya ke grup baru; pindahkan ke g
   g.add(h);cropField(g,1.2,-3.6,3,3,o.crop||'gandum');fruitTree(g,3.6,2.6,o.fruit||0xff3a3a);if(o.coop&&!TIPIS){const k=new THREE.Group();kandang(k,0,0);k.scale.setScalar(.6);k.position.set(3,0,-1);g.add(k)}}
 else{const st=new THREE.Mesh(new THREE.BoxGeometry(1.2,1,1.2),[0,1,2,3,4,5].map(k=>new THREE.MeshStandardMaterial({color:0x9a9a9a,map:(k===2||k===4)?numTex(o.n):null})));st.position.set(0,.5,LD/2-1.4);st.castShadow=true;g.add(st)}
 return g}
function fasumLot(G,cx,cz,w,d,label){const g=new THREE.Group();g.position.set(cx,0,cz);G.add(g);const ground=box(w,.1,d,0xd9c39a,.02);ground.position.y=.05;g.add(ground);
 const l=[];for(let x=-w/2;x<=w/2+.01;x+=1)l.push({p:V3(x,.35,-d/2),s:.3,c:new THREE.Color(0xff8a1a)},{p:V3(x,.35,d/2),s:.3,c:new THREE.Color(0xff8a1a)});for(let z=-d/2;z<=d/2+.01;z+=1)l.push({p:V3(-w/2,.35,z),s:.3,c:new THREE.Color(0xff8a1a)},{p:V3(w/2,.35,z),s:.3,c:new THREE.Color(0xff8a1a)});g.add(cubes(l));
 const qs=signTex('?',256,256);const s=sign(new THREE.Group(),V3(0,0,0),label,1.4,0);s.position.set(0,0,0);g.add(s);
 const q=box(1.6,1.6,1.6,0xffd23a,.12);q.position.set(0,6,0);g.add(q);const qf=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.4),new THREE.MeshBasicMaterial({map:qTex()}));qf.position.set(0,6,.82);g.add(qf);const qf2=qf.clone();qf2.rotation.y=Math.PI/2;qf2.position.set(.82,6,0);g.add(qf2);return g}
function qTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#ffd23a';x.fillRect(0,0,128,128);x.fillStyle='#3a2210';x.font='900 100px Montserrat, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('?',64,70);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function roads(G,segs){const l=[];segs.forEach(([x0,z0,x1,z1,w,col])=>{for(let x=x0;x<=x1;x+=1)for(let z=z0;z<=z1;z+=1)l.push({p:V3(x,.06,z),s:.98,c:hsl(col[0],col[1],col[2]+rnd()*.04)})});G.add(cubes(l))}
export const PLAN=()=>{reseed(71);const sc=new THREE.Scene();sc.background=grad([[0,'#7cc8ff'],[1,'#d8f0ff']]);
 sc.add(new THREE.HemisphereLight(0xffffff,0x9ab890,1.3));const d=new THREE.DirectionalLight(0xfff2d8,2.4);d.position.set(30,50,36);d.castShadow=true;d.shadow.mapSize.set(4096,4096);Object.assign(d.shadow.camera,{left:-60,right:60,top:60,bottom:-60,far:200});sc.add(d);
 const gr=[];for(let x=-70;x<=70;x+=2)for(let z=-70;z<=70;z+=2)gr.push({p:V3(x,-1,z),s:1.98,c:hsl(.29+rnd()*.04,.6,.4+rnd()*.06)});sc.add(cubes(gr));
 const G=new THREE.Group();sc.add(G);
 const MAIN=[.08,.35,.5],GANG=[.08,.25,.62];
 // jalan utama (x) & gang (z), blok 2 kavling x 2 baris
 roads(G,[[-40,-1,40,1,3,MAIN],[-1,-30,1,30,3,MAIN],[-23,-30,-22,30,2,GANG],[22,-30,23,30,2,GANG],[-40,-21,40,-20,2,GANG],[-40,20,40,21,2,GANG]]);
 const roofs=[0xc8553d,0x3a7ad8,0x3aa860,0xe0a020,0x9a5ad8,0xd84a8a];let n=1;const filled=4;
 const pos=[];[-1,1].forEach(sx=>[-1,1].forEach(sz=>{for(let i=0;i<2;i++)for(let j=0;j<2;j++){const x=sx*(2+5+i*11),z=sz*(2+4.5+j*9.5);pos.push([x,z,Math.abs(x)+Math.abs(z)])}}));
 pos.sort((a,b)=>a[2]-b[2]);
 // 4 kavling dekat persimpangan jadi lahan fasum, sisanya kavling warga
 const fas=[[ -7,-6.5],[7,-6.5]];
 pos.forEach(([x,z])=>{if(fas.some(([a,b])=>a===x&&b===z))return;const o={n,filled:n<=filled,roof:roofs[n%roofs.length],crop:['gandum','jagung','wortel','tomat'][n%4],fruit:[0xff3a3a,0xffa020,0xffd020][n%3],coop:n%2===0};lot(G,x,z,o);n++});
 fasumLot(G,-7,-6.5,10,9,'LAHAN FASUM');fasumLot(G,7,-6.5,10,9,'LAHAN FASUM');
 // lapangan/alun-alun kosong di ujung + lahan fasum besar
 fasumLot(G,-31,-10,14,18,'LAHAN FASUM');fasumLot(G,31,10,14,18,'LAHAN FASUM');
 sign(sc,V3(3.5,0,30),'DUNIA KOTAK',1.6,0);
 [[-46,-36],[46,-36],[-30,-36]].forEach(([x,z])=>btree(sc,x,z,1.6));
 const z=31;const cam=new THREE.OrthographicCamera(-z,z,z,-z,.1,400);const k=100;cam.position.set(k,k*.9,k);cam.lookAt(0,0,2);return {sc,cam}};
// ---- denah presisi v2: grid pasti + cek tabrakan ----
const LOT_W=10,LOT_D=9,LOT_GAP=1,MARGIN=.5,MAIN_W=4,GANG_W=2;
function lot2(G,cx,cz,rot,o){const g=new THREE.Group();g.position.set(cx,0,cz);g.rotation.y=rot;G.add(g);const hw=LOT_W/2,hd=LOT_D/2;
 const LH=o.lh||.1;const lawn=box(LOT_W,LH,LOT_D,o.filled?0x7ccc52:0x9ad870,.02);lawn.position.y=LH/2;g.add(lawn);
 const pk=[];const gate=x=>x>-2.9&&x<-1.1;for(let x=-hw+.25;x<=hw-.25+.01;x+=.5){if(!gate(x))pk.push(V3(x,.4,hd-.15));pk.push(V3(x,.4,-hd+.15))}for(let z=-hd+.25;z<=hd-.25+.01;z+=.5){pk.push(V3(-hw+.15,.4,z));pk.push(V3(hw-.15,.4,z))}
 const fh=o.fh||.8;if(o.fh)pk.forEach(q=>q.y=fh/2);const pm=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,fh,.12),new THREE.MeshStandardMaterial({color:o.filled?0xffffff:0xd8c8a8}),pk.length);pk.forEach((p,i)=>{M4.compose(p,new THREE.Quaternion(),new THREE.Vector3(1,1,1));pm.setMatrixAt(i,M4)});pm.castShadow=true;g.add(pm);
 if(o.filled){const h=fullHouse(new THREE.Group(),V3(0,0,0),{roof:o.roof});h.scale.setScalar(.4);h.position.set(-2,0,-.6);g.add(h);
   cropField(g,1.5,-3.6,3,3,o.crop);if(!TIPIS){const k=new THREE.Group();kandang(k,0,0);k.scale.setScalar(.45);k.position.set(3,0,-.2);g.add(k)}fruitTree(g,3.4,3,o.fruit)}
 else{const st=new THREE.Mesh(new THREE.BoxGeometry(1.1,.9,1.1),[0,1,2,3,4,5].map(k=>new THREE.MeshStandardMaterial({color:0x9a9a9a,map:(k===2||k===4)?numTex(o.n):null})));st.position.set(-2,.45,hd-1.3);st.castShadow=true;g.add(st)}
 return g}
function fasum2(G,cx,cz,w,d){const g=new THREE.Group();g.position.set(cx,0,cz);G.add(g);const FH=TIPIS||.1;const gr=box(w,FH,d,0xd9c39a,.02);gr.position.y=FH/2;g.add(gr);
 const l=[];const st=(a,b)=>l.push({p:V3(a,.3,b),s:.28,c:new THREE.Color(0xff8a1a)});for(let x=-w/2+.4;x<=w/2-.4+.01;x+=1){st(x,-d/2+.4);st(x,d/2-.4)}for(let z=-d/2+.4;z<=d/2-.4+.01;z+=1){st(-w/2+.4,z);st(w/2-.4,z)}g.add(cubes(l));
 g.add(sign(new THREE.Group(),V3(0,0,0),'LAHAN FASUM',1.3,0));const q=box(1.5,1.5,1.5,0xffd23a,.12);q.position.set(0,5.6,0);g.add(q);
 [[0,0,.77],[Math.PI/2,.77,0]].forEach(([ry,x,z])=>{const f=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.3),new THREE.MeshBasicMaterial({map:qTex()}));f.rotation.y=ry;f.position.set(x,5.6,z);g.add(f)})}
export const PLAN2=()=>{reseed(81);const sc=new THREE.Scene();sc.background=grad([[0,'#7cc8ff'],[1,'#d8f0ff']]);
 sc.add(new THREE.HemisphereLight(0xffffff,0x9ab890,1.3));const d=new THREE.DirectionalLight(0xfff2d8,2.4);d.position.set(30,50,36);d.castShadow=true;d.shadow.mapSize.set(4096,4096);Object.assign(d.shadow.camera,{left:-70,right:70,top:70,bottom:-70,far:220});sc.add(d);
 const G=new THREE.Group();sc.add(G);
 // grid: 3 kolom blok x 2 baris blok; blok = 2x2 kavling
 const BW=2*LOT_W+LOT_GAP,BD=2*LOT_D+LOT_GAP;const cols=3,rows=2;
 const roadW=i=>(i===0||i===cols)?GANG_W:MAIN_W, roadD=i=>(i===0||i===rows)?GANG_W:MAIN_W;
 const xs=[];let x=0;const vroads=[];for(let i=0;i<=cols;i++){vroads.push([x,x+roadW(i)]);x+=roadW(i);if(i<cols){xs.push(x+MARGIN);x+=MARGIN+BW+MARGIN}}const TW=x;
 const zs=[];let z=0;const hroads=[];for(let j=0;j<=rows;j++){hroads.push([z,z+roadD(j)]);z+=roadD(j);if(j<rows){zs.push(z+MARGIN);z+=MARGIN+BD+MARGIN}}const TD=z;
 const ox=-TW/2,oz=-TD/2;const rects=[];const R=(n,x0,z0,x1,z1)=>rects.push({n,x0:x0+ox,z0:z0+oz,x1:x1+ox,z1:z1+oz});
 // tanah dasar
 const gr=[];for(let gx=-80;gx<=80;gx+=2)for(let gz=-80;gz<=80;gz+=2)gr.push({p:V3(gx,-1,gz),s:1.98,c:hsl(.29+rnd()*.04,.6,.4+rnd()*.06)});sc.add(cubes(gr));
 // jalan
 const rl=[];const paint=(x0,z0,x1,z1,col)=>{for(let a=x0+.5;a<x1;a+=1)for(let b=z0+.5;b<z1;b+=1)rl.push({p:V3(a+ox,.06,b+oz),s:.98,c:hsl(col[0],col[1],col[2]+rnd()*.03)})};
 vroads.forEach(([a,b],i)=>paint(a,0,b,TD,roadW(i)===MAIN_W?[.08,.35,.5]:[.08,.25,.62]));hroads.forEach(([a,b],j)=>paint(0,a,TW,b,roadD(j)===MAIN_W?[.08,.35,.5]:[.08,.25,.62]));G.add(cubes(rl));
 vroads.forEach(([a,b])=>R('jalan',a,0,b,TD));hroads.forEach(([a,b])=>R('jalan',0,a,TW,b));
 const roofs=[0xc8553d,0x3a7ad8,0x3aa860,0xe0a020,0x9a5ad8,0xd84a8a];let n=1;const filledSet=new Set([1,2,3,4]);
 // blok tengah atas = lahan fasum penuh, blok tengah bawah: baris belakang 2 lahan fasum
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const bx=xs[i],bz=zs[j];
  if(i===1&&j===0){fasum2(G,bx+BW/2+ox,bz+BD/2+oz,BW,BD);R('fasum',bx,bz,bx+BW,bz+BD);continue}
  for(let r=0;r<2;r++)for(let c=0;c<2;c++){const x0=bx+c*(LOT_W+LOT_GAP),z0=bz+r*(LOT_D+LOT_GAP);const cx=x0+LOT_W/2+ox,cz=z0+LOT_D/2+oz;
   if(i===1&&j===1&&r===0){fasum2(G,cx,cz,LOT_W,LOT_D);R('fasum',x0,z0,x0+LOT_W,z0+LOT_D);continue}
   const rot=r===0?Math.PI:0; // baris depan menghadap jalan bawah, baris belakang menghadap jalan atas
   lot2(G,cx,cz,rot,{n,filled:filledSet.has(n),roof:roofs[n%roofs.length],crop:['gandum','jagung','wortel','tomat'][n%4],fruit:[0xff3a3a,0xffa020,0xffd020][n%3]});R('kavling'+n,x0,z0,x0+LOT_W,z0+LOT_D);n++}}
 // cek tabrakan: tidak ada dua persegi (selain jalan-jalan) yang tumpang tindih
 const bad=[];for(let a=0;a<rects.length;a++)for(let b=a+1;b<rects.length;b++){const A=rects[a],B=rects[b];if(A.n==='jalan'&&B.n==='jalan')continue;const ix=Math.min(A.x1,B.x1)-Math.max(A.x0,B.x0),iz=Math.min(A.z1,B.z1)-Math.max(A.z0,B.z0);if(ix>1e-6&&iz>1e-6)bad.push(A.n+'x'+B.n)}
 window.PLANCHECK={bad,lots:n-1,TW,TD};
 sign(sc,V3(xs[1]+BW/2+ox+3.5,0,TD/2+3),'DUNIA KOTAK',1.6,0);
 [[-TW/2-8,-TD/2-6],[TW/2+8,-TD/2-6],[-TW/2-10,6]].forEach(([a,b])=>btree(sc,a,b,1.6));
 const close=window.PLAN_CLOSE;const zz=close?17:27;const ax=close?1:16/9;const cam=new THREE.OrthographicCamera(-zz*ax,zz*ax,zz,-zz,.1,500);const k=120;const tg=close?V3(xs[0]+BW/2+ox,0,zs[0]+BD/2+oz):V3(0,0,0);cam.position.set(tg.x+k,k*.9,tg.z+k);cam.lookAt(tg);return {sc,cam}};
// ---- kucing kotak (teman Raka) ----
function catFace(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#f0a050';x.fillRect(0,0,128,128);x.fillStyle='#fff3e0';x.fillRect(34,66,60,40);
 x.fillStyle='#1a1a1a';x.fillRect(30,44,16,20);x.fillRect(82,44,16,20);x.fillStyle='#fff';x.fillRect(34,46,5,6);x.fillRect(86,46,5,6);x.fillStyle='#ff7a8a';x.fillRect(58,70,12,8);
 x.strokeStyle='#3a2210';x.lineWidth=4;x.beginPath();x.moveTo(64,78);x.lineTo(64,86);x.moveTo(52,90);x.quadraticCurveTo(64,96,76,90);x.stroke();
 x.strokeStyle='#3a2210';x.lineWidth=2;[[20,74,4,70],[20,82,4,84],[108,74,124,70],[108,82,124,84]].forEach(([a,b,c2,d])=>{x.beginPath();x.moveTo(a,b);x.lineTo(c2,d);x.stroke()});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
export function cat(){const g=new THREE.Group();const fur=0xf0a050,dark=0xc87830;
 const body=box(1.6,.9,.9,fur,.12);body.position.set(0,.75,0);g.add(body);[[-.5,.3],[.5,.3]].forEach(([a])=>{});
 [-.55,.55].forEach(x=>[-.3,.3].forEach(z=>{const l=box(.28,.5,.28,fur,.06);l.position.set(x,.25,z);g.add(l);const p=box(.3,.12,.32,0xfff3e0,.04);p.position.set(x,.06,z+.02);g.add(p)}));
 [-.3,.3].forEach(x=>{const s=box(.2,.92,.92,dark,.06);s.position.set(x,.76,0);s.scale.set(.5,1,1);g.add(s)});
 const head=new THREE.Group();head.position.set(.95,1.3,0);g.add(head);const hd=box(.9,.8,.85,fur,.1);head.add(hd);
 const fm=new THREE.Mesh(new THREE.PlaneGeometry(.8,.7),new THREE.MeshStandardMaterial({map:catFace(),roughness:.7}));fm.position.set(.455,0,0);fm.rotation.y=Math.PI/2;head.add(fm);
 [-.25,.25].forEach(z=>{const e=prism(.3,.32,.14,fur);e.position.set(0,.4,z);e.rotation.y=Math.PI/2;head.add(e);const ei=prism(.16,.18,.15,0xff9aa8);ei.position.set(.02,.42,z);ei.rotation.y=Math.PI/2;head.add(ei)});
 const tail=new THREE.Group();tail.position.set(-.8,1,0);g.add(tail);for(let i=0;i<4;i++){const t=box(.2,.2,.2,i%2?dark:fur,.05);t.position.set(-.1-i*.08,i*.2,0);tail.add(t)}
 g.userData={head,tail};return g}
export const CATSHOT=()=>{reseed(3);const {sc,cam}=base(blue(),0xcfeaff,[60,200]);world(sc);sign(sc,V3(-.6,0,0),'PENDUDUK: 1',.9,.1);const R=raka('normal');R.position.set(1.3,0,1.6);R.rotation.y=-.3;pose(R,{armR:-.6,armRz:-.5});sc.add(R);
 const C=cat();C.position.set(-.9,3.2,.15);C.rotation.y=-Math.PI/2+.35;C.scale.setScalar(.8);sc.add(C);look(cam,V3(.3,3,10),V3(0,2.3,0));return {sc,cam}};
// batu nama kosong close-up (open loop)
export const STONESHOT=()=>{reseed(9);const {sc,cam}=base(blue(),0xcfeaff,[60,200]);world(sc);const st=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.3,1.1),[0,1,2,3,4,5].map(k=>new THREE.MeshStandardMaterial({color:0x9a9a9a,roughness:.9,map:k===4?qTex2():null})));st.position.set(0,.65,0);st.castShadow=true;sc.add(st);
 const C=cat();C.scale.setScalar(.7);C.position.set(1.5,0,.9);C.rotation.y=-Math.PI/2-.3;sc.add(C);look(cam,V3(.5,2.4,7.2),V3(.4,1.6,0));return {sc,cam}};
function qTex2(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#9a9a9a';x.fillRect(0,0,256,256);x.strokeStyle='#6a6a6a';x.lineWidth=6;x.setLineDash([14,10]);x.strokeRect(30,60,196,120);x.setLineDash([]);x.fillStyle='#4a4a4a';x.font='900 72px Montserrat, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('?????',128,122);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
// ===== DESA SESUAI DENAH (PLAN2) dalam skala karakter: 1 unit denah = 5 unit dunia =====
export const VS=5;
function vTree(G,x,z,s=1){const t=new THREE.Group();const k=box(.5,2,.5,0x7a4a2a,.04);k.position.y=1;t.add(k);[[0,2.6,0,2.2],[.7,2.3,.4,1.4],[-.7,2.4,-.3,1.5],[0,3.4,0,1.3]].forEach(([a,b,c,q])=>{const m=box(q,q,q,0x4fae3c,.12);m.position.set(a,b,c);t.add(m)});t.position.set(x,0,z);t.scale.setScalar(s);G.add(t)}
let TIPIS=0;
// dusun lain (Kulon, Curug) tidak memanggil village(): pakai ini supaya tanah kavling & bedeng kebun tetap tipis
export function aturTipis(v){TIPIS=v||0}
export function village(sc,o={}){const stage=o.raka||'done';TIPIS=o.tipis||0;
 sc.add(new THREE.HemisphereLight(0xffffff,0x9ab890,1.25));const d=new THREE.DirectionalLight(o.warm||0xfff2d8,2.4);const f=o.focus||V3(0,0,0);d.position.set(f.x+60,100,f.z+72);d.target.position.copy(f);sc.add(d.target);d.castShadow=true;d.shadow.mapSize.set(o.sm||4096,o.sm||4096);const R0=o.shadowR||70;Object.assign(d.shadow.camera,{left:-R0,right:R0,top:R0,bottom:-R0,far:400});d.shadow.bias=-.0004;sc.add(d);
 const G=new THREE.Group();G.scale.setScalar(VS);sc.add(G);
 const BW=2*LOT_W+LOT_GAP,BD=2*LOT_D+LOT_GAP;const cols=o.cols||3,rows=o.rows||2;
 const roadW=i=>(i===0||i===cols)?GANG_W:MAIN_W, roadD=i=>(i===0||i===rows)?GANG_W:MAIN_W;
 const xs=[];let x=0;const vroads=[];for(let i=0;i<=cols;i++){vroads.push([x,x+roadW(i)]);x+=roadW(i);if(i<cols){xs.push(x+MARGIN);x+=MARGIN+BW+MARGIN}}const TW=x;
 const zs=[];let z=0;const hroads=[];for(let j=0;j<=rows;j++){hroads.push([z,z+roadD(j)]);z+=roadD(j);if(j<rows){zs.push(z+MARGIN);z+=MARGIN+BD+MARGIN}}const TD=z;
 const ox=-TW/2,oz=-TD/2;
 if(!o.sungai){const NX=141,NZ=126,px=8;const cv=document.createElement('canvas');cv.width=NX*px;cv.height=NZ*px;const cx=cv.getContext('2d');cx.fillStyle='#4f8f3a';cx.fillRect(0,0,cv.width,cv.height);
 for(let i=0;i<NX;i++)for(let j=0;j<NZ;j++){cx.fillStyle='#'+hsl(.29+rnd()*.04,.6,.4+rnd()*.06).getHexString();cx.fillRect(i*px+.6,j*px+.6,px-1.2,px-1.2)}
 const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=8;const pm=new THREE.Mesh(new THREE.PlaneGeometry(NX*2,NZ*2),new THREE.MeshStandardMaterial({map:tx,roughness:.9}));pm.rotation.x=-Math.PI/2;pm.position.set(0,-.02,-15);pm.receiveShadow=true;G.add(pm)}
 const rl=[];const paint=(x0,z0,x1,z1,col)=>{for(let a=x0+.5;a<x1;a+=1)for(let b=z0+.5;b<z1;b+=1)rl.push({p:V3(a+ox,.06,b+oz),s:.98,c:hsl(col[0],col[1],col[2]+rnd()*.03)})};
 const info0={};if(o.sungai){const S=o.sungai;const rx0=TW+S.gap,rx1=rx0+S.w;const z0=-320,z1=TD+320;
  const wm=new THREE.Mesh(new THREE.BoxGeometry(rx1-rx0,.3,z1-z0),new THREE.MeshStandardMaterial({color:0x3f9be0,roughness:.6}));wm.position.set((rx0+rx1)/2+ox,-.05,(z0+z1)/2+oz);wm.receiveShadow=true;G.add(wm);
  [rx0-1,rx1+1].forEach(bx=>{const bk=new THREE.Mesh(new THREE.BoxGeometry(2,.35,z1-z0),new THREE.MeshStandardMaterial({color:0xb8a57a,roughness:.9}));bk.position.set(bx+ox,.05,(z0+z1)/2+oz);G.add(bk)});
  // jalan + jembatan di setiap jalan utama mendatar
  hroads.forEach(([a,b],j)=>{if(roadD(j)!==MAIN_W)return;paint(TW,a,rx0-2,b,[.08,.35,.5]);const br=new THREE.Mesh(new THREE.BoxGeometry(rx1-rx0+4,.6,b-a+1),new THREE.MeshStandardMaterial({color:0x9a6a3a,roughness:.8}));br.position.set((rx0+rx1)/2+ox,.35,(a+b)/2+oz);br.castShadow=true;G.add(br);
   [a-.2,b+.2].forEach(zz=>{const rl2=new THREE.Mesh(new THREE.BoxGeometry(rx1-rx0+4,.8,.3),new THREE.MeshStandardMaterial({color:0x6a4424}));rl2.position.set((rx0+rx1)/2+ox,1,zz+oz);G.add(rl2)})});
  // sawah di seberang sungai + saluran irigasi
  const sx0=rx1+3,sx1=sx0+S.sawah;for(let z=0;z<TD;z+=24){const pd=new THREE.Mesh(new THREE.BoxGeometry(sx1-sx0,.2,20),new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.24+((z/24)%2)*.04,.55,.45),roughness:.9}));pd.position.set((sx0+sx1)/2+ox,.08,z+10+oz);pd.receiveShadow=true;G.add(pd);
   for(let zz=z+1.5,q=0;zz<z+19;zz+=2.2,q++){const rb=box(sx1-sx0-2,.5,1.1,hsl(.25,.55,.38+(q%2)*.04),.05);rb.position.set((sx0+sx1)/2+ox,.45,zz+oz);rb.castShadow=false;G.add(rb)}
   const ch=new THREE.Mesh(new THREE.BoxGeometry(sx1-sx0+3,.25,1.4),new THREE.MeshStandardMaterial({color:0x4aa6e8,roughness:.3}));ch.position.set((sx0+sx1)/2+ox-1.5,.1,z+21.8+oz);G.add(ch)}
  const ga=new THREE.Mesh(new THREE.BoxGeometry(TW+2*(S.gap+S.w+S.sawah+120),.1,TD+400),new THREE.MeshStandardMaterial({color:0x5a9a40,roughness:.95}));ga.position.set(0+ox+TW/2,-.04,TD/2+oz);ga.receiveShadow=true;G.add(ga);
  if(o.hutan){const tx=(xs[2]+BW/2);paint(tx-3,TD,tx+3,TD+260,[.08,.35,.5]);hutan(G,hutanPts({x0:-14+ox,x1:sx1+10+ox,z0:-16+oz,z1:TD+16+oz,W:240,st:8,skip:(x,z)=>(x>rx0-11+ox&&x<rx1+11+ox)||(z>TD+oz&&Math.abs(x-(tx+ox))<20)}))}
  info0.river=V3(((rx0+rx1)/2+ox)*VS,0,(TD*.5+oz)*VS);info0.sawah=V3(((sx0+sx1)/2+ox)*VS,0,(TD*.5+oz)*VS)}
 vroads.forEach(([a,b],i)=>paint(a,0,b,TD,roadW(i)===MAIN_W?[.08,.35,.5]:[.08,.25,.62]));hroads.forEach(([a,b],j)=>paint(0,a,TW,b,roadD(j)===MAIN_W?[.08,.35,.5]:[.08,.25,.62]));const rm=cubes(rl);rm.scale.y=.12;G.add(rm);
 // urutan kavling: kavling Raka (blok kiri atas, baris depan kanan = pojok perempatan) = no. 1
 const L=[];for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const bx=xs[i],bz=zs[j];
  if((i===1&&j===0)||(o.fasumB&&o.fasumB.some(([a2,b2])=>a2===i&&b2===j))){fasum2(G,bx+BW/2+ox,bz+BD/2+oz,BW,BD);(info0.fas=info0.fas||[]).push(V3((bx+BW/2+ox)*VS,0,(bz+BD/2+oz)*VS));continue}
  for(let r=0;r<2;r++)for(let c=0;c<2;c++){const x0=bx+c*(LOT_W+LOT_GAP),z0=bz+r*(LOT_D+LOT_GAP);const cx=x0+LOT_W/2+ox,cz=z0+LOT_D/2+oz;
   if(i===1&&j===1&&r===0){fasum2(G,cx,cz,LOT_W,LOT_D);continue}
   if(o.fasumH&&o.fasumH.some(([a2,b2,r2])=>a2===i&&b2===j&&r2===r)){fasum2(G,cx,cz,LOT_W,LOT_D);if(c===0)(info0.fas=info0.fas||[]).push(V3((bx+BW/2+ox)*VS,0,cz*VS));continue}
   L.push({cx,cz,rot:r===0?Math.PI:0,raka:i===0&&j===0&&r===1&&c===1})}}
 let n=2;L.forEach(l=>{l.n=l.raka?1:n++});
 const roofs=[0xc8553d,0x3a7ad8,0x3aa860,0xe0a020,0x9a5ad8,0xd84a8a];const info={lots:{},TW,TD,ox,oz,xs,zs,light:d,fas:info0.fas,river:info0.river,sawah:info0.sawah};
 const bl=l=>{let g;
  if(l.raka&&stage!=='none'){g=lot2(G,l.cx,l.cz,l.rot,{lh:TIPIS||undefined,n:1,filled:true,fh:.32,roof:0xc8553d,crop:'wortel',fruit:0xff3a3a});
   if(stage==='build'){g.children.slice(3).forEach(c=>g.remove(c));const h=g.children[2];h.children.forEach(c=>{if(c.position.y>1.5)c.visible=false});const hw=box(5,1.2,4,0xf1dcb4,.05);hw.position.y=.35+.6;h.add(hw);info.hw=hw;
    const pl=[];for(let i=0;i<14;i++)pl.push({p:V3(2.2+(i%3)*.5,(Math.floor(i/3)%2)*.5+.25,-2.5+Math.floor(i/6)*.5),s:.48,c:hsl(.09,.45,.72+rnd()*.06)});info.pile=cubes(pl);g.add(info.pile)}}
  else if(o.filled&&l.n<=o.filled&&(!o.isFilled||o.isFilled(l.n))){const roofs2=[0xc8553d,0x3a7ad8,0x3aa860,0xe0a020,0x9a5ad8,0xd84a8a,0x2a9a9a,0xe06a2a];const RC=(o.roofs&&o.roofs[l.n])||roofs2[(l.n*5)%roofs2.length];
   g=lot2(G,l.cx,l.cz,l.rot,{lh:TIPIS||undefined,n:l.n,filled:true,fh:.32,roof:RC,crop:['wortel','gandum','jagung','tomat'][l.n%4],fruit:[0xff3a3a,0xffa020,0xffe040][l.n%3]});
   const nm=o.names&&o.names[l.n];const st=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.15,.45),[0,1,2,3,4,5].map(k=>new THREE.MeshStandardMaterial({color:k===4?0xffffff:0x9a9a9a,roughness:.9,map:k===4?nameTex(nm||'',l.n):null})));st.position.set(.2,.58,LOT_D/2-.5);st.castShadow=true;g.add(st);
   info.filledLots=info.filledLots||{};info.filledLots[l.n]=g;
   if(o.hide&&o.hide(l.n))g.visible=false}
  else{g=lot2(G,l.cx,l.cz,l.rot,{lh:TIPIS||undefined,n:l.n,filled:false,fh:.32});
   if(o.stoneName&&o.stoneName.n===l.n){const st=g.children[g.children.length-1];const nt=nameTex(o.stoneName.name,l.n);st.material=st.material.map((m,k)=>k===4?new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9,map:nt}):k===2?new THREE.MeshStandardMaterial({color:0x9a9a9a,roughness:.9}):m)}
   if(o.blank&&o.blank===l.n){const st=g.children[g.children.length-1];st.material=st.material.map((m,k)=>k===4||k===2?new THREE.MeshStandardMaterial({color:0x9a9a9a,roughness:.9,map:qTex2()}):m)}}
  return g};
 L.forEach(l=>{if(!o.lazy)bl(l);
  const hd=LOT_D/2,dir=l.rot===0?1:-1;info.lots[l.n]={c:V3(l.cx*VS,0,l.cz*VS),gate:V3((l.cx+(l.rot===0?-2:2))*VS,0,(l.cz+dir*hd)*VS),stone:V3((l.cx+(l.rot===0?-2:2))*VS,0,(l.cz+dir*(hd-1.3))*VS),dir}});
 [[-TW/2-6,-TD/2-4,1.3],[TW/2+6,-TD/2-5,1.4],[-TW/2-8,4,1.2],[TW/2+7,8,1.3],[-TW/2-5,TD/2+6,1.1],[TW/2+4,TD/2+7,1.2],[-20,-TD/2-7,1.2],[18,-TD/2-8,1.4]].forEach(([a,b,s])=>vTree(G,a,b,s));
 info.buildLot=n=>{const l=L.find(x=>x.n===n);return l?bl(l):null};info.G=G;info.vroads=vroads;info.hroads=hroads;
 info.cross=V3((vroads[1][0]+2+ox)*VS,0,(hroads[1][0]+2+oz)*VS);info.fasum=V3(0,0,(zs[0]+BD/2+oz)*VS);info.entry=V3((xs[1]+BW/2+ox+3.5)*VS,0,(TD/2+3)*VS);
 [[-160,120,-420],[120,140,-460],[0,160,-520],[260,120,-380]].forEach(([a,b,c])=>{const cl=cloud(sc,a,b,c,8);cl.scale.setScalar(3)});
 return info}
const vbase=(bg)=>{const {sc,cam}=base(bg||blue(),0xcfeaff,[320,900]);cam.far=2000;cam.updateProjectionMatrix();return {sc,cam}};
export const VSHOT=[
 // 1 EWS establishing: desa kosong (semua kavling batu nomor)
 ()=>{reseed(101);const {sc,cam}=vbase();const I=village(sc,{raka:'none',shadowR:240,focus:V3(0,0,0)});sun(sc,V3(-160,230,-620),30);look(cam,V3(70,300,230),V3(-30,0,-20));return {sc,cam,I}},
 // 2 WS sudut rendah: Raka melambai di perempatan
 ()=>{reseed(102);const {sc,cam}=vbase();const I=village(sc,{raka:'none',focus:V3(-65,0,0)});const c=I.cross;const R=raka('senang');R.position.set(c.x,0,c.z+4);pose(R,{armR:-2.7,armRz:-.35});sc.add(R);look(cam,V3(c.x+5,3.2,c.z+17),V3(c.x-1,3.6,c.z));return {sc,cam,I}},
 // 3 MS dua tokoh: kucing di atas papan PENDUDUK
 ()=>{reseed(103);const {sc,cam}=vbase();const I=village(sc,{raka:'none',focus:V3(-65,0,0)});const c=I.cross;const p=V3(c.x+8,0,c.z+6);sign(sc,p,'PENDUDUK: 1',.9,-.25);const R=raka('normal');R.position.set(p.x+2.1,0,p.z+1.8);R.rotation.y=-.45;pose(R,{armR:-.6,armRz:-.5});sc.add(R);
  const C=cat();C.position.set(p.x-.3,3.2,p.z+.1);C.rotation.y=-Math.PI/2+.1;C.scale.setScalar(.8);sc.add(C);look(cam,V3(p.x+2.4,3.1,p.z+10.5),V3(p.x+.9,2.4,p.z));return {sc,cam,I}},
 // 4 OTS: Raka menunjuk kavling kosong bernomor
 ()=>{reseed(104);const {sc,cam}=vbase();const I=village(sc,{raka:'none',focus:V3(-65,0,0)});const g=I.lots[1].gate;const R=raka('senang');R.position.set(g.x+7.5,0,g.z+1);R.rotation.y=-2.45;pose(R,{armR:-1.6,armRz:0});sc.add(R);look(cam,V3(g.x+6,4.2,g.z+19),V3(g.x+3.5,3,g.z-3));return {sc,cam,I}},
 // 5 CU insert: batu nama kosong + kucing
 ()=>{reseed(105);const {sc,cam}=vbase();const I=village(sc,{raka:'none',blank:4,focus:V3(-120,0,-20)});const s=I.lots[4].stone;const C=cat();C.position.set(s.x+4.4,0,s.z+2.2);C.rotation.y=-Math.PI/2-.5;sc.add(C);look(cam,V3(s.x+3,3.4,s.z+21),V3(s.x+2.2,2.4,s.z));return {sc,cam,I}},
 // 6 WS sudut tinggi statis: timelapse membangun rumah di kavling 1
 ()=>{reseed(106);const {sc,cam}=vbase();const I=village(sc,{raka:'build',focus:V3(-102,0,-35)});const c=I.lots[1].c;const R=raka('serius');R.position.set(c.x-1,0,c.z+12);R.rotation.y=Math.PI*.8;pose(R,{armL:-1.6,armR:-1.6});sc.add(R);look(cam,V3(c.x+22,26,c.z+52),V3(c.x-6,1,c.z+2));return {sc,cam,I}},
 // 7 MS: rumah jadi di kavling 1 sesuai denah, Raka di gerbang
 ()=>{reseed(107);const {sc,cam}=vbase(grad([[0,'#ff9a5a'],[.6,'#ffc98a'],[1,'#ffe7c4']]));sc.fog.color.set(0xffd8b0);const I=village(sc,{raka:'done',warm:0xffd0a0,focus:V3(-102,0,-35)});const c=I.lots[1].c,g=I.lots[1].gate;const R=raka('normal');R.position.set(g.x+1,0,g.z+2.5);sc.add(R);look(cam,V3(g.x+8,6,g.z+26),V3(c.x-6,4,c.z+4));return {sc,cam,I}},
 // 8 CTA: papan PENDUDUK 1 -> ? , desa kosong di belakang (sudut rendah)
 ()=>{reseed(108);const {sc,cam}=vbase();const I=village(sc,{raka:'done',focus:V3(-65,0,0),shadowR:120});const c=I.cross;const p=V3(c.x+10,0,c.z+6);sign(sc,p,'PENDUDUK: 1 → ?',1,-.2);look(cam,V3(p.x+7.4,2.9,p.z+6.8),V3(p.x-1.2,3.6,p.z));return {sc,cam,I}},
];
// batu nama: ukiran username (teks dari canvas, ukuran otomatis menyesuaikan panjang nama)
function stoneBase(x,W,H){x.fillStyle='#9a9a9a';x.fillRect(0,0,W,H);for(let i=0;i<900;i++){const g=120+Math.floor(rnd()*60);x.fillStyle=`rgba(${g},${g},${g},.35)`;x.fillRect(rnd()*W,rnd()*H,3+rnd()*6,3+rnd()*6)}
 x.strokeStyle='#7a7a7a';x.lineWidth=8;x.strokeRect(34,34,W-68,H-68)}
function carve(x,t,cx,cy,size,maxW){x.font=`900 ${size}px Montserrat, sans-serif`;let w=x.measureText(t).width;if(w>maxW){size=Math.floor(size*maxW/w);x.font=`900 ${size}px Montserrat, sans-serif`}
 x.textAlign='center';x.textBaseline='middle';x.fillStyle='rgba(255,255,255,.45)';x.fillText(t,cx+3,cy+4);x.fillStyle='#3c3c3c';x.fillText(t,cx,cy);x.fillStyle='rgba(0,0,0,.35)';x.fillText(t,cx-2,cy-2)}
export function nameTex(name,n){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');reseed(5);stoneBase(x,512,512);
 if(name){carve(x,'WARGA No. '+n,256,150,40,400);x.fillStyle='#6a6a6a';x.fillRect(150,195,212,6);carve(x,name,256,290,74,410);carve(x,'HARI 1',256,390,30,300)}
 else{carve(x,'WARGA No. '+n,256,170,40,400);x.strokeStyle='#707070';x.lineWidth=5;x.setLineDash([16,12]);x.strokeRect(90,240,332,110);x.setLineDash([]);carve(x,'? ? ?',256,296,46,300)}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
const nameStone=(I,sc,n,name)=>{};
export const NAMESHOT=(name)=>{reseed(105);const {sc,cam}=vbase();const I=village(sc,{raka:'none',focus:V3(-120,0,-20),stoneName:{n:4,name}});const s=I.lots[4].stone;const C=cat();C.position.set(s.x+4.4,0,s.z+2.2);C.rotation.y=-Math.PI/2-.5;sc.add(C);look(cam,V3(s.x+1.8,3.2,s.z+20),V3(s.x+1.6,2.5,s.z));return {sc,cam}};

// ===== VIDEO HARI 1: shot beranimasi (p = 0..1 dalam shot, T = detik global) =====
const lerpV=(a,b,t)=>V3(L(a.x,b.x,t),L(a.y,b.y,t),L(a.z,b.z,t));
export const ANIM=[
 // SC01 EWS crane down + push in
 ()=>{reseed(101);const {sc,cam}=vbase();sc.fog.near=650;sc.fog.far=1700;const I=village(sc,{raka:'none',shadowR:240,sm:2048});sun(sc,V3(-160,230,-620),30);
  return {sc,cam,up:(p)=>{const e=E(p);look(cam,lerpV(V3(110,400,320),V3(55,250,185),e),lerpV(V3(-25,0,-25),V3(-32,0,-18),e))}}},
 // SC02 Raka masuk lalu melambai, sudut rendah
 ()=>{reseed(102);const {sc,cam}=vbase();const I=village(sc,{raka:'none',focus:V3(-65,0,0),sm:2048});const c=I.cross;const R=raka('senang');sc.add(R);
  return {sc,cam,up:(p,T,d)=>{const t=p*d;const w=C01(t/1.1);R.position.set(c.x+L(7,0,E(w)),0,c.z+4);R.rotation.y=w<1?-1.2*(1-w)+0:0;
   if(w<1)run(R,t*14,.7);else{const k=Math.sin((t-1.1)*9);pose(R,{armR:-2.7+k*.25,armRz:-.35-k*.15,head:.05})}
   look(cam,V3(c.x+5-p*.8,3.2,c.z+17-p*1.5),V3(c.x-1,3.6,c.z))},tags:[[R,'★ Raka',4.7]]}},
 // SC03 kucing di atas papan PENDUDUK, push in
 ()=>{reseed(103);const {sc,cam}=vbase();const I=village(sc,{raka:'none',focus:V3(-65,0,0),sm:2048});const c=I.cross;const q=V3(c.x+8,0,c.z+6);sign(sc,q,'PENDUDUK: 1',.9,-.25);const R=raka('normal');R.position.set(q.x+2.1,0,q.z+1.8);R.rotation.y=-.45;sc.add(R);
  const C=cat();C.position.set(q.x-.3,3.2,q.z+.1);C.scale.setScalar(.8);sc.add(C);
  return {sc,cam,up:(p,T,d)=>{const t=p*d;pose(R,{armR:-.6+Math.sin(t*2)*.05,armRz:-.5,headY:p>.45?-.5:0});C.rotation.y=-Math.PI/2+.1+(p>.8?.9*E(C01((p-.8)/.08)):0);C.userData.tail.rotation.z=Math.sin(t*3)*.3;
   look(cam,lerpV(V3(q.x+2.4,3.1,q.z+10.5),V3(q.x+1.4,3.4,q.z+7.6),E(p)),V3(q.x+.9-p*.6,2.4+p*.5,q.z))},tags:[[R,'★ Raka',4.7],[C,'Kucing · belum ber-KTP',2.2]]}},
 // SC04 Raka menunjuk batu kavling 1, kamera pan
 ()=>{reseed(104);const {sc,cam}=vbase();const I=village(sc,{raka:'none',focus:V3(-110,0,-15),sm:2048});const g=I.lots[1].gate;const R=raka('senang');R.position.set(g.x+7.5,0,g.z+1);R.rotation.y=-2.45;sc.add(R);
  return {sc,cam,up:(p,T,d)=>{const t=p*d;const a=C01(t/.8);pose(R,{armR:L(0,-1.6,E(a)),armRz:0,head:-.05});
   look(cam,V3(g.x+6.5-p*1,4.2,g.z+19-p*2),lerpV(V3(g.x+6.5,3.2,g.z-1),V3(g.x+3.8,3,g.z-3),E(C01(p*1.6))))},tags:[[R,'★ Raka',4.7]]}},
 // SC05 batu nama kosong + kucing, zoom pelan
 ()=>{reseed(105);const {sc,cam}=vbase();const I=village(sc,{raka:'none',focus:V3(-120,0,-20),stoneName:{n:4,name:''},sm:2048});const s=I.lots[4].stone;const C=cat();C.position.set(s.x+4.4,0,s.z+2.2);sc.add(C);
  return {sc,cam,up:(p,T,d)=>{const t=p*d;C.rotation.y=-Math.PI/2-.5+(p>.6?.8*E(C01((p-.6)/.1)):0);C.userData.tail.rotation.z=Math.sin(t*2.5)*.35;
   look(cam,lerpV(V3(s.x+1.8,3.2,s.z+21),V3(s.x+1.4,3,s.z+15.5),E(p)),V3(s.x+1.4,2.5,s.z))},tags:[[C,'Kucing',2.6]]}},
 // SC06 timelapse membangun rumah (tripod sudut tinggi)
 ()=>{reseed(106);const {sc,cam}=vbase();const I=village(sc,{raka:'build',focus:V3(-102,0,-35),sm:2048});const c=I.lots[1].c;const R=raka('serius');sc.add(R);const hw=I.hw,pl=I.pile,lt=I.light;
  const spots=[[-1,12,.8],[-12,4,1.6],[-6,-8,3],[4,10,-.6],[-14,10,2.2],[0,6,.2],[-8,12,-1.8],[2,-6,2.8]];
  return {sc,cam,up:(p,T,d)=>{const t=p*d;const k=Math.min(spots.length-1,Math.floor(t/.55));const [a,b,r]=spots[k];R.position.set(c.x+a,0,c.z+b);R.rotation.y=r;pose(R,{armL:-1.4+Math.sin(t*20)*.4,armR:-1.6-Math.sin(t*20)*.4});
   const h=L(.08,2.3,E(p));hw.scale.y=h;hw.position.y=.35+.6*h;pl.scale.setScalar(Math.max(.05,1-p*.9));pl.visible=p<.97;
   lt.position.set(c.x+L(90,-40,p),L(80,110,Math.sin(p*Math.PI)),c.z+72);look(cam,V3(c.x+22,26,c.z+52),V3(c.x-6,1,c.z+2))},tags:[[R,'★ Raka',6]]}},
 // SC07 rumah jadi (sesuai denah), sore, dolly in
 ()=>{reseed(107);const {sc,cam}=vbase(grad([[0,'#ff9a5a'],[.6,'#ffc98a'],[1,'#ffe7c4']]));sc.fog.color.set(0xffd8b0);const I=village(sc,{raka:'done',warm:0xffd0a0,focus:V3(-102,0,-35),sm:2048});const c=I.lots[1].c,g=I.lots[1].gate;const R=raka('normal');R.position.set(g.x+1,0,g.z+2.5);sc.add(R);
  return {sc,cam,up:(p,T,d)=>{R.rotation.y=p>.5?0:Math.PI*.9;pose(R,{head:p>.5?.05:0});look(cam,lerpV(V3(g.x+8,6,g.z+26),V3(g.x+6,5.2,g.z+19),E(p)),V3(c.x-6,4,c.z+4))},tags:[[R,'★ Raka',4.7]]}},
 // SC08 CTA papan PENDUDUK 1 -> ?
 ()=>{reseed(108);const {sc,cam}=vbase();const I=village(sc,{raka:'done',focus:V3(-65,0,0),shadowR:120,sm:2048});const c=I.cross;const q=V3(c.x+10,0,c.z+6);sign(sc,q,'PENDUDUK: 1 → ?',1,-.2);
  const LS=[];sc.traverse(o=>{if(o.isLight)LS.push([o,o.intensity])});const bg0=sc.background;const night=new THREE.Color(0x0e1630);
  const lamps=[];[[q.x-4,q.z-5],[q.x+1.5,q.z-9],[q.x-10,q.z-9],[q.x-17,q.z-6],[q.x-7,q.z-18]].forEach(([x,z])=>{const g=new THREE.Group();const pole=box(.18,4.2,.18,0x2f3b2f,.03);pole.position.y=2.1;g.add(pole);const arm=box(.9,.14,.14,0x2f3b2f,.03);arm.position.set(.4,4.15,0);g.add(arm);
   const bulb=new THREE.Mesh(new THREE.BoxGeometry(.36,.26,.36),new THREE.MeshStandardMaterial({color:0x333322,emissive:0xffc860,emissiveIntensity:0}));bulb.position.set(.8,3.95,0);g.add(bulb);
   const pl=new THREE.PointLight(0xffb84d,0,16,1.6);pl.position.set(.8,3.6,0);g.add(pl);g.position.set(x,0,z);sc.add(g);lamps.push([bulb,pl])});
  return {sc,cam,up:(p)=>{const n=E(C01((p-.15)/.55));LS.forEach(([o,i0])=>{o.intensity=i0*L(1,.16,n)});sc.background=n<.02?bg0:night.clone().lerp(new THREE.Color(0x9fd6ff),1-n);sc.fog.color.set(0xcfeaff).lerp(night,n);
   const on=C01((p-.45)/.15);lamps.forEach(([b,pl],k)=>{const o=C01(on*1.6-k*.12);b.material.emissiveIntensity=o*3;pl.intensity=o*30});cam.children.forEach(o=>{if(o.isLight)o.intensity=10*L(1,.12,n)});look(cam,lerpV(V3(q.x+9.5,2.6,q.z+9),V3(q.x+6.8,3.1,q.z+6.2),E(p)),V3(q.x-1.2,3.6,q.z))}}},
];
// HOOK 0-1,7 dtk: close-up wajah Raka melambai, kucing di atas papan PENDUDUK: 1 di belakang, kamera maju cepat
export const HOOK=()=>{reseed(100);const {sc,cam}=vbase();const I=village(sc,{raka:'none',focus:V3(-65,0,0),sm:2048});const c=I.cross;const q=V3(c.x+7,0,c.z+3);sign(sc,q,'PENDUDUK: 1',.9,-.15);
 const Cc=cat();Cc.position.set(q.x-.3,3.2,q.z+.1);Cc.rotation.y=-Math.PI/2+1;Cc.scale.setScalar(.8);sc.add(Cc);
 const R=raka('senang');R.position.set(q.x+3,0,q.z+3.2);R.rotation.y=-.1;sc.add(R);
 return {sc,cam,up:(p,T,d)=>{const t=p*d;const k=Math.sin(t*10);pose(R,{armR:-.2,armRz:2.5+k*.35,head:.04});Cc.userData.tail.rotation.z=Math.sin(t*4)*.4;
  const e=1-Math.pow(1-p,3);look(cam,lerpV(V3(q.x+2.6,4.4,q.z+14),V3(q.x+2.9,4.2,q.z+10),e),lerpV(V3(q.x+1.6,4.4,q.z+3),V3(q.x+2.3,4.3,q.z+3),e))}}};

export {sign,vbase,look,V3,sun,lot2,LOT_W,LOT_D};
export {cubes,fasum2,vTree,hsl,box};
// hutan pembatas dusun (gaya pinggiran desa game strategi): pita pohon lebat di luar batas
export function hutanPts(o){const P=[];const {x0,x1,z0,z1,W=26,st=4.2,skip=()=>false,yf=()=>0,sides='nsew'}=o;
 for(let x=x0-W;x<=x1+W;x+=st)for(let z=z0-W;z<=z1+W;z+=st){const inside=x>x0&&x<x1&&z>z0&&z<z1;if(inside)continue;
  if(!sides.includes('n')&&z<=z0&&x>x0-W&&x<x1+W)continue;if(!sides.includes('s')&&z>=z1&&x>x0-W&&x<x1+W)continue;
  const jx=x+(rnd()-.5)*st*.8,jz=z+(rnd()-.5)*st*.8;if(skip(jx,jz))continue;P.push([jx,yf(jx,jz),jz,.9+rnd()*.6])}return P}
export function hutanRing(o){const P=[];const {r0,W=28,st=4.2,skip=()=>false}=o;for(let x=-r0-W;x<=r0+W;x+=st)for(let z=-r0-W;z<=r0+W;z+=st){const r=Math.hypot(x,z);if(r<r0||r>r0+W)continue;const jx=x+(rnd()-.5)*st*.8,jz=z+(rnd()-.5)*st*.8;if(skip(jx,jz))continue;P.push([jx,0,jz,.9+rnd()*.6])}return P}
export function hutan(G,P){const L=[];const PAL=[[.30,.42,.30],[.33,.45,.27],[.36,.40,.32],[.29,.42,.33],[.38,.35,.25]];
 P.forEach(([x,y,z,s0])=>{const r=rnd();const c=(r<.4?4.6:r<.85?7:11)*(.88+rnd()*.24);const [g,sat,l]=PAL[Math.floor(rnd()*PAL.length)];
 const th=c*(r<.85?.42:.55);L.push({p:V3(x,y+th/2,z),s:Math.max(.6,c*.18),c:hsl(.07,.42,.24+rnd()*.05)});L[L.length-1].p.y=y+th/2;
 // batang: tumpuk kubus kecil sampai tinggi th
 for(let t=c*.18;t<th;t+=c*.18)L.push({p:V3(x,y+t,z),s:c*.18,c:hsl(.07,.42,.25)});
 L.push({p:V3(x,y+th+c/2,z),s:c,c:hsl(g,sat,l)});L.push({p:V3(x+(rnd()-.5)*c*.15,y+th+c*1.15,z+(rnd()-.5)*c*.15),s:c*.62,c:hsl(g,sat,l+.05)});
 if(r>=.85){[[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b])=>{if(rnd()<.6)L.push({p:V3(x+a*c*.55,y+th+c*.35,z+b*c*.55),s:c*.6,c:hsl(g,sat,l-.03)})})}
 });const m=cubes(L);G.add(m);return m}
