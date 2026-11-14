--[[
  PasarMalam (Script) - Pasar Malam Sabtu di lapangan Stadion Kotak Wetan, mengikuti game web (game.js bangunPasar, worker.js aksi "pasar").

  Buka tiap Sabtu 19.00 sampai 23.00 WIB. Di luar jam itu lapak dan bianglala dibongkar.
    - 5 lapak jajan: Sate 6, Martabak 8, Es dawet 3, Gulali 4, Jagung bakar 5 koin. Paling banyak 20 jajan per malam.
    - Lempar Gelang 10 koin, 3 gelang, paling banyak 10 kali per malam. Kena 2 atau 3 = satu suvenir acak
      (Boneka beruang, Boneka kelinci, Balon, Yoyo, Lampion). Suvenir disimpan dan dihitung di panel Lempar Gelang.
    - Bianglala di tengah lapangan hanya hiasan (sama dengan game web; wahana yang bisa dinaiki ada di Taman Hiburan Tlaga).
  Untuk uji coba di luar jam buka: workspace:SetAttribute("DK_PasarUji", true).

  Simpanan: DataStore DuniaKotak_Pasar_v1, kunci p_<UserId> = { h = hari, pj = jajan hari itu, pg = gelang hari itu, sv = { [nama] = jumlah } }.
  Pintu: ReplicatedStorage.DK_Pasar (RemoteFunction: "gelang"), DK_PasarKabar (RemoteEvent ke klien).
  Pasang sebagai Script di ServerScriptService. Butuh DataWarga (DK_Koin). Pasangan klien: PasarMalam.client.lua.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local DataStoreService = game:GetService("DataStoreService")

local STADION = Vector3.new(0, 0, 825) -- titik tengah lapangan Stadion Kotak Wetan (stud), dari I.fas[12] game web x 1,25
local S = 6.25                         -- 1 satuan aset game web = 6,25 stud
local JAJAN = { sate = { "🍢", "Sate", 6 }, martabak = { "🥞", "Martabak", 8 }, dawet = { "🥤", "Es dawet", 3 }, gulali = { "🍭", "Gulali", 4 }, jagung = { "🌽", "Jagung bakar", 5 } }
local SUVENIR = { { "🧸", "Boneka beruang" }, { "🐰", "Boneka kelinci" }, { "🎈", "Balon" }, { "🪀", "Yoyo" }, { "🏮", "Lampion" } }
local GELANG, GELANG_HARI, JAJAN_HARI = 10, 10, 20
local function rgb(h) return Color3.fromRGB(bit32.rshift(h, 16), bit32.band(bit32.rshift(h, 8), 255), bit32.band(h, 255)) end
-- { x, z (satuan aset dari tengah lapangan), tulisan, warna, jajan }
local LAPAK = { { -4.6, -3.2, "SATE", 0xe0303a, "sate" }, { 0, -3.2, "MARTABAK", 0xf2a020, "martabak" }, { 4.6, -3.2, "ES DAWET", 0x3aa860, "dawet" },
	{ -4.6, 3.2, "GULALI", 0xe06ab0, "gulali" }, { 0, 3.2, "LEMPAR GELANG", 0x3a8ad8, nil }, { 4.6, 3.2, "JAGUNG BAKAR", 0x9a5ad8, "jagung" } }
local FONT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)

local store
do
	local ok, s = pcall(function() return DataStoreService:GetDataStore("DuniaKotak_Pasar_v1") end)
	if ok then store = s else warn("[PasarMalam] DataStore tidak tersedia: " .. tostring(s)) end
end

local function buatPintu(kelas, nama)
	local l = ReplicatedStorage:FindFirstChild(nama)
	if l then l:Destroy() end
	local p = Instance.new(kelas)
	p.Name = nama
	p.Parent = ReplicatedStorage
	return p
end
local pintu = buatPintu("RemoteFunction", "DK_Pasar")
local kabar = buatPintu("RemoteEvent", "DK_PasarKabar")

local lama = workspace:FindFirstChild("DK_PasarMalam")
if lama then lama:Destroy() end

local function hariWIB()
	return os.date("!%Y-%m-%d", os.time() + 7 * 3600)
end
local function pasarBuka()
	if workspace:GetAttribute("DK_PasarUji") == true then return true end
	local t = os.date("!*t", os.time() + 7 * 3600)
	return t.wday == 7 and t.hour >= 19 and t.hour < 23
end

-- ---------- data pemain ----------
local sesi = {}
local function muat(player)
	local s = { data = { h = hariWIB(), pj = 0, pg = 0, sv = {} }, termuat = false, tg = 0 }
	sesi[player] = s
	if not store then return end
	local ok, d = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
	if not ok or sesi[player] ~= s then return end
	if typeof(d) == "table" then
		if typeof(d.sv) == "table" then
			for _, x in ipairs(SUVENIR) do
				local n = tonumber(d.sv[x[2]])
				if n and n > 0 then s.data.sv[x[2]] = math.floor(n) end
			end
		end
		if d.h == s.data.h then
			s.data.pj = math.max(0, math.floor(tonumber(d.pj) or 0))
			s.data.pg = math.max(0, math.floor(tonumber(d.pg) or 0))
		end
	end
	s.termuat = true
end
local function simpan(player)
	local s = sesi[player]
	if not store or not s or not s.termuat then return end
	pcall(function() store:SetAsync("p_" .. player.UserId, s.data) end)
end
local function hariIni(s)
	local h = hariWIB()
	if s.data.h ~= h then s.data.h, s.data.pj, s.data.pg = h, 0, 0 end
	return s.data
end
local function bayar(player, harga)
	local dk = ServerStorage:FindFirstChild("DK_Koin")
	local ok, h = pcall(function() return dk and dk:Invoke(player, -harga) end)
	return ok and h == true
end
local function ringkas(d)
	local punya = 0
	for _, x in ipairs(SUVENIR) do if d.sv[x[2]] then punya += 1 end end
	return { sisaJajan = JAJAN_HARI - d.pj, sisaGelang = GELANG_HARI - d.pg, harga = GELANG, sv = d.sv, punya = punya, semua = #SUVENIR }
end

-- balon ikon di atas kepala selama 2,5 detik (terlihat semua pemain)
local function balon(player, ikon)
	local kepala = player.Character and player.Character:FindFirstChild("Head")
	if not kepala then return end
	local l = kepala:FindFirstChild("DK_BalonPasar")
	if l then l:Destroy() end
	local b = Instance.new("BillboardGui")
	b.Name = "DK_BalonPasar"
	b.Size = UDim2.fromOffset(46, 46)
	b.StudsOffset = Vector3.new(0, 3.4, 0)
	b.AlwaysOnTop = true
	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundTransparency = 1
	t.TextScaled = true
	t.Text = ikon
	t.Parent = b
	b.Parent = kepala
	task.delay(2.5, function() b:Destroy() end)
end

local function jajan(player, id)
	local s, j = sesi[player], JAJAN[id]
	if not s or not j then return end
	if not pasarBuka() then return kabar:FireClient(player, { pesan = "Pasar Malam buka tiap Sabtu 19.00 sampai 23.00 WIB." }) end
	local d = hariIni(s)
	if d.pj >= JAJAN_HARI then return kabar:FireClient(player, { pesan = "Sudah kenyang! Jajan lagi Sabtu depan ya." }) end
	if not bayar(player, j[3]) then return kabar:FireClient(player, { pesan = "Koinmu kurang (" .. j[3] .. " koin)." }) end
	d.pj += 1
	balon(player, j[1])
	kabar:FireClient(player, { pesan = j[1] .. " Nyam! " .. j[2] .. " enak sekali. (-" .. j[3] .. " koin)" })
	task.spawn(simpan, player)
end

local function gelang(player, kena)
	local s = sesi[player]
	if not s then return { galat = "Data belum siap, coba lagi sebentar." } end
	if not pasarBuka() then return { galat = "Pasar Malam buka tiap Sabtu 19.00 sampai 23.00 WIB." } end
	local d = hariIni(s)
	if d.pg >= GELANG_HARI then return { galat = "Gelangnya habis untuk malam ini. Main lagi Sabtu depan!" } end
	if os.clock() - s.tg < 4 then return { galat = "Pelan-pelan, satu-satu ya." } end
	if not bayar(player, GELANG) then return { galat = "Koinmu kurang (" .. GELANG .. " koin)." } end
	kena = math.clamp(math.floor(tonumber(kena) or 0), 0, 3)
	d.pg += 1
	s.tg = os.clock()
	local hasil = { kena = kena }
	if kena >= 2 then
		local sv = SUVENIR[math.random(1, #SUVENIR)]
		hasil.ikon, hasil.nama, hasil.baru = sv[1], sv[2], d.sv[sv[2]] == nil
		d.sv[sv[2]] = (d.sv[sv[2]] or 0) + 1
		balon(player, sv[1])
	end
	hasil.info = ringkas(d)
	task.spawn(simpan, player)
	return hasil
end

pintu.OnServerInvoke = function(player, op, a)
	if op == "gelang" then return gelang(player, a) end
	return { galat = "Perintah tidak dikenal." }
end

Players.PlayerAdded:Connect(function(p) task.spawn(muat, p) end)
for _, p in ipairs(Players:GetPlayers()) do task.spawn(muat, p) end
Players.PlayerRemoving:Connect(function(p) sesi[p] = nil end) -- data sudah disimpan tiap transaksi

-- ---------- bangun dan bongkar pasar ----------
local function bangun()
	local model = Instance.new("Model")
	model.Name = "DK_PasarMalam"
	local function balok(ukuran, cf, warna, neon, induk)
		local p = Instance.new("Part")
		p.Anchored = true
		p.CanCollide = false
		p.CanTouch = false
		p.CanQuery = false
		p.Size = ukuran
		p.CFrame = cf
		p.Color = warna
		p.Material = neon and Enum.Material.Neon or Enum.Material.SmoothPlastic
		p.TopSurface = Enum.SurfaceType.Smooth
		p.BottomSurface = Enum.SurfaceType.Smooth
		p.Parent = induk or model
		return p
	end
	-- tinggi lapangan dicari dengan sinar ke bawah di tengah stadion
	local akar = workspace:FindFirstChild("DuniaKotak3")
	local y = 3
	if akar then
		local rp = RaycastParams.new()
		rp.FilterType = Enum.RaycastFilterType.Include
		rp.FilterDescendantsInstances = { akar }
		local r = workspace:Raycast(STADION + Vector3.new(6, 60, 6), Vector3.new(0, -120, 0), rp)
		if r then y = r.Position.Y end
	end
	local pusat = CFrame.new(STADION.X, y, STADION.Z)
	model:SetAttribute("pusat", pusat.Position)
	local PUTIH = Color3.fromRGB(240, 240, 240)

	for _, l in ipairs(LAPAK) do
		local x, z, teks, warna, id = l[1], l[2], l[3], rgb(l[4]), l[5]
		-- lapak menghadap ke tengah lapangan
		local L = pusat * CFrame.new(x * S, 0, z * S) * CFrame.Angles(0, z > 0 and math.pi or 0, 0)
		local meja = balok(Vector3.new(1.9, 0.75, 0.55) * S, L * CFrame.new(0, 0.38 * S, 0.35 * S), rgb(0x8a5a2a))
		meja.CanCollide = true
		for _, t in ipairs({ { -0.9, -0.45 }, { 0.9, -0.45 }, { -0.9, 0.6 }, { 0.9, 0.6 } }) do
			balok(Vector3.new(0.07, 1.9, 0.07) * S, L * CFrame.new(t[1] * S, 0.95 * S, t[2] * S), rgb(0xdddddd))
		end
		for i = 0, 4 do
			balok(Vector3.new(0.4, 0.1, 1.3) * S, L * CFrame.new((-0.8 + i * 0.4) * S, 1.95 * S, 0.08 * S) * CFrame.Angles(-0.18, 0, 0), i % 2 == 1 and PUTIH or warna)
		end
		local papan = balok(Vector3.new(1.9, 0.45, 0.06) * S, L * CFrame.new(0, 2.32 * S, 0.62 * S), warna)
		local sg = Instance.new("SurfaceGui")
		sg.Face = Enum.NormalId.Back
		sg.CanvasSize = Vector2.new(380, 90)
		sg.LightInfluence = 0
		local t = Instance.new("TextLabel")
		t.Size = UDim2.fromScale(1, 1)
		t.BackgroundTransparency = 1
		t.FontFace = FONT
		t.TextScaled = true
		t.TextColor3 = Color3.new(1, 1, 1)
		t.Text = teks
		t.Parent = sg
		sg.Parent = papan
		for i = 0, 3 do
			balok(Vector3.new(0.22, 0.16, 0.22) * S, L * CFrame.new((-0.6 + i * 0.4) * S, 0.84 * S, 0.38 * S), ({ rgb(0xffd23a), rgb(0xff6a3a), PUTIH, warna })[i + 1])
		end
		local lampu = balok(Vector3.new(0.14, 0.14, 0.14) * S, L * CFrame.new(0, 1.78 * S, 0.4 * S), rgb(0xfff2a0), true)
		local pl = Instance.new("PointLight")
		pl.Color = rgb(0xfff2a0)
		pl.Range = 26
		pl.Brightness = 1.4
		pl.Parent = lampu
		local pr = Instance.new("ProximityPrompt")
		pr.ObjectText = id and (JAJAN[id][2] .. " · " .. JAJAN[id][3] .. " koin") or ("Lempar Gelang · " .. GELANG .. " koin")
		pr.ActionText = id and "Jajan" or "Main"
		pr.MaxActivationDistance = 13
		pr.RequiresLineOfSight = false
		pr.HoldDuration = 0
		pr.Parent = meja
		pr.Triggered:Connect(function(player)
			if id then jajan(player, id)
			elseif sesi[player] then kabar:FireClient(player, { gelang = ringkas(hariIni(sesi[player])) }) end
		end)
	end

	-- bianglala hias di tengah lapangan: roda diputar skrip klien
	for _, sz in ipairs({ -0.35, 0.35 }) do
		for _, sx in ipairs({ -1, 1 }) do
			balok(Vector3.new(0.14, 3.4, 0.14) * S, pusat * CFrame.new(sx * 0.75 * S, 1.6 * S, sz * S) * CFrame.Angles(0, 0, sx * 0.24), rgb(0xdddddd))
		end
	end
	local poros = pusat * CFrame.new(0, 3.1 * S, 0)
	model:SetAttribute("poros", poros.Position)
	local roda = Instance.new("Model")
	roda.Name = "roda"
	local as = balok(Vector3.new(0.25, 0.25, 0.9) * S, poros, rgb(0xffd23a), true, roda)
	roda.PrimaryPart = as
	for i = 0, 23 do
		local a = i / 24 * math.pi * 2
		balok(Vector3.new(0.62, 0.12, 0.12) * S, poros * CFrame.Angles(0, 0, a) * CFrame.new(0, 2.3 * S, 0), rgb(0xff4ab0), true, roda)
		if i % 2 == 0 then balok(Vector3.new(0.33, 0.08, 0.08) * S, poros * CFrame.Angles(0, 0, a) * CFrame.new(0, 1.2 * S, 0), rgb(0x4ad8ff), true, roda) end
	end
	for i = 0, 7 do
		balok(Vector3.new(0.05, 2.3, 0.05) * S, poros * CFrame.Angles(0, 0, i / 8 * math.pi * 2) * CFrame.new(0, 1.15 * S, 0), rgb(0xdddddd), false, roda)
	end
	roda.Parent = model
	local gondola = Instance.new("Folder")
	gondola.Name = "gondola"
	for i = 0, 7 do
		local a = i / 8 * math.pi * 2
		local g = balok(Vector3.new(0.42, 0.34, 0.42) * S, poros * CFrame.new(math.cos(a) * 2.3 * S, math.sin(a) * 2.3 * S - 0.3 * S, 0), ({ rgb(0xe0303a), rgb(0xf2c14a), rgb(0x3a8ad8), rgb(0x3aa860) })[i % 4 + 1], false, gondola)
		g.Name = tostring(i)
	end
	gondola.Parent = model

	-- untaian lampu warna-warni dari tiang sudut ke puncak bianglala
	local WARNA = { rgb(0xff4a4a), rgb(0xffd23a), rgb(0x4ad84a), rgb(0x4aa8ff), rgb(0xff6ad8) }
	local n = 0
	for _, sd in ipairs({ { -6.4, -4.1 }, { 6.4, -4.1 }, { -6.4, 4.1 }, { 6.4, 4.1 } }) do
		balok(Vector3.new(0.1, 3.2, 0.1) * S, pusat * CFrame.new(sd[1] * S, 1.6 * S, sd[2] * S), rgb(0x666666))
		for i = 1, 24 do
			local t = i / 25
			local py = 3.2 + (5.4 - 3.2) * t - math.sin(t * math.pi) * 0.8
			balok(Vector3.new(0.13, 0.13, 0.13) * S, pusat * CFrame.new(sd[1] * (1 - t) * S, py * S, sd[2] * (1 - t) * S), WARNA[n % 5 + 1], true)
			n += 1
		end
	end
	model.Parent = workspace
	return model
end

local model
task.spawn(function()
	while true do
		local buka = pasarBuka()
		if buka and not model then
			model = bangun()
			print("[PasarMalam] pasar dibuka")
		elseif not buka and model then
			model:Destroy()
			model = nil
			print("[PasarMalam] pasar ditutup")
		end
		task.wait(20)
	end
end)
