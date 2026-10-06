<?php

namespace App\Http\Controllers;

use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\BlogPostImage;
use App\Models\BlogTag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminBlogController extends Controller
{
    public function create()
    {
        return $this->editor();
    }

    public function edit(BlogPost $blogPost)
    {
        return $this->editor($blogPost->load(['tags', 'images']));
    }

    public function storePost(Request $request)
    {
        $data = $this->validatePost($request);
        $tags = $data['tags'] ?? [];
        unset($data['tags'], $data['images'], $data['primary_image']);
        $data['user_id'] = $request->user()->id;
        $data['slug'] = $this->uniqueSlug($data['title']);
        $data['featured'] = $request->boolean('featured');
        $data['featured_image'] = $this->storeImage($request, 'featured_image');
        $data['og_image'] = $this->storeImage($request, 'og_image');
        $data['published_at'] = $data['status'] === 'published'
            ? ($data['published_at'] ?? now())
            : null;
        $post = BlogPost::create($data);
        $post->tags()->sync($tags);
        $this->storePostImages($request, $post);

        return back()->with('success', 'Artikel berhasil dibuat.');
    }

    public function updatePost(Request $request, BlogPost $blogPost)
    {
        $data = $this->validatePost($request);
        $tags = $data['tags'] ?? [];
        unset($data['tags'], $data['images'], $data['primary_image']);
        $data['slug'] = $this->uniqueSlug($data['title'], $blogPost->id);
        $data['featured'] = $request->boolean('featured');
        foreach (['featured_image', 'og_image'] as $field) {
            if ($path = $this->storeImage($request, $field)) {
                $this->deleteImage($blogPost->{$field});
                $data[$field] = $path;
            }
        }
        $data['published_at'] = $data['status'] === 'published'
            ? ($data['published_at'] ?? $blogPost->published_at ?? now())
            : null;
        $blogPost->update($data);
        $blogPost->tags()->sync($tags);
        $this->storePostImages($request, $blogPost);

        return back()->with('success', 'Artikel berhasil diperbarui.');
    }

    public function destroyPost(BlogPost $blogPost)
    {
        $blogPost->delete();

        return back()->with('success', 'Artikel berhasil dihapus.');
    }

    public function destroyPostImage(BlogPost $blogPost, BlogPostImage $image)
    {
        abort_unless($image->blog_post_id === $blogPost->id, 404);
        $path = $image->image;
        $replacement = $blogPost->images()->whereKeyNot($image->id)->orderBy('sort_order')->value('image');
        $image->delete();

        if ($blogPost->featured_image === $path) {
            $blogPost->update(['featured_image' => $replacement]);
        }
        if ($path && ! str_starts_with($path, '/')) {
            Storage::disk('public')->delete($path);
        }

        return back()->with('success', 'Gambar artikel berhasil dihapus.');
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:120', 'unique:blog_categories,name'], 'description' => ['nullable', 'string', 'max:1000']]);
        BlogCategory::create($data + ['slug' => $this->uniqueTaxonomySlug(BlogCategory::class, $data['name'])]);

        return back()->with('success', 'Kategori artikel berhasil dibuat.');
    }

    public function updateCategory(Request $request, BlogCategory $blogCategory)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:120', Rule::unique('blog_categories', 'name')->ignore($blogCategory)], 'description' => ['nullable', 'string', 'max:1000']]);
        $blogCategory->update($data + ['slug' => $this->uniqueTaxonomySlug(BlogCategory::class, $data['name'], $blogCategory->id)]);

        return back()->with('success', 'Kategori artikel berhasil diperbarui.');
    }

    public function destroyCategory(BlogCategory $blogCategory)
    {
        $blogCategory->delete();

        return back()->with('success', 'Kategori artikel berhasil dihapus.');
    }

    public function storeTag(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:80', 'unique:blog_tags,name']]);
        BlogTag::create($data + ['slug' => $this->uniqueTaxonomySlug(BlogTag::class, $data['name'])]);

        return back()->with('success', 'Tag artikel berhasil dibuat.');
    }

    public function updateTag(Request $request, BlogTag $blogTag)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:80', Rule::unique('blog_tags', 'name')->ignore($blogTag)]]);
        $blogTag->update($data + ['slug' => $this->uniqueTaxonomySlug(BlogTag::class, $data['name'], $blogTag->id)]);

        return back()->with('success', 'Tag artikel berhasil diperbarui.');
    }

    public function destroyTag(BlogTag $blogTag)
    {
        $blogTag->delete();

        return back()->with('success', 'Tag artikel berhasil dihapus.');
    }

    private function validatePost(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['required', 'string'],
            'blog_category_id' => ['nullable', 'exists:blog_categories,id'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['integer', 'exists:blog_tags,id'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'featured' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'featured_image' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            'seo_title' => ['nullable', 'string', 'max:70'],
            'seo_description' => ['nullable', 'string', 'max:320'],
            'canonical_url' => ['nullable', 'url', 'max:255'],
            'og_image' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            'images' => ['nullable', 'array', 'max:12'],
            'images.*' => ['image', 'mimes:jpeg,png,webp', 'max:5120'],
            'primary_image' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    private function uniqueSlug(string $title, ?int $ignore = null): string
    {
        return $this->uniqueTaxonomySlug(BlogPost::class, $title, $ignore);
    }

    private function uniqueTaxonomySlug(string $model, string $value, ?int $ignore = null): string
    {
        $base = Str::slug($value) ?: Str::random(8);
        $slug = $base;
        $index = 2;
        $query = $model === BlogPost::class ? $model::withTrashed() : $model::query();
        while ((clone $query)->when($ignore, fn ($builder) => $builder->whereKeyNot($ignore))->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$index++;
        }

        return $slug;
    }

    private function storeImage(Request $request, string $field): ?string
    {
        return $request->hasFile($field) ? $request->file($field)->store('blog', 'public') : null;
    }

    private function deleteImage(?string $path): void
    {
        if ($path && ! Str::startsWith($path, ['/assets/', 'http'])) {
            Storage::disk('public')->delete($path);
        }
    }

    private function editor(?BlogPost $post = null)
    {
        return Inertia::render('admin/blog-editor', [
            'post' => $post,
            'categories' => BlogCategory::orderBy('name')->get(),
            'tags' => BlogTag::orderBy('name')->get(),
        ]);
    }

    private function storePostImages(Request $request, BlogPost $post): void
    {
        $files = $request->file('images', []);
        if (! $files) {
            return;
        }
        $primaryIndex = min((int) $request->input('primary_image', 0), count($files) - 1);
        $baseOrder = $post->images()->count();
        foreach ($files as $index => $file) {
            $path = $file->store('blog', 'public');
            $post->images()->create(['image' => $path, 'sort_order' => $baseOrder + $index]);
            if ($index === $primaryIndex) {
                $post->update(['featured_image' => $path]);
            }
        }
    }
}
