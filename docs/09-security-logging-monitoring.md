# 09 — Keamanan, Logging, Monitoring MVP

## 9.1 Keamanan (checklist wajib)

1. Hash password **Argon2id** (rekomendasi; bcrypt 12+ alternatif — kunci Q-AUTH-03). Jangan plaintext/MD5/SHA1 polos.
2. Cookie session: `HttpOnly; Secure (prod HTTPS); SameSite=Lax; Path=/`. Tanpa token di localStorage/URL.
3. Tanpa registrasi publik. Seed via CLI. Tolak login bila `is_active=false`.
4. Semua `/api/admin/*` cek auth di backend. 401/403 konsisten, tanpa bocor "email terdaftar?".
5. Validasi backend semua input (email, lat/lng, timezone IANA, sudut, menit, enum). Query Drizzle/parameterized.
6. `WAHA_API_KEY`, `DATABASE_URL`, `APP_SECRET` hanya di env server. Tak ke frontend/log/error.
7. MySQL + WAHA tak dibuka ke internet. WAHA hanya `expose` internal.
8. `.env` prod tak di-commit. `.env.example` tanpa secret asli.
9. Error tanpa secret/stack/QR. Rate-limit: login (mis. 5/10 mnt/IP+email), test-message, sync, retry/cancel (kunci Q-SEC-01).
10. Konfirmasi UI + audit log untuk: logout WAHA, nonaktifkan target, cancel/retry manual, ubah settings.
11. Nomor WA khusus + target disetujui. Kill-switch pengiriman tersedia.

## 9.2 Health & heartbeat

- `GET /api/health` → `{ status:"ok" }` (liveness, tanpa DB).
- `GET /api/ready` → cek `SELECT 1` + config dasar; 200 siap / 503 belum (dipakai Docker healthcheck + dashboard).
- `worker_heartbeat` tiap 30 dtk: `{ atUtc, workerId, version }`.
- Interpretasi dashboard (usulan, kunci Q-MON-01):
  - `healthy`: heartbeat < 90 dtk,
  - `warning`: 90 dtk–5 mnt,
  - `offline`: > 5 mnt atau tak ada.
- Status WAHA tampil apa adanya dari WAHA (jangan tebak dari container hidup).

## 9.3 Logging

- API/worker/WAHA → **stdout/stderr**, format **JSON terstruktur**: `{ ts, level, service, msg, prayer_date?, target_id?, idempotency_key?, attempt?, latencyMs?, errorCode? }`.
- Jangan log: password, token, connection string, QR payload, cookie session, isi `WAHA_API_KEY`.
- Bisnis (SENT/FAILED/dll) di `scheduled_messages.last_error/sent_at`; detail teknis di Docker logs (`docker compose logs -f --tail=100 api worker web waha`).
- Tanpa file log di container (beda dengan V1 Winston file). Bila perlu file, putuskan di Q-LOG-01.

## 9.4 Operasional aman

- Backup MySQL sebelum migration berisiko + sebelum update image mayor.
- Backup volume `waha_sessions` terpisah (pairing ulang mahal).
- Rollback app via tag SHA (lihat `10-devops`); rollback DB manual + kompatibel maju.
