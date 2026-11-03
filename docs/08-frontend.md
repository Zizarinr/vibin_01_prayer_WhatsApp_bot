# 08 — Frontend (Next.js)

> Frontend only. Tak akses DB/WAHA langsung. Data jadwal dari API, bukan hitung sendiri.

## 8.1 Route

- `/` — landing publik.
- `/login` — login admin.
- `/admin` — overview.
- `/admin/whatsapp` — sesi + QR + test message.
- `/admin/targets` — grup & penerima.
- `/admin/prayer` — jadwal hari ini + preview + lokasi/perhitungan.
- `/admin/messages` — riwayat + detail + retry/cancel.
- `/admin/hadits` — kelola hadits (CRUD admin).
- `/admin/settings` — lokasi, hisab, reminder, hijriyah, konten, kill-switch.

Sidebar: Overview / WhatsApp (Session, Grup) / Prayer (Jadwal, Lokasi & Perhitungan) / Messages (Riwayat) / Konten (Hadits) / System (Status, Pengaturan).

## 8.2 Landing (`/`)

Komponen: Header/logo → Masehi + Hijriyah (+catatan kalender) → Lokasi → Card next + countdown → 5 jadwal → penanda lewat/berikut → footer info WA.

Data: `GET /api/public/prayer/today` + `/next`. Countdown: `scheduled_at_utc - serverNowUtc` dikoreksi offset client (`serverNowUtc - Date.now()`), update tiap detik. Bila API gagal: empty/error jujur ("Data belum dapat dimuat"), **tanpa jadwal palsu**.

Timezone tampil dari API (`timezone`), format 24-jam + label WIB/WITA/WIT bila sesuai.

## 8.3 Dashboard overview (`/admin`)

Kartu: API, DB (latency), WAHA status, worker heartbeat state, next prayer + countdown, hitung todaySent/pending/failed-unknown, tabel kiriman terbaru (link ke `/messages`).

Tambahan: warning bila `includeHadith=true` tapi 0 hadits aktif ("pesan terkirim tanpa hadits").

Polling status tiap 15–30 dtk; tampilkan `lastUpdatedAt` agar admin tahu data basi atau live.

## 8.4 Halaman kunci (perilaku)

- **Login**: email+password, error generik (jangan bedakan email vs password), redirect `/admin` sukses. Rate-limit pesan jelas.
- **WhatsApp**: status badge, tombol Start/Stop/Restart/Logout (konfirmasi modal untuk stop/logout), QR box + tombol refresh + polling 3–5 dtk saat SCAN_QR, info akun, form test-message (pilih target + teks, kirim, tampil hasil backend).
- **Targets**: tabel + search + filter aktif, toggle aktif (konfirmasi bila menonaktifkan target dengan PENDING), tombol Sync (loading + ringkasan "N baru, M diperbarui").
- **Prayer**: form lokasi (nama/lat/lng/timezone), sudut Subuh/Isya, Asr factor, koreksi menit per waktu, pre-menit + toggle, koreksi Hijriyah; tombol **Preview** (tanpa simpan) + **Simpan** (validasi + info "PENDING masa depan diregenerasi"); tampilkan jadwal hari ini hasil tersimpan.
- **Messages**: filter status/shalat/jenis/target/tanggal + search, pagination server-side, badge status (PENDING abu, PROCESSING biru, SENT hijau, FAILED merah, EXPIRED kuning, CANCELLED netral, UNKNOWN ungu "perlu verifikasi"), detail drawer (body snapshot, attempt, error, waha id), aksi Retry (syarat ketat) / Cancel (PENDING saja).
- **Hadits (`/admin/hadits`)**: tabel + search + filter aktif; tambah/edit (`text` + `source`); nonaktifkan (konfirmasi bila sudah pernah dipakai di riwayat); hapus fisik hanya bila belum pernah dipakai; warning bila 0 aktif.
- **Settings/System**: gabungan/pecah sesuai kebutuhan; tampilkan heartbeat mentah + interpretasi + panduan recovery singkat.

## 8.5 State wajib per halaman

Loading (skeleton), Empty ("belum ada target — sync dulu"), Error (pesan + tombol coba lagi), Success (toast + sumber backend), Konfirmasi (logout WAHA, nonaktifkan target, cancel massal bila ada).

## 8.6 Branding & aksesibilitas

Palet V2 (usulan, bukan kode resmi): `primary #123B6D`, `primary-strong #1D5FA7`, `sky #6BA9D8`, `soft-blue #EAF2FB`, `navy #102A46`, `bg #F5F8FC`, `surface #FFFFFF`, `text #172B43`, `muted #64748B`, sukses `#16835D`, warning `#B7791F`, danger `#C2413B`.

Aturan: logo disediakan pemilik; jangan modifikasi lambang. Kontras teks ≥ 4.5:1 untuk info penting. Countdown terbaca (tabular-nums). Mobile-first untuk landing; dashboard responsif minimal tablet.

## 8.7 API client

- `lib/api-client.ts`: `fetch` ke `NEXT_PUBLIC_API_BASE_URL=/api` (browser) dengan `credentials: include`; SSR pakai `INTERNAL_API_URL=http://api:3001` (lihat `10-devops`). Tangani `{ data, error }` + HTTP status → error map Indonesia.
- Auth cookie HttpOnly (JS tak baca token). Jangan simpan WAHA key/secret di localStorage.
