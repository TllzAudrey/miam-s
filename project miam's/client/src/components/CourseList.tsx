import { Recette, Ingredient } from '../types';

export default function CourseList({ recettes, ingredients }: { recettes: Recette[]; ingredients: Ingredient[] }) {
  // Calcule la quantité totale nécessaire par ingrédient
  const quantitesMap: Record<string, number> = {};

  recettes.forEach((recette) => {
    recette.ingredients.forEach(({ idIngredient, quantite }) => {
      quantitesMap[idIngredient] = (quantitesMap[idIngredient] || 0) + quantite;
    });
  });

  // Détail avec info complète ingrédient + quantité + prix total par ingrédient
  const details = Object.entries(quantitesMap).map(([id, quantite]) => {
    const ingr = ingredients.find(i => i.id === id);
    return {
      ingredient: ingr,
      quantite,
      prixTotal: ingr ? quantite * ingr.prixUnitaire : 0,
    };
  }).filter(d => d.ingredient);

  const prixTotal = details.reduce((acc, d) => acc + d.prixTotal, 0);

  return (
    <section className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-6 mt-10">
      <h2 className="text-2xl font-semibold text-orange-600 mb-4">Liste des courses</h2>
      {details.length === 0 ? (
        <p className="text-gray-500 italic">Aucune recette sélectionnée.</p>
      ) : (
        <>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-orange-300">
                <th className="text-left p-2">Ingrédient</th>
                <th className="text-right p-2">Quantité</th>
                <th className="text-right p-2">Prix Total (€)</th>
              </tr>
            </thead>
            <tbody>
              {details.map(({ ingredient, quantite, prixTotal }) => (
                <tr key={ingredient!.id} className="border-b border-orange-100 hover:bg-orange-50 transition">
                  <td className="p-2">{ingredient!.nom}</td>
                  <td className="p-2 text-right">
                    {quantite.toFixed(2)} {ingredient!.unite}
                  </td>
                  <td className="p-2 text-right">{prixTotal.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="font-bold bg-orange-100">
                <td className="p-2">Total</td>
                <td />
                <td className="p-2 text-right">{prixTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
