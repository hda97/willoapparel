--[[
  PelariKalcer (LocalScript) - lobi, lari, dan HUD Pelari Kalcer. Hitungan lari disalin dari langkah() di
  pelarikalcer-kotak/src/main.js game web: tiga lajur, lompat, sprint yang menguras stamina, THE WALL di bawah 22%,
  3 nyawa, koin, bekal di jalan (petir, magnet, perisai, hati), water station di meter 505 sampai 572, dan 12 pelari lain.

  Kendali: A/D atau panah kiri/kanan pindah lajur, W / panah atas / spasi lompat, Shift ditahan sprint, E ambil isotonik.
  Di HP pakai tombol layar. Atribut pemain DK_PelariAuto = true membuat pelari menghindar sendiri (untuk uji coba).
  Tempat: StarterPlayer.StarterPlayerScripts.PelariKalcer.
  Pasangannya: ServerScriptService.PelariKalcer (DK_Pelari, DK_PelariBuka) dan ReplicatedStorage.DK_PelariLintasan.
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local GuiService = game:GetService("GuiService")

local player = Players.LocalPlayer
local pintu = ReplicatedStorage:WaitForChild("DK_Pelari")
local bukaEv = ReplicatedStorage:WaitForChild("DK_PelariBuka")
local PL = require(ReplicatedStorage:WaitForChild("DK_PelariLintasan"))

local GELAP = Color3.fromRGB(29, 29, 34)
local KUNING = Color3.fromRGB(255, 196, 37)
local PUTIH = Color3.new(1, 1, 1)
local ABU = Color3.fromRGB(52, 52, 60)
local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local BERAT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)
local function rgb(r, g, b) return Color3.fromRGB(r, g, b) end

local pg = player:WaitForChild("PlayerGui")
local lama = pg:FindFirstChild("PelariKalcer")
if lama then lama:Destroy() end
local gui = Instance.new("ScreenGui")
gui.Name = "PelariKalcer"
gui.ResetOnSpawn = false
gui.DisplayOrder = 27
gui.Parent = pg

local dunia = workspace:FindFirstChild("DK_PelariKlien")
if dunia then dunia:Destroy() end
dunia = Instance.new("Folder")
dunia.Name = "DK_PelariKlien"
dunia.Parent = workspace

local function bulat(o, r)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, r)
	c.Parent = o
end

local function label(induk, isi, font, ukuran, warna)
	local t = Instance.new("TextLabel")
	t.BackgroundTransparency = 1
	t.FontFace = font
	t.TextSize = ukuran
	t.TextColor3 = warna or PUTIH
	t.TextXAlignment = Enum.TextXAlignment.Left
	t.TextYAlignment = Enum.TextYAlignment.Top
	t.TextWrapped = true
	t.Text = isi
	t.Parent = induk
	return t
end

local function tombol(induk, isi, warna, warnaTeks)
	local b = Instance.new("TextButton")
	b.AutoButtonColor = true
	b.BackgroundColor3 = warna
	b.TextColor3 = warnaTeks or GELAP
	b.FontFace = TEBAL
	b.TextSize = 14
	b.Text = isi
	bulat(b, 9)
	b.Parent = induk
	return b
end

local function jamTeks(s)
	if not s or s <= 0 then return "–:–" end
	return string.format("%d:%02d", math.floor(s / 60), math.floor(s % 60))
end

local toastL = label(gui, "", TEBAL, 15, PUTIH)
toastL.AnchorPoint = Vector2.new(0.5, 0)
toastL.Position = UDim2.new(0.5, 0, 0, 96)
toastL.AutomaticSize = Enum.AutomaticSize.XY
toastL.BackgroundTransparency = 0.1
toastL.BackgroundColor3 = GELAP
toastL.TextWrapped = false
toastL.ZIndex = 8
toastL.Visible = false
bulat(toastL, 10)
do
	local p = Instance.new("UIPadding")
	p.PaddingLeft, p.PaddingRight, p.PaddingTop, p.PaddingBottom = UDim.new(0, 12), UDim.new(0, 12), UDim.new(0, 8), UDim.new(0, 8)
	p.Parent = toastL
end
local toastKe = 0
local function toast(isi, lamaDetik)
	toastKe += 1
	local ke = toastKe
	toastL.Text = isi
	toastL.Visible = true
	task.delay(lamaDetik or 1.6, function() if toastKe == ke then toastL.Visible = false end end)
end

-- ---------- panel lobi dan hasil ----------
local panel = Instance.new("Frame")
panel.Size = UDim2.fromOffset(460, 300)
panel.AnchorPoint = Vector2.new(0.5, 0.5)
panel.Position = UDim2.fromScale(0.5, 0.5)
panel.BackgroundColor3 = GELAP
panel.BackgroundTransparency = 0.04
panel.Visible = false
bulat(panel, 14)
panel.Parent = gui
do -- di layar pendek (HP mendatar) panel diperkecil supaya tidak terpotong
	local sk = Instance.new("UIScale")
	sk.Parent = panel
	local function atur()
		local v = workspace.CurrentCamera.ViewportSize
		sk.Scale = math.min(1, (v.Y - 16) / 300, (v.X - 16) / 460)
	end
	atur()
	workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(atur)
end

local judul = label(panel, "🏃 Pelari Kalcer", BERAT, 18, KUNING)
judul.Position = UDim2.fromOffset(14, 10)
judul.Size = UDim2.fromOffset(380, 22)
local tutup = tombol(panel, "X", Color3.fromRGB(70, 70, 78), PUTIH)
tutup.Size = UDim2.fromOffset(28, 28)
tutup.Position = UDim2.new(1, -38, 0, 8)

local baris = {}
for n = 1, #PL.RUTE do
	local b = tombol(panel, "", ABU, PUTIH)
	b.Size = UDim2.fromOffset(216, 28)
	b.Position = UDim2.fromOffset(14, 40 + (n - 1) * 31)
	b.TextXAlignment = Enum.TextXAlignment.Left
	b.TextSize = 13
	local p = Instance.new("UIPadding")
	p.PaddingLeft = UDim.new(0, 8)
	p.Parent = b
	baris[n] = b
end
local kanan = label(panel, "", TEBAL, 13, PUTIH)
kanan.Position = UDim2.fromOffset(242, 40)
kanan.Size = UDim2.fromOffset(206, 212)
local bMulai = tombol(panel, "Mulai lari", KUNING)
bMulai.Size = UDim2.fromOffset(206, 34)
bMulai.Position = UDim2.fromOffset(242, 258)
local bDesa = tombol(panel, "Kembali ke desa", Color3.fromRGB(70, 70, 78), PUTIH)
bDesa.Size = UDim2.fromOffset(216, 30)
bDesa.Position = UDim2.fromOffset(14, 262)
bDesa.Visible = false
local hasilL = label(panel, "", TEBAL, 14, PUTIH)
hasilL.Position = UDim2.fromOffset(14, 40)
hasilL.Size = UDim2.fromOffset(216, 216)
hasilL.Visible = false

-- ---------- HUD lari ----------
local hud = label(gui, "", BERAT, 17, PUTIH)
hud.AnchorPoint = Vector2.new(0.5, 0)
hud.Position = UDim2.new(0.5, 0, 0, 46)
hud.Size = UDim2.fromOffset(460, 24)
hud.TextXAlignment = Enum.TextXAlignment.Center
hud.TextStrokeTransparency = 0.3
hud.TextWrapped = false
hud.Visible = false
local palang = Instance.new("Frame")
palang.AnchorPoint = Vector2.new(0.5, 0)
palang.Position = UDim2.new(0.5, 0, 0, 72)
palang.Size = UDim2.fromOffset(220, 10)
palang.BackgroundColor3 = GELAP
palang.BackgroundTransparency = 0.3
palang.BorderSizePixel = 0
palang.Visible = false
bulat(palang, 5)
palang.Parent = gui
local isiPalang = Instance.new("Frame")
isiPalang.Size = UDim2.fromScale(1, 1)
isiPalang.BorderSizePixel = 0
bulat(isiPalang, 5)
isiPalang.Parent = palang
local buff = label(gui, "", TEBAL, 13, PUTIH)
buff.AnchorPoint = Vector2.new(0.5, 0)
buff.Position = UDim2.new(0.5, 0, 0, 84)
buff.Size = UDim2.fromOffset(460, 18)
buff.TextXAlignment = Enum.TextXAlignment.Center
buff.TextStrokeTransparency = 0.3
buff.TextWrapped = false
buff.Visible = false
local besar = label(gui, "", BERAT, 64, KUNING)
besar.AnchorPoint = Vector2.new(0.5, 0.5)
besar.Position = UDim2.fromScale(0.5, 0.4)
besar.Size = UDim2.fromOffset(300, 80)
besar.TextXAlignment = Enum.TextXAlignment.Center
besar.TextStrokeTransparency = 0.2
besar.Visible = false
local bKeluar = tombol(gui, "Keluar", Color3.fromRGB(70, 70, 78), PUTIH)
bKeluar.AnchorPoint = Vector2.new(0.5, 0)
bKeluar.Position = UDim2.new(0.5, 0, 0, 8)
bKeluar.Size = UDim2.fromOffset(84, 30)
bKeluar.Visible = false
local bAir = tombol(gui, "💧 Ambil isotonik (E)", Color3.fromRGB(58, 138, 216), PUTIH)
bAir.AnchorPoint = Vector2.new(0.5, 1)
bAir.Position = UDim2.new(0.5, 0, 1, -76)
bAir.Size = UDim2.fromOffset(190, 40)
bAir.Visible = false

-- ---------- keadaan ----------
local INFO, PILIH = nil, 1
local MODE = "diam" -- diam | hitung | lari | selesai | gagal
local RUTE, TINGGI = 1, 3
local K = {}      -- keadaan pelari (satuan game web)
local OBJ, NPC = {}, {}
local tSiap, sibuk = 0, false
local tahanSprint, lari -- lari = AnimationTrack

local function geser(a)
	if MODE ~= "lari" then return end
	K.lajur = math.clamp(K.lajur + a, 1, 3)
end
local function lompat()
	if MODE ~= "lari" or K.y > 0.05 then return end
	K.vy = 13.5
end
local function ambilAir()
	if MODE ~= "lari" or K.wsAmbil or not (K.d > PL.WS.buka and K.d < PL.WS.tutup) then return end
	K.wsAmbil = true
	K.stamina = math.min(100, K.stamina + 35)
	K.koin += 5
	toast("💧 Isotonik! +35% stamina · +5 koin")
end

-- tombol layar (HP): kiri bawah pindah lajur, kanan bawah lompat dan sprint
local tombolLari = {}
local function tombolLayar(isi, letak, lebar, tekan, lepas)
	local b = tombol(gui, isi, ABU, PUTIH)
	b.TextSize = (isi == "◀" or isi == "▶") and 22 or 15
	b.BackgroundTransparency = 0.25
	b.Size = UDim2.fromOffset(lebar, 56)
	b.AnchorPoint = Vector2.new(letak.X.Scale, 1)
	b.Position = letak
	b.Visible = false
	b.InputBegan:Connect(function(i)
		if i.UserInputType == Enum.UserInputType.Touch or i.UserInputType == Enum.UserInputType.MouseButton1 then tekan() end
	end)
	if lepas then
		b.InputEnded:Connect(function(i)
			if i.UserInputType == Enum.UserInputType.Touch or i.UserInputType == Enum.UserInputType.MouseButton1 then lepas() end
		end)
	end
	table.insert(tombolLari, b)
	return b
end
tombolLayar("◀", UDim2.new(0, 12, 1, -14), 76, function() geser(-1) end)
tombolLayar("▶", UDim2.new(0, 96, 1, -14), 76, function() geser(1) end)
tombolLayar("SPRINT", UDim2.new(1, -12, 1, -14), 92, function() tahanSprint = true end, function() tahanSprint = false end)
tombolLayar("LOMPAT", UDim2.new(1, -112, 1, -14), 92, lompat)
local function tombolTampil(tampil)
	for _, b in ipairs(tombolLari) do b.Visible = tampil end
	if not tampil then tahanSprint = false end
	-- tongkat dan tombol lompat bawaan Roblox disembunyikan selama lari supaya tidak bertumpuk dengan tombol lari
	pcall(function() GuiService.TouchControlsEnabled = not tampil end)
end

UserInputService.InputBegan:Connect(function(i, diproses)
	if diproses or MODE ~= "lari" then return end
	local k = i.KeyCode
	if k == Enum.KeyCode.A or k == Enum.KeyCode.Left then geser(-1)
	elseif k == Enum.KeyCode.D or k == Enum.KeyCode.Right then geser(1)
	elseif k == Enum.KeyCode.W or k == Enum.KeyCode.Up or k == Enum.KeyCode.Space then lompat()
	elseif k == Enum.KeyCode.E then ambilAir() end
end)
bAir.Activated:Connect(ambilAir)

-- ---------- benda di jalan ----------
local function bagian(induk, ukuran, cf, warna, bentuk)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CanTouch = false
	p.CanQuery = false
	p.CastShadow = false
	p.Size = ukuran
	p.CFrame = cf
	p.Color = warna
	p.Material = Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	if bentuk then p.Shape = bentuk end
	p.Parent = induk
	return p
end

local IKON = { petir = { "⚡", rgb(58, 168, 96) }, magnet = { "🧲", rgb(224, 90, 106) }, perisai = { "🛡️", rgb(58, 138, 216) }, hati = { "❤️", rgb(240, 240, 240) } }
local function buatBenda(o)
	local m = Instance.new("Model")
	local c = CFrame.new(PL.dunia(RUTE, PL.LAJUR[o.lajur], 0, o.d))
	local j = o.jenis
	if j == "koin" then
		local p = bagian(m, Vector3.new(0.4, 2, 2), c * CFrame.new(0, 2.4, 0) * CFrame.Angles(0, math.pi / 2, 0), rgb(242, 193, 74), Enum.PartType.Cylinder)
		p.Material = Enum.Material.Metal
		m.PrimaryPart = p
	elseif IKON[j] then
		local p = bagian(m, Vector3.new(1.9, 1.9, 1.9), c * CFrame.new(0, 2.7, 0), IKON[j][2])
		p.Material = Enum.Material.Neon
		local b = Instance.new("BillboardGui")
		b.Size = UDim2.fromOffset(40, 40)
		b.StudsOffset = Vector3.new(0, 2.2, 0)
		local t = label(b, IKON[j][1], TEBAL, 28, PUTIH)
		t.Size = UDim2.fromScale(1, 1)
		t.TextXAlignment = Enum.TextXAlignment.Center
		b.Parent = p
		m.PrimaryPart = p
	elseif j == "kerucut" then
		bagian(m, Vector3.new(2.4, 0.3, 2.4), c * CFrame.new(0, 0.15, 0), rgb(224, 128, 58))
		for i, x in ipairs({ { 1.7, rgb(224, 128, 58) }, { 1.3, rgb(246, 243, 238) }, { 0.9, rgb(224, 128, 58) }, { 0.5, rgb(246, 243, 238) } }) do
			bagian(m, Vector3.new(x[1], 0.6, x[1]), c * CFrame.new(0, 0.3 + (i - 0.5) * 0.6, 0), x[2])
		end
	elseif j == "pembatas" then
		for _, s in ipairs({ -1, 1 }) do bagian(m, Vector3.new(0.45, 2.2, 1.2), c * CFrame.new(s * 1.9, 1.1, 0), rgb(44, 49, 80)) end
		bagian(m, Vector3.new(4.4, 0.55, 0.3), c * CFrame.new(0, 1.8, 0), rgb(224, 128, 58))
		bagian(m, Vector3.new(4.4, 0.55, 0.3), c * CFrame.new(0, 1.0, 0), rgb(246, 243, 238))
	elseif j == "lubang" then
		bagian(m, Vector3.new(4, 0.12, 3), c * CFrame.new(0, 0.08, 0), rgb(35, 37, 42))
		for i = 1, 4 do bagian(m, Vector3.new(0.7, 0.4, 0.6), c * CFrame.new(math.cos(i * 1.7) * 2.1, 0.2, math.sin(i * 1.7) * 1.6), rgb(96, 100, 108)) end
	elseif j == "batu" then
		bagian(m, Vector3.new(3.2, 1.6, 2.5), c * CFrame.new(0, 0.8, 0), rgb(126, 120, 108))
		bagian(m, Vector3.new(1.8, 1.1, 1.8), c * CFrame.new(0.5, 1.7, 0.2), rgb(148, 142, 130))
	elseif j == "akar" then
		bagian(m, Vector3.new(4.6, 0.5, 0.8), c * CFrame.new(0, 0.25, 0), rgb(90, 58, 34))
		bagian(m, Vector3.new(0.8, 0.45, 2.4), c * CFrame.new(-1.4, 0.22, 0.7), rgb(107, 74, 46))
		bagian(m, Vector3.new(1.3, 0.5, 1.1), c * CFrame.new(2, 0.3, 0.4), rgb(63, 154, 68))
	else -- kayu
		bagian(m, Vector3.new(4.6, 1.5, 1.5), c * CFrame.new(0, 0.75, 0), rgb(122, 79, 42))
		for _, s in ipairs({ -1, 1 }) do bagian(m, Vector3.new(0.3, 1.2, 1.2), c * CFrame.new(s * 2.35, 0.75, 0), rgb(200, 160, 112)) end
	end
	m.Parent = dunia
	return m
end

local function bersihkanDunia()
	dunia:ClearAllChildren()
	OBJ, NPC = {}, {}
end

-- pelari lain: tokoh balok sederhana dengan papan nama
local WARNA_KAOS = { rgb(224, 80, 58), rgb(58, 138, 216), rgb(242, 193, 74), rgb(58, 168, 96), rgb(154, 90, 216), rgb(240, 240, 240), rgb(29, 29, 34), rgb(224, 128, 58) }
local WARNA_KULIT = { rgb(246, 214, 184), rgb(224, 170, 126), rgb(201, 140, 94), rgb(168, 110, 68) }
local function buatNPC()
	for i = 0, 11 do
		local m = Instance.new("Model")
		local asal0 = CFrame.new(0, -50, 0)
		local kaos, kulit = WARNA_KAOS[i % #WARNA_KAOS + 1], WARNA_KULIT[i % #WARNA_KULIT + 1]
		local n = { m = m, nama = PL.NAMA_NPC[i + 1], d = 5 + math.floor(i / 3) * 3.5 + (i % 2) * 1.2, lajur = i % 3 + 1,
			v = PL.V_DASAR * (0.86 + math.random() * 0.24), fase = math.random() * 6 }
		n.x = PL.LAJUR[n.lajur] + (math.random() - 0.5) * 1.2
		if math.abs(n.x) < 1.6 then n.x = n.lajur == 2 and 1.6 or n.x end
		n.badan = bagian(m, Vector3.new(2, 2.1, 1.1), asal0, kaos)
		n.kepala = bagian(m, Vector3.new(1.5, 1.5, 1.5), asal0, kulit)
		n.kakiL = bagian(m, Vector3.new(0.85, 2, 0.9), asal0, rgb(44, 49, 80))
		n.kakiR = bagian(m, Vector3.new(0.85, 2, 0.9), asal0, rgb(44, 49, 80))
		n.tanganL = bagian(m, Vector3.new(0.6, 1.8, 0.7), asal0, kulit)
		n.tanganR = bagian(m, Vector3.new(0.6, 1.8, 0.7), asal0, kulit)
		local b = Instance.new("BillboardGui")
		b.Size = UDim2.fromOffset(120, 20)
		b.StudsOffset = Vector3.new(0, 1.8, 0)
		b.MaxDistance = 120
		local t = label(b, n.nama, TEBAL, 13, PUTIH)
		t.Size = UDim2.fromScale(1, 1)
		t.TextXAlignment = Enum.TextXAlignment.Center
		t.TextStrokeTransparency = 0.2
		b.Parent = n.kepala
		m.Parent = dunia
		n.depan = true
		table.insert(NPC, n)
	end
end
local function gambarNPC(n)
	local dasar = CFrame.new(PL.dunia(RUTE, n.x, 0, n.d)) * CFrame.new(0, math.abs(math.sin(n.fase)) * 0.2, 0)
	local a = math.sin(n.fase) * 0.8
	n.badan.CFrame = dasar * CFrame.new(0, 3.05, 0)
	n.kepala.CFrame = dasar * CFrame.new(0, 4.85, 0)
	n.kakiL.CFrame = dasar * CFrame.new(-0.5, 2, 0) * CFrame.Angles(a, 0, 0) * CFrame.new(0, -1, 0)
	n.kakiR.CFrame = dasar * CFrame.new(0.5, 2, 0) * CFrame.Angles(-a, 0, 0) * CFrame.new(0, -1, 0)
	n.tanganL.CFrame = dasar * CFrame.new(-1.3, 4, 0) * CFrame.Angles(-a, 0, 0) * CFrame.new(0, -0.9, 0)
	n.tanganR.CFrame = dasar * CFrame.new(1.3, 4, 0) * CFrame.Angles(a, 0, 0) * CFrame.new(0, -0.9, 0)
end

local function peringkat()
	local r = 1
	for _, n in ipairs(NPC) do if n.d > K.d then r += 1 end end
	return r
end

local function resetLari()
	bersihkanDunia()
	K = { d = 0, x = 0, lajur = 2, y = 0, vy = 0, v = 0, stamina = 100, nyawa = 3, koin = 0, kebal = 0, magnet = 0, perisai = 0,
		waktu = 0, wsAmbil = false, draft = false, wall = false, fase = 0, salip = 0, pernahKena = false }
	for _, o in ipairs(PL.isi(RUTE).obj) do table.insert(OBJ, { d = o.d, lajur = o.lajur, jenis = o.jenis }) end
	buatNPC()
end

-- ---------- lobi ----------
local function tulisLobi()
	if not INFO then return end
	judul.Text = "🏃 Pelari Kalcer · 1 KM"
	hasilL.Visible = false
	for n, b in ipairs(baris) do
		local buka = n <= INFO.buka
		b.Visible = true
		b.Text = (buka and "" or "🔒 ") .. n .. ". " .. PL.RUTE[n].nama
		b.BackgroundColor3 = n == PILIH and rgb(88, 76, 30) or ABU
		b.TextTransparency = buka and 0 or 0.45
	end
	local R = PL.RUTE[PILIH]
	local t = R.nama .. " (" .. R.jenis .. ")\n" .. R.sorot .. "\n\n"
	t ..= "Rekormu: " .. jamTeks(INFO.rekor) .. "\n"
	t ..= "Lari beruntun: " .. INFO.streak .. " hari\n"
	t ..= "Sisa koin lari hari ini: " .. INFO.sisaHari .. "\n"
	if not INFO.lariHariIni then t ..= "Finish pertama hari ini +" .. PL.MISI_DESA .. " koin\n" end
	if INFO.top and #INFO.top > 0 then
		t ..= "\n5 tercepat\n"
		for i, e in ipairs(INFO.top) do t ..= i .. ". " .. e.u .. "  " .. jamTeks(e.t) .. "\n" end
	end
	if PILIH > INFO.buka then t ..= "\nTerbuka setelah finish di " .. PL.RUTE[PILIH - 1].nama .. "." end
	kanan.Text = t
	kanan.Visible = true
	bMulai.Text = MODE == "diam" and "Mulai lari" or "Lari lagi"
	bDesa.Visible = MODE ~= "diam"
	tutup.Visible = MODE == "diam"
end

local function muatLobi()
	local ok, r = pcall(function() return pintu:InvokeServer("buka") end)
	if not ok or typeof(r) ~= "table" then return toast("Sinyal putus. Coba lagi sebentar.", 3) end
	if r.galat then return toast(r.galat, 3) end
	INFO = r
	if MODE == "diam" then PILIH = math.min(PILIH, INFO.buka) end
	tulisLobi()
end

for n, b in ipairs(baris) do
	b.Activated:Connect(function()
		PILIH = n
		tulisLobi()
	end)
end
tutup.Activated:Connect(function() panel.Visible = false end)
bukaEv.OnClientEvent:Connect(function()
	if MODE ~= "diam" then return end
	panel.Visible = true
	muatLobi()
end)

local function hudTampil(tampil)
	hud.Visible, palang.Visible, buff.Visible, bKeluar.Visible = tampil, tampil, tampil, tampil
	if not tampil then bAir.Visible = false end
	tombolTampil(tampil)
end

local function berhenti()
	MODE = "diam"
	hudTampil(false)
	besar.Visible = false
	panel.Visible = false
	bersihkanDunia()
	if lari then
		lari:Stop(0.2)
		lari = nil
	end
	local cam = workspace.CurrentCamera
	cam.CameraType = Enum.CameraType.Custom
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if hum then
		hum.PlatformStand = false
		cam.CameraSubject = hum
	end
end

local function keluar()
	if sibuk then return end
	sibuk = true
	pcall(function() pintu:InvokeServer("keluar") end)
	berhenti()
	sibuk = false
end

local function animasiLari()
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	local animator = hum and hum:FindFirstChildOfClass("Animator")
	local skrip = char and char:FindFirstChild("Animate")
	local run = skrip and skrip:FindFirstChild("run")
	local anim = run and run:FindFirstChildOfClass("Animation")
	if not animator or not anim then return nil end
	local ok, tr = pcall(function() return animator:LoadAnimation(anim) end)
	if not ok or not tr then return nil end
	tr.Looped = true
	tr.Priority = Enum.AnimationPriority.Action
	return tr
end

local function mulai()
	if sibuk then return end
	if INFO and PILIH > INFO.buka then return toast("Rute ini masih terkunci.", 2) end
	sibuk = true
	local ok, r = pcall(function() return pintu:InvokeServer("mulai", PILIH) end)
	sibuk = false
	if not ok or typeof(r) ~= "table" then return toast("Sinyal putus. Coba lagi sebentar.", 3) end
	if r.galat then return toast(r.galat, 3) end
	RUTE = r.rute
	TINGGI = r.tinggi or 3
	resetLari()
	tSiap = os.clock() + 3
	MODE = "hitung"
	panel.Visible = false
	hudTampil(true)
	besar.Visible = true
	if lari then lari:Stop(0) end
	lari = animasiLari()
end
bMulai.Activated:Connect(function()
	if hasilL.Visible then return tulisLobi() end -- dari layar hasil kembali ke daftar rute dulu
	mulai()
end)
bDesa.Activated:Connect(keluar)
bKeluar.Activated:Connect(keluar)

local function tampilHasil(judulTeks, isi)
	hudTampil(false)
	besar.Visible = false
	for _, b in ipairs(baris) do b.Visible = false end
	kanan.Visible = false
	judul.Text = judulTeks
	hasilL.Text = isi
	hasilL.Size = UDim2.fromOffset(432, 216)
	hasilL.Visible = true
	bMulai.Text = "Lanjut"
	bDesa.Visible = true
	tutup.Visible = false
	panel.Visible = true
end

local function setor(finish)
	local posisi, jarak, koin, rute = peringkat(), K.d, K.koin, RUTE
	local kirim = { koin = koin, finish = finish, pos = posisi, iso = K.wsAmbil, mulus = not K.pernahKena }
	local salip, iso = K.salip, K.wsAmbil
	task.spawn(function()
		local ok, h = pcall(function() return pintu:InvokeServer("selesai", kirim) end)
		if MODE ~= "selesai" and MODE ~= "gagal" then return end
		if not ok or typeof(h) ~= "table" then return tampilHasil("🏃 Pelari Kalcer", "Sinyal putus, hasil lari tidak terkirim.") end
		if h.galat then return tampilHasil("🏃 Pelari Kalcer", h.galat) end
		local t = "Rute: " .. PL.RUTE[rute].nama .. "\n"
		if h.finish then
			t ..= "Waktu: " .. jamTeks(h.waktu) .. (h.rekorBaru and "  ·  REKOR BARU!" or ("  ·  rekormu " .. jamTeks(h.rekor))) .. "\n"
			t ..= "Posisi: #" .. posisi .. " dari " .. (#PL.NAMA_NPC + 1) .. "  ·  menyalip " .. salip .. " pelari\n"
		else
			t ..= string.format("Berhenti di %.2f KM. Coba lagi, pelan-pelan jaga stamina.\n", jarak / 1000)
			if h.pesan then t ..= h.pesan .. "\n" end
		end
		t ..= "Koin dipungut: " .. koin .. "  ·  masuk dompet +" .. (h.dapat or 0) .. "\n"
		if h.misiDesa then t ..= "Finish pertama hari ini: +" .. h.misiDesa .. " koin\n" end
		t ..= "Isotonik: " .. (iso and "diambil" or "kelewat") .. "\n"
		t ..= "Lari beruntun: " .. (h.streak or 0) .. " hari  ·  sisa koin lari hari ini " .. (h.sisaHari or 0) .. "\n"
		if h.ruteBaru then t ..= "\nHOREE, rute baru terbuka: " .. h.ruteBaru .. "!" end
		tampilHasil(h.finish and "🏅 Finish 1 KM!" or "🏃 Pelari Kalcer", t)
		if INFO then
			INFO.buka, INFO.rekor, INFO.streak, INFO.sisaHari = h.buka or INFO.buka, h.rekor or INFO.rekor, h.streak or INFO.streak, h.sisaHari or INFO.sisaHari
			if h.finish then INFO.lariHariIni = true end
			if h.ruteBaru then PILIH = INFO.buka end
		end
	end)
end

player.CharacterAdded:Connect(function()
	if MODE ~= "diam" then berhenti() end
end)

-- ---------- hitungan lari (salinan langkah() di main.js) ----------
local function kena(o)
	if K.kebal > 0 then return end
	if K.perisai > 0 then
		K.perisai = 0
		K.kebal = 1
		toast("🛡️ Perisai menahan benturan")
		return
	end
	K.nyawa -= 1
	K.pernahKena = true
	K.kebal = 1.6
	K.v *= 0.45
	toast(o.jenis == "lubang" and "Aduh, lubang jalan!" or o.jenis == "akar" and "Kesandung akar!" or o.jenis == "kayu" and "Nabrak batang kayu!" or ("Nabrak " .. o.jenis .. "!"))
	if K.nyawa <= 0 then
		MODE = "gagal"
		setor(false)
	end
end

local function ambil(o)
	o.habis = true
	if o.m then
		o.m:Destroy()
		o.m = nil
	end
	local j = o.jenis
	if j == "koin" then K.koin += 1
	elseif j == "petir" then
		K.stamina = math.min(100, K.stamina + 30)
		toast("⚡ +30% stamina")
	elseif j == "magnet" then
		K.magnet = 8
		toast("🧲 Magnet 8 detik")
	elseif j == "perisai" then
		K.perisai = 8
		toast("🛡️ Perisai 8 detik")
	elseif j == "hati" then
		K.nyawa = math.min(5, K.nyawa + 1)
		toast("❤️ +1 nyawa")
	end
end

-- pelari uji coba: pindah ke lajur yang bebas rintangan, sprint selagi stamina banyak
local function otomatis()
	local function rintang(lj, jauh)
		for _, o in ipairs(OBJ) do
			if not o.habis and PL.RINTANG[o.jenis] and o.lajur == lj and o.d > K.d - 1 and o.d - K.d < jauh then return true end
		end
		return false
	end
	if rintang(K.lajur, 9) then
		for _, a in ipairs({ -1, 1, -2, 2 }) do
			local l = K.lajur + a
			if l >= 1 and l <= 3 and not rintang(l, 13) then
				K.lajur = l
				break
			end
		end
	end
	ambilAir()
	return K.stamina > 60
end

local function langkah(dt)
	K.waktu += dt
	K.draft = false
	for _, n in ipairs(NPC) do
		if n.lajur == K.lajur and n.d - K.d > 0.8 and n.d - K.d < 6 then K.draft = true break end
	end
	K.wall = K.stamina < PL.BATAS_WALL
	local mauSprint = tahanSprint or UserInputService:IsKeyDown(Enum.KeyCode.LeftShift) or UserInputService:IsKeyDown(Enum.KeyCode.RightShift)
	if player:GetAttribute("DK_PelariAuto") == true then mauSprint = otomatis() end
	K.sprint = mauSprint and K.stamina > 3
	local target = PL.V_DASAR * PL.BONUS_SEPATU * (K.sprint and PL.KALI_SPRINT or 1) * (K.wall and PL.KALI_WALL or 1)
	K.v += (target - K.v) * math.min(1, dt * 2.2)
	local kuras = PL.KURAS * (K.sprint and PL.KALI_KURAS_SPRINT or 1) * (K.draft and 0.85 or 1) * (1 - PL.HEMAT_JAM / 100)
	K.stamina = math.clamp(K.stamina - kuras * dt + (K.sprint and 0 or 0.25 * dt), 0, 100)
	for _, n in ipairs(NPC) do
		if n.lajur == K.lajur and n.d > K.d and n.d - K.d < 1.1 and K.y < 1 then K.v = math.min(K.v, n.v * 0.9) end
	end
	local dLalu = K.d
	K.d += K.v * dt
	for _, n in ipairs(NPC) do
		local depan = n.d > K.d
		if n.depan and not depan then K.salip += 1 end
		n.depan = depan
	end
	K.y += K.vy * dt
	K.vy -= 34 * dt
	if K.y < 0 then K.y, K.vy = 0, 0 end
	K.x += (PL.LAJUR[K.lajur] - K.x) * math.min(1, dt * 11)
	K.kebal = math.max(0, K.kebal - dt)
	K.magnet = math.max(0, K.magnet - dt)
	K.perisai = math.max(0, K.perisai - dt)
	for _, o in ipairs(OBJ) do
		if not o.habis and o.d >= K.d - 3 and o.d <= K.d + 2 then
			local j = o.jenis
			local lewat = o.d > dLalu - 1 and o.d < K.d + 1
			local sejajar = math.abs(PL.LAJUR[o.lajur] - K.x) < 1.8
			if j == "koin" then
				if (lewat and sejajar) or (K.magnet > 0 and math.abs(o.d - K.d) < 1.2) then ambil(o) end
			elseif IKON[j] then
				if lewat and sejajar and K.y < 2.5 then ambil(o) end
			elseif math.abs(o.d - K.d) < 0.9 and o.lajur == K.lajur then
				local tinggi = (j == "lubang" or j == "akar") and 0.4 or j == "pembatas" and 1.25 or 1.1
				if K.y < tinggi then
					o.habis = true
					kena(o)
					if MODE ~= "lari" then return end
				end
			end
		end
	end
	if K.d >= PL.WS.tutup and not K.wsAmbil and not K.wsLewat then
		K.wsLewat = true
		toast("Water station kelewat")
	end
	if K.d > PL.WS.buka and not K.wsInfo then
		K.wsInfo = true
		toast("💧 DEPAN ADA WATER STATION! Ambil isotonik!", 2.2)
	end
	if K.wall and not K.wallInfo then
		K.wallInfo = true
		toast("🧱 THE WALL! Kurangi sprint, cari isotonik", 2.2)
	end
	if not K.wall then K.wallInfo = false end
	if K.d >= PL.FINISH then
		K.d = PL.FINISH
		MODE = "selesai"
		setor(true)
	end
end

RunService.RenderStepped:Connect(function(dt)
	if MODE == "diam" then return end
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not hrp or not hum then return end
	dt = math.min(dt, 0.05)
	if MODE == "hitung" then
		local sisa = tSiap - os.clock()
		if sisa <= 0 then
			MODE = "lari"
			besar.Text = "GO!"
			if lari then lari:Play(0.15) end
			task.delay(0.8, function() if MODE == "lari" then besar.Visible = false end end)
		else
			besar.Text = tostring(math.ceil(sisa))
		end
	elseif MODE == "lari" then
		langkah(dt)
	else -- sesudah finish pelari melambat, sesudah gagal berhenti
		K.kebal = 0
		K.v = math.max(0, K.v - (MODE == "selesai" and 4 or 30) * dt)
		K.d += K.v * dt
		K.y += K.vy * dt
		K.vy -= 34 * dt
		if K.y < 0 then K.y, K.vy = 0, 0 end
		if lari and K.v < 0.5 and lari.IsPlaying then lari:Stop(0.3) end
	end
	-- pelari lain
	if MODE ~= "hitung" then
		for _, n in ipairs(NPC) do
			if n.d <= PL.FINISH + 20 then n.d += n.v * dt end
			n.fase += dt * 9
			if math.random() < dt * 0.15 then n.lajur = math.clamp(n.lajur + (math.random() < 0.5 and -1 or 1), 1, 3) end
			for _, o in ipairs(OBJ) do
				if not o.habis and o.lajur == n.lajur and o.d - n.d > 0 and o.d - n.d < 4 and PL.RINTANG[o.jenis] then
					n.lajur = n.lajur % 3 + 1
					break
				end
			end
			n.x += (PL.LAJUR[n.lajur] + ((n.fase % 7 > 3.5) and 0.2 or -0.2) - n.x) * math.min(1, dt * 3)
		end
	end
	for _, n in ipairs(NPC) do gambarNPC(n) end
	-- benda di jalan: dibuat saat dekat, dibuang saat jauh
	for _, o in ipairs(OBJ) do
		local jauh = o.d > K.d + 140 or o.d < K.d - 20
		if not o.m and not jauh and not o.habis then o.m = buatBenda(o) end
		if o.m and (jauh or o.habis) and not PL.RINTANG[o.jenis] then
			o.m:Destroy()
			o.m = nil
		elseif o.m and jauh then
			o.m:Destroy()
			o.m = nil
		elseif o.m and o.m.PrimaryPart then
			local p = o.m.PrimaryPart
			if o.jenis == "koin" and K.magnet > 0 and o.d - K.d < 25 and o.d > K.d then
				p.Position = p.Position:Lerp(PL.dunia(RUTE, K.x, 1.6 + K.y, o.d), math.min(1, dt * 6))
			end
			p.CFrame = CFrame.Angles(0, dt * 3, 0) * p.CFrame.Rotation + p.Position
		end
	end
	-- tokoh mengikuti keadaan
	hum.PlatformStand = true
	K.fase += dt * (6 + K.v * 0.9)
	local pos = PL.dunia(RUTE, K.x, K.y, K.d) + Vector3.new(0, TINGGI, 0)
	local condong = MODE ~= "lari" and 0 or K.wall and 0.3 or K.sprint and 0.2 or 0.06
	hrp.CFrame = CFrame.lookAt(pos, pos + Vector3.new(0, 0, -1)) * CFrame.Angles(-condong, 0, 0)
	hrp.AssemblyLinearVelocity = Vector3.zero
	hrp.AssemblyAngularVelocity = Vector3.zero
	if lari and lari.IsPlaying then lari:AdjustSpeed(math.clamp(K.v / PL.V_DASAR, 0.4, 1.6)) end
	-- tokoh berkedip selagi kebal sehabis menabrak
	local kedip = K.kebal > 0 and math.floor(K.kebal * 10) % 2 == 0
	if kedip ~= K.kedip then
		K.kedip = kedip
		for _, p in ipairs(char:GetDescendants()) do
			if p:IsA("BasePart") and p.Transparency < 1 then p.LocalTransparencyModifier = kedip and 0.6 or 0 end
		end
	end
	local cam = workspace.CurrentCamera
	cam.CameraType = Enum.CameraType.Scriptable
	local tengah = PL.dunia(RUTE, K.x * 0.6, 0, K.d) + Vector3.new(0, TINGGI, 0)
	cam.CFrame = CFrame.lookAt(tengah + Vector3.new(0, 8.5, 17), tengah + Vector3.new(0, 2, -16))
	-- HUD
	if MODE == "lari" or MODE == "hitung" then
		local pace = K.d > 5 and (K.waktu * PL.SKALA_WAKTU) / (K.d / 1000) or 0
		hud.Text = string.format("%.2f KM  ·  pace %s  ·  %s  ·  🪙 %d  ·  #%d", K.d / 1000, jamTeks(pace), string.rep("❤️", math.max(0, K.nyawa)), K.koin, peringkat())
		isiPalang.Size = UDim2.fromScale(K.stamina / 100, 1)
		isiPalang.BackgroundColor3 = K.stamina > 55 and rgb(58, 168, 96) or K.stamina > PL.BATAS_WALL and rgb(242, 193, 74) or rgb(224, 90, 58)
		local b = {}
		if K.sprint then table.insert(b, "💨 Sprint") end
		if K.draft then table.insert(b, "🌬️ Drafting −15%") end
		if K.magnet > 0 then table.insert(b, "🧲 " .. math.ceil(K.magnet) .. "s") end
		if K.perisai > 0 then table.insert(b, "🛡️ " .. math.ceil(K.perisai) .. "s") end
		if K.wall then table.insert(b, "🧱 THE WALL") end
		buff.Text = table.concat(b, "   ")
		bAir.Visible = MODE == "lari" and K.d > PL.WS.buka and K.d < PL.WS.tutup and not K.wsAmbil
	end
end)
