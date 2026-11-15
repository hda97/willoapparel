--[[
  HiasRumah (Script) - masuk ke rumah sendiri, lalu upgrade dan hias rumah (Huda 15 Nov 2026:
  "warga bisa masuk ke rumah masing-masing, bisa upgrade memperindah rumah masing-masing").
  Tempat: ServerScriptService.HiasRumah. Butuh ServerStorage.DK_Kavling dan atribut pemain DK_No dari RumahWarga.
  Pasangan klien: StarterPlayer.StarterPlayerScripts.HiasRumah.

  Aturan disalin dari game web (Toko Hias di worker.js TOKO_HIAS, DEKOR_KOIN; game.js buatInterior, lantaiDua, catKavling, DEKOR):
    - Cat rumah 7 warna (30 💎 atau 300 koin), warna pagar 5 (20 💎 / 200 koin), Rumah 2 lantai (150 💎 / 1.500 koin).
      Barang pertama tiap jenis gratis (krem, putih, 1 lantai). Barang yang sudah dibeli bisa dipakai lagi gratis.
    - Hiasan pekarangan dibeli pakai koin: bangku 100, pot 100, lampu 150, keranjang 120, jamur 100, kolam 800. Bisa dipasang/dilepas.
    - Isi rumah sama dengan interior web (kasur, lemari, TV, sofa, meja makan, lampu, pot, jam dan foto), dibuat 2x lebih lega
      supaya muat tokoh Roblox. Rumah 2 lantai: ada tangga ke kamar atas.
  Hanya pemilik (warga yang sudah menautkan akun web) yang bisa masuk. Tampilan luar rumah berubah selama pemiliknya bermain.
  Data Roblox terpisah dari web (seperti koin): DataStore DuniaKotak_Hias_v1, kunci p_<UserId> =
    { cat, pagar, rumah, dekor = { id dipasang }, punya = { cat = {}, pagar = {}, rumah = {}, dekor = {} } }.
  Ruang dalam rumah dibuat 1.500 stud di atas rumah (tidak terlihat dan tidak ter-stream ke pemain di darat).
  Pintu klien: ReplicatedStorage.DK_Hias (RemoteFunction: "buka" | "pilih", jenis, id, bayar | "dekor", id),
               ReplicatedStorage.DK_HiasKabar (RemoteEvent: pesan singkat ke pemain).
  Atribut pemain DK_DiRumah = true selama di dalam rumah.
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local DataStoreService = game:GetService("DataStoreService")

local Kavling = require(ServerStorage:WaitForChild("DK_Kavling"))
local GridPeta = require(ServerStorage:WaitForChild("DK_GridPeta"))

local VS = 6.25 -- 1 VS web (5 satuan) dalam stud
local GESER_DUSUN = { wetan = Vector3.zero, kulon = Vector3.new(-10000, 0, 0), curug = Vector3.new(0, 0, -10000), tlaga = Vector3.new(0, 0, 10000) }
local KOIN_PER_PERMATA = 10
local TINGGI_DALAM = 1500 -- ruang dalam rumah di atas rumah
local H = 6 -- 1 satuan interior web = 6 stud (2,4x ukuran rumah di map supaya lega untuk tokoh dan kamera Roblox)
local TINGGI_RUANG = 2.8
local JARAK_LANTAI2 = 40

local TOKO = {
	cat = { urut = { "krem", "putih", "biru", "hijau", "pink", "kuning", "ungu" }, harga = 30, nama = "Cat rumah", ikon = "🏠",
		warna = { krem = "f1dcb4", putih = "f4f1ea", biru = "9cc4e8", hijau = "a8d5a0", pink = "f2b8c6", kuning = "f5d76e", ungu = "c3b1e1" } },
	pagar = { urut = { "putih", "kayu", "hitam", "biru", "merah" }, harga = 20, nama = "Warna pagar", ikon = "🪵",
		warna = { putih = "ffffff", kayu = "a0703c", hitam = "3a3a40", biru = "3a7bd5", merah = "c8453a" } },
	rumah = { urut = { "satu", "dua" }, harga = 150, nama = "Rumah", ikon = "🏡", label = { satu = "1 lantai", dua = "2 lantai" } },
}
local JENIS = { "cat", "pagar", "rumah" }

-- hiasan pekarangan: ukuran & posisi dalam satuan kavling web (dikali VS x DK_SKALA 1,5), dari DEKOR di game.js
local U = VS * 1.5
local DEKOR = {
	{ id = "bangku", ikon = "🪑", nama = "Bangku taman", harga = 100, pos = { -4.15, 1.7 }, rot = math.pi / 2, bagian = {
		{ .8, .06, .26, "a0703c", 0, .2, 0 }, { .8, .22, .05, "a0703c", 0, .36, -.12 }, { .06, .2, .22, "5a3a20", -.33, .1, 0 }, { .06, .2, .22, "5a3a20", .33, .1, 0 } } },
	{ id = "pot", ikon = "🌷", nama = "Pot bunga", harga = 100, pos = { -.55, 1.35 }, rot = 0, bagian = {
		{ .26, .2, .26, "c8653a", 0, .1, 0 }, { .2, .05, .2, "5a3a20", 0, .21, 0 }, { .04, .16, .04, "3f9a3a", 0, .3, 0 },
		{ .09, .09, .09, "ff5a7a", -.06, .4, .04 }, { .09, .09, .09, "ffd23a", .06, .4, -.03 }, { .09, .09, .09, "b07aff", 0, .4, .07 } } },
	{ id = "lampu", ikon = "🏮", nama = "Lampu taman", harga = 150, pos = { -1.05, 3.1 }, rot = 0, bagian = {
		{ .16, .06, .16, "9aa0a8", 0, .03, 0 }, { .05, .62, .05, "2a2a2a", 0, .34, 0 }, { .14, .04, .14, "2a2a2a", 0, .73, 0 }, { .11, .13, .11, "ffe08a", 0, .65, 0, "neon" } } },
	{ id = "keranjang", ikon = "🧺", nama = "Keranjang buah", harga = 120, pos = { 2.55, 2.15 }, rot = 0, bagian = {
		{ .4, .16, .28, "b8844a", 0, .08, 0 }, { .1, .1, .1, "e0403a", -.1, .2, -.05 }, { .1, .1, .1, "e0403a", .08, .2, .04 }, { .1, .1, .1, "e0403a", 0, .2, -.02 },
		{ .1, .1, .1, "5cc85c", -.04, .2, .07 }, { .1, .1, .1, "e0403a", .12, .2, -.06 } } },
	{ id = "jamur", ikon = "🍄", nama = "Taman jamur", harga = 100, pos = { -4.2, -.5 }, rot = 0, bagian = {
		{ .5, .04, .5, "6a4a2a", 0, .02, 0 },
		{ .06, .14, .06, "f4ecd8", -.13, .07, -.1 }, { .2, .08, .2, "d84a4a", -.13, .16, -.1 },
		{ .048, .112, .048, "f4ecd8", .12, .056, -.05 }, { .16, .064, .16, "d84a4a", .12, .128, -.05 },
		{ .072, .168, .072, "f4ecd8", 0, .084, .13 }, { .24, .096, .24, "d84a4a", 0, .192, .13 } } },
	{ id = "kolam", ikon = "🐟", nama = "Kolam ikan", harga = 800, pos = { -3.3, 3.0 }, rot = 0, bagian = {
		{ .9, .1, .7, "9aa0a8", 0, .05, 0 }, { .76, .04, .56, "3aa0d8", 0, .1, 0, "air" }, { .12, .04, .05, "ff8a2a", -.18, .13, -.1 },
		{ .12, .04, .05, "f4f4f4", .15, .13, .08 }, { .12, .04, .05, "ff8a2a", .02, .13, -.15 }, { .08, .14, .08, "3f9a3a", .3, .17, .2 }, { .12, .1, .12, "7a7a80", -.33, .15, .22 } } },
}
local DEKOR_ID = {}
for _, d in ipairs(DEKOR) do DEKOR_ID[d.id] = d end

-- isi rumah lantai 1 (game.js buatInterior): { lebar, tinggi, dalam, warna, x, y, z [, "neon"] } satuan interior web
local ISI_BAWAH = {
	{ 1.7, .02, 1.2, "c0463a", -.4, .07, .7 }, { 1.3, .021, .8, "e8c070", -.4, .075, .7 }, -- karpet
	{ 1.2, .3, 2, "8a5a3a", -1.75, .15, -.95 }, { 1.1, .14, 1.9, "f4f4f4", -1.75, .37, -.95 }, { .8, .12, .35, "ffffff", -1.75, .5, -1.7 },
	{ 1.14, .08, 1.15, "3a7bd5", -1.75, .48, -.45 }, { 1.2, .7, .12, "7a4a2a", -1.75, .35, -1.9 }, -- kasur
	{ 1.2, 1.5, .55, "7a4a2a", 1.75, .75, -1.6 }, { .03, 1.3, .02, "4a2a1a", 1.75, .78, -1.32 }, { .06, .14, .04, "ffd040", 1.66, .8, -1.31 }, { .06, .14, .04, "ffd040", 1.84, .8, -1.31 }, -- lemari
	{ 1.2, .4, .45, "5a3a2a", .1, .2, -1.7 }, { 1.05, .6, .08, "1d1d22", .1, .72, -1.72 }, { .95, .5, .02, "2f6fd8", .1, .72, -1.675, "neon" }, -- TV
	{ 1.6, .32, .7, "2a9a5a", -.4, .16, .05 }, { 1.6, .45, .2, "2a9a5a", -.4, .45, .35 }, { .18, .45, .7, "23804a", -1.2, .3, .05 }, { .18, .45, .7, "23804a", .4, .3, .05 },
	{ .5, .14, .5, "ffd23a", -.8, .38, .05 }, { .5, .14, .5, "ff8a3a", 0, .38, .05 }, -- sofa
	{ 1, .07, .75, "b07a48", 1.7, .62, .55 }, { .07, .6, .07, "7a4a2a", 1.28, .3, .25 }, { .07, .6, .07, "7a4a2a", 2.12, .3, .25 }, { .07, .6, .07, "7a4a2a", 1.28, .3, .85 }, { .07, .6, .07, "7a4a2a", 2.12, .3, .85 },
	{ .45, .06, .45, "8a5a3a", 1.7, .38, -.05 }, { .45, .4, .06, "8a5a3a", 1.7, .6, -.25 }, { .05, .36, .05, "7a4a2a", 1.52, .18, -.23 }, { .05, .36, .05, "7a4a2a", 1.88, .18, .13 },
	{ .45, .06, .45, "8a5a3a", 1.7, .38, 1.15 }, { .45, .4, .06, "8a5a3a", 1.7, .6, 1.35 }, { .05, .36, .05, "7a4a2a", 1.52, .18, .97 }, { .05, .36, .05, "7a4a2a", 1.88, .18, 1.33 },
	{ .35, .02, .35, "ffffff", 1.7, .665, .55 }, { .18, .1, .18, "ff5a3a", 1.7, .72, .55 }, -- meja makan
	{ .06, 1.2, .06, "2a2a2a", -2.2, .6, .4 }, { .4, .3, .4, "ffe8a0", -2.2, 1.25, .4, "neon" }, -- lampu berdiri
	{ .35, .35, .35, "b0603a", 1.0, .18, 1.7 }, { .5, .5, .5, "3f9a3a", 1.0, .6, 1.7 }, { .3, .3, .3, "4fae3c", 1.05, .95, 1.65 }, -- pot tanaman
	{ .5, .4, .04, "ffffff", -.9, 1.7, -1.88 }, { .42, .32, .02, "ffb347", -.9, 1.7, -1.86 }, -- foto
	{ .36, .36, .03, "ffffff", 1.0, 2.0, -1.88 }, { .03, .14, .02, "1d1d22", 1.0, 2.04, -1.86 }, { .1, .03, .02, "1d1d22", 1.04, 2.0, -1.86 }, -- jam dinding
}
-- kamar atas (rumah 2 lantai)
local ISI_ATAS = {
	{ 2, .02, 1.4, "3a7bd5", 0, .04, .2 }, { 1.6, .021, 1.0, "9cc4e8", 0, .045, .2 }, -- karpet
	{ 1.4, .07, .6, "b07a48", 1.5, .75, -1.6 }, { .07, .72, .07, "7a4a2a", .85, .36, -1.35 }, { .07, .72, .07, "7a4a2a", 2.15, .36, -1.35 }, { .07, .72, .07, "7a4a2a", .85, .36, -1.85 }, { .07, .72, .07, "7a4a2a", 2.15, .36, -1.85 }, -- meja belajar
	{ .7, .45, .05, "1d1d22", 1.5, 1.05, -1.75 }, { .62, .37, .02, "3aa0d8", 1.5, 1.05, -1.72, "neon" }, { .5, .03, .2, "2a2a2a", 1.5, .8, -1.45 },
	{ .5, .08, .5, "3a7bd5", 1.5, .45, -1.0 }, { .5, .5, .08, "3a7bd5", 1.5, .7, -.75 }, { .06, .42, .06, "2a2a2a", 1.5, .21, -1.0 }, -- kursi
	{ 1.4, 1.6, .4, "7a4a2a", -1.6, .8, -1.75 }, { 1.3, .04, .36, "5a3a2a", -1.6, .55, -1.73 }, { 1.3, .04, .36, "5a3a2a", -1.6, 1.05, -1.73 }, -- rak buku
	{ .12, .38, .28, "d0442f", -2.1, .76, -1.7 }, { .12, .34, .28, "f2c14e", -1.95, .74, -1.7 }, { .12, .4, .28, "2a9a5a", -1.8, .77, -1.7 }, { .12, .36, .28, "8a5ad8", -1.2, .75, -1.7 },
	{ .12, .38, .28, "3a7bd5", -2.05, 1.26, -1.7 }, { .12, .34, .28, "e06a9a", -1.5, 1.24, -1.7 }, { .12, .4, .28, "f4f4f4", -1.35, 1.27, -1.7 },
	{ .8, .5, .8, "d84a8a", -1.0, .25, .5 }, { .6, .2, .6, "e06a9a", -1.0, .55, .5 }, -- bantal duduk besar
	{ .35, .35, .35, "b0603a", 1.9, .18, 1.6 }, { .5, .5, .5, "3f9a3a", 1.9, .6, 1.6 }, -- pot
	{ .06, 1.2, .06, "2a2a2a", 2.2, .6, .4 }, { .4, .3, .4, "ffe8a0", 2.2, 1.25, .4, "neon" }, -- lampu
}

local store
do
	local ok, s = pcall(function() return DataStoreService:GetDataStore("DuniaKotak_Hias_v1") end)
	if ok then store = s else warn("[HiasRumah] DataStore tidak tersedia: " .. tostring(s)) end
end

local function buatPintu(kelas, nama)
	local l = ReplicatedStorage:FindFirstChild(nama)
	if l then l:Destroy() end
	local x = Instance.new(kelas)
	x.Name = nama
	x.Parent = ReplicatedStorage
	return x
end
local pintu = buatPintu("RemoteFunction", "DK_Hias")
local kabarEv = buatPintu("RemoteEvent", "DK_HiasKabar")

local lamaF = workspace:FindFirstChild("DK_HiasRumah")
if lamaF then lamaF:Destroy() end
local folder = Instance.new("Folder")
folder.Name = "DK_HiasRumah"
folder.Parent = workspace

local sesi = {} -- [player] = { data, termuat, no, luar = { warna, cframe, tambah }, dalam = Model, lantai }

local function kabari(player, teks)
	kabarEv:FireClient(player, teks)
end

local function dusunNo(no)
	return no > 860 and "segara" or no > 660 and "tlaga" or no > 460 and "curug" or no > 260 and "kulon" or "wetan"
end

-- titik rumah warga No. no: tengah kavling c, tengah rumah hc, arah dir (1/-1); nil kalau belum ada di map
local function letakRumah(no)
	no = tonumber(no)
	if not no then return nil end
	local d = dusunNo(no)
	local k = Kavling[d] and Kavling[d][no]
	local akar = workspace:FindFirstChild("DuniaKotak3")
	local f = akar and akar:FindFirstChild(d)
	if not k or not f then return nil end
	local geser = f:GetAttribute("geser")
	if typeof(geser) ~= "Vector3" then geser = GESER_DUSUN[d] or Vector3.zero end
	local dir = k[4]
	local c = geser + Vector3.new(k[5], k[6], k[7])
	return { c = c, hc = c + Vector3.new(dir * -2 * VS, 0, dir * -0.6 * VS), dir = dir, peta = akar }
end

local function rapikan(d)
	d = typeof(d) == "table" and d or {}
	local h = { punya = {} }
	for _, j in ipairs(JENIS) do
		local t = TOKO[j]
		h[j] = table.find(t.urut, d[j]) and d[j] or t.urut[1]
		h.punya[j] = {}
		local asal = typeof(d.punya) == "table" and typeof(d.punya[j]) == "table" and d.punya[j] or {}
		for _, id in ipairs(asal) do
			if table.find(t.urut, id) and not table.find(h.punya[j], id) then table.insert(h.punya[j], id) end
		end
		if h[j] ~= t.urut[1] and not table.find(h.punya[j], h[j]) then h[j] = t.urut[1] end
	end
	h.punya.dekor, h.dekor = {}, {}
	for _, id in ipairs(typeof(d.punya) == "table" and typeof(d.punya.dekor) == "table" and d.punya.dekor or {}) do
		if DEKOR_ID[id] and not table.find(h.punya.dekor, id) then table.insert(h.punya.dekor, id) end
	end
	for _, id in ipairs(typeof(d.dekor) == "table" and d.dekor or {}) do
		if table.find(h.punya.dekor, id) and not table.find(h.dekor, id) then table.insert(h.dekor, id) end
	end
	return h
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

local function warna(hex) return Color3.fromHex(hex) end

local function kotak(induk, ukuran, cf, hex, gaya)
	local p = Instance.new("Part")
	p.Anchored = true
	p.Size = ukuran
	p.CFrame = cf
	p.Color = warna(hex)
	p.Material = Enum.Material.SmoothPlastic
	p.TopSurface, p.BottomSurface = Enum.SurfaceType.Smooth, Enum.SurfaceType.Smooth
	p.CanTouch = false
	if gaya == "neon" then
		p.Material = Enum.Material.Neon
	elseif gaya == "kaca" then
		p.Material = Enum.Material.Glass
		p.Transparency = 0.35
	elseif gaya == "air" then
		p.Material = Enum.Material.Glass
		p.Transparency = 0.2
	end
	p.Parent = induk
	return p
end

-- ===== tampilan luar rumah =====

local function kembalikanLuar(s)
	local l = s.luar
	if not l then return end
	for _, w in ipairs(l.warna) do if w[1].Parent then w[1].Color = w[2] end end
	for _, c in ipairs(l.cframe) do if c[1].Parent then c[1].CFrame = c[2] end end
	if l.tambah then l.tambah:Destroy() end
	s.luar = nil
end

local function tanahDi(p, peta)
	local rp = RaycastParams.new()
	rp.FilterType = Enum.RaycastFilterType.Include
	rp.FilterDescendantsInstances = { peta }
	local r = workspace:Raycast(p + Vector3.new(0, 12, 0), Vector3.new(0, -30, 0), rp)
	return r and r.Position.Y or p.Y
end

local function terapkanLuar(player)
	local s = sesi[player]
	if not s then return end
	kembalikanLuar(s)
	local L = s.no and letakRumah(s.no)
	if not L then return end
	local h = s.data
	local l = { warna = {}, cframe = {} }
	s.luar = l
	local tambah = Instance.new("Model")
	tambah.Name = "rumah_" .. player.UserId
	tambah.Parent = folder
	l.tambah = tambah
	local hc, dir = L.hc, L.dir
	local function lokal(p) return (p.X - hc.X) * dir, p.Y - hc.Y, (p.Z - hc.Z) * dir end
	local catHex = TOKO.cat.warna[h.cat]
	local dua = h.rumah == "dua"
	local naikkan, jendela = {}, {}
	for _, q in ipairs(GridPeta.di(hc + Vector3.new(0, 9, 0), Vector3.new(18, 20, 18))) do
		local x, y, z = lokal(q.Position)
		if math.abs(x) < 7.6 and math.abs(z) < 7.6 and y > -0.5 and y < 17 then
			if h.cat ~= "krem" and q.Color:ToHex() == "f1dcb4" then
				table.insert(l.warna, { q, q.Color })
				q.Color = warna(catHex)
			end
			if dua and y > 8.3 and math.abs(z) < 6.6 then
				table.insert(naikkan, q)
			elseif dua and y > 2.5 and y < 6.6 and math.abs(z) < 6.0 and math.abs(x) < 7.2 and (math.abs(x) > 5.9 or math.abs(z) > 4.7)
				and not (math.abs(x) < 1.8 and z > 0) then
				table.insert(jendela, q)
			end
		end
	end
	-- rumah 2 lantai (lantaiDua di web): atap naik 6 stud, dinding lantai 2 + list putih + tiang sudut, jendela disalin ke atas
	if dua then
		local T2 = 2.4 * 2.5
		for _, q in ipairs(naikkan) do
			table.insert(l.cframe, { q, q.CFrame })
			q.CFrame = q.CFrame + Vector3.new(0, T2, 0)
		end
		local y1 = hc.Y + 7.8
		local putar = dir == 1 and CFrame.new() or CFrame.Angles(0, math.pi, 0)
		local dasar = CFrame.new(hc.X, y1, hc.Z) * putar
		kotak(tambah, Vector3.new(12.5, T2, 10), dasar * CFrame.new(0, T2 / 2, 0), catHex)
		kotak(tambah, Vector3.new(13.2, 0.55, 10.7), dasar * CFrame.new(0, 0.05, 0), "ffffff")
		for _, a in ipairs({ { -1, -1 }, { 1, -1 }, { -1, 1 }, { 1, 1 } }) do
			kotak(tambah, Vector3.new(0.75, T2, 0.75), dasar * CFrame.new(a[1] * 6.25, T2 / 2, a[2] * 5), "ffffff")
		end
		for _, q in ipairs(jendela) do
			local k = q:Clone()
			k.CFrame = q.CFrame + Vector3.new(0, T2 + 0.25, 0)
			k.Parent = tambah
		end
		-- jendela tengah depan di atas pintu
		kotak(tambah, Vector3.new(2.6, 2.4, 0.3), dasar * CFrame.new(0, T2 / 2 + 0.2, 5.05), "ffffff")
		kotak(tambah, Vector3.new(2.1, 1.9, 0.32), dasar * CFrame.new(0, T2 / 2 + 0.2, 5.06), "9fd6ff", "kaca")
	end
	-- warna pagar halaman (tiang & palang putih tipis di tepi pagar, satuan kavling)
	if h.pagar ~= "putih" then
		local c = L.c
		for _, q in ipairs(GridPeta.di(c + Vector3.new(dir * -13, 2, 0), Vector3.new(40, 8, 38))) do
			if q.Color:ToHex() == "ffffff" and math.min(q.Size.X, q.Size.Y, q.Size.Z) <= 0.45 then
				local x, z = (q.Position.X - c.X) * dir, (q.Position.Z - c.Z) * dir
				local tepiX = (math.abs(x + 29.2) < 1.6 or math.abs(x - 3.2) < 1.6) and math.abs(z) < 16.6
				local tepiZ = math.abs(math.abs(z) - 15.2) < 1.6 and x > -30.8 and x < 4.8
				if tepiX or tepiZ then
					table.insert(l.warna, { q, q.Color })
					q.Color = warna(TOKO.pagar.warna[h.pagar])
				end
			end
		end
	end
	-- hiasan pekarangan
	for _, id in ipairs(h.dekor) do
		local d = DEKOR_ID[id]
		local p = L.c + Vector3.new(dir * d.pos[1] * VS, 0, dir * d.pos[2] * VS)
		p = Vector3.new(p.X, tanahDi(p, L.peta), p.Z)
		local dasar = CFrame.new(p) * CFrame.Angles(0, (dir == 1 and 0 or math.pi) + d.rot, 0)
		for _, b in ipairs(d.bagian) do
			local part = kotak(tambah, Vector3.new(b[1], b[2], b[3]) * U, dasar * CFrame.new(b[5] * U, b[6] * U, b[7] * U), b[4], b[8])
			part.CanCollide = id == "bangku" or id == "kolam"
			if b[8] == "neon" then
				local cahaya = Instance.new("PointLight")
				cahaya.Range = 18
				cahaya.Brightness = 1.2
				cahaya.Color = warna("ffe08a")
				cahaya.Parent = part
			end
		end
	end
	-- pintu rumah: tombol "Masuk rumah" (hanya pemilik; klien menyembunyikan tombol rumah orang lain)
	local pp = Instance.new("Part")
	pp.Name = "PintuRumah"
	pp.Anchored, pp.CanCollide, pp.CanQuery, pp.CanTouch = true, false, false, false
	pp.Transparency = 1
	pp.Size = Vector3.new(1, 1, 1)
	pp.CFrame = CFrame.new(hc + Vector3.new(0, 3.5, dir * 5.8))
	local pr = Instance.new("ProximityPrompt")
	pr.ActionText = "Masuk rumah"
	pr.ObjectText = "Rumahmu"
	pr.MaxActivationDistance = 12
	pr.RequiresLineOfSight = false
	pr.HoldDuration = 0
	pr:SetAttribute("pemilik", player.UserId)
	pr.Parent = pp
	pp.Parent = tambah
	pr.Triggered:Connect(function(siapa)
		if siapa ~= player then return end
		local masuk = s.masuk
		if masuk then masuk(player) end
	end)
end

-- ===== ruang dalam rumah =====
local function buatRuang(induk, dasar, hex, isi, lantai, dua)
	local function k(w, hh, d, c, x, y, z, gaya)
		return kotak(induk, Vector3.new(w, hh, d) * H, dasar * CFrame.new(x * H, y * H, z * H), c, gaya)
	end
	local T = TINGGI_RUANG
	k(4.9, .06, 3.9, "c89a64", 0, -.03, 0)
	for i = -2, 2 do k(.02, .01, 3.9, "a87a48", i, .005, 0) end
	k(5, T, .12, hex, 0, T / 2, -1.96) -- dinding belakang
	k(.12, T, 4, hex, -2.44, T / 2, 0)
	k(.12, T, 4, hex, 2.44, T / 2, 0)
	k(1.95, T, .12, hex, -1.53, T / 2, 1.96) -- dinding depan kiri & kanan pintu
	k(1.95, T, .12, hex, 1.53, T / 2, 1.96)
	k(1.1, T - 1.7, .12, hex, 0, 1.7 + (T - 1.7) / 2, 1.96) -- di atas pintu
	k(5, .08, 4, "f4f1ea", 0, T + .04, 0) -- plafon
	for _, a in ipairs({ { -2.44, -1.96 }, { 2.44, -1.96 }, { -2.44, 1.96 }, { 2.44, 1.96 }, { -.55, 1.96 }, { .55, 1.96 } }) do
		k(.18, T, .18, "ffffff", a[1], T / 2, a[2])
	end
	k(1.1, .1, .16, "ffffff", 0, 1.75, 1.96)
	-- pintu tertutup (keluar lewat tombol "Keluar rumah"); juga menahan kamera tetap di dalam ruangan
	k(1.0, 1.7, .08, "8a5a3a", 0, .85, 1.97)
	k(.08, .08, .04, "ffd040", .38, .85, 1.92)
	-- jendela
	for _, x in ipairs({ -1.6, 1.6 }) do
		k(.8, .6, .14, "ffffff", x, 1.45, 1.96)
		k(.7, .5, .15, "9fd6ff", x, 1.45, 1.96, "kaca")
	end
	for _, sisi in ipairs({ -2.44, 2.44 }) do
		k(.14, .6, .9, "ffffff", sisi, 1.45, -.2)
		k(.15, .5, .8, "9fd6ff", sisi, 1.45, -.2, "kaca")
	end
	for _, b in ipairs(isi) do k(b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8]) end
	-- lampu plafon
	local lampu = k(.6, .05, .6, "fff4d6", 0, T - .03, 0, "neon")
	local cahaya = Instance.new("PointLight")
	cahaya.Range = 40
	cahaya.Brightness = 1.4
	cahaya.Color = warna("fff1d0")
	cahaya.Parent = lampu
	-- tangga (rumah 2 lantai): pojok kiri depan
	if dua then
		for i = 0, 3 do
			k(.9, .18 * (i + 1), .22, "a0703c", -1.95, .09 * (i + 1), 1.75 - i * .22)
		end
	end
	return lampu
end

local function buangDalam(s)
	if s.dalam then
		s.dalam:Destroy()
		s.dalam = nil
	end
end

local function letakDalam(L)
	return CFrame.new(L.hc + Vector3.new(0, TINGGI_DALAM, 0))
end

local function bangunDalam(player)
	local s = sesi[player]
	buangDalam(s)
	local L = s.no and letakRumah(s.no)
	if not L then return nil end
	local m = Instance.new("Model")
	m.Name = "dalam_" .. player.UserId
	m.ModelStreamingMode = Enum.ModelStreamingMode.Atomic
	local hex = TOKO.cat.warna[s.data.cat]
	local dua = s.data.rumah == "dua"
	local dasar = letakDalam(L)
	buatRuang(m, dasar, hex, ISI_BAWAH, 1, dua)
	local function tombol(nama, teks, obj, cf, fungsi)
		local p = Instance.new("Part")
		p.Name = nama
		p.Anchored, p.CanCollide, p.CanQuery, p.CanTouch = true, false, false, false
		p.Transparency = 1
		p.Size = Vector3.new(1, 1, 1)
		p.CFrame = cf
		local pr = Instance.new("ProximityPrompt")
		pr.ActionText = teks
		pr.ObjectText = obj
		pr.MaxActivationDistance = 9
		pr.RequiresLineOfSight = false
		pr.HoldDuration = 0
		pr:SetAttribute("pemilik", player.UserId)
		pr.Parent = p
		p.Parent = m
		pr.Triggered:Connect(function(siapa) if siapa == player then fungsi() end end)
	end
	tombol("Keluar", "Keluar rumah", "Pintu", dasar * CFrame.new(0, 4, 1.7 * H), function() if s.keluar then s.keluar(player) end end)
	if dua then
		local atas = dasar * CFrame.new(0, JARAK_LANTAI2, 0)
		buatRuang(m, atas, hex, ISI_ATAS, 2, true)
		tombol("NaikTangga", "Naik ke lantai 2", "Tangga", dasar * CFrame.new(-1.95 * H, 3, 1.4 * H), function()
			player.Character:PivotTo(atas * CFrame.new(-1.0 * H, 4, 1.0 * H) * CFrame.Angles(0, math.pi, 0))
		end)
		tombol("TurunTangga", "Turun ke lantai 1", "Tangga", atas * CFrame.new(-1.95 * H, 3, 1.4 * H), function()
			player.Character:PivotTo(dasar * CFrame.new(-1.0 * H, 4, 1.0 * H) * CFrame.Angles(0, math.pi, 0))
		end)
	end
	m.Parent = folder
	s.dalam = m
	return dasar
end

local function masukRumah(player)
	local s = sesi[player]
	if not s or not s.no then return end
	if (player:GetAttribute("DK_Naik") or "") ~= "" then return kabari(player, "Turun dulu dari kendaraanmu.") end
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not hum or hum.Health <= 0 then return end
	if hum.SeatPart then hum.Sit = false end
	local dasar = s.dalam and letakDalam(letakRumah(s.no)) or bangunDalam(player)
	if not dasar then return end
	local p = dasar * CFrame.new(0, 4, 1.0 * H)
	pcall(function() player:RequestStreamAroundAsync(p.Position, 5) end)
	char:PivotTo(CFrame.lookAt(p.Position, p.Position + Vector3.new(0, 0, -1)))
	player:SetAttribute("DK_DiRumah", true)
	kabari(player, "🏠 Masuk rumahmu. Tekan 🎨 Hias Rumah untuk upgrade dan menghias.")
end

local function keluarRumah(player)
	local s = sesi[player]
	local L = s and s.no and letakRumah(s.no)
	player:SetAttribute("DK_DiRumah", nil)
	if not L or not player.Character then return end
	local p = L.hc + Vector3.new(0, 4, L.dir * 9)
	pcall(function() player:RequestStreamAroundAsync(p, 5) end)
	player.Character:PivotTo(CFrame.lookAt(p, p + Vector3.new(0, 0, L.dir)))
end

-- ===== toko =====
local function koinPemain(player)
	local ls = player:FindFirstChild("leaderstats")
	local k = ls and ls:FindFirstChild("Koin")
	return k and k.Value or 0
end
local function permataPemain(player)
	local ls = player:FindFirstChild("leaderstats")
	local k = ls and ls:FindFirstChild("Permata")
	return k and k.Value or 0
end
local function bayar(player, koin, permata)
	local nama = permata and "DK_Permata" or "DK_Koin"
	local f = ServerStorage:FindFirstChild(nama)
	local ok, hasil = pcall(function() return f and f:Invoke(player, -(permata or koin)) end)
	return ok and hasil == true
end

local function keadaan(player)
	local s = sesi[player]
	local toko = {}
	for _, j in ipairs(JENIS) do
		local t = TOKO[j]
		local daftar = {}
		for i, id in ipairs(t.urut) do
			table.insert(daftar, { id = id, harga = i == 1 and 0 or t.harga, warna = t.warna and t.warna[id], label = t.label and t.label[id] or id })
		end
		toko[j] = { nama = t.nama, ikon = t.ikon, daftar = daftar }
	end
	local dekor = {}
	for _, d in ipairs(DEKOR) do table.insert(dekor, { id = d.id, ikon = d.ikon, nama = d.nama, harga = d.harga }) end
	return {
		tertaut = s.no ~= nil, adaRumah = s.no ~= nil and letakRumah(s.no) ~= nil, diRumah = player:GetAttribute("DK_DiRumah") == true,
		koin = koinPemain(player), permata = permataPemain(player), kali = KOIN_PER_PERMATA,
		toko = toko, urut = JENIS, dekor = dekor, hias = s.data,
	}
end

local function terapkanSemua(player)
	local s = sesi[player]
	terapkanLuar(player)
	if s.dalam then
		local diDalam = player:GetAttribute("DK_DiRumah")
		local lantai2 = false
		local hrp = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
		local L = letakRumah(s.no)
		if hrp and L then lantai2 = hrp.Position.Y > letakDalam(L).Y + JARAK_LANTAI2 / 2 end
		local dasar = bangunDalam(player)
		-- rumah kembali 1 lantai saat sedang di lantai 2: turunkan ke lantai 1
		if diDalam and lantai2 and s.data.rumah ~= "dua" and dasar and player.Character then
			player.Character:PivotTo(dasar * CFrame.new(0, 4, 1.2 * H))
		end
	end
end

local function aksi(player, op, a, b, c)
	local s = sesi[player]
	if not s then return { galat = "Data belum siap, coba lagi." } end
	if op == "buka" then return keadaan(player) end
	if not s.no then return { galat = "Tautkan dulu akun web-mu lewat tombol Rumah." } end
	if store and not s.termuat then return { galat = "Data belum siap, coba lagi." } end
	local pesan
	if op == "pilih" then
		local t = TOKO[a]
		if not t or typeof(b) ~= "string" or not table.find(t.urut, b) then return { galat = "Barang tidak ada." } end
		local gratis = b == t.urut[1] or table.find(s.data.punya[a], b)
		if not gratis then
			local pakaiPermata = c == "permata"
			if pakaiPermata and permataPemain(player) < t.harga then return { galat = "Permatamu kurang (" .. t.harga .. " 💎)." } end
			if not pakaiPermata and koinPemain(player) < t.harga * KOIN_PER_PERMATA then
				return { galat = "Koinmu kurang (" .. t.harga * KOIN_PER_PERMATA .. " koin)." }
			end
			if not bayar(player, t.harga * KOIN_PER_PERMATA, pakaiPermata and t.harga or nil) then return { galat = "Belum bisa dibayar, coba lagi." } end
			table.insert(s.data.punya[a], b)
			pesan = a == "rumah" and "🏡 Rumahmu sekarang 2 lantai!" or ("🎉 " .. t.nama .. " baru terpasang!")
		end
		s.data[a] = b
		terapkanSemua(player)
		simpanNanti(player)
	elseif op == "dekor" then
		local d = DEKOR_ID[a]
		if not d then return { galat = "Hiasan tidak ada." } end
		if not table.find(s.data.punya.dekor, a) then
			if koinPemain(player) < d.harga then return { galat = "Koinmu kurang (" .. d.harga .. " koin)." } end
			if not bayar(player, d.harga) then return { galat = "Belum bisa dibayar, coba lagi." } end
			table.insert(s.data.punya.dekor, a)
			table.insert(s.data.dekor, a)
			pesan = d.ikon .. " " .. d.nama .. " dipasang di pekaranganmu!"
		else
			local i = table.find(s.data.dekor, a)
			if i then table.remove(s.data.dekor, i) else table.insert(s.data.dekor, a) end
			pesan = d.ikon .. " " .. d.nama .. (i and " dilepas." or " dipasang.")
		end
		terapkanLuar(player)
		simpanNanti(player)
	else
		return { galat = "Pilihan tidak ada." }
	end
	local r = keadaan(player)
	r.pesan = pesan
	return r
end

pintu.OnServerInvoke = function(player, op, a, b, c)
	if typeof(op) ~= "string" then return { galat = "Pilihan tidak ada." } end
	local ok, r = pcall(aksi, player, op, a, b, c)
	if ok then return r end
	warn("[HiasRumah] " .. tostring(r))
	return { galat = "Ada gangguan, coba lagi." }
end

-- ===== pemain =====
local function aturNo(player)
	local s = sesi[player]
	if not s then return end
	local no = tonumber(player:GetAttribute("DK_No"))
	if no == s.no then return end
	s.no = no
	buangDalam(s)
	terapkanLuar(player)
end

local function masuk(player)
	local s = { data = rapikan(nil), termuat = false }
	s.masuk = masukRumah
	s.keluar = keluarRumah
	sesi[player] = s
	if store then
		local ok, d = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
		if sesi[player] ~= s then return end
		if ok then
			s.data = rapikan(d)
			s.termuat = true
		else
			warn("[HiasRumah] data " .. player.Name .. " gagal dimuat")
		end
	end
	player:GetAttributeChangedSignal("DK_No"):Connect(function() aturNo(player) end)
	player.CharacterAdded:Connect(function() player:SetAttribute("DK_DiRumah", nil) end)
	aturNo(player)
end

Players.PlayerAdded:Connect(masuk)
for _, p in ipairs(Players:GetPlayers()) do task.spawn(masuk, p) end
Players.PlayerRemoving:Connect(function(player)
	local s = sesi[player]
	if s then
		kembalikanLuar(s)
		buangDalam(s)
	end
	simpan(player)
	sesi[player] = nil
end)
game:BindToClose(function()
	for _, p in ipairs(Players:GetPlayers()) do simpan(p) end
end)

-- pemain yang pindah tempat (tombol Rumah, bus) saat di dalam rumah: tanda DK_DiRumah dihapus
task.spawn(function()
	while true do
		task.wait(1)
		for player, s in pairs(sesi) do
			if player:GetAttribute("DK_DiRumah") then
				local hrp = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
				local L = s.no and letakRumah(s.no)
				if not hrp or not L or hrp.Position.Y < L.hc.Y + TINGGI_DALAM - 30 then player:SetAttribute("DK_DiRumah", nil) end
			end
		end
	end
end)
