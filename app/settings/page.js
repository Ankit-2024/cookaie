'use client';
import { useState, useEffect } from 'react';
import { Save, ArrowLeft, CheckCircle2, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';

export default function Settings() {
  const [prefs, setPrefs] = useState({
    dietaryBase: 'None',
    allergies: '',
    retailer: 'Instamart'
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cookaie_prefs');
      if (stored) {
        setPrefs(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load preferences');
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('cookaie_prefs', JSON.stringify(prefs));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save preferences');
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center w-full min-h-screen pt-12 md:pt-24 pb-24 px-4 sm:px-6 lg:px-8 bg-[#FAF9F6] dark:bg-neutral-950">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Settings</h1>
              <p className="text-sm text-neutral-500">Configure your culinary preferences.</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Search
          </Link>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-8">
          
          {/* Dietary Base */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Dietary Base</label>
            <select 
              value={prefs.dietaryBase}
              onChange={(e) => setPrefs({...prefs, dietaryBase: e.target.value})}
              className="w-full p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all text-neutral-900 dark:text-neutral-100"
            >
              <option value="None">None</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Keto">Keto</option>
            </select>
          </div>

          {/* Allergy Exclusions */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Allergy Exclusions</label>
            <input 
              type="text"
              placeholder="e.g., Peanuts, Dairy, Shellfish"
              value={prefs.allergies}
              onChange={(e) => setPrefs({...prefs, allergies: e.target.value})}
              className="w-full p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
            />
            <p className="text-xs text-neutral-500">Separate multiple ingredients with commas.</p>
          </div>

          {/* Fulfillment Retailer */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Fulfillment Retailer</label>
            <div className="flex flex-col sm:flex-row gap-3">
              {['Instamart', 'Blinkit', 'Zepto'].map((retailer) => (
                <button
                  key={retailer}
                  onClick={() => setPrefs({...prefs, retailer})}
                  className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                    prefs.retailer === retailer 
                      ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-900 shadow-md' 
                      : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-600'
                  }`}
                >
                  {retailer}
                </button>
              ))}
            </div>
          </div>
          
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all shadow-sm active:scale-[0.98] ${
              isSaved 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200'
            }`}
          >
            {isSaved ? <><CheckCircle2 className="w-5 h-5" /> Configuration Saved</> : <><Save className="w-5 h-5" /> Save Configuration</>}
          </button>
        </div>

      </div>
    </main>
  );
}
