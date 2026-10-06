import { asset, EmptyState, Shell } from '@/components/public-site';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, CalendarDays } from 'lucide-react';
import { BlogIndexSkeleton, usePageLoading } from '@/components/page-skeletons';

export default function BlogIndex({ posts, categories, tags, filters, sections = {} }: any) {
    const loading = usePageLoading();
    if (loading) return <BlogIndexSkeleton />;
    return (
        <Shell active="Blog">
            <Head title="Kabar Terbaru GGM Majalengka">
                <meta
                    name="description"
                    content="Kabar, agenda, dan cerita terbaru dari GGM Majalengka."
                />
            </Head>
            <section
                className="listing-hero blog-listing-hero"
                style={{
                    backgroundImage: "url('/assets/backgrounds/news.jpg')",
                }}
            >
                <div>
                    <span className="eyebrow">{sections.hero?.eyebrow || 'Cerita dari GGM'}</span>
                    <h1>{sections.hero?.title || 'Kabar Terbaru'}</h1>
                    <p>
                        {sections.hero?.description || 'Ikuti kabar fasilitas, turnamen, komunitas, dan aktivitas olahraga di GGM Majalengka.'}
                    </p>
                </div>
            </section>
            <section className="page-section blog-index-section">
                <nav className="blog-filters" aria-label="Filter artikel">
                    <Link
                        className={
                            !filters.category && !filters.tag ? 'active' : ''
                        }
                        href="/kabar"
                    >
                        Semua kabar
                    </Link>
                    {categories.map((category: any) => (
                        <Link
                            className={
                                filters.category === category.slug
                                    ? 'active'
                                    : ''
                            }
                            href={`/kabar?category=${category.slug}`}
                            key={category.id}
                        >
                            {category.name}{' '}
                            <small>{category.posts_count}</small>
                        </Link>
                    ))}
                </nav>
                {posts.data.length ? (
                    <div className="blog-grid">
                        {posts.data.map((post: any) => (
                            <article className="blog-card" key={post.id}>
                                <Link href={`/kabar/${post.slug}`}>
                                    <img
                                        src={asset(post.featured_image)}
                                        alt={post.title}
                                        loading="lazy"
                                    />
                                    <div>
                                        <span>
                                            {post.category?.name || 'Kabar GGM'}
                                        </span>
                                        <h2>{post.title}</h2>
                                        <p>{post.excerpt}</p>
                                        <small>
                                            <CalendarDays />{' '}
                                            {new Date(
                                                post.published_at,
                                            ).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </small>
                                        <strong>
                                            Baca selengkapnya <ChevronRight />
                                        </strong>
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Belum ada kabar"
                        copy="Kabar terbaru dari GGM akan segera hadir di sini."
                    />
                )}
                {posts.links?.length > 3 && (
                    <nav className="pagination" aria-label="Navigasi halaman">
                        {posts.links.map((link: any, index: number) =>
                            link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={link.active ? 'active' : ''}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ),
                        )}
                    </nav>
                )}
                {tags.length > 0 && (
                    <div className="blog-tag-list">
                        <strong>Jelajahi topik:</strong>
                        {tags.map((tag: any) => (
                            <Link href={`/kabar?tag=${tag.slug}`} key={tag.id}>
                                #{tag.name}
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </Shell>
    );
}
