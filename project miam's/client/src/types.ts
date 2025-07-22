export interface Ingredient {
  _id: string;
  nom: string;
  categorie: string;
  unite: string;
  prixUnitaire: number;
  stock: number;
}

export interface RecetteIngredient {
  idIngredient: string;
  quantite: number;
}

export interface Recette {
  _id: string;
  nom: string;
  ingredients: RecetteIngredient[];
}
