# 07 — Integrasi WAHA GoWS

> Satu sesi MVP. Semua via `apps/api/src/integrations/waha/`. Frontend tak tahu WAHA.

## 7.1 Prinsip

- Engine eksplisit `GOWS` (env `WHATSAPP_DEFAULT_ENGINE`). Image pin: **`devlikeapro/waha:gows-2026.10.1`** (diputuskan 4 Nov 2026; cek tag terbaru di Docker Hub bila Fase 3 menemukan rilis stabil lebih baru).
- `WAHA_API_KEY` hanya di env backend/worker + env WAHA. Jangan kirim ke browser, jangan log.
- Port WAHA **tidak** dibuka ke internet. Di Compose hanya `expose: 3000` internal (lihat `10-devops-cicd.md`).
- Data sesi di volume `waha_sessions:/app/.sessions`. Restart/update image **tak boleh** hapus volume.
- Nomor WA khusus operasional. Global kill-switch `content_settings.sendingEnabled` (atau `reminder_settings.enabled`) harus dicek dispatcher sebelum kirim.

## 7.2 Struktur client

```text
integrations/waha/
├── client.ts    # baseUrl=WAHA_BASE_URL, header X-Api-Key, timeout 10–15 dtk, map error
├── sessions.ts  # status/start/stop/restart/logout/qr
├── groups.ts    # list groups (+ pagination bila ada)
├── messages.ts  # sendText(session, chatId, text)
├── webhooks.ts  # validasi + mapping event → update DB
└── types.ts     # tipe respons yang dipakai app (bukan seluruh API WAHA)
```

Bila versi WAHA berubah, ubah **hanya** folder ini + `docs` ini.

## 7.3 Alur pairing (detail)

1. Admin buka `/admin/whatsapp` → `GET /api/admin/whatsapp/session` → backend `GET {WAHA}/api/sessions/{name}` (nama endpoint menyesuaikan versi pin).
2. Bila `SCAN_QR` → admin klik "Tampilkan QR" → `GET .../qr` → backend teruskan data aman tampil (dataURL/SVG/text). Jangan simpan payload QR di DB/log.
3. Admin scan dari HP operasional → frontend polling `session` tiap 3–5 dtk (atau webhook bila ada) hingga `WORKING`.
4. `stop/restart/logout` wajib konfirmasi UI + audit log. `logout` menghapus pairing → status kembali SCAN_QR.

Timeout QR: ikuti masa berlaku WAHA; bila kedaluwarsa, minta QR baru (jangan cache QR lama).

## 7.4 Grup & target

- `POST /groups/sync`: backend `GET {WAHA}/api/.../groups` → petakan `id + name` → upsert ke `message_targets`:
  - Baru → `is_active=FALSE`, `target_type='GROUP'`.
  - Ada → update `name/updated_at`, jangan ubah `is_active` diam-diam.
  - Grup yang tak lagi muncul → tandai? Jangan hapus otomatis; tampilkan "tidak terlihat di WAHA" bila perlu (kunci Q-WAHA-02).
- Jangan auto-kirim ke semua grup hasil sync. Admin eksplisit aktifkan.
- `POST /test-message`: `{ targetId(db id) }` untuk grup tersimpan ATAU `{ phone }` untuk nomor pribadi (tanpa simpan DB) + `text?` opsional → cek target ada + sesi WORKING + rate-limit → kirim teks uji (default template uji + timestamp). Catat di log, **bukan** di `scheduled_messages` (atau tandai jelas bila dicatat).
- `POST /test-day/preview|start|status|cancel`: simulasi sehari penuh (pre-reminder + adzan tiap waktu, konten identik generator, tanpa tulis DB). Jeda 3 dtk + acak 1–2 dtk antar pesan; satu run aktif dalam satu waktu; bisa batal mid-run.

## 7.5 Pengiriman & batas wajar

- Kirim teks saja untuk MVP. Satu request per (job × target). Jeda antar kirim mis. 500–1500 ms bila banyak target (kunci Q-WAHA-04) agar tak dianggap spam.
- Jangan kirim pesan identik massal agresif. Hormati `sendingEnabled=false` (job tetap dibuat? atau dilewati — kunci Q-WORK-03; rekomendasi: tetap buat PENDING tapi dispatcher skip + tampilkan "pengiriman dinonaktifkan").
- WAHA/GoWS **bukan** WhatsApp Business Platform resmi. Pahami risiko perubahan protokol + pembatasan akun. Sediakan prosedur pairing ulang + nomor cadangan (operasional, bukan kode).

## 7.6 Webhook (opsional tapi disiapkan)

- Endpoint `POST /api/webhooks/waha`. Validasi via header secret/signature sesuai versi WAHA (kunci Q-WAHA-03). Tolak 401 bila tak valid.
- Gunakan untuk: update `waha_message_id`, konfirmasi kirim, deteksi session down → pengaruhi `/system/status`.
- Jangan percaya webhook buta untuk mengubah `SENT→FAILED` tanpa aturan jelas; dokumentasikan mapping event per versi.

## 7.8 Menjalakan WAHA dev lokal (tanpa deployment production)

File: `deploy/compose.waha-dev.yml` — hanya service `waha` (image pin sama
dengan production). Port host `:3008` agar tidak tabrakan dengan `next dev`
(`:3000`). Sesi di volume `waha_dev_sessions` (persist, jangan hapus kecuali
mau pairing ulang dari nol).

```bash
# Dari root repo:
docker compose --env-file .env -f deploy/compose.waha-dev.yml up -d
docker compose --env-file .env -f deploy/compose.waha-dev.yml logs -f   # lihat log
curl -s http://localhost:3008/api/sessions -H "X-Api-Key: $WAHA_API_KEY"
docker compose --env-file .env -f deploy/compose.waha-dev.yml down      # matikan (volume tetap ada)
```

Syarat: `.env` lokal `WAHA_BASE_URL=http://localhost:3008` + `WAHA_API_KEY`
sama dengan yang dipakai container (interpolasi `${WAHA_API_KEY}` dari `.env`
root). API backend + dashboard `/admin/whatsapp` langsung bisa dipakai untuk
pairing QR, sync grup, dan test-message — tanpa deploy production.

## 7.9 Error mapping (backend → UI)

| Gejala WAHA | Kode API | Pesan UI |
|---|---|---|
| Session STOPPED / SCAN_QR | `WHATSAPP_SESSION_NOT_CONNECTED` (503/409) | "Sesi belum terhubung. Selesaikan pairing." |
| 401/403 dari WAHA | `WAHA_UPSTREAM_ERROR` (502) | "Kredensial WAHA salah / API key tidak valid (cek server). " |
| Timeout | `WAHA_UPSTREAM_ERROR` + job `UNKNOWN` bila ambigu | "Hasil ambigu, perlu verifikasi manual." |
| Chat/grup tak ditemukan | `TARGET_NOT_FOUND` / job `FAILED` | "Target tidak valid / keluar dari grup." |
| 429 WAHA | retry backoff, jangan spam | "Dibatasi WAHA, retry terjadwal." |
