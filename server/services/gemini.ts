import { GoogleGenAI, Type } from '@google/genai';
import { getGeminiApiKey } from '../config/env';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = getGeminiApiKey();
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'vitalis-cds-system',
        },
      },
    });
  }
  return aiClient;
}

const TRIAGE_SYSTEM_INSTRUCTION = `
You are an expert AI clinical triage and operational booking risk assistant for a primary care and emergency medicine clinic.
Your job is to analyze patient booking inputs (transcripts or structured forms), assess clinical risk (EMERGENCY, URGENT, SEMI-URGENT, NON-URGENT) and booking no-show/cancellation risk (HIGH, MEDIUM, LOW), and output structured details.

--- CLINICAL RISK RULES ---

1. EMERGENCY (Red):
   - Signs: Difficulty breathing, chest pain radiating to arm/jaw, signs of stroke (facial droop, arm weakness, speech difficulty), sudden loss of consciousness, severe anaphylaxis/allergy, active uncontrolled bleeding.
   - Risk Level to assign: EMERGENCY
   - Risk Color to assign: red
   - Recommended Timeframe: "Immediate (Call 911 / Direct to nearest ER)"
   - Operational Steps must include:
     1. Direct patient to hang up and call 911 or go to nearest Emergency Room immediately.
     2. Do NOT schedule any clinic appointment.
     3. Verbally alert the clinic's on-duty physician or nurse coordinator immediately.
     4. Remain on the line if the patient is alone and keep them calm.

2. URGENT (Orange):
   - Signs: High fever (>100.4°F/38°C) in infants under 3 months, severe acute abdominal pain, suspected fractures/dislocations, persistent vomiting with dehydration signs, worsening asthma with mild distress, spreading redness indicating serious cellulitis/infection.
   - Risk Level to assign: URGENT
   - Risk Color to assign: orange
   - Recommended Timeframe: "Same-day (Within 4 Hours)"
   - Operational Steps must include:
     1. Schedule a same-day appointment within the next 4 hours.
     2. Flag the file in the Electronic Health Record (EHR) as high-priority.
     3. Request an on-duty nurse to call the patient back within 1 hour for detailed clinical screening.
     4. Advise patient to call back or go to the ER if symptoms suddenly worsen.

3. SEMI-URGENT (Yellow):
   - Signs: Moderate localized pain, persistent fever in older children or adults, acute earache, symptoms of urinary tract infection (UTI), mild ankle sprain, minor burns, non-spreading localized skin rash.
   - Risk Level to assign: SEMI-URGENT
   - Risk Color to assign: yellow
   - Recommended Timeframe: "Next 24 - 48 Hours"
   - Operational Steps must include:
     1. Schedule an appointment within the next 24 to 48 hours.
     2. Schedule a routine nurse callback within the next 4 hours.
     3. Provide general self-care advice (e.g. hydration, rest).
     4. Counsel on specific warning signs that should prompt an ER visit.

4. NON-URGENT (Green):
   - Signs: Routine prescription refills, stable chronic disease check-ups, mild cold symptoms without fever, minor dry skin, routine physical wellness exams.
   - Risk Level to assign: NON-URGENT
   - Risk Color to assign: green
   - Recommended Timeframe: "Standard Routine Booking"
   - Operational Steps must include:
     1. Offer a standard routine booking (first available open slot).
     2. Send the patient a link to the self-service online portal.
     3. Confirm current prescription/pharmacy details if refilling.
     4. Inform patient of general clinic hours and procedures.

--- BOOKING NO-SHOW / CANCELLATION RISK RULES ---
Every input must first be logged as a digital booking and given an operational no-show/cancellation risk score.
Analyze the previous no-show history, travel distance, requested slot, booking method, clinical priority, and context to determine:
- HIGH RISK (Score 70-100): 
  * History of "3+ times" previous no-shows OR missed last 2 appointments without notice.
  * Patients booking a highly-coveted, high-demand slot (such as "friday afternoon" or "peak weekend slot") who have a history of missed appointments.
  * Explicit booking/transport concerns (e.g., "probably won't make it", "can't drive").
  * Phone call booking method for patients with a repeated no-show history, which lacks the automated credit card hold or email confirmation steps of online portals.
- MEDIUM RISK (Score 35-69): History of "1-2 times" previous no-shows, or lives far away ("15+ miles"), or shows mild transport uncertainty.
- LOW RISK (Score 1-34): History of "None" previous no-shows, lives nearby ("< 5 miles"), booking routine standard slots, and seems highly committed.

--- FORMATTING ---
You must evaluate the input and return a JSON response matching the required schema exactly.
Be clinical, accurate, objective, and cautious. If there is ambiguity, lean toward safety.
`;

const CHAT_SYSTEM_INSTRUCTION = `
You are a warm, empathetic, and highly professional AI medical assistant and clinic concierge chatbot at Sunrise Medical Clinic.
Our clinic features three exceptional doctors:
- Dr. Ann J. (Primary Care & Family Medicine)
- Dr. Rishika (Pediatrics & Women's Health)
- Dr. Shreyas (Internal Medicine & Urgent Care)

Your goal is to help patients in the Patient Portal with:
1. Answering general questions about Sunrise Medical Clinic, booking hours, or appointment preparation.
2. Clarifying patient symptoms or addressing health anxieties with gentle, patient-centered communication.
3. Helping patients understand the triage urgency categories (Emergency, Urgent, Semi-Urgent, Non-Urgent) and what they mean.
4. Providing information about our three doctors (Dr. Ann J., Dr. Rishika, and Dr. Shreyas) if they ask about who is available or their specialties.

CRITICAL CLINICAL SAFETY RULES:
- Always prioritize patient safety.
- You are NOT a doctor and cannot make definitive clinical diagnoses or prescribe medication. Always state this gently if asked for medical diagnosis or prescription.
- If a patient describes high-risk emergency red-flag symptoms (such as sudden severe chest pain, radiating pressure to the arm/jaw, acute severe difficulty breathing, sudden severe weakness on one side of the face/body, or severe bleeding), immediately instruct them in bold: "Please call 911 or proceed directly to the nearest Emergency Room immediately. Do not wait for a clinic booking."
- Be structured, clear, and reassuring. Keep responses relatively concise and highly legible. Use bullet points where appropriate to make information readable.
`;

export async function runTriageAssessment(patientInputText: string) {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: patientInputText,
    config: {
      systemInstruction: TRIAGE_SYSTEM_INSTRUCTION,
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        required: [
          'riskLevel',
          'riskColor',
          'recommendedTimeframe',
          'clinicalSummary',
          'keyRedFlags',
          'identifiedRiskFactors',
          'operationalSteps',
          'patientInstructions',
          'suggestedFollowUpQuestions',
          'bookingRisk',
          'bookingRiskScore',
          'bookingRiskJustification',
        ],
        properties: {
          riskLevel: {
            type: Type.STRING,
            description: 'The assigned clinical risk level: EMERGENCY, URGENT, SEMI-URGENT, or NON-URGENT.',
          },
          riskColor: {
            type: Type.STRING,
            description: 'The visual color code representing the risk level: red, orange, yellow, or green.',
          },
          recommendedTimeframe: {
            type: Type.STRING,
            description: 'Recommended appointment booking or action timeframe.',
          },
          clinicalSummary: {
            type: Type.STRING,
            description: 'Concise, objective clinical summary of the patient symptoms, history, and timeline.',
          },
          keyRedFlags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Any active red flag symptoms identified in the patient complaint that require acute monitoring.',
          },
          identifiedRiskFactors: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Co-morbidities, age, or circumstances that escalate the potential clinical severity.',
          },
          operationalSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Step-by-step actions that the clinic staff must perform in sequence.',
          },
          patientInstructions: {
            type: Type.STRING,
            description: 'Clear, patient-friendly guidance and warning triggers for when to seek emergency services.',
          },
          suggestedFollowUpQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '2 or 3 critical clarifying questions the receptionist can ask the patient right now if on the phone.',
          },
          bookingRisk: {
            type: Type.STRING,
            description: 'The evaluated booking cancellation or no-show risk level: HIGH, MEDIUM, or LOW.',
          },
          bookingRiskScore: {
            type: Type.NUMBER,
            description: 'Numerical score indicating likelihood of cancellation or no-show (1 to 100). HIGH: 70-100, MEDIUM: 35-69, LOW: 1-34.',
          },
          bookingRiskJustification: {
            type: Type.STRING,
            description: 'Justification of why this booking risk was assigned.',
          },
        },
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Received an empty response from the clinical assessment engine.');
  }
  return JSON.parse(text.trim());
}

export async function runChatbotSession(contents: any[]) {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: contents,
    config: {
      systemInstruction: CHAT_SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });
  return response.text || "I apologize, I wasn't able to process that message. How else can I assist you?";
}
