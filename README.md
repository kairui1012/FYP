# FYP

现在怎么用

首次或清空数据卷后：docker compose up -d --build
然后执行一次迁移：docker compose exec app php artisan migrate --force
如果 .env 里还没 APP_KEY：docker compose exec app php artisan key:generate
你要注意的点

你现在是挂载源码开发模式，docker compose 的 volume 会覆盖镜像里构建好的文件。
前端改动如果没跑 Vite（npm run dev），页面可能不更新或资源不对。
数据库是否保留取决于 db-data volume；删了 volume 需要重新 migrate。
bootstrap/cache 旧缓存文件可能导致奇怪错误，遇到异常先 php artisan optimize:clear。
