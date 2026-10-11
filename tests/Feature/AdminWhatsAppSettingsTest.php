<?php

use App\Models\SiteSetting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

function grantWhatsAppSettingsAdmin(User $user): void
{
    $role = Role::findOrCreate('administrator', 'web');
    $permission = Permission::findOrCreate('kelola booking', 'web');
    $user->assignRole($role);
    $user->givePermissionTo($permission);
}

test('administrator can view WhatsApp notification settings', function () {
    $admin = User::factory()->create();
    grantWhatsAppSettingsAdmin($admin);

    SiteSetting::create(['key' => 'whatsapp_admin_paid_booking_enabled', 'value' => '1']);
    SiteSetting::create(['key' => 'whatsapp_admin_phone', 'value' => '6281234567890']);

    $this->actingAs($admin)
        ->get(route('admin.bookings.whatsapp-settings.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/bookings/whatsapp-settings')
            ->where('settings.enabled', true)
            ->where('settings.phone', '6281234567890')
        );
});

test('administrator can update WhatsApp recipient and notification toggle', function () {
    config()->set('services.whatsapp.url', 'https://wa.digitalpelajar.id');
    config()->set('services.whatsapp.api_key', 'test-api-key');
    config()->set('services.whatsapp.sender', '6281111111111');

    $admin = User::factory()->create();
    grantWhatsAppSettingsAdmin($admin);

    $this->actingAs($admin)
        ->put(route('admin.bookings.whatsapp-settings.update'), [
            'enabled' => true,
            'phone' => '+62 812-3456-7890',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(SiteSetting::value('whatsapp_admin_paid_booking_enabled'))->toBe('1')
        ->and(SiteSetting::value('whatsapp_admin_phone'))->toBe('6281234567890');
});

test('WhatsApp settings reject local numbers without a country code', function () {
    config()->set('services.whatsapp.url', 'https://wa.digitalpelajar.id');
    config()->set('services.whatsapp.api_key', 'test-api-key');
    config()->set('services.whatsapp.sender', '6281111111111');

    $admin = User::factory()->create();
    grantWhatsAppSettingsAdmin($admin);

    $this->actingAs($admin)
        ->put(route('admin.bookings.whatsapp-settings.update'), [
            'enabled' => true,
            'phone' => '081234567890',
        ])
        ->assertSessionHasErrors('phone');
});


test('administrator can send a WhatsApp test message to the configured recipient', function () {
    config()->set('services.whatsapp.url', 'https://wa.digitalpelajar.id');
    config()->set('services.whatsapp.api_key', 'test-api-key');
    config()->set('services.whatsapp.sender', '6281111111111');
    Http::fake(['wa.digitalpelajar.id/send-message' => Http::response(['success' => true], 200)]);

    $admin = User::factory()->create();
    grantWhatsAppSettingsAdmin($admin);

    $this->actingAs($admin)
        ->post(route('admin.bookings.whatsapp-settings.test-message'), [
            'phone' => '+62 812-3456-7890',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    Http::assertSent(fn ($request) => $request->url() === 'https://wa.digitalpelajar.id/send-message'
        && $request['number'] === '6281234567890'
        && str_contains($request['message'], 'Pesan uji WhatsApp Sport Center'));
});

test('WhatsApp test message rejects local numbers without country code', function () {
    config()->set('services.whatsapp.url', 'https://wa.digitalpelajar.id');
    config()->set('services.whatsapp.api_key', 'test-api-key');
    config()->set('services.whatsapp.sender', '6281111111111');

    $admin = User::factory()->create();
    grantWhatsAppSettingsAdmin($admin);

    $this->actingAs($admin)
        ->post(route('admin.bookings.whatsapp-settings.test-message'), [
            'phone' => '081234567890',
        ])
        ->assertSessionHasErrors('phone');
});
