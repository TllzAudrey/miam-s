import React from 'react';
import { ShoppingList, Ingredient } from '../types';

interface ShoppingListViewProps {
  shoppingList: ShoppingList | null;
  ingredients: Ingredient[];
}

const ShoppingListView: React.FC<ShoppingListViewProps> = ({ shoppingList, ingredients }) => {
  if (!shoppingList) {
    return (
      <div className="shopping-list-view">
        <h2>Liste de Courses</h2>
        <p>Aucune liste de courses générée. Créez d'abord un menu dans l'onglet "Menu".</p>
      </div>
    );
  }

  const getIngredientInfo = (ingredientId: string) => {
    return ingredients.find(ing => ing.id === ingredientId);
  };

  const groupItemsByCategory = () => {
    const grouped: {[category: string]: typeof shoppingList.items} = {};
    
    shoppingList.items.forEach(item => {
      const ingredient = getIngredientInfo(item.ingredientId);
      const category = ingredient?.category || 'autre';
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  };

  const categoryLabels = {
    legume: 'Légumes',
    proteine: 'Protéines',
    feculent: 'Féculents',
    sauce: 'Sauces',
    fruit: 'Fruits',
    epice: 'Épices',
    autre: 'Autres'
  };

  const groupedItems = groupItemsByCategory();

  const handlePrint = () => {
    window.print();
  };

  const exportToText = () => {
    let text = `LISTE DE COURSES\n`;
    text += `=====================\n\n`;
    text += `Prix total estimé: ${shoppingList.totalPrice.toFixed(2)}€\n\n`;

    Object.entries(groupedItems).forEach(([category, items]) => {
      text += `${categoryLabels[category as keyof typeof categoryLabels] || category.toUpperCase()}\n`;
      text += `${'-'.repeat(categoryLabels[category as keyof typeof categoryLabels]?.length || category.length)}\n`;
      
      items.forEach(item => {
        const ingredient = getIngredientInfo(item.ingredientId);
        text += `• ${ingredient?.name}: ${item.totalQuantity}${ingredient?.unit} (${item.estimatedPrice.toFixed(2)}€)\n`;
      });
      text += '\n';
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liste-courses-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="shopping-list-view">
      <div className="shopping-header">
        <h2>Liste de Courses</h2>
        <div className="shopping-actions">
          <button onClick={handlePrint} className="btn-secondary">
            🖨️ Imprimer
          </button>
          <button onClick={exportToText} className="btn-secondary">
            📄 Exporter
          </button>
        </div>
      </div>

      <div className="shopping-summary">
        <h3>Résumé</h3>
        <p><strong>Prix total estimé: {shoppingList.totalPrice.toFixed(2)}€</strong></p>
        <p>Nombre d'articles: {shoppingList.items.length}</p>
      </div>

      <div className="shopping-categories">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="category-section">
            <h3 className="category-title">
              {categoryLabels[category as keyof typeof categoryLabels] || category}
              <span className="category-count">({items.length} articles)</span>
            </h3>
            
            <div className="category-items">
              {items.map((item, index) => {
                const ingredient = getIngredientInfo(item.ingredientId);
                return (
                  <div key={index} className="shopping-item">
                    <div className="item-info">
                      <span className="item-name">{ingredient?.name}</span>
                      <span className="item-quantity">
                        {item.totalQuantity}{ingredient?.unit}
                      </span>
                    </div>
                    <div className="item-price">
                      {item.estimatedPrice.toFixed(2)}€
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="category-total">
              Total {categoryLabels[category as keyof typeof categoryLabels] || category}: {
                items.reduce((sum, item) => sum + item.estimatedPrice, 0).toFixed(2)
              }€
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShoppingListView;
