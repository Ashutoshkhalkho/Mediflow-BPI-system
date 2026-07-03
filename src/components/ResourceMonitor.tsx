import React from 'react';
import { Users, Sliders, Bed } from 'lucide-react';
import { TriageResult, RiskLevel } from '../types';

interface ResourceMonitorProps {
  waitingRoomLoad: number;
  setWaitingRoomLoad: (load: number) => void;
  availableBeds: number;
  setAvailableBeds: (beds: number) => void;
  onDutyNurses: number;
  setOnDutyNurses: (nurses: number) => void;
  showConfigSliders: boolean;
  setShowConfigSliders: (show: boolean) => void;
  activeResult: TriageResult | null;
}

export function getOnCallSpecialist(risk: RiskLevel | undefined) {
  if (!risk) {
    return { name: 'Dr. Ann J.', dept: 'Family Medicine / General Triage', pager: '#0100' };
  }
  switch (risk) {
    case 'EMERGENCY':
    case 'URGENT':
      return { name: 'Dr. Shreyas', dept: 'Internal Medicine & Urgent Care', pager: '#0300' };
    case 'SEMI-URGENT':
      return { name: 'Dr. Rishika', dept: 'Pediatrics & Women\'s Health', pager: '#0200' };
    case 'NON-URGENT':
      return { name: 'Dr. Ann J.', dept: 'Primary Care & Family Medicine', pager: '#0100' };
    default:
      return { name: 'Dr. Ann J.', dept: 'Family Medicine / General Triage', pager: '#0100' };
  }
}

export function ResourceMonitor({
  waitingRoomLoad,
  setWaitingRoomLoad,
  availableBeds,
  setAvailableBeds,
  onDutyNurses,
  setOnDutyNurses,
  showConfigSliders,
  setShowConfigSliders,
  activeResult,
}: ResourceMonitorProps) {
  const activeSpecialist = getOnCallSpecialist(activeResult?.riskLevel);

  return (
    <section
      className="col-span-12 md:col-span-6 lg:col-span-3 bg-indigo-950 text-white rounded-2xl p-5 shadow-lg flex flex-col justify-between"
      id="resource-snapshot-panel"
    >
      <div className="space-y-5">
        <div className="flex justify-between items-center border-b border-indigo-800/60 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-300 tracking-[0.2em] block">
              Module 03
            </span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-300" /> Resource Monitor
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowConfigSliders(!showConfigSliders)}
            className="p-1 bg-indigo-900/60 hover:bg-indigo-800/80 rounded-lg text-xs text-indigo-200 transition-colors border border-indigo-800"
            title="Configure Simulation Variables"
            id="toggle-sliders-btn"
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Dynamic state config sliders */}
        {showConfigSliders && (
          <div
            className="space-y-3 bg-indigo-900/50 p-3 rounded-xl border border-indigo-800 text-xs animate-fadeIn"
            id="sliders-container"
          >
            <p className="text-[10px] font-bold text-indigo-300 uppercase mb-2">
              Adjust Simulation Metrics
            </p>
            <div>
              <label className="flex justify-between text-[10px] mb-1">
                <span>Waiting Room Load</span>
                <span className="font-mono">{waitingRoomLoad}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={waitingRoomLoad}
                onChange={(e) => setWaitingRoomLoad(Number(e.target.value))}
                className="w-full h-1 bg-indigo-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>
            <div>
              <label className="flex justify-between text-[10px] mb-1">
                <span>Available ER Beds</span>
                <span className="font-mono">{availableBeds}</span>
              </label>
              <input
                type="range"
                min="0"
                max="8"
                value={availableBeds}
                onChange={(e) => setAvailableBeds(Number(e.target.value))}
                className="w-full h-1 bg-indigo-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>
            <div>
              <label className="flex justify-between text-[10px] mb-1">
                <span>On-Duty Nurses</span>
                <span className="font-mono">{onDutyNurses}/15</span>
              </label>
              <input
                type="range"
                min="5"
                max="15"
                value={onDutyNurses}
                onChange={(e) => setOnDutyNurses(Number(e.target.value))}
                className="w-full h-1 bg-indigo-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>
          </div>
        )}

        {/* Indicators */}
        <div className="space-y-4">
          {/* Waiting Room Capacity */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-indigo-200">ED Waiting Room Occupancy</span>
              <span className="font-mono font-bold text-indigo-100">{waitingRoomLoad}%</span>
            </div>
            <div className="w-full bg-indigo-900 rounded-full h-2.5 border border-indigo-800">
              <div
                style={{ width: `${waitingRoomLoad}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  waitingRoomLoad > 85
                    ? 'bg-rose-500'
                    : waitingRoomLoad > 60
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                }`}
              ></div>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-indigo-900/40 p-3 rounded-xl border border-indigo-800/60">
              <p className="text-[9px] uppercase text-indigo-300 font-bold mb-1">Available ER Beds</p>
              <div className="flex items-center gap-1.5">
                <Bed className="h-4 w-4 text-indigo-300" />
                <span className="text-lg font-bold font-mono">{availableBeds}</span>
              </div>
            </div>
            <div className="bg-indigo-900/40 p-3 rounded-xl border border-indigo-800/60">
              <p className="text-[9px] uppercase text-indigo-300 font-bold mb-1">Active Nurse Duty</p>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-300" />
                <span className="text-lg font-bold font-mono">
                  {onDutyNurses}
                  <span className="text-xs text-indigo-400">/15</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic on-call specialist based on active assessment */}
      <div className="border-t border-indigo-800/60 pt-4 mt-6">
        <span className="text-[10px] font-black uppercase text-indigo-300 tracking-[0.15em] mb-2.5 block">
          Recommended Specialist
        </span>
        <div className="flex items-center gap-3 bg-indigo-900/35 p-2 rounded-xl border border-indigo-800/40">
          <div className="w-9 h-9 rounded-full bg-indigo-800/80 border border-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">
            {activeSpecialist.name.split(' ').pop()?.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{activeSpecialist.name}</p>
            <p className="text-[9px] text-indigo-300 font-medium truncate">{activeSpecialist.dept}</p>
          </div>
          <div className="text-right">
            <span className="inline-block text-[9px] font-mono bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded font-bold">
              {activeSpecialist.pager}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
