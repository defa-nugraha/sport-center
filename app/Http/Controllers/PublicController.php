<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\Event;
use App\Models\Facility;
use App\Models\HomepageHighlight;
use App\Models\Inquiry;
use App\Models\PageBanner;
use App\Models\PageSection;
use App\Models\PartnerLogo;
use App\Models\Region;
use App\Models\SiteSetting;
use App\Models\Sport;
use App\Models\Testimonial;
use App\Models\TeamMember;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PublicController extends Controller
{
    private function shared(): array
    {
        return ['settings' => SiteSetting::pluck('value', 'key')];
    }

    private function sections(string $page): array
    {
        return PageSection::query()->where('page', $page)->where('enabled', true)
            ->orderBy('sort_order')->get()->keyBy('section_key')->all();
    }

    public function refundPolicy()
    {
        return Inertia::render('public/refund-policy', [
            ...$this->shared(),
            'refundPolicy' => SiteSetting::refundPolicyHtml(),
        ]);
    }

    public function home()
    {
        return Inertia::render('public/home', [...$this->shared(), 'sections' => $this->sections('home'), 'banners' => PageBanner::where('page', 'home')->where('published', true)->orderBy('sort_order')->get(), 'highlights' => HomepageHighlight::where('published', true)->orderBy('sort_order')->get(), 'partnerLogos' => PartnerLogo::where('published', true)->orderBy('sort_order')->get(), 'sports' => Sport::where('published', true)->orderBy('sort_order')->get(), 'facilities' => Facility::with(['region', 'sports'])->where('published', true)->where('featured', true)->orderBy('sort_order')->get(), 'events' => Event::with(['sport', 'facility'])->where('published', true)->where('status', '!=', 'draft')->where('starts_at', '>=', now()->subDay())->orderBy('starts_at')->take(4)->get(), 'regions' => Region::withCount('facilities')->where('published', true)->orderBy('sort_order')->get(), 'testimonials' => Testimonial::where('status', 'approved')->orderByDesc('created_at')->orderByDesc('id')->take(3)->get(), 'teamMembers' => TeamMember::where('published', true)->orderBy('sort_order')->orderBy('id')->get(), 'posts' => BlogPost::with(['category', 'author:id,name'])->published()->latest('published_at')->take(5)->get()]);
    }

    public function facilities(Request $request)
    {
        $query = Facility::with(['region', 'sports'])->where('published', true);
        if ($request->filled('q')) {
            $query->where(fn ($q) => $q->where('name', 'like', '%'.$request->q.'%')->orWhere('venue_type', 'like', '%'.$request->q.'%'));
        } if ($request->filled('region') && $request->region !== 'all') {
            $query->where('region_id', $request->region);
        } if ($request->filled('sport') && $request->sport !== 'all') {
            $query->whereHas('sports', fn ($q) => $q->where('sports.id', $request->sport));
        }

        return Inertia::render('public/facilities', [...$this->shared(), 'sections' => $this->sections('facilities'), 'facilities' => $query->orderBy('sort_order')->paginate(9)->withQueryString(), 'regions' => Region::where('published', true)->get(), 'sports' => Sport::where('published', true)->get(), 'filters' => $request->only('q', 'region', 'sport')]);
    }

    public function facility(Facility $facility)
    {
        abort_unless($facility->published, 404);

        $facility->load(['region', 'sports', 'features', 'specifications', 'galleries', 'contentSections']);
        $sections = collect($this->sections('facility-detail'))
            ->merge($facility->contentSections->keyBy('section_key'))
            ->all();

        return Inertia::render('public/facility', [...$this->shared(), 'sections' => $sections, 'facility' => $facility, 'related' => Facility::where('published', true)->whereKeyNot($facility->id)->take(3)->get()]);
    }

    public function sports()
    {
        return Inertia::render('public/sports', [...$this->shared(), 'sections' => $this->sections('sports'), 'sports' => Sport::with('category')->where('published', true)->orderBy('sort_order')->get()]);
    }

    public function sport(Sport $sport)
    {
        abort_unless($sport->published, 404);

        return Inertia::render('public/sport', [...$this->shared(), 'sections' => $this->sections('sport-detail'), 'sport' => $sport->load(['category', 'galleries', 'facilities.galleries', 'events']), 'otherSports' => Sport::where('published', true)->whereKeyNot($sport->id)->take(6)->get()]);
    }

    public function events(Request $request)
    {
        $query = Event::with(['sport', 'facility'])->where('published', true)->where('status', '!=', 'draft');
        if ($request->filled('sport') && $request->sport !== 'all') {
            $query->where('sport_id', $request->sport);
        } if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return Inertia::render('public/events', [...$this->shared(), 'sections' => $this->sections('events'), 'events' => $query->orderBy('starts_at')->paginate(9)->withQueryString(), 'sports' => Sport::where('published', true)->get(), 'filters' => $request->only('sport', 'status')]);
    }

    public function event(Event $event)
    {
        abort_unless($event->published, 404);

        return Inertia::render('public/event', [...$this->shared(), 'sections' => $this->sections('event-detail'), 'event' => $event->load(['sport', 'facility', 'galleries']), 'moreEvents' => Event::with(['sport', 'facility'])->where('published', true)->whereKeyNot($event->id)->orderBy('starts_at')->take(2)->get()]);
    }

    public function eventCalendar(Event $event)
    {
        abort_unless($event->published && $event->status !== 'draft', 404);
        $event->load('facility');
        $escape = fn (?string $value) => str_replace(['\\', ';', ',', "\r\n", "\n"], ['\\\\', '\\;', '\\,', '\\n', '\\n'], $value ?? '');
        $end = $event->ends_at ?? $event->starts_at->copy()->addHour();
        $lines = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GGM Majalengka//Kalender Acara//ID',
            'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
            'UID:event-'.$event->id.'@ggm-majalengka.id',
            'DTSTAMP:'.now()->utc()->format('Ymd\\THis\\Z'),
            'DTSTART:'.$event->starts_at->utc()->format('Ymd\\THis\\Z'),
            'DTEND:'.$end->utc()->format('Ymd\\THis\\Z'),
            'SUMMARY:'.$escape($event->title),
            'DESCRIPTION:'.$escape(strip_tags($event->description)),
            'LOCATION:'.$escape($event->facility?->address ?? $event->facility?->name),
            'URL:'.route('events.show', ['event' => $event->slug]),
        ];
        if ($event->reminder_enabled) {
            array_push($lines, 'BEGIN:VALARM', 'TRIGGER:-P'.$event->reminder_days_before.'D', 'ACTION:DISPLAY', 'DESCRIPTION:Pengingat '.$escape($event->title), 'END:VALARM');
        }
        array_push($lines, 'END:VEVENT', 'END:VCALENDAR');

        return response(implode("\r\n", $lines)."\r\n", 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="'.Str::slug($event->title).'.ics"',
        ]);
    }

    public function inquiry(Request $request)
    {
        $data = $request->validate(['facility_id' => ['nullable', 'exists:facilities,id'], 'name' => ['required', 'string', 'max:120'], 'email' => ['nullable', 'email'], 'phone' => ['nullable', 'string', 'max:40'], 'message' => ['required', 'string', 'max:2000']]);
        Inquiry::create($data);

        return back()->with('success', 'Pesan Anda telah diterima.');
    }

    public function testimonial(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:120'], 'organization' => ['nullable', 'string', 'max:120'], 'rating' => ['required', 'integer', 'between:1,5'], 'review' => ['required', 'string', 'max:1000']]);
        Testimonial::create($data + ['status' => 'pending', 'approved' => false]);

        return back()->with('success', 'Terima kasih. Ulasan menunggu moderasi.');
    }
}
