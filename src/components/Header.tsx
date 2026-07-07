import React, { useState, useEffect } from 'react';
import { Activity, Users, User, Info } from 'lucide-react';

interface HeaderProps {
  userRole: 'receptionist' | 'patient';
  setUserRole: (role: 'receptionist' | 'patient') => void;
  setShowRulesModal: (show: boolean) => void;
}

export function Header({ userRole, setUserRole, setShowRulesModal }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="px-6 py-5 bg-white border-b border-zinc-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
      id="main-header"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <span className="bg-indigo-600 text-white p-2 rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5" />
          </span>
          VITALIS AI <span className="text-zinc-400 font-light">// Clinic Triage Assistant</span>
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Sunrise Medical Clinic • Smart Patient Ingestion & Operational Routing
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {/* View Perspective Selector */}
        <div className="bg-zinc-100 p-1 rounded-xl border border-zinc-200 flex items-center gap-1" id="role-switcher">
          <button
            onClick={() => setUserRole('receptionist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              userRole === 'receptionist'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
            }`}
            id="role-receptionist-btn"
          >
            <Users className="h-3.5 w-3.5" />
            Receptionist Console
          </button>
          <button
            onClick={() => setUserRole('patient')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              userRole === 'patient'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
            }`}
            id="role-patient-btn"
          >
            <User className="h-3.5 w-3.5" />
            Patient Portal
          </button>
        </div>

        {/* Rules overlay button */}
        <button
          onClick={() => setShowRulesModal(true)}
          className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-2 border border-zinc-200 transition-colors"
          id="view-guidelines-btn"
        >
          <Info className="h-3.5 w-3.5 text-zinc-500" />
          Clinic Triage Rules
        </button>

        {/* System Status badge */}
        <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-green-200">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
          SYSTEM ON
        </div>

        <div className="text-right pl-3 border-l border-zinc-200 hidden sm:block">
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Shift Clock</p>
          <p className="text-sm font-mono font-bold text-zinc-800">{currentTime || '08:42:00 AM'}</p>
        </div>
      </div>
    </header>
  );
}
