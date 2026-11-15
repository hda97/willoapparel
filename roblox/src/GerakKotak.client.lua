--[[
  GerakKotak (LocalScript) - gerak tokoh kotak seperti di game web (jalanAnim di game.js).
  Tempat: StarterPlayer.StarterPlayerScripts.GerakKotak.

  Animasi bawaan Roblox (Animate) membungkukkan badan, memiringkan kepala, dan menekuk kaki saat diam,
  sehingga tokoh kotak terlihat tidak tegak. Skrip ini mematikan Animate milik tokoh sendiri lalu
  menggerakkan sendi semua tokoh di layar pemain ini:
    - badan dan kepala selalu tegak;
    - diam: kaki dan lengan lurus;
    - jalan: kaki dan lengan berayun (sin, 0,7 rad; lari 1,05 rad), sama seperti web;
    - duduk / naik kendaraan: kaki 1,45 rad ke depan, lengan 1,1 rad ke depan, sama seperti pose naik di web.
  Gerak dihitung dari perpindahan tokoh tiap frame, jadi ikut juga saat tokoh digerakkan skrip (Pelari Kalcer).
]]
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local lokal = Players.LocalPlayer

local PERAN = { LeftHip = "kakiKiri", RightHip = "kakiKanan", LeftShoulder = "lenganKiri", RightShoulder = "lenganKanan" }
local tokoh = {} -- [char] = { sendi = { {obj, putar, peran} }, hum, hrp, pemain, ph, amp, pos, duduk }

local function putaranC0(j)
	local c0 = j:IsA("Motor6D") and j.C0 or (j.Attachment0 and j.Attachment0.CFrame) or CFrame.new()
	return c0 - c0.Position
end

local function daftarkan(char, pemain)
	local hum = char:FindFirstChildOfClass("Humanoid")
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if not hum or not hrp then return end
	local sendi = {}
	for _, j in ipairs(char:GetDescendants()) do
		if j:IsA("Motor6D") or j:IsA("AnimationConstraint") then
			table.insert(sendi, { obj = j, putar = putaranC0(j), peran = PERAN[j.Name] })
		end
	end
	tokoh[char] = { sendi = sendi, hum = hum, hrp = hrp, pemain = pemain, ph = 0, amp = 0, duduk = 0, pos = hrp.Position }
end

-- Animate tokoh sendiri dimatikan dan semua animasinya dihentikan: ayunannya dibuat skrip ini.
-- (Wajah tokoh kotak berupa gambar di kepala, jadi animasi wajah bawaan tidak dibutuhkan.)
local function matikanAnimate(char)
	local skrip = char:WaitForChild("Animate", 10)
	if skrip and skrip:IsA("LocalScript") then skrip.Enabled = false end
	local hum = char:FindFirstChildOfClass("Humanoid")
	local animator = hum and hum:WaitForChild("Animator", 10)
	if not animator then return end
	for _, t in ipairs(animator:GetPlayingAnimationTracks()) do t:Stop(0) end
	animator.AnimationPlayed:Connect(function(t) t:Stop(0) end)
end

local function pantau(pemain)
	local function ada(char)
		task.defer(function()
			char:WaitForChild("HumanoidRootPart", 10)
			char:WaitForChild("Humanoid", 10)
			task.wait(0.5) -- tunggu sendi dibuat ulang setelah tampilan diganti (AvatarKotak)
			if char.Parent then daftarkan(char, pemain) end
			if pemain == lokal then matikanAnimate(char) end
		end)
		-- sendi bisa diganti saat AvatarKotak menerapkan tampilan standar: daftar ulang
		char.DescendantAdded:Connect(function(o)
			if (o:IsA("Motor6D") or o:IsA("AnimationConstraint")) and tokoh[char] then
				task.defer(daftarkan, char, pemain)
			end
		end)
	end
	if pemain.Character then ada(pemain.Character) end
	pemain.CharacterAdded:Connect(ada)
	pemain.CharacterRemoving:Connect(function(char) tokoh[char] = nil end)
end
for _, p in ipairs(Players:GetPlayers()) do pantau(p) end
Players.PlayerAdded:Connect(pantau)

local NOL = CFrame.new()
RunService.PreSimulation:Connect(function(dt)
	if dt <= 0 then return end
	for char, t in pairs(tokoh) do
		if not char.Parent or not t.hrp.Parent then
			tokoh[char] = nil
			continue
		end
		local p = t.hrp.Position
		local geser = Vector3.new(p.X - t.pos.X, 0, p.Z - t.pos.Z).Magnitude / dt
		t.pos = p
		if geser > 200 then geser = 0 end -- pindah tempat (teleport/bus), bukan berjalan

		local naik = t.pemain and (t.pemain:GetAttribute("DK_Naik") or "") ~= ""
		local duduk = t.hum.Sit or naik
		t.duduk += ((duduk and 1 or 0) - t.duduk) * math.min(1, dt * 12)

		local jalan = not duduk and geser > 1.5
		local lari = geser > 24
		local ampTuju = jalan and (lari and 1.05 or 0.7) or 0
		t.amp += (ampTuju - t.amp) * math.min(1, dt * 10)
		if jalan then
			t.ph += dt * (lari and 17 or 11) * math.clamp(geser / 16, 0.6, 1.4)
		elseif t.amp < 0.02 then
			t.ph = 0
		end

		-- sudut web dibalik tandanya: tokoh web menghadap +z, tokoh Roblox menghadap -Z
		local s = math.sin(t.ph) * t.amp
		local sudut = {
			kakiKiri = -s * (1 - t.duduk) + 1.45 * t.duduk,
			kakiKanan = s * (1 - t.duduk) + 1.45 * t.duduk,
			lenganKiri = s * 0.8 * (1 - t.duduk) + 1.1 * t.duduk,
			lenganKanan = -s * 0.8 * (1 - t.duduk) + 1.1 * t.duduk,
		}
		for _, j in ipairs(t.sendi) do
			local o = j.obj
			if o.Parent then
				local a = j.peran and sudut[j.peran] or 0
				o.Transform = (a == 0) and NOL or (j.putar:Inverse() * CFrame.Angles(a, 0, 0) * j.putar)
			end
		end
	end
end)
