--[[
  DUNIA KOTAK (Roblox) - SAWAH JURAGAN v1
  ---------------------------------------------------------------
  CARA PASANG (sekali saja):
  1. Explorer > ServerScriptService > klik + > Script.
  2. Ganti namanya jadi "SawahJuragan", hapus isi bawaan, tempel SELURUH file ini.
  3. Play (F5). Di dekat titik muncul ada papan hijau "SAWAH JURAGAN":
     dekati, tekan E (HP: ketuk tombol) = pindah ke pulau sawah.

  CARA MAIN:
  - Tiap pemain dapat 1 baris sawah (10 petak, 3 terbuka di awal).
  - Kios Benih: pilih benih. Padi gratis, yang lain bayar koin saat ditanam.
  - Dekati petak: Tanam -> Siram (sekali, waktu tumbuh -25%) -> Panen.
  - Tanaman tetap tumbuh walau pemain keluar game (balik lagi = panen).
  - Kadang tumbuh tanaman LANGKA: Emas (x5 harga) atau Pelangi (x20, diumumkan ke semua).
  - Hasil panen masuk Lumbung (maks 40), jual di Pasar = koin.
  - Petak 4-6 dibuka pakai koin. Petak 7-10 lewat Game Pass "Sawah Tambahan".

  ROBUX (opsional, isi ID setelah dibuat di Creator Hub; biarkan 0 = tombol tidak muncul):
  - DEV_PUPUK_AJAIB     : Developer Product, semua tanaman langsung siap panen.
  - PASS_PANEN_CEPAT    : Game Pass, waktu tumbuh jadi setengah.
  - PASS_SAWAH_TAMBAHAN : Game Pass, petak 7-10 terbuka.
  Catatan: skrip ini memakai MarketplaceService.ProcessReceipt. Kalau nanti ada
  skrip lain yang juga menjual Developer Product, gabungkan ke satu skrip.

  KOIN: kalau belum ada skrip lain yang membuat leaderstats "Koin", skrip ini
  membuatnya sendiri dan menyimpannya (DataStore "DuniaKotak_v1", sama dengan skrip lama).
]]

local DEV_PUPUK_AJAIB = 0
local PASS_PANEN_CEPAT = 0
local PASS_SAWAH_TAMBAHAN = 0

-- Letak pulau sawah: di luar map Kotak Wetan (batas x -431..812). Ubah kalau bertabrakan.
local POSISI_SAWAH = Vector3.new(1000, 0, -1000)

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local MarketplaceService = game:GetService("MarketplaceService")

local BENIH = {
	{ id = "padi", nama = "Padi", harga = 0, waktu = 60, jual = 3, warna = Color3.fromRGB(235, 205, 90) },
	{ id = "jagung", nama = "Jagung", harga = 5, waktu = 180, jual = 12, warna = Color3.fromRGB(255, 210, 40) },
	{ id = "cabai", nama = "Cabai", harga = 15, waktu = 480, jual = 40, warna = Color3.fromRGB(225, 35, 35) },
	{ id = "bawang", nama = "Bawang Merah", harga = 40, waktu = 1200, jual = 110, warna = Color3.fromRGB(170, 55, 120) },
	{ id = "melon", nama = "Melon", harga = 100, waktu = 2700, jual = 300, warna = Color3.fromRGB(140, 215, 90) },
}
local BENIH_ID = {}
for _, b in ipairs(BENIH) do
	BENIH_ID[b.id] = b
end

local MUTASI = {
	emas = { nama = "Emas", kali = 5, peluang = 0.04, warna = Color3.fromRGB(255, 200, 0) },
	pelangi = { nama = "Pelangi", kali = 20, peluang = 0.005, warna = Color3.fromRGB(255, 80, 220) },
}

local JUMLAH_PETAK = 10
local PETAK_AWAL = 3
local HARGA_PETAK = { [4] = 30, [5] = 100, [6] = 300 }
local PETAK_PASS = 7 -- petak 7..10 butuh Game Pass
local MAKS_LUMBUNG = 40
local MAKS_BARIS = 16

---------------------------------------------------------------------
-- Alat bantu bangun
---------------------------------------------------------------------
local ROOT = workspace:FindFirstChild("SawahJuragan")
if ROOT then
	ROOT:Destroy()
end
ROOT = Instance.new("Folder")
ROOT.Name = "SawahJuragan"

local function part(induk, nama, ukuran, cf, warna, bahan, tembus)
	local p = Instance.new("Part")
	p.Name = nama
	p.Anchored = true
	p.Size = ukuran
	p.CFrame = cf
	p.Color = warna
	p.Material = bahan or Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	if tembus then
		p.CanCollide = false
	end
	p.Parent = induk
	return p
end

local function papanTeks(p, isi, tinggi, lebar, jarak)
	local bb = Instance.new("BillboardGui")
	bb.Name = "Teks"
	bb.Size = UDim2.fromOffset(lebar or 200, 50)
	bb.StudsOffset = Vector3.new(0, tinggi or 3, 0)
	bb.MaxDistance = jarak or 45
	bb.AlwaysOnTop = false
	bb.Adornee = p
	bb.Parent = p
	local t = Instance.new("TextLabel")
	t.Name = "Label"
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundTransparency = 1
	t.TextScaled = true
	t.Font = Enum.Font.FredokaOne
	t.TextColor3 = Color3.new(1, 1, 1)
	t.TextStrokeTransparency = 0.2
	t.Text = isi
	t.Parent = bb
	return t
end

local function tombol(p, aksi, objek, tahan)
	local pr = Instance.new("ProximityPrompt")
	pr.ActionText = aksi
	pr.ObjectText = objek or ""
	pr.HoldDuration = tahan or 0
	pr.RequiresLineOfSight = false
	pr.MaxActivationDistance = 10
	pr.Parent = p
	return pr
end

local function fmtWaktu(dtk)
	dtk = math.max(0, math.floor(dtk))
	local m = math.floor(dtk / 60)
	local s = dtk % 60
	if m >= 60 then
		return string.format("%d:%02d:%02d", math.floor(m / 60), m % 60, s)
	end
	return string.format("%d:%02d", m, s)
end

---------------------------------------------------------------------
-- Pulau sawah
---------------------------------------------------------------------
local O = POSISI_SAWAH
local LEBAR_X, LEBAR_Z = 170, 240
part(ROOT, "Tanah", Vector3.new(LEBAR_X, 4, LEBAR_Z), CFrame.new(O + Vector3.new(0, -2, 0)),
	Color3.fromRGB(110, 175, 80), Enum.Material.Grass)
-- tanggul pinggir
for _, s in ipairs({ -1, 1 }) do
	part(ROOT, "Tanggul", Vector3.new(LEBAR_X, 1.5, 2), CFrame.new(O + Vector3.new(0, 0.75, s * LEBAR_Z / 2)),
		Color3.fromRGB(120, 90, 60), Enum.Material.Ground)
	part(ROOT, "Tanggul", Vector3.new(2, 1.5, LEBAR_Z), CFrame.new(O + Vector3.new(s * LEBAR_X / 2, 0.75, 0)),
		Color3.fromRGB(120, 90, 60), Enum.Material.Ground)
end

-- titik datang
local DATANG = part(ROOT, "TitikDatang", Vector3.new(10, 0.4, 10), CFrame.new(O + Vector3.new(-70, 0.2, -100)),
	Color3.fromRGB(255, 220, 110), Enum.Material.SmoothPlastic)

-- papan judul
local judul = part(ROOT, "PapanJudul", Vector3.new(30, 8, 1), CFrame.new(O + Vector3.new(-40, 6, -112)),
	Color3.fromRGB(40, 120, 60), Enum.Material.Wood)
papanTeks(judul, "🌾 SAWAH JURAGAN", 0, 420, 150)

-- Kios Benih
local KIOS = {}
local kiosX = -75
for i, b in ipairs(BENIH) do
	local z = -80 + (i - 1) * 9
	local meja = part(ROOT, "Kios " .. b.nama, Vector3.new(6, 3, 6), CFrame.new(O + Vector3.new(kiosX, 1.5, z)),
		Color3.fromRGB(160, 110, 60), Enum.Material.WoodPlanks)
	part(ROOT, "Contoh", Vector3.new(2.5, 2.5, 2.5), CFrame.new(O + Vector3.new(kiosX, 4.3, z)), b.warna,
		Enum.Material.SmoothPlastic, true).Shape = Enum.PartType.Ball
	local hargaTeks = b.harga == 0 and "gratis" or (b.harga .. " koin")
	papanTeks(meja, b.nama .. " (" .. hargaTeks .. ")", 5, 230, 25)
	KIOS[i] = tombol(meja, "Pilih Benih", b.nama)
end

-- Pasar
local pasar = part(ROOT, "Pasar", Vector3.new(10, 4, 8), CFrame.new(O + Vector3.new(-75, 2, -25)),
	Color3.fromRGB(230, 120, 60), Enum.Material.WoodPlanks)
part(ROOT, "AtapPasar", Vector3.new(12, 0.6, 10), CFrame.new(O + Vector3.new(-75, 8, -25)),
	Color3.fromRGB(200, 60, 50), Enum.Material.Fabric)
papanTeks(pasar, "🧺 PASAR: jual panen", 7, 260)
local TOMBOL_JUAL = tombol(pasar, "Jual Semua Panen", "Lumbung")

-- Toko Robux (hanya muncul kalau ID diisi)
local function kiosRobux(nama, z, warna, id, aksi)
	if id == 0 then
		return nil
	end
	local m = part(ROOT, nama, Vector3.new(6, 3, 6), CFrame.new(O + Vector3.new(-75, 1.5, z)), warna, Enum.Material.Neon)
	papanTeks(m, nama, 4, 230, 25)
	return tombol(m, aksi, "Robux")
end
local TOMBOL_PUPUK = kiosRobux("Pupuk Ajaib", -5, Color3.fromRGB(120, 220, 255), DEV_PUPUK_AJAIB, "Beli Pupuk Ajaib")
local TOMBOL_CEPAT = kiosRobux("Panen 2x Cepat", 5, Color3.fromRGB(255, 180, 60), PASS_PANEN_CEPAT, "Beli Game Pass")
local TOMBOL_TAMBAH = kiosRobux("Sawah Tambahan", 15, Color3.fromRGB(160, 255, 140), PASS_SAWAH_TAMBAHAN, "Beli Game Pass")

-- Gerbang pulang
local pulang = part(ROOT, "GerbangPulang", Vector3.new(6, 9, 1), CFrame.new(O + Vector3.new(-60, 4.5, -112)),
	Color3.fromRGB(80, 80, 200), Enum.Material.Neon)
papanTeks(pulang, "⬅ Pulang ke Desa", 6, 220)
local TOMBOL_PULANG = tombol(pulang, "Pulang", "Dunia Kotak")

-- Baris sawah
local BARIS = {} -- [r] = { petak = {part...}, papan = TextLabel, pemilik = player }
local AWAL_X, AWAL_Z = -50, -95
for r = 1, MAKS_BARIS do
	local z = AWAL_Z + (r - 1) * 12
	local papan = part(ROOT, "PapanBaris" .. r, Vector3.new(1, 3, 6), CFrame.new(O + Vector3.new(AWAL_X - 8, 1.5, z)),
		Color3.fromRGB(150, 100, 50), Enum.Material.Wood)
	local label = papanTeks(papan, "", 3, 180)
	local daftar = {}
	for i = 1, JUMLAH_PETAK do
		local p = part(ROOT, ("Petak%d_%d"):format(r, i), Vector3.new(8, 1, 8),
			CFrame.new(O + Vector3.new(AWAL_X + (i - 1) * 10, 0.5, z)), Color3.fromRGB(95, 65, 40), Enum.Material.Ground)
		local info = papanTeks(p, "", 4, 160, 35)
		local pr = tombol(p, "", "")
		pr.Enabled = false
		daftar[i] = { part = p, info = info, prompt = pr, tanaman = nil, tahap = -1 }
	end
	BARIS[r] = { petak = daftar, papan = label, pemilik = nil }
end

-- Papan teleport di desa
local function cariMuncul()
	local t = workspace:FindFirstChild("TitikMuncul", true)
	if t and t:IsA("BasePart") then
		return t
	end
	local s = workspace:FindFirstChildWhichIsA("SpawnLocation", true)
	return s
end
local muncul = cariMuncul()
local posGerbang = muncul and (muncul.Position + Vector3.new(10, 0, 6)) or Vector3.new(-274, 0, -1051)
local gerbang = part(ROOT, "GerbangSawah", Vector3.new(5, 7, 1), CFrame.new(posGerbang + Vector3.new(0, 3.5, 0)),
	Color3.fromRGB(60, 170, 80), Enum.Material.Neon, true)
papanTeks(gerbang, "🌾 SAWAH JURAGAN", 5, 260, 120)
local TOMBOL_KE_SAWAH = tombol(gerbang, "Ke Sawah", "Sawah Juragan")
TOMBOL_KE_SAWAH.MaxActivationDistance = 14

ROOT.Parent = workspace

---------------------------------------------------------------------
-- HUD sederhana (dibuat dari server)
---------------------------------------------------------------------
local HUD = {} -- [player] = { info = TextLabel, kabar = TextLabel }

local function buatHud(player)
	local pg = player:WaitForChild("PlayerGui", 10)
	if not pg then
		return
	end
	local g = Instance.new("ScreenGui")
	g.Name = "SawahHUD"
	g.ResetOnSpawn = false
	g.IgnoreGuiInset = false
	local info = Instance.new("TextLabel")
	info.Name = "Info"
	info.AnchorPoint = Vector2.new(0.5, 0)
	info.Position = UDim2.new(0.5, 0, 0, 6)
	info.Size = UDim2.new(0.5, 0, 0, 28)
	info.BackgroundColor3 = Color3.fromRGB(30, 60, 30)
	info.BackgroundTransparency = 0.3
	info.TextColor3 = Color3.new(1, 1, 1)
	info.Font = Enum.Font.FredokaOne
	info.TextScaled = true
	info.Visible = false
	info.Parent = g
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, 10)
	c.Parent = info
	local kabar = Instance.new("TextLabel")
	kabar.Name = "Kabar"
	kabar.AnchorPoint = Vector2.new(0.5, 1)
	kabar.Position = UDim2.new(0.5, 0, 1, -110)
	kabar.Size = UDim2.new(0.6, 0, 0, 34)
	kabar.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
	kabar.BackgroundTransparency = 0.25
	kabar.TextColor3 = Color3.new(1, 1, 1)
	kabar.Font = Enum.Font.FredokaOne
	kabar.TextScaled = true
	kabar.Visible = false
	kabar.Parent = g
	local c2 = Instance.new("UICorner")
	c2.CornerRadius = UDim.new(0, 10)
	c2.Parent = kabar
	g.Parent = pg
	HUD[player] = { info = info, kabar = kabar, versi = 0 }
end

local function kabari(player, teks, lama)
	local h = HUD[player]
	if not h then
		return
	end
	h.versi = h.versi + 1
	local v = h.versi
	h.kabar.Text = teks
	h.kabar.Visible = true
	task.delay(lama or 3, function()
		if HUD[player] and HUD[player].versi == v then
			h.kabar.Visible = false
		end
	end)
end

---------------------------------------------------------------------
-- Data pemain
---------------------------------------------------------------------
local storeSawah, storeKoin
pcall(function()
	storeSawah = DataStoreService:GetDataStore("DuniaKotak_Sawah_v1")
	storeKoin = DataStoreService:GetDataStore("DuniaKotak_v1")
end)

local DATA = {} -- [player] = { petak = {}, buka = n, lumbung = {}, pilih = id, baris = r, cepat = bool, tambah = bool, koinSendiri = bool }

local function koinObj(player)
	local ls = player:FindFirstChild("leaderstats")
	return ls and ls:FindFirstChild("Koin")
end

local function siapkanKoin(player, d)
	-- tunggu skrip lain membuat leaderstats; kalau tidak ada, buat sendiri
	local mulai = os.clock()
	while os.clock() - mulai < 5 do
		if koinObj(player) then
			return
		end
		task.wait(0.25)
	end
	if koinObj(player) then
		return
	end
	local ls = player:FindFirstChild("leaderstats")
	if not ls then
		ls = Instance.new("Folder")
		ls.Name = "leaderstats"
		ls.Parent = player
	end
	local koin = Instance.new("IntValue")
	koin.Name = "Koin"
	koin.Parent = ls
	d.koinSendiri = true
	if storeKoin then
		local ok, nilai = pcall(function()
			return storeKoin:GetAsync("p_" .. player.UserId)
		end)
		if ok and typeof(nilai) == "number" then
			koin.Value = nilai
		end
	end
end

local function cekPass(player, id)
	if id == 0 then
		return false
	end
	local ok, hasil = pcall(function()
		return MarketplaceService:UserOwnsGamePassAsync(player.UserId, id)
	end)
	return ok and hasil or false
end

local function waktuTumbuh(d, jenis)
	local b = BENIH_ID[jenis]
	local w = b.waktu
	if d.cepat then
		w = w * 0.5
	end
	return w
end

local function petakTerbuka(d, i)
	if i >= PETAK_PASS then
		return d.tambah
	end
	return i <= d.buka
end

---------------------------------------------------------------------
-- Tampilan petak
---------------------------------------------------------------------
local function hapusTanaman(pk)
	if pk.tanaman then
		pk.tanaman:Destroy()
		pk.tanaman = nil
	end
	pk.tahap = -1
end

local function gambarTanaman(pk, isi, tahap)
	if pk.tahap == tahap then
		return
	end
	hapusTanaman(pk)
	pk.tahap = tahap
	if tahap < 0 or not isi then
		return
	end
	local b = BENIH_ID[isi.j]
	local m = Instance.new("Model")
	m.Name = "Tanaman"
	local dasar = pk.part.Position + Vector3.new(0, 0.5, 0)
	local hijau = Color3.fromRGB(70, 170, 60)
	for _, off in ipairs({ Vector3.new(-2, 0, -2), Vector3.new(2, 0, -2), Vector3.new(-2, 0, 2), Vector3.new(2, 0, 2) }) do
		local tinggi = tahap == 0 and 0.8 or (tahap == 1 and 2 or 3)
		part(m, "Batang", Vector3.new(0.4, tinggi, 0.4), CFrame.new(dasar + off + Vector3.new(0, tinggi / 2, 0)), hijau,
			Enum.Material.Grass, true)
		if tahap >= 1 then
			part(m, "Daun", Vector3.new(1.4, 0.3, 1.4), CFrame.new(dasar + off + Vector3.new(0, tinggi * 0.7, 0)), hijau,
				Enum.Material.Grass, true)
		end
		if tahap == 2 then
			local warna = b.warna
			local bahan = Enum.Material.SmoothPlastic
			if isi.m and MUTASI[isi.m] then
				warna = MUTASI[isi.m].warna
				bahan = Enum.Material.Neon
			end
			local buah = part(m, "Buah", Vector3.new(1.3, 1.3, 1.3), CFrame.new(dasar + off + Vector3.new(0, tinggi + 0.5, 0)),
				warna, bahan, true)
			buah.Shape = Enum.PartType.Ball
		end
	end
	if tahap == 2 and isi.m then
		local kilau = Instance.new("Sparkles")
		kilau.SparkleColor = MUTASI[isi.m].warna
		kilau.Parent = pk.part
		kilau.Name = "Kilau"
	end
	m.Parent = ROOT
	pk.tanaman = m
end

local function segarkanPetak(player, r, i)
	local d = DATA[player]
	local pk = BARIS[r].petak[i]
	local kilau = pk.part:FindFirstChild("Kilau")
	if not d then
		hapusTanaman(pk)
		if kilau then
			kilau:Destroy()
		end
		pk.info.Text = ""
		pk.prompt.Enabled = false
		pk.part.Color = Color3.fromRGB(95, 65, 40)
		return
	end
	local pr = pk.prompt
	pr.Enabled = true
	if not petakTerbuka(d, i) then
		hapusTanaman(pk)
		pk.part.Color = Color3.fromRGB(70, 70, 70)
		if i >= PETAK_PASS then
			pk.info.Text = "🔒 Game Pass"
			pr.ActionText = PASS_SAWAH_TAMBAHAN ~= 0 and "Buka (Sawah Tambahan)" or "Terkunci"
			pr.Enabled = PASS_SAWAH_TAMBAHAN ~= 0
		else
			pk.info.Text = "🔒 " .. HARGA_PETAK[i] .. " koin"
			pr.ActionText = "Buka Petak (" .. HARGA_PETAK[i] .. " koin)"
		end
		pr.ObjectText = "Petak " .. i
		return
	end
	pk.part.Color = Color3.fromRGB(95, 65, 40)
	local isi = d.petak[i]
	if not isi then
		hapusTanaman(pk)
		if kilau then
			kilau:Destroy()
		end
		local b = BENIH_ID[d.pilih] or BENIH[1]
		pk.info.Text = ""
		pr.ActionText = "Tanam " .. b.nama
		pr.ObjectText = b.harga == 0 and "gratis" or (b.harga .. " koin")
		return
	end
	local b = BENIH_ID[isi.j]
	local total = waktuTumbuh(d, isi.j)
	if isi.s then
		total = total * 0.75
	end
	local sisa = total - (os.time() - isi.t)
	if sisa <= 0 then
		gambarTanaman(pk, isi, 2)
		local nm = b.nama
		if isi.m then
			nm = nm .. " " .. MUTASI[isi.m].nama .. "!"
		end
		pk.info.Text = "✅ " .. nm
		pr.ActionText = "Panen"
		pr.ObjectText = nm
	else
		local prog = 1 - sisa / total
		gambarTanaman(pk, isi, prog < 0.4 and 0 or 1)
		pk.info.Text = b.nama .. " " .. fmtWaktu(sisa)
		if isi.s then
			pr.ActionText = "Sudah disiram"
			pr.Enabled = false
		else
			pr.ActionText = "Siram (-25% waktu)"
		end
		pr.ObjectText = b.nama
	end
end

local function segarkanHud(player)
	local d, h = DATA[player], HUD[player]
	if not d or not h then
		return
	end
	local b = BENIH_ID[d.pilih] or BENIH[1]
	h.info.Text = ("🌱 Benih: %s   🧺 Lumbung: %d/%d"):format(b.nama, #d.lumbung, MAKS_LUMBUNG)
end

local function segarkanBaris(player)
	local d = DATA[player]
	if not d or not d.baris then
		return
	end
	for i = 1, JUMLAH_PETAK do
		segarkanPetak(player, d.baris, i)
	end
	segarkanHud(player)
end

---------------------------------------------------------------------
-- Aksi
---------------------------------------------------------------------
local function acakMutasi()
	local x = math.random()
	if x < MUTASI.pelangi.peluang then
		return "pelangi"
	elseif x < MUTASI.pelangi.peluang + MUTASI.emas.peluang then
		return "emas"
	end
	return nil
end

local function umumkan(teks)
	for p in pairs(HUD) do
		kabari(p, teks, 5)
	end
end

local function aksiPetak(player, r, i)
	local d = DATA[player]
	local baris = BARIS[r]
	if baris.pemilik ~= player or not d then
		local nama = baris.pemilik and baris.pemilik.DisplayName or "orang lain"
		kabari(player, "Ini sawah " .. nama .. ". Sawahmu ada papan namamu.")
		return
	end
	local koin = koinObj(player)
	if not petakTerbuka(d, i) then
		if i >= PETAK_PASS then
			if PASS_SAWAH_TAMBAHAN ~= 0 then
				MarketplaceService:PromptGamePassPurchase(player, PASS_SAWAH_TAMBAHAN)
			end
			return
		end
		if i ~= d.buka + 1 then
			kabari(player, "Buka petak " .. (d.buka + 1) .. " dulu.")
			return
		end
		local harga = HARGA_PETAK[i]
		if not koin or koin.Value < harga then
			kabari(player, "Koinmu kurang. Butuh " .. harga .. " koin.")
			return
		end
		koin.Value = koin.Value - harga
		d.buka = i
		kabari(player, "Petak " .. i .. " terbuka! 🎉")
		segarkanBaris(player)
		return
	end
	local isi = d.petak[i]
	if not isi then
		local b = BENIH_ID[d.pilih] or BENIH[1]
		if b.harga > 0 then
			if not koin or koin.Value < b.harga then
				kabari(player, "Koin kurang untuk benih " .. b.nama .. ". Tanam Padi dulu (gratis).")
				return
			end
			koin.Value = koin.Value - b.harga
		end
		d.petak[i] = { j = b.id, t = os.time(), s = false, m = acakMutasi() }
		segarkanPetak(player, r, i)
		return
	end
	local total = waktuTumbuh(d, isi.j) * (isi.s and 0.75 or 1)
	local sisa = total - (os.time() - isi.t)
	if sisa > 0 then
		if not isi.s then
			-- siram: sisa waktu dipotong seperempat dari total
			isi.s = true
			kabari(player, "Disiram! 💧 Tumbuh lebih cepat.")
		end
		segarkanPetak(player, r, i)
		return
	end
	-- panen
	if #d.lumbung >= MAKS_LUMBUNG then
		kabari(player, "Lumbung penuh! Jual dulu di Pasar.")
		return
	end
	table.insert(d.lumbung, { j = isi.j, m = isi.m })
	local b = BENIH_ID[isi.j]
	if isi.m == "pelangi" then
		umumkan("🌈 " .. player.DisplayName .. " panen " .. b.nama .. " PELANGI!")
	elseif isi.m == "emas" then
		kabari(player, "✨ Panen " .. b.nama .. " EMAS! Harga x5")
	else
		kabari(player, "Panen " .. b.nama .. " masuk lumbung.")
	end
	d.petak[i] = nil
	local kilau = BARIS[r].petak[i].part:FindFirstChild("Kilau")
	if kilau then
		kilau:Destroy()
	end
	segarkanPetak(player, r, i)
	segarkanHud(player)
end

for r, baris in ipairs(BARIS) do
	for i, pk in ipairs(baris.petak) do
		pk.prompt.Triggered:Connect(function(player)
			aksiPetak(player, r, i)
		end)
	end
end

for i, pr in ipairs(KIOS) do
	pr.Triggered:Connect(function(player)
		local d = DATA[player]
		if not d then
			return
		end
		d.pilih = BENIH[i].id
		kabari(player, "Benih dipilih: " .. BENIH[i].nama)
		segarkanBaris(player)
	end)
end

TOMBOL_JUAL.Triggered:Connect(function(player)
	local d = DATA[player]
	local koin = koinObj(player)
	if not d or not koin then
		return
	end
	if #d.lumbung == 0 then
		kabari(player, "Lumbung kosong. Panen dulu!")
		return
	end
	local total = 0
	for _, h in ipairs(d.lumbung) do
		local b = BENIH_ID[h.j]
		if b then
			local kali = (h.m and MUTASI[h.m]) and MUTASI[h.m].kali or 1
			total = total + b.jual * kali
		end
	end
	d.lumbung = {}
	koin.Value = koin.Value + total
	kabari(player, "Terjual! +" .. total .. " koin 🪙")
	segarkanHud(player)
end)

local function pindah(player, pos)
	local ch = player.Character
	if ch then
		ch:PivotTo(CFrame.new(pos + Vector3.new(0, 4, 0)))
	end
end

TOMBOL_KE_SAWAH.Triggered:Connect(function(player)
	pindah(player, DATANG.Position)
	local d = DATA[player]
	if d and d.baris then
		kabari(player, "Sawahmu: baris " .. d.baris .. " (cari papan namamu)", 4)
	end
end)

TOMBOL_PULANG.Triggered:Connect(function(player)
	pindah(player, posGerbang + Vector3.new(4, 0, 0))
end)

if TOMBOL_PUPUK then
	TOMBOL_PUPUK.Triggered:Connect(function(player)
		MarketplaceService:PromptProductPurchase(player, DEV_PUPUK_AJAIB)
	end)
end
if TOMBOL_CEPAT then
	TOMBOL_CEPAT.Triggered:Connect(function(player)
		MarketplaceService:PromptGamePassPurchase(player, PASS_PANEN_CEPAT)
	end)
end
if TOMBOL_TAMBAH then
	TOMBOL_TAMBAH.Triggered:Connect(function(player)
		MarketplaceService:PromptGamePassPurchase(player, PASS_SAWAH_TAMBAHAN)
	end)
end

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, passId, dibeli)
	local d = DATA[player]
	if not dibeli or not d then
		return
	end
	if passId == PASS_PANEN_CEPAT and PASS_PANEN_CEPAT ~= 0 then
		d.cepat = true
		kabari(player, "Panen 2x Cepat aktif! ⚡")
	elseif passId == PASS_SAWAH_TAMBAHAN and PASS_SAWAH_TAMBAHAN ~= 0 then
		d.tambah = true
		kabari(player, "Sawah Tambahan terbuka! 🌾")
	end
	segarkanBaris(player)
end)

MarketplaceService.ProcessReceipt = function(info)
	local player = Players:GetPlayerByUserId(info.PlayerId)
	local d = player and DATA[player]
	if not d then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	if info.ProductId == DEV_PUPUK_AJAIB and DEV_PUPUK_AJAIB ~= 0 then
		for _, isi in pairs(d.petak) do
			isi.t = isi.t - 100000
		end
		kabari(player, "Pupuk Ajaib! Semua tanaman siap panen ✨")
		segarkanBaris(player)
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end
	return Enum.ProductPurchaseDecision.NotProcessedYet
end

---------------------------------------------------------------------
-- Simpan / muat
---------------------------------------------------------------------
local function simpan(player)
	local d = DATA[player]
	if not d then
		return
	end
	if storeSawah then
		local petak = {}
		for i, isi in pairs(d.petak) do
			petak[tostring(i)] = isi
		end
		local paket = { petak = petak, buka = d.buka, lumbung = d.lumbung, pilih = d.pilih }
		pcall(function()
			storeSawah:SetAsync("p_" .. player.UserId, paket)
		end)
	end
	if d.koinSendiri and storeKoin then
		local koin = koinObj(player)
		if koin then
			pcall(function()
				storeKoin:SetAsync("p_" .. player.UserId, koin.Value)
			end)
		end
	end
end

local function muat(player)
	local d = { petak = {}, buka = PETAK_AWAL, lumbung = {}, pilih = "padi", koinSendiri = false }
	if storeSawah then
		local ok, data = pcall(function()
			return storeSawah:GetAsync("p_" .. player.UserId)
		end)
		if ok and type(data) == "table" then
			if type(data.petak) == "table" then
				for k, isi in pairs(data.petak) do
					local i = tonumber(k)
					if i and type(isi) == "table" and BENIH_ID[isi.j] then
						d.petak[i] = isi
					end
				end
			end
			d.buka = tonumber(data.buka) or PETAK_AWAL
			if type(data.lumbung) == "table" then
				d.lumbung = data.lumbung
			end
			if BENIH_ID[data.pilih] then
				d.pilih = data.pilih
			end
		end
	end
	return d
end

local function pemainMasuk(player)
	local d = muat(player)
	d.cepat = cekPass(player, PASS_PANEN_CEPAT)
	d.tambah = cekPass(player, PASS_SAWAH_TAMBAHAN)
	siapkanKoin(player, d)
	if not player.Parent then
		return
	end
	for r, baris in ipairs(BARIS) do
		if not baris.pemilik then
			baris.pemilik = player
			baris.papan.Text = "🌾 " .. player.DisplayName
			d.baris = r
			break
		end
	end
	DATA[player] = d
	buatHud(player)
	if HUD[player] then
		HUD[player].info.Visible = true
	end
	segarkanBaris(player)
	kabari(player, "📣 Baru di Desa: Sawah Juragan! Cari papan hijau 🌾 dekat titik muncul.", 7)
end

local function pemainKeluar(player)
	simpan(player)
	local d = DATA[player]
	DATA[player] = nil
	HUD[player] = nil
	if d and d.baris then
		local baris = BARIS[d.baris]
		baris.pemilik = nil
		baris.papan.Text = ""
		for i = 1, JUMLAH_PETAK do
			segarkanPetak(player, d.baris, i)
		end
	end
end

Players.PlayerAdded:Connect(pemainMasuk)
for _, p in ipairs(Players:GetPlayers()) do
	task.spawn(pemainMasuk, p)
end
Players.PlayerRemoving:Connect(pemainKeluar)

game:BindToClose(function()
	for _, p in ipairs(Players:GetPlayers()) do
		simpan(p)
	end
end)

-- Hitung mundur di petak tiap 1 detik
task.spawn(function()
	while true do
		task.wait(1)
		for player, d in pairs(DATA) do
			if d.baris then
				for i = 1, JUMLAH_PETAK do
					if d.petak[i] then
						segarkanPetak(player, d.baris, i)
					end
				end
			end
		end
	end
end)

-- Simpan berkala tiap 2 menit
task.spawn(function()
	while true do
		task.wait(120)
		for _, p in ipairs(Players:GetPlayers()) do
			simpan(p)
		end
	end
end)

print("Sawah Juragan siap: " .. MAKS_BARIS .. " baris x " .. JUMLAH_PETAK .. " petak di " .. tostring(POSISI_SAWAH))
