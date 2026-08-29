<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('db:prepare-supabase', function () {
    if (DB::connection()->getDriverName() !== 'pgsql') {
        $this->error('The active database connection is not PostgreSQL.');

        return 1;
    }

    $schema = (string) config('database.connections.pgsql.search_path', 'laravel');

    if (! preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $schema)) {
        $this->error('DB_SCHEMA must be a valid PostgreSQL schema name.');

        return 1;
    }

    DB::statement(sprintf('CREATE SCHEMA IF NOT EXISTS "%s"', $schema));
    $this->info("PostgreSQL schema [{$schema}] is ready.");

    return 0;
})->purpose('Create the PostgreSQL schema used by the Supabase connection');
