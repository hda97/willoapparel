--[[
  TokoWillo (Script) - Toko Willo Apparel di Kotak Wetan: pesan kaos sablon untuk tokoh, bayar koin (bukan kaos nyata).
  Aturan sama dengan game web (worker.js: KAOS_WILLO, aksi "kaos").
  Tempat: ServerScriptService.TokoWillo. Butuh ServerStorage.DK_AvatarAtasan (dibuat AvatarKotak) dan DK_Koin (DataWarga).

  Aturan web yang disalin:
    - Harga per sablon: Polos 20, WILLO APPAREL 30, Dunia Kotak 40, Kaos Dusun 50, Kaos Kelas (tulisan bebas) 80 koin.
    - Delapan warna kaos. Sablon butuh 3 menit, lalu kaos diambil dan langsung dipakai.
    - Satu pesanan dalam satu waktu. Lemari menyimpan 12 kaos terakhir; memakai kaos dari lemari gratis.
    - Tulisan: huruf/angka/spasi, maks 10. Di Roblox tulisan juga dilewatkan saringan teks Roblox.
    - Pesan hanya bisa saat berada di tokonya.

  Simpanan: DataStore DuniaKotak_Kaos_v1, kunci p_<UserId> = { pesan = { d, w, t, jadi } atau nil, lemari = { { d, w, t, dipakai } } }.
  Pintu: ReplicatedStorage.DK_Kaos (RemoteFunction: "buka" | "pesan", d, w, t | "ambil" | "pakai", i)
         ReplicatedStorage.DK_KaosBuka (RemoteEvent ke klien saat tombol "Pesan Kaos" ditekan di toko).
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local DataStoreService = game:GetService("DataStoreService")
local TextService = game:GetService("TextService")

local URUT = { "willo", "polos", "dk", "dusun", "tulisan" }
local SABLON = {
	willo = { nama = "WILLO APPAREL", ket = "Logo Willo di dada", harga = 30 },
	polos = { nama = "Polos", ket = "Tanpa sablon, warna saja", harga = 20 },
	dk = { nama = "Dunia Kotak", ket = "Logo desa di dada", harga = 40 },
	dusun = { nama = "Kaos Dusun", ket = "Nama dusunmu, dada & punggung", harga = 50 },
	tulisan = { nama = "Kaos Kelas", ket = "Tulisan bebas besar di punggung", harga = 80 },
}
local WARNA = {
	{ "#1d1d22", "Hitam" }, { "#f4f4f4", "Putih" }, { "#3a7bd5", "Biru" }, { "#d0442f", "Merah" },
	{ "#2a9a5a", "Hijau" }, { "#f2c14e", "Kuning" }, { "#8a5ad8", "Ungu" }, { "#e06a9a", "Pink" },
}
local TUNGGU = 3 * 60
local LEMARI = 12
-- titik tengah lahan Toko Willo di Wetan (stud, belum digeser), dari game web lewat alat/ekspor_web.js
local TOKO = Vector3.new(0, 0, 556.2)
local JARAK = 60

local store
do
	local ok, s = pcall(function() return DataStoreService:GetDataStore("DuniaKotak_Kaos_v1") end)
	if ok then store = s else warn("[TokoWillo] DataStore tidak tersedia: " .. tostring(s)) end
end

local function buatPintu(kelas, nama)
	local l = ReplicatedStorage:FindFirstChild(nama)
	if l then l:Destroy() end
	local x = Instance.new(kelas)
	x.Name = nama
	x.Parent = ReplicatedStorage
	return x
end
local pintu = buatPintu("RemoteFunction", "DK_Kaos")
local bukaEv = buatPintu("RemoteEvent", "DK_KaosBuka")

local function titikToko()
	local akar = workspace:FindFirstChild("DuniaKotak3")
	local f = akar and akar:FindFirstChild("wetan")
	if not f then return nil end
	local geser = f:GetAttribute("geser")
	if typeof(geser) ~= "Vector3" then geser = Vector3.zero end
	return geser + TOKO
end

do
	local lamaF = workspace:FindFirstChild("DK_TokoWillo")
	if lamaF then lamaF:Destroy() end
	local p = titikToko()
	if p then
		local part = Instance.new("Part")
		part.Name = "DK_TokoWillo"
		part.Anchored = true
		part.CanCollide = false
		part.CanQuery = false
		part.CanTouch = false
		part.Transparency = 1
		part.Size = Vector3.new(2, 2, 2)
		part.CFrame = CFrame.new(p + Vector3.new(0, 5, 0))
		local pr = Instance.new("ProximityPrompt")
		pr.ActionText = "Pesan Kaos"
		pr.ObjectText = "Toko Willo Apparel"
		pr.MaxActivationDistance = 50
		pr.RequiresLineOfSight = false
		pr.HoldDuration = 0
		pr.Parent = part
		pr.Triggered:Connect(function(player) bukaEv:FireClient(player) end)
		part.Parent = workspace
	else
		warn("[TokoWillo] Dusun Wetan belum ada di map; tombol toko tidak dibuat")
	end
end

local sesi = {} -- [player] = { data, termuat, antre }

local function adaWarna(w)
	for _, x in ipairs(WARNA) do
		if x[1] == w then return true end
	end
	return false
end

local function rapikanKaos(k)
	if typeof(k) ~= "table" or not SABLON[k.d] or not adaWarna(k.w) then return nil end
	local t = string.upper(tostring(k.t or "")):gsub("[^A-Z0-9 ]", "")
	return { d = k.d, w = k.w, t = string.sub(t, 1, 10), dipakai = k.dipakai == 1 and 1 or 0 }
end

local function muat(player)
	local s = { data = { lemari = {} }, termuat = false }
	sesi[player] = s
	if not store then return end
	local ok, d = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
	if not ok or sesi[player] ~= s then return end
	if typeof(d) == "table" then
		if typeof(d.lemari) == "table" then
			for _, k in ipairs(d.lemari) do
				local r = rapikanKaos(k)
				if r and #s.data.lemari < LEMARI then table.insert(s.data.lemari, r) end
			end
		end
		local p = rapikanKaos(d.pesan)
		if p and typeof(d.pesan.jadi) == "number" then
			p.dipakai = nil
			p.jadi = d.pesan.jadi
			s.data.pesan = p
		end
	end
	s.termuat = true
end

local function simpan(player)
	local s = sesi[player]
	if not store or not s or not s.termuat then return end
	pcall(function() store:SetAsync("p_" .. player.UserId, s.data) end)
end

local function simpanNanti(player)
	local s = sesi[player]
	if not s or s.antre then return end
	s.antre = true
	task.delay(8, function()
		if sesi[player] ~= s then return end
		s.antre = false
		simpan(player)
	end)
end

local function koinPemain(player)
	local ls = player:FindFirstChild("leaderstats")
	local k = ls and ls:FindFirstChild("Koin")
	return k and k.Value or 0
end

local function diToko(player)
	local hrp = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	local p = titikToko()
	if not hrp or not p then return false end
	return (Vector3.new(p.X, 0, p.Z) - Vector3.new(hrp.Position.X, 0, hrp.Position.Z)).Magnitude < JARAK and math.abs(hrp.Position.Y - p.Y) < 30
end

-- dusun untuk Kaos Dusun: dusun rumah warga tertaut, kalau belum tertaut dusun tempat pemain berada
local function dusunPemain(player)
	local d = player:GetAttribute("DK_DusunRumah") or player:GetAttribute("DK_Dusun")
	if typeof(d) ~= "string" or d == "" then d = "wetan" end
	return string.upper(d)
end

-- tulisan bebas: aturan web (huruf/angka/spasi, maks 10) lalu saringan teks Roblox
local function tulisanBersih(player, t)
	local s = string.upper(tostring(t or "")):gsub("[^A-Z0-9 ]", "")
	s = string.sub(s:gsub("%s+", " "):gsub("^ ", ""):gsub(" $", ""), 1, 10)
	if s == "" then return nil end
	local ok, hasil = pcall(function()
		return TextService:FilterStringAsync(s, player.UserId):GetNonChatStringForBroadcastAsync()
	end)
	if not ok or typeof(hasil) ~= "string" or hasil ~= s then return nil end
	return s
end

local function pakaikan(player, s, k)
	local bf = ServerStorage:FindFirstChild("DK_AvatarAtasan")
	local ok, hasil = pcall(function() return bf and bf:Invoke(player, { warna = k.w, sablon = k.d, teks = k.t }) end)
	if not ok or hasil ~= true then return false end
	for _, x in ipairs(s.data.lemari) do x.dipakai = x == k and 1 or 0 end
	return true
end

local function keadaan(player)
	local s = sesi[player]
	if not s then return nil end
	local sablon, warna = {}, {}
	for _, id in ipairs(URUT) do
		local x = SABLON[id]
		table.insert(sablon, { id = id, nama = x.nama, ket = x.ket, harga = x.harga })
	end
	for i, w in ipairs(WARNA) do warna[i] = { hex = w[1], nama = w[2] } end
	local p = s.data.pesan
	return {
		koin = koinPemain(player), sablon = sablon, warna = warna, tunggu = TUNGGU, lemari = s.data.lemari,
		pesan = p and { d = p.d, w = p.w, t = p.t, sisa = math.max(0, p.jadi - os.time()) } or nil,
		diToko = diToko(player), dusun = dusunPemain(player),
	}
end

local function aksi(player, op, a, b, c)
	local s = sesi[player]
	if not s or (store and not s.termuat) then return { galat = "Data belum siap, coba lagi." } end
	local pesanBalik
	if op == "pesan" then
		if s.data.pesan then return { galat = "Ambil dulu kaos yang sedang disablon." } end
		if typeof(a) ~= "string" or not SABLON[a] or typeof(b) ~= "string" or not adaWarna(b) then return { galat = "Pilihan kaos tidak ada." } end
		if not diToko(player) then return { galat = "Kamu harus berada di Toko Willo Apparel, Dusun Kotak Wetan." } end
		local t = ""
		if a == "tulisan" then
			t = tulisanBersih(player, c)
			if not t then return { galat = "Tulisan tidak boleh kosong atau kata kasar (huruf/angka, maks 10)." } end
		elseif a == "dusun" then
			t = dusunPemain(player)
		end
		local harga = SABLON[a].harga
		if koinPemain(player) < harga then return { galat = "Koinmu kurang (" .. harga .. " koin)." } end
		local dk = ServerStorage:FindFirstChild("DK_Koin")
		local ok, hasil = pcall(function() return dk and dk:Invoke(player, -harga) end)
		if not ok or hasil ~= true then return { galat = "Koin belum bisa dipotong, coba lagi." } end
		s.data.pesan = { d = a, w = b, t = t, jadi = os.time() + TUNGGU }
		simpanNanti(player)
		pesanBalik = "🖨️ Kaosmu sedang disablon. Kembali 3 menit lagi!"
	elseif op == "ambil" then
		local p = s.data.pesan
		if not p or p.jadi > os.time() then return { galat = "Kaosmu belum selesai disablon." } end
		local k = { d = p.d, w = p.w, t = p.t, dipakai = 0 }
		table.insert(s.data.lemari, 1, k)
		while #s.data.lemari > LEMARI do table.remove(s.data.lemari) end
		s.data.pesan = nil
		pakaikan(player, s, k)
		simpanNanti(player)
		pesanBalik = "👕 Kaos barumu langsung dipakai!"
	elseif op == "pakai" then
		local k = s.data.lemari[tonumber(a) or 0]
		if not k then return { galat = "Kaos tidak ada di lemari." } end
		if not pakaikan(player, s, k) then return { galat = "Kaos belum bisa dipakai, coba lagi." } end
		simpanNanti(player)
	end
	local r = keadaan(player)
	r.pesanBalik = pesanBalik
	return r
end

pintu.OnServerInvoke = function(player, op, a, b, c)
	if typeof(op) ~= "string" then return { galat = "Pilihan tidak ada." } end
	local ok, r = pcall(aksi, player, op, a, b, c)
	if ok then return r end
	warn("[TokoWillo] " .. tostring(r))
	return { galat = "Ada gangguan, coba lagi." }
end

Players.PlayerAdded:Connect(muat)
for _, p in ipairs(Players:GetPlayers()) do
	task.spawn(muat, p)
end
Players.PlayerRemoving:Connect(function(player)
	simpan(player)
	sesi[player] = nil
end)
game:BindToClose(function()
	for _, p in ipairs(Players:GetPlayers()) do
		simpan(p)
	end
end)
