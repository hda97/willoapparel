--[[
  PelariKalcer (Script) - lari 1 KM tiga lajur mengikuti game web /pelarikalcer/ (pelarikalcer-kotak).

  Aturan disamakan dengan worker.js (PK_*):
    - 7 rute 1 KM. Rute ke-n terbuka setelah finish sah di rute ke-(n-1).
    - Koin yang dipungut di jalan masuk dompet: paling banyak 50 per lari, 150 per hari, dan tidak lebih dari
      0,8 koin per detik lari. Lari di bawah 45 detik tidak dicatat.
    - Finish sah: waktu game (detik asli x 3,4) minimal 4:00. Rekor = waktu game tercepat. Finish pertama tiap hari +15 koin.
  Masuk dari Arena Pelari Kalcer di Dusun Kulon (tombol "Ikut Lari"). Lintasan dibangun jauh dari dusun.
  Pelari digerakkan skrip klien (PelariKalcer.client.lua); server mengukur jarak dan waktu sendiri dari posisi tokoh.

  Belum ada di versi Roblox: toko sepatu, jam, bekal, dan baju lari; misi harian lari; hantu rekor; foto struk.

  Simpanan: DataStore DuniaKotak_Pelari_v1, kunci p_<UserId> = { h = hari, dapat = koin lari hari itu, fh = finish hari itu,
            rb = rute tertinggi yang terbuka, r = rekor (detik game), st = hari beruntun, sh = hari finish terakhir }.
            OrderedDataStore DuniaKotak_PelariTop, kunci UserId, nilai rekor x 10.
  Pintu: ReplicatedStorage.DK_Pelari (RemoteFunction), DK_PelariBuka (RemoteEvent).
         ServerStorage.DK_PelariFinish (BindableEvent, dipicu tiap finish sah: player) untuk skrip lain.
  Pasang sebagai Script di ServerScriptService. Butuh ReplicatedStorage.DK_PelariLintasan (ModuleScript) dan DataWarga (DK_Koin).
]]

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local DataStoreService = game:GetService("DataStoreService")

local P = require(ReplicatedStorage:WaitForChild("DK_PelariLintasan"))
local S, XS = P.S, P.XS
local ARENA = Vector3.new(325, 130, -1366.25) -- titik tengah lahan Arena Pelari Kalcer (teras 9 Kulon, stud, belum digeser)
local GESER_KULON = Vector3.new(-10000, 0, 0)
local FONT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local TINGGI = 3 -- tinggi HumanoidRootPart di atas jalan

local store
do
	local ok, s = pcall(function() return DataStoreService:GetDataStore("DuniaKotak_Pelari_v1") end)
	if ok then store = s else warn("[PelariKalcer] DataStore tidak tersedia: " .. tostring(s)) end
end

local function buatPintu(kelas, nama, induk)
	local l = induk:FindFirstChild(nama)
	if l then l:Destroy() end
	local p = Instance.new(kelas)
	p.Name = nama
	p.Parent = induk
	return p
end
local pintu = buatPintu("RemoteFunction", "DK_Pelari", ReplicatedStorage)
local bukaEv = buatPintu("RemoteEvent", "DK_PelariBuka", ReplicatedStorage)
local finishEv = buatPintu("BindableEvent", "DK_PelariFinish", ServerStorage)

local lama = workspace:FindFirstChild("DK_Pelari")
if lama then lama:Destroy() end
local folder = Instance.new("Folder")
folder.Name = "DK_Pelari"
folder.Parent = workspace

-- ---------- bangun lintasan ----------
local function rgb(r, g, b) return Color3.fromRGB(r, g, b) end
local function balok(induk, ukuran, cf, warna, tabrak)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = tabrak == true
	p.CanTouch = false
	p.CanQuery = tabrak == true
	p.Size = ukuran
	p.CFrame = cf
	p.Color = warna
	p.Material = Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = induk
	return p
end

local function tulisan(part, teks, ukuran)
	local b = Instance.new("BillboardGui")
	b.Size = UDim2.fromOffset(220, 40)
	b.MaxDistance = 170
	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundTransparency = 1
	t.TextColor3 = Color3.new(1, 1, 1)
	t.TextStrokeTransparency = 0
	t.FontFace = FONT
	t.TextSize = ukuran or 24
	t.Text = teks
	t.Parent = b
	b.Parent = part
end

local LEBAR = 3.2 * XS * 2 + 6 -- lebar jalan (stud)
local TEPI = LEBAR / 2 + 3    -- tengah trotoar

-- benda di tepi jalan menurut tema rute; x = jarak dari tengah jalan (stud), z = posisi dunia
local function pohon(f, pos, s, batang, daun)
	balok(f, Vector3.new(1.4 * s, 6 * s, 1.4 * s), CFrame.new(pos + Vector3.new(0, 3 * s, 0)), batang)
	balok(f, Vector3.new(6 * s, 6 * s, 6 * s), CFrame.new(pos + Vector3.new(0, 8 * s, 0)), daun)
end
local function pinus(f, pos, s)
	balok(f, Vector3.new(1.3 * s, 8 * s, 1.3 * s), CFrame.new(pos + Vector3.new(0, 4 * s, 0)), rgb(90, 58, 34))
	for i = 0, 3 do
		local w = (7.5 - i * 1.7) * s
		balok(f, Vector3.new(w, 2.8 * s, w), CFrame.new(pos + Vector3.new(0, (6.5 + i * 2.5) * s, 0)), i % 2 == 0 and rgb(47, 106, 58) or rgb(58, 122, 68))
	end
end
local function kelapa(f, pos, s)
	balok(f, Vector3.new(1.1 * s, 15 * s, 1.1 * s), CFrame.new(pos + Vector3.new(0, 7.5 * s, 0)) * CFrame.Angles(0, 0, math.rad(4)), rgb(138, 106, 74))
	for a = 0, 3 do
		balok(f, Vector3.new(8 * s, 0.5 * s, 1.8 * s), CFrame.new(pos + Vector3.new(0, 15 * s, 0)) * CFrame.Angles(0, a * math.pi / 4, math.rad(-14)), a % 2 == 0 and rgb(63, 154, 68) or rgb(86, 176, 76))
	end
end
local function batuBesar(f, pos, s, warna)
	balok(f, Vector3.new(5 * s, 3.4 * s, 4.4 * s), CFrame.new(pos + Vector3.new(0, 1.7 * s, 0)) * CFrame.Angles(0, 0.4, 0), warna)
	balok(f, Vector3.new(3 * s, 2.2 * s, 2.8 * s), CFrame.new(pos + Vector3.new(2 * s, 1.1 * s, 1.8 * s)), warna:Lerp(Color3.new(0, 0, 0), 0.12))
end
local DINDING = { rgb(240, 226, 196), rgb(246, 243, 238), rgb(246, 214, 120), rgb(170, 210, 150), rgb(160, 200, 232), rgb(244, 190, 200), rgb(196, 176, 226), rgb(176, 132, 92) }
local ATAP = { rgb(200, 72, 56), rgb(224, 128, 58), rgb(122, 79, 42), rgb(74, 140, 88), rgb(70, 120, 190), rgb(120, 124, 132) }
local function rumah(f, pos, sisi, acak)
	local dua = acak:NextNumber() < 0.25
	local h = dua and 15 or 9
	balok(f, Vector3.new(14, h, 13), CFrame.new(pos + Vector3.new(0, h / 2, 0)), DINDING[acak:NextInteger(1, #DINDING)])
	balok(f, Vector3.new(16, 2.4, 15), CFrame.new(pos + Vector3.new(0, h + 1.2, 0)), ATAP[acak:NextInteger(1, #ATAP)])
	balok(f, Vector3.new(0.4, 5, 3), CFrame.new(pos + Vector3.new(-sisi * 7.1, 2.5, 0)), rgb(110, 78, 50))
end
local function gedung(f, pos, acak)
	local h, w = 50 + acak:NextNumber() * 80, 26 + acak:NextNumber() * 14
	local warna = ({ rgb(216, 212, 204), rgb(154, 168, 180), rgb(230, 220, 203), rgb(90, 100, 112), rgb(200, 184, 160) })[acak:NextInteger(1, 5)]
	balok(f, Vector3.new(w, h, w), CFrame.new(pos + Vector3.new(0, h / 2, 0)), warna)
	for y = 8, h - 6, 12 do
		balok(f, Vector3.new(w + 0.4, 4, w + 0.4), CFrame.new(pos + Vector3.new(0, y, 0)), rgb(90, 122, 154)).Transparency = 0.15
	end
	balok(f, Vector3.new(w * 0.6, 5, w * 0.6), CFrame.new(pos + Vector3.new(0, h + 2.5, 0)), rgb(138, 143, 150))
end
local function stupa(f, pos, s)
	for i = 0, 3 do
		local w = (20 - i * 4.4) * s
		balok(f, Vector3.new(w, 3.2 * s, w), CFrame.new(pos + Vector3.new(0, (1.6 + i * 3.2) * s, 0)), i % 2 == 0 and rgb(122, 116, 106) or rgb(138, 132, 120))
	end
	balok(f, Vector3.new(3 * s, 6 * s, 3 * s), CFrame.new(pos + Vector3.new(0, 15.6 * s, 0)), rgb(110, 104, 96))
end

local function hias(f, n, R, acak, d, sisi)
	local z = P.asal(n).Z - d * S
	local function di(x, y) return Vector3.new(P.asal(n).X + sisi * x, P.asal(n).Y + (y or 0), z) end
	local r = acak:NextNumber()
	if R.id == "wetan" then
		if r < 0.6 then rumah(f, di(TEPI + 16), sisi, acak) else pohon(f, di(TEPI + 10 + acak:NextNumber() * 12), 1 + acak:NextNumber() * 0.5, rgb(122, 79, 42), rgb(90, 160, 74)) end
		if acak:NextNumber() < 0.4 then pohon(f, di(TEPI + 5), 0.8, rgb(122, 79, 42), rgb(106, 176, 84)) end
	elseif R.id == "sudirman" then
		if r < 0.6 then gedung(f, di(TEPI + 30 + acak:NextNumber() * 14), acak) end
		if acak:NextNumber() < 0.5 then -- lampu jalan
			balok(f, Vector3.new(0.6, 14, 0.6), CFrame.new(di(TEPI + 4, 7)), rgb(44, 49, 80))
			balok(f, Vector3.new(4, 0.5, 0.6), CFrame.new(di(TEPI + 2.2, 14)), rgb(44, 49, 80))
			balok(f, Vector3.new(1.4, 0.6, 1), CFrame.new(di(TEPI + 0.6, 13.6)), rgb(255, 242, 192)).Material = Enum.Material.Neon
		end
	elseif R.id == "borobudur" then
		if r < 0.12 then stupa(f, di(TEPI + 40 + acak:NextNumber() * 30), 1 + acak:NextNumber() * 0.8)
		elseif r < 0.55 then pohon(f, di(TEPI + 8 + acak:NextNumber() * 20), 1 + acak:NextNumber() * 0.6, rgb(122, 79, 42), rgb(86, 150, 70))
		elseif r < 0.8 then rumah(f, di(TEPI + 18), sisi, acak) end
	elseif R.id == "sanur" then
		if r < 0.7 then kelapa(f, di(TEPI + 5 + acak:NextNumber() * 14), 1 + acak:NextNumber() * 0.4) end
		if acak:NextNumber() < 0.15 then -- payung pantai
			balok(f, Vector3.new(0.5, 7, 0.5), CFrame.new(di(TEPI + 14, 3.5)), rgb(240, 240, 240))
			balok(f, Vector3.new(8, 0.8, 8), CFrame.new(di(TEPI + 14, 7.2)), ({ rgb(224, 80, 58), rgb(58, 138, 216), rgb(242, 193, 74) })[acak:NextInteger(1, 3)])
		end
	elseif R.id == "lawu" then
		if r < 0.85 then pinus(f, di(TEPI + 4 + acak:NextNumber() * 26), 1 + acak:NextNumber() * 0.8) end
		if acak:NextNumber() < 0.5 then pinus(f, di(TEPI + 32 + acak:NextNumber() * 30), 1.4 + acak:NextNumber()) end
	elseif R.id == "bromo" then
		if r < 0.45 then batuBesar(f, di(TEPI + 6 + acak:NextNumber() * 30), 0.8 + acak:NextNumber() * 1.4, rgb(94, 88, 82)) end
	else
		if r < 0.4 then batuBesar(f, di(TEPI + 6 + acak:NextNumber() * 30), 0.7 + acak:NextNumber(), rgb(150, 144, 130))
		elseif r < 0.6 then balok(f, Vector3.new(4, 2.4, 4), CFrame.new(di(TEPI + 5 + acak:NextNumber() * 20, 1.2)), rgb(160, 166, 78)) end
	end
end

local function bangun(n)
	local R = P.RUTE[n]
	local f = Instance.new("Folder")
	f.Name = "R" .. n
	local asal = P.asal(n)
	local acak = Random.new(900 + n)
	local AWAL, AKHIR = -40, P.FINISH + 70 -- meter
	local panjang = (AKHIR - AWAL) * S
	local zTengah = asal.Z - (AWAL + AKHIR) / 2 * S
	-- tanah, jalan, trotoar, garis lajur (tokoh tidak memakai tabrakan; tanah padat hanya supaya tidak jatuh bila skrip klien berhenti)
	local POTONG = 6
	for i = 0, POTONG - 1 do
		local z = asal.Z - AWAL * S - (i + 0.5) * panjang / POTONG
		local pj = panjang / POTONG
		balok(f, Vector3.new(520, 4, pj), CFrame.new(asal.X, asal.Y - 2.6, z), R.tanah, true)
		balok(f, Vector3.new(LEBAR, 0.6, pj), CFrame.new(asal.X, asal.Y - 0.3, z), R.jalan, true)
		for _, sisi in ipairs({ -1, 1 }) do
			balok(f, Vector3.new(6, 0.9, pj), CFrame.new(asal.X + sisi * TEPI, asal.Y - 0.15, z), R.tepi, true)
			if not R.trail then balok(f, Vector3.new(0.5, 0.1, pj), CFrame.new(asal.X + sisi * 1.6 * XS, asal.Y + 0.02, z), rgb(244, 241, 234)).Transparency = 0.35 end
		end
	end
	-- latar jauh menurut tema
	if R.id == "sanur" then
		balok(f, Vector3.new(400, 1, panjang), CFrame.new(asal.X + 300, asal.Y - 1.2, zTengah), rgb(56, 168, 240)).Transparency = 0.2
	elseif R.id == "bromo" or R.id == "lawu" or R.id == "rinjani" or R.id == "borobudur" then
		local warna = R.id == "bromo" and rgb(86, 78, 72) or R.id == "rinjani" and rgb(120, 140, 96) or rgb(70, 110, 84)
		local zG = asal.Z - (P.FINISH + 260) * S
		for i = 0, 4 do
			local w = 520 - i * 100
			balok(f, Vector3.new(w, 50, w * 0.7), CFrame.new(asal.X + (R.id == "borobudur" and 260 or 0), asal.Y + 25 + i * 50, zG), warna:Lerp(Color3.new(1, 1, 1), i * 0.04))
		end
		if R.id == "bromo" then balok(f, Vector3.new(60, 90, 60), CFrame.new(asal.X, asal.Y + 300, zG), rgb(214, 208, 204)).Transparency = 0.5 end
	end
	-- hiasan tepi jalan
	for d = -20, P.FINISH + 50, 9 do
		for _, sisi in ipairs({ -1, 1 }) do
			if not (d > P.WS.d - 14 and d < P.WS.d + 14) then hias(f, n, R, acak, d, sisi) end
		end
	end
	-- gapura start dan finish, papan KM, water station
	local function gapura(d, teks, warna)
		local c = CFrame.new(asal.X, asal.Y, asal.Z - d * S)
		balok(f, Vector3.new(1.4, 15, 1.4), c * CFrame.new(-LEBAR / 2 - 1, 7.5, 0), rgb(44, 49, 80))
		balok(f, Vector3.new(1.4, 15, 1.4), c * CFrame.new(LEBAR / 2 + 1, 7.5, 0), rgb(44, 49, 80))
		local atas = balok(f, Vector3.new(LEBAR + 3.4, 3.4, 1.4), c * CFrame.new(0, 15.6, 0), warna)
		tulisan(atas, teks, 26)
	end
	gapura(0, "START · " .. string.upper(R.nama), rgb(224, 128, 58))
	gapura(P.FINISH, "FINISH · 1 KM", rgb(58, 168, 96))
	for d = 100, 900, 100 do
		local papan = balok(f, Vector3.new(5, 2.6, 0.4), CFrame.new(asal.X + TEPI + 2, asal.Y + 6, asal.Z - d * S), rgb(44, 49, 80))
		balok(f, Vector3.new(0.4, 5, 0.4), CFrame.new(asal.X + TEPI + 2, asal.Y + 2.5, asal.Z - d * S), rgb(58, 58, 58))
		tulisan(papan, string.format("0,%d KM", d / 100), 22)
	end
	for _, sisi in ipairs({ -1, 1 }) do
		local c = CFrame.new(asal.X + sisi * (TEPI + 3), asal.Y, asal.Z - P.WS.d * S)
		balok(f, Vector3.new(7, 3, 14), c * CFrame.new(0, 1.5, 0), rgb(246, 243, 238))
		for _, dz in ipairs({ -7, 7 }) do balok(f, Vector3.new(0.5, 9, 0.5), c * CFrame.new(0, 4.5, dz), rgb(44, 49, 80)) end
		local atap = balok(f, Vector3.new(9, 0.8, 16), c * CFrame.new(0, 9.4, 0), rgb(58, 138, 216))
		if sisi == 1 then tulisan(atap, "WATER STATION", 22) end
		for i = -2, 2 do balok(f, Vector3.new(0.9, 1.4, 0.9), c * CFrame.new(-sisi * 1.5, 3.7, i * 2.4), rgb(90, 180, 255)) end
	end
	f.Parent = folder
end

for n = 1, #P.RUTE do
	bangun(n)
	task.wait()
end
print("[PelariKalcer] " .. #P.RUTE .. " rute dibangun")

-- ---------- pintu di Arena Pelari Kalcer (Kulon) ----------
local akar = workspace:FindFirstChild("DuniaKotak3")
local kulon = akar and akar:FindFirstChild("kulon")
local geser = kulon and kulon:GetAttribute("geser")
if typeof(geser) ~= "Vector3" then geser = GESER_KULON end
local arena = geser + ARENA
do
	local part = balok(folder, Vector3.new(2, 2, 2), CFrame.new(arena + Vector3.new(0, 5, 40)), Color3.new(1, 1, 1))
	part.Name = "pintu"
	part.Transparency = 1
	local pr = Instance.new("ProximityPrompt")
	pr.ActionText = "Ikut Lari"
	pr.ObjectText = "Pelari Kalcer"
	pr.MaxActivationDistance = 46
	pr.RequiresLineOfSight = false
	pr.HoldDuration = 0
	pr.Parent = part
	pr.Triggered:Connect(function(p) bukaEv:FireClient(p) end)
	folder:SetAttribute("pintu", part.Position)
end

-- ---------- data pemain ----------
local sesi = {} -- [player] = { data, termuat }
local lari = {} -- [player] = { rute, t0, d }

local function hariWIB(geser2)
	return os.date("!%Y-%m-%d", os.time() + 7 * 3600 + (geser2 or 0) * 86400)
end

local function muat(player)
	local s = { data = { h = hariWIB(), dapat = 0, fh = 0, rb = 1, r = 0, st = 0, sh = "" }, termuat = false }
	sesi[player] = s
	if not store then return end
	local ok, d = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
	if not ok or sesi[player] ~= s then return end
	if typeof(d) == "table" then
		local x = s.data
		x.rb = math.clamp(math.floor(tonumber(d.rb) or 1), 1, #P.RUTE)
		x.r = math.max(0, tonumber(d.r) or 0)
		x.st = math.max(0, math.floor(tonumber(d.st) or 0))
		x.sh = typeof(d.sh) == "string" and d.sh or ""
		if d.h == x.h then
			x.dapat = math.max(0, math.floor(tonumber(d.dapat) or 0))
			x.fh = math.max(0, math.floor(tonumber(d.fh) or 0))
		end
	end
	s.termuat = true
end

local function simpan(player)
	local s = sesi[player]
	if not store or not s or not s.termuat then return end
	local x = s.data
	pcall(function() store:SetAsync("p_" .. player.UserId, { h = x.h, dapat = x.dapat, fh = x.fh, rb = x.rb, r = x.r, st = x.st, sh = x.sh }) end)
end

local function hariIni(s)
	local h = hariWIB()
	if s.data.h ~= h then
		s.data.h = h
		s.data.dapat = 0
		s.data.fh = 0
	end
	return s.data
end

local function streak(x)
	return (x.sh == hariWIB() or x.sh == hariWIB(-1)) and x.st or 0
end

-- papan 5 tercepat, disimpan sementara 60 detik
local papan
local function top()
	if papan and os.clock() - papan.t < 60 then return papan.isi end
	local isi = {}
	pcall(function()
		local ods = DataStoreService:GetOrderedDataStore("DuniaKotak_PelariTop")
		for _, e in ipairs(ods:GetSortedAsync(true, 5):GetCurrentPage()) do
			local nama = "warga"
			pcall(function() nama = Players:GetNameFromUserIdAsync(tonumber(e.key)) end)
			table.insert(isi, { u = nama, t = e.value / 10 })
		end
	end)
	papan = { t = os.clock(), isi = isi }
	return isi
end

local function info(player)
	local s = sesi[player]
	if not s then return { galat = "Data belum siap, coba lagi sebentar." } end
	local x = hariIni(s)
	return { buka = x.rb, rekor = x.r, sisaHari = math.max(0, P.MAKS_HARI - x.dapat), streak = streak(x), lariHariIni = x.sh == x.h, top = top() }
end

local function keluar(player)
	if not lari[player] then return end
	lari[player] = nil
	player:SetAttribute("DK_Pelari", nil)
	local char = player.Character
	if char and char.Parent then
		local hum = char:FindFirstChildOfClass("Humanoid")
		if hum then hum.PlatformStand = false end
		char:PivotTo(CFrame.new(folder:GetAttribute("pintu") + Vector3.new(0, 3, 10)))
	end
end

local function mulai(player, n)
	local s = sesi[player]
	if not s then return { galat = "Data belum siap, coba lagi sebentar." } end
	if not P.RUTE[n] then return { galat = "Rute tidak dikenal." } end
	if n > hariIni(s).rb then return { galat = "Rute ini terbuka setelah kamu finish di " .. P.RUTE[n - 1].nama .. "." } end
	if (player:GetAttribute("DK_Naik") or "") ~= "" then return { galat = "Turun dulu dari kendaraanmu." } end
	if (player:GetAttribute("DK_Wahana") or "") ~= "" then return { galat = "Tunggu sampai turun dari wahana dulu." } end
	if player:GetAttribute("DK_Reli") then return { galat = "Selesaikan dulu balapan relimu." } end
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not hum or hum.Health <= 0 or not char:FindFirstChild("HumanoidRootPart") then return { galat = "Tokohmu belum siap." } end
	local pos = P.dunia(n, 0, 0, 0) + Vector3.new(0, TINGGI, 0)
	pcall(function() player:RequestStreamAroundAsync(pos, 4) end)
	char:PivotTo(CFrame.lookAt(pos, pos + Vector3.new(0, 0, -1)))
	lari[player] = { rute = n, t0 = os.clock() + 3, d = 0, tl = os.clock() + 3 }
	player:SetAttribute("DK_Pelari", n)
	return { ok = true, rute = n, tinggi = TINGGI, rekor = s.data.r }
end

local function selesai(player, q)
	local s, b = sesi[player], lari[player]
	if not s or not b or b.selesai then return { galat = "Larimu tidak tercatat." } end
	b.selesai = true
	q = typeof(q) == "table" and q or {}
	local lamaLari = os.clock() - b.t0
	if lamaLari < P.MIN_LARI then return { galat = "Larinya tidak tercatat, koin tidak masuk. Coba lari lagi dari awal." } end
	local x = hariIni(s)
	local hasil = { rute = b.rute }
	-- koin: angka dari klien dibatasi jumlah koin di jalan, batas per lari, batas harian, dan lama lari
	local minta = math.max(0, math.floor(tonumber(q.koin) or 0))
	local k = math.max(0, math.min(P.MAKS_LARI, minta, P.isi(b.rute).koin + 5, P.MAKS_HARI - x.dapat, math.floor(lamaLari * P.KOIN_DETIK)))
	local dk = ServerStorage:FindFirstChild("DK_Koin")
	if k > 0 then
		local ok, h = pcall(function() return dk and dk:Invoke(player, k) end)
		if ok and h == true then
			x.dapat += k
			hasil.dapat = k
		end
	end
	-- finish sah: jarak diukur server, waktu game dari jam server
	local w = lamaLari * P.SKALA_WAKTU
	if q.finish == true and b.d >= P.FINISH - 8 and w >= P.REKOR_MIN and w <= 3600 then
		local t = math.floor(w * 10 + 0.5) / 10
		hasil.finish, hasil.waktu = true, t
		x.fh += 1
		if b.rute == x.rb and b.rute < #P.RUTE then
			x.rb = b.rute + 1
			hasil.ruteBaru = P.RUTE[x.rb].nama
		end
		hasil.rekorBaru = x.r <= 0 or t < x.r
		if hasil.rekorBaru then
			x.r = t
			papan = nil
			task.spawn(function()
				pcall(function() DataStoreService:GetOrderedDataStore("DuniaKotak_PelariTop"):SetAsync(tostring(player.UserId), math.floor(t * 10 + 0.5)) end)
			end)
		end
		if x.sh ~= x.h then
			x.st = (x.sh == hariWIB(-1)) and x.st + 1 or 1
			x.sh = x.h
			local ok, h = pcall(function() return dk and dk:Invoke(player, P.MISI_DESA) end)
			if ok and h == true then hasil.misiDesa = P.MISI_DESA end
		end
		finishEv:Fire(player)
	elseif q.finish == true then
		hasil.pesan = "Waktu finish tidak tercatat. Coba lari lagi dari start ya."
	end
	hasil.rekor, hasil.streak, hasil.sisaHari, hasil.buka = x.r, streak(x), math.max(0, P.MAKS_HARI - x.dapat), x.rb
	task.spawn(simpan, player)
	return hasil
end

pintu.OnServerInvoke = function(player, op, a)
	if op == "buka" then return info(player) end
	if op == "mulai" then return mulai(player, math.clamp(math.floor(tonumber(a) or 1), 1, #P.RUTE)) end
	if op == "selesai" then return selesai(player, a) end
	if op == "keluar" then
		keluar(player)
		return { ok = true }
	end
	return { galat = "Perintah tidak dikenal." }
end

local function pasang(p)
	task.spawn(muat, p)
	p.CharacterAdded:Connect(function()
		if lari[p] then
			lari[p] = nil
			p:SetAttribute("DK_Pelari", nil)
		end
	end)
end
Players.PlayerAdded:Connect(pasang)
for _, p in ipairs(Players:GetPlayers()) do pasang(p) end
Players.PlayerRemoving:Connect(function(p)
	lari[p] = nil
	sesi[p] = nil -- data sudah disimpan tiap selesai lari
end)

-- jarak terjauh diukur server dari posisi tokoh (harus tetap di atas jalan)
local tunda = 0
RunService.Heartbeat:Connect(function(dt)
	tunda += dt
	if tunda < 0.1 then return end
	tunda = 0
	for player, b in pairs(lari) do
		local char = player.Character
		local hrp = char and char:FindFirstChild("HumanoidRootPart")
		if hrp and not b.selesai and os.clock() >= b.t0 then
			local rel = hrp.Position - P.asal(b.rute)
			local d = -rel.Z / S
			-- maju paling cepat 16 m per detik sejak catatan terakhir (sprint penuh sekitar 11 m per detik)
			local kini = os.clock()
			if math.abs(rel.X) < LEBAR and d > b.d and d - b.d < (kini - b.tl) * 16 + 3 then
				b.d = d
				b.tl = kini
			end
		end
	end
end)
