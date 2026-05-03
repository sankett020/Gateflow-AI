import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Announcement, UserReport, CrowdLevel } from '../types';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Megaphone, ThumbsUp, Clock, Filter, AlertCircle, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ReportCard: React.FC<{ 
  report: UserReport;
  onVote: (id: string) => void;
}> = ({ report, onVote }) => {
  const { user } = useAuth();
  const hasVoted = user && report.voters.includes(user.uid);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] text-slate-500 font-black uppercase">
            {report.userName?.[0] || 'A'}
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{report.userName || 'Anonymous Fan'}</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{formatDistanceToNow(new Date(report.timestamp))} ago</p>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">
          Gate {report.gateId}
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            report.crowdLevel === 'Overcrowded' ? 'text-red-500' : 'text-indigo-600'
          )}>{report.crowdLevel}</span>
        </div>
        <p className="text-sm text-slate-700 font-medium">"{report.comment || "No observation recorded."}"</p>
      </div>

      {report.imageUrl && (
        <img src={report.imageUrl} alt="Gate status" className="w-full h-48 object-cover rounded-lg mb-4 border border-slate-100" />
      )}

      <div className="flex items-center justify-between mt-4">
        <button 
          onClick={() => onVote(report.id)}
          disabled={!user || hasVoted}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-[10px] font-black uppercase tracking-widest",
            hasVoted ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          )}
        >
          <ThumbsUp className={cn("w-3 h-3", hasVoted && "fill-current")} />
          Helpful ({report.votes})
        </button>
        <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">
          Flag Report
        </button>
      </div>
    </motion.div>
  );
};

const AnnouncementCard: React.FC<{ 
  announcement: Announcement;
}> = ({ announcement }) => {
  const styles = {
    Normal: "border-indigo-100 bg-indigo-50/50",
    High: "border-orange-100 bg-orange-50/50",
    Urgent: "border-red-100 bg-red-50/50",
  };
  const icons = {
    Normal: <Megaphone className="w-4 h-4 text-indigo-500" />,
    High: <AlertCircle className="w-4 h-4 text-orange-500" />,
    Urgent: <AlertCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl p-5 border shadow-sm relative overflow-hidden", styles[announcement.priority])}
    >
      <div className="flex items-start gap-4">
        <div className="bg-white p-2 rounded-lg shadow-sm">
          {icons[announcement.priority]}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{announcement.title}</h3>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatDistanceToNow(new Date(announcement.timestamp))} ago</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{announcement.message}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 px-2 py-1 bg-white/70 backdrop-blur rounded-md w-fit">
        <ShieldCheck className="w-3 h-3 text-indigo-600" />
        <span className="text-[9px] font-black text-indigo-900 uppercase tracking-widest">Verified Official</span>
      </div>
    </motion.div>
  );
};

const Feed = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState<'all' | 'official' | 'user'>('all');

  useEffect(() => {
    const qAnn = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'), limit(10));
    const unsubAnn = onSnapshot(qAnn, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'announcements');
    });

    const qRep = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(20));
    const unsubRep = onSnapshot(qRep, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserReport)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reports');
    });

    return () => {
      unsubAnn();
      unsubRep();
    };
  }, []);

  const handleVote = async (reportId: string) => {
    if (!user) return;
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        votes: increment(1),
        voters: arrayUnion(user.uid)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  const filteredItems = [
    ...(filter !== 'user' ? announcements.map(a => ({ type: 'ann', data: a, ts: a.timestamp })) : []),
    ...(filter !== 'official' ? reports.map(r => ({ type: 'rep', data: r, ts: r.timestamp })) : [])
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Live Pulse</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Official Alerts & Fan Updates</p>
        </div>

        <div className="flex bg-slate-200 p-1 rounded-lg">
          {(['all', 'official', 'user'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all",
                filter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            item.type === 'ann' ? (
              <AnnouncementCard key={`ann-${item.data.id}`} announcement={item.data as Announcement} />
            ) : (
              <ReportCard 
                key={`rep-${item.data.id}`} 
                report={item.data as UserReport} 
                onVote={handleVote} 
              />
            )
          ))}
        </AnimatePresence>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No activity reported</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
