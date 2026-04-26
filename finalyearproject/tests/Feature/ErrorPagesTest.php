<?php

use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;

test('missing pages render the friendly 404 page', function () {
    config(['app.debug' => false]);

    $response = $this->get('/this-page-does-not-exist');

    $response
        ->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page
            ->component('errors/ErrorPage')
            ->where('status', 404)
            ->has('lang.errors.not_found_title')
            ->has('lang.errors.home_button'));
});

test('server errors render the friendly 500 page without technical details', function () {
    config(['app.debug' => false]);

    Route::middleware('web')->get('/_test/server-error', function () {
        throw new RuntimeException('database password secret stack trace');
    });

    $response = $this->get('/_test/server-error');

    $response
        ->assertStatus(500)
        ->assertDontSee('database password secret stack trace', false)
        ->assertDontSee('RuntimeException', false)
        ->assertInertia(fn (Assert $page) => $page
            ->component('errors/ErrorPage')
            ->where('status', 500)
            ->has('lang.errors.server_error_title')
            ->has('lang.errors.refresh_button'));
});
