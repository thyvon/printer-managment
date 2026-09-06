#!/bin/sh

# Generate .env from environment variables if it doesn't exist
if [ ! -f /var/www/html/.env ]; then
    echo "Generating .env from environment variables..."
    cat > /var/www/html/.env << EOF
APP_NAME="${APP_NAME:-Printer MPS}"
APP_ENV=${APP_ENV:-production}
APP_DEBUG=${APP_DEBUG:-false}
APP_URL=${APP_URL:-http://localhost}
APP_KEY=${APP_KEY:-}
DB_CONNECTION=${DB_CONNECTION:-pgsql}
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_DATABASE=${DB_DATABASE:-printer_mps}
DB_USERNAME=${DB_USERNAME:-printer}
DB_PASSWORD=${DB_PASSWORD:-password}
REDIS_CLIENT=${REDIS_CLIENT:-phpredis}
REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}
QUEUE_CONNECTION=${QUEUE_CONNECTION:-redis}
SESSION_DRIVER=${SESSION_DRIVER:-redis}
CACHE_STORE=${CACHE_STORE:-redis}
MAIL_MAILER=${MAIL_MAILER:-log}
EOF
    chown www-data:www-data /var/www/html/.env
fi

# Generate app key if not set
if grep -q "APP_KEY=$" /var/www/html/.env 2>/dev/null; then
    echo "Generating APP_KEY..."
    php artisan key:generate --force
fi

# Run migrations
echo "Running migrations..."
php artisan migrate --force 2>/dev/null || true

# Execute the original command
exec "$@"
