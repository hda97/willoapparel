# Meja water station dengan botol isotonik (sand3d)
import sand3d as s3d
atas = s3d.box("atas", 1100, 3000, 40); s3d.at(atas, z=760); s3d.material(atas, "oak", color="#B8A692")
taplak = s3d.box("taplak", 1110, 3010, 320); s3d.at(taplak, z=460); s3d.material(taplak, "fabric", color="#4A5844")
kaki = [s3d.at(s3d.cylinder(f"kaki{i}", 40, 460), x=sx * 480, y=sy * 1400) for i, (sx, sy) in enumerate([(-1, -1), (-1, 1), (1, -1), (1, 1)])]
s3d.material(kaki, "brushed_steel", color="#8A8D91")
botol, tutup = [], []
for i in range(5):
    for j, x in enumerate((-250, 0, 250)):
        b = s3d.join(s3d.cylinder(f"botol{i}_{j}", 72, 160), s3d.at(s3d.cone(f"leher{i}_{j}", 72, 45, 28), z=160))
        s3d.at(b, x=x, y=-1200 + i * 600, z=800); botol.append(b)
        t = s3d.at(s3d.cylinder(f"tutup{i}_{j}", 30, 22), x=x, y=-1200 + i * 600, z=1005); tutup.append(t)
s3d.material(botol, "glass", color="#C9D6CC", opacity=0.85)
s3d.material(tutup, "plastic", color="#C5A890")
s3d.export(s3d.group("meja_air", atas, taplak, *kaki, *botol, *tutup), "../meja_air.glb")
