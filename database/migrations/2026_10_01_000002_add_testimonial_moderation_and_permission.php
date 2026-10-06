<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('testimonials', function (Blueprint $table) {
            $table->string('status', 20)->default('pending')->after('approved')->index();
        });

        DB::table('testimonials')->where('approved', true)->update(['status' => 'approved']);

        if (Schema::hasTable('permissions') && Schema::hasTable('roles')) {
            DB::table('permissions')->updateOrInsert(
                ['name' => 'kelola ulasan', 'guard_name' => 'web'],
                ['created_at' => now(), 'updated_at' => now()]
            );
            DB::table('roles')->updateOrInsert(
                ['name' => 'pengelola-ulasan', 'guard_name' => 'web'],
                ['created_at' => now(), 'updated_at' => now()]
            );
            $permissionId = DB::table('permissions')->where('name', 'kelola ulasan')->where('guard_name', 'web')->value('id');
            $roleIds = DB::table('roles')->whereIn('name', ['administrator', 'pengelola-ulasan'])->where('guard_name', 'web')->pluck('id');
            foreach ($roleIds as $roleId) {
                DB::table('role_has_permissions')->insertOrIgnore(['permission_id' => $permissionId, 'role_id' => $roleId]);
            }
            app('cache')
                ->store(config('permission.cache.store') !== 'default' ? config('permission.cache.store') : null)
                ->forget(config('permission.cache.key'));
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('role_has_permissions')) {
            $permissionId = DB::table('permissions')->where('name', 'kelola ulasan')->where('guard_name', 'web')->value('id');
            if ($permissionId) {
                DB::table('role_has_permissions')->where('permission_id', $permissionId)->delete();
                DB::table('permissions')->where('id', $permissionId)->delete();
            }
            DB::table('roles')->where('name', 'pengelola-ulasan')->where('guard_name', 'web')->delete();
        }

        Schema::table('testimonials', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn('status');
        });

        app('cache')
            ->store(config('permission.cache.store') !== 'default' ? config('permission.cache.store') : null)
            ->forget(config('permission.cache.key'));
    }
};
