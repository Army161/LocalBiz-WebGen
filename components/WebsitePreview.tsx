import React, { useState } from 'react';
import { WebsiteContent } from '../types';
import { editBusinessImage } from '../services/geminiService';
import { Wrench, Star, Coffee, Scissors, Home, Car, Users, Zap, Menu, X, Phone, Mail, MapPin, Facebook, Instagram, Twitter, ImagePlus, Loader2, Sparkles, RefreshCw, Edit3, Settings, Palette, Type, Layout, Github, Code2, Copy, ExternalLink, CheckCircle2, Terminal } from 'lucide-react';
import AiAssistant from './AiAssistant';
import VeoStudio from './VeoStudio';

interface WebsitePreviewProps {
  content: WebsiteContent;
  onReset: () => void;
  onUpdate: (content: WebsiteContent) => void;
  initialShowEditor?: boolean;
}

const IconMap = {
  wrench: Wrench,
  star: Star,
  coffee: Coffee,
  scissors: Scissors,
  home: Home,
  car: Car,
  users: Users,
  zap: Zap
};

const WebsitePreview: React.FC<WebsitePreviewProps> = ({ content, onReset, onUpdate, initialShowEditor = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');
  const [showImageEdit, setShowImageEdit] = useState(false);
  const [showEditor, setShowEditor] = useState(initialShowEditor);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [repoName, setRepoName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessUrl, setExportSuccessUrl] = useState('');
  const [exportError, setExportError] = useState('');

  const {
    colorPalette,
    fontStyle,
    businessName,
    tagline,
    heroHeadline,
    heroSubheadline,
    aboutText,
    services,
    testimonials,
    contactInfo,
    heroImageBase64
  } = content;

  // --- Image Editor Handler ---
  const handleImageEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroImageBase64 || !editPrompt) return;
    
    setIsEditingImage(true);
    try {
      const newImage = await editBusinessImage(heroImageBase64, editPrompt);
      if (newImage) {
        onUpdate({ ...content, heroImageBase64: newImage });
        setShowImageEdit(false);
        setEditPrompt('');
      }
    } catch (error) {
      alert("Failed to edit image. Please try again.");
    } finally {
      setIsEditingImage(false);
    }
  };

  // --- Content Editor Handlers ---
  const updateField = (section: keyof WebsiteContent, value: any) => {
    onUpdate({ ...content, [section]: value });
  };

  const updateNestedField = (section: keyof WebsiteContent, key: string, value: string) => {
    const sectionData = content[section] as any;
    onUpdate({
      ...content,
      [section]: { ...sectionData, [key]: value }
    });
  };

  // --- Style Utilities ---
  const fontClass = 
    fontStyle === 'modern' ? 'font-sans' :
    fontStyle === 'classic' ? 'font-serif' :
    'font-mono';

  const primaryStyle = { backgroundColor: colorPalette.primary, color: '#ffffff' };
  
  // --- Export Utilities ---
  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateHTML());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGithubExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken || !repoName) return;
    
    setIsExporting(true);
    setExportError('');
    setExportSuccessUrl('');
    
    try {
      // 1. Create repo
      const repoRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({ name: repoName, auto_init: true })
      });
      
      if (!repoRes.ok) {
        const errorData = await repoRes.json();
        throw new Error(errorData.message || 'Failed to create repository');
      }
      
      const repoData = await repoRes.json();
      
      // 2. Create index.html
      const htmlContent = generateHTML();
      const fileRes = await fetch(`https://api.github.com/repos/${repoData.owner.login}/${repoName}/contents/index.html`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: 'Initial commit from LocalBiz WebGen',
          content: btoa(unescape(encodeURIComponent(htmlContent)))
        })
      });

      if (!fileRes.ok) {
        const errorData = await fileRes.json();
        throw new Error(errorData.message || 'Failed to create index.html');
      }

      setExportSuccessUrl(repoData.html_url);
    } catch (error: any) {
      setExportError(error.message || 'An error occurred during export');
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    {
      name: 'GitHub',
      icon: <Github className="w-6 h-6" />,
      description: 'Create a new repository',
      url: 'https://github.com/new',
      color: 'bg-slate-900 hover:bg-slate-800 text-white'
    },
    {
      name: 'Lovable.dev',
      icon: <Code2 className="w-6 h-6" />,
      description: 'Import to Lovable AI',
      url: 'https://lovable.dev/projects/new',
      color: 'bg-amber-500 hover:bg-amber-600 text-white'
    },
    {
      name: 'Emergent.sh',
      icon: <Terminal className="w-6 h-6" />,
      description: 'Deploy via Emergent',
      url: 'https://emergent.sh/new',
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    {
      name: 'Google AI Studio',
      icon: <Sparkles className="w-6 h-6" />,
      description: 'Open in AI Studio',
      url: 'https://aistudio.google.com/app/prompts/new_chat',
      color: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  ];

  const generateHTML = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.businessName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { 
            font-family: 'Inter', sans-serif; 
            background-color: ${content.colorPalette.background}; 
            color: ${content.colorPalette.text}; 
        }
        .text-primary { color: ${content.colorPalette.primary}; }
        .bg-primary { background-color: ${content.colorPalette.primary}; }
    </style>
</head>
<body class="antialiased">
    <!-- Navigation -->
    <nav class="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="font-extrabold text-2xl tracking-tight text-primary">${content.businessName}</div>
                <div class="hidden md:flex items-center space-x-8">
                    <a href="#home" class="text-slate-600 hover:text-slate-900 font-semibold">Home</a>
                    <a href="#about" class="text-slate-600 hover:text-slate-900 font-semibold">About</a>
                    <a href="#services" class="text-slate-600 hover:text-slate-900 font-semibold">Services</a>
                    <a href="#contact" class="px-6 py-2.5 rounded-xl font-bold text-white bg-primary shadow-sm hover:shadow-md transition-all">Get Quote</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section id="home" class="relative py-32 lg:py-48 px-4 flex items-center justify-center bg-slate-900 overflow-hidden">
        ${content.heroImageBase64 ? `<div class="absolute inset-0 bg-cover bg-center opacity-40" style="background-image: url('data:image/png;base64,${content.heroImageBase64}')"></div>` : ''}
        <div class="relative z-10 max-w-5xl mx-auto text-center text-white px-4">
            <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight drop-shadow-2xl">${content.heroHeadline}</h1>
            <p class="text-xl md:text-2xl mb-10 text-slate-200 max-w-3xl mx-auto leading-relaxed drop-shadow-lg font-medium">${content.heroSubheadline}</p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button class="px-8 py-4 rounded-xl text-lg font-bold shadow-xl bg-white text-slate-900 hover:bg-slate-50 transition-all">Our Services</button>
                <button class="px-8 py-4 rounded-xl text-lg font-bold border border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white transition-all">Contact Us</button>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section id="about" class="py-24 px-4">
        <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
                <div class="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs mb-6 tracking-widest uppercase border border-indigo-100">About Us</div>
                <h2 class="text-4xl md:text-5xl font-extrabold mb-6 text-slate-900 tracking-tight">Excellence in every detail.</h2>
                <p class="text-lg text-slate-600 leading-relaxed whitespace-pre-line">${content.aboutText}</p>
            </div>
            <div class="relative">
                <div class="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-[3rem] transform rotate-3 blur-2xl"></div>
                <div class="relative bg-slate-50 rounded-[3rem] aspect-square flex items-center justify-center p-8 border border-slate-200/60 shadow-xl">
                    <div class="text-center">
                        <div class="text-7xl font-extrabold text-slate-900 mb-2 tracking-tighter">25+</div>
                        <div class="text-slate-500 font-bold uppercase tracking-widest text-sm">Years of Experience</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section id="services" class="py-24 px-4 bg-slate-50">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-20">
                <h2 class="text-4xl md:text-5xl font-extrabold mb-6 text-slate-900 tracking-tight">Our Expertise</h2>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
                ${content.services.map(s => `
                <div class="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200/60 relative overflow-hidden">
                    ${s.callout ? `<div class="absolute top-6 right-6 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">${s.callout}</div>` : ''}
                    <h3 class="text-2xl font-bold mb-4 text-slate-900">${s.title}</h3>
                    <p class="text-slate-600 leading-relaxed">${s.description}</p>
                </div>`).join('')}
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer id="contact" class="bg-slate-950 text-white py-24 px-4 border-t border-slate-900">
        <div class="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
                <h3 class="text-3xl font-extrabold tracking-tight mb-4">${content.businessName}</h3>
                <p class="text-slate-400 leading-relaxed font-medium">${content.tagline}</p>
            </div>
            <div>
                <h4 class="font-bold text-lg mb-6 text-slate-100">Contact</h4>
                <div class="space-y-4 text-slate-400 font-medium">
                    <p>${content.contactInfo.address}</p>
                    <p>${content.contactInfo.phone}</p>
                    <p>${content.contactInfo.email}</p>
                </div>
            </div>
            <div>
                <h4 class="font-bold text-lg mb-6 text-slate-100">Hours</h4>
                <p class="text-slate-400 font-medium leading-relaxed">${content.contactInfo.hours}</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
  };

  // --- Editor Sidebar Component ---
  const EditorSidebar = () => (
    <div className={`fixed inset-y-0 right-0 w-80 bg-white/95 backdrop-blur-xl shadow-2xl z-[60] transform transition-transform duration-300 overflow-y-auto border-l border-slate-200/60 ${showEditor ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-5 border-b border-slate-200/60 flex justify-between items-center bg-white/50 sticky top-0 backdrop-blur-md z-10">
        <h3 className="font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
          <Settings size={18} className="text-indigo-600" /> Site Editor
        </h3>
        <button onClick={() => setShowEditor(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full">
          <X size={18} />
        </button>
      </div>

      <div className="p-5 space-y-8">
        
        {/* Veo Studio Integration */}
        <div className="pb-6 border-b border-slate-100">
           <VeoStudio imageBase64={heroImageBase64} />
        </div>

        {/* Identity Section */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Layout size={14} /> Identity
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Business Name</label>
              <input 
                type="text" 
                value={businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tagline</label>
              <input 
                type="text" 
                value={tagline}
                onChange={(e) => updateField('tagline', e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
           <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Type size={14} /> Hero Text
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Headline</label>
              <textarea 
                rows={2}
                value={heroHeadline}
                onChange={(e) => updateField('heroHeadline', e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subheadline</label>
              <textarea 
                rows={3}
                value={heroSubheadline}
                onChange={(e) => updateField('heroSubheadline', e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Styling Section */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
           <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Palette size={14} /> Colors & Fonts
          </h4>
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="block text-xs font-semibold text-slate-500 mb-2">Primary</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={colorPalette.primary}
                    onChange={(e) => updateNestedField('colorPalette', 'primary', e.target.value)}
                    className="h-8 w-8 rounded-lg cursor-pointer border-0 p-0 shadow-sm"
                  />
                  <span className="text-xs text-slate-600 font-mono uppercase">{colorPalette.primary}</span>
                </div>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="block text-xs font-semibold text-slate-500 mb-2">Background</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={colorPalette.background}
                    onChange={(e) => updateNestedField('colorPalette', 'background', e.target.value)}
                    className="h-8 w-8 rounded-lg cursor-pointer border-0 p-0 shadow-sm"
                  />
                  <span className="text-xs text-slate-600 font-mono uppercase">{colorPalette.background}</span>
                </div>
             </div>
          </div>
          <div>
             <label className="block text-xs font-semibold text-slate-600 mb-1.5">Font Style</label>
             <select 
               value={fontStyle}
               onChange={(e) => updateField('fontStyle', e.target.value)}
               className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
             >
               <option value="modern">Modern (Sans)</option>
               <option value="classic">Classic (Serif)</option>
               <option value="playful">Playful (Mono)</option>
             </select>
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Phone size={14} /> Contact
          </h4>
          <div className="space-y-3">
            <input 
               type="text"
               value={contactInfo.address}
               onChange={(e) => updateNestedField('contactInfo', 'address', e.target.value)}
               className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
               placeholder="Address"
            />
            <input 
               type="text"
               value={contactInfo.phone}
               onChange={(e) => updateNestedField('contactInfo', 'phone', e.target.value)}
               className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
               placeholder="Phone"
            />
            <input 
               type="text"
               value={contactInfo.email}
               onChange={(e) => updateNestedField('contactInfo', 'email', e.target.value)}
               className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
               placeholder="Email"
            />
          </div>
        </div>
        
         {/* About Section */}
         <div className="space-y-4 pt-6 border-t border-slate-100">
           <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Type size={14} /> About Text
          </h4>
          <textarea 
              rows={6}
              value={aboutText}
              onChange={(e) => updateField('aboutText', e.target.value)}
              className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none transition-all"
            />
         </div>

         {/* Services Section */}
         <div className="space-y-4 pt-6 border-t border-slate-100">
           <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Wrench size={14} /> Services
          </h4>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Service {index + 1}</span>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Title</label>
                  <input 
                    type="text" 
                    value={service.title}
                    onChange={(e) => {
                      const newServices = [...services];
                      newServices[index].title = e.target.value;
                      updateField('services', newServices);
                    }}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Description</label>
                  <textarea 
                    rows={2}
                    value={service.description}
                    onChange={(e) => {
                      const newServices = [...services];
                      newServices[index].description = e.target.value;
                      updateField('services', newServices);
                    }}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Callout (Optional)</label>
                  <input 
                    type="text" 
                    value={service.callout || ''}
                    placeholder="e.g. Popular, Best Value"
                    onChange={(e) => {
                      const newServices = [...services];
                      newServices[index].callout = e.target.value;
                      updateField('services', newServices);
                    }}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
         </div>

      </div>
    </div>
  );
  
  // --- Rendered Site Component ---
  const RenderedSite = () => (
    <div className={`w-full h-full overflow-y-auto ${fontClass} scroll-smooth relative`} style={{ backgroundColor: colorPalette.background, color: colorPalette.text }}>
      
      {/* AI Assistant Widget (Included in every site) */}
      <AiAssistant content={content} />

      {/* Edit Image Modal */}
      {showImageEdit && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-md shadow-2xl transform scale-100 transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-slate-900 font-extrabold text-xl flex items-center gap-2">
                 <Sparkles className="w-6 h-6 text-indigo-500" /> AI Image Editor
               </h3>
               <button onClick={() => setShowImageEdit(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                 <X size={20}/>
               </button>
            </div>
            <form onSubmit={handleImageEdit}>
              <div className="mb-6">
                <label className="block text-slate-500 text-xs uppercase font-bold tracking-widest mb-3">Instructions</label>
                <textarea 
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g. Make it sunset, remove the cars, add a lens flare..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none h-32 text-sm transition-all"
                  autoFocus
                />
              </div>
              <button 
                type="submit"
                disabled={isEditingImage || !editPrompt}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"
              >
                {isEditingImage ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" /> Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" /> Update Image
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="font-extrabold text-2xl tracking-tight" style={{ color: colorPalette.primary }}>
              {businessName}
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              {['Home', 'About', 'Services'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-slate-600 hover:text-slate-900 font-semibold transition-colors">
                  {item}
                </a>
              ))}
              <a href="#contact" className="px-6 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5" style={primaryStyle}>
                Get Quote
              </a>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 px-4 py-4 space-y-2 shadow-xl absolute w-full">
            {['Home', 'About', 'Services', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="block text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50 font-semibold transition-colors">
                {item}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section 
        id="home" 
        className="relative py-32 lg:py-48 px-4 flex items-center justify-center bg-slate-900 overflow-hidden group"
      >
        {/* Background Image */}
        {heroImageBase64 && (
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] group-hover:scale-105"
            style={{ backgroundImage: `url(data:image/png;base64,${heroImageBase64})` }}
          />
        )}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center text-white px-4">
           <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight drop-shadow-2xl">
            {heroHeadline}
           </h1>
           <p className="text-xl md:text-2xl mb-10 text-slate-200 max-w-3xl mx-auto leading-relaxed drop-shadow-lg font-medium">
             {heroSubheadline}
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <button className="px-8 py-4 rounded-xl text-lg font-bold shadow-xl bg-white text-slate-900 hover:bg-slate-50 transition-all transform hover:-translate-y-1">
               Our Services
             </button>
             <button className="px-8 py-4 rounded-xl text-lg font-bold border border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white transition-all">
               Contact Us
             </button>
           </div>
        </div>

        {/* Edit Image Button (Visible on Hover/Focus) */}
        {heroImageBase64 && (
          <button 
            onClick={() => setShowImageEdit(true)}
            className="absolute bottom-8 right-8 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/30 text-white px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold shadow-2xl transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0"
          >
            <ImagePlus size={18} /> Edit With AI
          </button>
        )}
      </section>

      {/* Features / About */}
      <section id="about" className="py-24 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
             <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs mb-6 tracking-widest uppercase border border-indigo-100">About Us</div>
             <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-slate-900 tracking-tight">Excellence in every detail.</h2>
             <div className="prose prose-lg text-slate-600 leading-relaxed whitespace-pre-line">
               {aboutText}
             </div>
             <div className="mt-10 flex items-center gap-6">
               <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-400 shadow-sm">
                     <Users size={16} />
                   </div>
                 ))}
               </div>
               <div className="text-sm font-semibold text-slate-500 flex items-center">Trusted by 500+ locals</div>
             </div>
          </div>
          <div className="order-1 lg:order-2 relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-[3rem] transform rotate-3 blur-2xl"></div>
             <div className="relative bg-slate-50 rounded-[3rem] aspect-square flex items-center justify-center p-8 border border-slate-200/60 shadow-xl">
                <div className="text-center">
                   <div className="text-7xl font-extrabold text-slate-900 mb-2 tracking-tighter">{new Date().getFullYear() - 1999}+</div>
                   <div className="text-slate-500 font-bold uppercase tracking-widest text-sm">Years of Experience</div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-slate-900 tracking-tight">Our Expertise</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Tailored solutions designed to help your business thrive.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, idx) => {
              const Icon = IconMap[service.icon] || Star;
              return (
                <div key={idx} className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 group relative overflow-hidden">
                  {service.callout && (
                    <div 
                      className="absolute top-6 right-6 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm z-10"
                      style={{ backgroundColor: colorPalette.primary, color: '#ffffff' }}
                    >
                      {service.callout}
                    </div>
                  )}
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-300 shadow-sm" style={{ backgroundColor: `${colorPalette.primary}15` }}>
                    <Icon className="h-8 w-8" style={{ color: colorPalette.primary }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900">{service.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-8">{service.description}</p>
                  <a href="#" className="inline-flex items-center font-bold text-sm hover:underline" style={{ color: colorPalette.primary }}>
                    Learn more <span className="ml-1">→</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modern Testimonials */}
      <section className="py-24 px-4 overflow-hidden relative" style={{ backgroundColor: colorPalette.primary }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
             <h2 className="text-4xl md:text-5xl font-extrabold text-white max-w-lg tracking-tight leading-tight">Loved by the community, trusted by neighbors.</h2>
             <div className="flex gap-3">
                <button className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors backdrop-blur-sm">←</button>
                <button className="w-14 h-14 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-lg">→</button>
             </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 hover:bg-white/20 transition-colors">
                <div className="flex text-amber-400 mb-8 gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                </div>
                <p className="text-lg text-white/90 leading-relaxed mb-10 font-medium">"{t.text}"</p>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-white font-bold text-xl border border-white/20 shadow-inner">
                     {t.author.charAt(0)}
                   </div>
                   <div>
                      <div className="font-bold text-white text-lg">{t.author}</div>
                      <div className="text-white/60 text-sm font-medium">Verified Customer</div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer id="contact" className="bg-slate-950 text-white py-24 px-4 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-6">
            <h3 className="text-3xl font-extrabold tracking-tight">{businessName}</h3>
            <p className="text-slate-400 leading-relaxed max-w-xs font-medium">{content.tagline}</p>
            <div className="flex gap-4 pt-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center transition-transform hover:-translate-y-1 hover:bg-slate-800 border border-slate-800" style={{ color: colorPalette.accent }}>
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center transition-transform hover:-translate-y-1 hover:bg-slate-800 border border-slate-800" style={{ color: colorPalette.accent }}>
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center transition-transform hover:-translate-y-1 hover:bg-slate-800 border border-slate-800" style={{ color: colorPalette.accent }}>
                <Twitter size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-slate-100">Contact</h4>
            <div className="space-y-5 text-slate-400 font-medium">
               <div className="flex items-start gap-4 hover:text-white transition-colors cursor-pointer">
                 <MapPin className="w-5 h-5 mt-0.5 shrink-0" />
                 <span>{contactInfo.address}</span>
               </div>
               <div className="flex items-center gap-4 hover:text-white transition-colors cursor-pointer">
                 <Phone className="w-5 h-5 shrink-0" />
                 <span>{contactInfo.phone}</span>
               </div>
               <div className="flex items-center gap-4 hover:text-white transition-colors cursor-pointer">
                 <Mail className="w-5 h-5 shrink-0" />
                 <span>{contactInfo.email}</span>
               </div>
            </div>
          </div>

          <div>
             <h4 className="font-bold text-lg mb-6 text-slate-100">Hours</h4>
             <p className="text-slate-400 font-medium leading-relaxed">{contactInfo.hours}</p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-slate-100">Newsletter</h4>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter email address" 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder-slate-500"
              />
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-slate-900 text-center text-slate-500 text-sm font-medium">
          &copy; {new Date().getFullYear()} {businessName}. All rights reserved. | Generated by LocalBiz WebGen
        </div>
      </footer>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* App Toolbar */}
      <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 shadow-sm shrink-0 z-50">
        <div className="flex items-center gap-6">
          <button onClick={onReset} className="text-slate-500 hover:text-indigo-600 font-semibold flex items-center gap-2 transition-colors">
            ← Back
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <h1 className="font-extrabold text-slate-900 text-lg tracking-tight">{businessName}</h1>
        </div>
        
        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
          <button 
            onClick={() => setActiveTab('desktop')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'desktop' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Desktop
          </button>
          <button 
             onClick={() => setActiveTab('mobile')}
             className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'mobile' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Mobile
          </button>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setShowEditor(!showEditor)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${showEditor ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
          >
            <Edit3 size={16} /> Edit Content
          </button>
          <button 
            onClick={() => setShowExportModal(true)}
            className="bg-slate-900 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Export Code
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowExportModal(false)}>
          <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8 shrink-0">
               <div>
                 <h3 className="text-slate-900 font-extrabold text-3xl flex items-center gap-3 tracking-tight">
                   <Code2 className="w-8 h-8 text-indigo-600" /> Export & Deploy
                 </h3>
                 <p className="text-slate-500 font-medium mt-2 text-lg">Deploy your generated site to your favorite AI builder or repository.</p>
               </div>
               <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-3 rounded-full transition-colors">
                 <X size={24}/>
               </button>
            </div>
            
            <div className="grid lg:grid-cols-5 gap-8 overflow-hidden flex-1">
              {/* Left Column: Export Targets */}
              <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2 pb-4">
                <div>
                  <h4 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span> 
                    Direct GitHub Export
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    {exportSuccessUrl ? (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <h5 className="font-bold text-slate-900 mb-2">Export Successful!</h5>
                        <p className="text-sm text-slate-600 mb-4">Your repository has been created.</p>
                        <div className="space-y-3">
                          <a 
                            href={exportSuccessUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-sm transition-colors"
                          >
                            View on GitHub
                          </a>
                          <a 
                            href={`https://vercel.com/new/clone?repository-url=${exportSuccessUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-black hover:bg-zinc-900 text-white py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 1L24 22H0L12 1Z"/></svg>
                            Deploy to Vercel
                          </a>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleGithubExport} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">GitHub Token (repo scope)</label>
                          <input 
                            type="password"
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            placeholder="ghp_..."
                            className="w-full text-sm p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Repository Name</label>
                          <input 
                            type="text"
                            value={repoName}
                            onChange={(e) => setRepoName(e.target.value)}
                            placeholder="my-awesome-site"
                            className="w-full text-sm p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                            required
                          />
                        </div>
                        {exportError && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                            {exportError}
                          </div>
                        )}
                        <button 
                          type="submit"
                          disabled={isExporting || !githubToken || !repoName}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                          {isExporting ? 'Exporting...' : 'Create & Push to GitHub'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span> 
                    Other Destinations
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {exportOptions.map((opt) => (
                      <a 
                        key={opt.name}
                        href={opt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center p-4 rounded-2xl transition-all duration-300 group ${opt.color} shadow-sm hover:shadow-xl transform hover:-translate-y-1`}
                      >
                        <div className="bg-white/20 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                          {opt.icon}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-lg mb-0.5">{opt.name}</h5>
                          <p className="text-white/80 text-xs font-medium">{opt.description}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                      </a>
                    ))}
                    
                    <a 
                      href="https://vercel.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 rounded-2xl transition-all duration-300 group bg-black hover:bg-zinc-900 text-white shadow-sm hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <div className="bg-white/20 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 1L24 22H0L12 1Z"/></svg>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-lg mb-0.5">Vercel</h5>
                        <p className="text-white/80 text-xs font-medium">Deploy instantly to Vercel</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Code Preview & Copy */}
              <div className="lg:col-span-3 flex flex-col h-full overflow-hidden bg-slate-900 rounded-3xl border border-slate-800 shadow-inner">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
                  <h4 className="font-bold text-white text-lg flex items-center gap-2">
                    <span className="bg-indigo-500/20 text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                    Copy Source Code
                  </h4>
                  <button 
                    onClick={handleCopyCode}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 text-sm font-mono text-slate-300 whitespace-pre custom-scrollbar">
                  {generateHTML()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {/* Editor Sidebar */}
        <EditorSidebar />

        {/* Preview Container */}
        <div className={`flex-1 overflow-hidden flex items-center justify-center bg-slate-100/50 relative transition-all duration-300 ${showEditor ? 'mr-80' : ''}`}>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className={`transition-all duration-500 ease-in-out bg-white shadow-2xl overflow-hidden relative z-10
            ${activeTab === 'desktop' ? 'w-[96%] h-[92%] rounded-2xl border border-slate-200/60 ring-1 ring-black/5 shadow-slate-200/50' : 'w-[375px] h-[750px] rounded-[3rem] border-[12px] border-slate-900 shadow-2xl shadow-slate-300/50'}
          `}>
            {activeTab === 'mobile' && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50"></div>
            )}
            <RenderedSite />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsitePreview;