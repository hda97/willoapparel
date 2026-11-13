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

local ROOT = workspace:WaitForChild("DuniaKotak")
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
	local hadap = kav:GetAttribute("Hadap") or Vector3.new(0, 0, -1)
	local dasar = Vector3.new(kav.Position.X, 0.65, kav.Position.Z)
	local cf = CFrame.lookAt(dasar, dasar + hadap)
	local w, d = 16, 16
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
	t.Text = "Rumah " .. player.DisplayName .. " (" .. kav:GetAttribute("Dusun") .. ")"
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
	pr.ObjectText = "Kavling Dusun " .. tostring(kav:GetAttribute("Dusun"))
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
