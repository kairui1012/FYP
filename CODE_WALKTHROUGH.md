# JomStudy — 代码导览 (Code Walkthrough for Presentation)

> 这份文档专门给答辩时 **"指着代码讲"** 用。每个文件标了：📁 路径 → 🎯 做什么 → ⭐ 为什么重要 → 💬 可以怎么讲。
> 项目根目录：`FYP/finalyearproject/`

---

## 🗺️ 先讲整体架构（开场 30 秒）

> "我用的是 **Laravel + Inertia.js + React** 的单体架构。请求进来先经过 **路由 (routes)**，路由把请求交给 **控制器 (Controller)**，控制器负责验证和编排，真正的业务逻辑我抽到了 **服务层 (Services)**，数据通过 **模型 (Models)** 存取，最后 Inertia 把数据当作 props 直接渲染成 **React 页面**。"

请求流向一句话：
```
routes/web.php  →  Controller  →  Service (业务逻辑)  →  Model  →  数据库
                                                    ↘  Inertia::render() → React 页面 (resources/js/pages)
```

**为什么这样设计值得讲**：控制器很薄、逻辑在服务层 → 可测试、可复用、职责单一（这是软件工程的加分点）。

---

## 1️⃣ 路由层 (Routes) — 系统的"地图"

### 📁 `routes/web.php`
- 🎯 定义所有页面 URL 和它们对应的控制器方法。
- ⭐ **为什么重要**：一打开就能看到整个系统有哪些功能。注意几个 **中间件分组**：
  - `middleware(['auth', 'verified'])` → 登录且验证邮箱才能访问主要功能。
  - `middleware(['auth', 'admin'])->prefix('admin')` → **管理后台的权限墙**。
- 💬 可以讲："你看这一行 `Route::middleware(['auth','admin'])`，这就是我用中间件做的权限隔离——普通用户连 admin 的路由都进不来。"

### 📁 `routes/callAI.php` ⭐⭐（项目亮点，重点讲）
- 🎯 把所有 **AI 接口** 单独抽成一个文件：`/ai-explain`、`/ai-material-quiz`、`/ai-quiz-options`、`/ai-best-answer`、`/ai-doubt-clarify`、`/ai-validate-wrong`、`/translate`。
- ⭐ **为什么重要**：这是我整个项目的创新核心，单独成文件方便维护。
- 💬 可以讲："我把 AI 功能独立成一个路由文件，因为它是我的创新点，也方便和普通业务逻辑解耦。"

---

## 2️⃣ 控制器层 (Controllers) — "薄"的协调者

### 📁 `app/Http/Controllers/PostController.php` ⭐（最核心的控制器）
- 🎯 处理帖子的浏览：主页 `index()`、问题 `questions()`、学习资料 `learningMaterials()`、详情 `show()`。
- ⭐ **为什么重要**：注意它的构造函数 **注入了 5 个 Service**：
  ```php
  public function __construct(
      private MaterialVersionService $materialVersionService,
      private PostQueryBuilder $queryBuilder,
      private PostSerializationService $serializationService,
      private LearningProgressService $learningProgressService,
      private PointsService $pointsService,
  ) {}
  ```
- 💬 可以讲："控制器本身很薄，它不写复杂逻辑，而是 **依赖注入** 一堆 Service 来干活。比如 `questions()` 只是调用 `renderHomePage($request, ['question','quiz'])` —— 复用同一套逻辑，只是换了过滤条件。这就是我说的职责分离。"

### 📁 `app/Http/Controllers/PostCreateController.php` ⭐（权限+校验的好例子）
- 🎯 处理发帖 (`store`)。
- ⭐ **为什么重要**：里面有 **教师权限校验** 和 **测验数据校验**：
  ```php
  if ($isStudyMaterial && ! $user->canPublishStudyMaterials()) {
      throw ValidationException::withMessages([
          'post_type' => 'Only admins and teachers can publish Study Materials.',
      ]);
  }
  ```
  以及测验题必须每个选项都填、答案下标有效，否则报错。
- 💬 可以讲："发学习资料时我在后端校验角色，**不能只靠前端隐藏按钮**——前端能绕过，后端这一层才是真正的安全边界。"

### 📁 `app/Http/Controllers/AdminController.php`
- 🎯 后台：用户管理、举报处理、教师申请审核。
- 💬 可以讲："这是管理员的控制中心，配合 `admin` 中间件保证只有管理员能用。"

---

## 3️⃣ 服务层 (Services) — 真正的业务逻辑 ⭐⭐（最值得展示的部分）

> 答辩 tip：如果评委问"你的代码哪里体现工程能力"，**直接翻到 Services 文件夹**。

### 📁 `app/Services/PointsService.php` ⭐⭐（强烈推荐重点讲）
- 🎯 游戏化的积分引擎。顶部一张 **积分规则表**：
  ```php
  private const POINTS = [
      'question_asked' => 2,   'answer_posted' => 5,
      'answer_upvoted' => 10,  'best_answer_marked' => 15,
      'content_downvoted' => -2, ...
  ];
  ```
- ⭐ **三个值得讲的设计点**：
  1. **防刷分**：`netPointsFor()` 会查 `points_transactions` 表，**同一个来源同一个动作只算一次**——你不能反复点赞同一个帖子刷分。
  2. **可撤销**：有 `award()` 也有 `revoke()`，取消点赞会把积分扣回去，保证数据一致。
  3. **并发安全 + 事务**：用了 `DB::transaction()` 和 `lockForUpdate()`，防止两个请求同时加分导致数字算错。
- 💬 可以讲："积分不是简单地 `+1`。我用一张 **交易流水表 (points_transactions)** 记录每一笔，这样既能防刷分（同一来源只记一次），又能撤销，还能并发安全。这是参考了 **会计记账** 的思路——只增记录、不直接改总数。"

### 📁 `app/Services/AchievementService.php` ⭐
- 🎯 成就系统。`evaluateAchievements()` 里用 **真实数据库统计** 判断是否解锁：
  ```php
  'quiz_master'   => $progress->correct_answers_count >= 20,
  'high_accuracy' => $totalAnswered >= 5 && $accuracyRate >= 80.0,
  'mistake_hunter'=> $mistakesReviewed >= 5,
  ```
- ⭐ **为什么重要**：成就是 **按当下真实数据算出来的**，不是手动发的，杜绝作弊。
- 💬 可以讲："成就条件全部基于真实统计——答对题数、正确率、复习错题数——系统自动解锁，公平透明。"

### 📁 `app/Services/PostQueryBuilder.php` ⭐（链式查询，代码很漂亮）
- 🎯 构建帖子列表查询，用 **链式调用 (fluent interface)**：
  ```php
  $this->queryBuilder
      ->withStandardRelations()   // 预加载作者、科目、语言
      ->withStandardCounts()      // 点赞数、评论数、收藏数
      ->withUserFlags($userId)    // 当前用户有没有点赞/收藏
      ->excludeBlockedUsers()     // 排除被封禁用户
      ->filterByPostType($type);  // 按类型过滤
  ```
- ⭐ **为什么重要**：解决了 **N+1 查询问题**（用 `with()` 预加载关联），性能好；而且每个过滤条件是一个独立方法，可读性高、可组合。
- 💬 可以讲："这个类用链式写法，每个方法负责一件事，组合起来构建复杂查询。我特意用 `with()` 预加载关联数据，避免 N+1 查询拖慢列表加载。"

### 📁 `app/Services/MaterialVersionService.php` ⭐（论文 Objective 3）
- 🎯 学习资料的 **版本快照**：教师按学生反馈改进资料时，存一份历史版本。
- 💬 可以讲："学生反馈 → 教师改进 → 系统自动存版本快照，形成教学内容的持续迭代闭环。这对应我论文的目标三。"

### 📁 `app/Services/LeaderboardTitleService.php`
- 🎯 排行榜前三名的称号 (champion/runner_up/third_place)，结果 **缓存 5 分钟** (`Cache::remember`)。
- 💬 可以讲："排行榜计算成本高，所以我加了缓存，5 分钟刷新一次，减轻数据库压力。"

### 其它服务
- `PostSerializationService` — 把 Post 模型整理成前端需要的 JSON 格式。
- `LearningProgressService` / `ProgressService` — 计算学习进度、正确率、进步分。

---

## 4️⃣ AI 集成 — 怎么调用大模型 ⭐⭐

### 📁 `routes/callAI.php` 里的 `/ai-explain`（建议拿这个当例子讲）
- 🎯 学生做错测验题后，AI 解释为什么错。
- ⭐ **三个值得讲的工程细节**：
  1. **精心设计的 Prompt**：我明确要求 AI "不要盲目相信出题人的答案"，如果 AI 答案和出题人不一致要 **指出分歧**：
     ```php
     "6. If your answer differs from the creator's, explicitly detect the disagreement.\n"
     "7. Do NOT blindly trust the creator's answer.\n"
     ```
  2. **强制 JSON 输出 + 容错解析**：要求 AI 只返回 JSON，并写了 `$decodeAnalysis()` 来处理 AI 偶尔多输出的 ```` ```json ```` 代码块，提取出干净的 JSON。
  3. **多语言**：根据当前界面语言，让 AI 用中/马来/英回答。
- 💬 可以讲："调 AI 最难的不是调用，而是 **让输出稳定可用**。我做了三件事：写结构化 prompt 强制它返回固定 JSON 字段；写容错解析兜底它偶尔不听话；还让它能 **挑战出题人的答案**——这避免了'老师出错题、AI 跟着错'。"

### 📁 `/translate`
- 🎯 把界面文本批量发给 AI 实时翻译，实现动态三语界面。
- 💬 可以讲："我没有为每个语言手写翻译文件，而是用 AI 动态翻译，扩展新语言几乎零成本。"

---

## 5️⃣ 数据模型 (Models) 与数据库 (Migrations)

### 📁 `app/Models/Post.php` ⭐
- 🎯 帖子模型，定义了 `post_type`（material/question/quiz）、关联关系、JSON 字段转换 (`content_blocks`、`quiz_data` 自动转数组)。
- 💬 可以讲："我用一张 posts 表 + `post_type` 字段统一了三种内容，避免建三张结构几乎一样的表——这叫 **单表继承** 的思路。"

### 📁 `database/migrations/`
- 🎯 数据库结构的版本控制，每个文件是一次结构变更。
- ⭐ **为什么重要**：可以指着文件名讲演进，比如：
  - `..._create_posts_table.php` — 帖子主表
  - `..._create_badges_achievements_user_progress_and_points_transactions_tables.php` — 游戏化四张表
  - `..._convert_discussion_posts_to_question_posts.php` — 体现我 **迭代重构** 过（把讨论帖改成问题帖）
- 💬 可以讲："用 migration 管理数据库，任何人 clone 代码后一条命令就能重建整个数据库结构，团队协作和部署都很方便。"

### 📁 `app/Http/Middleware/AdminMiddleware.php`
- 🎯 检查用户是不是 admin，不是就拦截。在 `bootstrap/app.php` 里注册为 `'admin'` 别名。
- 💬 可以讲："权限控制我用中间件实现，在请求进控制器 **之前** 就拦掉，控制器里就不用重复写权限判断了。"

---

## 6️⃣ 前端 (React + Inertia)

### 📁 `resources/js/pages/`
- 🎯 每个 `.tsx` 文件对应一个页面：`HomePage.tsx`、`PostContent.tsx`(帖子详情)、`Leaderboard.tsx`、`CreatePostPage.tsx`、`admin/*` 等。
- ⭐ **为什么重要**：控制器里 `Inertia::render('HomePage', [...])` 的第一个参数，就对应这里的文件名。
- 💬 可以讲："后端 `Inertia::render('HomePage', $data)` 直接把数据当 props 传给这个 React 组件，**不用我手写 API 和 fetch**，这是 Inertia 最大的好处——前后端一体但又用现代 React 写界面。"

---

## 🎤 答辩时的"代码讲解"建议路线（按这个顺序翻文件）

1. **`routes/web.php`** — "这是整个系统的地图，注意这些中间件分组就是权限控制。"
2. **`PostController.php`** — "控制器很薄，靠依赖注入调用服务层。"
3. **`PointsService.php`** — "重点看这里：积分引擎，防刷分、可撤销、并发安全。"（最能体现工程能力）
4. **`routes/callAI.php` 的 ai-explain** — "AI 集成的核心，看我怎么让输出稳定、还能挑战出题人。"（最能体现创新）
5. **`PostQueryBuilder.php`** — "链式查询 + 预加载解决 N+1，性能优化。"
6. **`resources/js/pages/HomePage.tsx`** — "后端数据通过 Inertia 直接渲染成 React 页面。"

> 万能话术：**"这个文件负责 X，我把它单独抽出来是为了 Y（职责分离/复用/安全/性能），你可以看这一段代码……"**
