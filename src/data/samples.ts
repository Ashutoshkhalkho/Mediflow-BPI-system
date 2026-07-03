import { TriageInput } from '../types';

export interface SampleCase {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  input: TriageInput;
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: 'chest_pain',
    title: 'Severe Chest Pain',
    badge: 'Emergency suspect',
    badgeColor: 'red',
    input: {
      patientName: 'Robert Vance',
      patientAge: '58',
      patientGender: 'Male',
      contactPhone: '555-0192',
      intakeType: 'raw',
      previousNoShows: 'None',
      commuteDistance: '5-15 miles',
      appointmentType: 'Urgent Intake',
      rawTranscript: 'Caller sounds highly distressed and is breathing heavily. Patient states: "I was sitting at the kitchen table and suddenly felt a really tight, heavy pressure in the middle of my chest. It feels like someone is standing right on it. The pain is starting to radiate down my left arm and up to my jaw. I\'m feeling very dizzy, lightheaded, and sweaty." Onset is about 15 minutes ago. No history of heart surgery, but takes medication for chronic high blood pressure.'
    }
  },
  {
    id: 'infant_fever',
    title: 'Infant High Fever',
    badge: 'Urgent suspect',
    badgeColor: 'orange',
    input: {
      patientName: 'Liam Chen (Infant)',
      patientAge: '0.2',
      patientGender: 'Male',
      contactPhone: '555-0144',
      intakeType: 'raw',
      previousNoShows: '1-2 times',
      commuteDistance: '15+ miles',
      appointmentType: 'Urgent Intake',
      rawTranscript: 'Mother calling regarding 10-week-old infant Liam. Mother states: "Liam has been crying non-stop for the last hour and feels burning hot. I just took his temperature rectally and it is 101.9 degrees Fahrenheit (38.8°C). He is refusing to nurse, hasn\'t had a wet diaper in 6 hours, and seems very lethargic, almost floppy when I lift him up." Symptoms started early this morning. No other chronic conditions.'
    }
  },
  {
    id: 'painful_urination',
    title: 'Suspected Acute UTI',
    badge: 'Semi-Urgent suspect',
    badgeColor: 'yellow',
    input: {
      patientName: 'Sarah Jenkins',
      patientAge: '34',
      patientGender: 'Female',
      contactPhone: '555-0181',
      intakeType: 'structured',
      previousNoShows: '3+ times',
      commuteDistance: '15+ miles',
      appointmentType: 'Specialist Consult',
      chiefComplaint: 'Severe burning sensation during urination, intense pelvic pressure, and frequent urge to urinate, though only tiny amounts pass. Urine appears somewhat cloudy and has a strong smell.',
      onsetDuration: 'Began yesterday afternoon, gradually worsening over the past 12 hours.',
      severityLevel: 'Moderate (6/10)',
      medicalHistory: 'History of UTIs (last one was about a year ago, resolved with antibiotics). Not currently pregnant.'
    }
  },
  {
    id: 'routine_refill',
    title: 'Hypertension Refill',
    badge: 'Non-Urgent suspect',
    badgeColor: 'green',
    input: {
      patientName: 'David Kowalski',
      patientAge: '65',
      patientGender: 'Male',
      contactPhone: '555-0153',
      intakeType: 'structured',
      previousNoShows: 'None',
      commuteDistance: '< 5 miles',
      appointmentType: 'Routine Care',
      chiefComplaint: 'Needs a standard 90-day prescription refill for Lisinopril (10mg). No new symptoms, pain, headaches, or dizziness.',
      onsetDuration: 'Current pill bottle has 5 days of medication remaining.',
      severityLevel: 'None / Stable',
      medicalHistory: 'Essential Hypertension (diagnosed 10 years ago), stable on medication. Standard annual physical completed 4 months ago.'
    }
  },
  {
    id: 'john_doe_noshow',
    title: 'John Doe (Booking Risk Case)',
    badge: 'Operational Alert',
    badgeColor: 'yellow',
    input: {
      patientName: 'John Doe',
      patientAge: '42',
      patientGender: 'Male',
      contactPhone: '555-0199',
      intakeType: 'structured',
      previousNoShows: '3+ times',
      commuteDistance: '5-15 miles',
      appointmentType: 'Routine Care',
      bookingMethod: 'phone call',
      requestedSlot: 'friday afternoon',
      chiefComplaint: 'Requesting booking for a high-demand slot on Friday afternoon. Patient missed their last 2 appointments without notice.',
      onsetDuration: 'N/A (Booking Request)',
      severityLevel: '1',
      medicalHistory: 'Missed last 2 appointments without notice. Inbound phone call booking.'
    }
  },
  {
    id: 'jane_smith_noshow',
    title: 'Jane Smith (Operational Case)',
    badge: 'Standard Risk Case',
    badgeColor: 'blue',
    input: {
      patientName: 'Jane Smith',
      patientAge: '35',
      patientGender: 'Female',
      contactPhone: '555-0212',
      intakeType: 'structured',
      previousNoShows: '1-2 times',
      commuteDistance: '< 5 miles',
      appointmentType: 'Routine Care',
      bookingMethod: 'manual register entry',
      requestedSlot: 'mid-week',
      chiefComplaint: 'Routine mid-week checkup booking. History shows occasionally reschedules.',
      onsetDuration: 'N/A (Routine Checkup)',
      severityLevel: '1',
      medicalHistory: 'Occasionally reschedules appointments. Manual register entry booking.'
    }
  }
];
