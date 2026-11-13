# Dunia Kotak di Roblox

- `src/BangunMap.server.lua`: membangun map 5 dusun + alun-alun saat server menyala (juga bisa ditempel di Command Bar Studio).
- `src/GameDuniaKotak.server.lua`: koin, klaim rumah, simpan data, Game Pass "Rumah 2 Lantai".
- `build_rbxlx.py`: merakit `build/DuniaKotak.rbxlx`.
- Terbit otomatis: workflow `.github/workflows/roblox-terbit.yml` (push ke main pada `roblox/**` atau Run workflow). Butuh secret `ROBLOX_API_KEY`, `ROBLOX_UNIVERSE_ID`, `ROBLOX_PLACE_ID`.
- Aturan Roblox: jangan menulis link situs luar di dalam game.
