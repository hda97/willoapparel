--[[
  ReliKotak (Script) - balap reli sekali jalan (start, 20 gerbang, finish) mengikuti game web /duniakotak/reli/.

  Aturan disamakan dengan worker.js (RL_*) dan reli.js:
    - 5 lintasan. Lintasan 2 sampai 5 terbuka setelah finish lintasan 1.
    - Tiap finish sah: 10 koin, hanya 3 finish pertama tiap hari. Finish sah bila waktunya tidak lebih cepat dari
      batas fisika mobil (MIN_MS per lintasan).
    - Rekor = waktu tercepat per lintasan, papan 5 tercepat.
  Masuk dari Sirkuit Reli Kotak di Dusun Curug (tombol "Reli Kotak"). Lintasan dibangun jauh dari dusun.
  Mobil digerakkan skrip klien (ReliKotak.client.lua); server menghitung gerbang dan waktu sendiri dari posisi mobil.

  Simpanan: DataStore DuniaKotak_Reli_v1, kunci p_<UserId> = { h = hari, n = finish berkoin hari itu, buka = 1 atau 5, rk = { [lintasan] = ms } }.
            OrderedDataStore DuniaKotak_ReliTop_L<lintasan>, kunci UserId, nilai ms.
  Pintu: ReplicatedStorage.DK_Reli (RemoteFunction), DK_ReliBuka dan DK_ReliKabar (RemoteEvent).
  Pasang sebagai Script di ServerScriptService. Butuh ReplicatedStorage.DK_ReliLintasan (ModuleScript) dan DataWarga (DK_Koin).
]]

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local DataStoreService = game:GetService("DataStoreService")

local R = require(ReplicatedStorage:WaitForChild("DK_ReliLintasan"))
local K = R.K
local SIRKUIT = Vector3.new(-450, 0, 177.2) -- titik tengah lahan Sirkuit Reli (stud, belum digeser)
local GESER_CURUG = Vector3.new(0, 0, -10000)
local FONT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local TINGGI = 2.6 -- tinggi HumanoidRootPart di atas jalan saat di mobil
local WARNA_MOBIL = { Color3.fromRGB(230, 70, 60), Color3.fromRGB(58, 122, 224), Color3.fromRGB(255, 196, 37), Color3.fromRGB(64, 176, 96), Color3.fromRGB(240, 240, 240), Color3.fromRGB(244, 130, 40) }

local store
do
	local ok, s = pcall(function() return DataStoreService:GetDataStore("DuniaKotak_Reli_v1") end)
	if ok then store = s else warn("[ReliKotak] DataStore tidak tersedia: " .. tostring(s)) end
end

local function buatPintu(kelas, nama)
	local l = ReplicatedStorage:FindFirstChild(nama)
	if l then l:Destroy() end
	local p = Instance.new(kelas)
	p.Name = nama
	p.Parent = ReplicatedStorage
	return p
end
local pintu = buatPintu("RemoteFunction", "DK_Reli")
local bukaEv = buatPintu("RemoteEvent", "DK_ReliBuka")
local kabarEv = buatPintu("RemoteEvent", "DK_ReliKabar")

local lama = workspace:FindFirstChild("DK_Reli")
if lama then lama:Destroy() end
local folder = Instance.new("Folder")
folder.Name = "DK_Reli"
folder.Parent = workspace

-- ---------- bangun lintasan ----------
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

local function tulisan(part, teks)
	local b = Instance.new("BillboardGui")
	b.Size = UDim2.fromOffset(150, 40)
	b.MaxDistance = 260
	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundTransparency = 1
	t.TextColor3 = Color3.new(1, 1, 1)
	t.TextStrokeTransparency = 0
	t.FontFace = FONT
	t.TextSize = 24
	t.Text = teks
	t.Parent = b
	b.Parent = part
end

local function bangun(n)
	local L = R.buat(n)
	local T, NS = L.T, L.NS
	local f = Instance.new("Folder")
	f.Name = "L" .. n
	local acak = Random.new(500 + n)
	local minY, minX, maxX, minZ, maxZ = math.huge, math.huge, -math.huge, math.huge, -math.huge
	for i = 0, NS do
		local q = T[i]
		minY = math.min(minY, q.y)
		minX = math.min(minX, q.x)
		maxX = math.max(maxX, q.x)
		minZ = math.min(minZ, q.z)
		maxZ = math.max(maxZ, q.z)
	end
	local JALAN, TANAH = Color3.fromRGB(176, 137, 92), L.data.tanah
	-- dasar luas
	local dasarY = minY * K - 24
	balok(f, Vector3.new((maxX - minX) * K + 700, 4, (maxZ - minZ) * K + 700),
		CFrame.new(R.dunia(n, (minX + maxX) / 2, 0, (minZ + maxZ) / 2).X, R.asal(n).Y + dasarY, R.dunia(n, 0, 0, (minZ + maxZ) / 2).Z), TANAH, true)
	if L.data.danau then
		local d = L.data.danau
		local air = balok(f, Vector3.new(1, d.rz * 2 * K, d.rz * 2 * K), CFrame.new(R.dunia(n, d.x, 0, d.z) + Vector3.new(0, dasarY + 2.3, 0)) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(63, 155, 224))
		air.Shape = Enum.PartType.Cylinder
	end
	-- jalan dan bahu jalan
	local LANGKAH = 3
	local i = 0
	while i < NS do
		local a, b = T[i], T[math.min(NS, i + LANGKAH)]
		local pa, pb = R.dunia(n, a.x, a.y, a.z), R.dunia(n, b.x, b.y, b.z)
		local tengah = (pa + pb) / 2
		local panjang = (pb - pa).Magnitude
		local m = T[math.min(NS, i + 1)]
		local cf = CFrame.lookAt(tengah, pb) * CFrame.Angles(0, 0, math.atan(m.bk))
		balok(f, Vector3.new(R.LEBAR * K + 2.5, 1, panjang + 1.2), cf * CFrame.new(0, -0.5, 0), JALAN)
		local tebal = (math.min(a.y, b.y) - minY) * K + 23
		local datar = CFrame.lookAt(Vector3.new(tengah.X, 0, tengah.Z), Vector3.new(pb.X, 0, pb.Z))
		balok(f, Vector3.new(64 * K, tebal, panjang + 3), datar + Vector3.new(0, R.asal(n).Y + math.min(a.y, b.y) * K - 2 - tebal / 2, 0), TANAH)
		-- pohon di kiri dan kanan
		if acak:NextNumber() < 0.55 * L.data.padat then
			for _, sisi in ipairs({ -1, 1 }) do
				if acak:NextNumber() < 0.7 then
					local d = sisi * (R.SEMAK + 3 + acak:NextNumber() * 20)
					local dasar = R.dunia(n, a.x + a.nx * d, a.y, a.z + a.nz * d) + Vector3.new(0, -1, 0)
					local s = 0.8 + acak:NextNumber() * 0.7
					balok(f, Vector3.new(1.6, 6 * s, 1.6), CFrame.new(dasar + Vector3.new(0, 3 * s, 0)), Color3.fromRGB(110, 78, 50))
					balok(f, Vector3.new(7 * s, 7 * s, 7 * s), CFrame.new(dasar + Vector3.new(0, 8.5 * s, 0)), L.data.pohon)
					balok(f, Vector3.new(4.4 * s, 5 * s, 4.4 * s), CFrame.new(dasar + Vector3.new(0, 14 * s, 0)), L.data.pohon)
				end
			end
		end
		i += LANGKAH
	end
	-- gerbang
	local function gerbang(idx, teks, warna)
		local q = T[idx]
		local pusat = R.dunia(n, q.x, q.y, q.z)
		local cf = CFrame.lookAt(pusat, pusat + Vector3.new(q.tx, 0, q.tz))
		local lebar = (R.LEBAR + 2.4) * K
		balok(f, Vector3.new(1.2, 11, 1.2), cf * CFrame.new(-lebar / 2, 5.5, 0), warna)
		balok(f, Vector3.new(1.2, 11, 1.2), cf * CFrame.new(lebar / 2, 5.5, 0), warna)
		local atas = balok(f, Vector3.new(lebar + 1.2, 2.2, 1.2), cf * CFrame.new(0, 11.4, 0), warna)
		tulisan(atas, teks)
	end
	gerbang(L.START, "START", Color3.fromRGB(240, 240, 240))
	for g = 1, R.GERBANG do
		if g == R.GERBANG then gerbang(L.IG[g], "FINISH", Color3.fromRGB(240, 240, 240))
		else gerbang(L.IG[g], tostring(g), Color3.fromRGB(255, 210, 58)) end
	end
	f.Parent = folder
	return L
end

local LIN = {}
for n = 1, #R.LINTASAN do
	LIN[n] = bangun(n)
	task.wait()
end
print("[ReliKotak] " .. #LIN .. " lintasan dibangun")

-- ---------- pintu di Sirkuit Reli (Curug) ----------
local akar = workspace:FindFirstChild("DuniaKotak3")
local curug = akar and akar:FindFirstChild("curug")
local geser = curug and curug:GetAttribute("geser")
if typeof(geser) ~= "Vector3" then geser = GESER_CURUG end
local sirkuit = geser + SIRKUIT
do
	local part = balok(folder, Vector3.new(2, 2, 2), CFrame.new(sirkuit + Vector3.new(0, 5, -30)), Color3.new(1, 1, 1))
	part.Name = "pintu"
	part.Transparency = 1
	local pr = Instance.new("ProximityPrompt")
	pr.ActionText = "Balapan"
	pr.ObjectText = "Reli Kotak"
	pr.MaxActivationDistance = 46
	pr.RequiresLineOfSight = false
	pr.HoldDuration = 0
	pr.Parent = part
	pr.Triggered:Connect(function(p) bukaEv:FireClient(p) end)
	folder:SetAttribute("pintu", part.Position)
end

-- ---------- data pemain ----------
local sesi = {}  -- [player] = { data, termuat }
local balap = {} -- [player] = { l, i, g, t0, pulang }

local function hariWIB()
	return os.date("!%Y-%m-%d", os.time() + 7 * 3600)
end

local function muat(player)
	local s = { data = { h = hariWIB(), n = 0, buka = 1, rk = {} }, termuat = false }
	sesi[player] = s
	if not store then return end
	local ok, d = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
	if not ok or sesi[player] ~= s then return end
	if typeof(d) == "table" then
		s.data.buka = (tonumber(d.buka) or 1) >= 5 and 5 or 1
		if typeof(d.rk) == "table" then
			for l = 1, #R.LINTASAN do
				local v = tonumber(d.rk[l] or d.rk[tostring(l)])
				if v and v > 0 then s.data.rk[l] = math.floor(v) end
			end
		end
		if d.h == s.data.h then s.data.n = math.max(0, math.floor(tonumber(d.n) or 0)) end
	end
	s.termuat = true
end

local function simpan(player)
	local s = sesi[player]
	if not store or not s or not s.termuat then return end
	local rk = {}
	for l, v in pairs(s.data.rk) do rk[tostring(l)] = v end
	pcall(function() store:SetAsync("p_" .. player.UserId, { h = s.data.h, n = s.data.n, buka = s.data.buka, rk = rk }) end)
end

local function hariIni(s)
	local h = hariWIB()
	if s.data.h ~= h then
		s.data.h = h
		s.data.n = 0
	end
	return s.data
end

-- papan 5 tercepat, disimpan sementara 60 detik per lintasan
local papan = {}
local function top(l)
	local c = papan[l]
	if c and os.clock() - c.t < 60 then return c.isi end
	local isi = {}
	pcall(function()
		local ods = DataStoreService:GetOrderedDataStore("DuniaKotak_ReliTop_L" .. l)
		for _, e in ipairs(ods:GetSortedAsync(true, 5):GetCurrentPage()) do
			local nama = "warga"
			pcall(function() nama = Players:GetNameFromUserIdAsync(tonumber(e.key)) end)
			table.insert(isi, { u = nama, t = e.value })
		end
	end)
	papan[l] = { t = os.clock(), isi = isi }
	return isi
end

local function info(player, l)
	local s = sesi[player]
	if not s then return { galat = "Data belum siap, coba lagi sebentar." } end
	local d = hariIni(s)
	local daftar = {}
	for n, x in ipairs(R.LINTASAN) do
		daftar[n] = { nama = x.nama, rekor = d.rk[n] or 0, buka = n <= d.buka }
	end
	return { lintasan = daftar, buka = d.buka, sisaKoin = math.max(0, R.FINISH_BERKOIN - d.n), l = l, top = top(l) }
end

-- ---------- mobil ----------
local function pasangMobil(player)
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if not hrp then return false end
	local l = char:FindFirstChild("DK_MobilReli")
	if l then l:Destroy() end
	local m = Instance.new("Model")
	m.Name = "DK_MobilReli"
	local warna = WARNA_MOBIL[player.UserId % #WARNA_MOBIL + 1]
	local HITAM = Color3.fromRGB(30, 30, 34)
	local function b(ukuran, geser2, w, bentuk, putar)
		local p = Instance.new("Part")
		p.Size = ukuran
		p.Color = w
		p.Material = Enum.Material.SmoothPlastic
		p.CanCollide = false
		p.CanQuery = false
		p.CanTouch = false
		p.Massless = true
		p.TopSurface = Enum.SurfaceType.Smooth
		p.BottomSurface = Enum.SurfaceType.Smooth
		if bentuk then p.Shape = bentuk end
		p.CFrame = hrp.CFrame * CFrame.new(geser2 + Vector3.new(0, -TINGGI, 0)) * (putar or CFrame.new())
		local w2 = Instance.new("WeldConstraint")
		w2.Part0 = hrp
		w2.Part1 = p
		w2.Parent = p
		p.Parent = m
		return p
	end
	-- depan mobil = arah hadap tokoh (-Z lokal)
	b(Vector3.new(6, 1.7, 11), Vector3.new(0, 1.55, 0), warna)            -- bodi
	b(Vector3.new(5.6, 0.9, 3.4), Vector3.new(0, 2.7, -3.2), warna)       -- kap mesin
	b(Vector3.new(5.6, 1.4, 0.4), Vector3.new(0, 3.4, -1.5), Color3.fromRGB(170, 215, 240)).Transparency = 0.45 -- kaca depan
	b(Vector3.new(5.6, 1.1, 2.4), Vector3.new(0, 2.8, 4.1), warna)        -- bagasi
	b(Vector3.new(6.4, 0.7, 0.9), Vector3.new(0, 0.95, -5.6), HITAM)      -- bumper depan
	b(Vector3.new(6.4, 0.7, 0.9), Vector3.new(0, 0.95, 5.6), HITAM)       -- bumper belakang
	b(Vector3.new(0.4, 1.4, 0.4), Vector3.new(-2.4, 3.9, 4.9), HITAM)     -- tiang sayap
	b(Vector3.new(0.4, 1.4, 0.4), Vector3.new(2.4, 3.9, 4.9), HITAM)
	b(Vector3.new(6.2, 0.35, 1.5), Vector3.new(0, 4.7, 4.9), HITAM)       -- sayap belakang
	local rem = b(Vector3.new(1.4, 0.6, 0.3), Vector3.new(-2, 2.0, 5.55), Color3.fromRGB(255, 60, 50))
	rem.Material = Enum.Material.Neon
	rem = b(Vector3.new(1.4, 0.6, 0.3), Vector3.new(2, 2.0, 5.55), Color3.fromRGB(255, 60, 50))
	rem.Material = Enum.Material.Neon
	for _, x in ipairs({ -3.1, 3.1 }) do
		for _, z in ipairs({ -3.5, 3.5 }) do
			b(Vector3.new(1.2, 2.8, 2.8), Vector3.new(x, 1.4, z), HITAM, Enum.PartType.Cylinder)
		end
	end
	m.Parent = char
	return true
end

local function lepasMobil(player)
	local char = player.Character
	local m = char and char:FindFirstChild("DK_MobilReli")
	if m then m:Destroy() end
end

local function taruhStart(player, l)
	local L = LIN[l]
	local q = L.T[L.START - 3]
	local pos = R.dunia(l, q.x, R.yJalan(L, L.START - 3, 0), q.z) + Vector3.new(0, TINGGI, 0)
	player.Character:PivotTo(CFrame.lookAt(pos, pos + Vector3.new(q.tx, 0, q.tz)))
end

local function keluar(player)
	local b = balap[player]
	if not b then return end
	balap[player] = nil
	player:SetAttribute("DK_Reli", nil)
	lepasMobil(player)
	local char = player.Character
	if char and char.Parent then
		local hum = char:FindFirstChildOfClass("Humanoid")
		if hum then hum.PlatformStand = false end
		char:PivotTo(CFrame.new(folder:GetAttribute("pintu") + Vector3.new(0, 3, -8)))
	end
end

local function mulai(player, l)
	local s = sesi[player]
	if not s then return { galat = "Data belum siap, coba lagi sebentar." } end
	if not LIN[l] then return { galat = "Lintasan tidak dikenal." } end
	if l > hariIni(s).buka then return { galat = "Lintasan ini terbuka setelah kamu finish di Hutan Pinus." } end
	if (player:GetAttribute("DK_Naik") or "") ~= "" then return { galat = "Turun dulu dari kendaraanmu." } end
	if (player:GetAttribute("DK_Wahana") or "") ~= "" then return { galat = "Tunggu sampai turun dari wahana dulu." } end
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not hum or hum.Health <= 0 or not char:FindFirstChild("HumanoidRootPart") then return { galat = "Tokohmu belum siap." } end
	if not balap[player] and not pasangMobil(player) then return { galat = "Mobil belum bisa disiapkan." } end
	if balap[player] and not char:FindFirstChild("DK_MobilReli") then pasangMobil(player) end
	taruhStart(player, l)
	balap[player] = { l = l, i = LIN[l].START - 3, g = 0, t0 = os.clock() + 3 }
	player:SetAttribute("DK_Reli", l)
	return { ok = true, l = l, tinggi = TINGGI, rekor = s.data.rk[l] or 0 }
end

local function finish(player, b)
	local s = sesi[player]
	local ms = math.floor((os.clock() - b.t0) * 1000)
	b.selesai = true
	if not s then return end
	local l = b.l
	if ms < R.MIN_MS[l] or ms > 30 * 60000 then
		kabarEv:FireClient(player, { galat = "Waktu balapan tidak tercatat. Coba balapan lagi dari start ya." })
		return
	end
	local d = hariIni(s)
	local hasil = { ms = ms, l = l, rekorLama = d.rk[l] or 0 }
	if not d.rk[l] or ms < d.rk[l] then
		d.rk[l] = ms
		hasil.rekorBaru = true
		papan[l] = nil
		task.spawn(function()
			pcall(function() DataStoreService:GetOrderedDataStore("DuniaKotak_ReliTop_L" .. l):SetAsync(tostring(player.UserId), ms) end)
		end)
	end
	if l == 1 and d.buka < 5 then
		d.buka = 5
		hasil.bukaBaru = true
	end
	if d.n < R.FINISH_BERKOIN then
		local dk = ServerStorage:FindFirstChild("DK_Koin")
		local ok, h = pcall(function() return dk and dk:Invoke(player, R.KOIN_FINISH) end)
		if ok and h == true then
			d.n += 1
			hasil.dapat = R.KOIN_FINISH
		end
	end
	hasil.sisaKoin = math.max(0, R.FINISH_BERKOIN - d.n)
	hasil.rekor = d.rk[l]
	kabarEv:FireClient(player, hasil)
	task.spawn(simpan, player)
end

pintu.OnServerInvoke = function(player, op, l)
	l = math.clamp(math.floor(tonumber(l) or 1), 1, #R.LINTASAN)
	if op == "buka" then return info(player, l) end
	if op == "mulai" then return mulai(player, l) end
	if op == "keluar" then
		keluar(player)
		return { ok = true }
	end
	return { galat = "Perintah tidak dikenal." }
end

Players.PlayerAdded:Connect(function(p)
	task.spawn(muat, p)
	p.CharacterAdded:Connect(function()
		if balap[p] then
			balap[p] = nil
			p:SetAttribute("DK_Reli", nil)
		end
	end)
end)
for _, p in ipairs(Players:GetPlayers()) do
	task.spawn(muat, p)
	p.CharacterAdded:Connect(function()
		if balap[p] then
			balap[p] = nil
			p:SetAttribute("DK_Reli", nil)
		end
	end)
end
Players.PlayerRemoving:Connect(function(p)
	balap[p] = nil
	simpan(p)
	sesi[p] = nil
end)

-- gerbang dan finish dihitung server dari posisi mobil
local tunda = 0
RunService.Heartbeat:Connect(function(dt)
	tunda += dt
	if tunda < 0.08 then return end
	tunda = 0
	for player, b in pairs(balap) do
		local char = player.Character
		local hrp = char and char:FindFirstChild("HumanoidRootPart")
		if hrp and not b.selesai and os.clock() >= b.t0 then
			local L = LIN[b.l]
			local rel = (hrp.Position - R.asal(b.l)) / K
			local i, d = R.proyeksi(L, rel.X, rel.Z, b.i, 40)
			if i > b.i then b.i = i end
			while b.g < R.GERBANG and b.i >= L.IG[b.g + 1] and math.abs(d) < R.SEMAK + 4 do
				b.g += 1
			end
			if b.g >= R.GERBANG then finish(player, b) end
		end
	end
end)
