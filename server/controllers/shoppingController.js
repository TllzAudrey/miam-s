const ShoppingList = require('../models/ShoppingList');
const WeekMenu = require('../models/WeekMenu');
const Ingredient = require('../models/Ingredient');

class ShoppingController {
  // GET /api/shopping - Récupérer toutes les listes de courses
  async getAllShoppingLists(req, res) {
    try {
      const {
        status,
        isCompleted,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search
      } = req.query;

      // Construire le filtre
      let filter = {};
      
      if (status) filter.status = status;
      if (isCompleted !== undefined) filter.isCompleted = isCompleted === 'true';
      
      if (startDate) {
        filter.createdAt = { $gte: new Date(startDate) };
      }
      
      if (endDate) {
        filter.createdAt = { 
          ...filter.createdAt,
          $lte: new Date(endDate) 
        };
      }
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Options de tri
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Calculer la pagination
      const skip = (page - 1) * limit;

      // Exécuter la requête
      const [shoppingLists, total] = await Promise.all([
        ShoppingList.find(filter)
          .populate('menu', 'name startDate endDate')
          .populate('items.ingredient', 'name unit price baseQuantity category')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        ShoppingList.countDocuments(filter)
      ]);

      // Calculer les métadonnées de pagination
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        data: shoppingLists,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des listes de courses:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/shopping/:id - Récupérer une liste de courses par ID
  async getShoppingListById(req, res) {
    try {
      const shoppingList = await ShoppingList.findById(req.params.id)
        .populate('menu', 'name startDate endDate description')
        .populate('items.ingredient', 'name unit price baseQuantity category nutritionalInfo');
      
      if (!shoppingList) {
        return res.status(404).json({
          success: false,
          message: 'Liste de courses non trouvée'
        });
      }

      res.json({
        success: true,
        data: shoppingList
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste de courses:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de liste de courses invalide'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // POST /api/shopping - Créer une nouvelle liste de courses
  async createShoppingList(req, res) {
    try {
      // Vérifier que le menu existe si fourni
      if (req.body.menu) {
        const menu = await WeekMenu.findById(req.body.menu);
        if (!menu) {
          return res.status(400).json({
            success: false,
            message: 'Menu non trouvé'
          });
        }
      }

      // Vérifier que tous les ingrédients existent
      if (req.body.items && req.body.items.length > 0) {
        const ingredientIds = req.body.items.map(item => item.ingredient);
        const existingIngredients = await Ingredient.find({ _id: { $in: ingredientIds } });
        
        if (existingIngredients.length !== ingredientIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Un ou plusieurs ingrédients n\'existent pas'
          });
        }
      }

      const shoppingList = new ShoppingList(req.body);
      await shoppingList.save();
      
      // Populate la liste créée pour la réponse
      await shoppingList.populate('menu', 'name startDate endDate');
      await shoppingList.populate('items.ingredient', 'name unit price baseQuantity category');

      res.status(201).json({
        success: true,
        message: 'Liste de courses créée avec succès',
        data: shoppingList
      });
    } catch (error) {
      console.error('Erreur lors de la création de la liste de courses:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // PUT /api/shopping/:id - Mettre à jour une liste de courses
  async updateShoppingList(req, res) {
    try {
      // Vérifier que le menu existe si fourni
      if (req.body.menu) {
        const menu = await WeekMenu.findById(req.body.menu);
        if (!menu) {
          return res.status(400).json({
            success: false,
            message: 'Menu non trouvé'
          });
        }
      }

      // Vérifier que tous les ingrédients existent
      if (req.body.items && req.body.items.length > 0) {
        const ingredientIds = req.body.items.map(item => item.ingredient);
        const existingIngredients = await Ingredient.find({ _id: { $in: ingredientIds } });
        
        if (existingIngredients.length !== ingredientIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Un ou plusieurs ingrédients n\'existent pas'
          });
        }
      }

      const shoppingList = await ShoppingList.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('menu', 'name startDate endDate')
       .populate('items.ingredient', 'name unit price baseQuantity category');

      if (!shoppingList) {
        return res.status(404).json({
          success: false,
          message: 'Liste de courses non trouvée'
        });
      }

      res.json({
        success: true,
        message: 'Liste de courses mise à jour avec succès',
        data: shoppingList
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la liste de courses:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de liste de courses invalide'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // DELETE /api/shopping/:id - Supprimer une liste de courses
  async deleteShoppingList(req, res) {
    try {
      const shoppingList = await ShoppingList.findByIdAndDelete(req.params.id);

      if (!shoppingList) {
        return res.status(404).json({
          success: false,
          message: 'Liste de courses non trouvée'
        });
      }

      res.json({
        success: true,
        message: 'Liste de courses supprimée avec succès',
        data: { deletedId: req.params.id }
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la liste de courses:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de liste de courses invalide'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // POST /api/shopping/from-menu/:menuId - Créer une liste de courses depuis un menu
  async createFromMenu(req, res) {
    try {
      const menu = await WeekMenu.findById(req.params.menuId)
        .populate({
          path: 'days.meals.recipe',
          populate: {
            path: 'ingredients.ingredient',
            select: 'name unit price baseQuantity category'
          }
        });
      
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menu non trouvé'
        });
      }

      const shoppingListData = menu.generateShoppingList();
      
      // Créer la liste de courses
      const shoppingList = new ShoppingList({
        name: `Liste pour ${menu.name}`,
        description: `Générée automatiquement pour le menu du ${menu.startDate.toLocaleDateString('fr-FR')}`,
        menu: menu._id,
        items: shoppingListData.items,
        totalCost: shoppingListData.totalCost,
        isCompleted: false,
        status: 'pending'
      });

      await shoppingList.save();
      
      // Populate pour la réponse
      await shoppingList.populate('menu', 'name startDate endDate');
      await shoppingList.populate('items.ingredient', 'name unit price baseQuantity category');

      res.status(201).json({
        success: true,
        message: 'Liste de courses créée depuis le menu avec succès',
        data: shoppingList
      });
    } catch (error) {
      console.error('Erreur lors de la création de la liste depuis le menu:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // PATCH /api/shopping/:id/toggle-item/:itemId - Basculer l'état d'un article
  async toggleItem(req, res) {
    try {
      const shoppingList = await ShoppingList.findById(req.params.id);
      
      if (!shoppingList) {
        return res.status(404).json({
          success: false,
          message: 'Liste de courses non trouvée'
        });
      }

      const item = shoppingList.items.id(req.params.itemId);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Article non trouvé dans la liste'
        });
      }

      item.isPurchased = !item.isPurchased;
      item.purchasedAt = item.isPurchased ? new Date() : null;
      
      // Recalculer le statut de completion
      const totalItems = shoppingList.items.length;
      const purchasedItems = shoppingList.items.filter(item => item.isPurchased).length;
      
      shoppingList.completionPercentage = totalItems > 0 ? (purchasedItems / totalItems) * 100 : 0;
      shoppingList.isCompleted = shoppingList.completionPercentage === 100;
      
      if (shoppingList.isCompleted && shoppingList.status === 'pending') {
        shoppingList.status = 'completed';
        shoppingList.completedAt = new Date();
      } else if (!shoppingList.isCompleted && shoppingList.status === 'completed') {
        shoppingList.status = 'in_progress';
        shoppingList.completedAt = null;
      }

      await shoppingList.save();
      
      res.json({
        success: true,
        message: `Article ${item.isPurchased ? 'marqué comme acheté' : 'marqué comme non acheté'}`,
        data: {
          item: item,
          completionPercentage: shoppingList.completionPercentage,
          isCompleted: shoppingList.isCompleted,
          status: shoppingList.status
        }
      });
    } catch (error) {
      console.error('Erreur lors du basculement d\'article:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // POST /api/shopping/:id/optimize - Optimiser la liste de courses
  async optimizeShoppingList(req, res) {
    try {
      const shoppingList = await ShoppingList.findById(req.params.id)
        .populate('items.ingredient', 'name unit price baseQuantity category');
      
      if (!shoppingList) {
        return res.status(404).json({
          success: false,
          message: 'Liste de courses non trouvée'
        });
      }

      const optimizedList = shoppingList.optimizeForShopping();
      
      res.json({
        success: true,
        message: 'Liste de courses optimisée',
        data: optimizedList
      });
    } catch (error) {
      console.error('Erreur lors de l\'optimisation de la liste:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // GET /api/shopping/:id/export - Exporter la liste de courses
  async exportShoppingList(req, res) {
    try {
      const { format = 'json' } = req.query;
      
      const shoppingList = await ShoppingList.findById(req.params.id)
        .populate('menu', 'name startDate endDate')
        .populate('items.ingredient', 'name unit price baseQuantity category');
      
      if (!shoppingList) {
        return res.status(404).json({
          success: false,
          message: 'Liste de courses non trouvée'
        });
      }

      if (format === 'txt') {
        // Export en format texte
        let textContent = `LISTE DE COURSES - ${shoppingList.name}\n`;
        textContent += `Date: ${shoppingList.createdAt.toLocaleDateString('fr-FR')}\n`;
        if (shoppingList.menu) {
          textContent += `Menu: ${shoppingList.menu.name}\n`;
        }
        textContent += `\n`;
        
        // Grouper par catégorie
        const itemsByCategory = {};
        shoppingList.items.forEach(item => {
          const category = item.ingredient.category || 'Autres';
          if (!itemsByCategory[category]) {
            itemsByCategory[category] = [];
          }
          itemsByCategory[category].push(item);
        });
        
        Object.keys(itemsByCategory).forEach(category => {
          textContent += `=== ${category.toUpperCase()} ===\n`;
          itemsByCategory[category].forEach(item => {
            const status = item.isPurchased ? '✓' : '☐';
            textContent += `${status} ${item.quantity} ${item.unit} - ${item.ingredient.name}\n`;
          });
          textContent += `\n`;
        });
        
        textContent += `TOTAL ESTIMÉ: ${shoppingList.totalCost.toFixed(2)}€\n`;
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="liste-courses-${shoppingList._id}.txt"`);
        res.send(textContent);
      } else {
        // Export en JSON par défaut
        res.json({
          success: true,
          data: shoppingList
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'export de la liste:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = new ShoppingController();
