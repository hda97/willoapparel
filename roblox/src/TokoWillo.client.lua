--[[
  TokoWillo (LocalScript) - panel Toko Willo Apparel: pilih sablon dan warna, pesan, ambil, dan lemari kaos.
  Tempat: StarterPlayer.StarterPlayerScripts.TokoWillo.
  Pasangannya: ServerScriptService.TokoWillo (DK_Kaos, DK_KaosBuka).
  Panel terbuka saat pemain menekan "Pesan Kaos" di Toko Willo Apparel (Dusun Kotak Wetan).
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local pintu = ReplicatedStorage:WaitForChild("DK_Kaos")
local bukaEv = ReplicatedStorage:WaitForChild("DK_KaosBuka")

local GELAP = Color3.fromRGB(29, 29, 34)
local KUNING = Color3.fromRGB(255, 196, 37)
local KRIM = Color3.fromRGB(246, 243, 232)
local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local BERAT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)
local BIASA = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Medium)

local pg = player:WaitForChild("PlayerGui")
local lama = pg:FindFirstChild("TokoWillo")
if lama then lama:Destroy() end

local gui = Instance.new("ScreenGui")
gui.Name = "TokoWillo"
gui.ResetOnSpawn = false
gui.DisplayOrder = 25
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
batas.MaxSize = Vector2.new(380, 560)
batas.Parent = panel

local judul = teks(panel, "Toko Willo Apparel", BERAT, 18)
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

local isi = Instance.new("ScrollingFrame")
isi.BackgroundTransparency = 1
isi.BorderSizePixel = 0
isi.ScrollBarThickness = 4
isi.CanvasSize = UDim2.new()
isi.AutomaticCanvasSize = Enum.AutomaticSize.Y
isi.ScrollingDirection = Enum.ScrollingDirection.Y
isi.Position = UDim2.fromOffset(12, 44)
isi.Size = UDim2.new(1, -24, 1, -54)
isi.Parent = panel
local susun = Instance.new("UIListLayout")
susun.Padding = UDim.new(0, 6)
susun.SortOrder = Enum.SortOrder.LayoutOrder
susun.Parent = isi

local data
local pilihS, pilihW, tulisan = "willo", "#1d1d22", ""
local sibuk = false
local tulis
local urut = 0

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
	data.diterima = os.clock()
	if r.pesanBalik then pesan(r.pesanBalik) end
	return r
end

local function baris(tinggi)
	urut += 1
	local f = Instance.new("Frame")
	f.BackgroundTransparency = 1
	f.LayoutOrder = urut
	f.Size = UDim2.new(1, -6, 0, tinggi)
	f.Parent = isi
	return f
end

local function tombol(induk, isiTeks, warna)
	local b = Instance.new("TextButton")
	b.BackgroundColor3 = warna or KUNING
	b.FontFace = BERAT
	b.TextSize = 15
	b.TextColor3 = GELAP
	b.Text = isiTeks
	bulat(b, 10)
	b.Parent = induk
	return b
end

local function namaKaos(k)
	local n = ""
	for _, s in ipairs(data.sablon) do
		if s.id == k.d then n = s.nama end
	end
	for _, w in ipairs(data.warna) do
		if w.hex == k.w then n = n .. " · " .. w.nama end
	end
	if k.t and k.t ~= "" then n = n .. " · " .. k.t end
	return n
end

local sisaT -- label hitung mundur pesanan

tulis = function()
	if not data then return end
	koinT.Text = data.koin .. " koin"
	for _, c in ipairs(isi:GetChildren()) do
		if not c:IsA("UIListLayout") then c:Destroy() end
	end
	urut = 0
	sisaT = nil
	local p = data.pesan
	if p then
		local f = baris(86)
		f.BackgroundTransparency = 0
		f.BackgroundColor3 = KRIM
		bulat(f, 10)
		local sisa = math.max(0, p.sisa - (os.clock() - data.diterima))
		local a = teks(f, sisa <= 0 and "✅ Kaosmu sudah jadi!" or "🖨️ Sedang disablon…", BERAT, 15)
		a.Position = UDim2.fromOffset(12, 6)
		a.Size = UDim2.new(1, -24, 0, 20)
		local b = teks(f, namaKaos(p), BIASA, 12, Color3.fromRGB(90, 90, 100))
		b.Position = UDim2.fromOffset(12, 26)
		b.Size = UDim2.new(1, -24, 0, 16)
		b.TextTruncate = Enum.TextTruncate.AtEnd
		if sisa <= 0 then
			local ambil = tombol(f, "Ambil & pakai")
			ambil.Position = UDim2.fromOffset(12, 46)
			ambil.Size = UDim2.new(1, -24, 0, 34)
			ambil.Activated:Connect(function()
				if kirim("ambil") then tulis() end
			end)
		else
			sisaT = teks(f, "", TEBAL, 14, Color3.fromRGB(150, 100, 0))
			sisaT.Position = UDim2.fromOffset(12, 50)
			sisaT.Size = UDim2.new(1, -24, 0, 22)
		end
	end

	local k1 = teks(baris(20), "Pilih sablon", BERAT, 14)
	k1.Size = UDim2.fromScale(1, 1)
	for _, s in ipairs(data.sablon) do
		local f = baris(40)
		local b = Instance.new("TextButton")
		b.Size = UDim2.fromScale(1, 1)
		b.BackgroundColor3 = s.id == pilihS and Color3.fromRGB(255, 232, 160) or KRIM
		b.Text = ""
		bulat(b, 10)
		b.Parent = f
		local n = teks(b, s.nama, TEBAL, 14)
		n.Position = UDim2.fromOffset(12, 3)
		n.Size = UDim2.new(1, -100, 0, 18)
		local kt = teks(b, s.id == "dusun" and ("Tulisan KOTAK " .. data.dusun .. ", dada & punggung") or s.ket, BIASA, 11, Color3.fromRGB(100, 100, 110))
		kt.Position = UDim2.fromOffset(12, 20)
		kt.Size = UDim2.new(1, -100, 0, 16)
		kt.TextTruncate = Enum.TextTruncate.AtEnd
		local h = teks(b, s.harga .. " koin", TEBAL, 13, Color3.fromRGB(150, 100, 0))
		h.AnchorPoint = Vector2.new(1, 0)
		h.Position = UDim2.new(1, -12, 0, 0)
		h.Size = UDim2.new(0, 80, 1, 0)
		h.TextXAlignment = Enum.TextXAlignment.Right
		b.Activated:Connect(function()
			pilihS = s.id
			tulis()
		end)
	end

	if pilihS == "tulisan" then
		local f = baris(40)
		local kotak = Instance.new("TextBox")
		kotak.Size = UDim2.fromScale(1, 1)
		kotak.BackgroundColor3 = Color3.fromRGB(238, 238, 242)
		kotak.FontFace = BERAT
		kotak.TextSize = 18
		kotak.TextColor3 = GELAP
		kotak.PlaceholderText = "TULISAN (maks 10)"
		kotak.PlaceholderColor3 = Color3.fromRGB(170, 170, 180)
		kotak.ClearTextOnFocus = false
		kotak.Text = tulisan
		bulat(kotak, 10)
		kotak.Parent = f
		kotak:GetPropertyChangedSignal("Text"):Connect(function()
			local bersih = kotak.Text:upper():gsub("[^A-Z0-9 ]", ""):sub(1, 10)
			if bersih ~= kotak.Text then kotak.Text = bersih end
			tulisan = bersih
		end)
	end

	local k2 = teks(baris(20), "Warna kaos", BERAT, 14)
	k2.Size = UDim2.fromScale(1, 1)
	local fw = baris(34)
	local sw = Instance.new("UIListLayout")
	sw.FillDirection = Enum.FillDirection.Horizontal
	sw.Padding = UDim.new(0, 8)
	sw.VerticalAlignment = Enum.VerticalAlignment.Center
	sw.Parent = fw
	local pad = Instance.new("UIPadding")
	pad.PaddingLeft = UDim.new(0, 3)
	pad.Parent = fw
	for _, w in ipairs(data.warna) do
		local b = Instance.new("TextButton")
		b.Size = UDim2.fromOffset(28, 28)
		b.BackgroundColor3 = Color3.fromHex(w.hex)
		b.Text = ""
		bulat(b, 14)
		local st = Instance.new("UIStroke")
		st.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
		st.Thickness = w.hex == pilihW and 3 or 1
		st.Color = w.hex == pilihW and KUNING or Color3.fromRGB(190, 190, 200)
		st.Parent = b
		b.Parent = fw
		b.Activated:Connect(function()
			pilihW = w.hex
			tulis()
		end)
	end

	local harga = 0
	for _, s in ipairs(data.sablon) do
		if s.id == pilihS then harga = s.harga end
	end
	local fp = baris(44)
	local bp = tombol(fp, "")
	bp.Size = UDim2.fromScale(1, 1)
	if p then
		bp.Text = "Ambil dulu kaos yang sedang disablon"
		bp.TextSize = 13
		bp.BackgroundTransparency = 0.5
	elseif not data.diToko then
		bp.Text = "Pesan di Toko Willo, Kotak Wetan"
		bp.BackgroundTransparency = 0.5
	elseif data.koin < harga then
		bp.Text = "Koinmu kurang " .. (harga - data.koin)
		bp.BackgroundTransparency = 0.5
	else
		bp.Text = "Pesan · " .. harga .. " koin"
		bp.Activated:Connect(function()
			if pilihS == "tulisan" and tulisan:gsub(" ", "") == "" then
				pesan("Isi dulu tulisannya (huruf/angka, maks 10).")
				return
			end
			if kirim("pesan", pilihS, pilihW, tulisan) then tulis() end
		end)
	end

	if #data.lemari > 0 then
		local k3 = teks(baris(20), "Lemari kaosmu · ketuk untuk pakai, gratis", BERAT, 13)
		k3.Size = UDim2.fromScale(1, 1)
		for i, k in ipairs(data.lemari) do
			local f = baris(34)
			local b = Instance.new("TextButton")
			b.Size = UDim2.fromScale(1, 1)
			b.BackgroundColor3 = k.dipakai == 1 and Color3.fromRGB(255, 232, 160) or KRIM
			b.Text = ""
			bulat(b, 10)
			b.Parent = f
			local titik = Instance.new("Frame")
			titik.Size = UDim2.fromOffset(18, 18)
			titik.Position = UDim2.fromOffset(10, 8)
			titik.BackgroundColor3 = Color3.fromHex(k.w)
			bulat(titik, 9)
			local st = Instance.new("UIStroke")
			st.Color = Color3.fromRGB(190, 190, 200)
			st.Parent = titik
			titik.Parent = b
			local n = teks(b, namaKaos(k) .. (k.dipakai == 1 and "  ✓" or ""), TEBAL, 13)
			n.Position = UDim2.fromOffset(36, 0)
			n.Size = UDim2.new(1, -46, 1, 0)
			n.TextTruncate = Enum.TextTruncate.AtEnd
			b.Activated:Connect(function()
				if kirim("pakai", i) then tulis() end
			end)
		end
	end
end

-- hitung mundur pesanan; saat habis panel ditulis ulang supaya tombol "Ambil & pakai" muncul
task.spawn(function()
	while true do
		task.wait(0.5)
		if latar.Visible and data and data.pesan and sisaT and sisaT.Parent then
			local sisa = data.pesan.sisa - (os.clock() - data.diterima)
			if sisa <= 0 then
				tulis()
			else
				sisaT.Text = string.format("Selesai dalam %d:%02d", math.floor(sisa / 60), math.floor(sisa % 60))
			end
		end
	end
end)

bukaEv.OnClientEvent:Connect(function()
	if not kirim("buka") then return end
	tulis()
	latar.Visible = true
end)
tutup.Activated:Connect(function() latar.Visible = false end)
latar.Activated:Connect(function() latar.Visible = false end)
