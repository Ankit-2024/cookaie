'use client';
import { useState } from 'react';
import { Check, Clock, Utensils, ChefHat } from 'lucide-react';

export default function RecipeDetails({ recipe }) {
  const [checkedIngredients, setCheckedIngredients] = useState({});

  if (!recipe) return null;

  const toggleIngredient = (idx) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Info */}
      <div className="flex flex-wrap gap-6 items-center text-sm text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full">
          <ChefHat className="w-4 h-4" />
          <span className="font-medium">{recipe.foodItem}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Prep: {recipe.prepTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4" />
          <span>Cook: {recipe.cookTime}</span>
        </div>
      </div>

      {/* Ingredients Card */}
      <div className="p-6 sm:p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-md">
        <h2 className="text-xl font-semibold mb-6">Ingredients</h2>
        <ul className="flex flex-col gap-4">
          {recipe.ingredients.map((ing, idx) => (
            <li 
              key={idx} 
              className="flex items-start gap-4 cursor-pointer group"
              onClick={() => toggleIngredient(idx)}
            >
              <button 
                className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border transition-all duration-200 ${checkedIngredients[idx] ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900 scale-105' : 'border-neutral-300 dark:border-neutral-700 group-hover:border-neutral-400'}`}
                aria-label="Toggle ingredient"
              >
                {checkedIngredients[idx] && <Check className="w-3.5 h-3.5" />}
              </button>
              <span className={`text-neutral-700 dark:text-neutral-300 transition-all duration-300 ${checkedIngredients[idx] ? 'line-through opacity-40' : ''}`}>
                <span className="font-medium">{ing.amount}</span> {ing.item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions Card */}
      <div className="p-6 sm:p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-md">
        <h2 className="text-xl font-semibold mb-6">Instructions</h2>
        <ol className="flex flex-col gap-6">
          {recipe.instructions.map((inst, idx) => (
            <li key={idx} className="flex gap-4 group">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-medium flex-shrink-0 transition-colors group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                {inst.step}
              </span>
              <p className="text-neutral-700 dark:text-neutral-300 pt-1 leading-relaxed">
                {inst.action}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
