--[[
  DUNIA KOTAK (Roblox) - KEBUN BERSAMA v1
  Tempat: ServerScriptService.KebunBersama (Script biasa). Butuh skrip DataWarga.

  Aturan disamakan dengan kebun di game web:
  - Tiap pemain dapat SATU petak dan hanya bisa menanam satu tanaman sekaligus.
  - Bibit: Tomat 10 koin, Jagung 20 koin, Cabai 30 koin.
    Tomat gratis kalau koin kurang dari 10, supaya pemain baru tetap bisa mulai.
  - Siap panen 6 jam setelah tanam (jam nyata, tetap tumbuh walau pemain keluar).
  - Panen = 5 hasil + 2 permata.
  - Hasil dijual di warung: Tomat 6, Jagung 9, Cabai 14 koin per buah, paling banyak 60 hasil per hari (WIB).

  LETAK: kebun dibangun di POSISI di bawah (pojok kiri depan kebun), menghadap sumbu Z.
  Ubah angka POSISI di Studio kalau letaknya menabrak bangunan.
]]

local POSISI = Vector3.new(-422.5, 0.5, -1269) -- lahan kosong di pojok barat laut Kotak Wetan, tepat di utara jalan
local JUMLAH_PETAK = 24
local PER_BARIS = 6
local PANEN_JEDA = 6 * 3600
local PANEN_PERMATA = 2
local BATAS_JUAL = 60
local BIBIT = {
	tomat = { nama = "Tomat", harga = 10, hasil = 5, jual = 6, warna = Color3.fromRGB(226, 60, 50) },
	jagung = { nama = "Jagung", harga = 20, hasil = 5, jual = 9, warna = Color3.fromRGB(245, 200, 60) },
	cabai = { nama = "Cabai", harga = 30, hasil = 5, jual = 14, warna = Color3.fromRGB(200, 30, 30) },
}
local URUT = { "tomat", "jagung", "cabai" }

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ServerStorage = game:GetService("ServerStorage")

local DK_Koin = ServerStorage:WaitForChild("DK_Koin", 30)
local DK_Permata = ServerStorage:WaitForChild("DK_Permata", 30)
if not DK_Koin or not DK_Permata then
	warn("[KebunBersama] skrip DataWarga belum terpasang; kebun tidak dijalankan")
	return
end

local store
pcall(function() store = DataStoreService:GetDataStore("DuniaKotak_Kebun_v1") end)

local data = {}   -- [player] = { b, t, tas = {tomat=n,...}, jh, jn } ; nil kalau gagal dimuat
local petakOf = {} -- [player] = indeks petak
local petak = {}   -- [i] = { tanah, tanaman, buah, label, pemilik }

local function hariWIB()
	return os.date("!%Y-%m-%d", os.time() + 7 * 3600)
end

local function kabari(player, teks)
	local pg = player:FindFirstChildOfClass("PlayerGui")
	if not pg then return end
	local lama = pg:FindFirstChild("DK_KabarKebun")
	if lama then lama:Destroy() end
	local gui = Instance.new("ScreenGui")
	gui.Name = "DK_KabarKebun"
	gui.ResetOnSpawn = false
	local t = Instance.new("TextLabel")
	t.AnchorPoint = Vector2.new(0.5, 0)
	t.Position = UDim2.new(0.5, 0, 0.2, 0)
	t.Size = UDim2.new(0.8, 0, 0, 44)
	t.BackgroundColor3 = Color3.fromRGB(44, 49, 80)
	t.BackgroundTransparency = 0.1
	t.TextColor3 = Color3.new(1, 1, 1)
	t.Font = Enum.Font.GothamBold
	t.TextScaled = true
	t.Text = teks
	local batas = Instance.new("UISizeConstraint")
	batas.MaxSize = Vector2.new(560, 44)
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
	task.delay(5, function() gui:Destroy() end)
end

---------------------------------------------------------------------
-- Bangun kebun
---------------------------------------------------------------------
local function balok(induk, nama, ukuran, pos, warna, bahan)
	local p = Instance.new("Part")
	p.Name = nama
	p.Anchored = true
	p.Size = ukuran
	p.Position = pos
	p.Color = warna
	p.Material = bahan or Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = induk
	return p
end

local function tulisan(induk, teks, tinggi)
	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.new(0, 150, 0, 32)
	bb.StudsOffset = Vector3.new(0, tinggi, 0)
	bb.AlwaysOnTop = false
	bb.MaxDistance = 30
	local t = Instance.new("TextLabel")
	t.Size = UDim2.new(1, 0, 1, 0)
	t.BackgroundTransparency = 1
	t.TextColor3 = Color3.new(1, 1, 1)
	t.TextStrokeTransparency = 0
	t.Font = Enum.Font.GothamBold
	t.TextScaled = true
	t.Text = teks
	t.Parent = bb
	bb.Parent = induk
	return t
end

local function tombol(induk, aksi, benda, jarak)
	local pp = Instance.new("ProximityPrompt")
	pp.ActionText = aksi
	pp.ObjectText = benda
	pp.HoldDuration = 0.4
	pp.MaxActivationDistance = jarak or 10
	pp.RequiresLineOfSight = false
	pp.Parent = induk
	return pp
end

local lama = workspace:FindFirstChild("KebunBersama")
if lama then lama:Destroy() end
local root = Instance.new("Model")
root.Name = "KebunBersama"
root.Parent = workspace

local LEBAR, JARAK = 8, 11
local baris = math.ceil(JUMLAH_PETAK / PER_BARIS)
balok(root, "Alas", Vector3.new(PER_BARIS * JARAK + 6, 0.4, baris * JARAK + 22),
	POSISI + Vector3.new((PER_BARIS * JARAK) / 2 - 1.5, -0.1, (baris * JARAK) / 2 + 6.5),
	Color3.fromRGB(150, 220, 120))

for i = 1, JUMLAH_PETAK do
	local kol = (i - 1) % PER_BARIS
	local brs = math.floor((i - 1) / PER_BARIS)
	local pusat = POSISI + Vector3.new(kol * JARAK + LEBAR / 2, 0.4, brs * JARAK + LEBAR / 2 + 16)
	local tanah = balok(root, "Petak" .. i, Vector3.new(LEBAR, 0.6, LEBAR), pusat, Color3.fromRGB(120, 85, 60), Enum.Material.Ground)
	local tanaman = balok(root, "Tanaman" .. i, Vector3.new(1, 1, 1), pusat + Vector3.new(0, 0.8, 0), Color3.fromRGB(70, 170, 70))
	tanaman.CanCollide = false
	tanaman.Transparency = 1
	local buah = balok(root, "Buah" .. i, Vector3.new(1.6, 1.6, 1.6), pusat + Vector3.new(0, 5, 0), Color3.new(1, 0, 0))
	buah.CanCollide = false
	buah.Transparency = 1
	local label = tulisan(tanah, "Petak kosong", 6)
	local pp = tombol(tanah, "Panen", "Petak " .. i, 9)
	petak[i] = { tanah = tanah, tanaman = tanaman, buah = buah, label = label, pemilik = nil, pusat = pusat, panen = pp }
end

-- kios bibit: 3 meja, satu per bibit
local kios = {}
for k, id in ipairs(URUT) do
	local b = BIBIT[id]
	local pos = POSISI + Vector3.new((k - 1) * 9 + 4, 1.6, 4)
	local meja = balok(root, "Bibit_" .. id, Vector3.new(6, 3, 3), pos, b.warna)
	tulisan(meja, "Bibit " .. b.nama .. "\n" .. b.harga .. " koin", 4)
	kios[id] = tombol(meja, "Tanam " .. b.nama, b.harga .. " koin", 10)
end
local warung = balok(root, "Warung", Vector3.new(8, 4, 3), POSISI + Vector3.new(38, 2.1, 4), Color3.fromRGB(255, 255, 255))
tulisan(warung, "Warung\nJual hasil panen", 4.5)
local jualPrompt = tombol(warung, "Jual semua", "Hasil panen", 10)

---------------------------------------------------------------------
-- Tampilan petak
---------------------------------------------------------------------
local function sisaTeks(detik)
	local j = math.floor(detik / 3600)
	local m = math.floor((detik % 3600) / 60)
	if j > 0 then return j .. " jam " .. m .. " mnt" end
	return math.max(1, m) .. " mnt"
end

local function segarkan(i)
	local p = petak[i]
	local player = p.pemilik
	local d = player and data[player]
	if not player then
		p.label.Text = "Petak kosong"
		p.tanaman.Transparency = 1
		p.buah.Transparency = 1
		p.panen.Enabled = false
		return
	end
	if not d or not d.b or not BIBIT[d.b] then
		p.label.Text = "Kebun " .. player.DisplayName .. "\nBeli bibit di kios"
		p.tanaman.Transparency = 1
		p.buah.Transparency = 1
		p.panen.Enabled = false
		return
	end
	local b = BIBIT[d.b]
	local maju = math.clamp((os.time() - d.t) / PANEN_JEDA, 0, 1)
	local tinggi = 1 + 4 * maju
	p.tanaman.Size = Vector3.new(1.4 + maju, tinggi, 1.4 + maju)
	p.tanaman.Position = p.pusat + Vector3.new(0, 0.3 + tinggi / 2, 0)
	p.tanaman.Transparency = 0
	p.buah.Color = b.warna
	p.buah.Position = p.pusat + Vector3.new(0, 0.3 + tinggi + 0.8, 0)
	if maju >= 1 then
		p.buah.Transparency = 0
		p.label.Text = "Kebun " .. player.DisplayName .. "\n" .. b.nama .. " siap panen!"
		p.panen.Enabled = true
	else
		p.buah.Transparency = 1
		p.label.Text = "Kebun " .. player.DisplayName .. "\n" .. b.nama .. " " .. sisaTeks(d.t + PANEN_JEDA - os.time())
		p.panen.Enabled = false
	end
end

---------------------------------------------------------------------
-- Aksi
---------------------------------------------------------------------
local function tanam(player, id)
	local d, i = data[player], petakOf[player]
	if not d then return kabari(player, "Data kebunmu belum termuat. Coba lagi sebentar.") end
	if not i then return kabari(player, "Semua petak sedang dipakai. Coba lagi nanti.") end
	if d.b and BIBIT[d.b] then return kabari(player, "Kebunmu masih ada tanamannya.") end
	local b = BIBIT[id]
	local ls = player:FindFirstChild("leaderstats")
	local koin = ls and ls:FindFirstChild("Koin")
	local harga = b.harga
	if id == "tomat" and koin and koin.Value < b.harga then harga = 0 end
	if harga > 0 and not DK_Koin:Invoke(player, -harga) then
		return kabari(player, "Koinmu kurang (" .. harga .. " koin).")
	end
	d.b, d.t = id, os.time()
	segarkan(i)
	kabari(player, b.nama .. " ditanam di Petak " .. i .. ". Siap panen 6 jam lagi.")
end

local function panen(player, i)
	local d = data[player]
	if petak[i].pemilik ~= player then return kabari(player, "Ini bukan petakmu.") end
	if not d or not d.b or not BIBIT[d.b] then
		if d then d.b, d.t = nil, 0 end
		return kabari(player, "Tanam bibit dulu di kebunmu.")
	end
	if os.time() < d.t + PANEN_JEDA then return kabari(player, "Tanamanmu belum siap dipanen.") end
	local b = BIBIT[d.b]
	d.tas[d.b] = (d.tas[d.b] or 0) + b.hasil
	d.b, d.t = nil, 0
	DK_Permata:Invoke(player, PANEN_PERMATA)
	segarkan(i)
	kabari(player, "Panen " .. b.hasil .. " " .. b.nama .. " dan +" .. PANEN_PERMATA .. " permata. Jual di warung.")
end

local function jual(player)
	local d = data[player]
	if not d then return kabari(player, "Data kebunmu belum termuat. Coba lagi sebentar.") end
	local hari = hariWIB()
	if d.jh ~= hari then d.jh, d.jn = hari, 0 end
	local n, dapat = 0, 0
	for _, id in ipairs(URUT) do
		local punya = d.tas[id] or 0
		local k = math.min(punya, BATAS_JUAL - d.jn - n)
		if k > 0 then
			d.tas[id] = punya - k
			n += k
			dapat += k * BIBIT[id].jual
		end
	end
	if n == 0 then
		if d.jn >= BATAS_JUAL then
			return kabari(player, "Warung sudah membeli " .. BATAS_JUAL .. " hasil darimu hari ini. Jual lagi besok.")
		end
		return kabari(player, "Belum ada hasil panen untuk dijual.")
	end
	d.jn += n
	DK_Koin:Invoke(player, dapat)
	kabari(player, "Terjual " .. n .. " hasil: +" .. dapat .. " koin.")
end

for id, pp in pairs(kios) do
	pp.Triggered:Connect(function(player) tanam(player, id) end)
end
jualPrompt.Triggered:Connect(jual)
for i, p in ipairs(petak) do
	p.panen.Enabled = false
	p.panen.Triggered:Connect(function(player) panen(player, i) end)
end

---------------------------------------------------------------------
-- Data pemain
---------------------------------------------------------------------
local function simpan(player)
	local d = data[player]
	if not d or not store then return end
	pcall(function() store:SetAsync("p_" .. player.UserId, d) end)
end

local function masuk(player)
	for i, p in ipairs(petak) do
		if not p.pemilik then
			p.pemilik = player
			petakOf[player] = i
			break
		end
	end
	local ok, hasil = false, nil
	if store then
		for coba = 1, 3 do
			ok, hasil = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
			if ok then break end
			task.wait(1.5 * coba)
		end
	end
	if not player.Parent then return end
	if ok then
		local d = typeof(hasil) == "table" and hasil or {}
		d.tas = typeof(d.tas) == "table" and d.tas or {}
		d.t = tonumber(d.t) or 0
		d.jn = tonumber(d.jn) or 0
		data[player] = d
	else
		warn("[KebunBersama] data kebun " .. player.Name .. " gagal dimuat; tidak akan disimpan")
	end
	if petakOf[player] then segarkan(petakOf[player]) end
end

Players.PlayerAdded:Connect(masuk)
for _, p in ipairs(Players:GetPlayers()) do task.spawn(masuk, p) end

Players.PlayerRemoving:Connect(function(player)
	simpan(player)
	data[player] = nil
	local i = petakOf[player]
	petakOf[player] = nil
	if i then
		petak[i].pemilik = nil
		segarkan(i)
	end
end)

task.spawn(function()
	local hitung = 0
	while true do
		task.wait(20)
		hitung += 1
		for i, p in ipairs(petak) do
			if p.pemilik then segarkan(i) end
		end
		if hitung % 6 == 0 then
			for _, pl in ipairs(Players:GetPlayers()) do task.spawn(simpan, pl) end
		end
	end
end)

game:BindToClose(function()
	for _, pl in ipairs(Players:GetPlayers()) do task.spawn(simpan, pl) end
	task.wait(3)
end)
