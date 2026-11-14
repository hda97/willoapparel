--[[
  BelanjaToko (LocalScript) - panel belanja Warung Desa dan Supermarket, isi dan kalimatnya mengikuti game web.
  Tempat: StarterPlayer.StarterPlayerScripts.BelanjaToko.
  Pasangannya: ServerScriptService.BelanjaToko (DK_Belanja, DK_BelanjaBuka).
  Panel terbuka saat pemain menekan tombol "Belanja" di lahan toko.
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local pintu = ReplicatedStorage:WaitForChild("DK_Belanja")
local bukaEv = ReplicatedStorage:WaitForChild("DK_BelanjaBuka")

local GELAP = Color3.fromRGB(29, 29, 34)
local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local BERAT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)
local BIASA = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Medium)
local JUDUL_JENIS = { m = "🥤 Minuman", k = "🍽️ Makanan", t = "🎒 Masuk tas", p = "🧴 Kebutuhan" }
local URUT_JENIS = { "m", "k", "t", "p" }

local pg = player:WaitForChild("PlayerGui")
local lama = pg:FindFirstChild("BelanjaToko")
if lama then lama:Destroy() end

local gui = Instance.new("ScreenGui")
gui.Name = "BelanjaToko"
gui.ResetOnSpawn = false
gui.DisplayOrder = 23
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
	t.ZIndex = 5
	bulat(t, 10)
	local p = Instance.new("UIPadding")
	p.PaddingLeft = UDim.new(0, 12)
	p.PaddingRight = UDim.new(0, 12)
	p.PaddingTop = UDim.new(0, 8)
	p.PaddingBottom = UDim.new(0, 8)
	p.Parent = t
	t.Parent = gui
	task.delay(2.8, function() t:Destroy() end)
end

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
panel.Size = UDim2.new(0.94, 0, 0.96, 0)
panel.BackgroundColor3 = Color3.new(1, 1, 1)
panel.Active = true
bulat(panel, 14)
panel.Parent = latar
local batas = Instance.new("UISizeConstraint")
batas.MaxSize = Vector2.new(380, 520)
batas.Parent = panel

local judul = teks(panel, "", BERAT, 18)
judul.Position = UDim2.fromOffset(16, 10)
judul.Size = UDim2.new(1, -60, 0, 26)
judul.TextTruncate = Enum.TextTruncate.AtEnd

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

local status = teks(panel, "", BIASA, 13, Color3.fromRGB(70, 70, 80))
status.Position = UDim2.fromOffset(16, 38)
status.Size = UDim2.new(1, -32, 0, 18)
status.TextTruncate = Enum.TextTruncate.AtEnd

local daftar = Instance.new("ScrollingFrame")
daftar.BackgroundTransparency = 1
daftar.BorderSizePixel = 0
daftar.ScrollBarThickness = 4
daftar.CanvasSize = UDim2.new()
daftar.AutomaticCanvasSize = Enum.AutomaticSize.Y
daftar.ScrollingDirection = Enum.ScrollingDirection.Y
daftar.Position = UDim2.fromOffset(12, 62)
daftar.Size = UDim2.new(1, -24, 1, -98)
daftar.Parent = panel
local susun = Instance.new("UIListLayout")
susun.Padding = UDim.new(0, 6)
susun.SortOrder = Enum.SortOrder.LayoutOrder
susun.Parent = daftar

local kaki = teks(panel, "", BIASA, 12, Color3.fromRGB(110, 110, 120))
kaki.AnchorPoint = Vector2.new(0, 1)
kaki.Position = UDim2.new(0, 16, 1, -8)
kaki.Size = UDim2.new(1, -32, 0, 22)
kaki.TextTruncate = Enum.TextTruncate.AtEnd

local tempatKini
local sibuk = false
local tulis

local function beli(id)
	if sibuk or not tempatKini then return end
	sibuk = true
	local ok, r = pcall(function() return pintu:InvokeServer("beli", tempatKini, id) end)
	sibuk = false
	if not ok or typeof(r) ~= "table" then
		pesan("Ada gangguan, coba lagi.")
		return
	end
	if r.galat then
		pesan(r.galat)
		return
	end
	local h = r.hasil
	local kalimat = h.jenis == "m" and ("Srupuut… " .. h.nama .. " segar!")
		or h.jenis == "k" and ("Nyam! " .. h.nama .. " enak sekali.")
		or h.jenis == "t" and (h.nama .. " masuk tas 🎒")
		or ("Wangi! Habis pakai " .. h.nama .. ".")
	pesan(h.ikon .. " " .. kalimat .. " (-" .. h.harga .. " koin)")
	tulis(r)
end

tulis = function(r)
	judul.Text = r.nama
	status.Text = "Mau beli apa? Koinmu " .. r.koin .. " · jatah hari ini " .. r.sisa
	kaki.Text = "Maks " .. r.hari .. " pembelian sehari di sini."
	for _, c in ipairs(daftar:GetChildren()) do
		if not c:IsA("UIListLayout") then c:Destroy() end
	end
	local urut = 0
	for _, j in ipairs(URUT_JENIS) do
		local ada = false
		for _, m in ipairs(r.menu) do
			if m.jenis == j then
				if not ada then
					ada = true
					urut += 1
					local kepala = teks(daftar, JUDUL_JENIS[j], BERAT, 14)
					kepala.LayoutOrder = urut
					kepala.Size = UDim2.new(1, -6, 0, 24)
				end
				urut += 1
				local bisa = r.koin >= m.harga and r.sisa > 0
				local b = Instance.new("TextButton")
				b.LayoutOrder = urut
				b.Size = UDim2.new(1, -6, 0, 44)
				b.BackgroundColor3 = Color3.fromRGB(246, 243, 232)
				b.BackgroundTransparency = bisa and 0 or 0.5
				b.AutoButtonColor = bisa
				b.Text = ""
				bulat(b, 10)
				b.Parent = daftar
				local nama = teks(b, m.ikon .. "  " .. m.nama, TEBAL, 15)
				nama.Position = UDim2.fromOffset(12, 0)
				nama.Size = UDim2.new(1, -110, 1, 0)
				nama.TextTransparency = bisa and 0 or 0.4
				local jml = j == "t" and tonumber(r.tas[m.nama]) or nil
				local harga = teks(b, (jml and ("punya " .. jml .. " · ") or "") .. m.harga .. " koin", TEBAL, 13, Color3.fromRGB(150, 100, 0))
				harga.AnchorPoint = Vector2.new(1, 0)
				harga.Position = UDim2.new(1, -12, 0, 0)
				harga.Size = UDim2.new(0, 130, 1, 0)
				harga.TextXAlignment = Enum.TextXAlignment.Right
				if bisa then
					b.Activated:Connect(function() beli(m.id) end)
				end
			end
		end
	end
end

bukaEv.OnClientEvent:Connect(function(tempat)
	local ok, r = pcall(function() return pintu:InvokeServer("buka", tempat) end)
	if not ok or typeof(r) ~= "table" or r.galat then
		pesan(ok and typeof(r) == "table" and r.galat or "Toko belum siap, coba lagi.")
		return
	end
	tempatKini = tempat
	tulis(r)
	latar.Visible = true
end)
tutup.Activated:Connect(function() latar.Visible = false end)
latar.Activated:Connect(function() latar.Visible = false end)
