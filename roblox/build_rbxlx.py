"""Rakit file tempat Roblox (.rbxlx) dari skrip di roblox/src/.

Hasil: roblox/build/DuniaKotak.rbxlx berisi ServerScriptService dengan
semua file *.server.lua sebagai Script. Map dibangun oleh BangunMap saat
server Roblox menyala, jadi tidak perlu Roblox Studio.
"""
from pathlib import Path

DIR = Path(__file__).parent
SRC = DIR / "src"
OUT = DIR / "build" / "DuniaKotak.rbxlx"

# Urutan: BangunMap dulu (skrip game menunggu folder DuniaKotak lewat WaitForChild)
URUTAN = ["BangunMap", "GameDuniaKotak"]


def cdata(teks: str) -> str:
    return "<![CDATA[" + teks.replace("]]>", "]]]]><![CDATA[>") + "]]>"


def main() -> None:
    skrip = sorted(SRC.glob("*.server.lua"),
                   key=lambda p: (URUTAN.index(p.name.split(".")[0]) if p.name.split(".")[0] in URUTAN else 99, p.name))
    items = []
    for i, f in enumerate(skrip, start=10):
        nama = f.name.split(".")[0]
        items.append(
            f'    <Item class="Script" referent="RBX{i}">\n'
            f'      <Properties>\n'
            f'        <string name="Name">{nama}</string>\n'
            f'        <bool name="Disabled">false</bool>\n'
            f'        <ProtectedString name="Source">{cdata(f.read_text(encoding="utf-8"))}</ProtectedString>\n'
            f'      </Properties>\n'
            f'    </Item>'
        )
    xml = (
        '<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" version="4">\n'
        '  <Item class="Workspace" referent="RBX1">\n'
        '    <Properties><string name="Name">Workspace</string></Properties>\n'
        '  </Item>\n'
        '  <Item class="ServerScriptService" referent="RBX2">\n'
        '    <Properties><string name="Name">ServerScriptService</string></Properties>\n'
        + "\n".join(items) + "\n"
        '  </Item>\n'
        '</roblox>\n'
    )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(xml, encoding="utf-8")
    print(f"{OUT} ({len(skrip)} skrip, {len(xml)} byte)")


if __name__ == "__main__":
    main()
