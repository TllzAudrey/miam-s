const express = require('express');
const router = express.Router();
const { body, validationResult, query, param } = require('express-validator');
const menuController = require('../controllers/menuController');

// Validation middleware pour les menus
const validateMenu = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Le nom doit contenir entre 2 et 200 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
  body('startDate')
    .isISO8601()
    .withMessage('Date de début invalide'),
  body('endDate')
    .isISO8601()
    .withMessage('Date de fin invalide'),
  body('days')
    .isArray({ min: 1 })
    .withMessage('Au moins un jour est requis'),
  body('days.*.date')
    .isISO8601()
    .withMessage('Date invalide'),
  body('days.*.dayName')
    .isIn(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'])
    .withMessage('Nom de jour invalide'),
  body('days.*.meals')
    .isArray()
    .withMessage('Les repas doivent être un tableau'),
  body('days.*.meals.*.type')
    .isIn(['dejeuner', 'repas_du_midi', 'repas_du_soir', 'quatre_heure'])
    .withMessage('Type de repas invalide'),
  body('days.*.meals.*.recipe')
    .optional()
    .isMongoId()
    .withMessage('ID de recette invalide'),
  body('days.*.meals.*.servings')
    .isInt({ min: 1, max: 50 })
    .withMessage('Le nombre de portions doit être entre 1 et 50')
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

// GET /api/menus - Récupérer tous les menus
router.get('/', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('search').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['name', 'startDate', 'endDate', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, menuController.getAllMenus);

// GET /api/menus/:id - Récupérer un menu par ID
router.get('/:id', [
  param('id').isMongoId().withMessage('ID de menu invalide')
], handleValidationErrors, menuController.getMenuById);

// GET /api/menus/:id/nutrition - Calculer les informations nutritionnelles
router.get('/:id/nutrition', [
  param('id').isMongoId().withMessage('ID de menu invalide')
], handleValidationErrors, menuController.getMenuNutrition);

// POST /api/menus - Créer un nouveau menu
router.post('/', validateMenu, handleValidationErrors, menuController.createMenu);

// POST /api/menus/generate-week - Générer un menu aléatoire pour la semaine
router.post('/generate-week', [
  body('constraints').optional().isObject(),
  body('preferences').optional().isObject(),
  body('budget').optional().isNumeric().custom(value => value >= 0),
  body('servings').optional().isInt({ min: 1, max: 50 }),
  body('startDate').optional().isISO8601()
], handleValidationErrors, menuController.generateWeekMenu);

// POST /api/menus/:id/generate-shopping-list - Générer la liste de courses
router.post('/:id/generate-shopping-list', [
  param('id').isMongoId().withMessage('ID de menu invalide')
], handleValidationErrors, menuController.generateShoppingList);

// PUT /api/menus/:id - Mettre à jour un menu
router.put('/:id', [
  param('id').isMongoId().withMessage('ID de menu invalide'),
  ...validateMenu
], handleValidationErrors, menuController.updateMenu);

// DELETE /api/menus/:id - Supprimer un menu
router.delete('/:id', [
  param('id').isMongoId().withMessage('ID de menu invalide')
], handleValidationErrors, menuController.deleteMenu);

module.exports = router;
