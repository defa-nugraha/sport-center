<?php

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::emailVerification());
});

test('email verification notice screen can be rendered', function () {
    $user = User::factory()->unverified()->create();

    $response = $this->actingAs($user)->get(route('verification.notice'));

    $response->assertOk();
});

test('registration sends an email verification notification', function () {
    Notification::fake();

    $response = $this->post(route('register'), [
        'name' => 'Test User',
        'email' => 'test-user@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $user = User::where('email', 'test-user@example.com')->firstOrFail();

    Notification::assertSentTo($user, VerifyEmail::class);
    $response->assertRedirect(route('verification.notice'));
});

test('valid signed verification link verifies the email', function () {
    $user = User::factory()->unverified()->create();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())],
    );

    $response = $this->actingAs($user)->get($verificationUrl);

    $response->assertRedirect('/dashboard?verified=1');
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

test('invalid verification signature is rejected', function () {
    $user = User::factory()->unverified()->create();

    $response = $this->actingAs($user)->get(route('verification.verify', [
        'id' => $user->getKey(),
        'hash' => sha1($user->getEmailForVerification()),
    ]));

    $response->assertForbidden();
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('verified administrator is redirected to the admin dashboard', function () {
    Role::findOrCreate('administrator', 'web');
    $user = User::factory()->unverified()->create(['role' => 'admin']);
    $user->assignRole('administrator');

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())],
    );

    $response = $this->actingAs($user)->get($verificationUrl);

    $response->assertRedirect('/admin?verified=1');
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

test('regular users cannot access admin routes after email verification', function () {
    Role::findOrCreate('administrator', 'web');
    Role::findOrCreate('user', 'web');
    $user = User::factory()->create(['role' => 'user']);
    $user->assignRole('user');

    $this->actingAs($user)
        ->get('/admin')
        ->assertForbidden();
});
