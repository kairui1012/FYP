<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('profiles', 'avatar')) {
                $table->string('avatar')->nullable()->after('user_id');
            }

            if (! Schema::hasColumn('profiles', 'about')) {
                $table->text('about')->nullable()->after('avatar');
            }
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            if (Schema::hasColumn('profiles', 'about')) {
                $table->dropColumn('about');
            }

            if (Schema::hasColumn('profiles', 'avatar')) {
                $table->dropColumn('avatar');
            }
        });
    }
};
