--[[
  GridPeta (ModuleScript) - cari Part map (workspace.DuniaKotak3) di dalam sebuah kotak, termasuk Part hiasan yang CanQuery-nya
  mati (jendela, pagar, dll. tidak terjangkau GetPartBoundsInBox). Dipakai HiasRumah (cat rumah, pagar, 2 lantai) dan
  DealerKendaraan (menyembunyikan kendaraan bawaan map di parkiran rumah).
  Tempat: ServerStorage.DK_GridPeta.
  GridPeta.di(pusat: Vector3, ukuran: Vector3) -> { BasePart } yang titik tengahnya ada di dalam kotak (sejajar sumbu).
  Indeks dibuat sekali per dusun saat pertama kali dibutuhkan.
]]
local SEL = 32
local M = {}
local indeks = {} -- [folder dusun] = { [kunci sel] = { part } }

local function kunci(x, z) return math.floor(x / SEL) .. ":" .. math.floor(z / SEL) end

local function buatIndeks(f)
	local t = {}
	for _, p in ipairs(f:GetDescendants()) do
		if p:IsA("BasePart") then
			local k = kunci(p.Position.X, p.Position.Z)
			local l = t[k]
			if not l then l = {} t[k] = l end
			table.insert(l, p)
		end
	end
	indeks[f] = t
	f.AncestryChanged:Connect(function() if not f.Parent then indeks[f] = nil end end)
	return t
end

function M.di(pusat, ukuran)
	local akar = workspace:FindFirstChild("DuniaKotak3")
	local hasil = {}
	if not akar then return hasil end
	local h = ukuran / 2
	local lo, hi = pusat - h, pusat + h
	for _, f in ipairs(akar:GetChildren()) do
		-- hanya dusun yang dekat (dusun berjarak 10.000 stud; atribut geser = titik pusat dusun)
		local g = f:GetAttribute("geser")
		if typeof(g) == "Vector3" and math.max(math.abs(g.X - pusat.X), math.abs(g.Z - pusat.Z)) > 5000 then continue end
		local t = indeks[f] or buatIndeks(f)
		for sx = math.floor(lo.X / SEL), math.floor(hi.X / SEL) do
			for sz = math.floor(lo.Z / SEL), math.floor(hi.Z / SEL) do
				local l = t[sx .. ":" .. sz]
				if l then
					for _, p in ipairs(l) do
						local q = p.Position
						if p.Parent and q.X >= lo.X and q.X <= hi.X and q.Y >= lo.Y and q.Y <= hi.Y and q.Z >= lo.Z and q.Z <= hi.Z then
							table.insert(hasil, p)
						end
					end
				end
			end
		end
	end
	return hasil
end

return M
