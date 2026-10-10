<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The current homepage team-member feature is not scoped to an application
     * user or a separate team record. Older installations may still have these
     * legacy association columns as NOT NULL, which blocks inserts from the
     * current admin form. Preserve the columns and existing values, but allow
     * new homepage members to omit those legacy associations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('team_members')) {
            return;
        }

        foreach (['team_id', 'user_id'] as $column) {
            if (! Schema::hasColumn('team_members', $column)) {
                continue;
            }

            Schema::table('team_members', function (Blueprint $table) use ($column) {
                $table->unsignedBigInteger($column)->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        // Keep legacy association columns nullable. Reverting to NOT NULL can
        // make records created by the homepage team feature invalid and would
        // risk a failed rollback or data loss.
    }
};
