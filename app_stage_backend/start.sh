#!/bin/bash
# Script de démarrage pour Railway

echo "--- Configuration du déploiement ---"
# Forcer l'utilisation de MySQL sur Railway
export DB_CONNECTION=mysql

# Utiliser l'URL de base de données Railway si elle existe
if [ ! -z "$MYSQL_URL" ]; then
    export DB_URL=$MYSQL_URL
    echo "Using MYSQL_URL"
elif [ ! -z "$DATABASE_URL" ]; then
    export DB_URL=$DATABASE_URL
    echo "Using DATABASE_URL"
fi

# Fallback sur les variables individuelles de Railway
export DB_HOST=${MYSQLHOST:-${DB_HOST}}
export DB_PORT=${MYSQLPORT:-${DB_PORT:-3306}}
export DB_DATABASE=${MYSQLDATABASE:-${DB_DATABASE}}
export DB_USERNAME=${MYSQLUSER:-${DB_USERNAME}}
export DB_PASSWORD=${MYSQLPASSWORD:-${DB_PASSWORD}}

# Vérifier l'APP_KEY
if [ -z "$APP_KEY" ]; then
    echo "ATTENTION : APP_KEY est vide sur Railway. La connexion risque d'échouer."
fi

echo "Démarrage des migrations et seeds..."
php artisan config:clear
php artisan migrate --force
php artisan db:seed --force
echo "--- Fin de configuration ---"

php artisan serve --host=0.0.0.0 --port=$PORT
