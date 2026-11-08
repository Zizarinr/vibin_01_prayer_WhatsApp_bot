# 04 — Prayer Engine & Kalender

> Package: `packages/prayer-engine/`. Dipakai API (landing/preview) + worker (generator). Offline, tanpa API eksternal harian.

## 4.1 Input → Output

Input (dari `app_settings` + tanggal):
- `dateLocal` (YYYY-MM-DD di timezone lokasi), `latitude`, `longitude`, `timezone` (IANA),
- `fajrAngle`, `ishaAngle`, `asrFactor` (1=Syafi'i default, 2=Hanafi),
- `adjustments` menit per waktu.

Output:
- `fajr, sunrise?, dhuhr, asr, maghrib, isha` sebagai **UTC Date** + representasi lokal untuk tampil.
- Hanya 5 waktu utama (tanpa sunrise) yang jadi trigger pengingat. Sunrise boleh ditampilkan/preview tapi **bukan job**.

Library dasar: `adhan-js` (porting dari V1 `src/prayerEngine.js`). Bungkus dengan fungsi murni agar mudah di-test:
`calcPrayerTimes(input) → { fajrUtc, sunriseUtc, dhuhrUtc, asrUtc, maghribUtc, ishaUtc, meta }`.

## 4.2 Aturan hisab

- Default awal: Fajr 20°, Isya 18°, Asr factor 1 — **parameter awal mengikuti V1, bukan fatwa resmi**. Jangan labeli "resmi Kemenag" sebelum validasi §4.5.
- Koreksi menit diterapkan **setelah** hitung dasar, per waktu (mis. `dhuhr +2`). Range dibatasi (usulan −10..+10; kunci Q-PRAY-02).
- Jumat: trigger tetap waktu Dzuhur; **label tampil** boleh jadi "Jumat" sesuai template (lihat `06-worker` + `12-migrasi`).
- Jangan deteksi hari besar dari substring Hijriyah. Fitur hari besar butuh sumber kalender/input admin terverifikasi (di luar MVP).

## 4.3 Timezone (sumber bug klasik — atur ketat)

- Default `Asia/Jakarta`. Jangan baca timezone OS container.
- Simpan `prayer_time_utc` + `scheduled_at_utc` dalam UTC. Simpan `prayer_date` sebagai DATE lokal.
- Konversi lokal↔UTC eksplisit via library jelas (`date-fns-tz` rekomendasi; alternatif `luxon`/Temporal — kunci Q-PRAY-01). Dilarang `new Date("2026-...")` tanpa zona + parsing implisit.
- Test wajib: jalankan dengan `TZ=UTC`, `TZ=Asia/Jakarta`, `TZ=America/New_York` → hasil UTC sama untuk input sama.
- Countdown browser memakai `scheduled_at_utc` + `serverNowUtc` (lihat `08-frontend`) agar skew jam client tidak menyesatkan.

## 4.4 Hijriyah

- V1: `Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura')`. Pertahankan sebagai **konversi lokal/fallback**.
- Tambah `hijri_settings.adjustmentDays` (−2..+2) yang **hanya geser tampil**, tak ubah hisab shalat.
- Tampilkan Masehi + Hijriyah berdampingan + catatan: "dapat berbeda dengan kalender yang dipakai kampus; admin dapat mengoreksi ±2 hari".
- Jangan klaim Umm al-Qura = kalender otoritatif Indonesia.

## 4.5 Validasi vs rujukan Kemenag (wajib sebelum klaim akurat)

1. Ambil jadwal rujukan Kemenag untuk titik UNIDA Gontor (−7.8652, 111.4617) minimal 7–30 hari (sumber: situs/jadwal resmi Kemenag atau dokumen kampus).
2. Bandingkan per waktu (Subuh/Dzuhur/Ashar/Maghrib/Isya), catat selisih di `docs/04-lampiran-validasi.md` (buat saat Phase 2).
3. Tutup selisih sistematis via `prayer_adjustments` (mis. +2 menit), bukan dengan mengubah sudut secara diam-diam.
4. Ulangi tiap ganti sudut/library. Simpan tanggal validasi + sumber di doc.
5. Sampai validasi selesai, copy landing: "Jadwal hasil perhitungan lokal; validasi terhadap rujukan Kemenag berjalan" (jangan tulis "Jadwal Resmi Kemenag").

## 4.6 Preview & recalculate (kontrak dengan API/worker)

- `POST /api/admin/prayer/preview`: hitung tanpa simpan. Input = kandidat settings + tanggal. Output = 5 waktu UTC+lokal + catatan Hijriyah. Untuk admin cek dampak sebelum simpan.
- `POST /api/admin/prayer/recalculate`: setelah settings disimpan, regenerasi **hanya `PENDING` masa depan** (lihat `06-worker-scheduler.md`). `SENT/PROCESSING` tak disentuh.
- Perubahan lokasi/timezone/metode/koreksi/pre-menit → picu path yang sama.

## 4.7 Test yang mengunci (lihat juga `11-testing.md`)

- 5 waktu valid + berurutan fajr<dhuhr<asr<maghrib<isha.
- Ubah lat/lng → hasil bergeser masuk akal.
- Koreksi menit tepat sasaran per waktu.
- Timezone independen host.
- Hijriyah + adjustment benar.
- Jumat ubah label, bukan waktu trigger.
