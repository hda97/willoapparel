--[[
  DUNIA KOTAK (Roblox) - DATA WARGA v1
  Tempat: ServerScriptService.DataWarga (Script biasa).

  Yang diurus skrip ini:
  - Papan skor "Koin" dan "Permata" (leaderstats), mulai dari 0 seperti game web.
  - Simpan otomatis: saat keluar, tiap 2 menit, dan saat server tutup.
    Koin memakai DataStore "DuniaKotak_v1" kunci "p_<UserId>" berisi angka
    (sama dengan skrip lama dan Sawah Juragan, jadi koinnya satu dompet).
    Data lain (permata, hadir beruntun, total koin) di "DuniaKotak_Warga_v1".
  - Hadiah hadir beruntun, sama dengan game web: 10, 15, 20, 25, 30, 40, 60 koin,
    sekali per hari WIB, hari ke-7 beruntun +10 permata, putus = mulai hari 1.
  - Pintu untuk skrip lain: ServerStorage.DK_Koin (BindableFunction).
      DK_Koin:Invoke(player, jumlah)  -> true kalau berhasil.
      jumlah boleh negatif (bayar); gagal kalau koin kurang.
    ServerStorage.DK_Permata bekerja sama untuk permata.

  Kalau data pemain gagal dimuat, skrip TIDAK menyimpan apa pun untuk pemain itu
  supaya tabungan lamanya tidak tertimpa.
]]

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ServerStorage = game:GetService("ServerStorage")

local HADIAH_HADIR = { 10, 15, 20, 25, 30, 40, 60 }
local HADIR7_PERMATA = 10
local JEDA_SIMPAN = 120

local storeKoin, storeWarga
pcall(function()
	storeKoin = DataStoreService:GetDataStore("DuniaKotak_v1")
	storeWarga = DataStoreService:GetDataStore("DuniaKotak_Warga_v1")
end)

local sesi = {} -- [player] = { koin, permata, data, termuat, awalKoin }

local function hariWIB(geser)
	return os.date("!%Y-%m-%d", os.time() + 7 * 3600 + (geser or 0) * 86400)
end

local function kabari(player, teks)
	local pg = player:FindFirstChildOfClass("PlayerGui")
	if not pg then return end
	local gui = Instance.new("ScreenGui")
	gui.Name = "DK_Kabar"
	gui.ResetOnSpawn = false
	local t = Instance.new("TextLabel")
	t.AnchorPoint = Vector2.new(0.5, 0)
	t.Position = UDim2.new(0.5, 0, 0.12, 0)
	t.Size = UDim2.new(0.8, 0, 0, 44)
	t.BackgroundColor3 = Color3.fromRGB(44, 49, 80)
	t.BackgroundTransparency = 0.1
	t.TextColor3 = Color3.new(1, 1, 1)
	t.Font = Enum.Font.GothamBold
	t.TextScaled = true
	t.Text = teks
	local batas = Instance.new("UISizeConstraint")
	batas.MaxSize = Vector2.new(520, 44)
	batas.Parent = t
	local sudut = Instance.new("UICorner")
	sudut.CornerRadius = UDim.new(0, 10)
	sudut.Parent = t
	local isi = Instance.new("UIPadding")
	isi.PaddingLeft = UDim.new(0, 12)
	isi.PaddingRight = UDim.new(0, 12)
	isi.PaddingTop = UDim.new(0, 8)
	isi.PaddingBottom = UDim.new(0, 8)
	isi.Parent = t
	t.Parent = gui
	gui.Parent = pg
	task.delay(6, function() gui:Destroy() end)
end

local function ambil(store, kunci)
	if not store then return false, nil end
	for coba = 1, 3 do
		local ok, hasil = pcall(function() return store:GetAsync(kunci) end)
		if ok then return true, hasil end
		task.wait(1.5 * coba)
	end
	return false, nil
end

local function tambahKoin(player, jumlah)
	local s = sesi[player]
	if not s or typeof(jumlah) ~= "number" or jumlah ~= jumlah then return false end
	jumlah = math.floor(jumlah)
	if s.koin.Value + jumlah < 0 then return false end
	s.koin.Value += jumlah
	if jumlah > 0 and s.data then
		s.data.koinTotal = (s.data.koinTotal or 0) + jumlah
	end
	return true
end

local function hadir(player)
	local s = sesi[player]
	if not s or not s.termuat then return end
	local d = s.data
	local hari = hariWIB(0)
	local hd = d.hadir or { t = "", n = 0 }
	if hd.t == hari then return end
	local n = (hd.t == hariWIB(-1)) and ((hd.n or 0) + 1) or 1
	d.hadir = { t = hari, n = n }
	local dapat = HADIAH_HADIR[(n - 1) % #HADIAH_HADIR + 1]
	tambahKoin(player, dapat)
	local teks = "Hadir hari ke-" .. n .. ": +" .. dapat .. " koin"
	if n % #HADIAH_HADIR == 0 then
		s.permata.Value += HADIR7_PERMATA
		teks = teks .. " dan +" .. HADIR7_PERMATA .. " permata"
	end
	task.delay(4, function()
		if player.Parent then kabari(player, teks) end
	end)
end

local function simpan(player)
	local s = sesi[player]
	if not s or not s.termuat then return end
	local koin, permata = s.koin.Value, s.permata.Value
	if storeKoin then
		pcall(function() storeKoin:SetAsync("p_" .. player.UserId, koin) end)
	end
	if storeWarga then
		s.data.permata = permata
		pcall(function() storeWarga:SetAsync("p_" .. player.UserId, s.data) end)
	end
end

local function masuk(player)
	if sesi[player] then return end
	local ls = player:FindFirstChild("leaderstats")
	if not ls then
		ls = Instance.new("Folder")
		ls.Name = "leaderstats"
		ls.Parent = player
	end
	local koin = ls:FindFirstChild("Koin")
	local sudahAda = koin ~= nil
	if not koin then
		koin = Instance.new("IntValue")
		koin.Name = "Koin"
		koin.Parent = ls
	end
	local permata = Instance.new("IntValue")
	permata.Name = "Permata"
	permata.Parent = ls
	local s = { koin = koin, permata = permata, data = {}, termuat = false }
	sesi[player] = s

	local okK, nilai = ambil(storeKoin, "p_" .. player.UserId)
	local okW, data = ambil(storeWarga, "p_" .. player.UserId)
	if not player.Parent or sesi[player] ~= s then return end
	if okK and okW then
		-- ditambahkan (bukan ditimpa) supaya koin yang didapat selama memuat tidak hilang;
		-- kalau skrip lain sudah lebih dulu mengisi Koin dari simpanan yang sama, jangan dobel
		if typeof(nilai) == "number" and not sudahAda then
			koin.Value += nilai
		end
		if typeof(data) == "table" then
			s.data = data
			permata.Value += tonumber(data.permata) or 0
		end
		s.termuat = true
		hadir(player)
	else
		warn("[DataWarga] data " .. player.Name .. " gagal dimuat; tidak akan disimpan")
		kabari(player, "Data belum bisa dimuat. Koin sesi ini tidak tersimpan, coba masuk lagi.")
	end
end

local pintu = Instance.new("BindableFunction")
pintu.Name = "DK_Koin"
pintu.OnInvoke = tambahKoin
pintu.Parent = ServerStorage

local pintuPermata = Instance.new("BindableFunction")
pintuPermata.Name = "DK_Permata"
pintuPermata.OnInvoke = function(player, jumlah)
	local s = sesi[player]
	if not s or typeof(jumlah) ~= "number" or jumlah ~= jumlah then return false end
	jumlah = math.floor(jumlah)
	if s.permata.Value + jumlah < 0 then return false end
	s.permata.Value += jumlah
	return true
end
pintuPermata.Parent = ServerStorage

Players.PlayerAdded:Connect(masuk)
for _, p in ipairs(Players:GetPlayers()) do
	task.spawn(masuk, p)
end

Players.PlayerRemoving:Connect(function(player)
	simpan(player)
	sesi[player] = nil
end)

task.spawn(function()
	while true do
		task.wait(JEDA_SIMPAN)
		for _, p in ipairs(Players:GetPlayers()) do
			task.spawn(simpan, p)
		end
	end
end)

game:BindToClose(function()
	local sisa = 0
	for _, p in ipairs(Players:GetPlayers()) do
		sisa += 1
		task.spawn(function()
			simpan(p)
			sisa -= 1
		end)
	end
	local batas = os.clock() + 20
	while sisa > 0 and os.clock() < batas do
		task.wait(0.1)
	end
end)
