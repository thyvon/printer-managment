FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    git curl libpng-dev libxml2-dev zip unzip libpq-dev icu-dev \
    gcc make musl-dev \
    && docker-php-ext-install pdo_pgsql bcmath mbstring exif pcntl gd intl \
    && pecl install redis && docker-php-ext-enable redis \
    && apk del gcc make musl-dev

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize \
    && mkdir -p storage/framework/{cache,sessions,testing,views} \
    && mkdir -p storage/logs \
    && mkdir -p bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]
