# Miam's - Application de Recettes Aléatoires 🍽️

Une application web complète pour générer des menus aléatoires, gérer des recettes et créer des listes de courses optimisées.

## 📋 Fonctionnalités

- ✅ **Gestion d'ingrédients** par catégories (légumes, protéines, féculents, etc.)
- ✅ **Création de recettes** avec interface intuitive
- ✅ **Générateur de menus** aléatoires pour la semaine
- ✅ **Calcul automatique des prix** avec optimisation des quantités
- ✅ **Listes de courses intelligentes** groupées par catégorie
- ✅ **Alternatives de recettes** pour varier les menus
- ✅ **Analyse nutritionnelle** des menus
- ✅ **Export** des listes de courses (TXT, CSV, JSON)
- ✅ **API REST complète** avec validation
- ✅ **Base de données MongoDB** pour la persistance

## 🛠️ Technologies

### Frontend
- **React 18** avec TypeScript
- **CSS3** pour le styling
- **Service API centralisé** pour les appels backend
- **Hooks personnalisés** pour la gestion d'état
- **Composants de statut** pour l'UX (loading, erreurs)

### Backend
- **Node.js** avec Express.js
- **MongoDB** avec Mongoose
- **Express Validator** pour la validation
- **Pattern Controller** pour l'organisation du code
- **CORS, Helmet, Morgan** pour la sécurité et les logs

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 16+ 
- MongoDB 5+
- npm ou yarn

### 1. Installation des dépendances

#### Serveur
```bash
cd server
npm install
```

#### Client
```bash
cd client
npm install
```

### 2. Configuration de l'environnement

Créer un fichier `.env` dans le dossier `server` avec :

```env
# Configuration MongoDB
MONGODB_URI=mongodb://localhost:27017/miam-s

# Configuration serveur
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Sécurité (à changer en production)
JWT_SECRET=votre-clé-jwt-super-secrète
SESSION_SECRET=votre-clé-session-super-secrète
```

### 3. Démarrage des services

#### Démarrer MongoDB
```bash
# Windows (avec MongoDB installé)
mongod

# Ou avec Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Démarrer le serveur (Port 5000)
```bash
cd server
npm run dev
```

#### Démarrer le client (Port 3000)
```bash
cd client
npm start
```

### 4. Accès à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000
- **Documentation API** : http://localhost:5000/api

## 📁 Structure du Projet

```
miam-s/
├── client/                 # Application React
│   ├── public/
│   ├── src/
│   │   ├── components/     # Composants React
│   │   │   ├── IngredientForm.tsx
│   │   │   ├── RecipeForm.tsx
│   │   │   ├── MenuGenerator.tsx
│   │   │   ├── ShoppingListView.tsx
│   │   │   └── StatusIndicator.tsx
│   │   ├── services/       # Services API
│   │   │   └── api.ts
│   │   ├── hooks/          # Hooks personnalisés
│   │   │   └── useApi.ts
│   │   ├── types.ts        # Types TypeScript
│   │   ├── App.tsx         # Composant principal
│   │   └── index.tsx
│   └── package.json
│
├── server/                 # API Express.js
│   ├── controllers/       # Controllers (pattern MVC)
│   │   ├── ingredientController.js
│   │   ├── recipeController.js
│   │   ├── menuController.js
│   │   └── shoppingController.js
│   ├── models/            # Modèles MongoDB
│   │   ├── Ingredient.js
│   │   ├── Recipe.js
│   │   ├── WeekMenu.js
│   │   └── ShoppingList.js
│   ├── routes/            # Routes API
│   │   ├── ingredients.js
│   │   ├── recipes.js
│   │   ├── menus.js
│   │   └── shopping.js
│   ├── .env               # Variables d'environnement
│   ├── index.js           # Point d'entrée
│   └── package.json
│
└── README.md
```

## 🔧 API Endpoints

### Ingrédients
- `GET /api/ingredients` - Liste des ingrédients (avec pagination, tri, filtres)
- `GET /api/ingredients/:id` - Détails d'un ingrédient
- `POST /api/ingredients` - Créer un ingrédient
- `POST /api/ingredients/bulk` - Créer plusieurs ingrédients
- `PUT /api/ingredients/:id` - Modifier un ingrédient
- `DELETE /api/ingredients/:id` - Supprimer un ingrédient
- `GET /api/ingredients/categories/stats` - Statistiques par catégorie

### Recettes
- `GET /api/recipes` - Liste des recettes (avec recherche et filtres)
- `GET /api/recipes/:id` - Détails d'une recette
- `POST /api/recipes` - Créer une recette
- `PUT /api/recipes/:id` - Modifier une recette
- `DELETE /api/recipes/:id` - Supprimer une recette
- `GET /api/recipes/random` - Recette aléatoire
- `POST /api/recipes/:id/rate` - Noter une recette
- `POST /api/recipes/:id/scale` - Adapter les portions

### Menus
- `GET /api/menus` - Liste des menus
- `GET /api/menus/:id` - Détails d'un menu
- `POST /api/menus` - Créer un menu
- `POST /api/menus/generate` - Générer un menu aléatoire
- `POST /api/menus/:id/shopping-list` - Générer une liste de courses
- `GET /api/menus/:id/nutrition` - Analyse nutritionnelle

### Listes de Courses
- `GET /api/shopping` - Liste des listes de courses
- `GET /api/shopping/:id` - Détails d'une liste
- `POST /api/shopping` - Créer une liste de courses
- `PUT /api/shopping/:id/items/:itemId/toggle` - Cocher/décocher un article
- `PUT /api/shopping/:id/optimize` - Optimiser une liste
- `POST /api/shopping/:id/export` - Exporter une liste

## 🏗️ Architecture

### Pattern MVC
Le backend utilise le pattern MVC (Model-View-Controller) :
- **Models** : Définition des schémas MongoDB avec Mongoose
- **Controllers** : Logique métier et traitement des requêtes
- **Routes** : Définition des endpoints et validation des données

### Service API Client
Le frontend utilise un service API centralisé avec :
- **Gestion d'erreurs** automatique
- **Types TypeScript** pour la sécurité
- **Hooks personnalisés** pour la gestion d'état
- **Fallback local** en cas d'indisponibilité du serveur

### Flux de données
1. **Client** → Formulaires React avec validation
2. **Service API** → Appels HTTP avec gestion d'erreurs
3. **Routes** → Validation avec Express Validator
4. **Controllers** → Logique métier
5. **Models** → Interaction avec MongoDB
6. **Réponse** → Format JSON standardisé

## 💡 Utilisation

### 1. Créer des ingrédients
- Aller dans l'onglet "Ingrédients"
- Remplir le formulaire avec nom, catégorie, prix, quantité et unité
- Cliquer sur "Ajouter l'ingrédient"

### 2. Créer des recettes
- Aller dans l'onglet "Recettes"
- Donner un nom à la recette
- Ajouter des ingrédients avec leurs quantités
- Définir les instructions, temps de préparation, etc.

### 3. Générer un menu
- Aller dans l'onglet "Menu"
- Définir vos préférences alimentaires
- Cliquer sur "Générer un menu aléatoire"
- Utiliser les alternatives pour varier

### 4. Créer une liste de courses
- Après avoir généré un menu
- Cliquer sur "Générer la liste de courses"
- Voir la liste optimisée dans l'onglet "Liste de Courses"

## 🎯 Fonctionnalités Avancées

### Optimisation des Quantités
L'application calcule automatiquement les quantités à acheter en unités complètes pour minimiser le gaspillage.

### Calcul des Prix
Les prix sont calculés en temps réel en fonction des quantités et des prix unitaires des ingrédients.

### Alternatives Intelligentes
Le système propose des alternatives de recettes en gardant le même type de repas et les préférences alimentaires.

### Export Flexible
Les listes de courses peuvent être exportées en plusieurs formats (TXT, CSV, JSON) pour différents usages.

## 🔒 Sécurité

- Validation des données côté serveur avec Express Validator
- Protection CORS configurée
- Helmet.js pour la sécurité des headers HTTP
- Variables d'environnement pour les données sensibles

## 📱 Responsive Design

L'interface est conçue pour être utilisable sur :
- 🖥️ Desktop
- 📱 Mobile
- 📺 Tablette

## 🚧 Développement

### Scripts disponibles

#### Serveur
```bash
npm start          # Démarrage production
npm run dev        # Démarrage développement avec nodemon
```

#### Client
```bash
npm start          # Démarrage développement
npm run build      # Build production
npm test           # Tests
```

### Contribuer

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Auteurs

- **TllzAudrey** - Développement initial

## 🆘 Support

En cas de problème :
1. Vérifier que MongoDB est démarré
2. Vérifier les ports 3000 et 5000 sont libres
3. Consulter les logs du serveur
4. Ouvrir une issue sur GitHub

---

**Bon appétit ! 🍽️**
