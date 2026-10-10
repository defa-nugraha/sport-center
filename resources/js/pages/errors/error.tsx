import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CircleHelp, House, RefreshCw, ShieldAlert } from 'lucide-react';

type ErrorPageProps = {
    status: number;
};

const errorContent: Record<number, { title: string; description: string; eyebrow: string }> = {
    400: {
        title: 'Permintaan tidak valid',
        description: 'Permintaan yang dikirim tidak dapat kami proses. Periksa kembali informasi yang kamu masukkan, lalu coba lagi.',
        eyebrow: 'Bad Request',
    },
    401: {
        title: 'Silakan masuk terlebih dahulu',
        description: 'Kamu perlu masuk ke akun Sport Center untuk mengakses halaman ini.',
        eyebrow: 'Unauthorized',
    },
    403: {
        title: 'Akses tidak diizinkan',
        description: 'Maaf, akun kamu tidak memiliki izin untuk membuka halaman ini.',
        eyebrow: 'Forbidden',
    },
    404: {
        title: 'Halaman tidak ditemukan',
        description: 'Sepertinya halaman yang kamu cari sudah pindah, tidak tersedia, atau alamatnya salah.',
        eyebrow: 'Page Not Found',
    },
    419: {
        title: 'Sesi kamu telah berakhir',
        description: 'Untuk menjaga keamanan akun, sesi ini sudah tidak berlaku. Muat ulang halaman dan coba kembali.',
        eyebrow: 'Page Expired',
    },
    422: {
        title: 'Data belum dapat diproses',
        description: 'Ada informasi yang belum sesuai. Periksa kembali data yang dikirim dan coba lagi.',
        eyebrow: 'Unprocessable Content',
    },
    429: {
        title: 'Terlalu banyak permintaan',
        description: 'Kamu melakukan permintaan terlalu cepat. Tunggu sebentar sebelum mencoba kembali.',
        eyebrow: 'Too Many Requests',
    },
    500: {
        title: 'Ada kendala di sisi kami',
        description: 'Maaf, terjadi kesalahan pada server. Tim kami perlu memeriksanya. Silakan coba lagi beberapa saat lagi.',
        eyebrow: 'Internal Server Error',
    },
    502: {
        title: 'Server sedang tidak merespons',
        description: 'Koneksi ke layanan sedang mengalami gangguan. Coba kembali beberapa saat lagi.',
        eyebrow: 'Bad Gateway',
    },
    503: {
        title: 'Layanan sedang beristirahat',
        description: 'Sport Center sedang tidak dapat diakses sementara. Silakan kembali beberapa saat lagi.',
        eyebrow: 'Service Unavailable',
    },
    504: {
        title: 'Waktu tunggu habis',
        description: 'Server membutuhkan waktu terlalu lama untuk merespons. Periksa koneksi kamu lalu coba lagi.',
        eyebrow: 'Gateway Timeout',
    },
};

export default function ErrorPage({ status }: ErrorPageProps) {
    const content = errorContent[status] ?? {
        title: 'Terjadi kesalahan',
        description: 'Maaf, permintaan kamu belum dapat diselesaikan. Coba kembali atau kembali ke halaman utama.',
        eyebrow: 'Unexpected Error',
    };
    const isServerError = status >= 500;

    return (
        <main className="flex min-h-screen flex-col overflow-hidden bg-[#f5f8fc] text-[#14243f]">
            <Head title={`${status} — ${content.title}`} />

            <header className="relative z-10 flex items-center justify-between border-b border-[#dce5ef] bg-white px-5 py-4 sm:px-8 lg:px-14">
                <Link href="/" className="flex items-center gap-3" aria-label="Sport Center — halaman utama">
                    <img
                        src="/assets/ilustrasi/logo-ggm.png"
                        alt=""
                        className="h-10 w-10 object-contain"
                        onError={(event) => {
                            event.currentTarget.style.display = 'none';
                        }}
                    />
                    <span className="text-sm font-extrabold tracking-tight sm:text-base">
                        SPORT <span className="text-[#2f74bd]">CENTER</span>
                        <span className="mt-0.5 block text-[10px] font-medium tracking-[0.12em] text-[#66758a]">
                            TALAGA MANGGUNG MAJALENGKA
                        </span>
                    </span>
                </Link>
                <Link href="/" className="hidden items-center gap-2 text-sm font-semibold text-[#52657b] transition hover:text-[#2f74bd] sm:inline-flex">
                    <House className="size-4" aria-hidden="true" />
                    Beranda
                </Link>
            </header>

            <section className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-8 px-5 py-12 sm:px-8 md:grid-cols-2 md:gap-12 lg:px-14 lg:py-16">
                <div className="order-2 max-w-xl md:order-1">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dce5ef] bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#2f74bd]">
                        {isServerError ? (
                            <ShieldAlert className="size-4" aria-hidden="true" />
                        ) : (
                            <CircleHelp className="size-4" aria-hidden="true" />
                        )}
                        {content.eyebrow}
                    </div>

                    <p className="mb-2 text-6xl font-black leading-none tracking-tight text-[#2f74bd] sm:text-7xl lg:text-8xl">
                        {status}
                    </p>
                    <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-[#14243f] sm:text-4xl lg:text-5xl">
                        {content.title}
                    </h1>
                    <p className="mb-8 max-w-lg text-base leading-7 text-[#66758a] sm:text-lg">
                        {content.description}
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#14243f] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#20395e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f74bd]"
                        >
                            <House className="size-4" aria-hidden="true" />
                            Kembali ke beranda
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#cfdbe7] bg-white px-5 py-3 text-sm font-bold text-[#14243f] transition hover:bg-[#eaf4ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f74bd]"
                        >
                            <RefreshCw className="size-4" aria-hidden="true" />
                            Coba lagi
                        </button>
                    </div>

                    <p className="mt-7 text-xs leading-5 text-[#8190a2]">
                        Kode error: {status}. Jika masalah terus terjadi, silakan coba kembali nanti.
                    </p>
                </div>

                <div className="order-1 mx-auto w-full max-w-lg md:order-2">
                    <div className="relative rounded-2xl border border-[#dce5ef] bg-white p-4 shadow-[0_24px_70px_rgba(20,36,63,0.08)] sm:p-7">
                        <div className="absolute -right-3 -top-3 flex size-12 items-center justify-center rounded-xl bg-[#e43d4e] text-white shadow-lg">
                            <span className="text-xs font-black">{status}</span>
                        </div>
                        <img
                            src="/assets/ilustrasi/error-page.svg"
                            alt="Ilustrasi bantuan dan pemulihan Sport Center"
                            className="mx-auto block h-auto w-full max-w-[460px]"
                        />
                        <div className="mx-auto mt-1 max-w-xs rounded-lg bg-[#f5f8fc] px-4 py-3 text-center">
                            <p className="mb-1 text-sm font-bold text-[#14243f]">Jangan khawatir!</p>
                            <p className="mb-0 text-xs leading-5 text-[#66758a]">Kamu bisa kembali menjelajahi fasilitas dan aktivitas olahraga kami.</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-[#dce5ef] bg-white px-5 py-5 text-center text-xs text-[#8190a2] sm:px-8">
                © {new Date().getFullYear()} Sport Center · Gelanggang Generasi Muda Talaga Manggung Majalengka
            </footer>
        </main>
    );
}

