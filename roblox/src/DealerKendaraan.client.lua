--[[
  DealerKendaraan (LocalScript) - panel Dealer Kendaraan dan tombol "Naik", isi dan kalimatnya mengikuti game web.
  Tempat: StarterPlayer.StarterPlayerScripts.DealerKendaraan.
  Pasangannya: ServerScriptService.DealerKendaraan (DK_Dealer, DK_DealerBuka).
  Panel terbuka saat pemain menekan "Lihat kendaraan" di lahan dealer (Dusun Curug).
  Tombol "Naik" ada di kiri bawah, di sebelah "Tokoh", "Bus", dan "Rumah".
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local pintu = ReplicatedStorage:WaitForChild("DK_Dealer")
local bukaEv = ReplicatedStorage:WaitForChild("DK_DealerBuka")

local GELAP = Color3.fromRGB(29, 29, 34)
local KUNING = Color3.fromRGB(255, 196, 37)
local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local BERAT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)
local BIASA = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Medium)

local pg = player:WaitForChild("PlayerGui")
local lama = pg:FindFirstChild("DealerKendaraan")
if lama then lama:Destroy() end

local gui = Instance.new("ScreenGui")
gui.Name = "DealerKendaraan"
gui.ResetOnSpawn = false
gui.DisplayOrder = 24
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
	task.delay(3.5, function() t:Destroy() end)
end

local tombol = Instance.new("TextButton")
tombol.Size = UDim2.fromOffset(84, 34)
tombol.AnchorPoint = Vector2.new(0, 1)
tombol.Position = UDim2.new(0, 288, 1, -12) -- "Tokoh" 12..96, "Bus" 104..188, "Rumah" 196..280
tombol.BackgroundColor3 = GELAP
tombol.BackgroundTransparency = 0.15
tombol.TextColor3 = Color3.new(1, 1, 1)
tombol.FontFace = TEBAL
tombol.TextSize = 15
tombol.Text = "Naik"
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
panel.Size = UDim2.new(0.94, 0, 0.96, 0)
panel.BackgroundColor3 = Color3.new(1, 1, 1)
panel.Active = true
bulat(panel, 14)
panel.Parent = latar
local batas = Instance.new("UISizeConstraint")
batas.MaxSize = Vector2.new(380, 540)
batas.Parent = panel

local judul = teks(panel, "Dealer Kendaraan", BERAT, 18)
judul.Position = UDim2.fromOffset(16, 10)
judul.Size = UDim2.new(1, -150, 0, 26)

local koinT = teks(panel, "", TEBAL, 14, Color3.fromRGB(150, 100, 0))
koinT.AnchorPoint = Vector2.new(1, 0)
koinT.Position = UDim2.new(1, -50, 0, 10)
koinT.Size = UDim2.fromOffset(90, 26)
koinT.TextXAlignment = Enum.TextXAlignment.Right

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

local daftar = Instance.new("ScrollingFrame")
daftar.BackgroundTransparency = 1
daftar.BorderSizePixel = 0
daftar.ScrollBarThickness = 4
daftar.CanvasSize = UDim2.new()
daftar.AutomaticCanvasSize = Enum.AutomaticSize.Y
daftar.ScrollingDirection = Enum.ScrollingDirection.Y
daftar.Position = UDim2.fromOffset(12, 44)
daftar.Size = UDim2.new(1, -24, 1, -186)
daftar.Parent = panel
local susun = Instance.new("UIListLayout")
susun.Padding = UDim.new(0, 6)
susun.SortOrder = Enum.SortOrder.LayoutOrder
susun.Parent = daftar

local bawah = Instance.new("Frame")
bawah.BackgroundTransparency = 1
bawah.AnchorPoint = Vector2.new(0, 1)
bawah.Position = UDim2.new(0, 16, 1, -12)
bawah.Size = UDim2.new(1, -32, 0, 124)
bawah.Parent = panel

local namaT = teks(bawah, "", BERAT, 15)
namaT.Size = UDim2.new(1, 0, 0, 20)
local ketT = teks(bawah, "", BIASA, 12, Color3.fromRGB(90, 90, 100))
ketT.Position = UDim2.fromOffset(0, 20)
ketT.Size = UDim2.new(1, 0, 0, 16)
ketT.TextTruncate = Enum.TextTruncate.AtEnd

local barisWarna = Instance.new("Frame")
barisWarna.BackgroundTransparency = 1
barisWarna.Position = UDim2.fromOffset(2, 42)
barisWarna.Size = UDim2.new(1, 0, 0, 28)
barisWarna.Parent = bawah
local susunW = Instance.new("UIListLayout")
susunW.FillDirection = Enum.FillDirection.Horizontal
susunW.Padding = UDim.new(0, 8)
susunW.Parent = barisWarna

local utama = Instance.new("TextButton")
utama.Position = UDim2.fromOffset(0, 80)
utama.Size = UDim2.new(1, 0, 0, 44)
utama.BackgroundColor3 = KUNING
utama.FontFace = BERAT
utama.TextSize = 16
utama.TextColor3 = GELAP
utama.Text = ""
bulat(utama, 10)
utama.Parent = bawah

local cat = Instance.new("TextButton")
cat.Position = UDim2.new(0.52, 0, 0, 80)
cat.Size = UDim2.new(0.48, 0, 0, 44)
cat.BackgroundColor3 = Color3.fromRGB(238, 238, 242)
cat.FontFace = TEBAL
cat.TextSize = 14
cat.TextColor3 = GELAP
cat.Text = ""
cat.Visible = false
bulat(cat, 10)
cat.Parent = bawah

local data -- keadaan terakhir dari server
local pilihM, pilihW = "sepeda", 0
local sibuk = false
local yakin = false -- tekan "Beli" dua kali (pengganti kotak konfirmasi di web)
local tulis

local function punya(m)
	if not data then return nil end
	for i, k in ipairs(data.garasi) do
		if k.m == m then return i, k end
	end
	return nil
end

local function kirim(...)
	if sibuk then return nil end
	sibuk = true
	local a = table.pack(...)
	local ok, r = pcall(function() return pintu:InvokeServer(table.unpack(a, 1, a.n)) end)
	sibuk = false
	if not ok or typeof(r) ~= "table" then
		pesan("Ada gangguan, coba lagi.")
		return nil
	end
	if r.galat then
		pesan(r.galat)
		return nil
	end
	data = r
	if r.pesan then pesan(r.pesan) end
	tombol.Text = r.naik ~= "" and "Turun" or "Naik"
	return r
end

tulis = function()
	if not data then return end
	koinT.Text = data.koin .. " koin"
	for _, c in ipairs(daftar:GetChildren()) do
		if not c:IsA("UIListLayout") then c:Destroy() end
	end
	local pilih
	for i, k in ipairs(data.daftar) do
		if k.id == pilihM then pilih = k end
		local b = Instance.new("TextButton")
		b.LayoutOrder = i
		b.Size = UDim2.new(1, -6, 0, 34)
		b.BackgroundColor3 = k.id == pilihM and Color3.fromRGB(255, 232, 160) or Color3.fromRGB(246, 243, 232)
		b.Text = ""
		bulat(b, 10)
		b.Parent = daftar
		local n = teks(b, k.ikon .. "  " .. k.nama, TEBAL, 15)
		n.Position = UDim2.fromOffset(12, 0)
		n.Size = UDim2.new(1, -110, 1, 0)
		local h = teks(b, punya(k.id) and "✓ Punya" or (k.harga .. " koin"), TEBAL, 13, Color3.fromRGB(150, 100, 0))
		h.AnchorPoint = Vector2.new(1, 0)
		h.Position = UDim2.new(1, -12, 0, 0)
		h.Size = UDim2.new(0, 90, 1, 0)
		h.TextXAlignment = Enum.TextXAlignment.Right
		b.Activated:Connect(function()
			pilihM = k.id
			local _, milik = punya(k.id)
			if milik then pilihW = milik.w end
			yakin = false
			tulis()
		end)
	end
	if not pilih then return end
	namaT.Text = pilih.ikon .. " " .. pilih.nama
	ketT.Text = string.format("%.1f", pilih.kec):gsub("%.", ",") .. "× lebih cepat dari jalan kaki · " .. pilih.ket
	for _, c in ipairs(barisWarna:GetChildren()) do
		if not c:IsA("UIListLayout") then c:Destroy() end
	end
	for i, w in ipairs(data.warna) do
		local b = Instance.new("TextButton")
		b.Size = UDim2.fromOffset(28, 28)
		b.BackgroundColor3 = Color3.fromRGB(w.r, w.g, w.b)
		b.Text = ""
		bulat(b, 14)
		local s = Instance.new("UIStroke")
		s.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
		s.Thickness = (i - 1) == pilihW and 3 or 1
		s.Color = (i - 1) == pilihW and KUNING or Color3.fromRGB(190, 190, 200)
		s.Parent = b
		b.Parent = barisWarna
		b.Activated:Connect(function()
			pilihW = i - 1
			yakin = false
			tulis()
		end)
	end
	local i, milik = punya(pilihM)
	cat.Visible = false
	utama.Size = UDim2.new(1, 0, 0, 44)
	utama.BackgroundTransparency = 0
	if not milik then
		if not data.diDealer then
			utama.Text = "Beli di Dealer, Dusun Curug"
			utama.BackgroundTransparency = 0.5
		elseif data.koin < pilih.harga then
			utama.Text = "Koinmu kurang " .. (pilih.harga - data.koin)
			utama.BackgroundTransparency = 0.5
		else
			utama.Text = yakin and ("Yakin beli? Tekan lagi · " .. pilih.harga .. " koin") or ("Beli · " .. pilih.harga .. " koin")
		end
	else
		utama.Text = pilih.ikon .. " Naik sekarang"
		if milik.w ~= pilihW and data.diDealer then
			utama.Size = UDim2.new(0.48, 0, 0, 44)
			cat.Visible = true
			cat.Text = "🎨 Cat ulang · " .. data.hargaCat .. " koin"
			cat.BackgroundTransparency = data.koin < data.hargaCat and 0.5 or 0
		end
	end
	return i
end

utama.Activated:Connect(function()
	if not data then return end
	local i, milik = punya(pilihM)
	if milik then
		if data.pakai ~= i and not kirim("pakai", i) then return end
		if kirim("naik") then latar.Visible = false end
		return
	end
	if not data.diDealer then
		pesan("Kendaraan dibeli di Dealer Kendaraan, Dusun Curug. Naik bus ke sana.")
		return
	end
	local harga = 0
	for _, k in ipairs(data.daftar) do
		if k.id == pilihM then harga = k.harga end
	end
	if data.koin < harga then
		pesan("Koinmu kurang " .. (harga - data.koin) .. ". Kumpulkan dari misi, panen, dan kerja.")
		return
	end
	if not yakin then
		yakin = true
		tulis()
		return
	end
	yakin = false
	kirim("beli", pilihM, pilihW)
	tulis()
end)

cat.Activated:Connect(function()
	local i = punya(pilihM)
	if not data or not i then return end
	if data.koin < data.hargaCat then
		pesan("Koinmu kurang (" .. data.hargaCat .. " koin).")
		return
	end
	kirim("cat", i, pilihW)
	tulis()
end)

local function buka()
	if not kirim("buka") then return end
	local k = data.garasi[data.pakai]
	if k then pilihM, pilihW = k.m, k.w end
	yakin = false
	tulis()
	latar.Visible = true
end

bukaEv.OnClientEvent:Connect(buka)
tombol.Activated:Connect(function()
	if latar.Visible then
		latar.Visible = false
		return
	end
	if (player:GetAttribute("DK_Naik") or "") ~= "" then
		kirim("turun")
		return
	end
	local r = kirim("buka")
	if not r then return end
	if #r.garasi == 0 then
		pesan("Belum punya kendaraan. Beli di Dealer Kendaraan, Dusun Curug.")
	elseif r.garasi[r.pakai] then
		kirim("naik")
	else
		local k = r.garasi[1]
		pilihM, pilihW = k.m, k.w
		tulis()
		latar.Visible = true
	end
end)
tutup.Activated:Connect(function() latar.Visible = false end)
latar.Activated:Connect(function() latar.Visible = false end)

-- saat naik kendaraan, ayunan jalan dihentikan supaya tokoh tampak duduk diam di kendaraan
local function aturAnimasi()
	local naik = (player:GetAttribute("DK_Naik") or "") ~= ""
	tombol.Text = naik and "Turun" or "Naik"
	local char = player.Character
	if not char then return end
	local skrip = char:FindFirstChild("Animate")
	if skrip and skrip:IsA("LocalScript") then skrip.Enabled = not naik end
	if naik then
		local hum = char:FindFirstChildOfClass("Humanoid")
		local animator = hum and hum:FindFirstChildOfClass("Animator")
		if animator then
			for _, t in ipairs(animator:GetPlayingAnimationTracks()) do t:Stop(0.1) end
		end
	end
end
player:GetAttributeChangedSignal("DK_Naik"):Connect(aturAnimasi)
player.CharacterAdded:Connect(function() task.defer(aturAnimasi) end)
aturAnimasi()
