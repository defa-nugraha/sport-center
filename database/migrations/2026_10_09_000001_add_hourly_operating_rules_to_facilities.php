<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->time('booking_operating_start')->default('07:00:00')->after('booking_min_hours');
            $table->time('booking_operating_end')->default('22:00:00')->after('booking_operating_start');
            $table->unsignedSmallInteger('booking_buffer_minutes')->default(45)->after('booking_operating_end');
        });
    }

    public function down(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->dropColumn([
                'booking_operating_start',
                'booking_operating_end',
                'booking_buffer_minutes',
            ]);
        });
    }
};
