FROM composer:2 AS vendor

WORKDIR /app
COPY jomstudy-app/composer.json jomstudy-app/composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader --no-scripts
COPY jomstudy-app/ ./
RUN php artisan wayfinder:generate

FROM node:22-alpine AS frontend

WORKDIR /app
COPY jomstudy-app/package.json jomstudy-app/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY jomstudy-app/ ./
COPY --from=vendor /app/resources/js/actions ./resources/js/actions
COPY --from=vendor /app/resources/js/routes ./resources/js/routes
COPY --from=vendor /app/resources/js/wayfinder ./resources/js/wayfinder
RUN VITE_WAYFINDER=false npm run build

FROM php:8.2-fpm-alpine AS app

WORKDIR /var/www/html

RUN apk add --no-cache \
	bash \
	curl \
	icu-dev \
	libzip-dev \
	oniguruma-dev \
	unzip \
	zip \
	&& docker-php-ext-install -j"$(nproc)" \
	bcmath \
	intl \
	mbstring \
	pdo_mysql \
	zip

COPY --from=vendor /app/vendor ./vendor
COPY jomstudy-app/ ./
COPY --from=frontend /app/public/build ./public/build
RUN rm -f bootstrap/cache/*.php \
	&& mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs

RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000
CMD ["sh", "-c", "php artisan config:cache && php-fpm -F"]
