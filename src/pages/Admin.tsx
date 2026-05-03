import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, setDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Gate, Announcement, UserReport, CrowdLevel, Priority } from '../types';
import { INITIAL_GATES } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { ShieldCheck, RefreshCw, Send, Trash2, Megaphone, Plus, AlertTriangle, Briefcase } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Admin = () => {
  const { user } = useAuth();
  const [gates, setGates] = useState<Gate[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annPriority, setAnnPriority] = useState<Priority>('Normal');

  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const gatesSnap = await getDocs(query(collection(db, 'gates'), orderBy('name', 'asc')));
      const reportsSnap = await getDocs(query(collection(db, 'reports'), orderBy('timestamp', 'desc')));
      
      setGates(gatesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gate)));
      setReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserReport)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'admin-fetch');
    }
    setLoading(false);
  };

  const initData = async () => {
    setIsInitializing(true);
    try {
      for (const g of INITIAL_GATES) {
        // Sanitize name for ID (e.g., "North Gate" -> "north-gate")
        const id = g.name.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, 'gates', id), g);
      }
      await fetchData();
      alert('System Telemetry Deployed Successfully.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'gates');
    } finally {
      setIsInitializing(false);
    }
  };

  const updateGate = async (id: string, newLevel: CrowdLevel, newTime: number) => {
    try {
      await updateDoc(doc(db, 'gates', id), {
        crowdLevel: newLevel,
        waitTime: newTime,
        lastUpdated: new Date().toISOString()
      });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `gates/${id}`);
    }
  };

  const postAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        title: annTitle,
        message: annMessage,
        priority: annPriority,
        timestamp: new Date().toISOString(),
        authorId: user.uid
      });
      setAnnTitle('');
      setAnnMessage('');
      alert('Global announcement broadcasted.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'announcements');
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to purge this report from the feed?")) return;
    try {
      await deleteDoc(doc(db, 'reports', id));
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reports/${id}`);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-3 text-red-600 bg-red-50 w-fit px-3 py-1 rounded-full">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">Security Override</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Operations Console</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">High-level management of stadium intake systems</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center justify-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-700 shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <RefreshCw className={cn("w-4 h-4 text-indigo-600", loading && "animate-spin")} />
          Sync Live Data
        </button>
      </header>

      {gates.length === 0 && !loading && (
        <div className="bg-indigo-600 rounded-2xl p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl shadow-indigo-200 overflow-hidden relative group">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">System Initialization Required</h3>
            <p className="text-indigo-100 opacity-80 max-w-sm text-sm font-medium">Provision initial gate telemetry to begin real-time monitoring and fan advising.</p>
          </div>
          <button 
            onClick={initData}
            disabled={isInitializing}
            className={cn(
              "px-10 py-5 bg-white text-indigo-600 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl transition-all relative z-10",
              isInitializing ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
            )}
          >
            {isInitializing ? 'Provisional Sync...' : 'Deploy Telemetry'}
          </button>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full opacity-50 blur-3xl -translate-x-1/2 group-hover:scale-150 transition-transform" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gate Management */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gate Intake Control</h3>
          </div>
          
          <div className="grid gap-6">
            {gates.map(gate => (
              <div key={gate.id} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Gate {gate.name}</h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 block">Terminal Entry Point</span>
                  </div>
                  <div className="bg-slate-50 px-6 py-3 rounded-xl border border-slate-100 text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue Time</p>
                    <div className="flex items-center justify-end gap-2 text-indigo-600">
                      <input 
                        type="number" 
                        value={gate.waitTime}
                        onChange={(e) => updateGate(gate.id, gate.crowdLevel, parseInt(e.target.value))}
                        className="w-12 text-right font-black border-none bg-transparent focus:ring-0 p-0 text-xl"
                      />
                      <span className="text-xs font-black uppercase">Min</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Low', 'Medium', 'High', 'Overcrowded'] as CrowdLevel[]).map(level => (
                    <button
                      key={level}
                      onClick={() => updateGate(gate.id, level, gate.waitTime)}
                      className={cn(
                        "py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        gate.crowdLevel === level 
                          ? "bg-slate-900 text-white shadow-xl" 
                          : "bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Announcements Form */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg">
              <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Mass Broadcast</h3>
          </div>

          <form onSubmit={postAnnouncement} className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-md space-y-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">Dispatch Title</label>
              <input 
                type="text" 
                placeholder="Scanner Malfunction / Entry Fixed..."
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 font-black text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all uppercase text-xs tracking-widest shadow-inner placeholder:normal-case placeholder:font-medium"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">Threat Level / Priority</label>
              <div className="grid grid-cols-3 gap-3">
                {(['Normal', 'High', 'Urgent'] as Priority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAnnPriority(p)}
                    className={cn(
                      "py-3 rounded-lg text-[9px] font-black uppercase transition-all border-2",
                      annPriority === p 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" 
                        : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">Detailed Intelligence</label>
              <textarea 
                placeholder="Detailed instructions for approaching fans..."
                value={annMessage}
                onChange={(e) => setAnnMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-5 font-medium text-slate-600 min-h-[160px] focus:ring-2 focus:ring-indigo-600 transition-all resize-none shadow-inner"
                required
              />
            </div>

            <button className="w-full py-5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">
              <Send className="w-4 h-4" />
              Initiate Broadcast
            </button>
          </form>
        </section>
      </div>

      {/* Moderation section */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Intelligence Verification</h3>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Asset Source</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Target</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Intel Log</th>
                  <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                  <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reports.map((report) => (
                  <tr key={report.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{report.userName}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Public Fan</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-black text-indigo-600 text-xs">GATE {report.gateId}</td>
                    <td className="px-8 py-5">
                      <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-500 font-medium">
                        "{report.comment}"
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(report.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => deleteReport(report.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Purge Intelligence"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reports.length === 0 && (
            <div className="py-20 text-center bg-slate-50/30">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Awaiting field intelligence logs...</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Admin;
