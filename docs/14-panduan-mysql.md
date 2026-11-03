# 14 — Panduan MySQL (dieksekusi pemilik server)

> MySQL dikelola pemilik, di luar Compose aplikasi. Dev (Fedora) dan prod (home server Ubuntu) mengikuti panduan yang sama; kredensial prod diatur sendiri via environment.
> Port standar: **3306** (tidak diubah).

## 14.1 Kebutuhan

- MySQL 8.x (atau kompatibel). Charset `utf8mb4`, collation `utf8mb4_unicode_ci`.
- Satu database: `unida_prayer`. Satu user aplikasi (nama bebas, contoh `unida_prayer`).
- Aplikasi butuh hak: `SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, REFERENCES, INDEX` pada `unida_prayer.*` (hak DDL untuk Drizzle migration).
- MySQL harus dapat dijangkau dari host/container aplikasi (`DATABASE_URL`). Jangan buka port 3306 ke internet publik — batasi ke host aplikasi / jaringan internal.

## 14.2 Setup awal (sekali saja per environment)

Jalankan sebagai user admin MySQL (`root` atau setara):

```sql
CREATE DATABASE IF NOT EXISTS unida_prayer
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'unida_prayer'@'%' IDENTIFIED BY 'GANTI_PASSWORD_KUAT';

GRANT SELECT, INSERT, UPDATE, DELETE,
      CREATE, ALTER, DROP, REFERENCES, INDEX
  ON unida_prayer.* TO 'unida_prayer'@'%';

FLUSH PRIVILEGES;
```

Catatan:
- Ganti `'GANTI_PASSWORD_KUAT'` dengan password acak panjang. Bila password memuat karakter khusus (`@`, `/`, `#`, `?`), encode saat dipakai di `DATABASE_URL` (lihat §14.3) atau pakai password alfanumerik panjang.
- `'%'` mengizinkan koneksi dari container/host lain. Bila MySQL dan aplikasi satu host dan ingin ketat, ganti `'%'` dengan host spesifik (mis. `'localhost'` untuk dev Fedora).
- Jangan berikan `ALL PRIVILEGES` / `SUPER` / akses ke schema `mysql.*`.

## 14.3 `DATABASE_URL`

```env
DATABASE_URL=mysql://unida_prayer:GANTI_PASSWORD_KUAT@DB_HOST:3306/unida_prayer
```

- Dev Fedora (MySQL lokal): `DB_HOST=127.0.0.1`.
- Prod (home server): `DB_HOST` = alamat MySQL yang dikelola pemilik (bisa `127.0.0.1` bila satu host, atau IP/hostname internal bila terpisah).
- Contoh password dengan karakter khusus (`p@ss/w#rd` → `p%40ss%2Fw%23rd`):
  `mysql://unida_prayer:p%40ss%2Fw%23rd@127.0.0.1:3306/unida_prayer`

## 14.4 Verifikasi koneksi

```bash
# 1. Dari CLI MySQL
mysql -h DB_HOST -P 3306 -u unida_prayer -p -e "SELECT 1;"

# 2. Dari aplikasi (setelah Phase 1)
bun run db:migrate
curl -s http://localhost:3001/api/ready
```

## 14.5 Backup (tugas pemilik server)

```bash
mysqldump -h DB_HOST -P 3306 -u unida_prayer -p unida_prayer > backup-$(date +%F).sql
```

- Backup sebelum: migration berisiko, update image mayor, perubahan schema.
- Restore: `mysql -h ... -u ... -p unida_prayer < backup-YYYY-MM-DD.sql`.
- Rollback aplikasi (tag SHA) tidak membalikkan migration — desain migration kompatibel maju.

## 14.6 Dev Fedora (instalasi bila belum ada)

```bash
sudo dnf install -y mysql-server
sudo systemctl enable --now mysqld
# Amankan instalasi bila diminta, lalu ikuti §14.2 dengan DB_HOST=127.0.0.1
```

## 14.7 Yang TIDAK dilakukan

- Tidak menjalankan MySQL di `deploy/compose.yml` (keputusan kunci).
- Tidak commit password/`DATABASE_URL` prod ke Git.
- Tidak membuka 3306/WAHA ke internet publik.
