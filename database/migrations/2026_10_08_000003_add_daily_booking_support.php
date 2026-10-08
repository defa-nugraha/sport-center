<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->string('booking_mode')->default('hourly')->after('booking_enabled');
            $table->unsignedBigInteger('booking_price_per_day')->nullable()->after('booking_price_per_hour');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->string('booking_mode')->default('hourly')->after('facility_id');
            $table->date('booking_end_date')->nullable()->after('booking_date');
            $table->unsignedBigInteger('price_per_day')->nullable()->after('price_per_hour');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['booking_mode', 'booking_end_date', 'price_per_day']);
        });

        Schema::table('facilities', function (Blueprint $table) {
            $table->dropColumn(['booking_mode', 'booking_price_per_day']);
        });
    }
};
