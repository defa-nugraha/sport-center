<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 32)->default('user')->index();
            });
        }

        // Preserve existing admin and staff access while moving the primary
        // account classification to users.role.
        if (Schema::hasTable('model_has_roles') && Schema::hasTable('roles')) {
            $adminUserIds = DB::table('model_has_roles')
                ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_type', 'App\\Models\\User')
                ->where('roles.guard_name', 'web')
                ->where('roles.name', '!=', 'user')
                ->select('model_has_roles.model_id');

            DB::table('users')->whereIn('id', $adminUserIds)->update(['role' => 'admin']);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropIndex(['role']);
                $table->dropColumn('role');
            });
        }
    }
};
