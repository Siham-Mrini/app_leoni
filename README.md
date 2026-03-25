# Application de Gestion et Suivi des Commandes

Ce projet est composé d'une API backend Laravel et d'un frontend React (Vite).

## 🚀 Installation et Démarrage

### 1. Backend (Laravel)
Le backend gère la logique métier, les stocks et l'API.

```powershell
cd app_stage_backend
# Installer les dépendances (si nécessaire)
composer install
# Configurer l'environnement
cp .env.example .env
php artisan key:generate
# Lancer les migrations et les tests
php artisan migrate
php artisan test
# Démarrer le serveur
php artisan serve
```

L'API sera disponible sur `http://localhost:8000`.

### 2. Frontend (React + Vite)
L'interface utilisateur pour la gestion des produits et des commandes.

```powershell
cd app_stage_frontend_vite
# Installer les dépendances
npm install
# Démarrer le projet en mode développement
npm run dev
```

L'application sera disponible sur `http://localhost:5173`.

## 📁 Structure du Projet
- `app_stage_backend/` : Code source Laravel (Modèles, Contrôleurs API, Migrations).
- `app_stage_frontend_vite/` : Code source React (Composants, Layouts, API Axios).

## 🛠️ Fonctionnalités Principales
- Gestion CRUD des Produits, Branches et Fournisseurs.
- Flux de commande : Passage de commande -> Réception -> Mise à jour du stock.
- Transferts Inter-Branches avec vérification de disponibilité.
- Suivi des Installations par branche.
- Dashboard analytique complet.
