<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('permissions') || ! Schema::hasTable('roles') || ! Schema::hasTable('role_has_permissions')) {
            return;
        }

        $now = now();
        DB::table('permissions')->updateOrInsert(
            ['name' => 'kelola halaman', 'guard_name' => 'web'],
            ['updated_at' => $now, 'created_at' => $now],
        );

        $permissionId = DB::table('permissions')
            ->where('name', 'kelola halaman')
            ->where('guard_name', 'web')
            ->value('id');

        DB::table('roles')->updateOrInsert(
            ['name' => 'editor-halaman', 'guard_name' => 'web'],
            ['updated_at' => $now, 'created_at' => $now],
        );

        $roleIds = DB::table('roles')
            ->where('guard_name', 'web')
            ->whereIn('name', ['administrator', 'editor-halaman'])
            ->pluck('id');

        foreach ($roleIds as $roleId) {
            DB::table('role_has_permissions')->insertOrIgnore([
                'permission_id' => $permissionId,
                'role_id' => $roleId,
            ]);
        }

        app('cache')
            ->store(config('permission.cache.store') !== 'default' ? config('permission.cache.store') : null)
            ->forget(config('permission.cache.key'));
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions') || ! Schema::hasTable('roles') || ! Schema::hasTable('role_has_permissions')) {
            return;
        }

        $permissionId = DB::table('permissions')
            ->where('name', 'kelola halaman')
            ->where('guard_name', 'web')
            ->value('id');
        $editorRoleId = DB::table('roles')
            ->where('name', 'editor-halaman')
            ->where('guard_name', 'web')
            ->value('id');

        if ($permissionId && $editorRoleId) {
            DB::table('role_has_permissions')
                ->where('permission_id', $permissionId)
                ->where('role_id', $editorRoleId)
                ->delete();
        }

        if ($editorRoleId && ! DB::table('model_has_roles')->where('role_id', $editorRoleId)->exists()) {
            DB::table('roles')->where('id', $editorRoleId)->delete();
        }

        app('cache')
            ->store(config('permission.cache.store') !== 'default' ? config('permission.cache.store') : null)
            ->forget(config('permission.cache.key'));
    }
};
