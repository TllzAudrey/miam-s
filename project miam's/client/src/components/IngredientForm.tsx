import { useState } from 'react';
import { Ingredient } from '../types';

export default function IngredientForm({
  ingredients,
  setIngredients,
}: {
  ingredients: Ingredient[];
  setIngredients: (i: Ingredient[]) => void;
}) {
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('Légume');
  const [unite, setUnite] = useState('g');
  const [prix, setPrix] = useState(0);

  const ajouter = async () => {
    const res = await fetch('http://localhost:4000/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom,
        categorie,
        unite,
        prixUnitaire: prix,
        stock: 0,
      }),
    });
    const data = await res.json();
    setIngredients([...ingredients, data]);
    setNom('');
    setPrix(0);
  };

  return (
    <div className="bg-white shadow p-4 rounded mb-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-800">Ajouter un ingrédient</h2>
      <div className="flex flex-wrap gap-2">
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom"
          className="border p-2 rounded flex-1"
        />
        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className="border p-2 rounded"
        >
          <option>Légume</option>
          <option>Protéine</option>
          <option>Féculent</option>
          <option>Fruit</option>
          <option>Sauce</option>
          <option>Autre</option>
        </select>
        <input
          value={unite}
          onChange={(e) => setUnite(e.target.value)}
          placeholder="Unité"
          className="border p-2 rounded w-20"
        />
        <input
          type="number"
          value={prix}
          onChange={(e) => setPrix(parseFloat(e.target.value))}
          placeholder="Prix"
          className="border p-2 rounded w-24"
        />
        <button onClick={ajouter} className="bg-green-500 text-white px-4 py-2 rounded">
          Ajouter
        </button>
      </div>
    </div>
  );
}
