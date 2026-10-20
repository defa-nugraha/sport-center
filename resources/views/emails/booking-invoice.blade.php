<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pembayaran berhasil</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f3f5f8;color:#172033;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5eaf0;border-radius:14px;overflow:hidden;">
        <div style="padding:24px 28px;border-bottom:1px solid #e5eaf0;text-align:center;">
            <div style="margin-bottom:18px;">
                <img src="{{ url('/assets/ilustrasi/logo-pemda.jpeg') }}" alt="Pemerintah Kabupaten Majalengka" style="display:inline-block;vertical-align:middle;width:auto;max-width:62px;height:48px;object-fit:contain;margin:0 7px;">
                <img src="{{ url('/assets/ilustrasi/logo-unma.png') }}" alt="Universitas Majalengka" style="display:inline-block;vertical-align:middle;width:auto;max-width:62px;height:48px;object-fit:contain;margin:0 7px;">
                <img src="{{ url('/assets/ilustrasi/logo-pertamina.png') }}" alt="Pertamina" style="display:inline-block;vertical-align:middle;width:auto;max-width:62px;height:48px;object-fit:contain;margin:0 7px;">
                <img src="{{ url('/assets/ilustrasi/logo-dispora.svg') }}" alt="Dispora Kabupaten Majalengka" style="display:inline-block;vertical-align:middle;width:auto;max-width:62px;height:48px;object-fit:contain;margin:0 7px;">
            </div>
            <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#0f766e;">GELANGGANG GENERASI MUDA</div>
            <div style="font-size:12px;color:#64748b;margin-top:5px;">Talaga Manggung · Majalengka</div>
        </div>

        <div style="padding:28px;">
            <div style="display:inline-block;padding:7px 10px;background:#dcfce7;color:#166534;border-radius:999px;font-size:11px;font-weight:700;">PEMBAYARAN BERHASIL</div>
            <h1 style="font-size:25px;line-height:1.25;margin:16px 0 8px;color:#172033;">Terima kasih, {{ $booking->customer_name }}.</h1>
            <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 22px;">Pembayaran Anda telah diverifikasi dan pemesanan fasilitas telah dikonfirmasi. Invoice resmi terlampir dalam format PDF dan dapat dibuka kembali melalui tombol di bawah.</p>

            <div style="padding:18px;border:1px solid #e5eaf0;border-radius:10px;">
                <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Nomor invoice</div>
                <div style="font-size:17px;font-weight:700;margin:5px 0 16px;">{{ $booking->invoice->invoice_number }}</div>
                <table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px;">
                    <tr><td style="padding:7px 0;color:#64748b;">Nomor booking</td><td style="padding:7px 0;text-align:right;font-weight:700;">{{ $booking->booking_number }}</td></tr>
                    <tr><td style="padding:7px 0;color:#64748b;">Fasilitas</td><td style="padding:7px 0;text-align:right;font-weight:700;">{{ $booking->facility->name }}</td></tr>
                    <tr><td style="padding:7px 0;color:#64748b;">Tanggal</td><td style="padding:7px 0;text-align:right;font-weight:700;">{{ $booking->booking_date->format('d-m-Y') }}</td></tr>
                    @if (($booking->booking_mode ?? 'hourly') !== 'daily')
                        <tr><td style="padding:7px 0;color:#64748b;">Jam</td><td style="padding:7px 0;text-align:right;font-weight:700;">{{ substr($booking->start_time, 0, 5) }} – {{ substr($booking->end_time, 0, 5) }}</td></tr>
                    @endif
                    <tr><td style="padding:12px 0 0;color:#64748b;border-top:1px solid #e5eaf0;">Total dibayar</td><td style="padding:12px 0 0;text-align:right;border-top:1px solid #e5eaf0;color:#0f766e;font-size:18px;font-weight:700;">Rp {{ number_format((float) $booking->total, 0, ',', '.') }}</td></tr>
                </table>
            </div>

            <div style="text-align:center;margin:26px 0 18px;">
                <a href="{{ $invoiceUrl }}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:9px;font-size:13px;font-weight:700;">Lihat &amp; cetak invoice</a>
            </div>
            <p style="font-size:12px;line-height:1.6;color:#64748b;margin:0;">Tautan invoice dapat digunakan selama 30 hari. Simpan lampiran PDF ini sebagai bukti pembayaran Anda.</p>
        </div>

        <div style="padding:18px 28px;background:#f8fafc;color:#64748b;font-size:11px;line-height:1.6;text-align:center;">
            Gelanggang Generasi Muda Talaga Manggung Majalengka<br>
            Email ini dikirim otomatis setelah pembayaran berhasil diverifikasi.
        </div>
    </div>
</body>
</html>
