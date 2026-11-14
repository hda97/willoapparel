--[[
  MusimDusun (LocalScript) - langit, cahaya, dan cuaca tiap dusun, mengikuti game web (public/duniakotak/mabar/js/musim.js).
  Tempat: StarterPlayer.StarterPlayerScripts.MusimDusun.

  Wetan = Musim Hujan (gerimis), Kulon = Musim Semi (kelopak sakura), Curug = Musim Salju,
  Tlaga = Musim Gugur (daun jatuh), Segara = Musim Panas (cerah, tanpa partikel).
  Warna alam (rumput, daun) sudah ikut musim di data map; skrip ini hanya menambah langit, kabut, cahaya, dan partikel.
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

local function warna(daftar)
	local k = {}
	for i, c in ipairs(daftar) do
		table.insert(k, ColorSequenceKeypoint.new((i - 1) / (#daftar - 1), Color3.fromRGB(c[1], c[2], c[3])))
	end
	return ColorSequence.new(k)
end

local BULAT = "rbxasset://textures/particles/smoke_main.dds"
local PARTIKEL = {
	hujan = function(e)
		e.Texture = BULAT
		e.Rate = 420
		e.Lifetime = NumberRange.new(0.55, 0.7)
		e.Speed = NumberRange.new(105, 125)
		e.SpreadAngle = Vector2.new(2, 2)
		e.Size = NumberSequence.new(0.22)
		e.Squash = NumberSequence.new(2.6)
		e.Orientation = Enum.ParticleOrientation.VelocityParallel
		e.Color = ColorSequence.new(Color3.fromRGB(207, 224, 240))
		e.Transparency = NumberSequence.new(0.55)
		e.LightEmission = 0.2
	end,
	salju = function(e)
		e.Texture = BULAT
		e.Rate = 170
		e.Lifetime = NumberRange.new(6, 8)
		e.Speed = NumberRange.new(7, 11)
		e.SpreadAngle = Vector2.new(12, 12)
		e.Size = NumberSequence.new(0.42)
		e.Acceleration = Vector3.new(1.2, 0, 0.6)
		e.Color = ColorSequence.new(Color3.new(1, 1, 1))
		e.Transparency = NumberSequence.new(0.1)
		e.LightEmission = 0.4
	end,
	kelopak = function(e)
		e.Texture = BULAT
		e.Rate = 55
		e.Lifetime = NumberRange.new(8, 10)
		e.Speed = NumberRange.new(5, 8)
		e.SpreadAngle = Vector2.new(18, 18)
		e.Size = NumberSequence.new(0.5)
		e.Squash = NumberSequence.new(-0.4)
		e.Rotation = NumberRange.new(0, 360)
		e.RotSpeed = NumberRange.new(-90, 90)
		e.Acceleration = Vector3.new(2, 0, 1)
		e.Color = warna({ { 255, 195, 216 }, { 255, 168, 200 }, { 255, 240, 245 }, { 255, 143, 184 } })
		e.Transparency = NumberSequence.new(0.05)
	end,
	daun = function(e)
		e.Texture = BULAT
		e.Rate = 55
		e.Lifetime = NumberRange.new(8, 10)
		e.Speed = NumberRange.new(5, 7)
		e.SpreadAngle = Vector2.new(18, 18)
		e.Size = NumberSequence.new(0.6)
		e.Squash = NumberSequence.new(-0.4)
		e.Rotation = NumberRange.new(0, 360)
		e.RotSpeed = NumberRange.new(-120, 120)
		e.Acceleration = Vector3.new(2.5, 0, 1)
		e.Color = warna({ { 232, 116, 42 }, { 210, 70, 42 }, { 242, 178, 52 }, { 184, 86, 42 } })
		e.Transparency = NumberSequence.new(0.05)
	end,
}

local lama = workspace:FindFirstChild("DK_Cuaca")
if lama then lama:Destroy() end
local awan = Instance.new("Part") -- lembaran tak terlihat di atas kamera, tempat partikel jatuh
awan.Name = "DK_Cuaca"
awan.Anchored = true
awan.CanCollide = false
awan.CanQuery = false
awan.CanTouch = false
awan.Transparency = 1
awan.Size = Vector3.new(170, 1, 170)
awan.Parent = workspace

local pemancar
local kini

local function dusunDi(p)
	if p.X < -5000 then return "kulon" end
	if p.Z < -5000 then return "curug" end
	if p.Z > 5000 then return "tlaga" end
	if p.X > 5000 then return "segara" end
	return "wetan"
end

local function ganti(d)
	kini = d
	local m = MUSIM[d]
	if pemancar then
		pemancar:Destroy()
		pemancar = nil
	end
	if not m then return end
	TweenService:Create(Lighting, TweenInfo.new(1.5), {
		FogColor = m.langit,
		FogStart = KABUT_AWAL * m.kabut,
		FogEnd = KABUT_AKHIR * m.kabut,
		Brightness = TERANG * m.cahaya,
	}):Play()
	if m.partikel then
		pemancar = Instance.new("ParticleEmitter")
		pemancar.EmissionDirection = Enum.NormalId.Bottom
		pemancar.LockedToPart = false
		PARTIKEL[m.partikel](pemancar)
		pemancar.Parent = awan
	end
	player:SetAttribute("DK_Musim", m.nama)
end

local hitung = 0
RunService.RenderStepped:Connect(function(dt)
	kamera = workspace.CurrentCamera
	if not kamera then return end
	local p = kamera.CFrame.Position
	awan.CFrame = CFrame.new(p.X, p.Y + 42, p.Z)
	hitung += dt
	if hitung > 0.5 or not kini then
		hitung = 0
		local d = dusunDi(p)
		if d ~= kini then ganti(d) end
	end
end)
