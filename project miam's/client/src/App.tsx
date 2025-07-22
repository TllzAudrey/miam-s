import { useEffect, useState } from 'react';
import IngredientForm from './components/IngredientForm';
import RecipeForm from './components/RecipeForm';
import { Ingredient, Recette } from './types';
import './App.css';

export default function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recettes, setRecettes] = useState<Recette[]>([]);

  // Charger les données depuis le serveur
  useEffect(() => {
    fetch('http://localhost:4000/ingredients')
      .then((res) => res.json())
      .then(setIngredients);

    fetch('http://localhost:4000/recettes')
      .then((res) => res.json())
      .then(setRecettes);
  }, []);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-teal-700 mb-6">
        Planificateur de Recettes
      </h1>
      <IngredientForm ingredients={ingredients} setIngredients={setIngredients} />
      <RecipeForm ingredients={ingredients} recettes={recettes} setRecettes={setRecettes} />
    </div>
  );
}
