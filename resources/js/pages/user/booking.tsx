import { Link } from '@inertiajs/react';
import { CalendarCheck, CalendarDays, ChevronRight, Clock3, MapPin } from 'lucide-react';
import { UserShell } from '@/components/user-layout';
import { asset } from '@/components/public-site';

export default function Booking({ facilities }: any) {
    return (
        <UserShell active="booking" title="Pemesanan Venue" description="Pilih fasilitas yang ingin kamu gunakan, lalu cek jadwal yang masih tersedia.">
            <section className="user-facility-grid">
                {facilities.length ? facilities.map((facility: any) => {
                    const isDaily = (facility.booking_mode || 'hourly') === 'daily';
                    return (
                        <article className="user-facility-card" key={facility.id}>
                            <div className="user-facility-image">
                                <img
                                    src={asset(facility.thumbnail || facility.hero_image)}
                                    alt={facility.name}
                                    loading="lazy"
                                    decoding="async"
                                    onError={(event) => {
                                        const image = event.currentTarget;
                                        if (image.dataset.fallbackApplied === 'true') return;
                                        image.dataset.fallbackApplied = 'true';
                                        image.src = '/assets/ggm/Lapang Serba Guna (Basket)2 1.png';
                                    }}
                                />
                            </div>
                            <div className="user-facility-content">
                                <span className="eyebrow"><i /> Venue tersedia</span>
                                <h2>{facility.name}</h2>
                                <p>{facility.subtitle || facility.venue_type || 'Fasilitas olahraga GGM'}</p>
                                <div className="user-facility-meta">
                                    <span>{facility.booking_mode === 'both' ? <><CalendarDays /> Per jam &amp; per hari</> : isDaily ? <><CalendarDays /> Per hari</> : <><Clock3 /> Mulai {facility.booking_min_hours || 1} jam</>}</span>
                                    <span><MapPin /> {facility.address || 'GGM Majalengka'}</span>
                                </div>
                                <strong>
                                    {facility.booking_mode === 'both'
                                        ? <>Rp {Number(facility.booking_price_per_hour || 0).toLocaleString('id-ID')} <small>/ jam</small> · Rp {Number(facility.booking_price_per_day || 0).toLocaleString('id-ID')} <small>/ hari</small></>
                                        : <>Rp {Number(isDaily ? facility.booking_price_per_day || 0 : facility.booking_price_per_hour || 0).toLocaleString('id-ID')} <small>{isDaily ? '/ hari' : '/ jam'}</small></>}
                                </strong>
                                <Link href={'/booking/' + facility.slug} className="button">Pilih venue <ChevronRight /></Link>
                            </div>
                        </article>
                    );
                }) : <div className="user-empty"><CalendarCheck /><strong>Belum ada venue yang bisa dipesan</strong><p>Silakan coba lagi setelah venue diaktifkan oleh pengelola.</p></div>}
            </section>
        </UserShell>
    );
}
