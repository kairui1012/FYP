FROM composer:2 AS vendor

WORKDIR /app
COPY finalyearproject/composer.json finalyearproject/composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader --no-scripts
COPY finalyearproject/ ./
RUN php artisan wayfinder:generate

FROM node:22-alpine AS frontend

WORKDIR /app
COPY finalyearproject/package.json finalyearproject/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY finalyearproject/ ./
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
COPY finalyearproject/ ./
COPY --from=frontend /app/public/build ./public/build
RUN rm -f bootstrap/cache/*.php

RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 8080
CMD ["sh", "-c", "php artisan config:cache && php artisan route:cache && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}"]
