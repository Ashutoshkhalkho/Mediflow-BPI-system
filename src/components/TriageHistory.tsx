import React from 'react';
import { FileSpreadsheet, Search } from 'lucide-react';
import { TriageLog } from '../types';
import { getRiskColors } from './TriageResults';

interface TriageHistoryProps {
  filteredLogs: TriageLog[];
  activeResultLogId: string | null;
  searchHistory: string;
  setSearchHistory: (search: string) => void;
  filterRisk: string;
  setFilterRisk: (risk: string) => void;
  handleExportCSV: () => void;
  handleClearAllHistory: () => void;
  handleSelectHistoryLog: (log: TriageLog) => void;
  handleUpdateLogStatus: (logId: string, status: 'new' | 'actioned' | 'closed') => void;
  handleSaveNurseNotes: (logId: string, notes: string) => void;
  handleDeleteLog: (logId: string, e: React.MouseEvent) => void;
}

export function TriageHistory({
  filteredLogs,
  activeResultLogId,
  searchHistory,
  setSearchHistory,
  filterRisk,
  setFilterRisk,
  handleExportCSV,
  handleClearAllHistory,
  handleSelectHistoryLog,
  handleUpdateLogStatus,
  handleSaveNurseNotes,
  handleDeleteLog,
}: TriageHistoryProps) {
  return (
    <section className="col-span-12 bg-white border-2 border-zinc-200 rounded-2xl p-5 shadow-sm" id="history-logs-panel">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-3 border-b border-zinc-100">
        <div>
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] block">
            Module 05
          </span>
          <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-indigo-600" /> Session Case Registry
          </h2>
        </div>

        {/* Search & filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="Search by name..."
              className="pl-8 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:bg-white focus:outline-indigo-600"
              id="search-history-input"
            />
          </div>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs text-zinc-700"
            id="filter-risk-select"
          >
            <option value="all">All Risk Levels</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="URGENT">Urgent</option>
            <option value="SEMI-URGENT">Semi-Urgent</option>
            <option value="NON-URGENT">Non-Urgent</option>
          </select>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            id="export-csv-btn"
            title="Export current triage list to CSV file"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            Export to CSV
          </button>
          <button
            type="button"
            onClick={handleClearAllHistory}
            className="px-2.5 py-1 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-lg text-xs transition-colors"
            id="clear-all-history-btn"
          >
            Clear All
          </button>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-xs italic">
          No session logs match your filters. Process a new triage log to record it in the registry list.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50 text-zinc-400 font-bold uppercase tracking-wider text-[9px] border-b border-zinc-200">
                <th className="py-2 px-3">Patient</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Symptoms / Transcript Summary</th>
                <th className="py-2 px-3">Action status</th>
                <th className="py-2 px-3">Session Date/Time</th>
                <th className="py-2 px-3">Receptionist Notes</th>
                <th className="py-2 px-3 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredLogs.map((log) => {
                const colors = getRiskColors(log.result.riskLevel);
                const isCurrentActive = log.id === activeResultLogId;
                return (
                  <tr
                    key={log.id}
                    onClick={() => handleSelectHistoryLog(log)}
                    className={`group hover:bg-zinc-50 cursor-pointer transition-colors ${
                      isCurrentActive ? 'bg-indigo-50/30' : ''
                    }`}
                    id={`history-row-${log.id}`}
                  >
                    {/* Patient */}
                    <td className="py-3 px-3">
                      <p className="font-bold text-zinc-900">{log.input.patientName}</p>
                      <p className="text-[10px] text-zinc-500 font-semibold">
                        {log.input.patientAge}y • {log.input.patientGender}
                      </p>
                    </td>

                    {/* Risk Level */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${colors.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
                        {log.result.riskLevel}
                      </span>
                    </td>

                    {/* Symptoms brief summary */}
                    <td
                      className="py-3 px-3 max-w-xs truncate"
                      title={log.input.chiefComplaint || log.input.rawTranscript}
                    >
                      <p className="truncate text-zinc-700 leading-snug font-medium">
                        {log.input.intakeType === 'structured'
                          ? log.input.chiefComplaint
                          : log.input.rawTranscript}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={log.status}
                        onChange={(e) => handleUpdateLogStatus(log.id, e.target.value as any)}
                        className="bg-zinc-50 border border-zinc-300 rounded px-1.5 py-0.5 text-[10.5px] font-semibold text-zinc-700 focus:outline-indigo-600"
                      >
                        <option value="new">🆕 New Intake</option>
                        <option value="actioned">⚡ Actioned</option>
                        <option value="closed">✅ Closed File</option>
                      </select>
                    </td>

                    {/* Date Created */}
                    <td className="py-3 px-3 text-zinc-500 font-medium font-mono text-[10px]">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>

                    {/* Manual Notes */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={log.notes || ''}
                        onChange={(e) => handleSaveNurseNotes(log.id, e.target.value)}
                        placeholder="Add triage notes..."
                        className="bg-zinc-50 focus:bg-white hover:bg-zinc-100 border border-transparent hover:border-zinc-300 rounded px-2 py-0.5 w-full text-xs transition"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleSelectHistoryLog(log)}
                          className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded font-semibold text-[10px]"
                          title="Load case details"
                        >
                          Review File
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteLog(log.id, e)}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded font-bold text-[10px]"
                          title="Remove case"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
