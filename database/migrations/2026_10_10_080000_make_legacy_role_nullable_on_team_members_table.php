<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The homepage team-member form does not use the legacy role association.
     * Existing installations may still require this column, preventing new
     * homepage members from being created. Keep existing values intact while
     * allowing the current feature to omit the legacy role.
     */
    public function up(): void
    {
        if (! Schema::hasTable('team_members') || ! Schema::hasColumn('team_members', 'role')) {
            return;
        }

        Schema::table('team_members', function (Blueprint $table) {
            $table->string('role')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Intentionally keep role nullable to avoid invalidating records
        // created by the current homepage team-member feature.
    }
};
