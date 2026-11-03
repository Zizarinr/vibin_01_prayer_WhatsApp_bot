# 13 — Open Questions (harus dipastikan sebelum coding)

> Status: `BLOCKER` = hentikan fase terkait sampai dijawab. `NON-BLOCKER` = pakai default usulan, bisa diubah kemudian.
> Jawab dengan: nomor → pilihan → nilai final. Agen dilarang menebak untuk BLOCKER.

## Keputusan masuk (4 Nov 2026, dicatat dari konfirmasi pemilik)

- Q-AUTH-01 → **Opaque DB session** (cookie HttpOnly, cabut mudah).
- Q-PRAY-01 → **date-fns-tz**.
- Q-API-01 → **Sync langsung** (ringkasan; cocok target sedikit).
- Q-OWNER-01 → **Akun personal** (nama OWNER final belum diisi — wajib dilengkapi sebelum tulis workflow).

Sisa BLOCKER yang masih butuh nilai: Q-WAHA-01 (versi pin), Q-DB-01 (host/versi/backup MySQL), Q-OPS-01 (domain + proxy), + nama OWNER personal.

## BLOCKER

### Q-OWNER-01 — Namespace GHCR + nama repo/image
- Konteks: `docs/10-devops-cicd.md` memakai `ghcr.io/OWNER/...`. Tanpa ini CI/push tak bisa ditulis.
- Opsi: (a) `ghcr.io/<org-unida>/unida-prayer-web|api`, (b) akun personal pemilik.
- Rekomendasi: buat org/gh repo khusus + package private, login server sekali via token `read:packages`.
- Ditanya: `OWNER` final + repo public/private?

### Q-WAHA-01 — Versi WAHA GoWS yang di-pin
- Konteks: endpoint/session/QR/groups berbeda antar versi. Dilarang `latest`.
- Opsi: pin mis. `devlikeapro/waha:2026.xx-gows` (cek rilis stabil terbaru saat Phase 3).
- Ditanya: versi final + URL dokumentasi versi itu?

### Q-AUTH-01 — Mekanisme session login
- Konteks: V2 hanya tulis "cookie/session", belum kunci implementasi.
- Opsi: (a) opaque session di DB + cookie HttpOnly [rekomendasi: sederhana, cabut mudah], (b) JWT HttpOnly signed `APP_SECRET`.
- Ditanya: pilih (a)/(b)? Umur session? Ingat-saya?

### Q-DB-01 — MySQL prod & dev
- Konteks: MySQL di luar Compose. Perlu alamat, versi, collation, user, backup.
- Ditanya: (prod) host:port, versi MySQL, `utf8mb4_unicode_ci` ok? user `unida_prayer` + hak migration ok? siapa backup? (dev Fedora) MySQL lokal sudah ada / perlu panduan install?

### Q-OPS-01 — Domain + reverse proxy + TLS
- Konteks: Compose publish loopback; butuh proxy ke `web:3000` + `/api` ke `api:3001` (atau via web rewrite).
- Ditanya: domain final (ganti `prayer.example.ac.id`)? Proxy yang dipakai (Nginx/Caddy/Traefik bawaan)? Siapa yang setting TLS?

### Q-PRAY-01 — Library timezone final
- Konteks: dilarang parsing implisit; perlu satu library standar.
- Opsi: (a) `date-fns-tz` [rekomendasi: ringan, umum], (b) `luxon`, (c) Temporal (masih evolving).
- Ditanya: pilih satu sebelum Phase 2.

### Q-API-01 — `recalculate` sync vs async
- Konteks: regenerasi 7 hari × N target bisa puluhan–ratusan row.
- Opsi: (a) sync + respons ringkasan [rekomendasi untuk N kecil], (b) 202 + job id + polling.
- Ditanya: pilih (a)/(b)? Batas N target awal?

## NON-BLOCKER (default usulan, konfirmasi bila beda)

- Q-AUTH-02: ganti password memutus session lain? Default: **ya**.
- Q-AUTH-03: hash Argon2id vs bcrypt? Default: **Argon2id**.
- Q-SEC-01: rate-limit login 5/10 mnt, test/sync 10/mnt? Default: **ya, tune kemudian**.
- Q-PRAY-02: range koreksi menit ±10, sudut 0–30, pre 1–30? Default: **ya**.
- Q-WORK-01: horizon 7 hari, tick gen 15 mnt, dispatch 15–30 dtk, retry 3x (30s/2m/5m), grace 5 mnt? Default: **ya**.
- Q-WORK-02: lease PROCESSING 5 mnt? Default: **ya**.
- Q-WORK-03: saat kill-switch off, job tetap dibuat tapi diskip? Default: **ya + banner UI**.
- Q-WAHA-02: grup hilang dari WAHA: biarkan + label "tak terlihat"? Default: **ya, jangan hapus otomatis**.
- Q-WAHA-03: webhook secret/header primero? Default: **ikuti versi pin; tolak tanpa auth**.
- Q-WAHA-04: jeda antar kirim 500–1500 ms? Default: **ya**.
- Q-WAHA-05: nama sesi `unida-prayer`? Default: **ya**.
- Q-DB-02: hapus target fisik dilarang bila ada riwayat? Default: **ya (RESTRICT)**.
- Q-API-02: cancel hanya PENDING? Default: **ya**.
- Q-MON-01: heartbeat healthy <90 dtk / warning <5 mnt / offline selebihnya? Default: **ya**.
- Q-LOG-01: log JSON stdout tanpa file + tanpa isi pesan penuh? Default: **ya**.
- Q-DX-01: script `typecheck/lint/test/build/db:migrate/admin:seed/worker` + lint `eslint`/`biome`? Default: **bun test + eslint (atau biome bila dipilih)** — kunci sebelum Phase 1.
- Q-BRAND-01: file logo resmi + font + boleh dark-mode? Default: **logo dari kampus, light-first**.
- Q-DATA-01: 10 hadits V1 sudah terverifikasi atau perlu kurasi ulang? Default: **kurasi ulang satu per satu**.
- Q-OPS-02: retensi riwayat `scheduled_messages` (mis. 90–180 hari lalu arsip)? Default: **simpan dulu, arsip kemudian**.

## Cara menjawab (copy-paste)

```text
Q-OWNER-01: ...
Q-WAHA-01: ...
Q-AUTH-01: ...
Q-DB-01: ...
Q-OPS-01: ...
Q-PRAY-01: ...
Q-API-01: ...
(non-blocker yang beda dari default: ...)
```
