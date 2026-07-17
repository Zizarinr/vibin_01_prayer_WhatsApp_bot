# 🕌 WhatsApp Prayer Reminder Chatbot (Sholat Reminder Bot)

An automated, robust, and highly accurate WhatsApp Bot designed to send prayer reminders (Subuh, Dzuhur, Ashar, Maghrib, Isya) directly to a target WhatsApp group. 

Calculations are computed **offline** locally matching the **Kemenag RI** parameters (Fajr 20°, Isha 18°). Features dynamic message variation, native Hijri date formatting, and a non-repeating Hadith pool about the virtue of praying on time.

---

## 📁 Project Directory Structure

```
vibin/
├── data/
│   ├── hadiths.json          # Hadith database pool
│   └── state.json            # Tracking of last displayed Hadith ID (to prevent repeat)
├── node/                     # Portable Node.js binaries (included in local setup)
├── src/
│   ├── config.js             # Configurations & environment variables parser
│   ├── logger.js             # Winston structured console and file logging
│   ├── prayerEngine.js       # Offline local prayer time calculator
│   ├── templates.js          # Message compile templates & native Hijri formats
│   ├── scheduler.js          # Cron scheduler and timeout triggers
│   └── bot.js                # Core WhatsApp client wrapper & admin commands
├── .env                      # Local configuration file (gitignored)
├── .env.example              # Template config file
├── index.js                  # Main entry point
├── package.json              # Node.js dependencies
└── README.md                 # Documentation
```

---

## 🚀 Getting Started

### 1. Requirements & Bootstrapping
A portable Node.js (`v20.11.0`) and NPM suite have already been downloaded, extracted, and prepared directly inside the project root (`./node/`). You do not need to install Node.js globally to run this.

To execute any command, prepend the local Node path:
```powershell
# Windows PowerShell
$env:PATH = "C:\Users\LAB_TI\Documents\vibin\node;" + $env:PATH
```

### 2. Configuration (`.env`)
Create a `.env` file (already bootstrapped in the root directory) and configure:
```env
# WhatsApp Session
WA_SESSION_NAME=sholat-bot-ti462025

# Whitelisted WhatsApp Group ID (Will send reminders to this ID)
# Format is xxxxxxxxxx@g.us
TARGET_GROUP_IDS=120363xxxxxxxx@g.us

# Prayer Location Coordinates (Default: Ponorogo, East Java, Indonesia)
CITY=Ponorogo
COUNTRY=Indonesia
LATITUDE=-7.8652
LONGITUDE=111.4617

# Scheduler Timezone (Asia/Jakarta = WIB, Asia/Makassar = WITA, Asia/Jayapura = WIT)
TIMEZONE=Asia/Jakarta

# Admin Whitelist Phone Numbers (Without '+' or spaces, e.g. 628xxxxxxxx)
# Only whitelisted admins can trigger bot commands.
ADMIN_PHONES=628xxxxxxxxxx
```

### 3. Running the Bot
Once configured, boot the application:
```powershell
npm start
```
Upon the first boot, a **QR Code** will be generated and printed inside the terminal console. Scan this QR using your WhatsApp mobile app under **Linked Devices**.

Once authenticated, your session will be saved locally inside `.wwebjs_auth/`. The bot will not require scanning again, even after system restarts.

### 4. Discovering Group IDs
When the bot successfully connects, it prints a list of all WhatsApp groups it is currently a member of, along with their internal IDs (e.g. `120363025178652932@g.us`).
- Copy the relevant group ID.
- Paste it into `TARGET_GROUP_IDS` in your `.env`.
- Restart the bot to apply!

---

## 🛠️ Admin WhatsApp Commands

Admins (configured via `ADMIN_PHONES` in `.env`) can chat directly with the bot account or within target groups using these triggers:

| Command | Action |
|---------|--------|
| `!ping` | Simple health check. Bot will reply with "🏓 Pong!". |
| `!jadwal` | Returns today's dynamic calculated prayer times for your coordinates. |
| `!status` | Returns bot metrics, connection status, and list of upcoming scheduled reminders today. |
| `!lokasi <Kota> <Latitude> <Longitude>` | Dynamically shifts location and recalculates today's scheduler on-the-fly. e.g. `!lokasi Surabaya -7.2575 112.7521` |

---

## 🛡️ Production & Reliability Setup (PM2)

To run the bot in the background 24/7, auto-restart it if it crashes, and boot it automatically on system startup, we highly recommend **PM2**:

1. Install PM2 globally:
   ```powershell
   npm install -g pm2
   ```
2. Start the bot as a background daemon:
   ```powershell
   pm2 start index.js --name "sholat-reminder-bot"
   ```
3. Configure PM2 to boot on OS startup:
   ```powershell
   pm2 startup
   pm2 save
   ```
4. View real-time logs:
   ```powershell
   pm2 logs sholat-reminder-bot
   ```

---

## 🔍 Troubleshooting & Diagnostics (User Custom Modifications)

During the integration and deployment of the bot, the administrator conducted vital troubleshooting to solve issues related to **WhatsApp Admin Command Authorizations**. Below are the modifications implemented by the user to address this:

### 1. Diagnostic Console Logs (`src/config.js`)
To verify that all settings in `.env` are parsed and loaded correctly on startup, a global dump was added to the end of `src/config.js`:
```javascript
console.log(config);
```

### 2. Deep Sender Authorization Logging (`src/bot.js`)
WhatsApp accounts utilizing business, multi-device, or special profiles are migrated by the WhatsApp server to utilize **LID identifiers** (`xxxxxxxxxx@lid`) instead of standard **JID/phone profiles** (`xxxxxxxxxx@c.us`) at the socket level. 

When you send a message, the WhatsApp server delivers it to the bot socket branded strictly with your LID (e.g. `33355454242838@lid`) rather than your standard JID phone number (`30061029814333@c.us`). This JID vs. LID discrepancy causes basic whitelisting checks to fail silently:
* **The Failure Scenario:** If your `.env` is configured with your standard JID phone number (`30061029814333`), the bot receives a socket command from `33355454242838@lid`, parses it to `33355454242838`, and rejects it since the values do not match.
* **The Fix:** The user introduced real-time logging triggers inside `src/bot.js` under the `message` event handler to capture this routing anomaly:
  * **Log message receipts:** `logger.info("Message received")`
  * **Audit full raw sender address:** `logger.info(`Sender : ${sender}`)`
  * **Trace unauthorized attempts:** Prints the rejected identity if an auth check fails:
    ```javascript
    if (!isAdmin) {
      logger.info("Sender is not an Admin");
      logger.info(`Sender is ${senderPhone}`);
      return;
    }
    ```

### 💡 How to use these diagnostics:
1. Fire a command like `!ping` to the bot.
2. Read the latest logs in real time (`pm2 logs` or in `logs/app-YYYY-MM-DD.log`).
3. Locate the printed sender format, e.g., `Sender is 33355454242838` (representing your account's server-assigned LID).
4. Copy this raw LID number and paste it directly into your `ADMIN_PHONES` list in `.env` (e.g. `ADMIN_PHONES=33355454242838`) to grant full admin authorization immediately. No code modifications are required as the parsing logic naturally handles both LID and JID numeric parts natively.


