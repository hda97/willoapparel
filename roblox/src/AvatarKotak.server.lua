--[[
  DUNIA KOTAK (Roblox) - AVATAR KOTAK v1
  Tempat: ServerScriptService.AvatarKotak (Script biasa).

  Mengganti tampilan tokoh Roblox dengan tokoh kotak game web
  (salinan public/duniakotak/mabar/js/aset/avatar.js: ukuran, letak, warna,
  gaya rambut, hijab, atasan, bawahan, wajah). 1 satuan web = SKALA stud.

  Cara kerja: rangka Roblox (R6 atau R15) tetap dipakai untuk jalan dan lompat,
  tapi semua bagiannya disembunyikan. Balok tokoh web ditempel ke kepala, badan,
  lengan, dan kaki, jadi ayunan tangan dan kaki mengikuti gerak Roblox.

  Pilihan tokoh disimpan di atribut pemain "DK_Avatar" (JSON, bentuknya sama
  dengan avatar di game web). Belum ada? Dibuat acak dari UserId dengan rumus
  avAcak game web. Skrip lain boleh mengubah atribut itu; tokoh langsung dirakit ulang.
]]

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")

local KULIT = { "#f6d6b8", "#f2c7a0", "#e0aa7e", "#c98c5e", "#a86e44", "#7a4a2a" }
local WARNA_RAMBUT = { "#0b0b0e", "#3a2416", "#6a4026", "#a0622e", "#d8b070", "#8a8a90", "#b03a2e", "#2a3a6a" }
local GAYA_RAMBUT = { L = { "cepak", "belah", "acak", "keriting" }, P = { "panjang", "kuncir", "kepang", "bob", "hijab" } }
local ATASAN = { "kaos", "kaos-willo", "kemeja", "jaket", "batik", "seragam" }
local BAWAHAN = { L = { "celana", "pendek", "sarung" }, P = { "celana", "rok", "rok-panjang" } }
local WARNA_BAJU = { "#1d1d22", "#f4f4f4", "#3a7bd5", "#d0442f", "#2a9a5a", "#f2c14e", "#8a5ad8", "#e06a9a" }
local WARNA_BAWAH = { "#2f3a52", "#1d1d22", "#6a5a48", "#3a5a3a", "#7a2a2a", "#c8b89a" }

local NAMA_FOLDER = "TokohKotak"
local FLIP = CFrame.Angles(0, math.pi, 0) -- tokoh web menghadap +z, tokoh Roblox menghadap -Z
local FONT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)

local function hex(h) return Color3.fromHex(h) end

local function ada(daftar, v)
	for _, x in ipairs(daftar) do if x == v then return true end end
	return false
end

-- sama dengan avAcak() di game web
local function avAcak(no)
	local function r(n) return (no * 7919 + n * 104729) % 997 end
	local jenis = (r(1) % 2 == 1) and "P" or "L"
	local gaya = GAYA_RAMBUT[jenis]
	return {
		jenis = jenis,
		kulit = KULIT[r(2) % 6 + 1],
		rambut = { gaya = gaya[r(3) % #gaya + 1], warna = WARNA_RAMBUT[r(4) % 6 + 1] },
		atasan = { jenis = ATASAN[r(5) % 5 + 1], warna = WARNA_BAJU[r(6) % 8 + 1] },
		bawahan = { jenis = BAWAHAN[jenis][1], warna = WARNA_BAWAH[r(7) % 6 + 1] },
	}
end

local function hexOk(s) return typeof(s) == "string" and string.match(s, "^#%x%x%x%x%x%x$") ~= nil end

-- sama dengan bersihAv() di game web
local function bersih(a)
	a = typeof(a) == "table" and a or {}
	local jenis = a.jenis == "P" and "P" or "L"
	local rb = typeof(a.rambut) == "table" and a.rambut or {}
	local at = typeof(a.atasan) == "table" and a.atasan or {}
	local bw = typeof(a.bawahan) == "table" and a.bawahan or {}
	local d = {
		jenis = jenis,
		kulit = ada(KULIT, a.kulit) and a.kulit or KULIT[2],
		rambut = { gaya = ada(GAYA_RAMBUT[jenis], rb.gaya) and rb.gaya or GAYA_RAMBUT[jenis][1], warna = hexOk(rb.warna) and rb.warna or WARNA_RAMBUT[1] },
		atasan = { jenis = ada(ATASAN, at.jenis) and at.jenis or "kaos", warna = hexOk(at.warna) and at.warna or "#3a7bd5" },
		bawahan = { jenis = ada(BAWAHAN[jenis], bw.jenis) and bw.jenis or "celana", warna = hexOk(bw.warna) and bw.warna or "#2f3a52" },
		topi = hexOk(a.topi) and a.topi or nil,
		sepatu = "#1a1a1a",
	}
	if d.rambut.gaya == "hijab" then
		d.hijab = hexOk(rb.warna) and ada(WARNA_BAJU, rb.warna) and rb.warna or "#6a8fb0"
		d.lenganPanjang = true
		if not ada(BAWAHAN.P, bw.jenis) or bw.jenis == "celana" then d.bawahan = { jenis = "rok-panjang", warna = hexOk(bw.warna) and bw.warna or "#4a5a7a" } end
	end
	return d
end

local function bacaAvatar(player)
	local s = player:GetAttribute("DK_Avatar")
	if typeof(s) == "string" and #s > 0 then
		local ok, t = pcall(function() return HttpService:JSONDecode(s) end)
		if ok then return bersih(t) end
	end
	local a = avAcak(player.UserId % 100000)
	player:SetAttribute("DK_Avatar", HttpService:JSONEncode(a))
	return bersih(a)
end

---------------------------------------------------------------------
-- Perakit
---------------------------------------------------------------------
local function rakit(char, d)
	local hum = char:FindFirstChildOfClass("Humanoid")
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if not hum or not hrp then return false end
	local r15 = hum.RigType == Enum.HumanoidRigType.R15
	-- nama bagian rangka: R15 (badan dua potong, lengan atas, paha) atau R6 (enam balok)
	local NAMA = r15 and {
		LowerTorso = "LowerTorso", UpperTorso = "UpperTorso", Head = "Head",
		LeftUpperArm = "LeftUpperArm", RightUpperArm = "RightUpperArm", LeftUpperLeg = "LeftUpperLeg", RightUpperLeg = "RightUpperLeg",
	} or {
		LowerTorso = "Torso", UpperTorso = "Torso", Head = "Head",
		LeftUpperArm = "Left Arm", RightUpperArm = "Right Arm", LeftUpperLeg = "Left Leg", RightUpperLeg = "Right Leg",
	}
	local bagian = {}
	for kunci, n in pairs(NAMA) do
		bagian[kunci] = char:FindFirstChild(n)
		if not bagian[kunci] then return false, "bagian " .. n .. " tidak ada" end
	end

	-- letak diam tiap bagian rangka terhadap HumanoidRootPart, dihitung dari sendi (tidak terpengaruh animasi)
	local sendi = {}
	for _, m in ipairs(char:GetDescendants()) do
		if m:IsA("Motor6D") and m.Part1 then sendi[m.Part1] = m end
	end
	local diamPart = { [hrp] = CFrame.new() }
	local function letak(part, dalam)
		if diamPart[part] then return diamPart[part] end
		local m = sendi[part]
		if not m or not m.Part0 or (dalam or 0) > 8 then return nil end
		local induk = letak(m.Part0, (dalam or 0) + 1)
		if not induk then return nil end
		diamPart[part] = induk * m.C0 * m.C1:Inverse()
		return diamPart[part]
	end
	local diam = {}
	for kunci, part in pairs(bagian) do
		diam[kunci] = letak(part)
		if not diam[kunci] then return false, "sendi " .. part.Name .. " tidak ketemu" end
	end

	local pinggul = sendi[bagian.LeftUpperLeg]
	local yPinggul = (diamPart[pinggul.Part0] * pinggul.C0).Position.Y
	local yTanah = -(hum.HipHeight + hrp.Size.Y / 2 + (r15 and 0 or bagian.LeftUpperLeg.Size.Y))
	local S = (yPinggul - yTanah) / 1.37 -- pinggul tokoh web ada di 1,37
	if S < 0.8 or S > 3 then S = 1.4 end
	local DASAR = CFrame.new(0, yTanah, 0) * FLIP -- titik nol tokoh web (telapak kaki) di rangka

	local lama = char:FindFirstChild(NAMA_FOLDER)
	if lama then lama:Destroy() end
	local folder = Instance.new("Folder")
	folder.Name = NAMA_FOLDER

	-- balok(jangkar, pusatPoros, w,h,d, warna, x,y,z, rx,ry,rz): semua angka dalam satuan web
	local function balok(jangkar, poros, w, h, dd, warna, x, y, z, rx, ry, rz, bahan)
		local p = Instance.new("Part")
		p.Size = Vector3.new(w * S, h * S, dd * S)
		p.Color = typeof(warna) == "string" and hex(warna) or warna
		p.Material = bahan or Enum.Material.SmoothPlastic
		p.TopSurface = Enum.SurfaceType.Smooth
		p.BottomSurface = Enum.SurfaceType.Smooth
		p.CanCollide = false
		p.CanQuery = false
		p.CanTouch = false
		p.Massless = true
		p.Anchored = false
		local diRangka = DASAR * CFrame.new(poros * S) * CFrame.new(x * S, y * S, z * S) * CFrame.Angles(rx or 0, ry or 0, rz or 0)
		local las = Instance.new("Weld")
		las.Part0 = bagian[jangkar]
		las.Part1 = p
		las.C0 = diam[jangkar]:Inverse() * diRangka
		las.Parent = p
		p.CFrame = bagian[jangkar].CFrame * las.C0
		p.Parent = folder
		return p
	end

	local kulit, atas, bawah = d.kulit, d.atasan.warna, d.bawahan.warna
	local bj, aj = d.bawahan.jenis, d.atasan.jenis

	-- KAKI (poros di pinggul). Sisi -x web jatuh di sisi kanan Roblox.
	local function kaki(jangkar, px)
		local poros = Vector3.new(px, 1.37, 0)
		if bj == "pendek" then
			balok(jangkar, poros, 0.48, 0.55, 0.5, bawah, 0, -0.275, 0)
			balok(jangkar, poros, 0.432, 0.7, 0.45, kulit, 0, -0.9, 0)
		else
			balok(jangkar, poros, 0.48, 1.25, 0.5, (bj == "celana" or bj == "rok-panjang") and bawah or kulit, 0, -0.625, 0)
		end
		balok(jangkar, poros, 0.4416, 0.3, 0.46, d.sepatu, 0, -1.37, 0)
	end
	kaki("RightUpperLeg", -0.27)
	kaki("LeftUpperLeg", 0.27)

	local NOL = Vector3.new(0, 0, 0)
	if bj == "rok" then balok("LowerTorso", NOL, 1.2, 0.7, 0.75, bawah, 0, 1.12, 0) end
	if bj == "rok-panjang" then
		balok("LowerTorso", NOL, 1.22, 1.42, 0.78, bawah, 0, 0.8, 0)
		balok("LowerTorso", NOL, 1.3, 0.12, 0.86, bawah, 0, 0.1, 0)
	end
	if bj == "sarung" then
		local s = balok("LowerTorso", NOL, 1.2, 1.25, 0.72, bawah, 0, 0.82, 0)
		local g = Instance.new("SurfaceGui")
		g.Face = Enum.NormalId.Back
		g.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
		g.CanvasSize = Vector2.new(64, 64)
		g.LightInfluence = 1
		for i = 0, 3 do
			for _, tegak in ipairs({ true, false }) do
				local f = Instance.new("Frame")
				f.BorderSizePixel = 0
				f.BackgroundColor3 = Color3.new(1, 1, 1)
				f.BackgroundTransparency = 0.75
				f.Position = tegak and UDim2.fromOffset(i * 16, 0) or UDim2.fromOffset(0, i * 16)
				f.Size = tegak and UDim2.fromOffset(5, 64) or UDim2.fromOffset(64, 5)
				f.Parent = g
			end
		end
		g.Parent = s
	end

	-- BADAN (titik nol badan di 1,37)
	local BADAN = Vector3.new(0, 1.37, 0)
	local torso = balok("UpperTorso", BADAN, 1.1, 1.2, 0.6, atas, 0, 0.6, 0)
	local function kanvas(part, sisi, w, h)
		local g = Instance.new("SurfaceGui")
		g.Face = sisi
		g.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
		g.CanvasSize = Vector2.new(w, h)
		g.LightInfluence = 1
		g.Parent = part
		return g
	end
	local function kotak(g, x, y, w, h, warna, alfa, sudut, bulat)
		local f = Instance.new("Frame")
		f.BorderSizePixel = 0
		f.AnchorPoint = Vector2.new(0.5, 0.5)
		f.Position = UDim2.fromOffset(x, y)
		f.Size = UDim2.fromOffset(w, h)
		f.BackgroundColor3 = typeof(warna) == "string" and hex(warna) or warna
		f.BackgroundTransparency = alfa or 0
		f.Rotation = sudut or 0
		if bulat then
			local c = Instance.new("UICorner")
			c.CornerRadius = UDim.new(bulat, 0)
			c.Parent = f
		end
		f.Parent = g
		return f
	end
	local function teks(g, isi, y, tinggi, warna)
		local t = Instance.new("TextLabel")
		t.BackgroundTransparency = 1
		t.AnchorPoint = Vector2.new(0.5, 1)
		t.Position = UDim2.fromOffset(64, y + tinggi * 0.2)
		t.Size = UDim2.fromOffset(108, tinggi * 1.25)
		t.FontFace = FONT
		t.TextScaled = true
		t.TextColor3 = warna
		t.Text = isi
		t.Parent = g
	end
	do
		local g = kanvas(torso, Enum.NormalId.Back, 128, 128) -- sisi depan tokoh
		local hitam, putih = Color3.new(0, 0, 0), Color3.new(1, 1, 1)
		if aj == "kaos-willo" then
			local terang = ada({ "#f4f4f4", "#f4f4f0", "#f2c14e", "#ffffff" }, string.lower(atas))
			local tinta = terang and hex("#1d1d22") or putih
			teks(g, "WILLO", 62, 30, tinta)
			teks(g, "APPAREL", 80, 12, tinta)
		elseif aj == "kemeja" or aj == "seragam" then
			for i = 0, 3 do kotak(g, 64.5, 26.5 + i * 24, 5, 5, hitam, 0.75) end
			if aj == "seragam" then kotak(g, 64, 29, 12, 46, "#8a1a1a") end
			kotak(g, 52, 6, 30, 7, putih, 0.4, 37)
			kotak(g, 76, 6, 30, 7, putih, 0.4, -37)
		elseif aj == "jaket" then
			kotak(g, 64, 64, 4, 128, hitam, 0.65)
			kotak(g, 32, 82, 36, 24, putih, 0.85)
			kotak(g, 96, 82, 36, 24, putih, 0.85)
		elseif aj == "batik" then
			for i = 0, 3 do
				for j = 0, 3 do
					local cx, cy = 16 + i * 32, 16 + j * 32
					local o = kotak(g, cx, cy, 20, 20, hitam, 1, 0, 0.5)
					local st = Instance.new("UIStroke")
					st.Thickness = 3
					st.Color = Color3.fromRGB(60, 30, 10)
					st.Transparency = 0.3
					st.Parent = o
					kotak(g, cx, cy, 28, 3, Color3.fromRGB(60, 30, 10), 0.3)
					kotak(g, cx, cy, 3, 28, Color3.fromRGB(60, 30, 10), 0.3)
				end
			end
		end
	end
	if aj == "jaket" then balok("UpperTorso", BADAN, 1.0, 0.3, 0.4, atas, 0, 1.15, -0.3) end

	-- LENGAN (poros di bahu)
	local pendek = (not d.lenganPanjang) and (aj == "kaos" or aj == "kaos-willo" or aj == "seragam")
	local function lengan(jangkar, px, miring)
		local poros = Vector3.new(px, 1.37 + 1.1, 0)
		if pendek then
			balok(jangkar, poros, 0.45, 0.45, 0.48, atas, 0, -0.225, 0, 0, 0, miring)
			balok(jangkar, poros, 0.405, 0.6, 0.432, kulit, 0, -0.75, 0, 0, 0, miring)
		else
			balok(jangkar, poros, 0.45, 1.05, 0.48, atas, 0, -0.525, 0, 0, 0, miring)
		end
		balok(jangkar, poros, 0.414, 0.3, 0.4416, kulit, 0, -1.17, 0, 0, 0, miring)
	end
	lengan("RightUpperArm", -0.79, 0)
	lengan("LeftUpperArm", 0.79, 0)

	-- KEPALA (titik nol kepala di 1,37 + 1,2)
	local KEPALA = Vector3.new(0, 1.37 + 1.2, 0)
	local kepala = balok("Head", KEPALA, 0.95, 0.95, 0.95, kulit, 0, 0.55, 0)
	do
		local g = kanvas(kepala, Enum.NormalId.Back, 256, 256)
		local gelap = hex("#1a1a1a")
		local P = d.jenis == "P"
		for _, ex in ipairs({ 88, 168 }) do
			kotak(g, ex, 124, 26, 36, gelap, 0, 0, 0.5)
			kotak(g, ex + 4, 118, 8, 8, Color3.new(1, 1, 1), 0, 0, 0.5)
			if P then
				kotak(g, ex + 15, 104, 13, 4, gelap, 0, -39)
				kotak(g, ex + 18, 111.5, 11, 4, gelap, 0, -27)
			end
		end
		local tebal = P and 6 or 9
		kotak(g, 88, 90, 40, tebal, "#2a1a12", 0, -6, 0.5)
		kotak(g, 168, 90, 40, tebal, "#2a1a12", 0, 6, 0.5)
		if P then
			kotak(g, 66, 160, 32, 20, Color3.fromRGB(255, 120, 120), 0.65, 0, 0.5)
			kotak(g, 190, 160, 32, 20, Color3.fromRGB(255, 120, 120), 0.65, 0, 0.5)
		end
		kotak(g, 129, 189, 44, 7, P and "#b0474a" or "#2a1a12", 0, 0, 0.5)
	end

	-- RAMBUT / HIJAB / TOPI
	local benih = 11
	local function rnd()
		benih = (benih * 16807) % 2147483647
		return (benih - 1) / 2147483646
	end
	local wr = d.rambut.warna
	local function B(w, h, dd, x, y, z, rx, ry, rz, warna)
		return balok("Head", KEPALA, w, h, dd, warna or wr, x, y, z, rx, ry, rz)
	end
	local gaya = d.rambut.gaya
	if d.hijab then
		local wh = d.hijab
		B(1.12, 0.3, 1.12, 0, 1.08, 0, 0, 0, 0, wh)
		B(1.12, 1.0, 0.26, 0, 0.6, -0.46, 0, 0, 0, wh)
		for _, x in ipairs({ -0.54, 0.54 }) do B(0.18, 1.0, 1.0, x, 0.6, -0.02, 0, 0, 0, wh) end
		B(1.12, 0.18, 0.12, 0, 0.98, 0.5, 0, 0, 0, wh)
		B(1.3, 0.5, 1.0, 0, -0.05, -0.05, 0, 0, 0, wh)
		B(1.0, 0.55, 0.2, 0, -0.35, 0.36, 0, 0, 0, wh)
	else
		B(1.05, gaya == "cepak" and 0.22 or 0.34, 1.05, 0, gaya == "cepak" and 1.0 or 1.06, 0)
		if gaya == "cepak" then B(1.0, 0.5, 0.16, 0, 0.78, -0.44) end
		if gaya == "belah" then
			B(0.6, 0.2, 0.3, -0.2, 0.98, 0.42, 0, 0, 0.25)
			B(0.36, 0.24, 0.24, 0.3, 0.95, 0.43)
			B(1.02, 0.7, 0.2, 0, 0.72, -0.44)
			for _, x in ipairs({ -0.5, 0.5 }) do B(0.12, 0.35, 0.7, x, 0.9, -0.05) end
		end
		if gaya == "acak" then
			for i = 0, 13 do
				local a = i / 14 * math.pi * 2
				local h = 0.3 + rnd() * 0.18
				local y = 1.02 + rnd() * 0.14
				B(0.3, h, 0.3, math.cos(a) * 0.42, y, math.sin(a) * 0.42, rnd() * 0.5, a, rnd() * 0.4)
			end
			for i = 0, 4 do B(0.24, 0.34, 0.14, -0.36 + i * 0.18, 0.93, 0.5, 0, 0, (i - 2) * 0.14) end
			B(1.02, 0.9, 0.24, 0, 0.62, -0.43)
		end
		if gaya == "keriting" then
			for _ = 1, 26 do
				local a, r = rnd() * math.pi * 2, 0.25 + rnd() * 0.3
				B(0.28, 0.28, 0.28, math.cos(a) * r, 1.05 + rnd() * 0.25, math.sin(a) * r - 0.05)
			end
			B(1.06, 0.7, 0.3, 0, 0.72, -0.4)
		end
		if gaya == "panjang" or gaya == "kuncir" or gaya == "kepang" or gaya == "bob" then
			for i = 0, 4 do B(0.24, 0.3, 0.14, -0.36 + i * 0.18, 0.95, 0.5, 0, 0, (i - 2) * 0.1) end
			if gaya == "panjang" then
				B(1.08, 1.5, 0.3, 0, 0.35, -0.42)
				for _, x in ipairs({ -0.53, 0.53 }) do B(0.18, 1.35, 0.85, x, 0.4, -0.02) end
			end
			if gaya == "bob" then
				B(1.1, 0.85, 0.3, 0, 0.68, -0.42)
				for _, x in ipairs({ -0.54, 0.54 }) do B(0.18, 0.8, 0.95, x, 0.62, 0) end
			end
			if gaya == "kuncir" then
				B(1.02, 0.8, 0.22, 0, 0.68, -0.44)
				for _, x in ipairs({ -0.5, 0.5 }) do B(0.14, 0.75, 0.5, x, 0.62, 0.12) end
				B(0.26, 0.26, 0.26, 0, 1.15, -0.5)
				B(0.36, 1.1, 0.36, 0, 0.62, -0.78, 0.35)
				B(0.3, 0.4, 0.3, 0, 0.08, -0.95, 0.2)
			end
			if gaya == "kepang" then
				B(1.02, 0.8, 0.22, 0, 0.68, -0.44)
				for _, x in ipairs({ -0.5, 0.5 }) do
					B(0.14, 0.5, 0.7, x, 0.75, -0.05)
					for k = 0, 5 do B(0.24, 0.2, 0.24, x * 1.08 + (k % 2 == 1 and 0.03 or -0.03), 0.42 - k * 0.19, 0.12) end
					B(0.16, 0.1, 0.16, x * 1.08, -0.72, 0.12, 0, 0, 0, "#ff6a8a")
				end
			end
		end
	end
	if d.topi then
		B(1.08, 0.3, 1.08, 0, 1.12, 0, 0, 0, 0, d.topi)
		B(1.0, 0.07, 0.5, 0, 1.0, 0.7, 0, 0, 0, d.topi)
	end

	folder.Parent = char
	return true
end

local function sembunyikan(char)
	for _, o in ipairs(char:GetDescendants()) do
		if o:IsA("BasePart") and not o:FindFirstAncestor(NAMA_FOLDER) then
			o.Transparency = 1
		elseif o:IsA("Decal") and not o:FindFirstAncestor(NAMA_FOLDER) then
			o.Transparency = 1
		elseif o:IsA("Accessory") or o:IsA("Shirt") or o:IsA("Pants") or o:IsA("ShirtGraphic") or o:IsA("CharacterMesh") then
			o:Destroy()
		end
	end
end

local sedang = {}
local function pasang(player)
	local char = player.Character
	if not char or sedang[char] then return end
	sedang[char] = true
	local hum = char:WaitForChild("Humanoid", 10)
	if not hum then sedang[char] = nil return end
	if not char:IsDescendantOf(workspace) then char.AncestryChanged:Wait() end
	-- rangka standar: R15 kotak, ukuran bawaan, tanpa aksesori, supaya ukuran tokoh semua pemain sama
	pcall(function() hum:ApplyDescription(Instance.new("HumanoidDescription")) end)
	task.wait(0.2)
	if player.Character ~= char then sedang[char] = nil return end
	-- sendi rangka kadang baru jadi sesaat setelah tampilan diganti: coba ulang sampai 5 detik
	local ok, hasil, sebab
	for _ = 1, 20 do
		ok, hasil, sebab = pcall(rakit, char, bacaAvatar(player))
		if (ok and hasil) or player.Character ~= char then break end
		task.wait(0.25)
	end
	if ok and hasil then
		sembunyikan(char)
		hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.Viewer
	else
		warn("[AvatarKotak] tokoh " .. player.Name .. " tidak dirakit: " .. tostring(sebab or hasil))
	end
	sedang[char] = nil
end

local function masuk(player)
	bacaAvatar(player) -- isi atribut dulu supaya tidak memicu rakit ulang
	player.CharacterAppearanceLoaded:Connect(function() pasang(player) end)
	player:GetAttributeChangedSignal("DK_Avatar"):Connect(function() pasang(player) end)
	if player.Character then task.spawn(pasang, player) end
end

Players.PlayerAdded:Connect(masuk)
for _, p in ipairs(Players:GetPlayers()) do task.spawn(masuk, p) end
