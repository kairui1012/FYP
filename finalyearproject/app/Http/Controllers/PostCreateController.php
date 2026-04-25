<?php

namespace App\Http\Controllers;

use App\Models\Language;
use App\Models\Post;
use App\Models\Subject;
use App\Services\AchievementService;
use App\Services\ProgressService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PostCreateController extends Controller
{
    private const POST_TYPES = ['material', 'question', 'quiz'];

    public function __construct(
        private readonly AchievementService $achievementService,
        private readonly ProgressService $progressService,
    ) {
    }

    public function create(): Response
    {
        return Inertia::render('createPostPage', [
            'subjects' => Subject::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'content' => ['required', 'string', 'max:2000'],
            'post_type' => ['required', 'string', Rule::in(self::POST_TYPES)],
            'subject_id' => ['required', 'integer', Rule::exists('subjects', 'id')],
            'language_code' => ['required', 'string', Rule::exists('languages', 'code')],
            'is_anonymous' => ['nullable', 'boolean'],
            'quiz_questions'                    => ['nullable', 'array', 'min:1', 'required_if:post_type,quiz'],
            'quiz_questions.*.question'         => ['required', 'string', 'max:500'],
            'quiz_questions.*.options'          => ['required', 'array', 'min:2', 'max:8'],
            'quiz_questions.*.options.*'        => ['required', 'string', 'max:255'],
            'quiz_questions.*.answer_index'     => ['required', 'integer', 'min:0'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif,pdf,doc,docx,xls,xlsx,ppt,pptx', 'max:10240'],
        ]);

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
                    'question'     => trim((string) ($q['question'] ?? '')),
                    'options'      => $options,
                    'answer_index' => $answerIndex,
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

        $isAnonymous = filter_var($validated['is_anonymous'] ?? false, FILTER_VALIDATE_BOOLEAN);

        DB::transaction(function () use ($request, $validated, $language, $storedAttachments, $subject, $quizData, $isAnonymous): void {
            Post::query()->create([
                'user_id' => $request->user()->id,
                'is_anonymous' => $isAnonymous,
                'title' => $validated['title'],
                'content' => $validated['content'],
                'post_type' => $validated['post_type'],
                'quiz_data' => $quizData,
                'subject_id' => $subject->id,
                'language_id' => $language->id,
                'image' => count($storedAttachments) > 0 ? $storedAttachments : null,
            ]);
        });

        if (! $isAnonymous) {
            /** @var \App\Models\User $user */
            $user = $request->user();
            $this->achievementService->syncUser($user);
            $this->progressService->recordPostCreated($user, $validated['post_type']);
        }

        return redirect()
            ->route('homePage')
            ->with('success', 'Post created successfully.');
    }
}
