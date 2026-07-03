/**
 * Shared Type Definitions for the AI Medical Clinic Triage Assistant
 */

export type RiskLevel = 'EMERGENCY' | 'URGENT' | 'SEMI-URGENT' | 'NON-URGENT';

export type IntakeType = 'raw' | 'structured';

export interface TriageInput {
  patientName: string;
  patientAge: string;
  patientGender: string;
  contactPhone: string;
  intakeType: IntakeType;
  // If structured
  chiefComplaint?: string;
  onsetDuration?: string;
  severityLevel?: string; // e.g. "1" - "10" or "Mild", "Moderate", "Severe"
  medicalHistory?: string;
  // If raw transcript or call log
  rawTranscript?: string;
  
  // Booking Risk Modifiers
  previousNoShows?: string; // e.g., "None", "1-2 times", "3+ times"
  commuteDistance?: string; // e.g., "< 5 miles", "5-15 miles", "15+ miles"
  appointmentType?: string; // e.g., "Routine Care", "Specialist Consult", "Urgent Intake"
  bookingMethod?: string; // e.g., "online", "phone call", "walk-in"
  requestedSlot?: string; // e.g., "friday afternoon", "morning", "mid-day"
}

export interface TriageResult {
  riskLevel: RiskLevel;
  riskColor: 'red' | 'orange' | 'yellow' | 'green';
  recommendedTimeframe: string;
  clinicalSummary: string;
  keyRedFlags: string[];
  identifiedRiskFactors: string[];
  operationalSteps: string[];
  patientInstructions: string;
  suggestedFollowUpQuestions: string[];
  
  // Booking Risk & Operations Triages
  bookingRisk?: 'HIGH' | 'MEDIUM' | 'LOW';
  bookingRiskScore?: number;
  bookingRiskJustification?: string;
}

export interface TriageLog {
  id: string;
  createdAt: string;
  input: TriageInput;
  result: TriageResult;
  status: 'new' | 'actioned' | 'closed';
  completedSteps: string[]; // List of completed operational steps (indexes or text)
  notes?: string; // Optional manual notes added by the receptionist
  
  // Simulated Interactive Workflow
  bookingWorkflowState?: 'logged' | 'pending_action' | 'waiting' | 'done' | 'bottleneck';
  completedWorkflowSubsteps?: string[];
  revenueSaved?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string
}

