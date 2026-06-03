'use client';

export default function SkeletonLoader() {
  return (
    <div className="w-full max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 animate-pulse flex flex-col md:flex-row gap-8">
      {/* Videos Skeleton */}
      <div className="w-full md:w-1/3 flex flex-col gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="w-full aspect-video bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
            <div className="w-3/4 h-5 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
            <div className="w-1/2 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
          </div>
        ))}
      </div>
      
      {/* Recipe Skeleton */}
      <div className="w-full md:w-2/3 flex flex-col gap-8">
        {/* Ingredients */}
        <div className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl">
          <div className="w-48 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-md mb-6"></div>
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-800 rounded flex-shrink-0"></div>
                <div className="w-full h-5 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Instructions */}
        <div className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl">
          <div className="w-48 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-md mb-6"></div>
          <div className="flex flex-col gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-full flex-shrink-0"></div>
                <div className="w-full h-16 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
