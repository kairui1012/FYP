# FYP

## 📚 项目文档

- **[数据库架构文档](./DATABASE.md)** - 完整的数据库表结构、字段属性、关系图
- **[Controller 分析](#controller-分析finalyearproject)** - 见下方

---

## 🚀 现在怎么用

首次或清空数据卷后：docker compose up -d --build
然后执行一次迁移：docker compose exec app php artisan migrate --force
如果 .env 里还没 APP_KEY：docker compose exec app php artisan key:generate
你要注意的点

你现在是挂载源码开发模式，docker compose 的 volume 会覆盖镜像里构建好的文件。
前端改动如果没跑 Vite（npm run dev），页面可能不更新或资源不对。
数据库是否保留取决于 db-data volume；删了 volume 需要重新 migrate。
bootstrap/cache 旧缓存文件可能导致奇怪错误，遇到异常先 php artisan optimize:clear。

## Controller 分析（finalyearproject）

目前在 `finalyearproject/app/Http/Controllers` 下共有 **19 个 Controller 文件**：

- **业务 Controller：18 个**
- **基础抽象 Controller：1 个**（`Controller.php`）

### 1) 基础 Controller

1. `Controller.php`
功能：Laravel 控制器基类，目前为空实现，供其他 Controller 继承。

### 2) 业务 Controller（按模块）

1. `PostController.php`
功能：帖子与学习内容浏览主流程；包含首页列表、问题/资料分流、分类页、帖子详情、课程完成与测验完成等。

2. `PostCreateController.php`
功能：发帖页面数据准备与发帖提交处理（题型校验、附件上传、学习资料自动生成课程课时、成就同步）。

3. `PostPopularController.php`
功能：热门页数据聚合与排行筛选（today/week/month/all），并返回热门帖子列表。

4. `PostBookmarkController.php`
功能：书签页数据聚合（文件夹列表、默认文件夹、文件夹帖子列表）。

5. `CommentController.php`
功能：评论发布、评论附件上传、@提及候选查询、提及标准化，以及评论树（含投票/点赞兼容）返回。

6. `CommentLikeController.php`
功能：评论点赞/点踩切换，兼容新旧数据结构（有无 `vote` 字段），并返回 upvote/downvote/score。

7. `LikeController.php`
功能：帖子点赞切换与点赞数返回，同时触发成就同步；其余 REST 占位方法当前未实现业务逻辑。

8. `PostSaveController.php`
功能：帖子收藏切换（保存/取消保存），默认收藏到用户默认文件夹。

9. `BookmarkFolderController.php`
功能：收藏夹创建、重命名、删除、帖子在收藏夹间移动；删除非默认收藏夹时会自动迁移条目到默认收藏夹。

10. `FollowerController.php`
功能：关注/取关用户，以及“关注流”页面（仅看已关注用户帖子）。

11. `ProfilePageController.php`
功能：个人主页展示（含头像、封面、帖子、成就徽章、关注状态）与封面图更新。

12. `AchievementsController.php`
功能：成就页数据聚合与展示（积分、徽章、下一徽章等）。

13. `LeaderboardController.php`
功能：排行榜页；构建总榜与周榜（点赞、评论、评论获赞等维度）。

14. `LocaleController.php`
功能：站点语言切换（`en/zh/my`），写入 session 与 cookie。

15. `Auth/GoogleAuthController.php`
功能：Google OAuth 登录跳转与回调、社交账号绑定、用户登录。

16. `Settings/ProfileController.php`
功能：设置页个人资料编辑、更新、账号注销。

17. `Settings/PasswordController.php`
功能：设置页密码编辑与更新。

18. `Settings/TwoFactorAuthenticationController.php`
功能：设置页双重认证状态展示与配置页渲染。

### 3) 路由使用情况补充

- `routes/web.php` 与 `routes/settings.php` 已覆盖以上大部分业务 Controller 入口。
- `routes/callAI.php` 当前主要使用闭包路由（`/translate`），未新增 Controller 类。
- `LikeController` 中 `index/create/store/show/edit/update/destroy` 目前未在现有路由中使用（保留为资源式占位方法）。
