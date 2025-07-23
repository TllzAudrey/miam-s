import React, { useState, useEffect } from 'react';
import './App.css';
import IngredientForm from './components/IngredientForm';
import RecipeForm from './components/RecipeForm';
import MenuGenerator from './components/MenuGenerator';
import ShoppingListView from './components/ShoppingListView';
import { LoadingSpinner, ErrorMessage } from './components/StatusIndicator';
import { apiService } from './services/api';
import { Ingredient, Recipe, WeekMenu, ShoppingList } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('ingredients');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentMenu, setCurrentMenu] = useState<WeekMenu | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les données initiales
  useEffect(() => {
    loadIngredients();
    loadRecipes();
  }, []);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getIngredients();
      setIngredients(response.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des ingrédients';
      setError(errorMessage);
      console.error('Erreur lors du chargement des ingrédients:', err);
      // Mode offline avec données par défaut
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getRecipes();
      setRecipes(response.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des recettes';
      setError(errorMessage);
      console.error('Erreur lors du chargement des recettes:', err);
      // Mode offline avec données par défaut
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async (ingredientData: Omit<Ingredient, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.createIngredient(ingredientData);
      if (response.success) {
        await loadIngredients(); // Recharger la liste
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de l\'ingrédient';
      setError(errorMessage);
      console.error('Erreur lors de l\'ajout de l\'ingrédient:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipe = async (recipeData: Omit<Recipe, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.createRecipe(recipeData);
      if (response.success) {
        await loadRecipes(); // Recharger la liste
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la recette';
      setError(errorMessage);
      console.error('Erreur lors de l\'ajout de la recette:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuGenerated = (menu: WeekMenu) => {
    setCurrentMenu(menu);
    setShoppingList(null); // Reset la liste de courses
  };

  const handleGenerateShoppingList = async (menu: WeekMenu) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simuler la génération d'une liste de courses basée sur le menu
      const menuItems = new Map<string, number>();
      
      menu.days.forEach(day => {
        [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snack].forEach(recipe => {
          recipe.ingredients.forEach(recipeIngredient => {
            const currentQuantity = menuItems.get(recipeIngredient.ingredientId) || 0;
            menuItems.set(recipeIngredient.ingredientId, currentQuantity + recipeIngredient.quantity);
          });
        });
      });

      const items = Array.from(menuItems.entries()).map(([ingredientId, totalQuantity]) => {
        const ingredient = ingredients.find(ing => ing.id === ingredientId);
        const estimatedPrice = ingredient ? (ingredient.price / ingredient.baseQuantity) * totalQuantity : 0;
        
        return {
          ingredientId,
          totalQuantity,
          estimatedPrice
        };
      });

      const totalPrice = items.reduce((sum, item) => sum + item.estimatedPrice, 0);

      const generatedShoppingList: ShoppingList = {
        id: Date.now().toString(),
        items,
        totalPrice,
        createdFor: menu.id
      };

      setShoppingList(generatedShoppingList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la génération de la liste de courses';
      setError(errorMessage);
      console.error('Erreur lors de la génération de la liste de courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const retryLastAction = () => {
    setError(null);
    // Recharger les données selon l'onglet actif
    if (activeTab === 'ingredients') {
      loadIngredients();
    } else if (activeTab === 'recipes') {
      loadRecipes();
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'ingredients':
        return (
          <div>
            <IngredientForm onAddIngredient={handleAddIngredient} />
            <div className="ingredients-list">
              <h3>Ingrédients existants ({ingredients.length})</h3>
              {ingredients.length === 0 ? (
                <p className="no-data">Aucun ingrédient ajouté. Commencez par ajouter des ingrédients !</p>
              ) : (
                <div className="cards-grid">
                  {ingredients.map(ingredient => (
                    <div key={ingredient.id} className="ingredient-card">
                      <h4>{ingredient.name}</h4>
                      <p><strong>Catégorie:</strong> {ingredient.category}</p>
                      <p><strong>Prix:</strong> {ingredient.price}€ / {ingredient.baseQuantity}{ingredient.unit}</p>
                      <p><strong>Prix unitaire:</strong> {(ingredient.price / ingredient.baseQuantity).toFixed(2)}€/{ingredient.unit}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'recipes':
        return (
          <div>
            <RecipeForm ingredients={ingredients} onAddRecipe={handleAddRecipe} />
            <div className="recipes-list">
              <h3>Recettes existantes ({recipes.length})</h3>
              {recipes.length === 0 ? (
                <p className="no-data">Aucune recette ajoutée. Ajoutez d'abord des ingrédients, puis créez vos recettes !</p>
              ) : (
                <div className="cards-grid">
                  {recipes.map(recipe => (
                    <div key={recipe.id} className="recipe-card">
                      <h4>{recipe.name}</h4>
                      <p><strong>Type:</strong> {recipe.type}</p>
                      <p><strong>Difficulté:</strong> {recipe.difficulty}</p>
                      <p><strong>Temps:</strong> {recipe.prepTime || recipe.preparationTime}min</p>
                      <p><strong>Portions:</strong> {recipe.servings}</p>
                      {recipe.tags.length > 0 && (
                        <p><strong>Tags:</strong> {recipe.tags.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'menu':
        return (
          <MenuGenerator
            recipes={recipes}
            ingredients={ingredients}
            currentMenu={currentMenu}
            onMenuGenerated={handleMenuGenerated}
            onGenerateShoppingList={handleGenerateShoppingList}
          />
        );
      
      case 'shopping':
        return (
          <ShoppingListView
            shoppingList={shoppingList}
            ingredients={ingredients}
          />
        );
      
      default:
        return <div>Onglet non trouvé</div>;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🍽️ Miam's - Générateur de Menus</h1>
        <nav>
          <button 
            className={activeTab === 'ingredients' ? 'active' : ''}
            onClick={() => setActiveTab('ingredients')}
          >
            📦 Ingrédients
          </button>
          <button 
            className={activeTab === 'recipes' ? 'active' : ''}
            onClick={() => setActiveTab('recipes')}
          >
            📝 Recettes
          </button>
          <button 
            className={activeTab === 'menu' ? 'active' : ''}
            onClick={() => setActiveTab('menu')}
          >
            🗓️ Menu
          </button>
          <button 
            className={activeTab === 'shopping' ? 'active' : ''}
            onClick={() => setActiveTab('shopping')}
          >
            🛒 Liste de courses
          </button>
        </nav>
      </header>

      <main>
        {loading && <LoadingSpinner text="Chargement..." />}
        {error && <ErrorMessage error={error} onRetry={retryLastAction} />}
        {!loading && renderActiveTab()}
      </main>
    </div>
  );
};

export default App;