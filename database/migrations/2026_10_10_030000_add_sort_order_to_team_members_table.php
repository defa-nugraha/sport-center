<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Repair legacy team_members tables that are missing the ordering column.
     */
    public function up(): void
    {
        if (! Schema::hasTable('team_members') || Schema::hasColumn('team_members', 'sort_order')) {
            return;
        }

        Schema::table('team_members', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0);
        });

        // Preserve the current visible order for existing records and append new
        // members after them when the controller calculates the next sort_order.
        if (Schema::hasColumn('team_members', 'id')) {
            $ids = DB::table('team_members')->orderBy('id')->pluck('id');
            foreach ($ids as $index => $id) {
                DB::table('team_members')
                    ->where('id', $id)
                    ->update(['sort_order' => $index]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('team_members') && Schema::hasColumn('team_members', 'sort_order')) {
            Schema::table('team_members', function (Blueprint $table) {
                $table->dropColumn('sort_order');
            });
        }
    }
};
