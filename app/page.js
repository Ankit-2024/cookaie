'use client';
import { useState } from 'react';
import Search from '@/components/Search';
import VideoCard from '@/components/VideoCard';
import RecipeDetails from '@/components/RecipeDetails';
import SkeletonLoader from '@/components/SkeletonLoader';
import InstamartCart from '@/components/InstamartCart';

export default function Home() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleSearch = async (searchQuery) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    
    try {
      const response = await fetch(`/api/recipe?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch recipe data');
      }
      
      const result = await response.json();
      setData(result);
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
