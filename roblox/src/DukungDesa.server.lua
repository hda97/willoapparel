--[[
  DukungDesa (Script, ServerScriptService.DukungDesa) - dukungan pakai Robux untuk Dunia Kotak. Semuanya hanya hiasan:
  tidak menjual koin, tidak membuat pemain lebih cepat maju, dan tidak ada tautan pembayaran di luar Roblox.

  Game Pass (sekali beli):
    - Pendukung Desa : gelar emas "Pendukung Desa" di atas kepala
    - Jejak Bintang  : percik bintang mengikuti langkah
    - Gelar Pelangi  : tulisan gelar berwarna pelangi
    - Lentera Malam  : cahaya hangat di sekitar tokoh
  Developer Product (bisa dibeli berulang):
    - 1 Bata dan 5 Bata : hitungan bata di gelar dan nama di Tembok Pendukung
    - Kembang Api       : kembang api di atas kepala, terlihat semua pemain
  Pemain Roblox Premium: tanda kecil "Premium" di gelar (penghasilan Premium Payouts dihitung Roblox sendiri).

  CARA MENYALAKAN: buat pass dan produk di Creator Dashboard, lalu isi nomornya di kolom id pada tabel PASS dan PRODUK.
  Selama id = 0, barang itu tampil "Segera hadir" dan tidak bisa dibeli.

  Kotak Dukungan dan Tembok Pendukung berdiri di tepi jalan setapak dekat titik muncul Kotak Wetan.
  Data: DataStore "DuniaKotak_Dukung_v1" kunci "p_<UserId>" = { bata, struk = { id pembelian terakhir } };
  OrderedDataStore "DuniaKotak_DukungTop" = jumlah bata tiap pemain. Pasangannya: StarterPlayerScripts.DukungDesa.
]]

local PASS = {
	{ kunci = "pendukung", id = 2088543159, nama = "Pendukung Desa", ket = "Gelar emas di atas kepalamu." },
	{ kunci = "jejak", id = 2088957184, nama = "Jejak Bintang", ket = "Percik bintang mengikuti langkahmu." },
	{ kunci = "pelangi", id = 2088003239, nama = "Gelar Pelangi", ket = "Tulisan gelarmu berwarna pelangi." },
	{ kunci = "lentera", id = 2088045208, nama = "Lentera Malam", ket = "Cahaya hangat di sekitarmu." },
}
local PRODUK = {
	{ kunci = "bata1", id = 3731308400, nama = "1 Bata", ket = "Pasang 1 bata atas namamu di Tembok Pendukung.", bata = 1 },
	{ kunci = "bata5", id = 3731308805, nama = "5 Bata", ket = "Pasang 5 bata sekaligus.", bata = 5 },
	{ kunci = "kembang", id = 3731309069, nama = "Kembang Api", ket = "Nyalakan kembang api yang terlihat semua warga." },
}

local Players = game:GetService("Players")
local MarketplaceService = game:GetService("MarketplaceService")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
local BERAT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)
local GELAP = Color3.fromRGB(29, 29, 34)
local KUNING = Color3.fromRGB(255, 196, 37)
local BATA = Color3.fromRGB(196, 86, 52)

local store, top
pcall(function()
	store = DataStoreService:GetDataStore("DuniaKotak_Dukung_v1")
	top = DataStoreService:GetOrderedDataStore("DuniaKotak_DukungTop")
end)

for _, n in ipairs({ "DK_Dukung", "DK_DukungBuka" }) do
	local l = ReplicatedStorage:FindFirstChild(n)
	if l then l:Destroy() end
end
local pintu = Instance.new("RemoteFunction")
pintu.Name = "DK_Dukung"
pintu.Parent = ReplicatedStorage
local buka = Instance.new("RemoteEvent")
buka.Name = "DK_DukungBuka"
buka.Parent = ReplicatedStorage

local sesi = {} -- [player] = { bata, punya = { [kunci pass] = true }, struk }

-- ---------- gelar di atas kepala ----------
local function gelar(player)
	local s = sesi[player]
	local kepala = player.Character and player.Character:FindFirstChild("Head")
	if not s or not kepala then return end
	local l = kepala:FindFirstChild("DK_Gelar")
	if l then l:Destroy() end
	local akarTokoh = player.Character:FindFirstChild("HumanoidRootPart")
	if akarTokoh then
		for _, n in ipairs({ "DK_Jejak", "DK_Lentera" }) do
			local x = akarTokoh:FindFirstChild(n)
			if x then x:Destroy() end
		end
		if s.punya.jejak then
			local e = Instance.new("ParticleEmitter")
			e.Name = "DK_Jejak"
			e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
			e.Rate = 7
			e.Lifetime = NumberRange.new(0.7, 1.2)
			e.Speed = NumberRange.new(0.5, 1.5)
			e.SpreadAngle = Vector2.new(180, 180)
			e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 0) })
			e.Color = ColorSequence.new(KUNING)
			e.LightEmission = 0.8
			e.Parent = akarTokoh
		end
		if s.punya.lentera then
			local c = Instance.new("PointLight")
			c.Name = "DK_Lentera"
			c.Color = Color3.fromRGB(255, 214, 140)
			c.Range = 18
			c.Brightness = 1.2
			c.Parent = akarTokoh
		end
	end
	local baris = {}
	if s.punya.pendukung then table.insert(baris, "Pendukung Desa") end
	if s.bata > 0 then table.insert(baris, s.bata .. " bata") end
	if player.MembershipType == Enum.MembershipType.Premium then table.insert(baris, "Premium") end
	if #baris == 0 then
		if not s.punya.pelangi then return end
		table.insert(baris, "Warga Dunia Kotak")
	end
	local b = Instance.new("BillboardGui")
	b.Name = "DK_Gelar"
	b.Size = UDim2.fromOffset(220, 22)
	b.StudsOffset = Vector3.new(0, 2.6, 0)
	b.MaxDistance = 90
	b.LightInfluence = 0
	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundTransparency = 1
	t.FontFace = BERAT
	t.TextSize = 15
	t.TextColor3 = (s.punya.pendukung and not s.punya.pelangi) and KUNING or Color3.new(1, 1, 1)
	if s.punya.pelangi then
		local g = Instance.new("UIGradient")
		g.Color = ColorSequence.new({
			ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 90, 90)), ColorSequenceKeypoint.new(0.25, Color3.fromRGB(255, 200, 60)),
			ColorSequenceKeypoint.new(0.5, Color3.fromRGB(90, 220, 120)), ColorSequenceKeypoint.new(0.75, Color3.fromRGB(80, 170, 255)),
			ColorSequenceKeypoint.new(1, Color3.fromRGB(200, 110, 255)) })
		g.Parent = t
	end
	t.TextStrokeTransparency = 0.3
	t.Text = table.concat(baris, "  ·  ")
	t.Parent = b
	b.Parent = kepala
end

local function punyaPass(player, id)
	if id == 0 then return false end
	local ok, punya = pcall(function() return MarketplaceService:UserOwnsGamePassAsync(player.UserId, id) end)
	return ok and punya or false
end

local function muat(player)
	local s = { bata = 0, punya = {}, struk = {}, termuat = false }
	sesi[player] = s
	if store then
		local ok, d = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
		if ok then
			s.termuat = true
			if typeof(d) == "table" then
				s.bata = math.max(0, math.floor(tonumber(d.bata) or 0))
				s.struk = typeof(d.struk) == "table" and d.struk or {}
			end
		end
	end
	for _, p in ipairs(PASS) do s.punya[p.kunci] = punyaPass(player, p.id) end
	gelar(player)
end

Players.PlayerAdded:Connect(function(p)
	p.CharacterAdded:Connect(function() task.wait(1) gelar(p) end)
	task.spawn(muat, p)
end)
for _, p in ipairs(Players:GetPlayers()) do
	p.CharacterAdded:Connect(function() task.wait(1) gelar(p) end)
	task.spawn(muat, p)
end
Players.PlayerRemoving:Connect(function(p) sesi[p] = nil end)

-- ---------- Tembok Pendukung dan Kotak Dukungan ----------
local tTembok
local function tulisTembok()
	if not tTembok or not top then return end
	local ok, hal = pcall(function() return top:GetSortedAsync(false, 10) end)
	if not ok then return end
	local baris = {}
	for i, e in ipairs(hal:GetCurrentPage()) do
		local id = tonumber((tostring(e.key):gsub("^p_", "")))
		local nama = "warga"
		if id then pcall(function() nama = Players:GetNameFromUserIdAsync(id) end) end
		table.insert(baris, i .. ". " .. nama .. "  ·  " .. e.value .. " bata")
	end
	tTembok.Text = #baris > 0 and table.concat(baris, "\n") or "Belum ada bata. Jadilah yang pertama!"
end

do
	local lama = workspace:FindFirstChild("DK_DukungDesa")
	if lama then lama:Destroy() end
	local akar = workspace:FindFirstChild("DuniaKotak3")
	local muncul = akar and akar:FindFirstChild("TitikMuncul")
	if muncul then
		local pusat = muncul:GetPivot().Position
		local rp = RaycastParams.new()
		rp.FilterType = Enum.RaycastFilterType.Include
		rp.FilterDescendantsInstances = { akar }
		-- di rumput tepi jalan setapak, di antara tiang Papan Desa dan papan nama Warung Raka, menghadap jalan (+Z)
		local letak = pusat + Vector3.new(-15.5, 0, -13)
		local r = workspace:Raycast(letak + Vector3.new(0, 40, 0), Vector3.new(0, -120, 0), rp)
		local tanah = r and r.Position.Y or pusat.Y - 3
		local dasar = CFrame.new(letak.X, tanah, letak.Z) * CFrame.Angles(0, math.rad(180), 0)
		local model = Instance.new("Model")
		model.Name = "DK_DukungDesa"
		local function balok(ukuran, cf, warna)
			local p = Instance.new("Part")
			p.Anchored = true
			p.Size = ukuran
			p.CFrame = cf
			p.Color = warna
			p.Material = Enum.Material.SmoothPlastic
			p.TopSurface = Enum.SurfaceType.Smooth
			p.BottomSurface = Enum.SurfaceType.Smooth
			p.Parent = model
			return p
		end
		-- tembok bata
		local tembok = balok(Vector3.new(8, 7, 1), dasar * CFrame.new(0, 3.5, 0), BATA)
		for i = 0, 3 do
			balok(Vector3.new(8.1, 0.12, 1.05), dasar * CFrame.new(0, 1.4 + i * 1.4, 0), Color3.fromRGB(230, 220, 205))
		end
		local sg = Instance.new("SurfaceGui")
		sg.Face = Enum.NormalId.Front
		sg.CanvasSize = Vector2.new(400, 350)
		sg.LightInfluence = 0
		sg.Parent = tembok
		local j = Instance.new("TextLabel")
		j.BackgroundTransparency = 1
		j.Position = UDim2.fromOffset(16, 10)
		j.Size = UDim2.fromOffset(368, 34)
		j.FontFace = BERAT
		j.TextSize = 26
		j.TextColor3 = KUNING
		j.TextStrokeTransparency = 0.4
		j.TextXAlignment = Enum.TextXAlignment.Left
		j.Text = "TEMBOK PENDUKUNG"
		j.Parent = sg
		tTembok = Instance.new("TextLabel")
		tTembok.BackgroundTransparency = 1
		tTembok.Position = UDim2.fromOffset(16, 50)
		tTembok.Size = UDim2.fromOffset(368, 292)
		tTembok.FontFace = TEBAL
		tTembok.TextSize = 22
		tTembok.TextColor3 = Color3.new(1, 1, 1)
		tTembok.TextStrokeTransparency = 0.5
		tTembok.TextXAlignment = Enum.TextXAlignment.Left
		tTembok.TextYAlignment = Enum.TextYAlignment.Top
		tTembok.Text = "Memuat…"
		tTembok.Parent = sg
		-- kotak dukungan di depan tembok
		local kotak = balok(Vector3.new(3, 3, 3), dasar * CFrame.new(0, 1.5, -4), KUNING)
		balok(Vector3.new(1.8, 0.2, 0.5), dasar * CFrame.new(0, 3.05, -4), GELAP)
		local pr = Instance.new("ProximityPrompt")
		pr.ObjectText = "Kotak Dukungan"
		pr.ActionText = "Dukung Desa"
		pr.MaxActivationDistance = 12
		pr.RequiresLineOfSight = false
		pr.Parent = kotak
		pr.Triggered:Connect(function(player) buka:FireClient(player) end)
		model.Parent = workspace
		task.spawn(function()
			while true do
				tulisTembok()
				task.wait(300)
			end
		end)
	else
		warn("[DukungDesa] TitikMuncul belum ada di map; Kotak Dukungan tidak dipasang")
	end
end

pintu.OnServerInvoke = function(player)
	local s = sesi[player]
	local daftar = {}
	for _, p in ipairs(PASS) do
		table.insert(daftar, { jenis = "pass", id = p.id, nama = p.nama, ket = p.ket, punya = s and s.punya[p.kunci] or false })
	end
	for _, p in ipairs(PRODUK) do
		table.insert(daftar, { jenis = "produk", id = p.id, nama = p.nama, ket = p.ket })
	end
	return { daftar = daftar, bata = s and s.bata or 0 }
end

local function kembangApi(player)
	local akarTokoh = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if not akarTokoh then return end
	local pusat = akarTokoh.Position
	task.spawn(function()
		for i = 1, 6 do
			local p = Instance.new("Part")
			p.Anchored = true
			p.CanCollide = false
			p.CanQuery = false
			p.CanTouch = false
			p.Transparency = 1
			p.Size = Vector3.new(1, 1, 1)
			p.Position = pusat + Vector3.new(math.random(-14, 14), math.random(26, 40), math.random(-14, 14))
			local e = Instance.new("ParticleEmitter")
			e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
			e.Rate = 0
			e.Lifetime = NumberRange.new(1, 1.8)
			e.Speed = NumberRange.new(14, 26)
			e.SpreadAngle = Vector2.new(180, 180)
			e.Drag = 2
			e.Acceleration = Vector3.new(0, -12, 0)
			e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.4), NumberSequenceKeypoint.new(1, 0) })
			e.Color = ColorSequence.new(Color3.fromHSV(math.random(), 0.75, 1))
			e.LightEmission = 1
			e.Parent = p
			p.Parent = workspace
			e:Emit(70)
			game:GetService("Debris"):AddItem(p, 3)
			task.wait(0.45)
		end
	end)
end

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, id, dibeli)
	if not dibeli or id == 0 then return end
	local s = sesi[player]
	for _, p in ipairs(PASS) do
		if p.id == id and s then
			s.punya[p.kunci] = true
			gelar(player)
			buka:FireClient(player, "Terima kasih! " .. p.nama .. " sudah aktif.")
		end
	end
end)

-- pembelian produk: bata dicatat dulu ke DataStore, baru dinyatakan selesai (struk yang sama tidak dihitung dua kali)
MarketplaceService.ProcessReceipt = function(struk)
	local barang
	for _, p in ipairs(PRODUK) do
		if p.id ~= 0 and p.id == struk.ProductId then barang = p end
	end
	if not barang then return Enum.ProductPurchaseDecision.NotProcessedYet end
	local player = Players:GetPlayerByUserId(struk.PlayerId)
	if not barang.bata then
		-- kembang api: hanya bisa diberikan kalau pembelinya masih di server ini
		if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end
		kembangApi(player)
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end
	if not store then return Enum.ProductPurchaseDecision.NotProcessedYet end
	local jumlah
	local ok = pcall(function()
		store:UpdateAsync("p_" .. struk.PlayerId, function(d)
			d = typeof(d) == "table" and d or { bata = 0, struk = {} }
			d.struk = typeof(d.struk) == "table" and d.struk or {}
			if not table.find(d.struk, struk.PurchaseId) then
				d.bata = (tonumber(d.bata) or 0) + barang.bata
				table.insert(d.struk, struk.PurchaseId)
				while #d.struk > 30 do table.remove(d.struk, 1) end
			end
			jumlah = d.bata
			return d
		end)
	end)
	if not ok or not jumlah then return Enum.ProductPurchaseDecision.NotProcessedYet end
	if top then pcall(function() top:SetAsync("p_" .. struk.PlayerId, jumlah) end) end
	if player and sesi[player] then
		sesi[player].bata = jumlah
		gelar(player)
		buka:FireClient(player, "Terima kasih! Sekarang batamu ada " .. jumlah .. ".")
	end
	task.spawn(tulisTembok)
	return Enum.ProductPurchaseDecision.PurchaseGranted
end
