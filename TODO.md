# TODO — UNIDA Prayer V2 (Eksekusi setelah rancangan disetujui)

> Aturan: kerjakan berurutan per fase. Satu item selesai = DoD di `AGENTS.md` §7 terpenuhi. Update `[ ]`→`[x]`.
> **Jangan coding sebelum 7 BLOCKER di `docs/13-open-questions.md` dijawab.**

## Fase 0 — Persetujuan rancangan (tanpa coding)

- [x] Susun `AGENTS.md` + `docs/` (01–13) + `TODO.md`
- [ ] Jawab BLOCKER: Q-OWNER-01, Q-WAHA-01, Q-AUTH-01, Q-DB-01, Q-OPS-01, Q-PRAY-01, Q-API-01
- [ ] Konfirmasi NON-BLOCKER yang beda dari default (atau setujui default)
- [ ] Kunci: versi WAHA, OWNER GHCR, domain, library timezone, mekanisme auth, perintah script root
- [ ] Bekukan template pesan awal + 10 hadits terverifikasi (sumber jelas)

## Fase 1 — Foundation

- [ ] Inisialisasi monorepo Bun Workspace (`apps/web`, `apps/api`, `packages/shared`, `packages/prayer-engine`)
- [ ] `tsconfig` strict + script `typecheck/lint/test/build`
- [ ] Drizzle + `DATABASE_URL` + migration 4 tabel (`admins`, `app_settings`, `message_targets`, `scheduled_messages`)
- [ ] Seed admin CLI (`admin:seed`) + endpoint `health/ready`
- [ ] `Dockerfile` web/api + `deploy/compose.yml` tanpa MySQL + `.env.example` final
- [ ] Validasi: web+api+DB konek di Fedora (MySQL lokal)

## Fase 2 — Prayer Engine + Landing

- [ ] Port `prayerEngine.js` → `packages/prayer-engine` (TS murni, adjustments, UTC)
- [ ] Hijriyah + `adjustmentDays`; label Jumat (tanpa logika hari besar)
- [ ] Endpoint publik `today/next/settings` + `preview`
- [ ] Landing `/` + countdown + state gagal jujur
- [ ] Validasi vs rujukan Kemenag + catat selisih (lampiran doc)
- [ ] Test TZ + koreksi + Jumat + hijriyah

## Fase 3 — WAHA + Target

- [ ] `integrations/waha/` (client/sessions/groups/messages/webhooks/types) lawan versi pin
- [ ] UI sesi: status, start/stop/restart/logout, QR + polling
- [ ] `groups/sync` (baru default nonaktif) + kelola target + `test-message`
- [ ] Rate-limit + kill-switch + error mapping; uji manual nomor khusus

## Fase 4 — Scheduler + Pengiriman

- [ ] Generator horizon 7 hari, idempotent (`idempotency_key` + composite unique)
- [ ] Dispatcher klaim atomik + `allSettled` per target + backoff 30s/2m/5m max 3x + expiry 5 mnt + `UNKNOWN` tanpa retry buta
- [ ] Recovery restart (PENDING kembali vs UNKNOWN) + heartbeat 30 dtk
- [ ] Integrasi template snapshot + `content_ref` hadits anti-repeat
- [ ] `recalculate` + `retry/cancel` manual sesuai kontrak
- [ ] Test generator/dispatcher/recovery/integration penuh (mock WAHA)

## Fase 5 — Dashboard + System

- [ ] `/admin`, `/admin/whatsapp`, `/admin/targets`, `/admin/prayer`, `/admin/messages`, `/admin/settings`
- [ ] Semua halaman punya loading/empty/error/success/konfirmasi
- [ ] `/system/status` (API+DB+WAHA+heartbeat+counts+recent)
- [ ] Audit log aksi berisiko; branding biru + logo resmi

## Fase 6 — CI/CD + Production

- [ ] Workflow `build.yml`: PR check-only; push main → push GHCR (`latest`+SHA)
- [ ] Pull + `db:migrate` + `up -d` di home server; healthcheck; backup WAHA volume + MySQL
- [ ] Uji: restart container, recovery worker, test-message pasca-update, rollback SHA

## Acceptance MVP (tandai bila lolos uji)

- Landing: tanpa login, Masehi+Hijriyah, lokasi+TZ, 5 waktu, next+countdown, tanpa data palsu
- Admin: login, proteksi endpoint, ubah lokasi/hisab/pre-menit, persisten restart
- WAHA: status, QR pairing, sesi survive restart container, sync grup, pilih aktif, test-message
- Scheduler: pre+adzan × 5 waktu, multi-grup, tanpa duplikat, DB-backed, survive restart, gagal satu tak blokir lain, expired tepat
- Logs: status di dashboard, riwayat filter, SENT/FAILED di DB, teknis via Docker logs
- Deploy: push main → CI hijau → image GHCR; server tanpa build; pull+up update; MySQL tetap di luar Compose
