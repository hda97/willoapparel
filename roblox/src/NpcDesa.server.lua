--[[
  NpcDesa (Script) - NPC warga desa yang hidup, seperti js/npc.js dan js/wargaNpc.js di game web.
  Tempat: ServerScriptService.NpcDesa. Butuh AvatarKotak (ServerStorage.DK_RakitTokoh) dan GerakKotak di klien.

  Dulu NPC di peta Roblox hanya "patung": tokoh web yang ikut terpotret beku waktu peta diekspor (tanpa wajah, tidak bergerak).
  Patung itu sudah dibuang oleh roblox/alat/bersih_patung.lua, dan letak serta warnanya dicatat di ServerStorage.DK_TitikNPC.
  Skrip ini memunculkan:
    - NPC JAGA di tiap titik patung lama: tokoh kotak lengkap (wajah, rambut, baju sama warnanya dengan patung), berdiri,
      sesekali menoleh ke kiri-kanan;
    - NPC KELILING di tiap dusun (tukang pos, penjual jamu, tukang bakso, penjahit, dari daftar game web): berjalan di tepi jalan,
      belok acak di simpang, berhenti sebentar sesekali.
  Semua NPC berlabel "NPC" + nama + peran, dan bisa diajak ngobrol (tombol E / ketuk): muncul gelembung kalimat sapaan.
  NPC tidak memakai nama warga asli dan tidak dihitung sebagai pemain.
]]
local Players = game:GetService("Players")
local ServerStorage = game:GetService("ServerStorage")

local SK = 1.25
local FONT = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)

-- jaringan jalan tiap dusun (sama dengan LaluLintas.client.lua), satuan web
local JALAN = {
	wetan = { g = Vector3.new(0, 0, 0), xs = { -195, -65, 65, 195 }, zs = { -840, -720, -600, -480, -360, -240, -120, 0, 120, 240, 360, 480, 600, 720, 840 }, naik = { 1, 1, 1, 1 }, ty = 0.05 },
	kulon = { g = Vector3.new(-10000, 0, 0), xs = { -650, -302.5, 0, 302.5, 650 }, zs = { 2.5, -127.5, -257.5, -387.5, -517.5, -647.5, -777.5, -907.5, -1037.5, -1167.5 }, naik = { 1, 0, 0, 0, 1 },
		ty = { { 0.85, 0.8, 0.8, 0.8, 0.85 }, { 13.75, 13, 13, 13, 13.75 }, { 26.75, 26, 26, 26, 26.75 }, { 39.75, 39, 39, 39, 39.75 }, { 52.75, 52, 52, 52, 52.75 },
			{ 65.75, 65, 65, 65, 65.75 }, { 78.75, 78, 78, 78, 78.75 }, { 91.75, 91, 91, 91, 91.75 }, { 104.75, 104, 104, 104, 104.75 }, { 117.75, 117, 117.8, 117, 117.75 } } },
	curug = { g = Vector3.new(0, 0, -10000), xs = { -640, -302.5, 0, 302.5, 640 }, zs = { 83.75, 0, -195, -390, -585, -780 }, naik = { 0, 0, 0, 0, 0 },
		ty = { { 0.8, 0.8, 0.8, 1.77, 0.8 }, { 0.8, 0.8, 0.8, 0.8, 0.8 }, { 30.8, 30, 30, 30, 30.8 }, { 60.8, 60, 60, 60, 60.8 }, { 90.8, 90, 90, 90, 90.8 }, { 120.8, 120, 120, 120, 120 } } },
	tlaga = { g = Vector3.new(0, 0, 10000), xs = { -700, -330, 0, 330, 700 }, zs = { 0, -200, -400, -1000, -1200 }, naik = { 1, 0, 0, 0, 1 },
		ty = { { 0.8, 0.8, 0.8, 0.8, 0.8 }, { 0.8, 0.8, 0.8, 0.8, 0.8 }, { 0.8, 0.8, 0.8, 0.8, 0.8 }, { 0.8, 0.8, 2.5, 0.8, 0.8 }, { 0.8, 0.8, 2.5, 0.8, 0.8 } } },
}

-- NPC keliling: penampilan dan kalimat disalin dari DATA js/npc.js (kerja = 'jalan')
local KELILING = {
	{ nama = "Mas Bayu", peran = "Tukang pos", cepat = 1.4,
		a = { jenis = "L", kulit = "#e0aa7e", rambut = { gaya = "belah", warna = "#0b0b0e" }, atasan = { jenis = "seragam", warna = "#f2c14e" }, bawahan = { jenis = "celana", warna = "#2f3a52" } },
		sapa = { "Pos! Pos!", "Permisi, numpang lewat!", "Ada surat buat kamu? Belum, he he", "Cari alamat. Untung tiap rumah ada batu nama di depannya." } },
	{ nama = "Bu Ani", peran = "Penjual jamu", cepat = 0.9,
		a = { jenis = "P", kulit = "#c98c5e", rambut = { gaya = "kepang", warna = "#0b0b0e" }, atasan = { jenis = "batik", warna = "#2a9a5a" }, bawahan = { jenis = "rok-panjang", warna = "#6a5a48" } },
		sapa = { "Jamu, jamu!", "Kunyit asam segar!", "Biar sehat, Nak", "Jamunya tinggal sedikit, laris hari ini!" } },
	{ nama = "Kang Ujang", peran = "Tukang bakso", cepat = 0.7,
		a = { jenis = "L", kulit = "#e0aa7e", rambut = { gaya = "keriting", warna = "#3a2416" }, atasan = { jenis = "kaos", warna = "#f4f4f4" }, bawahan = { jenis = "celana", warna = "#3a5a3a" } },
		sapa = { "Tok tok tok! Bakso!", "Baksonya anget!", "Sore-sore enaknya makan bakso, kan?" } },
	{ nama = "Mbak Wati", peran = "Penjahit", cepat = 1,
		a = { jenis = "P", kulit = "#e0aa7e", rambut = { gaya = "panjang", warna = "#6a4026" }, atasan = { jenis = "kaos-willo", warna = "#1d1d22" }, bawahan = { jenis = "celana", warna = "#2f3a52" } },
		sapa = { "Halo!", "Bajumu keren!", "Mau dijahitkan apa?", "Kaos ini? Sablon Willo, bagus kan!" } },
	{ nama = "Pak Slamet", peran = "Ronda", cepat = 0.8,
		a = { jenis = "L", kulit = "#a86e44", rambut = { gaya = "cepak", warna = "#0b0b0e" }, atasan = { jenis = "jaket", warna = "#2f3a52" }, bawahan = { jenis = "sarung", warna = "#3a5a3a" } },
		sapa = { "Siskamling!", "Aman, aman!", "Jangan lupa kunci pintu" } },
}
local PER_DUSUN = { wetan = 4, kulon = 3, curug = 3, tlaga = 3 }

-- NPC jaga (di titik patung lama): nama dan kalimat umum warga desa
local NAMA_L = { "Pak Darto", "Pak Joko", "Mas Dodi", "Mas Fajar", "Pak Harto", "Mas Yoga", "Pak Bambang", "Mas Tono", "Pak Udin", "Mbah Karto", "Rizky", "Andi", "Pak Darno", "Mas Eko", "Pak Sugeng" }
local NAMA_P = { "Bu Siti", "Bu Rina", "Mbak Lina", "Mbak Wulan", "Bu Mirna", "Mbak Nia", "Suster Dewi", "Bu Nah", "Mbak Sri", "Bu Tini", "Mbak Ayu", "Bu Yanti", "Mbak Rara", "Bu Endah" }
local SAPA_UMUM = {
	"Halo! Main ke sini juga?", "Selamat datang di desa!", "Dusun ini makin ramai ya.", "Sudah ikut voting fasum minggu ini?",
	"Jangan lupa panen di kebun, ya.", "Mampir, mampir!", "Hati-hati di jalan!", "Cuaca bagus buat jalan-jalan.",
	"Kalau capek, naik bus saja.", "Fasum ini hasil voting warga, lho!", "Rumahmu sudah dihias belum?", "He he, lagi santai.",
}
local GAYA_L = { "belah", "cepak", "acak", "keriting" }
local GAYA_P = { "panjang", "bob", "kuncir", "kepang" }

local biji = 29
local function acak()
	biji = (biji * 16807) % 2147483647
	return (biji - 1) / 2147483646
end
local function pilih(a) return a[math.floor(acak() * #a) + 1] end

local rakitTokoh = ServerStorage:WaitForChild("DK_RakitTokoh", 30)
if not rakitTokoh then warn("[NpcDesa] AvatarKotak (DK_RakitTokoh) tidak ada, NPC tidak dibuat") return end

local folder = workspace:FindFirstChild("DK_NPC")
if folder then folder:Destroy() end
folder = Instance.new("Folder")
folder.Name = "DK_NPC"
folder.Parent = workspace

local function rgbHex(h)
	local ok, c = pcall(Color3.fromHex, h)
	return ok and c or Color3.new(1, 1, 1)
end

-- label kecil di atas kepala: [NPC] Nama · peran
local function label(model, nama, peran)
	local head = model:FindFirstChild("Head")
	local g = Instance.new("BillboardGui")
	g.Name = "LabelNPC"
	g.Size = UDim2.fromOffset(220, 26)
	g.StudsOffsetWorldSpace = Vector3.new(0, 3.4, 0)
	g.MaxDistance = 70
	g.LightInfluence = 0
	g.AlwaysOnTop = false
	local f = Instance.new("Frame")
	f.AnchorPoint = Vector2.new(0.5, 0.5)
	f.Position = UDim2.fromScale(0.5, 0.5)
	f.AutomaticSize = Enum.AutomaticSize.X
	f.Size = UDim2.fromOffset(0, 22)
	f.BackgroundColor3 = Color3.fromRGB(29, 29, 34)
	f.BackgroundTransparency = 0.25
	Instance.new("UICorner", f).CornerRadius = UDim.new(0, 11)
	local pad = Instance.new("UIPadding", f)
	pad.PaddingLeft, pad.PaddingRight = UDim.new(0, 8), UDim.new(0, 8)
	local t = Instance.new("TextLabel")
	t.BackgroundTransparency = 1
	t.AutomaticSize = Enum.AutomaticSize.X
	t.Size = UDim2.fromScale(0, 1)
	t.FontFace = FONT
	t.TextSize = 13
	t.TextColor3 = Color3.new(1, 1, 1)
	t.RichText = true
	t.Text = '<font color="#f2c14e">NPC</font>  ' .. nama .. ' <font color="#b8bcc6">· ' .. peran .. "</font>"
	t.Parent = f
	f.Parent = g
	g.Adornee = head
	g.Parent = head
end

local function gelembung(model, teks)
	local head = model:FindFirstChild("Head")
	if not head then return end
	local lama = head:FindFirstChild("Gelembung")
	if lama then lama:Destroy() end
	local g = Instance.new("BillboardGui")
	g.Name = "Gelembung"
	g.Size = UDim2.fromOffset(240, 60)
	g.StudsOffsetWorldSpace = Vector3.new(0, 6, 0)
	g.MaxDistance = 60
	g.LightInfluence = 0
	local t = Instance.new("TextLabel")
	t.AnchorPoint = Vector2.new(0.5, 1)
	t.Position = UDim2.fromScale(0.5, 1)
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundColor3 = Color3.new(1, 1, 1)
	t.TextColor3 = Color3.fromRGB(29, 29, 34)
	t.FontFace = FONT
	t.TextSize = 14
	t.TextWrapped = true
	t.Text = teks
	Instance.new("UICorner", t).CornerRadius = UDim.new(0, 10)
	local pad = Instance.new("UIPadding", t)
	pad.PaddingLeft, pad.PaddingRight = UDim.new(0, 8), UDim.new(0, 8)
	t.Parent = g
	g.Adornee = head
	g.Parent = head
	task.delay(4.5, function() if g.Parent then g:Destroy() end end)
end

local function obrolan(model, nama, sapa)
	local hrp = model:FindFirstChild("HumanoidRootPart")
	local pp = Instance.new("ProximityPrompt")
	pp.ActionText = "Ngobrol"
	pp.ObjectText = nama
	pp.KeyboardKeyCode = Enum.KeyCode.E
	pp.MaxActivationDistance = 9
	pp.RequiresLineOfSight = false
	pp.Parent = hrp
	local kini = 0
	pp.Triggered:Connect(function(player)
		if os.clock() - kini < 1.5 then return end
		kini = os.clock()
		gelembung(model, sapa[math.random(1, #sapa)])
		-- menoleh ke pemain yang mengajak ngobrol
		local ph = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
		if ph and hrp.Anchored then
			local p = hrp.Position
			hrp.CFrame = CFrame.lookAt(p, Vector3.new(ph.Position.X, p.Y, ph.Position.Z))
		end
	end)
end

-- rangka R15 polos + tokoh kotak
local function buatNpc(nama, av, cf)
	local ok, model = pcall(function()
		return Players:CreateHumanoidModelFromDescription(Instance.new("HumanoidDescription"), Enum.HumanoidRigType.R15)
	end)
	if not ok or not model then warn("[NpcDesa] rangka gagal: " .. tostring(model)) return nil end
	model.Name = nama
	local hum = model:FindFirstChildOfClass("Humanoid")
	hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	hum.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff
	hum.BreakJointsOnDeath = false
	hum:SetStateEnabled(Enum.HumanoidStateType.Dead, false)
	local animate = model:FindFirstChild("Animate")
	if animate then animate:Destroy() end
	local hrp = model:FindFirstChild("HumanoidRootPart")
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then p.CanCollide = p == hrp end
	end
	model:PivotTo(cf * CFrame.new(0, hum.HipHeight + hrp.Size.Y / 2, 0))
	model:SetAttribute("DK_NPC", true)
	model.Parent = folder
	rakitTokoh:Invoke(model, av)
	-- balok tokoh tidak ikut bertabrakan (hanya rangka yang menapak)
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") and p ~= hrp then p.CanCollide = false p.CanQuery = false p.CanTouch = false end
	end
	return model, hum, hrp
end

local jumlah = 0

-- ---------- NPC jaga di titik patung lama ----------
local titik = ServerStorage:FindFirstChild("DK_TitikNPC")
if titik then
	local iL, iP = 0, 0
	for _, t in ipairs(titik:GetChildren()) do
		if not t:IsA("BasePart") then continue end
		local jenis = acak() < 0.5 and "P" or "L"
		local nama
		if jenis == "L" then iL += 1 nama = NAMA_L[(iL - 1) % #NAMA_L + 1] else iP += 1 nama = NAMA_P[(iP - 1) % #NAMA_P + 1] end
		local warnaRambut = t:GetAttribute("rambut") or "#0b0b0e"
		local av = {
			jenis = jenis, kulit = t:GetAttribute("kulit"),
			rambut = { gaya = pilih(jenis == "L" and GAYA_L or GAYA_P), warna = warnaRambut },
			atasan = { jenis = pilih({ "kaos", "kemeja", "batik", "kaos-willo" }), warna = t:GetAttribute("atasan") },
			bawahan = { jenis = "celana", warna = t:GetAttribute("bawahan") },
		}
		local cf = CFrame.new(t.Position) * CFrame.Angles(0, acak() * math.pi * 2, 0)
		local model, hum, hrp = buatNpc(nama, av, cf)
		if model then
			hrp.Anchored = true
			label(model, nama, "Warga")
			obrolan(model, nama, SAPA_UMUM)
			jumlah += 1
			-- sesekali menoleh
			local arah0 = hrp.CFrame
			task.spawn(function()
				while model.Parent do
					task.wait(5 + acak() * 7)
					if not model.Parent then break end
					local p = hrp.Position
					local _, ry = arah0:ToOrientation()
					hrp.CFrame = CFrame.new(p) * CFrame.Angles(0, ry + (acak() - 0.5) * 1.6, 0)
				end
			end)
		end
	end
else
	warn("[NpcDesa] ServerStorage.DK_TitikNPC tidak ada (jalankan roblox/alat/bersih_patung.lua)")
end

-- ---------- NPC keliling ----------
local rp = RaycastParams.new()
rp.FilterType = Enum.RaycastFilterType.Exclude
rp.FilterDescendantsInstances = { folder }

local function graf(J)
	local G = { X = {}, Z = {}, NI = #J.xs, NJ = #J.zs, tet = {} }
	for i, x in ipairs(J.xs) do G.X[i] = x * SK + J.g.X end
	for j, z in ipairs(J.zs) do G.Z[j] = z * SK + J.g.Z end
	local function id(i, j) return (j - 1) * G.NI + i end
	for k = 1, G.NI * G.NJ do G.tet[k] = {} end
	for j = 1, G.NJ do
		for i = 1, G.NI do
			if i < G.NI then
				table.insert(G.tet[id(i, j)], id(i + 1, j))
				table.insert(G.tet[id(i + 1, j)], id(i, j))
			end
			if j < G.NJ and J.naik[i] == 1 then
				table.insert(G.tet[id(i, j)], id(i, j + 1))
				table.insert(G.tet[id(i, j + 1)], id(i, j))
			end
		end
	end
	G.pos = function(k)
		local i, j = (k - 1) % G.NI + 1, math.floor((k - 1) / G.NI) + 1
		local y = typeof(J.ty) == "number" and J.ty or J.ty[j][i]
		return Vector3.new(G.X[i], y * SK, G.Z[j])
	end
	return G
end

local function tanah(p)
	local r = workspace:Raycast(p + Vector3.new(0, 12, 0), Vector3.new(0, -30, 0), rp)
	return r and r.Position or p
end

local ke = 0
for _, nama in ipairs({ "wetan", "kulon", "curug", "tlaga" }) do
	local J = JALAN[nama]
	local F = workspace:FindFirstChild("DuniaKotak3") and workspace.DuniaKotak3:FindFirstChild(nama)
	if not F then continue end
	local G = graf(J)
	local nTitik = G.NI * G.NJ
	for q = 1, PER_DUSUN[nama] do
		ke += 1
		local d = KELILING[(ke - 1) % #KELILING + 1]
		local a = math.floor(acak() * nTitik) + 1
		if #G.tet[a] == 0 then a = 1 end
		local b = pilih(G.tet[a])
		local sisi = acak() < 0.5 and 1 or -1 -- jalan di trotoar kiri atau kanan
		local LAJUR = 6.2
		local function titikJalan(k1, k2, u)
			local A, B = G.pos(k1), G.pos(k2)
			local dir = (B - A)
			dir = Vector3.new(dir.X, 0, dir.Z).Unit
			local n = Vector3.new(dir.Z, 0, -dir.X) * LAJUR * sisi
			return A:Lerp(B, u) + n
		end
		local mulai = tanah(titikJalan(a, b, acak()))
		local model, hum, hrp = buatNpc(d.nama, d.a, CFrame.new(mulai))
		if not model then continue end
		label(model, d.nama, d.peran)
		obrolan(model, d.nama, d.sapa)
		hum.WalkSpeed = 7 * d.cepat
		hum.AutoRotate = true
		pcall(function() hrp:SetNetworkOwner(nil) end)
		jumlah += 1
		task.spawn(function()
			while model.Parent do
				-- jalan ke ujung ruas (simpang), di trotoar
				local tuju = tanah(titikJalan(a, b, 1) + (G.pos(b) - G.pos(a)).Unit * LAJUR * 0.0)
				hum:MoveTo(tuju)
				local selesai = false
				local con = hum.MoveToFinished:Connect(function() selesai = true end)
				local batas = os.clock() + ((tuju - hrp.Position).Magnitude / math.max(1, hum.WalkSpeed)) + 6
				while not selesai and os.clock() < batas and model.Parent do
					task.wait(0.5)
					-- MoveTo berhenti sendiri setelah 8 detik: ulangi
					if not selesai then hum:MoveTo(tuju) end
				end
				con:Disconnect()
				if not model.Parent then break end
				if os.clock() >= batas then -- tersangkut: pindah ke simpang
					hrp.CFrame = CFrame.new(tuju + Vector3.new(0, hum.HipHeight + hrp.Size.Y / 2, 0))
				end
				-- berhenti sebentar sesekali
				if acak() < 0.35 then task.wait(1.5 + acak() * 3) end
				local pil = {}
				for _, n in ipairs(G.tet[b]) do if n ~= a then table.insert(pil, n) end end
				local c = #pil > 0 and pilih(pil) or a
				a, b = b, c
			end
		end)
	end
end

print("[NpcDesa] " .. jumlah .. " NPC dimunculkan")
