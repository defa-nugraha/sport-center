import { Link, useForm } from '@inertiajs/react';

function FacilityBookingSettings({ facility }: { facility: any }) {
    const form = useForm({ booking_enabled: Boolean(facility.booking_enabled), booking_price_per_hour: facility.booking_price_per_hour ?? '' });
    return <form className="rounded border p-4" onSubmit={(event) => { event.preventDefault(); form.put('/admin/bookings/facilities/' + facility.id); }}>
        <div className="font-medium">{facility.name}</div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
            <label>Harga/jam<input type="number" min="1" className="ml-2 rounded border p-2" value={form.data.booking_price_per_hour} onChange={(e) => form.setData('booking_price_per_hour', Number(e.target.value))} /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.data.booking_enabled} onChange={(e) => form.setData('booking_enabled', e.target.checked)} /> Booking aktif</label>
            <button disabled={form.processing} className="rounded bg-black px-4 py-2 text-white">Simpan</button>
        </div>
    </form>;
}

export default function Index({ bookings, facilities }: { bookings: any; facilities: any[] }) {
    return <main className="p-6">
        <h1 className="text-2xl font-semibold">Booking</h1>
        <section className="mt-6 space-y-3"><h2 className="text-lg font-semibold">Pengaturan harga & booking venue</h2>{facilities.map((facility) => <FacilityBookingSettings key={facility.id} facility={facility} />)}</section>
        <div className="mt-8 overflow-auto"><table className="w-full text-left"><thead><tr><th>Booking</th><th>Customer</th><th>Facility</th><th>Jadwal</th><th>Status</th><th>Total</th></tr></thead><tbody>{bookings.data.map((booking: any) => <tr key={booking.id} className="border-t"><td><Link href={'/admin/bookings/' + booking.id}>{booking.booking_number}</Link></td><td>{booking.customer_name}</td><td>{booking.facility.name}</td><td>{booking.booking_date} {booking.start_time?.slice(0,5)}-{booking.end_time?.slice(0,5)}</td><td>{booking.status}</td><td>Rp {Number(booking.total).toLocaleString('id-ID')}</td></tr>)}</tbody></table></div>
    </main>;
}
