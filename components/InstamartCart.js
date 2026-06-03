'use client';
import { useState, useEffect } from 'react';
import { ShoppingBag, ExternalLink, Loader2, AlertCircle, Plus, Minus, Check } from 'lucide-react';

function parseIngredientToRetail(ingredient) {
  const name = ingredient.item.toLowerCase();
  let baseQuantity = 1;
  let parsedUnit = '1 unit';
  
  // Simple heuristic for commercial packaging estimation
  if (name.includes('egg')) parsedUnit = '1 tray (6 pcs)';
  else if (name.includes('onion') || name.includes('tomato') || name.includes('potato')) parsedUnit = '1kg pack';
  else if (name.includes('milk')) parsedUnit = '1L carton';
  else if (name.includes('chicken') || name.includes('meat')) parsedUnit = '500g pack';
  else if (name.includes('bread')) parsedUnit = '400g loaf';
  else if (name.includes('butter') || name.includes('cheese')) parsedUnit = '200g block';
  else if (name.includes('oil')) parsedUnit = '1L bottle';
  else if (name.includes('flour') || name.includes('sugar') || name.includes('rice')) parsedUnit = '1kg pack';
  else parsedUnit = '1 pack';

  return {
    id: Math.random().toString(36).substring(2, 9),
    originalName: ingredient.item,
    parsedUnit,
    baseQuantity,
    currentQuantity: baseQuantity,
    selected: true,
  };
}

export default function InstamartCart({ ingredients }) {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [cartData, setCartData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [multiplier, setMultiplier] = useState(1);
  const [editableItems, setEditableItems] = useState([]);

  // Initialize editable items whenever recipe ingredients change
  useEffect(() => {
    if (ingredients && ingredients.length > 0) {
      setEditableItems(ingredients.map(parseIngredientToRetail));
      setMultiplier(1);
      setStatus('idle');
      setCartData(null);
    }
  }, [ingredients]);

  const handleMultiplierChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    setMultiplier(val);
    
    // Scale proportionally
    setEditableItems(prev => prev.map(item => ({
      ...item,
      currentQuantity: item.baseQuantity * val,
      // Re-select if quantity becomes greater than 0
      selected: (item.baseQuantity * val) > 0 ? true : item.selected
    })));
  };

  const updateQuantity = (id, delta) => {
    setEditableItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.currentQuantity + delta);
        return {
          ...item,
          currentQuantity: newQuantity,
          // Auto-deselect if it drops to 0, or auto-select if incremented above 0
          selected: newQuantity > 0 ? true : false
        };
      }
      return item;
    }));
  };

  const toggleSelection = (id) => {
    setEditableItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          selected: !item.selected
        };
      }
      return item;
    }));
  };

  const syncCart = async () => {
    // Only compile items that are selected AND have quantity > 0
    const activeItems = editableItems.filter(item => item.selected && item.currentQuantity > 0);
    
    if (activeItems.length === 0) return;
    
    setStatus('loading');
    setErrorMsg('');

    try {
      // Map back to API expected format
      const payload = activeItems.map(item => ({
        item: item.originalName,
        amount: `${item.currentQuantity} x ${item.parsedUnit}`
      }));

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: payload }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync with Swiggy Instamart');
      }

      const data = await response.json();
      setCartData(data);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const hasActiveItems = editableItems.some(item => item.selected && item.currentQuantity > 0);

  return (
    <div className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 flex flex-col gap-6 h-full min-h-[450px]">
      {/* Header */}
      <div className="flex items-start justify-between flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#fc8019]">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Instamart Cart</h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium tracking-wide">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          Swiggy MCP Active
        </div>
      </div>

      {status === 'success' && cartData ? (
        /* Success State View */
        <div className="flex-1 flex flex-col justify-center animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-end mb-6 pb-4 border-b border-neutral-200">
            <p className="text-sm text-neutral-500 font-medium">Estimated Total</p>
            <p className="text-3xl font-bold text-neutral-900 font-mono tracking-tight">
              ₹{cartData.totalEstimatedPrice}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-3 max-h-[220px] space-y-4 custom-scrollbar">
            {cartData.matchedItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-neutral-900 font-medium line-clamp-1">{item.matchedSku}</span>
                  <span className="text-neutral-500 text-xs mt-0.5">For: {item.originalQuery}</span>
                </div>
                <span className="font-mono font-semibold text-neutral-700 bg-white border border-neutral-200 px-2 py-1 rounded shadow-sm">
                  ₹{item.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : status === 'loading' ? (
        /* Loading Skeleton View */
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex flex-col gap-6 animate-pulse w-full">
            <div className="w-full h-20 bg-neutral-200 rounded-2xl mb-2"></div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center gap-4">
                <div className="w-6 h-6 bg-neutral-200 rounded-md"></div>
                <div className="flex-1 h-5 bg-neutral-200 rounded"></div>
                <div className="w-20 h-8 bg-neutral-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      ) : status === 'error' ? (
        /* Error View */
        <div className="flex-1 flex flex-col justify-center items-center gap-3 text-center py-4">
          <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
          <p className="text-lg text-neutral-800 font-semibold">Sync Failed</p>
          <p className="text-sm text-neutral-500 max-w-[260px]">{errorMsg}</p>
        </div>
      ) : (
        /* Interactive Idle/Editing View */
        <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
          
          {/* Portion Scaling */}
          <div className="mb-5 p-4 bg-white border border-neutral-200 rounded-2xl shadow-sm flex flex-col gap-4">
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
              Hosting a house-party or having someone special? Customize your checkout according to your desired portions.
            </p>
            <div className="flex items-center gap-3">
              <label htmlFor="portion-multiplier" className="text-sm font-semibold text-neutral-700">Portion Multiplier:</label>
              <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-neutral-900 focus-within:border-neutral-900">
                <input 
                  id="portion-multiplier"
                  type="number" 
                  min="1" 
                  value={multiplier}
                  onChange={handleMultiplierChange}
                  className="w-16 py-1.5 px-3 text-center text-sm font-mono font-medium outline-none bg-transparent text-neutral-900"
                />
                <div className="px-3 py-1.5 bg-neutral-100 text-neutral-500 text-sm font-medium border-l border-neutral-200">
                  x
                </div>
              </div>
            </div>
          </div>

          {/* Elastic Item List */}
          <div className="flex-1 overflow-y-auto pr-2 max-h-[260px] custom-scrollbar flex flex-col gap-3">
            {editableItems.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.selected && item.currentQuantity > 0 ? 'bg-white border-neutral-200 shadow-sm' : 'bg-transparent border-transparent opacity-60 hover:opacity-80'}`}
              >
                {/* Pantry Toggle Checkbox */}
                <button 
                  onClick={() => toggleSelection(item.id)}
                  className={`w-5 h-5 flex-shrink-0 rounded flex items-center justify-center border transition-all duration-200 ${item.selected ? 'bg-[#fc8019] border-[#fc8019] text-white' : 'bg-white border-neutral-300 hover:border-neutral-400'}`}
                  aria-label="Toggle ingredient"
                >
                  {item.selected && <Check className="w-3.5 h-3.5" />}
                </button>
                
                {/* Item Details */}
                <div className="flex-1 flex flex-col min-w-0">
                  <span className={`text-sm font-medium text-neutral-900 truncate ${!item.selected ? 'line-through' : ''}`}>
                    {item.originalName}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    {item.parsedUnit}
                  </span>
                </div>

                {/* Buffer Controls */}
                <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-lg p-0.5">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-600 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-mono font-medium text-neutral-900">
                    {item.currentQuantity}
                  </span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-600 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer / CTA */}
      <div className="mt-2 pt-4 border-t border-neutral-200">
        {status === 'success' && cartData ? (
          <a
            href={cartData.checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-4 flex items-center justify-center gap-2 bg-[#fc8019] hover:bg-[#e57317] text-white rounded-xl font-medium transition-all shadow-md active:scale-[0.98]"
          >
            Review & Checkout <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        ) : (
          <button
            onClick={syncCart}
            disabled={status === 'loading' || !hasActiveItems}
            className={`w-full py-4 px-4 flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.98] ${
              status === 'loading' || !hasActiveItems 
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm hover:shadow-md'
            }`}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-1" /> Matching Store Catalog...
              </>
            ) : status === 'error' ? (
              'Try Again'
            ) : (
              'Sync Customized Ingredients'
            )}
          </button>
        )}
      </div>
      
      {/* Scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e5e5; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #d4d4d4; }
      `}} />
    </div>
  );
}
