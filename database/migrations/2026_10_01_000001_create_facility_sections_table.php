<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facility_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facility_id')->constrained()->cascadeOnDelete();
            $table->string('section_key', 40);
            $table->string('eyebrow')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('button_label')->nullable();
            $table->boolean('enabled')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['facility_id', 'section_key']);
        });

        DB::table('page_sections')
            ->where('eyebrow', 'Meja pengelola langsung')
            ->update(['eyebrow' => null]);
    }

    public function down(): void
    {
        Schema::dropIfExists('facility_sections');

        DB::table('page_sections')
            ->where('page', 'home')
            ->where('section_key', 'booking')
            ->whereNull('eyebrow')
            ->update(['eyebrow' => 'Meja pengelola langsung']);
    }
};
