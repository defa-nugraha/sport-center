<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Repair legacy team_members tables that were created before photo was added.
     */
    public function up(): void
    {
        if (! Schema::hasTable('team_members') || Schema::hasColumn('team_members', 'photo')) {
            return;
        }

        // Nullable so existing team members without an uploaded photo remain valid.
        Schema::table('team_members', function (Blueprint $table) {
            $table->string('photo')->nullable();
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('team_members') && Schema::hasColumn('team_members', 'photo')) {
            Schema::table('team_members', function (Blueprint $table) {
                $table->dropColumn('photo');
            });
        }
    }
};
