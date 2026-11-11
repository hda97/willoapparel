import math, random, sys
import gen
from gen import *

# ---------- T-SHIRT (perbaikan: skala lebih kecil, lipatan halus) ----------
def tshirt():
    d=lg('bg',[(0,'#eef1f6'),(.6,'#dfe5ee'),(1,'#c7d0de')])+lg('tee',[(0,'#ffffff'),(.5,'#f5f7fa'),(1,'#e1e6ee')],0,0,1,1)+lg('rib',[(0,'#f2f4f7'),(1,'#cfd6e0')])+lg('side',[(0,'#8a97ad'),(.12,'#8a97ad00'),(.88,'#8a97ad00'),(1,'#8a97ad')],0,0,1,0)
    tee="M-120 -330 L-270 -285 L-440 -90 L-330 0 L-255 -75 L-255 370 Q0 392 255 370 L255 -75 L330 0 L440 -90 L270 -285 L120 -330"
    def one(cx,back):
        neck = "Q0 -292 -120 -330Z" if back else "Q0 -180 -120 -330Z"
        p=tee+" "+neck
        folds='''<g fill="none" stroke="#8a97ad" stroke-width="46" stroke-linecap="round" filter="url(#blur20)" opacity=".38"><path d="M-262 10 V380"/><path d="M262 10 V380"/></g>
        <g fill="none" stroke="#7f8ca3" stroke-linecap="round" opacity=".30"><path d="M-255 -75 Q-225 -20 -232 60" stroke-width="5" filter="url(#blur8)"/><path d="M255 -75 Q225 -20 232 60" stroke-width="5" filter="url(#blur8)"/><path d="M-250 -70 Q-190 -50 -150 -10" stroke-width="3"/><path d="M250 -70 Q190 -50 150 -10" stroke-width="3"/><path d="M-200 250 Q-120 290 -20 270" stroke-width="3" opacity=".7"/><path d="M210 200 Q150 250 60 250" stroke-width="3" opacity=".7"/><path d="M-345 -120 Q-320 -70 -322 -22" stroke-width="3"/><path d="M345 -120 Q320 -70 322 -22" stroke-width="3"/></g>
        <g fill="none" stroke="#fff" stroke-linecap="round" filter="url(#blur8)" opacity=".8"><path d="M-150 -220 Q-130 0 -150 300" stroke-width="22"/></g>'''
        collar = ('<path d="M-120 -330 Q0 -292 120 -330" fill="none" stroke="url(#rib)" stroke-width="20"/><path d="M-120 -330 Q0 -292 120 -330" fill="none" stroke="#9aa6b8" stroke-width="2" transform="translate(0 10)"/>' if back else
                  '<path d="M-120 -330 Q0 -292 120 -330 Q0 -180 -120 -330Z" fill="#c9d1dd"/><path d="M-120 -330 Q0 -292 120 -330" fill="none" stroke="#b4bdcb" stroke-width="3"/><path d="M-128 -326 Q0 -165 128 -326" fill="none" stroke="url(#rib)" stroke-width="22"/><path d="M-137 -322 Q0 -150 137 -322" fill="none" stroke="#a5afbf" stroke-width="2"/><rect x="-16" y="-292" width="32" height="20" rx="3" fill="#eef1f5" stroke="#b4bdcb" stroke-width="1.5"/>')
        return f'''<ellipse cx="{cx}" cy="935" rx="250" ry="20" fill="#2b2350" opacity=".25" filter="url(#blur20)"/>
        <g transform="translate({cx} 600) scale(.82)"><clipPath id="c{cx}"><path d="{p}"/></clipPath>
        <path d="{p}" fill="url(#tee)" filter="url(#sh)"/><g clip-path="url(#c{cx})">{folds}</g>
        <path d="{p}" fill="none" stroke="#8f9bb0" stroke-width="3.2" stroke-linejoin="round"/>{collar}
        <g fill="none" stroke="#9aa6b8" stroke-width="2.2" stroke-dasharray="9 7"><path d="M-255 348 Q0 370 255 348"/><path d="M-424 -72 L-343 -6"/><path d="M424 -72 L343 -6"/></g></g>'''
    b='<rect width="1600" height="1200" fill="url(#bg)"/><rect y="960" width="1600" height="240" fill="#b9c3d3" opacity=".35"/>'+one(420,False)+one(1180,True)
    return svg(d,b,vig('#1f2a4a',.22))

# ---------- COAT OF ARMS (karangan daun diperbaiki) ----------
_coat_old=gen.coat
def coat():
    s=_coat_old()
    a=s.index('<g transform="translate(800 590)"><g filter="url(#shs)">')+len('<g transform="translate(800 590)"><g filter="url(#shs)">')
    z=s.index('</g>\n    <g filter="url(#sh)"><path d="M-250 -300')
    R=470; side=''
    P=lambda t:(R*math.cos(math.radians(t)), -R*math.sin(math.radians(t))+30)
    x0,y0=P(-62); x1,y1=P(50)
    side+=f'<path d="M{x0:.0f} {y0:.0f} A{R} {R} 0 0 0 {x1:.0f} {y1:.0f}" fill="none" stroke="#2f6f4a" stroke-width="8" stroke-linecap="round"/>'
    n=13
    for i in range(n):
        t=-42+i*7.5; x,y=P(t); sc=1.0-0.22*(i/(n-1))
        for off in (34,-34):
            side+=f'<g transform="translate({x:.0f} {y:.0f}) rotate({-t+off:.0f}) scale({sc:.2f})"><path d="M0 0 Q30 -52 0 -112 Q-30 -52 0 0Z" fill="url(#leaf)" stroke="#1f5a3c" stroke-width="1.5"/><path d="M0 -6 L0 -98" stroke="#d8f0dc" stroke-width="2" opacity=".55"/></g>'
    x,y=P(50); side+=f'<g transform="translate({x:.0f} {y:.0f}) rotate(-50) scale(.78)"><path d="M0 0 Q30 -52 0 -112 Q-30 -52 0 0Z" fill="url(#leaf)" stroke="#1f5a3c" stroke-width="1.5"/></g>'
    s=s[:a]+side+f'<g transform="scale(-1 1)">{side}</g>'+s[z:]
    return s.replace('filter="url(#paper)" opacity=".5"','filter="url(#paper)" opacity=".18"')

def xmas():
    s=gen.xmas()
    i=s.index('<g transform="translate(1130 600)">')
    head,tail=s[:i],s[i:]
    tail=tail.replace('stroke="url(#gold)"','stroke="#e9bf55"')
    return head+tail

# ---------- GIFT TAGS (lebih kecil, tanpa tekstur bercak) ----------
def tags():
    s=gen.tags()
    s=s.replace('<rect width="1600" height="1200" filter="url(#paper)" opacity=".35"/>','')
    import re
    s=re.sub(r'<path d="[^"]*" filter="url\(#paper\)"[^>]*/>','',s)
    k=[0]
    def rep(m):
        i=k[0];k[0]+=1
        cx=230+(i%4)*380; cy=345+(i//4)*520
        return f'<g transform="translate({cx} {cy}) rotate({m.group(1)}) scale(.8)">'
    s=re.sub(r'<g transform="translate\(\d+ \d+\) rotate\((-?\d+)\)">',rep,s)
    return s

# ---------- AMERICAN FOOTBALL JERSEY ----------
def jersey():
    d=(lg('bg',[(0,'#1d2b4f'),(.55,'#152040'),(1,'#0b1228')])+lg('jr',[(0,'#e2473f'),(.45,'#c42a2c'),(1,'#8d1620')],0,0,1,1)+lg('yoke',[(0,'#a81d25'),(1,'#7c121b')])
       +lg('side',[(0,'#3a0508'),(.14,'#3a050800'),(.86,'#3a050800'),(1,'#3a0508')],0,0,1,0)+rg('spot',[(0,'#9db8ff'),(1,'#9db8ff00')],.5,.5,.5)
       +'<pattern id="mesh" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="6" cy="6" r="2.2" fill="#4a0a10"/></pattern>')
    out="M-110 -300 L-250 -272 L-440 -150 L-372 30 L-250 -18 L-236 360 Q0 382 236 360 L250 -18 L372 30 L440 -150 L250 -272 L110 -300"
    def stripes():
        s=''
        for o,c,w in ((34,'#ffffff',22),(64,'#f0c75a',12),(88,'#ffffff',8)):
            ax,ay=-440+.943*o-25,-150-.333*o-70; bx,by=-372+.943*o+25,30-.333*o+70
            s+=f'<line x1="{ax:.0f}" y1="{ay:.0f}" x2="{bx:.0f}" y2="{by:.0f}" stroke="{c}" stroke-width="{w}"/>'
        return s
    def one(cx,back):
        neck="Q0 -262 -110 -300Z" if back else "L0 -185 Z"
        p=out+" "+neck
        yoke='<path d="M-250 -272 L-110 -300 L0 -185 L110 -300 L250 -272 L262 -150 Q0 -105 -262 -150Z" fill="url(#yoke)" opacity=".75"/>' if not back else '<path d="M-250 -272 L-110 -300 Q0 -262 110 -300 L250 -272 L262 -150 Q0 -105 -262 -150Z" fill="url(#yoke)" opacity=".75"/>'
        collar=('<path d="M-110 -300 Q0 -262 110 -300" fill="none" stroke="#fff" stroke-width="16"/><path d="M-110 -300 Q0 -262 110 -300" fill="none" stroke="#f0c75a" stroke-width="4" transform="translate(0 13)"/>' if back else
                '<path d="M-110 -300 Q0 -268 110 -300 L0 -185Z" fill="#5c0c14"/><path d="M-114 -296 L0 -176 L114 -296" fill="none" stroke="#fff" stroke-width="18" stroke-linejoin="round"/><path d="M-128 -288 L0 -154 L128 -288" fill="none" stroke="#f0c75a" stroke-width="4" stroke-linejoin="round"/>')
        return f'''<ellipse cx="{cx}" cy="930" rx="250" ry="20" fill="#000" opacity=".5" filter="url(#blur20)"/>
        <g transform="translate({cx} 600) scale(.82)"><clipPath id="j{cx}"><path d="{p}"/></clipPath>
        <path d="{p}" fill="url(#jr)" filter="url(#sh)"/><g clip-path="url(#j{cx})">{yoke}<rect x="-460" y="-320" width="920" height="720" fill="url(#mesh)" opacity=".16"/>
        {stripes()}<g transform="scale(-1 1)">{stripes()}</g>
        <g fill="none" stroke="#3a0508" stroke-width="54" stroke-linecap="round" filter="url(#blur20)" opacity=".55"><path d="M-256 60 V380"/><path d="M256 60 V380"/></g>
        <path d="M-236 300 Q0 322 236 300" fill="none" stroke="#fff" stroke-width="16"/><path d="M-236 322 Q0 344 236 322" fill="none" stroke="#f0c75a" stroke-width="6"/>
        <path d="M-170 -230 Q-140 0 -165 330" fill="none" stroke="#fff" stroke-width="44" opacity=".10" filter="url(#blur20)"/></g>
        <path d="{p}" fill="none" stroke="#4a0a10" stroke-width="3" stroke-linejoin="round"/>{collar}
        <g fill="none" stroke="#ffd9d6" stroke-opacity=".55" stroke-width="2" stroke-dasharray="9 7"><path d="M-262 -150 Q0 -105 262 -150"/><path d="M-236 344 Q0 366 236 344"/></g></g>'''
    b='<rect width="1600" height="1200" fill="url(#bg)"/><circle cx="420" cy="520" r="520" fill="url(#spot)" opacity=".30"/><circle cx="1180" cy="520" r="520" fill="url(#spot)" opacity=".30"/><rect y="960" width="1600" height="240" fill="#060a18" opacity=".45"/>'
    b+=one(420,False)+one(1180,True)
    return svg(d,b,vig('#000',.4))

# ---------- OLD NEWSPAPER ----------
def newspaper():
    random.seed(21)
    d=(lg('bg',[(0,'#5a3d2a'),(.5,'#432b1d'),(1,'#2a1a11')],0,0,1,1)+lg('pap',[(0,'#f3e6c4'),(.5,'#ead9b0'),(1,'#d9c391')],0,0,1,1)+lg('ph',[(0,'#b9a984'),(1,'#8d7d5c')],0,0,1,1)
       +lg('fold',[(0,'#5a441c00'),(.47,'#5a441c00'),(.5,'#5a441c'),(.53,'#fff6d8'),(.56,'#5a441c00'),(1,'#5a441c00')],0,0,0,1)
       +rg('edge',[(.55,'#7a5a2400'),(1,'#7a5a24')],.5,.5,.75))
    b='<rect width="1600" height="1200" fill="url(#bg)"/>'
    for i in range(26):
        y=i*48+random.uniform(-6,6); b+=f'<path d="M0 {y:.0f} Q800 {y+random.uniform(-14,14):.0f} 1600 {y+random.uniform(-8,8):.0f}" stroke="#1d110a" stroke-width="{random.uniform(1,3):.1f}" opacity=".35" fill="none"/>'
    ink='#3b3020'
    def lines(x,y,w,h,lh=13):
        s='';yy=y
        while yy<y+h-6:
            ww=w if random.random()>.14 else w*random.uniform(.45,.85)
            s+=f'<rect x="{x:.0f}" y="{yy:.0f}" width="{ww:.0f}" height="5" rx="2" fill="{ink}" opacity="{random.uniform(.38,.58):.2f}"/>'; yy+=lh
        return s
    def head(x,y,w,hh=20,n=2):
        return ''.join(f'<rect x="{x}" y="{y+i*(hh+10)}" width="{w*(1 if i<n-1 else .7):.0f}" height="{hh}" rx="3" fill="{ink}" opacity=".85"/>' for i in range(n))
    def photo(x,y,w,h):
        cid=f'p{x}{y}'
        return f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#ph)"/><g clip-path="url(#{cid})" fill="#6b5d42" opacity=".55"><circle cx="{x+w*.72}" cy="{y+h*.3}" r="{h*.13}" fill="#efe2bd"/><path d="M{x} {y+h} L{x+w*.3} {y+h*.45} L{x+w*.5} {y+h*.75} L{x+w*.7} {y+h*.5} L{x+w} {y+h*.85} V{y+h}Z"/></g><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{ink}" stroke-width="2" opacity=".7"/>'
    W,H=1000,1060; x0,y0=-500,-530
    p=f'<g transform="translate(800 600) rotate(-3)"><g filter="url(#sh)"><path d="M{x0} {y0} H{x0+W} V{y0+H} l-30 6 l-40 -8 l-60 7 l-50 -6 l-70 8 l-60 -7 l-80 6 l-70 -8 l-90 7 l-80 -6 l-90 8 l-80 -7 l-100 6 l-100 -6Z" fill="url(#pap)"/></g>'
    p+=f'<clipPath id="pg"><rect x="{x0}" y="{y0}" width="{W}" height="{H}"/></clipPath><g clip-path="url(#pg)"><rect x="{x0}" y="{y0}" width="{W}" height="{H}" filter="url(#paper)" opacity=".28"/><rect x="{x0}" y="{y0}" width="{W}" height="{H}" fill="url(#edge)" opacity=".35"/>'
    m=46; L=x0+m; CW=W-2*m
    # masthead
    p+=f'<rect x="{L}" y="{y0+40}" width="{CW}" height="4" fill="{ink}"/><rect x="{L}" y="{y0+48}" width="{CW}" height="1.5" fill="{ink}"/>'
    p+=f'<rect x="-290" y="{y0+72}" width="580" height="62" rx="5" fill="{ink}" opacity=".9"/><path d="M-360 {y0+103} l22 -22 l22 22 l-22 22z M360 {y0+103} l-22 -22 l-22 22 l22 22z" fill="{ink}"/>'
    p+=f'<rect x="{L}" y="{y0+92}" width="120" height="7" rx="3" fill="{ink}" opacity=".6"/><rect x="{L}" y="{y0+108}" width="90" height="7" rx="3" fill="{ink}" opacity=".6"/><rect x="{L+CW-120}" y="{y0+92}" width="120" height="7" rx="3" fill="{ink}" opacity=".6"/><rect x="{L+CW-90}" y="{y0+108}" width="90" height="7" rx="3" fill="{ink}" opacity=".6"/>'
    p+=f'<rect x="{L}" y="{y0+156}" width="{CW}" height="1.5" fill="{ink}"/><rect x="{L}" y="{y0+164}" width="{CW}" height="4" fill="{ink}"/>'
    # headline
    p+=f'<rect x="{L}" y="{y0+196}" width="{CW}" height="40" rx="4" fill="{ink}" opacity=".88"/><rect x="{L+90}" y="{y0+250}" width="{CW-180}" height="16" rx="3" fill="{ink}" opacity=".6"/>'
    top=y0+296; g=26; cw=(CW-3*g)/4
    X=[L+i*(cw+g) for i in range(4)]
    # big photo over col 1-2 (0,1)
    pw=2*cw+g
    p+=photo(round(X[0]),top,round(pw),300)+f'<rect x="{X[0]:.0f}" y="{top+310}" width="{pw*.8:.0f}" height="5" rx="2" fill="{ink}" opacity=".5"/>'
    p+=lines(X[0],top+334,cw,400)+lines(X[1],top+334,cw,400)
    p+=head(round(X[2]),top,round(cw),18,3)+lines(X[2],top+100,cw,300)
    p+=photo(round(X[2]),top+412,round(cw),150)+lines(X[2],top+576,cw,158)
    p+=head(round(X[3]),top,round(cw),18,2)+lines(X[3],top+72,cw,230)
    p+=f'<rect x="{X[3]:.0f}" y="{top+312}" width="{cw:.0f}" height="2" fill="{ink}" opacity=".7"/>'+head(round(X[3]),top+330,round(cw),16,2)+lines(X[3],top+396,cw,338)
    for i in range(1,4): p+=f'<rect x="{X[i]-g/2:.0f}" y="{top}" width="1.2" height="734" fill="{ink}" opacity=".45"/>'
    p+=f'<rect x="{x0}" y="{y0}" width="{W}" height="{H}" fill="url(#fold)" opacity=".28"/>'
    for i in range(14):
        sx,sy=random.uniform(x0,x0+W),random.uniform(y0,y0+H); p+=f'<circle cx="{sx:.0f}" cy="{sy:.0f}" r="{random.uniform(8,34):.0f}" fill="#8a6a2c" opacity="{random.uniform(.05,.12):.2f}" filter="url(#blur8)"/>'
    p+='</g></g>'
    return svg(d,b+p,vig('#000',.42))

# ---------- TO DO LIST ----------
def todo():
    d=(lg('bg',[(0,'#bfe3d6'),(.5,'#a8d5cf'),(1,'#8fc3c9')],0,0,1,1)+lg('pap',[(0,'#fffef9'),(1,'#f1ede2')],0,0,1,1)+lg('board',[(0,'#d9a66b'),(.5,'#c48a4c'),(1,'#a56c34')],0,0,1,1)
       +lg('clip',[(0,'#f6f7f9'),(.3,'#c9ccd3'),(.55,'#8f95a1'),(.8,'#dcdee3'),(1,'#7f8591')])+lg('pen',[(0,'#ffe07a'),(.5,'#f7c63c'),(1,'#d99a1c')],0,0,1,0)+lg('chk',[(0,'#58c39a'),(1,'#2a8f6c')],0,0,1,1)
       +lg('cup',[(0,'#ffffff'),(1,'#d8dde6')],0,0,1,1)+rg('cof',[(0,'#8a5a36'),(.7,'#5c3418'),(1,'#3a1e0c')],.4,.35,.6)+rg('leafg',[(0,'#7fd0a0'),(1,'#2f8a60')]))
    random.seed(5)
    b='<rect width="1600" height="1200" fill="url(#bg)"/>'
    # clipboard
    b+='<g transform="translate(740 610) rotate(-4)"><g filter="url(#sh)"><rect x="-370" y="-520" width="740" height="1040" rx="34" fill="url(#board)"/></g><rect x="-370" y="-520" width="740" height="1040" rx="34" fill="none" stroke="#7a4c20" stroke-width="2.5" opacity=".6"/>'
    b+='<g filter="url(#shs)"><rect x="-325" y="-455" width="650" height="940" rx="6" fill="#e6e0d2" transform="rotate(1.2)"/><rect x="-325" y="-460" width="650" height="940" rx="6" fill="url(#pap)"/></g>'
    b+='<rect x="-270" y="-360" width="300" height="34" rx="8" fill="#2f3b52"/><rect x="-270" y="-306" width="180" height="10" rx="5" fill="#9aa6b8"/><rect x="-270" y="-270" width="540" height="3" fill="#58c39a"/>'
    ws=[.9,.7,.82,.6,.88,.74,.66,.8]
    for i in range(8):
        y=-212+i*84; done=i in (0,1,3)
        b+=f'<rect x="-270" y="{y-22}" width="44" height="44" rx="10" fill="{"url(#chk)" if done else "#fff"}" stroke="{"#1f7a5a" if done else "#aab3c2"}" stroke-width="3"/>'
        if done: b+=f'<path d="M-260 {y+1} l11 12 l22 -25" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
        w=430*ws[i]
        b+=f'<rect x="-200" y="{y-7}" width="{w:.0f}" height="14" rx="7" fill="{"#c3cad6" if done else "#55627a"}"/>'
        if done: b+=f'<rect x="-208" y="{y-1.5}" width="{w+16:.0f}" height="3" rx="1.5" fill="#7c8799"/>'
        b+=f'<line x1="-270" y1="{y+40}" x2="270" y2="{y+40}" stroke="#d9dde5" stroke-width="2" stroke-dasharray="3 7"/>'
    b+='<g filter="url(#sh)"><rect x="-130" y="-560" width="260" height="96" rx="18" fill="url(#clip)"/></g><rect x="-130" y="-560" width="260" height="96" rx="18" fill="none" stroke="#5c6270" stroke-width="2"/><rect x="-96" y="-538" width="192" height="12" rx="6" fill="#fff" opacity=".7"/><circle cx="0" cy="-498" r="15" fill="#5c6270"/><circle cx="0" cy="-498" r="8" fill="#a8d5cf"/></g>'
    # pencil
    b+='<g transform="translate(1330 760) rotate(18)"><g filter="url(#sh)"><rect x="-26" y="-330" width="52" height="560" fill="url(#pen)"/><path d="M-26 230 L0 320 L26 230Z" fill="#f1d3a6"/><rect x="-26" y="-372" width="52" height="42" rx="10" fill="#f49ab0"/><rect x="-26" y="-336" width="52" height="34" fill="url(#clip)"/></g><path d="M-9 289 L0 320 L9 289Z" fill="#3b3b46"/><rect x="-8" y="-300" width="6" height="530" fill="#fff" opacity=".35"/><rect x="9" y="-300" width="2" height="530" fill="#a8741c" opacity=".5"/></g>'
    # cup
    b+='<g transform="translate(1320 250)"><ellipse cx="14" cy="34" rx="150" ry="140" fill="#2b2350" opacity=".28" filter="url(#blur20)"/><circle r="150" fill="url(#cup)" filter="url(#shs)"/><circle r="150" fill="none" stroke="#b9c0cc" stroke-width="2"/><path d="M130 -60 q110 60 0 120" fill="none" stroke="url(#cup)" stroke-width="34" stroke-linecap="round"/><circle r="104" fill="#eef0f4"/><circle r="92" fill="url(#cof)"/><path d="M-60 -30 q30 -40 70 -30" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".35"/></g>'
    # leaves
    for (x,y,r,s) in ((150,1000,-30,1.5),(240,1090,20,1.2),(90,1110,-70,1.1)):
        b+=f'<g transform="translate({x} {y}) rotate({r}) scale({s})" filter="url(#shs)"><path d="M0 0 Q60 -70 0 -170 Q-60 -70 0 0Z" fill="url(#leafg)"/><path d="M0 -8 L0 -150" stroke="#dff5e6" stroke-width="2.5" opacity=".6"/></g>'
    # paperclips
    for (x,y,r) in ((1370,1120,25),(1440,990,-40),(1510,1100,70)):
        b+=f'<g transform="translate({x} {y}) rotate({r})" filter="url(#shs)" fill="none" stroke="url(#clip)" stroke-width="7" stroke-linecap="round"><path d="M-14 40 V-34 a14 14 0 0 1 28 0 V52 a22 22 0 0 1 -44 0 V-20"/></g>'
    return svg(d,b,vig('#1f4a4a',.22))

if __name__=='__main__':
    names=sys.argv[1:] or ['tshirt','coat','xmas','booth','tags','jigsaw','jersey','newspaper','todo']
    for n in names:
        f=globals().get(n) or getattr(gen,n)
        open(n+'.svg','w').write(f())
