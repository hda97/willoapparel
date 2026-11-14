--[[
  PapanDesa (Script) - papan pengumuman di dekat titik muncul Kotak Wetan yang menampilkan data publik game web
  (hanya membaca): 5 besar koin terbanyak, 5 besar Rajin minggu ini, dan hasil voting fasum yang sedang berjalan.
  Sisi belakang papan: klasemen Piala Antardusun, pencetak poin terbanyak, dan Lomba Rumah Terindah minggu ini.
  Memberi suara, menyukai rumah, dan mengumpulkan poin Piala tetap dilakukan di game web. Data disegarkan tiap 5 menit.

  Nama warga dilewatkan saringan teks Roblox; nama yang tersaring ditulis "warga <nomor>".
  Pasang sebagai Script di ServerScriptService. Butuh HttpService menyala.
]]

local HttpService = game:GetService("HttpService")
local TextService = game:GetService("TextService")

local DASAR = { "https://willoapparel.com/duniakotak/api/", "https://willoapparel.wjzyy9fpzd.workers.dev/duniakotak/api/" }
local JEDA = 5 * 60
local NAMA_CALON = { kafe = "Kafe Bukit", hiburan = "Taman Hiburan", polisi = "Kantor Polisi", kereta = "Stasiun Kereta", damkar = "Stasiun Pemadam", bandara = "Bandara" }
local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local BERAT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)
local GELAP = Color3.fromRGB(29, 29, 34)
local KUNING = Color3.fromRGB(255, 196, 37)

local lama = workspace:FindFirstChild("DK_PapanDesa")
if lama then lama:Destroy() end

local akar = workspace:FindFirstChild("DuniaKotak3")
local muncul = akar and akar:FindFirstChild("TitikMuncul")
if not muncul then
	warn("[PapanDesa] TitikMuncul belum ada di map; papan tidak dipasang")
	return
end
local pusat = muncul:GetPivot().Position

local rp = RaycastParams.new()
rp.FilterType = Enum.RaycastFilterType.Include
rp.FilterDescendantsInstances = { akar }
local letak = pusat + Vector3.new(-22, 0, 2)
local r = workspace:Raycast(letak + Vector3.new(0, 40, 0), Vector3.new(0, -120, 0), rp)
local tanah = r and r.Position.Y or pusat.Y - 3

local model = Instance.new("Model")
model.Name = "DK_PapanDesa"
local function balok(ukuran, cf, warna)
	local p = Instance.new("Part")
	p.Anchored = true
	p.Size = ukuran
	p.CFrame = cf
	p.Color = warna
	p.Material = Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = model
	return p
end
-- papan digantung seperti gapura di atas jalan setapak, menghadap ke arah titik muncul (sumbu +X)
local dasar = CFrame.new(letak.X, tanah, letak.Z) * CFrame.Angles(0, math.rad(-90), 0)
balok(Vector3.new(1, 8.5, 1), dasar * CFrame.new(-11, 4.25, 0), Color3.fromRGB(110, 78, 50))
balok(Vector3.new(1, 8.5, 1), dasar * CFrame.new(11, 4.25, 0), Color3.fromRGB(110, 78, 50))
local papan = balok(Vector3.new(24, 11, 0.8), dasar * CFrame.new(0, 14, 0), GELAP)
papan.Name = "papan"

local sg = Instance.new("SurfaceGui")
sg.Face = Enum.NormalId.Front
sg.CanvasSize = Vector2.new(960, 440)
sg.LightInfluence = 0
sg.Parent = papan
local sgB = Instance.new("SurfaceGui")
sgB.Face = Enum.NormalId.Back
sgB.CanvasSize = Vector2.new(960, 440)
sgB.LightInfluence = 0
sgB.Parent = papan
local function teks(isi, font, ukuran, warna, x, y, w, h, induk)
	local t = Instance.new("TextLabel")
	t.BackgroundTransparency = 1
	t.Position = UDim2.fromOffset(x, y)
	t.Size = UDim2.fromOffset(w, h)
	t.FontFace = font
	t.TextSize = ukuran
	t.TextColor3 = warna
	t.TextXAlignment = Enum.TextXAlignment.Left
	t.TextYAlignment = Enum.TextYAlignment.Top
	t.TextWrapped = true
	t.Text = isi
	t.Parent = induk or sg
	return t
end
teks("PAPAN DESA DUNIA KOTAK", BERAT, 34, KUNING, 24, 14, 912, 40)
teks("Koin terbanyak", BERAT, 26, Color3.new(1, 1, 1), 24, 70, 290, 30)
teks("Rajin minggu ini", BERAT, 26, Color3.new(1, 1, 1), 334, 70, 290, 30)
teks("Voting fasum", BERAT, 26, Color3.new(1, 1, 1), 644, 70, 290, 30)
local tKoin = teks("Memuat…", TEBAL, 23, Color3.new(1, 1, 1), 24, 108, 300, 290)
local tRajin = teks("Memuat…", TEBAL, 23, Color3.new(1, 1, 1), 334, 108, 300, 290)
local tVoting = teks("Memuat…", TEBAL, 23, Color3.new(1, 1, 1), 644, 108, 300, 290)
teks("Data dari game web. Memberi suara dilakukan di game web.", TEBAL, 18, Color3.fromRGB(170, 170, 180), 24, 404, 912, 24)
local PUTIH = Color3.new(1, 1, 1)
teks("PIALA ANTARDUSUN DAN LOMBA RUMAH", BERAT, 34, KUNING, 24, 14, 912, 40, sgB)
teks("Klasemen dusun", BERAT, 26, PUTIH, 24, 70, 290, 30, sgB)
teks("Poin terbanyak", BERAT, 26, PUTIH, 334, 70, 290, 30, sgB)
teks("Rumah terindah", BERAT, 26, PUTIH, 644, 70, 290, 30, sgB)
local tKlasemen = teks("Memuat…", TEBAL, 23, PUTIH, 24, 108, 300, 290, sgB)
local tPoin = teks("Memuat…", TEBAL, 23, PUTIH, 334, 108, 300, 290, sgB)
local tRumah = teks("Memuat…", TEBAL, 23, PUTIH, 644, 108, 300, 290, sgB)
teks("Data minggu ini dari game web. Poin Piala dan suka rumah dikumpulkan di game web.", TEBAL, 18, Color3.fromRGB(170, 170, 180), 24, 404, 912, 24, sgB)
local NAMA_DUSUN = { wetan = "Kotak Wetan", kulon = "Kotak Kulon", curug = "Kotak Curug", tlaga = "Kotak Tlaga", segara = "Kotak Segara" }
model.Parent = workspace

local function ambil(nama)
	for _, d in ipairs(DASAR) do
		local ok, isi = pcall(function() return HttpService:GetAsync(d .. nama, true) end)
		if ok then
			local ok2, j = pcall(function() return HttpService:JSONDecode(isi) end)
			if ok2 and typeof(j) == "table" then return j end
		end
	end
	return nil
end

local saring = {}
local function namaAman(x)
	local u = typeof(x.u) == "string" and x.u or ""
	local cadangan = "warga " .. tostring(x.no or "")
	if u == "" then return cadangan end
	if saring[u] == nil then
		local hasil = false
		pcall(function()
			local f = TextService:FilterStringAsync(u, game.CreatorId)
			local s = f:GetNonChatStringForBroadcastAsync()
			if typeof(s) == "string" and not s:find("#", 1, true) then hasil = s end
		end)
		saring[u] = hasil
	end
	return saring[u] or cadangan
end

local function daftar(L, kolom, satuan)
	if typeof(L) ~= "table" or #L == 0 then return "Belum ada data." end
	local t = {}
	for i = 1, math.min(5, #L) do
		table.insert(t, i .. ". " .. namaAman(L[i]) .. "  ·  " .. tostring(L[i][kolom or "koin"] or 0) .. (satuan or ""))
	end
	return table.concat(t, "\n")
end
local function juaraLalu(nama, angka)
	return "\n\nJuara minggu lalu:\n" .. nama .. "  ·  " .. angka
end

local function segarkan()
	local p = ambil("peringkat")
	if p then
		tKoin.Text = daftar(p.top)
		tRajin.Text = daftar(p.rajin)
	elseif tKoin.Text == "Memuat…" then
		tKoin.Text = "Data belum terjangkau."
		tRajin.Text = "Data belum terjangkau."
	end
	local v = ambil("voting")
	if v and typeof(v.calon) == "table" then
		local urut = {}
		for _, c in ipairs(v.calon) do
			table.insert(urut, { c = c, n = typeof(v.hasil) == "table" and tonumber(v.hasil[c]) or 0 })
		end
		table.sort(urut, function(a, b) return a.n > b.n end)
		local t = {}
		for _, x in ipairs(urut) do
			table.insert(t, (NAMA_CALON[x.c] or tostring(x.c)) .. "  ·  " .. x.n .. " bintang")
		end
		table.insert(t, "")
		table.insert(t, "Pemilih: " .. tostring(v.pemilih or 0) .. " warga")
		local tutup = tonumber(v.tutup)
		if tutup and tutup > 0 then
			if v.ditutup == 1 then table.insert(t, "Voting sudah ditutup.")
			else table.insert(t, "Tutup " .. os.date("!%d/%m %H.%M", tutup / 1000 + 7 * 3600) .. " WIB") end
		end
		tVoting.Text = table.concat(t, "\n")
	elseif tVoting.Text == "Memuat…" then
		tVoting.Text = "Data belum terjangkau."
	end
	local pi = ambil("piala")
	if pi and typeof(pi.klasemen) == "table" then
		local t = {}
		for i, k in ipairs(pi.klasemen) do
			table.insert(t, i .. ". " .. (NAMA_DUSUN[k.d] or tostring(k.d)) .. "  ·  " .. tostring(k.poin or 0))
		end
		local j = typeof(pi.juara) == "table" and pi.juara or nil
		tKlasemen.Text = table.concat(t, "\n") .. (j and juaraLalu(NAMA_DUSUN[j.d] or tostring(j.d), tostring(j.poin or 0) .. " poin") or "")
		tPoin.Text = daftar(pi.top, "poin", " poin")
	elseif tKlasemen.Text == "Memuat…" then
		tKlasemen.Text = "Data belum terjangkau."
		tPoin.Text = "Data belum terjangkau."
	end
	local ru = ambil("rumah")
	if ru and typeof(ru.top) == "table" then
		local j = typeof(ru.juara) == "table" and ru.juara or nil
		tRumah.Text = daftar(ru.top, "suka", " suka") .. (j and juaraLalu(namaAman(j), tostring(j.suka or 0) .. " suka") or "")
	elseif tRumah.Text == "Memuat…" then
		tRumah.Text = "Data belum terjangkau."
	end
end

while true do
	segarkan()
	task.wait(JEDA)
end
