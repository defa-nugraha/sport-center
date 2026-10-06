import {
    asset,
    Breadcrumb,
    GalleryViewer,
    Shell,
} from '@/components/public-site';
import { RichText } from '@/components/rich-text-editor';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, CalendarDays, UserRound } from 'lucide-react';
import { BlogShowSkeleton, usePageLoading } from '@/components/page-skeletons';

export default function BlogShow({ post, relatedPosts, sections = {} }: any) {
    const loading = usePageLoading();
    if (loading) return <BlogShowSkeleton />;
    const origin =
        typeof window === 'undefined'
            ? 'http://localhost'
            : window.location.origin;
    const canonical = post.canonical_url || `${origin}/kabar/${post.slug}`;
    const description =
        post.seo_description || post.excerpt || post.body.slice(0, 155);
    const image = asset(post.og_image || post.featured_image);
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.seo_title || post.title,
        description,
        image: [new URL(image, origin).href],
        datePublished: post.published_at,
        dateModified: post.updated_at,
        author: {
            '@type': 'Person',
            name: post.author?.name || 'Tim GGM Majalengka',
        },
        publisher: { '@type': 'Organization', name: 'GGM Majalengka' },
        mainEntityOfPage: canonical,
    };
    return (
        <Shell active="Blog">
            <Head title={post.seo_title || post.title}>
                <meta name="description" content={description} />
                <link rel="canonical" href={canonical} />
                <meta property="og:type" content="article" />
                <meta
                    property="og:title"
                    content={post.seo_title || post.title}
                />
                <meta property="og:description" content={description} />
                <meta
                    property="og:image"
                    content={new URL(image, origin).href}
                />
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Head>
            <article className="blog-detail">
                <div className="blog-detail-head">
                    <Breadcrumb items={['Blog', post.title]} />
                    <span className="eyebrow">
                        {post.category?.name || 'Kabar GGM'}
                    </span>
                    <h1>{post.title}</h1>
                    <p>{post.excerpt}</p>
                    <div className="blog-meta">
                        <span>
                            <CalendarDays />{' '}
                            {new Date(post.published_at).toLocaleDateString(
                                'id-ID',
                                {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                },
                            )}
                        </span>
                        <span>
                            <UserRound />{' '}
                            {post.author?.name || 'Tim GGM Majalengka'}
                        </span>
                    </div>
                </div>
                <img
                    className="blog-detail-image"
                    src={image}
                    alt={post.title}
                />
                <RichText html={post.body} className="blog-body" />
                {post.images?.length > 0 && (
                    <GalleryViewer
                        images={post.images}
                        title={`Galeri ${post.title}`}
                    />
                )}
                {post.tags?.length > 0 && (
                    <div className="blog-tag-list">
                        {post.tags.map((tag: any) => (
                            <Link href={`/kabar?tag=${tag.slug}`} key={tag.id}>
                                #{tag.name}
                            </Link>
                        ))}
                    </div>
                )}
            </article>
            {relatedPosts.length > 0 && (
                <section className="page-section related-blog">
                    <div className="section-title">
                        <div>
                            <h2>{sections.related?.title || 'Kabar lain yang menarik'}</h2>
                        </div>
                        <Link className="text-link" href="/kabar">
                            Lihat semua <ChevronRight />
                        </Link>
                    </div>
                    <div className="blog-grid">
                        {relatedPosts.map((item: any) => (
                            <article className="blog-card" key={item.id}>
                                <Link href={`/kabar/${item.slug}`}>
                                    <img
                                        src={asset(item.featured_image)}
                                        alt={item.title}
                                    />
                                    <div>
                                        <span>
                                            {item.category?.name || 'Kabar GGM'}
                                        </span>
                                        <h3>{item.title}</h3>
                                        <strong>
                                            Baca selengkapnya <ChevronRight />
                                        </strong>
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </Shell>
    );
}
