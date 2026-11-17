--[[
  LaluLintas (LocalScript, StarterPlayer.StarterPlayerScripts) - kendaraan warga yang keliling jalan dusun, disalin dari
  public/duniakotak/mabar/js/lalulintas.js game web: sedan, motor, sepeda, mobil patroli, hatchback, ambulans (sirene
  berkedip), dan jip. Lajur KIRI, berhenti kalau ada warga atau kendaraan lain di depan, belok acak di simpang, dan
  putar balik di jalan buntu.

  Jaringan jalan tiap dusun (xs, zs, tinggi simpang) diambil dari game web lewat peramban (I.jalur atau vroads/hroads),
  dalam satuan web. Ke Roblox dikali 1,25 lalu digeser ke letak dusun.

  Kendaraan hanya hiasan: dibuat dan digerakkan di tiap HP sendiri, bentuknya sama dengan game web (DK_ModelKendaraan) (tidak membebani server), tidak bisa ditabrak, dan
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
	{ "motor", 0x2a2b33, 1.7 }, { "ambulans", 0xf6f6f6, 1.35 }, { "jip", 0xeeeee8, 1.45 }, { "sepeda", 0xf2b62a, 0.95 }, { "sedan", 0xd8402a, 1.5 },
	{ "motor", 0x2f6fd8, 1.7 }, { "gt", 0xb8252c, 1.75 },
}
local PANJANG = { sepeda = 1.8, motor = 2.1, sedan = 4.4, patroli = 4.4, ambulans = 5.2, hatch = 4.0, jip = 4.3, gt = 4.3 }
local KULIT = { 0xf2c7a0, 0xe0aa7e, 0xc98e5e, 0x8a5a3a }
local BAJU = { 0x3a7bd5, 0xd0442f, 0x2a9a5a, 0xf2c14e, 0x8a5ad8, 0x1d1d22, 0xe06a9a }

local MK = require(game:GetService("ReplicatedStorage"):WaitForChild("DK_ModelKendaraan"))

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

local sirene = {} -- { part, merah? }
-- bentuk kendaraan sama dengan game web (ReplicatedStorage.DK_ModelKendaraan, dari js/aset/mobil.js)
local function buatKendaraan(jenis, warna)
	local model, info = MK.buat(jenis, warna)
	for _, s in ipairs(info.sirene) do table.insert(sirene, s) end
	local baju = jenis == "patroli" and rgb(0x8a6a3a) or jenis == "ambulans" and rgb(0xf4f4f4) or rgb(pilih(BAJU))
	MK.sopir(model, jenis, { baju = baju, kulit = rgb(pilih(KULIT)), rambut = rgb(0x1a1410), helm = jenis == "motor" or jenis == "sepeda",
		helmWarna = jenis == "sepeda" and rgb(0xf2c14e) or rgb(0x1d1e24) })
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
