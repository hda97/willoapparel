-- Pasang satu dusun tambahan ke place yang sudah berisi Kotak Wetan, digeser supaya tidak menumpuk.
-- Pakai dari Command Bar Studio:
--   local H=game:GetService("HttpService") H.HttpEnabled=true loadstring(H:GetAsync("https://raw.githubusercontent.com/hda97/willoapparel/<commit>/roblox/alat/pasang_dusun.lua"))("kulon", Vector3.new(-10000,0,0), "<commit>")
-- Tidak mengubah titik muncul, lampu, atau dusun lain. Titik turun bus disimpan di atribut folder ("muncul").
local nama, geser, commit = ...
local H = game:GetService("HttpService")
local dulu = H.HttpEnabled
H.HttpEnabled = true
local URL = "https://raw.githubusercontent.com/hda97/willoapparel/" .. commit .. "/roblox/data/"
local hint = workspace:FindFirstChild("InfoUji") or Instance.new("Hint", workspace)
hint.Name = "InfoUji"
local ok, err = pcall(function()
	local info = H:JSONDecode(H:GetAsync(URL .. nama .. ".json"))
	local root = workspace:FindFirstChild("DuniaKotak3") or Instance.new("Folder", workspace)
	root.Name = "DuniaKotak3"
	local old = root:FindFirstChild(nama)
	if old then old:Destroy() end
	local F = Instance.new("Folder")
	F.Name = nama
	local total = 0
	local G = CFrame.new(geser)
	for i = 0, info.berkas - 1 do
		local d = H:GetAsync(URL .. string.format("%s-%03d.txt", nama, i))
		local M = Instance.new("Folder")
		M.Name = string.format("b%03d", i)
		for line in string.gmatch(d, "[^\n]+") do
			local t = string.split(line, " ")
			local f = tonumber(t[8])
			local p = Instance.new(bit32.band(f, 8) ~= 0 and "WedgePart" or "Part")
			if bit32.band(f, 16) ~= 0 then p.Shape = Enum.PartType.Cylinder elseif bit32.band(f, 32) ~= 0 then p.Shape = Enum.PartType.Ball end
			p.Anchored = true
			p.Material = Enum.Material.SmoothPlastic
			p.TopSurface = Enum.SurfaceType.Smooth
			p.BottomSurface = Enum.SurfaceType.Smooth
			p.Size = Vector3.new(t[4] / 100, t[5] / 100, t[6] / 100)
			p.Color = Color3.fromHex(t[7])
			if bit32.band(f, 1) ~= 0 then p.CanCollide = false p.CanTouch = false p.CanQuery = false end
			if bit32.band(f, 2) ~= 0 then p.Transparency = 0.45 end
			if bit32.band(f, 4) ~= 0 then p.CastShadow = false end
			if t[9] then
				p.CFrame = G * CFrame.new(t[1] / 100, t[2] / 100, t[3] / 100, t[9] / 1000, t[10] / 1000, t[11] / 1000, t[12] / 1000, t[13] / 1000, t[14] / 1000, t[15] / 1000, t[16] / 1000, t[17] / 1000)
			else
				p.CFrame = G * CFrame.new(t[1] / 100, t[2] / 100, t[3] / 100)
			end
			p.Parent = M
			total += 1
		end
		M.Parent = F
		hint.Text = "PASANG " .. nama .. " berkas " .. (i + 1) .. "/" .. info.berkas .. " part " .. total
		task.wait(0.1)
	end
	F:SetAttribute("muncul", geser + Vector3.new(info.muncul[1], 3, info.muncul[3]))
	F:SetAttribute("geser", geser)
	F.Parent = root
	print("DK dusun terpasang", nama, total, "part, geser", geser)
	hint:Destroy()
end)
H.HttpEnabled = dulu
if not ok then hint.Text = "GALAT: " .. tostring(err) warn("DK gagal", err) end
