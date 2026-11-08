# Pembatas jalan lomba lari: papan bergaris krem/onyx di atas dua kaki (sand3d)
import sand3d as s3d
papan = s3d.box("papan", 1900, 80, 320); s3d.fillet(papan, 12, "all"); s3d.at(papan, z=460)
s3d.material(papan, "painted_metal", color="#EFECE6")
garis = []
for i in range(6):
    g = s3d.box(f"garis{i}", 150, 84, 330); s3d.at(g, x=-800 + i * 320, z=455, ry=35)
    garis.append(g)
garis = s3d.intersect(s3d.join(garis[0], *garis[1:]), s3d.at(s3d.box("batas", 1890, 90, 310), z=465))
s3d.material(garis, "painted_metal", color="#1E2022")
kaki = []
for sx in (-1, 1):
    tiang = s3d.at(s3d.box(f"tiang{sx}", 70, 60, 470), x=sx * 760)
    alas = s3d.at(s3d.box(f"alas{sx}", 120, 420, 40), x=sx * 760); s3d.fillet(alas, 10, "all")
    kaki += [tiang, alas]
s3d.material(kaki, "rubber", color="#2F3236")
s3d.export(s3d.group("pembatas", papan, garis, *kaki), "../pembatas.glb")
