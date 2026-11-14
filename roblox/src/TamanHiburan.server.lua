--[[
  TamanHiburan (Script) - wahana Taman Hiburan di Kotak Tlaga: Bianglala dan Komidi Putar, tiket koin, dan jaga loket.
  Aturan sama dengan game web (worker.js: WAHANA, aksi "taman").
  Tempat: ServerScriptService.TamanHiburan. Pasangannya: StarterPlayerScripts.TamanHiburan (memutar wahana di layar pemain).

  Aturan web yang disalin:
    - Bianglala 5 koin, 40 detik. Komidi Putar 3 koin, 30 detik. Maks 10 kali naik wahana sehari (hari WIB).
    - Jaga loket 15 menit: petugas dapat 2 koin per tiket Bianglala dan 1 koin per tiket Komidi dari warga lain,
      maks 60 koin sehari. Hanya satu petugas dalam satu waktu (di sini: per server).

  Wahana di map adalah balok diam. Putarannya dihitung dari jam server (sudut = kecepatan x waktu), jadi skrip klien
  memutar balok wahana di layar tiap pemain dan server menggerakkan penumpang dengan rumus yang sama.
  Folder workspace.DK_Wahana menyimpan atribut titik pusat wahana untuk skrip klien.

  Simpanan: DataStore DuniaKotak_Taman_v1, kunci p_<UserId> = { h = hari, n = jumlah naik, lk = koin loket hari itu }.
]]
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ServerStorage = game:GetService("ServerStorage")
local DataStoreService = game:GetService("DataStoreService")

local S = 6.25 -- 1 satuan aset web = 6,25 stud
local TAMAN = Vector3.new(275, 0, -1566.2) -- titik tengah lahan (stud, belum digeser), dari alat/ekspor_web.js
local GESER_TLAGA = Vector3.new(0, 0, 10000)
local WAHANA = {
	bianglala = { nama = "Bianglala", harga = 5, lama = 40, bagi = 2, pusat = Vector3.new(-4.6, 8.7, -5.6) * S, jari = 4.2 * S, laju = 0.25, tombol = Vector3.new(-4.6, 1, -2.6) * S },
	komidi = { nama = "Komidi Putar", harga = 3, lama = 30, bagi = 1, pusat = Vector3.new(4.6, 0, -4.6) * S, jari = 2.3 * S, laju = 0.5, tombol = Vector3.new(4.6, 1, -0.4) * S },
}
local LOKET = Vector3.new(-6.6, 1, 4.6) * S
local SEHARI, LOKET_MAKS, LOKET_LAMA = 10, 60, 15 * 60
local FONT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)

local store
do
	local ok, s = pcall(function() return DataStoreService:GetDataStore("DuniaKotak_Taman_v1") end)
	if ok then store = s else warn("[TamanHiburan] DataStore tidak tersedia: " .. tostring(s)) end
end

local akar = workspace:FindFirstChild("DuniaKotak3")
local dusun = akar and akar:FindFirstChild("tlaga")
local lamaF = workspace:FindFirstChild("DK_Wahana")
if lamaF then lamaF:Destroy() end
if not dusun then
	warn("[TamanHiburan] Dusun Tlaga belum ada di map; wahana tidak dijalankan")
	return
end
local geser = dusun:GetAttribute("geser")
if typeof(geser) ~= "Vector3" then geser = GESER_TLAGA end
local tengah = geser + TAMAN

local folder = Instance.new("Folder")
folder.Name = "DK_Wahana"
folder:SetAttribute("bianglala", tengah + WAHANA.bianglala.pusat)
folder:SetAttribute("komidi", tengah + WAHANA.komidi.pusat)
folder:SetAttribute("lajuBianglala", WAHANA.bianglala.laju)
folder:SetAttribute("lajuKomidi", WAHANA.komidi.laju)
folder:SetAttribute("jariBianglala", WAHANA.bianglala.jari)
folder.Parent = workspace

local function hariWIB()
	return os.date("!%Y-%m-%d", os.time() + 7 * 3600)
end

local function kabari(player, teks)
	local pg = player:FindFirstChildOfClass("PlayerGui")
	if not pg then return end
	local l = pg:FindFirstChild("DK_KabarTaman")
	if l then l:Destroy() end
	local gui = Instance.new("ScreenGui")
	gui.Name = "DK_KabarTaman"
	gui.ResetOnSpawn = false
	gui.DisplayOrder = 30
	local t = Instance.new("TextLabel")
	t.AnchorPoint = Vector2.new(0.5, 0)
	t.Position = UDim2.new(0.5, 0, 0, 64)
	t.AutomaticSize = Enum.AutomaticSize.XY
	t.BackgroundColor3 = Color3.fromRGB(29, 29, 34)
	t.BackgroundTransparency = 0.1
	t.TextColor3 = Color3.new(1, 1, 1)
	t.FontFace = FONT
	t.TextSize = 15
	t.Text = teks
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, 10)
	c.Parent = t
	local p = Instance.new("UIPadding")
	p.PaddingLeft = UDim.new(0, 12)
	p.PaddingRight = UDim.new(0, 12)
	p.PaddingTop = UDim.new(0, 8)
	p.PaddingBottom = UDim.new(0, 8)
	p.Parent = t
	t.Parent = gui
	gui.Parent = pg
	task.delay(4, function() gui:Destroy() end)
end

-- kursi wahana dicari dari balok map: kabin bianglala (kubus 1 satuan) dan kuda komidi (0,5 x 0,6 x 1,1 satuan)
local op = OverlapParams.new()
op.FilterType = Enum.RaycastFilterType.Include
op.FilterDescendantsInstances = { dusun }

local kursi = { bianglala = {}, komidi = {} } -- { rel = letak terhadap pusat, oleh = pemain }
do
	local w = WAHANA.bianglala
	local pusat = tengah + w.pusat
	for _, part in ipairs(workspace:GetPartBoundsInBox(CFrame.new(pusat), Vector3.new(w.jari * 2 + 14, w.jari * 2 + 14, 7), op)) do
		local sz = part.Size
		if math.abs(sz.X - S) < 0.4 and math.abs(sz.Y - S) < 0.4 and math.abs(sz.Z - S) < 0.4 then
			local rel = part.Position - pusat
			if math.abs(Vector2.new(rel.X, rel.Y).Magnitude - w.jari) < 6 then table.insert(kursi.bianglala, { rel = rel }) end
		end
	end
	w = WAHANA.komidi
	pusat = tengah + w.pusat
	for _, part in ipairs(workspace:GetPartBoundsInBox(CFrame.new(pusat + Vector3.new(0, 10, 0)), Vector3.new(w.jari * 2 + 12, 16, w.jari * 2 + 12), op)) do
		local sz = part.Size
		local ukuran = { sz.X, sz.Y, sz.Z }
		table.sort(ukuran)
		if math.abs(ukuran[1] - 0.5 * S) < 0.4 and math.abs(ukuran[2] - 0.6 * S) < 0.4 and math.abs(ukuran[3] - 1.1 * S) < 0.4 then
			table.insert(kursi.komidi, { rel = part.Position - pusat })
		end
	end
	-- kalau balok kursi tidak ketemu, pakai letak rumus aset web
	if #kursi.bianglala == 0 then
		for i = 0, 7 do
			local a = i / 8 * math.pi * 2
			table.insert(kursi.bianglala, { rel = Vector3.new(math.cos(a) * WAHANA.bianglala.jari, math.sin(a) * WAHANA.bianglala.jari - 0.6 * S, 0) })
		end
	end
	if #kursi.komidi == 0 then
		for i = 0, 5 do
			local a = i / 6 * math.pi * 2
			table.insert(kursi.komidi, { rel = Vector3.new(math.cos(a) * WAHANA.komidi.jari, 1.5 * S, math.sin(a) * WAHANA.komidi.jari) })
		end
	end
	print("[TamanHiburan] kursi bianglala " .. #kursi.bianglala .. ", kuda komidi " .. #kursi.komidi)
end

local sesi = {} -- [player] = { data = { h, n, lk }, termuat }
local naik = {} -- [player] = { id, k = kursi, sampai }
local petugas -- { player, sampai }

local function muat(player)
	local s = { data = { h = hariWIB(), n = 0, lk = 0 }, termuat = false }
	sesi[player] = s
	if not store then return end
	local ok, d = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
	if not ok or sesi[player] ~= s then return end
	if typeof(d) == "table" and d.h == s.data.h then
		s.data.n = math.max(0, math.floor(tonumber(d.n) or 0))
		s.data.lk = math.max(0, math.floor(tonumber(d.lk) or 0))
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
	if s.data.h ~= h then s.data = { h = h, n = 0, lk = 0 } end
	return s.data
end

local function koinPemain(player)
	local ls = player:FindFirstChild("leaderstats")
	local k = ls and ls:FindFirstChild("Koin")
	return k and k.Value or 0
end

local function ubahKoin(player, jumlah)
	local dk = ServerStorage:FindFirstChild("DK_Koin")
	local ok, hasil = pcall(function() return dk and dk:Invoke(player, jumlah) end)
	return ok and hasil == true
end

local function petugasKini()
	if petugas and (petugas.sampai <= os.time() or not petugas.player.Parent) then petugas = nil end
	return petugas
end

-- letak kursi saat ini (rumus yang sama dipakai skrip klien untuk memutar balok wahana)
local function letakKursi(id, k)
	local w = WAHANA[id]
	local sudut = (w.laju * workspace:GetServerTimeNow()) % (math.pi * 2) -- dibungkus: CFrame.Angles kehilangan ketelitian untuk sudut besar
	local pusat = tengah + w.pusat
	if id == "bianglala" then
		local p = CFrame.Angles(0, 0, sudut) * k.rel
		return CFrame.new(pusat + p + Vector3.new(0, S / 2 + 2.6, 0)) -- duduk di atas kabin supaya terlihat
	end
	local p = CFrame.Angles(0, sudut, 0) * k.rel
	local hadap = CFrame.Angles(0, sudut, 0) * Vector3.new(k.rel.Z, 0, -k.rel.X) -- arah maju putaran
	return CFrame.lookAt(pusat + p + Vector3.new(0, 3.2, 0), pusat + p + Vector3.new(0, 3.2, 0) + hadap)
end

local function turun(player, pesan)
	local n = naik[player]
	if not n then return end
	naik[player] = nil
	n.k.oleh = nil
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if hrp then
		hrp.CFrame = CFrame.new(tengah + WAHANA[n.id].tombol + Vector3.new(0, 4, 6))
		hrp.Anchored = false
	end
	if hum then hum.Sit = false end
	player:SetAttribute("DK_Wahana", "")
	if pesan and player.Parent then kabari(player, pesan) end
end

local function naikWahana(player, id)
	local w, s = WAHANA[id], sesi[player]
	if not w or not s then return end
	if naik[player] then return kabari(player, "Masih di wahana, tunggu sampai turun dulu.") end
	if (player:GetAttribute("DK_Naik") or "") ~= "" then return kabari(player, "Turun dulu dari kendaraanmu.") end
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not hrp or not hum or hum.Health <= 0 then return end
	if (hrp.Position - (tengah + w.tombol)).Magnitude > 70 then return end
	local d = hariIni(s)
	if d.n >= SEHARI then return kabari(player, "Sudah " .. SEHARI .. "x naik wahana hari ini. Main lagi besok ya!") end
	local kosong
	for _, k in ipairs(kursi[id]) do
		if not k.oleh then kosong = k break end
	end
	if not kosong then return kabari(player, w.nama .. " sedang penuh, tunggu sebentar ya.") end
	if koinPemain(player) < w.harga then return kabari(player, "Koinmu kurang (" .. w.harga .. " koin).") end
	if not ubahKoin(player, -w.harga) then return kabari(player, "Koin belum bisa dipotong, coba lagi.") end
	d.n += 1
	kosong.oleh = player
	naik[player] = { id = id, k = kosong, sampai = os.clock() + w.lama }
	hrp.Anchored = true
	hum.Sit = true
	player:SetAttribute("DK_Wahana", id)
	local teks = (id == "bianglala" and "🎡 " or "🎠 ") .. "Naik " .. w.nama .. "! (-" .. w.harga .. " koin)"
	-- bagian petugas loket (bukan diri sendiri), dibatasi per hari per petugas
	local pt = petugasKini()
	if pt and pt.player ~= player then
		local ps = sesi[pt.player]
		if ps then
			local pd = hariIni(ps)
			local b = math.min(w.bagi, LOKET_MAKS - pd.lk)
			if b > 0 and ubahKoin(pt.player, b) then
				pd.lk += b
				kabari(pt.player, "🎟️ " .. player.DisplayName .. " beli tiket " .. w.nama .. ". Kamu dapat +" .. b .. " koin.")
			end
		end
	end
	kabari(player, teks)
end

local function jagaLoket(player)
	local s = sesi[player]
	if not s then return end
	local pt = petugasKini()
	if pt and pt.player == player then
		petugas = nil
		return kabari(player, "Kamu selesai jaga loket. Terima kasih!")
	end
	if pt then return kabari(player, "Loket sedang dijaga " .. pt.player.DisplayName .. ". Coba lagi nanti ya.") end
	petugas = { player = player, sampai = os.time() + LOKET_LAMA }
	local d = hariIni(s)
	kabari(player, "🎟️ Kamu jaga loket 15 menit. Tiap tiket warga lain memberi koin (hari ini " .. d.lk .. "/" .. LOKET_MAKS .. ").")
end

local function tombol(nama, letak, aksi, objek, fn)
	local part = Instance.new("Part")
	part.Name = nama
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.Transparency = 1
	part.Size = Vector3.new(2, 2, 2)
	part.CFrame = CFrame.new(tengah + letak)
	local pr = Instance.new("ProximityPrompt")
	pr.ActionText = aksi
	pr.ObjectText = objek
	pr.MaxActivationDistance = 22
	pr.RequiresLineOfSight = false
	pr.HoldDuration = 0
	pr.Parent = part
	pr.Triggered:Connect(fn)
	part.Parent = folder
end
tombol("bianglala", WAHANA.bianglala.tombol, "Naik · 5 koin", "Bianglala", function(p) naikWahana(p, "bianglala") end)
tombol("komidi", WAHANA.komidi.tombol, "Naik · 3 koin", "Komidi Putar", function(p) naikWahana(p, "komidi") end)
tombol("loket", LOKET, "Jaga loket", "Loket Taman Hiburan", jagaLoket)

RunService.Heartbeat:Connect(function()
	local kini = os.clock()
	for player, n in pairs(naik) do
		local char = player.Character
		local hrp = char and char:FindFirstChild("HumanoidRootPart")
		if not hrp or not player.Parent then
			n.k.oleh = nil
			naik[player] = nil
		elseif kini >= n.sampai then
			turun(player, "Seru kan? Sampai jumpa di wahana berikutnya!")
		else
			hrp.CFrame = letakKursi(n.id, n.k)
		end
	end
end)

local function pasang(player)
	player:SetAttribute("DK_Wahana", "")
	player.CharacterRemoving:Connect(function()
		local n = naik[player]
		if n then
			n.k.oleh = nil
			naik[player] = nil
			player:SetAttribute("DK_Wahana", "")
		end
	end)
	muat(player)
end
Players.PlayerAdded:Connect(pasang)
for _, p in ipairs(Players:GetPlayers()) do
	task.spawn(pasang, p)
end
Players.PlayerRemoving:Connect(function(player)
	local n = naik[player]
	if n then n.k.oleh = nil end
	naik[player] = nil
	if petugas and petugas.player == player then petugas = nil end
	simpan(player)
	sesi[player] = nil
end)
game:BindToClose(function()
	for _, p in ipairs(Players:GetPlayers()) do
		simpan(p)
	end
end)
