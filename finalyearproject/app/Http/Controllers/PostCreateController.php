<?php

namespace App\Http\Controllers;

use App\Models\Language;
use App\Models\Lesson;
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
            'lessons' => Lesson::query()
                ->with(['subject:id,name'])
                ->where('is_published', true)
                ->orderBy('subject_id')
                ->orderBy('sequence')
                ->get(['id', 'subject_id', 'title', 'sequence'])
                ->map(fn (Lesson $lesson) => [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'sequence' => (int) $lesson->sequence,
                    'subject_id' => (int) $lesson->subject_id,
                    'subject_name' => $lesson->subject?->name,
                ])
                ->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'content' => ['required', 'string', 'max:2000'],
            'post_type' => ['required', 'string', Rule::in(self::POST_TYPES)],
            'subject_id' => ['required', 'integer', Rule::exists('subjects', 'id')],
            'lesson_id' => ['nullable', 'integer', Rule::exists('lessons', 'id'), 'required_if:post_type,question'],
            'language_code' => ['required', 'string', Rule::exists('languages', 'code')],
            'quiz_options' => ['nullable', 'array', 'size:4', 'required_if:post_type,quiz'],
            'quiz_options.*' => ['required_if:post_type,quiz', 'string', 'max:255'],
            'quiz_answer' => ['nullable', 'integer', 'between:0,3', 'required_if:post_type,quiz'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'mimetypes:image/jpeg,image/png,image/webp,image/gif,application/pdf', 'max:10240'],
        ]);

        $quizData = null;
        if (($validated['post_type'] ?? null) === 'quiz') {
            $options = collect($validated['quiz_options'] ?? [])
                ->map(fn ($option) => trim((string) $option))
                ->all();

            $answerIndex = (int) ($validated['quiz_answer'] ?? -1);

            if (count(array_filter($options, fn ($option) => $option !== '')) !== 4 || ! isset($options[$answerIndex])) {
                throw ValidationException::withMessages([
                    'quiz_options' => 'Please provide four options and a valid answer.',
                ]);
            }

            $quizData = [
                'options' => array_values($options),
                'answer_index' => $answerIndex,
            ];
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

        $selectedLesson = null;

        if (($validated['post_type'] ?? null) === 'question') {
            $selectedLessonId = isset($validated['lesson_id'])
                ? (int) $validated['lesson_id']
                : null;

            $selectedLesson = Lesson::query()
                ->with('subject:id,name')
                ->find($selectedLessonId);

            if (! $selectedLesson) {
                throw ValidationException::withMessages([
                    'lesson_id' => 'Please select a valid lesson for your question.',
                ]);
            }

            if ((int) ($selectedLesson->subject_id ?? 0) !== (int) $subject->id) {
                throw ValidationException::withMessages([
                    'lesson_id' => 'Selected lesson does not belong to the chosen subject.',
                ]);
            }
        }

        $storedAttachments = [];

        foreach ($request->file('attachments', []) as $file) {
            $storedAttachments[] = $file->store('posts', 'public');
        }

        DB::transaction(function () use ($request, $validated, $language, $storedAttachments, $subject, $quizData, $selectedLesson): void {
            $post = Post::query()->create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'content' => $validated['content'],
                'post_type' => $validated['post_type'],
                'quiz_data' => $quizData,
                'subject_id' => $subject->id,
                'lesson_id' => $selectedLesson?->id,
                'language_id' => $language->id,
                'image' => count($storedAttachments) > 0 ? $storedAttachments : null,
            ]);

            if ($post->post_type === 'material') {
                $lesson = Lesson::query()->create([
                    'subject_id' => $subject->id,
                    'source_post_id' => $post->id,
                    'title' => $post->title,
                    'sequence' => ((int) Lesson::query()
                        ->where('subject_id', $subject->id)
                        ->max('sequence')) + 1,
                    'is_published' => true,
                ]);

                $post->update([
                    'lesson_id' => $lesson->id,
                ]);
            }
        });

        /** @var \App\Models\User $user */
        $user = $request->user();
        $this->achievementService->syncUser($user);
        $this->progressService->recordPostCreated($user, $validated['post_type']);

        return redirect()
            ->route('homePage')
            ->with('success', 'Post created successfully.');
    }
}
