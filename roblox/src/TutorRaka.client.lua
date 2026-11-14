--[[
  TutorRaka (LocalScript) - dialog tutorial Raka, 6 langkah, bisa dilewati kapan saja. Kalimatnya mengikuti TUTOR di game web,
  disesuaikan dengan tombol dan kegiatan yang ada di versi Roblox. Tanpa suara (rekaman suara Raka belum diunggah ke Roblox).
  Tempat: StarterPlayer.StarterPlayerScripts.TutorRaka. Pasangannya: ServerScriptService.TutorRaka (DK_Tutor).
  Tombol "?" di kiri bawah (sebelah "Naik") membuka tutorial lagi.
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local ev = ReplicatedStorage:WaitForChild("DK_Tutor")

local GELAP = Color3.fromRGB(29, 29, 34)
local KUNING = Color3.fromRGB(255, 196, 37)
local PUTIH = Color3.new(1, 1, 1)
local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local BERAT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)

local TUTOR = {
	"Halo! Aku Raka, ini Oyen. Yuk, aku ajak keliling sebentar. Cuma beberapa langkah, bisa kamu lewati kapan saja.",
	"Cari koin dari kegiatan: tanam dan panen di Kebun Bersama, jadi Tukang Kotak di lahan proyek, jaga loket Taman Hiburan, dan balapan di Reli Kotak.",
	"Koinnya bisa kamu belanjakan. Dekati Warung, Supermarket, Dealer Kendaraan, atau Toko Willo, lalu tekan tombol yang muncul.",
	"Tiap minggu warga memilih fasum baru. Bantu bangun pemenangnya jadi Tukang Kotak: angkut bahan ke lingkaran kuning di lahan proyek.",
	"Desa kita punya beberapa dusun dengan musim yang berbeda. Pindah dusun lewat tombol Bus, tiketnya 5 koin.",
	"Atur tokohmu lewat tombol Tokoh dan klaim rumahmu lewat tombol Rumah. Selamat bermain, sampai ketemu di desa!",
}

local pg = player:WaitForChild("PlayerGui")
local lama = pg:FindFirstChild("TutorRaka")
if lama then lama:Destroy() end
local gui = Instance.new("ScreenGui")
gui.Name = "TutorRaka"
gui.ResetOnSpawn = false
gui.DisplayOrder = 40
gui.Parent = pg

local function bulat(o, r)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, r)
	c.Parent = o
end

local function tombol(induk, isi, warna, warnaTeks)
	local b = Instance.new("TextButton")
	b.BackgroundColor3 = warna
	b.TextColor3 = warnaTeks or GELAP
	b.FontFace = TEBAL
	b.TextSize = 14
	b.Text = isi
	bulat(b, 9)
	b.Parent = induk
	return b
end

-- tombol "?" di sebelah "Naik" ("Tokoh" 12..96, "Bus" 104..188, "Rumah" 196..280, "Naik" 288..372)
local bTanya = tombol(gui, "?", GELAP, PUTIH)
bTanya.BackgroundTransparency = 0.1
bTanya.TextSize = 16
bTanya.AnchorPoint = Vector2.new(0, 1)
bTanya.Position = UDim2.new(0, 380, 1, -12)
bTanya.Size = UDim2.fromOffset(34, 34)

local kotak = Instance.new("Frame")
kotak.AnchorPoint = Vector2.new(0.5, 1)
kotak.Position = UDim2.new(0.5, 0, 1, -56)
kotak.Size = UDim2.fromOffset(460, 118)
kotak.BackgroundColor3 = GELAP
kotak.BackgroundTransparency = 0.04
kotak.Visible = false
bulat(kotak, 14)
kotak.Parent = gui

-- wajah Raka gaya kotak: kepala, rambut, mata
local wajah = Instance.new("Frame")
wajah.Position = UDim2.fromOffset(14, 14)
wajah.Size = UDim2.fromOffset(54, 54)
wajah.BackgroundColor3 = Color3.fromRGB(240, 196, 150)
bulat(wajah, 8)
wajah.Parent = kotak
local rambut = Instance.new("Frame")
rambut.Size = UDim2.new(1, 0, 0, 16)
rambut.BackgroundColor3 = Color3.fromRGB(50, 36, 30)
rambut.BorderSizePixel = 0
bulat(rambut, 8)
rambut.Parent = wajah
for _, x in ipairs({ 14, 34 }) do
	local m = Instance.new("Frame")
	m.Position = UDim2.fromOffset(x, 26)
	m.Size = UDim2.fromOffset(6, 8)
	m.BackgroundColor3 = GELAP
	m.BorderSizePixel = 0
	m.Parent = wajah
end
local nama = Instance.new("TextLabel")
nama.BackgroundTransparency = 1
nama.Position = UDim2.fromOffset(8, 72)
nama.Size = UDim2.fromOffset(66, 16)
nama.FontFace = BERAT
nama.TextSize = 13
nama.TextColor3 = KUNING
nama.Text = "Raka"
nama.Parent = kotak

local isi = Instance.new("TextLabel")
isi.BackgroundTransparency = 1
isi.Position = UDim2.fromOffset(82, 12)
isi.Size = UDim2.new(1, -96, 0, 64)
isi.FontFace = TEBAL
isi.TextSize = 14
isi.TextColor3 = PUTIH
isi.TextWrapped = true
isi.TextXAlignment = Enum.TextXAlignment.Left
isi.TextYAlignment = Enum.TextYAlignment.Top
isi.Parent = kotak

local hitung = Instance.new("TextLabel")
hitung.BackgroundTransparency = 1
hitung.Position = UDim2.fromOffset(82, 86)
hitung.Size = UDim2.fromOffset(60, 20)
hitung.FontFace = TEBAL
hitung.TextSize = 12
hitung.TextColor3 = Color3.fromRGB(170, 170, 180)
hitung.TextXAlignment = Enum.TextXAlignment.Left
hitung.Parent = kotak

local bLewati = tombol(kotak, "Lewati", Color3.fromRGB(70, 70, 78), PUTIH)
bLewati.AnchorPoint = Vector2.new(1, 1)
bLewati.Position = UDim2.new(1, -124, 1, -10)
bLewati.Size = UDim2.fromOffset(84, 30)
local bLanjut = tombol(kotak, "Lanjut", KUNING)
bLanjut.AnchorPoint = Vector2.new(1, 1)
bLanjut.Position = UDim2.new(1, -12, 1, -10)
bLanjut.Size = UDim2.fromOffset(104, 30)

local langkah = 0
local function tulis()
	isi.Text = TUTOR[langkah]
	hitung.Text = langkah .. " / " .. #TUTOR
	bLanjut.Text = langkah >= #TUTOR and "Siap main!" or "Lanjut"
	bLewati.Visible = langkah < #TUTOR
end

local function tutup()
	kotak.Visible = false
	langkah = 0
	ev:FireServer("selesai")
end

local function buka()
	if kotak.Visible then return end
	langkah = 1
	tulis()
	kotak.Visible = true
end

bLanjut.Activated:Connect(function()
	if langkah >= #TUTOR then return tutup() end
	langkah += 1
	tulis()
end)
bLewati.Activated:Connect(tutup)
bTanya.Activated:Connect(buka)
ev.OnClientEvent:Connect(function(op)
	if op == "mulai" then buka() end
end)
