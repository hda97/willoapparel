local UIS = game:GetService("UserInputService")
local RS = game:GetService("RunService")
local SG = game:GetService("StarterGui")
local plr = game:GetService("Players").LocalPlayer
local cam = workspace.CurrentCamera
local K = 1.25
local RUTE = { Vector3.new(-195, 0, -840), Vector3.new(-195, 0, -720), Vector3.new(-65, 0, -720), Vector3.new(-65, 0, -840), Vector3.new(-195, 0, -840), Vector3.new(-227, 0, -840) }
local jalan = false
local function mulai()
	if jalan then return end
	jalan = true
	local ch = plr.Character or plr.CharacterAdded:Wait()
	local hum = ch:WaitForChild("Humanoid")
	local akar = ch:WaitForChild("HumanoidRootPart")
	pcall(function() SG:SetCore("TopbarEnabled", false) end)
	pcall(function() SG:SetCoreGuiEnabled(Enum.CoreGuiType.All, false) end)
	cam.CameraType = Enum.CameraType.Scriptable
	local t0 = os.clock()
	local mode = 1
	local halus = cam.CFrame
	local sambung = RS.RenderStepped:Connect(function(dt)
		local t = os.clock() - t0
		local p = akar.Position
		local maju = akar.CFrame.LookVector
		local kanan = akar.CFrame.RightVector
		local tuju
		if mode == 1 then
			local a = t * 0.35
			tuju = CFrame.lookAt(p + Vector3.new(math.cos(a) * 70, 55, math.sin(a) * 70), p + Vector3.new(0, 3, 0))
		elseif mode == 2 then
			tuju = CFrame.lookAt(p - maju * 15 + Vector3.new(0, 7, 0), p + maju * 10 + Vector3.new(0, 3, 0))
		elseif mode == 3 then
			tuju = CFrame.lookAt(p + kanan * 18 + maju * 6 + Vector3.new(0, 4, 0), p + Vector3.new(0, 3, 0))
		elseif mode == 4 then
			tuju = CFrame.lookAt(p + maju * 16 + Vector3.new(0, 3.5, 0), p + Vector3.new(0, 3, 0))
		elseif mode == 5 then
			tuju = CFrame.lookAt(p - kanan * 20 - maju * 4 + Vector3.new(0, 12, 0), p + Vector3.new(0, 3, 0))
		else
			local a = t * 0.25
			tuju = CFrame.lookAt(p + Vector3.new(math.cos(a) * 110, 120, math.sin(a) * 110), p)
		end
		halus = halus:Lerp(tuju, math.min(1, dt * 3.5))
		cam.CFrame = halus
	end)
	halus = CFrame.lookAt(akar.Position + Vector3.new(70, 55, 0), akar.Position)
	task.spawn(function()
		local urut = { 1, 2, 3, 2, 4, 5, 2, 1, 3, 2, 6 }
		for _, m in ipairs(urut) do
			if not jalan then break end
			mode = m
			task.wait(m == 1 and 5 or m == 6 and 8 or 4)
		end
	end)
	task.spawn(function()
		while jalan do
			task.wait(2.2)
			if jalan then hum.Jump = true end
		end
	end)
	task.wait(3)
	for _, w in ipairs(RUTE) do
		local tuj = Vector3.new(w.X * K, akar.Position.Y, w.Z * K)
		local habis = os.clock() + 25
		while (Vector3.new(akar.Position.X, 0, akar.Position.Z) - Vector3.new(tuj.X, 0, tuj.Z)).Magnitude > 4 and os.clock() < habis do
			hum:MoveTo(Vector3.new(tuj.X, akar.Position.Y, tuj.Z))
			task.wait(0.3)
		end
	end
	mode = 6
	task.wait(8)
	jalan = false
	sambung:Disconnect()
	cam.CameraType = Enum.CameraType.Custom
	pcall(function() SG:SetCoreGuiEnabled(Enum.CoreGuiType.All, true) end)
	pcall(function() SG:SetCore("TopbarEnabled", true) end)
end
UIS.InputBegan:Connect(function(i, diproses)
	if diproses then return end
	if i.KeyCode == Enum.KeyCode.K then mulai() end
end)
