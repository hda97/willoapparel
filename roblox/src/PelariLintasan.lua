--[[
  PelariLintasan (ModuleScript, ReplicatedStorage.DK_PelariLintasan) - data Pelari Kalcer, disalin dari
  pelarikalcer-kotak/src/main.js dan lintasan.js game web. Dipakai bersama oleh PelariKalcer.server.lua dan
  PelariKalcer.client.lua supaya jalan, rintangan, dan koin memakai susunan yang sama.

  Hitungan lari memakai satuan game web (jarak d dalam meter, lajur dan tinggi dalam satuan dunia web).
  Ke Roblox: 1 meter lintasan = S stud, lajur dikali XS, tinggi dikali YS. Tiap rute punya titik asal sendiri
  jauh dari dusun (lihat M.asal); pelari berlari ke arah -Z.
]]

local M = {}

M.S, M.XS, M.YS = 2, 1.5625, 1.6
M.FINISH = 1000
M.LAJUR = { -3.2, 0, 3.2 }
M.V_DASAR, M.KALI_SPRINT, M.KALI_WALL, M.BATAS_WALL = 7.6, 1.42, 0.65, 22
M.KURAS, M.KALI_KURAS_SPRINT, M.SKALA_WAKTU = 0.85, 2.3, 3.4
M.WS = { d = 545, buka = 505, tutup = 572 }
M.BONUS_SEPATU = 1 + 8 / 100 * 0.5 -- sepatu awal "Starter Jogger" (pace 8)
M.HEMAT_JAM = 5                    -- jam awal "Basic Fitness Band" (hemat 5%)
-- aturan koin dan rekor (worker.js PK_*)
M.MAKS_LARI, M.MAKS_HARI, M.MIN_LARI, M.KOIN_DETIK = 50, 150, 45, 0.8
M.REKOR_MIN, M.MISI_DESA = 240, 15
M.NAMA_NPC = { "@rakaa_", "@theresiaucy", "@pakguru", "@larisore", "@kopiskena", "@bu.sri", "@adit.tempo", "@nadya.run", "@bayu", "@kakak.pacer", "@dimas_lari", "@salsa.cfd" }
M.RINTANG = { kerucut = true, pembatas = true, lubang = true, batu = true, akar = true, kayu = true }

local function rgb(h) return Color3.fromRGB(bit32.rshift(h, 16), bit32.band(bit32.rshift(h, 8), 255), bit32.band(h, 255)) end

M.RUTE = {
	{ id = "wetan", nama = "CFD Kotak Wetan", jenis = "Desa", sorot = "Keliling desa: sekolah, masjid, warung dan taman kota.", el = 9,
		tanah = rgb(0x8cc46a), jalan = rgb(0x5b5f68), tepi = rgb(0xe9d9b4), rintangan = { "kerucut", "kerucut", "pembatas", "lubang" } },
	{ id = "sudirman", nama = "Jakarta Sudirman CFD", jenis = "Road", sorot = "Jalan kota di antara gedung tinggi.", el = 14,
		tanah = rgb(0x9aa39a), jalan = rgb(0x4a4e57), tepi = rgb(0xc9c4ba), rintangan = { "kerucut", "kerucut", "pembatas", "lubang" } },
	{ id = "borobudur", nama = "Jogja Borobudur", jenis = "Road", sorot = "Paving desa dengan candi di kejauhan.", el = 28,
		tanah = rgb(0x86b85e), jalan = rgb(0x9a8f80), tepi = rgb(0xb8ab94), rintangan = { "kerucut", "pembatas", "lubang", "batu" } },
	{ id = "sanur", nama = "Bali Sanur", jenis = "Road", sorot = "Boardwalk kayu di tepi pantai, berjajar pohon kelapa.", el = 8,
		tanah = rgb(0xe9d6a0), jalan = rgb(0x8a5a34), tepi = rgb(0xecd9a4), rintangan = { "kerucut", "pembatas", "batu" } },
	{ id = "lawu", nama = "Siksorogo Lawu", jenis = "Trail", sorot = "Trail tanah merah di hutan pinus. Awas batu, akar dan kayu!", el = 120, trail = true,
		tanah = rgb(0x4f7a3a), jalan = rgb(0x9a4f2c), tepi = rgb(0x4f8a3a), rintangan = { "batu", "akar", "kayu", "akar" } },
	{ id = "bromo", nama = "Bromo Trail", jenis = "Trail", sorot = "Lautan pasir vulkanik, gunung berasap di depan mata.", el = 95, trail = true,
		tanah = rgb(0x6e665e), jalan = rgb(0x5c5652), tepi = rgb(0x7a736c), rintangan = { "batu", "batu", "kayu", "akar" } },
	{ id = "rinjani", nama = "Dieng & Rinjani", jenis = "Trail", sorot = "Sabana di atas awan.", el = 140, trail = true,
		tanah = rgb(0xa8b85a), jalan = rgb(0x9c7a50), tepi = rgb(0xb4b85e), rintangan = { "batu", "akar", "kayu", "batu" } },
}

function M.asal(n)
	return Vector3.new(30000 + (n - 1) * 1500, 200, 30000)
end

-- (lajur web, tinggi web, jarak meter) -> posisi dunia Roblox; y = 0 di permukaan jalan
function M.dunia(n, x, y, d)
	return M.asal(n) + Vector3.new(x * M.XS, y * M.YS, -d * M.S)
end

-- susunan rintangan, koin, dan bekal di jalan: salinan isiLintasan() dengan pengacak yang sama (benih 7771 + rute * 131)
local simpanan = {}
function M.isi(n)
	if simpanan[n] then return simpanan[n] end
	local R = M.RUTE[n]
	local acak = 7771 + (n - 1) * 131
	local function rnd()
		acak = (acak * 16807) % 2147483647
		return acak / 2147483647
	end
	local function pilih(a) return a[math.floor(rnd() * #a) + 1] end
	local OBJ = {}
	local d = 40
	while d < M.FINISH - 25 do
		if d > M.WS.buka - 10 and d < M.WS.tutup + 10 then
			d = M.WS.tutup + 10
			continue
		end
		local r = rnd()
		local l = math.floor(rnd() * 3)
		if r < 0.42 then
			local jenis = d < 120 and R.rintangan[1] or pilih(R.rintangan)
			table.insert(OBJ, { d = d, lajur = l + 1, jenis = jenis })
			if d > 300 and rnd() < 0.35 then
				local l2 = (l + 1 + math.floor(rnd() * 2)) % 3
				table.insert(OBJ, { d = d, lajur = l2 + 1, jenis = pilih(R.trail and { "batu", "akar" } or { "kerucut", "lubang" }) })
			end
		elseif r < 0.88 then
			local lk = math.floor(rnd() * 3)
			for i = 0, 5 do table.insert(OBJ, { d = d + i * 2.6, lajur = lk + 1, jenis = "koin" }) end
			d += 10
		else
			table.insert(OBJ, { d = d, lajur = l + 1, jenis = pilih({ "petir", "petir", "magnet", "perisai", "hati" }) })
		end
		d += 14 + rnd() * 10
	end
	local koin = 0
	for _, o in ipairs(OBJ) do if o.jenis == "koin" then koin += 1 end end
	simpanan[n] = { obj = OBJ, koin = koin }
	return simpanan[n]
end

return M
