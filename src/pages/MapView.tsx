import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Gate, CrowdLevel } from '../types';
import { motion } from 'motion/react';
import { Info, MapPin, ZoomIn, ZoomOut, Maximize, Search, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const MapController = ({ selectedGate }: { selectedGate: Gate | null }) => {
  const map = useMap();

  useEffect(() => {
    if (map && selectedGate?.location) {
      map.panTo(selectedGate.location);
      map.setZoom(19);
    }
  }, [map, selectedGate]);

  return null;
};

const GateMarker: React.FC<{ 
  gate: Gate; 
  onClick: () => void;
}> = ({ gate, onClick }) => {
  const colors: Record<CrowdLevel, string> = {
    Low: "#22c55e", // green-500
    Medium: "#6366f1", // indigo-500
    High: "#f97316", // orange-500
    Overcrowded: "#ef4444", // red-500
  };

  if (!gate.location) return null;

  return (
    <AdvancedMarker 
      position={gate.location} 
      onClick={onClick}
    >
      <Pin 
        background={colors[gate.crowdLevel]} 
        borderColor="#ffffff" 
        glyphColor="#ffffff"
        scale={1.2}
      />
    </AdvancedMarker>
  );
};

const MapView = () => {
  const [gates, setGates] = useState<Gate[]>([]);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<CrowdLevel | 'All'>('All');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'gates'), (snapshot) => {
      setGates(snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data()
      } as Gate)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'gates');
    });
    return unsub;
  }, []);

  const filteredGates = gates.filter(gate => {
    const matchesSearch = gate.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterLevel === 'All' || gate.crowdLevel === filterLevel;
    return matchesSearch && matchesFilter;
  });

  if (!hasValidKey) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Google Maps API Key Required</h2>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-left space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed font-medium">To enable the stadium map view, please add your API key as a secret:</p>
            <ol className="text-xs text-slate-500 space-y-3 font-bold uppercase tracking-wider list-decimal list-inside">
              <li>Open <span className="text-indigo-600">Settings</span> (Gear icon top-right)</li>
              <li>Go to <span className="text-indigo-600">Secrets</span></li>
              <li>Add <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700">GOOGLE_MAPS_PLATFORM_KEY</code></li>
            </ol>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">The app will rebuild automatically after sync</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Stadium Geolocation</h2>
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">Active Sector Visualization | Real-time Hub Data</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 max-w-2xl justify-end">
          <div className="relative w-full sm:max-w-xs group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text"
              placeholder="Query gate node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border-slate-100 rounded-2xl text-[13px] font-semibold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 transition-all placeholder:text-slate-300 border shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-100 rounded-2xl w-full sm:w-auto scrollbar-hide shadow-sm">
            {(['All', 'Low', 'Medium', 'High', 'Overcrowded'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  filterLevel === level 
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                    : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        {/* Map Container */}
        <div className="flex-1 bg-white rounded-[32px] shadow-2xl relative overflow-hidden ring-1 ring-slate-100 p-2">
          <div className="w-full h-full rounded-[26px] overflow-hidden">
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={{ lat: 36.0908, lng: -115.1833 }}
                defaultZoom={17}
                mapId="aistudio_gate_tracker"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                disableDefaultUI={true}
                gestureHandling={'greedy'}
              >
                <MapController selectedGate={selectedGate} />
                {filteredGates.map((gate) => (
                  <GateMarker 
                    key={gate.id} 
                    gate={gate} 
                    onClick={() => setSelectedGate(gate)} 
                  />
                ))}
              </Map>
            </APIProvider>
          </div>
          
          <div className="absolute bottom-8 left-8 bg-slate-900/90 backdrop-blur-2xl rounded-2xl p-5 border border-white/10 shadow-2xl space-y-3 ring-1 ring-white/5">
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Density Legend</div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/80">
              <span className="w-3 h-3 rounded-md bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" /> High Flow
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/80">
              <span className="w-3 h-3 rounded-md bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]" /> Moderate
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/80">
              <span className="w-3 h-3 rounded-md bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" /> Congested
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/80">
              <span className="w-3 h-3 rounded-md bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" /> Critical
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <aside className={cn(
          "w-full lg:w-96 bg-white rounded-[32px] p-8 border border-slate-100 shadow-2xl transition-all flex flex-col h-fit sticky top-0",
          !selectedGate && "justify-center items-center opacity-70 border-dashed border-2 py-20"
        )}>
          {selectedGate ? (
            <div className="space-y-8">
              <div className="flex items-center gap-5">
                <div className="bg-indigo-600 text-white w-14 h-14 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5 uppercase">Node {selectedGate.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connected & Transmitting</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Sector Density</p>
                  <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedGate.crowdLevel}</p>
                </div>
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Access Latency</p>
                  <p className="text-xl font-black text-indigo-600 tracking-tight">{selectedGate.waitTime} Minutes</p>
                </div>
              </div>

              <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-2xl active:scale-[0.98] group">
                <Maximize className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Initiate Wayfinding
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                <Search className="w-8 h-8" />
              </div>
              <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] leading-relaxed">Select a terminal node<br/>to display stream data</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default MapView;
