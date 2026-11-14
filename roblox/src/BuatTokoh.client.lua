--[[
  DUNIA KOTAK (Roblox) - MENU "BUAT TOKOHMU" v1
  Tempat: StarterPlayer.StarterPlayerScripts.BuatTokoh (LocalScript).

  Salinan menu pembuat tokoh game web (Jenis, Kulit, Rambut, Warna rambut/hijab,
  Atasan, Warna atasan, Bawahan, Warna bawahan). Tiap pilihan langsung terlihat
  di tokoh sendiri. Tombol Simpan menyimpan ke server (skrip AvatarKotak).
  Pemain baru: menu terbuka sendiri. Sesudahnya: tombol "Tokoh" di kiri bawah.
]]

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local pintu = ReplicatedStorage:WaitForChild("DK_Avatar")

local KULIT = { "#f6d6b8", "#f2c7a0", "#e0aa7e", "#c98c5e", "#a86e44", "#7a4a2a" }
local WARNA_RAMBUT = { "#0b0b0e", "#3a2416", "#6a4026", "#a0622e", "#d8b070", "#8a8a90", "#b03a2e", "#2a3a6a" }
local GAYA_RAMBUT = { L = { "cepak", "belah", "acak", "keriting" }, P = { "panjang", "kuncir", "kepang", "bob", "hijab" } }
local ATASAN = { "kaos", "kaos-willo", "kemeja", "jaket", "batik", "seragam" }
local BAWAHAN = { L = { "celana", "pendek", "sarung" }, P = { "celana", "rok", "rok-panjang" } }
local WARNA_BAJU = { "#1d1d22", "#f4f4f4", "#3a7bd5", "#d0442f", "#2a9a5a", "#f2c14e", "#8a5ad8", "#e06a9a" }
local WARNA_BAWAH = { "#2f3a52", "#1d1d22", "#6a5a48", "#3a5a3a", "#7a2a2a", "#c8b89a" }
local NAMA = {
	cepak = "Cepak", belah = "Belah", acak = "Acak", keriting = "Keriting", panjang = "Panjang", kuncir = "Kuncir",
	kepang = "Kepang", bob = "Bob", hijab = "Hijab", kaos = "Kaos", ["kaos-willo"] = "Kaos Willo", kemeja = "Kemeja",
	jaket = "Jaket", batik = "Batik", seragam = "Seragam", celana = "Celana", pendek = "Celana pendek", sarung = "Sarung",
	rok = "Rok", ["rok-panjang"] = "Rok panjang", L = "Laki-laki", P = "Perempuan",
}

local function ada(daftar, v)
	for _, x in ipairs(daftar) do if x == v then return true end end
	return false
end

local av
local function muat()
	local ok, t = pcall(function() return HttpService:JSONDecode(player:GetAttribute("DK_Avatar") or "") end)
	t = ok and typeof(t) == "table" and t or {}
	t.jenis = t.jenis == "P" and "P" or "L"
	t.kulit = t.kulit or KULIT[2]
	t.rambut = typeof(t.rambut) == "table" and t.rambut or {}
	t.atasan = typeof(t.atasan) == "table" and t.atasan or {}
	t.bawahan = typeof(t.bawahan) == "table" and t.bawahan or {}
	t.rambut.gaya = ada(GAYA_RAMBUT[t.jenis], t.rambut.gaya) and t.rambut.gaya or GAYA_RAMBUT[t.jenis][1]
	t.rambut.warna = t.rambut.warna or WARNA_RAMBUT[1]
	t.atasan.jenis = t.atasan.jenis or "kaos"
	t.atasan.warna = t.atasan.warna or "#3a7bd5"
	t.bawahan.jenis = ada(BAWAHAN[t.jenis], t.bawahan.jenis) and t.bawahan.jenis or "celana"
	t.bawahan.warna = t.bawahan.warna or "#2f3a52"
	av = t
end

local function kirim(simpan)
	pintu:FireServer(HttpService:JSONEncode(av), simpan == true)
end

---------------------------------------------------------------------
-- Tampilan
---------------------------------------------------------------------
local FONT_TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local gui = Instance.new("ScreenGui")
gui.Name = "BuatTokoh"
gui.ResetOnSpawn = false
gui.DisplayOrder = 20
gui.Parent = player:WaitForChild("PlayerGui")

local function bulat(o, r)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, r)
	c.Parent = o
end

local tombolBuka = Instance.new("TextButton")
tombolBuka.Size = UDim2.fromOffset(84, 34)
tombolBuka.AnchorPoint = Vector2.new(0, 1)
tombolBuka.Position = UDim2.new(0, 12, 1, -12)
tombolBuka.BackgroundColor3 = Color3.fromRGB(29, 29, 34)
tombolBuka.BackgroundTransparency = 0.15
tombolBuka.TextColor3 = Color3.new(1, 1, 1)
tombolBuka.FontFace = FONT_TEBAL
tombolBuka.TextSize = 15
tombolBuka.Text = "Tokoh"
bulat(tombolBuka, 10)
tombolBuka.Parent = gui

local panel = Instance.new("Frame")
panel.AnchorPoint = Vector2.new(0, 0.5) -- kiri layar, supaya tidak menutup papan skor di kanan atas
panel.Position = UDim2.new(0, 12, 0.5, 0)
panel.Size = UDim2.new(0, 330, 0.86, 0)
panel.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
panel.Visible = false
bulat(panel, 14)
panel.Parent = gui
local batas = Instance.new("UISizeConstraint")
batas.MaxSize = Vector2.new(330, 620)
batas.Parent = panel

local judul = Instance.new("TextLabel")
judul.BackgroundTransparency = 1
judul.Position = UDim2.fromOffset(16, 10)
judul.Size = UDim2.new(1, -32, 0, 28)
judul.FontFace = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)
judul.TextSize = 20
judul.TextXAlignment = Enum.TextXAlignment.Left
judul.TextColor3 = Color3.fromRGB(29, 29, 34)
judul.Text = "Buat tokohmu"
judul.Parent = panel

local daftar = Instance.new("ScrollingFrame")
daftar.Position = UDim2.fromOffset(12, 44)
daftar.Size = UDim2.new(1, -24, 1, -104)
daftar.BackgroundTransparency = 1
daftar.BorderSizePixel = 0
daftar.ScrollBarThickness = 5
daftar.AutomaticCanvasSize = Enum.AutomaticSize.Y
daftar.CanvasSize = UDim2.new()
daftar.Parent = panel
local susun = Instance.new("UIListLayout")
susun.Padding = UDim.new(0, 8)
susun.SortOrder = Enum.SortOrder.LayoutOrder
susun.Parent = daftar

local simpan = Instance.new("TextButton")
simpan.AnchorPoint = Vector2.new(0.5, 1)
simpan.Position = UDim2.new(0.5, 0, 1, -12)
simpan.Size = UDim2.new(1, -24, 0, 42)
simpan.BackgroundColor3 = Color3.fromRGB(42, 154, 90)
simpan.TextColor3 = Color3.new(1, 1, 1)
simpan.FontFace = FONT_TEBAL
simpan.TextSize = 17
simpan.Text = "Simpan"
bulat(simpan, 10)
simpan.Parent = panel

local tulis

local function baris(urut, nama, list, aktif, label, warna, pilih)
	local f = Instance.new("Frame")
	f.BackgroundTransparency = 1
	f.Size = UDim2.new(1, -6, 0, 0)
	f.AutomaticSize = Enum.AutomaticSize.Y
	f.LayoutOrder = urut
	local l = Instance.new("UIListLayout")
	l.Padding = UDim.new(0, 4)
	l.SortOrder = Enum.SortOrder.LayoutOrder
	l.Parent = f
	local t = Instance.new("TextLabel")
	t.BackgroundTransparency = 1
	t.Size = UDim2.new(1, 0, 0, 18)
	t.FontFace = FONT_TEBAL
	t.TextSize = 14
	t.TextXAlignment = Enum.TextXAlignment.Left
	t.TextColor3 = Color3.fromRGB(60, 60, 70)
	t.Text = nama
	t.LayoutOrder = 1
	t.Parent = f
	local w = Instance.new("Frame")
	w.BackgroundTransparency = 1
	w.Size = UDim2.new(1, 0, 0, 0)
	w.AutomaticSize = Enum.AutomaticSize.Y
	w.LayoutOrder = 2
	local wl = Instance.new("UIListLayout")
	wl.FillDirection = Enum.FillDirection.Horizontal
	wl.Wraps = true
	wl.Padding = UDim.new(0, 6)
	wl.SortOrder = Enum.SortOrder.LayoutOrder
	wl.Parent = w
	for i, v in ipairs(list) do
		local b = Instance.new("TextButton")
		b.LayoutOrder = i
		b.AutoButtonColor = true
		if warna then
			b.Size = UDim2.fromOffset(30, 30)
			b.BackgroundColor3 = Color3.fromHex(v)
			b.Text = ""
			bulat(b, 15)
		else
			b.Size = UDim2.fromOffset(0, 30)
			b.AutomaticSize = Enum.AutomaticSize.X
			b.BackgroundColor3 = v == aktif and Color3.fromRGB(29, 29, 34) or Color3.fromRGB(238, 238, 242)
			b.TextColor3 = v == aktif and Color3.new(1, 1, 1) or Color3.fromRGB(29, 29, 34)
			b.FontFace = FONT_TEBAL
			b.TextSize = 14
			b.Text = label and label[v] or v
			bulat(b, 8)
			local pad = Instance.new("UIPadding")
			pad.PaddingLeft = UDim.new(0, 10)
			pad.PaddingRight = UDim.new(0, 10)
			pad.Parent = b
		end
		local st = Instance.new("UIStroke")
		st.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
		st.Thickness = (warna and v == aktif) and 3 or 1
		st.Color = (warna and v == aktif) and Color3.fromRGB(42, 154, 90) or Color3.fromRGB(200, 200, 208)
		st.Parent = b
		b.Activated:Connect(function()
			pilih(v)
			tulis()
			kirim(false)
		end)
		b.Parent = w
	end
	w.Parent = f
	f.Parent = daftar
end

tulis = function()
	for _, o in ipairs(daftar:GetChildren()) do
		if o:IsA("Frame") then o:Destroy() end
	end
	baris(1, "Jenis", { "L", "P" }, av.jenis, NAMA, false, function(v)
		if av.jenis ~= v then
			av.jenis = v
			av.rambut.gaya = GAYA_RAMBUT[v][1]
			av.bawahan.jenis = "celana"
		end
	end)
	baris(2, "Kulit", KULIT, av.kulit, nil, true, function(v) av.kulit = v end)
	baris(3, "Rambut", GAYA_RAMBUT[av.jenis], av.rambut.gaya, NAMA, false, function(v) av.rambut.gaya = v end)
	if av.rambut.gaya == "hijab" then
		baris(4, "Warna hijab", WARNA_BAJU, av.rambut.warna, nil, true, function(v) av.rambut.warna = v end)
	else
		baris(4, "Warna rambut", WARNA_RAMBUT, av.rambut.warna, nil, true, function(v) av.rambut.warna = v end)
	end
	baris(5, "Atasan", ATASAN, av.atasan.jenis, NAMA, false, function(v) av.atasan.jenis = v end)
	baris(6, "Warna atasan", WARNA_BAJU, av.atasan.warna, nil, true, function(v) av.atasan.warna = v end)
	baris(7, "Bawahan", BAWAHAN[av.jenis], av.bawahan.jenis, NAMA, false, function(v) av.bawahan.jenis = v end)
	baris(8, "Warna bawahan", WARNA_BAWAH, av.bawahan.warna, nil, true, function(v) av.bawahan.warna = v end)
end

---------------------------------------------------------------------
-- Buka / tutup (kamera menghadap tokoh selama menu terbuka)
---------------------------------------------------------------------
local awal -- pilihan sebelum menu dibuka, untuk batal
local sambungKamera

local function kameraDepan(nyala)
	local cam = workspace.CurrentCamera
	if sambungKamera then sambungKamera:Disconnect() sambungKamera = nil end
	if not nyala then
		cam.CameraType = Enum.CameraType.Custom
		return
	end
	cam.CameraType = Enum.CameraType.Scriptable
	sambungKamera = game:GetService("RunService").RenderStepped:Connect(function()
		local char = player.Character
		local hrp = char and char:FindFirstChild("HumanoidRootPart")
		if not hrp then return end
		local geser = cam.ViewportSize.X > 700 and 2.2 or 0
		-- kamera 10 stud di depan tokoh; kalau ada bangunan di antaranya, kamera maju mendekat
		local mata = (hrp.CFrame * CFrame.new(0, 1.2, 0)).Position
		local arah = (hrp.CFrame * CFrame.new(0, 1.6, -10)).Position - mata
		local saring = RaycastParams.new()
		saring.FilterType = Enum.RaycastFilterType.Exclude
		saring.FilterDescendantsInstances = { char }
		local kena = workspace:Raycast(mata, arah, saring)
		local jarak = kena and math.max(4, (kena.Position - mata).Magnitude - 0.6) or arah.Magnitude
		local dari = mata + arah.Unit * jarak + hrp.CFrame.RightVector * geser
		cam.CFrame = CFrame.lookAt(dari, (hrp.CFrame * CFrame.new(geser, 0.4, 0)).Position)
	end)
end

local function buka(pertama)
	muat()
	awal = HttpService:JSONEncode(av)
	simpan.Text = pertama and "Simpan dan masuk desa" or "Simpan"
	tulis()
	panel.Visible = true
	tombolBuka.Visible = false
	kameraDepan(true)
end

local function tutup()
	panel.Visible = false
	tombolBuka.Visible = true
	kameraDepan(false)
end

simpan.Activated:Connect(function()
	kirim(true)
	tutup()
end)

tombolBuka.Activated:Connect(function() buka(false) end)

task.spawn(function()
	-- tunggu server selesai memuat pilihan tersimpan
	local mulai = os.clock()
	while player:GetAttribute("DK_AvatarBaru") == nil and os.clock() - mulai < 15 do task.wait(0.2) end
	if player:GetAttribute("DK_AvatarBaru") == true then
		if not player.Character then player.CharacterAdded:Wait() end
		task.wait(1.5)
		buka(true)
	end
end)
