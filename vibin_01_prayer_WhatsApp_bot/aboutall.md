# 🏛️ Complete System Architecture & Folder Hierarchy
## WhatsApp Prayer Reminder Chatbot (Sholat Reminder Bot)

This document provides a comprehensive mapping of all files and folders inside the **`vibin/`** workspace, explaining their hierarchy, purposes, and how they interact to form a highly reliable WhatsApp automated bot.

---

## 📂 Visual Directory Tree

```
vibin/
├── .wwebjs_auth/             # WhatsApp session credentials (persistent login)
├── .wwebjs_cache/            # Chromium/Puppeteer local Web Cache
├── data/                     # Local data storage and state persistence
│   ├── hadiths.json          # 10-Hadith pool database (virtues of praying on time)
│   └── state.json            # Tracking of last used Hadith ID (prevents repeats)
├── logs/                     # Winston persistent logging directory
│   ├── app-YYYY-MM-DD.log    # General application runtime activity logs
│   └── error-YYYY-MM-DD.log  # Critical crash or execution failure logs
├── node/                     # Portable Node.js & NPM binaries (pre-configured)
│   ├── node.exe              # Portable Node.js v20.11.0 executable
│   ├── npm.cmd               # NPM command runner script
│   └── ...                   # Node environment utility scripts
├── node_modules/             # Node.js external library dependencies (npm install)
├── src/                      # Source Code components
│   ├── bot.js                # Core WhatsApp client wrapper & admin command processor
│   ├── config.js             # Parses, validates, and logs environment variables
│   ├── logger.js             # Configures console-color & rotating file logs
│   ├── prayerEngine.js       # Offline prayer times calculator (adhan-js)
│   ├── scheduler.js          # Midnight cron job and timeout scheduler
│   └── templates.js          # Message rendering, native Hijri & Hadith formatters
├── .env                      # Active local configuration (gitignored, private keys)
├── .env.example              # Template environment config file
├── index.js                  # Main entry point (bootstrapper)
├── package-lock.json         # NPM dependency lockfile (frozen package versions)
├── package.json              # Main project description & dependency manifest
├── README.md                 # Project README and quick start guide
├── requirements.md           # Original Project Requirements Document
└── tasks.md                  # Original Project Tasks Checklist
```

---

## 🔍 Detailed Component Directory Reference

### 1. Root Configuration & Entry Point
* **`index.js`**
  * **Role:** The bootsrapper of the bot.
  * **Purpose:** It initializes the logger and calls the `bot.init()` method inside the core WhatsApp module, booting up the entire system.
* **`package.json`**
  * **Role:** Node.js project configuration.
  * **Purpose:** Outlines metadata (name, version, scripts) and registers the required npm libraries (`whatsapp-web.js`, `adhan`, `node-cron`, `qrcode-terminal`, `dotenv`, `winston`, `winston-daily-rotate-file`).
* **`package-lock.json`**
  * **Role:** NPM strict dependency lockfile.
  * **Purpose:** Freezes exact versions of nested sub-dependencies to ensure reproducibility across environments.
* **`.env`**
  * **Role:** Private configuration environment.
  * **Purpose:** Stores sensitive parameters like WhatsApp target Group IDs, coordinates, whitelisted admin numbers, and toggle switches.
* **`.env.example`**
  * **Role:** Template configuration.
  * **Purpose:** A clean blueprint file containing all keys from `.env` with placeholder values to guide new deployments.

### 2. Source Code Folder (`src/`)
Contains all the logical modules separated by responsibilities:
* 🛠️ **`src/config.js`**
  * **Role:** Environment validator and parser.
  * **Purpose:** Parses values from `.env` to safe types (casting coordinates to floats, times to integers, arrays from comma-separated lists) and prints a diagnostic dump to the console (`console.log(config)`) on startup.
* 📝 **`src/logger.js`**
  * **Role:** Winston Logging configuration.
  * **Purpose:** Sets up two rotating log files (`logs/app-%DATE%.log` and `logs/error-%DATE%.log`) that roll over daily, keeping a 14-day history, while styling the command-line console logs with colors.
* 🕌 **`src/prayerEngine.js`**
  * **Role:** Local Offline Prayer Time Calculator.
  * **Purpose:** Employs the `adhan` library to calculate precise schedules for the 5 daily prayers on-the-fly, utilizing latitude/longitude coordinates and custom Kemenag RI angles (Fajr 20°, Isha 18°).
* 📅 **`src/templates.js`**
  * **Role:** Formatter and Template compiler.
  * **Purpose:** Contains 3 distinct greeting and reminder message variants for each of the 5 prayers. Uses Node.js's built-in internationalization library (`Intl.DateTimeFormat`) to output Indonesian Hijri dates natively. Rotates Hadiths from the database, ensuring no consecutive repeats.
* ⏰ **`src/scheduler.js`**
  * **Role:** Daily Job Scheduler.
  * **Purpose:** Runs a midnight cron job (`00:00`) that calculates today's prayer times, filters out past prayer times, and schedules 10 precise timeout events (pre-reminders and main reminders) for the remaining prayers of the day.
* 💬 **`src/bot.js`**
  * **Role:** WhatsApp Web Integrator.
  * **Purpose:** Manages the `whatsapp-web.js` Client. Prints the scan QR code in the terminal, persists login credentials, logs group listings, and intercepts incoming admin commands (`!ping`, `!jadwal`, `!status`, `!lokasi`). Includes user-added logging blocks for easy troubleshooting of sender identities.

### 3. Data Directory (`data/`)
* **`data/hadiths.json`**
  * **Role:** Hadith Database.
  * **Purpose:** Stores the 10 required Islamic Hadiths with Indonesian translations and citation details in a structured JSON structure for easy retrieval and future additions.
* **`data/state.json`**
  * **Role:** Application State File.
  * **Purpose:** Persistently tracks the ID of the last sent Hadith, ensuring that even if the bot is restarted, it will not send the same Hadith twice in a row.

### 4. Binary & Environment Directories
* **`node/`**
  * **Role:** Standalone portable Node.js binaries.
  * **Purpose:** Preloaded folder containing `node.exe` and `npm.cmd`, ensuring the project runs seamlessly on machines that do not have Node.js or Python installed globally on the system PATH.
* **`node_modules/`**
  * **Role:** Node dependencies folder.
  * **Purpose:** Stores the full code of downloaded libraries, including the Puppeteer Chromium browser needed for WhatsApp integration.
* **`.wwebjs_auth/`**
  * **Role:** WhatsApp Authenticator Credentials.
  * **Purpose:** Holds your saved WhatsApp session files (via `LocalAuth`), allowing the bot to reconnect automatically after restarts without scanning the QR code again.
* **`.wwebjs_cache/`**
  * **Role:** Web cache directory.
  * **Purpose:** Puppeteer's browser web cache to speed up browser booting and connection routines.
* **`logs/`**
  * **Role:** Application persistent logs.
  * **Purpose:** Contains daily rotated logs, which are highly useful for auditing sent messages and debugging permission/command issues.

### 5. Documentation
* **`README.md`** (Operations manual, guides, admin commands, and PM2 production daemon instructions).
* **`aboutall.md`** (This file — Complete directory and folder hierarchy mapping).
* **`requirements.md`** (Original baseline specifications document).
* **`tasks.md`** (Original baseline task execution roadmap).

---

## 🛡️ Critical Design Insight: WhatsApp JID vs. LID Whitelisting

One of the most important architectural features implemented in this system is its ability to handle **WhatsApp LID (Localized Identifier) profile routing** natively:

* **The Problem:** Modern WhatsApp accounts (especially those using multi-device, business accounts, or updated personal profiles) are routed using LIDs (`33355454242838@lid`) rather than standard JIDs / phone numbers (`30061029814333@c.us`) on incoming packets at the socket level. If an administrator whitelists their JID phone number in the configurations, the bot compares it against the incoming LID string, leading to an **authentication mismatch** and causing the command to fail silently.
* **The System's Native Solution:** The parser logic inside `src/bot.js` splits all incoming sender keys at the `@` symbol (`sender.split('@')[0]`) and strips off both `@c.us` and `@lid` suffixes. It compares the raw resulting numerical identifier against the `ADMIN_PHONES` whitelisted array in `.env`.
* **Deployment Benefit:** Because of this universal parsing, the system supports both old JIDs and new LIDs out-of-the-box. Administrators do not need to change any source code; they simply copy the raw sender identifier captured in `logs/app-YYYY-MM-DD.log` (enabled by the user's custom debug loggers) and paste it directly into `.env`.

