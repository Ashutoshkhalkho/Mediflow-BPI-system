import { Router } from 'express';
import { runTriageAssessment } from '../services/gemini';

const router = Router();

// AI Triage API Route
router.post('/', async (req, res) => {
  try {
    const {
      patientName,
      patientAge,
      patientGender,
      contactPhone,
      intakeType,
      chiefComplaint,
      onsetDuration,
      severityLevel,
      medicalHistory,
      rawTranscript,
      previousNoShows,
      commuteDistance,
      appointmentType,
      bookingMethod,
      requestedSlot,
    } = req.body;

    // Validate request body
    if (!patientName) {
      return res.status(400).json({ error: 'Patient name is required.' });
    }

    // Build the user payload for the model based on intake type
    let patientInputText = '';
    if (intakeType === 'raw') {
      patientInputText = `
[PATIENT DEMOGRAPHICS]
Name: ${patientName}
Age: ${patientAge || 'Unknown'}
Gender: ${patientGender || 'Unknown'}
Contact: ${contactPhone || 'Unknown'}

[BOOKING PROFILE]
Booking Method: ${bookingMethod || 'Not explicitly provided'}
Requested Slot: ${requestedSlot || 'Not explicitly provided'}
Previous No-Shows: ${previousNoShows || 'Not explicitly provided in form (extract if mentioned)'}
Commute Distance: ${commuteDistance || 'Not explicitly provided in form (extract if mentioned)'}
Appointment Type: ${appointmentType || 'Not explicitly provided'}

[RAW LOG / TELEPHONE CALL TRANSCRIPT]
${rawTranscript || 'No transcript provided.'}
`;
    } else {
      patientInputText = `
[PATIENT DEMOGRAPHICS]
Name: ${patientName}
Age: ${patientAge || 'Unknown'}
Gender: ${patientGender || 'Unknown'}
Contact: ${contactPhone || 'Unknown'}

[BOOKING PROFILE]
Booking Method: ${bookingMethod || 'online'}
Requested Slot: ${requestedSlot || 'standard open slot'}
Previous No-Shows: ${previousNoShows || 'None'}
Commute Distance: ${commuteDistance || '< 5 miles'}
Appointment Type: ${appointmentType || 'Routine Care'}

[STRUCTURED SYMPTOMS FORM]
Chief Complaint: ${chiefComplaint || 'Unknown'}
Onset & Duration: ${onsetDuration || 'Unknown'}
Reported Severity: ${severityLevel || 'Unknown'} (on standard scale)
Known Medical History/Chronic Conditions/Risk Factors: ${medicalHistory || 'None provided'}
`;
    }

    const triageResult = await runTriageAssessment(patientInputText);
    res.json(triageResult);
  } catch (error: any) {
    console.error('Triage Error:', error);
    res.status(500).json({
      error: error.message || 'An unexpected error occurred during triage assessment.',
    });
  }
});

export default router;
