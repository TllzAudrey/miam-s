// Types pour l'application de recettes aléatoires

export interface Ingredient {
  id: string;
  name: string;
  category: 'legume' | 'proteine' | 'feculent' | 'sauce' | 'fruit' | 'epice' | 'autre';
  price: number; // Prix pour l'unité de base
  unit: string; // gramme, litre, pièce, etc.
  baseQuantity: number; // Quantité de l'unité de base (ex: 1 kg = 1000g)
  nutritionalInfo?: {
    calories?: number;
    proteins?: number;
    carbs?: number;
    fats?: number;
  };
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number; // Quantité nécessaire dans l'unité de base
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: string;
  prepTime: number; // en minutes (renommé pour correspondre à l'API)
  cookTime?: number; // en minutes
  preparationTime?: number; // pour la compatibilité arrière
  servings: number; // nombre de portions
  type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[]; // végétarien, sans gluten, etc.
  nutritionalInfo?: {
    calories?: number;
    proteins?: number;
    carbs?: number;
    fats?: number;
  };
  rating?: {
    average: number;
    count: number;
  };
}

export interface DayMenu {
  id: string;
  date: string;
  breakfast: Recipe[];
  lunch: Recipe[];
  dinner: Recipe[];
  snack: Recipe[];
}

export interface WeekMenu {
  id: string;
  startDate: string;
  days: DayMenu[];
}

export interface ShoppingListItem {
  ingredientId: string;
  totalQuantity: number;
  estimatedPrice: number;
}

export interface ShoppingList {
  id: string;
  items: ShoppingListItem[];
  totalPrice: number;
  createdFor: string; // ID du menu ou des recettes
}

export interface MenuPreferences {
  dietaryRestrictions: string[];
  dislikedIngredients: string[];
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'any';
  maxPreparationTime: number;
}
