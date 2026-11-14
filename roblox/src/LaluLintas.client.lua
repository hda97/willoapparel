--[[
  LaluLintas (LocalScript, StarterPlayer.StarterPlayerScripts) - kendaraan warga yang keliling jalan dusun, disalin dari
  public/duniakotak/mabar/js/lalulintas.js game web: sedan, motor, sepeda, mobil patroli, hatchback, ambulans (sirene
  berkedip), dan jip. Lajur KIRI, berhenti kalau ada warga atau kendaraan lain di depan, belok acak di simpang, dan
  putar balik di jalan buntu.

  Jaringan jalan tiap dusun (xs, zs, tinggi simpang) diambil dari game web lewat peramban (I.jalur atau vroads/hroads),
  dalam satuan web. Ke Roblox dikali 1,25 lalu digeser ke letak dusun.

  Kendaraan hanya hiasan: dibuat dan digerakkan di tiap HP sendiri (tidak membebani server), tidak bisa ditabrak, dan
  hanya dusun tempat pemain berada yang digerakkan. Lampu lalu lintas belum ikut (kendaraan tidak berhenti di simpang).
]]

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local P = Players.LocalPlayer

local SK = 1.25                 -- 1 satuan web = 1,25 stud
local M = 4.12 / 1.7 * SK       -- 1 meter game web dalam stud
local KEC = 15 * SK             -- laju jalan kaki game web (stud per detik)
local JANGKAU = 700             -- dusun digerakkan kalau pemain sedekat ini dari jalannya

local DUSUN = {
	{ nama = "wetan", geser = Vector3.new(0, 0, 0), n = 8, xs = { -195, -65, 65, 195 },
		zs = { -840, -720, -600, -480, -360, -240, -120, 0, 120, 240, 360, 480, 600, 720, 840 }, naik = { 1, 1, 1, 1 }, ty = 0.05 },
	{ nama = "kulon", geser = Vector3.new(-10000, 0, 0), n = 7, xs = { -650, -302.5, 0, 302.5, 650 },
		zs = { 2.5, -127.5, -257.5, -387.5, -517.5, -647.5, -777.5, -907.5, -1037.5, -1167.5 }, naik = { 1, 0, 0, 0, 1 },
		ty = { { 0.85, 0.8, 0.8, 0.8, 0.85 }, { 13.75, 13, 13, 13, 13.75 }, { 26.75, 26, 26, 26, 26.75 }, { 39.75, 39, 39, 39, 39.75 }, { 52.75, 52, 52, 52, 52.75 },
			{ 65.75, 65, 65, 65, 65.75 }, { 78.75, 78, 78, 78, 78.75 }, { 91.75, 91, 91, 91, 91.75 }, { 104.75, 104, 104, 104, 104.75 }, { 117.75, 117, 117.8, 117, 117.75 } } },
	{ nama = "curug", geser = Vector3.new(0, 0, -10000), n = 4, xs = { -640, -302.5, 0, 302.5, 640 },
		zs = { 83.75, 0, -195, -390, -585, -780 }, naik = { 0, 0, 0, 0, 0 },
		ty = { { 0.8, 0.8, 0.8, 1.77, 0.8 }, { 0.8, 0.8, 0.8, 0.8, 0.8 }, { 30.8, 30, 30, 30, 30.8 }, { 60.8, 60, 60, 60, 60.8 }, { 90.8, 90, 90, 90, 90.8 }, { 120.8, 120, 120, 120, 120 } } },
	{ nama = "tlaga", geser = Vector3.new(0, 0, 10000), n = 4, xs = { -700, -330, 0, 330, 700 },
		zs = { 0, -200, -400, -1000, -1200 }, naik = { 1, 0, 0, 0, 1 },
		ty = { { 0.8, 0.8, 0.8, 0.8, 0.8 }, { 0.8, 0.8, 0.8, 0.8, 0.8 }, { 0.8, 0.8, 0.8, 0.8, 0.8 }, { 0.8, 0.8, 2.5, 0.8, 0.8 }, { 0.8, 0.8, 2.5, 0.8, 0.8 } } },
}

local function rgb(h) return Color3.fromRGB(bit32.rshift(h, 16), bit32.band(bit32.rshift(h, 8), 255), bit32.band(h, 255)) end
-- { model, warna, laju (x jalan kaki) } urutan sama dengan ARMADA game web
local ARMADA = {
	{ "sedan", 0x2f6fd8, 1.5 }, { "motor", 0xb8252c, 1.7 }, { "sepeda", 0x2f9a54, 0.95 }, { "patroli", 0xf4f4f4, 1.5 }, { "hatch", 0xf2b62a, 1.6 },
	{ "motor", 0x2a2b33, 1.7 }, { "ambulans", 0xf6f6f6, 1.35 }, { "jip", 0xeeeee8, 1.45 },
}
local PANJANG = { sepeda = 1.8, motor = 2.1, sedan = 4.4, patroli = 4.4, ambulans = 5.2, hatch = 4.0, jip = 4.3 }
local KULIT = { 0xf2c7a0, 0xe0aa7e, 0xc98e5e, 0x8a5a3a }
local BAJU = { 0x3a7bd5, 0xd0442f, 0x2a9a5a, 0xf2c14e, 0x8a5ad8, 0x1d1d22, 0xe06a9a }

local BAN, KACA, ABU = Color3.fromRGB(26, 26, 30), Color3.fromRGB(150, 200, 230), Color3.fromRGB(120, 124, 132)
local LAMPU, MERAH, BIRU = Color3.fromRGB(255, 240, 180), Color3.fromRGB(220, 40, 40), Color3.fromRGB(40, 90, 230)

-- bentuk kendaraan: { ukuran, letak (y dari tanah, -Z = depan), warna ("w" = warna badan), tanda }
local function mobil(p, l, t, angkat, ban)
	local b = {
		{ Vector3.new(l, t, p), Vector3.new(0, angkat + t / 2, 0), "w" },
		{ Vector3.new(l - 0.4, 1.7, p * 0.5), Vector3.new(0, angkat + t + 0.85, p * 0.06), KACA },
		{ Vector3.new(l - 0.2, 0.3, p * 0.5 + 0.2), Vector3.new(0, angkat + t + 1.85, p * 0.06), "w" },
		{ Vector3.new(l - 0.4, 0.5, 0.3), Vector3.new(0, angkat + t * 0.4, -p / 2 - 0.1), ABU },
		{ Vector3.new(1, 0.5, 0.2), Vector3.new(l / 2 - 0.8, angkat + t * 0.7, -p / 2 - 0.1), LAMPU },
		{ Vector3.new(1, 0.5, 0.2), Vector3.new(-l / 2 + 0.8, angkat + t * 0.7, -p / 2 - 0.1), LAMPU },
		{ Vector3.new(1, 0.5, 0.2), Vector3.new(l / 2 - 0.8, angkat + t * 0.7, p / 2 + 0.1), MERAH },
		{ Vector3.new(1, 0.5, 0.2), Vector3.new(-l / 2 + 0.8, angkat + t * 0.7, p / 2 + 0.1), MERAH },
	}
	for _, sx in ipairs({ -1, 1 }) do
		for _, sz in ipairs({ -1, 1 }) do
			table.insert(b, { Vector3.new(1, ban, ban), Vector3.new(sx * (l / 2 - 0.2), ban / 2, sz * p * 0.32), BAN })
		end
	end
	return b
end

local BENTUK = {}
BENTUK.sedan = mobil(11, 6, 2, 0.7, 2)
BENTUK.hatch = mobil(9.5, 6, 2.2, 0.7, 2)
BENTUK.jip = mobil(10, 6.4, 2.4, 1.3, 2.8)
BENTUK.patroli = mobil(11, 6, 2, 0.7, 2)
table.insert(BENTUK.patroli, { Vector3.new(6.1, 0.7, 11.1), Vector3.new(0, 1.5, 0), BIRU })       -- garis biru di badan
table.insert(BENTUK.patroli, { Vector3.new(1.6, 0.5, 0.8), Vector3.new(-1, 5, 0.6), MERAH, "sm" }) -- lampu atap
table.insert(BENTUK.patroli, { Vector3.new(1.6, 0.5, 0.8), Vector3.new(1, 5, 0.6), BIRU, "sb" })
BENTUK.ambulans = {
	{ Vector3.new(6.2, 5, 9), Vector3.new(0, 3.4, 2), "w" },                 -- kotak belakang
	{ Vector3.new(6.2, 3, 4), Vector3.new(0, 2.4, -4.5), "w" },              -- kabin
	{ Vector3.new(5.6, 1.6, 0.3), Vector3.new(0, 3.2, -6.5), KACA },
	{ Vector3.new(6.3, 0.8, 9.1), Vector3.new(0, 3, 2), MERAH },             -- garis merah
	{ Vector3.new(0.5, 2, 0.2), Vector3.new(0, 4.6, 6.55), MERAH },          -- palang di pintu belakang
	{ Vector3.new(2, 0.5, 0.2), Vector3.new(0, 4.6, 6.56), MERAH },
	{ Vector3.new(1, 0.5, 0.2), Vector3.new(2.3, 1.6, -6.55), LAMPU },
	{ Vector3.new(1, 0.5, 0.2), Vector3.new(-2.3, 1.6, -6.55), LAMPU },
	{ Vector3.new(1.8, 0.6, 1), Vector3.new(-1.2, 6.2, -1.6), MERAH, "sm" }, -- sirene
	{ Vector3.new(1.8, 0.6, 1), Vector3.new(1.2, 6.2, -1.6), BIRU, "sb" },
}
for _, sx in ipairs({ -1, 1 }) do
	for _, sz in ipairs({ -4.2, 4.4 }) do
		table.insert(BENTUK.ambulans, { Vector3.new(1, 2.2, 2.2), Vector3.new(sx * 2.9, 1.1, sz), BAN })
	end
end
BENTUK.motor = {
	{ Vector3.new(1.3, 1.5, 4.6), Vector3.new(0, 2, 0), "w" },
	{ Vector3.new(1.1, 0.5, 2), Vector3.new(0, 3, 1), BAN },
	{ Vector3.new(0.8, 2.4, 2.4), Vector3.new(0, 1.2, -2.7), BAN },
	{ Vector3.new(0.8, 2.4, 2.4), Vector3.new(0, 1.2, 2.7), BAN },
	{ Vector3.new(3, 0.3, 0.3), Vector3.new(0, 3.6, -1.9), ABU },
	{ Vector3.new(0.4, 1.6, 0.4), Vector3.new(0, 2.9, -2.2), ABU },
	{ Vector3.new(0.7, 0.5, 0.2), Vector3.new(0, 3.1, -2.6), LAMPU },
}
BENTUK.sepeda = {
	{ Vector3.new(0.4, 0.4, 3.6), Vector3.new(0, 2.2, 0), "w" },
	{ Vector3.new(0.4, 1.4, 0.4), Vector3.new(0, 1.6, 0.4), "w" },
	{ Vector3.new(0.3, 2.4, 2.4), Vector3.new(0, 1.2, -2.2), BAN },
	{ Vector3.new(0.3, 2.4, 2.4), Vector3.new(0, 1.2, 2.2), BAN },
	{ Vector3.new(2.6, 0.25, 0.25), Vector3.new(0, 3.4, -1.7), ABU },
	{ Vector3.new(0.3, 1.4, 0.3), Vector3.new(0, 2.8, -1.8), ABU },
	{ Vector3.new(0.8, 0.3, 1.2), Vector3.new(0, 3, 1), BAN },
}
-- letak pengemudi (pinggul): { x, y, z }; pengemudi mobil kelihatan dari kaca
local SOPIR = { sedan = { 1.4, 2.9, -0.6 }, patroli = { 1.4, 2.9, -0.6 }, hatch = { 1.4, 3.1, -0.4 }, jip = { 1.5, 3.9, -0.4 },
	ambulans = { 1.5, 2.6, -4.6 }, motor = { 0, 3.3, 0.8 }, sepeda = { 0, 3.2, 0.9 } }

local lama = workspace:FindFirstChild("DK_LaluLintas")
if lama then lama:Destroy() end
local folder = Instance.new("Folder")
folder.Name = "DK_LaluLintas"
folder.Parent = workspace

local biji = 71
local function acak()
	biji = (biji * 16807) % 2147483647
	return (biji - 1) / 2147483646
end
local function pilih(a) return a[math.floor(acak() * #a) + 1] end

local sirene = {} -- { merah = {part...}, biru = {part...} }
local function bagian(model, ukuran, letak, warna, neon)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CanTouch = false
	p.CanQuery = false
	p.CastShadow = false
	p.Size = ukuran
	p.CFrame = CFrame.new(letak)
	p.Color = warna
	p.Material = neon and Enum.Material.Neon or Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = model
	return p
end
local function buatKendaraan(jenis, warna)
	local model = Instance.new("Model")
	model.Name = jenis
	local akar = bagian(model, Vector3.new(1, 1, 1), Vector3.new(0, 0, 0), BAN)
	akar.Transparency = 1
	model.PrimaryPart = akar
	for _, b in ipairs(BENTUK[jenis]) do
		local p = bagian(model, b[1], b[2], b[3] == "w" and warna or b[3], b[3] == LAMPU or b[4] ~= nil)
		if b[3] == KACA then p.Transparency = 0.45 end
		if b[4] == "sm" then table.insert(sirene, { p, true }) elseif b[4] == "sb" then table.insert(sirene, { p, false }) end
	end
	local s = SOPIR[jenis]
	local baju = jenis == "patroli" and rgb(0x8a6a3a) or jenis == "ambulans" and rgb(0xf4f4f4) or rgb(pilih(BAJU))
	bagian(model, Vector3.new(1.7, 1.9, 1), Vector3.new(s[1], s[2] + 0.95, s[3]), baju)
	bagian(model, Vector3.new(1.3, 1.3, 1.3), Vector3.new(s[1], s[2] + 2.55, s[3]), rgb(pilih(KULIT)))
	if jenis == "motor" or jenis == "sepeda" then
		bagian(model, Vector3.new(1.5, 0.7, 1.5), Vector3.new(s[1], s[2] + 3.3, s[3]), BAN) -- helm
	end
	model.Parent = folder
	return model
end

-- ---------- jaringan jalan dan armada tiap dusun ----------
for _, D in ipairs(DUSUN) do
	local NI, NJ = #D.xs, #D.zs
	D.NI, D.NJ = NI, NJ
	D.X, D.Z = {}, {}
	for i, x in ipairs(D.xs) do D.X[i] = x * SK + D.geser.X end
	for j, z in ipairs(D.zs) do D.Z[j] = z * SK + D.geser.Z end
	local function id(i, j) return (j - 1) * NI + i end
	D.tet = {}
	for k = 1, NI * NJ do D.tet[k] = {} end
	for j = 1, NJ do
		for i = 1, NI do
			if i < NI then
				table.insert(D.tet[id(i, j)], id(i + 1, j))
				table.insert(D.tet[id(i + 1, j)], id(i, j))
			end
			if j < NJ and D.naik[i] == 1 then
				table.insert(D.tet[id(i, j)], id(i, j + 1))
				table.insert(D.tet[id(i, j + 1)], id(i, j))
			end
		end
	end
	D.nx = function(k) return D.X[(k - 1) % NI + 1] end
	D.nz = function(k) return D.Z[math.floor((k - 1) / NI) + 1] end
	D.ny = function(k)
		if typeof(D.ty) == "number" then return D.ty * SK end
		return D.ty[math.floor((k - 1) / NI) + 1][(k - 1) % NI + 1] * SK
	end
	local minX, maxX, minZ, maxZ = math.huge, -math.huge, math.huge, -math.huge
	for _, x in ipairs(D.X) do minX, maxX = math.min(minX, x), math.max(maxX, x) end
	for _, z in ipairs(D.Z) do minZ, maxZ = math.min(minZ, z), math.max(maxZ, z) end
	D.batas = { minX - JANGKAU, maxX + JANGKAU, minZ - JANGKAU, maxZ + JANGKAU }
	local ruas = {}
	for k = 1, NI * NJ do
		for _, n in ipairs(D.tet[k]) do table.insert(ruas, { k, n }) end
	end
	D.armada = {}
	for q = 1, math.min(D.n, #ARMADA) do
		local A = ARMADA[q]
		local r = ruas[math.floor((q - 0.5) / D.n * #ruas) + 1]
		local dua = A[1] == "motor" or A[1] == "sepeda"
		table.insert(D.armada, { o = buatKendaraan(A[1], rgb(A[2])), a = r[1], b = r[2], s = acak() * 10, kec = A[3] * KEC, laju = 0,
			pj = PANJANG[A[1]] * M, dua = dua, lajur = dua and (0.9 * M + 2.5 * SK) or math.min(5 * SK, 1.6 * M), macet = 0, bebas = 0 })
	end
end

-- ---------- gerak ----------
local rp = RaycastParams.new()
rp.FilterType = Enum.RaycastFilterType.Exclude
local orang = {} -- letak semua tokoh pemain (disegarkan tiap bingkai)
local function segarkanSaring()
	local t = { folder }
	for _, pl in ipairs(Players:GetPlayers()) do
		if pl.Character then table.insert(t, pl.Character) end
	end
	rp.FilterDescendantsInstances = t
end
segarkanSaring()

local function tinggi(x, z, kira)
	local r = workspace:Raycast(Vector3.new(x, kira + 9, z), Vector3.new(0, -24, 0), rp)
	return r and r.Position.Y or kira
end

local function arah(D, c)
	local ax, az = D.nx(c.a), D.nz(c.a)
	local dx, dz = D.nx(c.b) - ax, D.nz(c.b) - az
	local L = math.sqrt(dx * dx + dz * dz)
	if L < 0.001 then return ax, az, 0, 0, 1 end
	return ax, az, dx / L, dz / L, L
end

local function letak(D, c, dt, langsung)
	local ax, az, dx, dz, L = arah(D, c)
	local x = ax + dx * c.s + dz * c.lajur -- lajur kiri: normal kiri (dz, -dx)
	local z = az + dz * c.s - dx * c.lajur
	local yaw = math.atan2(-dx, -dz)
	if langsung or not c.x then
		c.x, c.z, c.yaw = x, z, yaw
	else
		local a = math.min(1, dt * 7)
		c.x += (x - c.x) * a
		c.z += (z - c.z) * a
		local dr = yaw - c.yaw
		dr = math.atan2(math.sin(dr), math.cos(dr))
		c.yaw += dr * math.min(1, dt * 6)
	end
	local ya, yb = D.ny(c.a), D.ny(c.b)
	local kira = c.y or (ya + (yb - ya) * math.clamp(c.s / L, 0, 1))
	local hx, hz, sb = -math.sin(c.yaw), -math.cos(c.yaw), c.pj * 0.38
	local yT = tinggi(c.x, c.z, kira)
	local yD = tinggi(c.x + hx * sb, c.z + hz * sb, yT)
	local yB = tinggi(c.x - hx * sb, c.z - hz * sb, yT)
	c.y = math.max(yT, (yD + yB) / 2)
	local miring = math.atan2(yD - yB, 2 * sb) * 0.9
	c.o:PivotTo(CFrame.new(c.x, c.y, c.z) * CFrame.Angles(0, c.yaw, 0) * CFrame.Angles(miring, 0, 0))
end

local function halangan(c, dx, dz, ox, oz, jauh)
	local rx, rz = ox - c.x, oz - c.z
	local maju, samping = rx * dx + rz * dz, math.abs(rx * dz - rz * dx)
	return maju > 0 and maju < jauh and samping < 1.6 * M
end

for _, D in ipairs(DUSUN) do
	for _, c in ipairs(D.armada) do letak(D, c, 0, true) end
end

local jamSaring, kedip = 0, -1
RunService.Heartbeat:Connect(function(dt)
	dt = math.min(dt, 0.1)
	local kini = os.clock()
	if kini - jamSaring > 1 then
		jamSaring = kini
		segarkanSaring()
	end
	local f = math.floor(kini * 5) % 2
	if f ~= kedip then
		kedip = f
		for _, s in ipairs(sirene) do s[1].Transparency = (s[2] == (f == 1)) and 0 or 0.75 end
	end
	local akar = P.Character and P.Character:FindFirstChild("HumanoidRootPart")
	if not akar then return end
	local px, pz = akar.Position.X, akar.Position.Z
	table.clear(orang)
	for _, pl in ipairs(Players:GetPlayers()) do
		local h = pl.Character and pl.Character:FindFirstChild("HumanoidRootPart")
		if h then table.insert(orang, h.Position) end
	end
	for _, D in ipairs(DUSUN) do
		local B = D.batas
		if px > B[1] and px < B[2] and pz > B[3] and pz < B[4] then
			for _, c in ipairs(D.armada) do
				local _, _, dx, dz, L = arah(D, c)
				local target = c.kec
				local jauh = c.pj / 2 + 4.5 * M
				for _, o in ipairs(orang) do
					if math.abs(o.Y - (c.y or o.Y)) < 14 and halangan(c, dx, dz, o.X, o.Z, jauh) then target = 0 break end
				end
				if target > 0 and kini > c.bebas then
					for _, d in ipairs(D.armada) do
						if d ~= c and halangan(c, dx, dz, d.x, d.z, c.pj / 2 + d.pj / 2 + 1.5 * M) then
							target = 0
							c.macet += dt
							break
						end
					end
					-- dua kendaraan saling menunggu di simpang: yang sudah menunggu lama jalan dulu
					if target > 0 then c.macet = 0 elseif c.macet > 6 then c.macet, c.bebas = 0, kini + 2.5 end
				end
				c.laju += (target - c.laju) * math.min(1, dt * (target > 0 and 1.8 or 5))
				c.s += c.laju * dt
				if c.s >= L then -- sampai simpang: belok acak (tidak balik arah kecuali jalan buntu)
					local pil = {}
					for _, n in ipairs(D.tet[c.b]) do
						if n ~= c.a then table.insert(pil, n) end
					end
					local b = #pil > 0 and pil[math.random(1, #pil)] or c.a
					c.a, c.b, c.s = c.b, b, math.max(0, c.s - L)
				end
				letak(D, c, dt)
			end
		end
	end
end)
