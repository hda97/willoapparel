--[[
  BusDusun (LocalScript) - menu "Naik bus ke dusun mana?" seperti di game web.
  Tempat: StarterPlayer.StarterPlayerScripts.BusDusun.
  Pasangannya: ServerScriptService.BusDusun (membuat ReplicatedStorage.DK_Bus).
  Tombol "Bus" ada di kiri bawah, di sebelah tombol "Tokoh".
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local pintu = ReplicatedStorage:WaitForChild("DK_Bus")

local KET = {
	wetan = { "Sawah", "Musim Hujan", Color3.fromRGB(207, 232, 255) },
	kulon = { "Bukit teh", "Musim Semi", Color3.fromRGB(255, 224, 236) },
	curug = { "Gunung & curug", "Musim Salju", Color3.fromRGB(232, 241, 250) },
	tlaga = { "Tepi danau", "Musim Gugur", Color3.fromRGB(255, 230, 196) },
	segara = { "Kota teluk", "Musim Panas", Color3.fromRGB(214, 240, 255) },
}
local URUT = { "wetan", "kulon", "curug", "tlaga", "segara" }
local GELAP = Color3.fromRGB(29, 29, 34)
local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local BERAT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)
local BIASA = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Medium)

local pg = player:WaitForChild("PlayerGui")
local lama = pg:FindFirstChild("BusDusun")
if lama then lama:Destroy() end

local gui = Instance.new("ScreenGui")
gui.Name = "BusDusun"
gui.ResetOnSpawn = false
gui.DisplayOrder = 21
gui.Parent = pg

local function bulat(o, r)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, r)
	c.Parent = o
end

local function teks(induk, isi, font, ukuran, warna)
	local t = Instance.new("TextLabel")
	t.BackgroundTransparency = 1
	t.FontFace = font
	t.TextSize = ukuran
	t.TextColor3 = warna or GELAP
	t.TextXAlignment = Enum.TextXAlignment.Left
	t.Text = isi
	t.Parent = induk
	return t
end

local tombol = Instance.new("TextButton")
tombol.Size = UDim2.fromOffset(84, 34)
tombol.AnchorPoint = Vector2.new(0, 1)
tombol.Position = UDim2.new(0, 104, 1, -12) -- tombol "Tokoh" ada di 12..96
tombol.BackgroundColor3 = GELAP
tombol.BackgroundTransparency = 0.15
tombol.TextColor3 = Color3.new(1, 1, 1)
tombol.FontFace = TEBAL
tombol.TextSize = 15
tombol.Text = "Bus"
bulat(tombol, 10)
tombol.Parent = gui

local latar = Instance.new("TextButton") -- klik di luar panel = tutup
latar.Size = UDim2.fromScale(1, 1)
latar.BackgroundColor3 = Color3.new(0, 0, 0)
latar.BackgroundTransparency = 0.55
latar.AutoButtonColor = false
latar.Text = ""
latar.Visible = false
latar.Parent = gui

local panel = Instance.new("Frame")
panel.AnchorPoint = Vector2.new(0.5, 0.5)
panel.Position = UDim2.fromScale(0.5, 0.5)
panel.Size = UDim2.new(0.92, 0, 0, 404)
panel.BackgroundColor3 = Color3.new(1, 1, 1)
panel.Active = true
bulat(panel, 14)
panel.Parent = latar
local batas = Instance.new("UISizeConstraint")
batas.MaxSize = Vector2.new(340, 404)
batas.Parent = panel

local judul = teks(panel, "Naik bus ke dusun mana?", BERAT, 18)
judul.Position = UDim2.fromOffset(16, 10)
judul.Size = UDim2.new(1, -60, 0, 26)

local tutup = Instance.new("TextButton")
tutup.AnchorPoint = Vector2.new(1, 0)
tutup.Position = UDim2.new(1, -10, 0, 8)
tutup.Size = UDim2.fromOffset(30, 30)
tutup.BackgroundColor3 = Color3.fromRGB(238, 238, 242)
tutup.FontFace = TEBAL
tutup.TextSize = 16
tutup.TextColor3 = GELAP
tutup.Text = "X"
bulat(tutup, 8)
tutup.Parent = panel

local tiket = teks(panel, "", BIASA, 13, Color3.fromRGB(90, 90, 100))
tiket.Position = UDim2.fromOffset(16, 38)
tiket.Size = UDim2.new(1, -32, 0, 18)
tiket.TextTruncate = Enum.TextTruncate.AtEnd

local daftar = Instance.new("Frame")
daftar.BackgroundTransparency = 1
daftar.Position = UDim2.fromOffset(12, 64)
daftar.Size = UDim2.new(1, -24, 1, -76)
daftar.Parent = panel
local susun = Instance.new("UIListLayout")
susun.Padding = UDim.new(0, 6)
susun.SortOrder = Enum.SortOrder.LayoutOrder
susun.Parent = daftar

local function pesan(isi)
	local t = Instance.new("TextLabel")
	t.AnchorPoint = Vector2.new(0.5, 0)
	t.Position = UDim2.new(0.5, 0, 0, 64)
	t.AutomaticSize = Enum.AutomaticSize.XY
	t.BackgroundColor3 = GELAP
	t.BackgroundTransparency = 0.1
	t.TextColor3 = Color3.new(1, 1, 1)
	t.FontFace = TEBAL
	t.TextSize = 15
	t.Text = isi
	bulat(t, 10)
	local isiP = Instance.new("UIPadding")
	isiP.PaddingLeft = UDim.new(0, 12)
	isiP.PaddingRight = UDim.new(0, 12)
	isiP.PaddingTop = UDim.new(0, 8)
	isiP.PaddingBottom = UDim.new(0, 8)
	isiP.Parent = t
	t.Parent = gui
	task.delay(3, function() t:Destroy() end)
end

local kartu = {}
local jalan = false

local function naik(k)
	if jalan then return end
	jalan = true
	latar.Visible = false
	local ok, r = pcall(function() return pintu:InvokeServer("naik", k) end)
	if ok and typeof(r) == "table" then
		if r.ok then
			local nama = "Kotak " .. k:sub(1, 1):upper() .. k:sub(2)
			if r.bayar and r.bayar > 0 then
				pesan("Tiket bus " .. r.bayar .. " koin. Sisa koinmu " .. r.koin .. ". Selamat datang di " .. nama .. "!")
			else
				pesan("Koinmu kurang, kali ini naik bus gratis. Selamat datang di " .. nama .. "!")
			end
		else
			pesan(r.pesan or "Bus mogok, coba lagi.")
		end
	else
		pesan("Bus mogok, coba lagi.")
	end
	jalan = false
end

for i, k in ipairs(URUT) do
	local b = Instance.new("TextButton")
	b.LayoutOrder = i
	b.Size = UDim2.new(1, 0, 0, 60)
	b.BackgroundColor3 = KET[k][3]
	b.AutoButtonColor = true
	b.Text = ""
	bulat(b, 10)
	b.Parent = daftar

	local nama = teks(b, "Kotak " .. k:sub(1, 1):upper() .. k:sub(2), BERAT, 16)
	nama.Position = UDim2.fromOffset(14, 9)
	nama.Size = UDim2.new(1, -150, 0, 20)
	local ket = teks(b, KET[k][1] .. " · " .. KET[k][2], BIASA, 12, Color3.fromRGB(70, 70, 80))
	ket.Position = UDim2.fromOffset(14, 32)
	ket.Size = UDim2.new(1, -150, 0, 16)
	local tanda = teks(b, "", TEBAL, 11, Color3.fromRGB(70, 70, 80))
	tanda.AnchorPoint = Vector2.new(1, 0.5)
	tanda.Position = UDim2.new(1, -12, 0.5, 0)
	tanda.Size = UDim2.fromOffset(130, 18)
	tanda.TextXAlignment = Enum.TextXAlignment.Right

	kartu[k] = { tombol = b, tanda = tanda, ada = false, ini = false }
	b.Activated:Connect(function()
		local c = kartu[k]
		if c.ini then return end
		if not c.ada then
			pesan(k == "segara" and "Dusun Kotak Segara masih terkunci." or "Dusun itu belum dibangun.")
			return
		end
		naik(k)
	end)
end

local function buka()
	local ok, r = pcall(function() return pintu:InvokeServer("daftar") end)
	if not ok or typeof(r) ~= "table" then
		pesan("Bus belum siap, coba lagi.")
		return
	end
	for _, d in ipairs(r.dusun) do
		local c = kartu[d.k]
		if c then
			c.ada, c.ini = d.ada, d.k == r.di
			c.tanda.Text = c.ini and "KAMU DI SINI" or (d.ada and "" or (d.k == "segara" and "TERKUNCI" or "BELUM ADA"))
			c.tombol.BackgroundTransparency = (d.ada and not c.ini) and 0 or 0.45
		end
	end
	if r.koin >= r.tarif then
		tiket.Text = "Tiket bus " .. r.tarif .. " koin sekali jalan."
	else
		tiket.Text = "Koinmu kurang dari " .. r.tarif .. ", kali ini naik bus gratis."
	end
	latar.Visible = true
end

tombol.Activated:Connect(function()
	if latar.Visible then latar.Visible = false else buka() end
end)
tutup.Activated:Connect(function() latar.Visible = false end)
latar.Activated:Connect(function() latar.Visible = false end)
