--[[
  HiasRumah (LocalScript) - tombol "🎨 Hias" dan panel Toko Hias di dalam rumah sendiri (seperti ⚙ Atur > Toko Hias di game web).
  Tempat: StarterPlayer.StarterPlayerScripts.HiasRumah. Pasangannya: ServerScriptService.HiasRumah (DK_Hias, DK_HiasKabar).
  Tombol muncul di tempat tombol "Naik" (kiri bawah) selama pemain di dalam rumahnya (atribut DK_DiRumah).
  Tombol "Masuk rumah" di pintu rumah warga lain disembunyikan: hanya pemilik yang bisa masuk.
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local pintu = ReplicatedStorage:WaitForChild("DK_Hias")
local kabarEv = ReplicatedStorage:WaitForChild("DK_HiasKabar")

local GELAP = Color3.fromRGB(29, 29, 34)
local KUNING = Color3.fromRGB(255, 196, 37)
local KRIM = Color3.fromRGB(246, 243, 232)
local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local BERAT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)
local BIASA = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Medium)

-- tombol masuk rumah orang lain disembunyikan
local function saringTombol(o)
	if o:IsA("ProximityPrompt") then
		local p = o:GetAttribute("pemilik")
		if p and p ~= player.UserId then o.Enabled = false end
	end
end
task.spawn(function()
	local f = workspace:WaitForChild("DK_HiasRumah", 60)
	if not f then return end
	for _, o in ipairs(f:GetDescendants()) do saringTombol(o) end
	f.DescendantAdded:Connect(saringTombol)
end)

local pg = player:WaitForChild("PlayerGui")
local lama = pg:FindFirstChild("HiasRumah")
if lama then lama:Destroy() end
local gui = Instance.new("ScreenGui")
gui.Name = "HiasRumah"
gui.ResetOnSpawn = false
gui.DisplayOrder = 45 -- di atas tombol "?" (TutorRaka 40)
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
kabarEv.OnClientEvent:Connect(pesan)

local tombol = Instance.new("TextButton")
tombol.Size = UDim2.fromOffset(84, 34)
tombol.AnchorPoint = Vector2.new(0, 1)
tombol.Position = UDim2.new(0, 288, 1, -12) -- tempat tombol "Naik" (tidak dipakai di dalam rumah)
tombol.BackgroundColor3 = KUNING
tombol.TextColor3 = GELAP
tombol.FontFace = BERAT
tombol.TextSize = 15
tombol.Text = "🎨 Hias"
tombol.Visible = false
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
batas.MaxSize = Vector2.new(400, 560)
batas.Parent = panel

local judul = teks(panel, "🎨 Hias Rumah", BERAT, 18)
judul.Position = UDim2.fromOffset(16, 10)
judul.Size = UDim2.new(1, -60, 0, 26)

local saldo = teks(panel, "", TEBAL, 13, Color3.fromRGB(150, 100, 0))
saldo.Position = UDim2.fromOffset(16, 36)
saldo.Size = UDim2.new(1, -32, 0, 18)

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
daftar.Position = UDim2.fromOffset(12, 60)
daftar.Size = UDim2.new(1, -24, 1, -72)
daftar.Parent = panel
local susun = Instance.new("UIListLayout")
susun.Padding = UDim.new(0, 6)
susun.SortOrder = Enum.SortOrder.LayoutOrder
susun.Parent = daftar

local data
local sibuk = false
local bayar = "koin"
local tulis

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
	tulis()
	return r
end

local urutan = 0
local function baris(tinggi)
	urutan += 1
	local f = Instance.new("Frame")
	f.LayoutOrder = urutan
	f.BackgroundTransparency = 1
	f.Size = UDim2.new(1, -6, 0, tinggi)
	f.Parent = daftar
	return f
end

local function tombolKecil(induk, isi, aktif)
	local b = Instance.new("TextButton")
	b.BackgroundColor3 = aktif and Color3.fromRGB(255, 232, 160) or KRIM
	b.FontFace = TEBAL
	b.TextSize = 12
	b.TextColor3 = GELAP
	b.Text = isi
	b.TextWrapped = true
	bulat(b, 10)
	if aktif then
		local s = Instance.new("UIStroke")
		s.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
		s.Thickness = 2
		s.Color = KUNING
		s.Parent = b
	end
	b.Parent = induk
	return b
end

tulis = function()
	if not data then return end
	for _, c in ipairs(daftar:GetChildren()) do
		if not c:IsA("UIListLayout") then c:Destroy() end
	end
	urutan = 0
	saldo.Text = "💎 " .. data.permata .. " permata  ·  " .. data.koin .. " koin"
	-- pilihan bayar (web: Permata / Koin x10)
	local fb = baris(30)
	local lb = teks(fb, "Bayar pakai:", BIASA, 13)
	lb.Size = UDim2.new(0.34, 0, 1, 0)
	for i, j in ipairs({ { "permata", "💎 Permata" }, { "koin", "Koin (x" .. data.kali .. ")" } }) do
		local b = tombolKecil(fb, j[2], bayar == j[1])
		b.Position = UDim2.new(0.34 + (i - 1) * 0.33, 0, 0, 0)
		b.Size = UDim2.new(0.32, 0, 1, 0)
		b.Activated:Connect(function()
			bayar = j[1]
			tulis()
		end)
	end
	for _, jn in ipairs(data.urut) do
		local t = data.toko[jn]
		local fj = baris(20)
		local h = teks(fj, t.ikon .. " " .. t.nama, BERAT, 14)
		h.Size = UDim2.fromScale(1, 1)
		local fl = baris(0)
		fl.AutomaticSize = Enum.AutomaticSize.Y
		local g = Instance.new("UIGridLayout")
		g.CellSize = UDim2.new(0.31, 0, 0, 52)
		g.CellPadding = UDim2.new(0.02, 0, 0, 6)
		g.SortOrder = Enum.SortOrder.LayoutOrder
		g.Parent = fl
		for i, item in ipairs(t.daftar) do
			local punya = item.harga == 0 or table.find(data.hias.punya[jn], item.id) ~= nil
			local pakai = data.hias[jn] == item.id
			local label = pakai and "Dipakai" or punya and "Pakai" or bayar == "koin" and (item.harga * data.kali .. " koin") or ("💎 " .. item.harga)
			local b = tombolKecil(fl, "", pakai)
			b.LayoutOrder = i
			if item.warna then
				local w = Instance.new("Frame")
				w.Size = UDim2.fromOffset(16, 16)
				w.Position = UDim2.new(0, 8, 0, 8)
				w.BackgroundColor3 = Color3.fromHex(item.warna)
				bulat(w, 8)
				local s = Instance.new("UIStroke")
				s.Color = Color3.fromRGB(190, 190, 200)
				s.Parent = w
				w.Parent = b
			end
			local n = teks(b, (item.warna and "" or (item.id == "dua" and "🏡 " or "🏠 ")) .. item.label, TEBAL, 12)
			n.Position = UDim2.fromOffset(item.warna and 28 or 8, 6)
			n.Size = UDim2.new(1, item.warna and -32 or -12, 0, 20)
			n.TextTruncate = Enum.TextTruncate.AtEnd
			local hl = teks(b, label, BIASA, 11, Color3.fromRGB(150, 100, 0))
			hl.Position = UDim2.fromOffset(8, 28)
			hl.Size = UDim2.new(1, -12, 0, 18)
			if not pakai then
				b.Activated:Connect(function() kirim("pilih", jn, item.id, bayar) end)
			end
		end
	end
	local fj = baris(20)
	local h = teks(fj, "🪑 Hiasan pekarangan (koin)", BERAT, 14)
	h.Size = UDim2.fromScale(1, 1)
	for _, d in ipairs(data.dekor) do
		local punya = table.find(data.hias.punya.dekor, d.id) ~= nil
		local pasang = table.find(data.hias.dekor, d.id) ~= nil
		local f = baris(40)
		f.BackgroundTransparency = 0
		f.BackgroundColor3 = KRIM
		bulat(f, 10)
		local n = teks(f, d.ikon .. "  " .. d.nama, TEBAL, 14)
		n.Position = UDim2.fromOffset(12, 0)
		n.Size = UDim2.new(1, -130, 1, 0)
		local b = tombolKecil(f, punya and (pasang and "Lepas" or "Pasang") or ("Beli · " .. d.harga), pasang)
		b.AnchorPoint = Vector2.new(1, 0.5)
		b.Position = UDim2.new(1, -6, 0.5, 0)
		b.Size = UDim2.fromOffset(110, 30)
		b.Activated:Connect(function() kirim("dekor", d.id) end)
	end
	local fi = baris(44)
	local info = teks(fi, "Tampilan baru terlihat di luar rumah. Barang yang sudah dibeli bisa dipakai lagi gratis.", BIASA, 12, Color3.fromRGB(90, 90, 100))
	info.Size = UDim2.fromScale(1, 1)
	info.TextWrapped = true
	info.TextYAlignment = Enum.TextYAlignment.Top
end

local function buka()
	local r = kirim("buka")
	if not r then return end
	if not r.tertaut then
		pesan("Tautkan dulu akun web-mu lewat tombol Rumah.")
		return
	end
	latar.Visible = true
end

tombol.Activated:Connect(function()
	if latar.Visible then latar.Visible = false else buka() end
end)
tutup.Activated:Connect(function() latar.Visible = false end)
latar.Activated:Connect(function() latar.Visible = false end)

local function aturTombol()
	local di = player:GetAttribute("DK_DiRumah") == true
	tombol.Visible = di
	if not di then latar.Visible = false end
end
player:GetAttributeChangedSignal("DK_DiRumah"):Connect(aturTombol)
aturTombol()
