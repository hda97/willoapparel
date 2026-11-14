--[[
  BatuNama (Script) - tulisan nama pemilik di batu nama depan tiap rumah warga, seperti di game web.
  Tempat: ServerScriptService.BatuNama. Butuh ServerStorage.DK_Kavling (roblox/src/Kavling.lua).

  Batu nama sudah ada di map sebagai balok abu polos (ukuran 8,75 x 7,19 x 2,81 stud). Skrip ini mencari balok itu
  di depan tiap rumah dan menempelkan tulisan "nama" + "No. N" di sisi yang menghadap jalan.
  Daftar nama diambil dari daftar warga publik game web (HttpService), diperbarui tiap 15 menit.
  Nama dilewatkan saringan teks Roblox dulu; kalau saringan gagal, yang tampil hanya nomor rumah.
  Tanda "@" tidak ditampilkan supaya tidak dibaca sebagai akun media sosial (aturan Roblox).
]]
local HttpService = game:GetService("HttpService")
local ServerStorage = game:GetService("ServerStorage")
local TextService = game:GetService("TextService")

local ALAMAT = {
	"https://willoapparel.com/duniakotak/api/warga",
	"https://willoapparel.wjzyy9fpzd.workers.dev/duniakotak/api/warga",
}
local JEDA_SEGAR = 15 * 60
local UKURAN = Vector3.new(8.75, 7.19, 2.81)
local GESER_BAWAAN = { wetan = Vector3.zero, kulon = Vector3.new(-10000, 0, 0), curug = Vector3.new(0, 0, -10000), tlaga = Vector3.new(0, 0, 10000) }
local TEBAL = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Heavy)

local Kavling = require(ServerStorage:WaitForChild("DK_Kavling"))

local terpasang = {} -- [no] = { gui, nama }
local saring = {} -- [nama asli] = nama tersaring (atau false)

local function ambilWarga()
	for _, url in ipairs(ALAMAT) do
		local ok, isi = pcall(function() return HttpService:GetAsync(url, true) end)
		if ok then
			local okJ, j = pcall(function() return HttpService:JSONDecode(isi) end)
			if okJ and typeof(j) == "table" and typeof(j.warga) == "table" then return j.warga end
		else
			warn("[BatuNama] " .. tostring(isi))
		end
	end
	return nil
end

local function tersaring(nama)
	if saring[nama] ~= nil then return saring[nama] end
	local hasil = false
	local ok, err = pcall(function()
		local f = TextService:FilterStringAsync(nama, game.CreatorId)
		hasil = f:GetNonChatStringForBroadcastAsync()
	end)
	if not ok then
		warn("[BatuNama] saringan teks gagal: " .. tostring(err))
		hasil = false
	elseif typeof(hasil) ~= "string" or hasil:find("#", 1, true) then
		hasil = false
	end
	saring[nama] = hasil
	return hasil
end

-- balok batu nama di depan rumah (nil kalau rumahnya belum ada di map)
local function cariBatu(dusun, k)
	local akar = workspace:FindFirstChild("DuniaKotak3")
	local f = akar and akar:FindFirstChild(dusun)
	if not f then return nil end
	local geser = f:GetAttribute("geser")
	if typeof(geser) ~= "Vector3" then geser = GESER_BAWAAN[dusun] or Vector3.zero end
	-- k = { gx, gy, gz, dir, cx, cy, cz }: batu ada di tengah kavling + (1,25 x arah; 3,63; 25 x arah)
	local dir = k[4]
	local p = geser + Vector3.new(k[5] + 1.25 * dir, k[6] + 3.63, k[7] + 25 * dir)
	local op = OverlapParams.new()
	op.FilterType = Enum.RaycastFilterType.Include
	op.FilterDescendantsInstances = { f }
	local terbaik, jarak = nil, 1.5
	for _, part in ipairs(workspace:GetPartBoundsInRadius(p, 1.5, op)) do
		if (part.Size - UKURAN).Magnitude < 0.4 then
			local j = (part.Position - p).Magnitude
			if j < jarak then terbaik, jarak = part, j end
		end
	end
	return terbaik, dir
end

local function tulis(no, nama, batu, dir)
	local t = terpasang[no]
	if t and t.gui.Parent and t.nama == nama then return end
	if t and t.gui then t.gui:Destroy() end
	local g = Instance.new("SurfaceGui")
	g.Name = "DK_Nama"
	g.Face = dir == 1 and Enum.NormalId.Back or Enum.NormalId.Front
	g.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	g.PixelsPerStud = 40
	g.LightInfluence = 1
	g.MaxDistance = 140
	local a = Instance.new("TextLabel")
	a.BackgroundTransparency = 1
	a.Position = UDim2.fromScale(0.06, 0.1)
	a.Size = UDim2.fromScale(0.88, 0.45)
	a.FontFace = TEBAL
	a.TextScaled = true
	a.TextColor3 = Color3.fromRGB(38, 38, 44)
	a.Text = nama ~= "" and nama or "Warga"
	a.Parent = g
	local b = Instance.new("TextLabel")
	b.BackgroundTransparency = 1
	b.Position = UDim2.fromScale(0.2, 0.6)
	b.Size = UDim2.fromScale(0.6, 0.28)
	b.FontFace = TEBAL
	b.TextScaled = true
	b.TextColor3 = Color3.fromRGB(70, 70, 78)
	b.Text = "No. " .. no
	b.Parent = g
	g.Parent = batu
	terpasang[no] = { gui = g, nama = nama }
end

local function dusunNo(no)
	return no > 860 and "segara" or no > 660 and "tlaga" or no > 460 and "curug" or no > 260 and "kulon" or "wetan"
end

local function segarkan()
	local warga = ambilWarga()
	if not warga then return false end
	local n = 0
	for _, w in ipairs(warga) do
		local no = tonumber(w.no)
		local asli = no == 1 and "raka" or tostring(w.ig or "") ~= "" and tostring(w.ig) or tostring(w.tiktok or "")
		if no and asli ~= "" then
			local d = dusunNo(no)
			local k = Kavling[d] and Kavling[d][no]
			if k and k[5] then
				local lamaT = terpasang[no]
				if not (lamaT and lamaT.gui.Parent and lamaT.asli == asli) then
					local batu, dir = cariBatu(d, k)
					if batu then
						local nama = tersaring(asli) or ""
						tulis(no, nama, batu, dir)
						terpasang[no].asli = asli
						n += 1
						if n % 15 == 0 then task.wait(0.5) end -- jangan memborong kuota saringan teks
					end
				end
			end
		end
	end
	print("[BatuNama] batu nama ditulis: " .. n)
	return true
end

task.spawn(function()
	task.wait(3) -- beri waktu map selesai dimuat
	while true do
		local ok, hasil = pcall(segarkan)
		if not ok then warn("[BatuNama] " .. tostring(hasil)) end
		task.wait((ok and hasil) and JEDA_SEGAR or 60)
	end
end)
