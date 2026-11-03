# 15 — Pembekuan Template Pesan & Hadits (butuh sign-off pemilik)

> Status: **DRAFT menunggu persetujuan**. Setelah disetujui, isi ini menjadi acuan implementasi template di Fase 4 dan seed `hadiths` final.
> Sumber: `src/templates.js` + `data/hadiths.json` (V1). Yang **dibuang** dari V1: deteksi Idul Fitri/Adha via substring Hijriyah, fallback API hadits acak. Aturan Jumat dipertahankan.

## 15.1 Struktur pesan utama (ADHAN)

Format: `greeting` + `body` + `📖 Hadith Hari Ini` (bila aktif) + `footer`.
Placeholder: `{{time}}` (mis. `04:12 WIB`), `{{hijri}}`, `{{gregorian}}`.
Rotasi: 3 varian per waktu, dipilih `tanggal-masehi % 3` (deterministik per hari).
Jumat: label `Sholat Dzuhur` → `Sholat Jumat` + footer khusus Jumat (lihat §15.3).

### Subuh (3 varian)

- S1-greeting: `🌙 *Assalamu'alaikum Warahmatullahi Wabarakatuh*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*`
  S1-body: `Alhamdulillah, sudah masuk waktu *Sholat Subuh* 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})`
  S1-footer: `Yuk segerakan sholat Subuh berjamaah di masjid terdekat, jangan tunda! 🤲`
- S2-greeting: `✨ *Assalamu'alaikum Warahmatullahi Wabarakatuh*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*`
  S2-body: `Fajar telah tiba, mari menyambut berkah pagi dengan mendirikan *Sholat Subuh* 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}`
  S2-footer: `Sholat subuh berjamaah adalah sumber cahaya di hari kiamat. Mari bersiap! 🤲`
- S3-greeting: `🌅 *Assalamu'alaikum wr. wb.*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*`
  S3-body: `Mari mulai hari ini dengan ketaatan. Waktu *Sholat Subuh* telah tiba untuk wilayah kita 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}`
  S3-footer: `Awali langkah harimu dengan bersujud menghadap Allah SWT. Mari sholat! 🤲`

### Dzuhur (3 varian; Jumat → label Jumat + footer §15.3)

- D1: `☀️ salam penuh` / `Waktu *Sholat Dzuhur* telah tiba 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})` / `Tinggalkan sejenak aktivitasmu, saatnya menghadap Allah SWT. Rehatkan jiwa dengan sholat! 🤲`
- D2: `✨ salam penuh` / `Panggilan suci *Sholat Dzuhur* telah berkumandang di tengah kesibukan kita 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}` / `Mari sejenak basuh muka dengan air wudhu, segarkan pikiran, dan tunaikan kewajiban kita 🤲`
- D3: `🌤️ salam singkat (wr. wb.)` / `Sudah masuk waktu *Sholat Dzuhur* 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}` / `Kesuksesan sejati dimulai dari ketaatan sholat tepat waktu. Yuk, mari sholat Dzuhur dulu! 🤲`

### Ashar (3 varian)

- A1: `🌤️ salam penuh` / `Waktu *Sholat Ashar* telah tiba 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})` / `Jangan sampai terlewat, yuk sholat Ashar dulu! Jaga sholat wustha kita 🤲`
- A2: `✨ salam penuh` / `Mentari mulai condong, mari bersiap menunaikan ibadah *Sholat Ashar* tepat waktu 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}` / `Segera selesaikan tugas sejenak dan penuhi panggilan-Nya. Selamat menunaikan sholat Ashar 🤲`
- A3: `🌾 salam singkat` / `Alhamdulillah, panggilan *Sholat Ashar* kembali memanggil kita 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}` / `Tinggalkan pekerjaan sejenak demi keberkahan usaha kita. Mari sholat tepat waktu! 🤲`

### Maghrib (3 varian)

- M1: `🌅 salam penuh` / `Alhamdulillah, sudah masuk waktu *Sholat Maghrib* 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})` / `Syukuri penghujung hari, segera sholat Maghrib! Jangan tunda karena waktunya singkat 🤲`
- M2: `✨ salam penuh` / `Mentari telah tenggelam, saatnya bersyukur mendirikan *Sholat Maghrib* berjamaah 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}` / `Mari tutup aktivitas siang kita dengan menghadap Sang Pencipta. Segera bersuci dan sholat 🤲`
- M3: `🌆 salam singkat` / `Waktu *Sholat Maghrib* yang penuh berkah telah tiba 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}` / `Mari sambut malam dengan sujud yang khusyuk. Selamat melaksanakan sholat Maghrib 🤲`

### Isya (3 varian)

- I1: `🌙 salam penuh` / `Waktu *Sholat Isya* telah tiba 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})` / `Tutup harimu dengan sholat Isya berjamaah, semoga malam kita berkah dan penuh ketenangan! 🤲`
- I2: `✨ salam penuh` / `Panggilan terakhir hari ini, waktu *Sholat Isya* telah berkumandang 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}` / `Sempurnakan ibadah harian kita dengan sholat Isya tepat waktu sebelum beristirahat 🤲`
- I3: `🌌 salam singkat` / `Waktu *Sholat Isya* yang damai telah masuk 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}` / `Mari menghadap Allah SWT di penghujung hari. Selamat menunaikan ibadah sholat Isya 🤲`

## 15.2 Pre-reminder (3 varian, `{{minutes}}` + `{{prayerName}}`)

- P1: `⏰ *Pengingat Sholat — Keluarga Besar UNIDA Gontor*\n\n*{{minutes}} menit* lagi masuk waktu *{{prayerName}}* 🕌\nSegera bersiap-siap dan ambil wudhu! 💧`
- P2: `⏰ *Pre-Reminder Sholat — UNIDA Gontor*\n\nPersiapan diri, *{{minutes}} menit* lagi adzan *{{prayerName}}* akan berkumandang 🕌\nMari bersuci dan segerakan bersiap! 💧`
- P3: `⏰ *Pengingat Sholat — Keluarga Besar UNIDA Gontor*\n\nWaktu *{{prayerName}}* segera tiba dalam *{{minutes}} menit* 🕌\nTinggalkan pekerjaan sejenak dan bersiaplah mengambil wudhu! 💧`
- Jumat: `{{prayerName}}` = `Sholat Jumat`.

## 15.3 Footer khusus Jumat (pengganti footer Dzuhur)

`Bagi kaum pria, mari bersiap lebih awal, potong kuku, gunakan wewangian, dan segerakan ke masjid terdekat untuk Sholat Jumat! 🤲`

## 15.4 Blok hadits (disisipkan bila `includeHadith=true` dan ada hadits aktif)

Header blok menyesuaikan sumber: `📖 *Hadith Hari Ini:*` bila sumber hadits, `📖 *Ayat Hari Ini:*` bila sumber diawali `QS.` (mis. item #9).

```text
📖 *Hadith Hari Ini:*
_"<text>"_
*(<source>)*

```

## 15.5 Seed hadits (10 item — perlu verifikasi ustadz/kampus)

| # | Teks (ringkas) | Sumber | Catatan review |
|---|---|---|---|
| 1 | Sholat paling utama adalah yang tepat pada waktunya | HR. Bukhari & Muslim, dari Abdullah bin Mas'ud | — |
| 2 | Menjaga sholat lima waktu → cahaya, bukti, keselamatan | HR. Ahmad, dari Abdullah bin Amr | — |
| 3 | Amalan pertama dihisab: sholatnya | HR. Abu Dawud & Tirmidzi, dari Abu Hurairah | — |
| 4 | Isya berjamaah = separuh malam; Subuh berjamaah = semalam penuh | HR. Muslim, dari Utsman bin Affan | — |
| 5 | Wudhu sempurna + sholat → diampuni dosa | HR. Muslim, dari Utsman bin Affan | — |
| 6 | Perumpamaan sholat lima waktu seperti sungai… | HR. Muslim, dari Abu Hurairah | — |
| 7 | Sholat pertama dipertanyakan; baik → seluruh amal baik | HR. Tirmidzi, dari Abu Hurairah | Mirip #3, boleh simpan keduanya |
| 8 | Hamba paling dicintai Allah: paling menjaga waktu sholat | HR. Thabrani, dari Ibnu Mas'ud | Perlu cek kekuatan periwayatan |
| 9 | Jagalah sholat-sholat dan sholat wustha… | QS. Al-Baqarah: 238 | **Bukan hadits (Al-Qur'an)** — label "Hadith Hari Ini" salah bila item ini tampil. Opsi: keluarkan, atau ubah label blok bila sumber QS |
| 10 | Ancaman membakar rumah yang tidak ikut sholat | HR. Bukhari & Muslim, dari Abu Hurairah | **Nada keras** untuk broadcast pengingat — timbang keluarkan |

## 15.6 Checklist sign-off (disetujui pemilik 4 Nov 2026)

- [x] Template §15.1–15.4 disetujui (atau catat perubahan)
- [x] Sapaan "Keluarga Besar dan Civitas Akademika UNIDA Gontor" disetujui
- [x] Footer Jumat §15.3 disetujui
- [x] Seed hadits final: **pertahankan 10 item**; item #9 (QS) memakai header "Ayat Hari Ini"
