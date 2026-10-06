<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_visits', function (Blueprint $table) {
            $table->id();
            $table->string('path', 255)->index();
            $table->string('visitor_hash', 64)->index();
            $table->string('session_hash', 64)->nullable()->index();
            $table->string('referrer', 500)->nullable();
            $table->date('visited_on')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_visits');
    }
};
