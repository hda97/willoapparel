--[[
  DUNIA KOTAK (Roblox) - SKRIP GAME v1
  ---------------------------------------------------------------
  CARA PAKAI:
  1. Jalankan dulu "1-bangun-map.lua" di Command Bar (map harus sudah ada).
  2. Di jendela Explorer, arahkan kursor ke "ServerScriptService",
     klik tanda + lalu pilih "Script".
  3. Hapus isi bawaan (print("Hello world!")), tempel SELURUH isi file ini.
  4. Tekan tombol Play (F5) untuk mencoba.

  Fitur:
  - Papan skor "Koin" (pojok kanan atas)
  - Koin emas berputar di jalan: sentuh = +1 koin, muncul lagi 20 detik
  - Kavling kosong: dekati, tahan E (di HP: tekan tombol) = klaim rumah.
    Klaim kavling lain = pindah rumah. Rumah hilang saat pemain keluar.
  - Koin tersimpan otomatis (DataStore) setelah game di-Publish.
  - Game Pass "Rumah 2 Lantai" (opsional): isi GAMEPASS_RUMAH_2_LANTAI
    dengan ID Game Pass setelah dibuat di Creator Hub. Biarkan 0 kalau belum.
]]

local GAMEPASS_RUMAH_2_LANTAI = 0 -- ganti dengan ID Game Pass, contoh: 123456789
local JEDA_KOIN = 20 -- detik sampai koin muncul lagi

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local MarketplaceService = game:GetService("MarketplaceService")
local RunService = game:GetService("RunService")

local ROOT = script.Parent -- skrip ini ada di dalam folder DuniaKotak (map pulau)
local KOIN = ROOT:WaitForChild("Koin")
local KAVLING = ROOT:WaitForChild("Kavling")

---------------------------------------------------------------------
-- Simpan data koin
---------------------------------------------------------------------
local store = nil
pcall(function()
	store = DataStoreService:GetDataStore("DuniaKotak_v1")
end)

local function muat(player, nilai)
	if not store then return end
	local ok, data = pcall(function()
		return store:GetAsync("p_" .. player.UserId)
	end)
	if ok and typeof(data) == "number" then
		nilai.Value = data
	end
end

local function simpan(player)
	if not store then return end
	local ls = player:FindFirstChild("leaderstats")
	if not ls then return end
	local v = ls.Koin.Value
	pcall(function()
		store:SetAsync("p_" .. player.UserId, v)
	end)
end

---------------------------------------------------------------------
-- Game Pass
---------------------------------------------------------------------
local punyaPass = {} -- [player] = true/false

local function cekPass(player)
	if GAMEPASS_RUMAH_2_LANTAI == 0 then
		return false
	end
	if punyaPass[player] == nil then
		local ok, hasil = pcall(function()
			return MarketplaceService:UserOwnsGamePassAsync(player.UserId, GAMEPASS_RUMAH_2_LANTAI)
		end)
		punyaPass[player] = ok and hasil or false
	end
	return punyaPass[player]
end

---------------------------------------------------------------------
-- Rumah pemain
---------------------------------------------------------------------
local WARNA = {
	Color3.fromRGB(255, 120, 120), Color3.fromRGB(120, 180, 255),
	Color3.fromRGB(255, 220, 110), Color3.fromRGB(150, 220, 150),
	Color3.fromRGB(200, 150, 255), Color3.fromRGB(255, 170, 210),
}

local milik = {} -- [player] = { kav = Part, rumah = Model, warna = Color3 }

local function part(induk, nama, ukuran, cf, warna, bahan, transp)
	local p = Instance.new("Part")
	p.Name = nama
	p.Anchored = true
	p.Size = ukuran
	p.CFrame = cf
	p.Color = warna
	p.Material = bahan or Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Transparency = transp or 0
	p.Parent = induk
	return p
end

local function bangunRumah(kav, player, warna, duaLantai)
	local hv = kav:FindFirstChild("Hadap")
	local hadap = hv and hv.Value or Vector3.new(0, 0, -1)
	local dasar = Vector3.new(kav.Position.X, kav.Position.Y + 0.15, kav.Position.Z)
	local cf = CFrame.lookAt(dasar, dasar + hadap)
	local w, d = 11, 11
	local h = duaLantai and 22 or 11

	local m = Instance.new("Model")
	m.Name = "Rumah " .. player.Name
	local badan = part(m, "Badan", Vector3.new(w, h, d), cf * CFrame.new(0, h / 2, 0), warna)
	part(m, "Atap", Vector3.new(w + 2, 2, d + 2), cf * CFrame.new(0, h + 1, 0), warna:Lerp(Color3.new(0, 0, 0), 0.35))
	part(m, "Pintu", Vector3.new(4, 7, 0.4), cf * CFrame.new(0, 3.5, -d / 2 - 0.2), Color3.fromRGB(120, 80, 50), Enum.Material.Wood)
	local lantai = duaLantai and 2 or 1
	for l = 1, lantai do
		for _, x in ipairs({ -5, 5 }) do
			part(m, "Jendela", Vector3.new(3, 3, 0.4), cf * CFrame.new(x, (l - 1) * 11 + 6.5, -d / 2 - 0.2),
				Color3.fromRGB(180, 225, 255), Enum.Material.Glass, 0.2)
		end
	end
	if duaLantai then
		part(m, "Balkon", Vector3.new(w - 2, 0.6, 3), cf * CFrame.new(0, 11, -d / 2 - 1.5), Color3.fromRGB(240, 240, 240))
	end

	-- Papan nama di atas rumah
	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.fromOffset(220, 50)
	bb.StudsOffset = Vector3.new(0, h / 2 + 4, 0)
	bb.MaxDistance = 120
	bb.Adornee = badan
	bb.Parent = badan
	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundTransparency = 1
	t.TextScaled = true
	t.Font = Enum.Font.FredokaOne
	t.TextColor3 = Color3.new(1, 1, 1)
	t.TextStrokeTransparency = 0.3
	t.Text = "Rumah " .. player.DisplayName .. " (" .. (kav:FindFirstChild("Dusun") and kav.Dusun.Value or "") .. ")"
	t.Parent = bb

	-- Tombol upgrade (hanya kalau Game Pass sudah diisi)
	if GAMEPASS_RUMAH_2_LANTAI ~= 0 and not duaLantai then
		local pr = Instance.new("ProximityPrompt")
		pr.Name = "Upgrade"
		pr.ActionText = "Upgrade 2 Lantai"
		pr.ObjectText = "Rumahmu"
		pr.RequiresLineOfSight = false
		pr.MaxActivationDistance = 14
		pr.Parent = badan
		pr.Triggered:Connect(function(siapa)
			if siapa ~= player then return end
			if cekPass(player) then
				local data = milik[player]
				if data then
					data.rumah:Destroy()
					data.rumah = bangunRumah(kav, player, data.warna, true)
				end
			else
				MarketplaceService:PromptGamePassPurchase(player, GAMEPASS_RUMAH_2_LANTAI)
			end
		end)
	end

	m.Parent = ROOT
	return m
end

local function aturKavling(kav, kosong)
	local label = kav:FindFirstChild("Label")
	if label then label.Enabled = kosong end
	local pr = kav:FindFirstChild("Klaim")
	if pr then pr.Enabled = kosong end
	kav:SetAttribute("Pemilik", kosong and "" or "terisi")
end

local function lepas(player)
	local data = milik[player]
	if not data then return end
	if data.rumah then data.rumah:Destroy() end
	aturKavling(data.kav, true)
	milik[player] = nil
end

local function klaim(kav, player)
	if kav:GetAttribute("Pemilik") == "terisi" then return end
	local warna = milik[player] and milik[player].warna or WARNA[math.random(#WARNA)]
	lepas(player) -- pindah rumah: rumah lama dilepas
	aturKavling(kav, false)
	local rumah = bangunRumah(kav, player, warna, cekPass(player))
	milik[player] = { kav = kav, rumah = rumah, warna = warna }
end

for _, kav in ipairs(KAVLING:GetChildren()) do
	local pr = Instance.new("ProximityPrompt")
	pr.Name = "Klaim"
	pr.ActionText = "Klaim Rumah"
	pr.ObjectText = "Kavling Dusun " .. tostring((kav:FindFirstChild("Dusun") and kav.Dusun.Value or ""))
	pr.HoldDuration = 0.5
	pr.RequiresLineOfSight = false
	pr.MaxActivationDistance = 14
	pr.Parent = kav
	pr.Triggered:Connect(function(player)
		klaim(kav, player)
	end)
	aturKavling(kav, true)
end

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, passId, dibeli)
	if dibeli and passId == GAMEPASS_RUMAH_2_LANTAI then
		punyaPass[player] = true
		local data = milik[player]
		if data then
			data.rumah:Destroy()
			data.rumah = bangunRumah(data.kav, player, data.warna, true)
		end
	end
end)

---------------------------------------------------------------------
-- Koin
---------------------------------------------------------------------
local daftarKoin = {}

for _, k in ipairs(KOIN:GetChildren()) do
	table.insert(daftarKoin, { part = k, asal = k.CFrame })
	local aktif = true
	k.Touched:Connect(function(hit)
		if not aktif then return end
		local karakter = hit:FindFirstAncestorOfClass("Model")
		local player = karakter and Players:GetPlayerFromCharacter(karakter)
		if not player then return end
		aktif = false
		local ls = player:FindFirstChild("leaderstats")
		if ls then
			ls.Koin.Value += 1
		end
		k.Transparency = 1
		task.delay(JEDA_KOIN, function()
			k.Transparency = 0
			aktif = true
		end)
	end)
end

RunService.Heartbeat:Connect(function()
	local t = os.clock()
	for _, e in ipairs(daftarKoin) do
		e.part.CFrame = e.asal * CFrame.new(0, math.sin(t * 2) * 0.5, 0) * CFrame.Angles(0, t * 2, 0)
	end
end)

---------------------------------------------------------------------
-- Pemain masuk / keluar
---------------------------------------------------------------------
local function pemainMasuk(player)
	local ls = Instance.new("Folder")
	ls.Name = "leaderstats"
	local koin = Instance.new("IntValue")
	koin.Name = "Koin"
	koin.Parent = ls
	ls.Parent = player
	muat(player, koin)
end

Players.PlayerAdded:Connect(pemainMasuk)
for _, p in ipairs(Players:GetPlayers()) do
	pemainMasuk(p)
end

Players.PlayerRemoving:Connect(function(player)
	simpan(player)
	lepas(player)
	punyaPass[player] = nil
end)

game:BindToClose(function()
	for _, p in ipairs(Players:GetPlayers()) do
		simpan(p)
	end
end)

-- Simpan berkala tiap 2 menit (jaga-jaga kalau server mati mendadak)
task.spawn(function()
	while true do
		task.wait(120)
		for _, p in ipairs(Players:GetPlayers()) do
			simpan(p)
		end
	end
end)

---------------------------------------------------------------------
-- Bus antardusun & perahu danau (rute, warna, ukuran sama dengan pulau di web)
---------------------------------------------------------------------
local SKALA, PUSAT_X, PUSAT_Z = 0.6, 1250, 1300
local function keDunia(x, z)
	return Vector3.new((x - PUSAT_X) * SKALA, 0, (z - PUSAT_Z) * SKALA)
end

local RUTE_BUS = { {1050, 188}, {1150, 188}, {1150, 800}, {1150, 2452}, {1650, 2452}, {1650, 3800}, {1650, 4200}, {801, 4200}, {801, 4010} }
local titikBus, panjangRute = {}, 0
for i, p in ipairs(RUTE_BUS) do
	titikBus[i] = keDunia(p[1], p[2])
	if i > 1 then
		panjangRute += (titikBus[i] - titikBus[i - 1]).Magnitude
	end
end

local KENDARAAN = Instance.new("Folder")
KENDARAAN.Name = "Kendaraan"
KENDARAAN.Parent = ROOT

local daftarBus, daftarPerahu = {}, {}
for i, warnaBus in ipairs({ Color3.fromRGB(242, 177, 52), Color3.fromRGB(79, 143, 214) }) do
	local m = Instance.new("Model")
	m.Name = "Bus Dunia Kotak"
	local badan = part(m, "Badan", Vector3.new(21.6, 7.8, 9), CFrame.new(0, 0, 0), warnaBus)
	part(m, "Kaca", Vector3.new(18, 2.4, 9.4), CFrame.new(0, 1.5, 0), Color3.fromRGB(223, 241, 255), Enum.Material.Glass)
	m.PrimaryPart = badan
	m.Parent = KENDARAAN
	table.insert(daftarBus, { model = m, s = (i - 1) * panjangRute })
end

local acak = Random.new(7)
local WARNA_BAJU = { Color3.fromRGB(232, 137, 44), Color3.fromRGB(79, 143, 214), Color3.fromRGB(217, 92, 92), Color3.fromRGB(95, 179, 107), Color3.fromRGB(242, 201, 76), Color3.fromRGB(155, 111, 209) }
for i = 1, 6 do
	local m = Instance.new("Model")
	m.Name = "Perahu"
	local lambung = part(m, "Lambung", Vector3.new(15.6, 3, 6), CFrame.new(0, 0, 0), Color3.fromRGB(168, 113, 74), Enum.Material.Wood)
	part(m, "Pendayung", Vector3.new(2.4, 4.2, 2.4), CFrame.new(2.4, 3, 0), WARNA_BAJU[i])
	m.PrimaryPart = lambung
	m.Parent = KENDARAAN
	table.insert(daftarPerahu, {
		model = m, a = acak:NextNumber() * 6.28, r = 120 + acak:NextNumber() * 260,
		cx = 1900 + acak:NextNumber() * 500, cz = 1350 + acak:NextNumber() * 400,
		v = (0.04 + acak:NextNumber() * 0.05) * (acak:NextNumber() < 0.5 and -1 or 1),
	})
end

RunService.Heartbeat:Connect(function(dt)
	for _, b in ipairs(daftarBus) do
		b.s = (b.s + dt * 24) % (panjangRute * 2)
		local maju = b.s <= panjangRute
		local s = maju and b.s or (panjangRute * 2 - b.s)
		for i = 2, #titikBus do
			local a, c = titikBus[i - 1], titikBus[i]
			local L = (c - a).Magnitude
			if s <= L then
				local arah = (c - a).Unit
				if not maju then arah = -arah end
				local kanan = Vector3.new(-arah.Z, 0, arah.X)
				local pos = a + (c - a) * (s / L) + kanan * 4.8 + Vector3.new(0, 4.6, 0)
				b.model:PivotTo(CFrame.lookAt(pos, pos + arah) * CFrame.Angles(0, math.pi / 2, 0))
				break
			end
			s -= L
		end
	end
	local t = os.clock()
	for _, p in ipairs(daftarPerahu) do
		p.a += p.v * dt
		local pos = keDunia(p.cx + math.cos(p.a) * p.r, p.cz + math.sin(p.a) * p.r * 0.6) + Vector3.new(0, 1.8 + math.sin(t * 2 + p.r) * 0.3, 0)
		local arah = Vector3.new(-math.sin(p.a), 0, math.cos(p.a) * 0.6).Unit * (p.v > 0 and 1 or -1)
		p.model:PivotTo(CFrame.lookAt(pos, pos + arah) * CFrame.Angles(0, math.pi / 2, 0))
	end
end)
