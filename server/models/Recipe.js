const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: [true, 'L\'ingrédient est requis']
  },
  quantity: {
    type: Number,
    required: [true, 'La quantité est requise'],
    min: [0.1, 'La quantité doit être d\'au moins 0.1'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value > 0;
      },
      message: 'La quantité doit être un nombre positif'
    }
  },
  optional: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la recette est requis'],
    trim: true,
    minLength: [3, 'Le nom doit contenir au moins 3 caractères'],
    maxLength: [200, 'Le nom ne peut pas dépasser 200 caractères']
  },
  description: {
    type: String,
    maxLength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  ingredients: {
    type: [recipeIngredientSchema],
    required: [true, 'Au moins un ingrédient est requis'],
    validate: {
      validator: function(ingredients) {
        return ingredients && ingredients.length > 0;
      },
      message: 'Une recette doit contenir au moins un ingrédient'
    }
  },
  instructions: {
    type: String,
    required: [true, 'Les instructions sont requises'],
    minLength: [10, 'Les instructions doivent contenir au moins 10 caractères']
  },
  preparationTime: {
    type: Number,
    required: [true, 'Le temps de préparation est requis'],
    min: [1, 'Le temps de préparation doit être d\'au moins 1 minute'],
    max: [480, 'Le temps de préparation ne peut pas dépasser 8 heures']
  },
  cookingTime: {
    type: Number,
    min: [0, 'Le temps de cuisson ne peut pas être négatif'],
    max: [480, 'Le temps de cuisson ne peut pas dépasser 8 heures'],
    default: 0
  },
  servings: {
    type: Number,
    required: [true, 'Le nombre de portions est requis'],
    min: [1, 'Le nombre de portions doit être d\'au moins 1'],
    max: [20, 'Le nombre de portions ne peut pas dépasser 20']
  },
  type: {
    type: String,
    required: [true, 'Le type de repas est requis'],
    enum: {
      values: ['breakfast', 'lunch', 'dinner', 'snack', 'appetizer', 'dessert', 'drink'],
      message: 'Type de repas non valide'
    }
  },
  difficulty: {
    type: String,
    required: [true, 'Le niveau de difficulté est requis'],
    enum: {
      values: ['easy', 'medium', 'hard'],
      message: 'Niveau de difficulté non valide'
    }
  },
  tags: [{
    type: String,
    enum: [
      'végétarien', 'végan', 'sans gluten', 'sans lactose', 'protéiné', 
      'léger', 'rapide', 'économique', 'festif', 'healthy', 'comfort-food',
      'épicé', 'sucré', 'salé', 'fermenté', 'cru', 'grillé', 'mijoté'
    ]
  }],
  nutrition: {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 },
    fiber: { type: Number, min: 0 },
    sugar: { type: Number, min: 0 },
    sodium: { type: Number, min: 0 }
  },
  rating: {
    average: { type: Number, min: 0, max: 5, default: 0 },
    count: { type: Number, min: 0, default: 0 }
  },
  imageUrl: {
    type: String,
    validate: {
      validator: function(url) {
        if (!url) return true; // URL optionnelle
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      },
      message: 'URL d\'image non valide'
    }
  },
  source: {
    type: String,
    maxLength: [200, 'La source ne peut pas dépasser 200 caractères']
  },
  author: {
    type: String,
    maxLength: [100, 'Le nom de l\'auteur ne peut pas dépasser 100 caractères']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Pour une future gestion des utilisateurs
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  favorites: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual pour le temps total
recipeSchema.virtual('totalTime').get(function() {
  return this.preparationTime + (this.cookingTime || 0);
});

// Virtual pour calculer le prix estimé de la recette
recipeSchema.virtual('estimatedPrice').get(function() {
  if (!this.populated('ingredients.ingredient')) return null;
  
  return this.ingredients.reduce((total, recipeIngredient) => {
    if (recipeIngredient.ingredient && recipeIngredient.ingredient.price) {
      const unitPrice = recipeIngredient.ingredient.price / recipeIngredient.ingredient.baseQuantity;
      return total + (unitPrice * recipeIngredient.quantity);
    }
    return total;
  }, 0);
});

// Virtual pour le prix par portion
recipeSchema.virtual('pricePerServing').get(function() {
  const totalPrice = this.estimatedPrice;
  return totalPrice ? totalPrice / this.servings : null;
});

// Index pour la recherche et les performances
recipeSchema.index({ name: 'text', description: 'text', tags: 'text' });
recipeSchema.index({ type: 1, difficulty: 1 });
recipeSchema.index({ preparationTime: 1, cookingTime: 1 });
recipeSchema.index({ 'rating.average': -1 });
recipeSchema.index({ createdAt: -1 });

// Middleware pour calculer automatiquement les valeurs nutritionnelles
recipeSchema.pre('save', async function(next) {
  if (this.isModified('ingredients') && this.populated('ingredients.ingredient')) {
    const nutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };

    this.ingredients.forEach(recipeIngredient => {
      if (recipeIngredient.ingredient && recipeIngredient.ingredient.nutritionalInfo) {
        const ratio = recipeIngredient.quantity / recipeIngredient.ingredient.baseQuantity;
        const ingredientNutrition = recipeIngredient.ingredient.nutritionalInfo;
        
        nutrition.calories += (ingredientNutrition.calories || 0) * ratio;
        nutrition.protein += (ingredientNutrition.protein || 0) * ratio;
        nutrition.carbs += (ingredientNutrition.carbs || 0) * ratio;
        nutrition.fat += (ingredientNutrition.fat || 0) * ratio;
        nutrition.fiber += (ingredientNutrition.fiber || 0) * ratio;
      }
    });

    this.nutrition = nutrition;
  }
  next();
});

// Méthodes d'instance
recipeSchema.methods.addRating = function(rating) {
  const newCount = this.rating.count + 1;
  const newAverage = ((this.rating.average * this.rating.count) + rating) / newCount;
  
  this.rating.average = Math.round(newAverage * 10) / 10; // Arrondir à 1 décimale
  this.rating.count = newCount;
  
  return this.save();
};

recipeSchema.methods.scaleIngredients = function(newServings) {
  const scaleFactor = newServings / this.servings;
  const scaledRecipe = this.toObject();
  
  scaledRecipe.servings = newServings;
  scaledRecipe.ingredients = scaledRecipe.ingredients.map(ingredient => ({
    ...ingredient,
    quantity: ingredient.quantity * scaleFactor
  }));
  
  return scaledRecipe;
};

// Méthodes statiques
recipeSchema.statics.findByType = function(type) {
  return this.find({ type }).populate('ingredients.ingredient').sort({ 'rating.average': -1 });
};

recipeSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({ difficulty }).populate('ingredients.ingredient').sort({ preparationTime: 1 });
};

recipeSchema.statics.findQuickRecipes = function(maxTime = 30) {
  return this.find({
    $expr: {
      $lte: [{ $add: ['$preparationTime', { $ifNull: ['$cookingTime', 0] }] }, maxTime]
    }
  }).populate('ingredients.ingredient').sort({ totalTime: 1 });
};

recipeSchema.statics.findByIngredients = function(ingredientIds) {
  return this.find({
    'ingredients.ingredient': { $in: ingredientIds }
  }).populate('ingredients.ingredient');
};

recipeSchema.statics.searchRecipes = function(query, filters = {}) {
  const searchQuery = { $text: { $search: query } };
  
  // Ajouter les filtres
  if (filters.type) searchQuery.type = filters.type;
  if (filters.difficulty) searchQuery.difficulty = filters.difficulty;
  if (filters.maxTime) {
    searchQuery.$expr = {
      $lte: [{ $add: ['$preparationTime', { $ifNull: ['$cookingTime', 0] }] }, filters.maxTime]
    };
  }
  if (filters.tags && filters.tags.length > 0) {
    searchQuery.tags = { $in: filters.tags };
  }

  return this.find(searchQuery)
    .populate('ingredients.ingredient')
    .sort({ score: { $meta: 'textScore' }, 'rating.average': -1 });
};

module.exports = mongoose.model('Recipe', recipeSchema);
