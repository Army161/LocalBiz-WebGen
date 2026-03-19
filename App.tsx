import React, { useState, useEffect } from 'react';
import { Business, WebsiteContent, AppStep } from './types';
import { searchBusinesses, generateWebsiteContent } from './services/geminiService';
import Search from './components/Search';
import BusinessList from './components/BusinessList';
import WebsitePreview from './components/WebsitePreview';
import { Map, Sparkles, AlertTriangle, ArrowLeft, Trash2, FolderOpen, Clock, Globe, Activity, Eye, Edit3 } from 'lucide-react';
import AnalyticsDashboard from './components/AnalyticsDashboard';

const App: React.FC = () => {
  // Initialize state from localStorage if available
  const [step, setStep] = useState<AppStep>(() => 
    (localStorage.getItem('lb_step') as AppStep) || 'search'
  );
  
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    const saved = localStorage.getItem('lb_businesses');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(() => {
    const saved = localStorage.getItem('lb_selectedBusiness');
    return saved ? JSON.parse(saved) : null;
  });

  const [websiteContent, setWebsiteContent] = useState<WebsiteContent | null>(() => {
    const saved = localStorage.getItem('lb_websiteContent');
    return saved ? JSON.parse(saved) : null;
  });

  const [savedSites, setSavedSites] = useState<WebsiteContent[]>(() => {
    const saved = localStorage.getItem('lb_savedSites');
    return saved ? JSON.parse(saved) : [];
  });

  const [sourceStep, setSourceStep] = useState<AppStep>(() => {
    return (localStorage.getItem('lb_sourceStep') as AppStep) || 'results';
  });

  const [previewMode, setPreviewMode] = useState<'view' | 'edit'>('view');

  const [analyticsSite, setAnalyticsSite] = useState<WebsiteContent | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API Key
  useEffect(() => {
    const checkApiKey = async () => {
      if ((window as any).aistudio && typeof (window as any).aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        // Fallback if not in AI Studio environment
        setHasApiKey(true);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio && typeof (window as any).aistudio.openSelectKey === 'function') {
      await (window as any).aistudio.openSelectKey();
      // Assume success after triggering to mitigate race condition
      setHasApiKey(true);
    }
  };

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('lb_step', step);
    localStorage.setItem('lb_businesses', JSON.stringify(businesses));
    localStorage.setItem('lb_selectedBusiness', JSON.stringify(selectedBusiness));
    localStorage.setItem('lb_websiteContent', JSON.stringify(websiteContent));
    localStorage.setItem('lb_savedSites', JSON.stringify(savedSites));
    localStorage.setItem('lb_sourceStep', sourceStep);
  }, [step, businesses, selectedBusiness, websiteContent, savedSites, sourceStep]);

  const handleSearch = async (query: string, location: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Add a 20-second timeout to prevent indefinite loading
      const timeoutPromise = new Promise<Business[]>((_, reject) => 
        setTimeout(() => reject(new Error("Search timed out. Please try again.")), 20000)
      );

      const results = await Promise.race([
        searchBusinesses(query, location),
        timeoutPromise
      ]);

      setBusinesses(results);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch businesses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBusiness = async (business: Business) => {
    setSelectedBusiness(business);
    setSourceStep('results');
    setStep('generating');
    setIsLoading(true);
    
    try {
      const content = await generateWebsiteContent(business);
      const newSite = {
        ...content,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setWebsiteContent(newSite);
      setSavedSites(prev => [newSite, ...prev]);
      setPreviewMode('edit');
      setStep('preview');
    } catch (err) {
      setError("Failed to generate website content.");
      setStep('results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateContent = (newContent: WebsiteContent) => {
    const updatedContent = { ...newContent, updatedAt: Date.now() };
    setWebsiteContent(updatedContent);
    setSavedSites(prev => prev.map(site => site.id === updatedContent.id ? updatedContent : site));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all data and start over?")) {
      setStep('search');
      setBusinesses([]);
      setSelectedBusiness(null);
      setWebsiteContent(null);
      setSavedSites([]);
      setSourceStep('results');
      localStorage.clear();
    }
  };

  // Render Logic
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-200/60">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">API Key Required</h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            To use the advanced Gemini 3.1 Flash Image and Pro models for website generation, you need to select a Google Cloud API key with billing enabled.
            <br/><br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold">Learn more about billing</a>
          </p>
          <button 
            onClick={handleSelectKey}
            className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  if (step === 'preview' && websiteContent) {
    return (
      <WebsitePreview 
        content={websiteContent} 
        onReset={() => setStep(sourceStep)} 
        onUpdate={handleUpdateContent}
        initialShowEditor={previewMode === 'edit'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setStep('search')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Map className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              LocalBiz WebGen
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setStep('saved-sites')} 
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-md hover:bg-indigo-50"
            >
              <FolderOpen size={16} /> My Sites ({savedSites.length})
            </button>
            {step !== 'search' && (
              <button 
                onClick={handleReset} 
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-md hover:bg-red-50"
              >
                <Trash2 size={16} /> Clear & Restart
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Step: Search */}
        {step === 'search' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
            <Search onSearch={handleSearch} isLoading={isLoading} />
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="h-5 w-5" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && (
          <div>
            <div className="mb-6 flex items-center gap-4">
              <button 
                onClick={() => setStep('search')} 
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                title="Back to search"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-semibold">Select a business to modernize</h2>
            </div>
            <BusinessList businesses={businesses} onSelect={handleSelectBusiness} />
          </div>
        )}

        {/* Step: Generating */}
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fadeIn">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white/90 backdrop-blur-xl p-6 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60">
                 <Sparkles className="h-12 w-12 text-indigo-600 animate-spin-slow" />
              </div>
            </div>
            
            <div className="max-w-md space-y-4">
              <h2 className="text-2xl font-bold text-slate-800">Designing Website...</h2>
              <div className="text-slate-500 space-y-2">
                <p>Analyzing {selectedBusiness?.name}'s digital footprint.</p>
                <p>Gemini 3 Pro is architecting the layout...</p>
                <p className="text-xs text-indigo-500 uppercase font-semibold tracking-wider">Thinking Mode Active</p>
              </div>
            </div>
          </div>
        )}

        {/* Step: Saved Sites */}
        {step === 'saved-sites' && (
          <div className="animate-fadeIn">
            {analyticsSite && (
              <AnalyticsDashboard 
                site={analyticsSite} 
                onClose={() => setAnalyticsSite(null)} 
              />
            )}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStep('search')} 
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                  title="Back to search"
                >
                  <ArrowLeft className="h-5 w-5 text-slate-600" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800">My Saved Sites</h2>
              </div>
            </div>
            
            {savedSites.length === 0 ? (
              <div className="text-center py-20 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <Globe className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No saved sites yet</h3>
                <p className="text-slate-500 mb-6">Generate your first website to see it here.</p>
                <button 
                  onClick={() => setStep('search')}
                  className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 shadow-md hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Start Searching
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedSites.map(site => (
                  <div key={site.id} className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                    <div 
                      className="h-32 bg-cover bg-center relative"
                      style={{ 
                        backgroundImage: site.heroImageBase64 ? `url(data:image/png;base64,${site.heroImageBase64})` : 'none',
                        backgroundColor: site.colorPalette.primary 
                      }}
                    >
                      <div className="absolute inset-0 bg-black/40"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-bold text-lg truncate">{site.businessName}</h3>
                        <p className="text-white/80 text-sm truncate">{site.tagline}</p>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                        <Clock size={14} />
                        <span>Last updated: {new Date(site.updatedAt || site.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setSourceStep('saved-sites');
                            setWebsiteContent(site);
                            setPreviewMode('view');
                            setStep('preview');
                          }}
                          className="flex-1 bg-slate-50/80 text-slate-600 hover:bg-slate-100 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button 
                          onClick={() => {
                            setSourceStep('saved-sites');
                            setWebsiteContent(site);
                            setPreviewMode('edit');
                            setStep('preview');
                          }}
                          className="flex-1 bg-indigo-50/80 text-indigo-600 hover:bg-indigo-100 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button 
                          onClick={() => setAnalyticsSite(site)}
                          className="flex-1 bg-emerald-50/80 text-emerald-600 hover:bg-emerald-100 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
                          title="Leads & Analytics"
                        >
                          <Activity size={14} /> Leads
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Delete this site?')) {
                              setSavedSites(prev => prev.filter(s => s.id !== site.id));
                              if (websiteContent?.id === site.id) {
                                setWebsiteContent(null);
                              }
                            }
                          }}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Delete Site"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default App;