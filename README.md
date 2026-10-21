# Sport Center

Sport Center adalah aplikasi pengelolaan fasilitas olahraga dan booking. Aplikasi dibangun dengan Laravel, React, Inertia, TypeScript, dan Vite Plus.

## Mulai cepat

### Kebutuhan

- PHP `^8.3` (workflow CI menggunakan PHP 8.5)
- Composer 2
- Node.js 22 dan npm
- Database SQLite untuk setup lokal sederhana atau database server yang dikonfigurasi di `.env`

### Instalasi lokal

```bash
git clone --branch develop https://github.com/defa-nugraha/sport-center.git
cd sport-center
composer install
cp .env.example .env
```

Atur `.env` dan database lokal. Untuk SQLite:

```bash
touch database/database.sqlite
php artisan key:generate
php artisan migrate
npm ci
npm run build
```

Jalankan dua terminal:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

```bash
npm run dev
```

Buka http://127.0.0.1:8000. Perintah setup di atas merupakan quick start dan harus disesuaikan apabila memakai MySQL atau layanan eksternal.

## Dokumentasi

- [Panduan instalasi lokal](docs/INSTALLATION.md)
- [Deployment production](docs/DEPLOYMENT.md)
- [Referensi environment](docs/ENVIRONMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## CI dan pengujian

Workflow GitHub Actions ada di `.github/workflows/tests.yml`. Alur saat ini menggunakan PHP 8.5 dan Node.js 22, menjalankan `composer setup`, pemeriksaan lint/check dan TypeScript, lalu `php artisan test`.

Perintah pemeriksaan lokal:

```bash
composer lint:check
npm run check:fix
npm run types:check
php artisan test
```

`npm run check:fix` dapat memodifikasi file; periksa diff sebelum commit.

## Integrasi eksternal

File `.env.example` mendokumentasikan variabel untuk Google OAuth, Midtrans, email, dan WhatsApp gateway. Integrasi memerlukan credential yang sah dan konfigurasi callback/endpoint yang sesuai. Jangan commit `.env` atau kredensial.

## Keamanan production

- Set `APP_ENV=production` dan `APP_DEBUG=false`.
- Atur web root ke direktori `public/`.
- Gunakan HTTPS, database dengan hak minimum, backup berkala, permission yang benar, dan secret management.
- Jangan jalankan `migrate:fresh` di production.
