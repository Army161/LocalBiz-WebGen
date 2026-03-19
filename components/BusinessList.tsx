import React from 'react';
import { Business } from '../types';
import { Star, Globe, AlertCircle, ArrowRight, CheckCircle2, Download, Phone, Mail } from 'lucide-react';

interface BusinessListProps {
  businesses: Business[];
  onSelect: (business: Business) => void;
}

const BusinessList: React.FC<BusinessListProps> = ({ businesses, onSelect }) => {
  if (businesses.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="bg-slate-50/80 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-5 ring-8 ring-slate-50/50 shadow-sm">
          <AlertCircle className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No businesses found</h3>
        <p className="text-slate-500 max-w-md mx-auto font-medium">Try adjusting your search terms or location to find more local businesses.</p>
      </div>
    );
  }

  // Sort: Businesses without websites first, then by rating
  const sortedBusinesses = [...businesses].sort((a, b) => {
    const aHasSite = !!a.websiteUri;
    const bHasSite = !!b.websiteUri;
    if (aHasSite !== bHasSite) return aHasSite ? 1 : -1;
    return b.rating - a.rating;
  });

  const handleDownloadCSV = () => {
    const headers = ['Name', 'Type', 'Rating', 'Reviews', 'Website', 'Phone', 'Email', 'Address', 'Summary'];
    const csvContent = [
      headers.join(','),
      ...sortedBusinesses.map(b => {
        const row = [
          `"${(b.name || '').replace(/"/g, '""')}"`,
          `"${(b.type || '').replace(/"/g, '""')}"`,
          b.rating || '',
          b.reviewCount || '',
          `"${(b.websiteUri || '').replace(/"/g, '""')}"`,
          `"${(b.phone || '').replace(/"/g, '""')}"`,
          `"${(b.email || '').replace(/"/g, '""')}"`,
          `"${(b.address || '').replace(/"/g, '""')}"`,
          `"${(b.summary || '').replace(/"/g, '""')}"`
        ];
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'scan_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Scan Results</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            <Download size={16} />
            Export CSV
          </button>
          <span className="bg-white/80 backdrop-blur-md text-indigo-700 text-sm font-bold px-4 py-1.5 rounded-full border border-indigo-100/50 shadow-sm">
            {businesses.length} Found
          </span>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedBusinesses.map((business, index) => {
          const hasWebsite = !!business.websiteUri && business.websiteUri !== '';
          const isHighPotential = !hasWebsite && business.rating > 4.0 && business.reviewCount > 10;

          return (
            <div 
              key={index} 
              className={`relative rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-all duration-300 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 cursor-pointer group flex flex-col justify-between backdrop-blur-xl
                ${isHighPotential ? 'border-emerald-100/60 hover:border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white/90' : 'border-white/60 hover:border-indigo-100 bg-white/90'}
              `}
              onClick={() => onSelect(business)}
            >
              {isHighPotential && (
                <div className="absolute -top-3.5 left-6 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                   <CheckCircle2 size={14} /> High Potential
                </div>
              )}

              <div className={isHighPotential ? 'mt-2' : ''}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                    {business.name}
                  </h3>
                </div>
                
                <p className="text-sm font-medium text-slate-500 mb-4">{business.type}</p>
                
                <div className="flex items-center space-x-2 mb-5">
                  <div className="flex items-center bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-100/50 shadow-sm">
                    <Star className="h-4 w-4 text-amber-500 fill-current mr-1" />
                    <span className="font-bold text-amber-700 text-sm">{business.rating}</span>
                  </div>
                  <span className="text-slate-400 text-sm font-medium">({business.reviewCount} reviews)</span>
                </div>

                <div className="text-sm text-slate-600 mb-6 line-clamp-2 min-h-[40px] leading-relaxed">
                  {business.summary || "No summary available."}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100/60">
                 <div className={`flex items-center space-x-2 text-sm mb-2 font-medium ${hasWebsite ? 'text-emerald-600' : 'text-rose-500'}`}>
                  <Globe className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">
                    {hasWebsite ? business.websiteUri : 'No Website Detected'}
                  </span>
                </div>
                
                {business.phone && (
                  <div className="flex items-center space-x-2 text-sm mb-2 font-medium text-slate-600">
                    <Phone className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">{business.phone}</span>
                  </div>
                )}
                
                {business.email && (
                  <div className="flex items-center space-x-2 text-sm mb-5 font-medium text-slate-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">{business.email}</span>
                  </div>
                )}
                
                {!business.email && <div className="mb-5"></div>}

                <button className="w-full py-3 px-4 bg-slate-900 group-hover:bg-indigo-600 text-white font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md group-hover:shadow-xl transform group-hover:-translate-y-0.5">
                  Generate Site <ArrowRight size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessList;
