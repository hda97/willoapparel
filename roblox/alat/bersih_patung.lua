-- Bersihkan "patung" NPC dan kendaraan lalu lintas yang ikut terekam beku waktu peta diekspor dari game web
-- (ekspor_web.js memotret semua mesh adegan, termasuk NPC dan mobil yang sedang lewat).
-- Pakai dari Command Bar Studio (mode Edit):
--   loadstring(game:GetService("HttpService"):GetAsync("https://raw.githubusercontent.com/hda97/willoapparel/<commit>/roblox/alat/bersih_patung.lua"))("uji")
--   mode "uji"   = hanya menghitung dan mencatat (tidak menghapus apa pun)
--   mode "lihat" = memilih (Selection) Part yang akan dihapus supaya bisa dilihat dulu
--   mode "hapus" = menghapus, bisa dibatalkan dengan Ctrl+Z
-- Tiap patung NPC dicatat ke ServerStorage.DK_TitikNPC (Part tak terlihat + atribut warna kulit, atasan, bawahan, rambut)
-- supaya skrip NpcDesa memunculkan NPC hidup di tempat yang sama dengan penampilan yang sama.
local mode = ... or "uji"
local CHS = game:GetService("ChangeHistoryService")
local SS = game:GetService("ServerStorage")
local root = workspace:FindFirstChild("DuniaKotak3")
assert(root, "DuniaKotak3 tidak ada")

local SK = 1.25
-- jaringan jalan tiap dusun (sama dengan LaluLintas.client.lua), dalam satuan web
local JALAN = {
	wetan = { g = Vector3.new(0, 0, 0), xs = { -195, -65, 65, 195 }, zs = { -840, -720, -600, -480, -360, -240, -120, 0, 120, 240, 360, 480, 600, 720, 840 }, naik = { 1, 1, 1, 1 } },
	kulon = { g = Vector3.new(-10000, 0, 0), xs = { -650, -302.5, 0, 302.5, 650 }, zs = { 2.5, -127.5, -257.5, -387.5, -517.5, -647.5, -777.5, -907.5, -1037.5, -1167.5 }, naik = { 1, 0, 0, 0, 1 } },
	curug = { g = Vector3.new(0, 0, -10000), xs = { -640, -302.5, 0, 302.5, 640 }, zs = { 83.75, 0, -195, -390, -585, -780 }, naik = { 0, 0, 0, 0, 0 } },
	tlaga = { g = Vector3.new(0, 0, 10000), xs = { -700, -330, 0, 330, 700 }, zs = { 0, -200, -400, -1000, -1200 }, naik = { 1, 0, 0, 0, 1 } },
}
local KULIT = { f6d6b8 = true, f2c7a0 = true, e0aa7e = true, c98c5e = true, a86e44 = true, ["7a4a2a"] = true }

local function diJalan(J, p)
	for i, x in ipairs(J.xs) do
		if J.naik[i] == 1 and math.abs(p.X - (x * SK + J.g.X)) < 8 then return true end
	end
	for _, z in ipairs(J.zs) do
		if math.abs(p.Z - (z * SK + J.g.Z)) < 8 then return true end
	end
	return false
end

if mode == "hapus" then CHS:SetWaypoint("Sebelum bersih patung") end
local titik = SS:FindFirstChild("DK_TitikNPC")
if mode == "hapus" then
	if not titik then
		titik = Instance.new("Folder")
		titik.Name = "DK_TitikNPC"
		titik.Parent = SS
	end
end

local laporan, hapus = {}, {}
for _, F in ipairs(root:GetChildren()) do
	local J = JALAN[F.Name]
	if not J then continue end
	local semua = F:GetDescendants()
	local kepala, ban = {}, {}
	for _, p in ipairs(semua) do
		if p:IsA("BasePart") then
			local s = p.Size
			if math.abs(s.X - 1.19) < 0.1 and math.abs(s.Y - 1.19) < 0.1 and math.abs(s.Z - 1.19) < 0.1 and KULIT[p.Color:ToHex():lower()] then
				table.insert(kepala, p)
			elseif p:IsA("Part") and p.Shape == Enum.PartType.Cylinder and p.Color:ToHex():lower() == "18191d" and s.Y < 4 then
				table.insert(ban, p)
			end
		end
	end
	-- kelompokkan ban per kendaraan
	local mobil = {}
	for _, b in ipairs(ban) do
		local q, masuk = b.Position, false
		for _, m in ipairs(mobil) do
			if (m.c - q).Magnitude < 9 then
				table.insert(m.ban, b)
				m.c = m.c:Lerp(q, 1 / #m.ban)
				masuk = true
				break
			end
		end
		if not masuk then table.insert(mobil, { c = q, ban = { b } }) end
	end
	local nMobil, nNpc = 0, 0
	local tanda = {}
	for _, m in ipairs(mobil) do
		if #m.ban >= 2 and diJalan(J, m.c) then
			local x0, x1, z0, z1, y0 = math.huge, -math.huge, math.huge, -math.huge, math.huge
			for _, b in ipairs(m.ban) do
				local p = b.Position
				x0, x1, z0, z1 = math.min(x0, p.X), math.max(x1, p.X), math.min(z0, p.Z), math.max(z1, p.Z)
				y0 = math.min(y0, p.Y - b.Size.Y / 2)
			end
			-- sumbu panjang kendaraan = sisi terpanjang sebaran ban
			local panjangX = (x1 - x0) > (z1 - z0)
			local ex, ez = panjangX and 3.6 or 1.6, panjangX and 1.6 or 3.6
			if #m.ban <= 3 then ex, ez = 2.2, 2.2 end -- motor/sepeda
			m.kotak = { x0 - ex, x1 + ex, z0 - ez, z1 + ez, y0 }
			table.insert(tanda, m.kotak)
			nMobil += 1
		end
	end
	for _, h in ipairs(kepala) do
		table.insert(tanda, { npc = h })
		nNpc += 1
	end
	-- kumpulkan Part di dalam tiap tanda
	local n = 0
	for _, t in ipairs(tanda) do
		local isi = {}
		if t.npc then
			local hp = t.npc.Position
			for _, p in ipairs(semua) do
				if p:IsA("BasePart") and p.Parent then
					local q = p.Position
					local s = p.Size
					local dxz = Vector2.new(q.X - hp.X, q.Z - hp.Z).Magnitude
					if dxz < 1.5 and q.Y > hp.Y - 4.9 and q.Y < hp.Y + 1.2 and math.max(s.X, s.Y, s.Z) < 1.9 and not (s.Y < 0.3 and q.Y < hp.Y - 4.2) then
						table.insert(isi, p)
					end
				end
			end
			-- catat penampilan: kulit = kepala, atasan = balok terbesar setinggi dada, bawahan = balok terbesar setinggi kaki, rambut = di atas kepala
			local function terbesar(ya, yb)
				local best, bv = nil, 0
				for _, p in ipairs(isi) do
					local v = p.Size.X * p.Size.Y * p.Size.Z
					if p ~= t.npc and p.Position.Y > hp.Y + ya and p.Position.Y < hp.Y + yb and v > bv then best, bv = p, v end
				end
				return best
			end
			local at, bw, rb = terbesar(-2.6, -0.9), terbesar(-4.8, -2.6), terbesar(0.35, 1.3)
			if mode == "hapus" then
				local m = Instance.new("Part")
				m.Name = F.Name
				m.Anchored, m.CanCollide, m.CanQuery, m.CanTouch = true, false, false, false
				m.Transparency = 1
				m.Size = Vector3.new(1, 1, 1)
				m.CFrame = CFrame.new(hp.X, hp.Y - 3.9, hp.Z)
				m:SetAttribute("kulit", "#" .. t.npc.Color:ToHex())
				m:SetAttribute("atasan", at and "#" .. at.Color:ToHex() or "#3a7bd5")
				m:SetAttribute("bawahan", bw and "#" .. bw.Color:ToHex() or "#2f3a52")
				m:SetAttribute("rambut", rb and "#" .. rb.Color:ToHex() or "#0b0b0e")
				m.Parent = titik
			end
		else
			local k = t
			for _, p in ipairs(semua) do
				if p:IsA("BasePart") and p.Parent then
					local q, s = p.Position, p.Size
					if q.X > k[1] and q.X < k[2] and q.Z > k[3] and q.Z < k[4] and q.Y > k[5] - 0.2 and q.Y < k[5] + 9
						and math.max(s.X, s.Z) < 16 and not (s.Y < 0.4 and q.Y < k[5] + 0.35) then
						table.insert(isi, p)
					end
				end
			end
		end
		for _, p in ipairs(isi) do
			if not hapus[p] then
				hapus[p] = true
				n += 1
			end
		end
	end
	table.insert(laporan, string.format("%s: %d NPC, %d kendaraan, %d Part", F.Name, nNpc, nMobil, n))
end
local total, pilih = 0, {}
for p in pairs(hapus) do
	total += 1
	if mode == "hapus" then p:Destroy() else table.insert(pilih, p) end
end
if mode == "lihat" then game:GetService("Selection"):Set(pilih) end
if mode == "hapus" then CHS:SetWaypoint("Bersih patung NPC dan kendaraan") end
print("DK bersih patung (" .. mode .. "): " .. table.concat(laporan, " | ") .. " | total " .. total .. " Part")
