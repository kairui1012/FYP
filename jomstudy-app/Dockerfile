FROM composer:2 AS vendor

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader --no-scripts
COPY . ./
RUN mkdir -p \
	storage/framework/cache/data \
	storage/framework/sessions \
	storage/framework/views \
	storage/logs \
	&& php artisan wayfinder:generate

FROM node:22-alpine AS frontend

WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . ./
COPY --from=vendor /app/resources/js/actions ./resources/js/actions
COPY --from=vendor /app/resources/js/routes ./resources/js/routes
COPY --from=vendor /app/resources/js/wayfinder ./resources/js/wayfinder
RUN VITE_WAYFINDER=false npm run build

FROM php:8.2-fpm-alpine AS app

WORKDIR /var/www/html

RUN apk add --no-cache \
	bash \
	curl \
	gettext \
	icu-dev \
	libzip-dev \
	nginx \
	oniguruma-dev \
	postgresql-dev \
	supervisor \
	unzip \
	zip \
	&& docker-php-ext-install -j"$(nproc)" \
	bcmath \
	intl \
	mbstring \
	pdo_pgsql \
	zip

COPY --from=vendor /app/vendor ./vendor
COPY . ./
COPY --from=frontend /app/public/build ./public/build
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/php/jomstudy.ini /usr/local/etc/php/conf.d/zz-jomstudy.ini
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/start-container.sh /usr/local/bin/start-container
RUN rm -f bootstrap/cache/*.php \
	&& rm -f /etc/nginx/http.d/default.conf \
	&& mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs \
	&& chmod +x /usr/local/bin/start-container

RUN chown -R www-data:www-data storage bootstrap/cache

ENV PORT=8080

EXPOSE 8080
CMD ["/usr/local/bin/start-container"]
