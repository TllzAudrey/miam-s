import React, { useState } from 'react';
import { Recipe, Ingredient, RecipeIngredient } from '../types';

interface RecipeFormProps {
  ingredients: Ingredient[];
  onAddRecipe: (recipe: Omit<Recipe, 'id'>) => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ ingredients, onAddRecipe }) => {
  const [formData, setFormData] = useState({
    name: '',
    instructions: '',
    preparationTime: 30,
    servings: 4,
    type: 'lunch' as Recipe['type'],
    difficulty: 'medium' as Recipe['difficulty'],
    tags: [] as string[]
  });

  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [newIngredient, setNewIngredient] = useState({
    ingredientId: '',
    quantity: 0
  });

  const mealTypes = [
    { value: 'breakfast', label: 'Petit-déjeuner' },
    { value: 'lunch', label: 'Déjeuner' },
    { value: 'dinner', label: 'Dîner' },
    { value: 'snack', label: 'Collation' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Facile' },
    { value: 'medium', label: 'Moyen' },
    { value: 'hard', label: 'Difficile' }
  ];

  const availableTags = [
    'végétarien', 'végan', 'sans gluten', 'sans lactose', 
    'protéiné', 'léger', 'rapide', 'économique', 'festif'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && recipeIngredients.length > 0) {
      onAddRecipe({
        ...formData,
        prepTime: formData.preparationTime,
        ingredients: recipeIngredients
      });
      
      // Reset form
      setFormData({
        name: '',
        instructions: '',
        preparationTime: 30,
        servings: 4,
        type: 'lunch',
        difficulty: 'medium',
        tags: []
      });
      setRecipeIngredients([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'preparationTime' || name === 'servings' ? parseInt(value) || 0 : value
    }));
  };

  const handleTagChange = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const addIngredient = () => {
    if (newIngredient.ingredientId && newIngredient.quantity > 0) {
      setRecipeIngredients(prev => [
        ...prev,
        { ...newIngredient }
      ]);
      setNewIngredient({ ingredientId: '', quantity: 0 });
    }
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    return ingredient ? ingredient.name : 'Ingrédient inconnu';
  };

  const getIngredientUnit = (ingredientId: string) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    return ingredient ? ingredient.unit : '';
  };

  return (
    <div className="recipe-form">
      <h3>Ajouter une nouvelle recette</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nom de la recette:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ex: Pâtes à la carbonara"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Type de repas:</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              {mealTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">Difficulté:</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              required
            >
              {difficulties.map(diff => (
                <option key={diff.value} value={diff.value}>
                  {diff.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="preparationTime">Temps de préparation (min):</label>
            <input
              type="number"
              id="preparationTime"
              name="preparationTime"
              value={formData.preparationTime}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="servings">Nombre de portions:</label>
            <input
              type="number"
              id="servings"
              name="servings"
              value={formData.servings}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Tags:</label>
          <div className="tags-container">
            {availableTags.map(tag => (
              <label key={tag} className="tag-checkbox">
                <input
                  type="checkbox"
                  checked={formData.tags.includes(tag)}
                  onChange={() => handleTagChange(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>

        <div className="ingredients-section">
          <h4>Ingrédients</h4>
          <div className="add-ingredient">
            <select
              value={newIngredient.ingredientId}
              onChange={(e) => setNewIngredient(prev => ({ ...prev, ingredientId: e.target.value }))}
            >
              <option value="">Choisir un ingrédient</option>
              {ingredients.map(ingredient => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name} ({ingredient.unit})
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Quantité"
              value={newIngredient.quantity}
              onChange={(e) => setNewIngredient(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
              step="0.1"
              min="0"
            />
            <button type="button" onClick={addIngredient} className="btn-secondary">
              Ajouter
            </button>
          </div>

          <div className="ingredients-list">
            {recipeIngredients.map((ingredient, index) => (
              <div key={index} className="ingredient-item">
                <span>
                  {getIngredientName(ingredient.ingredientId)}: {ingredient.quantity} {getIngredientUnit(ingredient.ingredientId)}
                </span>
                <button 
                  type="button" 
                  onClick={() => removeIngredient(index)}
                  className="btn-remove"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="instructions">Instructions:</label>
          <textarea
            id="instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            required
            rows={6}
            placeholder="Décrivez les étapes de préparation..."
          />
        </div>

        <button type="submit" className="btn-primary">
          Ajouter la recette
        </button>
      </form>
    </div>
  );
};

export default RecipeForm;
