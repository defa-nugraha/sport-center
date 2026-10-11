<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Verifikasi Email Sport Center</title>
</head>
<body style="margin:0;padding:0;background:#f2f5f9;font-family:Arial,Helvetica,sans-serif;color:#14243f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f5f9;padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e0e7ef;border-radius:16px;overflow:hidden;">
                    <tr>
                        <td style="padding:28px 28px 20px;text-align:center;border-bottom:1px solid #edf1f5;">
                            <table role="presentation" cellspacing="0" cellpadding="0" align="center">
                                <tr>
                                    <td style="padding:0 9px;vertical-align:middle;">
                                        <img src="{{ rtrim(config('app.url'), '/') }}/assets/ilustrasi/logo-pemda.jpeg" alt="Pemerintah Kabupaten Majalengka" width="48" style="display:block;width:48px;height:auto;max-height:58px;object-fit:contain;">
                                    </td>
                                    <td style="padding:0 9px;vertical-align:middle;">
                                        <img src="{{ rtrim(config('app.url'), '/') }}/assets/ilustrasi/logo-pertamina.png" alt="Pertamina" width="58" style="display:block;width:58px;height:auto;max-height:58px;object-fit:contain;">
                                    </td>
                                    <td style="padding:0 9px;vertical-align:middle;">
                                        <img src="{{ rtrim(config('app.url'), '/') }}/assets/ilustrasi/logo-unma.svg" alt="Universitas Majalengka" width="58" style="display:block;width:58px;height:auto;max-height:58px;object-fit:contain;">
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:16px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;color:#4776a8;">Gelanggang Generasi Muda</p>
                            <h1 style="margin:8px 0 0;font-size:25px;line-height:1.3;color:#14243f;">Verifikasi Email</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:30px 28px 34px;">
                            <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Halo <strong>{{ $user->name }}</strong>,</p>
                            <p style="margin:0 0 18px;font-size:14px;line-height:1.8;color:#5d6d82;">Terima kasih telah mendaftar di Sport Center. Untuk mengaktifkan akun dan melanjutkan ke layanan pemesanan venue, silakan verifikasi alamat email kamu melalui tombol berikut.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:26px auto;">
                                <tr>
                                    <td align="center" bgcolor="#173b67" style="border-radius:9px;">
                                        <a href="{{ $verificationUrl }}" style="display:inline-block;padding:14px 26px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;border-radius:9px;">Verifikasi Email Saya</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0 0 12px;font-size:13px;line-height:1.7;color:#68788d;">Jika tombol tidak bisa dibuka, salin dan tempel tautan berikut ke browser:</p>
                            <p style="margin:0 0 22px;overflow-wrap:anywhere;font-size:12px;line-height:1.7;"><a href="{{ $verificationUrl }}" style="color:#2f74bd;">{{ $verificationUrl }}</a></p>
                            <div style="padding:14px 16px;border:1px solid #dce7f3;border-radius:10px;background:#f5f8fc;font-size:12px;line-height:1.7;color:#65758a;">Demi keamanan, tautan verifikasi ini memiliki batas waktu. Jika kamu tidak merasa membuat akun Sport Center, kamu dapat mengabaikan email ini.</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:18px 24px;background:#f8fafc;border-top:1px solid #e7edf4;text-align:center;">
                            <p style="margin:0;font-size:12px;line-height:1.7;color:#7a8798;">Gelanggang Generasi Muda Talaga Manggung Majalengka<br>Pesan otomatis dari Sport Center. Mohon tidak membalas email ini.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
