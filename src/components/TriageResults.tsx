import React from 'react';
import { ShieldAlert, Activity } from 'lucide-react';
import { TriageResult, RiskLevel } from '../types';

interface TriageResultsProps {
  activeResult: TriageResult | null;
}

export function getRiskColors(level: RiskLevel | undefined) {
  if (!level) {
    return {
      bg: 'bg-zinc-100',
      text: 'text-zinc-600',
      border: 'border-zinc-200',
      dot: 'bg-zinc-400',
    };
  }
  switch (level) {
    case 'EMERGENCY':
      return {
        bg: 'bg-red-50 text-red-900',
        text: 'text-red-600',
        border: 'border-red-200',
        dot: 'bg-red-500',
      };
    case 'URGENT':
      return {
        bg: 'bg-orange-50 text-orange-900',
        text: 'text-orange-600',
        border: 'border-orange-200',
        dot: 'bg-orange-500',
      };
    case 'SEMI-URGENT':
      return {
        bg: 'bg-amber-50 text-amber-900',
        text: 'text-amber-600',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'NON-URGENT':
      return {
        bg: 'bg-emerald-50 text-emerald-900',
        text: 'text-emerald-600',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      };
  }
}

export function TriageResults({ activeResult }: TriageResultsProps) {
  const activeRiskStyle = getRiskColors(activeResult?.riskLevel);

  return (
    <section
      className={`col-span-12 md:col-span-6 lg:col-span-4 rounded-2xl p-5 border-2 transition-all flex flex-col ${
        activeResult
          ? activeRiskStyle.border + ' ' + activeRiskStyle.bg
          : 'border-zinc-200 bg-white'
      }`}
      id="risk-assessment-panel"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <span
            className={`text-[10px] font-black uppercase tracking-[0.2em] block ${
              activeResult ? activeRiskStyle.text : 'text-zinc-400'
            }`}
          >
            Module 02
          </span>
          <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-indigo-600" /> Risk Assessment
          </h2>
        </div>
        {activeResult && (
          <div className={`w-3.5 h-3.5 rounded-full ${activeRiskStyle.dot} animate-ping`}></div>
        )}
      </div>

      {!activeResult ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400 space-y-3">
          <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-full">
            <Activity className="h-8 w-8 text-zinc-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500">Triage Pending</p>
            <p className="text-xs text-zinc-400 max-w-[240px] mt-1">
              Load a preset sample case or type custom details on the left, then click run.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 flex-grow">
          {/* Large Risk Badge */}
          <div className="text-center py-5 bg-white/60 border border-zinc-200/50 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
              Assigned Operational Urgency
            </span>
            <div className={`text-3xl font-black ${activeRiskStyle.text} tracking-tight`}>
              {activeResult.riskLevel}
            </div>
            <div className="mt-1 text-xs font-semibold text-zinc-700">
              Timeframe:{' '}
              <span className="font-bold underline">{activeResult.recommendedTimeframe}</span>
            </div>
          </div>

          {/* Clinical Summary */}
          <div className="space-y-1 bg-white p-3.5 rounded-xl border border-zinc-100 shadow-2xs">
            <span className="text-[9px] font-bold text-zinc-400 uppercase block tracking-wide">
              AI Clinical Summary
            </span>
            <p className="text-xs text-zinc-700 leading-relaxed font-medium">
              {activeResult.clinicalSummary}
            </p>
          </div>

          {/* Red Flags Identified */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-700 block">
              Critical Indicators / Red Flags
            </span>
            {activeResult.keyRedFlags?.length === 0 ? (
              <p className="text-xs text-zinc-500 italic bg-white/50 p-2 rounded-lg border border-zinc-100">
                No active acute red flags flagged by patient transcript.
              </p>
            ) : (
              <div className="space-y-1.5">
                {activeResult.keyRedFlags?.map((flag, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 bg-red-100/50 border border-red-200/40 p-2 rounded-lg text-xs text-red-950 font-medium"
                  >
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span className="leading-tight">{flag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risk Factors & Co-morbidities */}
          {activeResult.identifiedRiskFactors && activeResult.identifiedRiskFactors.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                Identified Risk Modifiers
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeResult.identifiedRiskFactors.map((factor, idx) => (
                  <span
                    key={idx}
                    className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-2.5 py-0.5 rounded-md text-[10px] font-semibold"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Booking Cancellation & No-Show Risk Assessment */}
          <div className="border-t border-dashed border-zinc-200/60 pt-4 mt-2 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                Booking / Operational Risk
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  activeResult.bookingRisk === 'HIGH'
                    ? 'bg-red-100 text-red-800'
                    : activeResult.bookingRisk === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {activeResult.bookingRisk || 'LOW'} RISK
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Score indicator */}
              <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white rounded-full border-2 border-indigo-100">
                <span className="text-sm font-black font-mono text-indigo-950">
                  {activeResult.bookingRiskScore || 10}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">No-Show Risk Score</p>
                <p className="text-xs text-zinc-700 leading-tight font-semibold mt-0.5">
                  {activeResult.bookingRisk === 'HIGH'
                    ? 'High cancellation threat'
                    : activeResult.bookingRisk === 'MEDIUM'
                      ? 'Medium attendance volatility'
                      : 'Stable booking attendance'}
                </p>
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
              <span className="text-[9px] font-bold text-indigo-800 uppercase block">
                Risk Justification
              </span>
              <p className="text-xs text-indigo-950 font-medium leading-relaxed mt-0.5">
                {activeResult.bookingRiskJustification ||
                  'Patient lives nearby and has solid attendance history.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
