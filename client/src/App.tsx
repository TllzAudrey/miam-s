import React, { useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('ingredients');

  return (
    <div className="App">
      <header className="App-header">
        <h1> Miam's - Générateur de Menus</h1>
        <nav>
          <button 
            className={activeTab === 'ingredients' ? 'active' : ''}
            onClick={() => setActiveTab('ingredients')}
          >
            Ingrédients
          </button>
          <button 
            className={activeTab === 'recipes' ? 'active' : ''}
            onClick={() => setActiveTab('recipes')}
          >
            Recettes
          </button>
          <button 
            className={activeTab === 'menu' ? 'active' : ''}
            onClick={() => setActiveTab('menu')}
          >
            Menu
          </button>
          <button 
            className={activeTab === 'shopping' ? 'active' : ''}
            onClick={() => setActiveTab('shopping')}
          >
            Liste de courses
          </button>
        </nav>
      </header>

      <main>
        <div>
          <h2>Application Miam's</h2>
          <p>Onglet actif: {activeTab}</p>
          <p> Application en cours de développement...</p>
        </div>
      </main>
    </div>
  );
};

export default App;