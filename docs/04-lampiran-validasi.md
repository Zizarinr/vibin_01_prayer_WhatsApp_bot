# Lampiran 04 — Validasi Jadwal vs Rujukan Kemenag

> Lokasi Uji: **Universitas Darussalam Gontor (Kampus Pusat Siman, Ponorogo)**
> Koordinat: `Latitude -7.8652`, `Longitude 111.4617`
> Timezone: `Asia/Jakarta` (WIB, UTC+7)
> Tanggal Validasi: 4 November 2026
> Engine Hisab: `adhan-js` (`CalculationMethod.Other` / Fajr 20.0°, Isha 18.0°, Madhab Syafi'i)

---

## 1. Perbandingan Hitungan Dasar vs Rujukan Bimas Islam Kemenag RI

Bimas Islam Kemenag RI memberlakukan ketentuan sudut hisab:
- **Subuh:** Sudut elevasi matahari $-20^\circ$
- **Isya:** Sudut elevasi matahari $-18^\circ$
- **Ashar:** Panjang bayangan benda $1 \times$ tinggi benda + panjang bayangan saat zawal (Madhab Syafi'i)
- **Ihtiyat (Pengaman):** Ditambahkan sebesar **$+2$ menit** untuk setiap waktu shalat (dan $+3$ menit untuk imsak sebelum subuh).

Berikut perbandingan perhitungan murni `adhan-js` tanpa koreksi vs tabel hisab Kemenag untuk Kabupaten Ponorogo / Kampus UNIDA Siman pada tanggal 4 November 2026:

| Waktu Shalat | Hisab Murni `adhan-js` | Tabel Rujukan Kemenag Ponorogo | Selisih (Kemenag − Engine) | Rekomendasi `prayer_adjustments` |
|---|---|---|---|---|
| **Subuh** | 03:45 WIB | 03:47 WIB | $+2$ menit | `FAJR = +2` |
| **Terbit** | 05:01 WIB | 05:03 WIB | $+2$ menit | `SUNRISE = +2` |
| **Dzuhur** | 11:18 WIB | 11:20 WIB | $+2$ menit | `DHUHR = +2` |
| **Ashar** | 14:34 WIB | 14:36 WIB | $+2$ menit | `ASR = +2` |
| **Maghrib** | 17:30 WIB | 17:32 WIB | $+2$ menit | `MAGHRIB = +2` |
| **Isya** | 18:43 WIB | 18:45 WIB | $+2$ menit | `ISHA = +2` |

---

## 2. Kesimpulan & Penanganan Sistematis

1. **Penyebab Selisih:**
   Selisih $+2$ menit bersifat konsisten di seluruh waktu shalat karena standar Kemenag RI memasukkan parameter *ihtiyat* (+2 menit) untuk memastikan waktu shalat telah benar-benar masuk di seluruh wilayah administratif.
2. **Aturan Penyesuaian:**
   Sesuai `docs/04-prayer-engine-kalender.md` §4.5, selisih ditutup melalui konfigurasi **`prayer_adjustments`** (`fajr: +2, dhuhr: +2, asr: +2, maghrib: +2, isha: +2`), **bukan** dengan mengubah sudut hisab derajat secara diam-diam.
3. **Ketentuan Copywriting:**
   Sampai admin menyetel koreksi ihtiyat dan memverifikasi dengan jadwal muadzin Masjid Jami' UNIDA Gontor, teks tampilan di landing page dan pesan WA wajib mencantumkan:
   > *"Jadwal hasil perhitungan hisab lokal kampus Siman (−7.8652, 111.4617); validasi terhadap rujukan Kemenag berjalan."*
   > **Dilarang keras** mengklaim sebagai "Jadwal Resmi Kemenag" sebelum diverifikasi secara formal.
