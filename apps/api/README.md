# UNIDA Prayer — Backend API & Worker Engine

Backend service untuk **UNIDA Prayer V2** yang menyediakan RESTful API berbasis **Elysia.js** (Bun) dan background scheduler worker berbasis database MySQL.

## 🚀 Fitur Utama

- **Public Prayer Endpoints (`/api/public/prayer/*`)**:
  - `GET /api/public/prayer/today`: Jadwal shalat hari ini beserta shalat berikutnya, countdown, dan kalender Hijriyah.
  - `GET /api/public/prayer/next`: Shalat berikutnya dan waktu tersisa.
  - `GET /api/public/prayer/settings`: Konfigurasi hisab publik (lokasi, zona waktu).
- **Admin Authentication (`/api/auth/*`)**:
  - `POST /api/auth/login`: Otentikasi admin berbasis session cookie.
  - `POST /api/auth/logout`: Menghapus sesi admin.
  - `GET /api/auth/me`: Data profil admin yang sedang login.
- **Admin Management Endpoints (`/api/admin/*`)**:
  - `/api/admin/system/status`: Diagnostik menyeluruh (koneksi DB, API, heartbeat worker, status WAHA, statistik pesan).
  - `/api/admin/whatsapp/*`: Sesi WAHA (status, start, stop, restart, logout, qr-code).
  - `/api/admin/targets/*`: Sinkronisasi grup WhatsApp, update target aktif, dan test message.
  - `/api/admin/prayer/*`: Lokasi hisab, koreksi menit shalat, adjustment hari Hijriyah, dan recalculate horizon.
  - `/api/admin/messages/*`: Riwayat pengiriman, filter status, retry pesan failed/unknown, dan cancel pesan pending.
  - `/api/admin/hadiths/*`: CRUD hadits & ayat rujukan.
  - `/api/admin/settings/*`: Pengaturan pre-reminder, kill-switch darurat.
- **Background Scheduler Worker**:
  - Generator jadwal otomatis 7 hari ke depan (`scheduled_messages`).
  - Klaim pengiriman atomik di MySQL untuk mencegah duplikasi.
  - Backoff berjenjang otomatis: 30s → 2m → 5m (maksimal 3x).
  - Jendela kadaluarsa pesan 5 menit.
  - Perlindungan status `UNKNOWN` tanpa retry buta.

## 💻 Menjalankan Secara Lokal

```bash
# Menjalankan server API (port 3001)
bun run dev

# Menjalankan worker scheduler background
bun run worker
```

## 🗄️ Database Migrations & Seeds

```bash
# Menerapkan migration Drizzle
bun run db:migrate

# Mengisi akun admin awal & hadits seed
bun run db:seed
```
