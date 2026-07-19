# System Architecture — WhatsApp Prayer Reminder Bot

This document provides a comprehensive mapping of the project structure, module responsibilities, and design decisions.

## Directory Tree

```
vibin_01_prayer_WhatsApp_bot/
├── .wwebjs_auth/           # WhatsApp session credentials (gitignored)
├── .wwebjs_cache/          # Puppeteer browser cache (gitignored)
├── data/
│   ├── hadiths.json        # 10 curated Hadiths (fallback pool)
│   └── state.json          # Last-sent Hadith ID tracker (auto-generated, gitignored)
├── logs/                   # Rotating log files (gitignored)
│   ├── app-YYYY-MM-DD.log  # All activity logs
│   └── error-YYYY-MM-DD.log # Error-only logs
├── src/
│   ├── bot.js              # WhatsApp client wrapper & admin commands
│   ├── config.js           # .env parser & validator
│   ├── logger.js           # Winston console + rotating file logger
│   ├── prayerEngine.js     # Offline prayer time calculator
│   ├── scheduler.js        # Daily timer & cron job manager
│   └── templates.js        # Message rendering & Hadith rotation
├── .env                    # Active configuration (gitignored)
├── .env.example            # Configuration template
├── index.js                # Entry point / bootstrapper
├── package.json            # Dependencies & metadata
└── README.md               # Public documentation
```

## Module Dependency Graph

```
index.js
  └─ bot.js
       ├─ config.js
       ├─ logger.js
       ├─ scheduler.js
       │    ├─ prayerEngine.js
       │    │    └─ config.js
       │    └─ templates.js
       │         ├─ config.js
       │         └─ logger.js
       └─ templates.js
            ├─ config.js
            └─ logger.js
```

## Module Details

### `index.js` — Entry Point
- Loads logger, calls `bot.init()` inside an async IIFE.
- Catches fatal errors and exits with code 1.

### `src/bot.js` — WhatsApp Integration
- Creates `whatsapp-web.js` Client with `LocalAuth` session persistence.
- **Monkey-patches `Client.prototype.initialize`** to fix a race condition:
  - Original code used `waitUntil: 'load'` which fires before WhatsApp Web's SPA is fully ready.
  - Patch uses `waitUntil: 'networkidle0'` and polls for `window.Debug.VERSION` before injecting.
  - Retries inject if execution context is destroyed during navigation.
  - Chrome flags: `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`, `--disable-accelerated-2d-canvas`, `--no-first-run`, `--no-zygote`.
- Handles events: `qr` (QR terminal display), `authenticated` (dedup guard), `auth_failure`, `ready` (group listing + scheduler start), `disconnected` (auto-reconnect), `message` (admin commands).
- First-time setup: if no `TARGET_GROUP_IDS` configured, lists all joined groups and waits for user to configure `.env`.
- Admin authorization: strips `@c.us` / `@lid` suffix, compares raw number against `ADMIN_PHONES` array.

### `src/config.js` — Environment Parser
- Loads `.env` via `dotenv`. Warns if `.env` is missing.
- `parseBoolean()`: handles `'true'`/`'false'` strings with defaults.
- `parseArray()`: splits comma-separated values, trims whitespace.
- Exports frozen-style plain object consumed by all modules.
- Prints full config to console on startup for diagnostics.

### `src/logger.js` — Structured Logging
- Winston logger with two transports:
  - Console: colored output with `HH:mm:ss` timestamps.
  - DailyRotateFile: `logs/app-%DATE%.log` (14-day retention), `logs/error-%DATE%.log` (30-day retention).

### `src/prayerEngine.js` — Prayer Time Calculator
- Uses `adhan-js` library for offline calculation.
- Supports multiple calculation methods:
  - `Kemenag` (default): Fajr 20°, Isha 18°.
  - `Muhammadiyah` / `KHGT`: Fajr 18°, Isha 18°.
  - Any standard `adhan.CalculationMethod` (e.g. `MuslimWorldLeague`).
- Asr calculation uses `adhan.Madhab.Shafi`.
- Returns 5 `Date` objects per call.

### `src/scheduler.js` — Timer Manager
- `start(client)`: clears previous timers, calls `scheduleToday()`, registers midnight cron.
- `scheduleToday()`: calculates prayer times, creates `setTimeout` events for:
  - Main reminder (at Adhan time).
  - Pre-reminder (configurable minutes before, default 3).
- Handles Friday: Dzuhur → Jumat in display messages.
- `reschedule()`: called by `!lokasi` admin command for dynamic relocation.
- `getScheduleState()`: sorted list of active timers for `!status` command.
- Broadcasts via `Promise.allSettled` — failure to one group doesn't block others.
- Auto-appends `@g.us` if missing from group ID.

### `src/templates.js` — Message Rendering
- 3 template variants per prayer (Subuh, Dzuhur, Ashar, Maghrib, Isya) + 3 pre-reminder variants.
- Templates use `{{time}}`, `{{hijri}}`, `{{gregorian}}` placeholders.
- Hadith selection with non-repeat tracking:
  1. Local `data/hadiths.json` is read first (primary source).
  2. Web API (`https://api.hadith.gading.dev`) is fallback (filtered by sholat keywords).
  3. Last-sent Hadith ID persisted in `data/state.json` to prevent consecutive repeats.
- Hijri date formatting via `Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura')` — no library needed.
- Special handling for Friday (Jumat), Idul Fitri, Idul Adha.
- Timezone suffix: WIB / WITA / WIT based on config.

## Authentication & Authorization

### WhatsApp Session Persistence
- Uses `whatsapp-web.js` `LocalAuth` strategy.
- Session saved to `.wwebjs_auth/` after first QR scan.
- No re-scan needed on restart.

### Admin Authorization
- Sender ID split at `@`, compared against `ADMIN_PHONES` array.
- Handles both JID (`@c.us`) and LID (`@lid`) formats transparently.
- Unauthorized commands are silently ignored.

## Key Design Decisions

- **Monkey-patch for stability:** The `Client.prototype.initialize` patch solves "execution context destroyed" crashes caused by WhatsApp Web's SPA navigation during the default `waitUntil:'load'` + inject sequence.
- **No external API for prayer times:** `adhan-js` computes locally, making the bot functional even if the internet is down (WhatsApp connection excepted).
- **Hadith fallback chain:** Local JSON → Web API → null. Never crashes on missing Hadith.
- **Dedup auth events:** `authenticated` event fires multiple times in some WA versions; a counter suppresses duplicate log messages.
- **PM2-friendly:** Process exits on fatal error, letting PM2 handle auto-restart.

## Error Handling Philosophy

- All async operations wrapped in try-catch.
- Scheduler errors are logged but don't crash the process.
- Failed message sends to individual groups don't block others (`Promise.allSettled`).
- WhatsApp disconnection triggers automatic re-initialization.
- Hadith web API failure gracefully falls back to local JSON, then to `null`.
