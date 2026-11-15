--[[
  DealerKendaraan (Script) - Dealer Kendaraan di Kotak Curug: beli kendaraan pakai koin, lalu dikendarai keliling desa.
  Aturan sama dengan game web (worker.js: KENDARAAN, aksi "dealer"; game.js: KEND, WARNA_KENDARAAN).
  Tempat: ServerScriptService.DealerKendaraan.

  Aturan web yang disalin:
    - Harga: Sepeda Gunung 150, Motor Sport 400, Sedan Warga 800, Hatch Reli 900, Jip Garuk 1000, Kotak GT 1200 koin.
    - Satu warga hanya bisa punya satu dari tiap jenis. Cat ulang 50 koin. Enam warna.
    - Beli dan cat ulang hanya di lahan dealer (Curug).
    - Kendaraan terparkir (terlihat semua pemain). Tombol "Naik" hanya muncul saat dekat kendaraan sendiri
      (Huda 15 Nov 2026: "Tombol naik harusnya ada saat dekat kendaraan warga"). Turun = kendaraan diparkir di tempat itu.
      Warga yang sudah menautkan akun: kendaraannya terparkir di pekarangan rumah (PARKIR web) saat masuk game
      dan saat menekan tombol "Rumah". Belum tertaut: di tempat parkir terakhir, atau di dealer.
    - Kecepatan = kali kecepatan jalan kaki (1,9 sampai 3,5). Saat naik kendaraan tidak bisa lompat.
  Seperti di web, kendaraan menempel pada tokoh (bukan fisika mobil), jadi kemudinya sama dengan jalan kaki.
  Belum ada di sini: membonceng warga lain.

  Simpanan: DataStore DuniaKotak_Garasi_v1, kunci p_<UserId> = { g = { { m = jenis, w = warna 0..5 } }, p = urutan dipakai (1..n) atau 0,
            pk = { x, y, z, a } tempat parkir terakhir (a = arah hadap, radian) }.
  Model parkir: workspace.DK_Parkir.pk_<UserId> (atribut pemilik, pos, ikon). ServerStorage.DK_ParkirRumah (BindableEvent)
  dipanggil RumahWarga saat pemain pulang: kendaraan yang terparkir ikut dipindah ke rumah.
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

-- bentuk kendaraan sama dengan game web (ReplicatedStorage.DK_ModelKendaraan, dari js/aset/mobil.js)
local MK = require(ReplicatedStorage:WaitForChild("DK_ModelKendaraan"))

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
local lamaP = workspace:FindFirstChild("DK_Parkir")
if lamaP then lamaP:Destroy() end
local folderParkir = Instance.new("Folder")
folderParkir.Name = "DK_Parkir"
folderParkir.Parent = workspace
local DEKAT_NAIK = 16 -- jarak (stud) dari kendaraan terparkir supaya bisa naik
local PARKIR = { 1.7 * 6.25, 2.05 * 6.25 } -- web PARKIR [1,7; 2,05] x VS (5 satuan web = 6,25 stud) dari tengah kavling
local GESER_DUSUN = { wetan = Vector3.zero, kulon = Vector3.new(-10000, 0, 0), curug = Vector3.new(0, 0, -10000), tlaga = Vector3.new(0, 0, 10000) }
local Kavling
pcall(function() Kavling = require(ServerStorage:WaitForChild("DK_Kavling", 10)) end)

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

local function dusunNo(no)
	return no > 860 and "segara" or no > 660 and "tlaga" or no > 460 and "curug" or no > 260 and "kulon" or "wetan"
end

-- tempat parkir di pekarangan rumah warga No. `no` (sama dengan pasangParkir di web): CFrame menghadap jalan, atau nil
local function parkirRumah(no)
	no = tonumber(no)
	if not no or not Kavling then return nil end
	local d = dusunNo(no)
	local k = Kavling[d] and Kavling[d][no]
	local akar = workspace:FindFirstChild("DuniaKotak3")
	local f = akar and akar:FindFirstChild(d)
	if not k or not f then return nil end
	local geser = f:GetAttribute("geser")
	if typeof(geser) ~= "Vector3" then geser = GESER_DUSUN[d] or Vector3.zero end
	local dir = k[4]
	local p = geser + Vector3.new(k[5] + dir * PARKIR[1], k[6], k[7] + dir * PARKIR[2])
	return CFrame.lookAt(p, p + Vector3.new(-dir, 0, 0))
end

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
	local pk
	if typeof(d) == "table" and typeof(d.pk) == "table" and tonumber(d.pk[1]) and tonumber(d.pk[2]) and tonumber(d.pk[3]) then
		pk = { tonumber(d.pk[1]), tonumber(d.pk[2]), tonumber(d.pk[3]), tonumber(d.pk[4]) or 0 }
	end
	return { g = g, p = p, pk = pk }
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

-- simpan beberapa detik setelah perubahan terakhir, supaya beli lalu cat ulang tidak mengirim dua permintaan beruntun
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

-- ===== kendaraan terparkir =====
-- kendaraan bawaan map (dipanggang dari web) di tempat parkir rumah disembunyikan selama kendaraan Roblox pemiliknya parkir di sana
local GridPeta
pcall(function() GridPeta = require(ServerStorage:WaitForChild("DK_GridPeta", 10)) end)
local function sembunyikanBawaan(s, cf)
	if not GridPeta then return end
	local ban = {}
	for _, q in ipairs(GridPeta.di(cf.Position + Vector3.new(0, 2, 0), Vector3.new(14, 6, 14))) do
		if q:IsA("Part") and q.Shape == Enum.PartType.Cylinder and q.Color:ToHex() == "18191d" then table.insert(ban, q.Position) end
	end
	if #ban == 0 then return end
	local lo, hi = ban[1], ban[1]
	for _, b in ipairs(ban) do lo, hi = lo:Min(b), hi:Max(b) end
	local tengah = (lo + hi) / 2
	local ukuran = (hi - lo) + Vector3.new(5, 0, 5)
	s.bawaan = {}
	for _, q in ipairs(GridPeta.di(Vector3.new(tengah.X, cf.Y + 3.5, tengah.Z), Vector3.new(ukuran.X + 4, 7, ukuran.Z + 4))) do
		local h = q.Size / 2
		if math.abs(q.Position.X - tengah.X) + h.X <= ukuran.X / 2 + 0.5 and math.abs(q.Position.Z - tengah.Z) + h.Z <= ukuran.Z / 2 + 0.5
			and q.Position.Y > cf.Y + 0.2 and q.Transparency < 1 then
			table.insert(s.bawaan, { q, q.Transparency, q.CanCollide })
			q.Transparency = 1
			q.CanCollide = false
		end
	end
end
local function tampilkanBawaan(s)
	if not s.bawaan then return end
	for _, b in ipairs(s.bawaan) do
		if b[1].Parent then b[1].Transparency, b[1].CanCollide = b[2], b[3] end
	end
	s.bawaan = nil
end

local function buangParkir(s)
	if s.parkir then
		s.parkir:Destroy()
		s.parkir = nil
	end
	tampilkanBawaan(s)
end

-- taruh kendaraan yang dipakai pada CFrame `cf` (akar = tanah, menghadap -Z); dirumah = parkir di pekarangan rumah
local function parkir(player, cf, dirumah)
	local s = sesi[player]
	if not s then return end
	buangParkir(s)
	local k = s.data.g[s.data.p]
	if not k or not cf then return end
	local _, ry = cf:ToOrientation()
	s.data.pk = { math.round(cf.X * 10) / 10, math.round(cf.Y * 10) / 10, math.round(cf.Z * 10) / 10, math.round(ry * 100) / 100 }
	if (player:GetAttribute("DK_Naik") or "") ~= "" then return end
	if dirumah then sembunyikanBawaan(s, cf) end
	local model = MK.buat(k.m, WARNA[k.w + 1][2], { cf = cf })
	model.Name = "pk_" .. player.UserId
	model.ModelStreamingMode = Enum.ModelStreamingMode.Atomic
	model:SetAttribute("pemilik", player.UserId)
	model:SetAttribute("pos", cf.Position)
	model:SetAttribute("ikon", KEND[k.m].ikon)
	local g = Instance.new("BillboardGui")
	g.Size = UDim2.fromOffset(200, 24)
	g.StudsOffsetWorldSpace = Vector3.new(0, 7, 0)
	g.MaxDistance = 45
	local l = Instance.new("TextLabel")
	l.Size = UDim2.fromScale(1, 1)
	l.BackgroundTransparency = 1
	l.TextColor3 = Color3.new(1, 1, 1)
	l.TextStrokeTransparency = 0.4
	l.FontFace = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
	l.TextSize = 13
	l.Text = KEND[k.m].ikon .. " " .. KEND[k.m].nama .. " · " .. player.DisplayName
	l.Parent = g
	g.Parent = model.PrimaryPart
	model.Parent = folderParkir
	s.parkir = model
end

-- tanah di bawah titik p (abaikan tokoh dan kendaraan)
local function tanahDi(p, abaikan)
	local rp = RaycastParams.new()
	rp.FilterType = Enum.RaycastFilterType.Exclude
	rp.FilterDescendantsInstances = { folder, folderParkir, abaikan }
	local r = workspace:Raycast(p + Vector3.new(0, 4, 0), Vector3.new(0, -60, 0), rp)
	return r and r.Position
end

-- tempat parkir awal: rumah (sudah tertaut) > parkir terakhir > dealer
local function parkirAwal(player)
	local s = sesi[player]
	if not s or not s.data.g[s.data.p] then return end
	local cf = parkirRumah(player:GetAttribute("DK_No"))
	if cf then return parkir(player, cf, true) end
	local pk = s.data.pk
	if pk then return parkir(player, CFrame.new(pk[1], pk[2], pk[3]) * CFrame.Angles(0, pk[4], 0)) end
	local d = titikDealer()
	if d then
		local t = tanahDi(d + Vector3.new(0, 20, JARAK_Z - 8)) or (d + Vector3.new(0, 0, JARAK_Z - 8))
		parkir(player, CFrame.lookAt(t, t + Vector3.new(1, 0, 0)))
	end
end

-- parkir di samping pemain (sesudah beli/ganti di dealer)
local function parkirSamping(player)
	local hrp = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if not hrp then return parkirAwal(player) end
	local p = hrp.Position + hrp.CFrame.RightVector * 9
	local t = tanahDi(p, player.Character) or (p - Vector3.new(0, 3, 0))
	parkir(player, CFrame.lookAt(t, t + hrp.CFrame.LookVector * Vector3.new(1, 0, 1)))
end

local function dekatParkir(player)
	local s = sesi[player]
	local hrp = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if not s or not s.parkir or not hrp then return false end
	local p = s.parkir:GetAttribute("pos")
	return (Vector3.new(p.X, 0, p.Z) - Vector3.new(hrp.Position.X, 0, hrp.Position.Z)).Magnitude <= DEKAT_NAIK and math.abs(p.Y - hrp.Position.Y) < 20
end

-- turun dari kendaraan; parkirSini = kendaraan diparkir di tempat pemain turun, pemain bergeser ke samping
local function turun(player, parkirSini)
	local s = sesi[player]
	local cfParkir, lebar
	if s and s.model then
		local hrp = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
		if parkirSini and hrp then
			local t = tanahDi(hrp.Position, player.Character)
			if t then
				local depan = hrp.CFrame.LookVector * Vector3.new(1, 0, 1)
				if depan.Magnitude < 0.01 then depan = Vector3.new(0, 0, -1) end
				cfParkir = CFrame.lookAt(t, t + depan.Unit)
				lebar = s.model:GetExtentsSize().X / (s.skala or 1)
			end
		end
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
		if l and l[5] then hum.HipHeight = l[5] end
	end
	if s then s.lama = nil end
	if cfParkir then
		parkir(player, cfParkir)
		s.dipindah = true
		local hrp = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
		if hrp then
			task.defer(function()
				if hrp.Parent then hrp.CFrame = hrp.CFrame - hrp.CFrame.RightVector * (lebar / 2 + 2.5) + Vector3.new(0, 0.5, 0) end
			end)
		end
	end
end

local function naik(player)
	local s = sesi[player]
	local k = s and s.data.g[s.data.p]
	if not k then return "Belum punya kendaraan. Beli dulu di Dealer Kendaraan, Dusun Curug." end
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not hrp or not hum or hum.Health <= 0 then return "Tokohmu belum siap." end
	if not dekatParkir(player) and not diDealer(player) then
		return "Dekati kendaraanmu dulu. " .. (s.parkir and "Kendaraanmu terparkir di tempat terakhir kamu turun." or "")
	end
	if player:GetAttribute("DK_DiRumah") then return "Keluar rumah dulu." end
	turun(player)
	buangParkir(s)
	-- pinggul tokoh diturunkan/dinaikkan ke tinggi kursi (seperti angkat di game web), kendaraan tetap menapak tanah
	local pinggulBerdiri, skala = MK.ukurTokoh(char)
	local off, dPinggul = MK.naik(k.m, pinggulBerdiri, skala)
	local hipLama = hum.HipHeight
	local tanah
	if hum.RigType == Enum.HumanoidRigType.R6 then
		tanah = -3
	else
		hum.HipHeight = math.max(0.2, hipLama + dPinggul)
		tanah = -(hum.HipHeight + hrp.Size.Y / 2) -- jarak tanah dari tengah HumanoidRootPart setelah pinggul diatur
	end
	local model = MK.buat(k.m, WARNA[k.w + 1][2], { las = hrp, cf = hrp.CFrame * CFrame.new(off + Vector3.new(0, tanah, 0)), skala = skala })
	model.Name = "kend_" .. player.UserId
	model.Parent = folder
	s.model = model
	s.skala = skala
	s.lama = { hum.WalkSpeed, hum.UseJumpPower, hum.JumpPower, hum.JumpHeight, hipLama }
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
		hargaCat = HARGA_CAT, diDealer = diDealer(player), naik = player:GetAttribute("DK_Naik") or "", dekat = dekatParkir(player),
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
		parkirSamping(player)
		s.dipindah = true
		simpanNanti(player)
		pesan = "🎉 " .. KEND[m].nama .. " jadi milikmu!"
	elseif op == "pakai" then
		local i = tonumber(a)
		if not i or (i ~= 0 and not s.data.g[i]) then return { galat = "Kendaraan tidak ada di garasi." } end
		local lama = s.data.p
		s.data.p = i
		if player:GetAttribute("DK_Naik") ~= "" then turun(player) end
		if lama ~= i then
			if s.parkir and i ~= 0 then
				parkir(player, s.parkir.PrimaryPart.CFrame, s.bawaan ~= nil)
			elseif i ~= 0 then
				parkirSamping(player)
			else
				buangParkir(s)
			end
			simpanNanti(player)
		end
	elseif op == "cat" then
		local k, w = s.data.g[tonumber(a) or 0], tonumber(b)
		if not k or not w or w ~= math.floor(w) or w < 0 or w >= #WARNA then return { galat = "Pilihan tidak ada." } end
		if not diDealer(player) then return { galat = "Cat ulang hanya di Dealer Kendaraan, Dusun Curug." } end
		if koinPemain(player) < HARGA_CAT then return { galat = "Koinmu kurang (" .. HARGA_CAT .. " koin)." } end
		if not potong(player, HARGA_CAT) then return { galat = "Koin belum bisa dipotong, coba lagi." } end
		k.w = w
		if player:GetAttribute("DK_Naik") ~= "" then turun(player) end
		if s.parkir and s.data.g[s.data.p] == k then parkir(player, s.parkir.PrimaryPart.CFrame, s.bawaan ~= nil) end
		simpanNanti(player)
		pesan = "🎨 Kendaraanmu dicat ulang!"
	elseif op == "naik" then
		local galat = naik(player)
		if galat then return { galat = galat } end
	elseif op == "turun" then
		turun(player, true)
		simpanNanti(player)
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
	player.CharacterRemoving:Connect(function(char)
		local s = sesi[player]
		local naikTadi = s and s.model ~= nil
		local hrp = char:FindFirstChild("HumanoidRootPart")
		local t = naikTadi and hrp and hrp.Position.Y > workspace.FallenPartsDestroyHeight + 50 and tanahDi(hrp.Position, char)
		if s and s.model then
			s.model:Destroy()
			s.model = nil
		end
		if s then s.lama = nil end
		player:SetAttribute("DK_Naik", "")
		if naikTadi then
			if t then
				local depan = hrp.CFrame.LookVector * Vector3.new(1, 0, 1)
				parkir(player, CFrame.lookAt(t, t + (depan.Magnitude > 0.01 and depan.Unit or Vector3.new(0, 0, -1))))
			else
				parkirAwal(player)
			end
		end
	end)
	muat(player)
	parkirAwal(player)
	-- akun web baru tertaut (atau data RumahWarga baru termuat): kendaraan pindah ke pekarangan rumah
	player:GetAttributeChangedSignal("DK_No"):Connect(function()
		local s = sesi[player]
		if s and not s.dipindah and (player:GetAttribute("DK_Naik") or "") == "" then parkirAwal(player) end
	end)
end

Players.PlayerAdded:Connect(pasang)
for _, p in ipairs(Players:GetPlayers()) do
	task.spawn(pasang, p)
end
Players.PlayerRemoving:Connect(function(player)
	local s = sesi[player]
	if s and s.model then s.model:Destroy() end
	if s then buangParkir(s) end
	simpan(player)
	sesi[player] = nil
end)
game:BindToClose(function()
	for _, p in ipairs(Players:GetPlayers()) do
		simpan(p)
	end
end)

-- tombol "Rumah" (RumahWarga): kendaraan yang terparkir ikut pulang ke pekarangan rumah
do
	local l = ServerStorage:FindFirstChild("DK_ParkirRumah")
	if l then l:Destroy() end
	local ev = Instance.new("BindableEvent")
	ev.Name = "DK_ParkirRumah"
	ev.Parent = ServerStorage
	ev.Event:Connect(function(player)
		local s = sesi[player]
		if not s or (player:GetAttribute("DK_Naik") or "") ~= "" then return end
		local cf = parkirRumah(player:GetAttribute("DK_No"))
		if cf and s.data.g[s.data.p] then
			parkir(player, cf, true)
			simpanNanti(player)
		end
	end)
end
