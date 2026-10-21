# Troubleshooting Sport Center

## Aplikasi tidak dapat dibuka

- Periksa log: `tail -n 200 storage/logs/laravel.log`.
- Periksa versi/runtime: `php -v`, `composer check-platform-reqs`, `node --version`.
- Periksa status migrasi: `php artisan migrate:status`.
- Pastikan document root menunjuk ke `public/`, bukan root repository.
- Periksa error log web server dan PHP-FPM; pastikan `APP_DEBUG=false` pada production.

## Error koneksi database

- Verifikasi `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` dan `DB_PASSWORD`.
- Pastikan database telah dibuat dan user diberi izin minimum yang diperlukan.
- Jika memakai SQLite, pastikan file database tersedia dan dapat diakses user PHP.
- Setelah mengubah environment, bersihkan cache konfigurasi dengan `php artisan optimize:clear`.

## Error permission atau file upload

Pastikan user PHP-FPM dapat menulis ke `storage/` dan `bootstrap/cache/`. Periksa symlink `public/storage` dan disk yang dipilih pada `FILESYSTEM_DISK`. Jangan mengatasi permission error dengan memberikan izin `777` secara rekursif.

## Aset CSS/JavaScript tidak muncul

- Jalankan `npm ci` dan `npm run build`.
- Pastikan `public/build/manifest.json` terbentuk sesudah build.
- Periksa `APP_URL`, HTTPS, base URL/proxy, serta console browser.
- Untuk development, `npm run dev` menjalankan Vite Plus server; hapus file `public/hot` yang tertinggal hanya setelah memastikan dev server sudah tidak aktif.

## Google OAuth gagal

Pastikan client ID/secret terpasang, domain diizinkan pada Google Cloud Console, dan `GOOGLE_REDIRECT_URI` sama persis dengan callback yang didaftarkan. Periksa DNS/outbound HTTPS server ke endpoint Google dan konfigurasi proxy.

## Pembayaran Midtrans

Validasi key server/client dan mode sandbox/production. Gunakan kredensial sandbox selama pengujian; jangan mencatat secret atau data pembayaran sensitif ke log. Pastikan callback/webhook dapat dijangkau lewat HTTPS dan hasil status diverifikasi di server.

## Email atau WhatsApp tidak terkirim

- `MAIL_MAILER=log` hanya menulis ke log; atur SMTP untuk pengiriman nyata.
- Verifikasi host/port/credential SMTP dan log mail server.
- Verifikasi `WA_GATEWAY_URL`, `WA_GATEWAY_API_KEY`, dan `WA_GATEWAY_SENDER`.
- Periksa queue worker bila notifikasi dikirim melalui job.

## Queue tertunda

Periksa konfigurasi `QUEUE_CONNECTION`, tabel jobs, failed jobs dan worker. Perintah diagnosis:

```bash
php artisan queue:failed
php artisan queue:work --once -vvv
```

Jalankan `queue:work --once` hanya jika memahami bahwa perintah tersebut memproses satu job dari queue environment yang terkonfigurasi.

## CI atau test gagal

Ikuti workflow repository: Setup Application, lint/check, type-check, lalu unit/feature tests. Catat commit SHA dan nama step yang gagal; jangan menganggap satu run yang gagal sebagai status commit terbaru jika SHA-nya berbeda.

```bash
composer lint:check
npm run check:fix
npm run types:check
php artisan test
```

`npm run check:fix` dapat mengubah file; review `git diff` sesudahnya.
