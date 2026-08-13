<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('printer_id')->constrained()->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->foreignId('start_reading_id')->nullable()->constrained('counter_readings');
            $table->foreignId('end_reading_id')->nullable()->constrained('counter_readings');
            $table->bigInteger('total_pages')->default(0);
            $table->bigInteger('mono_pages')->default(0);
            $table->bigInteger('color_pages')->default(0);
            $table->timestamps();

            $table->unique(['printer_id', 'period_start', 'period_end'], 'usages_printer_period_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usages');
    }
};
