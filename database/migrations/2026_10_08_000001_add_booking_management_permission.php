<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        $permission = Permission::firstOrCreate([
            'name' => 'kelola booking',
            'guard_name' => 'web',
        ]);

        $administrator = Role::where([
            'name' => 'administrator',
            'guard_name' => 'web',
        ])->first();

        if ($administrator) {
            $administrator->givePermissionTo($permission);
        }

        $bookingManager = Role::firstOrCreate([
            'name' => 'pengelola-booking',
            'guard_name' => 'web',
        ]);

        $bookingManager->givePermissionTo($permission);
    }

    public function down(): void
    {
        $permission = Permission::where([
            'name' => 'kelola booking',
            'guard_name' => 'web',
        ])->first();

        if (! $permission) {
            return;
        }

        Role::where([
            'name' => 'pengelola-booking',
            'guard_name' => 'web',
        ])->delete();

        $permission->delete();
    }
};
