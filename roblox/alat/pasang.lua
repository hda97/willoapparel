-- Tempel di Command Bar Roblox Studio (jalankan dengan Ctrl+Enter). Mengambil data dusun dari GitHub lalu merakit Part.
local H=game:GetService("HttpService") H.HttpEnabled=true
local URL="https://raw.githubusercontent.com/hda97/willoapparel/claude/project-thread-n3cysh/roblox/data/"
local nama="wetan"
local hint=workspace:FindFirstChild("InfoUji") or Instance.new("Hint",workspace) hint.Name="InfoUji"
local ok,err=pcall(function()
local info=H:JSONDecode(H:GetAsync(URL..nama..".json?"..os.time()))
local root=workspace:FindFirstChild("DuniaKotak3") or Instance.new("Folder",workspace) root.Name="DuniaKotak3"
local old=root:FindFirstChild(nama) if old then old:Destroy() end
local F=Instance.new("Folder") F.Name=nama
local total=0
for i=0,info.berkas-1 do
  local d=H:GetAsync(URL..string.format("%s-%03d.txt",nama,i).."?"..os.time())
  local M=Instance.new("Folder") M.Name=string.format("b%03d",i)
  for line in string.gmatch(d,"[^\n]+") do
    local t=string.split(line," ")
    local f=tonumber(t[8])
    local p=Instance.new(bit32.band(f,8)~=0 and "WedgePart" or "Part")
    p.Anchored=true p.Material=Enum.Material.SmoothPlastic p.TopSurface=Enum.SurfaceType.Smooth p.BottomSurface=Enum.SurfaceType.Smooth
    p.Size=Vector3.new(t[4]/100,t[5]/100,t[6]/100)
    p.Color=Color3.fromHex(t[7])
    if bit32.band(f,1)~=0 then p.CanCollide=false p.CanTouch=false p.CanQuery=false end
    if bit32.band(f,2)~=0 then p.Transparency=0.45 end
    if bit32.band(f,4)~=0 then p.CastShadow=false end
    if t[9] then p.CFrame=CFrame.new(t[1]/100,t[2]/100,t[3]/100,t[9]/1000,t[10]/1000,t[11]/1000,t[12]/1000,t[13]/1000,t[14]/1000,t[15]/1000,t[16]/1000,t[17]/1000)
    else p.CFrame=CFrame.new(t[1]/100,t[2]/100,t[3]/100) end
    p.Parent=M total+=1
  end
  M.Parent=F
  hint.Text="PASANG "..nama.." berkas "..(i+1).."/"..info.berkas.." part "..total
  task.wait(0.1)
end
F.Parent=root
local lama=workspace:FindFirstChild("DuniaKotak") if lama then lama.Parent=game:GetService("ServerStorage") end
for _,s in ipairs(workspace:GetChildren()) do if s:IsA("SpawnLocation") then s:Destroy() end end
local om=root:FindFirstChild("Muncul") if om then om:Destroy() end
local sp=Instance.new("SpawnLocation") sp.Name="Muncul" sp.Anchored=true sp.Size=Vector3.new(6,0.4,6) sp.Transparency=1 sp.CanCollide=false
sp.CFrame=CFrame.new(info.muncul[1],info.muncul[2]+0.5,info.muncul[3]) sp.Parent=root
local L=game:GetService("Lighting") L.FogColor=Color3.fromRGB(191,228,255) L.FogStart=400 L.FogEnd=900 L.ClockTime=13.5 L.Brightness=2.2 L.Ambient=Color3.fromRGB(120,125,130) L.OutdoorAmbient=Color3.fromRGB(150,155,160)
hint.Text="SELESAI "..nama.." part "..total
end)
if not ok then hint.Text="GALAT: "..tostring(err) end
