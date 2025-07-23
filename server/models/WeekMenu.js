const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['dejeuner', 'repas_du_midi', 'repas_du_soir', 'quatre_heure'],
    required: true
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    default: null
  },
  servings: {
    type: Number,
    required: true,
    min: 1,
    max: 50,
    default: 4
  },
  notes: {
    type: String,
    maxlength: 500,
    default: ''
  },
  alternatives: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }]
});

const daySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  dayName: {
    type: String,
    enum: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
    required: true
  },
  meals: [mealSchema]
});

const weekMenuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  days: [daySchema],
  totalBudget: {
    type: Number,
    min: 0,
    default: null
  },
  actualCost: {
    type: Number,
    min: 0,
    default: 0
  },
  preferences: {
    dietary: [String], // végétarien, végan, sans gluten, etc.
    excludedIngredients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient'
    }],
    maxCookingTime: {
      type: Number,
      min: 1
    },
    difficultyLevels: [String]
  },
  nutritionSummary: {
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
    dailyAverages: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 }
    }
  },
  isGenerated: {
    type: Boolean,
    default: false
  },
  generationSettings: {
    algorithm: String,
    constraints: mongoose.Schema.Types.Mixed,
    generatedAt: Date
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String, // Pour une future gestion des utilisateurs
    default: 'anonymous'
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances de recherche
weekMenuSchema.index({ startDate: 1, endDate: 1 });
weekMenuSchema.index({ name: 'text', description: 'text' });
weekMenuSchema.index({ createdAt: -1 });
weekMenuSchema.index({ isPublic: 1, createdAt: -1 });

// Méthodes d'instance
weekMenuSchema.methods.generateShoppingList = function() {
  const ingredientQuantities = new Map();
  
  // Parcourir tous les jours et repas pour collecter les ingrédients
  this.days.forEach(day => {
    day.meals.forEach(meal => {
      if (meal.recipe && meal.recipe.ingredients) {
        meal.recipe.ingredients.forEach(recipeIngredient => {
          const ingredientId = recipeIngredient.ingredient._id.toString();
          const scaledQuantity = (recipeIngredient.quantity * meal.servings) / meal.recipe.servings;
          
          const currentQuantity = ingredientQuantities.get(ingredientId) || 0;
          ingredientQuantities.set(ingredientId, currentQuantity + scaledQuantity);
        });
      }
    });
  });

  // Convertir en format de liste de courses
  const items = [];
  for (const [ingredientId, totalQuantity] of ingredientQuantities) {
    const ingredient = this.days
      .flatMap(day => day.meals)
      .flatMap(meal => meal.recipe ? meal.recipe.ingredients : [])
      .find(ing => ing.ingredient._id.toString() === ingredientId)?.ingredient;
    
    if (ingredient) {
      // Calculer les unités d'achat optimales
      const unitsNeeded = Math.ceil(totalQuantity / ingredient.baseQuantity);
      const optimizedQuantity = unitsNeeded * ingredient.baseQuantity;
      const estimatedPrice = ingredient.price * unitsNeeded;
      
      items.push({
        ingredient: ingredientId,
        quantity: optimizedQuantity,
        unit: ingredient.unit,
        estimatedPrice,
        isPurchased: false
      });
    }
  }

  const totalCost = items.reduce((sum, item) => sum + item.estimatedPrice, 0);

  return {
    items,
    totalCost,
    itemsCount: items.length
  };
};

weekMenuSchema.methods.calculateNutrition = function() {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  
  const dailyNutrition = [];

  this.days.forEach(day => {
    let dayCalories = 0;
    let dayProtein = 0;
    let dayCarbs = 0;
    let dayFat = 0;
    let dayFiber = 0;

    day.meals.forEach(meal => {
      if (meal.recipe && meal.recipe.nutritionalInfo) {
        const servingRatio = meal.servings / meal.recipe.servings;
        
        dayCalories += (meal.recipe.nutritionalInfo.calories || 0) * servingRatio;
        dayProtein += (meal.recipe.nutritionalInfo.protein || 0) * servingRatio;
        dayCarbs += (meal.recipe.nutritionalInfo.carbs || 0) * servingRatio;
        dayFat += (meal.recipe.nutritionalInfo.fat || 0) * servingRatio;
        dayFiber += (meal.recipe.nutritionalInfo.fiber || 0) * servingRatio;
      }
    });

    dailyNutrition.push({
      date: day.date,
      dayName: day.dayName,
      calories: Math.round(dayCalories),
      protein: Math.round(dayProtein),
      carbs: Math.round(dayCarbs),
      fat: Math.round(dayFat),
      fiber: Math.round(dayFiber)
    });

    totalCalories += dayCalories;
    totalProtein += dayProtein;
    totalCarbs += dayCarbs;
    totalFat += dayFat;
    totalFiber += dayFiber;
  });

  const daysCount = this.days.length;
  
  return {
    totals: {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      fiber: Math.round(totalFiber)
    },
    dailyAverages: {
      calories: Math.round(totalCalories / daysCount),
      protein: Math.round(totalProtein / daysCount),
      carbs: Math.round(totalCarbs / daysCount),
      fat: Math.round(totalFat / daysCount),
      fiber: Math.round(totalFiber / daysCount)
    },
    dailyBreakdown: dailyNutrition
  };
};

// Méthodes statiques
weekMenuSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
    ]
  });
};

weekMenuSchema.statics.findPublic = function(limit = 20) {
  return this.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('days.meals.recipe', 'name difficulty preparationTime cookingTime');
};

// Middleware pre-save
weekMenuSchema.pre('save', function(next) {
  // Valider que endDate est après startDate
  if (this.endDate <= this.startDate) {
    const error = new Error('La date de fin doit être postérieure à la date de début');
    return next(error);
  }

  // Valider que nous avons au moins un jour
  if (!this.days || this.days.length === 0) {
    const error = new Error('Le menu doit contenir au moins un jour');
    return next(error);
  }

  // Calculer le coût actuel si possible
  if (this.isModified('days')) {
    let totalCost = 0;
    this.days.forEach(day => {
      day.meals.forEach(meal => {
        if (meal.recipe && meal.recipe.ingredients) {
          meal.recipe.ingredients.forEach(ingredient => {
            if (ingredient.ingredient.price) {
              const scaledQuantity = (ingredient.quantity * meal.servings) / meal.recipe.servings;
              const units = Math.ceil(scaledQuantity / ingredient.ingredient.baseQuantity);
              totalCost += ingredient.ingredient.price * units;
            }
          });
        }
      });
    });
    this.actualCost = totalCost;
  }

  next();
});

const WeekMenu = mongoose.model('WeekMenu', weekMenuSchema);

module.exports = WeekMenu;
