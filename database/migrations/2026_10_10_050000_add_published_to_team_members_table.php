<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Repair legacy team_members tables that are missing the publication flag.
     */
    public function up(): void
    {
        if (! Schema::hasTable('team_members') || Schema::hasColumn('team_members', 'published')) {
            return;
        }

        // Keep existing team members visible by default after schema repair.
        Schema::table('team_members', function (Blueprint $table) {
            $table->boolean('published')->default(true);
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('team_members') && Schema::hasColumn('team_members', 'published')) {
            Schema::table('team_members', function (Blueprint $table) {
                $table->dropColumn('published');
            });
        }
    }
};
