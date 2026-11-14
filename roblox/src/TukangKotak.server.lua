--[[
  TukangKotak (Script) - "Angkut & Bangun" di lahan proyek fasum, mengikuti game web (/duniakotak/bangun/).

  Aturan disamakan dengan worker.js (TK_*) dan bangun.js:
    - Jalan ke tumpukan bata, kayu, atau semen: bahan menumpuk di punggung, paling banyak 8.
    - Bawa ke lingkaran kuning di gerbang proyek untuk menyetor.
    - 60 bahan disetor = 1 misi. Upah 30 koin untuk 3 misi pertama tiap hari. Misi yang selesai
      kurang dari 45 detik tidak tercatat.
  Di Roblox permainannya langsung di lahan proyek (tanpa pindah halaman), dan upahnya koin Roblox.
  Jadwal proyek dibaca dari data publik game web (hanya membaca); bila tidak terjangkau dipakai jadwal bawaan.

  Simpanan: DataStore DuniaKotak_Tukang_v1, kunci p_<UserId> = { h = hari, n = misi hari itu, t = total misi }.
  Pasang sebagai Script di ServerScriptService. Butuh DataWarga (BindableFunction DK_Koin).
]]

local Players = game:GetService("Players")
local ServerStorage = game:GetService("ServerStorage")
local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")

local BAHAN, MUAT, UPAH, MISI_UPAH, MIN_LAMA = 60, 8, 30, 3, 45
local JANGKAU, JANGKAU_HUD = 9, 170
local FONT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local GESER = { wetan = Vector3.new(0, 0, 0), kulon = Vector3.new(-10000, 0, 0), curug = Vector3.new(0, 0, -10000), tlaga = Vector3.new(0, 0, 10000) }
-- letak tengah lahan (stud, belum digeser) per aset fasum; jadwal bawaan dalam detik UTC
local PROYEK = {
	kafe = { nama = "Kafe Bukit", dusun = "kulon", pos = Vector3.new(156.25, 48.75, -553.75), mulai = 1794589200, sampai = 1795194000 }, -- 14–21 Nov 2026 WIB
}
local URL = {
	"https://willoapparel.com/duniakotak/api/bangun",
	"https://willoapparel.wjzyy9fpzd.workers.dev/duniakotak/api/bangun",
}
local JENIS = {
	{ id = "bata", nama = "Bata", warna = Color3.fromRGB(196, 92, 62), geser = Vector3.new(-58, 0, 50) },
	{ id = "kayu", nama = "Kayu", warna = Color3.fromRGB(176, 128, 74), geser = Vector3.new(58, 0, 50) },
	{ id = "semen", nama = "Semen", warna = Color3.fromRGB(170, 174, 180), geser = Vector3.new(36, 0, 50) },
}
local SETOR = Vector3.new(0, 0, 50)

local store
do
	local ok, s = pcall(function() return DataStoreService:GetDataStore("DuniaKotak_Tukang_v1") end)
	if ok then store = s else warn("[TukangKotak] DataStore tidak tersedia: " .. tostring(s)) end
end

local lama = workspace:FindFirstChild("DK_Tukang")
if lama then lama:Destroy() end
local akar = workspace:FindFirstChild("DuniaKotak3")

local function hariWIB()
	return os.date("!%Y-%m-%d", os.time() + 7 * 3600)
end

-- jadwal: { [aset] = { mulai, sampai } } dari web, kalau terjangkau
local function bacaJadwal()
	for _, url in ipairs(URL) do
		local ok, isi = pcall(function() return HttpService:GetAsync(url, true) end)
		if ok then
			local ok2, j = pcall(function() return HttpService:JSONDecode(isi) end)
			if ok2 and typeof(j) == "table" and typeof(j.proyek) == "table" then
				local hasil = {}
				for _, x in ipairs(j.proyek) do
					if typeof(x) == "table" and typeof(x.aset) == "string" and tonumber(x.mulai) and tonumber(x.sampai) then
						hasil[x.aset] = { mulai = tonumber(x.mulai) / 1000, sampai = tonumber(x.sampai) / 1000 }
					end
				end
				return hasil
			end
		end
	end
	return nil
end

local jadwal = bacaJadwal()
local function proyekAktif()
	local kini = os.time()
	for aset, p in pairs(PROYEK) do
		local j = jadwal and jadwal[aset] or (not jadwal and p) or nil
		if j and kini >= j.mulai and kini < j.sampai and akar and akar:FindFirstChild(p.dusun) then return aset, p end
	end
	return nil
end

local aset, proyek = proyekAktif()
if not proyek then
	print("[TukangKotak] belum ada proyek fasum yang sedang dibangun")
	return
end

local dusun = akar:FindFirstChild(proyek.dusun)
local geser = dusun:GetAttribute("geser")
if typeof(geser) ~= "Vector3" then geser = GESER[proyek.dusun] end
local tengah = geser + proyek.pos

local rp = RaycastParams.new()
rp.FilterType = Enum.RaycastFilterType.Include
rp.FilterDescendantsInstances = { dusun }
local function tanah(p)
	local r = workspace:Raycast(Vector3.new(p.X, tengah.Y + 60, p.Z), Vector3.new(0, -160, 0), rp)
	return Vector3.new(p.X, r and r.Position.Y or tengah.Y, p.Z)
end

local folder = Instance.new("Folder")
folder.Name = "DK_Tukang"
folder:SetAttribute("proyek", aset)

local function balok(ukuran, cf, warna, bahan)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.CanTouch = false
	p.Size = ukuran
	p.CFrame = cf
	p.Color = warna
	p.Material = bahan or Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = folder
	return p
end

local function papan(induk, teks, tinggi)
	local b = Instance.new("BillboardGui")
	b.Size = UDim2.fromOffset(220, 44)
	b.StudsOffset = Vector3.new(0, tinggi, 0)
	b.AlwaysOnTop = false
	b.MaxDistance = 140
	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundColor3 = Color3.fromRGB(29, 29, 34)
	t.BackgroundTransparency = 0.15
	t.TextColor3 = Color3.new(1, 1, 1)
	t.FontFace = FONT
	t.TextSize = 16
	t.TextWrapped = true
	t.Text = teks
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, 10)
	c.Parent = t
	t.Parent = b
	b.Parent = induk
	return t
end

-- tumpukan bahan
local tumpukan = {}
for _, j in ipairs(JENIS) do
	local dasar = tanah(tengah + j.geser)
	local inti
	for i = 0, 11 do
		local lapis = math.floor(i / 4)
		local kol = i % 4
		local p = balok(Vector3.new(2.6, 1.3, 1.6), CFrame.new(dasar + Vector3.new((kol % 2) * 2.8 - 1.4, 0.65 + lapis * 1.35, math.floor(kol / 2) * 1.8 - 0.9)), j.warna)
		inti = inti or p
	end
	papan(inti, "Tumpukan " .. j.nama, 7)
	table.insert(tumpukan, { jenis = j, pos = dasar })
end

-- titik setor: lingkaran kuning di gerbang proyek
local setor = tanah(tengah + SETOR)
local cincin = balok(Vector3.new(0.4, 14, 14), CFrame.new(setor + Vector3.new(0, 0.25, 0)) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(255, 210, 58), Enum.Material.Neon)
cincin.Shape = Enum.PartType.Cylinder
cincin.Transparency = 0.25
local teksSetor = papan(cincin, "Proyek " .. proyek.nama .. " · setor bahan di sini", 9)
folder:SetAttribute("setor", setor)
folder:SetAttribute("tumpukan", tumpukan[1].pos)
folder.Parent = workspace

-- ---------- data pemain ----------
local sesi = {} -- [player] = { data, termuat, bawa = {jenis...}, setor, mulai, hud, pesan }

local function muat(player)
	local s = { data = { h = hariWIB(), n = 0, t = 0 }, termuat = false, bawa = {}, setor = 0, mulai = 0, pesan = 0 }
	sesi[player] = s
	if not store then return end
	local ok, d = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
	if not ok or sesi[player] ~= s then return end
	if typeof(d) == "table" then
		s.data.t = math.max(0, math.floor(tonumber(d.t) or 0))
		if d.h == s.data.h then s.data.n = math.max(0, math.floor(tonumber(d.n) or 0)) end
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
	if s.data.h ~= h then s.data.h = h s.data.n = 0 end
	return s.data
end

local function ubahKoin(player, jumlah)
	local dk = ServerStorage:FindFirstChild("DK_Koin")
	local ok, hasil = pcall(function() return dk and dk:Invoke(player, jumlah) end)
	return ok and hasil == true
end

local function kabari(player, teks)
	local pg = player:FindFirstChildOfClass("PlayerGui")
	if not pg then return end
	local l = pg:FindFirstChild("DK_KabarTukang")
	if l then l:Destroy() end
	local gui = Instance.new("ScreenGui")
	gui.Name = "DK_KabarTukang"
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

-- HUD kecil di bawah tengah: isi punggung dan sisa setoran
local function tulisHud(player, s, tampil)
	local pg = player:FindFirstChildOfClass("PlayerGui")
	if not pg then return end
	local gui = pg:FindFirstChild("DK_Tukang")
	if not tampil then
		if gui then gui:Destroy() end
		return
	end
	local t = gui and gui:FindFirstChild("T")
	if not t then
		gui = Instance.new("ScreenGui")
		gui.Name = "DK_Tukang"
		gui.ResetOnSpawn = false
		gui.DisplayOrder = 20
		t = Instance.new("TextLabel")
		t.Name = "T"
		t.AnchorPoint = Vector2.new(0.5, 1)
		t.Position = UDim2.new(0.5, 0, 1, -64)
		t.AutomaticSize = Enum.AutomaticSize.XY
		t.BackgroundColor3 = Color3.fromRGB(29, 29, 34)
		t.BackgroundTransparency = 0.15
		t.TextColor3 = Color3.new(1, 1, 1)
		t.FontFace = FONT
		t.TextSize = 14
		local c = Instance.new("UICorner")
		c.CornerRadius = UDim.new(0, 10)
		c.Parent = t
		local p = Instance.new("UIPadding")
		p.PaddingLeft = UDim.new(0, 10)
		p.PaddingRight = UDim.new(0, 10)
		p.PaddingTop = UDim.new(0, 6)
		p.PaddingBottom = UDim.new(0, 6)
		p.Parent = t
		t.Parent = gui
		gui.Parent = pg
	end
	local petunjuk
	if #s.bawa >= MUAT then petunjuk = "Penuh! Bawa ke lingkaran kuning"
	elseif #s.bawa > 0 then petunjuk = "Ambil lagi atau setor ke lingkaran kuning"
	else petunjuk = "Jalan ke tumpukan bata, kayu, atau semen" end
	t.Text = "🔨 " .. proyek.nama .. "  ·  🎒 " .. #s.bawa .. "/" .. MUAT .. "  ·  Setor " .. (BAHAN - s.setor) .. " lagi\n" .. petunjuk
end

-- bahan di punggung
local function gambarPunggung(player, s)
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if not hrp then return end
	local m = char:FindFirstChild("DK_Bawaan")
	if m then m:Destroy() end
	if #s.bawa == 0 then return end
	m = Instance.new("Model")
	m.Name = "DK_Bawaan"
	for i, j in ipairs(s.bawa) do
		local p = Instance.new("Part")
		p.Size = Vector3.new(1.7, 0.55, 1.1)
		p.Color = j.warna
		p.Material = Enum.Material.SmoothPlastic
		p.CanCollide = false
		p.CanQuery = false
		p.CanTouch = false
		p.Massless = true
		p.CFrame = hrp.CFrame * CFrame.new(0, -0.9 + (i - 1) * 0.58, 1.15)
		local w = Instance.new("WeldConstraint")
		w.Part0 = hrp
		w.Part1 = p
		w.Parent = p
		p.Parent = m
	end
	m.Parent = char
end

local function selesaiMisi(player, s)
	local lamaMain = os.clock() - s.mulai
	s.setor = 0
	s.mulai = 0
	if lamaMain < MIN_LAMA then
		return kabari(player, "Kerjanya tidak tercatat. Mulai lagi dari awal ya.")
	end
	local d = hariIni(s)
	d.n += 1
	d.t += 1
	if d.n <= MISI_UPAH and ubahKoin(player, UPAH) then
		kabari(player, "🎉 Misi selesai! Upah +" .. UPAH .. " koin (misi berupah hari ini " .. d.n .. "/" .. MISI_UPAH .. ").")
	else
		kabari(player, "🎉 Misi selesai! Upah hari ini sudah habis, terima kasih sudah ikut membangun.")
	end
	task.spawn(simpan, player)
end

Players.PlayerAdded:Connect(function(p) task.spawn(muat, p) end)
for _, p in ipairs(Players:GetPlayers()) do task.spawn(muat, p) end
Players.PlayerRemoving:Connect(function(p)
	sesi[p] = nil -- data sudah disimpan tiap misi selesai
end)

local total = 0
local function tulisPapan()
	teksSetor.Text = "Proyek " .. proyek.nama .. " · setor bahan di sini\nWarga sudah menyetor " .. total .. " bahan"
end

local hitung = 0
while true do
	task.wait(0.35)
	hitung += 1
	if hitung % 1700 == 0 then -- tiap ±10 menit: proyek sudah selesai?
		local baru = bacaJadwal()
		if baru then jadwal = baru end
		local a = proyekAktif()
		if a ~= aset then
			for p, s in pairs(sesi) do
				s.bawa = {}
				gambarPunggung(p, s)
				tulisHud(p, s, false)
			end
			folder:Destroy()
			print("[TukangKotak] proyek " .. proyek.nama .. " selesai")
			break
		end
	end
	for player, s in pairs(sesi) do
		local char = player.Character
		local hrp = char and char:FindFirstChild("HumanoidRootPart")
		if hrp then
			local pos = hrp.Position
			local dekat = (pos - setor).Magnitude < JANGKAU_HUD
			if dekat ~= (s.hud == true) then
				s.hud = dekat
				tulisHud(player, s, dekat)
				if not dekat and #s.bawa > 0 then
					s.bawa = {}
					gambarPunggung(player, s)
				end
			end
			if dekat then
				local sibuk = (player:GetAttribute("DK_Naik") or "") ~= "" or (player:GetAttribute("DK_Wahana") or "") ~= ""
				local berubah = false
				for _, t in ipairs(tumpukan) do
					if (Vector3.new(pos.X, t.pos.Y, pos.Z) - t.pos).Magnitude < JANGKAU and math.abs(pos.Y - t.pos.Y) < 14 then
						if sibuk then
							if os.clock() - s.pesan > 5 then
								s.pesan = os.clock()
								kabari(player, "Turun dulu dari kendaraanmu untuk mengangkut bahan.")
							end
						elseif #s.bawa < MUAT then
							if s.mulai == 0 then s.mulai = os.clock() end
							table.insert(s.bawa, t.jenis)
							berubah = true
						end
					end
				end
				if #s.bawa > 0 and (Vector3.new(pos.X, setor.Y, pos.Z) - setor).Magnitude < JANGKAU and math.abs(pos.Y - setor.Y) < 14 then
					local n = math.min(#s.bawa, BAHAN - s.setor)
					s.setor += n
					total += n
					s.bawa = {}
					berubah = true
					tulisPapan()
					if s.setor >= BAHAN then selesaiMisi(player, s) end
				end
				if berubah then
					gambarPunggung(player, s)
					tulisHud(player, s, true)
				end
			end
		end
	end
end
