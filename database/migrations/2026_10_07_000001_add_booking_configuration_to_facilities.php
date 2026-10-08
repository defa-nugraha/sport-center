<?php
use Illuminate\Database\Migrations\Migration;use Illuminate\Database\Schema\Blueprint;use Illuminate\Support\Facades\Schema;
return new class extends Migration{public function up():void{Schema::table('facilities',function(Blueprint $t){$t->boolean('booking_enabled')->default(false)->after('published');$t->unsignedBigInteger('booking_price_per_hour')->nullable()->after('booking_enabled');});}public function down():void{Schema::table('facilities',fn(Blueprint $t)=>$t->dropColumn(['booking_enabled','booking_price_per_hour']));}};
