<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('counter_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collector_id')->constrained()->cascadeOnDelete();
            $table->foreignId('printer_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('total_pages')->default(0);
            $table->bigInteger('mono_pages')->default(0);
            $table->bigInteger('color_pages')->default(0);
            $table->timestamp('read_at');
            $table->timestamps();

            $table->index(['printer_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('counter_readings');
    }
};
