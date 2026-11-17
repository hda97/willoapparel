--[[
  MusikDusun (LocalScript) - lagu latar tiap dusun, sama dengan game web (public/duniakotak/mabar/js/suara.js).
  Tempat: StarterPlayer.StarterPlayerScripts.MusikDusun.

  Lagunya orisinal (digubah dan disintesis sendiri di game web), direkam jadi file loop mulus oleh
  roblox/musik/rekam.js lalu diunggah ke akun Roblox sebagai audio:
    Wetan  = gamelan lembut + gerimis        Kulon  = suling riang + kicau burung
    Curug  = kotak musik/lonceng + angin     Tlaga  = waltz akordeon komidi putar + desir daun
    Segara = steel drum & marimba + ombak
  Pindah dusun (bus, jalan kaki) = lagu berganti pelan (silang 2 detik). Hanya terdengar di layar pemain itu sendiri.
  Tombol 🎵 kecil di baris tombol kiri bawah (sebelah "?") untuk mematikan / menyalakan musik (diingat selama bermain).
]]
local Players = game:GetService("Players")
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer

-- nomor audio di Roblox (0 = belum diunggah, dusun itu diam)
local LAGU = {
	wetan = 79826162163086,
	kulon = 83582853143063,
	curug = 103038119079140,
	tlaga = 88452590896723,
	segara = 119769471073179,
}
local KERAS = 0.45 -- keras kelima lagu sudah disamakan saat direkam

-- sama dengan MusimDusun.client.lua
local function dusunDi(p)
	if p.X < -5000 then return "kulon" end
	if p.Z < -5000 then return "curug" end
	if p.Z > 5000 then return "tlaga" end
	if p.X > 5000 then return "segara" end
	return "wetan"
end

local lama = SoundService:FindFirstChild("DK_Musik")
if lama then lama:Destroy() end
local wadah = Instance.new("Folder")
wadah.Name = "DK_Musik"
wadah.Parent = SoundService

local suara = {}
for dusun, id in pairs(LAGU) do
	if id ~= 0 then
		local s = Instance.new("Sound")
		s.Name = dusun
		s.SoundId = "rbxassetid://" .. id
		s.Looped = true
		s.Volume = 0
		s.Parent = wadah
		suara[dusun] = s
	end
end

local nyala = true
local kini
local SILANG = TweenInfo.new(2, Enum.EasingStyle.Sine)

local function atur(dusun)
	for d, s in pairs(suara) do
		local tuju = (nyala and d == dusun) and KERAS or 0
		if tuju > 0 and not s.IsPlaying then s:Play() end
		local tw = TweenService:Create(s, SILANG, { Volume = tuju })
		tw:Play()
		if tuju == 0 then
			tw.Completed:Connect(function(st)
				if st == Enum.PlaybackState.Completed and s.Volume == 0 then s:Pause() end
			end)
		end
	end
	kini = dusun
end

-- tombol musik kecil di ujung baris tombol kiri bawah (Tokoh, Bus, Rumah, Naik, ?)
do
	local gui = Instance.new("ScreenGui")
	gui.Name = "DK_MusikTombol"
	gui.ResetOnSpawn = false
	gui.DisplayOrder = 5
	local b = Instance.new("TextButton")
	b.Name = "Musik"
	b.AnchorPoint = Vector2.new(0, 1)
	b.Position = UDim2.new(0, 422, 1, -12) -- sebelah "?" (380..414) di baris tombol kiri bawah
	b.Size = UDim2.fromOffset(34, 34)
	b.BackgroundColor3 = Color3.fromRGB(29, 29, 34)
	b.BackgroundTransparency = 0.1
	b.TextColor3 = Color3.new(1, 1, 1)
	b.Font = Enum.Font.GothamBold
	b.TextSize = 16
	b.Text = "🎵"
	b.AutoButtonColor = true
	local sudut = Instance.new("UICorner")
	sudut.CornerRadius = UDim.new(0, 8)
	sudut.Parent = b
	b.Parent = gui
	b.Activated:Connect(function()
		nyala = not nyala
		b.Text = nyala and "🎵" or "🔇"
		atur(kini)
	end)
	gui.Parent = player:WaitForChild("PlayerGui")
end

local detik = 0
while true do
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if hrp then
		local d = dusunDi(hrp.Position)
		if d ~= kini then atur(d) end
	end
	-- lagu gagal dimuat (mis. sinyal putus saat masuk): coba muat ulang tiap 10 detik
	detik += 1
	local s = kini and suara[kini]
	if s and nyala and detik % 10 == 0 and not s.IsLoaded then
		local id = s.SoundId
		s.SoundId = ""
		s.SoundId = id
		s:Play()
	end
	task.wait(1)
end
