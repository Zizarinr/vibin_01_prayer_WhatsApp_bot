# 05 — Backend API (Elysia)

> Prefix semua endpoint: `/api`. Format konsisten. Validasi di backend. Frontend hanya via API ini.

## 5.1 Format respons & error

Sukses: `HTTP 2xx` + `{ "data": {...}, "error": null }`
Gagal: HTTP sesuai + `{ "data": null, "error": { "code": "SNAKE_CASE", "message": "ID jelas" } }`

Aturan:
- Jangan selalu 200 untuk error. 400 validasi, 401 belum login, 403 nonaktif/forbidden, 404 tidak ada, 409 konflik/duplikat, 422 aturan bisnis, 429 rate-limit, 502 WAHA hulu gagal, 503 DB/WAHA belum siap.
- `message` Indonesia, tanpa secret/stack/connection-string.
- Kode error terdaftar di `packages/shared/errorCodes.ts` (contoh: `UNAUTHENTICATED`, `VALIDATION_ERROR`, `WHATSAPP_SESSION_NOT_CONNECTED`, `TARGET_NOT_FOUND`, `MESSAGE_ALREADY_SENT`, `MESSAGE_EXPIRED`, `WAHA_UPSTREAM_ERROR`, `DB_UNAVAILABLE`).

## 5.2 Auth (`/api/auth`)

| Method | Endpoint | Fungsi | Catatan |
|---|---|---|---|
| POST | `/api/auth/login` | email+password → cookie session HttpOnly | rate-limit ketat; update `last_login_at`; tolak `is_active=false` |
| POST | `/api/auth/logout` | hapus session | — |
| GET | `/api/auth/me` | info admin login | 401 bila tidak login |
| POST | `/api/auth/change-password` | old+new → hash baru | validasi kekuatan; cabut session lain (Q-AUTH-02) |

Mekanisme (kunci Q-AUTH-01): rekomendasi session cookie opaque di DB/memory + `APP_SECRET` sign, `HttpOnly; Secure (prod HTTPS); SameSite=Lax`. Alternatif JWT HttpOnly — putuskan sebelum Phase 1. Tanpa registrasi publik. Seed via CLI.

Semua `/api/admin/*` wajib middleware auth + cek aktif. Sembunyikan menu di UI **bukan** proteksi.

## 5.3 Health & publik (tanpa auth)

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/health` | `200 { status:"ok" }` — proses hidup, tanpa cek DB |
| GET | `/api/ready` | cek DB (`SELECT 1`) + kehadiran config dasar; 503 bila belum siap |
| GET | `/api/public/prayer/today` | jadwal hari ini (lokal+UTC), `timezone`, `locationName`, `hijri`, `nextPrayer`, `serverNowUtc` |
| GET | `/api/public/prayer/next` | waktu berikutnya + `scheduled_at_utc` untuk countdown |
| GET | `/api/public/settings` | **whitelist saja**: `locationName, timezone` (+ info WA grup, tanpa secret) |

Jangan expose: sudut detail bila tak perlu, WAHA key/URL, DATABASE_URL, email admin.

Query `today`: `?date=YYYY-MM-DD` opsional (default hari lokal server di timezone app). Validasi format tanggal.

## 5.4 Settings & prayer (admin)

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/admin/settings` | seluruh settings yang boleh dilihat admin |
| PATCH | `/api/admin/settings` | update parsial tervalidasi; picu regenerasi PENDING |
| GET | `/api/admin/prayer/today` | seperti publik + info engine/adjustment untuk dashboard |
| POST | `/api/admin/prayer/preview` | hitung dari kandidat input, tanpa simpan |
| POST | `/api/admin/prayer/recalculate` | regenerasi PENDING masa depan; kembalikan ringkasan diubah/dibatalkan |

`PATCH /settings` body contoh tervalidasi:
`{ location?: {...}, prayer_calculation?: {...}, prayer_adjustments?: {...}, reminder_settings?: {...}, hijri_settings?: {...}, content_settings?: {...} }`
Tolak nilai di luar range; kembalikan field error per key.

`recalculate`: operasi bisa async bila horizon besar — respons `202 { jobId/recalcId, summary }` atau sync bila cepat (kunci Q-API-01). Tak boleh ubah `SENT/PROCESSING`.

## 5.5 WhatsApp (admin)

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/admin/whatsapp/session` | status live dari WAHA (WORKING/SCAN_QR/STOPPED/dll) + info akun bila ada |
| POST | `/api/admin/whatsapp/session/start` | start sesi `WAHA_SESSION` |
| POST | `/api/admin/whatsapp/session/stop` | stop |
| POST | `/api/admin/whatsapp/session/restart` | restart |
| POST | `/api/admin/whatsapp/session/logout` | logout + hapus pairing (konfirmasi UI) |
| GET | `/api/admin/whatsapp/session/qr` | QR/data pairing bila status SCAN_QR; jangan log payload |
| POST | `/api/admin/whatsapp/test-message` | `{ targetId, text? }` kirim uji ke target yang dipilih |
| POST | `/api/admin/whatsapp/groups/sync` | tarik grup WAHA → upsert `message_targets` (baru default nonaktif) |

Semua via integration layer. Petakan nama endpoint WAHA aktual sesuai versi yang di-pin (lihat `07-waha-integration.md`). Timeout + error `WAHA_UPSTREAM_ERROR` yang jelas.

## 5.6 Targets & messages (admin)

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/admin/targets` | list + filter `?active=true/false&search=` |
| PATCH | `/api/admin/targets/:id` | `{ is_active?, name? }`; nonaktifkan tak hapus riwayat |
| GET | `/api/admin/messages` | pagination `?page&limit&status&prayer_name&message_type&target_id&from&to&search=`; sertakan `targetName` |
| GET | `/api/admin/messages/:id` | detail 1 job (+ `message_body`, attempt, error, waha id) |
| POST | `/api/admin/messages/:id/retry` | manual retry **hanya** bila `FAILED` (atau `UNKNOWN` setelah verifikasi) + belum expired + target aktif; buat `next_attempt_at_utc=now` |
| POST | `/api/admin/messages/:id/cancel` | hanya `PENDING` (atau `PROCESSING` yang belum terkirim — kunci Q-API-02) → `CANCELLED` |

Hapus target fisik: tolak (409) bila masih punya riwayat, kecuali kebijakan retensi diputuskan (Q-DB-02).

## 5.7 System & webhook

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/admin/system/status` | `{ api, database:{ok,latencyMs}, worker:{lastHeartbeatAt,state}, waha:{status}, counts:{todaySent,pending,failed}, recent: [...] }` |
| POST | `/api/webhooks/waha` | terima event WAHA (kirim/delivery/session) → update `waha_message_id/status` bila relevan |

Webhook: validasi sesuai mekanisme WAHA (header secret/signature — kunci Q-WAHA-03). Tolak tanpa auth bila terekspos. Log tanpa secret.

## 5.8 Validasi & keamanan ringkas

- Semua input admin divalidasi schema (tipe, range lat/lng, IANA timezone, sudut, menit, enum status).
- Query Drizzle/parameterized saja.
- Rate-limit: login + test-message + sync + retry/cancel (lihat `09-security`).
- Audit minimal: login, ganti password, ubah settings, aktif/nonaktif target, retry/cancel manual → simpan ke log terstruktur (tak perlu tabel audit MVP, tapi log JSON wajib).
