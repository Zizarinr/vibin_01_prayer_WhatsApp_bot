# 📄 Requirements & Explanation Document
## WhatsApp Prayer Reminder Chatbot — Sholat Reminder Bot

> **Document Version:** 1.0
> **Date:** June 2026
> **Prepared for:** Antigravity Google Team
> **Requested by:** Project Owner

---

## 1. Project Overview

### 1.1 Background
Proyek ini bertujuan membuat sebuah **WhatsApp Bot otomatis** yang bertugas mengirimkan pesan pengingat waktu sholat (5 waktu) ke dalam **grup WhatsApp** setiap harinya. Bot ini dirancang agar anggota grup selalu mendapatkan notifikasi tepat waktu sebelum atau saat waktu adzan tiba, tanpa perlu ada admin manusia yang mengirim manual.

### 1.2 Tujuan Utama
- Mengirim **5 pengingat sholat otomatis** per hari ke grup WhatsApp
- Waktu pengingat akurat sesuai **lokasi geografis** (default: Indonesia)
- Bot berjalan **24/7** secara mandiri tanpa intervensi manusia
- Pesan variatif dan islami agar tidak terasa repetitif

### 1.3 Nama & Identitas Bot
- **Nama Bot (suggested):** Ust. Reminder / SholatBot / ReminderMu
- **Platform:** WhatsApp (via unofficial API wrapper)
- **Target:** Grup WhatsApp **"Teknik Informatika 462025"** (dapat dikonfigurasi untuk multi-grup)

---

## 2. Functional Requirements

### 2.1 Core Features (WAJIB)

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| F-01 | **Pengingat 5 Waktu Sholat** | Bot mengirim pesan otomatis untuk Subuh, Dzuhur, Ashar, Maghrib, dan Isya setiap hari |
| F-02 | **Jadwal Dinamis** | Waktu sholat dihitung berdasarkan lokasi nyata (bukan hardcode) |
| F-03 | **Pre-Reminder** | Bot mengirim pengingat **3 menit** sebelum waktu adzan tiba |
| F-04 | **Multi-Grup** | Bot dapat mengirim ke lebih dari 1 grup sekaligus |
| F-05 | **Pesan Variatif** | Setiap pengingat punya beberapa varian pesan agar tidak monoton |
| F-06 | **Tanggal Hijriyah** | Pesan menyertakan tanggal Hijriyah harian |
| F-07 | **Session Persistent** | Bot tidak perlu scan QR ulang setiap restart |
| F-08 | **Hadith Keutamaan Sholat Tepat Waktu** | Setiap pesan menyertakan 1 hadith acak dari pool khusus tentang keutamaan sholat tepat waktu, dilengkapi terjemahan Indonesia dan sumber riwayat |

### 2.2 Optional Features (NICE TO HAVE)

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| O-01 | **Admin Commands** | Admin dapat query jadwal hari ini via chat (`!jadwal`) |
| O-02 | **Alert Crash** | Jika bot down, kirim notifikasi ke nomor admin tertentu |
| O-03 | **Change Location** | Admin dapat ubah kota via command (`!lokasi Surabaya`) |

---

## 3. Non-Functional Requirements

| Kategori | Requirement |
|----------|-------------|
| **Uptime** | Bot harus berjalan minimal 99% waktu (auto-restart jika crash) |
| **Akurasi Waktu** | Selisih pengiriman pesan maksimal ±30 detik dari waktu sholat |
| **Timezone** | Default WIB (UTC+7), dapat dikonfigurasi ke WITA/WIT |
| **Keamanan** | Hanya grup yang di-whitelist yang dapat menerima pesan |
| **Logging** | Semua aktivitas kirim pesan tercatat di log file |
| **Performance** | Bot tidak menggunakan lebih dari 500MB RAM saat idle |

---

## 4. Technical Architecture

### 4.1 Stack yang Direkomendasikan

```
┌─────────────────────────────────────────────┐
│              WhatsApp Bot Server             │
│                                             │
│  ┌─────────────┐    ┌──────────────────┐   │
│  │  Scheduler  │───▶│  Message Sender  │   │
│  │  (node-cron)│    │ (whatsapp-web.js)│   │
│  └──────┬──────┘    └────────┬─────────┘   │
│         │                    │              │
│  ┌──────▼──────┐    ┌────────▼─────────┐   │
│  │Prayer Time  │    │  Template Engine │   │
│  │  Engine     │    │  (Pesan Variatif)│   │
│  │ (adhan-js)  │    └──────────────────┘   │
│  └──────┬──────┘                           │
│         │                                  │
│  ┌──────▼──────┐                           │
│  │ Prayer API  │                           │
│  │(Aladhan API)│                           │
│  └─────────────┘                           │
└─────────────────────────────────────────────┘
```

### 4.2 Technology Stack

| Layer | Technology | Keterangan |
|-------|-----------|------------|
| Runtime | **Node.js v18+** | LTS, stabil |
| WA Integration | **whatsapp-web.js** atau **Baileys** | Library unofficial WA |
| Scheduler | **node-cron** | Cron-based job scheduler |
| Prayer Times | **adhan-js** atau **Aladhan API** | Kalkulasi waktu sholat |
| Process Manager | **PM2** | Auto-restart, logging |
| Config | **.env + dotenv** | Environment-based config |
| Logging | **winston** | Structured logging |
| Deployment | **VPS Linux** (Ubuntu 22.04 recommended) | Self-hosted |

### 4.3 Alur Sistem (Flow)

```
[Setiap Tengah Malam 00:00]
  ↓
Fetch jadwal sholat hari ini (API / kalkulasi)
  ↓
Simpan ke memory / cache
  ↓
Schedule 10 jobs per hari:
  - 5 pre-reminder jobs (3 menit sebelum adzan)
  - 5 on-time jobs (tepat saat waktu sholat)
  ↓
[3 menit sebelum Subuh, misal 04:09]
  ↓
Kirim pesan pre-reminder → "Subuh sebentar lagi pukul 04:12!"
  ↓
[Tepat waktu Subuh 04:12]
  ↓
Ambil template pesan → inject variabel (waktu, tanggal Hijriyah, dll)
  ↓
Ambil 1 hadith acak dari pool keutamaan sholat tepat waktu
  ↓
Kirim ke grup "Teknik Informatika 462025"
  ↓
Log hasil pengiriman
```

---

## 5. Contoh Pesan

### PRE-REMINDER (3 menit sebelum adzan — semua waktu)
```
⏰ *Pengingat Sholat — Teknik Informatika 462025*

3 menit lagi masuk waktu *Sholat Subuh* 🕌
Segera bersiap, ambil wudhu! 💧
```

---

### PESAN UTAMA — Subuh
```
🌙 *Assalamu'alaikum Warahmatullahi Wabarakatuh*
*Teknik Informatika 462025*

Alhamdulillah, sudah masuk waktu *Sholat Subuh* 🕌
🕐 Pukul *04:12 WIB*
📅 Senin, 1 Dzulhijjah 1447 H

📖 *Hadith Hari Ini:*
_"Sholat yang paling utama di sisi Allah adalah sholat yang dikerjakan tepat pada waktunya."_
*(HR. Bukhari & Muslim, dari Abdullah bin Mas'ud radhiyallahu 'anhu)*

Yuk segerakan sholat Subuh, jangan tunda! 🤲
```

### PESAN UTAMA — Dzuhur
```
☀️ *Assalamu'alaikum Warahmatullahi Wabarakatuh*
*Teknik Informatika 462025*

Waktu *Sholat Dzuhur* telah tiba 🕌
🕐 Pukul *11:58 WIB*
📅 Senin, 1 Dzulhijjah 1447 H

📖 *Hadith Hari Ini:*
_"Barangsiapa yang menjaga sholat lima waktu, baginya cahaya, bukti, dan keselamatan pada hari kiamat."_
*(HR. Ahmad, dari Abdullah bin Amr radhiyallahu 'anhu)*

Tinggalkan sejenak aktivitasmu, saatnya menghadap Allah SWT 🤲
```

### PESAN UTAMA — Ashar
```
🌤️ *Assalamu'alaikum Warahmatullahi Wabarakatuh*
*Teknik Informatika 462025*

Waktu *Sholat Ashar* telah tiba 🕌
🕐 Pukul *15:23 WIB*
📅 Senin, 1 Dzulhijjah 1447 H

📖 *Hadith Hari Ini:*
_"Jagalah sholat-sholat (wajib) dan sholat wustha (Ashar). Berdirilah karena Allah dalam keadaan tunduk."_
*(QS. Al-Baqarah: 238)*

Jangan sampai terlewat, yuk sholat Ashar dulu! 🤲
```

### PESAN UTAMA — Maghrib
```
🌅 *Assalamu'alaikum Warahmatullahi Wabarakatuh*
*Teknik Informatika 462025*

Alhamdulillah, sudah masuk waktu *Sholat Maghrib* 🕌
🕐 Pukul *17:41 WIB*
📅 Senin, 1 Dzulhijjah 1447 H

📖 *Hadith Hari Ini:*
_"Tidaklah seseorang sholat lima waktu, berpuasa Ramadhan, menunaikan zakat, dan menjauhi dosa-dosa besar, kecuali dibukalah baginya pintu-pintu surga."_
*(HR. Ahmad)*

Syukuri penghujung hari, segera sholat Maghrib! 🤲
```

### PESAN UTAMA — Isya
```
🌙 *Assalamu'alaikum Warahmatullahi Wabarakatuh*
*Teknik Informatika 462025*

Waktu *Sholat Isya* telah tiba 🕌
🕐 Pukul *19:02 WIB*
📅 Senin, 1 Dzulhijjah 1447 H

📖 *Hadith Hari Ini:*
_"Sholat Isya berjamaah pahalanya seperti sholat separuh malam, dan sholat Subuh berjamaah pahalanya seperti sholat semalam penuh."_
*(HR. Muslim, dari Utsman bin Affan radhiyallahu 'anhu)*

Tutup harimu dengan sholat Isya, semoga malam berkah! 🤲
```

---

## 6. Configuration (`.env`)

```env
# WhatsApp Session
WA_SESSION_NAME=sholat-bot-ti462025

# Target Groups (ambil Group ID saat setup — nama grup: "Teknik Informatika 462025")
TARGET_GROUP_IDS=120363xxxxxxxx@g.us

# Prayer Time Settings
CITY=Ponorogo
COUNTRY=Indonesia
LATITUDE=-7.8652
LONGITUDE=111.4617
PRAYER_METHOD=11              # 11 = Kemenag RI

# Reminder Settings
PRE_REMINDER_MINUTES=3        # Pre-reminder 3 menit sebelum adzan
TIMEZONE=Asia/Jakarta

# Admin
ADMIN_PHONE=628xxxxxxxxxx     # For crash alerts

# Features
ENABLE_HIJRI_DATE=true
ENABLE_HADITH=true            # Hadith keutamaan sholat tepat waktu — AKTIF
ENABLE_ADMIN_COMMANDS=true
HADITH_TOPIC=sholat_tepat_waktu
```

---

## 7. Hadith Pool — Keutamaan Sholat Tepat Waktu

Developer wajib menyediakan minimal **10 hadith** berikut dalam data pool (dapat ditambah):

| # | Teks (Terjemahan) | Sumber |
|---|-------------------|--------|
| 1 | "Sholat yang paling utama di sisi Allah adalah sholat yang dikerjakan tepat pada waktunya." | HR. Bukhari & Muslim |
| 2 | "Barangsiapa yang menjaga sholat lima waktu, baginya cahaya, bukti, dan keselamatan pada hari kiamat." | HR. Ahmad |
| 3 | "Amalan yang pertama kali dihisab dari seorang hamba pada hari kiamat adalah sholatnya." | HR. Abu Dawud & Tirmidzi |
| 4 | "Sholat Isya berjamaah pahalanya seperti sholat separuh malam, dan sholat Subuh berjamaah pahalanya seperti sholat semalam penuh." | HR. Muslim |
| 5 | "Tidaklah seseorang berwudhu lalu menyempurnakan wudhunya kemudian melaksanakan sholat, kecuali Allah mengampuni dosa-dosanya." | HR. Muslim |
| 6 | "Perumpamaan sholat lima waktu seperti sungai yang mengalir di depan pintu rumah salah seorang di antara kalian, ia mandi lima kali sehari di dalamnya." | HR. Muslim |
| 7 | "Sesungguhnya sholat yang pertama kali akan dipertanyakan kepada seorang hamba pada hari kiamat. Jika sholatnya baik, maka seluruh amalnya akan baik." | HR. Tirmidzi |
| 8 | "Sesungguhnya seorang hamba yang paling dicintai Allah adalah yang paling menjaga waktu-waktu sholatnya." | HR. Thabrani |
| 9 | "Jagalah sholat-sholat (wajib) dan sholat wustha (Ashar). Berdirilah karena Allah dalam keadaan tunduk." | QS. Al-Baqarah: 238 |
| 10 | "Demi Dzat yang jiwaku ada di tangan-Nya, sungguh aku ingin memerintahkan mengumpulkan kayu bakar, kemudian aku perintahkan sholat dikumandangkan, lalu aku pergi kepada orang-orang yang tidak ikut sholat dan aku bakar rumah-rumah mereka." | HR. Bukhari & Muslim |

> 💡 **Catatan Developer:** Hadith ditampilkan secara acak (shuffled), tidak berurutan, dan tidak boleh tampil dua kali berturut-turut hadith yang sama dalam 1 hari.

---

## 8. Deployment Requirements

### 8.1 Server Requirements

| Komponen | Minimum | Recommended |
|----------|---------|-------------|
| OS | Ubuntu 20.04 | Ubuntu 22.04 LTS |
| CPU | 1 vCPU | 2 vCPU |
| RAM | 512 MB | 1 GB |
| Storage | 5 GB | 10 GB |
| Node.js | v16 | v18 LTS |

### 8.2 Dependencies
- Node.js v18+
- npm / yarn
- Chromium (untuk whatsapp-web.js via Puppeteer)
- PM2 (process manager)
- Internet access (untuk Aladhan API & WhatsApp)

### 8.3 First-Time Setup Flow
1. Clone repo ke server
2. `npm install`
3. Copy `.env.example` → `.env`, isi konfigurasi
4. `node index.js` → scan QR code dengan HP yang akan jadi akun bot
5. Session tersimpan otomatis
6. `pm2 start index.js --name sholat-bot`
7. `pm2 save && pm2 startup`

---

## 9. Risiko & Mitigasi

| Risiko | Kemungkinan | Mitigasi |
|--------|-------------|----------|
| WA ban akun bot | Sedang | Gunakan akun dedicated, jangan spam, batasi pesan |
| Bot crash / down | Rendah | PM2 auto-restart + alert ke admin |
| API jadwal sholat down | Rendah | Cache data hari sebelumnya sebagai fallback |
| WA update breaking changes | Sedang | Monitor update whatsapp-web.js / Baileys |
| Waktu tidak akurat | Rendah | Sync server ke NTP, validasi timezone |

---

## 9. Out of Scope

- Tidak menggunakan **WhatsApp Business API resmi** (berbayar, perlu approval Meta) — menggunakan unofficial library
- Tidak ada dashboard web admin (hanya command via WA chat)
- Tidak menyimpan database percakapan atau riwayat chat grup
- Tidak ada fitur balas otomatis untuk pertanyaan umum (hanya reminder)

---

## 10. Acceptance Criteria

Bot dianggap **selesai dan diterima** jika:

- [x] 5 pesan sholat terkirim otomatis setiap hari ke grup **"Teknik Informatika 462025"**
- [x] Pre-reminder terkirim **3 menit** sebelum setiap waktu adzan
- [x] Setiap pesan menyertakan hadith keutamaan sholat tepat waktu (acak, tidak berulang berturut-turut)
- [x] Waktu pengiriman akurat (±1 menit dari jadwal sholat aktual)
- [x] Bot tetap berjalan setelah server restart
- [x] Bot auto-reconnect jika koneksi WA putus
- [x] Semua pesan terlog dengan benar
- [x] Konfigurasi dapat diubah melalui `.env` tanpa mengubah kode

---

*Document ini dibuat sebagai panduan teknis untuk tim Antigravity Google dalam membangun WhatsApp Sholat Reminder Bot. Untuk pertanyaan atau klarifikasi, hubungi Project Owner.*
