# `data/` — Static Data Storage

This directory holds persistent and static data files consumed by the WhatsApp bot at runtime.

## Files

### `hadiths.json`
- **Purpose:** Local database of 10 curated Hadiths about the virtue of praying on time (keutamaan sholat tepat waktu).
- **Usage:** Primary Hadith source (loaded first). Web API (`https://api.hadith.gading.dev`) is only used as fallback if this file is empty or missing.
- **Format:** JSON array of objects with `id`, `text` (Indonesian translation), and `source` (riwayat).
- **Modification:** Add or edit entries freely without touching source code. IDs must be unique.
- **Git status:** Tracked in repo.

### `state.json`
- **Purpose:** Runtime-persisted state file that tracks the last displayed Hadith ID to prevent consecutive repeats.
- **Format:** `{ "lastHadithId": <number|string> }`
- **Created by:** `src/templates.js` on first Hadith send.
- **Git status:** Listed in `.gitignore` — not committed. Auto-generated at runtime.
- **Behavior if missing:** Code handles gracefully — no repeat-prevention until first write.

## Design Notes (for AI agents)
- Both files are read synchronously (`fs.readFileSync` / `fs.writeFileSync`) — acceptable since they're small and accessed infrequently.
- `state.json` write is best-effort (wrapped in try-catch). Failure does not crash the bot.
- `hadiths.json` is the **primary** source (not a last resort). The fallback chain is: local JSON → web API → null.
