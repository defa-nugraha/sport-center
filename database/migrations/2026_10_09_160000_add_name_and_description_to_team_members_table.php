<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Repair legacy team_members tables that existed before the current
     * team-member migration was able to create all expected columns.
     */
    public function up(): void
    {
        if (! Schema::hasTable('team_members')) {
            return;
        }

        if (! Schema::hasColumn('team_members', 'name')) {
            Schema::table('team_members', function (Blueprint $table) {
                $table->string('name', 120)->nullable();
            });
        }

        if (! Schema::hasColumn('team_members', 'description')) {
            Schema::table('team_members', function (Blueprint $table) {
                $table->string('description', 180)->nullable();
            });
        }

        if (Schema::hasColumn('team_members', 'id') && Schema::hasColumn('team_members', 'name')) {
            DB::table('team_members')
                ->whereNull('name')
                ->orWhere('name', '')
                ->orderBy('id')
                ->get(['id'])
                ->each(function ($member) {
                    DB::table('team_members')
                        ->where('id', $member->id)
                        ->update(['name' => 'Anggota Tim '.$member->id]);
                });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('team_members')) {
            return;
        }

        $columns = [];
        if (Schema::hasColumn('team_members', 'description')) {
            $columns[] = 'description';
        }
        if (Schema::hasColumn('team_members', 'name')) {
            $columns[] = 'name';
        }

        if ($columns !== []) {
            Schema::table('team_members', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }
};
