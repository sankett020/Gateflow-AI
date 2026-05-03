import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, Sparkles, User, ChevronDown } from 'lucide-react';
import { getAIChatResponse } from '../services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hey Fan! I'm the Stadium AI. Need help finding the quickest way to your seat?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const history = messages.slice(-6); // Keep last 6 for context
    const aiResponse = await getAIChatResponse(userMsg, history);
    
    setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    setIsLoading(false);
  };

  return (
    <div className={cn(
      "fixed z-[100] flex flex-col items-center",
      "bottom-24 right-6 lg:bottom-32 lg:left-0 lg:right-auto lg:w-20"
    )}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "mb-4 w-[calc(100vw-32px)] sm:w-[400px] h-[min(500px,calc(100vh-160px))] bg-white rounded-[24px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden ring-1 ring-slate-900/5 transition-all",
              "fixed bottom-24 right-4 sm:right-6 lg:bottom-32 lg:left-24 lg:right-auto"
            )}
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Stadium Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Agent Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
            >
              {messages.map((msg, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-indigo-600 text-white rounded-br-none" 
                      : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center animate-bounce-subtle">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Assistant is thinking...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Ask about gates, maps, or wait times..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 transition-all border-transparent"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all relative overflow-hidden group",
          isOpen 
            ? "bg-slate-900 text-white shadow-slate-900/40" 
            : "bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-700 text-white shadow-indigo-600/40"
        )}
      >
        {/* Animated Glow Background */}
        {!isOpen && (
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-indigo-400/30 blur-xl pointer-events-none"
          />
        )}

        <AnimatePresence mode='wait'>
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <ChevronDown className="w-7 h-7" />
            </motion.div>
          ) : (
            <motion.div 
              key="open" 
              initial={{ rotate: -90, opacity: 0 }} 
              animate={{ rotate: 0, opacity: 1 }} 
              exit={{ rotate: 90, opacity: 0 }}
              className="relative"
            >
              <Sparkles className="w-7 h-7 fill-white/10 group-hover:scale-110 transition-transform" />
              <motion.div 
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full blur-[1px]"
              />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
           <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full translate-x-1/4 -translate-y-1/4 shadow-sm" />
        )}
      </motion.button>
    </div>
  );
};
