--[[
  BusDusun (Script) - bus antardusun, salinan aturan game web (game.js: TARIF_BUS, naikBus).
  Tempat: ServerScriptService.BusDusun.

  Aturan (sama dengan web):
    - Tiket 5 koin sekali jalan, dipotong di server.
    - Koin kurang dari 5: tetap boleh naik, gratis.
    - Dusun Kotak Segara masih terkunci.
  Titik turun: atribut "muncul" di workspace.DuniaKotak3.<dusun> (diisi alat/pasang_dusun.lua).
  Wetan dipasang lebih dulu tanpa atribut, jadi titiknya ditulis di sini.

  Pintu untuk klien: ReplicatedStorage.DK_Bus (RemoteFunction).
    DK_Bus:InvokeServer("daftar")      -> { di = "wetan", tarif = 5, koin = 40, dusun = { {k=..., ada=true}, ... } }
    DK_Bus:InvokeServer("naik", "kulon") -> { ok = true, bayar = 5, koin = 35 } atau { ok = false, pesan = "..." }
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")

local TARIF_BUS = 5
local URUT = { "wetan", "kulon", "curug", "tlaga", "segara" }
local MUNCUL_WETAN = Vector3.new(-284.38, 3, -1057.5)
local JEDA = 3 -- detik antara dua kali naik bus

local lama = ReplicatedStorage:FindFirstChild("DK_Bus")
if lama then lama:Destroy() end
local pintu = Instance.new("RemoteFunction")
pintu.Name = "DK_Bus"
pintu.Parent = ReplicatedStorage

local function titik(nama)
	local akar = workspace:FindFirstChild("DuniaKotak3")
	local f = akar and akar:FindFirstChild(nama)
	if not f then return nil end
	local m = f:GetAttribute("muncul")
	if typeof(m) == "Vector3" then return m end
	if nama == "wetan" then return MUNCUL_WETAN end
	return nil
end

local function akarTokoh(player)
	local c = player.Character
	return c and c:FindFirstChild("HumanoidRootPart")
end

-- dusun tempat pemain berdiri = titik turun yang paling dekat
local function dusunPemain(player)
	local hrp = akarTokoh(player)
	if not hrp then return nil end
	local dekat, jarak = nil, math.huge
	for _, k in ipairs(URUT) do
		local t = titik(k)
		if t then
			local j = (Vector3.new(t.X, 0, t.Z) - Vector3.new(hrp.Position.X, 0, hrp.Position.Z)).Magnitude
			if j < jarak then dekat, jarak = k, j end
		end
	end
	return dekat
end

local function koinPemain(player)
	local ls = player:FindFirstChild("leaderstats")
	local k = ls and ls:FindFirstChild("Koin")
	return k and k.Value or 0
end

local terakhir = {}

local function naik(player, ke)
	if typeof(ke) ~= "string" then return { ok = false, pesan = "Dusun tidak dikenal." } end
	if ke == "segara" and not titik("segara") then
		return { ok = false, pesan = "Dusun Kotak Segara masih terkunci." }
	end
	local tujuan = titik(ke)
	if not tujuan then return { ok = false, pesan = "Dusun itu belum dibangun." } end
	if dusunPemain(player) == ke then return { ok = false, pesan = "Kamu sudah di dusun ini." } end
	local hrp = akarTokoh(player)
	if not hrp then return { ok = false, pesan = "Tokohmu belum siap." } end
	local kini = os.clock()
	if terakhir[player] and kini - terakhir[player] < JEDA then
		return { ok = false, pesan = "Bus baru saja jalan, tunggu sebentar." }
	end
	terakhir[player] = kini

	-- turun dari kursi dulu supaya kendaraan tidak ikut terbawa
	local hum = player.Character:FindFirstChildOfClass("Humanoid")
	if hum and hum.SeatPart then
		hum.Sit = false
		task.wait(0.1)
	end

	local bayar = 0
	if koinPemain(player) >= TARIF_BUS then
		local dk = ServerStorage:FindFirstChild("DK_Koin")
		local ok, hasil = pcall(function() return dk and dk:Invoke(player, -TARIF_BUS) end)
		if ok and hasil == true then bayar = TARIF_BUS end
	end

	pcall(function() player:RequestStreamAroundAsync(tujuan, 5) end)
	hrp = akarTokoh(player)
	if not hrp then return { ok = false, pesan = "Tokohmu belum siap." } end
	hrp.AssemblyLinearVelocity = Vector3.zero
	player.Character:PivotTo(CFrame.new(tujuan + Vector3.new(0, 2, 0)))
	player:SetAttribute("DK_Dusun", ke)
	return { ok = true, bayar = bayar, koin = koinPemain(player), ke = ke }
end

pintu.OnServerInvoke = function(player, aksi, ke)
	if aksi == "naik" then
		local ok, hasil = pcall(naik, player, ke)
		if ok then return hasil end
		warn("[BusDusun] " .. tostring(hasil))
		return { ok = false, pesan = "Bus mogok, coba lagi." }
	end
	local daftar = {}
	for _, k in ipairs(URUT) do
		table.insert(daftar, { k = k, ada = titik(k) ~= nil })
	end
	return { di = dusunPemain(player), tarif = TARIF_BUS, koin = koinPemain(player), dusun = daftar }
end

Players.PlayerRemoving:Connect(function(player)
	terakhir[player] = nil
end)
