# JomStudy 部署到 Google Cloud Run

> 最后检查：2026-09-01。应用和 Cloud Run 容器已经通过本机验证，可以开始正式部署。当前还没有建立 Google Cloud 资源，也没有部署线上 revision。

所有命令都在 `jomstudy-app` 目录执行。

## 1. 已验证状态

- [x] Docker Desktop 正常。
- [x] 原生 ARM64 image 构建和运行成功。
- [x] Cloud Run 所需的 `linux/amd64` image 构建和运行成功。
- [x] 两个架构的 `/up` 和首页均返回 HTTP 200。
- [x] Nginx 监听 `$PORT=8080`，PHP-FPM 正常运行。
- [x] `public/build/manifest.json` 存在。
- [x] Supabase Session Pooler 可以连接，6 个 migrations 全部为 `Ran`。
- [x] PHP 配置生效：`upload_max_filesize=20M`、`post_max_size=30M`、`memory_limit=512M`。
- [x] Laravel 已配置 `trustProxies`，可以处理 Cloud Run HTTPS 代理。
- [x] `.env` 不会进入 Git 或 Docker image。
- [x] 容器启动不会执行 Demo Seeder。

仍需完成：

- [ ] 安装并登录 `gcloud`，或使用 Google Cloud Shell。
- [ ] 建立 Artifact Registry、Secret Manager secrets 和 Cloud Run service account。
- [ ] 构建并上传生产 image。
- [ ] 部署 Cloud Run revision。
- [ ] 更新真实 `APP_URL` 并执行线上测试。
- [ ] 审核、提交并推送当前工作区修改。

## 2. 部署方案

```text
浏览器 HTTPS
  → Cloud Run（asia-southeast1）
  → Nginx（$PORT=8080）
  → PHP-FPM
  → Laravel
  → Supabase Session Pooler（5432 + SSL）
```

Cloud Run 只部署 [Dockerfile](./Dockerfile) 构建的单个 image，不读取 `docker-compose.yml`。

当前 Demo：

- 使用 Supabase Session Pooler 5432。
- 最多运行 1 个 Cloud Run instance。
- migrations 在容器启动时执行。
- `QUEUE_CONNECTION=sync`。
- 上传文件暂存在容器本地磁盘，实例重启、缩容或更换 revision 后可能消失。

## 3. Google Secret Manager 放什么

不要上传整份 `.env`。每个敏感值建立一个独立 secret，secret value 只放等号右边的内容，不要包含变量名、引号或说明文字。

### 基础网站必需

| Secret Manager 名称 | Cloud Run 环境变量 | 放入的内容 |
| --- | --- | --- |
| `jomstudy-prod-app-key` | `APP_KEY` | `php artisan key:generate --show` 输出的完整 `base64:...` |
| `jomstudy-prod-db-url` | `DB_URL` | 当前 Supabase Session Pooler 完整 URI |

`DB_URL` 应类似：

```text
postgresql://postgres.PROJECT_REF:ENCODED_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

密码包含 `@`、`#`、`/`、`?` 等字符时，必须在 URI 中进行 URL encode。

### 按功能选配

| Secret Manager 名称 | Cloud Run 环境变量 | 什么时候需要 |
| --- | --- | --- |
| `jomstudy-prod-google-client-secret` | `GOOGLE_CLIENT_SECRET` | 启用 Google 登录 |
| `jomstudy-prod-deepseek-api-key` | `DEEPSEEK_API_KEY` | 启用 DeepSeek AI |
| `jomstudy-prod-mail-url` | `MAIL_URL` | 发送真实邮件 |

以下不是 secret，使用 Cloud Run 普通环境变量：

- `GOOGLE_CLIENT_ID`
- `GOOGLE_REDIRECT_URI`
- `MAIL_FROM_ADDRESS`
- `MAIL_FROM_NAME`
- `APP_URL`、`APP_ENV`、`APP_DEBUG`
- `DB_CONNECTION`、`DB_SSLMODE`、`DB_SCHEMA`

当前本机没有 Google OAuth、DeepSeek 和真实邮件配置。它们不阻止基础网站上线，但对应功能会不可用；当前 `MAIL_MAILER=log` 不会把密码重置邮件发给用户。

不要把真实 secret 写入 Markdown、Git、Dockerfile、Docker build arguments、截图或前端 `VITE_*` 变量。

## 4. 准备 Google Cloud

本机目前没有安装 `gcloud`。可以安装 Google Cloud CLI，也可以在 Google Cloud Console 使用已预装 `gcloud` 的 Cloud Shell。

```bash
gcloud auth login

export JOMSTUDY_GCP_PROJECT="YOUR_PROJECT_ID"
export JOMSTUDY_GCP_REGION="asia-southeast1"
export JOMSTUDY_AR_REPOSITORY="jomstudy"
export JOMSTUDY_IMAGE="jomstudy-app"
export JOMSTUDY_SERVICE="jomstudy"

gcloud config set project "$JOMSTUDY_GCP_PROJECT"

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

建立 Artifact Registry：

```bash
gcloud artifacts repositories create "$JOMSTUDY_AR_REPOSITORY" \
  --repository-format=docker \
  --location="$JOMSTUDY_GCP_REGION" \
  --description="JomStudy container images"
```

如果同名 repository 已存在，跳过建立命令。

## 5. 建立 secrets

### APP_KEY

先产生生产 APP key：

```bash
php artisan key:generate --show
```

建立 secret，然后在终端粘贴完整 `base64:...`，按 `Ctrl+D`：

```bash
gcloud secrets create jomstudy-prod-app-key --replication-policy=automatic
gcloud secrets versions add jomstudy-prod-app-key --data-file=-
```

所有 revision 必须持续使用同一个 APP key，否则既有加密数据和 Session 可能失效。

### DB_URL

建立 secret，然后粘贴当前 Supabase Session Pooler 完整 URI，按 `Ctrl+D`：

```bash
gcloud secrets create jomstudy-prod-db-url --replication-policy=automatic
gcloud secrets versions add jomstudy-prod-db-url --data-file=-
```

如果 secret 已存在，跳过 `gcloud secrets create`，只执行 `gcloud secrets versions add ... --data-file=-` 增加新版本。

### 可选 secrets

只建立这次需要启用的功能：

```bash
# Google OAuth Client secret
gcloud secrets create jomstudy-prod-google-client-secret --replication-policy=automatic
gcloud secrets versions add jomstudy-prod-google-client-secret --data-file=-

# DeepSeek API key
gcloud secrets create jomstudy-prod-deepseek-api-key --replication-policy=automatic
gcloud secrets versions add jomstudy-prod-deepseek-api-key --data-file=-

# 完整 SMTP URI
gcloud secrets create jomstudy-prod-mail-url --replication-policy=automatic
gcloud secrets versions add jomstudy-prod-mail-url --data-file=-
```

## 6. 建立 Cloud Run service account 并授权

```bash
export JOMSTUDY_RUN_SERVICE_ACCOUNT="jomstudy-run@$JOMSTUDY_GCP_PROJECT.iam.gserviceaccount.com"

gcloud iam service-accounts create jomstudy-run \
  --display-name="JomStudy Cloud Run"

gcloud secrets add-iam-policy-binding jomstudy-prod-app-key \
  --member="serviceAccount:$JOMSTUDY_RUN_SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding jomstudy-prod-db-url \
  --member="serviceAccount:$JOMSTUDY_RUN_SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

如果建立了可选 secret，也要授权同一个 service account：

```bash
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:$JOMSTUDY_RUN_SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

把 `SECRET_NAME` 替换成实际建立的可选 secret 名称。

## 7. 构建并上传生产 image

```bash
export JOMSTUDY_IMAGE_URI="$JOMSTUDY_GCP_REGION-docker.pkg.dev/$JOMSTUDY_GCP_PROJECT/$JOMSTUDY_AR_REPOSITORY/$JOMSTUDY_IMAGE"

gcloud builds submit --tag "$JOMSTUDY_IMAGE_URI"
```

构建成功后，在 Artifact Registry 确认 image 已存在。

## 8. 第一次部署

基础网站只注入 `APP_KEY` 和 `DB_URL`：

```bash
gcloud run deploy "$JOMSTUDY_SERVICE" \
  --image="$JOMSTUDY_IMAGE_URI" \
  --region="$JOMSTUDY_GCP_REGION" \
  --service-account="$JOMSTUDY_RUN_SERVICE_ACCOUNT" \
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

如果 secret 的生产版本不是 `1`，把 `:1` 改成实际版本号。

取得服务 URL 并更新 `APP_URL`：

```bash
export JOMSTUDY_SERVICE_URL="$(gcloud run services describe "$JOMSTUDY_SERVICE" \
  --region="$JOMSTUDY_GCP_REGION" \
  --format='value(status.url)')"

gcloud run services update "$JOMSTUDY_SERVICE" \
  --region="$JOMSTUDY_GCP_REGION" \
  --update-env-vars="APP_URL=$JOMSTUDY_SERVICE_URL"
```

## 9. 启用可选功能

### Google OAuth

在 Google OAuth Client 加入 callback：

```text
https://实际CloudRun地址/login/google/callback
```

```bash
export JOMSTUDY_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"

gcloud run services update "$JOMSTUDY_SERVICE" \
  --region="$JOMSTUDY_GCP_REGION" \
  --update-env-vars="GOOGLE_CLIENT_ID=$JOMSTUDY_GOOGLE_CLIENT_ID,GOOGLE_REDIRECT_URI=$JOMSTUDY_SERVICE_URL/login/google/callback" \
  --update-secrets="GOOGLE_CLIENT_SECRET=jomstudy-prod-google-client-secret:1"
```

### DeepSeek

```bash
gcloud run services update "$JOMSTUDY_SERVICE" \
  --region="$JOMSTUDY_GCP_REGION" \
  --update-secrets="DEEPSEEK_API_KEY=jomstudy-prod-deepseek-api-key:1"
```

### 真实邮件

```bash
gcloud run services update "$JOMSTUDY_SERVICE" \
  --region="$JOMSTUDY_GCP_REGION" \
  --update-env-vars="MAIL_MAILER=smtp,MAIL_FROM_ADDRESS=noreply@YOUR_DOMAIN,MAIL_FROM_NAME=JomStudy" \
  --update-secrets="MAIL_URL=jomstudy-prod-mail-url:1"
```

## 10. 部署后检查

```bash
curl --fail --show-error --include "$JOMSTUDY_SERVICE_URL/up"
curl --head "$JOMSTUDY_SERVICE_URL"

gcloud run services logs read "$JOMSTUDY_SERVICE" \
  --region="$JOMSTUDY_GCP_REGION" \
  --limit=100
```

必须确认：

- [ ] `/up` 返回 HTTP 200。
- [ ] 首页、CSS 和 JavaScript 正常。
- [ ] 注册、登录、Session 和登出正常。
- [ ] Supabase 连接正常，6 个 migrations 仍为 `Ran`。
- [ ] URL、redirect 和 Cookie 使用 HTTPS。
- [ ] 日志写入 stdout/stderr。
- [ ] image 和 Git 中没有 `.env` 或真实 secret。
- [ ] 已接受 Demo 上传文件不是永久存储。
- [ ] 已启用的 Google OAuth、DeepSeek、邮件功能分别通过实际测试。

## 11. 提交前注意

当前工作区还有其他修改，并且 `FYP` 根目录存在旧 Docker 文件的删除记录。提交前逐项审核，不要使用宽泛的 `git add .`。

至少确认这些部署文件已经提交和推送：

- `jomstudy-app/Dockerfile`
- `jomstudy-app/docker/`
- `jomstudy-app/bootstrap/app.php`
- `jomstudy-app/CLOUD_RUN_DEPLOYMENT.md`

## 官方资料

- [Cloud Run container contract](https://cloud.google.com/run/docs/container-contract)
- [Deploying container images to Cloud Run](https://cloud.google.com/run/docs/deploying)
- [Cloud Run Secret Manager](https://cloud.google.com/run/docs/configuring/services/secrets)
- [Artifact Registry](https://cloud.google.com/artifact-registry/docs/docker/store-docker-container-images)
