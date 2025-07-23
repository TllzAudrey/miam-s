const WeekMenu = require('../models/WeekMenu');
const Recipe = require('../models/Recipe');

class MenuController {
  // GET /api/menus - Récupérer tous les menus
  async getAllMenus(req, res) {
    try {
      const {
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'startDate',
        sortOrder = 'desc',
        search
      } = req.query;

      // Construire le filtre
      let filter = {};
      
      if (startDate) {
        filter.startDate = { $gte: new Date(startDate) };
      }
      
      if (endDate) {
        filter.endDate = { $lte: new Date(endDate) };
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
      const [menus, total] = await Promise.all([
        WeekMenu.find(filter)
          .populate({
            path: 'days.meals.recipe',
            select: 'name description preparationTime cookingTime difficulty type servings',
            populate: {
              path: 'ingredients.ingredient',
              select: 'name unit price baseQuantity category'
            }
          })
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        WeekMenu.countDocuments(filter)
      ]);

      // Calculer les métadonnées de pagination
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        data: menus,
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
      console.error('Erreur lors de la récupération des menus:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/menus/:id - Récupérer un menu par ID
  async getMenuById(req, res) {
    try {
      const menu = await WeekMenu.findById(req.params.id)
        .populate({
          path: 'days.meals.recipe',
          select: 'name description preparationTime cookingTime difficulty type servings images tags',
          populate: {
            path: 'ingredients.ingredient',
            select: 'name unit price baseQuantity category nutritionalInfo'
          }
        });
      
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menu non trouvé'
        });
      }

      res.json({
        success: true,
        data: menu
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du menu:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de menu invalide'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // POST /api/menus - Créer un nouveau menu
  async createMenu(req, res) {
    try {
      // Vérifier que toutes les recettes existent
      const recipeIds = [];
      req.body.days.forEach(day => {
        day.meals.forEach(meal => {
          if (meal.recipe) {
            recipeIds.push(meal.recipe);
          }
        });
      });

      if (recipeIds.length > 0) {
        const existingRecipes = await Recipe.find({ _id: { $in: recipeIds } });
        
        if (existingRecipes.length !== recipeIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Une ou plusieurs recettes n\'existent pas'
          });
        }
      }

      const menu = new WeekMenu(req.body);
      await menu.save();
      
      // Populate le menu créé pour la réponse
      await menu.populate({
        path: 'days.meals.recipe',
        select: 'name description preparationTime cookingTime difficulty type servings',
        populate: {
          path: 'ingredients.ingredient',
          select: 'name unit price baseQuantity category'
        }
      });

      res.status(201).json({
        success: true,
        message: 'Menu créé avec succès',
        data: menu
      });
    } catch (error) {
      console.error('Erreur lors de la création du menu:', error);
      
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

  // PUT /api/menus/:id - Mettre à jour un menu
  async updateMenu(req, res) {
    try {
      // Vérifier que toutes les recettes existent
      const recipeIds = [];
      req.body.days.forEach(day => {
        day.meals.forEach(meal => {
          if (meal.recipe) {
            recipeIds.push(meal.recipe);
          }
        });
      });

      if (recipeIds.length > 0) {
        const existingRecipes = await Recipe.find({ _id: { $in: recipeIds } });
        
        if (existingRecipes.length !== recipeIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Une ou plusieurs recettes n\'existent pas'
          });
        }
      }

      const menu = await WeekMenu.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate({
        path: 'days.meals.recipe',
        select: 'name description preparationTime cookingTime difficulty type servings',
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

      res.json({
        success: true,
        message: 'Menu mis à jour avec succès',
        data: menu
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du menu:', error);
      
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
          message: 'ID de menu invalide'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // DELETE /api/menus/:id - Supprimer un menu
  async deleteMenu(req, res) {
    try {
      const menu = await WeekMenu.findByIdAndDelete(req.params.id);

      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menu non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Menu supprimé avec succès',
        data: { deletedId: req.params.id }
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du menu:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de menu invalide'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // POST /api/menus/:id/generate-shopping-list - Générer la liste de courses
  async generateShoppingList(req, res) {
    try {
      const menu = await WeekMenu.findById(req.params.id)
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

      const shoppingList = menu.generateShoppingList();
      
      res.json({
        success: true,
        data: shoppingList
      });
    } catch (error) {
      console.error('Erreur lors de la génération de la liste de courses:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // POST /api/menus/generate-week - Générer un menu aléatoire pour la semaine
  async generateWeekMenu(req, res) {
    try {
      const { 
        constraints = {},
        preferences = {},
        budget,
        servings = 4,
        startDate = new Date()
      } = req.body;

      // Calculer la date de fin (7 jours plus tard)
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      // Récupérer toutes les recettes disponibles avec filtres
      let recipeFilter = {};
      
      if (constraints.dietary && constraints.dietary.length > 0) {
        recipeFilter.tags = { $in: constraints.dietary };
      }
      
      if (constraints.maxCookingTime) {
        recipeFilter.cookingTime = { $lte: constraints.maxCookingTime };
      }
      
      if (constraints.difficulty && constraints.difficulty.length > 0) {
        recipeFilter.difficulty = { $in: constraints.difficulty };
      }

      const availableRecipes = await Recipe.find(recipeFilter)
        .populate('ingredients.ingredient', 'name unit price baseQuantity category');

      if (availableRecipes.length < 14) {
        return res.status(400).json({
          success: false,
          message: 'Pas assez de recettes disponibles pour générer un menu complet'
        });
      }

      // Générer le menu de la semaine
      const menuData = {
        name: `Menu semaine du ${new Date(startDate).toLocaleDateString('fr-FR')}`,
        description: 'Menu généré automatiquement',
        startDate: new Date(startDate),
        endDate: endDate,
        totalBudget: budget,
        days: []
      };

      const daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
      
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + i);
        
        // Sélectionner des recettes aléatoires pour les repas
        const usedRecipes = new Set();
        const dayMeals = [];
        
        const mealTypes = ['dejeuner', 'repas_du_midi', 'repas_du_soir'];
        
        for (const mealType of mealTypes) {
          let recipe;
          let attempts = 0;
          
          // Essayer de trouver une recette non utilisée
          do {
            recipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
            attempts++;
          } while (usedRecipes.has(recipe._id.toString()) && attempts < 20);
          
          if (recipe) {
            usedRecipes.add(recipe._id.toString());
            dayMeals.push({
              type: mealType,
              recipe: recipe._id,
              servings: servings,
              notes: ''
            });
          }
        }
        
        menuData.days.push({
          date: dayDate,
          dayName: daysOfWeek[i],
          meals: dayMeals
        });
      }

      // Créer le menu
      const menu = new WeekMenu(menuData);
      await menu.save();
      
      // Populate pour la réponse
      await menu.populate({
        path: 'days.meals.recipe',
        select: 'name description preparationTime cookingTime difficulty type servings',
        populate: {
          path: 'ingredients.ingredient',
          select: 'name unit price baseQuantity category'
        }
      });

      res.status(201).json({
        success: true,
        message: 'Menu de la semaine généré avec succès',
        data: menu
      });
    } catch (error) {
      console.error('Erreur lors de la génération du menu:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // GET /api/menus/:id/nutrition - Calculer les informations nutritionnelles
  async getMenuNutrition(req, res) {
    try {
      const menu = await WeekMenu.findById(req.params.id)
        .populate({
          path: 'days.meals.recipe',
          populate: {
            path: 'ingredients.ingredient',
            select: 'name unit price baseQuantity category nutritionalInfo'
          }
        });
      
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menu non trouvé'
        });
      }

      const nutritionData = menu.calculateNutrition();
      
      res.json({
        success: true,
        data: nutritionData
      });
    } catch (error) {
      console.error('Erreur lors du calcul nutritionnel:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = new MenuController();
