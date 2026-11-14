--[[
  TamanHiburan (LocalScript) - memutar Bianglala dan Komidi Putar di layar pemain.
  Tempat: StarterPlayer.StarterPlayerScripts.TamanHiburan.
  Pasangannya: ServerScriptService.TamanHiburan (membuat workspace.DK_Wahana berisi titik pusat wahana).

  Wahana di map adalah balok diam. Skrip ini mengumpulkan balok roda bianglala dan komidi putar di sekitar titik pusatnya,
  lalu memutarnya dengan sudut = kecepatan x jam server, sama dengan rumus server untuk penumpang.
  Kabin bianglala hanya digeser (tetap tegak), seperti di game web. Hanya jalan saat pemain berada di dekat taman.
]]
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local folder = workspace:WaitForChild("DK_Wahana", 60)
if not folder then return end

local S = 6.25
local pusatB, pusatK = folder:GetAttribute("bianglala"), folder:GetAttribute("komidi")
local lajuB, lajuK = folder:GetAttribute("lajuBianglala") or 0.25, folder:GetAttribute("lajuKomidi") or 0.5
local jariB = folder:GetAttribute("jariBianglala") or 26.25
if typeof(pusatB) ~= "Vector3" or typeof(pusatK) ~= "Vector3" then return end

local JAUH = 450 -- di luar jarak ini wahana tidak diputar
local roda, komidi = {}, {} -- [part] = { rel = CFrame terhadap pusat (letak asli), tegak = kabin }
local jumlahB, jumlahK = 0, 0

local function kumpulkan()
	local akar = workspace:FindFirstChild("DuniaKotak3")
	local dusun = akar and akar:FindFirstChild("tlaga")
	if not dusun then return end
	local op = OverlapParams.new()
	op.FilterType = Enum.RaycastFilterType.Include
	op.FilterDescendantsInstances = { dusun }
	-- roda bianglala: balok yang pusatnya di bidang roda (kaki penyangga pusatnya 5,9 stud di depan/belakang bidang itu)
	for _, part in ipairs(workspace:GetPartBoundsInBox(CFrame.new(pusatB), Vector3.new(jariB * 2 + 16, jariB * 2 + 16, 7), op)) do
		if not roda[part] then
			local rel = part.Position - pusatB
			if math.abs(rel.Z) < 3.5 and Vector2.new(rel.X, rel.Y).Magnitude < jariB + 8 then
				local sz = part.Size
				local kabin = math.abs(sz.X - S) < 0.4 and math.abs(sz.Y - S) < 0.4 and math.abs(sz.Z - S) < 0.4
				roda[part] = { rel = CFrame.new(-pusatB) * part.CFrame, tegak = kabin }
				jumlahB += 1
			end
		end
	end
	-- komidi putar: semua balok dalam jari-jari atapnya (3,7 satuan) dari tiang tengah
	for _, part in ipairs(workspace:GetPartBoundsInBox(CFrame.new(pusatK + Vector3.new(0, 20, 0)), Vector3.new(48, 44, 48), op)) do
		if not komidi[part] then
			local rel = part.Position - pusatK
			if Vector2.new(rel.X, rel.Z).Magnitude < 3.7 * S and rel.Y > 0.8 then
				komidi[part] = { rel = CFrame.new(-pusatK) * part.CFrame }
				jumlahK += 1
			end
		end
	end
end

local bagian, letak = {}, {}
local cari = 0
RunService.RenderStepped:Connect(function(dt)
	local kamera = workspace.CurrentCamera
	if not kamera or (kamera.CFrame.Position - pusatB).Magnitude > JAUH then return end
	cari -= dt
	if cari <= 0 then
		cari = 4 -- map bisa dimuat bertahap: cari balok baru tiap 4 detik
		kumpulkan()
	end
	local t = workspace:GetServerTimeNow()
	local putaran = math.pi * 2 -- sudut dibungkus: CFrame.Angles kehilangan ketelitian untuk sudut besar
	local putarB, putarK = CFrame.Angles(0, 0, (lajuB * t) % putaran), CFrame.Angles(0, ((lajuK * t) % putaran), 0)
	table.clear(bagian)
	table.clear(letak)
	local n = 0
	for part, d in pairs(roda) do
		if part.Parent then
			n += 1
			bagian[n] = part
			if d.tegak then
				letak[n] = d.rel.Rotation + (pusatB + putarB * d.rel.Position)
			else
				letak[n] = CFrame.new(pusatB) * putarB * d.rel
			end
		else
			roda[part] = nil
		end
	end
	for part, d in pairs(komidi) do
		if part.Parent then
			n += 1
			bagian[n] = part
			letak[n] = CFrame.new(pusatK) * putarK * d.rel
		else
			komidi[part] = nil
		end
	end
	if n > 0 then workspace:BulkMoveTo(bagian, letak, Enum.BulkMoveMode.FireCFrameChanged) end
end)

-- saat naik wahana, tombol lompat tidak menurunkan penumpang
player:GetAttributeChangedSignal("DK_Wahana"):Connect(function()
	local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
	if hum then hum:SetStateEnabled(Enum.HumanoidStateType.Jumping, (player:GetAttribute("DK_Wahana") or "") == "") end
end)
