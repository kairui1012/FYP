<?php

namespace App\Http\Controllers;

use App\Services\BookmarkService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PostBookmarkController extends Controller
{
    public function __construct(private readonly BookmarkService $bookmarkService) {}

    /**
     * Display bookmarked posts or correct/wrong quiz review items.
     */
    public function index(Request $request): Response
    {
        $studyMode = $request->string('study')->toString();

        if ($studyMode === 'completed') {
            $studyMode = 'correct';
        }

        return Inertia::render(
            'studyFolderPage',
            $this->bookmarkService->pageData($request->user(), $studyMode),
        );
    }
}
