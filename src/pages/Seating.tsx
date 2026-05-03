import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Ticket, MapPin, Search, ChevronRight, Upload, Sparkles, X, Info } from 'lucide-react';
import { parseTicketImage } from '../services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SeatInfo {
  section: string;
  row: string;
  seat: string;
  level: string;
}

const StadiumMap: React.FC<{ section: string }> = ({ section }) => {
  // Simple heuristic to map section to SVG coordinates
  // Assume sections 100-140 are lower bowl, 200-240 upper, etc.
  const getCoords = (sec: string) => {
    const num = parseInt(sec.replace(/\D/g, '')) || 0;
    const angle = (num % 100) * (Math.PI * 2 / 40); // 40 sections per ring
    const radius = num < 200 ? 60 : 100;
    
    return {
      x: 150 + Math.cos(angle) * radius,
      y: 150 + Math.sin(angle) * radius
    };
  };

  const pos = getCoords(section);

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-slate-100 rounded-[40px] border-8 border-white shadow-2xl overflow-hidden p-8 shadow-indigo-500/5">
      <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-sm">
        {/* Pitch */}
        <rect x="100" y="70" width="100" height="160" rx="4" fill="#22c55e" opacity="0.4" />
        <rect x="100" y="70" width="100" height="160" rx="4" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 4" />
        
        {/* Field Markings */}
        <circle cx="150" cy="150" r="20" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.3" />
        <line x1="100" y1="150" x2="200" y2="150" stroke="#22c55e" strokeWidth="1" opacity="0.3" />

        {/* Lower Bowl */}
        <path d="M 50,150 A 100,100 0 1,1 250,150 A 100,100 0 1,1 50,150" fill="none" stroke="#e2e8f0" strokeWidth="30" strokeLinecap="round" />
        
        {/* Upper Bowl */}
        <path d="M 20,150 A 130,130 0 1,1 280,150 A 130,130 0 1,1 20,150" fill="none" stroke="#f1f5f9" strokeWidth="20" strokeLinecap="round" />

        {/* Section Markers */}
        {[...Array(20)].map((_, i) => (
          <circle 
            key={i} 
            cx={150 + Math.cos(i * Math.PI * 2 / 20) * 85} 
            cy={150 + Math.sin(i * Math.PI * 2 / 20) * 85} 
            r="1" 
            fill="#cbd5e1" 
          />
        ))}

        {/* The Target Seat */}
        <AnimatePresence>
          {section !== "N/A" && (
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
            >
              <circle cx={pos.x} cy={pos.y} r="8" fill="#ef4444" className="animate-ping opacity-30" />
              <circle cx={pos.x} cy={pos.y} r="4" fill="#ef4444" />
              <path 
                d={`M ${pos.x},${pos.y} L ${pos.x},${pos.y - 12}`} 
                stroke="#ef4444" 
                strokeWidth="2" 
                strokeLinecap="round" 
              />
              <circle cx={pos.x} cy={pos.y - 15} r="3" fill="#ef4444" />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* Floating Info */}
      {section !== "N/A" && (
        <div className="absolute top-6 left-6 right-6 flex justify-center">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl border border-white/10">
            Sector {section} Located
          </div>
        </div>
      )}
    </div>
  );
};

const SeatPage: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [seatInfo, setSeatInfo] = useState<SeatInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSeatInfo(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const result = await parseTicketImage(base64);
        setSeatInfo(result);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("We encountered a technical foul while scanning your ticket. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="space-y-2">
        <div className="flex items-center gap-3 text-indigo-600 mb-2">
          <div className="p-2.5 bg-indigo-50 rounded-xl">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Smart Seat Locator</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tightest uppercase">Find Your Throne</h1>
        <p className="text-slate-500 font-medium text-sm">Upload your ticket photo and we'll guide you straight to your coordinates.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Col: Upload & Results */}
        <div className="space-y-8">
          {!seatInfo && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] border-4 border-dashed border-slate-100 p-12 text-center flex flex-col items-center gap-6 group hover:border-indigo-200 transition-all cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6 transition-all shadow-sm">
                <Camera className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Snap Your Ticket</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Mobile-scan or select file</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
              <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl group-hover:scale-105 transition-all">
                Select Photo
              </button>
            </motion.div>
          )}

          {isProcessing && (
            <div className="bg-white rounded-[40px] border border-slate-100 p-20 text-center flex flex-col items-center gap-8 shadow-sm">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Analyzing Ticket Metadata</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 animate-bounce">Transmitting to AI Node...</p>
              </div>
            </div>
          )}

          {seatInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                
                <div className="relative z-10 space-y-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Confirmed Breakdown</p>
                      <h2 className="text-3xl font-black tracking-tighter mt-1">SEC {seatInfo.section}</h2>
                    </div>
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                      <Ticket className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Level</p>
                      <p className="text-xl font-black">{seatInfo.level}</p>
                    </div>
                    <div className="space-y-1 px-6 border-x border-white/10">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Row</p>
                      <p className="text-xl font-black">{seatInfo.row}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Seat</p>
                      <p className="text-xl font-black">{seatInfo.seat}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setSeatInfo(null)}
                  className="py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Reset Data
                </button>
                <button className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" /> Navigation
                </button>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-600">
               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-red-100 shrink-0 shadow-sm shadow-red-100">
                 <X className="w-5 h-5" />
               </div>
               <p className="text-xs font-black uppercase tracking-tight">{error}</p>
            </div>
          )}
        </div>

        {/* Right Col: Map visualization */}
        <div className="sticky top-8">
           <div className="space-y-6">
             <div className="flex items-center justify-between px-2">
               <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Spatial Context</h4>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-2 py-1 rounded">2D Terminal Map</span>
             </div>
             
             <StadiumMap section={seatInfo?.section || "N/A"} />

             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Orientation Note</h5>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                      Map is oriented North. Your seat is highlighted in red. Please use designated stairwells for Sectors 100-200.
                    </p>
                  </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SeatPage;
