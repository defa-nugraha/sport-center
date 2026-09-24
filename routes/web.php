<?php

use App\Http\Controllers\{AdminController, DashboardController, PublicController};
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicController::class, 'home'])->name('home');
Route::get('/facilities', [PublicController::class, 'facilities'])->name('facilities.index');
Route::get('/facilities/{facility:slug}', [PublicController::class, 'facility'])->name('facilities.show');
Route::get('/sports', [PublicController::class, 'sports'])->name('sports.index');
Route::get('/sports/{sport:slug}', [PublicController::class, 'sport'])->name('sports.show');
Route::get('/events', [PublicController::class, 'events'])->name('events.index');
Route::get('/events/{event:slug}', [PublicController::class, 'event'])->name('events.show');
Route::get('/regions', [PublicController::class, 'regions'])->name('regions.index');
Route::get('/regions/{region:slug}', [PublicController::class, 'region'])->name('regions.show');
Route::post('/inquiries', [PublicController::class, 'inquiry'])->name('inquiries.store');
Route::post('/testimonials', [PublicController::class, 'testimonial'])->name('testimonials.store');

Route::prefix('admin')->name('admin.')->middleware('auth')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/content', [AdminController::class, 'content'])->name('content');
    Route::post('/sports', [AdminController::class, 'storeSport'])->name('sports.store');
    Route::put('/sports/{sport}', [AdminController::class, 'updateSport'])->name('sports.update');
    Route::delete('/sports/{sport}', [AdminController::class, 'destroySport'])->name('sports.destroy');
    Route::post('/facilities', [AdminController::class, 'storeFacility'])->name('facilities.store');
    Route::put('/facilities/{facility}', [AdminController::class, 'updateFacility'])->name('facilities.update');
    Route::delete('/facilities/{facility}', [AdminController::class, 'destroyFacility'])->name('facilities.destroy');
    Route::post('/events', [AdminController::class, 'storeEvent'])->name('events.store');
    Route::put('/events/{event}', [AdminController::class, 'updateEvent'])->name('events.update');
    Route::delete('/events/{event}', [AdminController::class, 'destroyEvent'])->name('events.destroy');
    Route::post('/settings', [AdminController::class, 'settings'])->name('settings.update');
});

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');
    });

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

require __DIR__.'/settings.php';
