# 03 — Database MySQL

> Satu DB `unida_prayer`, satu user aplikasi, `utf8mb4`. MySQL di luar Compose. Koneksi via `DATABASE_URL`.

## 3.1 Prinsip

- Charset `utf8mb4`, collation `utf8mb4_unicode_ci`.
- Semua kolom waktu bertipe `DATETIME(3)` dan **disimpan UTC**. `prayer_date` bertipe `DATE` = tanggal lokal dasar hisab.
- Hak user DB: `SELECT/INSERT/UPDATE/DELETE` + `CREATE/ALTER/DROP/REFERENCES/INDEX` untuk migration Drizzle di schema `unida_prayer` saja. Tanpa `SUPER`, tanpa akses schema lain.
- Migration via Drizzle (`drizzle-orm` + `drizzle-kit` + `mysql2`). Perintah: `bun run db:migrate`. **Kompatibel maju** (tambah kolom nullable / default dulu); rollback DB tidak otomatis — backup sebelum migration berisiko.
- `app_settings.value` bertipe `JSON`, **wajib divalidasi schema TS** di backend. Jangan biarkan JSON bebas masuk.

## 3.2 Tabel MVP (lima tabel)

Versi awal menggunakan **lima** tabel utama: `admins`, `app_settings`, `message_targets`, `scheduled_messages`, `hadiths`.

#### A. `admins`

Login dashboard. Beda dengan user koneksi MySQL.

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT PK | — |
| `name` | VARCHAR(120) NOT NULL | trim, min 2 |
| `email` | VARCHAR(190) NOT NULL UNIQUE | lowercased, format email |
| `password_hash` | VARCHAR(255) NOT NULL | Argon2id (rekomendasi; lihat `09-security`) |
| `is_active` | BOOLEAN NOT NULL DEFAULT TRUE | login ditolak bila false |
| `last_login_at` | DATETIME(3) NULL | update saat login sukses |
| `created_at` / `updated_at` | DATETIME(3) NOT NULL | UTC, auto |

Index: `UNIQUE(email)`.

Seed: `bun run db:seed` membuat akun admin utama (interaktif / env sekali pakai, password wajib diganti setelah login pertama) **bersama** seed hadits awal (lihat E). Idempotent: lewati bila email sudah ada.

## 3.3 Tabel `app_settings` (key-value)

| Kolom | Tipe |
|---|---|
| `key` | VARCHAR(100) PK |
| `value` | JSON NOT NULL |
| `updated_at` | DATETIME(3) NOT NULL |

### Key yang dikenal (+ schema validasi)

- `location`: `{ name: string, latitude: -90..90, longitude: -180..180, timezone: IANA }`
  Contoh: `{ "name": "UNIDA Gontor", "latitude": -7.8652, "longitude": 111.4617, "timezone": "Asia/Jakarta" }`
- `prayer_calculation`: `{ fajrAngle: number(>0,<30), ishaAngle: number, asrFactor: 1|2, methodLabel: "Kemenag"|"Muhammadiyah"|"Custom" }`
  Default: `{ fajrAngle: 20, ishaAngle: 18, asrFactor: 1, methodLabel: "Kemenag" }`
- `prayer_adjustments`: `{ fajr: int, sunrise?: int, dhuhr: int, asr: int, maghrib: int, isha: int }` menit, range mis. −10..+10 (kunci Q-PRAY-02).
- `reminder_settings`: `{ enabled: bool, preReminderEnabled: bool, adhanReminderEnabled: bool, preReminderMinutes: 1..30 (default 3), lateGraceMinutes: default 5 }`
- `hijri_settings`: `{ adjustmentDays: -2..+2 (default 0) }` — hanya tampil, tak ubah hisab.
- `content_settings`: `{ includeHadith: bool default true, fridayLabel: "Jumat" }` + flag `sendingEnabled` global (kill-switch, lihat `07-waha`).
- `worker_heartbeat`: `{ atUtc: string ISO, workerId: string, version?: string }` — ditulis worker tiap ~30 dtk. Dashboard menilai healthy/warning/offline (ambang di `09-security-logging`).

Aturan update settings lokasi/metode/koreksi/pre-menit → backend validasi → simpan → **picu regenerasi job `PENDING` masa depan** (lihat `06-worker-scheduler.md` §6.6). `SENT` tak boleh diubah; `PROCESSING` jangan auto-ubah.

## 3.4 Tabel `message_targets`

| Kolom | Tipe |
|---|---|
| `id` | BIGINT UNSIGNED PK |
| `target_type` | VARCHAR(16) NOT NULL DEFAULT 'GROUP' (MVP hanya `GROUP`; kelak `CHAT`) |
| `target_id` | VARCHAR(255) NOT NULL UNIQUE (ID grup dari WAHA, mis. `1203...@g.us`) |
| `name` | VARCHAR(190) NOT NULL |
| `is_active` | BOOLEAN NOT NULL DEFAULT FALSE |
| `created_at` / `updated_at` | DATETIME(3) NOT NULL |

Index: `UNIQUE(target_id)`, `INDEX(is_active)`.

Kebijakan:
- Grup baru dari sync default `is_active=FALSE`. Admin eksplisit mengaktifkan.
- Nonaktifkan ≠ hapus riwayat. Hapus fisik **dilarang** bila masih punya row di `scheduled_messages`; gunakan soft-disable. Bila hapus benar-benar perlu: nonaktifkan dulu, FK `RESTRICT`, dan tentukan retensi riwayat (Q-DB-02).

## 3.5 Tabel `scheduled_messages` (antrean + riwayat)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BIGINT UNSIGNED PK | — |
| `idempotency_key` | CHAR(64) NOT NULL UNIQUE | `sha256(prayer_date\|prayer_name\|message_type\|targetDbId)` |
| `prayer_date` | DATE NOT NULL | tanggal lokal dasar hisab |
| `prayer_name` | VARCHAR(20) NOT NULL | `FAJR,DHUHR,ASR,MAGHRIB,ISHA` |
| `message_type` | VARCHAR(30) NOT NULL | `PRE_REMINDER,ADHAN` |
| `target_id` | BIGINT UNSIGNED NOT NULL FK → `message_targets.id` | `ON UPDATE CASCADE / ON DELETE RESTRICT` |
| `prayer_time_utc` | DATETIME(3) NOT NULL | waktu shalat UTC |
| `scheduled_at_utc` | DATETIME(3) NOT NULL | waktu kirim UTC (= prayer_time − pre-menit untuk PRE) |
| `message_body` | TEXT NOT NULL | **snapshot** final yang dikirim |
| `content_ref` | VARCHAR(100) NULL | mis. `hadith:12` / `template:maghrib:v2` |
| `status` | VARCHAR(20) NOT NULL DEFAULT 'PENDING' | enum di §3.6 |
| `attempt_count` | INT UNSIGNED NOT NULL DEFAULT 0 | naik tiap percobaan |
| `next_attempt_at_utc` | DATETIME(3) NULL | retry berikutnya |
| `claimed_at_utc` | DATETIME(3) NULL | waktu klaim |
| `sent_at_utc` | DATETIME(3) NULL | sukses kirim |
| `waha_message_id` | VARCHAR(255) NULL | dari WAHA bila ada |
| `last_error` | TEXT NULL | error terakhir, tanpa secret |
| `created_at` / `updated_at` | DATETIME(3) NOT NULL | — |

Index/constraint:
- `UNIQUE(idempotency_key)`
- `UNIQUE(prayer_date, prayer_name, message_type, target_id)` (lapis kedua anti-duplikat)
- `INDEX(status, scheduled_at_utc)` (polling dispatcher)
- `INDEX(status, next_attempt_at_utc)` (retry)
- `FK target_id → message_targets.id`

Catatan:
- `message_body` snapshot: perubahan template/settings **tidak** mengubah job yang sudah dibuat (kecuali regenerasi eksplisit yang menghapus/membuat ulang `PENDING` masa depan).
- `content_ref` untuk audit hadits anti-repeat.

## 3.6 Tabel `hadiths` (keputusan pemilik: hadits di DB + CRUD admin)

`data/hadiths.json` tetap ada sebagai **seed awal berversi**; runtime membaca dari tabel ini, bukan dari JSON.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BIGINT UNSIGNED PK | — |
| `seed_key` | VARCHAR(100) NULL UNIQUE | mis. `hadith-01`; untuk seed idempotent, NULL untuk data input manual |
| `text` | TEXT NOT NULL | terjemahan Indonesia, min 10 karakter, terverifikasi |
| `source` | VARCHAR(255) NOT NULL | mis. `HR. Muslim` |
| `topic` | VARCHAR(100) NOT NULL DEFAULT 'sholat_tepat_waktu' | grouping bila kelak bertambah |
| `is_active` | BOOLEAN NOT NULL DEFAULT TRUE | hanya yang aktif dipakai worker |
| `created_at` / `updated_at` | DATETIME(3) NOT NULL | — |

Index: `UNIQUE(seed_key)`, `INDEX(is_active)`.

Aturan:
- Worker memilih acak dari `is_active=true`, menghindari hadits pada `content_ref` terakhir (anti-repeat berurutan); bila hanya 1 aktif, pakai itu; bila 0 aktif → kirim tanpa hadits + dashboard warning (jangan gagal kirim).
- `DELETE`: soft-disable (`is_active=false`) bila `id` sudah pernah dipakai di `scheduled_messages.content_ref`; hapus fisik hanya bila belum pernah dipakai.
- Dilarang menambah hadits dari API acak tak terverifikasi.

## 3.7 Status (kontrak, jangan tambah tanpa migration + update worker + UI)

| Status | Arti | Boleh retry auto? |
|---|---|---|
| `PENDING` | menunggu jatuh tempo | — (menunggu) |
| `PROCESSING` | diklaim worker | — |
| `SENT` | WAHA terima (bukan jaminan dibaca user) | tidak |
| `FAILED` | gagal permanen / habis retry | tidak (hanya manual bila memenuhi syarat) |
| `EXPIRED` | lewat `lateGraceMinutes`, tak relevan dikirim | tidak |
| `CANCELLED` | dibatalkan (target off / config berubah / manual) | tidak |
| `UNKNOWN` | hasil ambigu (timeout pasca-kirim) | tidak auto; verifikasi manual |

## 3.8 Mengapa belum perlu tabel lain

- Tanpa `prayer_schedules`: waktu trigger sudah di `scheduled_messages`; hisab ulang via engine.
- Tanpa `message_logs`: status+error di row; detail teknis ke stdout/Docker logs.
- Tanpa `wa_sessions`: single session, status live dari WAHA; metadata seperlunya di `app_settings`.
- Tanpa `templates`: template awal di TypeScript; tambah tabel bila admin perlu edit template dari dashboard (fase lanjutan).

## 3.9 DDL konseptual (acuan, bukan SQL final Drizzle)

Drizzle schema menjadi sumber kebenaran; contoh di bawah hanya untuk menyamakan pemahaman tipe/index/FK. SQL final dihasilkan `drizzle-kit generate`.

- PK BIGINT UNSIGNED, FK `target_id` RESTRICT on delete.
- Unique ganda: `idempotency_key` + composite `(prayer_date, prayer_name, message_type, target_id)`.
- `hadiths.seed_key` unique untuk seed idempotent.
- Semua timestamp `DATETIME(3)` UTC; tulis via helper `utcNow()` (jangan `NOW()` host tanpa konversi eksplisit).
