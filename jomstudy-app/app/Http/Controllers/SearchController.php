<?php

namespace App\Http\Controllers;

use App\Services\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(private readonly SearchService $searchService) {}

    /**
     * Search users and posts by query string. Returns top 5 results of each type.
     * Results are sorted by relevance (exact match, prefix match, partial match).
     */
    public function search(Request $request): JsonResponse
    {
        $query = trim($request->get('q', ''));

        return response()->json($this->searchService->search($query));
    }
}
