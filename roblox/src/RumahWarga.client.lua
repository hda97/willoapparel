--[[
  RumahWarga (LocalScript) - tombol "Rumah": belum tertaut = isi kode 6 huruf dari game web, sudah tertaut = pulang ke rumah.
  Tempat: StarterPlayer.StarterPlayerScripts.RumahWarga.
  Pasangannya: ServerScriptService.RumahWarga (membuat ReplicatedStorage.DK_Rumah).
  Tombol ada di kiri bawah, di sebelah "Tokoh" dan "Bus". Tidak ada link ke situs luar di sini (aturan Roblox).
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local pintu = ReplicatedStorage:WaitForChild("DK_Rumah")

local GELAP = Color3.fromRGB(29, 29, 34)
local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local BERAT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)
local BIASA = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Medium)

local pg = player:WaitForChild("PlayerGui")
local lama = pg:FindFirstChild("RumahWarga")
if lama then lama:Destroy() end

local gui = Instance.new("ScreenGui")
gui.Name = "RumahWarga"
gui.ResetOnSpawn = false
gui.DisplayOrder = 22
gui.Parent = pg

local function bulat(o, r)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, r)
	c.Parent = o
end

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
	local p = Instance.new("UIPadding")
	p.PaddingLeft = UDim.new(0, 12)
	p.PaddingRight = UDim.new(0, 12)
	p.PaddingTop = UDim.new(0, 8)
	p.PaddingBottom = UDim.new(0, 8)
	p.Parent = t
	t.Parent = gui
	task.delay(4, function() t:Destroy() end)
end

local tombol = Instance.new("TextButton")
tombol.Size = UDim2.fromOffset(84, 34)
tombol.AnchorPoint = Vector2.new(0, 1)
tombol.Position = UDim2.new(0, 196, 1, -12) -- "Tokoh" 12..96, "Bus" 104..188
tombol.BackgroundColor3 = GELAP
tombol.BackgroundTransparency = 0.15
tombol.TextColor3 = Color3.new(1, 1, 1)
tombol.FontFace = TEBAL
tombol.TextSize = 15
tombol.Text = "Rumah"
bulat(tombol, 10)
tombol.Parent = gui

local latar = Instance.new("TextButton")
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
panel.Size = UDim2.new(0.92, 0, 0, 236)
panel.BackgroundColor3 = Color3.new(1, 1, 1)
panel.Active = true
bulat(panel, 14)
panel.Parent = latar
local batas = Instance.new("UISizeConstraint")
batas.MaxSize = Vector2.new(340, 236)
batas.Parent = panel

local judul = Instance.new("TextLabel")
judul.BackgroundTransparency = 1
judul.Position = UDim2.fromOffset(16, 10)
judul.Size = UDim2.new(1, -60, 0, 26)
judul.FontFace = BERAT
judul.TextSize = 18
judul.TextColor3 = GELAP
judul.TextXAlignment = Enum.TextXAlignment.Left
judul.Text = "Punya rumah di game web?"
judul.Parent = panel

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

local ket = Instance.new("TextLabel")
ket.BackgroundTransparency = 1
ket.Position = UDim2.fromOffset(16, 40)
ket.Size = UDim2.new(1, -32, 0, 66)
ket.FontFace = BIASA
ket.TextSize = 13
ket.TextColor3 = Color3.fromRGB(70, 70, 80)
ket.TextWrapped = true
ket.TextXAlignment = Enum.TextXAlignment.Left
ket.TextYAlignment = Enum.TextYAlignment.Top
ket.Text = "Buka game Dunia Kotak di web, masuk Profil, tekan \"Tautkan Roblox\", lalu ketik kode 6 hurufnya di sini. Kode berlaku 10 menit."
ket.Parent = panel

local isian = Instance.new("TextBox")
isian.Position = UDim2.fromOffset(16, 112)
isian.Size = UDim2.new(1, -32, 0, 46)
isian.BackgroundColor3 = Color3.fromRGB(238, 238, 242)
isian.FontFace = BERAT
isian.TextSize = 26
isian.TextColor3 = GELAP
isian.PlaceholderText = "KODE"
isian.PlaceholderColor3 = Color3.fromRGB(170, 170, 180)
isian.ClearTextOnFocus = false
isian.Text = ""
bulat(isian, 10)
isian.Parent = panel

local kirim = Instance.new("TextButton")
kirim.Position = UDim2.fromOffset(16, 170)
kirim.Size = UDim2.new(1, -32, 0, 46)
kirim.BackgroundColor3 = Color3.fromRGB(255, 196, 37)
kirim.FontFace = BERAT
kirim.TextSize = 16
kirim.TextColor3 = GELAP
kirim.Text = "Tautkan"
bulat(kirim, 10)
kirim.Parent = panel

isian:GetPropertyChangedSignal("Text"):Connect(function()
	local bersih = isian.Text:upper():gsub("[^A-Z]", ""):sub(1, 6)
	if bersih ~= isian.Text then isian.Text = bersih end
end)

local sibuk = false

local function pulang()
	local ok, r = pcall(function() return pintu:InvokeServer("pulang") end)
	if ok and typeof(r) == "table" and r.ok then
		pesan("Selamat datang di rumahmu, No. " .. r.no .. "!")
	else
		pesan(ok and typeof(r) == "table" and r.pesan or "Ada gangguan, coba lagi.")
	end
end

kirim.Activated:Connect(function()
	if sibuk then return end
	if #isian.Text ~= 6 then
		pesan("Kode harus 6 huruf.")
		return
	end
	sibuk = true
	kirim.Text = "Memeriksa..."
	local ok, r = pcall(function() return pintu:InvokeServer("taut", isian.Text) end)
	kirim.Text = "Tautkan"
	sibuk = false
	if ok and typeof(r) == "table" and r.ok then
		latar.Visible = false
		isian.Text = ""
		local t = "Tertaut! Halo " .. r.nama .. ", warga No. " .. r.no .. "."
		if r.bonus and r.bonus > 0 then t = t .. " Bonus Warga Lama +" .. r.bonus .. " koin." end
		pesan(t)
		if r.adaRumah then
			task.wait(1.5)
			pulang()
		end
	else
		pesan(ok and typeof(r) == "table" and r.pesan or "Ada gangguan, coba lagi.")
	end
end)

tombol.Activated:Connect(function()
	if sibuk then return end
	if latar.Visible then
		latar.Visible = false
		return
	end
	local ok, r = pcall(function() return pintu:InvokeServer("info") end)
	if not ok or typeof(r) ~= "table" then
		pesan("Belum siap, coba lagi.")
		return
	end
	if r.tertaut then
		sibuk = true
		pulang()
		sibuk = false
	else
		latar.Visible = true
	end
end)
tutup.Activated:Connect(function() latar.Visible = false end)
latar.Activated:Connect(function() latar.Visible = false end)
