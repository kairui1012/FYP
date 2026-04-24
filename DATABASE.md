# 数据库架构文档

## 概览

FYP 项目使用 **Laravel + PostgreSQL/MySQL** 数据库架构。本文档详细列出所有表、字段、类型和关系。

---

## 📊 核心表结构

### 1. **users** 表
用户账户信息

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| name | VARCHAR | NOT NULL | 用户名 |
| email | VARCHAR | UNIQUE, NOT NULL | 邮箱 |
| email_verified_at | TIMESTAMP | NULLABLE | 邮箱验证时间 |
| password | VARCHAR | NOT NULL | 密码哈希 |
| avatar | VARCHAR | NULLABLE | 头像 URL |
| points | INT | DEFAULT: 0 | 用户积分 |
| two_factor_secret | TEXT | NULLABLE | 2FA 密钥 |
| two_factor_recovery_codes | TEXT | NULLABLE | 2FA 恢复码 |
| remember_token | VARCHAR | NULLABLE | 记住我令牌 |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**关系：**
- HasMany: posts, comments, likes, comment_likes, post_saves, follows (as follower), follows (as following), bookmark_folders, bookmark_items, social_accounts, badges, quiz_completions

---

### 2. **profiles** 表
用户详细资料

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| user_id | BIGINT | FK(users), UNIQUE | 用户ID（一对一） |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**关系：**
- BelongsTo: users

---

### 3. **posts** 表
发帖和学习资料

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| user_id | BIGINT | FK(users), CASCADE | 发帖用户 |
| subject_id | BIGINT | FK(subjects), NULLABLE | 科目 |
| lesson_id | BIGINT | FK(lessons), NULLABLE | 关联课时 |
| language_id | BIGINT | FK(languages) | 语言 |
| title | VARCHAR | NOT NULL | 标题 |
| content | TEXT | NOT NULL | 内容 |
| post_type | VARCHAR | DEFAULT: 'question' | 类型：question / material / quiz |
| image | JSON | NULLABLE | 图片数组 |
| quiz_data | JSON | NULLABLE | 测验数据 |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**关系：**
- BelongsTo: user, subject, language, lesson
- HasMany: comments, likes, post_saves, bookmark_items, quiz_completions
- HasMany: lessons (source post for lessons)

---

### 4. **comments** 表
评论和回复

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| user_id | BIGINT | FK(users), CASCADE | 评论用户 |
| post_id | BIGINT | FK(posts), CASCADE | 所属帖子 |
| parent_id | BIGINT | FK(comments), NULLABLE | 父评论ID（用于回复） |
| content | TEXT | NOT NULL | 评论内容 |
| attachments | JSON | NULLABLE | 附件数组 |
| mentions | JSON | NULLABLE | @提及信息 |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**关系：**
- BelongsTo: user, post, parent (self-reference)
- HasMany: replies (self-reference), comment_likes

---

### 5. **likes** 表
帖子点赞

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| user_id | BIGINT | FK(users), CASCADE | 点赞用户 |
| post_id | BIGINT | FK(posts), CASCADE | 被点赞帖子 |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**约束：** UNIQUE(user_id, post_id) - 防止重复点赞

**关系：**
- BelongsTo: user, post

---

### 6. **comment_likes** 表
评论点赞/点踩

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| user_id | BIGINT | FK(users), CASCADE | 投票用户 |
| comment_id | BIGINT | FK(comments), CASCADE | 被投票评论 |
| vote | INT | NULLABLE | 投票值：1(点赞) / -1(点踩) / NULL(取消) |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**约束：** UNIQUE(user_id, comment_id) - 防止重复投票

**关系：**
- BelongsTo: user, comment

---

### 7. **post_saves** 表
收藏帖子

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| user_id | BIGINT | FK(users), CASCADE | 收藏用户 |
| post_id | BIGINT | FK(posts), CASCADE | 被收藏帖子 |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**约束：** UNIQUE(user_id, post_id) - 防止重复收藏

**关系：**
- BelongsTo: user, post

---

### 8. **bookmark_folders** 表
收藏夹

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| user_id | BIGINT | FK(users), CASCADE | 所有者 |
| name | VARCHAR | NOT NULL | 收藏夹名称 |
| is_default | BOOLEAN | DEFAULT: false | 是否为默认收藏夹 |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**关系：**
- BelongsTo: user
- HasMany: bookmark_items
- BelongsToMany: posts (via bookmark_items)

---

### 9. **bookmark_items** 表
收藏夹中的帖子（中间表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| user_id | BIGINT | FK(users), CASCADE | 用户ID |
| bookmark_folder_id | BIGINT | FK(bookmark_folders), CASCADE | 收藏夹ID |
| post_id | BIGINT | FK(posts), CASCADE | 帖子ID |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**关系：**
- BelongsTo: user, folder (bookmark_folder), post

---

### 10. **follows** 表
用户关注关系

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| follower_id | BIGINT | FK(users), CASCADE | 关注者 |
| following_id | BIGINT | FK(users), CASCADE | 被关注者 |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**约束：** UNIQUE(follower_id, following_id) - 防止重复关注

---

### 11. **subjects** 表
科目（预填充数据）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| name | VARCHAR | UNIQUE, NOT NULL | 科目名称 |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**预设科目：**
- General Studies, Mathematics, Additional Mathematics, Physics, Chemistry, Biology, Science, Computer Science
- Islamic Studies, Moral Studies
- Malay Language, English Language, Chinese Language, Tamil Language
- History, Geography, Civics and Citizenship
- Economics, Accounting, Business Studies
- Art, Music, Physical Education, Design and Technology

**关系：**
- HasMany: posts
- HasMany: lessons

---

### 12. **languages** 表
支持语言

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| code | VARCHAR | UNIQUE | 语言代码：en / zh / my |
| name | VARCHAR | NOT NULL | 语言名称：English / 中文 / Bahasa Melayu |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**关系：**
- HasMany: posts

---

### 13. **lessons** 表
课时

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| subject_id | BIGINT | FK(subjects), CASCADE | 科目 |
| source_post_id | BIGINT | FK(posts), NULL ON DELETE, UNIQUE | 源帖子ID |
| title | VARCHAR | NOT NULL | 课时标题 |
| sequence | INT | DEFAULT: 1 | 排序序号 |
| is_published | BOOLEAN | DEFAULT: true | 是否发布 |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**索引：** (subject_id, sequence), (subject_id, is_published)

**关系：**
- BelongsTo: subject, sourcePost (posts)

---

### 14. **quiz_completions** 表
测验完成记录

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| user_id | BIGINT | FK(users), CASCADE | 用户ID |
| post_id | BIGINT | FK(posts), CASCADE | 测验帖子 |
| subject_id | BIGINT | FK(subjects), NULL ON DELETE, NULLABLE | 科目 |
| completed_at | TIMESTAMP | NULLABLE | 完成时间 |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**约束：** UNIQUE(user_id, post_id)

**索引：** (user_id, subject_id)

**关系：**
- BelongsTo: user, post, subject

---

### 17. **badges** 表
成就徽章

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| key | VARCHAR | UNIQUE | 徽章标识 |
| name | VARCHAR | NOT NULL | 徽章名称 |
| description | VARCHAR | NOT NULL | 徽章描述 |
| icon | VARCHAR | NULLABLE | 图标名称 |
| points_required | INT | NOT NULL | 所需积分 |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**预设徽章：**
- rookie_author (50pt) - Sparkles 图标
- rising_star (150pt) - Star 图标
- community_hero (300pt) - Trophy 图标
- legend (600pt) - Crown 图标

**关系：**
- BelongsToMany: users (via badge_user)

---

### 18. **badge_user** 表
用户徽章关联（中间表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| user_id | BIGINT | FK(users), CASCADE | 用户ID |
| badge_id | BIGINT | FK(badges), CASCADE | 徽章ID |
| awarded_at | TIMESTAMP | NOT NULL | 获得时间 |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**约束：** UNIQUE(user_id, badge_id)

---

### 19. **social_accounts** 表
社交账号绑定

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AI | 主键 |
| user_id | BIGINT | FK(users), CASCADE | 用户ID |
| provider | VARCHAR | NOT NULL | 提供商：google 等 |
| provider_id | VARCHAR | NOT NULL | 提供商用户ID |
| avatar | VARCHAR | NULLABLE | 头像 URL |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

**关系：**
- BelongsTo: user

---

## 🔗 关键关系图

### 用户中心关系
```
User (中心)
   └─ HasMany Lessons (课时)

Lesson (课时)
   ├─ BelongsTo Subject (所属科目)
   └─ BelongsTo Post (源内容，可选)
  ├─ HasMany CommentLikes (投票评论)
  ├─ HasMany PostSaves (收藏帖子)
  ├─ HasMany BookmarkFolders (收藏夹)
  ├─ HasMany BookmarkItems (收藏项)
  ├─ HasMany Follows (as follower - 关注的用户)
   ├─ BelongsTo Lesson (可选课时)
   ├─ HasMany Comments (评论树)
   ├─ HasMany Likes (点赞)
   ├─ HasMany PostSaves (收藏)
   ├─ HasMany BookmarkItems (收藏项)
   └─ HasMany QuizCompletions (测验完成)

### 内容发布流程
```
Subject (科目)
   └─ HasMany Lessons (课时)
          ├─ BelongsTo Post (源内容)
          └─ BelongsTo Subject (所属科目)

Post (帖子)
  ├─ BelongsTo User (发帖者)
  ├─ BelongsTo Subject (科目)
  ├─ BelongsTo Language (语言)
   └─ BelongsTo Lesson (可选课时)
       ├─ HasMany Comments (评论树)
       ├─ HasMany Likes (点赞)
       ├─ HasMany PostSaves (收藏)
       ├─ HasMany BookmarkItems (收藏项)
       └─ HasMany QuizCompletions (测验完成)

Comment (评论)
  ├─ BelongsTo User (评论者)
  ├─ BelongsTo Post (所属帖子)
  ├─ BelongsTo Parent (父评论 - 可为空)
  ├─ HasMany Replies (子评论)
  └─ HasMany CommentLikes (投票)
```

### 收藏系统
```
BookmarkFolder
  ├─ BelongsTo User
  ├─ HasMany BookmarkItems
  └─ BelongsToMany Posts (via BookmarkItems)

BookmarkItem
  ├─ BelongsTo User
  ├─ BelongsTo BookmarkFolder
  └─ BelongsTo Post
```

---

## 📈 数据流向

### 1. 用户发帖流程
```
User → Post (user_id)
      → Post (subject_id) → Subject
      → Post (language_id) → Language
   → Post (lesson_id) [可选] → Lesson → Subject
```

### 2. 评论互动流程
```
User → Comment (user_id)
     → Comment (post_id) → Post
     → Comment (parent_id) [可选] → Comment (自引用，形成树)
     → Comment → CommentLike (user votes)
```

### 3. 收藏流程
```
User → PostSave (user_id)
     → PostSave (post_id) → Post

User → BookmarkFolder (user_id)
     → BookmarkFolder → BookmarkItems
     → BookmarkItem (post_id) → Post
```

### 4. 积分和徽章流程
```
User (points) → 获赞数、发帖数累计
User → QuizCompletions (quiz 完成)
User → (自动同步) → Badges (当 points 达到阈值)
```

---

## 🔑 关键设计点

1. **评论树结构**
   - 使用 `parent_id` 自引用实现
   - 支持无限层级回复

2. **用户关注**
   - `follower_id` 和 `following_id` 形成有向图
   - UNIQUE 约束防止重复关注

3. **收藏分类**
   - 每个用户自动生成一个默认收藏夹
   - BookmarkItem 中间表支持灵活分类

4. **投票系统**
   - CommentLike.vote: 1(点赞) / -1(点踩) / NULL(取消)
   - 兼容旧数据结构（点赞/点踩模式）

5. **课时系统**
   - 从 Subject → Lessons 的直接结构
   - 学习材料帖子自动生成对应课时
   - 课时直接绑定到所属科目

6. **多语言支持**
   - 所有内容帖子关联 language_id
   - 支持 en / zh / my 三种语言

7. **级联删除**
   - 用户删除 → 自动删除其所有帖子、评论、点赞等
   - 帖子删除 → 自动删除相关评论、收藏等

---

## 🛠️ 查询示例

### 获取用户主页帖子（含点赞数、评论数）
```sql
SELECT 
    posts.*,
    COUNT(DISTINCT likes.id) as likes_count,
    COUNT(DISTINCT comments.id) as comments_count
FROM posts
LEFT JOIN likes ON posts.id = likes.post_id
LEFT JOIN comments ON posts.id = comments.post_id
WHERE posts.user_id = ? AND posts.post_type = 'question'
GROUP BY posts.id
ORDER BY posts.created_at DESC;
```

### 获取评论树（含最佳答案）
```sql
SELECT c.*,
    COUNT(DISTINCT cl.id) as upvotes_count,
    (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND vote = -1) as downvotes_count
FROM comments c
LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.vote = 1
WHERE c.post_id = ?
ORDER BY c.parent_id IS NULL DESC, 
         upvotes_count DESC,
         c.created_at DESC;
```

### 获取用户收藏（按文件夹分组）
```sql
SELECT 
    bf.id, bf.name,
    COUNT(bi.id) as item_count
FROM bookmark_folders bf
LEFT JOIN bookmark_items bi ON bf.id = bi.bookmark_folder_id
WHERE bf.user_id = ?
GROUP BY bf.id
ORDER BY bf.is_default DESC, bf.name;
```

### 获取用户已解锁的徽章
```sql
SELECT b.* FROM badges b
INNER JOIN badge_user bu ON b.id = bu.badge_id
WHERE bu.user_id = ?
ORDER BY bu.awarded_at DESC;
```

---

## 📝 迁移执行顺序

| 序号 | 迁移文件 | 说明 |
|------|---------|------|
| 1 | 0001_01_01_000000 | 创建 users, password_reset_tokens, sessions |
| 2 | 0001_01_01_000001 | 创建 cache 表 |
| 3 | 0001_01_01_000002 | 创建 jobs 表 |
| 4 | 2025_08_14_170933 | 添加 2FA 字段到 users |
| 5 | 2026_03_26_032214 | 创建 social_accounts |
| 6 | 2026_04_08_041148 | 创建 posts |
| 7 | 2026_04_08_041719 | 创建 likes |
| 8 | 2026_04_08_041727 | 创建 comments |
| 9 | 2026_04_09_182249 | 创建 languages |
| 10 | 2026_04_10_000001 | 添加 language_id 到 posts |
| 11 | 2026_04_13_030000 | 创建 profiles |
| 12 | 2026_04_13_220000 | 添加投票字段到 comments |
| 13 | 2026_04_14_061137 | 添加 avatar 到 users |
| 14 | 2026_04_14_120000 | 添加 parent_id 到 comments |
| 15 | 2026_04_14_120100 | 创建 comment_likes |
| 16 | 2026_04_14_180000 | 添加 post_type 到 posts |
| 17 | 2026_04_14_190000 | 创建 post_saves |
| 18 | 2026_04_14_200000 | 创建 follows |
| 19 | 2026_04_14_210000 | 创建 subjects (包含预填充数据) |
| 20 | 2026_04_14_210100 | 添加 subject_id 到 posts |
| 21 | 2026_04_14_220100 | 添加 points 到 users |
| 22 | 2026_04_14_220200 | 创建 badges 和 badge_user (包含预填充数据) |
| 23 | 2026_04_15_000100 | 添加 vote 字段到 comment_likes |
| 24 | 2026_04_15_120000 | 添加 quiz_data 到 posts |
| 25 | 2026_04_15_120000 | 创建 bookmark_folders 和 bookmark_items |
| 26 | 2026_04_18_120000 | 创建 quiz_completions |
| 27 | 2026_04_24_000000 | 删除用户封面字段 |
| 28 | 2026_04_24_000001 | 删除学习进度表 |
| 29 | 2026_04_24_000002 | 让 lessons 直接关联 subjects |

---

## 📌 Model 模型列表

```
app/Models/
├── User.php                    # 用户 (Authenticatable)
├── Post.php                    # 帖子
├── Comment.php                 # 评论
├── Like.php                    # 帖子点赞
├── CommentLike.php             # 评论投票
├── PostSave.php                # 帖子收藏
├── BookmarkFolder.php          # 收藏夹
├── BookmarkItem.php            # 收藏项
├── Subject.php                 # 科目
├── Language.php                # 语言
├── Lesson.php                  # 课时
├── Badge.php                   # 成就
├── QuizCompletion.php          # 测验完成
├── Profile.php                 # 用户资料
└── SocialAccount.php           # 社交账号
```

---

## 🚀 性能优化建议

1. **缓存策略**
   - 缓存热门帖子列表
   - 缓存用户徽章列表
   - 缓存科目和课时数据

2. **索引优化**
   - posts: (user_id, created_at)
   - lessons: (subject_id, sequence)
   - comments: (post_id, parent_id, created_at)
   - comment_likes: (comment_id, user_id)
   - bookmark_items: (user_id, bookmark_folder_id)

3. **查询优化**
   - 使用 eager loading (with) 避免 N+1 问题
   - 分页大表查询（如评论列表）
   - 使用计数缓存优化点赞/评论统计

4. **数据库连接**
   - 启用连接池
   - 定期优化表统计信息
   - 监控慢查询日志

---

**文档版本：** 1.0  
**最后更新：** 2026-04-23  
**数据库引擎：** MySQL/PostgreSQL compatible  
**Laravel 版本：** 10+
