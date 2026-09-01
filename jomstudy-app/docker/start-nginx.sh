#!/bin/sh

set -eu

until php -r '$socket = @fsockopen("127.0.0.1", 9000); if ($socket === false) { exit(1); } fclose($socket);' >/dev/null 2>&1; do
    sleep 0.1
done

exec nginx -g "daemon off;"
