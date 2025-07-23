const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de l\'ingrédient est requis'],
    trim: true,
    unique: true,
    minLength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxLength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: {
      values: ['legume', 'proteine', 'feculent', 'sauce', 'fruit', 'epice', 'autre'],
      message: 'Catégorie non valide. Doit être: legume, proteine, feculent, sauce, fruit, epice, ou autre'
    }
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value >= 0;
      },
      message: 'Le prix doit être un nombre positif'
    }
  },
  unit: {
    type: String,
    required: [true, 'L\'unité est requise'],
    enum: {
      values: ['g', 'kg', 'ml', 'l', 'piece', 'sachet', 'boite'],
      message: 'Unité non valide'
    }
  },
  baseQuantity: {
    type: Number,
    required: [true, 'La quantité de base est requise'],
    min: [0.1, 'La quantité de base doit être d\'au moins 0.1'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value > 0;
      },
      message: 'La quantité de base doit être un nombre positif'
    }
  },
  nutritionalInfo: {
    calories: { type: Number, min: 0, default: 0 },
    protein: { type: Number, min: 0, default: 0 }, // en grammes
    carbs: { type: Number, min: 0, default: 0 }, // en grammes
    fat: { type: Number, min: 0, default: 0 }, // en grammes
    fiber: { type: Number, min: 0, default: 0 } // en grammes
  },
  allergens: [{
    type: String,
    enum: ['gluten', 'lactose', 'nuts', 'eggs', 'fish', 'shellfish', 'soy', 'sesame']
  }],
  seasonality: [{
    type: String,
    enum: ['spring', 'summer', 'autumn', 'winter', 'all-year']
  }],
  storage: {
    type: String,
    enum: ['fridge', 'freezer', 'pantry', 'room-temperature'],
    default: 'pantry'
  },
  shelfLife: {
    type: Number, // en jours
    min: 1,
    default: 30
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual pour calculer le prix unitaire
ingredientSchema.virtual('unitPrice').get(function() {
  return this.price / this.baseQuantity;
});

// Index pour la recherche
ingredientSchema.index({ name: 'text', category: 1 });
ingredientSchema.index({ category: 1, price: 1 });

// Middleware pour normaliser le nom avant la sauvegarde
ingredientSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }
  next();
});

// Méthode pour vérifier si l'ingrédient est de saison
ingredientSchema.methods.isInSeason = function(month) {
  if (this.seasonality.includes('all-year')) return true;
  
  const seasonMap = {
    spring: [3, 4, 5],
    summer: [6, 7, 8],
    autumn: [9, 10, 11],
    winter: [12, 1, 2]
  };
  
  for (const season of this.seasonality) {
    if (seasonMap[season] && seasonMap[season].includes(month)) {
      return true;
    }
  }
  return false;
};

// Méthode statique pour rechercher par catégorie
ingredientSchema.statics.findByCategory = function(category) {
  return this.find({ category }).sort({ name: 1 });
};

// Méthode statique pour rechercher par prix
ingredientSchema.statics.findByPriceRange = function(minPrice, maxPrice) {
  return this.find({
    $expr: {
      $and: [
        { $gte: [{ $divide: ['$price', '$baseQuantity'] }, minPrice] },
        { $lte: [{ $divide: ['$price', '$baseQuantity'] }, maxPrice] }
      ]
    }
  });
};

module.exports = mongoose.model('Ingredient', ingredientSchema);
