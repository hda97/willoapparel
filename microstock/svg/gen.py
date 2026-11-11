import math, random
DEFS='''
<filter id="sh" x="-25%" y="-25%" width="150%" height="160%" color-interpolation-filters="linearRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="14"/><feOffset dx="6" dy="18" result="o"/><feFlood flood-color="#2b2350" flood-opacity=".30"/><feComposite in2="o" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="shs" x="-30%" y="-30%" width="160%" height="170%" color-interpolation-filters="linearRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="4"/><feOffset dx="2" dy="5" result="o"/><feFlood flood-color="#2b2350" flood-opacity=".32"/><feComposite in2="o" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter><filter id="blur20"><feGaussianBlur stdDeviation="20"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="4"/><feColorMatrix type="matrix" values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .9 -.25"/></filter>
<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="4" seed="9"/><feColorMatrix type="matrix" values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .12  0 0 0 1.1 -.42"/></filter>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".3" stop-color="#f0c75a"/><stop offset=".55" stop-color="#c8922b"/><stop offset=".8" stop-color="#f3d77c"/><stop offset="1" stop-color="#a8741c"/></linearGradient>
<linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f7f9"/><stop offset=".35" stop-color="#c9ccd3"/><stop offset=".55" stop-color="#9ea3ad"/><stop offset=".8" stop-color="#dcdee3"/><stop offset="1" stop-color="#8b8f9a"/></linearGradient>
'''
def vig(c="#2b2350",o=.25): return f'<radialGradient id="vg" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="{c}" stop-opacity="0"/><stop offset="1" stop-color="{c}" stop-opacity="{o}"/></radialGradient>'
END='<rect width="1600" height="1200" fill="url(#vg)"/><rect width="1600" height="1200" filter="url(#grain)" opacity=".10" style="mix-blend-mode:soft-light"/>'
def svg(defs,body,v=None): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200" width="4000" height="3000"><defs>{DEFS}{v or vig()}{defs}</defs>{body}{END}</svg>'
def lg(i,stops,x1=0,y1=0,x2=0,y2=1): return f'<linearGradient id="{i}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" color-interpolation="linearRGB">'+''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o,c in stops)+'</linearGradient>'
def rg(i,stops,fx=.35,fy=.28,r=.6): return f'<radialGradient id="{i}" cx=".5" cy=".5" r="{r}" fx="{fx}" fy="{fy}" color-interpolation="linearRGB">'+''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o,c in stops)+'</radialGradient>'

# ---------- T-SHIRT ----------
def tshirt():
    d=lg('bg',[(0,'#eef1f6'),(.6,'#dfe5ee'),(1,'#c7d0de')])+lg('tee',[(0,'#ffffff'),(.5,'#f4f6f9'),(1,'#dfe4ec')],0,0,1,1)+lg('rib',[(0,'#f2f4f7'),(1,'#cfd6e0')])
    tee="M-120 -330 L-270 -285 L-440 -90 L-330 0 L-255 -75 L-255 370 Q0 392 255 370 L255 -75 L330 0 L440 -90 L270 -285 L120 -330"
    def one(cx,back):
        neck = "Q0 -292 -120 -330Z" if back else "Q0 -180 -120 -330Z"
        p=tee+" "+neck
        folds='''<g fill="none" stroke="#8a97ad" stroke-linecap="round" filter="url(#blur8)" opacity=".5"><path d="M-255 -75 Q-200 60 -228 250" stroke-width="18"/><path d="M255 -75 Q200 60 228 250" stroke-width="18"/><path d="M-150 120 Q-40 190 120 150" stroke-width="12" opacity=".5"/><path d="M-90 -120 Q0 -70 110 -110" stroke-width="10" opacity=".4"/><path d="M-330 -150 Q-300 -60 -300 -20" stroke-width="12"/><path d="M330 -150 Q300 -60 300 -20" stroke-width="12"/></g>
        <g fill="none" stroke="#fff" stroke-linecap="round" filter="url(#blur8)" opacity=".9"><path d="M-170 -230 Q-150 0 -170 300" stroke-width="26"/><path d="M130 -200 Q160 40 120 320" stroke-width="20" opacity=".6"/></g>'''
        collar = ('<path d="M-120 -330 Q0 -292 120 -330" fill="none" stroke="url(#rib)" stroke-width="20"/><path d="M-120 -330 Q0 -292 120 -330" fill="none" stroke="#9aa6b8" stroke-width="2" transform="translate(0 10)"/>' if back else
                  '<path d="M-120 -330 Q0 -292 120 -330 Q0 -180 -120 -330Z" fill="#c9d1dd"/><path d="M-120 -330 Q0 -292 120 -330" fill="none" stroke="#b4bdcb" stroke-width="3"/><path d="M-128 -326 Q0 -165 128 -326" fill="none" stroke="url(#rib)" stroke-width="22"/><path d="M-137 -322 Q0 -150 137 -322" fill="none" stroke="#a5afbf" stroke-width="2"/><rect x="-16" y="-292" width="32" height="20" rx="3" fill="#eef1f5" stroke="#b4bdcb" stroke-width="1.5"/>')
        return f'''<ellipse cx="{cx}" cy="1040" rx="330" ry="26" fill="#2b2350" opacity=".22" filter="url(#blur20)"/>
        <g transform="translate({cx} 610) scale(1.08)"><clipPath id="c{cx}"><path d="{p}"/></clipPath>
        <path d="{p}" fill="url(#tee)" filter="url(#sh)"/><g clip-path="url(#c{cx})">{folds}</g>
        <path d="{p}" fill="none" stroke="#9aa6b8" stroke-width="3" stroke-linejoin="round"/>{collar}
        <g fill="none" stroke="#9aa6b8" stroke-width="2" stroke-dasharray="9 7"><path d="M-255 348 Q0 370 255 348"/><path d="M-424 -72 L-343 -6"/><path d="M424 -72 L343 -6"/></g></g>'''
    b='<rect width="1600" height="1200" fill="url(#bg)"/><rect y="1000" width="1600" height="200" fill="#b9c3d3" opacity=".35"/>'+one(410,False)+one(1190,True)
    return svg(d,b,vig('#1f2a4a',.22))

# ---------- COAT OF ARMS ----------
def coat():
    d=lg('bg',[(0,'#f6edd8'),(.6,'#ecdfc2'),(1,'#d9c8a2')])+lg('navy',[(0,'#3d5a9a'),(.5,'#23407c'),(1,'#142757')],0,0,1,1)+lg('cream',[(0,'#fffdf5'),(1,'#e8ddc4')],0,0,1,1)+lg('rib',[(0,'#e2574c'),(.5,'#c23a34'),(1,'#8f2424')])+lg('ribd',[(0,'#8f2424'),(1,'#5e1418')])+lg('leaf',[(0,'#8cc79a'),(.5,'#3f8a5c'),(1,'#1f5a3c')],0,0,1,1)+rg('gem',[(0,'#ffd0d0'),(.4,'#e0444c'),(1,'#7a1420')])+rg('gemb',[(0,'#d6ecff'),(.4,'#3f7fd6'),(1,'#16306e')])
    sh="M-250 -300 H250 V20 C250 200 110 300 0 360 C-110 300 -250 200 -250 20Z"
    leaves=''
    for side in (1,-1):
        for i in range(12):
            a=math.radians(100+ i*13.5)
            px=math.cos(a)*440*side; py=-math.sin(a)*440+30
            rot=math.degrees(math.atan2(-math.cos(a)*-1, -math.sin(a)*side)) if False else (-(100+i*13.5)+90)*side
            for k,(sc,off) in enumerate(((1,38),(1,-38))):
                leaves+=f'<g transform="translate({px:.0f} {py:.0f}) rotate({rot + (off*side):.0f})"><path d="M0 0 Q26 -48 0 -104 Q-26 -48 0 0Z" fill="url(#leaf)"/><path d="M0 -6 L0 -92" stroke="#d8f0dc" stroke-width="2" opacity=".5"/></g>'
        leaves+=f'<path d="M{math.cos(math.radians(100))*440*side:.0f} {-math.sin(math.radians(100))*440+30:.0f} A440 440 0 0 {0 if side>0 else 1} {math.cos(math.radians(250))*440*side:.0f} {-math.sin(math.radians(250))*440+30:.0f}" fill="none" stroke="#2f6f4a" stroke-width="7"/>'
    b=f'''<rect width="1600" height="1200" fill="url(#bg)"/><rect width="1600" height="1200" filter="url(#paper)" opacity=".5"/>
    <g transform="translate(800 590)"><g filter="url(#shs)">{leaves}</g>
    <g filter="url(#sh)"><path d="{sh}" fill="url(#gold)" transform="scale(1.07)"/></g>
    <clipPath id="s"><path d="{sh}"/></clipPath><g clip-path="url(#s)"><rect x="-250" y="-300" width="250" height="320" fill="url(#navy)"/><rect x="0" y="-300" width="250" height="320" fill="url(#cream)"/><rect x="-250" y="20" width="250" height="360" fill="url(#cream)"/><rect x="0" y="20" width="250" height="360" fill="url(#navy)"/>
    <path d="M-250 -300 H250 V-240 Q0 -200 -250 -240Z" fill="#fff" opacity=".16"/><path d="M-250 -300 h70 L-250 300Z" fill="#fff" opacity=".10"/></g>
    <path d="M0 -300 V360 M-250 20 H250" stroke="url(#gold)" stroke-width="12"/><path d="{sh}" fill="none" stroke="#7a5512" stroke-width="2.5"/><path d="{sh}" fill="none" stroke="#7a5512" stroke-width="2" transform="scale(1.07)"/>
    <g filter="url(#sh)"><path d="M-150 -340 L-185 -500 L-90 -425 L0 -540 L90 -425 L185 -500 L150 -340Z" fill="url(#gold)" stroke="#7a5512" stroke-width="2.5" stroke-linejoin="round"/><rect x="-158" y="-352" width="316" height="34" rx="10" fill="url(#gold)" stroke="#7a5512" stroke-width="2.5"/></g>
    <circle cx="-185" cy="-506" r="17" fill="url(#gold)" stroke="#7a5512" stroke-width="2"/><circle cx="0" cy="-546" r="19" fill="url(#gold)" stroke="#7a5512" stroke-width="2"/><circle cx="185" cy="-506" r="17" fill="url(#gold)" stroke="#7a5512" stroke-width="2"/>
    <circle cx="-80" cy="-335" r="11" fill="url(#gem)"/><circle cx="0" cy="-335" r="12" fill="url(#gemb)"/><circle cx="80" cy="-335" r="11" fill="url(#gem)"/><circle cx="0" cy="-440" r="15" fill="url(#gem)"/>
    <g filter="url(#sh)"><path d="M-470 395 h130 v95 h-130 l42 -48z" fill="url(#ribd)"/><path d="M470 395 h-130 v95 h130 l-42 -48z" fill="url(#ribd)"/><path d="M-370 420 Q0 365 370 420 V520 Q0 465 -370 520Z" fill="url(#rib)"/></g>
    <path d="M-370 420 Q0 365 370 420 V445 Q0 390 -370 445Z" fill="#fff" opacity=".18"/><path d="M-370 520 l30 -30 v-80 M370 520 l-30 -30 v-80" fill="none" stroke="#5e1418" stroke-width="2" opacity=".5"/></g>'''
    return svg(d,b,vig('#4a3210',.25))

# ---------- CHRISTMAS ----------
def xmas():
    d=lg('bg',[(0,'#17402f'),(.5,'#10301f'),(1,'#081c12')])+lg('g1',[(0,'#5fb88a'),(1,'#2d7a59')])+lg('g2',[(0,'#3d9a6d'),(1,'#1b5a40')])+rg('red',[(0,'#ffb3ad'),(.4,'#d8423c'),(1,'#7d1518')])+rg('gb',[(0,'#fff6cf'),(.4,'#e9bf55'),(1,'#96691a')])+rg('glow',[(0,'#fff3c4'),(1,'#fff3c400')],.5,.5,.5)
    random.seed(3);body='<rect width="1600" height="1200" fill="url(#bg)"/><circle cx="520" cy="600" r="620" fill="url(#glow)" opacity=".22"/>'
    for i in range(110):
        x,y,r=random.uniform(0,1600),random.uniform(0,1200),random.uniform(1.5,5)
        body+=f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="#fff6d8" opacity="{random.uniform(.25,.9):.2f}"/>'
    body+='<rect x="60" y="60" width="1480" height="1080" fill="none" stroke="url(#gold)" stroke-width="5"/><rect x="78" y="78" width="1444" height="1044" fill="none" stroke="url(#gold)" stroke-width="1.5"/>'
    t='';cx=520
    for i in range(9):
        w=70+i*62;y=250+i*74
        t+=f'<g filter="url(#shs)"><rect x="{cx-w/2}" y="{y}" width="{w}" height="34" rx="17" fill="url(#{"g1" if i%2 else "g2"})"/></g><rect x="{cx-w/2+10}" y="{y+5}" width="{w-20}" height="7" rx="3.5" fill="#fff" opacity=".28"/>'
        if i%2==1:
            for k,(fx,col) in enumerate(((.22,'red'),(.78,'gb'))):
                bx=cx-w/2+w*fx;by=y+62
                t+=f'<line x1="{bx}" y1="{y+34}" x2="{bx}" y2="{by-14}" stroke="#e9bf55" stroke-width="2"/><circle cx="{bx}" cy="{by}" r="{15+ (i%3)}" fill="url(#{col})" filter="url(#shs)"/>'
    t+=f'<rect x="{cx-28}" y="{250+9*74}" width="56" height="90" rx="8" fill="#6b4526"/><rect x="{cx-28}" y="{250+9*74}" width="18" height="90" rx="8" fill="#8a5c34"/>'
    star=' '.join(f'{cx+ (62 if k%2==0 else 26)*math.cos(-math.pi/2+k*math.pi/5):.1f},{190+(62 if k%2==0 else 26)*math.sin(-math.pi/2+k*math.pi/5):.1f}' for k in range(10))
    t+=f'<circle cx="{cx}" cy="190" r="130" fill="url(#glow)" opacity=".7"/><polygon points="{star}" fill="url(#gold)" filter="url(#shs)" stroke="#7a5512" stroke-width="1.5"/>'
    body+=t+'<g transform="translate(1130 600)"><line x1="-230" y1="0" x2="230" y2="0" stroke="url(#gold)" stroke-width="3"/><circle r="12" fill="url(#red)"/><path d="M-230 0 l-14 -14 l-14 14 l14 14z M230 0 l14 -14 l14 14 l-14 14z" fill="url(#gold)"/><line x1="-150" y1="46" x2="150" y2="46" stroke="url(#gold)" stroke-width="1.5" opacity=".7"/><line x1="-150" y1="-46" x2="150" y2="-46" stroke="url(#gold)" stroke-width="1.5" opacity=".7"/></g>'
    return svg(d,body,vig('#000',.35))

# ---------- PHOTO BOOTH ----------
def booth():
    d=lg('bg',[(0,'#ffd9e6'),(.5,'#efe1ff'),(1,'#d5ecff')],0,0,1,1)+lg('pap',[(0,'#ffffff'),(1,'#ecebf2')],0,0,1,1)+lg('blk',[(0,'#3a3f4b'),(1,'#15171d')],0,0,1,1)+lg('ph',[(0,'#e6eaf2'),(.6,'#c5cedd'),(1,'#a9b5c9')])+lg('tape',[(0,'#ffe08a'),(1,'#f4c14e')])
    random.seed(7);b='<rect width="1600" height="1200" fill="url(#bg)"/>'
    cols=['#ff8fab','#ffd166','#6ecbf5','#9be7c4','#c9a7f5']
    for i in range(70):
        x,y=random.uniform(0,1600),random.uniform(0,1200);c=cols[i%5];r=random.uniform(0,360)
        b+= f'<g transform="translate({x:.0f} {y:.0f}) rotate({r:.0f})" filter="url(#shs)">'+(f'<circle r="{random.uniform(6,13):.0f}" fill="{c}"/>' if i%3==0 else f'<rect x="-14" y="-4" width="28" height="8" rx="4" fill="{c}"/>')+'</g>'
    def strip(cx,rot,fill):
        s=f'<g transform="translate({cx} 600) rotate({rot})"><g filter="url(#sh)"><rect x="-155" y="-510" width="310" height="1020" rx="8" fill="url(#{fill})"/></g>'
        for i in range(4):
            y=-482+i*222
            s+=f'<clipPath id="f{cx}{i}"><rect x="-130" y="{y}" width="260" height="200"/></clipPath><rect x="-130" y="{y}" width="260" height="200" fill="url(#ph)"/><g clip-path="url(#f{cx}{i})"><circle cx="0" cy="{y+78}" r="40" fill="#fff" opacity=".6"/><ellipse cx="0" cy="{y+205}" rx="88" ry="72" fill="#fff" opacity=".6"/><path d="M-130 {y} h90 l-120 200 h-10z" fill="#fff" opacity=".18"/></g><rect x="-130" y="{y}" width="260" height="200" fill="none" stroke="#2b2350" stroke-opacity=".18" stroke-width="2"/>'
        s+=f'<rect x="-60" y="-535" width="120" height="44" fill="url(#tape)" opacity=".85" transform="rotate({-rot*2})"/></g>'
        return s
    b+=strip(430,-7,'pap')+strip(800,2,'blk')+strip(1170,8,'pap')
    return svg(d,b,vig('#5a3a80',.18))

# ---------- GIFT TAGS ----------
def tags():
    d=lg('bg',[(0,'#f4eee3'),(1,'#e2d6c2')])+lg('kraft',[(0,'#d9b384'),(.5,'#c39a68'),(1,'#a57c4c')],0,0,1,1)+lg('ivory',[(0,'#fffdf7'),(1,'#ece3d2')],0,0,1,1)+lg('red',[(0,'#d9584d'),(1,'#9e2c2a')],0,0,1,1)+lg('green',[(0,'#4c9a72'),(1,'#1f5a40')],0,0,1,1)
    def scallop(r,n=14): 
        pts=[]
        for i in range(n*8):
            a=i/(n*8)*2*math.pi; rr=r*(1+.06*math.cos(a*n)); pts.append(f'{rr*math.cos(a):.1f},{rr*math.sin(a):.1f}')
        return 'M'+' L'.join(pts)+'Z'
    star='M'+' L'.join(f'{(150 if k%2==0 else 78)*math.cos(-math.pi/2+k*math.pi/5):.1f},{(150 if k%2==0 else 78)*math.sin(-math.pi/2+k*math.pi/5):.1f}' for k in range(10))+'Z'
    shapes=[('M-110 -170 L-60 -220 H60 L110 -170 V220 H-110Z','kraft',-200),('M0 -150 A150 150 0 1 1 -0.1 -150Z','ivory',-150),(scallop(150),'red',-159),('M0 -230 L120 -130 V220 H-120 V-130Z','green',-230),
            ('M-115 -190 a30 30 0 0 1 30 -30 h170 a30 30 0 0 1 30 30 v380 a30 30 0 0 1 -30 30 h-170 a30 30 0 0 1 -30 -30z','ivory',-220),('M0 -220 C150 -220 150 220 0 220 C-150 220 -150 -220 0 -220Z','kraft',-220),(star,'green',-150),('M-115 -220 H115 V220 L0 150 L-115 220Z','red',-220)]
    b='<rect width="1600" height="1200" fill="url(#bg)"/><rect width="1600" height="1200" filter="url(#paper)" opacity=".35"/>'
    rots=[-7,5,-3,6,5,-6,4,-5]
    for i,(p,f,top) in enumerate(shapes):
        cx=230+(i%4)*380; cy=350+(i//4)*540; hy=top+ (62 if f!='' else 0); dark=f in('red','green')
        if i==6: hy=-60
        tw='#b8493f' if i%2 else '#8a6a3d'
        b+=f'''<g transform="translate({cx} {cy}) rotate({rots[i]})"><g fill="none" stroke="{tw}" stroke-width="6" stroke-linecap="round" filter="url(#shs)"><path d="M0 {hy} C-30 {hy-110} 70 {hy-130} 26 {hy-200}"/><path d="M0 {hy} C40 {hy-90} -80 {hy-120} -40 {hy-190}"/></g>
        <path d="{p}" fill="url(#{f})" filter="url(#sh)"/><path d="{p}" filter="url(#paper)" opacity=".5" fill="#000" style="mix-blend-mode:multiply" clip-path="none" visibility="hidden"/>
        <path d="{p}" fill="none" stroke="{'#fff' if dark else '#7a5a34'}" stroke-opacity="{.6 if dark else .4}" stroke-width="2.5" stroke-dasharray="9 7" transform="scale(.86)"/>
        <circle cx="0" cy="{hy}" r="17" fill="url(#gold)"/><circle cx="0" cy="{hy}" r="10" fill="#e2d6c2"/><circle cx="0" cy="{hy}" r="10" fill="none" stroke="#7a5512" stroke-width="1.5"/></g>'''
    return svg(d,b,vig('#4a3210',.2))

# ---------- JIGSAW ----------
TAB=[(0,0),(.34,0),(.41,.02),(.40,.10),(.34,.19),(.36,.29),(.5,.34),(.64,.29),(.66,.19),(.60,.10),(.59,.02),(.66,0),(1,0)]
def edge(a,b,s):
    if s==0: return [a,b]
    dx,dy=b[0]-a[0],b[1]-a[1]
    return [(a[0]+dx*t-dy*p*s,a[1]+dy*t+dx*p*s) for t,p in TAB]
def smooth(pts,move=True):
    s=(f'M{pts[0][0]:.1f} {pts[0][1]:.1f}' if move else f'L{pts[0][0]:.1f} {pts[0][1]:.1f}')
    if len(pts)==2: return s+f' L{pts[1][0]:.1f} {pts[1][1]:.1f}'
    for i in range(1,len(pts)-1):
        mx,my=(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2
        s+=f' Q{pts[i][0]:.1f} {pts[i][1]:.1f} {mx:.1f} {my:.1f}'
    return s+f' L{pts[-1][0]:.1f} {pts[-1][1]:.1f}'
def jigsaw():
    random.seed(12);C,R,S=6,4,215;ox,oy=(1600-C*S)/2,(1200-R*S)/2
    hs=[[0 if r in(0,R) else random.choice((1,-1)) for c in range(C)] for r in range(R+1)]
    vs=[[0 if c in(0,C) else random.choice((1,-1)) for c in range(C+1)] for r in range(R)]
    H=lambda r,c: edge((ox+c*S,oy+r*S),(ox+(c+1)*S,oy+r*S),hs[r][c]); V=lambda r,c: edge((ox+c*S,oy+r*S),(ox+c*S,oy+(r+1)*S),vs[r][c])
    def piece(r,c): return smooth(H(r,c))+' '+smooth(V(r,c+1),False)+' '+smooth(H(r+1,c)[::-1],False)+' '+smooth(V(r,c)[::-1],False)+'Z'
    d=lg('bg',[(0,'#eaf0f7'),(.6,'#d6e0ec'),(1,'#b9c8da')])+lg('pc',[(0,'#ffffff'),(1,'#e9eef5')],0,0,1,1)+lg('pc2',[(0,'#f3f6fa'),(1,'#dde4ee')],0,0,1,1)+lg('gp',[(0,'#fff3bd'),(.3,'#f6cf63'),(.7,'#dba12c'),(1,'#a8741c')],0,0,1,1)+lg('hole',[(0,'#7f8da3'),(1,'#aab6c8')])
    b='<rect width="1600" height="1200" fill="url(#bg)"/>'
    b+=f'<rect x="{ox}" y="{oy}" width="{C*S}" height="{R*S}" rx="10" fill="#2b2350" opacity=".3" filter="url(#blur20)" transform="translate(8 26)"/>'
    pr,pc=1,3
    for r in range(R):
        for c in range(C):
            if (r,c)==(pr,pc): b+=f'<path d="{piece(r,c)}" fill="url(#hole)"/><path d="{piece(r,c)}" fill="none" stroke="#2b2350" stroke-opacity=".35" stroke-width="10" filter="url(#blur8)" clip-path="url(#hc)"/>'
            else: b+=f'<path d="{piece(r,c)}" fill="url(#{"pc" if (r+c)%2 else "pc2"})"/>'
    d+=f'<clipPath id="hc"><path d="{piece(pr,pc)}"/></clipPath>'
    for r in range(R):
        for c in range(C):
            if (r,c)!=(pr,pc): b+=f'<path d="{piece(r,c)}" fill="none" stroke="#fff" stroke-width="5" opacity=".9" transform="translate(1.5 1.5)"/><path d="{piece(r,c)}" fill="none" stroke="#6f7f99" stroke-width="2.6" stroke-linejoin="round"/>'
    cxp,cyp=ox+pc*S+S/2,oy+pr*S+S/2
    b+=f'<g transform="translate(95 -105) rotate(13 {cxp} {cyp})"><path d="{piece(pr,pc)}" fill="#2b2350" opacity=".35" filter="url(#blur20)" transform="translate(-20 60)"/><path d="{piece(pr,pc)}" fill="url(#gp)" stroke="#8a5f14" stroke-width="2.5"/><clipPath id="gc"><path d="{piece(pr,pc)}"/></clipPath><g clip-path="url(#gc)"><path d="M{cxp-160} {cyp-150} h130 l-150 330 h-60z" fill="#fff" opacity=".35"/><path d="{piece(pr,pc)}" fill="none" stroke="#fff8d6" stroke-width="10" opacity=".7" transform="translate(3 3)"/></g></g>'
    return svg(d,b,vig('#1f2a4a',.22))
