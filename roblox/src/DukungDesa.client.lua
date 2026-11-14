--[[
  DukungDesa (LocalScript, StarterPlayer.StarterPlayerScripts.DukungDesa) - panel Kotak Dukungan: beli Game Pass
  "Pendukung Desa" dan produk "1 Bata" lewat jendela pembelian resmi Roblox. Pasangannya: ServerScriptService.DukungDesa.
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

local L, T = 360, 268
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
local kabar = label(panel, "Dukungan hanya hiasan. Tidak ada koin yang dijual.", TEBAL, 13, Color3.fromRGB(190, 190, 200), 14, 36, L - 28, 18)

label(panel, "Pendukung Desa", BERAT, 15, PUTIH, 14, 64, L - 28, 18)
label(panel, "Sekali beli. Gelar emas \"Pendukung Desa\" di atas kepalamu.", TEBAL, 13, PUTIH, 14, 84, L - 28, 34)
local bPass = tombol(panel, "Segera hadir", 14, 120, L - 28, 34)

label(panel, "1 Bata", BERAT, 15, PUTIH, 14, 166, L - 28, 18)
label(panel, "Bisa dibeli berulang. Namamu naik di Tembok Pendukung.", TEBAL, 13, PUTIH, 14, 186, L - 28, 34)
local bBata = tombol(panel, "Segera hadir", 14, 222, L - 28, 34)

local info = { idPass = 0, idBata = 0, pass = false, bata = 0 }
local harga = {}
local function hargaDari(id, jenis)
	if id == 0 then return nil end
	if harga[id] == nil then
		harga[id] = false
		pcall(function()
			local p = MarketplaceService:GetProductInfo(id, jenis)
			if p and p.PriceInRobux then harga[id] = p.PriceInRobux end
		end)
	end
	return harga[id] or nil
end
local function mati(b, isi)
	b.Text = isi
	b.BackgroundColor3 = ABU
	b.TextColor3 = PUTIH
	b.Active = false
end
local function hidup(b, isi)
	b.Text = isi
	b.BackgroundColor3 = KUNING
	b.TextColor3 = GELAP
	b.Active = true
end
local function segarkan()
	local ok, d = pcall(function() return pintu:InvokeServer() end)
	if ok and typeof(d) == "table" then info = d end
	if info.idPass == 0 then mati(bPass, "Segera hadir")
	elseif info.pass then mati(bPass, "Sudah kamu miliki. Terima kasih!")
	else
		local h = hargaDari(info.idPass, Enum.InfoType.GamePass)
		hidup(bPass, h and ("Beli (" .. h .. " Robux)") or "Beli")
	end
	if info.idBata == 0 then mati(bBata, "Segera hadir")
	else
		local h = hargaDari(info.idBata, Enum.InfoType.Product)
		hidup(bBata, (h and ("Pasang 1 bata (" .. h .. " Robux)") or "Pasang 1 bata") .. (info.bata > 0 and ("  ·  batamu " .. info.bata) or ""))
	end
end

bPass.Activated:Connect(function()
	if info.idPass ~= 0 and not info.pass then MarketplaceService:PromptGamePassPurchase(player, info.idPass) end
end)
bBata.Activated:Connect(function()
	if info.idBata ~= 0 then MarketplaceService:PromptProductPurchase(player, info.idBata) end
end)
tutup.Activated:Connect(function() panel.Visible = false end)

buka.OnClientEvent:Connect(function(pesan)
	kabar.Text = typeof(pesan) == "string" and pesan or "Dukungan hanya hiasan. Tidak ada koin yang dijual."
	panel.Visible = true
	segarkan()
end)
