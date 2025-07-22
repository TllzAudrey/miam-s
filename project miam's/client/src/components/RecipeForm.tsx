import { useState } from 'react';
import { Ingredient, Recette, RecetteIngredient } from '../types';

export default function RecipeForm({
  ingredients,
  recettes,
  setRecettes,
}: {
  ingredients: Ingredient[];
  recettes: Recette[];
  setRecettes: (r: Recette[]) => void;
}) {
  const [nom, setNom] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [quantite, setQuantite] = useState(0);
  const [ingList, setIngList] = useState<RecetteIngredient[]>([]);

  const ajouterIngredient = () => {
    if (!selectedIngredient || quantite <= 0) return;
    setIngList([...ingList, { idIngredient: selectedIngredient, quantite }]);
    setSelectedIngredient('');
    setQuantite(0);
  };

  const ajouterRecette = async () => {
    if (!nom || ingList.length === 0) return;
    const res = await fetch('http://localhost:4000/recettes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, ingredients: ingList }),
    });
    const data = await res.json();
    setRecettes([...recettes, data]);
    setNom('');
    setIngList([]);
  };

  return (
    <div className="bg-white shadow p-4 rounded mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-800">Créer une recette</h2>
      <input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Nom de la recette"
        className="border p-2 rounded w-full mb-2"
      />
      <div className="flex gap-2 items-center mb-2">
        <select
          value={selectedIngredient}
          onChange={(e) => setSelectedIngredient(e.target.value)}
          className="border p-2 rounded flex-1"
        >
          <option value="">Choisir un ingrédient</option>
          {ingredients.map((i) => (
            <option key={i._id} value={i._id}>
              {i.nom}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={quantite}
          onChange={(e) => setQuantite(parseFloat(e.target.value))}
          placeholder="Quantité"
          className="border p-2 rounded w-24"
        />
        <button
          onClick={ajouterIngredient}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Ajouter
        </button>
      </div>
      <ul className="text-sm text-gray-700">
        {ingList.map((ri, idx) => {
          const ing = ingredients.find((i) => i._id === ri.idIngredient);
          return (
            <li key={idx}>
              {ing?.nom} - {ri.quantite} {ing?.unite}
            </li>
          );
        })}
      </ul>
      <button
        onClick={ajouterRecette}
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
      >
        Enregistrer la recette
      </button>
    </div>
  );
}
