'use client';
import { SearchIcon, Loader2 } from 'lucide-react';

export default function Search({ query, setQuery, onSearch, isLoading }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto relative group">
      <div className="relative flex items-center transition-all duration-300 ease-in-out focus-within:shadow-md rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div className="pl-6 text-neutral-400">
          <SearchIcon className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to cook today? (e.g., Beef Wellington)"
          className="w-full py-4 pl-4 pr-16 bg-transparent outline-none text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 transition-colors"
          disabled={isLoading}
        />
        <div className="absolute right-2">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="p-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Search"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SearchIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
