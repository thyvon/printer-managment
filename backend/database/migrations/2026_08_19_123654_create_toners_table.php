<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('toners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete()->after('id');
            $table->index('company_id');
            $table->string('name'); // e.g., "TN-348 Black Toner"
            $table->string('part_number')->nullable(); // manufacturer part number
            $table->string('color')->nullable(); // black, cyan, magenta, yellow
            $table->string('printer_models')->nullable(); // comma-separated list of compatible printer models
            $table->integer('current_stock')->default(0);
            $table->integer('low_stock_threshold')->default(5);
            $table->string('unit')->default('pcs'); // pcs, boxes, etc.
            $table->decimal('unit_cost', 12, 2)->nullable();
            $table->string('supplier')->nullable();
            $table->string('supplier_part_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('toners');
    }
};
