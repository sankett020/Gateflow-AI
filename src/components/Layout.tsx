import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Rss, Map, PlusCircle, ShieldAlert, LogIn, LogOut, Ticket } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AIChat } from './AIChat';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NavItem: React.FC<{ 
  to: string; 
  icon: any; 
  label: string; 
  active: boolean; 
}> = ({ to, icon: Icon, label, active }) => (
  <Link 
    to={to} 
    className={cn(
      "p-3 rounded-lg transition-all flex flex-col items-center justify-center gap-1 group relative",
      active ? "text-indigo-400 bg-slate-800 shadow-lg" : "text-slate-400 hover:text-white"
    )}
  >
    <Icon className="w-6 h-6" />
    <span className="text-[8px] font-bold uppercase tracking-tighter sm:hidden lg:block">{label}</span>
    {active && (
      <motion.div 
        layoutId="activeIndicator"
        className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full hidden lg:block"
      />
    )}
  </Link>
);

const Navbar = () => {
  const { user, isAdmin, signIn, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/', icon: Home, label: 'Dash' },
    { to: '/feed', icon: Rss, label: 'Feed' },
    { to: '/map', icon: Map, label: 'Map' },
    { to: '/seating', icon: Ticket, label: 'Seat' },
  ];

  if (user) {
    navLinks.push({ to: '/report', icon: PlusCircle, label: 'Report' });
  }

  if (isAdmin) {
    navLinks.push({ to: '/admin', icon: ShieldAlert, label: 'Admin' });
  }

  return (
    <>
      {/* Sidebar - Desktop Navigation Rail */}
      <nav className="hidden lg:flex w-20 bg-slate-900 flex-col items-center py-6 gap-8 fixed inset-y-0 left-0 z-50">
        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
          G
        </div>
        <div className="flex flex-col gap-6">
          {navLinks.map((link) => (
            <NavItem 
              key={link.to}
              to={link.to}
              icon={link.icon}
              label={link.label}
              active={location.pathname === link.to}
            />
          ))}
        </div>
        <div className="mt-auto flex flex-col items-center gap-6">
          {user ? (
            <button 
              onClick={logout}
              className="p-3 text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
          ) : (
            <button 
              onClick={signIn}
              className="p-3 text-slate-400 hover:text-indigo-400 transition-colors"
              title="Login"
            >
              <LogIn className="w-6 h-6" />
            </button>
          )}
          <div className="w-8 h-8 bg-slate-700 rounded-full border border-slate-600"></div>
        </div>
      </nav>

      {/* Header */}
      <header className="lg:ml-20 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Gateflow AI</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              Operational Status: Active
            </span>
          </div>

          <div className="h-6 w-px bg-slate-100 hidden sm:block" />

          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none">{user.displayName || 'Anonymous'}</p>
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">Authorized Fan</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-[10px] uppercase">
                  {user.displayName?.[0] || 'U'}
                </div>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={signIn}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 px-4 py-2 flex justify-between items-center shadow-[0_-10px_25px_rgba(0,0,0,0.1)]">
        {navLinks.map((link) => (
          <NavItem 
            key={link.to}
            to={link.to}
            icon={link.icon}
            label={link.label}
            active={location.pathname === link.to}
          />
        ))}
        {user ? (
          <button 
            onClick={logout}
            className="flex flex-col items-center justify-center p-2 text-slate-400 hover:text-red-400"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-[8px] font-bold uppercase mt-1">Exit</span>
          </button>
        ) : (
          <button 
            onClick={signIn}
            className="flex flex-col items-center justify-center p-2 text-slate-400"
          >
            <LogIn className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase mt-1">Join</span>
          </button>
        )}
      </nav>
    </>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col relative bg-slate-50 overflow-x-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      <Navbar />
      <main className="lg:ml-20 flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8 relative z-10">
        {children}
      </main>
      <AIChat />
    </div>
  );
};

export default Layout;
