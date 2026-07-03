import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  HelpCircle, 
  Play, 
  Pause, 
  RotateCcw, 
  Video, 
  ClipboardList, 
  Activity, 
  UserCheck, 
  ArrowRight, 
  MonitorPlay,
  FileSpreadsheet,
  CheckCircle,
  Tv,
  ChevronRight
} from 'lucide-react';

interface RulesReferenceProps {
  onClose?: () => void;
}

const WORKFLOW_STEPS = [
  {
    title: "1. Intake & Symptom Entry",
    duration: "0:25",
    description: "The receptionist enters patient details, previous no-shows, and chief complaint, or pastes the raw transcript from a triage call.",
    visualType: "form",
    color: "indigo"
  },
  {
    title: "2. AI Clinical Triage Assessment",
    duration: "0:40",
    description: "The clinic system automatically maps symptoms to urgency categories (Emergency, Urgent, etc.) and predicts booking/no-show risk.",
    visualType: "analysis",
    color: "rose"
  },
  {
    title: "3. On-Call Physician Routing",
    duration: "1:10",
    description: "Our integrated directory automatically identifies the appropriate specialist (Dr. Ann, Dr. Rishika, or Dr. Shreyas) and pages them.",
    visualType: "pager",
    color: "amber"
  },
  {
    title: "4. Staff Action & Report Exporting",
    duration: "1:30",
    description: "Staff complete checklist items, update state logs, and utilize the 'Export to CSV' button to save clinic metrics for reporting.",
    visualType: "export",
    color: "emerald"
  }
];

export const RulesReference: React.FC<RulesReferenceProps> = ({ onClose }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setCurrentStep(current => {
              if (current >= WORKFLOW_STEPS.length - 1) {
                setIsPlaying(false);
                return 0; // Loop back
              }
              return current + 1;
            });
            return 0;
          }
          return prev + 4; // Advance progress
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleStepClick = (idx: number) => {
    setCurrentStep(idx);
    setProgress(0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const restartVideo = () => {
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(true);
  };

  // Helper to render the interactive mock display corresponding to the "video frame"
  const renderVideoFrame = () => {
    const step = WORKFLOW_STEPS[currentStep];
    switch (step.visualType) {
      case 'form':
        return (
          <div className="flex flex-col h-full justify-between p-4 bg-slate-950 font-mono text-zinc-300 text-[11px] rounded-lg border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-indigo-400 flex items-center gap-1">
                <ClipboardList className="h-3 w-3" /> FORM_INTAKE_MODULE
              </span>
              <span className="text-[9px] text-zinc-500 font-sans px-1.5 py-0.5 rounded bg-zinc-900 font-semibold">INPUT_PROG</span>
            </div>
            
            <div className="space-y-1.5 py-3">
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-zinc-500">PATIENT_NAME:</span>
                <span className="text-white font-bold animate-pulse">Jane Smith|</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-zinc-500">BOOKING_METHOD:</span>
                <span className="text-indigo-300">Manual Register Entry</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-zinc-500">CHIEF_COMPLAINT:</span>
                <span className="text-white text-right max-w-[180px] truncate">Routine checkup.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">PAST_NO_SHOWS:</span>
                <span className="text-amber-400">1-2 times</span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-1.5 rounded text-[10px] text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
              <span>Filling patient intake variables...</span>
            </div>
          </div>
        );
      case 'analysis':
        return (
          <div className="flex flex-col h-full justify-between p-4 bg-slate-950 font-mono text-zinc-300 text-[11px] rounded-lg border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-rose-400 flex items-center gap-1">
                <Activity className="h-3 w-3 animate-pulse" /> AI_DIAGNOSTIC_CORE
              </span>
              <span className="text-[9px] text-rose-500 bg-rose-950/50 border border-rose-900 font-sans px-1.5 py-0.5 rounded font-bold">ANALYZING</span>
            </div>
            
            <div className="space-y-2 py-2">
              <div className="p-2 bg-rose-950/20 border border-rose-900/40 rounded flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-sans">CLINICAL TRIAGE LEVEL</span>
                  <span className="text-rose-400 font-bold text-xs uppercase">Level 2 - URGENT</span>
                </div>
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></div>
              </div>

              <div className="p-2 bg-slate-900 rounded space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-500">No-Show Risk Probability:</span>
                  <span className="text-amber-400 font-bold">42% (Medium)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1">
                  <div className="bg-amber-400 h-1 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-zinc-500 leading-tight">
              &gt;&gt; Severity evaluation: Onset within 24hr, severe abdominal symptoms detected. Same-day care flag activated.
            </div>
          </div>
        );
      case 'pager':
        return (
          <div className="flex flex-col h-full justify-between p-4 bg-slate-950 font-mono text-zinc-300 text-[11px] rounded-lg border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-amber-400 flex items-center gap-1">
                <UserCheck className="h-3 w-3" /> PHYSICIAN_ROUTING
              </span>
              <span className="text-[9px] text-amber-500 bg-amber-950/50 border border-amber-900 font-sans px-1.5 py-0.5 rounded font-bold font-semibold">DISPATCH</span>
            </div>
            
            <div className="py-2.5 space-y-2">
              <div className="flex gap-2.5 items-center">
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-base">
                  👨‍⚕️
                </div>
                <div>
                  <h4 className="text-white font-bold font-sans text-xs">Dr. Shreyas</h4>
                  <p className="text-[9px] text-zinc-400">Internal Medicine / Urgent Care</p>
                </div>
              </div>

              <div className="p-1.5 bg-amber-950/10 border border-amber-900/30 rounded flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded bg-amber-500 animate-pulse"></span>
                <span className="text-[10px] text-amber-200">Pager #0300 Alerted: Ticket queued.</span>
              </div>
            </div>

            <div className="text-[9px] text-zinc-500 flex justify-between">
              <span>STATUS: ROUTED</span>
              <span>SLOT_RECOMMENDED: WITHIN 4HR</span>
            </div>
          </div>
        );
      case 'export':
        return (
          <div className="flex flex-col h-full justify-between p-4 bg-slate-950 font-mono text-zinc-300 text-[11px] rounded-lg border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-emerald-400 flex items-center gap-1">
                <FileSpreadsheet className="h-3 w-3" /> REPORTING_TOOL
              </span>
              <span className="text-[9px] text-emerald-500 bg-emerald-950/40 border border-emerald-900 font-sans px-1.5 py-0.5 rounded font-bold font-semibold">EXPORT</span>
            </div>
            
            <div className="py-2 text-center space-y-1.5">
              <div className="flex justify-center">
                <div className="p-1.5 bg-emerald-900/20 rounded-full text-emerald-400 animate-bounce">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
              </div>
              <div>
                <p className="text-white font-bold text-[9px] font-sans truncate">triage_logs_export.csv</p>
                <p className="text-[8px] text-zinc-500">Ready to download • 25 field columns</p>
              </div>
            </div>

            <div className="bg-slate-900 p-1 rounded flex items-center justify-between text-[9px] text-emerald-300">
              <span>Click 'Export to CSV' on dashboard</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="rules-reference">
      <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-blue-400" />
          <h2 className="font-semibold text-lg">Sunrise Medical Clinic Guidelines</h2>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition text-sm font-medium"
            id="close-rules-btn"
          >
            Hide Reference
          </button>
        )}
      </div>
      
      <div className="p-6 space-y-6">
        
        {/* RECEPTIONIST VIDEO/DEMO WORKFLOW SEQUENCE (NEWLY REQUESTED SECTION) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5" id="workflow-demo-section">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-700">
                <MonitorPlay className="h-4 w-4 text-indigo-600" />
                <h3 className="font-bold text-sm tracking-tight text-slate-900">Receptionist Clinical Workflow Sequence</h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Learn how the Sunrise Clinic triage & intake pipeline processes patient records visually.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={togglePlay}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                id="play-demo-btn"
                title={isPlaying ? "Pause Demo" : "Play Demo Auto-Sequence"}
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
                {isPlaying ? "Pause" : "Play Demo"}
              </button>
              <button 
                onClick={restartVideo}
                className="p-1 text-slate-500 hover:bg-slate-200 rounded-md text-xs transition-colors"
                id="reset-demo-btn"
                title="Restart Workflow Video"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            
            {/* Embedded Visual Sequence Simulator (Simulated Video Monitor Screen) */}
            <div className="md:col-span-5 space-y-2">
              <div className="relative aspect-video w-full rounded-lg bg-slate-900 border border-slate-800 shadow-inner overflow-hidden flex flex-col justify-between" id="visual-frame-container">
                
                {/* Header info overlays */}
                <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] text-zinc-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  <span>TRAINING_SIMULATION_CAM.MP4</span>
                </div>
                
                <div className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-zinc-400 font-mono">
                  {isPlaying ? 'PLAYING 1.5x' : 'PAUSED'}
                </div>

                {/* Simulated Content Frame based on active sequence state */}
                <div className="flex-1 p-2 pt-8 pb-4">
                  {renderVideoFrame()}
                </div>

                {/* Custom media player bar overlay */}
                <div className="bg-slate-950 border-t border-slate-900 p-1 px-2.5 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <button onClick={togglePlay} className="hover:text-white transition">
                      {isPlaying ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5 fill-current" />}
                    </button>
                    <span>0:{(currentStep * 20 + Math.floor(progress * 0.15)).toString().padStart(2, '0')} / 1:30</span>
                  </div>
                  
                  {/* Visual Video timeline scrubber */}
                  <div className="flex-1 mx-3 bg-zinc-800 rounded-full h-1 overflow-hidden relative">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-150"
                      style={{ width: `${(currentStep * 25) + (progress * 0.25)}%` }}
                    ></div>
                  </div>

                  <span className="text-[8px] font-bold text-indigo-400">Workflow {currentStep + 1}/4</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 italic text-center">
                This simulated playback explains staff controls step-by-step. Click steps on the right to navigate.
              </div>
            </div>

            {/* Workflow Navigation Controls List */}
            <div className="md:col-span-7 space-y-2">
              {WORKFLOW_STEPS.map((step, idx) => {
                const isActive = idx === currentStep;
                return (
                  <button
                    key={idx}
                    onClick={() => handleStepClick(idx)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-3 relative ${
                      isActive 
                        ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-100' 
                        : 'bg-white/40 hover:bg-white border-slate-200 text-slate-700'
                    }`}
                    id={`workflow-step-btn-${idx}`}
                  >
                    {/* Visual timing line indicator */}
                    {idx < WORKFLOW_STEPS.length - 1 && (
                      <div className="absolute left-[19px] top-9 bottom-[-13px] w-0.5 bg-slate-200 z-0"></div>
                    )}

                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-10 ${
                      isActive 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold leading-tight ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {step.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {step.duration}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        {step.description}
                      </p>
                      
                      {/* Active step loader bar representation */}
                      {isActive && (
                        <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-1 rounded-full transition-all duration-150"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        <p className="text-slate-600 text-sm">
          These standards are derived from emergency medicine and primary care sorting practices to ensure safety. The AI assistant maps patient complaints directly to these clinical benchmarks.
        </p>

        <div className="space-y-4">
          {/* EMERGENCY */}
          <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 flex gap-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-600 h-fit">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-red-900 text-sm">EMERGENCY (Level 1 - Red)</h3>
                <span className="text-[11px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">IMMEDIATE</span>
              </div>
              <p className="text-xs text-red-700 font-semibold mt-1">Core Indicators:</p>
              <ul className="text-xs text-slate-600 list-disc list-inside mt-0.5 space-y-0.5">
                <li>Sudden severe shortness of breath or complete airway blockage.</li>
                <li>Crushing chest pain radiating to the jaw, neck, back, or left arm.</li>
                <li>Sudden neurological changes (facial droop, slurred speech, limb weakness).</li>
                <li>Severe anaphylactic symptoms (throat tightness, swollen lips/tongue).</li>
                <li>Uncontrolled major arterial or venous bleeding.</li>
              </ul>
              <p className="text-xs text-red-800 font-bold mt-2">Required Action: Direct patient to call 911 or go to the nearest ER. Do NOT schedule a clinic visit. Notify on-duty physician.</p>
            </div>
          </div>

          {/* URGENT */}
          <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 flex gap-3">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600 h-fit">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-orange-900 text-sm">URGENT (Level 2 - Orange)</h3>
                <span className="text-[11px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">WITHIN 4 HOURS</span>
              </div>
              <p className="text-xs text-orange-700 font-semibold mt-1">Core Indicators:</p>
              <ul className="text-xs text-slate-600 list-disc list-inside mt-0.5 space-y-0.5">
                <li>Infants under 3 months with a rectal fever &gt; 100.4°F (38°C).</li>
                <li>Severe, sudden, unremitting abdominal pain.</li>
                <li>Dehydration signs combined with persistent vomiting or diarrhea.</li>
                <li>Suspected fractures, joint dislocations, or deep lacerations.</li>
                <li>Rapidly spreading skin infections or cellulitis (marked with ink).</li>
              </ul>
              <p className="text-xs text-orange-800 font-bold mt-2">Required Action: Book same-day clinic slot (within 4 hours). Flag as high priority. Nurse callback within 1 hour.</p>
            </div>
          </div>

          {/* SEMI-URGENT */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 flex gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 h-fit">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-amber-900 text-sm">SEMI-URGENT (Level 3 - Yellow)</h3>
                <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">24 - 48 HOURS</span>
              </div>
              <p className="text-xs text-amber-700 font-semibold mt-1">Core Indicators:</p>
              <ul className="text-xs text-slate-600 list-disc list-inside mt-0.5 space-y-0.5">
                <li>Moderate persistent ear pain or sinus pressure with discharge.</li>
                <li>Symptoms of simple Urinary Tract Infection (dysuria, urgency).</li>
                <li>Minor sprains, strains, or burns with intact skin.</li>
                <li>Persistent fever in healthy children/adults responsive to antipyretics.</li>
              </ul>
              <p className="text-xs text-amber-800 font-bold mt-2">Required Action: Schedule appointment within 24–48 hours. Nurse callback within 4 hours. Provide self-care details.</p>
            </div>
          </div>

          {/* NON-URGENT */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 h-fit">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-emerald-900 text-sm">NON-URGENT (Level 4 - Green)</h3>
                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">ROUTINE BOOKING</span>
              </div>
              <p className="text-xs text-emerald-700 font-semibold mt-1">Core Indicators:</p>
              <ul className="text-xs text-slate-600 list-disc list-inside mt-0.5 space-y-0.5">
                <li>Routine health screens, chronic illness check-ups, annual physicals.</li>
                <li>Maintenance medication refills (stable doses).</li>
                <li>Minor symptoms without systemic illness (mild skin flaking, cold symptoms).</li>
              </ul>
              <p className="text-xs text-emerald-800 font-bold mt-2">Required Action: Offer next routine appointment. Recommend self-service patient portal booking.</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 italic">
          Disclaimer: This AI-powered tool acts as a support system for administrative triage. Final clinical judgments must always be validated by qualified triage nurses or medical providers.
        </div>
      </div>
    </div>
  );
};
