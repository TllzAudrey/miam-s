import React, { useState } from 'react';
import { Recipe, Ingredient, WeekMenu, DayMenu, MenuPreferences } from '../types';

interface MenuGeneratorProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onMenuGenerated: (menu: WeekMenu) => void;
  onGenerateShoppingList: (menu: WeekMenu) => void;
  currentMenu: WeekMenu | null;
}

const MenuGenerator: React.FC<MenuGeneratorProps> = ({
  recipes,
  ingredients,
  onMenuGenerated,
  onGenerateShoppingList,
  currentMenu
}) => {
  const [preferences, setPreferences] = useState<MenuPreferences>({
    dietaryRestrictions: [],
    dislikedIngredients: [],
    preferredDifficulty: 'any',
    maxPreparationTime: 120
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [alternativeRecipes, setAlternativeRecipes] = useState<{[key: string]: Recipe[]}>({});

  const availableRestrictions = [
    'végétarien', 'végan', 'sans gluten', 'sans lactose', 'protéiné', 'léger'
  ];

  const generateRandomMenu = async () => {
    setIsGenerating(true);
    
    // Filtrer les recettes selon les préférences
    const filteredRecipes = recipes.filter(recipe => {
      // Vérifier les restrictions alimentaires
      if (preferences.dietaryRestrictions.length > 0) {
        const hasRestriction = preferences.dietaryRestrictions.some(restriction => 
          recipe.tags.includes(restriction)
        );
        if (!hasRestriction) return false;
      }

      // Vérifier la difficulté
      if (preferences.preferredDifficulty !== 'any' && recipe.difficulty !== preferences.preferredDifficulty) {
        return false;
      }

      // Vérifier le temps de préparation
      const prepTime = recipe.preparationTime || recipe.prepTime || 0;
      if (prepTime > preferences.maxPreparationTime) {
        return false;
      }

      // Vérifier les ingrédients non désirés
      if (preferences.dislikedIngredients.length > 0) {
        const hasDislikedIngredient = recipe.ingredients.some(recipeIngredient =>
          preferences.dislikedIngredients.includes(recipeIngredient.ingredientId)
        );
        if (hasDislikedIngredient) return false;
      }

      return true;
    });

    // Séparer les recettes par type
    const breakfastRecipes = filteredRecipes.filter(r => r.type === 'breakfast');
    const lunchRecipes = filteredRecipes.filter(r => r.type === 'lunch');
    const dinnerRecipes = filteredRecipes.filter(r => r.type === 'dinner');
    const snackRecipes = filteredRecipes.filter(r => r.type === 'snack');

    // Générer un menu pour 7 jours
    const days: DayMenu[] = [];
    const usedRecipes = new Set<string>();

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const dayMenu: DayMenu = {
        id: `day-${i}`,
        date: date.toISOString().split('T')[0],
        breakfast: getRandomRecipes(breakfastRecipes, 1, usedRecipes),
        lunch: getRandomRecipes(lunchRecipes, 1, usedRecipes),
        dinner: getRandomRecipes(dinnerRecipes, 1, usedRecipes),
        snack: Math.random() > 0.5 ? getRandomRecipes(snackRecipes, 1, usedRecipes) : []
      };

      days.push(dayMenu);
    }

    const menu: WeekMenu = {
      id: Date.now().toString(),
      startDate: new Date().toISOString().split('T')[0],
      days
    };

    // Générer des alternatives pour chaque repas
    const alternatives: {[key: string]: Recipe[]} = {};
    days.forEach(day => {
      day.breakfast.forEach(recipe => {
        alternatives[recipe.id] = getAlternativeRecipes(recipe, breakfastRecipes, 2);
      });
      day.lunch.forEach(recipe => {
        alternatives[recipe.id] = getAlternativeRecipes(recipe, lunchRecipes, 2);
      });
      day.dinner.forEach(recipe => {
        alternatives[recipe.id] = getAlternativeRecipes(recipe, dinnerRecipes, 2);
      });
      day.snack.forEach(recipe => {
        alternatives[recipe.id] = getAlternativeRecipes(recipe, snackRecipes, 2);
      });
    });

    setAlternativeRecipes(alternatives);
    onMenuGenerated(menu);
    setIsGenerating(false);
  };

  const getRandomRecipes = (recipeList: Recipe[], count: number, usedRecipes: Set<string>): Recipe[] => {
    const availableRecipes = recipeList.filter(recipe => !usedRecipes.has(recipe.id));
    const selected: Recipe[] = [];
    
    for (let i = 0; i < count && availableRecipes.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableRecipes.length);
      const selectedRecipe = availableRecipes[randomIndex];
      selected.push(selectedRecipe);
      usedRecipes.add(selectedRecipe.id);
      availableRecipes.splice(randomIndex, 1);
    }
    
    return selected;
  };

  const getAlternativeRecipes = (currentRecipe: Recipe, recipeList: Recipe[], count: number): Recipe[] => {
    const alternatives = recipeList
      .filter(recipe => recipe.id !== currentRecipe.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
    
    return alternatives;
  };

  const replaceRecipe = (dayId: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', oldRecipeId: string, newRecipe: Recipe) => {
    if (!currentMenu) return;

    const updatedMenu = {
      ...currentMenu,
      days: currentMenu.days.map(day => {
        if (day.id === dayId) {
          return {
            ...day,
            [mealType]: day[mealType].map(recipe => 
              recipe.id === oldRecipeId ? newRecipe : recipe
            )
          };
        }
        return day;
      })
    };

    onMenuGenerated(updatedMenu);
  };

  const calculateMenuPrice = (menu: WeekMenu): number => {
    let totalPrice = 0;
    menu.days.forEach(day => {
      [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snack].forEach(recipe => {
        recipe.ingredients.forEach(recipeIngredient => {
          const ingredient = ingredients.find(ing => ing.id === recipeIngredient.ingredientId);
          if (ingredient) {
            const unitPrice = ingredient.price / ingredient.baseQuantity;
            totalPrice += unitPrice * recipeIngredient.quantity;
          }
        });
      });
    });
    return totalPrice;
  };

  return (
    <div className="menu-generator">
      <h2>Générateur de Menu</h2>
      
      <div className="preferences">
        <h3>Préférences</h3>
        
        <div className="form-group">
          <label>Restrictions alimentaires:</label>
          <div className="restrictions-container">
            {availableRestrictions.map(restriction => (
              <label key={restriction} className="restriction-checkbox">
                <input
                  type="checkbox"
                  checked={preferences.dietaryRestrictions.includes(restriction)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPreferences(prev => ({
                        ...prev,
                        dietaryRestrictions: [...prev.dietaryRestrictions, restriction]
                      }));
                    } else {
                      setPreferences(prev => ({
                        ...prev,
                        dietaryRestrictions: prev.dietaryRestrictions.filter(r => r !== restriction)
                      }));
                    }
                  }}
                />
                {restriction}
              </label>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="difficulty">Difficulté préférée:</label>
            <select
              id="difficulty"
              value={preferences.preferredDifficulty}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                preferredDifficulty: e.target.value as MenuPreferences['preferredDifficulty']
              }))}
            >
              <option value="any">Toutes</option>
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Difficile</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="maxTime">Temps max (min):</label>
            <input
              type="number"
              id="maxTime"
              value={preferences.maxPreparationTime}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                maxPreparationTime: parseInt(e.target.value) || 120
              }))}
              min="15"
              max="300"
            />
          </div>
        </div>

        <button 
          onClick={generateRandomMenu}
          disabled={isGenerating || recipes.length === 0}
          className="btn-primary"
        >
          {isGenerating ? 'Génération en cours...' : 'Générer un menu aléatoire'}
        </button>
      </div>

      {currentMenu && (
        <div className="current-menu">
          <div className="menu-header">
            <h3>Menu de la semaine du {currentMenu.startDate}</h3>
            <p className="menu-price">Prix estimé: {calculateMenuPrice(currentMenu).toFixed(2)}€</p>
            <button 
              onClick={() => onGenerateShoppingList(currentMenu)}
              className="btn-secondary"
            >
              Générer la liste de courses
            </button>
          </div>

          <div className="menu-days">
            {currentMenu.days.map((day, index) => (
              <div key={day.id} className="day-menu">
                <h4>Jour {index + 1} - {new Date(day.date).toLocaleDateString('fr-FR')}</h4>
                
                <div className="meals">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => (
                    <div key={mealType} className="meal">
                      <h5>
                        {mealType === 'breakfast' && 'Petit-déjeuner'}
                        {mealType === 'lunch' && 'Déjeuner'}
                        {mealType === 'dinner' && 'Dîner'}
                        {mealType === 'snack' && 'Collation'}
                      </h5>
                      
                      {(day[mealType as keyof DayMenu] as Recipe[])?.map((recipe: Recipe) => (
                        <div key={recipe.id} className="recipe-item">
                          <div className="recipe-info">
                            <span className="recipe-name">{recipe.name}</span>
                            <span className="recipe-time">{recipe.preparationTime || recipe.prepTime}min</span>
                          </div>
                          
                          {alternativeRecipes[recipe.id] && alternativeRecipes[recipe.id].length > 0 && (
                            <div className="alternatives">
                              <span>Alternatives:</span>
                              {alternativeRecipes[recipe.id].map(alt => (
                                <button
                                  key={alt.id}
                                  onClick={() => replaceRecipe(day.id, mealType as any, recipe.id, alt)}
                                  className="btn-alternative"
                                >
                                  {alt.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuGenerator;
