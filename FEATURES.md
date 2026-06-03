# JomStudy — 功能文档 (Presentation 速查)

> 一个面向学生与教师的 **在线学习社区平台**：用户可以提问、回答、上传学习资料、做测验、收藏、互相关注，并通过积分 / 徽章 / 成就 / 排行榜形成游戏化激励。系统深度集成 **AI（DeepSeek / Gemini）** 来辅助学习。

---

## 0. 技术栈 (Tech Stack)

| 层 | 技术 |
|---|---|
| 后端 | **Laravel 12** (PHP) |
| 前端 | **React + TypeScript**，通过 **Inertia.js** 与 Laravel 无缝连接（不是传统 REST，而是服务端直接渲染 React 页面 props）|
| 构建 | **Vite**，支持 SSR（服务端渲染）|
| 认证 | **Laravel Fortify**（登录/注册/2FA/邮箱验证）+ **Socialite**（Google 登录）|
| AI | **DeepSeek API** 为主，部分功能可选 **Gemini** |
| 多语言 | 英文 / 中文(zh) / 马来文(my)，并用 AI 实时翻译界面文本 |

**项目名：JomStudy**（`APP_NAME=jomstudy`）。

---

## 1. 核心概念：三种"帖子" (Post Types)

整个平台的内容都是 `posts` 表，用 `post_type` 字段区分成三类：

| 类型 | 谁能发 | 用途 |
|---|---|---|
| **question（问题）** | 所有用户 | 学生提问，其他人在评论区回答（类似论坛/问答）|
| **material（学习资料）** | **仅教师 / 管理员** | 上传结构化学习内容（图文、视频），供学生学习 |
| **quiz（测验）** | 所有用户 | 选择题测验，可以附属于某个学习资料 (`parent_material_id`) |

- 帖子支持 **content_blocks**（JSON，结构化的图文混排内容块）、图片、视频链接、附件。
- 帖子可设为 **匿名发布** (`is_anonymous`)。
- 帖子归属于 **语言 (Language)、科目 (Subject)、课程 (Lesson)** 的分类体系。

---

## 2. 功能模块逐一说明

### 2.1 认证与账户 (Authentication)
- 邮箱注册 / 登录、邮箱验证 (verified middleware)。
- **Google 一键登录**（`/login/google`，OAuth）。
- **双因素认证 2FA**（settings 里开启）。
- 密码重置、修改密码。
- 用户有 **角色 (role)**：`student / teacher / admin`，以及 **封禁状态 (block)**。

### 2.2 主页与信息流 (Feed)
- `/homePage`、`/posts`：主信息流，展示帖子列表。
- `/questions`：只看问题。
- `/learning-materials`：只看学习资料。
- `/popularPage`：热门帖子。
- `/following`：只看你关注的人的内容。
- `/categories`：按 **语言 / 科目** 浏览分类。
- `/search`：搜索帖子。
- 列表的过滤、排序、序列化由 `PostQueryBuilder` + `PostSerializationService` 处理。

### 2.3 发帖 (Create Post)
- `/createPostPage` → 提交到 `POST /posts`。
- 根据类型校验：material 必须有 `material_blocks`，quiz 必须有 `quiz_questions`。
- **权限控制**：只有 teacher/admin 能发 Study Material。
- quiz 可以挂到某个 material 下面（学完资料后做配套测验）。

### 2.4 帖子详情与互动 (Post Detail)
- `/posts/{post}`：查看单个帖子。
- **评论 (Comments)**：回答问题、讨论。支持编辑、删除。
- **评论投票 (vote/upvote)**：给好答案点赞。
- **点赞 (Like)** 帖子。
- **收藏 (Bookmark)**：把帖子收进收藏夹。
- **举报 (Report)**：举报帖子或评论（进入管理员审核队列）。

### 2.5 测验系统 (Quiz)
- 学生做选择题测验。
- `POST /posts/{post}/complete-quiz`：提交测验，记录成绩。
- **做错的题会被记录** (`QuizAttempt` / quiz_mistakes)，方便复习——这是"从错误中学习"的设计。
- `MaterialQuizAttempt`：针对学习资料的测验尝试记录（含总题数、得分）。
- 完成学习资料：`POST /posts/{post}/complete`。

### 2.6 学习资料的反馈与版本 (Study Material Feedback & Versioning) ⭐
这是论文里一个重点（Objective 3 学习支持）：
- 学生可对学习资料提交 **反馈** (`StudyMaterialFeedback`)：例如"哪里看不懂"。
- 教师能看到反馈，**改进资料**；系统用 `MaterialVersionService` 给资料 **存历史版本快照** (`StudyMaterialVersion`)，记录"根据反馈做了哪些改进"(`material_improved_from_feedback`)。
- `StudyMaterialView`：记录谁看过资料（浏览统计）。

### 2.7 AI 辅助功能 (AI Features) ⭐⭐ 项目亮点
全部在 `routes/callAI.php`，调用 DeepSeek/Gemini：

| 接口 | 作用 |
|---|---|
| **`/translate`** | 把界面文本实时翻译成当前语言（中/马来/英），实现动态多语言 |
| **`/ai-explain`** | 学生做错测验题后，AI **解释为什么错**、正确答案为何对 |
| **`/ai-quiz-options`** | （仅教师/admin）出题时 AI **自动生成选项/干扰项** |
| **`/ai-material-quiz`** | 根据一段学习资料内容，AI **自动生成测验题** |
| **`/ai-best-answer`** | AI 帮学生 **理解某个最佳答案** 的思路 |
| **`/ai-doubt-clarify`** | 学生说"这个答案哪里我不懂"，AI **针对性解惑** |
| **`/ai-validate-wrong`** | 学生认为某答案是错的并给出理由，AI **验证学生的推理** 对不对 |

> 讲解重点：AI 不是简单的聊天机器人，而是**嵌入学习闭环**——出题、解错、解惑、验证推理，都围绕"帮学生真正学会"。

### 2.8 游戏化激励 (Gamification)
这是留住用户的核心机制，三个层次：

**(1) 积分 Points**（`PointsService`，存在 `points_transactions` + `total_points`）
| 行为 | 积分 |
|---|---|
| 提问 | +2 |
| 发回答 | +5 |
| 问题被顶 | +5 |
| 回答被顶 | +10 |
| 被标记为最佳答案 | +15 |
| 上传资料 | +3 |
| 资料被收藏 | +2 |
| 获得粉丝 | +5 |
| 内容被踩 | −2 |

> 设计了 **撤销机制 (revoke)**：取消点赞/删除会扣回积分，防止刷分。

**(2) 成就 Achievements**（`AchievementService`，按真实数据自动解锁）
例如：`first_post`（发第1帖）、`active_learner`（答10题）、`quiz_master`（答对20题）、`high_accuracy`（正确率≥80%）、`top_contributor`（获50赞）、`collector`（收藏5个）、`mistake_hunter`（复习5个错题）、`quiz_legend`（答100题）等——分 **发帖 / 评论 / 收藏 / 错题复习 / 表现 / 社区** 六大类。

**(3) 徽章 Badges**：达到积分门槛 (`points_required`) 解锁徽章，用户可在主页 **featured（精选展示）** 最喜欢的徽章。

**(4) 排行榜 Leaderboard**（`/leaderboard`）
- 按 `total_points` 全站排名，**前三名** 获得称号：`champion / runner_up / third_place`（`LeaderboardTitleService`）。
- 用户可设置 **是否上榜**、**是否显示称号徽章**（隐私开关）。
- 称号结果缓存 5 分钟。

### 2.9 社交 (Social)
- **关注/取关** 其他用户 (`FollowerController`)，关注会给对方加积分。
- **个人主页** `/profilePage/{user}`：展示该用户的帖子、徽章、成就、统计。
- **学习进度** `/learning/overview`、`/achievements`、`LearningTrendsPage`：学习数据可视化（答题数、正确率、进步分 `improvement_score` 等）。

### 2.10 收藏夹 (Bookmarks)
- `/bookmarks`：管理收藏。
- 支持 **创建/重命名/删除收藏夹** (`BookmarkFolder`)，把帖子在文件夹间移动。

### 2.11 成为教师 (Teacher Application)
- 学生可申请成为教师：提交 **资历 (qualification)、简介 (bio)、证明文件**。
- `settings/teacher-certification`：上传认证文件 (`TeacherVerificationDocument`)。
- 申请进入管理员审核队列。

### 2.12 教师专属 (Teacher Tools)
- `/teacher/material-insights`：教师查看 **自己资料的数据洞察**（谁看了、反馈、测验表现），用于改进教学内容。

### 2.13 管理后台 (Admin) — `/admin/*`
仅 admin 角色可访问：
- **用户管理**：改角色、封禁/解封用户。
- **举报处理**：审核被举报的帖子/评论，删除违规内容。
- **教师申请审核**：批准/拒绝申请、切换认证状态、下载认证文件。

### 2.14 其他
- 多语言切换（`/change-language-setting`）。
- 隐私政策、服务条款、规则页 (`/rules`)。
- `sitemap.xml`、SEO。

---

## 3. 数据模型关系速览 (给提问环节防身)

- **User** ─< Post ─< Comment（一对多）
- **User** ↔ User：`follows`（关注，多对多）
- **Post** ↔ User：`likes`、`bookmark_items`（多对多）
- **Post**：属于 Language / Subject / Lesson
- **User** ─ UserProgress（1对1，存答题数/正确数/进步分）
- **User** ↔ Badge（多对多）、─< UserAchievement、─< PointTransaction
- **Post(material)** ─< StudyMaterialVersion / StudyMaterialFeedback / StudyMaterialView
- **User** ─< TeacherApplication ─< TeacherVerificationDocument

---

## 4. 一句话总结（开场可用）

> "JomStudy 是一个 **AI 驱动的学习社区**。学生在这里 **提问、答题、做测验、上传和学习资料**；系统用 **积分、成就、徽章、排行榜** 激励持续学习；**AI 全程辅助**——自动出题、讲解错题、解答疑惑、验证推理；教师可以 **发布资料、看反馈、按反馈改进并保留版本历史**；管理员负责 **审核教师资格和违规内容**。"

---

## 5. 可能被问到的"亮点 / 创新点"

1. **AI 嵌入学习闭环**，而非聊天机器人——解错题、验证学生推理。
2. **学习资料的反馈→改进→版本化** 机制，形成教学内容的持续迭代。
3. **多层游戏化**（积分有撤销防刷、成就按真实数据解锁、排行榜称号带隐私开关）。
4. **AI 实时翻译** 实现的动态三语界面。
5. **Inertia.js** 单体架构：前后端一体，开发效率高、无需单独写 API。
