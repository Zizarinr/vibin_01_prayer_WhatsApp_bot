# UNIDA Prayer — Frontend Web Application

Aplikasi web modern untuk **UNIDA Prayer V2** yang menyediakan **Landing Page Jadwal Shalat Publik Kampus Siman** dan **Dashboard Administrator** interaktif.

## 🚀 Fitur Utama

- **Landing Page Jadwal Shalat (`/`)**:
  - Tampilan waktu shalat 5 waktu utama + Terbit dengan status otomatis (`UPCOMING`, `NEXT`, `PASSED`).
  - Penandaan khusus Sholat Jumat (*Jumat Berkah*).
  - Jam digital WIB real-time & hitung mundur (*live countdown*) menuju adzan berikutnya.
  - Tombol **Salin Jadwal** satu-klik berformat WhatsApp.
  - Penanggalan ganda: Masehi dalam bahasa Indonesia & Hijriyah Umm al-Qura.
  - Desain responsif dengan footer gradasi biru khas UNIDA.
- **Portal Login Admin (`/login`)**:
  - Otentikasi terproteksi dengan visual brand 3D resolusi tinggi.
- **Dashboard Administrator (`/admin/*`)**:
  - `/admin`: Ringkasan metrik sistem, status konektivitas, dan log aktivitas terbaru.
  - `/admin/whatsapp`: Kontrol sesi WAHA GoWS (start, stop, restart, logout, dan scan QR pairing).
  - `/admin/targets`: Sinkronisasi grup WhatsApp, switch target aktif/nonaktif, dan test pesan manual.
  - `/admin/prayer`: Pengaturan lokasi Siman, metode hisab, koreksi menit per waktu shalat, dan koreksi kalender Hijriyah dengan simulasi kalkulasi (*live preview*).
  - `/admin/messages`: Riwayat pengiriman pesan terjadwal, filter status (`PENDING`, `DISPATCHING`, `SENT`, `FAILED`, `UNKNOWN`), dan tombol retry manual.
  - `/admin/hadits`: Manajemen database hadits & ayat (tambah, edit, nonaktifkan, dan pencegahan pengulangan).
  - `/admin/settings`: Pengaturan pre-reminder, diagnostik sistem, dan *Emergency Kill-Switch*.
  - Desain responsif mobile dengan *mobile navigation drawer* & *top bar*.

## 🛠️ Teknologi

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router, Turbopack, Standalone output)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icon**: [Lucide React](https://lucide.dev/) & Brand App Icon 3D raster resolusi tinggi
- **Runtime**: Bun / Node.js 20+

## 💻 Menjalankan Secara Lokal

Dari root monorepo:

```bash
bun run dev:web
```

Atau langsung dari direktori ini:

```bash
cd apps/web
bun run dev
```

Aplikasi web dapat diakses pada [http://localhost:3000](http://localhost:3000).
Proxy internal ke backend Elysia berjalan melalui rewrites di `next.config.ts` menuju `INTERNAL_API_URL` (default: `http://127.0.0.1:3001`).

## 📦 Build Produksi

```bash
bun run build
```

Hasil build standalone akan ditempatkan di `.next/standalone` untuk di-package ke dalam Docker image (`infrastructure/docker/web.Dockerfile`).
