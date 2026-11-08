# docs — UNIDA Prayer V2 (Rancangan Matang)

> Baseline: `../UNIDA_Prayer_Rancangan_Teknis_V2.md` v2.0 (4 Nov 2026).
> Folder ini adalah **acuan eksekusi**. Jangan coding sebelum `13-open-questions.md` blocker dijawab.

## Cara baca

| # | File | Isi | Wajib dibaca sebelum fase |
|---|---|---|---|
| 01 | `01-overview-scope.md` | Tujuan, prinsip, scope MVP, non-scope | Semua fase |
| 02 | `02-arsitektur-struktur-repo.md` | Diagram, tanggung jawab, struktur monorepo | Phase 1 |
| 03 | `03-database.md` | Schema 4 tabel, key, index, migration | Phase 1, 4 |
| 04 | `04-prayer-engine-kalender.md` | Hisab, timezone, Hijriyah, validasi Kemenag | Phase 2 |
| 05 | `05-backend-api.md` | Kontrak endpoint, auth, error, validasi | Phase 1–5 |
| 06 | `06-worker-scheduler.md` | Generator, dispatcher, retry, recovery | Phase 4 |
| 07 | `07-waha-integration.md` | Client WAHA GoWS, pairing, grup, webhook | Phase 3 |
| 08 | `08-frontend.md` | Landing + dashboard, route, state, branding | Phase 2, 5 |
| 09 | `09-security-logging-monitoring.md` | Keamanan, logging, health, heartbeat | Phase 1, 5 |
| 10 | `10-devops-cicd.md` | Docker, Compose, GHCR, env, update/rollback | Phase 1, 6 |
| 11 | `11-testing.md` | Unit + integration, mock WAHA | Semua fase |
| 12 | `12-migrasi-v1-ke-v2.md` | Pemetaan V1 → V2, apa dibawa/dibuang | Phase 2–4 |
| 13 | `13-open-questions.md` | **Ambiguitas + keputusan yang harus dipastikan** | Sebelum coding |
| 14 | `14-panduan-mysql.md` | Panduan setup MySQL eksternal (dieksekusi pemilik) | Sebelum Fase 1 |
| — | `../TODO.md` | Daftar kerja per fase + acceptance | Harian |
| — | `../AGENTS.md` | Aturan agen coding | Selalu |

## Konvensi

- Waktu simpan: **UTC** (`DATETIME(3)`), tanggal shalat: `DATE` lokal.
- Tampil: timezone dari `app_settings.location.timezone` (default `Asia/Jakarta`).
- Status/tipe memakai string konsisten: `PENDING/PROCESSING/SENT/FAILED/EXPIRED/CANCELLED/UNKNOWN`, `PRE_REMINDER/ADHAN`, `FAJR/DHUHR/ASR/MAGHRIB/ISHA`.
- Format response API: `{ data, error: { code, message } | null }`.
- Semua konfigurasi operasional di MySQL; `.env` hanya secret + koneksi service.
