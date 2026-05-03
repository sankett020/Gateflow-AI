import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Gate, CrowdLevel } from '../types';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { Camera, Send, CheckCircle2, ChevronRight, UserCircle, MessageSquare, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Report = () => {
  const { user, profile } = useAuth();
  const [gates, setGates] = useState<Gate[]>([]);
  const [selectedGate, setSelectedGate] = useState<string>('');
  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel>('Medium');
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200000) { // Limit to ~200KB for Firestore document safety
        alert("Image is too large. Please select a photo under 200KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fetchGates = async () => {
      try {
        const q = query(collection(db, 'gates'), orderBy('name', 'asc'));
        const snap = await getDocs(q);
        setGates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gate)));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'gates');
      }
    };
    fetchGates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGate) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Anonymous Fan',
        gateId: selectedGate,
        crowdLevel,
        comment,
        imageUrl,
        timestamp: new Date().toISOString(),
        votes: 0,
        voters: []
      });
      setSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reports');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto pt-20 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </motion.div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Report Submitted!</h2>
        <p className="text-gray-500 font-medium mb-8">Thank you for helping fellow fans. Your update is now live on the feed.</p>
        <button 
          onClick={() => setSubmitted(false)}
          className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-4 text-indigo-600 bg-indigo-50 px-4 py-1 rounded-full">
          <UserCircle className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Active Dispatch</span>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Gate Report</h2>
        <p className="text-slate-500 font-medium text-sm mt-1">Submit live observations to help optimize stadium flow</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Gate Selection */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-6 h-6 bg-slate-900 text-white flex items-center justify-center rounded-lg text-[10px]">01</div>
              Designated Sector
            </label>
            {selectedGate && (
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded animate-pulse">Targeted</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gates.map((gate) => (
              <button
                key={gate.id}
                type="button"
                onClick={() => setSelectedGate(gate.name)}
                className={cn(
                  "p-5 rounded-2xl border-2 font-black transition-all flex flex-col items-center gap-1.5 shadow-sm active:scale-95",
                  selectedGate === gate.name 
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
                    : "border-white bg-white hover:border-slate-200 text-slate-500"
                )}
              >
                <span className="text-xl">Gate {gate.name}</span>
                <span className={cn(
                  "text-[9px] uppercase tracking-tighter",
                  selectedGate === gate.name ? "text-white/70" : "text-slate-300"
                )}>{gate.crowdLevel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Crowd Level */}
        <div className="space-y-6">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3 px-1">
            <div className="w-6 h-6 bg-slate-900 text-white flex items-center justify-center rounded-lg text-[10px]">02</div>
            Density Assessment
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            {(['Low', 'Medium', 'High', 'Overcrowded'] as CrowdLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setCrowdLevel(level)}
                className={cn(
                  "p-4 rounded-xl font-black transition-all text-[11px] uppercase tracking-[0.1em] border",
                  crowdLevel === level 
                    ? "border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.02]" 
                    : "border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Comment & Photo */}
        <div className="space-y-6">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3 px-1">
            <div className="w-6 h-6 bg-slate-900 text-white flex items-center justify-center rounded-lg text-[10px]">03</div>
            Update Parameters
          </label>
          <div className="bg-white rounded-3xl border border-slate-100 p-6 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all shadow-sm">
            <textarea 
              placeholder="Provide a brief update (e.g. 'Security line moving, about 50 people ahead...')"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-sm min-h-[140px] resize-none font-semibold text-slate-700 placeholder:text-slate-300"
            />
            <div className="flex flex-col gap-6 mt-6 border-t border-slate-50 pt-6">
              {imageUrl && (
                <div className="relative w-full h-56 group overflow-hidden rounded-2xl border border-slate-100">
                  <img src={imageUrl} alt="Proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button 
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute top-4 right-4 bg-white/90 text-slate-900 p-2.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer group active:scale-95 shadow-sm border border-slate-100">
                  <Camera className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  {imageUrl ? "Replace Proof" : "Attach Photo Reference"}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </label>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest translate-y-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {comment.length} / 500
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            disabled={isSubmitting || !selectedGate}
            className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] overflow-hidden group relative shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
          >
            <span className="relative z-10 flex items-center justify-center gap-4">
              {isSubmitting ? "SYNCING TO HUB..." : "TRANSMIT DISPATCH"}
              {!isSubmitting && <Send className="w-5 h-5 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500" />}
            </span>
            <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>
          <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mt-6">
            Dispatch will be logged and verified by stadium sector sensors
          </p>
        </div>
      </form>
    </div>
  );
};

export default Report;
