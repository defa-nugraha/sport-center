<?php
use Illuminate\Database\Migrations\Migration;use Illuminate\Database\Schema\Blueprint;use Illuminate\Support\Facades\Schema;
return new class extends Migration{public function up():void{Schema::table('invoices',function(Blueprint $t){$t->timestamp('email_sent_at')->nullable();$t->timestamp('whatsapp_sent_at')->nullable();});}public function down():void{Schema::table('invoices',fn(Blueprint $t)=>$t->dropColumn(['email_sent_at','whatsapp_sent_at']));}};
