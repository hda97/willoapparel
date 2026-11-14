--[[
  ReliLintasan (ModuleScript, ReplicatedStorage.DK_ReliLintasan) - data 5 lintasan Reli Kotak, disalin dari
  public/duniakotak/reli/reli.js game web. Dipakai bersama oleh ReliKotak.server.lua dan ReliKotak.client.lua
  supaya jalan, gerbang, dan fisika mobil memakai sampel lintasan yang sama.

  Satuan di modul ini meter game web. Di Roblox 1 meter = K stud, dan tiap lintasan punya titik asal sendiri
  jauh dari dusun (lihat M.asal).
]]

local M = {}

M.K = 1.25
M.GERBANG = 20
M.LEBAR = 9
M.SEMAK = M.LEBAR / 2 + 5
M.VMAX, M.VRUMPUT = 34, 17
M.KOIN_FINISH, M.FINISH_BERKOIN = 10, 3
M.MIN_MS = { 33000, 29000, 24000, 27000, 27000 }

local function elips(cx, cz, rx, rz, a0, a1, n, gel)
	local hasil = {}
	for i = 0, n do
		local a = a0 + (a1 - a0) * i / n
		local w = 1 + (gel or 0) * math.sin(a * 5)
		table.insert(hasil, { cx + math.cos(a) * rx * w, cz + math.sin(a) * rz * w })
	end
	return hasil
end

local danau = { { 60, 32 }, { 56, -28 } }
for _, p in ipairs(elips(0, -175, 160, 122, math.pi / 2 - 0.38, math.pi * 2 + 0.15, 30, 0.05)) do table.insert(danau, p) end
table.insert(danau, { 208, -120 })
table.insert(danau, { 262, -112 })

M.LINTASAN = {
	{ nama = "Hutan Pinus", naik = 1, padat = 1, pohon = Color3.fromRGB(46, 110, 62), tanah = Color3.fromRGB(90, 154, 64),
		titik = { { 0, 30 }, { 0, -40 }, { 8, -105 }, { 42, -152 }, { 95, -168 }, { 142, -150 }, { 168, -108 }, { 205, -88 }, { 248, -104 }, { 268, -150 }, { 252, -200 }, { 206, -232 },
			{ 152, -248 }, { 112, -288 }, { 106, -342 }, { 140, -384 }, { 196, -394 }, { 242, -372 }, { 282, -332 }, { 332, -318 }, { 372, -348 }, { 384, -400 }, { 362, -452 }, { 312, -476 }, { 262, -478 } } },
	{ nama = "Sawah Wetan", naik = 0.25, padat = 0.3, pohon = Color3.fromRGB(88, 160, 70), tanah = Color3.fromRGB(126, 184, 72),
		titik = { { 0, 30 }, { 0, -110 }, { 8, -138 }, { 40, -150 }, { 170, -150 }, { 196, -160 }, { 205, -190 }, { 202, -300 }, { 214, -322 }, { 250, -328 }, { 330, -322 }, { 350, -302 },
			{ 352, -205 }, { 362, -182 }, { 418, -176 }, { 440, -192 }, { 446, -262 }, { 442, -390 }, { 424, -412 }, { 380, -420 } } },
	{ nama = "Tepi Danau Tlaga", naik = 0.55, padat = 0.8, pohon = Color3.fromRGB(70, 140, 66), tanah = Color3.fromRGB(96, 160, 70),
		danau = { x = 0, z = -175, rx = 122, rz = 88 }, titik = danau },
	{ nama = "Tanjakan Curug", naik = 2.6, padat = 1.2, pohon = Color3.fromRGB(40, 100, 60), tanah = Color3.fromRGB(84, 146, 62),
		titik = { { 0, 30 }, { 0, -40 }, { 30, -82 }, { 88, -92 }, { 120, -62 }, { 154, -70 }, { 166, -120 }, { 126, -152 }, { 64, -162 }, { 40, -204 }, { 70, -244 }, { 140, -250 },
			{ 192, -232 }, { 224, -262 }, { 212, -314 }, { 152, -334 }, { 100, -364 }, { 110, -414 }, { 170, -434 }, { 242, -424 } } },
	{ nama = "Pantai Segara", naik = 0.4, padat = 0.6, pohon = Color3.fromRGB(80, 150, 70), tanah = Color3.fromRGB(226, 204, 150),
		titik = { { 150, 30 }, { 150, -40 }, { 170, -90 }, { 210, -122 }, { 215, -172 }, { 180, -212 }, { 140, -232 }, { 150, -282 }, { 200, -312 }, { 222, -362 }, { 200, -412 },
			{ 150, -432 }, { 130, -482 }, { 160, -532 }, { 206, -560 }, { 214, -604 }, { 182, -644 }, { 152, -692 }, { 168, -742 }, { 212, -772 }, { 222, -822 } } },
}

function M.asal(n)
	return Vector3.new(20000 + (n - 1) * 2500, 200, 20000)
end

-- Catmull-Rom centripetal (sama dengan THREE.CatmullRomCurve3 tak tertutup)
local function koef(x0, x1, x2, x3, dt0, dt1, dt2)
	local t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1
	local t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2
	t1 = t1 * dt1
	t2 = t2 * dt1
	return x1, t1, -3 * x1 + 3 * x2 - 2 * t1 - t2, 2 * x1 - 2 * x2 + t1 + t2
end

local function kurva(titik)
	local n = #titik
	local rapat = {} -- titik rapat sepanjang kurva
	for seg = 1, n - 1 do
		local p1, p2 = titik[seg], titik[seg + 1]
		local p0 = titik[seg - 1] or { 2 * p1[1] - p2[1], 2 * p1[2] - p2[2] }
		local p3 = titik[seg + 2] or { 2 * p2[1] - p1[1], 2 * p2[2] - p1[2] }
		local function jarak(a, b) return ((a[1] - b[1]) ^ 2 + (a[2] - b[2]) ^ 2) ^ 0.25 end
		local dt0, dt1, dt2 = jarak(p0, p1), jarak(p1, p2), jarak(p2, p3)
		if dt1 < 1e-4 then dt1 = 1 end
		if dt0 < 1e-4 then dt0 = dt1 end
		if dt2 < 1e-4 then dt2 = dt1 end
		local ax, bx, cx, dx = koef(p0[1], p1[1], p2[1], p3[1], dt0, dt1, dt2)
		local az, bz, cz, dz = koef(p0[2], p1[2], p2[2], p3[2], dt0, dt1, dt2)
		local langkah = 48
		for i = (seg == 1 and 0 or 1), langkah do
			local t = i / langkah
			table.insert(rapat, { ax + bx * t + cx * t * t + dx * t * t * t, az + bz * t + cz * t * t + dz * t * t * t })
		end
	end
	return rapat
end

local simpanan = {}

-- Sampel lintasan tiap ±2 m: { x, z, y, tx, tz, nx, nz, s, k, bk }, daftar indeks gerbang, dan indeks start
function M.buat(n)
	if simpanan[n] then return simpanan[n] end
	local LT = M.LINTASAN[n]
	local rapat = kurva(LT.titik)
	local kum = { 0 }
	for i = 2, #rapat do
		kum[i] = kum[i - 1] + math.sqrt((rapat[i][1] - rapat[i - 1][1]) ^ 2 + (rapat[i][2] - rapat[i - 1][2]) ^ 2)
	end
	local PANJANG = kum[#kum]
	local NS = math.floor(PANJANG / 2 + 0.5)
	local ds = PANJANG / NS
	local T = {}
	local j = 1
	local function di(s)
		while j < #rapat - 1 and kum[j + 1] < s do j += 1 end
		local a, b = rapat[j], rapat[j + 1]
		local f = (s - kum[j]) / math.max(1e-6, kum[j + 1] - kum[j])
		return a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f
	end
	for i = 0, NS do
		local s = i * ds
		local x, z = di(math.min(PANJANG, s))
		local y = LT.naik * (3.2 * math.sin(s / 95) + 1.6 * math.sin(s / 41 + 1.3) - 1.6 * math.sin(1.3))
		T[i] = { x = x, z = z, y = y, s = s, k = 0, bk = 0 }
	end
	for i = 0, NS do
		local a, b = T[math.max(0, i - 1)], T[math.min(NS, i + 1)]
		local dx, dz = b.x - a.x, b.z - a.z
		local p = math.sqrt(dx * dx + dz * dz)
		local q = T[i]
		q.tx, q.tz = dx / p, dz / p
		q.nx, q.nz = -q.tz, q.tx
	end
	for i = 0, NS do
		local a, b = T[math.max(0, i - 2)], T[math.min(NS, i + 2)]
		T[i].k0 = (a.tz * b.tx - a.tx * b.tz) / (4 * ds)
	end
	for i = 0, NS do
		local jml, c = 0, 0
		for d = -6, 6 do
			local q = T[i + d]
			if q then
				jml += q.k0
				c += 1
			end
		end
		T[i].k = jml / c
		T[i].bk = math.clamp(-T[i].k * 7, -0.2, 0.2)
	end
	local IG = {}
	for g = 1, M.GERBANG do
		IG[g] = math.min(NS - 4, math.floor((40 + (PANJANG - 70 - 40) * g / M.GERBANG) / ds + 0.5))
	end
	local hasil = { T = T, NS = NS, ds = ds, PANJANG = PANJANG, IG = IG, START = math.floor(30 / ds + 0.5), data = LT }
	simpanan[n] = hasil
	return hasil
end

function M.yJalan(L, i, d)
	local q = L.T[i]
	local dd = math.clamp(d, -M.LEBAR / 2 - 1, M.LEBAR / 2 + 1)
	return q.y + dd * q.bk - math.max(0, math.abs(d) - M.LEBAR / 2 - 1) * 0.06
end

-- proyeksi posisi ke lintasan, dicari di sekitar indeks terakhir
function M.proyeksi(L, x, z, ih, jang)
	local T = L.T
	local bi, bd = ih, math.huge
	for i = math.max(0, ih - jang), math.min(L.NS, ih + jang) do
		local q = T[i]
		local d = (x - q.x) ^ 2 + (z - q.z) ^ 2
		if d < bd then bd = d bi = i end
	end
	local q = T[bi]
	return bi, (x - q.x) * q.nx + (z - q.z) * q.nz
end

-- meter lintasan -> posisi dunia Roblox
function M.dunia(n, x, y, z)
	return M.asal(n) + Vector3.new(x, y, z) * M.K
end

return M
