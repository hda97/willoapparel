# Lampu jalan kota (sand3d)
import sand3d as s3d
alas = s3d.cone("alas", 360, 500, 200); tiang = s3d.at(s3d.cylinder("tiang", 140, 5200), z=500)
lengan = s3d.at(s3d.cylinder("lengan", 80, 900), z=5500, ry=90, x=400)
s3d.material([alas, tiang, lengan], "painted_metal", color="#2F3236")
kap = s3d.at(s3d.dome("kap", 520, 160), x=850, z=5420); s3d.material(kap, "painted_metal", color="#1E2022")
bohlam = s3d.at(s3d.cylinder("bohlam", 380, 40), x=850, z=5390); s3d.material(bohlam, "light", color="#F3E6C8")
s3d.export(s3d.group("lampu", alas, tiang, lengan, kap, bohlam), "../lampu.glb")
