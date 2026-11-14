--[[
  RumahWarga (Script) - tautkan akun Roblox ke warga game web, lalu pemain punya rumah yang sama dengan di web.
  Tempat: ServerScriptService.RumahWarga. Butuh ServerStorage.DK_Kavling (ModuleScript, dari roblox/src/Kavling.lua).

  Alur (pilihan Huda 13-14 Nov 2026): di game web warga menekan "Tautkan Roblox" dan mendapat kode 6 huruf
  (sekali pakai, 10 menit). Kode diketik di sini, server Roblox menukarnya ke Worker dengan nomor warga, nama, dusun.
  Yang pindah HANYA nomor warga, nama, dan dusun. Koin web dan koin Roblox tetap terpisah.
  Bonus sekali klaim saat menautkan: BONUS_KOIN koin + label "Warga Lama".

  Simpanan: DataStore DuniaKotak_Taut_v1, kunci p_<UserId> = { no, nama, dusun, bonus }.
  Atribut pemain: DK_No, DK_Nama, DK_DusunRumah, DK_Label.
  Pintu klien: ReplicatedStorage.DK_Rumah (RemoteFunction): "info" | "taut", kode | "pulang".
  Catatan: perlu "Allow HTTP Requests" menyala di Game Settings > Security.
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local HttpService = game:GetService("HttpService")
local DataStoreService = game:GetService("DataStoreService")

local ALAMAT = {
	"https://willoapparel.com/duniakotak/api/roblox-taut",
	"https://willoapparel.wjzyy9fpzd.workers.dev/duniakotak/api/roblox-taut",
}
local BONUS_KOIN = 50
local JEDA_TAUT = 5 -- detik antara dua percobaan kode
local GESER_BAWAAN = { wetan = Vector3.zero, kulon = Vector3.new(-10000, 0, 0), curug = Vector3.new(0, 0, -10000), tlaga = Vector3.new(0, 0, 10000) }

local Kavling = require(ServerStorage:WaitForChild("DK_Kavling"))

local store
do
	local ok, s = pcall(function() return DataStoreService:GetDataStore("DuniaKotak_Taut_v1") end)
	if ok then store = s else warn("[RumahWarga] DataStore tidak tersedia: " .. tostring(s)) end
end

local lama = ReplicatedStorage:FindFirstChild("DK_Rumah")
if lama then lama:Destroy() end
local pintu = Instance.new("RemoteFunction")
pintu.Name = "DK_Rumah"
pintu.Parent = ReplicatedStorage

local papanLama = workspace:FindFirstChild("DK_PapanRumah")
if papanLama then papanLama:Destroy() end
local folderPapan = Instance.new("Folder")
folderPapan.Name = "DK_PapanRumah"
folderPapan.Parent = workspace

local taut = {} -- [player] = { no, nama, dusun, bonus }
local terakhir = {}

local function dusunNo(no)
	return no > 860 and "segara" or no > 660 and "tlaga" or no > 460 and "curug" or no > 260 and "kulon" or "wetan"
end

-- titik depan pagar rumah warga No. `no` di dunia Roblox (nil kalau dusunnya belum dibangun)
local function titikRumah(no)
	local d = dusunNo(no)
	local k = Kavling[d] and Kavling[d][no]
	local akar = workspace:FindFirstChild("DuniaKotak3")
	local f = akar and akar:FindFirstChild(d)
	if not k or not f then return nil end
	local geser = f:GetAttribute("geser")
	if typeof(geser) ~= "Vector3" then geser = GESER_BAWAAN[d] or Vector3.zero end
	-- k = { gx, gy, gz, dir }: berdiri sedikit di luar pagar, menghadap rumah
	local p = geser + Vector3.new(k[1], k[2] + 3, k[3] + k[4] * 1.6)
	return p, geser + Vector3.new(k[1], k[2] + 3, k[3] - k[4] * 10)
end

local function pasangPapan(player)
	local lamaP = folderPapan:FindFirstChild("p_" .. player.UserId)
	if lamaP then lamaP:Destroy() end
	local t = taut[player]
	if not t then return end
	local p = titikRumah(t.no)
	if not p then return end
	local part = Instance.new("Part")
	part.Name = "p_" .. player.UserId
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.Transparency = 1
	part.Size = Vector3.new(1, 1, 1)
	part.CFrame = CFrame.new(p + Vector3.new(0, 4, 0))
	local g = Instance.new("BillboardGui")
	g.Size = UDim2.fromOffset(190, 30)
	g.MaxDistance = 70
	g.AlwaysOnTop = false
	local l = Instance.new("TextLabel")
	l.Size = UDim2.fromScale(1, 1)
	l.BackgroundColor3 = Color3.fromRGB(29, 29, 34)
	l.BackgroundTransparency = 0.2
	l.TextColor3 = Color3.new(1, 1, 1)
	l.FontFace = Font.new("rbxasset://fonts/families/Montserrat.json", Enum.FontWeight.Bold)
	l.TextSize = 14
	l.TextTruncate = Enum.TextTruncate.AtEnd
	l.Text = "Rumah " .. t.nama .. " · No. " .. t.no
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, 8)
	c.Parent = l
	l.Parent = g
	g.Parent = part
	part.Parent = folderPapan
end

local function terapkan(player, t)
	taut[player] = t
	player:SetAttribute("DK_No", t.no)
	player:SetAttribute("DK_Nama", t.nama)
	player:SetAttribute("DK_DusunRumah", t.dusun)
	player:SetAttribute("DK_Label", "Warga Lama")
	pasangPapan(player)
end

local function simpan(player)
	local t = taut[player]
	if not store or not t then return false end
	local ok = pcall(function() store:SetAsync("p_" .. player.UserId, t) end)
	return ok
end

local function pulang(player)
	local t = taut[player]
	if not t then return { ok = false, pesan = "Tautkan dulu akun web-mu." } end
	local p, hadap = titikRumah(t.no)
	if not p then return { ok = false, pesan = "Dusun rumahmu belum dibangun di Roblox." } end
	local c = player.Character
	local hrp = c and c:FindFirstChild("HumanoidRootPart")
	if not hrp then return { ok = false, pesan = "Tokohmu belum siap." } end
	local hum = c:FindFirstChildOfClass("Humanoid")
	if hum and hum.SeatPart then
		hum.Sit = false
		task.wait(0.1)
	end
	pcall(function() player:RequestStreamAroundAsync(p, 5) end)
	hrp.AssemblyLinearVelocity = Vector3.zero
	c:PivotTo(CFrame.lookAt(p, Vector3.new(hadap.X, p.Y, hadap.Z)))
	player:SetAttribute("DK_Dusun", t.dusun)
	return { ok = true, no = t.no }
end

-- tukar kode ke Worker; mengembalikan (data) atau (nil, pesan)
local function tukar(player, kode)
	local isi = HttpService:JSONEncode({ rb = tostring(player.UserId), kode = kode })
	local pesan = "Desa web belum bisa dihubungi. Coba lagi nanti."
	for _, url in ipairs(ALAMAT) do
		local ok, r = pcall(function()
			return HttpService:RequestAsync({ Url = url, Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = isi })
		end)
		if ok and r then
			local okJ, j = pcall(function() return HttpService:JSONDecode(r.Body) end)
			if okJ and typeof(j) == "table" then
				if r.Success and tonumber(j.no) then return j end
				if j.galat then return nil, tostring(j.galat) end
			end
		elseif not ok then
			warn("[RumahWarga] " .. tostring(r))
		end
	end
	return nil, pesan
end

local function tautkan(player, kode)
	if taut[player] then return { ok = false, pesan = "Akunmu sudah tertaut ke warga No. " .. taut[player].no .. "." } end
	if typeof(kode) ~= "string" then return { ok = false, pesan = "Kode harus 6 huruf." } end
	kode = kode:upper():gsub("[^A-Z]", "")
	if #kode ~= 6 then return { ok = false, pesan = "Kode harus 6 huruf." } end
	local kini = os.clock()
	if terakhir[player] and kini - terakhir[player] < JEDA_TAUT then
		return { ok = false, pesan = "Tunggu sebentar sebelum mencoba lagi." }
	end
	terakhir[player] = kini
	local j, pesan = tukar(player, kode)
	if not j then return { ok = false, pesan = pesan } end
	local no = math.floor(tonumber(j.no))
	local t = { no = no, nama = tostring(j.nama or ""):sub(1, 30), dusun = dusunNo(no), bonus = false }
	if t.nama == "" then t.nama = "Warga No. " .. no end
	terapkan(player, t)
	local dk = ServerStorage:FindFirstChild("DK_Koin")
	local okB, hasil = pcall(function() return dk and dk:Invoke(player, BONUS_KOIN) end)
	if okB and hasil == true then t.bonus = true end
	simpan(player)
	return { ok = true, no = t.no, nama = t.nama, dusun = t.dusun, bonus = t.bonus and BONUS_KOIN or 0, adaRumah = titikRumah(t.no) ~= nil }
end

pintu.OnServerInvoke = function(player, aksi, nilai)
	local ok, hasil
	if aksi == "taut" then
		ok, hasil = pcall(tautkan, player, nilai)
	elseif aksi == "pulang" then
		ok, hasil = pcall(pulang, player)
	else
		local t = taut[player]
		return { tertaut = t ~= nil, no = t and t.no, nama = t and t.nama, dusun = t and t.dusun, adaRumah = t ~= nil and titikRumah(t.no) ~= nil }
	end
	if ok then return hasil end
	warn("[RumahWarga] " .. tostring(hasil))
	return { ok = false, pesan = "Ada gangguan, coba lagi." }
end

local function masuk(player)
	if not store then return end
	local ok, t = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
	if ok and typeof(t) == "table" and tonumber(t.no) and player.Parent then
		t.no = math.floor(tonumber(t.no))
		t.nama = tostring(t.nama or ("Warga No. " .. t.no))
		t.dusun = dusunNo(t.no)
		terapkan(player, t)
	end
end

Players.PlayerAdded:Connect(masuk)
for _, p in ipairs(Players:GetPlayers()) do
	task.spawn(masuk, p)
end
Players.PlayerRemoving:Connect(function(player)
	local p = folderPapan:FindFirstChild("p_" .. player.UserId)
	if p then p:Destroy() end
	taut[player] = nil
	terakhir[player] = nil
end)
