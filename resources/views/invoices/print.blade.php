<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Invoice {{ $invoice->invoice_number }} · GGM Majalengka</title>
    <style>
        :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; background: #f3f5f8; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 32px 16px; }
        .toolbar { max-width: 850px; margin: 0 auto 16px; display: flex; justify-content: flex-end; }
        .print-button { border: 0; border-radius: 10px; background: #0f766e; color: #fff; padding: 12px 18px; font: inherit; font-weight: 700; cursor: pointer; }
        .invoice { max-width: 850px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 42px; box-shadow: 0 18px 60px rgba(15, 23, 42, .08); }
        .brand-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-bottom: 24px; border-bottom: 2px solid #e5eaf0; }
        .logos { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .logos img { display: block; object-fit: contain; max-width: 74px; max-height: 62px; }
        .brand-copy { text-align: right; }
        .brand-copy strong { display: block; font-size: 17px; letter-spacing: .02em; }
        .brand-copy span { display: block; margin-top: 5px; color: #64748b; font-size: 12px; line-height: 1.5; }
        .invoice-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; padding: 30px 0 24px; }
        .eyebrow { color: #0f766e; text-transform: uppercase; letter-spacing: .15em; font-size: 11px; font-weight: 800; }
        h1 { margin: 8px 0; font-size: 32px; letter-spacing: -.04em; }
        .muted { color: #64748b; font-size: 13px; line-height: 1.6; }
        .status { display: inline-block; border-radius: 999px; background: #dcfce7; color: #166534; padding: 8px 12px; font-size: 12px; font-weight: 800; white-space: nowrap; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 8px 0 28px; }
        .detail { border: 1px solid #e5eaf0; border-radius: 12px; padding: 16px; min-width: 0; }
        .detail label { display: block; margin-bottom: 8px; color: #64748b; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: .12em; }
        .detail strong { display: block; font-size: 14px; overflow-wrap: anywhere; }
        .detail p { margin: 5px 0 0; color: #64748b; font-size: 12px; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { padding: 13px 12px; background: #f8fafc; color: #64748b; font-size: 10px; text-align: left; text-transform: uppercase; letter-spacing: .08em; }
        td { padding: 18px 12px; border-bottom: 1px solid #e5eaf0; font-size: 13px; vertical-align: top; }
        .amount { text-align: right; white-space: nowrap; }
        .total-row { display: flex; justify-content: flex-end; padding: 22px 12px; }
        .total-box { min-width: 240px; }
        .total-box span { color: #64748b; font-size: 12px; }
        .total-box strong { display: block; margin-top: 5px; color: #0f766e; font-size: 25px; letter-spacing: -.03em; }
        .payment-note { display: flex; gap: 12px; align-items: flex-start; margin-top: 10px; padding: 16px; background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px; color: #115e59; font-size: 12px; line-height: 1.6; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5eaf0; display: flex; justify-content: space-between; gap: 20px; color: #64748b; font-size: 11px; line-height: 1.6; }
        @media (max-width: 620px) { body { padding: 12px 8px; } .invoice { padding: 22px 16px; border-radius: 12px; } .brand-row, .invoice-heading { align-items: flex-start; flex-direction: column; } .brand-copy { text-align: left; } .logos { gap: 10px; } .logos img { max-width: 58px; max-height: 48px; } h1 { font-size: 27px; } .detail-grid { grid-template-columns: 1fr; } .footer { flex-direction: column; } }
        @page { size: A4; margin: 14mm; }
        @media print { :root { background: #fff; } body { padding: 0; background: #fff; } .toolbar { display: none; } .invoice { max-width: none; margin: 0; padding: 0; border-radius: 0; box-shadow: none; } .brand-row, .invoice-heading, .detail-grid, table, .payment-note, .footer { break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="toolbar">
        <button class="print-button" type="button" onclick="window.print()">Cetak / Simpan PDF</button>
    </div>

    <main class="invoice">
        <header class="brand-row">
            <div class="logos" aria-label="Mitra GGM Majalengka">
                <img src="{{ asset('assets/ilustrasi/logo-pemda.jpeg') }}" alt="Pemerintah Kabupaten Majalengka">
                <img src="{{ asset('assets/ilustrasi/logo-unma.png') }}" alt="Universitas Majalengka">
                <img src="{{ asset('assets/ilustrasi/logo-pertamina.png') }}" alt="Pertamina">
                <img src="{{ asset('assets/ilustrasi/logo-dispora.svg') }}" alt="Dispora Kabupaten Majalengka">
            </div>
            <div class="brand-copy">
                <strong>GELANGGANG GENERASI MUDA</strong>
                <span>Talaga Manggung · Majalengka</span>
                <span>Bukti pembayaran resmi pemesanan fasilitas</span>
            </div>
        </header>

        <section class="invoice-heading">
            <div>
                <span class="eyebrow">Bukti transaksi</span>
                <h1>Invoice</h1>
                <div class="muted">Nomor: <strong>{{ $invoice->invoice_number }}</strong><br>
                    Diterbitkan: {{ optional($invoice->issued_at)->format('d F Y, H:i') }} WIB</div>
            </div>
            <span class="status">PEMBAYARAN LUNAS</span>
        </section>

        <section class="detail-grid">
            <div class="detail">
                <label>Ditagihkan kepada</label>
                <strong>{{ $booking->customer_name }}</strong>
                <p>{{ $booking->customer_email }}<br>{{ $booking->customer_phone }}</p>
            </div>
            <div class="detail">
                <label>Detail pemesanan</label>
                <strong>{{ $booking->booking_number }}</strong>
                <p>{{ $booking->facility?->name ?? 'Fasilitas GGM' }}<br>
                    @if (($booking->booking_mode ?? 'hourly') === 'daily')
                        {{ $booking->booking_date?->format('d F Y') }} – {{ ($booking->booking_end_date ?? $booking->booking_date)?->format('d F Y') }} · Per hari
                    @else
                        {{ $booking->booking_date?->format('d F Y') }} · {{ substr((string) $booking->start_time, 0, 5) }}–{{ substr((string) $booking->end_time, 0, 5) }} WIB
                    @endif
                </p>
            </div>
        </section>

        <table>
            <thead>
                <tr><th>Deskripsi</th><th class="amount">Jumlah</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>{{ $booking->facility?->name ?? 'Pemesanan fasilitas GGM' }}</strong>
                        <div class="muted">Booking {{ $booking->booking_number }}</div>
                    </td>
                    <td class="amount">Rp {{ number_format((float) $booking->total, 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>

        <div class="total-row">
            <div class="total-box">
                <span>Total dibayarkan</span>
                <strong>Rp {{ number_format((float) $booking->total, 0, ',', '.') }}</strong>
            </div>
        </div>

        <div class="payment-note">
            <strong>✓</strong>
            <div><strong>Pembayaran telah diterima.</strong><br>
                Invoice ini diterbitkan otomatis setelah pembayaran berhasil diverifikasi oleh sistem. Simpan invoice ini sebagai bukti transaksi Anda.
                @if ($booking->payment?->paid_at)
                    <br>Waktu pembayaran: {{ $booking->payment->paid_at->format('d F Y, H:i') }} WIB.
                @elseif ($booking->paid_at)
                    <br>Waktu pembayaran: {{ $booking->paid_at->format('d F Y, H:i') }} WIB.
                @endif
            </div>
        </div>

        <footer class="footer">
            <span>Terima kasih telah menggunakan fasilitas GGM Majalengka.</span>
            <span>{{ $invoice->invoice_number }} · {{ $booking->booking_number }}</span>
        </footer>
    </main>
</body>
</html>
