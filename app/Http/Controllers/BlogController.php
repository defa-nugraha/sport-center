<?php

namespace App\Http\Controllers;

use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Models\PageSection;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BlogController extends Controller
{
    public function index(Request $request)
    {
        $posts = BlogPost::query()
            ->with(['category', 'tags', 'author:id,name'])
            ->published()
            ->when($request->filled('category'), fn ($query) => $query->whereHas('category', fn ($category) => $category->where('slug', $request->string('category'))))
            ->when($request->filled('tag'), fn ($query) => $query->whereHas('tags', fn ($tag) => $tag->where('slug', $request->string('tag'))))
            ->latest('published_at')
            ->paginate(9)
            ->withQueryString();

        return Inertia::render('public/blog/index', [
            'sections' => PageSection::where('page', 'blog')->where('enabled', true)->get()->keyBy('section_key'),
            'settings' => SiteSetting::pluck('value', 'key'),
            'posts' => $posts,
            'categories' => BlogCategory::withCount(['posts' => fn ($query) => $query->published()])->orderBy('name')->get(),
            'tags' => BlogTag::whereHas('posts', fn ($query) => $query->published())->orderBy('name')->get(),
            'filters' => $request->only('category', 'tag'),
        ]);
    }

    public function show(BlogPost $blogPost)
    {
        abort_unless($blogPost->status === 'published' && $blogPost->published_at?->isPast(), 404);

        return Inertia::render('public/blog/show', [
            'settings' => SiteSetting::pluck('value', 'key'),
            'sections' => PageSection::where('page', 'blog-detail')->where('enabled', true)->get()->keyBy('section_key'),
            'post' => $blogPost->load(['category', 'tags', 'author:id,name', 'images']),
            'relatedPosts' => BlogPost::with('category')
                ->published()
                ->whereKeyNot($blogPost->id)
                ->when($blogPost->blog_category_id, fn ($query) => $query->where('blog_category_id', $blogPost->blog_category_id))
                ->latest('published_at')
                ->take(3)
                ->get(),
        ]);
    }
}
