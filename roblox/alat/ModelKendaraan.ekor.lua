
local function kontras(c)
	local l = 0.2126 * c.R + 0.7152 * c.G + 0.0722 * c.B
	return l > 0.45 and Color3.fromRGB(29, 30, 36) or Color3.fromRGB(246, 246, 242)
end

-- jenis: sedan | patroli | ambulans | hatch | gt | jip | motor | sepeda
-- opsi.las = BasePart: bagian dilas (WeldConstraint) ke part ini, Massless, tidak Anchored; letak awal = opsi.cf
-- opsi.cf = CFrame titik tanah tengah kendaraan (bawaan CFrame.new())
-- Hasil: model, { sirene = { {part, merah?} }, ban = { part } }
function M.buat(jenis, warna, opsi)
	opsi = opsi or {}
	local d = M.DATA[jenis] or M.DATA.sedan
	local cf = opsi.cf or CFrame.new()
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
		p.Size = Vector3.new(b[1], b[2], b[3])
		if bit32.band(f, 1) ~= 0 then p.Shape = Enum.PartType.Cylinder end
		p.CFrame = cf * CFrame.new(b[4], b[5], b[6], b[7], b[10], b[13], b[8], b[11], b[14], b[9], b[12], b[15])
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

-- letak duduk pengemudi (pinggul) dari titik tanah tengah kendaraan, dalam stud
function M.kursi(jenis)
	local d = M.DATA[jenis] or M.DATA.sedan
	return Vector3.new(d.kursi[1], d.kursi[2], d.kursi[3])
end

return M
