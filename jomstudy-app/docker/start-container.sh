#!/bin/sh

set -eu

: "${PORT:=8080}"
export PORT

envsubst '${PORT}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/http.d/default.conf

php artisan config:clear
php artisan db:prepare-supabase
php artisan migrate --force
php artisan config:cache

exec /usr/bin/supervisord -c /etc/supervisord.conf
