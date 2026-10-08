<?php

use App\Http\Controllers\AdminBlogController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminTestimonialController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\AdminBookingController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\Teams\TeamInvitationController;
use Illuminate\Support\Facades\Route;

Route::middleware('track.public.visit')->group(function () {
    Route::get('/', [PublicController::class, 'home'])->name('home');
    Route::get('/facilities', [PublicController::class, 'facilities'])->name('facilities.index');
    Route::get('/facilities/{facility:slug}', [PublicController::class, 'facility'])->name('facilities.show');
    Route::get('/sports', [PublicController::class, 'sports'])->name('sports.index');
    Route::get('/sports/{sport:slug}', [PublicController::class, 'sport'])->name('sports.show');
    Route::get('/events', [PublicController::class, 'events'])->name('events.index');
    Route::get('/events/{event:slug}/calendar.ics', [PublicController::class, 'eventCalendar'])->name('events.calendar');
    Route::get('/events/{event:slug}', [PublicController::class, 'event'])->name('events.show');
    Route::get('/kabar', [BlogController::class, 'index'])->name('blog.index');
    Route::get('/kabar/{blogPost:slug}', [BlogController::class, 'show'])->name('blog.show');
});
Route::post('/inquiries', [PublicController::class, 'inquiry'])->name('inquiries.store');
Route::post('/testimonials', [PublicController::class, 'testimonial'])->name('testimonials.store');
Route::get('/booking/{facility:slug}', [BookingController::class, 'create'])->name('booking.create');
Route::get('/booking/{facility:slug}/availability', [BookingController::class, 'availability'])->name('booking.availability');
Route::post('/booking/{facility:slug}', [BookingController::class, 'store'])->middleware('auth')->name('booking.store');
Route::get('/booking/{booking}/status', [BookingController::class, 'show'])->middleware('auth')->name('booking.show');
Route::post('/payments/midtrans/notification', [PaymentController::class, 'notification'])->name('payments.midtrans.notification');
Route::get('/invoices/{invoice:uuid}/pdf', [InvoiceController::class, 'show'])->middleware('signed')->name('invoices.public');

Route::prefix('admin')->name('admin.')->middleware('auth')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/content', [AdminController::class, 'content'])->name('content');
    Route::get('/pages', [AdminController::class, 'pagesIndex'])->middleware('permission:kelola halaman')->name('pages');
    Route::get('/pages/{section}', [AdminController::class, 'pages'])
        ->middleware('permission:kelola halaman')
        ->whereIn('section', ['sections', 'banners', 'highlights', 'partners', 'settings'])
        ->name('pages.section');
    Route::get('/account', [AdminController::class, 'account'])->name('account');
    Route::patch('/account', [AdminController::class, 'updateAccount'])->name('account.update');
    Route::put('/account/password', [AdminController::class, 'updateAccountPassword'])->middleware('throttle:6,1')->name('account.password.update');
    Route::middleware('permission:kelola booking')->group(function () {
        Route::get('/bookings', [AdminBookingController::class, 'index'])->name('bookings.index');
        Route::get('/bookings/{booking}', [AdminBookingController::class, 'show'])->name('bookings.show');
        Route::put('/bookings/facilities/{facility}', [AdminBookingController::class, 'updateFacility'])->name('bookings.facilities.update');
    });
    Route::middleware('permission:kelola fasilitas')->group(function () {
        Route::get('/facilities/create', [AdminController::class, 'createFacility'])->name('facilities.create');
        Route::get('/facilities/{facility}/edit', [AdminController::class, 'editFacility'])->name('facilities.edit');
        Route::post('/facilities', [AdminController::class, 'storeFacility'])->name('facilities.store');
        Route::put('/facilities/{facility}', [AdminController::class, 'updateFacility'])->name('facilities.update');
        Route::delete('/facilities/{facility}', [AdminController::class, 'destroyFacility'])->name('facilities.destroy');
        Route::delete('/facilities/{facility}/images/{gallery}', [AdminController::class, 'destroyFacilityImage'])->name('facilities.images.destroy');
    });
    Route::middleware('permission:kelola olahraga')->group(function () {
        Route::post('/sports', [AdminController::class, 'storeSport'])->name('sports.store');
        Route::put('/sports/{sport}', [AdminController::class, 'updateSport'])->name('sports.update');
        Route::delete('/sports/{sport}', [AdminController::class, 'destroySport'])->name('sports.destroy');
        Route::delete('/sports/{sport}/images/{gallery}', [AdminController::class, 'destroySportImage'])->name('sports.images.destroy');
    });
    Route::middleware('permission:kelola acara')->group(function () {
        Route::post('/events', [AdminController::class, 'storeEvent'])->name('events.store');
        Route::put('/events/{event}', [AdminController::class, 'updateEvent'])->name('events.update');
        Route::delete('/events/{event}', [AdminController::class, 'destroyEvent'])->name('events.destroy');
        Route::delete('/events/{event}/images/{gallery}', [AdminController::class, 'destroyEventImage'])->name('events.images.destroy');
    });
    Route::middleware('permission:kelola ulasan')->group(function () {
        Route::get('/reviews', [AdminTestimonialController::class, 'index'])->name('reviews.index');
        Route::get('/reviews/create', [AdminTestimonialController::class, 'create'])->name('reviews.create');
        Route::get('/reviews/{testimonial}/edit', [AdminTestimonialController::class, 'edit'])->name('reviews.edit');
        Route::post('/reviews', [AdminTestimonialController::class, 'store'])->name('reviews.store');
        Route::put('/reviews/{testimonial}', [AdminTestimonialController::class, 'update'])->name('reviews.update');
        Route::patch('/reviews/{testimonial}/status', [AdminTestimonialController::class, 'moderate'])->name('reviews.moderate');
        Route::delete('/reviews/{testimonial}', [AdminTestimonialController::class, 'destroy'])->name('reviews.destroy');
    });
    Route::post('/settings', [AdminController::class, 'settings'])->middleware('permission:kelola pengaturan|kelola halaman')->name('settings.update');
    Route::middleware('permission:kelola halaman')->group(function () {
        Route::post('/page-sections', [AdminController::class, 'storePageSection'])->name('page-sections.store');
        Route::put('/page-sections/{pageSection}', [AdminController::class, 'updatePageSection'])->name('page-sections.update');
        Route::delete('/page-sections/{pageSection}', [AdminController::class, 'destroyPageSection'])->name('page-sections.destroy');
        Route::post('/page-banners', [AdminController::class, 'storePageBanner'])->name('page-banners.store');
        Route::put('/page-banners/{pageBanner}', [AdminController::class, 'updatePageBanner'])->name('page-banners.update');
        Route::delete('/page-banners/{pageBanner}', [AdminController::class, 'destroyPageBanner'])->name('page-banners.destroy');
        Route::post('/homepage-highlights', [AdminController::class, 'storeHomepageHighlight'])->name('homepage-highlights.store');
        Route::put('/homepage-highlights/{homepageHighlight}', [AdminController::class, 'updateHomepageHighlight'])->name('homepage-highlights.update');
        Route::delete('/homepage-highlights/{homepageHighlight}', [AdminController::class, 'destroyHomepageHighlight'])->name('homepage-highlights.destroy');
        Route::post('/partner-logos', [AdminController::class, 'storePartnerLogo'])->name('partner-logos.store');
        Route::put('/partner-logos/{partnerLogo}', [AdminController::class, 'updatePartnerLogo'])->name('partner-logos.update');
        Route::delete('/partner-logos/{partnerLogo}', [AdminController::class, 'destroyPartnerLogo'])->name('partner-logos.destroy');
    });
    Route::middleware('permission:kelola artikel')->group(function () {
        Route::get('/blog/posts/create', [AdminBlogController::class, 'create'])->name('blog.posts.create');
        Route::get('/blog/posts/{blogPost}/edit', [AdminBlogController::class, 'edit'])->name('blog.posts.edit');
        Route::post('/blog/posts', [AdminBlogController::class, 'storePost'])->name('blog.posts.store');
        Route::put('/blog/posts/{blogPost}', [AdminBlogController::class, 'updatePost'])->name('blog.posts.update');
        Route::delete('/blog/posts/{blogPost}', [AdminBlogController::class, 'destroyPost'])->name('blog.posts.destroy');
        Route::delete('/blog/posts/{blogPost}/images/{image}', [AdminBlogController::class, 'destroyPostImage'])->name('blog.posts.images.destroy');
    });
    Route::middleware('permission:kelola taksonomi artikel')->group(function () {
        Route::post('/blog/categories', [AdminBlogController::class, 'storeCategory'])->name('blog.categories.store');
        Route::put('/blog/categories/{blogCategory}', [AdminBlogController::class, 'updateCategory'])->name('blog.categories.update');
        Route::delete('/blog/categories/{blogCategory}', [AdminBlogController::class, 'destroyCategory'])->name('blog.categories.destroy');
        Route::post('/blog/tags', [AdminBlogController::class, 'storeTag'])->name('blog.tags.store');
        Route::put('/blog/tags/{blogTag}', [AdminBlogController::class, 'updateTag'])->name('blog.tags.update');
        Route::delete('/blog/tags/{blogTag}', [AdminBlogController::class, 'destroyTag'])->name('blog.tags.destroy');
    });
});

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

require __DIR__.'/settings.php';
