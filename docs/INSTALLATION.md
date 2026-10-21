# Panduan Instalasi Sport Center

Dokumen ini ditujukan untuk developer yang menjalankan aplikasi Sport Center secara lokal dari branch `develop`.

## 1. Teknologi dan prasyarat

Berdasarkan konfigurasi repository:

- PHP **8.3 atau lebih baru yang didukung dependency**; workflow CI saat ini menguji PHP 8.5.
- Composer 2.
- Node.js 22 sesuai workflow CI.
- npm dan lockfile `package-lock.json`.
- Database yang didukung Laravel. Konfigurasi contoh menggunakan SQLite; MySQL dapat digunakan dengan mengisi variabel DB yang sesuai.
- Ekstensi PHP yang diwajibkan Laravel serta ekstensi yang dituntut oleh package Composer.

Frontend menggunakan React, Inertia, TypeScript, Tailwind CSS, Laravel Vite Plugin, dan **Vite Plus** (`vp` pada scripts package.json). Jangan mengganti perintah `vp` menjadi `vite` tanpa mengubah konfigurasi proyek secara sengaja.

Periksa versi lokal sebelum mulai:

```bash
php -v
composer --version
node --version
npm --version
```

## 2. Clone source code

```bash
git clone --branch develop https://github.com/defa-nugraha/sport-center.git
cd sport-center
```

Pastikan branch dan working tree sesuai:

```bash
git branch --show-current
git status --short
```

## 3. Pasang dependensi dan siapkan environment

Repository memiliki script `composer setup` yang menjalankan instalasi Composer, menyalin `.env.example` jika `.env` belum ada, membuat application key, menjalankan migrasi, menginstal package npm dan membangun frontend.

Sebelum menjalankannya, buat database kosong jika menggunakan MySQL dan sesuaikan `.env` terlebih dahulu agar migrasi tidak diarahkan ke database yang salah. Cara yang lebih terkontrol untuk development:

```bash
composer install
cp .env.example .env
```

Di Windows, salin `.env.example` menjadi `.env` melalui File Explorer atau PowerShell.

Edit `.env` dan sesuaikan minimum konfigurasi berikut:

```dotenv
APP_NAME="Sport Center"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Pilih SQLite untuk setup lokal sederhana jika tersedia:
DB_CONNECTION=sqlite
```

Jika memakai SQLite, buat file database bila belum ada:

```bash
mkdir -p database
touch database/database.sqlite
```

Pada Windows, buat file kosong `database/database.sqlite` jika belum tersedia.

Jika memakai MySQL, isi koneksi sesuai database lokal dan pastikan database sudah dibuat:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sport_center
DB_USERNAME=nama_user_database
DB_PASSWORD=password_database
```

Jangan memakai placeholder tersebut secara literal. Jangan pernah commit file `.env` atau kredensial.

Buat application key dan jalankan migrasi:

```bash
php artisan key:generate
php artisan migrate
```

> Untuk database yang sudah memiliki data, jangan menjalankan `migrate:fresh` atau menghapus file database.

## 4. Instal dependensi frontend

Project memuat `package-lock.json` dan `.npmrc` dengan `ignore-scripts=true`. Gunakan npm dan pertahankan lockfile yang ada:

```bash
npm ci
npm run build
```

Jika package native memerlukan instalasi binary atau script yang memang diperlukan oleh dependency, jangan langsung menonaktifkan perlindungan global. Periksa package yang gagal, lalu ikuti instruksi resmi package tersebut.

## 5. Jalankan aplikasi

Untuk server Laravel dan Vite dalam mode development, gunakan dua terminal.

Terminal 1:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

Terminal 2:

```bash
npm run dev
```

Buka http://127.0.0.1:8000. Jangan gunakan `npm run dev` sebagai cara menjalankan frontend production; production harus menggunakan hasil `npm run build`.

## 6. Periksa instalasi

```bash
php artisan about
php artisan route:list
php artisan migrate:status
php artisan test
npm run types:check
npm run check
```

Perintah `npm run check` menjalankan Vite Plus check dan dapat melakukan pemeriksaan yang dikonfigurasi pada `vite.config.ts`. Untuk mencocokkan alur CI, jalankan juga:

```bash
composer lint:check
npm run check:fix
npm run types:check
php artisan test
```

Perintah `npm run check:fix` dapat mengubah file. Periksa hasilnya dengan `git status` dan `git diff` sebelum commit.

## 7. Integrasi eksternal

File `.env.example` menunjukkan integrasi berikut:

- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, dan `GOOGLE_REDIRECT_URI`.
- Midtrans: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, dan `MIDTRANS_IS_PRODUCTION`.
- WhatsApp gateway: `WA_GATEWAY_URL`, `WA_GATEWAY_API_KEY`, dan `WA_GATEWAY_SENDER`.
- Email: variabel `MAIL_*`.

Fitur terkait memerlukan kredensial yang valid dan callback/redirect URI yang persis sama dengan konfigurasi penyedia. Untuk pengembangan lokal, `MAIL_MAILER=log` menulis email ke log dan tidak mengirim email sungguhan. Jangan menganggap OAuth, pembayaran, email, atau pesan WhatsApp siap dipakai hanya karena aplikasi berhasil dibuka.

## 8. Catatan seeder

Repository memiliki `database/seeders/DatabaseSeeder.php`. Baca seeder sebelum menjalankannya dan pastikan perilakunya sesuai lingkungan. Seeder bisa membuat atau memodifikasi data; jangan jalankan di production tanpa review dan persetujuan yang eksplisit.

## Referensi

- [Repository branch develop](https://github.com/defa-nugraha/sport-center/tree/develop)
- [Panduan deployment Laravel](https://laravel.com/docs/deployment)
