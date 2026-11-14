--[[
  DukungDesa (LocalScript, StarterPlayer.StarterPlayerScripts.DukungDesa) - panel Kotak Dukungan: daftar Game Pass dan
  produk hiasan dari server, dibeli lewat jendela pembelian resmi Roblox. Pasangannya: ServerScriptService.DukungDesa.
  Kalau nomor pass atau produk belum diisi di server, tombolnya tertulis "Segera hadir".
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")

local player = Players.LocalPlayer
local pintu = ReplicatedStorage:WaitForChild("DK_Dukung")
local buka = ReplicatedStorage:WaitForChild("DK_DukungBuka")

local GELAP = Color3.fromRGB(29, 29, 34)
local KUNING = Color3.fromRGB(255, 196, 37)
local PUTIH = Color3.new(1, 1, 1)
local ABU = Color3.fromRGB(70, 70, 78)
local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local BERAT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)

local pg = player:WaitForChild("PlayerGui")
local lama = pg:FindFirstChild("DukungDesa")
if lama then lama:Destroy() end
local gui = Instance.new("ScreenGui")
gui.Name = "DukungDesa"
gui.ResetOnSpawn = false
gui.DisplayOrder = 59
gui.Parent = pg

local function bulat(o, r)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, r)
	c.Parent = o
end
local function label(induk, isi, font, ukuran, warna, x, y, w, h)
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
	t.Parent = induk
	return t
end
local function tombol(induk, isi, x, y, w, h)
	local b = Instance.new("TextButton")
	b.Position = UDim2.fromOffset(x, y)
	b.Size = UDim2.fromOffset(w, h)
	b.BackgroundColor3 = KUNING
	b.TextColor3 = GELAP
	b.FontFace = TEBAL
	b.TextSize = 15
	b.Text = isi
	bulat(b, 9)
	b.Parent = induk
	return b
end

local L, T = 380, 300
local panel = Instance.new("Frame")
panel.Size = UDim2.fromOffset(L, T)
panel.AnchorPoint = Vector2.new(0.5, 0.5)
panel.Position = UDim2.fromScale(0.5, 0.5)
panel.BackgroundColor3 = GELAP
panel.BackgroundTransparency = 0.04
panel.Visible = false
bulat(panel, 14)
panel.Parent = gui
do
	local sk = Instance.new("UIScale")
	sk.Parent = panel
	local function atur()
		local v = workspace.CurrentCamera.ViewportSize
		sk.Scale = math.min(1, (v.Y - 16) / T, (v.X - 16) / L)
	end
	atur()
	workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(atur)
end
label(panel, "Dukung Desa", BERAT, 18, KUNING, 14, 10, 280, 22)
local tutup = tombol(panel, "X", L - 38, 8, 28, 28)
tutup.BackgroundColor3 = ABU
tutup.TextColor3 = PUTIH
local PESAN = "Semua hanya hiasan. Tidak ada koin yang dijual."
local kabar = label(panel, PESAN, TEBAL, 13, Color3.fromRGB(190, 190, 200), 14, 36, L - 28, 18)

local isi = Instance.new("ScrollingFrame")
isi.Position = UDim2.fromOffset(10, 60)
isi.Size = UDim2.fromOffset(L - 20, T - 70)
isi.BackgroundTransparency = 1
isi.BorderSizePixel = 0
isi.ScrollBarThickness = 5
isi.CanvasSize = UDim2.fromOffset(0, 0)
isi.Parent = panel

local harga = {}
local function hargaDari(id, jenis)
	if harga[id] == nil then
		harga[id] = false
		pcall(function()
			local p = MarketplaceService:GetProductInfo(id, jenis)
			if p and p.PriceInRobux then harga[id] = p.PriceInRobux end
		end)
	end
	return harga[id] or nil
end

local TINGGI = 58
local function segarkan()
	local ok, d = pcall(function() return pintu:InvokeServer() end)
	if not ok or typeof(d) ~= "table" or typeof(d.daftar) ~= "table" then return end
	for _, c in ipairs(isi:GetChildren()) do c:Destroy() end
	for i, b in ipairs(d.daftar) do
		local baris = Instance.new("Frame")
		baris.Position = UDim2.fromOffset(0, (i - 1) * (TINGGI + 6))
		baris.Size = UDim2.fromOffset(L - 30, TINGGI)
		baris.BackgroundColor3 = Color3.fromRGB(44, 44, 52)
		baris.BorderSizePixel = 0
		bulat(baris, 9)
		baris.Parent = isi
		local nama = b.nama
		if b.jenis == "produk" and b.nama:find("Bata") and d.bata > 0 then nama = nama .. "  ·  batamu " .. d.bata end
		label(baris, nama, BERAT, 14, PUTIH, 10, 7, L - 150, 18)
		label(baris, b.ket, TEBAL, 12, Color3.fromRGB(200, 200, 210), 10, 26, L - 150, 30)
		local t = tombol(baris, "Segera hadir", L - 136, 12, 98, 34)
		t.TextSize = 13
		if b.id == 0 then
			t.BackgroundColor3, t.TextColor3, t.Active = ABU, PUTIH, false
		elseif b.punya then
			t.Text = "Dimiliki"
			t.BackgroundColor3, t.TextColor3, t.Active = ABU, PUTIH, false
		else
			t.Text = "Beli"
			task.spawn(function()
				local h = hargaDari(b.id, b.jenis == "pass" and Enum.InfoType.GamePass or Enum.InfoType.Product)
				if h and t.Parent then t.Text = h .. " Robux" end
			end)
			t.Activated:Connect(function()
				if b.jenis == "pass" then MarketplaceService:PromptGamePassPurchase(player, b.id)
				else MarketplaceService:PromptProductPurchase(player, b.id) end
			end)
		end
	end
	isi.CanvasSize = UDim2.fromOffset(0, #d.daftar * (TINGGI + 6))
end

tutup.Activated:Connect(function() panel.Visible = false end)

buka.OnClientEvent:Connect(function(pesan)
	kabar.Text = typeof(pesan) == "string" and pesan or PESAN
	panel.Visible = true
	segarkan()
end)
