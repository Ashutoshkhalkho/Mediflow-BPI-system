import React from 'react';
import { CheckSquare, Check, Copy, CheckCircle, BellRing } from 'lucide-react';
import { TriageResult } from '../types';

interface OperationalWorkflowsProps {
  activeResult: TriageResult | null;
  activeResultLogId: string | null;
  completedSteps: Record<string, boolean>;
  handleToggleStep: (step: string) => void;
  handleCopyToClipboard: (text: string) => void;
  copiedText: boolean;
  handleUpdateLogStatus: (logId: string, status: 'new' | 'actioned' | 'closed') => void;
}

export function OperationalWorkflows({
  activeResult,
  activeResultLogId,
  completedSteps,
  handleToggleStep,
  handleCopyToClipboard,
  copiedText,
  handleUpdateLogStatus,
}: OperationalWorkflowsProps) {
  return (
    <section
      className="col-span-12 lg:col-span-8 bg-white border-2 border-zinc-900 rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      id="operational-workflows-panel"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-3 border-b border-zinc-100">
        <div>
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] block">
            Module 04
          </span>
          <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-indigo-600" /> Operational Steps & Checklist
          </h2>
        </div>
        {activeResult && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-zinc-500">Execution Progress:</span>
            <div className="w-24 bg-zinc-100 border border-zinc-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round(
                    (Object.values(completedSteps).filter(Boolean).length /
                      (activeResult.operationalSteps?.length || 1)) *
                      100
                  )}%`,
                }}
              ></div>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {Object.values(completedSteps).filter(Boolean).length} /{' '}
              {activeResult.operationalSteps?.length || 0}
            </span>
          </div>
        )}
      </div>

      {!activeResult ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
          <CheckSquare className="h-10 w-10 text-zinc-300 mb-2" />
          <p className="text-sm font-semibold">No Steps Active</p>
          <p className="text-xs text-zinc-400 max-w-sm mt-0.5">
            Please generate a triage assessment on the left to review custom clinician workflows and
            patient checklists.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Steps checklist */}
          <div className="space-y-4">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-2">
              Clinic Staff Next Steps
            </span>
            <div className="space-y-2.5">
              {activeResult.operationalSteps?.map((step, idx) => {
                const isChecked = completedSteps[step] || false;
                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleStep(step)}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex gap-3 items-start ${
                      isChecked
                        ? 'bg-indigo-50/45 border-indigo-200 text-zinc-700'
                        : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        isChecked
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-zinc-50 border-zinc-300 text-transparent'
                      }`}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">
                        Step {idx + 1}
                      </span>
                      <p className="text-xs font-semibold leading-normal">{step}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions Bar */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCopyToClipboard(activeResult.operationalSteps.join('\n'))}
                className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-zinc-700"
              >
                <Copy className="h-3.5 w-3.5 text-zinc-400" />
                Copy Steps Log
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeResultLogId) {
                    handleUpdateLogStatus(activeResultLogId, 'closed');
                    alert('Triage file status updated to CLOSED.');
                  }
                }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Close & Archives
              </button>
            </div>
          </div>

          {/* Patient Guidance & Questions */}
          <div className="space-y-4 border-t md:border-t-0 md:border-l border-zinc-100 md:pl-6">
            {/* Patient Guidance */}
            <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl space-y-2 relative">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                  Patient Guidance Instructions
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(activeResult.patientInstructions)}
                  className="p-1 text-amber-700 hover:bg-amber-100 rounded transition-colors"
                  title="Copy Patient Text"
                  id="copy-patient-instructions-btn"
                >
                  {copiedText ? (
                    <span className="text-[9px] font-bold bg-amber-200 text-amber-800 px-1 rounded">
                      Copied
                    </span>
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed font-semibold">
                "{activeResult.patientInstructions}"
              </p>
            </div>

            {/* Clarifying Questions */}
            <div className="space-y-2.5 bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
              <div className="flex items-center gap-1.5">
                <BellRing className="h-4 w-4 text-indigo-600" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                  Receptionist Clarifying Questions
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-500 italic leading-snug">
                Ask the patient these details to gather more exact telemetry if they are still on the line:
              </p>
              <ul className="space-y-1.5">
                {activeResult.suggestedFollowUpQuestions?.slice(0, 3).map((q, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-zinc-800 font-semibold bg-white border border-zinc-200/60 rounded-lg p-2.5 flex items-start gap-2"
                  >
                    <span className="text-indigo-600 font-mono font-black">{idx + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
