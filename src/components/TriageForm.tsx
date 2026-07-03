import React from 'react';
import { Clipboard, RotateCcw, PlayCircle, RefreshCw } from 'lucide-react';
import { TriageInput } from '../types';

interface TriageFormProps {
  formInput: TriageInput;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleRunTriage: (e: React.FormEvent) => void;
  handleResetForm: () => void;
  activeTab: 'structured' | 'raw';
  setActiveTab: (tab: 'structured' | 'raw') => void;
  isLoading: boolean;
  error: string | null;
  isReceptionistConsole: boolean;
}

export function TriageForm({
  formInput,
  handleInputChange,
  handleRunTriage,
  handleResetForm,
  activeTab,
  setActiveTab,
  isLoading,
  error,
  isReceptionistConsole,
}: TriageFormProps) {
  return (
    <section
      className={`bg-white rounded-2xl p-5 shadow-sm flex flex-col ${
        isReceptionistConsole ? 'border-2 border-zinc-200' : 'border-2 border-zinc-200'
      }`}
      id="triage-intake-panel"
    >
      <div className="flex justify-between items-center mb-4 border-b border-zinc-100 pb-3">
        {isReceptionistConsole ? (
          <div>
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] block">
              Module 01
            </span>
            <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <Clipboard className="h-4 w-4 text-indigo-600" /> Patient Ingestion
            </h2>
          </div>
        ) : (
          <h3 className="text-sm font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
            <Clipboard className="h-4 w-4 text-indigo-600" /> Step 1: Health intake details
          </h3>
        )}

        <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab('structured')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'structured'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
            id="tab-structured-btn"
          >
            {isReceptionistConsole ? 'Structured Form' : 'Symptom Form'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'raw'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
            id="tab-raw-btn"
          >
            {isReceptionistConsole ? 'Call Transcript / Raw Log' : 'Describe Symptoms freely'}
          </button>
        </div>
      </div>

      <form onSubmit={handleRunTriage} className="space-y-4 flex-1 flex flex-col">
        {/* Demographics row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 sm:col-span-1">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              {isReceptionistConsole ? 'Patient Name' : 'Your Full Name'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 flex items-center justify-center">
                👤
              </span>
              <input
                type="text"
                name="patientName"
                required
                value={formInput.patientName}
                onChange={handleInputChange}
                placeholder={isReceptionistConsole ? 'e.g. Liam Chen' : 'e.g. Eleanor Vance'}
                className="pl-9 w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-indigo-600"
                id="input-patient-name"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              {isReceptionistConsole ? 'Age (Years)' : 'Your Age'}
            </label>
            <input
              type="number"
              step="any"
              name="patientAge"
              required
              value={formInput.patientAge}
              onChange={handleInputChange}
              placeholder={isReceptionistConsole ? 'e.g. 34 or 0.2' : 'e.g. 34'}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-indigo-600"
              id="input-patient-age"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              {isReceptionistConsole ? 'Gender' : 'Gender Assigned at Birth'}
            </label>
            <select
              name="patientGender"
              value={formInput.patientGender}
              onChange={handleInputChange}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-indigo-600"
              id="input-patient-gender"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">
                {isReceptionistConsole ? 'Other / NB' : 'Other'}
              </option>
              {isReceptionistConsole && <option value="Unknown">Unknown</option>}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
            {isReceptionistConsole ? 'Contact Phone' : 'Contact Phone Number'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 flex items-center justify-center">
              📞
            </span>
            <input
              type="tel"
              name="contactPhone"
              required
              value={formInput.contactPhone}
              onChange={handleInputChange}
              placeholder={isReceptionistConsole ? 'e.g. 555-0144' : 'e.g. (555) 123-4567'}
              className="pl-9 w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-indigo-600"
              id="input-patient-phone"
            />
          </div>
        </div>

        {/* Dynamic inputs based on Intake Mode selection */}
        {activeTab === 'structured' ? (
          <div className="space-y-3 flex-1" id="intake-structured-fields">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                {isReceptionistConsole
                  ? 'Chief Complaint'
                  : 'What is your primary medical concern / symptom today?'}
              </label>
              <textarea
                name="chiefComplaint"
                required
                value={formInput.chiefComplaint || ''}
                onChange={handleInputChange}
                rows={3}
                placeholder={
                  isReceptionistConsole
                    ? 'What is the patient experiencing? Be specific with symptoms, focal points of pain...'
                    : 'e.g. Persistent heavy chest pain, radiating down left arm, feeling short of breath and sweaty...'
                }
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-indigo-600 leading-relaxed"
                id="input-chief-complaint"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  Onset & Duration
                </label>
                <input
                  type="text"
                  name="onsetDuration"
                  required
                  value={formInput.onsetDuration || ''}
                  onChange={handleInputChange}
                  placeholder={
                    isReceptionistConsole ? 'e.g. 2 hours ago' : 'e.g. Started 45 minutes ago, getting worse'
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-indigo-600"
                  id="input-onset"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  {isReceptionistConsole
                    ? `Reported Pain Severity (${formInput.severityLevel}/10)`
                    : `Severity Level (${formInput.severityLevel} - 10 Pain Scale)`}
                </label>
                <div className="flex items-center gap-3 h-[32px]">
                  <input
                    type="range"
                    name="severityLevel"
                    min="1"
                    max="10"
                    value={formInput.severityLevel || '5'}
                    onChange={handleInputChange}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    id="input-severity"
                  />
                  <span className="text-xs font-mono font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 w-8 h-7 flex items-center justify-center rounded-lg">
                    {formInput.severityLevel}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                {isReceptionistConsole
                  ? 'Medical History & Risk Factors'
                  : 'Relevant Medical History, Allergies, or Medications'}
              </label>
              <textarea
                name="medicalHistory"
                value={formInput.medicalHistory || ''}
                onChange={handleInputChange}
                rows={isReceptionistConsole ? 1 : 2}
                placeholder={
                  isReceptionistConsole
                    ? 'e.g. Hypertension, diabetes, pregnant, previous surgeries...'
                    : 'e.g. History of asthma, currently taking metformin, allergic to penicillin...'
                }
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-indigo-600"
                id="input-history"
              />
            </div>

            {/* Booking Risk Factors Section */}
            <div className="border-t border-dashed border-zinc-200 pt-3 mt-1 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 block">
                {isReceptionistConsole
                  ? 'Booking & Scheduling Risk Modifiers'
                  : 'Transit & Booking context'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-0.5">
                    {isReceptionistConsole ? 'Prev No-Shows' : 'Previous No-Shows'}
                  </label>
                  <select
                    name="previousNoShows"
                    value={formInput.previousNoShows || 'None'}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-zinc-700 focus:bg-white focus:outline-indigo-600"
                    id="input-prev-noshows"
                  >
                    <option value="None">None (Low Risk)</option>
                    <option value="1-2 times">1-2 times (Med Risk)</option>
                    <option value="3+ times">3+ times / Missed 2 (High)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-0.5">
                    {isReceptionistConsole ? 'Commute Distance' : 'Estimated Commute'}
                  </label>
                  <select
                    name="commuteDistance"
                    value={formInput.commuteDistance || '< 5 miles'}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-zinc-700 focus:bg-white focus:outline-indigo-600"
                    id="input-commute"
                  >
                    <option value="< 5 miles">&lt; 5 miles</option>
                    <option value="5-15 miles">5-15 miles</option>
                    <option value="15+ miles">15+ miles (Med/High)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-0.5">
                    {isReceptionistConsole ? 'Appt Type' : 'Care Type'}
                  </label>
                  <select
                    name="appointmentType"
                    value={formInput.appointmentType || 'Routine Care'}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-zinc-700 focus:bg-white focus:outline-indigo-600"
                    id="input-appt-type"
                  >
                    <option value="Routine Care">Routine Care</option>
                    <option value="Specialist Consult">Specialist Consult</option>
                    <option value="Urgent Intake">Urgent Intake</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-0.5">
                    Booking Method
                  </label>
                  <select
                    name="bookingMethod"
                    value={formInput.bookingMethod || 'online'}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-zinc-700 focus:bg-white focus:outline-indigo-600"
                    id="input-booking-method"
                  >
                    <option value="online">Online Portal</option>
                    <option value="phone call">Phone Call</option>
                    <option value="walk-in">Walk-in</option>
                    {isReceptionistConsole && (
                      <option value="manual register entry">Manual Register</option>
                    )}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-0.5">
                    Requested Time Slot
                  </label>
                  <select
                    name="requestedSlot"
                    value={formInput.requestedSlot || 'standard open slot'}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-zinc-700 focus:bg-white focus:outline-indigo-600"
                    id="input-requested-slot"
                  >
                    <option value="standard open slot">Standard Weekday Slot</option>
                    <option value="friday afternoon">Friday Afternoon (High Demand)</option>
                    <option value="morning">Morning (08:00 AM - 11:30 AM)</option>
                    <option value="mid-day">Mid-Day / Lunch Slot</option>
                    <option value="mid-week">Mid-Week Slot</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-2" id="intake-raw-fields">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                {isReceptionistConsole
                  ? 'Inbound Call Transcript / Receptionist Raw Notes'
                  : 'Type or dictate your symptoms in detail'}
              </label>
              <span className="text-[9px] text-zinc-400 italic">
                {isReceptionistConsole
                  ? 'Messy clinical notes & raw speech logs supported'
                  : 'Detailed timeline & symptoms descriptions'}
              </span>
            </div>
            <textarea
              name="rawTranscript"
              required
              value={formInput.rawTranscript || ''}
              onChange={handleInputChange}
              rows={isReceptionistConsole ? 8 : 6}
              placeholder={
                isReceptionistConsole
                  ? 'Paste telephone intake log or live spoken call transcript here... The AI engine will extract symptoms, severities, timelines, and chronic conditions automatically.'
                  : 'e.g. My daughter is 6 years old, she has had a fever of 102 since last night and has been complaining of an earache. She is crying and won\'t sleep. She doesn\'t have any rashes or cough...'
              }
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-indigo-600 leading-relaxed font-mono flex-1 min-h-[160px]"
              id="input-raw-transcript"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-100 mt-auto">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-3 py-2.5 bg-white border border-zinc-300 text-zinc-700 font-semibold rounded-xl text-xs hover:bg-zinc-50 transition-colors flex items-center justify-center gap-1.5"
            id="reset-form-btn"
          >
            <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
            Clear Form
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="col-span-2 bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            id={isReceptionistConsole ? 'submit-triage-btn' : 'patient-submit-btn'}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {isReceptionistConsole ? 'Evaluating Patient Symptoms...' : 'Securely Triaging Your Symptoms...'}
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 text-white" />
                {isReceptionistConsole ? 'RUN CLINICAL TRIAGE' : 'SUBMIT INTAKE AND BOOK APPOINTMENT'}
              </>
            )}
          </button>
        </div>

        {error && (
          <div
            className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold"
            id="error-message"
          >
            {error}
          </div>
        )}
      </form>
    </section>
  );
}
