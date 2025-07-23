const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const ingredientController = require('../controllers/ingredientController');

// Validation middleware
const validateIngredient = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('category')
    .isIn(['legume', 'proteine', 'feculent', 'sauce', 'fruit', 'epice', 'autre'])
    .withMessage('Catégorie non valide'),
  body('price')
    .isNumeric()
    .custom(value => value >= 0)
    .withMessage('Le prix doit être un nombre positif'),
  body('unit')
    .isIn(['g', 'kg', 'ml', 'l', 'piece', 'sachet', 'boite'])
    .withMessage('Unité non valide'),
  body('baseQuantity')
    .isNumeric()
    .custom(value => value > 0)
    .withMessage('La quantité de base doit être un nombre positif')
];

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Erreurs de validation',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/ingredients - Récupérer tous les ingrédients
router.get('/', [
  query('category').optional().isIn(['legume', 'proteine', 'feculent', 'sauce', 'fruit', 'epice', 'autre']),
  query('search').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['name', 'price', 'category', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, ingredientController.getAllIngredients);

// GET /api/ingredients/categories/stats - Statistiques par catégorie
router.get('/categories/stats', ingredientController.getCategoryStats);

// GET /api/ingredients/:id - Récupérer un ingrédient par ID
router.get('/:id', ingredientController.getIngredientById);

// POST /api/ingredients - Créer un nouvel ingrédient
router.post('/', validateIngredient, handleValidationErrors, ingredientController.createIngredient);

// POST /api/ingredients/bulk - Créer plusieurs ingrédients
router.post('/bulk', [
  body('ingredients').isArray({ min: 1 }).withMessage('Le tableau d\'ingrédients est requis'),
  body('ingredients.*.name').trim().isLength({ min: 2, max: 100 }),
  body('ingredients.*.category').isIn(['legume', 'proteine', 'feculent', 'sauce', 'fruit', 'epice', 'autre']),
  body('ingredients.*.price').isNumeric().custom(value => value >= 0),
  body('ingredients.*.unit').isIn(['g', 'kg', 'ml', 'l', 'piece', 'sachet', 'boite']),
  body('ingredients.*.baseQuantity').isNumeric().custom(value => value > 0)
], handleValidationErrors, ingredientController.createBulkIngredients);

// PUT /api/ingredients/:id - Mettre à jour un ingrédient
router.put('/:id', validateIngredient, handleValidationErrors, ingredientController.updateIngredient);

// DELETE /api/ingredients/:id - Supprimer un ingrédient
router.delete('/:id', ingredientController.deleteIngredient);

module.exports = router;
