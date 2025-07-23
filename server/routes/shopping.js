const express = require('express');
const router = express.Router();
const { body, validationResult, query, param } = require('express-validator');
const shoppingController = require('../controllers/shoppingController');

// Validation middleware pour les listes de courses
const validateShoppingList = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Le nom doit contenir entre 2 et 200 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
  body('menu')
    .optional()
    .isMongoId()
    .withMessage('ID de menu invalide'),
  body('items')
    .optional()
    .isArray()
    .withMessage('Les articles doivent être un tableau'),
  body('items.*.ingredient')
    .isMongoId()
    .withMessage('ID d\'ingrédient invalide'),
  body('items.*.quantity')
    .isNumeric()
    .custom(value => value > 0)
    .withMessage('La quantité doit être un nombre positif'),
  body('items.*.unit')
    .isIn(['g', 'kg', 'ml', 'l', 'piece', 'sachet', 'boite'])
    .withMessage('Unité non valide'),
  body('items.*.estimatedPrice')
    .optional()
    .isNumeric()
    .custom(value => value >= 0)
    .withMessage('Le prix estimé doit être un nombre positif'),
  body('totalCost')
    .optional()
    .isNumeric()
    .custom(value => value >= 0)
    .withMessage('Le coût total doit être un nombre positif'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed'])
    .withMessage('Statut invalide'),
  body('isCompleted')
    .optional()
    .isBoolean()
    .withMessage('isCompleted doit être un booléen')
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

// GET /api/shopping - Récupérer toutes les listes de courses
router.get('/', [
  query('status').optional().isIn(['pending', 'in_progress', 'completed']),
  query('isCompleted').optional().isBoolean().toBoolean(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('search').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['name', 'createdAt', 'totalCost', 'status']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, shoppingController.getAllShoppingLists);

// GET /api/shopping/:id - Récupérer une liste de courses par ID
router.get('/:id', [
  param('id').isMongoId().withMessage('ID de liste de courses invalide')
], handleValidationErrors, shoppingController.getShoppingListById);

// GET /api/shopping/:id/export - Exporter la liste de courses
router.get('/:id/export', [
  param('id').isMongoId().withMessage('ID de liste de courses invalide'),
  query('format').optional().isIn(['json', 'txt']).withMessage('Format d\'export invalide')
], handleValidationErrors, shoppingController.exportShoppingList);

// POST /api/shopping - Créer une nouvelle liste de courses
router.post('/', validateShoppingList, handleValidationErrors, shoppingController.createShoppingList);

// POST /api/shopping/from-menu/:menuId - Créer une liste de courses depuis un menu
router.post('/from-menu/:menuId', [
  param('menuId').isMongoId().withMessage('ID de menu invalide')
], handleValidationErrors, shoppingController.createFromMenu);

// POST /api/shopping/:id/optimize - Optimiser la liste de courses
router.post('/:id/optimize', [
  param('id').isMongoId().withMessage('ID de liste de courses invalide')
], handleValidationErrors, shoppingController.optimizeShoppingList);

// PUT /api/shopping/:id - Mettre à jour une liste de courses
router.put('/:id', [
  param('id').isMongoId().withMessage('ID de liste de courses invalide'),
  ...validateShoppingList
], handleValidationErrors, shoppingController.updateShoppingList);

// PATCH /api/shopping/:id/toggle-item/:itemId - Basculer l'état d'un article
router.patch('/:id/toggle-item/:itemId', [
  param('id').isMongoId().withMessage('ID de liste de courses invalide'),
  param('itemId').isMongoId().withMessage('ID d\'article invalide')
], handleValidationErrors, shoppingController.toggleItem);

// DELETE /api/shopping/:id - Supprimer une liste de courses
router.delete('/:id', [
  param('id').isMongoId().withMessage('ID de liste de courses invalide')
], handleValidationErrors, shoppingController.deleteShoppingList);

module.exports = router;
