const Ingredient = require('../models/Ingredient');

class IngredientController {
  // GET /api/ingredients - Récupérer tous les ingrédients
  async getAllIngredients(req, res) {
    try {
      const {
        category,
        search,
        page = 1,
        limit = 50,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      // Construire le filtre de recherche
      let filter = {};
      if (category) {
        filter.category = category;
      }
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }

      // Options de tri
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Calculer la pagination
      const skip = (page - 1) * limit;

      // Exécuter la requête
      const [ingredients, total] = await Promise.all([
        Ingredient.find(filter)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        Ingredient.countDocuments(filter)
      ]);

      // Calculer les métadonnées de pagination
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        success: true,
        data: ingredients,
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
      console.error('Erreur lors de la récupération des ingrédients:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/ingredients/:id - Récupérer un ingrédient par ID
  async getIngredientById(req, res) {
    try {
      const ingredient = await Ingredient.findById(req.params.id);
      
      if (!ingredient) {
        return res.status(404).json({
          success: false,
          message: 'Ingrédient non trouvé'
        });
      }

      res.json({
        success: true,
        data: ingredient
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ingrédient:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID d\'ingrédient invalide'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // POST /api/ingredients - Créer un nouvel ingrédient
  async createIngredient(req, res) {
    try {
      const ingredient = new Ingredient(req.body);
      await ingredient.save();

      res.status(201).json({
        success: true,
        message: 'Ingrédient créé avec succès',
        data: ingredient
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'ingrédient:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Un ingrédient avec ce nom existe déjà'
        });
      }
      
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

  // PUT /api/ingredients/:id - Mettre à jour un ingrédient
  async updateIngredient(req, res) {
    try {
      const ingredient = await Ingredient.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!ingredient) {
        return res.status(404).json({
          success: false,
          message: 'Ingrédient non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Ingrédient mis à jour avec succès',
        data: ingredient
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'ingrédient:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Un ingrédient avec ce nom existe déjà'
        });
      }
      
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
          message: 'ID d\'ingrédient invalide'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // DELETE /api/ingredients/:id - Supprimer un ingrédient
  async deleteIngredient(req, res) {
    try {
      const ingredient = await Ingredient.findByIdAndDelete(req.params.id);

      if (!ingredient) {
        return res.status(404).json({
          success: false,
          message: 'Ingrédient non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Ingrédient supprimé avec succès',
        data: { deletedId: req.params.id }
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'ingrédient:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'ID d\'ingrédient invalide'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // GET /api/ingredients/categories/stats - Statistiques par catégorie
  async getCategoryStats(req, res) {
    try {
      const stats = await Ingredient.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // POST /api/ingredients/bulk - Créer plusieurs ingrédients
  async createBulkIngredients(req, res) {
    try {
      const { ingredients } = req.body;
      
      const createdIngredients = await Ingredient.insertMany(ingredients, {
        ordered: false // Continue même si certains échouent
      });

      res.status(201).json({
        success: true,
        message: `${createdIngredients.length} ingrédients créés avec succès`,
        data: createdIngredients
      });
    } catch (error) {
      console.error('Erreur lors de la création en lot:', error);
      
      if (error.name === 'BulkWriteError') {
        return res.status(207).json({
          success: false,
          message: 'Création partielle réussie',
          insertedCount: error.result.insertedCount,
          errors: error.writeErrors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = new IngredientController();
