--[[
  BelanjaToko (Script) - belanja pakai koin di Warung Desa (tiap dusun) dan Supermarket (Wetan), aturan sama dengan
  game web (worker.js: TOKO_BELANJA, aksi "belanja").
  Tempat: ServerScriptService.BelanjaToko.

  Aturan web yang disalin:
    - Harga dan daftar barang sama. Jatah harian: Warung 8, Supermarket 12 pembelian (hari WIB).
    - Jeda 2,5 detik antar pembelian.
    - Barang jenis "t" masuk tas (maks 99 per barang); minuman/makanan/kebutuhan langsung dipakai.
    - Hanya bisa belanja saat berdiri di lahan tokonya.
  Kafe Bukit belum ada di sini karena di web pun masih dibangun.

  Simpanan: DataStore DuniaKotak_Tas_v1, kunci p_<UserId> = { isi = { [nama] = n }, bl = { h = hari, warung = n, super = n } }.
  Pintu: ReplicatedStorage.DK_Belanja (RemoteFunction: "buka", tempat | "beli", tempat, id)
         ReplicatedStorage.DK_BelanjaBuka (RemoteEvent ke klien saat tombol "Belanja" ditekan di toko).
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local DataStoreService = game:GetService("DataStoreService")

local TOKO = {
	super = { nama = "Supermarket Dunia Kotak", hari = 12, urut = { "susu", "jus", "roti", "semangka", "eskrim", "pakan", "kayu", "batu", "bunga", "daun", "sabun" }, menu = {
		pakan = { "🥫", "Pakan Kucing", 6, "t" }, kayu = { "🪵", "Kayu", 5, "t" }, batu = { "🪨", "Batu kotak", 5, "t" }, bunga = { "🌼", "Bunga", 4, "t" }, daun = { "🍃", "Daun", 3, "t" },
		susu = { "🥛", "Susu Kotak", 6, "m" }, jus = { "🧃", "Jus Buah", 7, "m" }, roti = { "🍞", "Roti Tawar", 7, "k" }, semangka = { "🍉", "Semangka", 8, "k" }, eskrim = { "🍦", "Es Krim", 9, "k" }, sabun = { "🧼", "Sabun Mandi", 4, "p" },
	} },
	warung = { nama = "Warung Desa", hari = 8, urut = { "kopi", "esteh", "mie", "nasi", "gorengan", "kerupuk", "pakan", "sabun" }, menu = {
		kopi = { "☕", "Kopi Hitam", 4, "m" }, esteh = { "🧊", "Es Teh", 3, "m" }, mie = { "🍜", "Mi Rebus Telur", 6, "k" }, nasi = { "🍙", "Nasi Kucing", 5, "k" },
		gorengan = { "🥟", "Gorengan", 2, "k" }, kerupuk = { "🍘", "Kerupuk", 2, "k" }, sabun = { "🧼", "Sabun Batang", 3, "p" }, pakan = { "🥫", "Pakan Kucing", 6, "t" },
	} },
}
-- titik tengah lahan toko (stud, belum digeser), dari game web lewat alat/ekspor_web.js
local LOKASI = {
	{ t = "super", d = "wetan", p = Vector3.new(-162.5, 0, -1125) },
	{ t = "warung", d = "wetan", p = Vector3.new(162.5, 0, -975) },
	{ t = "warung", d = "kulon", p = Vector3.new(-87.5, 0, -66.2) },
	{ t = "warung", d = "curug", p = Vector3.new(343.8, 0, 66.2) },
	{ t = "warung", d = "tlaga", p = Vector3.new(343.8, 0, 66.2) },
}
local GESER_BAWAAN = { wetan = Vector3.zero, kulon = Vector3.new(-10000, 0, 0), curug = Vector3.new(0, 0, -10000), tlaga = Vector3.new(0, 0, 10000) }
local JARAK = 60 -- web: 9 x VS = 45 satuan = 56 stud dari tengah lahan
local JEDA = 2.5
local TAS_MAKS = 99

local store
do
	local ok, s = pcall(function() return DataStoreService:GetDataStore("DuniaKotak_Tas_v1") end)
	if ok then store = s else warn("[BelanjaToko] DataStore tidak tersedia: " .. tostring(s)) end
end

local function buatPintu(kelas, nama)
	local l = ReplicatedStorage:FindFirstChild(nama)
	if l then l:Destroy() end
	local x = Instance.new(kelas)
	x.Name = nama
	x.Parent = ReplicatedStorage
	return x
end
local pintu = buatPintu("RemoteFunction", "DK_Belanja")
local buka = buatPintu("RemoteEvent", "DK_BelanjaBuka")

local function hariWIB()
	return os.date("!%Y-%m-%d", os.time() + 7 * 3600)
end

local function titik(l)
	local akar = workspace:FindFirstChild("DuniaKotak3")
	local f = akar and akar:FindFirstChild(l.d)
	if not f then return nil end
	local geser = f:GetAttribute("geser")
	if typeof(geser) ~= "Vector3" then geser = GESER_BAWAAN[l.d] or Vector3.zero end
	return geser + l.p
end

-- tombol "Belanja" di tiap toko
local lamaF = workspace:FindFirstChild("DK_Toko")
if lamaF then lamaF:Destroy() end
local folder = Instance.new("Folder")
folder.Name = "DK_Toko"
folder.Parent = workspace
for _, l in ipairs(LOKASI) do
	local p = titik(l)
	if p then
		local part = Instance.new("Part")
		part.Name = l.t .. "_" .. l.d
		part.Anchored = true
		part.CanCollide = false
		part.CanQuery = false
		part.CanTouch = false
		part.Transparency = 1
		part.Size = Vector3.new(2, 2, 2)
		part.CFrame = CFrame.new(p + Vector3.new(0, 5, 0))
		local pr = Instance.new("ProximityPrompt")
		pr.ActionText = "Belanja"
		pr.ObjectText = TOKO[l.t].nama
		pr.MaxActivationDistance = 50
		pr.RequiresLineOfSight = false
		pr.HoldDuration = 0
		pr.Parent = part
		pr.Triggered:Connect(function(player) buka:FireClient(player, l.t) end)
		part.Parent = folder
	end
end

local sesi = {} -- [player] = { data, termuat, bt }

local function muat(player)
	local s = { data = { isi = {}, bl = { h = hariWIB() } }, termuat = false, bt = 0 }
	sesi[player] = s
	if not store then return end
	local ok, d = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
	if not ok or sesi[player] ~= s then return end
	if typeof(d) == "table" then
		s.data.isi = typeof(d.isi) == "table" and d.isi or {}
		s.data.bl = typeof(d.bl) == "table" and d.bl or { h = hariWIB() }
	end
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

local function diToko(player, tempat)
	local hrp = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if not hrp then return false end
	for _, l in ipairs(LOKASI) do
		if l.t == tempat then
			local p = titik(l)
			if p and (Vector3.new(p.X, 0, p.Z) - Vector3.new(hrp.Position.X, 0, hrp.Position.Z)).Magnitude < JARAK and math.abs(hrp.Position.Y - p.Y) < 25 then
				return true
			end
		end
	end
	return false
end

local function jatah(s, tempat)
	local hari = hariWIB()
	if s.data.bl.h ~= hari then s.data.bl = { h = hari } end
	return TOKO[tempat].hari - (tonumber(s.data.bl[tempat]) or 0)
end

local function keadaan(player, tempat)
	local s = sesi[player]
	local tk = TOKO[tempat]
	if not s or not tk then return nil end
	local menu = {}
	for _, id in ipairs(tk.urut) do
		local m = tk.menu[id]
		table.insert(menu, { id = id, ikon = m[1], nama = m[2], harga = m[3], jenis = m[4] })
	end
	return { nama = tk.nama, hari = tk.hari, menu = menu, koin = koinPemain(player), sisa = jatah(s, tempat), tas = s.data.isi }
end

local function beli(player, tempat, id)
	local s = sesi[player]
	local tk = TOKO[tempat]
	if not s or not tk then return { galat = "Toko tidak ada." } end
	local m = tk.menu[id]
	if not m then return { galat = "Barang tidak ada." } end
	if not diToko(player, tempat) then return { galat = "Kamu harus berada di " .. tk.nama .. "." } end
	if jatah(s, tempat) <= 0 then return { galat = "Jatah belanja di " .. tk.nama .. " hari ini habis. Datang lagi besok ya!" } end
	if koinPemain(player) < m[3] then return { galat = "Koinmu kurang (" .. m[3] .. " koin)." } end
	local kini = os.clock()
	if kini - s.bt < JEDA then return { galat = "Sebentar, kasirnya masih menghitung." } end
	if m[4] == "t" and (tonumber(s.data.isi[m[2]]) or 0) >= TAS_MAKS then return { galat = "Tasmu sudah penuh " .. m[2] .. "." } end
	local dk = ServerStorage:FindFirstChild("DK_Koin")
	local ok, hasil = pcall(function() return dk and dk:Invoke(player, -m[3]) end)
	if not ok or hasil ~= true then return { galat = "Koin belum bisa dipotong, coba lagi." } end
	s.bt = kini
	s.data.bl[tempat] = (tonumber(s.data.bl[tempat]) or 0) + 1
	if m[4] == "t" then s.data.isi[m[2]] = (tonumber(s.data.isi[m[2]]) or 0) + 1 end
	local r = keadaan(player, tempat)
	r.hasil = { ikon = m[1], nama = m[2], harga = m[3], jenis = m[4] }
	return r
end

pintu.OnServerInvoke = function(player, aksi, tempat, id)
	if typeof(tempat) ~= "string" or not TOKO[tempat] then return { galat = "Toko tidak ada." } end
	if aksi == "beli" then
		if typeof(id) ~= "string" then return { galat = "Barang tidak ada." } end
		local ok, r = pcall(beli, player, tempat, id)
		if ok then return r end
		warn("[BelanjaToko] " .. tostring(r))
		return { galat = "Ada gangguan, coba lagi." }
	end
	return keadaan(player, tempat) or { galat = "Data belum siap, coba lagi." }
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
