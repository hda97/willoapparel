--[[
  TutorRaka (Script) - tutorial pembuka oleh Raka untuk pemain baru, mengikuti TUTOR di game web (6 langkah, bisa dilewati).
  Server hanya mencatat siapa yang sudah melihat tutorial, supaya tampil sekali saja per akun.

  Simpanan: DataStore DuniaKotak_Tutor_v1, kunci p_<UserId> = 1.
  Pintu: ReplicatedStorage.DK_Tutor (RemoteEvent). Server kirim "mulai" ke pemain baru; klien kirim "selesai" saat tutorial ditutup.
  Pasang sebagai Script di ServerScriptService. Pasangannya: StarterPlayerScripts.TutorRaka.
]]
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")

local store
do
	local ok, s = pcall(function() return DataStoreService:GetDataStore("DuniaKotak_Tutor_v1") end)
	if ok then store = s else warn("[TutorRaka] DataStore tidak tersedia: " .. tostring(s)) end
end

local lama = ReplicatedStorage:FindFirstChild("DK_Tutor")
if lama then lama:Destroy() end
local ev = Instance.new("RemoteEvent")
ev.Name = "DK_Tutor"
ev.Parent = ReplicatedStorage

local sudah = {} -- [player] = true bila sudah pernah melihat atau baru saja selesai

local function masuk(player)
	if not store then return end -- tanpa simpanan, tutorial tidak dipaksa tampil tiap masuk
	local ok, v = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
	if not ok or not player.Parent then return end
	if v then
		sudah[player] = true
		return
	end
	if not player.Character then player.CharacterAdded:Wait() end
	task.wait(4)
	if player.Parent and not sudah[player] then ev:FireClient(player, "mulai") end
end

ev.OnServerEvent:Connect(function(player, op)
	if op ~= "selesai" or sudah[player] then return end
	sudah[player] = true
	if store then pcall(function() store:SetAsync("p_" .. player.UserId, 1) end) end
end)

Players.PlayerAdded:Connect(function(p) task.spawn(masuk, p) end)
for _, p in ipairs(Players:GetPlayers()) do task.spawn(masuk, p) end
Players.PlayerRemoving:Connect(function(p) sudah[p] = nil end)
