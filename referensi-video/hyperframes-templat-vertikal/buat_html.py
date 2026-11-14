words=[("BANDARA?!",0,1.3),("DI",1.3,.45),("DESA",1.75,.55),("KOTAK?",2.3,.9),("WARGA",3.2,.6),("PILIH",3.8,.7),("TIAP",4.5,.5),("KOTAK",5.0,.6),("SATU",5.6,.5),("SUARA",6.1,.9),("DAMKAR?",7.0,.9),("STASIUN?",7.9,.9),("ATAU",8.8,.6),("BANDARA?",9.4,1.0),("KAMU",10.4,.6),("PILIH",11.0,.6),("MANA?",11.6,1.0),("KOMEN",12.6,.7),("DI",13.3,.4),("BAWAH",13.7,.8),("BANDARA?!",14.5,1.5)]
D=16
cols=["#2ec4b6","#ffd23f","#ff5d8f","#5aa9ff","#9b5de5","#2ec4b6","#ffd23f","#5aa9ff","#ff5d8f"]
html_w=[];tw=[]
for i,(w,s,d) in enumerate(words):
    html_w.append(f'<div id="w{i}" class="clip word" data-start="{s}" data-duration="{d}" data-track-index="2"><span>{w}</span></div>')
    if i==0: continue
    tw.append(f'tl.fromTo("#w{i} span",{{scale:1.6,opacity:0}},{{scale:1,opacity:1,duration:0.14,ease:"back.out(3)"}},{s});')
# boxes: 3x3 stack
boxes=[];bt=[]
for i in range(9):
    r,c=divmod(i,3); x=330+c*150; y=760-r*150
    boxes.append(f'<div id="b{i}" class="box" style="left:{x}px;top:{y}px;background:{cols[i]}"></div>')
    t=3.2+i*0.35
    bt.append(f'tl.fromTo("#b{i}",{{y:-1400,rotation:{(i%3-1)*25}}},{{y:0,rotation:0,duration:0.45,ease:"bounce.out"}},{t:.2f});')
    # explode at 13.9 then reset to start state at 15.9
    bt.append(f'tl.to("#b{i}",{{y:-1400,rotation:{(i%2*2-1)*90},duration:0.6,ease:"power3.in"}},{14.0+i*0.04:.2f});')
html=f'''<!doctype html>
<html lang="id"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1920"/>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
:root{{--ground:#10223f;--ink:#ffffff;--font-display:"Montserrat";}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1080px;height:1920px;overflow:hidden;background:var(--ground)}}
#root{{width:100%;height:100%;position:relative;font-family:var(--font-display);background:radial-gradient(circle at 50% 35%,#1d3b6b 0%,#10223f 60%,#0a1730 100%)}}
#grid{{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.06) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.06) 2px,transparent 2px);background-size:120px 120px}}
.box{{position:absolute;width:140px;height:140px;border:8px solid #0a1730;border-radius:18px;box-shadow:inset -14px -14px 0 rgba(0,0,0,.18)}}
#plane{{position:absolute;left:390px;top:420px;width:300px;height:300px}}
.word{{position:absolute;left:0;top:1020px;width:1080px;text-align:center}}
.word span{{display:inline-block;font-weight:900;font-size:150px;color:#fff;-webkit-text-stroke:10px #000;paint-order:stroke fill;letter-spacing:-.02em;text-shadow:0 12px 0 rgba(0,0,0,.35)}}
#bar{{position:absolute;left:80px;top:1260px;width:920px;height:16px;border-radius:8px;background:rgba(255,255,255,.18)}}
#fill{{width:100%;height:100%;border-radius:8px;background:#2ec4b6;transform-origin:left center}}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{D}" data-width="1080" data-height="1920">
<div id="grid"></div>
<div id="stack">{"".join(boxes)}</div>
<svg id="plane" viewBox="0 0 100 100"><g fill="#ffffff" stroke="#0a1730" stroke-width="3"><rect x="44" y="10" width="12" height="80" rx="6"/><rect x="10" y="40" width="80" height="14" rx="5"/><rect x="30" y="78" width="40" height="9" rx="4"/></g></svg>
{"".join(html_w)}
<div id="bar"><div id="fill"></div></div>
<audio id="sfx" class="clip" data-start="0" data-duration="{D}" data-track-index="5" src="assets/sfx.wav"></audio>
</div>
<script>
const tl=gsap.timeline({{paused:true}});
{chr(10).join(tw)}
// plane: on screen at frame 0 (hook), flies off, returns at end for loop
tl.fromTo("#plane",{{x:0,y:0,rotation:0,scale:1}},{{x:0,y:-12,duration:1.2,ease:"sine.inOut"}},0);
tl.to("#plane",{{x:900,y:-500,rotation:35,scale:.6,duration:0.8,ease:"power3.in"}},1.3);
tl.fromTo("#plane",{{x:-900,y:300,rotation:20,scale:.6}},{{immediateRender:false,x:0,y:0,rotation:0,scale:1,duration:0.7,ease:"power3.out"}},9.4);
tl.to("#plane",{{x:900,y:-500,rotation:35,scale:.6,duration:0.6,ease:"power3.in"}},10.4);
tl.fromTo("#plane",{{x:-900,y:300,rotation:20,scale:.6}},{{immediateRender:false,x:0,y:0,rotation:0,scale:1,duration:0.8,ease:"power3.out"}},14.5);
{chr(10).join(bt)}
tl.fromTo("#fill",{{scaleX:0}},{{scaleX:1,duration:{D},ease:"none"}},0);
window.__timelines["main"]=tl;
</script></body></html>'''
open('index.html','w').write(html)
import json;json.dump([s for _,s,_ in words],open('waktu_kata.json','w'))
