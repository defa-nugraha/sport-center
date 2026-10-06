<?php

use App\Models\Event;
use App\Models\HomepageHighlight;
use App\Models\PageBanner;
use App\Models\PageSection;
use App\Models\PartnerLogo;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed();
});

test('all seeded public routes and calendar downloads are available', function () {
    foreach (['/', '/facilities', '/facilities/lapangan-serba-guna', '/sports', '/sports/basketball', '/events', '/events/basketball-championship', '/kabar', '/kabar/lapangan-serba-guna-siap-menyambut-turnamen'] as $route) {
        $this->get($route)->assertOk();
    }

    $this->get('/events/basketball-championship/calendar.ics')
        ->assertOk()
        ->assertHeader('content-type', 'text/calendar; charset=utf-8')
        ->assertSee('BEGIN:VCALENDAR', false)
        ->assertSee('BEGIN:VALARM', false);
});

test('disabled reminders omit calendar alarms and private events cannot be exported', function () {
    $event = Event::firstOrFail();
    $event->update(['reminder_enabled' => false]);

    $this->get('/events/'.$event->slug.'/calendar.ics')
        ->assertOk()
        ->assertDontSee('BEGIN:VALARM', false);

    $event->update(['published' => false]);
    $this->get('/events/'.$event->slug.'/calendar.ics')->assertNotFound();
});

test('event reminder validation rejects values beyond the supported range', function () {
    $admin = User::factory()->create();
    $admin->assignRole('administrator');
    $event = Event::firstOrFail();

    $this->actingAs($admin)->from('/admin/content?tab=events')->put('/admin/events/'.$event->id, [
        'title' => $event->title,
        'starts_at' => now()->addDay(),
        'status' => 'upcoming',
        'reminder_enabled' => true,
        'reminder_days_before' => 366,
    ])->assertRedirect('/admin/content?tab=events')->assertSessionHasErrors('reminder_days_before');
});

test('page content can be updated and is immediately exposed to the public page', function () {
    $admin = User::factory()->create();
    $admin->assignRole('administrator');
    $section = PageSection::where(['page' => 'home', 'section_key' => 'partners'])->firstOrFail();

    $this->actingAs($admin)->put('/admin/page-sections/'.$section->id, [
        'page' => 'home',
        'section_key' => 'partners',
        'eyebrow' => 'Mitra GGM',
        'title' => 'Sahabat yang Pernah Hadir',
        'description' => 'Dikelola langsung dari panel admin.',
        'enabled' => true,
    ])->assertRedirect();

    $this->get('/')->assertOk()->assertInertia(fn ($page) => $page
        ->where('sections.partners.title', 'Sahabat yang Pernah Hadir')
        ->where('sections.partners.description', 'Dikelola langsung dari panel admin.'));
});

test('page content editor renders with all required props', function () {
    $admin = User::factory()->create();
    $admin->assignRole('administrator');

    $this->actingAs($admin)->get('/admin/pages')->assertRedirect('/admin/pages/sections');

    $this->actingAs($admin)->get('/admin/pages/sections')->assertOk()->assertInertia(fn ($page) => $page
        ->component('admin/pages')
        ->where('pageSection', 'sections')
        ->where('sectionLabel', 'Teks Setiap Bagian')
        ->has('pageSections')
        ->has('pageBanners')
        ->has('homepageHighlights')
        ->has('partnerLogos')
        ->has('settings'));

    foreach (['banners', 'highlights', 'partners', 'settings'] as $section) {
        $this->actingAs($admin)->get('/admin/pages/'.$section)->assertOk()->assertInertia(fn ($page) => $page
            ->component('admin/pages')
            ->where('pageSection', $section));
    }
});

test('admin can manage homepage banners and public homepage only receives published banners', function () {
    Storage::fake('public');
    $admin = User::factory()->create();
    $admin->assignRole('administrator');

    $this->actingAs($admin)->post('/admin/page-banners', [
        'page' => 'home',
        'title' => 'Banner Pengujian',
        'image' => UploadedFile::fake()->image('banner.jpg', 1600, 900),
        'alt_text' => 'Suasana arena GGM',
        'location_label' => 'Majalengka, Jawa Barat',
        'published' => true,
        'sort_order' => 20,
    ])->assertRedirect();

    $banner = PageBanner::where('title', 'Banner Pengujian')->firstOrFail();
    Storage::disk('public')->assertExists($banner->image);

    $this->get('/')->assertOk()->assertInertia(fn ($page) => $page
        ->where('banners', fn ($banners) => collect($banners)->contains('title', 'Banner Pengujian')));

    $this->actingAs($admin)->put('/admin/page-banners/'.$banner->id, [
        'page' => 'home',
        'title' => 'Banner Disembunyikan',
        'published' => false,
        'sort_order' => 20,
    ])->assertRedirect();

    $this->get('/')->assertOk()->assertInertia(fn ($page) => $page
        ->where('banners', fn ($banners) => ! collect($banners)->contains('title', 'Banner Disembunyikan')));

    $path = $banner->fresh()->image;
    $this->actingAs($admin)->delete('/admin/page-banners/'.$banner->id)->assertRedirect();
    Storage::disk('public')->assertMissing($path);
});

test('page editor can update delete icons and partner logos with media cleanup', function () {
    Storage::fake('public');
    $admin = User::factory()->create();
    $admin->assignRole('administrator');
    $highlight = HomepageHighlight::firstOrFail();

    $this->actingAs($admin)->put('/admin/homepage-highlights/'.$highlight->id, [
        'icon' => 'trophy', 'title' => 'Prestasi Bersama', 'description' => 'Lebih aktif setiap hari.', 'published' => true,
    ])->assertRedirect();
    expect($highlight->fresh()->icon)->toBe('trophy');

    $this->actingAs($admin)->delete('/admin/homepage-highlights/'.$highlight->id)->assertRedirect();
    expect($highlight->fresh())->toBeNull();

    $this->actingAs($admin)->post('/admin/partner-logos', [
        'name' => 'Mitra QA', 'image' => UploadedFile::fake()->image('mitra-qa.png'), 'published' => true,
    ])->assertRedirect();
    $logo = PartnerLogo::where('name', 'Mitra QA')->firstOrFail();
    Storage::disk('public')->assertExists($logo->image);

    $this->actingAs($admin)->delete('/admin/partner-logos/'.$logo->id)->assertRedirect();
    Storage::disk('public')->assertMissing($logo->image);
    expect($logo->fresh())->toBeNull();
});

test('global footer and contact settings are editable by the page editor role', function () {
    $editor = User::factory()->create();
    $editor->assignRole('editor-halaman');

    $this->actingAs($editor)->post('/admin/settings', [
        'site_name' => 'GGM Majalengka',
        'tagline' => 'Bergerak bersama',
        'address' => 'Alamat QA Majalengka',
        'phone' => '+62 812 0000 0000',
        'whatsapp' => '6281200000000',
        'email' => 'qa@ggm.test',
        'instagram' => 'https://instagram.com/ggmmajalengka',
    ])->assertRedirect();

    expect(SiteSetting::value('address'))->toBe('Alamat QA Majalengka')
        ->and(SiteSetting::value('email'))->toBe('qa@ggm.test');
});
