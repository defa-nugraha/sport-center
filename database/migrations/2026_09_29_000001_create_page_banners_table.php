<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_banners', function (Blueprint $table) {
            $table->id();
            $table->string('page', 60)->default('home')->index();
            $table->string('title');
            $table->string('image');
            $table->string('alt_text')->nullable();
            $table->string('location_label')->nullable();
            $table->string('url')->nullable();
            $table->boolean('published')->default(true)->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_banners');
    }
};
