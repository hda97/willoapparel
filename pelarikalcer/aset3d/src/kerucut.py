# Kerucut lalu lintas CFD (sand3d). Satuan mm, ekspor ke meter.
import sand3d as s3d
alas = s3d.box("alas", 360, 360, 30); s3d.fillet(alas, 20, "all")
s3d.material(alas, "rubber", color="#1E2022")
badan = s3d.revolve("badan", [(0, 0), (150, 0), (40, 700), (0, 700)])
s3d.at(badan, z=30); s3d.material(badan, "plastic", color="#C0623F")
r = lambda h: 150 - 110 * h / 700  # jari-jari badan pada ketinggian h
pita = [s3d.at(s3d.cone(f"pita{i}", 2 * r(h) + 6, 70, 2 * r(h + 70) + 6), z=30 + h) for i, h in enumerate((220, 430))]
s3d.material(pita, "glossy_plastic", color="#EFECE6")
s3d.export(s3d.group("kerucut", alas, badan, *pita), "../kerucut.glb")
