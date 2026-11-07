# Bangku taman kota (sand3d)
import sand3d as s3d
bilah = [s3d.at(s3d.box(f"duduk{i}", 1600, 90, 35), y=-150 + i * 105, z=430) for i in range(4)]
sandar = [s3d.at(s3d.box(f"sandar{i}", 1600, 30, 90), y=210, z=560 + i * 110, rx=-12) for i in range(3)]
for b in bilah + sandar: s3d.fillet(b, 8, "all")
s3d.material(bilah + sandar, "walnut", color="#7A5A44")
rangka = []
for sx in (-1, 1):
    rangka.append(s3d.at(s3d.box(f"kakiD{sx}", 50, 50, 430), x=sx * 650, y=-170))
    rangka.append(s3d.at(s3d.box(f"kakiB{sx}", 50, 50, 900), x=sx * 650, y=200, rx=-6))
    rangka.append(s3d.at(s3d.box(f"palang{sx}", 50, 440, 50), x=sx * 650, y=15, z=380))
s3d.material(rangka, "painted_metal", color="#1E2022")
s3d.export(s3d.group("bangku", *bilah, *sandar, *rangka), "../bangku.glb")
