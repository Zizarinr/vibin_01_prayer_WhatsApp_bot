# AGENTS.md — Instruksi Agen Coding UNIDA Prayer V2

> Dokumen ini adalah **aturan kerja utama** untuk setiap AI coding agent yang mengerjakan proyek ini.
> Rancangan detail ada di `docs/`. Dokumen V2 asli (`UNIDA_Prayer_Rancangan_Teknis_V2.md`) adalah baseline, tetapi **yang menjadi acuan eksekusi adalah `docs/` + `TODO.md`**.
> **Jangan mulai coding sebelum `docs/13-open-questions.md` yang berlabel `BLOCKER` dijawab pemilik proyek.**

## 1. Misi

Bangun **UNIDA Prayer V2**: landing jadwal shalat + dashboard admin + backend Elysia + worker MySQL-backed + integrasi WAHA GoWS, di monorepo TypeScript Bun Workspace, deploy via Docker Compose + GHCR dengan update manual di home server.

## 2. Sumber Kebenaran (prioritas berurutan)

1. `TODO.md` — daftar kerja dan urutan fase.
2. `docs/` — perincian rancangan (01–13).
3. `UNIDA_Prayer_Rancangan_Teknis_V2.md` — baseline V2 bila `docs/` belum mengatur.
4. Kode V1 di `src/`, `index.js`, `data/hadiths.json` — hanya untuk **referensi porting**, bukan untuk dipertahankan apa adanya.

Jika ada konflik: `docs/` menang atas ingatan/V1. Jika `docs/` ambigu: **berhenti, catat di `docs/13-open-questions.md`, tanya pemilik**, jangan menebak.

## 3. Batasan Keras (jangan dilanggar)

- Target awal **internal UNIDA Gontor, bukan SaaS multi-tenant**.
- **Satu sesi WAHA** untuk MVP. Jangan bangun multi-session.
- **Satu database MySQL (`unida_prayer`) + satu user aplikasi.** MySQL dikelola di luar Compose.
- **Jangan** menambahkan ke Compose aplikasi: MySQL, Redis, Kafka/RabbitMQ, Kubernetes manifest, microservices baru, Prometheus/Grafana.
- Semua konfigurasi operasional (lokasi, metode hisab, koreksi, pre-reminder, target aktif) **persisten di MySQL (`app_settings`, `message_targets`)**, bukan `.env`.
- `.env` hanya untuk: secret, `DATABASE_URL`, koneksi WAHA, URL internal/publik.
- Jangan commit `.env` production, password/token asli, QR payload, atau session WAHA.
- Scheduler **wajib database-backed + idempotent** (`scheduled_messages` + `idempotency_key`). Dilarang mengandalkan `setTimeout` in-memory sebagai sumber kebenaran.
- Jangan kirim ke grup yang belum dipilih admin (`is_active = true` saja).
- Semua panggilan WAHA **hanya via `apps/api/src/integrations/waha/`**. Frontend dilarang memanggil WAHA langsung dan dilarang menerima `WAHA_API_KEY`.
- Retry pengiriman yang hasilnya ambigu (timeout setelah kemungkinan terkirim) **jangan di-retry buta** — tandai `UNKNOWN`, minta verifikasi manual.
- CI (`GitHub Actions`) hanya: check → build → push GHCR. **Dilarang SSH/auto-deploy ke home server dari CI.**
- Update server selalu manual: `pull` → `db:migrate` → `up -d`.

## 4. Standar TypeScript

- Semua kode baru `.ts`/`.tsx`. Migrasi file JS V1 ke TS saat disentuh.
- `strict: true`. Dilarang `any` (gunakan `unknown` + validasi).
- Validasi input di backend dengan schema (mis. Elysia `t.*` / Zod bila diputuskan), bukan hanya di frontend.
- Tipe bersama di `packages/shared` atau dari tipe aplikasi Elysia / Eden Treaty.
- Setiap modul UI wajib punya: loading, empty, error, success, konfirmasi aksi berisiko.
- Status yang tampil di UI harus dari backend/DB, bukan asumsi klik tombol.
- Jalankan `bun run typecheck` secara eksplisit; lolos-run Bun ≠ lolos-typecheck.
- Komentar `//` hanya bila perlu (menjelaskan *kenapa*, bukan *apa*). Kode yang sudah jelas tidak perlu dikomentari; jangan beri keterangan yang tidak penting.
- Linter utama: **oxlint** (`bun run lint`). Pastikan lolos sebelum commit.

## 5. Struktur Repo yang Diwajibkan

Ikuti `docs/02-arsitektur-struktur-repo.md`:

```text
apps/web      # Next.js (frontend only, standalone, Node container)
apps/api      # Elysia + worker (Bun), modules/, integrations/waha/, database/, worker/, core/
packages/shared
packages/prayer-engine
data/hadiths.json
infrastructure/docker/web.Dockerfile + api.Dockerfile
deploy/compose.yml   # tanpa MySQL
.github/workflows/build.yml
.env.example
```

Backend per modul minimal dipisah `routes.ts / service.ts / schema.ts / repository.ts` **hanya bila dibutuhkan** — jangan buat abstraksi kosong.

## 6. Alur Kerja per Tugas

1. Baca `TODO.md`, pilih **satu** item fase aktif (urut: Foundation → Prayer → WAHA → Scheduler → Dashboard → CI/CD).
2. Baca doc terkait di `docs/` sampai paham acceptance-nya.
3. Jika menemukan ambiguitas baru: tambahkan ke `docs/13-open-questions.md` + hentikan tugas itu, lanjut ke tugas yang tidak terblokir atau tanya pemilik.
4. Implementasi + validasi input + error konsisten `{ data, error: { code, message } }` + HTTP status benar.
5. Query via Drizzle/parameterized saja.
6. Tulis/ubah test untuk logika penting (lihat `docs/11-testing.md`).
7. Update `TODO.md` (`[ ]` → `[x]`) dan catat file yang diubah di ringkasan akhir.
8. **Wajib git commit lokal per stage perubahan**: satu commit per unit perubahan logis (mis. satu modul / satu doc), pesan commit jelas (`docs: ...`, `feat: ...`, `fix: ...`). Jangan menumpuk banyak perubahan tak terkait dalam satu commit, dan jangan biarkan working tree kotor tanpa commit di akhir setiap stage.
9. Jangan melebar ke luar-scope MVP (`docs/01-overview-scope.md` § Di luar scope).
10. Push ke remote **hanya bila pemilik meminta eksplisit**; defaultnya berhenti di commit lokal.

## 7. Definition of Done (per modul)

Modul selesai bila **semua** terpenuhi:

1. Kode TS mengikuti struktur repo.
2. Validasi input backend ada.
3. Error memakai format konsisten + tidak membocorkan secret/stack sensitif.
4. DB via Drizzle; migration bila ubah schema.
5. Tidak ada secret ke frontend/log.
6. Test logika penting ada dan lolos.
7. UI (bila ada) punya semua state wajib.
8. `docs/` + `.env.example` diperbarui bila kontrak berubah.

## 8. Perintah Rujukan (akan ada setelah Phase 1)

- `bun install --frozen-lockfile`
- `bun run typecheck`
- `bun run lint`
- `bun run test`
- `bun run build`
- `bun run db:migrate`
- `docker compose -f deploy/compose.yml pull && docker compose -f deploy/compose.yml up -d`

Nama script final wajib disamakan dengan root `package.json` dan `docs/10-devops-cicd.md`. Bila belum ada, jangan mengarang — catat sebagai blocker.

## 9. Larangan

- Dilarang mengubah scope menjadi multi-tenant/microservices/Redis/K8s tanpa persetujuan tertulis pemilik.
- Dilarang mengklaim jadwal `adhan-js` sebagai "jadwal resmi Kemenag" sebelum validasi (`docs/04-prayer-engine-kalender.md`).
- Dilarang mengambil hadits dari API acak tak terverifikasi.
- Dilarang mendeteksi hari besar hanya dari substring tanggal Hijriyah.
- Dilarang menampilkan jadwal palsu/hardcoded saat API gagal.
- Dilarang menebak `OWNER` GHCR, versi WAHA, domain, atau kredensial — minta nilai aktual.

## 10. Cara Meminta Keputusan

- Kumpulkan pertanyaan di `docs/13-open-questions.md` dengan format: konteks → opsi → rekomendasi → dampak bila salah pilih.
- Tandai `BLOCKER` vs `NON-BLOCKER`. Blocker menghentikan fase terkait.
- Pertanyaan ke pemilik harus singkat, menyebut file `docs/...:bagian`, dan menyertakan rekomendasi default.
