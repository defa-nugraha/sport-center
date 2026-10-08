<?php

namespace App\Http\Controllers;

use App\Models\Testimonial;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminTestimonialController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'in:all,pending,approved,rejected'],
        ]);

        $query = Testimonial::query()
            ->when($filters['q'] ?? null, fn ($builder, $search) => $builder->where(
                fn ($nested) => $nested->where('name', 'like', "%{$search}%")
                    ->orWhere('organization', 'like', "%{$search}%")
                    ->orWhere('review', 'like', "%{$search}%")
            ))
            ->when(($filters['status'] ?? 'all') !== 'all', fn ($builder) => $builder->where('status', $filters['status']))
            ->orderByRaw("case when status = 'pending' then 0 else 1 end")
            ->latest();

        return Inertia::render('admin/reviews/index', [
            'reviews' => $query->paginate(12)->withQueryString(),
            'filters' => ['q' => $filters['q'] ?? '', 'status' => $filters['status'] ?? 'all'],
            'counts' => [
                'all' => Testimonial::count(),
                'pending' => Testimonial::where('status', 'pending')->count(),
                'approved' => Testimonial::where('status', 'approved')->count(),
                'rejected' => Testimonial::where('status', 'rejected')->count(),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/reviews/editor');
    }

    public function edit(Testimonial $testimonial)
    {
        return Inertia::render('admin/reviews/editor', ['review' => $testimonial]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $data['approved'] = $data['status'] === 'approved';
        $testimonial = Testimonial::create($data);

        return redirect()->route('admin.reviews.edit', ['testimonial' => $testimonial->encrypted_id])->with('success', 'Ulasan berhasil ditambahkan.');
    }

    public function update(Request $request, Testimonial $testimonial)
    {
        $data = $this->validated($request);
        $data['approved'] = $data['status'] === 'approved';
        $testimonial->update($data);

        return back()->with('success', 'Ulasan berhasil diperbarui.');
    }

    public function moderate(Request $request, Testimonial $testimonial)
    {
        $data = $request->validate(['status' => ['required', 'in:pending,approved,rejected']]);
        $testimonial->update([
            'status' => $data['status'],
            'approved' => $data['status'] === 'approved',
        ]);

        return back()->with('success', match ($data['status']) {
            'approved' => 'Ulasan disetujui dan sekarang tampil di halaman publik.',
            'rejected' => 'Ulasan berhasil ditolak.',
            default => 'Ulasan dikembalikan ke status menunggu.',
        });
    }

    public function destroy(Testimonial $testimonial)
    {
        $testimonial->delete();

        return back()->with('success', 'Ulasan berhasil dihapus.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'organization' => ['nullable', 'string', 'max:120'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'review' => ['required', 'string', 'max:1000'],
            'status' => ['required', 'in:pending,approved,rejected'],
        ]);
    }
}
