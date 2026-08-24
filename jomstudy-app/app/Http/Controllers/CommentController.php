<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use App\Services\CommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CommentController extends Controller
{
    public function __construct(private readonly CommentService $commentService) {}

    public function store(Request $request, Post $post)
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'max:1000'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
        ]);
        $content = $this->content($validated, 'posting');
        $parentId = isset($validated['parent_id']) ? (int) $validated['parent_id'] : null;
        $comment = $this->commentService->create($post, $request->user(), $content, $parentId);

        if (! $request->expectsJson()) {
            return back();
        }

        return response()->json([
            'comment' => $this->commentService->serialize($comment, $request->user()->id),
            ...$this->commentService->treePayload($post, $request->user()->id),
        ], 201);
    }

    public function update(Request $request, Comment $comment): JsonResponse
    {
        $this->authorizeOwner($request, $comment);
        $validated = $request->validate(['content' => ['required', 'string', 'max:1000']]);
        $post = $this->commentService->update($comment, $this->content($validated, 'updating'));

        return response()->json($post
            ? $this->commentService->treePayload($post, $request->user()->id)
            : ['comments' => [], 'comments_count' => 0]);
    }

    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        $this->authorizeOwner($request, $comment);
        $post = $this->commentService->delete($comment);

        return response()->json($post
            ? $this->commentService->treePayload($post, $request->user()->id)
            : ['comments' => [], 'comments_count' => 0]);
    }

    private function authorizeOwner(Request $request, Comment $comment): void
    {
        abort_unless((int) $comment->user_id === (int) $request->user()->id, 403);
    }

    private function content(array $validated, string $action): string
    {
        $content = trim((string) ($validated['content'] ?? ''));
        if ($content === '') {
            throw ValidationException::withMessages([
                'content' => "Please write a comment before {$action}.",
            ]);
        }

        return $content;
    }
}
