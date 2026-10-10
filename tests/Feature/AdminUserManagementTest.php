<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function accountManagementAdministrator(): User
{
    $admin = User::factory()->create();
    $admin->assignRole(Role::findOrCreate('administrator', 'web'));

    return $admin;
}

test('administrator can create edit suspend reactivate and delete customer accounts', function () {
    $admin = accountManagementAdministrator();

    $this->actingAs($admin)
        ->post('/admin/users', [
            'name' => 'Contoh Pelanggan',
            'email' => 'pelanggan@example.test',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ])
        ->assertRedirect('/admin/users');

    $customer = User::query()->where('email', 'pelanggan@example.test')->firstOrFail();
    expect($customer->hasRole('user'))->toBeTrue()
        ->and($customer->is_suspended)->toBeFalse();

    $this->put('/admin/users/'.$customer->id, [
        'name' => 'Pelanggan Diperbarui',
        'email' => 'pelanggan.baru@example.test',
        'password' => '',
        'password_confirmation' => '',
    ])->assertRedirect('/admin/users');

    $customer->refresh();
    expect($customer->name)->toBe('Pelanggan Diperbarui')
        ->and($customer->email)->toBe('pelanggan.baru@example.test');

    $this->patch('/admin/users/'.$customer->id.'/suspension', [
        'suspended' => true,
        'reason' => 'Pelanggaran ketentuan layanan',
    ])->assertRedirect();

    $customer->refresh();
    expect($customer->is_suspended)->toBeTrue()
        ->and($customer->suspension_reason)->toBe('Pelanggaran ketentuan layanan')
        ->and($customer->suspended_at)->not->toBeNull();

    $this->patch('/admin/users/'.$customer->id.'/suspension', [
        'suspended' => false,
        'reason' => '',
    ])->assertRedirect();

    $customer->refresh();
    expect($customer->is_suspended)->toBeFalse()
        ->and($customer->suspension_reason)->toBeNull()
        ->and($customer->suspended_at)->toBeNull();

    $this->delete('/admin/users/'.$customer->id)->assertRedirect('/admin/users');
    $this->assertDatabaseMissing('users', ['id' => $customer->id]);
});

test('suspended customers cannot authenticate or continue using an existing session', function () {
    $admin = accountManagementAdministrator();
    $customer = User::factory()->create([
        'email' => 'suspended@example.test',
        'password' => 'password',
        'is_suspended' => true,
        'suspended_at' => now(),
        'suspension_reason' => 'Security review',
    ]);

    $this->from('/login')
        ->post('/login', ['email' => $customer->email, 'password' => 'password'])
        ->assertRedirect('/login');

    $this->assertGuest();

    $this->actingAs($customer)
        ->get('/dashboard')
        ->assertRedirect('/login');

    $this->assertGuest();
});

test('non-administrator cannot open user management and protected accounts cannot be edited', function () {
    $customer = User::factory()->create();
    $this->actingAs($customer)->get('/admin/users')->assertForbidden();

    $admin = accountManagementAdministrator();
    $this->actingAs($admin)
        ->get('/admin/users/'.$admin->id.'/edit')
        ->assertForbidden();
});
