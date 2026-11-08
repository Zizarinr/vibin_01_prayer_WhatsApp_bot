# 10 — DevOps, Docker, CI/CD

> CI = check+build+push GHCR. Deploy = manual di home server. Tanpa SSH dari CI.
>
> Compose di repo ini **khusus production**. Development jalan native (Bun/Next + MySQL lokal Fedora) — tanpa Compose dev, tanpa pengkhususan dev di Compose.
> Domain/proxy/TLS **ditunda** (keputusan pemilik). Untuk sekarang `web` cukup di loopback. Catatan: Docker tidak menggantikan reverse proxy — saat domain resmi ada, putuskan publish langsung vs reverse proxy (Nginx/Caddy) + dari mana TLS berasal.

## 10.1 Service Compose (prod) — tanpa MySQL

`deploy/compose.yml` menjalankan: `web`, `api`, `worker` (image API + cmd beda), `waha`.

Contoh acuan (OWNER `farrelghozy`, WAHA `gows-2026.10.1`; domain/proxy ditunda):

```yaml
services:
  web:
    image: ghcr.io/OWNER/unida-prayer-web:latest
    restart: unless-stopped
    environment:
      NODE_ENV: production
      INTERNAL_API_URL: http://api:3001
      NEXT_PUBLIC_API_BASE_URL: /api
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - api
  api:
    image: ghcr.io/OWNER/unida-prayer-api:latest
    restart: unless-stopped
    env_file: [.env]
    expose: ["3001"]
    depends_on: [waha]
  worker:
    image: ghcr.io/OWNER/unida-prayer-api:latest
    command: ["bun", "run", "worker"]
    restart: unless-stopped
    env_file: [.env]
    depends_on: [waha]
  waha:
    image: devlikeapro/waha:gows-2026.10.1
    restart: unless-stopped
    environment:
      WHATSAPP_DEFAULT_ENGINE: GOWS
      WAHA_API_KEY: ${WAHA_API_KEY}
    volumes: [waha_sessions:/app/.sessions]
    expose: ["3000"]
volumes:
  waha_sessions:
```

Aturan:
- `depends_on` hanya urutan; API/worker **tetap retry** MySQL/WAHA saat start.
- WAHA jangan `ports` ke publik. API publish ke loopback / lewat proxy internal saja.
- Reverse proxy/TLS ditunda (keputusan pemilik) — untuk sekarang cukup loopback.
- Tambah `healthcheck` API via `/api/health|/ready`.
- `.env` prod di server saja (lihat §10.3).

## 10.2 Image (2 image)

- `ghcr.io/OWNER/unida-prayer-web:<sha|latest>` dari `infrastructure/docker/web.Dockerfile` (Node standalone).
- `ghcr.io/OWNER/unida-prayer-api:<sha|latest>` dari `infrastructure/docker/api.Dockerfile` (Bun).
- Worker = image API + `bun run worker`.
- Tag ganda: `latest` + commit SHA (SHA untuk rollback presisi).

Dockerfile wajib: dukung Bun Workspace, copy hasil build benar, non-root bila memungkinkan, `NODE_ENV=production`, tangani `migrations` ikut image API.

## 10.3 Environment

`.env.example` (tanpa secret asli):

```env
NODE_ENV=production
APP_SECRET=replace-with-long-random-secret
WEB_URL=https://prayer.example.ac.id
API_PORT=3001
DATABASE_URL=mysql://unida_prayer:CHANGE_ME@DB_HOST:3306/unida_prayer
WAHA_BASE_URL=http://waha:3000
WAHA_API_KEY=CHANGE_ME
WAHA_SESSION=unida-prayer
INTERNAL_API_URL=http://api:3001
NEXT_PUBLIC_API_BASE_URL=/api
```

Catatan: `DB_HOST` ke MySQL eksternal (Fedora lokal saat dev, home server saat prod). Encode karakter khusus password. `WAHA_SESSION` default `unida-prayer` (kunci Q-WAHA-05). Jangan simpan secret di `app_settings`.

## 10.4 Workflow GitHub Actions

File: `.github/workflows/build.yml`

- `pull_request → main`: install frozen + typecheck + lint + test + build (tanpa push).
- `push → main`: checks lolos → login GHCR → build+push web+api (`latest` + SHA).
- Permissions minimal (`contents:read`, `packages:write`). Tanpa SSH key, tanpa secret DB/WAHA di workflow. Pin versi actions + base image.

Script root yang harus ada (nama final, kunci Q-DX-01): `typecheck, lint, test, build, db:migrate, admin:seed, worker`.

## 10.5 Update & rollback di home server

Update:

```bash
cd /path/to/unida-prayer
docker compose -f deploy/compose.yml pull
docker compose -f deploy/compose.yml run --rm api bun run db:migrate
docker compose -f deploy/compose.yml up -d
docker compose -f deploy/compose.yml ps
docker compose -f deploy/compose.yml logs -f --tail=100 api worker web waha
```

Rollback app: ganti tag ke SHA lama → `pull` → `up -d`. **Rollback DB tidak otomatis** — migration harus kompatibel; backup dulu bila berisiko.

## 10.6 Backup

- MySQL: dump terjadwal oleh pengelola server (di luar Compose).
- `waha_sessions` volume: backup file terpisah sebelum update mayor/pindah host.
- Uji: restart container, recovery worker, kirim test-message pasca-update.
