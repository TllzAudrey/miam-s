import { useState } from 'react';
import { Recette, MenuJournee, Repas } from '../types';

const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;

type MenuHebdo = Record<
  typeof joursSemaine[number],
  Record<
    Repas,
    {
      choix: (Recette | null)[];
      selection: Recette | null;
    }
  >
>;

function choisirDeuxRecettes(recettes: Recette[]): (Recette | null)[] {
  if (recettes.length === 0) return [null, null];
  const shuffled = recettes.sort(() => 0.5 - Math.random());
  return [shuffled[0], shuffled[1] || null];
}

export default function MenuGenerator({ recettes }: { recettes: Recette[] }) {
  const [menuHebdo, setMenuHebdo] = useState<MenuHebdo>({} as MenuHebdo);

  function genererMenuHebdo() {
    const nouveauMenu = {} as MenuHebdo;
    for (const jour of joursSemaine) {
      nouveauMenu[jour] = {
        matin: { choix: choisirDeuxRecettes(recettes), selection: null },
        midi: { choix: choisirDeuxRecettes(recettes), selection: null },
        gouter: { choix: choisirDeuxRecettes(recettes), selection: null },
        soir: { choix: choisirDeuxRecettes(recettes), selection: null },
      };
      (['matin', 'midi', 'gouter', 'soir'] as Repas[]).forEach((repas) => {
        nouveauMenu[jour][repas].selection = nouveauMenu[jour][repas].choix[0];
      });
    }
    setMenuHebdo(nouveauMenu);
  }

  return (
    <section className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-3xl font-extrabold text-orange-600 mb-6 text-center">Menu de la semaine</h2>

      <div className="text-center mb-8">
        <button
          onClick={genererMenuHebdo}
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md transition"
        >
          Générer un menu
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {joursSemaine.map((jour) => (
          <div
            key={jour}
            className="bg-orange-50 rounded-xl shadow-md p-5 hover:shadow-2xl transition"
          >
            <h3 className="text-xl font-bold text-orange-700 mb-4">{jour}</h3>
            {menuHebdo[jour] ? (
              (['matin', 'midi', 'gouter', 'soir'] as Repas[]).map((repas) => (
                <div key={repas} className="mb-3">
                  <h4 className="font-semibold text-orange-600 capitalize">{repas}</h4>
                  <ul className="list-disc list-inside text-gray-800">
                    {menuHebdo[jour][repas].choix.map((recette, idx) => (
                      <li
                        key={idx}
                        className={`cursor-pointer ${
                          menuHebdo[jour][repas].selection?.id === recette?.id
                            ? 'font-bold text-green-700'
                            : ''
                        }`}
                        onClick={() => {
                          // Selection change code ici si besoin
                        }}
                      >
                        {recette ? recette.nom : 'Aucune recette'}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="italic text-gray-400">Cliquez sur "Générer un menu" pour commencer.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
