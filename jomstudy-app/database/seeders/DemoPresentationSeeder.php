<?php

namespace Database\Seeders;

use App\Models\BookmarkItem;
use App\Models\Comment;
use App\Models\CommentLike;
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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class DemoPresentationSeeder extends Seeder
{
    /**
     * @var array<string, array<int, string>>
     */
    private array $columnCache = [];

    public function run(): void
    {
        $this->call([
            SubjectsSeeder::class,
            LanguagesSeeder::class,
            BadgesSeeder::class,
            AchievementsSeeder::class,
        ]);

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
            ['email' => 'student.s@example.com', 'name' => 'Sara Nordin'],
            ['email' => 'student.t@example.com', 'name' => 'Terence Goh'],
            ['email' => 'student.u@example.com', 'name' => 'Uma Devi'],
            ['email' => 'student.v@example.com', 'name' => 'Vincent Chia'],
            ['email' => 'student.w@example.com', 'name' => 'Wan Nurin'],
            ['email' => 'student.x@example.com', 'name' => 'Xiao Han'],
            ['email' => 'student.y@example.com', 'name' => 'Yasmin Aziz'],
            ['email' => 'student.z@example.com', 'name' => 'Zikri Faiz'],
        ])->map(fn (array $reviewer) => $this->upsertUser($reviewer['email'], $reviewer['name'], 'student'));

        $allDemoUsers = collect([$teacher, $student])
            ->merge($reviewers)
            ->values();

        $this->resetDemoData($allDemoUsers);
        $this->seedTeacherVerificationRecords($allDemoUsers);

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

        $extraQuizRows = [
            [
                'material' => $teacherMediaMaterials[0],
                'title' => 'Expanding Brackets Speed Check',
                'questions' => [
                    [
                        'question' => 'Expand 3(x + 4).',
                        'options' => ['3x + 4', '3x + 12', 'x + 12', '7x'],
                        'answer_index' => 1,
                        'explanation' => 'Multiply both terms inside the bracket by 3.',
                    ],
                    [
                        'question' => 'Expand -2(x - 5).',
                        'options' => ['-2x - 10', '-2x + 10', '2x - 10', '2x + 10'],
                        'answer_index' => 1,
                        'explanation' => 'The negative multiplier changes the sign of both terms.',
                    ],
                    [
                        'question' => 'Which expression is equivalent to 5(2a - 3)?',
                        'options' => ['10a - 15', '7a - 8', '10a - 3', '2a - 15'],
                        'answer_index' => 0,
                        'explanation' => '5 times 2a is 10a, and 5 times -3 is -15.',
                    ],
                    [
                        'question' => 'What is the common mistake in 4(x + 2) = 4x + 2?',
                        'options' => ['Only x was multiplied', 'The sign of x changed', 'The bracket was squared', 'The answer was factorised'],
                        'answer_index' => 0,
                        'explanation' => 'Both x and 2 must be multiplied by 4.',
                    ],
                ],
            ],
            [
                'material' => $teacherMediaMaterials[1],
                'title' => 'Collecting Like Terms Quiz',
                'questions' => [
                    [
                        'question' => 'Simplify 3x + 2x.',
                        'options' => ['5x', '5x^2', '6x', 'x'],
                        'answer_index' => 0,
                        'explanation' => 'Like terms have the same variable part, so add the coefficients.',
                    ],
                    [
                        'question' => 'Simplify 4a + 3b - a.',
                        'options' => ['3a + 3b', '4ab - a', '6ab', '7a - b'],
                        'answer_index' => 0,
                        'explanation' => '4a - a = 3a, and 3b stays separate.',
                    ],
                    [
                        'question' => 'Which terms are like terms?',
                        'options' => ['2x and 2y', '3a and 5a', 'x and x^2', '4b and 4'],
                        'answer_index' => 1,
                        'explanation' => '3a and 5a share the same variable part.',
                    ],
                    [
                        'question' => 'Simplify 7m - 2m + 4.',
                        'options' => ['5m + 4', '9m + 4', '5m', '9m'],
                        'answer_index' => 0,
                        'explanation' => '7m - 2m = 5m, and the constant remains 4.',
                    ],
                ],
            ],
            [
                'material' => $teacherMediaMaterials[2],
                'title' => 'Linear Equations Balance Quiz',
                'questions' => [
                    [
                        'question' => 'Solve x + 7 = 12.',
                        'options' => ['x = 5', 'x = 19', 'x = 7', 'x = 12'],
                        'answer_index' => 0,
                        'explanation' => 'Subtract 7 from both sides.',
                    ],
                    [
                        'question' => 'Solve 3x = 18.',
                        'options' => ['x = 6', 'x = 15', 'x = 21', 'x = 54'],
                        'answer_index' => 0,
                        'explanation' => 'Divide both sides by 3.',
                    ],
                    [
                        'question' => 'What keeps an equation balanced?',
                        'options' => ['Changing only the left side', 'Doing the same operation to both sides', 'Removing all constants', 'Guessing the value first'],
                        'answer_index' => 1,
                        'explanation' => 'The equality is preserved when the same operation is applied to both sides.',
                    ],
                    [
                        'question' => 'Solve 2x + 1 = 9.',
                        'options' => ['x = 4', 'x = 5', 'x = 8', 'x = 10'],
                        'answer_index' => 0,
                        'explanation' => 'Subtract 1, then divide 8 by 2.',
                    ],
                ],
            ],
            [
                'material' => $teacherMediaMaterials[7],
                'title' => 'Mean Median Mode Checkpoint',
                'questions' => [
                    [
                        'question' => 'Find the mean of 2, 4, 6.',
                        'options' => ['3', '4', '6', '12'],
                        'answer_index' => 1,
                        'explanation' => 'The total is 12 and there are 3 values, so the mean is 4.',
                    ],
                    [
                        'question' => 'Which measure is most affected by an extreme outlier?',
                        'options' => ['Mean', 'Median', 'Mode', 'Range label'],
                        'answer_index' => 0,
                        'explanation' => 'The mean uses every value, so an outlier can pull it strongly.',
                    ],
                    [
                        'question' => 'What is the mode of 1, 2, 2, 3, 4?',
                        'options' => ['1', '2', '3', '4'],
                        'answer_index' => 1,
                        'explanation' => 'The mode is the value that appears most often.',
                    ],
                    [
                        'question' => 'What is the median of 5, 1, 9?',
                        'options' => ['1', '5', '9', '15'],
                        'answer_index' => 1,
                        'explanation' => 'Order the values as 1, 5, 9; the middle value is 5.',
                    ],
                ],
            ],
            [
                'material' => $teacherMediaMaterials[10],
                'title' => '华文议论文结构小测',
                'questions' => [
                    [
                        'question' => '议论文开头最重要的是先写清楚什么？',
                        'options' => ['论点', '错别字', '标点数量', '故事结局'],
                        'answer_index' => 0,
                        'explanation' => '清楚的论点能让后面的例子和分析有方向。',
                    ],
                    [
                        'question' => '“因为……所以……”最适合用来表达什么关系？',
                        'options' => ['因果关系', '时间顺序', '人物外貌', '地点转换'],
                        'answer_index' => 0,
                        'explanation' => '这个句式能帮助学生把理由和结论连接起来。',
                    ],
                    [
                        'question' => '好的论据应该和论点有什么关系？',
                        'options' => ['互不相关', '直接支持论点', '只负责增加字数', '必须完全相反'],
                        'answer_index' => 1,
                        'explanation' => '论据的作用是证明或支持论点。',
                    ],
                    [
                        'question' => '段落结尾常用来做什么？',
                        'options' => ['总结本段重点', '换成另一个题目', '删除论点', '重复所有例子'],
                        'answer_index' => 0,
                        'explanation' => '段末总结能让论证更完整。',
                    ],
                ],
            ],
            [
                'material' => $teacherMediaMaterials[11],
                'title' => 'Kuiz Huraian Isi Karangan',
                'questions' => [
                    [
                        'question' => 'Apakah fungsi contoh dalam huraian isi?',
                        'options' => ['Menguatkan hujah', 'Menghapuskan isi utama', 'Menggantikan tajuk', 'Memendekkan karangan sahaja'],
                        'answer_index' => 0,
                        'explanation' => 'Contoh menjadikan hujah lebih jelas dan meyakinkan.',
                    ],
                    [
                        'question' => 'Susunan yang paling kemas ialah:',
                        'options' => ['Isi, sebab, contoh, kesan', 'Contoh, tajuk, penutup, isi', 'Kesan sahaja', 'Isi tanpa huraian'],
                        'answer_index' => 0,
                        'explanation' => 'Formula ini membantu pelajar menghuraikan idea dengan lengkap.',
                    ],
                    [
                        'question' => 'Apakah maksud huraian matang?',
                        'options' => ['Ayat panjang tanpa isi', 'Idea dijelaskan dengan sebab dan kesan', 'Mengulang ayat sama', 'Menukar bahasa'],
                        'answer_index' => 1,
                        'explanation' => 'Huraian matang menerangkan alasan dan impak dengan jelas.',
                    ],
                    [
                        'question' => 'Perkataan penanda wacana membantu pembaca melihat:',
                        'options' => ['Hubungan idea', 'Bilangan huruf', 'Saiz tulisan', 'Nama penulis'],
                        'answer_index' => 0,
                        'explanation' => 'Penanda wacana menyusun aliran hujah.',
                    ],
                ],
            ],
        ];

        foreach ($extraQuizRows as $index => $quizRow) {
            $quizzes['extra_'.$index] = $this->createQuiz(
                $teacher,
                (int) $quizRow['material']->subject_id,
                (int) $quizRow['material']->language_id,
                $quizRow['material']->id,
                $quizRow['title'],
                $quizRow['questions'],
                now()->subDays(10 - min(6, $index))->addHours($index + 1),
            );
        }

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
            [
                'title' => 'Secondary Mathematics: Why does completing the square reveal the vertex?',
                'content' => 'I can follow the method, but I do not see why the final bracket form shows the turning point.',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDays(6)->addHours(3),
            ],
            [
                'title' => '小学华文：怎样让看图作文的开头更生动？',
                'content' => '我通常只写“有一天”，老师说太普通。可以怎样根据图片写一个更具体的开头？',
                'subject_id' => $chineseSubjectId,
                'language_id' => $chineseId,
                'created_at' => now()->subDays(5)->addHours(4),
            ],
            [
                'title' => 'Bahasa Melayu: Bila perlu guna penanda wacana “selain itu”?',
                'content' => 'Saya selalu guna penanda wacana yang sama. Bagaimana pilih penanda yang sesuai antara isi?',
                'subject_id' => $malaySubjectId,
                'language_id' => $malayId,
                'created_at' => now()->subDays(5)->addHours(7),
            ],
            [
                'title' => 'Secondary Mathematics: How do I tell direct and inverse proportion apart?',
                'content' => 'Both use ratios, so I get confused when the word problem changes. What clue should I look for first?',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDays(4)->addHours(8),
            ],
            [
                'title' => '中学华文：引用名言后要怎样继续分析？',
                'content' => '我会放名言，可是后面常常不知道怎样解释它和论点的关系。',
                'subject_id' => $chineseSubjectId,
                'language_id' => $chineseId,
                'created_at' => now()->subDays(3)->addHours(9),
            ],
            [
                'title' => 'Secondary Mathematics: When should I use a table for probability outcomes?',
                'content' => 'Tree diagrams and tables both work sometimes. Which one is faster for two-step choices?',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDays(2)->addHours(5),
            ],
            [
                'title' => 'Bahasa Melayu: Cara bezakan contoh umum dan contoh khusus',
                'content' => 'Guru kata contoh saya terlalu umum. Apakah beza contoh umum dengan contoh yang kuat?',
                'subject_id' => $malaySubjectId,
                'language_id' => $malayId,
                'created_at' => now()->subDays(2)->addHours(11),
            ],
            [
                'title' => 'Secondary Mathematics: Why does the median ignore extreme values?',
                'content' => 'I know the median is the middle value, but I want to explain why it is better when data has an outlier.',
                'subject_id' => $mathId,
                'language_id' => $englishId,
                'created_at' => now()->subDay()->addHours(2),
            ],
        ])->map(function (array $post, int $index) use ($student, $reviewers) {
            $author = $index % 4 === 0 ? $reviewers[$index % $reviewers->count()] : $student;

            return $this->createQuestion(
                $author,
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
                DB::table('likes')->insert($this->filterColumns('likes', [
                    'user_id' => $reviewer->id,
                    'post_id' => $post->id,
                    'created_at' => now()->subDays(3),
                    'updated_at' => now()->subDays(3),
                ]));
            }
        }

        $commentTargets = [
            $materials['vertex'],
            $materials['factorisation'],
            $materials['graphs'],
            ...array_values($quizzes),
            ...$teacherMediaMaterials->take(12)->all(),
            ...$questionPosts->all(),
            $studentReflection,
        ];

        $commentTemplates = [
            [
                'content' => 'This helped me finish today\'s revision faster. The example is simple enough to copy into my notes.',
                'replies' => [
                    'Same here. I wrote the shortcut beside my formula list.',
                    'The short example is useful because it shows exactly where to start.',
                    'I think this is the part most students will remember before a test.',
                ],
            ],
            [
                'content' => 'I understand the main idea, but I still get confused when the question changes the numbers slightly.',
                'replies' => [
                    'Try changing only one number first, then compare the working line by line.',
                    'That happened to me too. Doing two similar questions together helped.',
                ],
            ],
            [
                'content' => 'Can someone check if my method is correct: I identify the key value first, then substitute it back to verify?',
                'replies' => [
                    'Yes, that is a safe check. The substitution step catches most careless mistakes.',
                    'I would also write the final answer with units or coordinates if the question needs it.',
                    'Good method. It slows you down a little but prevents wrong final answers.',
                ],
            ],
            [
                'content' => 'The explanation is helpful, but one more hard example would make this easier for weaker students.',
                'replies' => [
                    'Agree. A hard example with full working would make the discussion more complete.',
                    'Maybe use an exam-style question so we can see the marking steps too.',
                ],
            ],
            [
                'content' => 'I tried the linked quiz after reading this and got a better score on my second attempt.',
                'replies' => [
                    'Nice. The instant feedback is the part that helped me fix mistakes fastest.',
                    'Same, especially when the explanation points out the exact wrong step.',
                ],
            ],
            [
                'content' => 'This is clear for self-study. I like that the important steps are not hidden inside long paragraphs.',
                'replies' => [
                    'Short notes are easier to revise from during the last few days before exam.',
                    'The layout also makes it easier to discuss in a study group.',
                    'I bookmarked it for quick review later.',
                ],
            ],
            [
                'content' => 'I am not fully convinced by the final step. Shouldn\'t we check the sign before writing the answer?',
                'replies' => [
                    'Yes, checking the sign first is safer. That is where I usually lose marks.',
                    'Good catch. The answer is right, but the sign check should be mentioned clearly.',
                ],
            ],
            [
                'content' => 'The worked step is not quite right for the second case. I think it skips a condition.',
                'replies' => [
                    'I noticed that too. The first case works, but the second needs one extra check.',
                    'A teacher explanation here would be useful before we copy this method.',
                    'Thanks for pointing it out. I nearly used the same shortcut everywhere.',
                ],
            ],
            [
                'content' => 'This question is worth discussing because a small mistake changes the whole answer.',
                'replies' => [
                    'Exactly. It looks easy until the signs start changing.',
                    'The comments here helped more than reading the answer alone.',
                ],
            ],
        ];

        $rootComments = collect();

        foreach ($commentTargets as $targetIndex => $target) {
            $commentsPerPost = $targetIndex < 8 ? 5 : 3;

            for ($offset = 0; $offset < $commentsPerPost; $offset++) {
                $templateIndex = ($targetIndex + $offset) % count($commentTemplates);
                $commentUser = $allDemoUsers[($targetIndex + $offset + 1) % $allDemoUsers->count()];
                $createdAt = now()
                    ->subDays(max(1, 6 - (($targetIndex + $offset) % 6)))
                    ->addHours($offset * 2);

                $rootComment = Comment::query()->create([
                    'user_id' => $commentUser->id,
                    'post_id' => $target->id,
                    'parent_id' => null,
                    'content' => $commentTemplates[$templateIndex]['content'],
                    'attachments' => null,
                    'mentions' => null,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                $rootComments->push($rootComment);

                foreach ($commentTemplates[$templateIndex]['replies'] as $replyIndex => $replyText) {
                    $replyUser = $allDemoUsers[($targetIndex + $offset + $replyIndex + 5) % $allDemoUsers->count()];

                    if ($replyUser->id === $commentUser->id) {
                        $replyUser = $allDemoUsers[($targetIndex + $offset + $replyIndex + 9) % $allDemoUsers->count()];
                    }

                    Comment::query()->create([
                        'user_id' => $replyUser->id,
                        'post_id' => $target->id,
                        'parent_id' => $rootComment->id,
                        'content' => $replyText,
                        'attachments' => null,
                        'mentions' => null,
                        'created_at' => $createdAt->copy()->addMinutes(25 + ($replyIndex * 35)),
                        'updated_at' => $createdAt->copy()->addMinutes(25 + ($replyIndex * 35)),
                    ]);
                }
            }
        }

        $allSeededComments = Comment::query()
            ->whereIn('post_id', collect($commentTargets)->pluck('id'))
            ->get();

        foreach ($allSeededComments as $index => $comment) {
            $voterA = $reviewers[$index % $reviewers->count()];
            $voterB = $reviewers[($index + 4) % $reviewers->count()];
            $voterC = $reviewers[($index + 9) % $reviewers->count()];
            $votedAt = now()->subDays(max(1, 3 - ($index % 3)));

            if ($voterA->id !== $comment->user_id) {
                CommentLike::query()->updateOrCreate(
                    ['user_id' => $voterA->id, 'comment_id' => $comment->id],
                    ['vote' => 1, 'created_at' => $votedAt, 'updated_at' => $votedAt],
                );
            }

            if ($voterB->id !== $comment->user_id) {
                $vote = match (true) {
                    $index % 11 === 0 => -2,
                    $index % 5 === 0 => -1,
                    default => 1,
                };
                CommentLike::query()->updateOrCreate(
                    ['user_id' => $voterB->id, 'comment_id' => $comment->id],
                    [
                        'vote' => $vote,
                        'created_at' => $votedAt->copy()->addMinutes(15),
                        'updated_at' => $votedAt->copy()->addMinutes(15),
                    ],
                );
            }

            if ($comment->parent_id === null && $voterC->id !== $comment->user_id) {
                $vote = match (true) {
                    $index % 9 === 0 => -2,
                    $index % 4 === 0 => -1,
                    default => 1,
                };

                CommentLike::query()->updateOrCreate(
                    ['user_id' => $voterC->id, 'comment_id' => $comment->id],
                    [
                        'vote' => $vote,
                        'created_at' => $votedAt->copy()->addMinutes(45),
                        'updated_at' => $votedAt->copy()->addMinutes(45),
                    ],
                );
            }

            if ($comment->post?->post_type === 'question' && $index % 4 === 0) {
                foreach ($reviewers->take(8) as $offset => $voter) {
                    if ($voter->id === $comment->user_id) {
                        continue;
                    }

                    CommentLike::query()->updateOrCreate(
                        ['user_id' => $voter->id, 'comment_id' => $comment->id],
                        [
                            'vote' => 1,
                            'created_at' => $votedAt->copy()->addMinutes(30 + $offset),
                            'updated_at' => $votedAt->copy()->addMinutes(30 + $offset),
                        ],
                    );
                }
            }
        }

        foreach ($commentTargets as $post) {
            BookmarkItem::query()->create([
                'user_id' => $student->id,
                'post_id' => $post->id,
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ]);
        }

        $feedbackRows = [
            [$student, $materials['vertex'], 1, 5],
            [$reviewers[0], $materials['vertex'], 1, 4],
            [$reviewers[1], $materials['vertex'], 1, 5],
            [$reviewers[2], $materials['factorisation'], -1, 2],
            [$reviewers[3], $materials['factorisation'], -1, 2],
            [$student, $materials['factorisation'], -1, 3],
            [$reviewers[4], $materials['factorisation'], 1, 3],
            [$reviewers[0], $materials['graphs'], 1, 4],
            [$reviewers[1], $materials['graphs'], 1, 4],
            [$reviewers[2], $materials['graphs'], 1, 5],
            [$reviewers[5], $materials['vertex'], 1, 5],
            [$reviewers[6], $materials['factorisation'], -1, 3],
            [$reviewers[7], $materials['graphs'], 1, 4],
            [$reviewers[8], $materials['vertex'], 1, 4],
            [$reviewers[9], $materials['factorisation'], 1, 3],
        ];

        foreach ($feedbackRows as [$user, $material, $vote, $rating]) {
            StudyMaterialFeedback::query()->updateOrCreate(
                ['user_id' => $user->id, 'post_id' => $material->id],
                [
                    'vote' => $vote,
                    'rating' => $rating,
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

        $attemptRows = collect(array_values($quizzes))->flatMap(function (Post $quiz, int $quizIndex) use ($student, $reviewers) {
            $questionsCount = count($quiz->quiz_data['questions'] ?? []);
            $attemptUsers = collect([$student])
                ->merge($reviewers->slice($quizIndex % 5, 8))
                ->values();

            return $attemptUsers->map(function (User $user, int $userIndex) use ($quiz, $quizIndex, $questionsCount) {
                $score = max(1, min($questionsCount, $questionsCount - (($quizIndex + $userIndex) % 3)));
                $createdAt = now()
                    ->subDays(max(1, 8 - ($quizIndex % 7)))
                    ->addHours($userIndex);

                return [$user, $quiz, (float) $score, $score >= max(1, $questionsCount - 1), $createdAt, $questionsCount];
            });
        });

        foreach ($attemptRows as [$user, $quiz, $score, , $createdAt, $questionsCount]) {
            DB::table('material_quiz_attempts')->insert([
                'user_id' => $user->id,
                'post_id' => $quiz->id,
                'material_id' => $quiz->parent_material_id,
                'score' => $score,
                'total_questions' => $questionsCount,
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

        foreach ($reviewers as $index => $reviewer) {
            $answered = 18 + ($index * 3);
            $correct = max(10, $answered - (5 + ($index % 4)));
            $posted = $questionPosts->where('user_id', $reviewer->id)->count();

            UserProgress::query()->create([
                'user_id' => $reviewer->id,
                'total_questions_answered' => $answered,
                'total_questions_posted' => $posted,
                'total_post_posted' => $posted,
                'quizzes_completed' => 6 + ($index % 8),
                'correct_answers_count' => $correct,
                'total_likes_received' => 8 + ($index * 2),
                'quiz_scores' => [55 + ($index % 8), 62 + ($index % 7), 70 + ($index % 6), 78 + ($index % 5)],
                'improvement_score' => 6 + ($index % 12),
                'created_at' => now()->subDays(9),
                'updated_at' => now()->subHours(12 - min(11, $index % 12)),
            ]);
        }

        $this->seedLeaderboard($allDemoUsers, $commentTargets);
        $this->applyMixedPresentationTimeline($materials, $teacherMediaMaterials, collect($quizzes), $questionPosts, $studentReflection);

        $versionRows = [
            [$materials['vertex']->id, 1, $student->id, $materials['vertex']->title, 'Initial version', now()->subDays(18)],
            [$materials['factorisation']->id, 1, $student->id, $materials['factorisation']->title, 'Initial version', now()->subDays(16)],
            [$materials['factorisation']->id, 2, $student->id, $materials['factorisation']->title, 'Updated with examples', now()->subDays(6)],
            [$materials['graphs']->id, 1, $student->id, $materials['graphs']->title, 'Initial version', now()->subDays(12)],
        ];

        foreach ($versionRows as [$postId, $versionNumber, $userId, $title, $changeSummary, $createdAt]) {
            if (! DB::table('posts')->where('id', $postId)->exists()) {
                continue;
            }

            DB::table('study_material_versions')->updateOrInsert([
                'post_id' => $postId,
                'version_number' => $versionNumber,
            ], [
                'post_id' => $postId,
                'user_id' => $userId,
                'version_number' => $versionNumber,
                'title' => $title,
                'content' => 'Content for version '.$versionNumber,
                'change_summary' => $changeSummary,
                'created_at' => $createdAt,
                'updated_at' => now()->subDay(),
            ]);
        }

        $this->trimDemoPosts($allDemoUsers, 20);

        $achievementService = app(AchievementService::class);
        $achievementService->syncUser($student);
        $achievementService->evaluateAchievements($student);
    }

    private function trimDemoPosts(Collection $users, int $limit): void
    {
        $userIds = $users->pluck('id');
        $quotas = ['material' => 7, 'quiz' => 6, 'question' => 7];
        $keepIds = collect();

        foreach ($quotas as $postType => $quota) {
            $keepIds->push(...Post::query()
                ->whereIn('user_id', $userIds)
                ->where('post_type', $postType)
                ->latest('created_at')
                ->limit($quota)
                ->pluck('id'));
        }

        if ($keepIds->count() < $limit) {
            $keepIds->push(...Post::query()
                ->whereIn('user_id', $userIds)
                ->whereNotIn('id', $keepIds)
                ->latest('created_at')
                ->limit($limit - $keepIds->count())
                ->pluck('id'));
        }

        Post::query()
            ->whereIn('user_id', $userIds)
            ->whereNotIn('id', $keepIds->take($limit))
            ->get()
            ->each->delete();

        DB::table('points_transactions')
            ->whereIn('user_id', $userIds)
            ->where('source_type', Post::class)
            ->whereNotIn('source_id', $keepIds->take($limit))
            ->delete();

        foreach ($users as $user) {
            $points = (int) DB::table('points_transactions')->where('user_id', $user->id)->sum('points');
            $questionCount = Post::query()->where('user_id', $user->id)->where('post_type', 'question')->count();

            DB::table('users')->where('id', $user->id)->update([
                'points' => $points,
                'total_points' => $points,
            ]);
            DB::table('user_progress')->where('user_id', $user->id)->update([
                'total_questions_posted' => $questionCount,
                'total_post_posted' => Post::query()->where('user_id', $user->id)->count(),
            ]);
        }
    }

    private function upsertUser(string $email, string $name, string $role): User
    {
        $attributes = $this->filterColumns('users', [
            'name' => $name,
            'password' => Hash::make('password'),
            'role' => $role,
            'email_verified_at' => now(),
            'locale' => 'en',
            'show_on_leaderboard' => true,
            'show_leaderboard_badge' => true,
            'is_verified' => $role === 'teacher',
        ]);

        $user = User::query()->updateOrCreate(
            ['email' => $email],
            $attributes,
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
        $postIds = Schema::hasTable('posts')
            ? Post::query()->whereIn('user_id', $userIds)->pluck('id')->all()
            : [];

        if (Schema::hasTable('study_material_versions')) {
            DB::table('study_material_versions')
                ->whereIn('user_id', $userIds)
                ->when($postIds !== [], fn ($query) => $query->orWhereIn('post_id', $postIds))
                ->delete();
        }
        if (Schema::hasTable('material_quiz_attempts')) {
            DB::table('material_quiz_attempts')
                ->whereIn('user_id', $userIds)
                ->when($postIds !== [], fn ($query) => $query->orWhereIn('post_id', $postIds)->orWhereIn('material_id', $postIds))
                ->delete();
        }
        if (Schema::hasTable('study_material_views')) {
            DB::table('study_material_views')
                ->whereIn('user_id', $userIds)
                ->when($postIds !== [], fn ($query) => $query->orWhereIn('post_id', $postIds))
                ->delete();
        }
        if (Schema::hasTable('study_material_feedback')) {
            StudyMaterialFeedback::query()
                ->whereIn('user_id', $userIds)
                ->when($postIds !== [], fn ($query) => $query->orWhereIn('post_id', $postIds))
                ->delete();
        }
        if (Schema::hasTable('bookmark_items')) {
            BookmarkItem::query()
                ->whereIn('user_id', $userIds)
                ->when($postIds !== [], fn ($query) => $query->orWhereIn('post_id', $postIds))
                ->delete();
        }
        if (Schema::hasTable('likes')) {
            Like::query()
                ->whereIn('user_id', $userIds)
                ->when($postIds !== [], fn ($query) => $query->orWhereIn('post_id', $postIds))
                ->delete();
        }

        if (Schema::hasTable('comments')) {
            $commentIds = Comment::query()
                ->whereIn('user_id', $userIds)
                ->when($postIds !== [], fn ($query) => $query->orWhereIn('post_id', $postIds))
                ->pluck('id')
                ->all();

            if (Schema::hasTable('comment_likes') && $commentIds !== []) {
                CommentLike::query()->whereIn('comment_id', $commentIds)->delete();
            }

            Comment::query()->whereIn('id', $commentIds)->delete();
        }
        if (Schema::hasTable('quiz_attempts')) {
            QuizAttempt::query()
                ->whereIn('user_id', $userIds)
                ->when($postIds !== [], fn ($query) => $query->orWhereIn('post_id', $postIds))
                ->delete();
        }
        if (Schema::hasTable('badge_user')) {
            DB::table('badge_user')->whereIn('user_id', $userIds)->delete();
        }
        if (Schema::hasTable('user_achievements')) {
            DB::table('user_achievements')->whereIn('user_id', $userIds)->delete();
        }
        if (Schema::hasTable('user_progress')) {
            UserProgress::query()->whereIn('user_id', $userIds)->delete();
        }
        if (Schema::hasTable('points_transactions')) {
            DB::table('points_transactions')->whereIn('user_id', $userIds)->delete();
        }
        if (Schema::hasTable('teacher_verification_documents') && Schema::hasTable('teacher_applications')) {
            $applicationIds = DB::table('teacher_applications')->whereIn('user_id', $userIds)->pluck('id');
            DB::table('teacher_verification_documents')->whereIn('teacher_application_id', $applicationIds)->delete();
        }
        if (Schema::hasTable('teacher_applications')) {
            DB::table('teacher_applications')->whereIn('user_id', $userIds)->delete();
        }
        if (Schema::hasTable('users')) {
            DB::table('users')
                ->whereIn('id', $userIds)
                ->update($this->filterColumns('users', [
                    'points' => 0,
                    'total_points' => 0,
                    'updated_at' => now(),
                ]));
        }
        if (Schema::hasTable('posts')) {
            Post::query()->whereIn('user_id', $userIds)->delete();
        }
    }

    private function seedTeacherVerificationRecords(Collection $users): void
    {
        if (! Schema::hasTable('teacher_applications')) {
            return;
        }

        $teachers = $users
            ->filter(fn (User $user) => ($user->role ?? 'student') === 'teacher')
            ->values();

        foreach ($teachers as $index => $teacher) {
            $createdAt = now()->subDays(32 - min($index, 10));
            $documentPath = "teacher-verification/demo/{$teacher->id}/teaching-certificate.pdf";

            Storage::disk('local')->put(
                $documentPath,
                $this->fakeVerificationPdfContent($teacher, 'Teaching Certificate'),
            );

            $applicationId = DB::table('teacher_applications')->insertGetId($this->filterColumns('teacher_applications', [
                'user_id' => $teacher->id,
                'qualification' => 'Bachelor of Education with classroom teaching experience',
                'bio' => 'Demo teacher account seeded for presentation. Applicant agreed to teacher responsibilities and content quality guidelines.',
                'reason' => 'Demo teacher verification application for seeded learning materials.',
                'status' => 'approved',
                'admin_note' => 'Approved for demo data so teacher material and verification flows are visible.',
                'created_at' => $createdAt,
                'updated_at' => $createdAt->copy()->addHours(2),
            ]));

            if (! (bool) ($teacher->is_verified ?? false) || ! Schema::hasTable('teacher_verification_documents')) {
                continue;
            }

            $documents = [
                [
                    'path' => $documentPath,
                    'original_name' => 'teaching-certificate.pdf',
                    'verification_notes' => 'Fake certificate file added for demo verification flow.',
                ],
                [
                    'path' => "teacher-verification/demo/{$teacher->id}/education-degree.pdf",
                    'original_name' => 'education-degree.pdf',
                    'verification_notes' => 'Fake degree file added for certified demo teacher.',
                ],
            ];

            foreach ($documents as $docIndex => $document) {
                Storage::disk('local')->put(
                    $document['path'],
                    $this->fakeVerificationPdfContent($teacher, $document['original_name']),
                );

                DB::table('teacher_verification_documents')->insert($this->filterColumns('teacher_verification_documents', [
                    'teacher_application_id' => $applicationId,
                    'path' => $document['path'],
                    'original_name' => $document['original_name'],
                    'status' => 'verified',
                    'verification_notes' => $document['verification_notes'],
                    'verified_at' => $createdAt->copy()->addHours(4 + $docIndex),
                    'created_at' => $createdAt->copy()->addMinutes(10 + $docIndex),
                    'updated_at' => $createdAt->copy()->addHours(4 + $docIndex),
                ]));
            }
        }
    }

    private function fakeVerificationPdfContent(User $teacher, string $documentTitle): string
    {
        $lines = [
            'Demo Teacher Verification Document',
            'Document: '.$documentTitle,
            'Teacher: '.$teacher->name,
            'Email: '.$teacher->email,
        ];
        $text = implode(' | ', array_map(
            fn (string $line) => str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $line),
            $lines,
        ));

        $stream = "BT /F1 12 Tf 72 720 Td ({$text}) Tj ET\n";

        return "%PDF-1.4\n"
            ."1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
            ."2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
            ."3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
            .'4 0 obj << /Length '.strlen($stream)." >> stream\n"
            .$stream
            ."endstream endobj\n"
            ."5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
            ."trailer << /Root 1 0 R >>\n%%EOF\n";
    }

    private function createQuestion(
        User $author,
        int $subjectId,
        int $languageId,
        string $title,
        string $content,
        $createdAt,
    ): Post {
        return Post::query()->create($this->filterColumns('posts', [
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
            'material_improved_from_feedback' => false,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]));
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
    ): Post {
        return Post::query()->create($this->filterColumns('posts', [
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
            'material_improved_from_feedback' => $improvedFromFeedback,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]));
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
        return Post::query()->create($this->filterColumns('posts', [
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
            'material_improved_from_feedback' => false,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]));
    }

    private function seedLeaderboard(Collection $users, array $sourcePosts): void
    {
        if (! Schema::hasTable('points_transactions')) {
            return;
        }

        $actions = [
            'question_asked',
            'answer_posted',
            'question_upvoted',
            'answer_upvoted',
            'best_answer_marked',
            'resource_bookmarked',
            'follower_gained',
        ];

        $rankPoints = [
            420, 385, 360, 330, 305, 286, 268, 244, 228, 210, 196, 184, 172, 160,
            148, 136, 126, 116, 106, 98, 90, 82, 74, 66, 58, 50, 44, 38,
        ];

        $sourceIds = collect($sourcePosts)->pluck('id')->filter()->values();
        $now = now();

        foreach ($users->values() as $index => $user) {
            $targetPoints = $rankPoints[$index] ?? max(20, 120 - ($index * 4));
            $remaining = $targetPoints;
            $transactionNumber = 0;

            while ($remaining > 0) {
                $points = min($remaining, [15, 10, 8, 5, 3, 2][($index + $transactionNumber) % 6]);
                $createdAt = $now
                    ->copy()
                    ->subDays(($index + $transactionNumber) % 12)
                    ->subHours(($transactionNumber * 3) % 20);

                DB::table('points_transactions')->insert([
                    'user_id' => $user->id,
                    'points' => $points,
                    'action' => $actions[($index + $transactionNumber) % count($actions)],
                    'source_type' => Post::class,
                    'source_id' => $sourceIds->isNotEmpty()
                        ? $sourceIds[($index + $transactionNumber) % $sourceIds->count()]
                        : $user->id,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                $remaining -= $points;
                $transactionNumber++;
            }

            DB::table('users')
                ->where('id', $user->id)
                ->update($this->filterColumns('users', [
                    'points' => $targetPoints,
                    'total_points' => $targetPoints,
                    'updated_at' => $now,
                ]));
        }

        foreach (['all_time', 'weekly', 'monthly'] as $period) {
            Cache::forget("leaderboard.{$period}.top-50");
        }

        Cache::forget('leaderboard.titles.all-time.top-three');
    }

    private function applyMixedPresentationTimeline(
        array $materials,
        Collection $teacherMediaMaterials,
        Collection $quizzes,
        Collection $questionPosts,
        Post $studentReflection,
    ): void {
        $materialsPool = collect($materials)->values()->merge($teacherMediaMaterials)->values();
        $quizzesPool = $quizzes->values();
        $questionsPool = $questionPosts->push($studentReflection)->values();
        $timeline = collect();
        $pattern = ['material', 'question', 'quiz', 'question', 'material'];

        while ($materialsPool->isNotEmpty() || $questionsPool->isNotEmpty() || $quizzesPool->isNotEmpty()) {
            foreach ($pattern as $type) {
                $post = match ($type) {
                    'material' => $materialsPool->shift(),
                    'quiz' => $quizzesPool->shift(),
                    default => $questionsPool->shift(),
                };

                if ($post instanceof Post && ! $timeline->contains('id', $post->id)) {
                    $timeline->push($post);
                }
            }
        }

        $timeline = $timeline->unique('id')->values();

        $timeline->values()->each(function (Post $post, int $index) {
            $createdAt = now()
                ->copy()
                ->subDays(1)
                ->subHours($index * 4)
                ->addMinutes(($index % 5) * 7);

            $post->forceFill([
                'created_at' => $createdAt,
                'updated_at' => $createdAt->copy()->addHours(2 + ($index % 4)),
            ])->save();
        });
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function filterColumns(string $table, array $values): array
    {
        if (! isset($this->columnCache[$table])) {
            $this->columnCache[$table] = Schema::hasTable($table)
                ? Schema::getColumnListing($table)
                : [];
        }

        if ($this->columnCache[$table] === []) {
            return [];
        }

        return array_intersect_key($values, array_flip($this->columnCache[$table]));
    }
}
