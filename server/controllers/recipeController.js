const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');

class RecipeController {
  // GET /api/recipes - Récupérer toutes les recettes
  async getAllRecipes(req, res) {
    try {
      const {
        type,
        difficulty,
        search,
        maxTime,
        tags,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ingredients
      } = req.query;

      // Construire le filtre de recherche
      let filter = {};
      
      if (type) filter.type = type;
      if (difficulty) filter.difficulty = difficulty;
      if (maxTime) {
        filter.$expr = {
          $lte: [{ $add: ['$preparationTime', { $ifNull: ['$cookingTime', 0] }] }, maxTime]
        };
      }
      
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        filter.tags = { $in: tagArray };
      }
      
      if (ingredients) {
        const ingredientIds = ingredients.split(',').map(id => id.trim());
        filter['ingredients.ingredient'] = { $in: ingredientIds };
      }
      
      if (search) {
        filter.$text = { $search: search };
      }

      // Options de tri
      const sortOptions = {};
      if (sortBy === 'rating') {
        sortOptions['rating.average'] = sortOrder === 'desc' ? -1 : 1;
      } else {
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      }

      // Calculer la pagination
      const skip = (page - 1) * limit;

      // Exécuter la requête
      const [recipes, total] = await Promise.all([
        Recipe.find(filter)
          .populate('ingredients.ingredient', 'name unit price baseQuantity category')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        Recipe.countDocuments(filter)
      ]);

      // Calculer les métadonnées de pagination
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        data: recipes,
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
      console.error('Erreur lors de la récupération des recettes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/recipes/:id - Récupérer une recette par ID
  async getRecipeById(req, res) {
    try {
      const recipe = await Recipe.findById(req.params.id)
        .populate('ingredients.ingredient', 'name unit price baseQuantity category nutritionalInfo');
      
      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: 'Recette non trouvée'
        });
      }

      res.json({
        success: true,
        data: recipe
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la recette:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de recette invalide'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // POST /api/recipes - Créer une nouvelle recette
  async createRecipe(req, res) {
    try {
      // Vérifier que tous les ingrédients existent
      const ingredientIds = req.body.ingredients.map(ing => ing.ingredient);
      const existingIngredients = await Ingredient.find({ _id: { $in: ingredientIds } });
      
      if (existingIngredients.length !== ingredientIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Un ou plusieurs ingrédients n\'existent pas'
        });
      }

      const recipe = new Recipe(req.body);
      await recipe.save();
      
      // Populate la recette créée pour la réponse
      await recipe.populate('ingredients.ingredient', 'name unit price baseQuantity category');

      res.status(201).json({
        success: true,
        message: 'Recette créée avec succès',
        data: recipe
      });
    } catch (error) {
      console.error('Erreur lors de la création de la recette:', error);
      
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

  // PUT /api/recipes/:id - Mettre à jour une recette
  async updateRecipe(req, res) {
    try {
      // Vérifier que tous les ingrédients existent
      const ingredientIds = req.body.ingredients.map(ing => ing.ingredient);
      const existingIngredients = await Ingredient.find({ _id: { $in: ingredientIds } });
      
      if (existingIngredients.length !== ingredientIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Un ou plusieurs ingrédients n\'existent pas'
        });
      }

      const recipe = await Recipe.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('ingredients.ingredient', 'name unit price baseQuantity category');

      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: 'Recette non trouvée'
        });
      }

      res.json({
        success: true,
        message: 'Recette mise à jour avec succès',
        data: recipe
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la recette:', error);
      
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
          message: 'ID de recette invalide'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // DELETE /api/recipes/:id - Supprimer une recette
  async deleteRecipe(req, res) {
    try {
      const recipe = await Recipe.findByIdAndDelete(req.params.id);

      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: 'Recette non trouvée'
        });
      }

      res.json({
        success: true,
        message: 'Recette supprimée avec succès',
        data: { deletedId: req.params.id }
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la recette:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID de recette invalide'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // POST /api/recipes/:id/rating - Ajouter une note à une recette
  async addRating(req, res) {
    try {
      const recipe = await Recipe.findById(req.params.id);
      
      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: 'Recette non trouvée'
        });
      }

      await recipe.addRating(req.body.rating);
      
      res.json({
        success: true,
        message: 'Note ajoutée avec succès',
        data: {
          rating: recipe.rating,
          recipeId: recipe._id
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la note:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // GET /api/recipes/:id/scale/:servings - Adapter une recette pour un nombre de portions
  async scaleRecipe(req, res) {
    try {
      const { servings } = req.params;
      const newServings = parseInt(servings);
      
      if (!newServings || newServings < 1 || newServings > 50) {
        return res.status(400).json({
          success: false,
          message: 'Le nombre de portions doit être entre 1 et 50'
        });
      }

      const recipe = await Recipe.findById(req.params.id)
        .populate('ingredients.ingredient', 'name unit price baseQuantity category');
      
      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: 'Recette non trouvée'
        });
      }

      const scaledRecipe = recipe.scaleIngredients(newServings);
      
      res.json({
        success: true,
        data: scaledRecipe
      });
    } catch (error) {
      console.error('Erreur lors de l\'adaptation de la recette:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // GET /api/recipes/search/advanced - Recherche avancée
  async advancedSearch(req, res) {
    try {
      const filters = {};
      Object.keys(req.query).forEach(key => {
        if (req.query[key] !== undefined && req.query[key] !== '') {
          filters[key] = req.query[key];
        }
      });

      const recipes = await Recipe.searchRecipes(req.query.q || '', filters);
      
      res.json({
        success: true,
        data: recipes,
        count: recipes.length
      });
    } catch (error) {
      console.error('Erreur lors de la recherche avancée:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // GET /api/recipes/random/:count - Récupérer des recettes aléatoires
  async getRandomRecipes(req, res) {
    try {
      const count = parseInt(req.params.count);
      
      if (!count || count < 1 || count > 50) {
        return res.status(400).json({
          success: false,
          message: 'Le nombre de recettes doit être entre 1 et 50'
        });
      }

      const recipes = await Recipe.aggregate([
        { $sample: { size: count } },
        {
          $lookup: {
            from: 'ingredients',
            localField: 'ingredients.ingredient',
            foreignField: '_id',
            as: 'populatedIngredients'
          }
        }
      ]);
      
      res.json({
        success: true,
        data: recipes
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes aléatoires:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = new RecipeController();
