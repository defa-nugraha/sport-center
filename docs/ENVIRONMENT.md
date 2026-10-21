# Referensi Environment Sport Center

File template resmi untuk nama variabel adalah `.env.example` di root repository. Jangan menaruh nilai secret, token, password atau key nyata di dokumentasi maupun Git.

| Variabel | Fungsi / catatan |
|---|---|
| `APP_NAME` | Nama aplikasi untuk halaman dan pesan. |
| `APP_ENV` | Gunakan `local` saat pengembangan dan `production` di server live. |
| `APP_KEY` | Kunci aplikasi Laravel; buat sekali untuk instalasi baru dan simpan aman. |
| `APP_DEBUG` | `true` lokal, wajib `false` production. |
| `APP_URL` | URL utama aplikasi, termasuk skema HTTPS jika live. |
| `TRUSTED_PROXIES` | Daftar alamat proxy yang benar-benar dipercaya, dipisahkan koma. |
| `DB_CONNECTION` | Template memakai SQLite; dapat disetel ke driver DB yang didukung. |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Detail koneksi database; variabel host/credential dikomentari dalam template karena default SQLite. |
| `SESSION_DRIVER` | Template memakai `database`; pastikan tabel session tersedia melalui migrasi. |
| `CACHE_STORE` | Template memakai database cache. |
| `QUEUE_CONNECTION` | Template memakai database queue; worker diperlukan untuk job async. |
| `MAIL_*` | Konfigurasi transport email. `MAIL_MAILER=log` bukan pengiriman email nyata. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Integrasi Google OAuth; callback harus cocok dengan provider. |
| `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION` | Integrasi pembayaran Midtrans dan mode transaksi. |
| `BOOKING_PAYMENT_EXPIRY_MINUTES` | Masa berlaku pembayaran booking. |
| `WA_GATEWAY_URL`, `WA_GATEWAY_API_KEY`, `WA_GATEWAY_SENDER` | Integrasi gateway WhatsApp. |

Variabel lain dalam `.env.example` termasuk locale, logging, session, cache/Redis, filesystem, dan AWS storage. Pertahankan sesuai kebutuhan lingkungan.

## Aturan pengelolaan

1. `.env` tidak boleh di-commit atau dipublikasikan.
2. Gunakan secret manager atau pengelolaan secret server yang dibatasi aksesnya.
3. Jangan berbagi kredensial antardev, staging, dan production.
4. Saat menyalin environment, periksa ulang `APP_URL`, database, mailer, OAuth callback, payment mode, dan trusted proxy.
5. Jangan membagikan keluaran `php artisan about --only=environment` atau dump konfigurasi jika berpotensi memuat detail sensitif.
