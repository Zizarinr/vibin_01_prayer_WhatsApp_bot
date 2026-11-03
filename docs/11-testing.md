# 11 — Testing

> CI gagal bila typecheck/test gagal. WAHA asli tak dipakai di CI (mock saja).

## 11.1 Unit (wajib)

- Engine: 5 waktu valid + berurutan; lat/lng mengubah hasil masuk akal; koreksi menit tepat sasaran; independen `TZ` host (uji `TZ=UTC/Asia/Jakarta/America/New_York`); Jumat ubah label bukan waktu.
- Hijriyah: format `id-ID`, adjustment −2..+2 hanya geser tampil.
- Template: variabel `time/hijri/gregorian/nama` terisi; Jumat pakai label Jumat; hadits tak ulang berurutan bila pilihan lain ada.
- Util: `idempotency_key` stabil; UTC converter benar; validasi settings menolak lat/lng/timezone/sudut/menit invalid.
- Runner: `bun test` (atau Vitest bila diputuskan — kunci Q-DX-01). Semua murni, tanpa DB/WAHA.

## 11.2 Integration (wajib, pakai DB uji + WAHA mock)

- MySQL konek + migration naik dari nol.
- Auth: login sukses set cookie; endpoint admin 401 tanpa login / 403 bila nonaktif; ganti password memutus session lama (sesuai Q-AUTH-02).
- Generator: N target aktif × 10 job/hari (bila pre+adzan on); run 2x tanpa duplikat; target nonaktif tak dapat job baru.
- Dispatcher (mock WAHA sukses): `PENDING→PROCESSING→SENT`, `waha_message_id` tersimpan, `attempt` naik.
- Retry: gagal sementara → `next_attempt` backoff 30s/2m/5m, max 3 → `FAILED`; expired (>grace) tak dikirim; ambigu → `UNKNOWN` tanpa auto-retry.
- Recovery: restart → `PROCESSING` basi tanpa bukti kirim kembali `PENDING`; yang mungkin terkirim → `UNKNOWN`; generator penuhi horizon.
- `recalculate`: ubah lokasi → hanya `PENDING` masa depan berubah; `SENT` utuh.
- Webhook mock: update `waha_message_id`/status sesuai mapping.

## 11.3 WAHA (manual, di luar CI)

- Env staging/dev dengan nomor khusus. Uji: pairing QR, start/stop/restart/logout, sync grup, test-message, kirim 10 job ke 2 grup (cek `allSettled` — 1 gagal tak blokir lain), restart container WAHA (sesi tetap), restart worker mid-send (cek `UNKNOWN` handling).
- Jangan pakai nomor pribadi utama / grup produksi untuk uji beban.

## 11.4 Data uji

- Lokasi tetap: UNIDA Gontor (−7.8652, 111.4617, Asia/Jakarta). Tanggal uji: hari biasa + Jumat + Ramadhan/hari-besar bila relevan (hanya label, bukan logika hari besar).
- Hadits uji: subset 3 item dengan `content_ref` jelas untuk cek anti-repeat.
