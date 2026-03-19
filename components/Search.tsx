import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, MapPin, Loader2, ArrowRight, Clock, Trash2 } from 'lucide-react';
import { SearchHistoryItem } from '../types';

interface SearchProps {
  onSearch: (query: string, location: string) => Promise<void>;
  isLoading: boolean;
}

const Search: React.FC<SearchProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('lb_searchHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, []);

  const saveToHistory = (q: string, loc: string) => {
    const newItem: SearchHistoryItem = { query: q, location: loc, timestamp: Date.now() };
    const updatedHistory = [
      newItem,
      ...history.filter(item => !(item.query === q && item.location === loc))
    ].slice(0, 5); // Keep top 5
    
    setHistory(updatedHistory);
    localStorage.setItem('lb_searchHistory', JSON.stringify(updatedHistory));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query && location) {
      saveToHistory(query, location);
      onSearch(query, location);
    }
  };

  const handleHistoryClick = (item: SearchHistoryItem) => {
    setQuery(item.query);
    setLocation(item.location);
    saveToHistory(item.query, item.location);
    onSearch(item.query, item.location);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('lb_searchHistory');
  };

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Could not get location. Please enter manually.");
        }
      );
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-8 sm:p-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Find Local Businesses</h2>
          <p className="text-slate-500 text-lg font-medium">Scan Google Maps for thriving businesses that need a professional web presence.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Business Type</label>
            <div className="relative group/input">
              <SearchIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Plumbers, Bakeries, Auto Repair"
                className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200/60 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-slate-900 placeholder-slate-400 font-medium shadow-sm hover:border-slate-300"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Location</label>
            <div className="relative group/input">
              <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Chicago, IL or Zip Code"
                className="w-full pl-12 pr-14 py-3.5 bg-white/50 border border-slate-200/60 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-slate-900 placeholder-slate-400 font-medium shadow-sm hover:border-slate-300"
                required
              />
              <button
                type="button"
                onClick={handleGeolocate}
                className="absolute right-3 top-2.5 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                title="Use current location"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-4 px-6 rounded-2xl shadow-md hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed mt-8 text-lg transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-6 w-6" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <span>Search Businesses</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {history.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                <Clock size={16} /> Recent Searches
              </h3>
              <button 
                onClick={clearHistory}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} /> Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleHistoryClick(item)}
                  disabled={isLoading}
                  className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-sm py-2 px-4 rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-medium">{item.query}</span>
                  <span className="text-slate-400 text-xs">in</span>
                  <span className="font-medium">{item.location}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;