--[[
  PasarMalam (LocalScript) - sisi pemain Pasar Malam Sabtu: pesan jajan, permainan Lempar Gelang, putaran bianglala hias,
  dan kembang api. Lempar Gelang disalin dari mainGelang() game web: jarum bolak-balik, lempar saat jarum di zona kuning
  (40% sampai 60%), 3 gelang, tiap gelang jarum makin cepat. Kena 2 atau 3 = suvenir.
  Tempat: StarterPlayer.StarterPlayerScripts.PasarMalam. Pasangannya: ServerScriptService.PasarMalam.
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local pintu = ReplicatedStorage:WaitForChild("DK_Pasar")
local kabar = ReplicatedStorage:WaitForChild("DK_PasarKabar")

local GELAP = Color3.fromRGB(29, 29, 34)
local KUNING = Color3.fromRGB(255, 196, 37)
local PUTIH = Color3.new(1, 1, 1)
local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local BERAT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)
local SUVENIR = { { "🧸", "Boneka beruang" }, { "🐰", "Boneka kelinci" }, { "🎈", "Balon" }, { "🪀", "Yoyo" }, { "🏮", "Lampion" } }

local pg = player:WaitForChild("PlayerGui")
local lama = pg:FindFirstChild("PasarMalam")
if lama then lama:Destroy() end
local gui = Instance.new("ScreenGui")
gui.Name = "PasarMalam"
gui.ResetOnSpawn = false
gui.DisplayOrder = 58
gui.Parent = pg

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
	b.TextSize = 15
	b.Text = isi
	bulat(b, 9)
	b.Parent = induk
	return b
end

local toastL = label(gui, "", TEBAL, 15, PUTIH)
toastL.AnchorPoint = Vector2.new(0.5, 0)
toastL.Position = UDim2.new(0.5, 0, 0, 64)
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
local function toast(isi)
	toastKe += 1
	local ke = toastKe
	toastL.Text = isi
	toastL.Visible = true
	task.delay(3, function() if toastKe == ke then toastL.Visible = false end end)
end

-- ---------- panel Lempar Gelang ----------
local panel = Instance.new("Frame")
panel.Size = UDim2.fromOffset(360, 232)
panel.AnchorPoint = Vector2.new(0.5, 0.5)
panel.Position = UDim2.fromScale(0.5, 0.5)
panel.BackgroundColor3 = GELAP
panel.BackgroundTransparency = 0.04
panel.Visible = false
bulat(panel, 14)
panel.Parent = gui
do
	local sk = Instance.new("UIScale")
	sk.Parent = panel
	local function atur()
		local v = workspace.CurrentCamera.ViewportSize
		sk.Scale = math.min(1, (v.Y - 16) / 232, (v.X - 16) / 360)
	end
	atur()
	workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(atur)
end
local judul = label(panel, "🎪 Lempar Gelang", BERAT, 18, KUNING)
judul.Position = UDim2.fromOffset(14, 10)
judul.Size = UDim2.fromOffset(280, 22)
local tutup = tombol(panel, "X", Color3.fromRGB(70, 70, 78), PUTIH)
tutup.Size = UDim2.fromOffset(28, 28)
tutup.Position = UDim2.new(1, -38, 0, 8)
local info = label(panel, "", TEBAL, 14, PUTIH)
info.Position = UDim2.fromOffset(14, 40)
info.Size = UDim2.fromOffset(332, 40)
local jalur = Instance.new("Frame")
jalur.Position = UDim2.fromOffset(14, 86)
jalur.Size = UDim2.fromOffset(332, 22)
jalur.BackgroundColor3 = Color3.fromRGB(52, 52, 60)
jalur.BorderSizePixel = 0
bulat(jalur, 6)
jalur.Parent = panel
local zona = Instance.new("Frame")
zona.Position = UDim2.fromScale(0.4, 0)
zona.Size = UDim2.fromScale(0.2, 1)
zona.BackgroundColor3 = KUNING
zona.BorderSizePixel = 0
zona.Parent = jalur
local jarum = Instance.new("Frame")
jarum.AnchorPoint = Vector2.new(0.5, 0.5)
jarum.Position = UDim2.fromScale(0, 0.5)
jarum.Size = UDim2.new(0, 6, 1, 10)
jarum.BackgroundColor3 = PUTIH
jarum.BorderSizePixel = 0
jarum.ZIndex = 3
jarum.Parent = jalur
local album = label(panel, "", TEBAL, 13, Color3.fromRGB(200, 200, 210))
album.Position = UDim2.fromOffset(14, 116)
album.Size = UDim2.fromOffset(332, 56)
local bMain = tombol(panel, "", KUNING)
bMain.Size = UDim2.fromOffset(332, 40)
bMain.Position = UDim2.fromOffset(14, 180)

local GL = { main = false, ke = 0, kena = 0, x = 0, v = 1 }
local INFO, sibuk = nil, false

local function tulis()
	if not INFO then return end
	local t = "Suvenir " .. INFO.punya .. " dari " .. INFO.semua .. ":  "
	for _, x in ipairs(SUVENIR) do
		local n = INFO.sv[x[2]]
		t ..= x[1] .. (n and (" x" .. n) or " belum") .. "   "
	end
	t ..= "\nSisa main malam ini: " .. INFO.sisaGelang
	album.Text = t
	if not GL.main then bMain.Text = "🎯 Main (" .. INFO.harga .. " koin)" end
end

local function selesai(kena)
	sibuk = true
	bMain.Text = "..."
	local ok, r = pcall(function() return pintu:InvokeServer("gelang", kena) end)
	sibuk = false
	if not ok or typeof(r) ~= "table" then
		info.Text = "Sinyal putus. Coba lagi sebentar."
	elseif r.galat then
		info.Text = r.galat
	else
		INFO = r.info
		if r.nama then
			info.Text = "Hore! Kena " .. kena .. " kali, dapat " .. r.ikon .. " " .. r.nama .. "!" .. (r.baru and " Suvenir baru!" or "")
		else
			info.Text = "Kena " .. kena .. " kali. Sayang sekali, kurang " .. (2 - kena) .. " lagi. Coba lagi!"
		end
	end
	tulis()
end

bMain.Activated:Connect(function()
	if sibuk then return end
	if GL.main then -- lempar
		local kena = GL.x > 0.4 and GL.x < 0.6
		if kena then GL.kena += 1 end
		GL.ke += 1
		info.Text = "Gelang " .. GL.ke .. " dari 3: " .. (kena and "Kena! 🎯" or "Meleset…") .. "  ·  kena " .. GL.kena
		if GL.ke >= 3 then
			GL.main = false
			selesai(GL.kena)
		end
		return
	end
	GL.main, GL.ke, GL.kena, GL.x, GL.v = true, 0, 0, 0, 1
	bMain.Text = "🎯 Lempar!"
	info.Text = "Tunggu jarum masuk zona kuning, lalu tekan Lempar."
end)
tutup.Activated:Connect(function()
	panel.Visible = false
	GL.main = false
end)

kabar.OnClientEvent:Connect(function(h)
	if typeof(h) ~= "table" then return end
	if h.pesan then toast(h.pesan) end
	if h.gelang then
		INFO = h.gelang
		GL.main = false
		info.Text = "Lempar 3 gelang. Kena 2 atau 3 dapat suvenir!"
		tulis()
		panel.Visible = true
	end
end)

-- ---------- bianglala hias dan kembang api ----------
local sudut, tKembang = 0, 4
local WARNA_API = { Color3.fromRGB(255, 74, 74), Color3.fromRGB(255, 210, 58), Color3.fromRGB(74, 216, 74), Color3.fromRGB(74, 168, 255), Color3.fromRGB(255, 106, 216) }
local function kembangApi(pusat)
	local hrp = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if not hrp or (hrp.Position - pusat).Magnitude > 420 then return end
	local titik = pusat + Vector3.new(math.random(-50, 50), 60 + math.random() * 30, math.random(-34, 34))
	local warna = WARNA_API[math.random(1, #WARNA_API)]
	local bola = {}
	for i = 1, 16 do
		local p = Instance.new("Part")
		p.Anchored = true
		p.CanCollide = false
		p.CanTouch = false
		p.CanQuery = false
		p.CastShadow = false
		p.Size = Vector3.new(1.1, 1.1, 1.1)
		p.Material = Enum.Material.Neon
		p.Color = warna
		p.Position = titik
		p.Parent = workspace
		local a, b = math.random() * math.pi * 2, (math.random() - 0.5) * math.pi
		bola[i] = { p = p, arah = Vector3.new(math.cos(a) * math.cos(b), math.sin(b), math.sin(a) * math.cos(b)) }
	end
	local t0 = os.clock()
	local sambung
	sambung = RunService.RenderStepped:Connect(function()
		local t = os.clock() - t0
		if t > 1.3 then
			sambung:Disconnect()
			for _, x in ipairs(bola) do x.p:Destroy() end
			return
		end
		for _, x in ipairs(bola) do
			x.p.Position = titik + x.arah * (26 * (1 - (1 - t / 1.3) ^ 2)) - Vector3.new(0, 9 * t * t, 0)
			x.p.Transparency = math.clamp(t / 1.3, 0, 1) ^ 2
		end
	end)
end

RunService.RenderStepped:Connect(function(dt)
	if GL.main and panel.Visible then
		GL.x += GL.v * dt * (1.1 + GL.ke * 0.35)
		if GL.x > 1 then GL.x, GL.v = 1, -1 end
		if GL.x < 0 then GL.x, GL.v = 0, 1 end
		jarum.Position = UDim2.fromScale(GL.x, 0.5)
	end
	local model = workspace:FindFirstChild("DK_PasarMalam")
	if not model then
		if panel.Visible then panel.Visible = false end
		return
	end
	local poros = model:GetAttribute("poros")
	local roda = model:FindFirstChild("roda")
	local gondola = model:FindFirstChild("gondola")
	if typeof(poros) ~= "Vector3" or not roda or not roda.PrimaryPart or not gondola then return end
	sudut += dt * 0.25
	roda:PivotTo(CFrame.new(poros) * CFrame.Angles(0, 0, sudut))
	for _, g in ipairs(gondola:GetChildren()) do
		local a = sudut + (tonumber(g.Name) or 0) / 8 * math.pi * 2 + math.pi / 2
		g.CFrame = CFrame.new(poros + Vector3.new(math.cos(a) * 14.375, math.sin(a) * 14.375 - 1.9, 0))
	end
	tKembang -= dt
	if tKembang <= 0 then
		tKembang = 5 + math.random() * 5
		local pusat = model:GetAttribute("pusat")
		if typeof(pusat) == "Vector3" then kembangApi(pusat) end
	end
end)
