<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('post_reports')) {
            return;
        }

        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();
        $database = $connection->getDatabaseName();

        if ($driver === 'mysql') {
            $indexes = DB::select(
                'SELECT INDEX_NAME AS index_name, NON_UNIQUE AS non_unique, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
                 FROM INFORMATION_SCHEMA.STATISTICS
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
                 GROUP BY INDEX_NAME, NON_UNIQUE',
                [$database, 'post_reports']
            );

            foreach ($indexes as $index) {
                $name = (string) ($index->index_name ?? '');
                $columns = strtolower((string) ($index->columns ?? ''));
                $isUnique = (int) ($index->non_unique ?? 1) === 0;

                if ($name === 'PRIMARY') {
                    continue;
                }

                // Remove legacy/incorrect unique indexes on post_id only.
                if ($isUnique && $columns === 'post_id') {
                    Schema::table('post_reports', function (Blueprint $table) use ($name): void {
                        $table->dropUnique($name);
                    });
                }
            }
        }

        // Ensure duplicate prevention is per user per post.
        if (! $this->hasCompositeUniqueIndex()) {
            Schema::table('post_reports', function (Blueprint $table): void {
                $table->unique(['user_id', 'post_id']);
            });
        }
    }

    public function down(): void
    {
        // No destructive rollback for index correction.
    }

    private function hasCompositeUniqueIndex(): bool
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();
        $database = $connection->getDatabaseName();

        if ($driver !== 'mysql') {
            return true;
        }

        $indexes = DB::select(
            'SELECT GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
             FROM INFORMATION_SCHEMA.STATISTICS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND NON_UNIQUE = 0
             GROUP BY INDEX_NAME',
            [$database, 'post_reports']
        );

        foreach ($indexes as $index) {
            if (strtolower((string) ($index->columns ?? '')) === 'user_id,post_id') {
                return true;
            }
        }

        return false;
    }
};
