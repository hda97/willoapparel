
local function kontras(c)
	local l = 0.2126 * c.R + 0.7152 * c.G + 0.0722 * c.B
	return l > 0.45 and Color3.fromRGB(29, 30, 36) or Color3.fromRGB(246, 246, 242)
end

-- jenis: sedan | patroli | ambulans | hatch | gt | jip | motor | sepeda
-- opsi.las = BasePart: bagian dilas (WeldConstraint) ke part ini, Massless, tidak Anchored; letak awal = opsi.cf
-- opsi.cf = CFrame titik tanah tengah kendaraan (bawaan CFrame.new())
-- opsi.skala = pengali ukuran (bawaan 1 = ukuran nyata terhadap peta; untuk kendaraan pemain pakai M.ukurTokoh)
-- Hasil: model, { sirene = { {part, merah?} }, ban = { part } }
function M.buat(jenis, warna, opsi)
	opsi = opsi or {}
	local d = M.DATA[jenis] or M.DATA.sedan
	local cf = opsi.cf or CFrame.new()
	local k = opsi.skala or 1
	local aksen = kontras(warna)
	local model = Instance.new("Model")
	model.Name = jenis
	local akar = Instance.new("Part")
	akar.Name = "Akar"
	akar.Size = Vector3.new(1, 1, 1)
	akar.Transparency = 1
	akar.CanCollide, akar.CanQuery, akar.CanTouch = false, false, false
	akar.Anchored = opsi.las == nil
	akar.Massless = true
	akar.CFrame = cf
	akar.Parent = model
	model.PrimaryPart = akar
	local info = { sirene = {}, ban = {} }
	for _, b in ipairs(d.bagian) do
		local p = Instance.new("Part")
		local f = b[17]
		p.Size = Vector3.new(b[1], b[2], b[3]) * k
		if bit32.band(f, 1) ~= 0 then p.Shape = Enum.PartType.Cylinder end
		p.CFrame = cf * CFrame.new(b[4] * k, b[5] * k, b[6] * k, b[7], b[10], b[13], b[8], b[11], b[14], b[9], b[12], b[15])
		p.Color = b[16] == "w" and warna or b[16] == "a" and aksen or Color3.fromHex(b[16])
		if bit32.band(f, 2) ~= 0 then p.Transparency = 0.25 p.Material = Enum.Material.Glass
		elseif bit32.band(f, 4) ~= 0 then p.Material = Enum.Material.Neon
		else p.Material = Enum.Material.SmoothPlastic end
		p.TopSurface, p.BottomSurface = Enum.SurfaceType.Smooth, Enum.SurfaceType.Smooth
		p.CanCollide, p.CanQuery, p.CanTouch = false, false, false
		p.CastShadow = math.max(b[1], b[2], b[3]) > 1.5
		p.Massless = true
		if bit32.band(f, 8) ~= 0 then table.insert(info.sirene, { p, true }) end
		if bit32.band(f, 16) ~= 0 then table.insert(info.sirene, { p, false }) end
		if bit32.band(f, 32) ~= 0 then table.insert(info.ban, p) end
		if opsi.las then
			local w = Instance.new("WeldConstraint")
			w.Part0 = opsi.las
			w.Part1 = p
			w.Parent = p
		else
			p.Anchored = true
		end
		p.Parent = model
	end
	if opsi.las then
		local w = Instance.new("WeldConstraint")
		w.Part0 = opsi.las
		w.Part1 = akar
		w.Parent = akar
	end
	return model, info
end

local METER = 4.12 / 1.7 * 1.25 -- 1 meter game web dalam stud
M.METER = METER
-- cara duduk (sama dengan DUDUK js/lalulintas.js dan KEND game.js): { tinggi pinggul (m), kursi z (m) atau nil = kursi model, kaki, tangan }
-- kaki/tangan = sudut web (negatif = ke depan); di Roblox dipakai dengan tanda dibalik.
M.DUDUK = {
	sepeda = { 1.06, -0.24, -0.55, -1.2 }, motor = { 0.93, -0.38, -0.85, -1.25 },
	sedan = { 0.42, nil, -1.45, -1.15 }, patroli = { 0.42, nil, -1.45, -1.15 }, hatch = { 0.42, nil, -1.45, -1.15 },
	ambulans = { 0.6, nil, -1.45, -1.15 }, jip = { 0.8, nil, -1.4, -1.15 }, gt = { 0.36, nil, -1.5, -1.1 },
}
local PINGGUL = 1.37 * 1.25 -- tinggi pinggul tokoh kotak berdiri (stud)

-- letak pinggul pengemudi dari titik tanah tengah kendaraan (stud)
function M.kursi(jenis)
	local d = M.DATA[jenis] or M.DATA.sedan
	local u = M.DUDUK[jenis] or M.DUDUK.sedan
	local z = u[2] and -u[2] * METER or d.kursi[3]
	return Vector3.new(d.kursi[1], u[1] * METER, z)
end

-- tinggi pinggul tokoh pemain yang sedang berdiri (stud dari tanah) dan skala kendaraan yang pas dengan tokoh itu.
-- Tokoh kotak (AvatarKotak) diskalakan dari rangka Roblox, jadi bisa sedikit lebih besar dari skala peta (1 satuan web = 1,25 stud).
function M.ukurTokoh(char)
	local S = char and char:GetAttribute("DK_Skala") -- diisi AvatarKotak saat merakit tokoh
	if typeof(S) ~= "number" or S < 0.8 or S > 3 then return PINGGUL, 1 end
	return 1.37 * S, S / 1.25
end

-- untuk kendaraan yang ditempel ke tokoh: letak titik tanah kendaraan dari kaki tokoh, dan selisih tinggi pinggul (stud)
-- pinggulBerdiri, skala dari M.ukurTokoh
function M.naik(jenis, pinggulBerdiri, skala)
	local k = M.kursi(jenis) * (skala or 1)
	return Vector3.new(-k.X, 0, -k.Z), k.Y - (pinggulBerdiri or PINGGUL)
end

-- pengemudi tokoh kotak sederhana yang duduk (untuk kendaraan hiasan lalu lintas)
-- o = { baju = Color3, kulit = Color3, rambut = Color3, celana = Color3, helm = bool }
function M.sopir(model, jenis, o)
	local akar = model.PrimaryPart
	local cf0 = akar.CFrame
	local u = M.DUDUK[jenis] or M.DUDUK.sedan
	local hip = M.kursi(jenis)
	local function b(ukuran, cf, warna)
		local p = Instance.new("Part")
		p.Size = ukuran
		p.CFrame = cf0 * cf
		p.Color = warna
		p.Material = Enum.Material.SmoothPlastic
		p.TopSurface, p.BottomSurface = Enum.SurfaceType.Smooth, Enum.SurfaceType.Smooth
		p.CanCollide, p.CanQuery, p.CanTouch = false, false, false
		p.CastShadow = false
		p.Anchored = akar.Anchored
		p.Massless = true
		if not akar.Anchored then
			local w = Instance.new("WeldConstraint")
			w.Part0 = akar
			w.Part1 = p
			w.Parent = p
		end
		p.Parent = model
		return p
	end
	local H = CFrame.new(hip)
	local kaki, tangan = -u[3], -u[4]
	for _, x in ipairs({ -0.34, 0.34 }) do
		b(Vector3.new(0.6, 1.56, 0.62), H * CFrame.new(x, 0, 0) * CFrame.Angles(kaki, 0, 0) * CFrame.new(0, -0.78, 0), o.celana or Color3.fromRGB(47, 58, 82))
	end
	b(Vector3.new(1.375, 1.5, 0.75), H * CFrame.new(0, 0.75, 0), o.baju)
	for _, x in ipairs({ -0.99, 0.99 }) do
		b(Vector3.new(0.56, 1.31, 0.6), H * CFrame.new(x, 1.375, 0) * CFrame.Angles(tangan, 0, 0) * CFrame.new(0, -0.62, 0), o.baju)
	end
	local kepala = b(Vector3.new(1.19, 1.19, 1.19), H * CFrame.new(0, 2.19, 0), o.kulit)
	if o.helm then
		b(Vector3.new(1.4, 0.75, 1.4), H * CFrame.new(0, 2.7, 0.05), o.helmWarna or Color3.fromRGB(29, 30, 36))
	else
		b(Vector3.new(1.3, 0.35, 1.3), H * CFrame.new(0, 2.85, 0.02), o.rambut or Color3.fromRGB(11, 11, 14))
		b(Vector3.new(1.28, 0.85, 0.25), H * CFrame.new(0, 2.35, 0.55), o.rambut or Color3.fromRGB(11, 11, 14))
	end
	-- wajah: dua mata
	for _, x in ipairs({ -0.27, 0.27 }) do
		b(Vector3.new(0.16, 0.24, 0.05), H * CFrame.new(x, 2.24, -0.6), Color3.fromRGB(26, 26, 26))
	end
	return kepala
end

return M
