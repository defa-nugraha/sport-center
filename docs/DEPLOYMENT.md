# Panduan Deployment Production — Sport Center

Dokumen ini merangkum deployment aplikasi Laravel/React ke server Linux dengan Nginx atau Apache. Sesuaikan lokasi path, domain, user service, PHP-FPM, dan database dengan infrastruktur target. Uji dahulu pada staging; instruksi ini tidak menggantikan backup dan review operasional.

## 1. Persyaratan

- Server Linux dengan PHP 8.3+ beserta seluruh ekstensi yang diminta `composer.json` dan `composer.lock`. Workflow CI memakai PHP 8.5.
- Composer 2, Node.js 22/npm untuk membangun aset (boleh dilakukan di pipeline/build runner).
- MySQL atau SQLite sesuai pilihan environment; production biasanya lebih sesuai memakai database server terkelola.
- Nginx/Apache + PHP-FPM, TLS/HTTPS dan proses backup.
- Akses ke repository dan kredensial eksternal yang dibutuhkan fitur aktif.

Jalankan `composer check-platform-reqs` setelah dependensi Composer terpasang untuk mengecek persyaratan platform.

## 2. Siapkan server

Buat user deployment tanpa hak root untuk aplikasi. Clone kode ke direktori aplikasi (contoh berikut memakai `/var/www/sport-center`):

```bash
sudo mkdir -p /var/www/sport-center
sudo chown "$USER":"$USER" /var/www/sport-center
git clone --branch develop https://github.com/defa-nugraha/sport-center.git /var/www/sport-center
cd /var/www/sport-center
```

Untuk production stabil, sebaiknya deploy dari branch/release yang sudah direview dan diuji; jangan menjadikan branch development yang terus berubah sebagai rilis produksi permanen tanpa proses release.

## 3. Environment production

Buat `.env` dari template, lalu isi rahasia melalui secret manager atau akses server yang dibatasi:

```bash
cp .env.example .env
```

Contoh minimum (sesuaikan URL, domain, database dan penyedia):

```dotenv
APP_NAME="Sport Center"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://sport.example.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sport_center
DB_USERNAME=sport_center_app
DB_PASSWORD=GANTI_DENGAN_PASSWORD_KUAT

LOG_LEVEL=warning
MAIL_MAILER=smtp
```

Contoh domain dan password di atas adalah placeholder. Buat database dan user database terpisah dengan hak minimum yang diperlukan. Konfigurasikan variabel Google OAuth, Midtrans, WhatsApp, dan SMTP jika fitur tersebut akan digunakan. `APP_DEBUG` wajib `false` pada production.

`TRUSTED_PROXIES` pada aplikasi dipakai untuk menentukan proxy yang dipercaya. Jika traffic melewati reverse proxy atau load balancer, masukkan alamat/range proxy yang benar untuk infrastruktur Anda saja. Jangan mempercayai seluruh proxy tanpa memahami dampaknya.

Buat key satu kali untuk instalasi baru:

```bash
php artisan key:generate
```

Simpan key yang dihasilkan dengan aman. **Jangan mengganti APP_KEY pada instalasi berjalan tanpa rencana migrasi**, karena dapat membuat data terenkripsi yang ada tidak dapat dibaca.

## 4. Instal dependency dan build frontend

Di direktori release:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader
npm ci
npm run build
```

Jika proses build dilakukan di CI, deploy artifact yang dihasilkan bersama source serta dependency PHP yang telah dipasang. Pastikan versi Node/npm konsisten dengan workflow yang diuji. Project menggunakan Vite Plus dan script frontend `vp`; jangan mengganti toolchain tanpa menguji ulang.

## 5. Database dan file storage

Sebelum migrasi, buat backup database dan pastikan koneksi mengarah ke database production yang benar.

```bash
php artisan migrate --force
php artisan storage:link
```

Jangan menjalankan `migrate:fresh` pada production. Tinjau setiap migration sebelum deployment, khususnya migration yang mengubah atau menghapus kolom.

Laravel perlu dapat menulis ke `storage/` dan `bootstrap/cache/`. Atur owner/group serta permission berdasarkan user PHP-FPM yang benar; hindari `chmod -R 777`. Contoh harus disesuaikan dengan user/group server:

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo find storage bootstrap/cache -type d -exec chmod 775 {} \;
sudo find storage bootstrap/cache -type f -exec chmod 664 {} \;
```

Jangan jalankan contoh owner `www-data` sebelum memastikan nama user layanan web pada distro Anda.

## 6. Web server

Atur document root web server ke direktori `public/`, bukan root repository. Web server harus meneruskan request PHP ke PHP-FPM sesuai konfigurasi host dan menolak akses publik ke `.env`, source code, `vendor/` atau file internal lainnya. Aktifkan HTTPS dan redirect HTTP ke HTTPS.

Contoh konsep Nginx (sesuaikan socket PHP-FPM, domain, dan konfigurasi TLS yang diterbitkan host):

```nginx
server {
    listen 80;
    server_name sport.example.com;
    root /var/www/sport-center/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_pass unix:/run/php/php-fpm.sock;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Konfigurasi di atas hanya contoh dasar HTTP untuk menjelaskan document root dan front controller; untuk production, gunakan blok TLS yang valid, socket PHP-FPM aktual, hardening sesuai distro dan konfigurasi Nginx yang sudah diuji. Jangan menyalin konfigurasi ini mentah ke server live.

## 7. Cache konfigurasi dan optimasi

Setelah environment dan migration selesai:

```bash
php artisan optimize
php artisan about
php artisan route:list
```

Jika perlu membersihkan cache saat troubleshooting:

```bash
php artisan optimize:clear
```

Perintah terakhir menghapus cache optimasi Laravel dan cocok untuk diagnosis, bukan selalu langkah default setiap deployment. Setelah perubahan environment, pastikan cache dibangun ulang di release yang benar dan konfigurasi tidak memuat nilai lama.

## 8. Queue, scheduler, dan email

Aplikasi menggunakan queue berbasis database pada template environment serta sejumlah job notifikasi booking. Jika fitur async diaktifkan, jalankan worker persisten lewat supervisor/systemd/container dan rencanakan restart worker setiap deployment. Contoh perintah worker:

```bash
php artisan queue:work --sleep=3 --tries=3 --timeout=90
```

Sesuaikan retry/timeout dengan konfigurasi job. Untuk scheduled tasks, cek `routes/console.php` dan daftar schedule yang dipakai; bila memang ada schedule aktif, atur cron Laravel sesuai panduan resmi.

Konfigurasi SMTP yang valid diperlukan agar email terkirim. Jangan menganggap `MAIL_MAILER=log` mengirim email ke penerima sebenarnya.

## 9. Checklist rilis

- [ ] Backup database dan file upload sebelum release.
- [ ] Konfirmasi commit/release yang diuji; CI untuk commit tersebut berstatus sukses.
- [ ] `.env` production tersedia dan tidak masuk Git.
- [ ] `APP_DEBUG=false`, HTTPS aktif, secret kredensial valid.
- [ ] Composer install dan asset build selesai.
- [ ] Migration direview dan dijalankan dengan `--force`.
- [ ] Storage link, ownership, permission, dan document root benar.
- [ ] Jalankan smoke test pada halaman publik, login, dashboard/admin, booking, pembayaran (sandbox jika sesuai), dan email.
- [ ] Periksa `storage/logs/laravel.log`, error log PHP-FPM/Nginx, dan status queue.
- [ ] Catat commit yang dirilis serta rencana rollback.

## 10. Prosedur pembaruan

1. Jadwalkan maintenance bila perubahan berisiko dan informasikan gangguan.
2. Backup database dan berkas yang berpotensi berubah.
3. Deploy release baru secara terpisah bila memungkinkan; jangan menimpa satu folder aktif secara tidak terkontrol.
4. Instal dependency, build frontend, review/run migration.
5. Arahkan symlink/current ke release baru atau aktifkan versi baru setelah pemeriksaan.
6. Jalankan `php artisan optimize` dan restart worker sesuai mekanisme service.
7. Lakukan smoke test dan observasi log.
8. Jika gagal, kembalikan versi kode sebelumnya. Rollback database hanya boleh dilakukan sesuai rencana migration dan backup; mengganti kode saja tidak selalu membatalkan perubahan skema.

## Referensi

- [Laravel deployment](https://laravel.com/docs/deployment)
- [Laravel queues](https://laravel.com/docs/queues)
- [Laravel scheduling](https://laravel.com/docs/scheduling)
