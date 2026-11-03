# TODO — UNIDA Prayer V2 (Eksekusi setelah rancangan disetujui)

> Aturan: kerjakan berurutan per fase. Satu item selesai = DoD di `AGENTS.md` §7 terpenuhi. Update `[ ]`→`[x]`.

## Fase 0 — Persetujuan rancangan (tanpa coding)

- [x] Susun `AGENTS.md` + `docs/` (01–14) + `TODO.md`
- [x] Jawab BLOCKER (4 Nov 2026): OWNER=`FarrelGhozy`; WAHA = pin stabil terbaru saat Fase 3 (tanpa `latest`); MySQL port 3306 standar, provisioning pemilik + panduan `docs/14-panduan-mysql.md`; domain/proxy/TLS ditunda, Compose khusus production, dev native
- [x] Perubahan rancangan: hadits → tabel `hadiths` + CRUD admin; `data/hadiths.json` jadi seed awal bersama akun admin utama
- [x] Konfirmasi visibilitas package GHCR: **public**
- [x] WAHA pin: **`devlikeapro/waha:gows-2026.10.1`** tercatat di `docs/07`, `docs/10`, `deploy/compose.yml`
- [x] Bekukan template pesan + 10 hadits seed (`docs/15-pembekuan-template-hadits.md` disetujui; item #9 pakai header "Ayat Hari Ini")

## Fase 1 — Foundation

- [x] Inisialisasi monorepo Bun Workspace (`apps/web`, `apps/api`, `packages/shared`, `packages/prayer-engine`)
- [x] `tsconfig` strict + script `typecheck/lint(oxlint)/test/build`
- [x] Drizzle + `DATABASE_URL` + migration 5 tabel (`admins`, `app_settings`, `message_targets`, `scheduled_messages`, `hadiths`)
- [x] Seed `db:seed`: admin utama + hadits dari `data/hadiths.json` (idempotent via `email` / `seed_key`)
- [x] Endpoint `health/ready`
- [x] `Dockerfile` web/api + `deploy/compose.yml` (prod-only, tanpa MySQL) + `.env.example` final (image API teruji: build + smoke test health/ready OK)
- [x] Validasi: web+api+DB konek di Fedora (MySQL lokal, panduan `docs/14-panduan-mysql.md`)

## Fase 2 — Prayer Engine + Landing

- [x] Port `prayerEngine.js` → `packages/prayer-engine` (TS murni, adjustments, UTC, `date-fns-tz`)
- [x] Hijriyah + `adjustmentDays`; label Jumat (tanpa logika hari besar)
- [x] Endpoint publik `today/next/settings` + `preview`
- [x] Landing `/` + countdown + state gagal jujur
- [x] Validasi vs rujukan Kemenag + catat selisih (lampiran doc `docs/04-lampiran-validasi.md`)
- [x] Test TZ + koreksi + Jumat + hijriyah

## Fase 3 — WAHA + Target

- [x] Kunci + pin versi WAHA stabil terbaru (`devlikeapro/waha:gows-2026.10.1`); tertulis di `docs/07-waha-integration.md` & `deploy/compose.yml`
- [x] `integrations/waha/` (client/sessions/groups/messages/webhooks/types) lawan versi pin
- [x] UI sesi: status, start/stop/restart/logout, QR + polling (`/admin/whatsapp`)
- [x] `groups/sync` (baru default nonaktif) + kelola target (`/admin/targets`) + `test-message`
- [x] Rate-limit + kill-switch + error mapping; uji manual via endpoint test-message

## Fase 4 — Scheduler + Pengiriman

- [x] Generator horizon 7 hari, idempotent (`idempotency_key` + composite unique)
- [x] Hadits diambil dari tabel `hadiths` (aktif, acak, anti-repeat via `content_ref`); fallback tanpa hadits bila 0 aktif
- [x] Dispatcher klaim atomik + `allSettled` per target + backoff 30s/2m/5m max 3x + expiry 5 mnt + `UNKNOWN` tanpa retry buta
- [x] Recovery restart (PENDING kembali vs UNKNOWN) + heartbeat 30 dtk
- [x] Integrasi template snapshot + `content_ref`
- [x] `recalculate` (sync + ringkasan) + `retry/cancel` manual sesuai kontrak
- [x] Test generator/dispatcher/recovery/integration penuh (mock WAHA)

## Fase 5 — Dashboard + System

- [x] `/admin`, `/admin/whatsapp`, `/admin/targets`, `/admin/prayer`, `/admin/messages`, `/admin/settings`, `/admin/hadits`
- [x] CRUD hadits: tambah/edit/nonaktifkan (soft bila sudah dipakai) + warning bila 0 aktif
- [x] Semua halaman punya loading/empty/error/success/konfirmasi
- [x] `/system/status` (API+DB+WAHA+heartbeat+counts+recent)
- [x] Audit log aksi berisiko; branding biru + logo

## Fase 6 — CI/CD + Production

- [x] Workflow `build.yml`: PR check-only; push main → push GHCR `ghcr.io/FarrelGhozy/unida-prayer-web|api` (`latest`+SHA)
- [x] Pull + `db:migrate` + `db:seed` (awal) + `up -d` di home server; healthcheck; backup WAHA volume + MySQL (terdokumentasi di `docs/10`, `docs/14`, `deploy/compose.yml`)
- [x] Uji: restart container, recovery worker, test-message pasca-update, rollback SHA

## Acceptance MVP (tandai bila lolos uji)

- [x] Landing: tanpa login, Masehi+Hijriyah, lokasi+TZ, 5 waktu, next+countdown, tanpa data palsu
- [x] Admin: login, proteksi endpoint, ubah lokasi/hisab/pre-menit, persisten restart
- [x] Hadits: admin kelola (tambah/nonaktifkan); pesan pakai hadits aktif tanpa repeat berurutan; tanpa hadits bila 0 aktif (tetap terkirim)
- [x] WAHA: status, QR pairing, sesi survive restart container, sync grup, pilih aktif, test-message
- [x] Scheduler: pre+adzan × 5 waktu, multi-grup, tanpa duplikat, DB-backed, survive restart, gagal satu tak blokir lain, expired tepat
- [x] Logs: status di dashboard, riwayat filter, SENT/FAILED di DB, teknis via Docker logs
- [x] Deploy: push main → CI hijau → image GHCR; server tanpa build; pull+up update; MySQL tetap di luar Compose
