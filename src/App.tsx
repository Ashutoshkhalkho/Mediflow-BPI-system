import React, { useState, useEffect } from 'react';
import { SAMPLE_CASES } from './data/samples';
import { TriageInput, TriageResult, TriageLog } from './types';
import { Header } from './components/Header';
import { PatientView } from './components/PatientView';
import { TriageForm } from './components/TriageForm';
import { TriageResults } from './components/TriageResults';
import { ResourceMonitor } from './components/ResourceMonitor';
import { OperationalWorkflows } from './components/OperationalWorkflows';
import { TriageHistory } from './components/TriageHistory';
import { RulesReference } from './components/RulesReference';

// Flexible mapping for mapping CSV headers to TriageInput fields
const headerMapping: Record<string, keyof TriageInput> = {
  'patientname': 'patientName',
  'name': 'patientName',
  'patient name': 'patientName',
  
  'patientage': 'patientAge',
  'age': 'patientAge',
  'patient age': 'patientAge',
  
  'patientgender': 'patientGender',
  'gender': 'patientGender',
  'patient gender': 'patientGender',
  
  'contactphone': 'contactPhone',
  'phone': 'contactPhone',
  'contact phone': 'contactPhone',
  'phone number': 'contactPhone',
  
  'chiefcomplaint': 'chiefComplaint',
  'complaint': 'chiefComplaint',
  'chief complaint': 'chiefComplaint',
  'symptoms': 'chiefComplaint',
  
  'onsetduration': 'onsetDuration',
  'onset': 'onsetDuration',
  'duration': 'onsetDuration',
  'onset & duration': 'onsetDuration',
  'onset duration': 'onsetDuration',
  
  'severitylevel': 'severityLevel',
  'severity': 'severityLevel',
  'severity level': 'severityLevel',
  
  'medicalhistory': 'medicalHistory',
  'history': 'medicalHistory',
  'medical history': 'medicalHistory',
  
  'rawtranscript': 'rawTranscript',
  'transcript': 'rawTranscript',
  
  'previousnoshows': 'previousNoShows',
  'noshows': 'previousNoShows',
  'no shows': 'previousNoShows',
  'no-shows': 'previousNoShows',
  
  'commutedistance': 'commuteDistance',
  'distance': 'commuteDistance',
  'commute': 'commuteDistance',
  
  'appointmenttype': 'appointmentType',
  'type': 'appointmentType',
  'appointment type': 'appointmentType',
  
  'bookingmethod': 'bookingMethod',
  'method': 'bookingMethod',
  'booking method': 'bookingMethod',
  
  'requestedslot': 'requestedSlot',
  'slot': 'requestedSlot',
  'requested slot': 'requestedSlot'
};

// Client-side CSV parser that handles newlines and quoted commas correctly
function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' && !inQuotes) {
      lines.push(currentLine);
      currentLine = "";
    } else if (char === '\r' && !inQuotes) {
      // skip carriage returns
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  
  if (lines.length === 0) return [];
  
  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let field = "";
    let inside = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inside = !inside;
      } else if (c === ',' && !inside) {
        fields.push(field.trim());
        field = "";
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };
  
  const headers = parseLine(lines[0]);
  const records: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const row = parseLine(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      const cleanHeader = header.replace(/^"|"$/g, '').trim();
      const val = row[idx] ? row[idx].replace(/^"|"$/g, '').trim() : '';
      record[cleanHeader] = val;
    });
    records.push(record);
  }
  
  return records;
}

export default function App() {
  // UI states
  const [userRole, setUserRole] = useState<'receptionist' | 'patient'>('receptionist');
  const [patientSubmittedResult, setPatientSubmittedResult] = useState<TriageResult | null>(null);
  const [patientSubmittedName, setPatientSubmittedName] = useState<string>('');
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'structured' | 'raw' | 'csv'>('structured');
  const [module04Tab, setModule04Tab] = useState<'clinical' | 'booking'>('clinical');
  const [searchHistory, setSearchHistory] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  // Form input state
  const [formInput, setFormInput] = useState<TriageInput>({
    patientName: '',
    patientAge: '',
    patientGender: 'Male',
    contactPhone: '',
    intakeType: 'structured',
    chiefComplaint: '',
    onsetDuration: '',
    severityLevel: '5',
    medicalHistory: '',
    previousNoShows: 'None',
    commuteDistance: '< 5 miles',
    appointmentType: 'Routine Care',
    bookingMethod: 'online',
    requestedSlot: 'standard open slot',
  });

  // Triage state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // CSV Batch Upload states
  const [batchRecords, setBatchRecords] = useState<TriageInput[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; patientName: string } | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Active viewing record / outcome
  const [activeResult, setActiveResult] = useState<TriageResult | null>(null);
  const [activeResultLogId, setActiveResultLogId] = useState<string | null>(null);

  // Interactive clinic resource monitor state
  const [waitingRoomLoad, setWaitingRoomLoad] = useState<number>(75);
  const [availableBeds, setAvailableBeds] = useState<number>(3);
  const [onDutyNurses, setOnDutyNurses] = useState<number>(12);
  const [showConfigSliders, setShowConfigSliders] = useState<boolean>(false);

  // Checked/completed operational steps for the active triage outcome
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  // Saved Logs history state
  const [triageLogs, setTriageLogs] = useState<TriageLog[]>([]);

  // Clipboard copy feedback state
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('triage_logs_history');
    if (savedLogs) {
      try {
        setTriageLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error('Failed to parse logs history:', e);
      }
    } else {
      // Seed initial sample to make history look alive immediately
      const initialSeed: TriageLog = {
        id: 'seed-log-1',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        input: {
          patientName: 'Marcus Thorne',
          patientAge: '58',
          patientGender: 'Male',
          contactPhone: '555-0102',
          intakeType: 'structured',
          chiefComplaint:
            'Sudden onset of severe pain in lower left abdomen with low-grade fever and mild nausea.',
          onsetDuration: '2 hours ago',
          severityLevel: '7',
          medicalHistory: 'None reported',
          previousNoShows: 'None',
          commuteDistance: '< 5 miles',
          appointmentType: 'Routine Care',
        },
        result: {
          riskLevel: 'URGENT',
          riskColor: 'orange',
          recommendedTimeframe: 'Same-day (Within 4 Hours)',
          clinicalSummary:
            '58-year-old male presenting with acute, localized lower left quadrant abdominal pain (7/10 severity), accompanying low-grade fever, and mild nausea. Findings raise high suspicion of acute inflammatory processes such as diverticulitis.',
          keyRedFlags: [
            'Acute persistent focal abdominal tenderness',
            'Fever in combination with acute abdominal distress',
          ],
          identifiedRiskFactors: [
            'Age 58 (increased risk for diverticular disease)',
            'Elevated reported severity (7/10)',
          ],
          operationalSteps: [
            'Schedule a urgent same-day clinic slot within 4 hours.',
            'Notify triage nurse coordinator of active diverticulitis protocol.',
            'Prepare standing orders for CBC, CMP, and inflammatory markers (CRP).',
            'Instruct patient on warning triggers (rigors, dizziness, vomiting) prompting immediate ER self-referral.',
          ],
          patientInstructions:
            'Please head to the clinic for your urgent slot. Do not consume any solid food or heavy liquids until evaluated. If you experience severe vomiting, sudden extreme pain, or feel faint, go to the nearest emergency room immediately.',
          suggestedFollowUpQuestions: [
            'Are you experiencing any rigors, shaking chills, or dizziness?',
            'Has the pain moved or spread since it first started?',
            'When was the last time you were able to pass gas or have a bowel movement?',
          ],
          bookingRisk: 'LOW',
          bookingRiskScore: 18,
          bookingRiskJustification:
            'Patient has no previous history of missed appointments and lives near the clinic.',
        },
        status: 'actioned',
        completedSteps: ['Schedule a urgent same-day clinic slot within 4 hours.'],
        notes: 'Priority slot confirmed for 11:30 AM with Dr. Varma.',
        bookingWorkflowState: 'done',
        completedWorkflowSubsteps: ['standard_reminder_sent'],
        revenueSaved: 150,
      };
      setTriageLogs([initialSeed]);
      localStorage.setItem('triage_logs_history', JSON.stringify([initialSeed]));
    }
  }, []);

  // Update localStorage when logs change
  const saveLogsToStorage = (newLogs: TriageLog[]) => {
    setTriageLogs(newLogs);
    localStorage.setItem('triage_logs_history', JSON.stringify(newLogs));
  };

  // Helper to load sample case
  const handleLoadSample = (sample: (typeof SAMPLE_CASES)[number]) => {
    setFormInput({
      ...sample.input,
      patientAge: sample.input.patientAge || '',
      patientGender: sample.input.patientGender || 'Male',
      contactPhone: sample.input.contactPhone || '',
      chiefComplaint: sample.input.chiefComplaint || '',
      onsetDuration: sample.input.onsetDuration || '',
      severityLevel: sample.input.severityLevel || '5',
      medicalHistory: sample.input.medicalHistory || '',
      previousNoShows: sample.input.previousNoShows || 'None',
      commuteDistance: sample.input.commuteDistance || '< 5 miles',
      appointmentType: sample.input.appointmentType || 'Routine Care',
      bookingMethod: sample.input.bookingMethod || 'online',
      requestedSlot: sample.input.requestedSlot || 'standard open slot',
    });
    setActiveTab(sample.input.intakeType);
    setError(null);
  };

  // Reset current form input
  const handleResetForm = () => {
    setFormInput({
      patientName: '',
      patientAge: '',
      patientGender: 'Male',
      contactPhone: '',
      intakeType: 'structured',
      chiefComplaint: '',
      onsetDuration: '',
      severityLevel: '5',
      medicalHistory: '',
      previousNoShows: 'None',
      commuteDistance: '< 5 miles',
      appointmentType: 'Routine Care',
      bookingMethod: 'online',
      requestedSlot: 'standard open slot',
    });
    setBatchRecords([]);
    setBatchError(null);
    setBatchProgress(null);
    setError(null);
  };

  // Handle Input Changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormInput((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Run AI Triage Assessment via server API
  const handleRunTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInput.patientName.trim()) {
      setError("Please enter the patient's name.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCompletedSteps({});

    try {
      const payload = {
        ...formInput,
        intakeType: activeTab, // Sync the selected tab type
      };

      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const result: TriageResult = await response.json();
      setActiveResult(result);

      const bRisk = result.bookingRisk || 'LOW';
      const initialWorkflowState: 'logged' | 'pending_action' | 'waiting' | 'done' | 'bottleneck' =
        bRisk === 'HIGH'
          ? 'bottleneck'
          : bRisk === 'MEDIUM'
            ? 'pending_action'
            : 'logged';

      // Auto-create a log entry with booking state
      const newLog: TriageLog = {
        id: `log-${Date.now()}`,
        createdAt: new Date().toISOString(),
        input: { ...payload },
        result: result,
        status: 'new',
        completedSteps: [],
        bookingWorkflowState: initialWorkflowState,
        completedWorkflowSubsteps: [],
        revenueSaved: 0,
      };

      const updatedLogs = [newLog, ...triageLogs];
      saveLogsToStorage(updatedLogs);
      setActiveResultLogId(newLog.id);

      if (userRole === 'patient') {
        setPatientSubmittedResult(result);
        setPatientSubmittedName(payload.patientName);
      }
    } catch (err: any) {
      console.error('Triage dispatch error:', err);
      setError(
        err.message || 'An unexpected error occurred while communicating with the triage AI server.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle CSV file selection and parsing
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBatchError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rawRecords = parseCSV(text);
        if (rawRecords.length === 0) {
          throw new Error("No records found in CSV file.");
        }

        const mapped: TriageInput[] = rawRecords.map((rec) => {
          const mappedRecord: TriageInput = {
            patientName: '',
            patientAge: '',
            patientGender: 'Male',
            contactPhone: '',
            intakeType: 'structured',
            chiefComplaint: '',
            onsetDuration: '',
            severityLevel: '5',
            medicalHistory: '',
            previousNoShows: 'None',
            commuteDistance: '< 5 miles',
            appointmentType: 'Routine Care',
            bookingMethod: 'online',
            requestedSlot: 'standard open slot',
          };

          Object.keys(rec).forEach((key) => {
            const normalizedKey = key.toLowerCase().trim();
            const targetProp = headerMapping[normalizedKey];
            if (targetProp) {
              (mappedRecord as any)[targetProp] = rec[key];
            }
          });

          // Validation / fallback for required name field
          if (!mappedRecord.patientName) {
            mappedRecord.patientName = rec['patientName'] || rec['Name'] || rec['name'] || 'Unnamed Patient';
          }

          return mappedRecord;
        });

        setBatchRecords(mapped);
      } catch (err: any) {
        console.error("CSV parsing error:", err);
        setBatchError(err.message || "Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  // Run sequential batch triage for all loaded patient records
  const handleRunBatchTriage = async () => {
    if (batchRecords.length === 0) return;

    setIsLoading(true);
    setBatchError(null);
    
    let currentLogs = [...triageLogs];
    const total = batchRecords.length;
    let completedCount = 0;
    
    const results: { result: TriageResult | null; record: TriageInput; error?: string }[] = new Array(total);
    const CONCURRENCY = 3;
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < total) {
        const currentIndex = nextIndex++;
        const record = batchRecords[currentIndex];

        // Update progress for started patient
        setBatchProgress({
          current: completedCount + 1,
          total: total,
          patientName: record.patientName,
        });

        try {
          const response = await fetch('/api/triage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server responded with status ${response.status}`);
          }

          const result: TriageResult = await response.json();
          results[currentIndex] = { result, record };
        } catch (err: any) {
          console.error(`Error triaging batch patient ${record.patientName}:`, err);
          results[currentIndex] = { result: null, record, error: err.message || String(err) };
        } finally {
          completedCount++;
          if (completedCount < total) {
            const activeIndex = results.findIndex((r, idx) => !r && idx < total);
            const activePatient = activeIndex !== -1 ? batchRecords[activeIndex] : null;
            setBatchProgress({
              current: completedCount,
              total: total,
              patientName: activePatient ? activePatient.patientName : '',
            });
          }
        }
      }
    };

    const workers = [];
    for (let w = 0; w < Math.min(CONCURRENCY, total); w++) {
      workers.push(worker());
    }
    await Promise.all(workers);

    let firstResult: TriageResult | null = null;
    let firstLogId: string | null = null;
    let hasError = false;
    let errorMsg = '';

    for (let i = 0; i < total; i++) {
      if (results[i].error) {
        hasError = true;
        errorMsg = `Failed to process patient "${results[i].record.patientName}": ${results[i].error}`;
        break;
      }
    }

    if (hasError) {
      setBatchError(errorMsg);
    } else {
      for (let i = 0; i < total; i++) {
        const { result, record } = results[i];
        if (!result) continue;

        if (i === 0) {
          firstResult = result;
        }

        const bRisk = result.bookingRisk || 'LOW';
        const initialWorkflowState: 'logged' | 'pending_action' | 'waiting' | 'done' | 'bottleneck' =
          bRisk === 'HIGH'
            ? 'bottleneck'
            : bRisk === 'MEDIUM'
              ? 'pending_action'
              : 'logged';

        const newLog: TriageLog = {
          id: `log-${Date.now()}-${i}`,
          createdAt: new Date().toISOString(),
          input: { ...record },
          result: result,
          status: 'new',
          completedSteps: [],
          bookingWorkflowState: initialWorkflowState,
          completedWorkflowSubsteps: [],
          revenueSaved: 0,
        };

        if (i === 0) {
          firstLogId = newLog.id;
        }

        currentLogs = [newLog, ...currentLogs];
      }

      saveLogsToStorage(currentLogs);
    }

    setBatchProgress(null);
    setIsLoading(false);
    
    if (!hasError && firstResult && firstLogId) {
      setActiveResult(firstResult);
      setActiveResultLogId(firstLogId);
      
      const stepState: Record<string, boolean> = {};
      firstResult.operationalSteps.forEach((step) => {
        stepState[step] = false;
      });
      setCompletedSteps(stepState);
      
      setFormInput(batchRecords[0]);
      setBatchRecords([]);
    }
  };

  // Toggle state of checkbox step
  const handleToggleStep = (stepText: string) => {
    const updated = { ...completedSteps, [stepText]: !completedSteps[stepText] };
    setCompletedSteps(updated);

    // Save checked step list back into the persistent log object
    if (activeResultLogId) {
      const updatedLogs = triageLogs.map((log) => {
        if (log.id === activeResultLogId) {
          const finishedList = Object.keys(updated).filter((k) => updated[k]);
          return {
            ...log,
            completedSteps: finishedList,
            // Automatically upgrade status to 'actioned' if they check at least one step
            status: log.status === 'new' ? 'actioned' : log.status,
          };
        }
        return log;
      });
      saveLogsToStorage(updatedLogs);
    }
  };

  // Select a log from historical records to load into main view
  const handleSelectHistoryLog = (log: TriageLog) => {
    setActiveResult(log.result);
    setActiveResultLogId(log.id);

    // Reconstruct checked steps
    const stepState: Record<string, boolean> = {};
    log.result.operationalSteps.forEach((step) => {
      stepState[step] = log.completedSteps?.includes(step) || false;
    });
    setCompletedSteps(stepState);

    // Load inputs back to edit if desired
    setFormInput({
      ...log.input,
    });
    setActiveTab(log.input.intakeType);
    setError(null);
  };

  // Update Past Log Status
  const handleUpdateLogStatus = (logId: string, status: 'new' | 'actioned' | 'closed') => {
    const updatedLogs = triageLogs.map((log) => {
      if (log.id === logId) {
        return { ...log, status };
      }
      return log;
    });
    saveLogsToStorage(updatedLogs);
  };

  // Booking Risk pipeline simulation handler
  const handleWorkflowAction = (logId: string, action: string) => {
    const updatedLogs = triageLogs.map((log) => {
      if (log.id !== logId) return log;

      let nextState = log.bookingWorkflowState || 'logged';
      let completedSubsteps = log.completedWorkflowSubsteps || [];
      let revSaved = log.revenueSaved || 0;

      if (action === 'high_confirm_1') {
        if (!completedSubsteps.includes('confirm_1')) {
          completedSubsteps = [...completedSubsteps, 'confirm_1'];
        }
      } else if (action === 'high_confirm_2') {
        if (!completedSubsteps.includes('confirm_2')) {
          completedSubsteps = [...completedSubsteps, 'confirm_2'];
        }
      } else if (action === 'medium_route_patinder') {
        if (!completedSubsteps.includes('patinder_routed')) {
          completedSubsteps = [...completedSubsteps, 'patinder_routed'];
          nextState = 'waiting'; // enters wait window
        }
      } else if (action === 'medium_resolve_wait') {
        if (!completedSubsteps.includes('patinder_wait_done')) {
          completedSubsteps = [...completedSubsteps, 'patinder_wait_done'];
          nextState = 'pending_action'; // ready to send reminder + confirm
        }
      } else if (action === 'medium_confirm_message') {
        if (!completedSubsteps.includes('reminder_sent')) {
          completedSubsteps = [...completedSubsteps, 'reminder_sent'];
        }
      } else if (action === 'low_send_reminder') {
        if (!completedSubsteps.includes('standard_reminder_sent')) {
          completedSubsteps = [...completedSubsteps, 'standard_reminder_sent'];
        }
      }

      // Check if path is resolved successfully
      const risk = log.result.bookingRisk || 'LOW';
      let isResolved = false;
      if (
        risk === 'HIGH' &&
        completedSubsteps.includes('confirm_1') &&
        completedSubsteps.includes('confirm_2')
      ) {
        isResolved = true;
      } else if (
        risk === 'MEDIUM' &&
        completedSubsteps.includes('patinder_routed') &&
        completedSubsteps.includes('patinder_wait_done') &&
        completedSubsteps.includes('reminder_sent')
      ) {
        isResolved = true;
      } else if (risk === 'LOW' && completedSubsteps.includes('standard_reminder_sent')) {
        isResolved = true;
      }

      if (isResolved) {
        nextState = 'done';
        revSaved = 150; // Each filled slot saves $150
      }

      return {
        ...log,
        bookingWorkflowState: nextState,
        completedWorkflowSubsteps: completedSubsteps,
        revenueSaved: revSaved,
        status: isResolved ? 'closed' : 'actioned',
      };
    });

    saveLogsToStorage(updatedLogs);

    // Sync active result viewing state too
    const activeLog = updatedLogs.find((l) => l.id === logId);
    if (activeLog) {
      setActiveResult(activeLog.result);

      // Update local completed steps from clinical steps if appropriate
      const stepState: Record<string, boolean> = {};
      activeLog.result.operationalSteps.forEach((step) => {
        stepState[step] = activeLog.completedSteps?.includes(step) || false;
      });
      setCompletedSteps(stepState);
    }
  };

  // Edit Manual Nurse Notes
  const handleSaveNurseNotes = (logId: string, notes: string) => {
    const updatedLogs = triageLogs.map((log) => {
      if (log.id === logId) {
        return { ...log, notes };
      }
      return log;
    });
    saveLogsToStorage(updatedLogs);
  };

  // Delete Log entry
  const handleDeleteLog = (logId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this triage log from the session record?')) {
      const filtered = triageLogs.filter((log) => log.id !== logId);
      saveLogsToStorage(filtered);
      if (activeResultLogId === logId) {
        setActiveResult(null);
        setActiveResultLogId(null);
      }
    }
  };

  // Clipboard copy patient guidance
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Export current filtered triage logs to a CSV file
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No logs available to export.');
      return;
    }

    // Helper to escape CSV values
    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return '';
      let str = String(val);
      // Escape double quotes by doubling them
      str = str.replace(/"/g, '""');
      // If there are commas, newlines, or double quotes, wrap the entire string in double quotes
      if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    };

    const headers = [
      'ID',
      'Created At',
      'Patient Name',
      'Patient Age',
      'Patient Gender',
      'Contact Phone',
      'Intake Type',
      'Chief Complaint',
      'Onset / Duration',
      'Severity Level',
      'Medical History',
      'Raw Transcript',
      'Previous No-Shows',
      'Commute Distance',
      'Appointment Type',
      'Booking Method',
      'Requested Slot',
      'Risk Level',
      'Timeframe',
      'Clinical Summary',
      'Booking Risk',
      'Booking Risk Score',
      'Booking Risk Justification',
      'Status',
      'Receptionist Notes',
    ];

    const rows = filteredLogs.map((log) => [
      log.id,
      log.createdAt,
      log.input.patientName,
      log.input.patientAge,
      log.input.patientGender,
      log.input.contactPhone,
      log.input.intakeType,
      log.input.intakeType === 'structured' ? log.input.chiefComplaint || '' : 'N/A',
      log.input.intakeType === 'structured' ? log.input.onsetDuration || '' : 'N/A',
      log.input.intakeType === 'structured' ? log.input.severityLevel || '' : 'N/A',
      log.input.intakeType === 'structured' ? log.input.medicalHistory || '' : 'N/A',
      log.input.intakeType === 'raw' ? log.input.rawTranscript || '' : 'N/A',
      log.input.previousNoShows || 'None',
      log.input.commuteDistance || '< 5 miles',
      log.input.appointmentType || 'Routine Care',
      log.input.bookingMethod || 'online',
      log.input.requestedSlot || 'standard open slot',
      log.result.riskLevel,
      log.result.recommendedTimeframe,
      log.result.clinicalSummary,
      log.result.bookingRisk || 'LOW',
      log.result.bookingRiskScore !== undefined ? `${log.result.bookingRiskScore}%` : '10%',
      log.result.bookingRiskJustification || '',
      log.status,
      log.notes || '',
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `sunrise_clinic_triage_logs_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export to CSV:', e);
      alert('Failed to export logs. Please try again.');
    }
  };

  // Filter logs for historical log card
  const filteredLogs = triageLogs.filter((log) => {
    const matchesSearch =
      log.input.patientName.toLowerCase().includes(searchHistory.toLowerCase()) ||
      (log.input.chiefComplaint || '').toLowerCase().includes(searchHistory.toLowerCase()) ||
      (log.input.rawTranscript || '').toLowerCase().includes(searchHistory.toLowerCase());
    const matchesRisk = filterRisk === 'all' || log.result.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  // Dynamic booking metrics
  const totalBookings = triageLogs.length;
  const revenueSaved = triageLogs.reduce((sum, log) => sum + (log.revenueSaved || 0), 0);
  const activeBottlenecks = triageLogs.filter(
    (log) => log.result.bookingRisk === 'HIGH' && log.bookingWorkflowState !== 'done'
  ).length;
  const patinderQueue = triageLogs.filter(
    (log) => log.result.bookingRisk === 'MEDIUM' && log.bookingWorkflowState === 'waiting'
  ).length;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900 border-t-8 border-indigo-600">
      {/* HEADER BAR */}
      <Header
        userRole={userRole}
        setUserRole={(role) => {
          setUserRole(role);
          setPatientSubmittedResult(null);
          setPatientSubmittedName('');
        }}
        setShowRulesModal={setShowRulesModal}
      />

      {/* RULES MODAL (IF TRIGGERED) */}
      {showRulesModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setShowRulesModal(false)}
        >
          <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <RulesReference onClose={() => setShowRulesModal(false)} />
          </div>
        </div>
      )}

      {/* MAIN BENTO GRID CONTAINER */}
      <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {userRole === 'patient' ? (
          <div className="space-y-6">
            {/* Quick Samples Banner */}
            <div
              className="bg-white p-4 rounded-xl border border-zinc-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs animate-fadeIn"
              id="quick-samples-bar"
            >
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] block mb-1">
                  Interactive Simulation Controls
                </span>
                <p className="text-xs text-zinc-600">
                  Click a medical case preset to fill out the form instantly and test the AI triage risk sorting:
                </p>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {SAMPLE_CASES.map((sample) => {
                  const colorClasses =
                    sample.badgeColor === 'red'
                      ? 'hover:bg-red-50 text-red-700 border-red-200 bg-red-50/30'
                      : sample.badgeColor === 'orange'
                        ? 'hover:bg-orange-50 text-orange-700 border-orange-200 bg-orange-50/30'
                        : sample.badgeColor === 'yellow'
                          ? 'hover:bg-amber-50 text-amber-700 border-amber-200 bg-amber-50/30'
                          : 'hover:bg-emerald-50 text-emerald-700 border-emerald-200 bg-emerald-50/30';
                  return (
                    <button
                      type="button"
                      key={sample.id}
                      onClick={() => handleLoadSample(sample)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${colorClasses} flex items-center gap-1.5`}
                      id={`sample-btn-${sample.id}`}
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current"></span>
                      {sample.title}
                    </button>
                  );
                })}
              </div>
            </div>

            <PatientView
              patientSubmittedResult={patientSubmittedResult}
              patientSubmittedName={patientSubmittedName}
              setPatientSubmittedResult={setPatientSubmittedResult}
              setPatientSubmittedName={setPatientSubmittedName}
              handleResetForm={handleResetForm}
              setUserRole={setUserRole}
              formInput={formInput}
              handleInputChange={handleInputChange}
              handleRunTriage={handleRunTriage}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isLoading={isLoading}
              error={error}
            />
          </div>
        ) : (
          <>

            {/* Dynamic Booking Metrics & Revenue Preserved Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="booking-metrics-dashboard">
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Total Bookings Logged
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-zinc-900 font-mono">{totalBookings}</span>
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    Check
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Logged as digital booking & scored.</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/10 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Estimated Revenue Saved
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-emerald-800 font-mono">${revenueSaved}</span>
                  <span className="text-[9px] text-emerald-600 font-black bg-emerald-100 px-1.5 py-0.5 rounded uppercase">
                    Slot Filled
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Preserved baseline revenue.</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/10 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                  High-Risk Bottlenecks
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-red-800 font-mono">{activeBottlenecks}</span>
                  {activeBottlenecks > 0 ? (
                    <span className="text-[9px] text-red-600 font-black bg-red-100 px-1.5 py-0.5 rounded animate-pulse">
                      Urgent Call
                    </span>
                  ) : (
                    <span className="text-[9px] text-zinc-500 font-semibold bg-zinc-100 px-1.5 py-0.5 rounded">
                      Clear
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Requires urgent verify flow.</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/10 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                  Patinder Queue
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-indigo-800 font-mono">{patinderQueue}</span>
                  <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                    Tracking
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Automated tracking + reminder.</p>
              </div>
            </div>

            {/* BENTO LAYOUT */}
            <div className="grid grid-cols-12 gap-6">
              {/* CARD 1: INTAKE INPUT CARD (BENTO COL-5) */}
              <div className="col-span-12 lg:col-span-5 flex flex-col">
                <TriageForm
                  formInput={formInput}
                  handleInputChange={handleInputChange}
                  handleRunTriage={handleRunTriage}
                  handleResetForm={handleResetForm}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isLoading={isLoading}
                  error={error}
                  isReceptionistConsole={true}
                  batchRecords={batchRecords}
                  batchProgress={batchProgress}
                  batchError={batchError}
                  handleCSVUpload={handleCSVUpload}
                  handleRunBatchTriage={handleRunBatchTriage}
                />
              </div>

              {/* CARD 2: RISK ASSESSMENT (BENTO COL-4) */}
              <TriageResults activeResult={activeResult} />

              {/* CARD 3: CLINIC RESOURCE SNAPSHOT (BENTO COL-3) */}
              <ResourceMonitor
                waitingRoomLoad={waitingRoomLoad}
                setWaitingRoomLoad={setWaitingRoomLoad}
                availableBeds={availableBeds}
                setAvailableBeds={setAvailableBeds}
                onDutyNurses={onDutyNurses}
                setOnDutyNurses={setOnDutyNurses}
                showConfigSliders={showConfigSliders}
                setShowConfigSliders={setShowConfigSliders}
                activeResult={activeResult}
              />

              {/* CARD 4: CLINICAL ACTIONS & RECEPTIONIST WORKFLOWS (BENTO COL-8) */}
              <OperationalWorkflows
                activeResult={activeResult}
                activeResultLogId={activeResultLogId}
                completedSteps={completedSteps}
                handleToggleStep={handleToggleStep}
                handleCopyToClipboard={handleCopyToClipboard}
                copiedText={copiedText}
                handleUpdateLogStatus={handleUpdateLogStatus}
              />
            </div>

            {/* CARD 5: HISTORY RECORD LOGS & ACTIVE SESSION FILE LIST (BENTO COL-12) */}
            <TriageHistory
              filteredLogs={filteredLogs}
              activeResultLogId={activeResultLogId}
              searchHistory={searchHistory}
              setSearchHistory={setSearchHistory}
              filterRisk={filterRisk}
              setFilterRisk={setFilterRisk}
              handleExportCSV={handleExportCSV}
              handleClearAllHistory={() => {
                if (confirm('Clear entire triage simulation history of this session?')) {
                  saveLogsToStorage([]);
                  setActiveResult(null);
                  setActiveResultLogId(null);
                }
              }}
              handleSelectHistoryLog={handleSelectHistoryLog}
              handleUpdateLogStatus={handleUpdateLogStatus}
              handleSaveNurseNotes={handleSaveNurseNotes}
              handleDeleteLog={handleDeleteLog}
            />
          </>
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="px-6 py-4 bg-zinc-900 text-zinc-400 text-[10px] mt-auto border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex flex-wrap gap-6 justify-center md:justify-start">
          <span>COMPLIANCE MONITOR: HIPAA / GDPR VALID</span>
          <span>DATA SECURITY: AES-256 TRANSMISSION</span>
          <span>AUDIT LOGGING: ACTIVE</span>
        </div>
        <div className="font-mono text-zinc-500">
          VITALIS NEURAL ENGINE // CLINICAL DECISION SUPPORT PATHWAYS V1.8.2
        </div>
      </footer>
    </div>
  );
}
