const express = require('express');
const router = express.Router();
const { body, validationResult, query, param } = require('express-validator');
const recipeController = require('../controllers/recipeController');

// Validation middleware pour les recettes
const validateRecipe = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Le nom doit contenir entre 2 et 200 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
  body('ingredients')
    .isArray({ min: 1 })
    .withMessage('Au moins un ingrédient est requis'),
  body('ingredients.*.ingredient')
    .isMongoId()
    .withMessage('ID d\'ingrédient invalide'),
  body('ingredients.*.quantity')
    .isNumeric()
    .custom(value => value > 0)
    .withMessage('La quantité doit être un nombre positif'),
  body('preparationTime')
    .isInt({ min: 1 })
    .withMessage('Le temps de préparation doit être un entier positif'),
  body('cookingTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le temps de cuisson doit être un entier positif ou nul'),
  body('difficulty')
    .isIn(['facile', 'moyen', 'difficile'])
    .withMessage('Difficulté non valide'),
  body('type')
    .isIn(['entree', 'plat', 'dessert', 'boisson', 'sauce', 'autre'])
    .withMessage('Type de recette non valide'),
  body('servings')
    .isInt({ min: 1, max: 50 })
    .withMessage('Le nombre de portions doit être entre 1 et 50'),
  body('instructions')
    .isArray({ min: 1 })
    .withMessage('Au moins une instruction est requise'),
  body('instructions.*')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Chaque instruction doit contenir au moins 10 caractères')
];

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/recipes - Récupérer toutes les recettes
router.get('/', [
  query('type').optional().isIn(['entree', 'plat', 'dessert', 'boisson', 'sauce', 'autre']),
  query('difficulty').optional().isIn(['facile', 'moyen', 'difficile']),
  query('search').optional().isString().trim(),
  query('maxTime').optional().isInt({ min: 1 }),
  query('tags').optional().isString(),
  query('ingredients').optional().isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['name', 'difficulty', 'preparationTime', 'cookingTime', 'rating', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, recipeController.getAllRecipes);

// GET /api/recipes/search/advanced - Recherche avancée
router.get('/search/advanced', recipeController.advancedSearch);

// GET /api/recipes/random/:count - Récupérer des recettes aléatoires
router.get('/random/:count', [
  param('count').isInt({ min: 1, max: 50 }).withMessage('Le nombre de recettes doit être entre 1 et 50')
], handleValidationErrors, recipeController.getRandomRecipes);

// GET /api/recipes/:id - Récupérer une recette par ID
router.get('/:id', [
  param('id').isMongoId().withMessage('ID de recette invalide')
], handleValidationErrors, recipeController.getRecipeById);

// GET /api/recipes/:id/scale/:servings - Adapter une recette pour un nombre de portions
router.get('/:id/scale/:servings', [
  param('id').isMongoId().withMessage('ID de recette invalide'),
  param('servings').isInt({ min: 1, max: 50 }).withMessage('Le nombre de portions doit être entre 1 et 50')
], handleValidationErrors, recipeController.scaleRecipe);

// POST /api/recipes - Créer une nouvelle recette
router.post('/', validateRecipe, handleValidationErrors, recipeController.createRecipe);

// POST /api/recipes/:id/rating - Ajouter une note à une recette
router.post('/:id/rating', [
  param('id').isMongoId().withMessage('ID de recette invalide'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5')
], handleValidationErrors, recipeController.addRating);

// PUT /api/recipes/:id - Mettre à jour une recette
router.put('/:id', [
  param('id').isMongoId().withMessage('ID de recette invalide'),
  ...validateRecipe
], handleValidationErrors, recipeController.updateRecipe);

// DELETE /api/recipes/:id - Supprimer une recette
router.delete('/:id', [
  param('id').isMongoId().withMessage('ID de recette invalide')
], handleValidationErrors, recipeController.deleteRecipe);

module.exports = router;
