--[[
  DUNIA KOTAK (Roblox) - PEMBANGUN MAP v1
  ---------------------------------------------------------------
  CARA PAKAI:
  1. Buka Roblox Studio, buat game baru dari template "Baseplate".
  2. Menu atas: tab VIEW -> klik "Command Bar" (kotak ketik muncul di bawah).
  3. Salin SELURUH isi file ini, tempel di Command Bar, tekan Enter.
  4. Tunggu 1-3 detik. Map muncul di folder Workspace > DuniaKotak.
  (Bisa juga dipasang sebagai Script di ServerScriptService: map dibangun
  otomatis setiap server Roblox menyala. Versi terbit otomatis memakai cara ini.)

  Aman dijalankan ulang: map lama dihapus dulu, lalu dibangun baru
  dengan tata letak yang sama persis.

  Isi map:
  - Alun-alun di tengah (tugu kotak, papan selamat datang, titik muncul)
  - 5 dusun: Curug (utara), Kulon (barat), Wetan (timur),
    Tlaga (selatan), Segara (barat daya, tepi laut)
  - Gapura nama di pintu masuk tiap dusun
  - Jalan aspal + marka, koin emas di sepanjang jalan
  - 2 kavling kosong per dusun (pemain bisa klaim rumah, butuh Skrip 2)
  - Ciri khas: air terjun Curug, sawah Kulon, Warung Raka + kucing Oyen
    di Wetan, telaga + calon Taman Hiburan di Tlaga, dermaga di Segara,
    Pos Pemadam di pojok Wetan
]]

local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")
local Terrain = Workspace:FindFirstChildOfClass("Terrain")

-- Bersihkan map lama, baseplate bawaan, dan titik muncul bawaan
local lama = Workspace:FindFirstChild("DuniaKotak")
if lama then lama:Destroy() end
for _, o in ipairs(Workspace:GetChildren()) do
	if o.Name == "Baseplate" or o:IsA("SpawnLocation") then
		o:Destroy()
	end
end
if Terrain then
	Terrain:Clear()
end

-- Folder utama dibuat dulu tanpa induk, baru dipasang ke Workspace di akhir
local ROOT = Instance.new("Folder")
ROOT.Name = "DuniaKotak"

local rng = Random.new(2026) -- angka tetap = tata letak sama tiap dijalankan

local C = {
	rumput = Color3.fromRGB(110, 190, 90),
	jalan = Color3.fromRGB(70, 72, 80),
	garis = Color3.fromRGB(245, 245, 235),
	pasir = Color3.fromRGB(240, 215, 150),
	batu = Color3.fromRGB(130, 130, 140),
	kayu = Color3.fromRGB(120, 80, 50),
	daun = Color3.fromRGB(60, 150, 70),
	air = Color3.fromRGB(70, 160, 230),
	putih = Color3.fromRGB(250, 250, 250),
	kuning = Color3.fromRGB(255, 205, 60),
	paving = Color3.fromRGB(215, 205, 190),
	gelap = Color3.fromRGB(30, 30, 40),
	merah = Color3.fromRGB(210, 50, 50),
	oyen = Color3.fromRGB(235, 140, 40),
}

local WARNA_RUMAH = {
	Color3.fromRGB(255, 120, 120), Color3.fromRGB(120, 180, 255),
	Color3.fromRGB(255, 220, 110), Color3.fromRGB(150, 220, 150),
	Color3.fromRGB(200, 150, 255), Color3.fromRGB(255, 170, 210),
	Color3.fromRGB(120, 220, 220), Color3.fromRGB(240, 240, 240),
}

---------------------------------------------------------------------
-- Alat bantu
---------------------------------------------------------------------
local function folder(nama, induk)
	local f = Instance.new("Folder")
	f.Name = nama
	f.Parent = induk or ROOT
	return f
end

local function box(induk, nama, ukuran, cf, warna, bahan, extra)
	local p = Instance.new("Part")
	p.Name = nama
	p.Anchored = true
	p.Size = ukuran
	p.CFrame = cf
	p.Color = warna
	p.Material = bahan or Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	if extra then
		for k, v in pairs(extra) do
			p[k] = v
		end
	end
	p.Parent = induk
	return p
end

local function teks(part, isi, wTeks, face, nama)
	local g = Instance.new("SurfaceGui")
	g.Name = nama or "Teks"
	g.Face = face or Enum.NormalId.Front
	g.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	g.PixelsPerStud = 40
	g.LightInfluence = 0
	g.Parent = part
	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundTransparency = 1
	t.TextColor3 = wTeks or C.putih
	t.TextStrokeTransparency = 0.4
	t.TextScaled = true
	t.Font = Enum.Font.FredokaOne
	t.Text = isi
	t.Parent = g
	return g
end

local function datar(v)
	return Vector3.new(v.X, 0, v.Z)
end

-- Papan/gapura: dua tiang + papan, tulisan menghadap arah 'hadap'
local function papan(induk, pos, hadap, judul, warna, lebar, tinggi)
	lebar = lebar or 16
	tinggi = tinggi or 5
	local m = Instance.new("Model")
	m.Name = "Papan " .. judul:gsub("\n", " ")
	m.Parent = induk
	local cf = CFrame.lookAt(pos, pos + datar(hadap))
	local tTiang = 7.5 + tinggi
	box(m, "Tiang", Vector3.new(1.2, tTiang, 1.2), cf * CFrame.new(-lebar / 2 + 1, tTiang / 2, 0), C.kayu, Enum.Material.Wood)
	box(m, "Tiang", Vector3.new(1.2, tTiang, 1.2), cf * CFrame.new(lebar / 2 - 1, tTiang / 2, 0), C.kayu, Enum.Material.Wood)
	local b = box(m, "Papan", Vector3.new(lebar, tinggi, 0.6), cf * CFrame.new(0, 7.5 + tinggi / 2, 0), warna)
	teks(b, judul, C.putih, Enum.NormalId.Front)
	teks(b, judul, C.putih, Enum.NormalId.Back)
	return m
end

-- Rumah kotak: badan, atap, pintu menghadap 'hadap', dua jendela
local function rumah(induk, pos, hadap, warna, nama)
	local w = rng:NextInteger(14, 20)
	local d = rng:NextInteger(14, 18)
	local h = rng:NextInteger(10, 16)
	local m = Instance.new("Model")
	m.Name = nama or "Rumah"
	m.Parent = induk
	local cf = CFrame.lookAt(pos, pos + datar(hadap))
	local badan = box(m, "Badan", Vector3.new(w, h, d), cf * CFrame.new(0, h / 2, 0), warna)
	box(m, "Atap", Vector3.new(w + 2, 2, d + 2), cf * CFrame.new(0, h + 1, 0), warna:Lerp(Color3.new(0, 0, 0), 0.35))
	box(m, "Pintu", Vector3.new(4, 7, 0.4), cf * CFrame.new(0, 3.5, -d / 2 - 0.2), C.kayu, Enum.Material.Wood)
	for _, x in ipairs({ -w / 2 + 3, w / 2 - 3 }) do
		box(m, "Jendela", Vector3.new(3, 3, 0.4), cf * CFrame.new(x, h * 0.6, -d / 2 - 0.2),
			Color3.fromRGB(180, 225, 255), Enum.Material.Glass, { Transparency = 0.2 })
	end
	m.PrimaryPart = badan
	return m
end

-- Pusat dusun (dipakai supaya pohon pinggir jalan tidak menabrak rumah)
local PUSAT_DUSUN = {
	Vector3.new(0, 0, -260), Vector3.new(-260, 0, 0), Vector3.new(260, 0, 0),
	Vector3.new(0, 0, 250), Vector3.new(-260, 0, 250),
}
local function dekatDusun(pos)
	for _, p in ipairs(PUSAT_DUSUN) do
		if (datar(pos) - p).Magnitude < 88 then
			return true
		end
	end
	return false
end

-- Pohon kotak
local POHON
local function pohon(pos)
	local t = rng:NextInteger(6, 10)
	box(POHON, "Batang", Vector3.new(2, t, 2), CFrame.new(pos + Vector3.new(0, t / 2, 0)), C.kayu, Enum.Material.Wood)
	local s = rng:NextInteger(6, 9)
	box(POHON, "Daun", Vector3.new(s, s, s),
		CFrame.new(pos + Vector3.new(0, t + s / 2 - 1, 0)) * CFrame.Angles(0, math.rad(rng:NextInteger(0, 45)), 0),
		C.daun:Lerp(C.kuning, rng:NextNumber(0, 0.25)), Enum.Material.Grass)
end

-- Jalan dari titik a ke b (keduanya y = 0) + marka + koin
local JALAN, KOIN
local nKoin = 0
local function koin(pos)
	nKoin += 1
	box(KOIN, "Koin", Vector3.new(0.6, 4, 4), CFrame.new(pos), C.kuning, Enum.Material.SmoothPlastic, {
		Shape = Enum.PartType.Cylinder,
		CanCollide = false,
		Reflectance = 0.2,
	})
end

local function jalan(a, b, lebar)
	lebar = lebar or 20
	local mid = (a + b) / 2
	local len = (b - a).Magnitude
	local arah = (b - a).Unit
	local cf = CFrame.lookAt(mid, b)
	box(JALAN, "Jalan", Vector3.new(lebar, 0.4, len + lebar), cf * CFrame.new(0, 0.2, 0), C.jalan, Enum.Material.Asphalt)
	local n = math.floor(len / 12)
	for i = 1, n - 1 do
		box(JALAN, "Marka", Vector3.new(0.8, 0.1, 5), cf * CFrame.new(0, 0.45, -len / 2 + i * 12), C.garis)
	end
	local samping = Vector3.new(-arah.Z, 0, arah.X)
	local sisi = 1
	for jarak = 30, len - 20, 40 do
		koin(a + arah * jarak + samping * 5 * sisi + Vector3.new(0, 3, 0))
		sisi = -sisi
	end
	-- pohon di kiri-kanan jalan
	for jarak = 25, len - 25, 35 do
		for _, s in ipairs({ -1, 1 }) do
			local p = a + arah * jarak + samping * (lebar / 2 + 6) * s
			if rng:NextNumber() < 0.6 and not dekatDusun(p) then
				pohon(p)
			end
		end
	end
end

---------------------------------------------------------------------
-- Tanah, laut, batas
---------------------------------------------------------------------
local ALAM = folder("Alam")
POHON = folder("Pohon", ALAM)
JALAN = folder("Jalan")
KOIN = folder("Koin")
local KAVLING = folder("Kavling")

-- Tanah: X -420..420, Z -420..330 (selatan z>330 = laut)
box(ALAM, "Tanah", Vector3.new(840, 4, 750), CFrame.new(0, -2, -45), C.rumput, Enum.Material.Grass)
-- Pantai
box(ALAM, "Pantai", Vector3.new(840, 0.4, 30), CFrame.new(0, 0.2, 315), C.pasir, Enum.Material.Sand)
-- Laut (air Terrain asli, bisa berenang)
if Terrain then
	Terrain:FillBlock(CFrame.new(0, -15, 445), Vector3.new(840, 6, 230), Enum.Material.Sand)
	Terrain:FillBlock(CFrame.new(0, -6, 445), Vector3.new(840, 12, 230), Enum.Material.Water)
else
	box(ALAM, "Laut", Vector3.new(840, 1, 230), CFrame.new(0, -0.5, 445), C.air, Enum.Material.Glass, { Transparency = 0.2 })
end

-- Dinding tak terlihat supaya pemain tidak jatuh dari tepi map
local function dinding(ukuran, pos)
	box(ALAM, "Batas", ukuran, CFrame.new(pos), C.putih, nil, { Transparency = 1 })
end
dinding(Vector3.new(4, 80, 990), Vector3.new(-422, 40, 75))
dinding(Vector3.new(4, 80, 990), Vector3.new(422, 40, 75))
dinding(Vector3.new(848, 80, 4), Vector3.new(0, 40, -422))
dinding(Vector3.new(848, 80, 4), Vector3.new(0, 40, 562))

---------------------------------------------------------------------
-- Alun-alun (tengah)
---------------------------------------------------------------------
local ALUN = folder("Alun-alun")
box(ALUN, "Lantai", Vector3.new(90, 0.4, 90), CFrame.new(0, 0.2, 0), C.paving, Enum.Material.Pavement)
box(ALUN, "Tugu Dasar", Vector3.new(14, 2, 14), CFrame.new(0, 1, 0), C.batu, Enum.Material.Slate)
box(ALUN, "Tugu Tiang", Vector3.new(6, 16, 6), CFrame.new(0, 10, 0), C.putih, Enum.Material.Marble)
local puncak = box(ALUN, "Tugu Kotak", Vector3.new(9, 9, 9), CFrame.new(0, 22.5, 0), C.kuning, Enum.Material.Neon)
for _, f in ipairs({ Enum.NormalId.Front, Enum.NormalId.Back, Enum.NormalId.Left, Enum.NormalId.Right }) do
	teks(puncak, "DK", C.gelap, f)
end

local spawn = Instance.new("SpawnLocation")
spawn.Name = "Muncul"
spawn.Anchored = true
spawn.Neutral = true
spawn.Size = Vector3.new(12, 1, 12)
spawn.CFrame = CFrame.new(0, 0.5, 28)
spawn.Color = C.kuning
spawn.Material = Enum.Material.SmoothPlastic
spawn.TopSurface = Enum.SurfaceType.Smooth
spawn.Duration = 3
spawn.Parent = ALUN

papan(ALUN, Vector3.new(0, 0, -34), Vector3.new(0, 0, 1),
	"SELAMAT DATANG DI DUNIA KOTAK\nKumpulkan koin di jalan\n& klaim rumahmu di 5 dusun!",
	Color3.fromRGB(44, 49, 80), 34, 12)

for _, p in ipairs({ Vector3.new(-38, 0, -38), Vector3.new(38, 0, -38), Vector3.new(-38, 0, 38), Vector3.new(38, 0, 38) }) do
	pohon(p)
end

---------------------------------------------------------------------
-- Dusun
---------------------------------------------------------------------
local DUSUN = {
	{ nama = "Curug", pusat = Vector3.new(0, 0, -260), warna = Color3.fromRGB(40, 170, 170), hadap = Vector3.new(0, 0, 1) },
	{ nama = "Kulon", pusat = Vector3.new(-260, 0, 0), warna = Color3.fromRGB(120, 180, 40), hadap = Vector3.new(1, 0, 0) },
	{ nama = "Wetan", pusat = Vector3.new(260, 0, 0), warna = Color3.fromRGB(220, 70, 80), hadap = Vector3.new(-1, 0, 0) },
	{ nama = "Tlaga", pusat = Vector3.new(0, 0, 250), warna = Color3.fromRGB(150, 90, 210), hadap = Vector3.new(0, 0, -1) },
	{ nama = "Segara", pusat = Vector3.new(-260, 0, 250), warna = Color3.fromRGB(30, 120, 220), hadap = Vector3.new(0, 0, -1) },
}

for _, d in ipairs(DUSUN) do
	local f = folder("Dusun " .. d.nama)
	box(f, "Alas", Vector3.new(150, 0.3, 150), CFrame.new(d.pusat + Vector3.new(0, 0.15, 0)),
		d.warna:Lerp(C.rumput, 0.75), Enum.Material.Grass)
	box(f, "Lapangan", Vector3.new(26, 0.5, 26), CFrame.new(d.pusat + Vector3.new(0, 0.25, 0)), C.paving, Enum.Material.Pavement)
	-- Gapura di pintu masuk
	papan(f, d.pusat + d.hadap * 80, d.hadap, "DUSUN " .. string.upper(d.nama), d.warna, 26, 5)

	-- 8 lahan melingkar: 6 rumah + 2 kavling kosong
	local rumahF = folder("Rumah", f)
	for i = 0, 7 do
		local sudut = i * math.pi / 4 + math.pi / 8
		local pos = d.pusat + Vector3.new(math.cos(sudut) * 55, 0, math.sin(sudut) * 55)
		local hadap = (d.pusat - pos).Unit
		if i == 1 or i == 5 then
			local alasPos = pos + Vector3.new(0, 0.4, 0)
			local kav = box(KAVLING, "Kavling", Vector3.new(20, 0.5, 20),
				CFrame.lookAt(alasPos, alasPos + hadap), C.putih, Enum.Material.Concrete)
			kav:SetAttribute("Dusun", d.nama)
			kav:SetAttribute("Hadap", hadap)
			teks(kav, "KAVLING KOSONG\nklaim di sini", d.warna, Enum.NormalId.Top, "Label")
		else
			rumah(rumahF, pos, hadap, WARNA_RUMAH[rng:NextInteger(1, #WARNA_RUMAH)])
		end
	end
	-- pohon di sudut dusun
	for _, s in ipairs({ Vector3.new(-62, 0, -62), Vector3.new(62, 0, -62), Vector3.new(-62, 0, 62), Vector3.new(62, 0, 62) }) do
		pohon(d.pusat + s)
	end
end

---------------------------------------------------------------------
-- Jalan antar-dusun
---------------------------------------------------------------------
local V = Vector3.new
jalan(V(0, 0, -45), V(0, 0, -260))      -- Alun-alun - Curug
jalan(V(-45, 0, 0), V(-260, 0, 0))      -- Alun-alun - Kulon
jalan(V(45, 0, 0), V(260, 0, 0))        -- Alun-alun - Wetan
jalan(V(0, 0, 45), V(0, 0, 250))        -- Alun-alun - Tlaga
jalan(V(-260, 0, 0), V(-260, 0, 250))   -- Kulon - Segara
jalan(V(-260, 0, 250), V(0, 0, 250))    -- Segara - Tlaga
jalan(V(260, 0, 0), V(260, 0, 250))     -- Wetan - pojok selatan
jalan(V(260, 0, 250), V(0, 0, 250))     -- pojok selatan - Tlaga

---------------------------------------------------------------------
-- Ciri khas tiap dusun
---------------------------------------------------------------------
-- CURUG: tebing + air terjun + kolam
local curug = ROOT["Dusun Curug"]
box(curug, "Tebing", Vector3.new(70, 45, 24), CFrame.new(0, 22.5, -372), C.batu, Enum.Material.Slate)
box(curug, "Air Terjun", Vector3.new(18, 42, 1), CFrame.new(0, 21, -359.6), C.air, Enum.Material.Glass,
	{ Transparency = 0.25, CanCollide = false })
box(curug, "Kolam", Vector3.new(32, 0.6, 18), CFrame.new(0, 0.3, -348), C.air, Enum.Material.Glass,
	{ Transparency = 0.2, CanCollide = false })

-- KULON: sawah bertingkat di barat
local kulon = ROOT["Dusun Kulon"]
for i = -2, 2 do
	box(kulon, "Sawah", Vector3.new(40, 0.6, 22), CFrame.new(-375, 0.3, i * 26),
		Color3.fromRGB(150, 200, 60):Lerp(C.kuning, (i + 2) * 0.08), Enum.Material.Grass)
	box(kulon, "Pematang", Vector3.new(40, 0.9, 3), CFrame.new(-375, 0.45, i * 26 + 12.5), C.kayu, Enum.Material.Ground)
end

-- WETAN: Warung Raka + kucing Oyen
local wetan = ROOT["Dusun Wetan"]
local warung = Instance.new("Model")
warung.Name = "Warung Raka"
warung.Parent = wetan
local wp = Vector3.new(260, 0, -22)
box(warung, "Meja", Vector3.new(14, 4, 4), CFrame.new(wp + V(0, 2, 0)), C.kayu, Enum.Material.Wood)
for _, x in ipairs({ -7, 7 }) do
	for _, z in ipairs({ -4, 2 }) do
		box(warung, "Tiang", V(1, 10, 1), CFrame.new(wp + V(x, 5, z)), C.kayu, Enum.Material.Wood)
	end
end
box(warung, "Atap", V(18, 1, 10), CFrame.new(wp + V(0, 10.5, -1)), C.merah)
local plang = box(warung, "Plang", V(14, 3, 0.5), CFrame.new(wp + V(0, 12.5, 2)), C.kuning)
teks(plang, "WARUNG RAKA", C.gelap, Enum.NormalId.Back)
teks(plang, "WARUNG RAKA", C.gelap, Enum.NormalId.Front)

local oyen = Instance.new("Model")
oyen.Name = "Oyen"
oyen.Parent = wetan
local op = wp + V(10, 0, 4)
box(oyen, "Badan", V(2, 1.6, 3.2), CFrame.new(op + V(0, 1.2, 0)), C.oyen)
box(oyen, "Kepala", V(1.8, 1.8, 1.8), CFrame.new(op + V(0, 2.2, 2)), C.oyen)
box(oyen, "Telinga", V(0.5, 0.6, 0.4), CFrame.new(op + V(-0.55, 3.3, 2)), C.oyen)
box(oyen, "Telinga", V(0.5, 0.6, 0.4), CFrame.new(op + V(0.55, 3.3, 2)), C.oyen)
box(oyen, "Ekor", V(0.4, 0.4, 2.4), CFrame.new(op + V(0, 2, -2)) * CFrame.Angles(math.rad(40), 0, 0), C.oyen)

-- Pos Pemadam di pojok selatan Wetan
local damkar = Instance.new("Model")
damkar.Name = "Pos Pemadam"
damkar.Parent = wetan
box(damkar, "Gedung", V(26, 14, 22), CFrame.new(305, 7, 250), C.merah)
box(damkar, "Atap", V(28, 2, 24), CFrame.new(305, 15, 250), Color3.fromRGB(140, 30, 30))
local pd = box(damkar, "Plang", V(20, 3, 0.5), CFrame.new(291.7, 11, 250) * CFrame.Angles(0, math.rad(90), 0), C.putih)
teks(pd, "POS PEMADAM", C.merah, Enum.NormalId.Front)
teks(pd, "POS PEMADAM", C.merah, Enum.NormalId.Back)

-- TLAGA: telaga dangkal + papan calon Taman Hiburan (hasil voting warga web)
local tlaga = ROOT["Dusun Tlaga"]
box(tlaga, "Telaga", V(110, 0.6, 90), CFrame.new(165, 0.3, 160), C.air, Enum.Material.Glass,
	{ Transparency = 0.15, CanCollide = false })
papan(tlaga, V(100, 0, 120), V(-1, 0, 0), "SEGERA DIBANGUN:\nTAMAN HIBURAN", Color3.fromRGB(150, 90, 210), 22, 7)

-- SEGARA: dermaga + perahu
local segara = ROOT["Dusun Segara"]
box(segara, "Dermaga", V(8, 1, 60), CFrame.new(-260, 0.5, 358), C.kayu, Enum.Material.WoodPlanks)
box(segara, "Perahu", V(6, 2, 12), CFrame.new(-248, 0.6, 378), Color3.fromRGB(200, 60, 60), Enum.Material.Wood)

---------------------------------------------------------------------
-- Pencahayaan
---------------------------------------------------------------------
Lighting.ClockTime = 14
Lighting.Brightness = 2
if not Lighting:FindFirstChildOfClass("Atmosphere") then
	local atm = Instance.new("Atmosphere")
	atm.Density = 0.25
	atm.Parent = Lighting
end

ROOT.Parent = Workspace
print(("Dunia Kotak selesai dibangun: 5 dusun, %d koin, %d kavling."):format(nKoin, #KAVLING:GetChildren()))
