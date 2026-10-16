import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthLoginLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <main
            className="login-shell"
            style={{
                backgroundImage: "url('/assets/ilustrasi/ggm-1.png')",
            }}
        >
            <section
                className="login-visual"
                role="img"
                aria-label="Ilustrasi Gelanggang Generasi Muda Talaga Manggung Majalengka"
            >
                <Link href={home()} className="login-home-link">
                    Kembali ke beranda
                </Link>
            </section>

            <section className="login-content">
                <div className="login-panel">
                    <div className="login-partner-logos" aria-label="Mitra GGM Majalengka">
                        <img
                            className="login-pemda-logo"
                            src="/assets/ilustrasi/logo-pemda.jpeg"
                            alt="Pemerintah Kabupaten Majalengka"
                        />
                        <img
                            className="login-unma-logo"
                            src="/assets/ilustrasi/logo-unma.svg"
                            alt="Universitas Majalengka (UNMA)"
                        />
                        <img
                            className="login-pertamina-logo"
                            src="/assets/ilustrasi/logo-pertamina.png"
                            alt="Pertamina"
                        />
                        <img
                            className="login-dispora-logo"
                            src="/assets/ilustrasi/logo-dispora.svg"
                            alt="Dispora Kabupaten Majalengka"
                        />
                    </div>

                    <header className="login-heading">
                        <h1>{title}</h1>
                        <p>{description}</p>
                    </header>

                    {children}

                    <div
                        className="login-venue-mark"
                        aria-label="Gelanggang Generasi Muda Talaga Manggung Majalengka"
                    >
                        <img
                            src="/assets/ilustrasi/ggm.png"
                            alt=""
                            aria-hidden="true"
                        />
                        <p>
                            Gelanggang Generasi Muda
                            <br />
                            Talaga Manggung Majalengka
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
