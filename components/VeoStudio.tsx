import React, { useState } from 'react';
import { generateVeoVideo } from '../services/geminiService';
import { Video, Loader2, Play, Download, AlertCircle } from 'lucide-react';

interface VeoStudioProps {
  imageBase64?: string;
}

const VeoStudio: React.FC<VeoStudioProps> = ({ imageBase64 }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [prompt, setPrompt] = useState('Cinematic slow pan, highly detailed, 4k resolution, professional commercial.');

  const handleGenerate = async () => {
    if (!imageBase64) return;
    setIsGenerating(true);
    setVideoUrl(null);
    try {
      const url = await generateVeoVideo(prompt, imageBase64, aspectRatio);
      setVideoUrl(url);
    } catch (e) {
      console.error(e);
      alert("Video generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!imageBase64) {
    return (
        <div className="p-4 bg-slate-50/80 rounded-xl text-slate-500 text-sm text-center border border-dashed border-slate-300/60 shadow-sm">
            Generate a hero image first to create a video.
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Video size={14} /> Veo Video Studio
      </h4>
      
      <div className="space-y-3">
        <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Motion Prompt</label>
            <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-none h-16 bg-white/50 shadow-sm transition-all"
            />
        </div>

        <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Format</label>
            <div className="flex gap-2">
                <button 
                    onClick={() => setAspectRatio('16:9')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all shadow-sm ${aspectRatio === '16:9' ? 'bg-indigo-50/80 border-indigo-200/60 text-indigo-700' : 'bg-white/50 border-slate-200/60 text-slate-600 hover:bg-slate-50'}`}
                >
                    Landscape (16:9)
                </button>
                <button 
                    onClick={() => setAspectRatio('9:16')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all shadow-sm ${aspectRatio === '9:16' ? 'bg-indigo-50/80 border-indigo-200/60 text-indigo-700' : 'bg-white/50 border-slate-200/60 text-slate-600 hover:bg-slate-50'}`}
                >
                    Portrait (9:16)
                </button>
            </div>
        </div>

        <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 transform hover:-translate-y-0.5"
        >
            {isGenerating ? <Loader2 className="animate-spin h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
            {isGenerating ? 'Generating (~1 min)...' : 'Generate Video'}
        </button>

        {videoUrl && (
            <div className="mt-4 rounded-xl overflow-hidden border border-slate-200/60 bg-black shadow-sm">
                <video src={videoUrl} controls className="w-full h-auto aspect-video" autoPlay loop muted />
                <a 
                    href={videoUrl} 
                    download="veo-generated.mp4"
                    className="block w-full text-center bg-slate-100/80 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-700 border-t border-slate-200/60 transition-colors"
                >
                    Download MP4
                </a>
            </div>
        )}
      </div>
    </div>
  );
};

export default VeoStudio;
