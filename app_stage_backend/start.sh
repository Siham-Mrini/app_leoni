#!/bin/bash
# Script de démarrage pour Railway

echo "--- Configuration du déploiement ---"
# Forcer l'utilisation de MySQL sur Railway
export DB_CONNECTION=mysql

# Mapper les variables Railway si nécessaire
export DB_HOST=${MYSQLHOST:-$DB_HOST}
export DB_PORT=${MYSQLPORT:-$DB_PORT}
export DB_DATABASE=${MYSQLDATABASE:-$DB_DATABASE}
export DB_USERNAME=${MYSQLUSER:-$DB_USERNAME}
export DB_PASSWORD=${MYSQLPASSWORD:-$DB_PASSWORD}

php artisan config:clear
php artisan migrate --force
php artisan db:seed --force
echo "--- Fin de configuration ---"

php artisan serve --host=0.0.0.0 --port=$PORT
