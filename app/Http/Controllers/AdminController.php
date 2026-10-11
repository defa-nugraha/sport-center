<?php

namespace App\Http\Controllers;

use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\BookingRefund;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Models\Event;
use App\Models\EventGallery;
use App\Models\Facility;
use App\Models\FacilityFeature;
use App\Models\FacilityGallery;
use App\Models\FacilitySection;
use App\Models\HomepageHighlight;
use App\Models\Inquiry;
use App\Models\PageBanner;
use App\Models\PageSection;
use App\Models\PageVisit;
use App\Models\PartnerLogo;
use App\Models\Region;
use App\Models\SiteSetting;
use App\Models\Sport;
use App\Models\SportCategory;
use App\Models\Testimonial;
use App\Models\SportGallery;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Laravel\Fortify\Features;

class AdminController extends Controller
{
    public function dashboard()
    {
        $from = today()->subDays(6);
        $daily = PageVisit::query()
            ->whereDate('visited_on', '>=', $from)
            ->selectRaw('visited_on, count(*) as total')
            ->groupBy('visited_on')
            ->pluck('total', 'visited_on');
        $monthStart = now()->startOfMonth();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'facilities' => Facility::count(),
                'sports' => Sport::count(),
                'events' => Event::where('published', true)->count(),
                'inquiries' => Inquiry::where('status', 'new')->count(),
                'posts' => BlogPost::count(),
                'reviewsPending' => Testimonial::where('status', 'pending')->count(),
                'bookingsTotal' => Booking::count(),
                'bookingsToday' => Booking::whereDate('created_at', today())->count(),
                'bookingsPending' => Booking::where('status', BookingStatus::PENDING_PAYMENT->value)->count(),
                'bookingsConfirmed' => Booking::where('status', BookingStatus::CONFIRMED->value)->count(),
                'paymentsPending' => Payment::where('payment_status', PaymentStatus::PENDING->value)->count(),
                'revenueThisMonth' => (int) Payment::where('payment_status', PaymentStatus::PAID->value)
                    ->whereNotNull('paid_at')->where('paid_at', '>=', $monthStart)->sum('gross_amount'),
                'refundsPending' => BookingRefund::where('status', 'requested')->count(),
            ],
            'recentBookings' => Booking::with(['facility:id,name', 'payment:id,booking_id,payment_status,gross_amount'])
                ->latest()->take(6)->get([
                    'id', 'booking_number', 'customer_name', 'facility_id', 'booking_date',
                    'booking_end_date', 'booking_mode', 'status', 'created_at',
                ]),
            'recentEvents' => Event::with('sport')->latest()->take(5)->get(),
            'visitors' => [
                'totalViews' => PageVisit::count(),
                'todayViews' => PageVisit::whereDate('visited_on', today())->count(),
                'todayUnique' => PageVisit::whereDate('visited_on', today())->distinct('visitor_hash')->count('visitor_hash'),
                'daily' => collect(range(0, 6))->map(function (int $offset) use ($from, $daily) {
                    $date = $from->copy()->addDays($offset);
                    return ['date' => $date->toDateString(), 'label' => $date->translatedFormat('D'), 'total' => (int) ($daily[$date->toDateString()] ?? 0)];
                }),
                'topPages' => PageVisit::query()->selectRaw('path, count(*) as total')->groupBy('path')->orderByDesc('total')->take(5)->get(),
            ],
        ]);
    }

    public function account(Request $request)
    {
        return Inertia::render('admin/account', [
            'canManagePasskeys' => Features::canManagePasskeys(),
            'passkeys' => Features::canManagePasskeys()
                ? $request->user()->passkeys()->select(['id', 'name', 'credential', 'created_at', 'last_used_at'])->latest()->get()->map(fn ($passkey) => [
                    'id' => $passkey->id,
                    'name' => $passkey->name,
                    'authenticator' => $passkey->authenticator,
                    'created_at_diff' => $passkey->created_at->diffForHumans(),
                    'last_used_at_diff' => $passkey->last_used_at?->diffForHumans(),
                ])->values()->all()
                : [],
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]);
    }

    public function updateAccount(ProfileUpdateRequest $request)
    {
        $request->user()->update($request->validated());

        return back()->with('success', 'Profil admin berhasil diperbarui.');
    }

    public function updateAccountPassword(PasswordUpdateRequest $request)
    {
        $request->user()->update(['password' => $request->password]);

        return back()->with('success', 'Kata sandi berhasil diperbarui.');
    }

    public function content()
    {
        return Inertia::render('admin/content', [
            'facilities' => Facility::with(['sports', 'galleries', 'specifications'])->latest()->get(),
            'sports' => Sport::with('galleries')->latest()->get(),
            'events' => Event::with(['sport', 'facility', 'galleries'])->latest()->get(),
            'regions' => Region::orderBy('name')->get(),
            'categories' => SportCategory::orderBy('name')->get(),
            'blogPosts' => BlogPost::with(['category', 'tags', 'author:id,name', 'images'])->latest()->get(),
            'blogCategories' => BlogCategory::withCount('posts')->orderBy('name')->get(),
            'blogTags' => BlogTag::withCount('posts')->orderBy('name')->get(),
        ]);
    }

    public function createFacility()
    {
        return Inertia::render('admin/facility-editor', $this->facilityEditorData());
    }

    public function editFacility(Facility $facility)
    {
        return Inertia::render('admin/facility-editor', $this->facilityEditorData(
            $facility->load(['sports', 'galleries', 'features', 'specifications', 'contentSections'])
        ));
    }

    public function pagesIndex()
    {
        return redirect()->route('admin.pages.section', ['section' => 'sections']);
    }

    public function pages(string $section)
    {
        $labels = [
            'sections' => 'Teks Setiap Bagian',
            'banners' => 'Banner Halaman',
            'highlights' => 'Keunggulan Beranda',
            'partners' => 'Jejak Kebersamaan',
            'settings' => 'Identitas & Footer',
        ];

        abort_unless(array_key_exists($section, $labels), 404);

        return Inertia::render('admin/pages', [
            'pageSection' => $section,
            'sectionLabel' => $labels[$section],
            'pageSections' => $section === 'sections'
                ? PageSection::orderBy('page')->orderBy('sort_order')->get()
                : [],
            'pageBanners' => $section === 'banners'
                ? PageBanner::orderBy('page')->orderBy('sort_order')->get()
                : [],
            'homepageHighlights' => $section === 'highlights'
                ? HomepageHighlight::orderBy('sort_order')->get()
                : [],
            'partnerLogos' => $section === 'partners'
                ? PartnerLogo::orderBy('sort_order')->get()
                : [],
            'settings' => $section === 'settings'
                ? SiteSetting::pluck('value', 'key')
                : [],
        ]);
    }

    public function storeSport(Request $request)
    {
        $data = $this->validateSport($request);
        unset($data['images'], $data['primary_image']);
        $data['slug'] = $this->uniqueSlug(Sport::class, $data['name']);
        $sport = Sport::create($data + ['published' => true]);
        $this->storeGallery($request, $sport, 'image');

        return back()->with('success', 'Olahraga berhasil ditambahkan.');
    }

    public function updateSport(Request $request, Sport $sport)
    {
        $data = $this->validateSport($request);
        unset($data['images'], $data['primary_image']);
        $data['slug'] = $this->uniqueSlug(Sport::class, $data['name'], $sport->id);
        $sport->update($data);
        $this->storeGallery($request, $sport, 'image');

        return back()->with('success', 'Olahraga berhasil diperbarui.');
    }

    public function destroySport(Sport $sport)
    {
        $sport->delete();

        return back()->with('success', 'Olahraga berhasil dihapus.');
    }

    public function storeFacility(Request $request)
    {
        $data = $this->validateFacility($request);
        $sports = $data['sports'] ?? [];
        $specifications = $data['specifications'] ?? [];
        $features = $data['features'] ?? [];
        $sections = $data['sections'] ?? [];
        unset($data['sports'], $data['specifications'], $data['features'], $data['sections'], $data['images'], $data['primary_image']);
        $data['slug'] = $this->uniqueSlug(Facility::class, $data['name']);
        $facility = Facility::create($data + ['published' => true]);
        $facility->sports()->sync($sports);
        $this->syncFacilitySpecifications($facility, $specifications);
        $this->syncFacilityFeatures($request, $facility, $features);
        $this->syncFacilitySections($facility, $sections);
        $this->storeGallery($request, $facility, 'hero_image', 'thumbnail');

        return redirect()->route('admin.facilities.edit', ['facility' => $facility->encrypted_id])->with('success', 'Fasilitas berhasil ditambahkan.');
    }

    public function updateFacility(Request $request, Facility $facility)
    {
        $data = $this->validateFacility($request);
        $sports = $data['sports'] ?? [];
        $specifications = $data['specifications'] ?? [];
        $features = $data['features'] ?? [];
        $sections = $data['sections'] ?? [];
        unset($data['sports'], $data['specifications'], $data['features'], $data['sections'], $data['images'], $data['primary_image']);
        $data['slug'] = $this->uniqueSlug(Facility::class, $data['name'], $facility->id);
        $facility->update($data);
        $facility->sports()->sync($sports);
        if ($request->has('specifications')) {
            $this->syncFacilitySpecifications($facility, $specifications);
        }
        if ($request->has('features')) {
            $this->syncFacilityFeatures($request, $facility, $features);
        }
        if ($request->has('sections')) {
            $this->syncFacilitySections($facility, $sections);
        }
        $this->storeGallery($request, $facility, 'hero_image', 'thumbnail');

        return back()->with('success', 'Fasilitas berhasil diperbarui.');
    }

    public function destroyFacility(Facility $facility)
    {
        $facility->delete();

        return back()->with('success', 'Fasilitas berhasil dihapus.');
    }

    public function storeEvent(Request $request)
    {
        $data = $this->validateEvent($request);
        unset($data['images'], $data['primary_image']);
        $data['slug'] = $this->uniqueSlug(Event::class, $data['title']);
        $event = Event::create($data + ['published' => true]);
        $this->storeGallery($request, $event, 'image');

        return back()->with('success', 'Acara berhasil ditambahkan.');
    }

    public function updateEvent(Request $request, Event $event)
    {
        $data = $this->validateEvent($request);
        unset($data['images'], $data['primary_image']);
        $data['slug'] = $this->uniqueSlug(Event::class, $data['title'], $event->id);
        $event->update($data);
        $this->storeGallery($request, $event, 'image');

        return back()->with('success', 'Acara berhasil diperbarui.');
    }

    public function destroyEvent(Event $event)
    {
        $event->delete();

        return back()->with('success', 'Acara berhasil dihapus.');
    }

    public function destroyFacilityImage(Facility $facility, FacilityGallery $gallery)
    {
        abort_unless($gallery->facility_id === $facility->id, 404);
        $this->deleteGalleryImage($facility, $gallery, 'hero_image', 'thumbnail');

        return back()->with('success', 'Gambar fasilitas berhasil dihapus.');
    }

    public function destroySportImage(Sport $sport, SportGallery $gallery)
    {
        abort_unless($gallery->sport_id === $sport->id, 404);
        $this->deleteGalleryImage($sport, $gallery, 'image');

        return back()->with('success', 'Gambar olahraga berhasil dihapus.');
    }

    public function destroyEventImage(Event $event, EventGallery $gallery)
    {
        abort_unless($gallery->event_id === $event->id, 404);
        $this->deleteGalleryImage($event, $gallery, 'image');

        return back()->with('success', 'Gambar acara berhasil dihapus.');
    }

    public function settings(Request $request)
    {
        $data = $request->validate(['site_name' => ['required', 'max:120'], 'tagline' => ['nullable', 'max:255'], 'address' => ['nullable', 'max:255'], 'phone' => ['nullable', 'max:40'], 'whatsapp' => ['nullable', 'max:40'], 'email' => ['nullable', 'email'], 'instagram' => ['nullable', 'url', 'max:255'], 'facebook' => ['nullable', 'url', 'max:255'], 'youtube' => ['nullable', 'url', 'max:255'], 'tiktok' => ['nullable', 'url', 'max:255']]);
        foreach ($data as $key => $value) {
            SiteSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return back()->with('success', 'Pengaturan berhasil disimpan.');
    }

    public function storePageSection(Request $request)
    {
        PageSection::create($this->validatePageSection($request));

        return back()->with('success', 'Bagian halaman berhasil ditambahkan.');
    }

    public function updatePageSection(Request $request, PageSection $pageSection)
    {
        $pageSection->update($this->validatePageSection($request, $pageSection));

        return back()->with('success', 'Bagian halaman berhasil diperbarui.');
    }

    public function destroyPageSection(PageSection $pageSection)
    {
        $pageSection->delete();

        return back()->with('success', 'Bagian halaman berhasil dihapus.');
    }

    public function storePageBanner(Request $request)
    {
        $data = $this->validatePageBanner($request);
        $data['image'] = $request->file('image')->store('ggm/banners', 'public');
        PageBanner::create($data);

        return back()->with('success', 'Banner berhasil ditambahkan.');
    }

    public function updatePageBanner(Request $request, PageBanner $pageBanner)
    {
        $data = $this->validatePageBanner($request, false);
        if ($request->hasFile('image')) {
            if ($pageBanner->image && ! str_starts_with($pageBanner->image, '/')) {
                Storage::disk('public')->delete($pageBanner->image);
            }
            $data['image'] = $request->file('image')->store('ggm/banners', 'public');
        }
        $pageBanner->update($data);

        return back()->with('success', 'Banner berhasil diperbarui.');
    }

    public function destroyPageBanner(PageBanner $pageBanner)
    {
        if ($pageBanner->image && ! str_starts_with($pageBanner->image, '/')) {
            Storage::disk('public')->delete($pageBanner->image);
        }
        $pageBanner->delete();

        return back()->with('success', 'Banner berhasil dihapus.');
    }

    public function storeHomepageHighlight(Request $request)
    {
        HomepageHighlight::create($this->validateHomepageHighlight($request));

        return back()->with('success', 'Keunggulan beranda berhasil ditambahkan.');
    }

    public function updateHomepageHighlight(Request $request, HomepageHighlight $homepageHighlight)
    {
        $homepageHighlight->update($this->validateHomepageHighlight($request));

        return back()->with('success', 'Keunggulan beranda berhasil diperbarui.');
    }

    public function destroyHomepageHighlight(HomepageHighlight $homepageHighlight)
    {
        $homepageHighlight->delete();

        return back()->with('success', 'Keunggulan beranda berhasil dihapus.');
    }

    public function storePartnerLogo(Request $request)
    {
        $data = $this->validatePartnerLogo($request);
        $data['image'] = $request->file('image')->store('ggm/partners', 'public');
        PartnerLogo::create($data);

        return back()->with('success', 'Logo mitra berhasil ditambahkan.');
    }

    public function updatePartnerLogo(Request $request, PartnerLogo $partnerLogo)
    {
        $data = $this->validatePartnerLogo($request, false);
        if ($request->hasFile('image')) {
            if ($partnerLogo->image && ! str_starts_with($partnerLogo->image, '/')) {
                Storage::disk('public')->delete($partnerLogo->image);
            }
            $data['image'] = $request->file('image')->store('ggm/partners', 'public');
        }
        $partnerLogo->update($data);

        return back()->with('success', 'Logo mitra berhasil diperbarui.');
    }

    public function destroyPartnerLogo(PartnerLogo $partnerLogo)
    {
        if ($partnerLogo->image && ! str_starts_with($partnerLogo->image, '/')) {
            Storage::disk('public')->delete($partnerLogo->image);
        }
        $partnerLogo->delete();

        return back()->with('success', 'Logo mitra berhasil dihapus.');
    }

    private function validateSport(Request $request): array
    {
        return $request->validate(['name' => ['required', 'max:120'], 'description' => ['nullable', 'string'], 'surface' => ['nullable', 'max:120'], 'court_type' => ['nullable', 'max:120'], 'sport_category_id' => ['nullable', 'exists:sport_categories,id'], 'published' => ['nullable', 'boolean'], 'images' => ['nullable', 'array', 'max:12'], 'images.*' => ['image', 'mimes:jpeg,png,webp', 'max:5120'], 'primary_image' => ['nullable', 'integer', 'min:0']]);
    }

    private function validateFacility(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'max:160'],
            'description' => ['nullable', 'string'],
            'subtitle' => ['nullable', 'max:160'],
            'address' => ['nullable', 'max:255'],
            'venue_type' => ['nullable', 'max:120'],
            'capacity' => ['nullable', 'max:120'],
            'operating_hours' => ['nullable', 'max:120'],
            'dimensions' => ['nullable', 'max:120'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'region_id' => ['nullable', 'exists:regions,id'],
            'sports' => ['nullable', 'array'],
            'sports.*' => ['exists:sports,id'],
            'specifications' => ['nullable', 'array', 'max:30'],
            'specifications.*.label' => ['required', 'string', 'max:120'],
            'specifications.*.value' => ['required', 'string', 'max:255'],
            'features' => ['nullable', 'array', 'max:30'],
            'features.*.id' => ['nullable', 'integer', 'exists:facility_features,id'],
            'features.*.name' => ['required', 'string', 'max:160'],
            'features.*.description' => ['nullable', 'string'],
            'features.*.image' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            'features.*.remove_image' => ['nullable', 'boolean'],
            'sections' => ['nullable', 'array'],
            'sections.*.eyebrow' => ['nullable', 'string', 'max:160'],
            'sections.*.title' => ['required', 'string', 'max:255'],
            'sections.*.description' => ['nullable', 'string'],
            'sections.*.button_label' => ['nullable', 'string', 'max:120'],
            'sections.*.enabled' => ['nullable', 'boolean'],
            'published' => ['nullable', 'boolean'],
            'images' => ['nullable', 'array', 'max:12'],
            'images.*' => ['image', 'mimes:jpeg,png,webp', 'max:5120'],
            'primary_image' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    private function syncFacilitySpecifications(Facility $facility, array $specifications): void
    {
        $facility->specifications()->delete();
        $facility->specifications()->createMany(
            collect($specifications)
                ->filter(fn (array $item) => filled($item['label'] ?? null) && filled($item['value'] ?? null))
                ->values()
                ->map(fn (array $item, int $index) => [
                    'label' => $item['label'],
                    'value' => $item['value'],
                    'sort_order' => $index,
                ])->all()
        );
    }

    private function syncFacilityFeatures(Request $request, Facility $facility, array $features): void
    {
        $keptIds = [];

        foreach ($features as $index => $item) {
            $feature = isset($item['id'])
                ? $facility->features()->findOrFail($item['id'])
                : new FacilityFeature(['facility_id' => $facility->id]);
            $feature->fill([
                'name' => $item['name'],
                'description' => $item['description'] ?? null,
                'sort_order' => $index,
            ]);

            if ($request->hasFile("features.$index.image")) {
                if ($feature->image && ! str_starts_with($feature->image, '/')) {
                    Storage::disk('public')->delete($feature->image);
                }
                $feature->image = $request->file("features.$index.image")->store('ggm/features', 'public');
            } elseif (($item['remove_image'] ?? false) && $feature->image) {
                if (! str_starts_with($feature->image, '/')) {
                    Storage::disk('public')->delete($feature->image);
                }
                $feature->image = null;
            }

            $feature->save();
            $keptIds[] = $feature->id;
        }

        $facility->features()->whereNotIn('id', $keptIds)->get()->each(function (FacilityFeature $feature) {
            if ($feature->image && ! str_starts_with($feature->image, '/')) {
                Storage::disk('public')->delete($feature->image);
            }
            $feature->delete();
        });
    }

    private function syncFacilitySections(Facility $facility, array $sections): void
    {
        $allowed = ['overview', 'gallery', 'features', 'sports', 'booking'];

        foreach ($allowed as $index => $key) {
            if (! isset($sections[$key])) {
                continue;
            }
            $section = $sections[$key];
            $facility->contentSections()->updateOrCreate(
                ['section_key' => $key],
                [
                    'eyebrow' => $section['eyebrow'] ?? null,
                    'title' => $section['title'],
                    'description' => $section['description'] ?? null,
                    'button_label' => $section['button_label'] ?? null,
                    'enabled' => (bool) ($section['enabled'] ?? false),
                    'sort_order' => $index,
                ]
            );
        }
    }

    private function facilityEditorData(?Facility $facility = null): array
    {
        return [
            'facility' => $facility,
            'regions' => Region::where('published', true)->orderBy('name')->get(['id', 'name']),
            'sports' => Sport::where('published', true)->orderBy('name')->get(['id', 'name']),
            'sectionDefaults' => PageSection::where('page', 'facility-detail')
                ->orderBy('sort_order')->get()->keyBy('section_key'),
        ];
    }

    private function validateEvent(Request $request): array
    {
        return $request->validate(['title' => ['required', 'max:180'], 'description' => ['nullable', 'string'], 'sport_id' => ['nullable', 'exists:sports,id'], 'facility_id' => ['nullable', 'exists:facilities,id'], 'starts_at' => ['required', 'date'], 'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'], 'status' => ['required', 'in:draft,upcoming,ongoing,completed,cancelled'], 'reminder_enabled' => ['nullable', 'boolean'], 'reminder_days_before' => ['required_if:reminder_enabled,1,true', 'integer', 'min:0', 'max:365'], 'published' => ['nullable', 'boolean'], 'images' => ['nullable', 'array', 'max:12'], 'images.*' => ['image', 'mimes:jpeg,png,webp', 'max:5120'], 'primary_image' => ['nullable', 'integer', 'min:0']]);
    }

    private function validatePageSection(Request $request, ?PageSection $section = null): array
    {
        return $request->validate([
            'page' => ['required', 'in:home,facilities,facility-detail,sports,sport-detail,events,event-detail,blog,blog-detail'],
            'section_key' => ['required', 'alpha_dash', 'max:100', 'unique:page_sections,section_key,'.($section?->id ?? 'NULL').',id,page,'.$request->input('page')],
            'eyebrow' => ['nullable', 'max:160'], 'title' => ['required', 'max:255'],
            'title_accent' => ['nullable', 'max:160'], 'description' => ['nullable', 'string'],
            'button_label' => ['nullable', 'max:120'], 'button_url' => ['nullable', 'max:255'],
            'enabled' => ['nullable', 'boolean'], 'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    private function validateHomepageHighlight(Request $request): array
    {
        return $request->validate(['icon' => ['required', 'in:building,calendar,map-pin,activity,trophy,dumbbell,users,clock'], 'title' => ['required', 'max:120'], 'description' => ['nullable', 'max:180'], 'published' => ['nullable', 'boolean'], 'sort_order' => ['nullable', 'integer', 'min:0']]);
    }

    private function validatePageBanner(Request $request, bool $imageRequired = true): array
    {
        return $request->validate([
            'page' => ['required', 'in:home'],
            'title' => ['required', 'max:160'],
            'image' => [$imageRequired ? 'required' : 'nullable', 'image', 'mimes:jpeg,png,webp', 'max:8192'],
            'alt_text' => ['nullable', 'max:180'],
            'location_label' => ['nullable', 'max:160'],
            'url' => ['nullable', 'max:255'],
            'published' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    private function validatePartnerLogo(Request $request, bool $required = true): array
    {
        return $request->validate(['name' => ['required', 'max:160'], 'image' => [$required ? 'required' : 'nullable', 'image', 'mimes:jpeg,png,webp,svg', 'max:5120'], 'url' => ['nullable', 'url', 'max:255'], 'alt_text' => ['nullable', 'max:180'], 'published' => ['nullable', 'boolean'], 'sort_order' => ['nullable', 'integer', 'min:0']]);
    }

    private function storeGallery(Request $request, Model $model, string $mainColumn, ?string $secondaryColumn = null): void
    {
        $files = $request->file('images', []);
        if (! $files) {
            return;
        }
        $primaryIndex = min((int) $request->input('primary_image', 0), count($files) - 1);
        $primaryPath = null;
        $baseOrder = $model->galleries()->count();
        foreach ($files as $index => $file) {
            $path = $file->store('ggm', 'public');
            $model->galleries()->create(['image' => $path, 'sort_order' => $baseOrder + $index]);
            if ($index === $primaryIndex) {
                $primaryPath = $path;
            }
        }
        if ($primaryPath) {
            $values = [$mainColumn => $primaryPath];
            if ($secondaryColumn) {
                $values[$secondaryColumn] = $primaryPath;
            }
            $model->update($values);
        }
    }

    private function deleteGalleryImage(Model $model, Model $gallery, string $mainColumn, ?string $secondaryColumn = null): void
    {
        $path = $gallery->image;
        $replacement = $model->galleries()->whereKeyNot($gallery->getKey())->orderBy('sort_order')->value('image');
        $gallery->delete();

        if ($model->{$mainColumn} === $path) {
            $values = [$mainColumn => $replacement];
            if ($secondaryColumn) {
                $values[$secondaryColumn] = $replacement;
            }
            $model->update($values);
        }

        if ($path && ! str_starts_with($path, '/')) {
            Storage::disk('public')->delete($path);
        }
    }

    private function uniqueSlug(string $model, string $value, ?int $ignore = null): string
    {
        $base = Str::slug($value) ?: Str::random(8);
        $slug = $base;
        $suffix = 2;
        while ($model::query()->when($ignore, fn ($query) => $query->whereKeyNot($ignore))->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }
}
