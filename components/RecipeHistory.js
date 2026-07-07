'use client';
import { Clock, ChefHat } from 'lucide-react';

export default function RecipeHistory({ history, onSelectRecipe }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="w-full bg-[#FAF9F6] dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 h-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-500">
          <Clock className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Recent Recipes</h2>
      </div>

      <div className="flex flex-col gap-3">
        {history.map((item, idx) => (
          <button
            key={item.id || idx}
            onClick={() => onSelectRecipe(item.data)}
            className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm transition-all group text-left"
          >
            <div className="flex items-center gap-3 truncate pr-4">
              <ChefHat className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 flex-shrink-0" />
              <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {item.data.recipe.foodItem}
              </span>
            </div>
            <span className="text-xs text-neutral-500 font-mono whitespace-nowrap flex-shrink-0">
              {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
