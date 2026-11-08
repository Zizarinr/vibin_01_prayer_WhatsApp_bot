<div align="center">
  <img src="apps/web/public/app-icon-512.png" width="128" height="128" alt="UNIDA Prayer Logo" style="border-radius: 28px; box-shadow: 0 8px 24px rgba(18, 59, 109, 0.25);" />
  <h1>🕌 UNIDA Prayer V2</h1>
  <p><strong>Sistem Pengingat Waktu Shalat WhatsApp & Dashboard Jadwal Kampus Siman</strong><br><em>Universitas Darussalam Gontor</em></p>

  <p>
    <a href="#fitur-utama">Fitur Utama</a> •
    <a href="#arsitektur-monorepo">Arsitektur</a> •
    <a href="#instalasi--menjalankan-lokal">Quick Start</a> •
    <a href="#perintah-rujukan">Perintah CLI</a> •
    <a href="#deployment-produksi">Deployment</a> •
    <a href="#dokumentasi-teknis">Dokumentasi</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Bun-Workspace-f472b6?logo=bun&logoColor=white" alt="Bun">
    <img src="https://img.shields.io/badge/TypeScript-Strict-3178c6?logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Next.js-16%20Turbopack-000000?logo=next.js&logoColor=white" alt="Next.js">
    <img src="https://img.shields.io/badge/Elysia.js-Backend-black" alt="Elysia">
    <img src="https://img.shields.io/badge/WAHA-GoWS%20Pinned-25D366?logo=whatsapp&logoColor=white" alt="WAHA">
    <img src="https://img.shields.io/badge/MySQL-Drizzle%20ORM-4479A1?logo=mysql&logoColor=white" alt="MySQL">
    <img src="https://img.shields.io/badge/Docker-Production-2496ED?logo=docker&logoColor=white" alt="Docker">
  </p>
</div>

---

## 📌 Ikhtisar Proyek

**UNIDA Prayer V2** adalah evolusi menyeluruh dari bot pengingat waktu shalat WhatsApp berbasis *in-memory* V1 menjadi platform terintegrasi untuk civitas akademika Universitas Darussalam Gontor (Kampus Siman).

Sistem ini memadukan **Landing Page Publik** berdesain modern, **Dashboard Administrator** lengkap untuk pengelolaan konten dan WhatsApp, **Backend API Elysia**, serta **Worker Scheduler Berbasis Database MySQL** yang tahan terhadap restart dan *crash*.

---

## ✨ Fitur Utama

- **Jadwal Shalat Akurat Kampus Siman**: Hisab astronomis lokal (lat −7.8652, lng 111.4617) dengan rujukan Kementerian Agama RI (Subuh 20°, Isya 18°, Madzhab Syafi'i) + kalender Umm al-Qura.
- **Landing Page Publik Informatif**:
  - Jam digital real-time (WIB) tersinkronisasi dengan server.
  - Kartu shalat berikutnya dengan hitung mundur (*live countdown*).
  - Status aktif, terlewati, dan penanda otomatis hari Jumat (*Sholat Jumat*).
  - Tombol **Salin Jadwal Hari Ini** satu klik berformat rapi untuk grup WhatsApp.
- **Dashboard Administrator Modern**:
  - Responsif penuh untuk desktop dan perangkat smartphone (dengan mobile top bar & navigation drawer).
  - Monitoring metrik operasional, status koneksi API, DB, heartbeat worker, dan sesi WAHA.
  - Audit trail aksi berisiko dan *Emergency Kill-Switch* penghentian pesan instan.
- **Integrasi WhatsApp WAHA (GoWS)**:
  - Dipin ke versi stabil teruji: `devlikeapro/waha:gows-2026.10.1`.
  - Manajemen sesi (Start, Stop, Restart, Logout, QR Scan) langsung dari dashboard.
  - Sinkronisasi grup target dengan kontrol aktif/nonaktif per grup + uji coba kirim pesan (*test-message*).
- **Scheduler Andal & Idempotent (Worker Background)**:
  - Generator bergulir dengan horizon 7 hari di MySQL (`scheduled_messages`).
  - Kunci idempotensi unik kombinasi tanggal, waktu shalat, tipe pesan, dan target ID.
  - Klaim pesan atomik di level database untuk mencegah duplikasi pengiriman.
  - Backoff berjenjang otomatis (30 detik → 2 menit → 5 menit, maksimal 3 kali retry) dan jendela kadaluarsa 5 menit.
  - Penanganan status `UNKNOWN` pada hasil ambiguous tanpa retry buta (*blind retry*).
- **Pengelolaan Hadits & Ayat Al-Qur'an**:
  - CRUD hadits di database dengan dukungan nonaktifkan (*soft-delete* jika pernah terkirim).
  - Algoritma anti-pengulangan hadits berturut-turut.
  - Deteksi otomatis ayat Al-Qur'an (label berganti menjadi *Ayat Hari Ini* bila rujukan diawali `QS.`).

---

## 🏗️ Arsitektur Monorepo

Dibangun dengan **Bun Workspace** dan TypeScript strict:

```text
vibin_01_prayer_WhatsApp_bot/
├── apps/
│   ├── web/                    # Frontend Next.js 16 (Turbopack, Tailwind CSS v4, Lucide)
│   │   ├── app/                # App Router: landing publik (/), login (/login), admin (/admin/*)
│   │   ├── components/         # Landing components, admin modules, & shared UI
│   │   └── public/             # Icon raster 3D high-res, favicon, manifest, OpenGraph
│   └── api/                    # Backend Elysia + Background Worker
│       └── src/
│           ├── core/           # Config, env validator, logger
│           ├── database/       # Schema Drizzle (5 tabel), koneksi MySQL, seed data
│           ├── integrations/   # WAHA HTTP Client, Sessions, Targets, Messages
│           ├── modules/        # Domain auth, prayer, targets, hadiths, messages, system
│           └── worker/         # Scheduler generator, dispatcher atomik, recovery
├── packages/
│   ├── prayer-engine/          # Kalkulator hisab shalat Kemenag & kalender Hijriyah
│   └── shared/                 # Tipe TypeScript bersama, kontrak API, konstanta domain
├── deploy/
│   ├── compose.yml             # Docker Compose produksi (WAHA + API + Web)
│   └── .env.example            # Template env untuk host produksi
├── infrastructure/
│   └── docker/                 # api.Dockerfile & web.Dockerfile (multi-stage)
├── data/
│   └── hadiths.json            # Seed hadits rujukan awal
├── docs/                       # Dokumentasi arsitektur detail (01-15)
└── TODO.md                     # Pelacak milestone dan fase eksekusi
```

---

## 🚀 Instalasi & Menjalankan Lokal

### 1. Prasyarat

- [Bun](https://bun.sh/) `v1.2` atau lebih baru
- [MySQL Server](https://www.mysql.com/) `8.0+` berjalan di host lokal (port 3306)
- [Docker](https://www.docker.com/) (opsional, untuk menjalankan WAHA lokal)

### 2. Kloning & Instal Dependensi

```bash
git clone https://github.com/FarrelGhozy/vibin_01_prayer_WhatsApp_bot.git
cd vibin_01_prayer_WhatsApp_bot
bun install --frozen-lockfile
```

### 3. Konfigurasi Lingkungan (`.env`)

Salin template konfigurasi:

```bash
cp .env.example .env
```

Sesuaikan parameter database lokal Anda:

```env
DATABASE_URL=mysql://unida:password_anda@127.0.0.1:3306/unida_prayer
ADMIN_DEFAULT_PASSWORD=KataSandiAman123!
WAHA_BASE_URL=http://127.0.0.1:3008
WAHA_API_KEY=kunci_rahasia_waha_lokal
PORT=3001
INTERNAL_API_URL=http://127.0.0.1:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup Database MySQL

Buat database `unida_prayer` pada MySQL lokal Anda (panduan lengkap ada di [`docs/14-panduan-mysql.md`](docs/14-panduan-mysql.md)), lalu jalankan migrasi & seeding:

```bash
# Jalankan migrasi 5 tabel schema Drizzle
bun run db:migrate

# Jalankan seeder (membuat akun admin default & mengimpor hadits awal)
bun run db:seed
```

### 5. Menjalankan Aplikasi

Buka terminal terpisah untuk masing-masing servis atau gunakan perintah workspace:

```bash
# Terminal 1: Backend API Elysia (port 3001)
bun run dev:api

# Terminal 2: Background Scheduler Worker
bun run worker

# Terminal 3: Frontend Next.js Web (port 3000)
bun run dev:web
```

Akses landing page di [http://localhost:3000](http://localhost:3000) dan portal admin di [http://localhost:3000/login](http://localhost:3000/login).

---

## 🛠️ Perintah Rujukan (CLI)

Semua script dikelola dari root `package.json`:

| Perintah | Deskripsi |
| :--- | :--- |
| `bun run typecheck` | Menjalankan typecheck TypeScript ketat di seluruh package |
| `bun run lint` | Linter ultra-cepat menggunakan `oxlint` |
| `bun run test` | Menjalankan unit & integration test (33 test pass) |
| `bun run build` | Melakukan build production (API TypeScript + Next.js Turbopack) |
| `bun run db:migrate` | Menerapkan migrasi Drizzle ke database MySQL |
| `bun run db:seed` | Mengisi data admin utama & hadits awal |
| `bun run dev:api` | Menjalankan server API Elysia dalam mode watch/dev |
| `bun run dev:web` | Menjalankan server web Next.js dalam mode development |
| `bun run worker` | Menjalankan worker scheduler background |

---

## 🚢 Deployment Produksi

### 1. CI/CD Otomatis

Setiap commit ke branch `main` akan diuji secara otomatis oleh GitHub Actions (`.github/workflows/build.yml`) yang mencakup linting, typecheck, dan unit testing. Jika lulus, CI akan membangun image multi-platform dan mempublikasikannya ke GitHub Container Registry:
- `ghcr.io/FarrelGhozy/unida-prayer-web`
- `ghcr.io/FarrelGhozy/unida-prayer-api`

### 2. Update Manual di Home Server

Deploy menggunakan Docker Compose produksi (tanpa MySQL di dalam Compose karena MySQL dikelola tersendiri di host):

```bash
# 1. Masuk ke direktori server
cd /opt/unida-prayer

# 2. Tarik image terbaru dari GHCR
docker compose -f deploy/compose.yml pull

# 3. Jalankan migrasi database
bun run db:migrate

# 4. Restart container secara aman
docker compose -f deploy/compose.yml up -d
```

---

## 📚 Dokumentasi Teknis

Dokumentasi lengkap dan spesifikasi arsitektur tersedia di direktori [`docs/`](docs/):

1. [`docs/01-overview-scope.md`](docs/01-overview-scope.md) — Gambaran umum, batas ruang lingkup, dan prinsip V2
2. [`docs/02-arsitektur-struktur-repo.md`](docs/02-arsitektur-struktur-repo.md) — Struktur monorepo Bun Workspace & flow data
3. [`docs/03-database.md`](docs/03-database.md) — Rancangan 5 tabel MySQL & skema Drizzle ORM
4. [`docs/04-prayer-engine-kalender.md`](docs/04-prayer-engine-kalender.md) — Metodologi hisab Kemenag & kalender Hijriyah
5. [`docs/05-backend-api.md`](docs/05-backend-api.md) — Kontrak endpoint API publik & admin
6. [`docs/06-worker-scheduler.md`](docs/06-worker-scheduler.md) — Mekanisme dispatcher pesan, generator 7 hari, & idempotensi
7. [`docs/07-waha-integration.md`](docs/07-waha-integration.md) — Panduan integrasi WAHA GoWS
8. [`docs/08-frontend.md`](docs/08-frontend.md) — Desain layout landing & dashboard admin
9. [`docs/10-devops-cicd.md`](docs/10-devops-cicd.md) — Strategi CI/CD GitHub Actions & deployment home server
10. [`docs/14-panduan-mysql.md`](docs/14-panduan-mysql.md) — Panduan provisioning user & database MySQL
11. [`docs/15-pembekuan-template-hadits.md`](docs/15-pembekuan-template-hadits.md) — Format template WhatsApp & daftar hadits/ayat

---

## 📄 Lisensi

Hak Cipta © 2026 **Universitas Darussalam Gontor**.  
Dikembangkan untuk kebutuhan internal civitas akademika UNIDA Gontor Kampus Siman.
