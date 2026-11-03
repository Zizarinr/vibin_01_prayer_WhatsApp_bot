# 12 — Migrasi V1 → V2 (apa dibawa, apa dibuang)

> Kode V1: `src/*.js`, `index.js`, `data/hadiths.json`. V2 memporting logika, bukan menyalin file.

## 12.1 Peta porting

| V1 | V2 | Aksi |
|---|---|---|
| `src/prayerEngine.js` (adhan-js, Kemenag 20/18, Shafi) | `packages/prayer-engine/` | Port ke TS murni + tambah adjustments/timezone eksplisit + test |
| `src/templates.js` (3 varian/doa, Jumat, Idul*, `{{time/hijri/gregorian}}`) | `packages/prayer-engine/render.ts` + template TS | Port 3 varian + Jumat; **buang** deteksi Idul via substring; **buang** fallback API hadits acak |
| `data/hadiths.json` (10 item) | `data/hadiths.json` (terversi) | Pertahankan setelah verifikasi sumber; tambah `id, text, source`; anti-repeat via `content_ref` (ganti `state.json`) |
| Hijriyah `Intl...islamic-umalqura` | `packages/prayer-engine/hijri.ts` | Pertahankan + tambah `adjustmentDays` |
| `src/scheduler.js` (setTimeout, cron tengah malam, `!lokasi`, allSettled) | `apps/api/src/worker/` | Ganti timer dengan DB-backed (§06); pertahankan ide midnight→generator horizon + `allSettled` per target |
| `src/bot.js` (whatsapp-web.js, monkey-patch Puppeteer, LocalAuth, admin WA) | `integrations/waha/` | **Buang** whatsapp-web.js/monkey-patch/LocalAuth; ganti WAHA GoWS; **buang** admin WA (`!ping/!jadwal/!status/!lokasi`) sebagai jalur utama (dashboard ganti) |
| `src/config.js` (.env semua) | `app_settings` + `.env` minimal | Pindah operasional ke MySQL; `.env` hanya secret+koneksi |
| `src/logger.js` (Winston file) | logger JSON stdout | Ganti file log dengan stdout + status DB; Docker logs untuk teknis |
| `TARGET_GROUP_IDS`, `ADMIN_PHONES` | `message_targets`, `admins` | Kelola via dashboard; tanpa whitelist chat untuk admin harian |
| `state.json` anti-repeat | `scheduled_messages.content_ref` | Hapus file state; cek hadits terakhir dari DB |
| `test.js`, PM2, Chromium flags | CI + Docker + test otomatis | Buang PM2/Chromium; uji via `bun test` + Compose |

## 12.2 Template & hadits awal (harus diverifikasi)

- Template awal boleh di TS agar sederhana; struktur render modular agar kelak pindah ke DB tanpa ubah caller.
- Hadits: pakai 10 V1 **hanya setelah** cek teks+sumber satu per satu. Sumber meragukan → buang/ganti dengan yang terverifikasi. Jangan tambah dari API acak.
- Pesan Jumat: label Dzuhur→Jumat, waktu tetap Dzuhur.
- `message_body` snapshot: template berubah tak ubah job lama.

## 12.3 Risiko porting

- Perbedaan hasil `adhan` JS vs `adhan-js` versi baru → validasi ulang vs Kemenag (§04.5).
- Format tanggal V1 (Date lokal) vs V2 (UTC+DATE lokal) → konversi eksplisit, test TZ.
- ID grup V1 (`...@g.us`) vs ID WAHA GoWS → petakan saat sync, jangan asumsikan format sama.
