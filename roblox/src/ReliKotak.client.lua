--[[
  ReliKotak (LocalScript) - lobi, mobil, dan HUD Reli Kotak. Fisika mobil disalin dari reli.js game web:
  gas otomatis, setir kiri/kanan, rem dengan mundur (tombol S atau tongkat ke bawah), semak di tepi jalan memantulkan mobil.
  Tempat: StarterPlayer.StarterPlayerScripts.ReliKotak.
  Pasangannya: ServerScriptService.ReliKotak (DK_Reli, DK_ReliBuka, DK_ReliKabar) dan ReplicatedStorage.DK_ReliLintasan.
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local pintu = ReplicatedStorage:WaitForChild("DK_Reli")
local bukaEv = ReplicatedStorage:WaitForChild("DK_ReliBuka")
local kabarEv = ReplicatedStorage:WaitForChild("DK_ReliKabar")
local R = require(ReplicatedStorage:WaitForChild("DK_ReliLintasan"))

local GELAP = Color3.fromRGB(29, 29, 34)
local KUNING = Color3.fromRGB(255, 196, 37)
local PUTIH = Color3.new(1, 1, 1)
local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local BERAT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)

local pg = player:WaitForChild("PlayerGui")
local lama = pg:FindFirstChild("ReliKotak")
if lama then lama:Destroy() end
local gui = Instance.new("ScreenGui")
gui.Name = "ReliKotak"
gui.ResetOnSpawn = false
gui.DisplayOrder = 26
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
	b.TextSize = 14
	b.Text = isi
	bulat(b, 9)
	b.Parent = induk
	return b
end

local function jamTeks(ms)
	if not ms or ms <= 0 then return "–" end
	local t = ms / 1000
	local m = math.floor(t / 60)
	return string.format("%d:%05.2f", m, t - m * 60)
end

local function pesan(isi)
	local t = Instance.new("TextLabel")
	t.AnchorPoint = Vector2.new(0.5, 0)
	t.Position = UDim2.new(0.5, 0, 0, 64)
	t.AutomaticSize = Enum.AutomaticSize.XY
	t.BackgroundColor3 = GELAP
	t.BackgroundTransparency = 0.1
	t.TextColor3 = PUTIH
	t.FontFace = TEBAL
	t.TextSize = 15
	t.Text = isi
	t.ZIndex = 8
	bulat(t, 10)
	local p = Instance.new("UIPadding")
	p.PaddingLeft = UDim.new(0, 12)
	p.PaddingRight = UDim.new(0, 12)
	p.PaddingTop = UDim.new(0, 8)
	p.PaddingBottom = UDim.new(0, 8)
	p.Parent = t
	t.Parent = gui
	task.delay(3.5, function() t:Destroy() end)
end

-- ---------- panel lobi dan hasil ----------
local panel = Instance.new("Frame")
panel.Size = UDim2.fromOffset(440, 236)
panel.AnchorPoint = Vector2.new(0.5, 0.5)
panel.Position = UDim2.fromScale(0.5, 0.5)
panel.BackgroundColor3 = GELAP
panel.BackgroundTransparency = 0.04
panel.Visible = false
bulat(panel, 14)
panel.Parent = gui

local judul = label(panel, "🏁 Reli Kotak", BERAT, 18, KUNING)
judul.Position = UDim2.fromOffset(14, 10)
judul.Size = UDim2.fromOffset(300, 22)
local tutup = tombol(panel, "X", Color3.fromRGB(70, 70, 78), PUTIH)
tutup.Size = UDim2.fromOffset(28, 28)
tutup.Position = UDim2.new(1, -38, 0, 8)

local baris = {}
for n = 1, #R.LINTASAN do
	local b = tombol(panel, "", Color3.fromRGB(52, 52, 60), PUTIH)
	b.Size = UDim2.fromOffset(206, 28)
	b.Position = UDim2.fromOffset(14, 40 + (n - 1) * 32)
	b.TextXAlignment = Enum.TextXAlignment.Left
	b.TextSize = 13
	local p = Instance.new("UIPadding")
	p.PaddingLeft = UDim.new(0, 8)
	p.Parent = b
	baris[n] = b
end
local kanan = label(panel, "", TEBAL, 13, PUTIH)
kanan.Position = UDim2.fromOffset(232, 40)
kanan.Size = UDim2.fromOffset(196, 150)
local bMulai = tombol(panel, "Mulai balapan", KUNING)
bMulai.Size = UDim2.fromOffset(196, 34)
bMulai.Position = UDim2.fromOffset(232, 194)
local bDesa = tombol(panel, "Kembali ke desa", Color3.fromRGB(70, 70, 78), PUTIH)
bDesa.Size = UDim2.fromOffset(206, 30)
bDesa.Position = UDim2.fromOffset(14, 198)
bDesa.Visible = false

-- ---------- HUD balapan ----------
local hud = label(gui, "", BERAT, 17, PUTIH)
hud.AnchorPoint = Vector2.new(0.5, 0)
hud.Position = UDim2.new(0.5, 0, 0, 58)
hud.Size = UDim2.fromOffset(420, 26)
hud.TextXAlignment = Enum.TextXAlignment.Center
hud.TextStrokeTransparency = 0.3
hud.Visible = false
local besar = label(gui, "", BERAT, 64, KUNING)
besar.AnchorPoint = Vector2.new(0.5, 0.5)
besar.Position = UDim2.fromScale(0.5, 0.4)
besar.Size = UDim2.fromOffset(300, 80)
besar.TextXAlignment = Enum.TextXAlignment.Center
besar.TextStrokeTransparency = 0.2
besar.Visible = false
local bKeluar = tombol(gui, "Keluar reli", Color3.fromRGB(70, 70, 78), PUTIH)
bKeluar.AnchorPoint = Vector2.new(1, 1)
bKeluar.Position = UDim2.new(1, -12, 0, 146)
bKeluar.AnchorPoint = Vector2.new(1, 0)
bKeluar.Size = UDim2.fromOffset(104, 34)
bKeluar.Visible = false

-- ---------- keadaan ----------
local INFO, PILIH = nil, 1
local MODE = "diam" -- diam | siap | balap | selesai
local L, LNO, TINGGI = nil, 1, 2.6
local Kd = {}       -- keadaan mobil (meter lintasan)
local gerbangKe, waktu, tSiap, kamYaw, sibuk = 0, 0, 0, 0, false

-- setir: tombol A/D atau panah, rem: S, panah bawah, atau spasi; di HP pakai tombol layar
local tekan = { kiri = false, kanan = false, rem = false }
local function tombolTahan(isi, kunci, letak)
	local b = tombol(gui, isi, Color3.fromRGB(52, 52, 60), PUTIH)
	b.TextSize = 20
	b.BackgroundTransparency = 0.25
	b.Size = UDim2.fromOffset(72, 54)
	b.AnchorPoint = Vector2.new(letak.X.Scale, 1)
	b.Position = letak
	b.Visible = false
	b.InputBegan:Connect(function(i)
		if i.UserInputType == Enum.UserInputType.Touch or i.UserInputType == Enum.UserInputType.MouseButton1 then tekan[kunci] = true end
	end)
	b.InputEnded:Connect(function(i)
		if i.UserInputType == Enum.UserInputType.Touch or i.UserInputType == Enum.UserInputType.MouseButton1 then tekan[kunci] = false end
	end)
	return b
end
local bKiri = tombolTahan("◀", "kiri", UDim2.new(0, 12, 1, -56))
local bKanan = tombolTahan("▶", "kanan", UDim2.new(0, 92, 1, -56))
local bRem = tombolTahan("REM", "rem", UDim2.new(1, -12, 1, -56))
bRem.TextSize = 15
local function masukan()
	local x = 0
	if tekan.kiri or UserInputService:IsKeyDown(Enum.KeyCode.A) or UserInputService:IsKeyDown(Enum.KeyCode.Left) then x -= 1 end
	if tekan.kanan or UserInputService:IsKeyDown(Enum.KeyCode.D) or UserInputService:IsKeyDown(Enum.KeyCode.Right) then x += 1 end
	local rem = tekan.rem or UserInputService:IsKeyDown(Enum.KeyCode.S) or UserInputService:IsKeyDown(Enum.KeyCode.Down) or UserInputService:IsKeyDown(Enum.KeyCode.Space)
	return x, rem
end
local function tombolSetir(tampil)
	bKiri.Visible, bKanan.Visible, bRem.Visible = tampil, tampil, tampil
	if not tampil then tekan.kiri, tekan.kanan, tekan.rem = false, false, false end
end

local function tulisLobi()
	if not INFO or not INFO.lintasan then return end
	judul.Text = "🏁 Reli Kotak"
	for n, b in ipairs(baris) do
		local x = INFO.lintasan[n]
		b.Visible = true
		b.Text = (x.buka and "" or "🔒 ") .. n .. ". " .. x.nama .. (x.rekor > 0 and ("  ·  " .. jamTeks(x.rekor)) or "")
		b.BackgroundColor3 = n == PILIH and Color3.fromRGB(88, 76, 30) or Color3.fromRGB(52, 52, 60)
		b.TextTransparency = x.buka and 0 or 0.45
	end
	local t = "5 tercepat · " .. INFO.lintasan[PILIH].nama .. "\n"
	if INFO.l == PILIH and INFO.top and #INFO.top > 0 then
		for i, e in ipairs(INFO.top) do t ..= i .. ". " .. e.u .. "  " .. jamTeks(e.t) .. "\n" end
	else
		t ..= "Belum ada rekor.\n"
	end
	t ..= "\nFinish berkoin hari ini: sisa " .. INFO.sisaKoin .. " (10 koin)"
	if not INFO.lintasan[PILIH].buka then t ..= "\nTerbuka setelah finish di Hutan Pinus." end
	kanan.Text = t
	bMulai.Text = MODE == "diam" and "Mulai balapan" or "Balapan lagi"
	bMulai.Visible = true
	bDesa.Visible = MODE ~= "diam"
	tutup.Visible = MODE == "diam"
end

local function muatLobi(l)
	local ok, r = pcall(function() return pintu:InvokeServer("buka", l) end)
	if not ok or typeof(r) ~= "table" then return pesan("Sinyal putus. Coba lagi sebentar.") end
	if r.galat then return pesan(r.galat) end
	INFO = r
	tulisLobi()
end

for n, b in ipairs(baris) do
	b.Activated:Connect(function()
		PILIH = n
		tulisLobi()
		task.spawn(muatLobi, n)
	end)
end
tutup.Activated:Connect(function() panel.Visible = false end)
bukaEv.OnClientEvent:Connect(function()
	if MODE ~= "diam" then return end
	panel.Visible = true
	muatLobi(PILIH)
end)

local function taruhStart()
	local i = L.START - 3
	local q = L.T[i]
	Kd = { x = q.x, z = q.z, h = math.atan2(q.tx, q.tz), vx = 0, vz = 0, setir = 0, i = i, d = 0, roll = 0, pitch = 0 }
	Kd.y = R.yJalan(L, i, 0)
	kamYaw = Kd.h
	gerbangKe, waktu = 0, 0
end

local function berhenti()
	MODE = "diam"
	hud.Visible = false
	besar.Visible = false
	bKeluar.Visible = false
	panel.Visible = false
	tombolSetir(false)
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

local function mulai()
	if sibuk then return end
	sibuk = true
	local ok, r = pcall(function() return pintu:InvokeServer("mulai", PILIH) end)
	sibuk = false
	if not ok or typeof(r) ~= "table" then return pesan("Sinyal putus. Coba lagi sebentar.") end
	if r.galat then return pesan(r.galat) end
	LNO = r.l
	L = R.buat(LNO)
	TINGGI = r.tinggi or 2.6
	taruhStart()
	tSiap = os.clock() + 3
	MODE = "siap"
	panel.Visible = false
	hud.Visible = true
	besar.Visible = true
	bKeluar.Visible = true
	tombolSetir(true)
end
bMulai.Activated:Connect(mulai)
bDesa.Activated:Connect(keluar)
bKeluar.Activated:Connect(keluar)

kabarEv.OnClientEvent:Connect(function(h)
	if typeof(h) ~= "table" or MODE == "diam" then return end
	MODE = "selesai"
	besar.Visible = false
	for _, b in ipairs(baris) do b.Visible = false end
	if h.galat then
		judul.Text = "🏁 Finish"
		kanan.Text = h.galat
	else
		judul.Text = "🏁 Finish! " .. jamTeks(h.ms)
		local t = (h.rekorBaru and "Rekor baru!" or ("Rekormu " .. jamTeks(h.rekor))) .. "\n"
		t ..= h.dapat and ("+" .. h.dapat .. " koin\n") or "Koin finish hari ini sudah habis.\n"
		if h.bukaBaru then t ..= "Lintasan 2 sampai 5 terbuka!\n" end
		t ..= "Sisa finish berkoin: " .. (h.sisaKoin or 0)
		kanan.Text = t
	end
	bMulai.Text = "Balapan lagi"
	bMulai.Visible = true
	bDesa.Visible = true
	tutup.Visible = false
	panel.Visible = true
	task.spawn(function()
		local ok, r = pcall(function() return pintu:InvokeServer("buka", PILIH) end)
		if ok and typeof(r) == "table" and not r.galat then INFO = r end
	end)
end)

player.CharacterAdded:Connect(function()
	if MODE ~= "diam" then berhenti() end
end)

-- ---------- fisika (salinan fisika() di reli.js) ----------
local function fisika(dt)
	local T, NS = L.T, L.NS
	local fx, fz = math.sin(Kd.h), math.cos(Kd.h)
	local rx, rz = -fz, fx
	local vf, vr = Kd.vx * fx + Kd.vz * fz, Kd.vx * rx + Kd.vz * rz
	local i, d = R.proyeksi(L, Kd.x, Kd.z, Kd.i, 24)
	Kd.i, Kd.d = i, d
	local diJalan = math.abs(d) < R.LEBAR / 2 + 0.4
	local vmax = diJalan and R.VMAX or R.VRUMPUT
	local aktif = MODE == "balap"
	local setirMau, rem = masukan()
	-- setir otomatis: sesudah finish, atau saat uji coba (atribut DK_ReliAuto di pemain)
	local auto = player:GetAttribute("DK_ReliAuto") == true
	if auto or MODE == "selesai" then
		local q = T[math.min(NS, Kd.i + 4 + math.floor(math.abs(vf) * 0.22 + 0.5))]
		local sudut = math.atan2(q.x - Kd.x, q.z - Kd.z) - Kd.h
		setirMau = math.clamp(-math.atan2(math.sin(sudut), math.cos(sudut)) * 2.4, -1, 1)
	end
	if auto then
		local ke = T[math.min(NS, Kd.i + 22)]
		rem = math.abs(ke.k) > 0.035 and vf > 21
	end
	Kd.setir += (setirMau - Kd.setir) * math.min(1, dt * 7)
	if aktif and not rem then
		vf += 10.5 * math.max(0, 1 - vf / vmax) * (vf < 0 and 2 or 1) * dt
	elseif aktif and rem then
		if vf > 0.5 then vf -= 24 * dt else vf = math.max(-7, vf - 5 * dt) end
	end
	if MODE == "selesai" then vf -= math.min(vf, 13 * dt) end
	if vf > vmax then vf -= (vf - vmax) * math.min(1, dt * 2.2) end
	vf -= vf * 0.06 * dt
	local laju = math.min(1, math.abs(vf) / 6)
	local yaw = -Kd.setir * 2.05 * laju * (1 - 0.38 * math.min(1, math.abs(vf) / R.VMAX)) * (vf < 0 and -1 or 1)
	Kd.h += yaw * dt
	local cengkram = diJalan and (5.2 - math.min(1.6, math.abs(Kd.setir) * math.abs(vf) / 22)) or 3.4
	vr *= math.exp(-cengkram * dt)
	local fx2, fz2 = math.sin(Kd.h), math.cos(Kd.h)
	local rx2, rz2 = -fz2, fx2
	Kd.vx, Kd.vz = fx2 * vf + rx2 * vr, fz2 * vf + rz2 * vr
	Kd.x += Kd.vx * dt
	Kd.z += Kd.vz * dt
	local i2, d2 = R.proyeksi(L, Kd.x, Kd.z, Kd.i, 24)
	local q = T[i2]
	if math.abs(d2) > R.SEMAK then
		local s = d2 > 0 and 1 or -1
		local lebih = math.abs(d2) - R.SEMAK
		Kd.x -= q.nx * s * lebih
		Kd.z -= q.nz * s * lebih
		local vn = Kd.vx * q.nx * s + Kd.vz * q.nz * s
		if vn > 0 then
			Kd.vx = (Kd.vx - q.nx * s * vn * 1.4) * 0.9
			Kd.vz = (Kd.vz - q.nz * s * vn * 1.4) * 0.9
		end
	end
	Kd.i, Kd.d = i2, d2
	local yT = R.yJalan(L, Kd.i, Kd.d)
	Kd.y += (yT - Kd.y) * math.min(1, dt * 14)
	local qb = T[Kd.i]
	local rel = Kd.h - math.atan2(qb.tx, qb.tz)
	local qn, qp = T[math.min(NS, Kd.i + 2)], T[math.max(0, Kd.i - 2)]
	local miring = (qn.y - qp.y) / (4 * L.ds)
	Kd.roll += (qb.bk * math.cos(rel) - Kd.roll) * math.min(1, dt * 8)
	Kd.pitch += (miring * math.cos(rel) - Kd.pitch) * math.min(1, dt * 8)
	return Kd.vx * fx2 + Kd.vz * fz2
end

RunService.RenderStepped:Connect(function(dt)
	if MODE == "diam" or not L then return end
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not hrp or not hum then return end
	dt = math.min(dt, 0.05)
	if MODE == "siap" then
		local sisa = tSiap - os.clock()
		if sisa <= 0 then
			MODE = "balap"
			besar.Text = "GAS!"
			task.delay(0.8, function() if MODE == "balap" then besar.Visible = false end end)
		else
			besar.Text = tostring(math.ceil(sisa))
		end
	end
	local v = fisika(dt)
	if MODE == "balap" then
		waktu += dt
		while gerbangKe < R.GERBANG and Kd.i >= L.IG[gerbangKe + 1] do gerbangKe += 1 end
		if gerbangKe >= R.GERBANG then MODE = "selesai" end
	end
	-- tokoh dan mobil mengikuti keadaan
	hum.PlatformStand = true
	local pos = R.dunia(LNO, Kd.x, Kd.y, Kd.z) + Vector3.new(0, TINGGI, 0)
	local arah = Vector3.new(math.sin(Kd.h), 0, math.cos(Kd.h))
	hrp.CFrame = CFrame.lookAt(pos, pos + arah) * CFrame.Angles(math.atan(Kd.pitch), 0, math.atan(Kd.roll))
	hrp.AssemblyLinearVelocity = Vector3.zero
	hrp.AssemblyAngularVelocity = Vector3.zero
	-- kamera kejar dari belakang yang sedikit telat
	local selisih = Kd.h - kamYaw
	kamYaw += math.atan2(math.sin(selisih), math.cos(selisih)) * math.min(1, dt * 4.5)
	local ka = Vector3.new(math.sin(kamYaw), 0, math.cos(kamYaw))
	local cam = workspace.CurrentCamera
	cam.CameraType = Enum.CameraType.Scriptable
	cam.CFrame = CFrame.lookAt(pos - ka * 21 + Vector3.new(0, 8.5, 0), pos + ka * 8 + Vector3.new(0, 2, 0))
	hud.Text = jamTeks(math.max(1, waktu * 1000)) .. "  ·  Gerbang " .. gerbangKe .. " dari " .. R.GERBANG .. "  ·  " .. math.floor(math.abs(v) * 3.6 + 0.5) .. " km/j"
end)
