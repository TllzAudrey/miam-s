import mongoose from 'mongoose';

const recetteSchema = new mongoose.Schema({
  nom: String,
  ingredients: [
    {
      idIngredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
      quantite: Number,
    },
  ],
});

export default mongoose.model('Recette', recetteSchema);
