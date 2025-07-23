import React, { useState } from 'react';
import { Ingredient } from '../types';

interface IngredientFormProps {
  onAddIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
}

const IngredientForm: React.FC<IngredientFormProps> = ({ onAddIngredient }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'autre' as Ingredient['category'],
    price: 0,
    unit: '',
    baseQuantity: 1
  });

  const categories = [
    { value: 'legume', label: 'Légume' },
    { value: 'proteine', label: 'Protéine' },
    { value: 'feculent', label: 'Féculent' },
    { value: 'sauce', label: 'Sauce' },
    { value: 'fruit', label: 'Fruit' },
    { value: 'epice', label: 'Épice' },
    { value: 'autre', label: 'Autre' }
  ];

  const units = [
    { value: 'g', label: 'Grammes' },
    { value: 'kg', label: 'Kilogrammes' },
    { value: 'ml', label: 'Millilitres' },
    { value: 'l', label: 'Litres' },
    { value: 'piece', label: 'Pièces' },
    { value: 'sachet', label: 'Sachets' },
    { value: 'boite', label: 'Boîtes' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.price > 0 && formData.baseQuantity > 0) {
      onAddIngredient(formData);
      setFormData({
        name: '',
        category: 'autre',
        price: 0,
        unit: '',
        baseQuantity: 1
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'baseQuantity' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="ingredient-form">
      <h3>Ajouter un nouvel ingrédient</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nom de l'ingrédient:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ex: Tomates, Poulet, Pâtes..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Catégorie:</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Prix (€):</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              placeholder="2.50"
            />
          </div>

          <div className="form-group">
            <label htmlFor="baseQuantity">Quantité:</label>
            <input
              type="number"
              id="baseQuantity"
              name="baseQuantity"
              value={formData.baseQuantity}
              onChange={handleChange}
              step="0.1"
              min="0.1"
              required
              placeholder="500"
            />
          </div>

          <div className="form-group">
            <label htmlFor="unit">Unité:</label>
            <select
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              required
            >
              <option value="">Choisir une unité</option>
              {units.map(unit => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary">
          Ajouter l'ingrédient
        </button>
      </form>
    </div>
  );
};

export default IngredientForm;
