import { Link } from '@inertiajs/react';
import { CalendarCheck, ChevronRight, Clock3, MapPin } from 'lucide-react';
import { UserShell } from '@/components/user-layout';

export default function Booking({ facilities }: any) {
    return (
        <UserShell active="booking" title="Booking Venue" description="Pilih fasilitas yang ingin kamu gunakan, lalu cek jadwal yang masih tersedia.">
            <section className="user-facility-grid">
                {facilities.length ? facilities.map((facility: any) => (
                    <article className="user-facility-card" key={facility.id}>
                        <div className="user-facility-image"><img src={facility.thumbnail || facility.hero_image || '/assets/ggm/Lapang Serba Guna (Basket)2 1.png'} alt={facility.name} /></div>
                        <div className="user-facility-content">
                            <span className="eyebrow"><i /> Venue tersedia</span>
                            <h2>{facility.name}</h2>
                            <p>{facility.subtitle || facility.venue_type || 'Fasilitas olahraga GGM'}</p>
                            <div className="user-facility-meta"><span><Clock3 /> Mulai {facility.booking_min_hours || 1} jam</span><span><MapPin /> {facility.address || 'GGM Majalengka'}</span></div>
                            <strong>Rp {Number(facility.booking_price_per_hour || 0).toLocaleString('id-ID')} <small>/ jam</small></strong>
                            <Link href={'/booking/' + facility.slug} className="button">Pilih venue <ChevronRight /></Link>
                        </div>
                    </article>
                )) : <div className="user-empty"><CalendarCheck /><strong>Belum ada venue yang bisa dipesan</strong><p>Silakan coba lagi setelah venue diaktifkan oleh pengelola.</p></div>}
            </section>
        </UserShell>
    );
}
