# 01 — Overview & Scope MVP

## 1.1 Ringkasan

UNIDA Prayer adalah aplikasi web internal kampus untuk:
1. Menampilkan jadwal shalat di **public landing page**.
2. Mengirim pengingat otomatis via WhatsApp ke **grup yang dipilih admin**.
3. Mengelola semuanya dari **admin dashboard** tanpa edit `.env` harian.

Ini **bukan script bot** lagi. Ini sistem: Next.js frontend + Elysia backend + Bun worker + MySQL tunggal + WAHA GoWS, di-deploy via Docker Compose + GHCR.

Fitur inti V1 yang dipertahankan: 5 waktu, pre-reminder, multi-grup, template, Hijriyah, hadits lokal, pengiriman otomatis (lihat `12-migrasi-v1-ke-v2.md`).

## 1.2 Tujuan utama (ukur keberhasilan)

| Tujuan | Indikator |
|---|---|
| Pengingat otomatis 5 waktu ke grup kampus | 10 job/hari/target (pre + adzan) terkirim tepat waktu |
| Landing mudah diakses | Tanpa login, countdown benar, tanpa data palsu |
| Admin mandiri via dashboard | Ganti lokasi/target/template tanpa edit file/server |
| Job survive restart | Row di `scheduled_messages`, recovery teruji |
| Kode modular, infra minimal | Lolos typecheck+test, 2 image saja, tanpa Redis/K8s |

## 1.3 Prinsip desain (kunci)

1. **Internal kampus dulu**, bukan SaaS multi-tenant.
2. **Satu sesi WAHA** untuk MVP.
3. **Satu DB MySQL + satu user aplikasi.** MySQL di luar Compose aplikasi.
4. Fedora = dev (MySQL lokal), Ubuntu home server = prod (alamat/Kredensial via env).
5. **CI hanya test+build+push.** Update server manual (`pull` → `migrate` → `up -d`).
6. **Tanpa** Redis/K8s/microservices/antrean eksternal di V2 awal.

## 1.4 Scope MVP (wajib)

- Landing: Masehi, Hijriyah (+catatan kalender), lokasi, 5 jadwal, next + countdown, penanda sedang/berikutnya, info grup WA.
- Login admin (tanpa registrasi publik), ganti password, proteksi backend per endpoint.
- Dashboard overview: status API, DB, WAHA, worker heartbeat, next prayer, hitung today/pending/failed, daftar kiriman terbaru.
- WAHA: lihat status, start/stop/restart/logout, QR, info akun, kirim test message.
- Grup: sync dari WAHA, pilih aktif/nonaktif, lihat ID+nama. Default grup baru = **nonaktif** (aman, anti-spam).
- Jadwal: nama lokasi, lat/lng, timezone, sudut Subuh/Isya, faktor Ashar, koreksi menit per waktu, menit pre-reminder, toggle pre/adzan, koreksi Hijriyah.
- Pesan: pre-reminder + adzan; berisi salam, nama shalat, Masehi, Hijriyah, waktu, ajakan, hadits opsional, identitas app. Snapshot `message_body` per job.
- Riwayat: tanggal, shalat, jenis, target, status, attempt, sent_at, last_error. Filter + pagination.
- Scheduler: horizon 7 hari, idempotent, polling MySQL, klaim atomik, retry terbatas, expiry, recovery restart.

## 1.5 Di luar scope MVP (dilarang kerjakan tanpa persetujuan)

Mobile app, pendaftaran mandiri mahasiswa, multi-tenant, multi-session WA, AI chatbot, Redis/broker, K8s, microservices, Prometheus/Grafana, analitik lanjut, editor template visual, broadcast kontak pribadi massal, WA Business Cloud API, sinkron kalender akademik.

## 1.6 Asumsi lingkungan

- Fedoa dev: Bun + Node + MySQL lokal tersedia.
- Home server: Docker + Compose + reverse proxy/TLS (pakai yang ada; jangan tambah infra sebelum perlu).
- Nomor WA khusus operasional (bukan nomor pribadi utama).
- Logo UNIDA tersedia + izin pakai; jangan modifikasi lambang tanpa persetujuan.
