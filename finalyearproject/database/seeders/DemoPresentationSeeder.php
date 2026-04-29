<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\Like;
use App\Models\Post;
use App\Models\PostSave;
use App\Models\QuizMistake;
use App\Models\SocialAccount;
use App\Models\StudyMaterialFeedback;
use App\Models\Subject;
use App\Models\User;
use App\Models\UserProgress;
use App\Services\AchievementService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoPresentationSeeder extends Seeder
{
    public function run(): void
    {
        $languageIds = DB::table('languages')->pluck('id', 'code');
        $subjectIds = Subject::query()->pluck('id', 'name');

        $englishId = (int) $languageIds->get('en');
        $chineseId = (int) $languageIds->get('zh', $englishId);
        $malayId = (int) $languageIds->get('bm', $englishId);

        $mathId = (int) $subjectIds->get('Mathematics');
        $chineseSubjectId = (int) $subjectIds->get('Chinese', $mathId);
        $malaySubjectId = (int) $subjectIds->get('Malay', $mathId);

        $teacher = $this->upsertUser('teacher.demo@example.com', 'Ms Nur Aisyah', 'teacher');
        $student = $this->upsertUser('student.demo@example.com', 'Adam Lee', 'student');

        $reviewers = collect([
            ['email' => 'student.a@example.com', 'name' => 'Aina Tan'],
            ['email' => 'student.b@example.com', 'name' => 'Brandon Lim'],
            ['email' => 'student.c@example.com', 'name' => 'Chloe Wong'],
            ['email' => 'student.d@example.com', 'name' => 'Daniel Ng'],
            ['email' => 'student.e@example.com', 'name' => 'Eva Chan'],
            ['email' => 'student.f@example.com', 'name' => 'Farah Ismail'],
            ['email' => 'student.g@example.com', 'name' => 'Gavin Teo'],
            ['email' => 'student.h@example.com', 'name' => 'Hui Min'],
            ['email' => 'student.i@example.com', 'name' => 'Irfan Hakim'],
            ['email' => 'student.j@example.com', 'name' => 'Jasmine Low'],
            ['email' => 'student.k@example.com', 'name' => 'Kai Wen'],
            ['email' => 'student.l@example.com', 'name' => 'Liyana Omar'],
        ])->map(fn (array $reviewer) => $this->upsertUser($reviewer['email'], $reviewer['name'], 'student'));

        $allDemoUsers = collect([$teacher, $student])
            ->merge($reviewers)
            ->values();

        $this->resetDemoData($allDemoUsers);

        $materials = [
            'vertex' => $this->createMaterial(
                $teacher,
                $mathId,
                $englishId,
                'Quadratic Functions: Vertex Form and Axis of Symmetry',
                [
                    'This note explains how to read the vertex from y = a(x - h)^2 + k and how to identify the axis of symmetry quickly.',
                    'Students can use the sign of a to decide whether the parabola opens upwards or downwards before sketching the graph.',
                    'A quick checking habit is to substitute the x-coordinate of the vertex into the equation and confirm the y-value.',
                ],
                true,
                now()->subDays(18),
            ),
            'factorisation' => $this->createMaterial(
                $teacher,
                $mathId,
                $englishId,
                'Quadratic Functions: Solving by Factorisation',
                [
                    'This material focuses on splitting the middle term, grouping, and checking each factor carefully.',
                    'Students are reminded to rewrite the equation in the form ax^2 + bx + c = 0 before factorising.',
                    'The worked examples currently cover easy and medium questions, but more step-by-step hard examples are still needed.',
                ],
                true,
                now()->subDays(16),
            ),
            'graphs' => $this->createMaterial(
                $teacher,
                $mathId,
                $englishId,
                'Quadratic Functions: Sketching Graphs from Key Features',
                [
                    'This note combines intercepts, vertex, and axis of symmetry so students can sketch a reasonable graph even without plotting many points.',
                    'When a quadratic cannot be factorised easily, the vertex and direction of opening still give a strong sketch.',
                    'The final section compares two similar graphs to show how a small change in the equation affects the shape.',
                ],
                false,
                now()->subDays(12),
            ),
        ];

        $quizzes = [
            'vertex' => $this->createQuiz(
                $teacher,
                $mathId,
                $englishId,
                $materials['vertex']->id,
                'Quadratic Vertex Form Check',
                [
                    [
                        'question' => 'For y = (x - 3)^2 - 4, what is the vertex?',
                        'options' => ['(3, -4)', '(-3, -4)', '(3, 4)', '(-3, 4)'],
                        'answer_index' => 0,
                        'explanation' => 'In vertex form y = a(x - h)^2 + k, the vertex is (h, k).',
                    ],
                    [
                        'question' => 'What is the axis of symmetry for y = 2(x + 1)^2 + 5?',
                        'options' => ['x = -1', 'x = 1', 'y = -1', 'y = 5'],
                        'answer_index' => 0,
                        'explanation' => 'The axis of symmetry is x = h, so here x = -1.',
                    ],
                    [
                        'question' => 'If a is negative in a quadratic function, the parabola opens:',
                        'options' => ['upwards', 'downwards', 'left', 'right'],
                        'answer_index' => 1,
                        'explanation' => 'A negative leading coefficient makes the graph open downwards.',
                    ],
                ],
                now()->subDays(17),
            ),
            'factorisation' => $this->createQuiz(
                $teacher,
                $mathId,
                $englishId,
                $materials['factorisation']->id,
                'Factorisation Practice Quiz',
                [
                    [
                        'question' => 'Solve x^2 - 5x + 6 = 0.',
                        'options' => ['x = 2 or x = 3', 'x = -2 or x = -3', 'x = 1 or x = 6', 'x = -1 or x = -6'],
                        'answer_index' => 0,
                        'explanation' => '(x - 2)(x - 3) = 0, so x = 2 or x = 3.',
                    ],
                    [
                        'question' => 'What is the first step before factorising 2x^2 + 7x + 3 = 5?',
                        'options' => ['Divide everything by x', 'Move all terms to one side', 'Take square root directly', 'Substitute x = 0'],
                        'answer_index' => 1,
                        'explanation' => 'Factorisation requires the equation to be rewritten in standard form equal to zero.',
                    ],
                    [
                        'question' => 'Which pair multiplies to +6 and adds to +5?',
                        'options' => ['1 and 6', '2 and 3', '-2 and -3', '-1 and -6'],
                        'answer_index' => 1,
                        'explanation' => '2 x 3 = 6 and 2 + 3 = 5.',
                    ],
                ],
                now()->subDays(15),
            ),
            'graphs' => $this->createQuiz(
                $teacher,
                $mathId,
                $englishId,
                $materials['graphs']->id,
                'Quadratic Graph Sketch Quiz',
                [
                    [
                        'question' => 'Which feature tells you where the graph crosses the y-axis?',
                        'options' => ['the constant term', 'the discriminant', 'the x-coordinate of the vertex', 'the coefficient of x^2 only'],
                        'answer_index' => 0,
                        'explanation' => 'When x = 0, the value of y is the constant term.',
                    ],
                    [
                        'question' => 'If a quadratic has no real roots, the graph:',
                        'options' => ['never touches the x-axis', 'must pass through the origin', 'is a straight line', 'has no vertex'],
                        'answer_index' => 0,
                        'explanation' => 'No real roots means there are no x-intercepts.',
                    ],
                    [
                        'question' => 'Which two features are enough to sketch the basic shape of a parabola quickly?',
                        'options' => ['vertex and direction of opening', 'gradient and intercept', 'two gradients', 'area and perimeter'],
                        'answer_index' => 0,
                        'explanation' => 'The vertex and the sign of a already give the main shape and position.',
                    ],
                ],
                now()->subDays(11),
            ),
        ];

        $questionPosts = collect([
            [
                'title' => 'Primary Mathematics: Why do we carry 1 when adding?',
                'content' => 'In 58 + 27, I know the answer is 85, but why does the 10 from the ones column move to the tens column?',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDays(14),
            ],
            [
                'title' => '小学华文：怎样分辨比喻句和拟人句？',
                'content' => '“月亮像小船”和“风儿在唱歌”有什么不同？考试时我应该先看哪些词？',
                'subject_id' => $chineseSubjectId,
                'language_id' => $chineseId,
                'created_at' => now()->subDays(13),
            ],
            [
                'title' => 'Bahasa Melayu Sekolah Rendah: Bagaimana bezakan imbuhan meN- dan ber-?',
                'content' => 'Saya keliru apabila kata kerja berubah bentuk. Adakah ada cara mudah untuk memilih imbuhan yang betul?',
                'subject_id' => $malaySubjectId,
                'language_id' => $malayId,
                'created_at' => now()->subDays(12),
            ],
            [
                'title' => 'Lower Secondary Mathematics: Why does a negative times a negative become positive?',
                'content' => 'I can remember the rule, but I do not understand the reason behind it when simplifying expressions.',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDays(11),
            ],
            [
                'title' => '初中华文：议论文怎样写出清楚的论点？',
                'content' => '我常常有例子，但开头的论点写得不够明确。有没有一个简单的句型可以练习？',
                'subject_id' => $chineseSubjectId,
                'language_id' => $chineseId,
                'created_at' => now()->subDays(10),
            ],
            [
                'title' => 'Bahasa Melayu Menengah Rendah: Cara mengenal pasti ayat majmuk',
                'content' => 'Apabila ada kata hubung seperti dan, tetapi, atau kerana, adakah ayat itu sentiasa ayat majmuk?',
                'subject_id' => $malaySubjectId,
                'language_id' => $malayId,
                'created_at' => now()->subDays(10),
            ],
            [
                'title' => 'Secondary Mathematics: How do I know when a quadratic is already in vertex form?',
                'content' => 'I can identify the vertex sometimes, but I still get confused when the bracket has a plus sign.',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDays(9),
            ],
            [
                'title' => '中学华文：说明文和议论文的结构有什么不同？',
                'content' => '我会把资料写出来，但不确定什么时候应该解释现象，什么时候应该提出立场。',
                'subject_id' => $chineseSubjectId,
                'language_id' => $chineseId,
                'created_at' => now()->subDays(9),
            ],
            [
                'title' => 'Bahasa Melayu Menengah Atas: Bagaimana huraikan isi karangan dengan matang?',
                'content' => 'Saya ada isi utama, tetapi huraian saya terlalu pendek. Bagaimana tambah contoh dan kesan dengan lebih jelas?',
                'subject_id' => $malaySubjectId,
                'language_id' => $malayId,
                'created_at' => now()->subDays(8),
            ],
            [
                'title' => 'Secondary Mathematics: Why must we move everything to one side before factorising?',
                'content' => 'I understand the algebra steps, but I want to explain the reason properly during revision.',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDays(8),
            ],
            [
                'title' => 'Secondary Mathematics: How can I sketch a quadratic faster in exam conditions?',
                'content' => 'I spend too long plotting points. Is vertex plus intercept enough for a reasonable sketch?',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDays(7),
            ],
            [
                'title' => 'Secondary Mathematics: I keep mixing up axis of symmetry and turning point',
                'content' => 'Can someone give me a simple trick to remember the difference between them?',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDays(6),
            ],
            [
                'title' => 'Secondary Mathematics: How do I choose the correct pair when factorising?',
                'content' => 'The multiply and add method makes sense, but I still choose the wrong pair under pressure.',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDays(5),
            ],
        ])->map(function (array $post) use ($student) {
            return $this->createQuestion(
                $student,
                $post['subject_id'],
                $post['language_id'],
                $post['title'],
                $post['content'],
                $post['created_at'],
            );
        });

        $studentReflection = $this->createQuestion(
            $student,
            $mathId,
            $englishId,
            'Secondary Mathematics: What should I practise after learning vertex form?',
            'I can identify the vertex now, but I still need more guided practice for factorisation questions. Which topic should I review next?',
            now()->subDays(4),
        );

        $likedStudentPosts = $questionPosts->take(3)->push($studentReflection);
        foreach ($reviewers as $reviewer) {
            foreach ($likedStudentPosts as $post) {
                Like::query()->create([
                    'user_id' => $reviewer->id,
                    'post_id' => $post->id,
                    'created_at' => now()->subDays(3),
                    'updated_at' => now()->subDays(3),
                ]);
            }
        }

        $commentTargets = [
            $materials['vertex'],
            $materials['factorisation'],
            $materials['graphs'],
            $quizzes['vertex'],
            $quizzes['factorisation'],
            $quizzes['graphs'],
            ...$questionPosts->take(8)->all(),
            $studentReflection,
        ];

        $commentTexts = [
            'The vertex form summary helped me identify h and k much faster.',
            'I finally understood why the axis of symmetry is linked to the vertex.',
            'The factorisation example was useful, but the hard question still needs one more worked step.',
            'The quiz explanation made it easier to check why my answer was wrong.',
            'I like the graph sketch checklist because it is easy to revise before a test.',
            'The comparison between two similar graphs was helpful for avoiding careless mistakes.',
            'I used the notes again today and the structure is easy to follow.',
            'The factorisation section is the one I still revisit the most.',
            'The sketching guide is concise and feels exam-focused.',
            'The examples are useful because they show the common mistakes clearly.',
            'I think one more non-factorisable graph example would help weaker students.',
            'The linked quizzes make the materials easier to revise independently.',
        ];

        $rootComments = collect();

        foreach ($commentTexts as $index => $text) {
            $target = $commentTargets[$index % count($commentTargets)];

            $rootComments->push(Comment::query()->create([
                'user_id' => $student->id,
                'post_id' => $target->id,
                'parent_id' => null,
                'content' => $text,
                'attachments' => null,
                'mentions' => null,
                'created_at' => now()->subDays(4 - min(3, $index % 4)),
                'updated_at' => now()->subDays(4 - min(3, $index % 4)),
            ]));
        }

        $replyTexts = [
            'I agree with this point. The worked steps are very practical.',
            'Thanks for sharing this. I used the same method in revision.',
            'This was helpful for me too, especially before quiz practice.',
            'Maybe we can add one more challenge example for stronger students.',
            'The summary is clear and easy to remember before exams.',
            'Good point. I had the same confusion last week.',
            'The linked quiz feedback helped me fix my mistakes quickly.',
            'I think this should be pinned for our next study session.',
        ];

        foreach ($rootComments as $index => $rootComment) {
            $firstReplyUser = $reviewers[$index % $reviewers->count()];
            $secondReplyUser = $reviewers[($index + 3) % $reviewers->count()];
            $replyCreatedAt = now()->subDays(max(1, 3 - ($index % 3)));

            Comment::query()->create([
                'user_id' => $firstReplyUser->id,
                'post_id' => $rootComment->post_id,
                'parent_id' => $rootComment->id,
                'content' => $replyTexts[$index % count($replyTexts)],
                'attachments' => null,
                'mentions' => null,
                'created_at' => $replyCreatedAt,
                'updated_at' => $replyCreatedAt,
            ]);

            Comment::query()->create([
                'user_id' => $secondReplyUser->id,
                'post_id' => $rootComment->post_id,
                'parent_id' => $rootComment->id,
                'content' => $replyTexts[($index + 2) % count($replyTexts)],
                'attachments' => null,
                'mentions' => null,
                'created_at' => $replyCreatedAt->copy()->addHours(2),
                'updated_at' => $replyCreatedAt->copy()->addHours(2),
            ]);
        }

        $allSeededComments = Comment::query()
            ->whereIn('post_id', collect($commentTargets)->pluck('id'))
            ->get();

        foreach ($allSeededComments as $index => $comment) {
            $voterA = $reviewers[$index % $reviewers->count()];
            $voterB = $reviewers[($index + 4) % $reviewers->count()];
            $votedAt = now()->subDays(max(1, 3 - ($index % 3)));

            if ($voterA->id !== $comment->user_id) {
                CommentLike::query()->updateOrCreate(
                    ['user_id' => $voterA->id, 'comment_id' => $comment->id],
                    ['vote' => 1, 'created_at' => $votedAt, 'updated_at' => $votedAt],
                );
            }

            if ($voterB->id !== $comment->user_id) {
                $vote = $index % 7 === 0 ? -1 : 1;
                CommentLike::query()->updateOrCreate(
                    ['user_id' => $voterB->id, 'comment_id' => $comment->id],
                    [
                        'vote' => $vote,
                        'created_at' => $votedAt->copy()->addMinutes(15),
                        'updated_at' => $votedAt->copy()->addMinutes(15),
                    ],
                );
            }
        }

        foreach ($commentTargets as $post) {
            PostSave::query()->create([
                'user_id' => $student->id,
                'post_id' => $post->id,
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ]);
        }

        $feedbackRows = [
            [$student, $materials['vertex'], 1, 5, 'Clear explanation. The worked example on vertex form helped me check the turning point correctly.'],
            [$reviewers[0], $materials['vertex'], 1, 4, 'Good summary and the axis of symmetry reminder is useful before quizzes.'],
            [$reviewers[1], $materials['vertex'], 1, 5, 'The explanation is clear and the examples are aligned with class exercises.'],
            [$reviewers[2], $materials['factorisation'], -1, 2, 'Need more step-by-step examples for harder factorisation questions.'],
            [$reviewers[3], $materials['factorisation'], -1, 2, 'Need more step-by-step examples. The factorisation steps feel too fast.'],
            [$student, $materials['factorisation'], -1, 3, 'Need more step-by-step examples and one difficult worked solution.'],
            [$reviewers[4], $materials['factorisation'], 1, 3, 'The basics are fine, but stronger students still need more step-by-step examples for mixed questions.'],
            [$reviewers[0], $materials['graphs'], 1, 4, 'Useful for quick revision because the key features are organised clearly.'],
            [$reviewers[1], $materials['graphs'], 1, 4, 'The graph sketch checklist is practical and easy to remember.'],
            [$reviewers[2], $materials['graphs'], 1, 5, 'Very suitable for revision night because the sketching method is concise.'],
        ];

        foreach ($feedbackRows as [$user, $material, $vote, $rating, $feedback]) {
            StudyMaterialFeedback::query()->updateOrCreate(
                ['user_id' => $user->id, 'post_id' => $material->id],
                [
                    'vote' => $vote,
                    'rating' => $rating,
                    'feedback' => $feedback,
                    'created_at' => now()->subDays(3),
                    'updated_at' => now()->subDays(3),
                ]
            );
        }

        foreach (collect([$student])->merge($reviewers)->values() as $index => $viewer) {
            foreach ($materials as $key => $material) {
                $viewCount = match ($key) {
                    'factorisation' => 4 + $index,
                    'vertex' => 3 + $index,
                    default => 2 + $index,
                };

                DB::table('study_material_views')->updateOrInsert(
                    [
                        'user_id' => $viewer->id,
                        'post_id' => $material->id,
                    ],
                    [
                        'view_count' => $viewCount,
                        'last_viewed_at' => now()->subDays(max(1, 6 - $index)),
                        'created_at' => now()->subDays(6),
                        'updated_at' => now()->subDays(1),
                    ]
                );
            }
        }

        $attemptRows = [
            [$student, $quizzes['vertex'], $materials['vertex'], 2, 3, now()->subDays(8)],
            [$student, $quizzes['factorisation'], $materials['factorisation'], 1, 3, now()->subDays(7)],
            [$student, $quizzes['graphs'], $materials['graphs'], 2, 3, now()->subDays(6)],
            [$reviewers[0], $quizzes['vertex'], $materials['vertex'], 3, 3, now()->subDays(6)],
            [$reviewers[1], $quizzes['factorisation'], $materials['factorisation'], 1, 3, now()->subDays(5)],
            [$reviewers[2], $quizzes['factorisation'], $materials['factorisation'], 2, 3, now()->subDays(4)],
            [$reviewers[3], $quizzes['graphs'], $materials['graphs'], 3, 3, now()->subDays(4)],
            [$reviewers[4], $quizzes['factorisation'], $materials['factorisation'], 1, 3, now()->subDays(3)],
        ];

        foreach ($attemptRows as [$user, $quiz, $material, $score, $totalQuestions, $createdAt]) {
            DB::table('material_quiz_attempts')->insert([
                'user_id' => $user->id,
                'post_id' => $quiz->id,
                'material_id' => $material->id,
                'score' => $score,
                'total_questions' => $totalQuestions,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }

        $mistakeRows = [
            [$student, $quizzes['factorisation']->id, 1, 0, false, now()->subDays(7)],
            [$student, $quizzes['factorisation']->id, 2, 0, false, now()->subDays(7)],
            [$student, $quizzes['vertex']->id, 1, 1, false, now()->subDays(8)],
            [$reviewers[0], $quizzes['factorisation']->id, 1, 0, false, now()->subDays(6)],
            [$reviewers[1], $quizzes['factorisation']->id, 1, 2, false, now()->subDays(5)],
            [$reviewers[2], $quizzes['factorisation']->id, 2, 3, false, now()->subDays(4)],
            [$reviewers[3], $quizzes['graphs']->id, 1, 1, false, now()->subDays(4)],
            [$reviewers[4], $quizzes['factorisation']->id, 1, 3, false, now()->subDays(3)],
        ];

        foreach ($mistakeRows as [$user, $quizId, $questionIndex, $selectedAnswerIndex, $isCorrect, $attemptedAt]) {
            QuizMistake::query()->create([
                'user_id' => $user->id,
                'post_id' => $quizId,
                'question_index' => $questionIndex,
                'selected_answer_index' => $selectedAnswerIndex,
                'is_correct' => $isCorrect,
                'attempted_at' => $attemptedAt,
                'created_at' => $attemptedAt,
                'updated_at' => $attemptedAt,
            ]);
        }

        $studentQuestionCount = $questionPosts->count() + 1;
        $studentLikeCount = $likedStudentPosts->count() * $reviewers->count();

        UserProgress::query()->create([
            'user_id' => $student->id,
            'total_questions_answered' => 24,
            'total_questions_posted' => $studentQuestionCount,
            'total_post_posted' => $studentQuestionCount,
            'quizzes_completed' => 12,
            'correct_answers_count' => 20,
            'total_likes_received' => $studentLikeCount,
            'quiz_scores' => [42, 50, 58, 67, 78, 83],
            'improvement_score' => 16,
            'created_at' => now()->subDays(10),
            'updated_at' => now()->subDay(),
        ]);

        UserProgress::query()->create([
            'user_id' => $teacher->id,
            'total_questions_answered' => 0,
            'total_questions_posted' => 0,
            'total_post_posted' => 3,
            'quizzes_completed' => 0,
            'correct_answers_count' => 0,
            'total_likes_received' => 0,
            'quiz_scores' => [],
            'improvement_score' => 0,
            'created_at' => now()->subDays(18),
            'updated_at' => now()->subDay(),
        ]);

        $versionRows = [
            [$materials['vertex']->id, 1, $materials['vertex']->title, 4.3, 3, 3, 3, 100, now()->subDays(18)],
            [$materials['factorisation']->id, 1, $materials['factorisation']->title, 2.7, 2, 0, 2, 0, now()->subDays(16)],
            [$materials['factorisation']->id, 2, $materials['factorisation']->title, 3.0, 4, 1, 4, 25, now()->subDays(6)],
            [$materials['graphs']->id, 1, $materials['graphs']->title, 4.3, 3, 3, 3, 100, now()->subDays(12)],
        ];

        foreach ($versionRows as [$postId, $versionNumber, $title, $averageRating, $ratingCount, $recommendedCount, $totalVotes, $recommendationRate, $createdAt]) {
            DB::table('study_material_versions')->insert([
                'post_id' => $postId,
                'version_number' => $versionNumber,
                'title' => $title,
                'average_rating' => $averageRating,
                'rating_count' => $ratingCount,
                'recommended_count' => $recommendedCount,
                'total_votes' => $totalVotes,
                'recommendation_rate' => $recommendationRate,
                'created_at' => $createdAt,
                'updated_at' => now()->subDay(),
            ]);
        }

        $achievementService = app(AchievementService::class);
        $achievementService->syncUser($student);
        $achievementService->evaluateAchievements($student);
    }

    private function upsertUser(string $email, string $name, string $role): User
    {
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make('password'),
                'role' => $role,
                'email_verified_at' => now(),
                'locale' => 'en',
                'show_on_leaderboard' => true,
                'show_leaderboard_badge' => true,
            ],
        );

        $this->syncDemoAvatar($user);

        return $user;
    }

    private function syncDemoAvatar(User $user): void
    {
        SocialAccount::query()->updateOrCreate(
            [
                'provider' => 'demo-avatar',
                'provider_id' => $user->email,
            ],
            [
                'user_id' => $user->id,
                'avatar' => $this->demoAvatarUrl($user->name),
            ],
        );
    }

    private function demoAvatarUrl(string $name): string
    {
        $params = http_build_query([
            'name' => $name,
            'background' => substr(md5($name), 0, 6),
            'color' => 'ffffff',
            'size' => 128,
            'bold' => 'true',
        ]);

        return "https://ui-avatars.com/api/?{$params}";
    }

    private function resetDemoData(Collection $users): void
    {
        $userIds = $users->pluck('id')->all();

        Comment::query()->whereIn('user_id', $userIds)->delete();
        Like::query()->whereIn('user_id', $userIds)->delete();
        PostSave::query()->whereIn('user_id', $userIds)->delete();
        QuizMistake::query()->whereIn('user_id', $userIds)->delete();
        StudyMaterialFeedback::query()->whereIn('user_id', $userIds)->delete();
        DB::table('material_quiz_attempts')->whereIn('user_id', $userIds)->delete();
        DB::table('study_material_views')->whereIn('user_id', $userIds)->delete();
        DB::table('badge_user')->whereIn('user_id', $userIds)->delete();
        DB::table('user_achievements')->whereIn('user_id', $userIds)->delete();
        UserProgress::query()->whereIn('user_id', $userIds)->delete();
        Post::query()->whereIn('user_id', $userIds)->delete();
    }

    private function createQuestion(
        User $author,
        int $subjectId,
        int $languageId,
        string $title,
        string $content,
        $createdAt,
    ): Post {
        return Post::query()->create([
            'user_id' => $author->id,
            'is_anonymous' => false,
            'title' => $title,
            'content' => $content,
            'content_blocks' => null,
            'post_type' => 'question',
            'parent_material_id' => null,
            'quiz_data' => null,
            'subject_id' => $subjectId,
            'language_id' => $languageId,
            'image' => null,
            'video_url' => null,
            'material_improved_from_feedback' => false,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }

    private function createMaterial(
        User $teacher,
        int $subjectId,
        int $languageId,
        string $title,
        array $paragraphs,
        bool $improvedFromFeedback,
        $createdAt,
    ): Post {
        return Post::query()->create([
            'user_id' => $teacher->id,
            'is_anonymous' => false,
            'title' => $title,
            'content' => $paragraphs[0],
            'content_blocks' => collect($paragraphs)
                ->map(fn (string $text) => ['type' => 'text', 'text' => $text])
                ->values()
                ->all(),
            'post_type' => 'material',
            'parent_material_id' => null,
            'quiz_data' => null,
            'subject_id' => $subjectId,
            'language_id' => $languageId,
            'image' => null,
            'video_url' => null,
            'material_improved_from_feedback' => $improvedFromFeedback,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }

    private function createQuiz(
        User $teacher,
        int $subjectId,
        int $languageId,
        int $parentMaterialId,
        string $title,
        array $questions,
        $createdAt,
    ): Post {
        return Post::query()->create([
            'user_id' => $teacher->id,
            'is_anonymous' => false,
            'title' => $title,
            'content' => 'Short checkpoint quiz linked to the study material.',
            'content_blocks' => null,
            'post_type' => 'quiz',
            'parent_material_id' => $parentMaterialId,
            'quiz_data' => [
                'questions' => $questions,
            ],
            'subject_id' => $subjectId,
            'language_id' => $languageId,
            'image' => null,
            'video_url' => null,
            'material_improved_from_feedback' => false,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }
}
