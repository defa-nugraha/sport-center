<?php

use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Models\Event;
use App\Models\Facility;
use App\Models\HomepageHighlight;
use App\Models\PageSection;
use App\Models\PageVisit;
use App\Models\PartnerLogo;
use App\Models\Region;
use App\Models\Sport;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed();
});

test('public GGM pages render seeded content and invalid slugs 404', function () {
    $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->component('public/home')->has('facilities')->has('events')->has('posts'));
    $this->get('/facilities')->assertOk()->assertInertia(fn ($page) => $page->component('public/facilities'));
    $this->get('/facilities/lapangan-serba-guna')->assertOk()->assertInertia(fn ($page) => $page->component('public/facility')->where('facility.slug', 'lapangan-serba-guna'));
    $this->get('/sports/basketball')->assertOk();
    $this->get('/events/basketball-championship')->assertOk();
    $this->get('/facilities/does-not-exist')->assertNotFound();
});

test('published blog posts render while drafts remain private', function () {
    $published = BlogPost::published()->firstOrFail();
    $draft = BlogPost::create([
        'user_id' => User::first()->id,
        'title' => 'Catatan Draf',
        'slug' => 'catatan-draf',
        'body' => 'Konten belum terbit.',
        'status' => 'draft',
    ]);

    $this->get('/kabar')->assertOk()->assertInertia(fn ($page) => $page->component('public/blog/index')->has('posts.data', 3));
    $this->get('/kabar/'.$published->slug)->assertOk()->assertInertia(fn ($page) => $page->component('public/blog/show')->where('post.slug', $published->slug));
    $this->get('/kabar/'.$draft->slug)->assertNotFound();
});

test('authenticated admin can create update and delete a blog post with taxonomy', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $user->assignRole('administrator');
    $category = BlogCategory::first();
    $tag = BlogTag::first();

    $this->actingAs($user)->post('/admin/blog/posts', [
        'title' => 'Kabar Uji GGM',
        'excerpt' => 'Ringkasan artikel pengujian.',
        'body' => 'Isi lengkap artikel pengujian.',
        'blog_category_id' => $category->id,
        'tags' => [$tag->id],
        'status' => 'published',
        'featured_image' => UploadedFile::fake()->image('kabar.jpg'),
        'seo_title' => 'Kabar Uji GGM Majalengka',
        'seo_description' => 'Deskripsi SEO artikel pengujian GGM Majalengka.',
    ])->assertRedirect();

    $post = BlogPost::where('slug', 'kabar-uji-ggm')->firstOrFail();
    expect($post->tags)->toHaveCount(1);
    Storage::disk('public')->assertExists($post->featured_image);

    $this->actingAs($user)->put('/admin/blog/posts/'.$post->id, [
        'title' => 'Kabar Uji Diperbarui',
        'body' => 'Isi artikel telah diperbarui.',
        'blog_category_id' => $category->id,
        'tags' => [$tag->id],
        'status' => 'published',
    ])->assertRedirect();
    expect($post->fresh()->slug)->toBe('kabar-uji-diperbarui');

    $this->actingAs($user)->delete('/admin/blog/posts/'.$post->id)->assertRedirect();
    expect(BlogPost::find($post->id))->toBeNull();
});

test('admin requires authentication', function () {
    $this->get('/admin')->assertRedirect('/login');
});

test('authenticated admin can create facility with sport relationship and image', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $user->assignRole('administrator');
    $sport = Sport::first();
    $region = Region::first();
    $response = $this->actingAs($user)->post('/admin/facilities', [
        'name' => 'Test Community Court',
        'subtitle' => 'A new court',
        'description' => 'Created through the CMS.',
        'region_id' => $region->id,
        'sports' => [$sport->id],
        'specifications' => [
            ['label' => 'Kapasitas tribun', 'value' => '500 orang'],
            ['label' => 'Jenis permukaan', 'value' => 'Vinyl olahraga'],
        ],
        'images' => [UploadedFile::fake()->image('court.jpg'), UploadedFile::fake()->image('court-2.jpg')],
        'primary_image' => 1,
    ]);
    $response->assertRedirect();
    $facility = Facility::where('slug', 'test-community-court')->firstOrFail();
    expect($facility->sports)->toHaveCount(1)
        ->and($facility->galleries)->toHaveCount(2)
        ->and($facility->specifications)->toHaveCount(2)
        ->and($facility->specifications->first()->label)->toBe('Kapasitas tribun');
    Storage::disk('public')->assertExists($facility->hero_image);
});

test('feature roles only authorize their assigned content module', function () {
    $user = User::factory()->create();
    $user->assignRole('pengelola-fasilitas');
    $sport = Sport::firstOrFail();
    $region = Region::firstOrFail();

    $this->actingAs($user)->post('/admin/facilities', [
        'name' => 'Lapangan Berizin',
        'region_id' => $region->id,
        'sports' => [$sport->id],
        'specifications' => [
            ['label' => 'Tinggi dinding', 'value' => '15 meter'],
        ],
    ])->assertRedirect();

    $this->actingAs($user)->post('/admin/sports', [
        'name' => 'Olahraga Tanpa Izin',
    ])->assertForbidden();
});

test('administrator can edit facilities sports and events', function () {
    $user = User::factory()->create();
    $user->assignRole('administrator');
    $facility = Facility::firstOrFail();
    $sport = Sport::firstOrFail();
    $event = Event::firstOrFail();

    $this->actingAs($user)->put('/admin/facilities/'.$facility->id, [
        'name' => 'Lapangan Serba Guna Diperbarui',
        'description' => '<p>Deskripsi fasilitas diperbarui.</p>',
        'region_id' => $facility->region_id,
        'sports' => [$sport->id],
        'specifications' => [
            ['label' => 'Tinggi dinding', 'value' => '15 meter'],
        ],
        'features' => [
            ['name' => 'Ruang pemanasan', 'description' => 'Area persiapan atlet.'],
        ],
        'sections' => [
            'overview' => [
                'eyebrow' => 'Informasi arena',
                'title' => 'Detail Teknis Arena',
                'description' => '<p>Informasi khusus fasilitas.</p>',
                'enabled' => true,
            ],
            'gallery' => ['title' => 'Dokumentasi Arena', 'enabled' => true],
            'features' => ['title' => 'Pendukung Aktivitas', 'enabled' => true],
            'sports' => ['title' => 'Cabang Olahraga Tersedia', 'enabled' => true],
            'booking' => ['title' => 'Pesan Arena Ini', 'button_label' => 'Hubungi pengelola', 'enabled' => true],
        ],
    ])->assertRedirect();

    $this->actingAs($user)->put('/admin/sports/'.$sport->id, [
        'name' => 'Bola Basket Diperbarui',
        'description' => '<p>Deskripsi olahraga diperbarui.</p>',
        'sport_category_id' => $sport->sport_category_id,
    ])->assertRedirect();

    $this->actingAs($user)->put('/admin/events/'.$event->id, [
        'title' => 'Acara GGM Diperbarui',
        'description' => '<p>Deskripsi acara diperbarui.</p>',
        'sport_id' => $sport->id,
        'facility_id' => $facility->id,
        'starts_at' => now()->addWeek()->format('Y-m-d H:i:s'),
        'status' => 'upcoming',
    ])->assertRedirect();

    expect($facility->fresh()->name)->toBe('Lapangan Serba Guna Diperbarui')
        ->and($facility->fresh()->sports)->toHaveCount(1)
        ->and($facility->fresh()->specifications)->toHaveCount(1)
        ->and($facility->fresh()->specifications->first()->value)->toBe('15 meter')
        ->and($facility->fresh()->features)->toHaveCount(1)
        ->and($facility->fresh()->contentSections)->toHaveCount(5)
        ->and($facility->fresh()->contentSections->firstWhere('section_key', 'overview')->title)->toBe('Detail Teknis Arena')
        ->and($sport->fresh()->name)->toBe('Bola Basket Diperbarui')
        ->and($event->fresh()->title)->toBe('Acara GGM Diperbarui');

    $this->get('/facilities/'.$facility->fresh()->slug)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('sections.overview.title', 'Detail Teknis Arena')
            ->where('sections.booking.button_label', 'Hubungi pengelola')
            ->has('facility.features', 1));
});

test('facility editor pages and per-facility sections are available to authorized admins', function () {
    $user = User::factory()->create();
    $user->assignRole('administrator');
    $facility = Facility::firstOrFail();

    $this->actingAs($user)->get('/admin/facilities/create')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/facility-editor')->has('sports')->has('regions'));

    $this->actingAs($user)->get("/admin/facilities/{$facility->id}/edit")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/facility-editor')->where('facility.id', $facility->id));
});

test('administrator can manage and moderate public reviews', function () {
    $user = User::factory()->create();
    $user->assignRole('administrator');

    $this->actingAs($user)->get('/admin/reviews')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/reviews/index')->has('reviews.data')->where('counts.approved', 3));

    $this->actingAs($user)->post('/admin/reviews', [
        'name' => 'Pengunjung Uji',
        'organization' => 'Komunitas Uji',
        'rating' => 4,
        'review' => 'Fasilitas nyaman dan mudah diakses.',
        'status' => 'pending',
    ])->assertRedirect();

    $review = Testimonial::where('name', 'Pengunjung Uji')->firstOrFail();
    expect($review->status)->toBe('pending')->and($review->approved)->toBeFalse();

    $this->actingAs($user)->put("/admin/reviews/{$review->id}", [
        'name' => 'Pengunjung Uji Diperbarui',
        'organization' => 'Komunitas Uji',
        'rating' => 5,
        'review' => 'Fasilitas sangat nyaman dan mudah diakses.',
        'status' => 'pending',
    ])->assertRedirect();

    $this->actingAs($user)->patch("/admin/reviews/{$review->id}/status", [
        'status' => 'approved',
    ])->assertRedirect();

    expect($review->fresh()->status)->toBe('approved')
        ->and($review->fresh()->approved)->toBeTrue()
        ->and($review->fresh()->rating)->toBe(5);

    $this->get('/')->assertOk()->assertInertia(
        fn ($page) => $page->where('testimonials.0.name', 'Pengunjung Uji Diperbarui'),
    );

    $this->actingAs($user)->delete("/admin/reviews/{$review->id}")->assertRedirect();
    expect(Testimonial::find($review->id))->toBeNull();
});

test('review manager role cannot access unrelated content modules', function () {
    $user = User::factory()->create();
    $user->assignRole('pengelola-ulasan');

    $this->actingAs($user)->get('/admin/reviews')->assertOk();
    $this->actingAs($user)->post('/admin/sports', ['name' => 'Tanpa izin'])->assertForbidden();
});

test('public page visits are recorded and summarized on the admin dashboard', function () {
    PageVisit::query()->delete();

    $this->get('/')->assertOk();
    $this->get('/sports')->assertOk();

    expect(PageVisit::count())->toBe(2)
        ->and(PageVisit::distinct('visitor_hash')->count('visitor_hash'))->toBe(1);

    $user = User::factory()->create();
    $user->assignRole('administrator');

    $this->actingAs($user)->get('/admin')->assertOk()->assertInertia(
        fn ($page) => $page
            ->component('admin/dashboard')
            ->where('visitors.todayViews', 2)
            ->where('visitors.todayUnique', 1)
            ->has('visitors.daily', 7),
    );
});

test('administrator can update account and password from admin area', function () {
    $user = User::factory()->create(['password' => 'password']);
    $user->assignRole('administrator');

    $this->actingAs($user)->get('/admin/account')->assertOk()->assertInertia(
        fn ($page) => $page->component('admin/account')->has('passkeys'),
    );

    $this->actingAs($user)->patch('/admin/account', [
        'name' => 'Admin GGM Baru',
        'email' => 'admin-baru@ggm.test',
    ])->assertRedirect();

    $this->actingAs($user)->put('/admin/account/password', [
        'current_password' => 'password',
        'password' => 'Password-Baru-2026!',
        'password_confirmation' => 'Password-Baru-2026!',
    ])->assertRedirect();

    expect($user->fresh()->name)->toBe('Admin GGM Baru')
        ->and(Hash::check('Password-Baru-2026!', $user->fresh()->password))->toBeTrue();
});

test('administrator can delete a facility gallery image while preserving a replacement primary image', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $user->assignRole('administrator');
    $facility = Facility::firstOrFail();
    $firstPath = UploadedFile::fake()->image('utama.jpg')->store('ggm', 'public');
    $secondPath = UploadedFile::fake()->image('pengganti.jpg')->store('ggm', 'public');
    $first = $facility->galleries()->create(['image' => $firstPath, 'sort_order' => 90]);
    $facility->galleries()->create(['image' => $secondPath, 'sort_order' => 91]);
    $facility->update(['hero_image' => $firstPath, 'thumbnail' => $firstPath]);

    $this->actingAs($user)
        ->delete("/admin/facilities/{$facility->id}/images/{$first->id}")
        ->assertRedirect();

    expect($first->fresh())->toBeNull()
        ->and($facility->fresh()->hero_image)->not->toBe($firstPath)
        ->and($facility->fresh()->thumbnail)->not->toBe($firstPath);
    Storage::disk('public')->assertMissing($firstPath);
});

test('event reminder is configurable and exported as a calendar alarm', function () {
    $user = User::factory()->create();
    $user->assignRole('administrator');
    $event = Event::firstOrFail();

    $this->actingAs($user)->put('/admin/events/'.$event->id, [
        'title' => $event->title,
        'description' => $event->description,
        'sport_id' => $event->sport_id,
        'facility_id' => $event->facility_id,
        'starts_at' => now()->addDays(10)->format('Y-m-d H:i:s'),
        'status' => 'upcoming',
        'published' => true,
        'reminder_enabled' => true,
        'reminder_days_before' => 3,
    ])->assertRedirect();

    expect($event->fresh()->reminder_enabled)->toBeTrue()
        ->and($event->fresh()->reminder_days_before)->toBe(3);

    $this->get('/events/'.$event->fresh()->slug.'/calendar.ics')
        ->assertOk()
        ->assertHeader('content-type', 'text/calendar; charset=utf-8')
        ->assertSee('BEGIN:VALARM', false)
        ->assertSee('TRIGGER:-P3D', false);
});

test('page editor manages sections icons and partner logos', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $user->assignRole('administrator');

    $this->actingAs($user)->post('/admin/page-sections', [
        'page' => 'home', 'section_key' => 'test-section', 'title' => 'Judul dari CMS',
        'description' => 'Konten yang bisa diubah.', 'enabled' => true,
    ])->assertRedirect();
    expect(PageSection::where('section_key', 'test-section')->exists())->toBeTrue();

    $this->actingAs($user)->post('/admin/homepage-highlights', [
        'icon' => 'trophy', 'title' => 'Arena Berprestasi', 'description' => 'Untuk semua komunitas.', 'published' => true,
    ])->assertRedirect();
    expect(HomepageHighlight::where('icon', 'trophy')->exists())->toBeTrue();

    $this->actingAs($user)->post('/admin/partner-logos', [
        'name' => 'Mitra Pengujian', 'alt_text' => 'Logo mitra pengujian',
        'image' => UploadedFile::fake()->image('mitra.png'), 'published' => true,
    ])->assertRedirect();
    $logo = PartnerLogo::where('name', 'Mitra Pengujian')->firstOrFail();
    Storage::disk('public')->assertExists($logo->image);
});

test('page editor role cannot modify unrelated content', function () {
    $user = User::factory()->create();
    $user->assignRole('editor-halaman');

    $this->actingAs($user)->post('/admin/page-sections', [
        'page' => 'home', 'section_key' => 'role-check', 'title' => 'Konten Berizin', 'enabled' => true,
    ])->assertRedirect();
    $this->actingAs($user)->post('/admin/events', [
        'title' => 'Acara Tanpa Izin', 'starts_at' => now()->addDay(), 'status' => 'upcoming',
    ])->assertForbidden();
});
