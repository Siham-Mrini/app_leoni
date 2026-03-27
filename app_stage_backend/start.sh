#!/bin/bash
# Script de démarrage pour Railway

echo "--- Diagnostic du déploiement ---"
php artisan config:clear
php artisan migrate --force
php artisan db:seed --force
echo "--- Fin du diagnostic ---"

php artisan serve --host=0.0.0.0 --port=$PORT
