const mongoose = require('mongoose');

const shoppingItemSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['g', 'kg', 'ml', 'l', 'piece', 'sachet', 'boite'],
    required: true
  },
  estimatedPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  actualPrice: {
    type: Number,
    min: 0,
    default: null
  },
  isPurchased: {
    type: Boolean,
    default: false
  },
  purchasedAt: {
    type: Date,
    default: null
  },
  purchasedQuantity: {
    type: Number,
    min: 0,
    default: null
  },
  notes: {
    type: String,
    maxlength: 200,
    default: ''
  },
  alternatives: [{
    name: String,
    estimatedPrice: Number,
    notes: String
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['legume', 'proteine', 'feculent', 'sauce', 'fruit', 'epice', 'autre'],
    default: 'autre'
  }
});

const shoppingListSchema = new mongoose.Schema({
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
  menu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeekMenu',
    default: null
  },
  items: [shoppingItemSchema],
  totalCost: {
    type: Number,
    min: 0,
    default: 0
  },
  actualTotalCost: {
    type: Number,
    min: 0,
    default: 0
  },
  estimatedBudget: {
    type: Number,
    min: 0,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  shoppingDate: {
    type: Date,
    default: null
  },
  store: {
    name: String,
    address: String,
    type: {
      type: String,
      enum: ['supermarket', 'market', 'organic', 'specialty', 'online'],
      default: 'supermarket'
    }
  },
  preferences: {
    prioritizeOrganic: {
      type: Boolean,
      default: false
    },
    budget: {
      type: Number,
      min: 0
    },
    preferredBrands: [String],
    avoidBrands: [String],
    maxDistance: {
      type: Number,
      min: 0
    }
  },
  optimization: {
    isOptimized: {
      type: Boolean,
      default: false
    },
    optimizedAt: Date,
    savings: {
      type: Number,
      default: 0
    },
    wasteReduction: {
      type: Number,
      default: 0
    },
    algorithmUsed: String
  },
  sharing: {
    isShared: {
      type: Boolean,
      default: false
    },
    shareCode: String,
    sharedWith: [String], // emails ou user IDs
    permissions: {
      canEdit: {
        type: Boolean,
        default: false
      },
      canAddItems: {
        type: Boolean,
        default: true
      }
    }
  },
  tags: [String],
  createdBy: {
    type: String,
    default: 'anonymous'
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'menu_generated', 'recipe_based', 'imported'],
      default: 'manual'
    },
    version: {
      type: Number,
      default: 1
    },
    lastModifiedBy: String
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
shoppingListSchema.index({ createdAt: -1 });
shoppingListSchema.index({ status: 1, createdAt: -1 });
shoppingListSchema.index({ menu: 1 });
shoppingListSchema.index({ isCompleted: 1, completedAt: -1 });
shoppingListSchema.index({ name: 'text', description: 'text' });

// Méthodes d'instance
shoppingListSchema.methods.calculateTotals = function() {
  const totals = {
    totalItems: this.items.length,
    purchasedItems: this.items.filter(item => item.isPurchased).length,
    pendingItems: this.items.filter(item => !item.isPurchased).length,
    estimatedTotal: this.items.reduce((sum, item) => sum + item.estimatedPrice, 0),
    actualTotal: this.items.reduce((sum, item) => sum + (item.actualPrice || 0), 0),
    savings: 0
  };
  
  totals.completionPercentage = totals.totalItems > 0 
    ? Math.round((totals.purchasedItems / totals.totalItems) * 100) 
    : 0;
  
  totals.savings = totals.estimatedTotal - totals.actualTotal;
  
  return totals;
};

shoppingListSchema.methods.updateCompletionStatus = function() {
  const totals = this.calculateTotals();
  
  this.completionPercentage = totals.completionPercentage;
  this.actualTotalCost = totals.actualTotal;
  
  if (totals.completionPercentage === 100) {
    this.isCompleted = true;
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else if (totals.completionPercentage > 0) {
    this.isCompleted = false;
    this.status = 'in_progress';
    this.completedAt = null;
  } else {
    this.isCompleted = false;
    this.status = 'pending';
    this.completedAt = null;
  }
  
  return this.save();
};

shoppingListSchema.methods.optimizeForShopping = function() {
  // Grouper les articles par catégorie
  const itemsByCategory = this.items.reduce((acc, item) => {
    const category = item.category || 'autre';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // Ordre optimal pour faire les courses (du moins périssable au plus périssable)
  const categoryOrder = ['epice', 'sauce', 'feculent', 'autre', 'proteine', 'fruit', 'legume'];
  
  const optimizedList = [];
  categoryOrder.forEach(category => {
    if (itemsByCategory[category]) {
      // Trier par priorité puis par nom
      itemsByCategory[category].sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return a.ingredient.name.localeCompare(b.ingredient.name);
      });
      
      optimizedList.push({
        category,
        items: itemsByCategory[category],
        categoryTotal: itemsByCategory[category].reduce((sum, item) => sum + item.estimatedPrice, 0)
      });
    }
  });

  return {
    optimizedSections: optimizedList,
    totalEstimatedTime: this.estimateShoppingTime(),
    totalEstimatedCost: this.totalCost,
    recommendations: this.generateShoppingRecommendations()
  };
};

shoppingListSchema.methods.estimateShoppingTime = function() {
  // Estimation basique : 2 minutes par article + 5 minutes de base + temps de queue
  const baseTime = 5; // minutes
  const timePerItem = 2; // minutes
  const queueTime = 10; // minutes
  
  const totalTime = baseTime + (this.items.length * timePerItem) + queueTime;
  return Math.round(totalTime);
};

shoppingListSchema.methods.generateShoppingRecommendations = function() {
  const recommendations = [];
  
  // Vérifier le budget
  if (this.estimatedBudget && this.totalCost > this.estimatedBudget) {
    const overage = this.totalCost - this.estimatedBudget;
    recommendations.push({
      type: 'budget_warning',
      message: `Dépassement de budget de ${overage.toFixed(2)}€`,
      severity: 'warning',
      suggestions: ['Considérer des alternatives moins chères', 'Reporter certains achats non essentiels']
    });
  }

  // Suggérer des optimisations
  const expensiveItems = this.items.filter(item => item.estimatedPrice > 10);
  if (expensiveItems.length > 0) {
    recommendations.push({
      type: 'cost_optimization',
      message: `${expensiveItems.length} article(s) coûteux détecté(s)`,
      severity: 'info',
      items: expensiveItems.map(item => item.ingredient.name),
      suggestions: ['Vérifier les promotions', 'Considérer des marques alternatives']
    });
  }

  // Vérifier les quantités importantes
  const bulkItems = this.items.filter(item => item.quantity > item.ingredient?.baseQuantity * 3);
  if (bulkItems.length > 0) {
    recommendations.push({
      type: 'quantity_check',
      message: `Grandes quantités détectées pour ${bulkItems.length} article(s)`,
      severity: 'info',
      suggestions: ['Vérifier l\'espace de stockage', 'Confirmer les quantités nécessaires']
    });
  }

  return recommendations;
};

// Méthodes statiques
shoppingListSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

shoppingListSchema.statics.findRecent = function(limit = 10) {
  return this.find().sort({ createdAt: -1 }).limit(limit);
};

shoppingListSchema.statics.findByMenu = function(menuId) {
  return this.find({ menu: menuId }).sort({ createdAt: -1 });
};

// Middleware pre-save
shoppingListSchema.pre('save', function(next) {
  // Recalculer les totaux
  const totals = this.calculateTotals();
  this.totalCost = totals.estimatedTotal;
  this.completionPercentage = totals.completionPercentage;
  
  // Mise à jour du statut basé sur la completion
  if (totals.completionPercentage === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.isCompleted = true;
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else if (totals.completionPercentage > 0 && totals.completionPercentage < 100) {
    if (this.status === 'pending') {
      this.status = 'in_progress';
    }
    this.isCompleted = false;
  }

  // Assigner les catégories aux items si elles ne sont pas définies
  this.items.forEach(item => {
    if (!item.category && item.ingredient && item.ingredient.category) {
      item.category = item.ingredient.category;
    }
  });

  next();
});

// Middleware post-save
shoppingListSchema.post('save', function(doc) {
  // Mise à jour de la version
  if (doc.metadata) {
    doc.metadata.version += 1;
  }
});

const ShoppingList = mongoose.model('ShoppingList', shoppingListSchema);

module.exports = ShoppingList;
