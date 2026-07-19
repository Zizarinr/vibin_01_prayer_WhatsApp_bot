# `src/` — Application Source Code

This directory contains all runtime logic for the WhatsApp Prayer Reminder Bot. Each module has a single responsibility.

## Files

### `bot.js` — WhatsApp Client & Admin Commands
- **Role:** Core WhatsApp Web integration layer.
- **What it does:**
  - Creates `whatsapp-web.js` Client with `LocalAuth` session persistence.
  - **Monkey-patches `Client.prototype.initialize`** — replaces the default `page.goto('waitUntil:load')` with `networkidle0` and polls for `window.Debug.VERSION` to avoid "execution context destroyed" crashes caused by WhatsApp Web's SPA navigation during injection.
  - Handles QR code generation, authentication (with dedup guard), disconnection/reconnect.
  - On `ready`, logs all joined groups via `getChats()` with fallback to direct `page.evaluate()`.
  - First-time setup: if no `TARGET_GROUP_IDS`, lists groups and guides user.
  - Listens for incoming messages (`!` prefix) and processes admin commands (`!ping`, `!jadwal`, `!status`, `!lokasi`).
  - Admin authorization: strips `@c.us`/`@lid` suffix, compares raw number against `ADMIN_PHONES`.
- **Key exports:** `init()` — bootstraps the client and starts the bot.
- **Depends on:** `config`, `logger`, `scheduler`, `templates`, `prayerEngine`

### `config.js` — Environment Configuration
- **Role:** Parses and validates `.env` into a typed config object.
- **What it does:**
  - Loads `.env` from project root via `dotenv`. Warns if file is missing.
  - `parseBoolean()` — handles `'true'`/`'false'` strings with defaults.
  - `parseArray()` — splits comma-separated lists, trims whitespace.
  - Casts coordinates to floats, minutes to integers.
  - Exports plain object consumed by all modules.
  - Prints full config to console on startup for diagnostics.
- **Key exports:** Config object with properties: `waSessionName`, `targetGroupIds`, `city`, `country`, `latitude`, `longitude`, `prayerMethod`, `preReminderMinutes`, `timezone`, `adminPhones`, `enableHijriDate`, `enableHadith`, `enableAdminCommands`, `hadithTopic`.

### `logger.js` — Structured Logging
- **Role:** Winston logger with console and rotating file transports.
- **What it does:**
  - Console: colored output with `HH:mm:ss` timestamps.
  - File: `logs/app-YYYY-MM-DD.log` (all levels, 14-day retention).
  - File: `logs/error-YYYY-MM-DD.log` (errors only, 30-day retention).
- **Key exports:** Winston logger instance (`.info()`, `.warn()`, `.error()`, `.debug()`).

### `prayerEngine.js` — Offline Prayer Time Calculator
- **Role:** Computes daily prayer schedules using the `adhan` library.
- **What it does:**
  - Takes a `Date` object, returns 5 prayer times (Subuh, Dzuhur, Ashar, Maghrib, Isya).
  - Supports Kemenag (Fajr 20°, Isha 18°), Muhammadiyah (18°, 18°), or any `adhan.CalculationMethod`.
  - Uses `adhan.Madhab.Shafi` for Asr.
- **Key exports:** `getPrayerTimesForDate(date)` → `{ Subuh: Date, Dzuhur: Date, Ashar: Date, Maghrib: Date, Isya: Date }`

### `scheduler.js` — Daily Timer Scheduler
- **Role:** Manages all timed reminder events for the day.
- **What it does:**
  - `start(client)`: clears timers, calls `scheduleToday()`, registers midnight cron.
  - `scheduleToday()`: calculates prayer times, creates `setTimeout` for main + pre-reminder per prayer.
  - Handles Friday display (Jumat instead of Dzuhur).
  - `reschedule()`: for `!lokasi` dynamic relocation.
  - `getScheduleState()`: sorted active timer list for `!status`.
  - Broadcasts to all groups via `Promise.allSettled`.
  - Auto-appends `@g.us` if missing from Group ID.
- **Key exports:** `start(client)`, `reschedule()`, `getScheduleState()`, `clearAllTimers()`

### `templates.js` — Message Templates & Formatting
- **Role:** Renders all outgoing WhatsApp messages.
- **What it does:**
  - 3 variant messages per prayer, 3 pre-reminder variants.
  - Formats dates: Gregorian (Indonesian locale), Hijri (Umm al-Qura via `Intl.DateTimeFormat`).
  - Hadith selection priority: local `hadiths.json` → web API → `null`.
  - Non-consecutive repeat prevention via `state.json`.
  - Friday / Idul Fitri / Idul Adha special handling.
  - Timezone suffix: WIB/WITA/WIT.
- **Key exports:** `renderMainReminder(prayerName, prayerTime)` (async), `renderPreReminder(prayerName, minutes)`, `formatLocalTime(date)`, `formatHijriDate(date)`

## Dependency Graph

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

## Error Handling Philosophy
- All async operations are wrapped in try-catch.
- Scheduler errors are logged but do NOT crash the process.
- WhatsApp disconnection triggers automatic re-initialization.
- Failed message sends to individual groups do NOT block other groups (`Promise.allSettled`).
- Hadith web API failure gracefully falls back to local JSON, then to `null`.
