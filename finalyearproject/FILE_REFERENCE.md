# JomStudy — 文件级详细说明文档 (File Reference)

> 本文档逐个介绍项目里 **自己写的、有实际作用** 的文件：它在哪、做什么、里面有什么。
> 已**跳过**：`vendor/`、`node_modules/`、Laravel/Inertia 框架自带且未改动的样板、自动生成的 `resources/js/routes/`、`resources/js/actions/`、`resources/js/wayfinder/`（这些是 Laravel Wayfinder 根据后端路由自动生成的 TS 路由助手，不用手写）、以及 37 个 `resources/js/components/ui/`（shadcn/ui 现成组件库）。
>
> 项目名：**JomStudy**（在线学习社区 + AI 辅助）。技术栈：Laravel 12 + Inertia.js + React/TypeScript + Vite + DeepSeek/Gemini AI。

---

# 目录

- [一、项目根目录配置文件](#一项目根目录配置文件)
- [二、后端入口与引导 (bootstrap / public)](#二后端入口与引导)
- [三、配置 (config/)](#三配置-config)
- [四、路由 (routes/)](#四路由-routes)
- [五、数据模型 (app/Models/)](#五数据模型-appmodels)
- [六、控制器 (app/Http/Controllers/)](#六控制器-apphttpcontrollers)
- [七、服务层 (app/Services/)](#七服务层-appservices)
- [八、中间件 (app/Http/Middleware/)](#八中间件-apphttpmiddleware)
- [九、表单请求 / Jobs / Concerns / Actions / Providers](#九其余后端)
- [十、数据库 (database/)](#十数据库-database)
- [十一、前端入口与全局 (resources/js 根)](#十一前端入口与全局)
- [十二、前端页面 (resources/js/pages/)](#十二前端页面)
- [十三、前端布局 (layouts/)](#十三前端布局)
- [十四、前端组件 (components/)](#十四前端组件)
- [十五、前端 lib / hooks / types](#十五前端-lib--hooks--types)
- [十六、多语言 (lang/)](#十六多语言)
- [十七、视图与样式 (views / css)](#十七视图与样式)

---

# 一、项目根目录配置文件

| 文件 | 作用 |
|---|---|
| `composer.json` | PHP 依赖清单。关键依赖：`laravel/framework`(框架)、`inertiajs/inertia-laravel`(前后端桥接)、`laravel/fortify`(认证)、`laravel/socialite`(第三方登录,如 Google)、`erag/laravel-lang-sync-inertia`(多语言同步)。 |
| `package.json` | 前端依赖清单（React、Inertia、Vite、TailwindCSS、react-hot-toast 等）和 npm 脚本（`dev`/`build`）。 |
| `vite.config.ts` | Vite 构建配置：定义入口 `app.tsx`/`ssr.tsx`，配置 React 插件、TailwindCSS、Laravel 插件、路径别名 `@`。 |
| `tsconfig.json` | TypeScript 编译配置（含 `@/*` 路径别名指向 `resources/js`）。 |
| `eslint.config.js` / `.prettierrc` / `.prettierignore` | 代码风格检查与格式化规则。 |
| `pint.json` | Laravel Pint（PHP 代码格式化）配置。 |
| `components.json` | shadcn/ui 组件库配置（生成 UI 组件用）。 |
| `phpunit.xml` | PHPUnit/Pest 测试配置（测试数据库、环境变量）。 |
| `.env` / `.env.example` | 环境变量：数据库连接、`APP_NAME=jomstudy`、`DEEPSEEK_API_KEY`、Google OAuth、邮件等。`.env.example` 是给别人参考的模板。 |
| `artisan` | Laravel 命令行入口（`php artisan ...`）。 |
| `.editorconfig` / `.gitattributes` / `.gitignore` / `.npmrc` | 编辑器、git、npm 的通用配置（框架自带，无需改）。 |
| `Dockerfile`（如有） | 容器化部署配置（git log 显示后期加入）。 |

---

# 二、后端入口与引导

| 文件 | 作用 |
|---|---|
| `public/index.php` | **整个应用的 HTTP 入口**，所有请求先到这里，再交给 Laravel 内核。 |
| `bootstrap/app.php` | **应用引导核心**。注册路由文件、注册中间件别名（如 `'admin' => AdminMiddleware`）、把自定义中间件 `HandleInertiaRequests`、`HandleAppearance`、`SetLocale`、`EnsureUserNotBlocked` 挂到 web 中间件组、配置异常处理。 |
| `bootstrap/providers.php` | 注册服务提供者（`AppServiceProvider`、`FortifyServiceProvider`）。 |
| `bootstrap/cache/` | 框架缓存目录（自动生成，不用管）。 |

---

# 三、配置 (config/)

> 大多是 Laravel 标准配置文件。**项目相关重点**：

| 文件 | 作用 |
|---|---|
| `config/services.php` | ⭐ 第三方服务密钥：**DeepSeek API**、**Gemini API**、**Google OAuth**。AI 功能从这里读 key。 |
| `config/fortify.php` | 认证功能开关：注册、重置密码、邮箱验证、**双因素认证 2FA** 等启用哪些。 |
| `config/inertia.php` | Inertia 配置（SSR 服务端渲染开关、根模板）。 |
| `config/inertia-lang.php` | 多语言与 Inertia 集成的配置（哪些 lang 文件同步给前端）。 |
| `config/auth.php` | 认证守卫、用户模型、密码重置配置。 |
| `config/database.php` | 数据库连接（项目用 **SQLite**：`database/database.sqlite`）。 |
| `config/filesystems.php` | 文件存储磁盘（上传的教师认证文件、附件存哪）。 |
| `config/mail.php` | 邮件发送配置（邮箱验证、密码重置邮件）。 |
| `config/queue.php` | 队列驱动（举报审核 Job 走队列）。 |
| `config/cache.php` / `session.php` / `logging.php` / `app.php` | 缓存、会话、日志、应用基础配置（基本是标准的）。 |

---

# 四、路由 (routes/)

| 文件 | 作用 |
|---|---|
| `routes/web.php` | ⭐ **主路由表**，系统的"地图"。定义：首页/登录跳转、`auth+verified` 保护的主功能（帖子浏览/详情/评论/点赞/收藏/测验/关注/排行榜/成就/收藏夹/搜索等）、Google 登录回调、`auth+admin` 保护的**管理后台**全部路由、教师申请提交、隐私政策/条款/sitemap。文件末尾 `require` 引入 `callAI.php` 和 `settings.php`。 |
| `routes/callAI.php` | ⭐⭐ **所有 AI 接口**（全部 `auth` 保护）：`/translate`(界面实时翻译)、`/ai-explain`(讲解错题)、`/ai-quiz-options`(教师出题自动生成选项)、`/ai-material-quiz`(从资料生成测验)、`/ai-best-answer`(理解最佳答案)、`/ai-doubt-clarify`(针对性解惑)、`/ai-validate-wrong`(验证学生"答案是错的"的推理)。每个接口内含 prompt 构造 + 调 DeepSeek/Gemini + JSON 容错解析。 |
| `routes/settings.php` | 用户设置区路由：个人资料、密码、外观(主题)、双因素认证、教师认证上传。 |
| `routes/console.php` | Artisan 命令行自定义命令（基本是默认的）。 |

---

# 五、数据模型 (app/Models/)

> 每个模型对应一张数据库表，定义可填充字段 (`$fillable`)、字段类型转换 (`$casts`)、以及表与表之间的**关联关系**。

### 用户与社交
| 文件 | 对应表 | 关键内容 |
|---|---|---|
| `User.php` | `users` | ⭐ 核心用户模型。字段含 `role`(角色)、`total_points`(总积分)、`is_blocked`、`is_verified`、`show_on_leaderboard` 等。关联：帖子、评论、点赞、收藏夹、**关注/粉丝**(following/followers)、徽章、进度、成就、积分流水。含 `canPublishStudyMaterials()` 判断能否发学习资料（teacher/admin）。 |
| `Profile.php` | `profiles` | 用户扩展资料（简介 bio、头像等），与 User 一对一。 |
| `SocialAccount.php` | `social_accounts` | 第三方登录账号绑定（Google），存 provider、avatar 等。 |

### 内容（帖子体系）
| 文件 | 对应表 | 关键内容 |
|---|---|---|
| `Post.php` | `posts` | ⭐ 核心内容模型。`post_type`(material/question/quiz)、`content_blocks`/`quiz_data`/`image`(JSON自动转数组)、`is_anonymous`、`parent_material_id`。关联：作者、评论、点赞、收藏、语言/科目/课程、**关联测验**(linkedQuizzes)、**资料反馈/浏览/版本/测验记录**。 |
| `Comment.php` | `comments` | 评论/回答。支持嵌套回复(parent/replies)、多种投票(votes/upvotes/downvotes/**wrongvotes**)。 |
| `CommentLike.php` | `comment_likes` | 评论的投票记录（赞/踩/标记错误）。 |
| `Like.php` | `likes` | 帖子点赞记录。 |
| `Language.php` | `languages` | 语言分类（en/zh/my）。 |
| `Subject.php` | `subjects` | 科目分类，含 lessons 关联。 |
| `Lesson.php` | `lessons` | 课程/学习路径节点，可由某个 material 帖子生成(sourcePost)。 |

### 测验与学习材料
| 文件 | 对应表 | 关键内容 |
|---|---|---|
| `QuizCompletion.php` | `quiz_completions` | 测验完成记录（得分、科目）。 |
| `QuizAttempt.php` | `quiz_mistakes` | ⭐ 注意表名是 `quiz_mistakes`——**做错的题**，供复习。 |
| `MaterialQuizAttempt.php` | `material_quiz_attempts` | 针对学习资料的测验尝试（含总题数、对错）。 |
| `StudyMaterialFeedback.php` | `study_material_feedback` | 学生对学习资料的反馈（哪里不懂）。 |
| `StudyMaterialView.php` | `study_material_views` | 资料浏览记录（谁看过）。 |
| `StudyMaterialVersion.php` | `study_material_versions` | ⭐ 资料的**历史版本快照**（教师按反馈改进后留档）。 |

### 游戏化
| 文件 | 对应表 | 关键内容 |
|---|---|---|
| `Badge.php` | `badges` | 徽章定义（达到积分门槛解锁）。 |
| `UserFeaturedBadge.php` | `user_featured_badges` | 用户在主页**精选展示**的徽章。 |
| `Achievement.php` | `achievements` | 成就定义（key/类别/门槛）。 |
| `UserAchievement.php` | `user_achievements` | 用户已解锁的成就。 |
| `UserProgress.php` | `user_progress` | ⭐ 用户学习进度统计（答题数、正确数、获赞数、进步分），含 `accuracyRate()` 算正确率。 |
| `PointTransaction.php` | `points_transactions` | ⭐ 积分流水（每加/扣一笔积分都记一条，`source()` 多态关联到来源对象）。 |

### 收藏与举报与教师申请
| 文件 | 对应表 | 关键内容 |
|---|---|---|
| `BookmarkFolder.php` | `bookmark_folders` | 收藏夹。关联 items 和 posts。 |
| `BookmarkItem.php` | `bookmark_items` | 收藏的具体条目（某帖子在某文件夹）。 |
| `CommentReport.php` | `comment_reports` | 评论举报（含审核字段）。 |
| `PostReport.php` | `post_reports` | 帖子举报。 |
| `TeacherApplication.php` | `teacher_applications` | 教师申请（资历、简介、状态 pending/approved/rejected）。 |
| `TeacherVerificationDocument.php` | `teacher_verification_documents` | 教师认证文件（学位证等，含审核状态）。 |

---

# 六、控制器 (app/Http/Controllers/)

> 控制器负责：接收请求 → 验证 → 调用服务层/模型 → 返回 Inertia 页面或 JSON。本项目控制器普遍"薄"，复杂逻辑在 Services 里。

### 内容浏览与帖子
| 文件 | 方法与作用 |
|---|---|
| `PostController.php` ⭐ | 帖子的浏览核心。`index()`主页信息流、`questions()`只看问题、`learningMaterials()`只看资料、`categories()`分类浏览、`show()`帖子详情、`update()`编辑、`destroy()`删除、`learningOverview()`返回学习总览JSON。构造函数注入 5 个 Service。 |
| `PostCreateController.php` ⭐ | `create()`渲染发帖页(带科目/语言/可链接的资料列表)；`store()`发帖：校验三种类型、**教师权限校验**、组装 quiz_data、加积分。 |
| `PostPopularController.php` | `index()` 热门帖子页（按互动量排序）。 |
| `PostQuizController.php` | `completeLesson()`标记学完资料、`completeQuiz()`提交测验记成绩、记录错题、加积分。 |
| `SearchController.php` | `search()` 搜索帖子，返回 JSON。 |
| `ProfilePageController.php` | `show()`个人主页(帖子/徽章/成就/统计)、`update()`更新资料。 |
| `AchievementsController.php` | `index()` 成就页（同步并展示用户成就、徽章、进度）。 |
| `LeaderboardController.php` | `index()`排行榜；`toggleVisibility()`是否上榜、`toggleTitleBadge()`是否显示称号（隐私开关）。 |

### 互动（评论/点赞/收藏/关注/举报）
| 文件 | 方法与作用 |
|---|---|
| `CommentController.php` | `store()`发评论/回答(加积分)、`update()`编辑、`destroy()`删除。 |
| `CommentLikeController.php` | `toggle()` 给评论投票（赞/踩/标记错误），联动积分。 |
| `CommentReportController.php` | `store()` 举报评论 → 派发审核 Job。 |
| `LikeController.php` | `toggle()` 帖子点赞/取消(联动积分)；含一组 RESTful 方法(index/store/show…)。 |
| `PostReportController.php` | `store()` 举报帖子 → 派发审核 Job。 |
| `FollowerController.php` | `toggle()`关注/取关(给被关注者加积分)、`index()`关注动态页。 |
| `PostBookmarkController.php` | `index()` 收藏夹页面（学习文件夹）。 |
| `PostBookmarkToggleController.php` | `toggle()` 收藏/取消收藏某帖子。 |
| `BookmarkFolderController.php` | 收藏夹管理：`store()`建、`update()`改名、`destroy()`删、`movePost()`移动帖子到别的夹子。 |
| `UserFeaturedBadgeController.php` | `update()` 设置主页精选展示的徽章。 |

### 学习材料（反馈/洞察）
| 文件 | 方法与作用 |
|---|---|
| `StudyMaterialFeedbackController.php` | `store()`提交资料反馈、`destroy()`撤回反馈。 |
| `TeacherMaterialInsightsController.php` | `index()` 教师查看自己资料的数据洞察（浏览/反馈/测验表现/低分资料/常错题）。 |

### 认证与设置
| 文件 | 方法与作用 |
|---|---|
| `Auth/GoogleAuthController.php` | `redirectToProvider()`跳转Google、`handleProviderCallback()`处理回调、建/绑账号。 |
| `Settings/ProfileController.php` | `edit()/update()/destroy()` 个人资料设置与注销账号。 |
| `Settings/PasswordController.php` | `edit()/update()` 修改密码。 |
| `Settings/TwoFactorAuthenticationController.php` | `show()` 双因素认证设置页。 |
| `Settings/TeacherCertificationController.php` | `show()/store()` 上传教师认证文件、`viewDocument()`查看文件。 |
| `LocaleController.php` | `switchMethod()` 切换界面语言。 |

### 管理后台
| 文件 | 方法与作用 |
|---|---|
| `AdminController.php` ⭐ | 后台总控：`users()`用户列表、`updateUserRole()`改角色、`toggleBlock()`封禁；`reports()`举报列表、`deleteReportedPost()/deleteReportedComment()`删违规内容、`deleteCommentReport()/deletePostReport()`忽略举报；`teacherApplications()`教师申请列表、`approveApplication()/rejectApplication()`审批、`toggleVerification()`、`downloadVerificationDocument()`下载证件。 |

### 基类与复用 Trait
| 文件 | 作用 |
|---|---|
| `Controller.php` | 所有控制器的抽象基类（框架样板）。 |
| `Concerns/HandlesPostComments.php` | Trait：评论相关的可复用逻辑（被多个控制器 use）。 |
| `Concerns/HandlesStudyMaterials.php` ⭐ | Trait：学习材料的重逻辑——`recordMaterialView()`记浏览、`recordMaterialQuizAttempt()`记测验、`buildMaterialFeedbackSummary()`汇总反馈、`buildLearningAnalytics()`学习分析、`buildLinkedQuizzes()`组装关联测验、`attachMaterialLearningStates()`附加学习状态。 |

---

# 七、服务层 (app/Services/)

> ⭐⭐ 项目工程能力的集中体现。控制器把复杂业务委托给这些类。

| 文件 | 方法与作用 |
|---|---|
| `PointsService.php` ⭐⭐ | 积分引擎。`award()`加分、`revoke()`扣回。顶部 `POINTS` 常量定义所有规则（提问+2、回答+5、回答被顶+10、最佳答案+15、被踩-2…）。设计亮点：**防刷分**(同来源同动作只算一次)、**可撤销**、**事务+行锁并发安全**、自动清排行榜缓存。 |
| `AchievementService.php` ⭐ | 成就引擎。`evaluateAchievements()` 用真实DB统计判断解锁哪些成就（答10题、正确率≥80%、复习5个错题…），`syncUser()`同步用户成就。 |
| `PostQueryBuilder.php` ⭐ | 链式查询构造器。`withStandardRelations()`预加载关联防N+1、`withStandardCounts()`计数、`withUserFlags()`当前用户是否点赞/收藏、`excludeBlockedUsers()`、`filterByPostType/Language/Subject()`、`latest()`。 |
| `PostSerializationService.php` | `serialize()` 把 Post 模型转成前端需要的统一 JSON 结构。 |
| `LearningProgressService.php` | `buildLearningOverview()` 构建学习总览数据（答题量、正确率、趋势等）。 |
| `ProgressService.php` | 进度更新：`recordQuizAttempt()`记测验、`recordPostCreated()`记发帖、`syncMistakeReview()`记错题复习、`syncLikesReceived()`同步获赞数。 |
| `MaterialVersionService.php` ⭐ | `createSnapshot()` 给学习资料存版本快照、`buildFeedbackSnapshot()` 构建反馈快照（论文目标三的版本化机制）。 |
| `LeaderboardTitleService.php` | `titleForRank()/titleForUserId()` 计算排行榜前三称号(champion/runner_up/third_place)，结果缓存5分钟。 |

---

# 八、中间件 (app/Http/Middleware/)

> 中间件在请求到达控制器**之前**拦截处理。

| 文件 | 作用 |
|---|---|
| `AdminMiddleware.php` ⭐ | 检查用户是否 admin，不是就 403。注册为 `'admin'` 别名，用于保护后台路由。 |
| `EnsureUserNotBlocked.php` | 被封禁用户自动登出/拦截。 |
| `HandleInertiaRequests.php` ⭐ | Inertia 核心中间件。`share()` 定义**每个页面都自动带上的共享数据**（当前登录用户、权限、flash 消息、语言、未读等）——前端任何页面都能拿到。 |
| `SetLocale.php` | 根据用户/会话设置当前请求的界面语言。 |
| `HandleAppearance.php` | 处理明暗主题(appearance cookie)。 |

---

# 九、其余后端

### 表单请求 (app/Http/Requests/Settings/)
> 把"验证规则"从控制器抽离成独立类。

| 文件 | 作用 |
|---|---|
| `ProfileUpdateRequest.php` | 更新资料的验证规则。 |
| `ProfileDeleteRequest.php` | 注销账号需验证密码。 |
| `PasswordUpdateRequest.php` | 改密码验证（当前密码+新密码强度）。 |
| `TwoFactorAuthenticationRequest.php` | 2FA 操作的授权与验证。 |

### 队列任务 (app/Jobs/)
| 文件 | 作用 |
|---|---|
| `QueuePostReportForModeration.php` | 帖子举报后**异步**进审核队列(`handle()`)，不阻塞用户请求。 |
| `QueueCommentReportForModeration.php` | 评论举报异步进审核队列。 |

### 复用 Trait (app/Concerns/)
| 文件 | 作用 |
|---|---|
| `PasswordValidationRules.php` | 提供 `passwordRules()`/`currentPasswordRules()`，密码验证规则统一一处。 |
| `ProfileValidationRules.php` | 提供 `profileRules()/nameRules()/emailRules()`，资料验证规则复用。 |

### Fortify 动作 (app/Actions/Fortify/)
| 文件 | 作用 |
|---|---|
| `CreateNewUser.php` | 注册时如何创建用户（验证+建 User+建 Profile）。 |
| `ResetUserPassword.php` | 重置密码的具体逻辑。 |

### 服务提供者 (app/Providers/)
| 文件 | 作用 |
|---|---|
| `AppServiceProvider.php` | 应用启动引导：`register()`绑定服务、`boot()`全局设置（如强制 HTTPS、共享视图数据）。 |
| `FortifyServiceProvider.php` ⭐ | 配置认证：注册登录/注册视图、绑定 `CreateNewUser`、自定义登录响应、限流等。 |

---

# 十、数据库 (database/)

### Migrations（按时间顺序，是数据库结构的"版本历史"）
| 文件(简称) | 建立/修改的表 |
|---|---|
| `..._create_users_auth_and_system_tables` | `users` + 框架系统表(cache/jobs/sessions/password_reset_tokens 等) |
| `..._create_profiles_social_accounts_and_follows_tables` | `profiles`、`social_accounts`、`follows`(关注关系) |
| `..._create_languages_subjects_and_lessons_tables` | `languages`、`subjects`、`lessons` |
| `..._create_posts_table` | `posts`(核心内容表) |
| `..._add_parent_material_id_to_posts_table` | posts 加 `parent_material_id`(测验挂到资料) |
| `..._add_source_post_fk_to_lessons_table` | lessons 关联来源帖子 |
| `..._add_attachments_to_posts_table` | posts 加附件字段 |
| `..._create_likes_table` | `likes` |
| `..._create_comments_likes_and_reports_tables` | `comments`、`comment_likes`、`comment_reports` |
| `..._create_bookmark_folders_and_bookmark_items_tables` | `bookmark_folders`、`bookmark_items` |
| `..._create_quiz_completions_and_quiz_mistakes_tables` | `quiz_completions`、`quiz_mistakes`(错题) |
| `..._create_badges_achievements_user_progress_and_points_transactions_tables` | ⭐ 游戏化7张表：`badges`、`badge_user`、`user_featured_badges`、`achievements`、`user_achievements`、`user_progress`、`points_transactions` |
| `..._create_study_material_feedback_views_attempts_and_versions_tables` | ⭐ `study_material_feedback`、`study_material_views`、`study_material_versions`、`material_quiz_attempts` |
| `..._create_teacher_applications_and_verification_documents_tables` | `teacher_applications`、`teacher_verification_documents` |
| `..._add_objective_three_fields_...` (×2) | 给 posts/comments/user_progress/users 加论文**目标三**(学习支持)相关字段 |
| `..._add_content_blocks_to_posts_table_initial` | posts 加 `content_blocks`(结构化内容) |
| `..._convert_discussion_posts_to_question_posts` | **数据迁移**：把旧的"讨论帖"转成"问题帖"(体现迭代重构) |
| `..._create_post_reports_table` + `..._fix_post_reports_unique_constraints` | `post_reports`(帖子举报) |
| 其余 `add_*` / `align_*` / `fix_*` | 后期对教师申请、认证文件、版本快照等表的字段补充与修正 |

### Seeders（填充初始/演示数据）
| 文件 | 作用 |
|---|---|
| `DatabaseSeeder.php` | 总入口，创建管理员账号并调用其它 seeder。 |
| `LanguagesSeeder.php` | 插入语言：English / 中文 / Bahasa Malaysia。 |
| `SubjectsSeeder.php` | 插入科目列表。 |
| `BadgesSeeder.php` | 插入徽章定义（含积分门槛）。 |
| `AchievementsSeeder.php` | 插入成就定义（类别/门槛）。 |
| `DemoPresentationSeeder.php` ⭐ | **答辩用演示数据**：批量造用户、帖子、评论、点赞、收藏、测验记录等，让系统看起来"有人用"。 |

### Factories（测试用假数据生成器）
| 文件 | 作用 |
|---|---|
| `UserFactory.php` | 生成假用户（测试/seeder 用）。 |
| `SocialAccountFactory.php` | 生成假的第三方账号绑定。 |

### 其它
| 文件 | 作用 |
|---|---|
| `database/database.sqlite` | ⭐ 实际的 SQLite 数据库文件（数据都存这里）。 |

---

# 十一、前端入口与全局

| 文件 | 作用 |
|---|---|
| `resources/js/app.tsx` ⭐ | **前端入口**。用 `createInertiaApp` 启动整个 React 应用：自动按页面名解析 `pages/*.tsx`、设置标题、挂载根节点、配置全局 `react-hot-toast` 提示和进度条。 |
| `resources/js/ssr.tsx` | **服务端渲染入口**（SSR），让首屏由服务器渲染好再发给浏览器，利于 SEO 和首屏速度。 |

---

# 十二、前端页面 (resources/js/pages/)

> 每个文件对应一个 URL 页面，由控制器 `Inertia::render('页面名', 数据)` 渲染。

### 主要功能页
| 文件 | 对应页面 |
|---|---|
| `LandingPage.tsx` | 未登录的着陆/营销页。 |
| `HomePage.tsx` ⭐ | 登录后的主页信息流。 |
| `PostContent.tsx` ⭐ | 帖子详情页（最复杂的页面，含三种帖子的不同展现、评论、测验、AI面板）。 |
| `CreatePostPage.tsx` | 发帖页。 |
| `CategoriesPage.tsx` | 按语言/科目分类浏览。 |
| `LearningTrendsPage.tsx` | 学习趋势/关注动态页。 |
| `StudyFolderPage.tsx` | 收藏夹/学习文件夹页（含错题复习）。 |
| `Leaderboard.tsx` | 排行榜页。 |
| `AchievementsPage.tsx` | 成就与徽章页。 |
| `ProfilePage.tsx` | 个人主页。 |
| `TeacherMaterialInsightsPage.tsx` | 教师资料洞察页。 |
| `RulesPage.tsx` | 平台规则/积分说明页。 |
| `PrivacyPolicyPage.tsx` / `TermsOfServicePage.tsx` | 隐私政策 / 服务条款。 |

### 管理后台页 (pages/admin/)
| 文件 | 作用 |
|---|---|
| `AdminUsers.tsx` | 用户管理（改角色/封禁）。 |
| `AdminReports.tsx` | 举报审核（处理违规帖子/评论）。 |
| `AdminTeacherApplications.tsx` | 教师申请审核。 |

### 认证页 (pages/auth/)
| 文件 | 作用 |
|---|---|
| `login.tsx` / `register.tsx` | 登录 / 注册。 |
| `forgot-password.tsx` / `reset-password.tsx` | 忘记/重置密码。 |
| `confirm-password.tsx` | 敏感操作前确认密码。 |
| `verify-email.tsx` | 邮箱验证提示。 |
| `two-factor-challenge.tsx` | 双因素认证登录验证。 |

### 设置页 (pages/settings/)
| 文件 | 作用 |
|---|---|
| `profile.tsx` | 个人资料设置。 |
| `password.tsx` | 修改密码。 |
| `appearance.tsx` | 明暗主题设置。 |
| `two-factor.tsx` | 2FA 设置。 |
| `teacher-certification.tsx` | 申请成为教师 / 上传认证文件。 |

### 错误页 (pages/errors/)
| 文件 | 作用 |
|---|---|
| `ErrorPage.tsx` | 通用错误页（404/500 等）。 |

---

# 十三、前端布局 (layouts/)

> 布局是页面的"外壳"（导航栏、侧边栏等），多个页面共用。

| 文件 | 作用 |
|---|---|
| `app-layout.tsx` | 主应用布局（登录后的整体框架）。 |
| `app/app-header-layout.tsx` | 带顶部导航的布局变体。 |
| `auth-layout.tsx` + `auth/auth-card-layout.tsx` / `auth/auth-simple-layout.tsx` | 认证页面的布局（卡片式/简洁式）。 |
| `settings/layout.tsx` | 设置区的侧边栏布局。 |
| `admin/admin-layout.tsx` | 管理后台布局。 |

---

# 十四、前端组件 (components/)

> 页面由组件拼成。这里按文件夹分组说明（同一文件夹=同一功能模块的零件）。

### 顶层通用组件（直接在 components/ 下）
- **导航与外壳**：`app-header.tsx`(顶栏)、`app-header-admin.tsx`(后台顶栏)、`app-header-for-unlogin.tsx`(未登录顶栏)、`app-sidebar.tsx`(侧边栏)、`app-shell.tsx`、`app-content.tsx`、`nav-main.tsx`、`nav-footer.tsx`、`breadcrumbs.tsx`(面包屑)、`app-logo*.tsx`(logo)。
- **用户相关**：`user-menu-content.tsx`(用户下拉菜单)、`user-info.tsx`、`delete-user.tsx`(注销账号)、`google-login-btn.tsx`(Google登录按钮)。
- **徽章/称号**：`VerifiedTeacherBadge.tsx`(认证教师标)、`LeaderboardTitleBadge.tsx`(排行榜称号标)、`LeaderboardRow.tsx`、`PodiumCard.tsx`(领奖台前三)。
- **AI 面板** ⭐：`best-answer-ai-panel.tsx`(理解最佳答案)、`comment-ai-doubt-panel.tsx`(解惑面板)、`comment-ai-wrong-panel.tsx`(验证"答案错了"面板)。
- **评论**：`comment-section.tsx`(评论区主体)。
- **附件/通用 UI**：`post-attachments.tsx`、`pagination-controls.tsx`(分页)、`appearance-tabs.tsx`(主题切换)、`two-factor-setup-modal.tsx`、`two-factor-recovery-codes.tsx`、`input-error.tsx`、`alert-error.tsx`、`heading.tsx`、`text-link.tsx`。

### 按功能模块分组的子文件夹
| 文件夹 | 内容 |
|---|---|
| `home/` | 主页的板块：信息流 `home-feed-section`、英雄区 `home-hero-section`、学习仪表盘 `study-home-dashboard`、文案 `home-page-text.ts`。 |
| `post-content/` ⭐ | 帖子详情页的所有零件（最大的文件夹）。含正文 `post-content-main-section`、评论面板、操作栏 `post-action-footer`、删除弹窗、可编辑正文、翻译按钮 `post-translate-actions`、视频嵌入；子目录 `qna/`(问答帖)、`quiz/`(测验帖面板+数据)、`study-material/`(学习资料的展示/编辑/学习路径/评分等)。`use-post-content-controller.ts` 是这个页面的逻辑控制 hook。 |
| `create-post/` ⭐ | 发帖页零件：类型选择、标题、科目/语言、内容编辑器 `study-material-block-editor`、测验设置 `quiz-setup-section`、附件、匿名开关、提交按钮。`use-create-post-form.ts` 管理整个表单状态。 |
| `categories/` | 分类页：筛选面板、帖子卡片、结果面板、配置/类型定义。 |
| `learning-trends/` | 学习趋势页：工具栏、帖子卡片/列表、空状态、控制 hook。 |
| `studyfolder/` | 收藏夹页：侧边栏文件夹、已保存帖子面板、**测验复习列表** `quiz-review-list`、状态标签、控制 hook。 |
| `leaderboard/` | 排行榜：头部控制(隐私开关)、排名区、**积分历史** `leaderboard-points-history`、控制 hook。 |
| `achievements/` | 成就页：成就卡片/区块、分类筛选、徽章区 `PointsBadgesSection`、下一徽章提示 `NextBadgeBanner`、正确率统计、汇总统计、常量/类型。 |
| `profile/` | 个人主页：头部、统计卡、帖子标签页、徽章标签页、**徽章编辑器** `badge-editor-panel`、资料编辑器、控制 hook。 |
| `teacher-material-insights/` | 教师洞察页：数据表、筛选面板、低分资料区、常错题区。 |
| `rules/` | 规则页：积分规则区、称号徽章说明、操作指南。 |

---

# 十五、前端 lib / hooks / types

### lib/（工具函数与 AI 调用封装）
| 文件 | 作用 |
|---|---|
| `ai-http.ts` ⭐ | **所有 AI 请求的底层封装**：自动带 CSRF token、统一错误解析。其它 ai-*.ts 都基于它。 |
| `ai-explain.ts` | 调 `/ai-explain`（错题讲解）的封装 + 返回类型。 |
| `ai-best-answer.ts` | 调 `/ai-best-answer`（理解最佳答案）。 |
| `ai-comment-feedback.ts` | 调 `/ai-doubt-clarify` 和 `/ai-validate-wrong`（解惑/验证推理）。 |
| `ai-material-quiz.ts` | 调 `/ai-material-quiz`（从资料生成测验）。 |
| `ai-quiz-options.ts` | 调 `/ai-quiz-options`（教师出题自动生成选项）。 |
| `formula-display.ts` ⭐ | 把 LaTeX/数学命令(如 `\rightleftharpoons`)转成 Unicode 符号显示，方便理科内容。 |
| `video-utils.ts` | 把视频页面 URL 转成安全的嵌入(embed) URL。 |
| `post-utils.ts` | 帖子相关小工具（如语言代码转标签）。 |
| `badge-translations.ts` | 徽章名称的多语言翻译。 |
| `verified-teacher.ts` | 判断用户是否为认证教师。 |
| `utils.ts` | 通用工具，主要是 `cn()` 合并 className（Tailwind 常用）。 |

### hooks/（可复用的 React 逻辑）
| 文件 | 作用 |
|---|---|
| `use-appearance.tsx` | 明暗主题状态管理（含初始化）。 |
| `use-home-page-state.ts` | 主页的过滤/排序/分页状态。 |
| `use-post-interactions.ts` ⭐ | 点赞/收藏/关注等互动的统一逻辑（乐观更新）。 |
| `use-category-filters.ts` | 分类页筛选逻辑。 |
| `use-two-factor-auth.ts` | 2FA 流程逻辑。 |
| `use-clipboard.ts` | 复制到剪贴板。 |
| `use-current-url.ts` | 获取当前 URL。 |
| `use-initials.tsx` | 由名字生成头像首字母。 |
| `use-mobile.tsx` / `use-mobile-navigation.ts` | 移动端检测与导航。 |

### types/（TypeScript 类型定义）
| 文件 | 作用 |
|---|---|
| `index.ts` | 统一导出所有类型。 |
| `post.ts` ⭐ | 帖子/评论/测验等核心数据结构类型。 |
| `auth.ts` | 用户/认证相关类型。 |
| `navigation.ts` | 导航菜单类型。 |
| `ui.ts` | UI 组件通用类型。 |
| `global.d.ts` / `vite-env.d.ts` | 全局类型声明、Vite 环境变量类型（框架样板）。 |

---

# 十六、多语言

| 路径 | 作用 |
|---|---|
| `lang/en/`、`lang/zh/`、`lang/my/` (PHP) | ⭐ **后端**多语言文件（每个 `.php` 返回一个翻译数组），按模块分：`auth`、`home`、`rules`、`leaderboard`、`settings`、`category`、`aiTranslate` 等。 |
| `resources/js/lang/en|zh|my/*.json` | **前端**多语言文件（JSON），由 `erag/laravel-lang-sync-inertia` 同步给 React 使用，模块同上(navigation/achievement/comment/landing…)。 |

> 语言支持：英文(en)、中文(zh)、马来文(my/bm)。配合 AI `/translate` 接口实现动态翻译。

---

# 十七、视图与样式

| 文件 | 作用 |
|---|---|
| `resources/views/app.blade.php` ⭐ | **唯一的 HTML 模板**。Inertia 应用的根模板：放 `<div id="app">`、加载 Vite 打包的 JS/CSS、注入 CSRF token。所有 React 页面都挂在这里面。 |
| `resources/views/sitemap.blade.php` | 生成 `sitemap.xml` 的 XML 模板（SEO 用）。 |
| `resources/css/app.css` | 全局样式入口（TailwindCSS 指令 + 自定义样式/主题变量）。 |

---

# 附：三份文档怎么配合用

1. **`FEATURES.md`** — 讲**功能逻辑**（这个网站能干什么、业务怎么转）。
2. **`CODE_WALKTHROUGH.md`** — 讲**代码实现重点**（答辩时指着哪几个文件讲、怎么讲）。
3. **`FILE_REFERENCE.md`**（本文档）— **逐文件速查**（被问到"这个文件是干嘛的"时翻这里）。

