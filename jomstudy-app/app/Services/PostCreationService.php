<?php

namespace App\Services;

use App\Models\Language;
use App\Models\Post;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class PostCreationService
{
    /** @return array{subjects: Collection, learningMaterials: Collection} */
    public function formData(): array
    {
        return [
            'subjects' => Subject::query()->orderBy('name')->get(['id', 'name']),
            'learningMaterials' => Post::query()
                ->where('post_type', 'material')
                ->with(['user:id,name,role', 'subject:id,name'])
                ->latest('updated_at')
                ->get(['id', 'user_id', 'title', 'content', 'content_blocks', 'subject_id', 'updated_at'])
                ->map(fn (Post $post) => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'content' => $post->content,
                    'publisher' => [
                        'name' => $post->user?->name ?? 'Unknown publisher',
                        'role' => $post->user?->role ?? 'teacher',
                    ],
                    'subject' => $post->subject ? [
                        'id' => $post->subject->id,
                        'name' => $post->subject->name,
                    ] : null,
                    'updated_at' => optional($post->updated_at)->toISOString(),
                ])
                ->values(),
        ];
    }

    public function create(
        User $user,
        array $validated,
        ?array $quizData,
        ?array $materialBlocks,
        array $storedAttachments,
        bool $isAnonymous,
    ): Post {
        $subject = Subject::query()->find($validated['subject_id']);

        if (! $subject) {
            throw ValidationException::withMessages([
                'subject_id' => 'The selected subject is invalid.',
            ]);
        }

        $language = Language::query()->where('code', $validated['language_code'])->first();

        if (! $language) {
            throw ValidationException::withMessages([
                'language_code' => 'The selected language is invalid.',
            ]);
        }

        return DB::transaction(function () use ($user, $validated, $language, $storedAttachments, $subject, $quizData, $isAnonymous, $materialBlocks): Post {
            $attributes = [
                'user_id' => $user->id,
                'is_anonymous' => $isAnonymous,
                'title' => $validated['title'],
                'content' => $validated['content'] ?? '',
                'content_blocks' => $materialBlocks,
                'post_type' => $validated['post_type'],
                'quiz_data' => $quizData,
                'subject_id' => $subject->id,
                'language_id' => $language->id,
                'image' => $storedAttachments !== [] ? $storedAttachments : null,
            ];

            if (Schema::hasColumn('posts', 'parent_material_id')) {
                $attributes['parent_material_id'] = $validated['parent_material_id'] ?? null;
            }

            return Post::query()->create($attributes);
        });
    }
}
