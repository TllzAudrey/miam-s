const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import des routes
const ingredientRoutes = require('./routes/ingredients');
const recipeRoutes = require('./routes/recipes');
const menuRoutes = require('./routes/menus');
const shoppingRoutes = require('./routes/shopping');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de sécurité
app.use(helmet());
app.use(morgan('combined'));

// CORS - Permettre les requêtes depuis le client React
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connexion à MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/miam-s', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
};

// Connexion à la base de données
connectDB();

// Routes API
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/shopping', shoppingRoutes);

// Route de base
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Miam\'s - Générateur de recettes aléatoires',
    version: '1.0.0',
    endpoints: {
      ingredients: '/api/ingredients',
      recipes: '/api/recipes',
      menus: '/api/menus',
      shopping: '/api/shopping'
    }
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route non trouvée',
    path: req.originalUrl 
  });
});

// Middleware de gestion d'erreurs globales
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(error.status || 500).json({
    message: error.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📱 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await mongoose.connection.close();
  console.log('📦 Connexion MongoDB fermée');
  process.exit(0);
});
