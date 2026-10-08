import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Tampilan" />

            <h1 className="sr-only">Tampilan</h1>

            <div className="account-section">
                <Heading
                    variant="small"
                    title="Tampilan"
                    description="Atur tampilan aplikasi sesuai preferensimu"
                />
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Tampilan',
            href: editAppearance(),
        },
    ],
};
