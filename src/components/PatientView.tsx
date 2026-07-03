import React from 'react';
import { CheckCircle, Plus, Users, Activity } from 'lucide-react';
import { TriageInput, TriageResult } from '../types';
import { TriageForm } from './TriageForm';
import { PatientChatbot } from './PatientChatbot';
import { getRiskColors } from './TriageResults';

interface PatientViewProps {
  patientSubmittedResult: TriageResult | null;
  patientSubmittedName: string;
  setPatientSubmittedResult: (res: TriageResult | null) => void;
  setPatientSubmittedName: (name: string) => void;
  handleResetForm: () => void;
  setUserRole: (role: 'receptionist' | 'patient') => void;
  formInput: TriageInput;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleRunTriage: (e: React.FormEvent) => void;
  activeTab: 'structured' | 'raw';
  setActiveTab: (tab: 'structured' | 'raw') => void;
  isLoading: boolean;
  error: string | null;
}

export function PatientView({
  patientSubmittedResult,
  patientSubmittedName,
  setPatientSubmittedResult,
  setPatientSubmittedName,
  handleResetForm,
  setUserRole,
  formInput,
  handleInputChange,
  handleRunTriage,
  activeTab,
  setActiveTab,
  isLoading,
  error,
}: PatientViewProps) {
  if (patientSubmittedResult) {
    const pRiskStyle = getRiskColors(patientSubmittedResult.riskLevel);
    return (
      <div
        className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn"
        id="patient-success-grid"
      >
        {/* Success card on left */}
        <div
          className="lg:col-span-7 xl:col-span-8 bg-white border-2 border-zinc-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(99,102,241,0.2)] space-y-6 animate-fadeIn"
          id="patient-success-view"
        >
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200 animate-bounce">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
              Intake Successfully Logged!
            </h2>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              Thank you,{' '}
              <span className="font-bold text-zinc-800">{patientSubmittedName}</span>. Your medical
              request has been securely processed and registered in our clinic queue.
            </p>
          </div>

          {/* Patient Guidance Info */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-4 animate-fadeIn">
            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block">
              Immediate Action Plan
            </span>

            <div className="flex items-center gap-3 py-3 px-4 bg-white border border-zinc-200 rounded-lg shadow-2xs">
              <div className={`w-3 h-3 rounded-full ${pRiskStyle?.dot || 'bg-indigo-600'}`}></div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase leading-none">
                  Triage Urgency Category
                </p>
                <p className="text-sm font-black text-zinc-800 mt-1">
                  {patientSubmittedResult.riskLevel} Urgency
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">
                Recommended Arrival Timeline
              </p>
              <p className="text-sm font-semibold text-zinc-800">
                {patientSubmittedResult.recommendedTimeframe}
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-zinc-200/60">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">
                Clinical Guidelines & Next Steps
              </p>
              <p className="text-xs text-zinc-700 leading-relaxed font-medium bg-amber-50/55 border border-amber-200/70 p-3.5 rounded-lg mt-1 italic">
                "{patientSubmittedResult.patientInstructions}"
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setPatientSubmittedResult(null);
                setPatientSubmittedName('');
                handleResetForm();
              }}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
              id="patient-new-intake-btn"
            >
              <Plus className="h-4 w-4" />
              Book Another Appointment
            </button>
            <button
              onClick={() => {
                setUserRole('receptionist');
              }}
              className="flex-1 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 text-indigo-800 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs"
              id="patient-switch-receptionist-btn"
            >
              <Users className="h-4 w-4 text-indigo-600 animate-pulse" />
              View on Receptionist Console
            </button>
          </div>
        </div>

        {/* AI Chatbot on Success View too */}
        <div
          className="lg:col-span-5 xl:col-span-4 bg-white border-2 border-zinc-200 rounded-2xl flex flex-col h-[650px] shadow-sm overflow-hidden"
          id="patient-chat-col"
        >
          <PatientChatbot />
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn"
      id="patient-intake-grid"
    >
      {/* Form on left */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-6" id="patient-form-col">
        {/* Patient Welcome Hero */}
        <div className="bg-indigo-950 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
            <Activity className="h-64 w-64 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase text-indigo-300 tracking-widest block mb-1">
            Sunrise Medical Clinic Patient Portal
          </span>
          <h2 className="text-xl font-extrabold tracking-tight">
            Express Symptom Triage & Appointment Booking
          </h2>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl leading-relaxed">
            Fill out your details and current health concerns. Our AI-assisted decision network will
            automatically categorize your clinical urgency, notify on-duty staff, and prepare your arrival
            plan.
          </p>
        </div>

        {/* Intake form */}
        <TriageForm
          formInput={formInput}
          handleInputChange={handleInputChange}
          handleRunTriage={handleRunTriage}
          handleResetForm={handleResetForm}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isLoading={isLoading}
          error={error}
          isReceptionistConsole={false}
        />
      </div>

      {/* AI Chatbot on Right */}
      <div
        className="lg:col-span-5 xl:col-span-4 bg-white border-2 border-zinc-200 rounded-2xl flex flex-col h-[650px] shadow-sm overflow-hidden"
        id="patient-chat-col"
      >
        <PatientChatbot />
      </div>
    </div>
  );
}
