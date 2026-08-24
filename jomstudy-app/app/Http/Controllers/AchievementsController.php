<?php

namespace App\Http\Controllers;

use App\Services\AchievementService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AchievementsController extends Controller
{
    public function __construct(private readonly AchievementService $achievementService) {}

    /**
     * Display the user's achievements, badges, summary and progress.
     */
    public function index(Request $request): Response
    {
        return Inertia::render(
            'achievementsPage',
            $this->achievementService->pageData($request->user()),
        );
    }
}
