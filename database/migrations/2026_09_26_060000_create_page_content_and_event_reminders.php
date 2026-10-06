<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->boolean('reminder_enabled')->default(true)->after('status');
            $table->unsignedSmallInteger('reminder_days_before')->default(1)->after('reminder_enabled');
        });

        Schema::create('page_sections', function (Blueprint $table) {
            $table->id();
            $table->string('page', 60)->index();
            $table->string('section_key', 100);
            $table->string('eyebrow')->nullable();
            $table->string('title');
            $table->string('title_accent')->nullable();
            $table->text('description')->nullable();
            $table->string('button_label')->nullable();
            $table->string('button_url')->nullable();
            $table->boolean('enabled')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['page', 'section_key']);
        });

        Schema::create('homepage_highlights', function (Blueprint $table) {
            $table->id();
            $table->string('icon', 60)->default('activity');
            $table->string('title');
            $table->string('description')->nullable();
            $table->boolean('published')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('partner_logos', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('image');
            $table->string('url')->nullable();
            $table->string('alt_text')->nullable();
            $table->boolean('published')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_logos');
        Schema::dropIfExists('homepage_highlights');
        Schema::dropIfExists('page_sections');
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['reminder_enabled', 'reminder_days_before']);
        });
    }
};
