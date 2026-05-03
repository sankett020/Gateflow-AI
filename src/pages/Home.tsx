import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Gate, CrowdLevel, UserReport } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Clock, ArrowRight, Zap, TrendingUp, 
  AlertTriangle, Search, X, MessageSquare, 
  Camera, BarChart3, ChevronRight 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TimeAgo = ({ date }: { date: string }) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const update = () => setTimeAgo(formatDistanceToNow(new Date(date), { addSuffix: true }));
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [date]);

  return <>{timeAgo}</>;
};

const CrowdLevelBadge = ({ level }: { level: CrowdLevel }) => {
  const styles = {
    Low: "bg-green-100 text-green-700",
    Medium: "bg-indigo-100 text-indigo-700",
    High: "bg-orange-100 text-orange-700",
    Overcrowded: "bg-red-100 text-red-700",
  };

  return (
    <span className={cn("px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-current opacity-80", styles[level])}>
      {level}
    </span>
  );
};

interface GateCardProps {
  gate: Gate;
  isBest?: boolean;
  onClick: () => void;
}

const GateCard: React.FC<GateCardProps> = ({ gate, isBest, onClick }) => {
  return (
    <motion.button
      layout
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className={cn(
        "group relative bg-white rounded-3xl p-7 border transition-all text-left w-full h-full flex flex-col",
        "hover:shadow-[0_20px_50px_rgba(99,102,241,0.12)] hover:border-indigo-200/50",
        isBest 
          ? "border-indigo-600/20 bg-indigo-50/10 shadow-[0_15px_30px_rgba(99,102,241,0.08)]" 
          : "border-slate-100 shadow-sm shadow-slate-200/50"
      )}
    >
      {isBest && (
        <div className="absolute -top-3 -right-3 bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-600/30 z-10 animate-bounce-subtle">
          <Zap className="w-5 h-5 fill-current" />
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6">
          <Clock className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <CrowdLevelBadge level={gate.crowdLevel} />
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Status: Operational</span>
        </div>
      </div>

      <div className="mt-8 flex-1">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full ring-4",
            gate.crowdLevel === 'Low' ? 'bg-green-500 ring-green-500/10' :
            gate.crowdLevel === 'Medium' ? 'bg-indigo-500 ring-indigo-500/10' :
            gate.crowdLevel === 'High' ? 'bg-orange-500 ring-orange-500/10' : 'bg-red-500 ring-red-500/10'
          )} />
          <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">Gate {gate.name}</h3>
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase mt-2 pl-5.5 flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          Updated <TimeAgo date={gate.lastUpdated} />
        </div>
      </div>

      <div className="mt-10 flex items-end justify-between border-t border-slate-50 pt-5">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Target Wait Time</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{gate.waitTime} <span className="text-sm font-bold text-slate-300 ml-1">MIN</span></p>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </motion.button>
  );
};

const GateDetailDrawer = ({ gate, onClose }: { gate: Gate, onClose: () => void }) => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    // Reports
    const qReports = query(
      collection(db, 'reports'), 
      where('gateId', '==', gate.id), 
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserReport)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reports');
    });

    // Announcements
    const qAnnouncements = query(
      collection(db, 'announcements'),
      orderBy('timestamp', 'desc'),
      limit(2)
    );
    const unsubAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'announcements');
    });

    return () => {
      unsubReports();
      unsubAnnouncements();
    };
  }, [gate.id]);

  // Generate mock history based on current waitTime for visual feedback
  const historyData = [
    { time: '1h ago', wait: Math.max(0, gate.waitTime - 10) },
    { time: '45m ago', wait: Math.max(0, gate.waitTime - 5) },
    { time: '30m ago', wait: gate.waitTime + 2 },
    { time: '15m ago', wait: Math.min(60, gate.waitTime + 8) },
    { time: 'Now', wait: gate.waitTime },
  ];

  return (
    <motion.div 
      initial={{ x: '100%', opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0.5 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
      className="fixed inset-y-0 right-0 w-full sm:w-[550px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.05)] z-[60] flex flex-col border-l border-slate-100 overflow-hidden"
    >
      {/* Header with Background Accent */}
      <div className="relative h-48 bg-slate-900 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        
        <div className="absolute inset-0 p-8 flex flex-col justify-end">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">Gate Hub {gate.name}</h2>
              <p className="text-[11px] text-indigo-400 font-black uppercase tracking-widest mt-1">Sector Analysis & Real-time Metrics</p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-12">
          {/* Main Info Blocks with Glassmorphism feel */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Live Efficiency</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{gate.waitTime}<span className="text-sm font-bold text-slate-300 ml-1">MIN</span></h3>
            </div>
            <div className={cn(
              "rounded-3xl p-6 border shadow-sm relative overflow-hidden group",
              gate.crowdLevel === 'Low' ? 'bg-green-50 border-green-100 text-green-700' :
              gate.crowdLevel === 'Medium' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
              gate.crowdLevel === 'High' ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-red-50 border-red-100 text-red-700'
            )}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Crowd Level</p>
              <h3 className="text-3xl font-black tracking-tighter uppercase">{gate.crowdLevel}</h3>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-8">
            <div className="text-center space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Security Speed</p>
              <p className="text-sm font-black text-slate-900">High</p>
            </div>
            <div className="text-center space-y-1 border-x border-slate-100">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Lanes</p>
              <p className="text-sm font-black text-slate-900">12 / 12</p>
            </div>
            <div className="text-center space-y-1">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Verified Refs</p>
              <p className="text-sm font-black text-slate-900">{reports.length}+</p>
            </div>
          </div>

          {/* Data Viz */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 shadow-sm">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Temporal Flow Data</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Last 60 Minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">AI Forecast</span>
              </div>
            </div>
            
            <div className="h-64 w-full bg-slate-50 rounded-[32px] p-6 border border-slate-100 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} 
                    dy={12} 
                  />
                  <YAxis hide domain={[0, 'dataMax + 10']} />
                  <Tooltip 
                    cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontSize: '11px', fontWeight: '800', background: '#0f172a', color: '#fff', padding: '12px' }}
                    itemStyle={{ color: '#818cf8', fontWeight: '900', textTransform: 'uppercase' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area type="monotone" dataKey="wait" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorWait)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Reports History */}
          <section className="space-y-8 pb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Verified Observations</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ground Truth Reports</p>
              </div>
            </div>

            <div className="space-y-10 relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-100" />
              
              {reports.length > 0 ? reports.map((report) => (
                <div key={report.id} className="relative z-10 pl-2">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 font-black text-sm shadow-sm shrink-0">
                      {report.userName?.[0] || 'U'}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight bg-slate-50 px-2 py-0.5 rounded-lg">{report.userName || 'Verified Fan'}</span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            <TimeAgo date={report.timestamp} />
                          </span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm",
                            report.crowdLevel === 'Low' ? 'bg-green-500 text-white' :
                            report.crowdLevel === 'Medium' ? 'bg-indigo-500 text-white' :
                            report.crowdLevel === 'High' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'
                          )}>{report.crowdLevel}</span>
                        </div>
                      </div>

                      {report.comment && (
                        <div className="relative group">
                           <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-3 h-3 border-l-2 border-b-2 border-slate-100 rotate-45 bg-white" />
                           <p className="text-[13px] text-slate-600 leading-relaxed font-semibold bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:border-indigo-100 transition-colors">
                            {report.comment}
                           </p>
                        </div>
                      )}

                      {report.imageUrl && (
                        <div className="rounded-3xl overflow-hidden border-4 border-white shadow-xl shadow-slate-900/5 group">
                          <img src={report.imageUrl} alt="Proof" className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-20 bg-slate-50/70 rounded-[40px] border-4 border-dashed border-white flex flex-col items-center justify-center text-slate-300 space-y-4">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-100 shadow-sm transform -rotate-6 transition-transform hover:rotate-0">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Awaiting Sensor Proof</p>
                    <p className="text-[9px] font-bold text-slate-400/60 uppercase mt-1">Be the first to report from this gate</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Dynamic Announcement Hub */}
      <div className="p-8 bg-slate-900 text-white mt-auto rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
        <div className="relative z-10 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-indigo-500/20 backdrop-blur-md flex items-center justify-center">
                 <Zap className="w-4 h-4 text-indigo-400 fill-current" />
               </div>
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 leading-none">Stadium Broadcast</h4>
                  <p className="text-[8px] text-indigo-400/50 uppercase font-black tracking-widest mt-1">Priority Alert Feed</p>
               </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 rounded-full ring-1 ring-white/10">
               <span className="w-1 h-1 rounded-full bg-indigo-400 animate-ping" />
               <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Live</span>
            </div>
          </div>
          
          <div className="space-y-4 pt-2">
            {announcements.length > 0 ? (
              <div className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
                 <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                   {announcements[0].title}
                 </h4>
                 <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                   {announcements[0].message}
                 </p>
              </div>
            ) : (
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 italic text-[11px] text-slate-400 font-medium text-center">
                System initializing priority broadcasts. Checking sector updates...
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<CrowdLevel | 'All'>('All');
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'gates'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gate)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'gates');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filteredGates = gates.filter(gate => {
    const matchesSearch = gate.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterLevel === 'All' || gate.crowdLevel === filterLevel;
    return matchesSearch && matchesFilter;
  });

  const recommendedGate = [...gates].sort((a, b) => {
    const weights: Record<CrowdLevel, number> = { Low: 0, Medium: 1, High: 2, Overcrowded: 3 };
    if (weights[a.crowdLevel] !== weights[b.crowdLevel]) {
      return weights[a.crowdLevel] - weights[b.crowdLevel];
    }
    return a.waitTime - b.waitTime;
  })[0];

  const selectedGate = gates.find(g => g.id === selectedGateId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 relative">
      {/* Detail View Container */}
      <AnimatePresence>
        {selectedGate && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGateId(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 cursor-pointer"
            />
            <GateDetailDrawer 
              gate={selectedGate} 
              onClose={() => setSelectedGateId(null)} 
            />
          </>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <section>
        {recommendedGate ? (
          <div className="bg-slate-900 rounded-[32px] overflow-hidden relative group">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2673&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
            
            <div className="relative z-10 p-8 md:p-14 lg:p-20 grid grid-cols-1 lg:grid-cols-2 lg:items-center gap-12">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/20 backdrop-blur-xl rounded-full border border-indigo-500/30">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Recommended Arrival Path</span>
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[0.9]">
                    Quick Access via <br />
                    <span className="text-indigo-400">{recommendedGate.name}</span>
                  </h1>
                  <p className="text-slate-400 text-sm md:text-base max-w-lg font-medium leading-relaxed">
                    Live sensor data analysis confirms {recommendedGate.name} currently provides the fastest entry experience for arriving fans.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setSelectedGateId(recommendedGate.id)}
                    className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-3 shadow-xl shadow-indigo-500/10"
                  >
                    View Hub Details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 flex flex-col justify-between h-48 ring-1 ring-white/10">
                  <Clock className="w-8 h-8 text-indigo-400" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Hub Wait</p>
                    <p className="text-4xl font-black text-white tracking-tighter">{recommendedGate.waitTime} <span className="text-lg opacity-40">MIN</span></p>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 flex flex-col justify-between h-48 ring-1 ring-white/10">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Flow</p>
                    <p className="text-4xl font-black text-white tracking-tighter uppercase">{recommendedGate.crowdLevel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-100 rounded-3xl p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-xl font-black text-orange-900 uppercase">Sensors Offline</h3>
            <p className="text-orange-700/60 font-medium mt-2">Checking connectivity with stadium hub...</p>
          </div>
        )}
      </section>

      {/* Search and Filters */}
      <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input 
            type="text"
            placeholder="Search specific gate sensors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {(['All', 'Low', 'Medium', 'High', 'Overcrowded'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                filterLevel === level 
                  ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200" 
                  : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </section>

      {/* Grid Display */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Active Gate Terminal</h2>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Nodes: {filteredGates.length} / {gates.length} active
              </p>
              <div className="h-1 w-1 rounded-full bg-slate-300" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Region: Las Vegas, Stadium Area
              </p>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
             <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
            </div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Sync Active</span>
          </div>
        </div>

        {filteredGates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredGates.map((gate) => (
              <GateCard 
                key={gate.id} 
                gate={gate} 
                isBest={gate.id === recommendedGate?.id}
                onClick={() => setSelectedGateId(gate.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50/50 rounded-[32px] py-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-center px-4">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Access Node Not Found</h3>
            <p className="text-xs text-slate-400 font-medium mt-2 max-w-sm">No gate sensors match your current security clearance or search criteria.</p>
            <button 
              onClick={() => { setSearchQuery(''); setFilterLevel('All'); }}
              className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/10"
            >
              Reset Terminal
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
