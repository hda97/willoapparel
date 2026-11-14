--[[
  MusimDusun (LocalScript) - langit, cahaya, dan cuaca tiap dusun, mengikuti game web (public/duniakotak/mabar/js/musim.js).
  Tempat: StarterPlayer.StarterPlayerScripts.MusimDusun.

  Wetan = Musim Hujan (gerimis), Kulon = Musim Semi (kelopak sakura), Curug = Musim Salju,
  Tlaga = Musim Gugur (daun jatuh), Segara = Musim Panas (cerah, tanpa partikel).
  Warna alam (rumput, daun) sudah ikut musim di data map; skrip ini hanya menambah langit, kabut, cahaya, dan butiran cuaca.
  Butiran cuaca berupa balok kecil yang digerakkan di sekitar kamera (bukan ParticleEmitter), supaya tetap terlihat
  di setelan grafis rendah dan bentuknya kotak seperti dunianya.
  Semuanya hanya di layar pemain itu sendiri (tidak membebani server).
]]
local Players = game:GetService("Players")
local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local kamera = workspace.CurrentCamera

-- nilai dasar place (diatur alat/pasang.lua)
local KABUT_AWAL, KABUT_AKHIR, TERANG = 400, 900, 2.2

local MUSIM = {
	wetan = { nama = "Musim Hujan", langit = Color3.fromRGB(169, 196, 216), cahaya = 0.82, kabut = 0.85, partikel = "hujan" },
	kulon = { nama = "Musim Semi", langit = Color3.fromRGB(212, 230, 255), cahaya = 1, kabut = 1, partikel = "kelopak" },
	curug = { nama = "Musim Salju", langit = Color3.fromRGB(214, 226, 238), cahaya = 0.95, kabut = 0.8, partikel = "salju" },
	tlaga = { nama = "Musim Gugur", langit = Color3.fromRGB(243, 220, 192), cahaya = 0.95, kabut = 0.95, partikel = "daun" },
	segara = { nama = "Musim Panas", langit = Color3.fromRGB(140, 200, 245), cahaya = 1.12, kabut = 1.1 },
}

-- butiran cuaca: n = jumlah, uk = ukuran balok, laju = stud per detik (turun), goyang = ayunan ke samping, putar = putaran
local BUTIR = {
	hujan = { n = 150, uk = Vector3.new(0.09, 2.2, 0.09), laju = { 85, 105 }, goyang = 0, putar = 0, alfa = 0.35,
		warna = { { 207, 224, 240 } } },
	salju = { n = 150, uk = Vector3.new(0.32, 0.32, 0.32), laju = { 7, 11 }, goyang = 1.6, putar = 0.6, alfa = 0.05,
		warna = { { 255, 255, 255 } } },
	kelopak = { n = 70, uk = Vector3.new(0.45, 0.06, 0.45), laju = { 5, 8 }, goyang = 2.4, putar = 2.2, alfa = 0,
		warna = { { 255, 195, 216 }, { 255, 168, 200 }, { 255, 240, 245 }, { 255, 143, 184 } } },
	daun = { n = 70, uk = Vector3.new(0.55, 0.06, 0.55), laju = { 5, 7 }, goyang = 2.8, putar = 2.6, alfa = 0,
		warna = { { 232, 116, 42 }, { 210, 70, 42 }, { 242, 178, 52 }, { 184, 86, 42 } } },
}
local LEBAR, ATAS, BAWAH = 45, 30, 14 -- kotak di sekitar kamera tempat butiran jatuh

local lama = workspace:FindFirstChild("DK_Cuaca")
if lama then lama:Destroy() end
local wadah = Instance.new("Folder")
wadah.Name = "DK_Cuaca"
wadah.Parent = workspace

local acak = Random.new()
local butir = {} -- { part, x, y, z, laju, fase, putar }
local jenis
local kini

local function dusunDi(p)
	if p.X < -5000 then return "kulon" end
	if p.Z < -5000 then return "curug" end
	if p.Z > 5000 then return "tlaga" end
	if p.X > 5000 then return "segara" end
	return "wetan"
end

local function taruh(b, p, dariAtas)
	b.x = p.X + acak:NextNumber(-LEBAR, LEBAR)
	b.z = p.Z + acak:NextNumber(-LEBAR, LEBAR)
	b.y = dariAtas and (p.Y + ATAS) or (p.Y + acak:NextNumber(-BAWAH, ATAS))
end

local function isiButir(nama, p)
	for _, b in ipairs(butir) do b.part:Destroy() end
	table.clear(butir)
	jenis = BUTIR[nama]
	if not jenis then return end
	for i = 1, jenis.n do
		local c = jenis.warna[(i - 1) % #jenis.warna + 1]
		local part = Instance.new("Part")
		part.Anchored = true
		part.CanCollide = false
		part.CanQuery = false
		part.CanTouch = false
		part.CastShadow = false
		part.Material = Enum.Material.SmoothPlastic
		part.Size = jenis.uk
		part.Color = Color3.fromRGB(c[1], c[2], c[3])
		part.Transparency = jenis.alfa
		part.Parent = wadah
		local b = { part = part, laju = acak:NextNumber(jenis.laju[1], jenis.laju[2]), fase = acak:NextNumber(0, 6.28), putar = acak:NextNumber(-1, 1) * jenis.putar }
		taruh(b, p, false)
		table.insert(butir, b)
	end
end

local function ganti(d, p)
	kini = d
	local m = MUSIM[d]
	if not m then
		isiButir(nil, p)
		return
	end
	TweenService:Create(Lighting, TweenInfo.new(1.5), {
		FogColor = m.langit,
		FogStart = KABUT_AWAL * m.kabut,
		FogEnd = KABUT_AKHIR * m.kabut,
		Brightness = TERANG * m.cahaya,
	}):Play()
	isiButir(m.partikel, p)
	player:SetAttribute("DK_Musim", m.nama)
end

local hitung = 0
local waktu = 0
local bagian, letak = {}, {}
RunService.RenderStepped:Connect(function(dt)
	kamera = workspace.CurrentCamera
	if not kamera then return end
	local p = kamera.CFrame.Position
	hitung += dt
	if hitung > 0.5 or not kini then
		hitung = 0
		local d = dusunDi(p)
		if d ~= kini then ganti(d, p) end
	end
	if not jenis or #butir == 0 then return end
	dt = math.min(dt, 0.1)
	waktu += dt
	table.clear(bagian)
	table.clear(letak)
	for i, b in ipairs(butir) do
		b.y -= b.laju * dt
		if b.y < p.Y - BAWAH or math.abs(b.x - p.X) > LEBAR or math.abs(b.z - p.Z) > LEBAR then
			taruh(b, p, b.y < p.Y - BAWAH)
		end
		local gx = jenis.goyang > 0 and math.sin(waktu * 1.3 + b.fase) * jenis.goyang or 0
		local cf = CFrame.new(b.x + gx, b.y, b.z + gx * 0.5)
		if b.putar ~= 0 then cf *= CFrame.Angles(waktu * b.putar, b.fase, waktu * b.putar * 0.7) end
		bagian[i] = b.part
		letak[i] = cf
	end
	workspace:BulkMoveTo(bagian, letak, Enum.BulkMoveMode.FireCFrameChanged)
end)
