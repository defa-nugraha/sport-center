import { Head, Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { Shell } from '@/components/public-site';
import { RichText } from '@/components/rich-text-editor';

export default function RefundPolicy({ refundPolicy = '' }: { refundPolicy: string }) {
    return (
        <Shell active="Refund" showBookingPrompt={false}>
            <Head title="Ketentuan Refund" />
            <section className="page-section refund-policy-page">
                <article className="refund-policy-card">
                    <span className="pill">Informasi pemesanan</span>
                    <h1>Ketentuan Refund</h1>
                    <p className="refund-policy-intro">
                        Baca informasi pengembalian dana berikut sebelum menyelesaikan pemesanan venue.
                    </p>
                    <RichText html={refundPolicy} className="refund-policy-rich-text" />
                    <div className="refund-policy-actions">
                        <Link href="/booking" className="button lime"><ChevronLeft aria-hidden="true" size={16} /> Kembali ke pemesanan</Link>
                    </div>
                </article>
            </section>
        </Shell>
    );
}
