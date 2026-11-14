--[[
  DealerKendaraan (Script) - Dealer Kendaraan di Kotak Curug: beli kendaraan pakai koin, lalu dikendarai keliling desa.
  Aturan sama dengan game web (worker.js: KENDARAAN, aksi "dealer"; game.js: KEND, WARNA_KENDARAAN).
  Tempat: ServerScriptService.DealerKendaraan.

  Aturan web yang disalin:
    - Harga: Sepeda Gunung 150, Motor Sport 400, Sedan Warga 800, Hatch Reli 900, Jip Garuk 1000, Kotak GT 1200 koin.
    - Satu warga hanya bisa punya satu dari tiap jenis. Cat ulang 50 koin. Enam warna.
    - Beli dan cat ulang hanya di lahan dealer (Curug). Naik dan turun bisa di mana saja.
    - Kecepatan = kali kecepatan jalan kaki (1,9 sampai 3,5). Saat naik kendaraan tidak bisa lompat.
  Seperti di web, kendaraan menempel pada tokoh (bukan fisika mobil), jadi kemudinya sama dengan jalan kaki.
  Belum ada di sini: kendaraan terparkir di pekarangan rumah dan membonceng warga lain.

  Simpanan: DataStore DuniaKotak_Garasi_v1, kunci p_<UserId> = { g = { { m = jenis, w = warna 0..5 } }, p = urutan dipakai (1..n) atau 0 }.
  Pintu: ReplicatedStorage.DK_Dealer (RemoteFunction: "buka" | "beli", m, w | "pakai", i | "cat", i, w | "naik" | "turun")
         ReplicatedStorage.DK_DealerBuka (RemoteEvent ke klien saat tombol "Lihat kendaraan" ditekan di dealer).
  Atribut pemain "DK_Naik" = jenis kendaraan yang sedang dinaiki ("" kalau jalan kaki).
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local DataStoreService = game:GetService("DataStoreService")

local URUT = { "sepeda", "motor", "sedan", "hatch", "jip", "gt" }
local KEND = {
	sepeda = { nama = "Sepeda Gunung", ikon = "🚲", harga = 150, kec = 1.9, ket = "Ringan & lincah, gowes keliling dusun" },
	motor = { nama = "Motor Sport", ikon = "🏍️", harga = 400, kec = 2.7, ket = "Ngebut di jalan desa" },
	sedan = { nama = "Sedan Warga", ikon = "🚘", harga = 800, kec = 3.1, ket = "Mobil keluarga, nyaman & elegan" },
	hatch = { nama = "Hatch Reli", ikon = "🚗", harga = 900, kec = 3.2, ket = "Mobil reli juara Sirkuit Curug" },
	jip = { nama = "Jip Garuk", ikon = "🚙", harga = 1000, kec = 3.0, ket = "Ban besar, gagah di jalan tanah" },
	gt = { nama = "Kotak GT", ikon = "🏎️", harga = 1200, kec = 3.5, ket = "Mobil sport tercepat di desa" },
}
local WARNA = {
	{ "Merah", Color3.fromRGB(184, 37, 44) }, { "Biru", Color3.fromRGB(47, 111, 216) }, { "Kuning", Color3.fromRGB(242, 182, 42) },
	{ "Hijau", Color3.fromRGB(47, 154, 84) }, { "Putih", Color3.fromRGB(238, 238, 232) }, { "Hitam", Color3.fromRGB(42, 43, 51) },
}
local HARGA_CAT = 50
local JALAN = 16 -- kecepatan jalan kaki bawaan
local LOMPAT = 50
-- titik tengah lahan dealer di Curug (stud, belum digeser), dari game web lewat alat/ekspor_web.js
local DEALER = Vector3.new(-600, 0, 177.2)
local GESER_CURUG = Vector3.new(0, 0, -10000)
local JARAK_X, JARAK_Z = 66, 57 -- web: 10,5 x VS dan 9 x VS satuan

local BAN = Color3.fromRGB(26, 26, 30)
local KACA = Color3.fromRGB(150, 200, 230)
local ABU = Color3.fromRGB(120, 124, 132)
local LAMPU = Color3.fromRGB(255, 240, 180)
local MERAH = Color3.fromRGB(200, 40, 40)

-- bentuk kendaraan: { ukuran, letak (y dari tanah, -Z = depan), warna ("w" = warna pilihan) }
local function mobil(p, l, t, angkat, ban)
	-- p = panjang, l = lebar, t = tinggi badan, angkat = jarak badan dari tanah, ban = ukuran ban
	local b = {
		{ Vector3.new(l, t, p), Vector3.new(0, angkat + t / 2, 0), "w" },
		{ Vector3.new(l - 0.6, 1.5, 0.3), Vector3.new(0, angkat + t + 0.75, -p * 0.2), KACA },
		{ Vector3.new(l - 0.6, 1.1, 0.3), Vector3.new(0, angkat + t + 0.55, p * 0.26), KACA },
		{ Vector3.new(l - 0.4, 0.5, 0.3), Vector3.new(0, angkat + t * 0.4, -p / 2 - 0.1), ABU },
		{ Vector3.new(1, 0.5, 0.2), Vector3.new(l / 2 - 0.8, angkat + t * 0.7, -p / 2 - 0.1), LAMPU },
		{ Vector3.new(1, 0.5, 0.2), Vector3.new(-l / 2 + 0.8, angkat + t * 0.7, -p / 2 - 0.1), LAMPU },
		{ Vector3.new(1, 0.5, 0.2), Vector3.new(l / 2 - 0.8, angkat + t * 0.7, p / 2 + 0.1), MERAH },
		{ Vector3.new(1, 0.5, 0.2), Vector3.new(-l / 2 + 0.8, angkat + t * 0.7, p / 2 + 0.1), MERAH },
	}
	for _, sx in ipairs({ -1, 1 }) do
		for _, sz in ipairs({ -1, 1 }) do
			table.insert(b, { Vector3.new(1, ban, ban), Vector3.new(sx * (l / 2 - 0.2), ban / 2, sz * p * 0.32), BAN })
		end
	end
	return b
end

local BENTUK = {}
BENTUK.sedan = mobil(11, 6, 2, 0.7, 2)
BENTUK.hatch = mobil(9.5, 6, 2.2, 0.7, 2)
table.insert(BENTUK.hatch, { Vector3.new(5.6, 0.3, 1.2), Vector3.new(0, 4.3, 4.6), "w" }) -- sayap belakang
BENTUK.jip = mobil(10, 6.4, 2.4, 1.3, 2.8)
table.insert(BENTUK.jip, { Vector3.new(6.2, 0.4, 0.4), Vector3.new(0, 5.6, 1.2), ABU }) -- palang atas
table.insert(BENTUK.jip, { Vector3.new(0.4, 2, 0.4), Vector3.new(2.9, 4.6, 1.2), ABU })
table.insert(BENTUK.jip, { Vector3.new(0.4, 2, 0.4), Vector3.new(-2.9, 4.6, 1.2), ABU })
BENTUK.gt = mobil(11.5, 6.2, 1.5, 0.5, 1.9)
table.insert(BENTUK.gt, { Vector3.new(6, 0.3, 1.4), Vector3.new(0, 3.2, 5.4), "w" })
table.insert(BENTUK.gt, { Vector3.new(0.4, 1.2, 0.4), Vector3.new(2.4, 2.5, 5.4), BAN })
table.insert(BENTUK.gt, { Vector3.new(0.4, 1.2, 0.4), Vector3.new(-2.4, 2.5, 5.4), BAN })
BENTUK.motor = {
	{ Vector3.new(1.3, 1.5, 4.6), Vector3.new(0, 2, 0), "w" },
	{ Vector3.new(1.1, 0.5, 2), Vector3.new(0, 3, 1), BAN }, -- jok
	{ Vector3.new(0.8, 2.4, 2.4), Vector3.new(0, 1.2, -2.7), BAN },
	{ Vector3.new(0.8, 2.4, 2.4), Vector3.new(0, 1.2, 2.7), BAN },
	{ Vector3.new(3, 0.3, 0.3), Vector3.new(0, 3.6, -1.9), ABU }, -- setang
	{ Vector3.new(0.4, 1.6, 0.4), Vector3.new(0, 2.9, -2.2), ABU },
	{ Vector3.new(0.7, 0.5, 0.2), Vector3.new(0, 3.1, -2.6), LAMPU },
	{ Vector3.new(0.3, 0.3, 2), Vector3.new(0.8, 1.2, 1.8), ABU }, -- knalpot
}
BENTUK.sepeda = {
	{ Vector3.new(0.4, 0.4, 3.6), Vector3.new(0, 2.2, 0), "w" },
	{ Vector3.new(0.4, 1.4, 0.4), Vector3.new(0, 1.6, 0.4), "w" },
	{ Vector3.new(0.3, 2.4, 2.4), Vector3.new(0, 1.2, -2.2), BAN },
	{ Vector3.new(0.3, 2.4, 2.4), Vector3.new(0, 1.2, 2.2), BAN },
	{ Vector3.new(2.6, 0.25, 0.25), Vector3.new(0, 3.4, -1.7), ABU }, -- setang
	{ Vector3.new(0.3, 1.4, 0.3), Vector3.new(0, 2.8, -1.8), ABU },
	{ Vector3.new(0.8, 0.3, 1.2), Vector3.new(0, 3, 1), BAN }, -- sadel
}

local store
do
	local ok, s = pcall(function() return DataStoreService:GetDataStore("DuniaKotak_Garasi_v1") end)
	if ok then store = s else warn("[DealerKendaraan] DataStore tidak tersedia: " .. tostring(s)) end
end

local function buatPintu(kelas, nama)
	local l = ReplicatedStorage:FindFirstChild(nama)
	if l then l:Destroy() end
	local x = Instance.new(kelas)
	x.Name = nama
	x.Parent = ReplicatedStorage
	return x
end
local pintu = buatPintu("RemoteFunction", "DK_Dealer")
local bukaEv = buatPintu("RemoteEvent", "DK_DealerBuka")

local lamaF = workspace:FindFirstChild("DK_Kendaraan")
if lamaF then lamaF:Destroy() end
local folder = Instance.new("Folder")
folder.Name = "DK_Kendaraan"
folder.Parent = workspace

local function titikDealer()
	local akar = workspace:FindFirstChild("DuniaKotak3")
	local f = akar and akar:FindFirstChild("curug")
	if not f then return nil end
	local geser = f:GetAttribute("geser")
	if typeof(geser) ~= "Vector3" then geser = GESER_CURUG end
	return geser + DEALER
end

-- tombol di dealer
do
	local p = titikDealer()
	if p then
		local part = Instance.new("Part")
		part.Name = "dealer"
		part.Anchored = true
		part.CanCollide = false
		part.CanQuery = false
		part.CanTouch = false
		part.Transparency = 1
		part.Size = Vector3.new(2, 2, 2)
		part.CFrame = CFrame.new(p + Vector3.new(0, 5, 0))
		local pr = Instance.new("ProximityPrompt")
		pr.ActionText = "Lihat kendaraan"
		pr.ObjectText = "Dealer Kendaraan"
		pr.MaxActivationDistance = 55
		pr.RequiresLineOfSight = false
		pr.HoldDuration = 0
		pr.Parent = part
		pr.Triggered:Connect(function(player) bukaEv:FireClient(player) end)
		part.Parent = folder
	else
		warn("[DealerKendaraan] Dusun Curug belum ada di map; tombol dealer tidak dibuat")
	end
end

local sesi = {} -- [player] = { data = { g, p }, termuat, model }

local function rapikan(d)
	local g = {}
	if typeof(d) == "table" and typeof(d.g) == "table" then
		for _, k in ipairs(d.g) do
			if typeof(k) == "table" and KEND[k.m] then
				local w = math.floor(tonumber(k.w) or 0)
				table.insert(g, { m = k.m, w = (w >= 0 and w < #WARNA) and w or 0 })
			end
		end
	end
	local p = typeof(d) == "table" and math.floor(tonumber(d.p) or 0) or 0
	if not g[p] then p = 0 end
	return { g = g, p = p }
end

local function muat(player)
	local s = { data = { g = {}, p = 0 }, termuat = false }
	sesi[player] = s
	player:SetAttribute("DK_Naik", "")
	if not store then return end
	local ok, d = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
	if not ok or sesi[player] ~= s then return end
	s.data = rapikan(d)
	s.termuat = true
end

local function simpan(player)
	local s = sesi[player]
	if not store or not s or not s.termuat then return end
	pcall(function() store:SetAsync("p_" .. player.UserId, s.data) end)
end

local function koinPemain(player)
	local ls = player:FindFirstChild("leaderstats")
	local k = ls and ls:FindFirstChild("Koin")
	return k and k.Value or 0
end

local function potong(player, jumlah)
	local dk = ServerStorage:FindFirstChild("DK_Koin")
	local ok, hasil = pcall(function() return dk and dk:Invoke(player, -jumlah) end)
	return ok and hasil == true
end

local function diDealer(player)
	local hrp = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	local p = titikDealer()
	if not hrp or not p then return false end
	return math.abs(hrp.Position.X - p.X) < JARAK_X and math.abs(hrp.Position.Z - p.Z) < JARAK_Z and math.abs(hrp.Position.Y - p.Y) < 30
end

local function turun(player)
	local s = sesi[player]
	if s and s.model then
		s.model:Destroy()
		s.model = nil
	end
	player:SetAttribute("DK_Naik", "")
	local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
	if hum then
		local l = s and s.lama
		hum.WalkSpeed = l and l[1] or JALAN
		hum.UseJumpPower = not l or l[2]
		hum.JumpPower = l and l[3] or LOMPAT
		if l then hum.JumpHeight = l[4] end
	end
	if s then s.lama = nil end
end

local function naik(player)
	local s = sesi[player]
	local k = s and s.data.g[s.data.p]
	if not k then return "Belum punya kendaraan. Beli dulu di Dealer Kendaraan, Dusun Curug." end
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not hrp or not hum or hum.Health <= 0 then return "Tokohmu belum siap." end
	turun(player)
	local model = Instance.new("Model")
	model.Name = "kend_" .. player.UserId
	local tanah = -(hum.HipHeight + hrp.Size.Y / 2) -- jarak tanah dari tengah HumanoidRootPart
	if hum.RigType == Enum.HumanoidRigType.R6 then tanah = -3 end
	for _, b in ipairs(BENTUK[k.m]) do
		local part = Instance.new("Part")
		part.Size = b[1]
		part.Color = b[3] == "w" and WARNA[k.w + 1][2] or b[3]
		part.Material = (b[3] == KACA) and Enum.Material.Glass or (b[3] == LAMPU and Enum.Material.Neon or Enum.Material.SmoothPlastic)
		part.Transparency = b[3] == KACA and 0.35 or 0
		part.TopSurface = Enum.SurfaceType.Smooth
		part.BottomSurface = Enum.SurfaceType.Smooth
		part.CanCollide = false
		part.CanQuery = false
		part.CanTouch = false
		part.Massless = true
		part.CFrame = hrp.CFrame * CFrame.new(b[2] + Vector3.new(0, tanah, 0))
		local w = Instance.new("WeldConstraint")
		w.Part0 = hrp
		w.Part1 = part
		w.Parent = part
		part.Parent = model
	end
	model.Parent = folder
	s.model = model
	s.lama = { hum.WalkSpeed, hum.UseJumpPower, hum.JumpPower, hum.JumpHeight }
	hum.WalkSpeed = JALAN * KEND[k.m].kec
	hum.JumpPower = 0
	hum.JumpHeight = 0
	player:SetAttribute("DK_Naik", k.m)
	return nil
end

local function keadaan(player)
	local s = sesi[player]
	if not s then return nil end
	local daftar = {}
	for _, id in ipairs(URUT) do
		local k = KEND[id]
		table.insert(daftar, { id = id, nama = k.nama, ikon = k.ikon, harga = k.harga, kec = k.kec, ket = k.ket })
	end
	local warna = {}
	for i, w in ipairs(WARNA) do warna[i] = { nama = w[1], r = math.round(w[2].R * 255), g = math.round(w[2].G * 255), b = math.round(w[2].B * 255) } end
	return {
		koin = koinPemain(player), daftar = daftar, warna = warna, garasi = s.data.g, pakai = s.data.p,
		hargaCat = HARGA_CAT, diDealer = diDealer(player), naik = player:GetAttribute("DK_Naik") or "",
	}
end

local function aksi(player, op, a, b)
	local s = sesi[player]
	if not s then return { galat = "Data belum siap, coba lagi." } end
	local pesan
	if op == "beli" then
		local m, w = a, tonumber(b)
		if typeof(m) ~= "string" or not KEND[m] or not w or w ~= math.floor(w) or w < 0 or w >= #WARNA then return { galat = "Kendaraan tidak ada." } end
		if not s.termuat and store then return { galat = "Data belum siap, coba lagi." } end
		if not diDealer(player) then return { galat = "Kamu harus berada di Dealer Kendaraan, Dusun Curug." } end
		for _, k in ipairs(s.data.g) do
			if k.m == m then return { galat = "Kamu sudah punya kendaraan ini." } end
		end
		local harga = KEND[m].harga
		if koinPemain(player) < harga then return { galat = "Koinmu kurang (" .. harga .. " koin)." } end
		if not potong(player, harga) then return { galat = "Koin belum bisa dipotong, coba lagi." } end
		table.insert(s.data.g, { m = m, w = w })
		s.data.p = #s.data.g
		if player:GetAttribute("DK_Naik") ~= "" then turun(player) end
		task.spawn(simpan, player)
		pesan = "🎉 " .. KEND[m].nama .. " jadi milikmu!"
	elseif op == "pakai" then
		local i = tonumber(a)
		if not i or (i ~= 0 and not s.data.g[i]) then return { galat = "Kendaraan tidak ada di garasi." } end
		s.data.p = i
		if player:GetAttribute("DK_Naik") ~= "" then turun(player) end
	elseif op == "cat" then
		local k, w = s.data.g[tonumber(a) or 0], tonumber(b)
		if not k or not w or w ~= math.floor(w) or w < 0 or w >= #WARNA then return { galat = "Pilihan tidak ada." } end
		if not diDealer(player) then return { galat = "Cat ulang hanya di Dealer Kendaraan, Dusun Curug." } end
		if koinPemain(player) < HARGA_CAT then return { galat = "Koinmu kurang (" .. HARGA_CAT .. " koin)." } end
		if not potong(player, HARGA_CAT) then return { galat = "Koin belum bisa dipotong, coba lagi." } end
		k.w = w
		if player:GetAttribute("DK_Naik") ~= "" then turun(player) end
		task.spawn(simpan, player)
		pesan = "🎨 Kendaraanmu dicat ulang!"
	elseif op == "naik" then
		local galat = naik(player)
		if galat then return { galat = galat } end
	elseif op == "turun" then
		turun(player)
	end
	local r = keadaan(player)
	r.pesan = pesan
	return r
end

pintu.OnServerInvoke = function(player, op, a, b)
	if typeof(op) ~= "string" then return { galat = "Pilihan tidak ada." } end
	local ok, r = pcall(aksi, player, op, a, b)
	if ok then return r end
	warn("[DealerKendaraan] " .. tostring(r))
	return { galat = "Ada gangguan, coba lagi." }
end

local function pasang(player)
	player.CharacterRemoving:Connect(function()
		local s = sesi[player]
		if s and s.model then
			s.model:Destroy()
			s.model = nil
		end
		if s then s.lama = nil end
		player:SetAttribute("DK_Naik", "")
	end)
	muat(player)
end

Players.PlayerAdded:Connect(pasang)
for _, p in ipairs(Players:GetPlayers()) do
	task.spawn(pasang, p)
end
Players.PlayerRemoving:Connect(function(player)
	local s = sesi[player]
	if s and s.model then s.model:Destroy() end
	simpan(player)
	sesi[player] = nil
end)
game:BindToClose(function()
	for _, p in ipairs(Players:GetPlayers()) do
		simpan(p)
	end
end)
