# JomStudy 部署到 Google Cloud Run

这份文档只说明当前 JomStudy 项目部署到 Google Cloud Run 的实际步骤。所有 Docker、Laravel 和部署文件都位于 `jomstudy-app` 目录。

## 1. 当前部署架构

```text
浏览器
  ↓ HTTPS
Google Cloud Run（Singapore：asia-southeast1）
  ↓ HTTP 到容器的 $PORT=8080
Nginx
  ↓ FastCGI 127.0.0.1:9000
PHP-FPM → Laravel
  ↓ PostgreSQL + SSL
Supabase Session Pooler（Singapore）
  ↓
Supabase PostgreSQL
```

当前方案：

- 一个 Docker image 同时包含 Nginx、PHP-FPM、Laravel、`vendor` 和 `public/build`。
- Cloud Run 使用 Supabase **Session Pooler 5432**，不使用 Direct IPv6 Connection。
- 不需要 Supabase IPv4 add-on、Cloud Run VPC、Cloud NAT 或 Serverless VPC Connector。
- `.env` 不会进入 image，也不会上传到 Cloud Run。
- 敏感值放在 Secret Manager，再注入为 Laravel 环境变量。
- 容器启动会检查 schema 和 migrations，但不会自动执行 Demo Seeder。
- Demo 暂时限制为最多 1 个 Cloud Run instance。

## 2. 配置来源

Cloud Run Secret 不是另一套 Laravel 配置。Laravel 始终读取相同的环境变量名称，只是不同环境提供不同的值。

| 环境 | 配置来源 | 说明 |
| --- | --- | --- |
| 本机 Laravel | `.env` | 本机开发配置 |
| 本机 Docker Compose | `.env` | Compose 通过 `env_file` 注入 |
| Cloud Run 普通配置 | Environment variables | 例如 `APP_ENV`、`APP_URL` |
| Cloud Run 密钥 | Secret Manager | 例如 `APP_KEY`、`DB_URL` |
| Docker image | 不包含 `.env` | image 可以安全复用 |

Cloud Run 数据库配置链路：

```text
Secret Manager：jomstudy-prod-db-url
                    ↓
Cloud Run 环境变量：DB_URL
                    ↓
Laravel：env('DB_URL')
```

本机和 Cloud Run 可以使用不同 URI，但变量名称都叫 `DB_URL`。当前 Cloud Run 方案使用 Supabase Session Pooler URI。

## 3. Nginx 为什么必须在 image 中

Cloud Run 不提供一台可以 SSH 登录后手动安装软件的长期服务器。Cloud Run 只会启动已经构建好的 image，因此 Nginx 必须在构建 image 时安装。

PHP-FPM 的 `9000` 是 FastCGI 端口，不是 HTTP 端口。如果 image 只有 PHP-FPM，Cloud Run 发到 `$PORT` 的 HTTP 请求没有程序接收，revision 就无法 Ready。

当前 [Dockerfile](./Dockerfile) 已正确安装并复制所需内容：

```dockerfile
FROM php:8.2-fpm-alpine AS app

RUN apk add --no-cache \
    nginx \
    supervisor \
    postgresql-dev

COPY --from=vendor /app/vendor ./vendor
COPY . ./
COPY --from=frontend /app/public/build ./public/build
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/start-container.sh /usr/local/bin/start-container

ENV PORT=8080
EXPOSE 8080
CMD ["/usr/local/bin/start-container"]
```

[docker/nginx/default.conf.template](./docker/nginx/default.conf.template) 监听 Cloud Run 注入的端口，并转发 PHP：

```nginx
listen ${PORT};
listen [::]:${PORT};

location ~ \.php$ {
    fastcgi_pass 127.0.0.1:9000;
}
```

[docker/supervisord.conf](./docker/supervisord.conf) 在同一容器运行：

```text
php-fpm -F
nginx -g "daemon off;"
```

Cloud Run 部署单个 image 时不会读取 `docker-compose.yml`。Compose 只用于本机开发和测试。

## 4. 当前完成状态

已经确认：

- [x] Supabase schema `laravel` 已建立。
- [x] 6 个 Laravel migrations 全部是 `Ran`。
- [x] Demo Presentation Seeder 已手动执行。
- [x] Supabase Singapore Session Pooler 连接成功并启用 SSL。
- [x] 前端生产 build 成功。
- [x] Laravel `/up` 健康路由存在。
- [x] Dockerfile 已包含 Nginx、PHP-FPM 和 Supervisor。
- [x] `.env` 已被 Git 和 Docker build context 排除。
- [x] Demo Seeder 已从容器入口脚本移除。

仍未确认：

- [ ] Docker image 实际 build 成功。
- [ ] 本机容器 `/up` 实际返回 HTTP 200。
- [ ] Cloud Run revision 实际部署成功。
- [ ] Cloud Run 上登录、OAuth 和上传实际通过。

上次检查时 Docker Desktop daemon 没有运行，本机也没有安装 `gcloud` CLI，因此云端部署尚未执行。

## 5. 部署前必须处理

### 5.1 重置数据库密码

数据库密码曾出现在终端输出和对话中。正式部署前必须：

1. 在 Supabase Database Settings 重置密码。
2. 更新本机 `.env` 的 Session Pooler `DB_URL`。
3. 运行 `php artisan migrate:status`。
4. 将新 URI 存入 Secret Manager。

不要把完整 `DB_URL` 放进 Git、Dockerfile、Markdown、截图或前端 `VITE_*` 变量。

### 5.2 PHP 上传限制

Laravel 当前允许教师认证 2 个文件、每个 5 MiB，以及学习材料单文件 20 MiB。Nginx 已设置 `client_max_body_size 50M`，但 Docker image 还需要配置 PHP：

```ini
upload_max_filesize=20M
post_max_size=30M
memory_limit=512M
max_execution_time=300
```

否则 PHP 默认限制可能在 Laravel validation 之前拒绝上传。Cloud Run HTTP/1 单次请求上限是 32 MiB，因此 multipart 表单总大小应控制在约 30 MiB 以下。

### 5.3 HTTPS 反向代理

Cloud Run 在外部终止 HTTPS，再把请求转发给容器。Laravel 必须正确处理 forwarded headers，否则可能把 HTTPS 判断成 HTTP。

生产环境至少需要：

```env
APP_URL=https://实际的Cloud Run地址
SESSION_SECURE_COOKIE=true
```

同时需要正确配置 Laravel trusted proxies，并验证 redirect URL、Cookie 和 Google OAuth callback 都使用 HTTPS。

### 5.4 本地文件不持久

当前使用 `FILESYSTEM_DISK=local`。Cloud Run 实例重启、缩容或发布新 revision 后，头像、学习材料附件和教师认证文件可能消失。

本项目只是 Demo，可以接受。正式系统应改用 Supabase Storage 或 Google Cloud Storage。

## 6. 准备本机工具

启动 Docker Desktop：

```bash
docker info
```

按照 Google 官方说明安装 Cloud SDK，然后：

```bash
gcloud version
gcloud auth login

export JOMSTUDY_GCP_PROJECT="YOUR_PROJECT_ID"
export JOMSTUDY_GCP_REGION="asia-southeast1"
export JOMSTUDY_AR_REPOSITORY="jomstudy"
export JOMSTUDY_IMAGE="jomstudy-app"
export JOMSTUDY_SERVICE="jomstudy"

gcloud config set project "$JOMSTUDY_GCP_PROJECT"
```

Cloud Run 选择 `asia-southeast1`（Singapore），尽量靠近 Singapore Supabase。

## 7. 本机验证 Docker image

在 `jomstudy-app` 目录执行：

```bash
docker build -t jomstudy-cloud-run .

docker run --rm \
  --env-file .env \
  -e PORT=8080 \
  -p 8080:8080 \
  jomstudy-cloud-run
```

另开终端：

```bash
curl --fail --show-error --include http://127.0.0.1:8080/up
```

必须确认：

- `/up` 返回 HTTP 200。
- Nginx 监听 `0.0.0.0:8080`。
- PHP-FPM 正常运行。
- CSS 和 JavaScript 正常加载。
- image 内已有 `vendor` 和 `public/build`。
- 容器不依赖本机 bind mount。
- 容器启动没有自动执行 Demo Seeder。

## 8. 建立 Google Cloud 资源

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

gcloud artifacts repositories create "$JOMSTUDY_AR_REPOSITORY" \
  --repository-format=docker \
  --location="$JOMSTUDY_GCP_REGION" \
  --description="JomStudy container images"
```

如果同名 Artifact Registry repository 已存在，不要重复建立。

## 9. 建立 Secret Manager 密钥

### 9.1 APP_KEY

```bash
php artisan key:generate --show

gcloud secrets create jomstudy-prod-app-key \
  --replication-policy=automatic

gcloud secrets versions add jomstudy-prod-app-key \
  --data-file=-
```

粘贴 `base64:` 开头的完整 APP_KEY，然后按 `Ctrl+D`。所有 revision 必须持续使用同一个 APP_KEY。

### 9.2 Supabase Session Pooler DB_URL

在 Supabase Dashboard 选择：

```text
Connect
→ Connection Method：Session pooler
→ Type：URI
```

正确 URI 的特征：

```text
username：postgres.PROJECT_REF
host：aws-0-ap-southeast-1.pooler.supabase.com
port：5432
```

建立 secret：

```bash
gcloud secrets create jomstudy-prod-db-url \
  --replication-policy=automatic

gcloud secrets versions add jomstudy-prod-db-url \
  --data-file=-
```

粘贴完整 Session Pooler URI，然后按 `Ctrl+D`。密码中的 `@`、`#`、`/`、`?` 等保留字符必须 URL encode。

### 9.3 Cloud Run service account

```bash
gcloud iam service-accounts create jomstudy-run \
  --display-name="JomStudy Cloud Run"

gcloud secrets add-iam-policy-binding jomstudy-prod-app-key \
  --member="serviceAccount:jomstudy-run@$JOMSTUDY_GCP_PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding jomstudy-prod-db-url \
  --member="serviceAccount:jomstudy-run@$JOMSTUDY_GCP_PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Google OAuth secret、DeepSeek key 和其他 API key 也应放入 Secret Manager。

## 10. 构建并上传 image

### 10.1 默认方案：Artifact Registry

```bash
export JOMSTUDY_IMAGE_URI="$JOMSTUDY_GCP_REGION-docker.pkg.dev/$JOMSTUDY_GCP_PROJECT/$JOMSTUDY_AR_REPOSITORY/$JOMSTUDY_IMAGE"

gcloud builds submit --tag "$JOMSTUDY_IMAGE_URI"
```

构建成功后，在 Artifact Registry 确认 image 已存在。

当前 JomStudy image 的压缩存储大小约为 `248 MiB`，低于 Artifact Registry 每个 billing account 的 `0.5 GiB-month` 免费存储额度。只保留当前 image 时，通常不会产生 image 存储费。旧版本也会占空间，因此应设置 cleanup policy 或定期删除不再使用的旧 image。

### 10.2 免费备用方案：公开 GitHub Container Registry

如果 Artifact Registry 的实际用量开始收费，可以把 image 发布到公开的 GitHub Container Registry。Cloud Run 可以直接部署公开的 `ghcr.io` image；私有 GHCR image 不能使用这条直接部署方案。

先在 GitHub 建立一个具有 `write:packages` 权限的 Personal Access Token，然后在终端执行：

```bash
export JOMSTUDY_GITHUB_OWNER="你的 GitHub 用户名"
export JOMSTUDY_GHCR_TOKEN="你的 GitHub Personal Access Token"
export JOMSTUDY_IMAGE_URI="ghcr.io/$JOMSTUDY_GITHUB_OWNER/jomstudy:latest"

echo "$JOMSTUDY_GHCR_TOKEN" | docker login ghcr.io \
  --username "$JOMSTUDY_GITHUB_OWNER" \
  --password-stdin

docker build --platform linux/amd64 \
  --tag "$JOMSTUDY_IMAGE_URI" \
  .

docker push "$JOMSTUDY_IMAGE_URI"
```

第一次 push 后，到 GitHub 的 package settings 把该 container package 改成 **Public**。确认未登录状态也能访问 package 页面，再使用第 11 节相同的 `gcloud run deploy` 命令；此时 `JOMSTUDY_IMAGE_URI` 已经是 `ghcr.io/...`。

注意：公开 container image 中的 Laravel 源码、依赖和前端产物也会公开。`.env`、数据库密码、APP_KEY 和 API key 不得写入 Dockerfile、build arguments 或 image；它们继续通过 Secret Manager 注入。GitHub 当前说明 Container Registry 的 image 存储和带宽免费，但这项政策未来可能改变。

## 11. 第一次部署 Cloud Run

```bash
gcloud run deploy "$JOMSTUDY_SERVICE" \
  --image="$JOMSTUDY_IMAGE_URI" \
  --region="$JOMSTUDY_GCP_REGION" \
  --service-account="jomstudy-run@$JOMSTUDY_GCP_PROJECT.iam.gserviceaccount.com" \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 \
  --memory=1Gi \
  --concurrency=20 \
  --min-instances=0 \
  --max-instances=1 \
  --timeout=300 \
  --set-env-vars="APP_NAME=jomstudy,APP_ENV=production,APP_DEBUG=false,APP_URL=https://placeholder.invalid,APP_LOCALE=en,LOG_CHANNEL=stderr,LOG_LEVEL=info,DB_CONNECTION=pgsql,DB_SSLMODE=require,DB_SCHEMA=laravel,SESSION_DRIVER=database,SESSION_SECURE_COOKIE=true,CACHE_STORE=database,QUEUE_CONNECTION=sync,FILESYSTEM_DISK=local,MAIL_MAILER=log" \
  --set-secrets="APP_KEY=jomstudy-prod-app-key:1,DB_URL=jomstudy-prod-db-url:1"
```

这里不需要 `--network`、`--subnet` 或 `--vpc-egress`，因为 Session Pooler 可以通过 Cloud Run 默认 IPv4 网络连接。

Secret 使用明确版本，例如 `:1`，不要使用 `:latest`。轮换时先建立新版本，再部署引用新版本的 revision。

取得并更新真实服务 URL：

```bash
export JOMSTUDY_SERVICE_URL="$(gcloud run services describe "$JOMSTUDY_SERVICE" \
  --region="$JOMSTUDY_GCP_REGION" \
  --format='value(status.url)')"

gcloud run services update "$JOMSTUDY_SERVICE" \
  --region="$JOMSTUDY_GCP_REGION" \
  --update-env-vars="APP_URL=$JOMSTUDY_SERVICE_URL"
```

## 12. Google OAuth

如果使用 Google 登录，在 OAuth Client 加入：

```text
https://实际Cloud Run地址/login/google/callback
```

Cloud Run 需要：

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://实际Cloud Run地址/login/google/callback
```

`GOOGLE_CLIENT_SECRET` 必须放入 Secret Manager。修改后测试登录、callback 和登出。

## 13. Migration 和 Demo Seeder

[docker/start-container.sh](./docker/start-container.sh) 当前每次启动都会执行：

```bash
php artisan config:clear
php artisan db:prepare-supabase
php artisan migrate --force
php artisan config:cache
```

它不会执行 Demo Seeder。Demo 暂时使用 `--max-instances=1`，避免多个 instance 同时启动 migration。正式生产应将 migration 改为一次性的 Cloud Run Job。

当前 Supabase 已有 Demo 数据，不需要部署时再次执行。如果以后需要重建：

```bash
php artisan db:seed --class=DemoPresentationSeeder --force
```

不要把 Demo Seeder 加回 Dockerfile、入口脚本或 Cloud Run Service 启动命令。

## 14. 部署后验证

```bash
curl --fail --show-error --include "$JOMSTUDY_SERVICE_URL/up"
curl --head "$JOMSTUDY_SERVICE_URL"

gcloud run services logs read "$JOMSTUDY_SERVICE" \
  --region="$JOMSTUDY_GCP_REGION" \
  --limit=100
```

必须测试：

- [ ] `/up` 返回 HTTP 200。
- [ ] 首页、CSS 和 JavaScript 正常。
- [ ] Supabase Session Pooler 连接正常。
- [ ] 6 个 migrations 仍然是 `Ran`。
- [ ] 容器重启没有自动执行 Demo Seeder。
- [ ] 注册、登录、Session 和登出正常。
- [ ] Google OAuth callback 使用 HTTPS。
- [ ] 教师认证 2 × 5 MiB 上传正常。
- [ ] 学习材料请求总大小没有超过 Cloud Run 限制。
- [ ] 日志进入 stdout/stderr。
- [ ] image 和 Git 中没有 `.env` 或密钥。
- [ ] 已接受 Demo 上传文件可能在重启后消失。

## 15. 常见错误

| 现象 | 检查内容 |
| --- | --- |
| Revision 无法 Ready | Nginx 是否监听 `$PORT`；startup migration 是否失败 |
| 数据库连接失败 | 是否使用 Session Pooler 5432；用户名是否包含 project ref；密码是否 URL encode |
| `Connection refused` | 检查 Supabase Network bans；停止旧密码反复连接 |
| 页面 500 或 Session 失效 | `APP_KEY` 是否存在并保持不变 |
| 页面生成 `http://` URL | Laravel trusted proxies 和 `APP_URL` 是否正确 |
| 静态资源 404 | image 是否包含 `public/build`；Nginx root 是否是 `public` |
| 上传出现 413 | Cloud Run 32 MiB、Nginx `client_max_body_size`、PHP `post_max_size` |
| 小文件仍上传失败 | PHP `upload_max_filesize` 是否仍为默认 2M |
| 上传后文件消失 | Cloud Run 本地文件系统不是永久存储 |
| Queue 不执行 | Demo 使用 `QUEUE_CONNECTION=sync`，否则需要独立 worker |
| 修改 `VITE_*` 后无变化 | `VITE_*` 是 build-time 配置，必须重新构建 image |

## 16. 正式部署前清单

- [ ] 数据库密码已经重置。
- [ ] Docker Desktop 正在运行。
- [ ] `gcloud` 已安装并登录正确 project。
- [ ] PHP 上传限制已加入 Docker image。
- [ ] Laravel 已正确处理 Cloud Run HTTPS proxy。
- [ ] `docker build` 成功。
- [ ] 本机容器 `/up` 返回 200。
- [ ] Artifact Registry image 或公开 GHCR image 构建成功。
- [ ] Secret Manager 已建立并授权 service account。
- [ ] Cloud Run 使用 Session Pooler，而不是 Direct URI。
- [ ] Cloud Run 区域是 `asia-southeast1`。
- [ ] `APP_DEBUG=false`、`LOG_CHANNEL=stderr`。
- [ ] `APP_URL` 和 Google OAuth callback 已更新为真实 HTTPS URL。
- [ ] Git 中的重要部署文件已经审核、提交和推送。

## 官方资料

- Cloud Run container contract：https://cloud.google.com/run/docs/container-contract
- Cloud Run 部署容器：https://cloud.google.com/run/docs/deploying
- Cloud Run Secret Manager：https://cloud.google.com/run/docs/configuring/services/secrets
- Cloud Run 配额：https://cloud.google.com/run/quotas
- Artifact Registry：https://cloud.google.com/artifact-registry/docs/docker/store-docker-container-images
- GitHub Container Registry 计费：https://docs.github.com/en/billing/concepts/product-billing/github-packages
- Supabase Laravel：https://supabase.com/docs/guides/getting-started/quickstarts/laravel
- Supabase 数据库连接：https://supabase.com/docs/guides/database/connecting-to-postgres
