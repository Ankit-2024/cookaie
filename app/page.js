'use client';
import { useState, useEffect } from 'react';
import Search from '@/components/Search';
import VideoCard from '@/components/VideoCard';
import RecipeDetails from '@/components/RecipeDetails';
import SkeletonLoader from '@/components/SkeletonLoader';
import InstamartCart from '@/components/InstamartCart';
import RecipeHistory from '@/components/RecipeHistory';
import Link from 'next/link';
import { Settings, AlertTriangle } from 'lucide-react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jailbreakError, setJailbreakError] = useState(null);
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cookaie_history');
      if (stored) setHistory(JSON.parse(stored));
    } catch(e) {}
  }, []);

  const saveToHistory = (resultData) => {
    setHistory(prev => {
      const newEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        data: resultData
      };
      
      const filtered = prev.filter(item => 
        item.data.recipe && resultData.recipe && 
        item.data.recipe.foodItem.toLowerCase() !== resultData.recipe.foodItem.toLowerCase()
      );
      
      const updated = [newEntry, ...filtered].slice(0, 5);
      localStorage.setItem('cookaie_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRestoreRecipe = (restoredData) => {
    setData(restoredData);
    setJailbreakError(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = async (searchQuery) => {
    setIsLoading(true);
    setError(null);
    setJailbreakError(null);
    setData(null);
    
    try {
      // 1. Read settings from localStorage
      let dietary = 'None';
      let allergies = '';
      try {
        const prefs = JSON.parse(localStorage.getItem('cookaie_prefs') || '{}');
        if (prefs.dietaryBase) dietary = prefs.dietaryBase;
        if (prefs.allergies) allergies = prefs.allergies;
      } catch(e){}

      const url = new URL('/api/recipe', window.location.origin);
      url.searchParams.append('q', searchQuery);
      if (dietary !== 'None') url.searchParams.append('dietary', dietary);
      if (allergies) url.searchParams.append('allergies', allergies);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch recipe data');
      }
      
      const result = await response.json();

      // Check for prompt injection guardrail block
      if (result.recipe && result.recipe.isError) {
        setJailbreakError(result.recipe.message);
        return;
      }

      setData(result);
      saveToHistory(result);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'An unexpected error occurred while fetching the recipe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center w-full min-h-screen pt-12 md:pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8">
        <Link href="/settings" className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white shadow-sm transition-all hover:shadow-md">
          <Settings className="w-5 h-5" />
        </Link>
      </div>
      <div className={`w-full max-w-7xl mx-auto flex flex-col items-center transition-all duration-700 ease-in-out ${data || isLoading ? 'mb-12 md:mb-16' : 'mt-[10vh] md:mt-[20vh] mb-12'}`}>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4 text-center">
          Cookaie.
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-10 max-w-lg">
          Minimalist culinary data aggregator. Discover recipes and cooking videos in one clean space.
        </p>
        
        <Search 
          query={query} 
          setQuery={setQuery} 
          onSearch={handleSearch} 
          isLoading={isLoading} 
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="w-full max-w-2xl mx-auto p-4 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800/50 text-center">
          <p>{error}</p>
        </div>
      )}

      {/* Jailbreak Guardrail Error state */}
      {jailbreakError && (
        <div className="w-full max-w-2xl mx-auto mt-4 p-6 sm:p-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-3xl flex flex-col items-center text-center gap-3 shadow-sm animate-in fade-in zoom-in duration-300">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
          <h2 className="text-xl font-bold text-amber-900 dark:text-amber-500">Not on the Menu!</h2>
          <p className="text-amber-700 dark:text-amber-400 font-medium">{jailbreakError}</p>
        </div>
      )}

      {/* Idle State / History */}
      {!data && !isLoading && history.length > 0 && !jailbreakError && (
        <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-700">
          <RecipeHistory history={history} onSelectRecipe={handleRestoreRecipe} />
        </div>
      )}

      {/* Loading state */}
      {isLoading && <SkeletonLoader />}

      {/* Results view */}
      {data && !isLoading && (
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 lg:gap-12 animate-in fade-in duration-700">
          
          {/* Left Column: Videos */}
          <div className="w-full md:w-[35%] lg:w-[30%] flex flex-col gap-6">
            <h2 className="text-xl font-semibold px-1">Top Videos</h2>
            {data.videos && data.videos.length > 0 ? (
              <div className="flex flex-col gap-6">
                {data.videos.map((video) => (
                  <VideoCard key={video.videoId} video={video} />
                ))}
              </div>
            ) : (
              <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-center text-neutral-500">
                No videos found for this recipe.
              </div>
            )}
          </div>
          
          {/* Right Column: Recipe details */}
          <div className="w-full md:w-[65%] lg:w-[70%] flex flex-col gap-8">
            {data.recipe ? (
              <>
                <RecipeDetails recipe={data.recipe} />
                
                {/* Bento integrations */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-2">
                  <InstamartCart ingredients={data.recipe.ingredients} />
                  {history.length > 0 && (
                    <RecipeHistory history={history} onSelectRecipe={handleRestoreRecipe} />
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-3xl border border-neutral-100 dark:border-neutral-800 text-center text-neutral-500">
                Could not generate recipe instructions.
              </div>
            )}
          </div>
          
        </div>
      )}
    </main>
  );
}
