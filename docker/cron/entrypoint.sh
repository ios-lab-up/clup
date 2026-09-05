#!/bin/sh
set -e

# cron no hereda el entorno del contenedor; lo persistimos para que el job
# definido en crontab pueda leer CRON_SECRET y CRON_TARGET_URL.
printenv | grep -E '^(CRON_SECRET|CRON_TARGET_URL)=' > /etc/environment

touch /var/log/cron.log
crontab /etc/crontabs/root

# -f: foreground (requerido para que sea el proceso principal del contenedor)
exec crond -f -l 2
