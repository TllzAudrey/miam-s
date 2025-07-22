import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import Ingredient from './models/Ingredient.js';
import Recette from './models/Recette.js';

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/recettes', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get('/ingredients', async (req, res) => {
  const ingredients = await Ingredient.find();
  res.json(ingredients);
});

app.post('/ingredients', async (req, res) => {
  const newIngredient = new Ingredient(req.body);
  await newIngredient.save();
  res.json(newIngredient);
});

app.get('/recettes', async (req, res) => {
  const recettes = await Recette.find();
  res.json(recettes);
});

app.post('/recettes', async (req, res) => {
  const recette = new Recette(req.body);
  await recette.save();
  res.json(recette);
});

app.listen(4000, () => console.log('✅ Serveur lancé sur http://localhost:4000'));
