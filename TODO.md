# TODO — UNIDA Prayer V2 (Eksekusi setelah rancangan disetujui)

> Aturan: kerjakan berurutan per fase. Satu item selesai = DoD di `AGENTS.md` §7 terpenuhi. Update `[ ]`→`[x]`.

## Fase 0 — Persetujuan rancangan (tanpa coding)

- [x] Susun `AGENTS.md` + `docs/` (01–14) + `TODO.md`
- [x] Jawab BLOCKER (4 Nov 2026): OWNER=`FarrelGhozy`; WAHA = pin stabil terbaru saat Fase 3 (tanpa `latest`); MySQL port 3306 standar, provisioning pemilik + panduan `docs/14-panduan-mysql.md`; domain/proxy/TLS ditunda, Compose khusus production, dev native
- [x] Perubahan rancangan: hadits → tabel `hadiths` + CRUD admin; `data/hadiths.json` jadi seed awal bersama akun admin utama
- [ ] Konfirmasi visibilitas package GHCR (default: private; ubah bila mau public)
- [ ] Catat versi WAHA pin aktual ke `docs/07-waha-integration.md` saat mulai Fase 3
- [ ] Bekukan template pesan awal + verifikasi 10 hadits seed satu per satu (sebelum Fase 4)

## Fase 1 — Foundation

- [x] Inisialisasi monorepo Bun Workspace (`apps/web`, `apps/api`, `packages/shared`, `packages/prayer-engine`)
- [x] `tsconfig` strict + script `typecheck/lint(oxlint)/test/build`
- [x] Drizzle + `DATABASE_URL` + migration 5 tabel (`admins`, `app_settings`, `message_targets`, `scheduled_messages`, `hadiths`)
- [x] Seed `db:seed`: admin utama + hadits dari `data/hadiths.json` (idempotent via `email` / `seed_key`)
- [x] Endpoint `health/ready`
- [x] `Dockerfile` web/api + `deploy/compose.yml` (prod-only, tanpa MySQL) + `.env.example` final (image API teruji: build + smoke test health/ready OK)
- [x] Validasi: web+api+DB konek di Fedora (MySQL lokal, panduan `docs/14-panduan-mysql.md`)

## Fase 2 — Prayer Engine + Landing

- [ ] Port `prayerEngine.js` → `packages/prayer-engine` (TS murni, adjustments, UTC, `date-fns-tz`)
- [ ] Hijriyah + `adjustmentDays`; label Jumat (tanpa logika hari besar)
- [ ] Endpoint publik `today/next/settings` + `preview`
- [ ] Landing `/` + countdown + state gagal jujur
- [ ] Validasi vs rujukan Kemenag + catat selisih (lampiran doc)
- [ ] Test TZ + koreksi + Jumat + hijriyah

## Fase 3 — WAHA + Target

- [ ] Kunci + pin versi WAHA stabil terbaru; tulis di `docs/07-waha-integration.md`
- [ ] `integrations/waha/` (client/sessions/groups/messages/webhooks/types) lawan versi pin
- [ ] UI sesi: status, start/stop/restart/logout, QR + polling
- [ ] `groups/sync` (baru default nonaktif) + kelola target + `test-message`
- [ ] Rate-limit + kill-switch + error mapping; uji manual nomor khusus

## Fase 4 — Scheduler + Pengiriman

- [ ] Generator horizon 7 hari, idempotent (`idempotency_key` + composite unique)
- [ ] Hadits diambil dari tabel `hadiths` (aktif, acak, anti-repeat via `content_ref`); fallback tanpa hadits bila 0 aktif
- [ ] Dispatcher klaim atomik + `allSettled` per target + backoff 30s/2m/5m max 3x + expiry 5 mnt + `UNKNOWN` tanpa retry buta
- [ ] Recovery restart (PENDING kembali vs UNKNOWN) + heartbeat 30 dtk
- [ ] Integrasi template snapshot + `content_ref`
- [ ] `recalculate` (sync + ringkasan) + `retry/cancel` manual sesuai kontrak
- [ ] Test generator/dispatcher/recovery/integration penuh (mock WAHA)

## Fase 5 — Dashboard + System

- [ ] `/admin`, `/admin/whatsapp`, `/admin/targets`, `/admin/prayer`, `/admin/messages`, `/admin/settings`, `/admin/hadits`
- [ ] CRUD hadits: tambah/edit/nonaktifkan (soft bila sudah dipakai) + warning bila 0 aktif
- [ ] Semua halaman punya loading/empty/error/success/konfirmasi
- [ ] `/system/status` (API+DB+WAHA+heartbeat+counts+recent)
- [ ] Audit log aksi berisiko; branding biru + logo

## Fase 6 — CI/CD + Production

- [ ] Workflow `build.yml`: PR check-only; push main → push GHCR `ghcr.io/FarrelGhozy/unida-prayer-web|api` (`latest`+SHA)
- [ ] Pull + `db:migrate` + `db:seed` (awal) + `up -d` di home server; healthcheck; backup WAHA volume + MySQL
- [ ] Uji: restart container, recovery worker, test-message pasca-update, rollback SHA

## Acceptance MVP (tandai bila lolos uji)

- Landing: tanpa login, Masehi+Hijriyah, lokasi+TZ, 5 waktu, next+countdown, tanpa data palsu
- Admin: login, proteksi endpoint, ubah lokasi/hisab/pre-menit, persisten restart
- Hadits: admin kelola (tambah/nonaktifkan); pesan pakai hadits aktif tanpa repeat berurutan; tanpa hadits bila 0 aktif (tetap terkirim)
- WAHA: status, QR pairing, sesi survive restart container, sync grup, pilih aktif, test-message
- Scheduler: pre+adzan × 5 waktu, multi-grup, tanpa duplikat, DB-backed, survive restart, gagal satu tak blokir lain, expired tepat
- Logs: status di dashboard, riwayat filter, SENT/FAILED di DB, teknis via Docker logs
- Deploy: push main → CI hijau → image GHCR; server tanpa build; pull+up update; MySQL tetap di luar Compose
