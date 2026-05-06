<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\BookmarkFolder;
use App\Models\BookmarkItem;
use App\Models\Like;
use App\Models\Post;
use App\Models\QuizAttempt;
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
            ['email' => 'student.m@example.com', 'name' => 'Mira Zahra'],
            ['email' => 'student.n@example.com', 'name' => 'Naveen Raj'],
            ['email' => 'student.o@example.com', 'name' => 'Olivia Poh'],
            ['email' => 'student.p@example.com', 'name' => 'Puteri Sofea'],
            ['email' => 'student.q@example.com', 'name' => 'Qing Yi'],
            ['email' => 'student.r@example.com', 'name' => 'Rafiq Azlan'],
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

        $teacherMediaMaterials = collect([
            [
                'title' => 'Algebra Basics: Expanding Single Brackets',
                'paragraphs' => [
                    'This lesson explains how to distribute terms correctly when expanding single brackets.',
                    'Students should highlight sign changes before writing the final simplified expression.',
                    'A two-line checking routine is included to reduce careless sign mistakes.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'image' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904',
                'created_at' => now()->subDays(9),
            ],
            [
                'title' => 'Algebra Basics: Collecting Like Terms Efficiently',
                'paragraphs' => [
                    'This note trains students to group similar variables before combining coefficients.',
                    'Use color-coding during early practice to improve term recognition speed.',
                    'A mini drill is included to build fluency for exam conditions.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=2g811Eo7K8U',
                'image' => 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
                'created_at' => now()->subDays(8),
            ],
            [
                'title' => 'Linear Equations: Balancing Method Step by Step',
                'paragraphs' => [
                    'Focus on doing the same operation to both sides while preserving equality.',
                    'Students learn to isolate variables systematically without skipping steps.',
                    'Common misconceptions are listed with quick correction tips.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=3Yv3gR6I2dA',
                'image' => 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173',
                'created_at' => now()->subDays(8),
            ],
            [
                'title' => 'Fractions: Comparing and Ordering Quickly',
                'paragraphs' => [
                    'This guide compares denominator matching and benchmark strategies.',
                    'Students practice deciding the fastest approach based on the question type.',
                    'Error checks are included for numerator-denominator confusion.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=HfACrKJ_Y2w',
                'image' => 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b',
                'created_at' => now()->subDays(7),
            ],
            [
                'title' => 'Percentages: Increase and Decrease Problems',
                'paragraphs' => [
                    'Students practise converting word problems into percentage multipliers.',
                    'The lesson emphasises difference between percentage points and percent change.',
                    'A short checklist helps avoid inverse-operation mistakes.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=3evj5m8lJ0w',
                'image' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
                'created_at' => now()->subDays(7),
            ],
            [
                'title' => 'Ratio and Proportion: Model Method for Beginners',
                'paragraphs' => [
                    'This material introduces ratio tables and bar models for visual learners.',
                    'Students practise translating text into ratio statements clearly.',
                    'The final section compares direct and inverse proportion patterns.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=X2nYl8Q9L2k',
                'image' => 'https://images.unsplash.com/photo-1498079022511-d15614cb1c02',
                'created_at' => now()->subDays(6),
            ],
            [
                'title' => 'Geometry: Interior Angles of Triangles and Polygons',
                'paragraphs' => [
                    'Students review angle sum facts and apply them to multi-step diagrams.',
                    'The material teaches annotation habits before solving.',
                    'A quick challenge set builds confidence for structured questions.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=b7LqzH6o8zU',
                'image' => 'https://images.unsplash.com/photo-1513258496099-48168024aec0',
                'created_at' => now()->subDays(6),
            ],
            [
                'title' => 'Coordinate Geometry: Midpoint and Distance',
                'paragraphs' => [
                    'This lesson connects formulas to visual movement on the Cartesian plane.',
                    'Students practise plotting points before substituting into formulas.',
                    'A diagnostic section targets common substitution and sign errors.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=QVKj3LADCnA',
                'image' => 'https://images.unsplash.com/photo-1460518451285-97b6aa326961',
                'created_at' => now()->subDays(5),
            ],
            [
                'title' => 'Statistics: Mean, Median, Mode in Context',
                'paragraphs' => [
                    'The note compares which measure is most suitable in different data sets.',
                    'Students evaluate outliers before selecting an answer.',
                    'Realistic school-based examples improve interpretation skills.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=xxpc-HPKN28',
                'image' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
                'created_at' => now()->subDays(5),
            ],
            [
                'title' => 'Probability: Listing Outcomes Systematically',
                'paragraphs' => [
                    'Students learn to use tables and tree diagrams for sample spaces.',
                    'The lesson reinforces probability values between 0 and 1.',
                    'Checking strategies are included for complete outcome listing.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=SkidyDQuupA',
                'image' => 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0',
                'created_at' => now()->subDays(4),
            ],
            [
                'title' => 'Chinese Writing Skills: 强化议论文论证结构',
                'paragraphs' => [
                    '本课重点是“论点-论据-论证”三段式结构。',
                    '学生将练习把事实例子和观点紧密连接。',
                    '附上常见逻辑跳跃问题与修正方式。',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=5MgBikgcWnY',
                'image' => 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32',
                'created_at' => now()->subDays(4),
            ],
            [
                'title' => 'Bahasa Melayu: Teknik Huraian Isi Karangan',
                'paragraphs' => [
                    'Modul ini membina huraian isi menggunakan formula isi-sebab-contoh-kesan.',
                    'Pelajar belajar menambah nilai hujah tanpa mengulang ayat yang sama.',
                    'Disertakan latihan ringkas untuk semakan kendiri.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=YQHsXMglC9A',
                'image' => 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e',
                'created_at' => now()->subDays(3),
            ],
            [
                'title' => 'Exam Strategy: 30-Minute Revision Sprint Plan',
                'paragraphs' => [
                    'This material provides a fast revision framework for weak topics.',
                    'Students allocate time between concept recap and error correction drills.',
                    'A priority matrix helps decide what to revise first.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=ZXsQAXx_ao0',
                'image' => 'https://images.unsplash.com/photo-1455390582262-044cdead277a',
                'created_at' => now()->subDays(2),
            ],
            [
                'title' => 'Common Mistakes Clinic: Quadratic Sign Errors',
                'paragraphs' => [
                    'This post compiles frequent sign-related mistakes in quadratic manipulation.',
                    'Students compare wrong and corrected solutions side by side.',
                    'A 60-second final check routine is included.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=R0eQGf_lxA0',
                'image' => 'https://images.unsplash.com/photo-1484417894907-623942c8ee29',
                'created_at' => now()->subDays(2),
            ],
            [
                'title' => 'Study Skills: Error Log Template for Weekly Reflection',
                'paragraphs' => [
                    'Students record mistakes by topic, cause, and correction plan.',
                    'The reflection section encourages deliberate weekly improvements.',
                    'Teachers can use it to give focused feedback quickly.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=0KSOMA3QBU0',
                'image' => 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6',
                'created_at' => now()->subDay(),
            ],
            [
                'title' => 'Learning Motivation: Building Consistency Before Exams',
                'paragraphs' => [
                    'This final support note discusses small daily habits for better retention.',
                    'Students learn a realistic consistency model instead of last-minute cramming.',
                    'Includes a printable daily tracker format.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
                'image' => 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2',
                'created_at' => now()->subDay(),
            ],
            [
                'title' => 'Quick Drill: Five-Minute Mental Math Routine',
                'paragraphs' => [
                    'A short routine to strengthen arithmetic fluency before problem-solving.',
                    'Students practise estimation first, then exact calculation.',
                    'The final tip section reduces rushed-answer errors.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=hT_nvWreIhg',
                'image' => 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570',
                'created_at' => now()->subDay(),
            ],
            [
                'title' => 'Word Problems: Translating Sentences Into Equations',
                'paragraphs' => [
                    'Students identify keywords and unknowns before building equations.',
                    'This lesson separates relevant from distracting information.',
                    'A worked checklist is provided for structured responses.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=fLexgOxsZu0',
                'image' => 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846',
                'created_at' => now()->subDay(),
            ],
            [
                'title' => 'Graph Interpretation: Reading Trends from Curves',
                'paragraphs' => [
                    'The material trains students to describe increasing/decreasing intervals precisely.',
                    'Students connect gradient behavior to real-world interpretation.',
                    'Sentence stems are included for exam-style explanation questions.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=09R8_2nJtjg',
                'image' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
                'created_at' => now()->subDay(),
            ],
            [
                'title' => 'Final Revision Pack: Targeted Practice by Weakness',
                'paragraphs' => [
                    'This capstone post organises practice questions by common weakness areas.',
                    'Students choose one corrective set and one mastery set each day.',
                    'The progress tracker links effort directly to measurable outcomes.',
                ],
                'video_url' => 'https://www.youtube.com/watch?v=60ItHLz5WEA',
                'image' => 'https://images.unsplash.com/photo-1509062522246-3755977927d7',
                'created_at' => now(),
            ],
        ])->map(function (array $material) use ($teacher, $mathId, $englishId, $chineseId, $malayId, $chineseSubjectId, $malaySubjectId) {
            $subjectId = str_contains($material['title'], 'Chinese') || str_contains($material['title'], '华文') ? $chineseSubjectId : (str_contains($material['title'], 'Bahasa Melayu') ? $malaySubjectId : $mathId);
            $languageId = str_contains($material['title'], 'Chinese') || str_contains($material['title'], '华文') ? $chineseId : (str_contains($material['title'], 'Bahasa Melayu') ? $malayId : $englishId);

            return $this->createMaterial(
                $teacher,
                $subjectId,
                $languageId,
                $material['title'],
                $material['paragraphs'],
                true,
                $material['created_at'],
                $material['image'],
                $material['video_url'],
            );
        });

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
            [
                'title' => 'Secondary Mathematics: How do I check if my quadratic sketch is accurate?',
                'content' => 'Sometimes my graph shape is correct but the position is wrong. What is the quickest self-check?',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDays(4),
            ],
            [
                'title' => 'Secondary Mathematics: Completing the square feels too long, when is it worth using?',
                'content' => 'I can factorise some questions but not all. How do I decide the faster method in exams?',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDays(4),
            ],
            [
                'title' => '中学华文：如何在说明文里加入更具体的例子？',
                'content' => '我写出来的内容太笼统，老师说缺乏细节。有没有一个检查清单？',
                'subject_id' => $chineseSubjectId,
                'language_id' => $chineseId,
                'created_at' => now()->subDays(3),
            ],
            [
                'title' => 'Bahasa Melayu Menengah: Cara menulis pendahuluan karangan yang matang',
                'content' => 'Saya mahu elakkan pendahuluan yang terlalu umum. Frasa pembuka apa yang sesuai untuk isu semasa?',
                'subject_id' => $malaySubjectId,
                'language_id' => $malayId,
                'created_at' => now()->subDays(3),
            ],
            [
                'title' => 'Secondary Mathematics: How does the discriminant connect to graph sketching?',
                'content' => 'I know b^2 - 4ac tells number of roots, but I am not sure how to use it during graph questions.',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDays(2),
            ],
            [
                'title' => '初中华文：如何把段落衔接写得更自然？',
                'content' => '每一段好像独立的内容，读起来不顺。有没有常用的过渡句型？',
                'subject_id' => $chineseSubjectId,
                'language_id' => $chineseId,
                'created_at' => now()->subDays(2),
            ],
            [
                'title' => 'Bahasa Melayu: Tip cepat bezakan isi utama dan huraian',
                'content' => 'Semasa latihan, saya selalu gabungkan kedua-duanya dalam satu ayat. Macam mana nak susun dengan kemas?',
                'subject_id' => $malaySubjectId,
                'language_id' => $malayId,
                'created_at' => now()->subDays(1),
            ],
            [
                'title' => 'Secondary Mathematics: Any memory trick for signs when solving quadratics?',
                'content' => 'I often make sign mistakes after expanding brackets. I need a short checking routine.',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDay(),
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

        $likedStudentPosts = $questionPosts->take(6)->push($studentReflection);
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
            ...$teacherMediaMaterials->take(12)->all(),
            ...$questionPosts->take(14)->all(),
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
            'The discussion examples are practical and match school exam style.',
            'I like how the explanations are short but still complete.',
            'The content is suitable for self-study and group revision.',
            'This helped me explain my method more clearly in class.',
            'The revision order is helpful for students who are weak in basics.',
            'The mistakes section made me more careful with sign errors.',
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
            'This answer is clear. I will use this method tonight.',
            'The worked examples look simple, but the strategy is solid.',
            'I like this because it explains both concept and exam technique.',
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

        $defaultFolder = BookmarkFolder::defaultFor($student);

        foreach ($commentTargets as $post) {
            BookmarkItem::query()->create([
                'user_id' => $student->id,
                'bookmark_folder_id' => $defaultFolder->id,
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
            [$reviewers[5], $materials['vertex'], 1, 5, 'Great for students who need a quick recap before trying harder exercises.'],
            [$reviewers[6], $materials['factorisation'], -1, 3, 'The topic is useful but needs one more example with larger coefficients.'],
            [$reviewers[7], $materials['graphs'], 1, 4, 'The feature-based sketching flow is easy to apply in timed practice.'],
            [$reviewers[8], $materials['vertex'], 1, 4, 'Clear enough for weaker students and still relevant for revision drills.'],
            [$reviewers[9], $materials['factorisation'], 1, 3, 'The method is okay after repeated practice, but one extra challenge set would help.'],
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
            [$student, $quizzes['vertex'], $materials['vertex'], 2.0, true, now()->subDays(8)],
            [$student, $quizzes['factorisation'], $materials['factorisation'], 1.0, false, now()->subDays(7)],
            [$student, $quizzes['graphs'], $materials['graphs'], 2.0, true, now()->subDays(6)],
            [$reviewers[0], $quizzes['vertex'], $materials['vertex'], 3.0, true, now()->subDays(6)],
            [$reviewers[1], $quizzes['factorisation'], $materials['factorisation'], 1.0, false, now()->subDays(5)],
            [$reviewers[2], $quizzes['factorisation'], $materials['factorisation'], 2.0, true, now()->subDays(4)],
            [$reviewers[3], $quizzes['graphs'], $materials['graphs'], 3.0, true, now()->subDays(4)],
            [$reviewers[4], $quizzes['factorisation'], $materials['factorisation'], 1.0, false, now()->subDays(3)],
            [$reviewers[5], $quizzes['vertex'], $materials['vertex'], 3.0, true, now()->subDays(3)],
            [$reviewers[6], $quizzes['graphs'], $materials['graphs'], 2.0, true, now()->subDays(2)],
            [$reviewers[7], $quizzes['factorisation'], $materials['factorisation'], 1.0, false, now()->subDays(2)],
            [$reviewers[8], $quizzes['vertex'], $materials['vertex'], 2.0, true, now()->subDays(2)],
            [$reviewers[9], $quizzes['factorisation'], $materials['factorisation'], 2.0, true, now()->subDay()],
            [$reviewers[10], $quizzes['graphs'], $materials['graphs'], 3.0, true, now()->subDay()],
        ];

        foreach ($attemptRows as [$user, $quiz, $material, $score, $passed, $createdAt]) {
            DB::table('material_quiz_attempts')->insert([
                'user_id' => $user->id,
                'post_id' => $quiz->id,
                'score' => $score,
                'passed' => $passed,
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
            [$reviewers[5], $quizzes['vertex']->id, 2, 2, false, now()->subDays(3)],
            [$reviewers[6], $quizzes['graphs']->id, 2, 2, false, now()->subDays(2)],
            [$reviewers[7], $quizzes['factorisation']->id, 2, 1, false, now()->subDays(2)],
            [$reviewers[8], $quizzes['vertex']->id, 1, 3, false, now()->subDays(2)],
            [$reviewers[9], $quizzes['factorisation']->id, 1, 1, false, now()->subDay()],
        ];

        foreach ($mistakeRows as [$user, $quizId, $questionIndex, $selectedAnswerIndex, $isCorrect, $attemptedAt]) {
            QuizAttempt::query()->create([
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
            'total_post_posted' => 3 + $teacherMediaMaterials->count(),
            'quizzes_completed' => 0,
            'correct_answers_count' => 0,
            'total_likes_received' => 0,
            'quiz_scores' => [],
            'improvement_score' => 0,
            'created_at' => now()->subDays(18),
            'updated_at' => now()->subDay(),
        ]);

        $versionRows = [
            [$materials['vertex']->id, 1, $student->id, $materials['vertex']->title, 'Initial version', now()->subDays(18)],
            [$materials['factorisation']->id, 1, $student->id, $materials['factorisation']->title, 'Initial version', now()->subDays(16)],
            [$materials['factorisation']->id, 2, $student->id, $materials['factorisation']->title, 'Updated with examples', now()->subDays(6)],
            [$materials['graphs']->id, 1, $student->id, $materials['graphs']->title, 'Initial version', now()->subDays(12)],
        ];

        foreach ($versionRows as [$postId, $versionNumber, $userId, $title, $changeSummary, $createdAt]) {
            DB::table('study_material_versions')->insert([
                'post_id' => $postId,
                'user_id' => $userId,
                'version_number' => $versionNumber,
                'title' => $title,
                'content' => 'Content for version ' . $versionNumber,
                'change_summary' => $changeSummary,
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
                'is_verified' => $role === 'teacher',
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
        BookmarkItem::query()->whereIn('user_id', $userIds)->delete();
        QuizAttempt::query()->whereIn('user_id', $userIds)->delete();
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
        ?string $image = null,
        ?string $videoUrl = null,
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
            'image' => $image ? [$image] : null,
            'video_url' => $videoUrl,
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
