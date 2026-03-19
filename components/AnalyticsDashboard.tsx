import React, { useState, useEffect } from 'react';
import { WebsiteContent } from '../types';
import { X, TrendingUp, Users, Mail, MessageSquare, Eye, Activity, ArrowUpRight } from 'lucide-react';

interface Props {
  site: WebsiteContent;
  onClose: () => void;
}

export default function AnalyticsDashboard({ site, onClose }: Props) {
  // Simulate real-time updates for the dashboard
  const [stats, setStats] = useState(site.leadStats || {
    pageViews: Math.floor(Math.random() * 5000) + 500,
    leadsCaptured: Math.floor(Math.random() * 200) + 20,
    conversionRate: (Math.random() * 5 + 1).toFixed(1),
    outreachEmailsSent: Math.floor(Math.random() * 1000) + 100,
    activeConversations: Math.floor(Math.random() * 20) + 2,
  });

  useEffect(() => {
    // Simulate real-time incoming traffic and leads
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        pageViews: prev.pageViews + Math.floor(Math.random() * 3),
        leadsCaptured: prev.leadsCaptured + (Math.random() > 0.8 ? 1 : 0),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200/60" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
              <Activity className="text-indigo-600" /> Lead Generation & Outreach
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Real-time performance metrics for <span className="font-bold text-slate-700">{site.businessName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Stat Cards */}
            <StatCard icon={<Eye />} title="Total Page Views" value={stats.pageViews.toLocaleString()} trend="+12% this week" />
            <StatCard icon={<Users />} title="Leads Captured" value={stats.leadsCaptured.toLocaleString()} trend="+5% this week" />
            <StatCard icon={<TrendingUp />} title="Conversion Rate" value={`${stats.conversionRate}%`} trend="+0.4% this week" />
            <StatCard icon={<Mail />} title="Outreach Emails Sent" value={stats.outreachEmailsSent.toLocaleString()} trend="+22% this week" />
            <StatCard icon={<MessageSquare />} title="Active Conversations" value={stats.activeConversations.toString()} trend="Live" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><Users size={18} className="text-indigo-500"/> Recent Leads</h3>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors cursor-pointer group">
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">Potential Client {i}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">Requested quote for services via contact form</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100/50 px-2.5 py-1 rounded-full border border-indigo-100">
                      {i === 1 ? 'Just now' : `${i * 12} mins ago`}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100">
                View All Leads
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Mail size={18} className="text-indigo-500"/> Automated Outreach Activity</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.6)] ring-4 ring-emerald-50"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed"><span className="font-bold text-slate-900">Follow-up campaign</span> sent to 45 local prospects.</p>
                    <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-wider">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0 ring-4 ring-blue-50"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed"><span className="font-bold text-slate-900">Introductory email</span> opened by 12 recipients.</p>
                    <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-wider">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 shrink-0 ring-4 ring-indigo-50"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed"><span className="font-bold text-slate-900">New reply</span> received from outreach batch #4.</p>
                    <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-wider">3 hours ago</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-6 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100">
                Manage Campaigns
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, trend }: { icon: React.ReactNode, title: string, value: string, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center gap-3 text-slate-500 mb-4">
        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          {React.cloneElement(icon as React.ReactElement, { size: 20 })}
        </div>
        <span className="font-bold text-sm tracking-tight">{title}</span>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
          <ArrowUpRight size={14} /> {trend}
        </span>
      </div>
    </div>
  );
}
