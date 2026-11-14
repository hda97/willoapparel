--[[
  DukungDesa (Script, ServerScriptService.DukungDesa) - dukungan pakai Robux untuk Dunia Kotak. Semuanya hanya hiasan:
  tidak menjual koin, tidak membuat pemain lebih cepat maju, dan tidak ada tautan pembayaran di luar Roblox.

    1. Game Pass "Pendukung Desa" (sekali beli): gelar emas "Pendukung Desa" di atas kepala.
    2. Developer Product "1 Bata" (bisa dibeli berulang): hitungan bata di gelar dan nama di Tembok Pendukung.
    3. Pemain Roblox Premium: tanda kecil "Premium" di gelar (penghasilan Premium Payouts dihitung Roblox sendiri).

  CARA MENYALAKAN: buat pass dan produk di Creator Dashboard, lalu isi nomornya di ID_PASS dan ID_BATA di bawah.
  Selama nomornya 0, bagian itu tampil "Segera hadir" dan tidak ada yang bisa dibeli.

  Kotak Dukungan dan Tembok Pendukung berdiri di dekat titik muncul Kotak Wetan.
  Data: DataStore "DuniaKotak_Dukung_v1" kunci "p_<UserId>" = { bata, struk = { id pembelian terakhir } };
  OrderedDataStore "DuniaKotak_DukungTop" = jumlah bata tiap pemain. Pasangannya: StarterPlayerScripts.DukungDesa.
]]

local ID_PASS = 0 -- nomor Game Pass "Pendukung Desa"
local ID_BATA = 0 -- nomor Developer Product "1 Bata"

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

local sesi = {} -- [player] = { bata, pass, termuat }

-- ---------- gelar di atas kepala ----------
local function gelar(player)
	local s = sesi[player]
	local kepala = player.Character and player.Character:FindFirstChild("Head")
	if not s or not kepala then return end
	local l = kepala:FindFirstChild("DK_Gelar")
	if l then l:Destroy() end
	local baris = {}
	if s.pass then table.insert(baris, "Pendukung Desa") end
	if s.bata > 0 then table.insert(baris, s.bata .. " bata") end
	if player.MembershipType == Enum.MembershipType.Premium then table.insert(baris, "Premium") end
	if #baris == 0 then return end
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
	t.TextColor3 = s.pass and KUNING or Color3.new(1, 1, 1)
	t.TextStrokeTransparency = 0.3
	t.Text = table.concat(baris, "  ·  ")
	t.Parent = b
	b.Parent = kepala
end

local function punyaPass(player)
	if ID_PASS == 0 then return false end
	local ok, punya = pcall(function() return MarketplaceService:UserOwnsGamePassAsync(player.UserId, ID_PASS) end)
	return ok and punya or false
end

local function muat(player)
	local s = { bata = 0, pass = false, struk = {}, termuat = false }
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
	s.pass = punyaPass(player)
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
		local letak = pusat + Vector3.new(-22, 0, -20)
		local r = workspace:Raycast(letak + Vector3.new(0, 40, 0), Vector3.new(0, -120, 0), rp)
		local tanah = r and r.Position.Y or pusat.Y - 3
		local dasar = CFrame.new(letak.X, tanah, letak.Z) * CFrame.Angles(0, math.rad(-90), 0) -- menghadap titik muncul (+X)
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
		local tembok = balok(Vector3.new(12, 8, 1), dasar * CFrame.new(0, 4, 0), BATA)
		for i = 0, 3 do
			balok(Vector3.new(12.1, 0.12, 1.05), dasar * CFrame.new(0, 1.6 + i * 1.6, 0), Color3.fromRGB(230, 220, 205))
		end
		local sg = Instance.new("SurfaceGui")
		sg.Face = Enum.NormalId.Front
		sg.CanvasSize = Vector2.new(480, 320)
		sg.LightInfluence = 0
		sg.Parent = tembok
		local j = Instance.new("TextLabel")
		j.BackgroundTransparency = 1
		j.Position = UDim2.fromOffset(16, 10)
		j.Size = UDim2.fromOffset(448, 34)
		j.FontFace = BERAT
		j.TextSize = 28
		j.TextColor3 = KUNING
		j.TextStrokeTransparency = 0.4
		j.TextXAlignment = Enum.TextXAlignment.Left
		j.Text = "TEMBOK PENDUKUNG"
		j.Parent = sg
		tTembok = Instance.new("TextLabel")
		tTembok.BackgroundTransparency = 1
		tTembok.Position = UDim2.fromOffset(16, 50)
		tTembok.Size = UDim2.fromOffset(448, 262)
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
	return { idPass = ID_PASS, idBata = ID_BATA, pass = s and s.pass or false, bata = s and s.bata or 0,
		premium = player.MembershipType == Enum.MembershipType.Premium }
end

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, id, dibeli)
	if id ~= ID_PASS or not dibeli then return end
	local s = sesi[player]
	if s then
		s.pass = true
		gelar(player)
		buka:FireClient(player, "Terima kasih! Kamu sekarang Pendukung Desa.")
	end
end)

-- pembelian "1 Bata": dicatat dulu ke DataStore, baru dinyatakan selesai (struk yang sama tidak dihitung dua kali)
MarketplaceService.ProcessReceipt = function(struk)
	if ID_BATA == 0 or struk.ProductId ~= ID_BATA then return Enum.ProductPurchaseDecision.NotProcessedYet end
	if not store then return Enum.ProductPurchaseDecision.NotProcessedYet end
	local jumlah
	local ok = pcall(function()
		store:UpdateAsync("p_" .. struk.PlayerId, function(d)
			d = typeof(d) == "table" and d or { bata = 0, struk = {} }
			d.struk = typeof(d.struk) == "table" and d.struk or {}
			if not table.find(d.struk, struk.PurchaseId) then
				d.bata = (tonumber(d.bata) or 0) + 1
				table.insert(d.struk, struk.PurchaseId)
				while #d.struk > 30 do table.remove(d.struk, 1) end
			end
			jumlah = d.bata
			return d
		end)
	end)
	if not ok or not jumlah then return Enum.ProductPurchaseDecision.NotProcessedYet end
	if top then pcall(function() top:SetAsync("p_" .. struk.PlayerId, jumlah) end) end
	local player = Players:GetPlayerByUserId(struk.PlayerId)
	if player and sesi[player] then
		sesi[player].bata = jumlah
		gelar(player)
		buka:FireClient(player, "Terima kasih! Batamu yang ke-" .. jumlah .. " sudah terpasang.")
	end
	task.spawn(tulisTembok)
	return Enum.ProductPurchaseDecision.PurchaseGranted
end
