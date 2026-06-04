<?php

namespace App\Http\Controllers;

use App\Models\Language;
use App\Models\Post;
use App\Models\Subject;
use App\Services\AchievementService;
use App\Services\MaterialVersionService;
use App\Services\PointsService;
use App\Services\ProgressService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PostCreateController extends Controller
{
    private const POST_TYPES = ['material', 'question', 'quiz'];

    public function __construct(
        private readonly AchievementService $achievementService,
        private readonly MaterialVersionService $materialVersionService,
        private readonly PointsService $pointsService,
        private readonly ProgressService $progressService,
    ) {}

    /**
     * Show create post form with available subjects and existing materials.
     * Checks if user can publish study materials.
     */
    public function create(): Response
    {
        /** @var \App\Models\User $user */
        $user = request()->user();
        $canPublishStudyMaterial = $user->canPublishStudyMaterials();

        return Inertia::render('CreatePostPage', [
            'subjects' => Subject::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'canPublishStudyMaterial' => $canPublishStudyMaterial,
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
        ]);
    }

    /**
     * Create a new post (material, question, or quiz).
     * Validates post type permissions, processes material blocks, quiz questions, and attachments.
     * Awards points and syncs achievements/progress for non-anonymous posts.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'content' => ['nullable', 'string', 'max:2000'],
            'post_type' => ['required', 'string', Rule::in(self::POST_TYPES)],
            'parent_material_id' => [
                'nullable',
                'prohibited_unless:post_type,quiz',
                'integer',
                Rule::exists('posts', 'id')->where(fn ($query) => $query->where('post_type', 'material')),
            ],
            'subject_id' => ['required', 'integer', Rule::exists('subjects', 'id')],
            'language_code' => ['required', 'string', Rule::exists('languages', 'code')],
            'is_anonymous' => ['nullable', 'boolean'],
            'quiz_questions' => ['nullable', 'array', 'min:1', 'required_if:post_type,quiz'],
            'quiz_questions.*.question' => ['required', 'string', 'max:500'],
            'quiz_questions.*.options' => ['required', 'array', 'min:2', 'max:4'],
            'quiz_questions.*.options.*' => ['required', 'string', 'max:255'],
            'quiz_questions.*.answer_index' => ['required', 'integer', 'min:0'],
            'quiz_questions.*.explanation' => ['nullable', 'string', 'max:700'],
            'material_blocks' => ['nullable', 'array', 'required_if:post_type,material', 'min:1'],
            'material_blocks.*.type' => ['required_with:material_blocks', 'string', Rule::in(['text', 'image', 'document', 'video'])],
            'material_blocks.*.text' => ['nullable', 'string', 'max:4000'],
            'material_blocks.*.url' => ['nullable', 'string', 'max:500'],
            'material_blocks.*.file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif,pdf,doc,docx,xls,xlsx,ppt,pptx', 'max:20480'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif,pdf,doc,docx,xls,xlsx,ppt,pptx', 'max:20480'],
            'video_url' => ['nullable', 'string', 'max:500'],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();
        $isStudyMaterial = $validated['post_type'] === 'material';

        if ($isStudyMaterial && ! $user->canPublishStudyMaterials()) {
            throw ValidationException::withMessages([
                'post_type' => 'Only admins and teachers can publish Study Materials.',
            ]);
        }

        if (($validated['post_type'] ?? null) !== 'quiz') {
            $validated['parent_material_id'] = null;
        }

        if ($isStudyMaterial) {
            $validated['parent_material_id'] = null;
            $validated['is_anonymous'] = false;
        } elseif (trim((string) ($validated['content'] ?? '')) === '') {
            throw ValidationException::withMessages([
                'content' => 'Please add content before publishing.',
            ]);
        }

        $quizData = null;
        if (($validated['post_type'] ?? null) === 'quiz') {
            $rawQuestions = $validated['quiz_questions'] ?? [];
            $questions = [];

            foreach ($rawQuestions as $i => $q) {
                $options = array_values(array_map('trim', $q['options'] ?? []));
                $answerIndex = (int) ($q['answer_index'] ?? -1);

                if (count(array_filter($options, fn ($o) => $o !== '')) !== count($options) || ! isset($options[$answerIndex])) {
                    throw ValidationException::withMessages([
                        "quiz_questions.{$i}.answer_index" => 'Each quiz question must have all options filled and a valid correct answer.',
                    ]);
                }

                $questions[] = [
                    'question' => trim((string) ($q['question'] ?? '')),
                    'options' => $options,
                    'answer_index' => $answerIndex,
                    'explanation' => trim((string) ($q['explanation'] ?? '')),
                ];
            }

            $quizData = ['questions' => $questions];
        }

        $subject = Subject::query()->find($validated['subject_id']);

        if (! $subject) {
            throw ValidationException::withMessages([
                'subject_id' => 'The selected subject is invalid.',
            ]);
        }

        $language = Language::query()
            ->where('code', $validated['language_code'])
            ->first();

        if (! $language) {
            throw ValidationException::withMessages([
                'language_code' => 'The selected language is invalid.',
            ]);
        }

        $storedAttachments = [];

        foreach ($request->file('attachments', []) as $file) {
            $storedAttachments[] = $file->store('posts', 'public');
        }

        $materialBlocks = null;
        if ($isStudyMaterial) {
            $materialBlocks = $this->normalizeMaterialBlocks($request, $validated['material_blocks'] ?? []);

            if (count($materialBlocks) === 0) {
                throw ValidationException::withMessages([
                    'material_blocks' => 'Add at least one complete content block.',
                ]);
            }

            $validated['content'] = $this->buildMaterialPlainText($validated['title'], $materialBlocks);
            $storedAttachments = [];
        }

        $isAnonymous = filter_var($validated['is_anonymous'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $post = DB::transaction(function () use ($request, $validated, $language, $storedAttachments, $subject, $quizData, $isAnonymous, $materialBlocks): Post {
            $attributes = [
                'user_id' => $request->user()->id,
                'is_anonymous' => $isAnonymous,
                'title' => $validated['title'],
                'content' => $validated['content'] ?? '',
                'content_blocks' => $materialBlocks,
                'post_type' => $validated['post_type'],
                'quiz_data' => $quizData,
                'subject_id' => $subject->id,
                'language_id' => $language->id,
                'image' => count($storedAttachments) > 0 ? $storedAttachments : null,
                'video_url' => $validated['video_url'] ?? null,
            ];

            if (Schema::hasColumn('posts', 'parent_material_id')) {
                $attributes['parent_material_id'] = $validated['parent_material_id'] ?? null;
            }

            return Post::query()->create($attributes);
        });

        if ($post->post_type === 'material') {
            $this->materialVersionService->createSnapshot($post);
        }

        $this->pointsService->award(
            $user,
            $validated['post_type'] === 'material'
                ? 'resource_uploaded'
                : 'question_asked',
            $post,
        );

        if (! $isAnonymous) {
            $this->achievementService->syncUser($user);
            $this->progressService->recordPostCreated($user, $validated['post_type']);
        }

        return redirect()
            ->route('homePage')
            ->with('success', 'Post created successfully.');
    }

    /**
     * Normalize and validate material blocks from creation request.
     * Processes text, video, image, and document blocks. Handles file uploads.
     */
    private function normalizeMaterialBlocks(Request $request, array $blocks): array
    {
        $normalized = [];

        foreach ($blocks as $index => $block) {
            $type = $block['type'] ?? null;

            if ($type === 'text') {
                $text = trim((string) ($block['text'] ?? ''));

                if ($text !== '') {
                    $normalized[] = [
                        'type' => 'text',
                        'text' => $text,
                    ];
                }

                continue;
            }

            if ($type === 'video') {
                $url = trim((string) ($block['url'] ?? ''));

                if ($url !== '') {
                    $this->validateMaterialVideoUrl($url, $index);

                    $normalized[] = [
                        'type' => 'video',
                        'url' => $url,
                    ];
                }

                continue;
            }

            if (in_array($type, ['image', 'document'], true)) {
                $file = $request->file("material_blocks.{$index}.file");

                if ($file) {
                    $normalized[] = [
                        'type' => $type,
                        'path' => $file->store('posts/materials', 'public'),
                        'name' => $file->getClientOriginalName(),
                        'mime' => $file->getClientMimeType(),
                    ];
                }
            }
        }

        return $normalized;
    }

    /**
     * Extract plain text content from material blocks (title + text blocks + file names + URLs).
     * Used for searchable content storage and indexing.
     */
    private function buildMaterialPlainText(string $title, array $blocks): string
    {
        $parts = [$title];

        foreach ($blocks as $block) {
            if (($block['type'] ?? null) === 'text') {
                $parts[] = (string) ($block['text'] ?? '');
            } elseif (($block['type'] ?? null) === 'video') {
                $parts[] = (string) ($block['url'] ?? '');
            } elseif (isset($block['name'])) {
                $parts[] = (string) $block['name'];
            }
        }

        return collect($parts)
            ->flatten()
            ->filter()
            ->implode("\n\n");
    }

    /**
     * Validate that material block URL is a valid http/https URL.
     * Throws ValidationException if invalid.
     */
    private function validateMaterialVideoUrl(string $url, int|string $index): void
    {
        if ($this->isValidHttpUrl($url)) {
            return;
        }

        throw ValidationException::withMessages([
            "material_blocks.{$index}.url" => 'Enter a valid video URL.',
        ]);
    }

    /**
     * Check if URL is a valid http or https URL.
     */
    private function isValidHttpUrl(string $url): bool
    {
        if (! filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true);
    }
}
