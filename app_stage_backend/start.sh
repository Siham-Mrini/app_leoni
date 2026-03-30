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
# On ajoute le support pour les noms avec underscore et les noms de proxy Railway
export DB_HOST=${RAILWAY_TCP_PROXY_DOMAIN:-${MYSQLHOST:-${MYSQL_HOST:-${DB_HOST}}}}
export DB_PORT=${RAILWAY_TCP_PROXY_PORT:-${MYSQLPORT:-${MYSQL_PORT:-${DB_PORT:-3306}}}}
export DB_DATABASE=${MYSQL_DATABASE:-${MYSQLDATABASE:-${DB_DATABASE}}}
export DB_USERNAME=${MYSQL_USER:-${MYSQLUSER:-${DB_USERNAME}}}
export DB_PASSWORD=${MYSQL_PASSWORD:-${MYSQLPASSWORD:-${MYSQL_ROOT_PASSWORD:-${DB_PASSWORD}}}}

# Vérifier l'APP_KEY
if [ -z "$APP_KEY" ]; then
    echo "ATTENTION : APP_KEY est vide sur Railway. La connexion risque d'échouer."
fi

echo "Démarrage des migrations et seeds..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan migrate --force
php artisan db:seed --class=LeoniSeeder --force
echo "--- Fin de configuration ---"

php artisan serve --host=0.0.0.0 --port=$PORT
