import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Mic, X, Send, Volume2, StopCircle, Zap, Loader2 } from 'lucide-react';
import { generateChatResponse, generateFastResponse, generateSpeech, connectToLiveApi } from '../services/geminiService';
import { WebsiteContent } from '../types';

interface AiAssistantProps {
  content: WebsiteContent;
}

// Helper to convert raw PCM 16-bit data to AudioBuffer
function pcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number = 1,
): AudioBuffer {
  // Check if data length is even (16-bit)
  if (data.length % 2 !== 0) {
    console.warn("PCM data length is odd, dropping last byte");
    data = data.subarray(0, data.length - 1);
  }

  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.length / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: `Hi! Welcome to ${content.businessName}. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFastMode, setIsFastMode] = useState(false); // Toggle for "Fast Response"
  
  // Audio / Voice State
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const liveSessionRef = useRef<any | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const contextText = `Business: ${content.businessName}. Type: ${content.businessName}. Address: ${content.contactInfo.address}. Phone: ${content.contactInfo.phone}. Services: ${content.services.map(s => s.title).join(', ')}.`;

  // --- Chat Logic ---
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      let responseText = "";
      if (isFastMode) {
        // Use Gemini 2.5 Flash Lite
        responseText = await generateFastResponse(userMsg, contextText);
      } else {
        // Use Gemini 3 Pro
        responseText = await generateChatResponse(messages, userMsg, contextText);
      }
      setMessages(prev => [...prev, { role: 'model', text: responseText || "I didn't catch that." }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  // --- TTS Logic ---
  const handlePlayIntro = async () => {
    if (isPlayingTTS) return;
    setIsPlayingTTS(true);
    try {
      const text = `Welcome to ${content.businessName}. ${content.tagline}. ${content.heroHeadline}.`;
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
         playAudioChunk(base64Audio);
      }
    } catch (e) {
      console.error(e);
      setIsPlayingTTS(false);
    }
  };

  // --- Audio Helper ---
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const playAudioChunk = async (base64String: string) => {
    const ctx = initAudioContext();
    try {
      const binaryString = atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Use custom PCM decoder instead of native decodeAudioData which expects headers
      const audioBuffer = pcmToAudioBuffer(bytes, ctx, 24000);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      const currentTime = ctx.currentTime;
      // Ensure we schedule after the current time, and after the last scheduled chunk
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;
      
      source.onended = () => {
         if (ctx.currentTime >= nextStartTimeRef.current) {
             setIsPlayingTTS(false);
         }
      };
    } catch (e) {
      console.error("Audio playback error", e);
      setIsPlayingTTS(false);
    }
  };

  // --- Live API Logic ---
  const startLiveSession = async () => {
    setIsLiveActive(true);
    setMode('voice');
    const ctx = initAudioContext();
    // Reset start time to current time to avoid large delays if resuming
    nextStartTimeRef.current = ctx.currentTime;

    try {
      // Input Stream (Mic)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      // Connect Session
      const sessionPromise = connectToLiveApi(contextText, {
        onAudioData: (base64) => {
           playAudioChunk(base64);
        },
        onClose: () => {
           console.log("Live session closed");
           setIsLiveActive(false);
        }
      });

      liveSessionRef.current = await sessionPromise;

      // Stream Mic Data
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to PCM 16-bit
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = inputData[i] * 0x7FFF;
        }
        
        // Base64 Encode
        let binary = '';
        const bytes = new Uint8Array(pcmData.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        // Send
        if (liveSessionRef.current) {
          liveSessionRef.current.sendRealtimeInput({
             media: { mimeType: 'audio/pcm;rate=16000', data: base64 }
          });
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

    } catch (e) {
      console.error("Live API Error:", e);
      setIsLiveActive(false);
      alert("Microphone access required for Voice Mode.");
    }
  };

  const stopLiveSession = () => {
    if (liveSessionRef.current) {
      // There isn't a strict 'close' on the session object in the helper wrapper usually, 
      // but in a real implementation we would tear down the socket.
      // For this demo, we just reset state and stop processing.
      liveSessionRef.current = null;
    }
    setIsLiveActive(false);
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
  };

  return (
    <>
      {/* Floating Trigger */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end">
        {/* TTS Trigger */}
        {!isOpen && (
            <button 
                onClick={handlePlayIntro}
                className="bg-white text-slate-800 p-3 rounded-full shadow-lg border border-slate-200 hover:scale-110 transition-transform group relative"
                title="Listen to page"
            >
                {isPlayingTTS ? <Loader2 className="animate-spin text-indigo-600" /> : <Volume2 className="text-slate-600 group-hover:text-indigo-600" />}
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                    Listen to Page
                </span>
            </button>
        )}

        {/* Chat Trigger */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-all flex items-center justify-center w-14 h-14"
        >
          {isOpen ? <X /> : <MessageCircle />}
        </button>
      </div>

      {/* Main Widget */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60 overflow-hidden animate-fadeIn flex flex-col max-h-[600px]">
          
          {/* Header */}
          <div className="bg-indigo-600/90 backdrop-blur-md p-4 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                {content.businessName} Assistant
                {isLiveActive && <span className="flex h-2 w-2 rounded-full bg-red-400 animate-pulse"></span>}
              </h3>
              <p className="text-xs text-indigo-100 opacity-80">Powered by Gemini 3 Pro</p>
            </div>
            <div className="flex gap-2">
                 <button 
                    onClick={() => {
                        if(isLiveActive) stopLiveSession();
                        setMode(mode === 'chat' ? 'voice' : 'chat')
                    }}
                    className={`p-2 rounded-lg transition-colors ${mode === 'voice' ? 'bg-white text-indigo-600' : 'bg-indigo-500 hover:bg-indigo-400'}`}
                    title="Switch Mode"
                 >
                    {mode === 'chat' ? <Mic size={18} /> : <MessageCircle size={18} />}
                 </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 bg-slate-50/50 overflow-y-auto p-4 h-96">
            {mode === 'chat' ? (
                <div className="space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isLiveActive ? 'bg-indigo-100 ring-4 ring-indigo-50' : 'bg-slate-100'}`}>
                        <Mic className={`h-10 w-10 ${isLiveActive ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">{isLiveActive ? "Listening..." : "Voice Mode"}</h4>
                        <p className="text-sm text-slate-500 max-w-[200px] mx-auto">
                            {isLiveActive ? "Speak naturally to the assistant." : "Tap below to start a real-time conversation."}
                        </p>
                    </div>
                    {!isLiveActive ? (
                        <button onClick={startLiveSession} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-colors">
                            Start Call
                        </button>
                    ) : (
                        <button onClick={stopLiveSession} className="bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-red-600 transition-colors flex items-center gap-2">
                            <StopCircle size={18} /> End Call
                        </button>
                    )}
                </div>
            )}
          </div>

          {/* Footer (Input) */}
          {mode === 'chat' && (
            <div className="p-3 bg-white/80 backdrop-blur-md border-t border-slate-200/60">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mode:</span>
                    <button 
                        onClick={() => setIsFastMode(!isFastMode)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 transition-all ${isFastMode ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                    >
                        <Zap size={10} className={isFastMode ? 'fill-current' : ''} />
                        {isFastMode ? 'FAST (Flash Lite)' : 'SMART (Pro)'}
                    </button>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isFastMode ? "Ask a quick question..." : "Ask detailed questions..."}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button onClick={handleSend} disabled={!input.trim() || isTyping} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        <Send size={18} />
                    </button>
                </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AiAssistant;