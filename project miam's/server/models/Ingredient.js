import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  nom: String,
  categorie: String,
  unite: String,
  prixUnitaire: Number,
  stock: Number,
});

export default mongoose.model('Ingredient', ingredientSchema);
