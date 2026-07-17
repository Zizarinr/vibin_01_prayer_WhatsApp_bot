# 📋 Tasks — WhatsApp Prayer Reminder Chatbot

> Project: **Sholat Reminder Bot for WhatsApp Group**
> Assignee: Antigravity Google Team
> Status: Ready for Development

---

## PHASE 1 — Setup & Infrastructure

### TASK-001: Project Initialization
- [ ] Initialize Node.js project (or Python if preferred stack)
- [ ] Setup repository with `.gitignore`, `README.md`, `package.json`
- [ ] Setup environment variable management (`.env` file)
- [ ] Setup logging (winston / pino / equivalent)

### TASK-002: WhatsApp Bot Integration
- [ ] Integrate **whatsapp-web.js** (Node.js) or **Baileys** library
- [ ] Implement QR code authentication flow for first-time login
- [ ] Implement session persistence (save session so no re-scan on restart)
- [ ] Test basic message send to a group

### TASK-003: Deployment Environment
- [ ] Setup server/VPS (or Docker container)
- [ ] Ensure Chromium/Puppeteer dependency is available (required by whatsapp-web.js)
- [ ] Setup process manager (PM2 / supervisor) for auto-restart
- [ ] Setup auto-start on server reboot

---

## PHASE 2 — Prayer Time Engine

### TASK-004: Prayer Time Calculator
- [ ] Integrate prayer time API or library (e.g., `adhan-js`, `pray-times`, or external API like **MyQuran API** / **Aladhan API**)
- [ ] Support location-based prayer time (configurable city/coordinates)
- [ ] Support calculation method config (e.g., Kemenag RI / MUI method)
- [ ] Output 5 prayer times per day: Subuh, Dzuhur, Ashar, Maghrib, Isya

### TASK-005: Scheduler System
- [ ] Implement a scheduler (e.g., `node-cron`) to run daily
- [ ] At midnight (00:00), fetch and cache prayer times for the day
- [ ] Schedule individual reminder jobs for each of the 5 prayer times
- [ ] Add pre-reminder option: send reminder X minutes before adzan (configured: **3 minutes** before adzan for grup "Teknik Informatika 462025")
- [ ] Handle timezone correctly (WIB / Asia/Jakarta by default)

---

## PHASE 3 — Message & Template System

### TASK-006: Message Template Engine
- [ ] Create message templates for each prayer time (Subuh, Dzuhur, Ashar, Maghrib, Isya)
- [ ] Templates should include: prayer name, adzan time, optional Islamic greeting/doa
- [ ] Support dynamic variables: `{{prayer_name}}`, `{{time}}`, `{{date}}`, `{{hijri_date}}`
- [ ] Add optional Hijri (Islamic calendar) date display
- [ ] Support emoji in messages for visual appeal 🕌🤲

### TASK-007: Message Personalization & Rotation
- [ ] Create a pool of varied reminder messages per prayer (minimum 3 variants each)
- [ ] Implement rotation/randomizer so messages don't feel repetitive
- [ ] **[CORE]** Build a hadith pool specifically about the **virtue of praying on time** (keutamaan sholat tepat waktu) — minimum 10 unique hadith
- [ ] Each message appends 1 random hadith from the pool (never repeat consecutively)
- [ ] Hadith format: Arabic text (optional) + Indonesian translation + riwayat source (e.g., HR. Bukhari)

---

## PHASE 4 — Group Management

### TASK-008: Target Group Configuration
- [ ] Implement config to specify target WhatsApp Group ID(s)
- [ ] **Target grup utama: "Teknik Informatika 462025"** — ambil Group ID saat setup awal
- [ ] Ability to send to multiple groups simultaneously
- [ ] Implement whitelist of allowed group IDs (security measure)
- [ ] Log every sent message (timestamp, group, prayer name, status)

### TASK-009: Admin Commands (Optional — Nice to Have)
- [ ] `!status` — Show bot status and next scheduled prayer reminder
- [ ] `!jadwal` — Show today's full prayer schedule
- [ ] `!lokasi [kota]` — Change prayer time location
- [ ] `!ping` — Health check command
- [ ] Restrict admin commands to specific phone numbers only

---

## PHASE 5 — Reliability & Error Handling

### TASK-010: Error Handling & Resilience
- [ ] Handle WhatsApp disconnection gracefully (auto-reconnect)
- [ ] Handle API failure for prayer times (fallback to cached/previous data)
- [ ] Alert admin via personal WA message if bot crashes or fails to send
- [ ] Retry mechanism for failed message sends (max 3 retries)

### TASK-011: Monitoring & Logging
- [ ] Log all scheduled and sent messages to file
- [ ] Daily log rotation
- [ ] Optional: integrate with uptime monitor (UptimeRobot / BetterUptime)

---

## PHASE 6 — Testing & Deployment

### TASK-012: Testing
- [ ] Unit test: prayer time calculation accuracy
- [ ] Integration test: message send to test group
- [ ] End-to-end test: full flow from scheduler → message delivery
- [ ] Test timezone edge cases (midnight crossover, DST if applicable)

### TASK-013: Final Deployment
- [ ] Deploy to production server
- [ ] Configure `.env` for production (group IDs, location, method)
- [ ] Final QR scan and session save
- [ ] Verify all 5 reminders fire correctly on Day 1
- [ ] Handover & documentation

---

## Milestone Summary

| Milestone | Tasks | Est. Duration |
|-----------|-------|--------------|
| M1 — Infrastructure Ready | TASK-001 to TASK-003 | 1–2 days |
| M2 — Prayer Engine Working | TASK-004 to TASK-005 | 1–2 days |
| M3 — Messages Sending | TASK-006 to TASK-008 | 1–2 days |
| M4 — Stable & Deployed | TASK-009 to TASK-013 | 1–2 days |
| **Total** | | **~5–7 working days** |
