<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Older installations may have a required team_id column that the current
     * homepage team-member feature does not use. Make it optional without
     * removing the column or disturbing existing relationships/data.
     */
    public function up(): void
    {
        if (! Schema::hasTable('team_members') || ! Schema::hasColumn('team_members', 'team_id')) {
            return;
        }

        Schema::table('team_members', function (Blueprint $table) {
            $table->unsignedBigInteger('team_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Intentionally do not restore NOT NULL: rows created by the current
        // feature can have no team_id, so reversing this could break rollback.
    }
};
