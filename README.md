<div align="center">
  <h1>🕌 WhatsApp Prayer Reminder Bot</h1>
  <p><em>Automated Sholat Reminder for WhatsApp Groups</em></p>
  <p>
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#configuration">Configuration</a> •
    <a href="#admin-commands">Commands</a> •
    <a href="#deployment">Deployment</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node">
    <img src="https://img.shields.io/badge/license-ISC-blue" alt="License">
    <img src="https://img.shields.io/badge/whatsapp--web.js-v1.26-purple" alt="whatsapp-web.js">
  </p>
</div>

---

A fully automated WhatsApp bot that sends **Sholat (Islamic prayer) reminders** to WhatsApp groups every day. It calculates accurate prayer times for your location, sends pre-reminders 3 minutes before Adhan, and includes a rotating Hadith about the virtue of praying on time — all running offline with no external API dependency for prayer times.

## Features

- **5 Daily Reminders** — Subuh, Dzuhur, Ashar, Maghrib, Isya
- **Pre-Reminder** — Warning message 3 minutes before each Adhan
- **Offline Prayer Times** — Uses `adhan-js` with Kemenag RI method (Fajr 20°, Isha 18°); no internet needed after config
- **Hadith Pool** — 10 curated Hadiths about praying on time, non-repeating
- **Hijri Date** — Native Islamic calendar (Umm al-Qura) displayed in every message
- **Message Variation** — 3 different template variants per prayer, rotated daily
- **Multi-Group** — Send reminders to multiple WhatsApp groups simultaneously
- **Admin Commands** — `!ping`, `!jadwal`, `!status`, `!lokasi` via WhatsApp chat
- **Session Persistence** — QR scan once; session saved for auto-reconnect
- **Auto-Reconnect** — Handles disconnection gracefully
- **Logging** — Daily rotating logs (info + error) with Winston
- **Dynamic Rescheduling** — Change location on-the-fly via `!lokasi` command

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A WhatsApp account (dedicated number recommended)
- The WhatsApp account must be a member of the target group(s)

### Installation

```bash
git clone https://github.com/Zizarinr/vibin_01_prayer_WhatsApp_bot.git
cd vibin_01_prayer_WhatsApp_bot
npm install
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Location (default: Ponorogo, Indonesia)
CITY=Ponorogo
LATITUDE=-7.8652
LONGITUDE=111.4617

# Admin phone numbers (comma-separated, no + sign)
ADMIN_PHONES=6281234567890

# Leave TARGET_GROUP_IDS empty initially — you'll discover the ID in step 4
TARGET_GROUP_IDS=
```

### First-Time Setup

```bash
npm start
```

1. A **QR code** will appear in the terminal. Scan it with WhatsApp (Linked Devices) on your phone.
2. After scanning, the bot prints all groups it has joined. **Copy the Group ID** (e.g. `120363025178652932@g.us`).
3. Stop the bot (`Ctrl+C`), paste the Group ID into `TARGET_GROUP_IDS` in `.env`.
4. Run `npm start` again. The bot remembers your session — no QR scan needed.

## Configuration

All settings via `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `WA_SESSION_NAME` | `sholat-bot-session` | Session identifier for auth persistence |
| `TARGET_GROUP_IDS` | — | Comma-separated WhatsApp group IDs |
| `CITY` | `Ponorogo` | City name (display only) |
| `COUNTRY` | `Indonesia` | Country name (display only) |
| `LATITUDE` | `-7.8652` | Latitude for prayer calculation |
| `LONGITUDE` | `111.4617` | Longitude for prayer calculation |
| `PRAYER_METHOD` | `Kemenag` | Calculation method (`Kemenag`, `Muhammadiyah`, or any `adhan` standard) |
| `PRE_REMINDER_MINUTES` | `3` | Minutes before Adhan for pre-reminder |
| `TIMEZONE` | `Asia/Jakarta` | IANA timezone for scheduling |
| `ADMIN_PHONES` | — | Comma-separated admin phone numbers |
| `ENABLE_HIJRI_DATE` | `true` | Show Hijri date in messages |
| `ENABLE_HADITH` | `true` | Include Hadith in every reminder |
| `ENABLE_ADMIN_COMMANDS` | `true` | Enable `!` commands |
| `HADITH_TOPIC` | `sholat_tepat_waktu` | Hadith topic filter |

### Calculation Methods

| Method | Fajr Angle | Isha Angle |
|--------|-----------|------------|
| `Kemenag` (default) | 20° | 18° |
| `Muhammadiyah` | 18° | 18° |
| Any `adhan` standard (e.g. `MuslimWorldLeague`) | Per standard | Per standard |

## Admin Commands

Send these from your WhatsApp to the bot's number or in a group the bot is in:

| Command | Description |
|---------|-------------|
| `!ping` | Health check — bot replies "Pong!" |
| `!jadwal` | Shows today's full prayer schedule |
| `!status` | Shows connection status and upcoming reminders |
| `!lokasi <City> <Lat> <Lng>` | Changes location and recalculates schedule on-the-fly |

## Project Structure

```
vibin_01_prayer_WhatsApp_bot/
├── src/
│   ├── bot.js            # WhatsApp client, auth, admin commands
│   ├── config.js         # .env parser and validator
│   ├── logger.js         # Winston console + rotating file logger
│   ├── prayerEngine.js   # Offline prayer time calculator (adhan-js)
│   ├── scheduler.js      # Timer management & midnight cron
│   └── templates.js      # Message rendering & Hadith rotation
├── data/
│   ├── hadiths.json      # 10 curated Hadiths (fallback)
│   └── state.json        # Last-Hadith tracker (auto-generated, gitignored)
├── logs/                 # Daily rotating log files (gitignored)
├── .env                  # Local config (gitignored)
├── .env.example          # Config template
├── index.js              # Entry point
├── package.json
└── README.md
```

## Deployment

For 24/7 operation, use PM2:

```bash
npm install -g pm2
pm2 start index.js --name "sholat-bot"
pm2 save
pm2 startup   # auto-start on server reboot
```

View logs:

```bash
pm2 logs sholat-bot
```

### Server Requirements

| Component | Minimum |
|-----------|---------|
| CPU | 1 vCPU |
| RAM | 512 MB |
| Storage | 5 GB |
| OS | Ubuntu 20.04+, Debian 11+, or Windows |

## Message Examples

### Pre-Reminder (3 min before)
```
⏰ *Pengingat Sholat — Keluarga Besar UNIDA Gontor*

3 menit lagi masuk waktu *Sholat Ashar* 🕌
Segera bersiap-siap dan ambil wudhu! 💧
```

### Main Reminder
```
🌤️ *Assalamu'alaikum Warahmatullahi Wabarakatuh*
*Keluarga Besar dan Civitas Akademika UNIDA Gontor*

Waktu *Sholat Ashar* telah tiba 🕌
🕐 Pukul *15:02 WIB*
📅 3 Dzulhijjah 1447 H (Minggu, 19 Juli 2026)

📖 *Hadith Hari Ini:*
_"Barangsiapa yang menjaga sholat lima waktu, baginya cahaya, bukti, dan keselamatan pada hari kiamat."_
*(HR. Ahmad)*

Jangan sampai terlewat, yuk sholat Ashar dulu! 🤲
```

## Tech Stack

- **Runtime:** Node.js 18+
- **WhatsApp:** [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) v1.26
- **Prayer Times:** [adhan-js](https://github.com/batoulapps/adhan-js) v4.4
- **Scheduler:** node-cron
- **Logging:** Winston + winston-daily-rotate-file
- **QR Display:** qrcode-terminal

## FAQ

**Q: Will my WhatsApp account get banned?**  
A: Using unofficial libraries carries a small risk. Use a dedicated number, keep messages to your configured groups, and avoid spam behavior.

**Q: Can I use this for multiple groups?**  
A: Yes. Add comma-separated Group IDs in `TARGET_GROUP_IDS`.

**Q: Does it need internet to calculate prayer times?**  
A: No. Prayer times are calculated locally using `adhan-js`. Internet is only needed for WhatsApp connection and optional Hadith web API (falls back to local `hadiths.json`).

**Q: What if the bot disconnects?**  
A: It auto-reconnects. For production, run under PM2 for auto-restart on crash.

## License

ISC — see [LICENSE](LICENSE) (or refer to `package.json`).

---

*Built with ❤️ for the community. Jaga sholat tepat waktu!* 🤲
