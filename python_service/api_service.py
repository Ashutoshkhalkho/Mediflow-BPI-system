import os
import pickle
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Mediflow Python AI & ML Service")

# Get Gemini API key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    # Try looking in parent directories if not found (Express might run from root)
    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path)
        api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Warning: GEMINI_API_KEY not found in environment. Gemini calls will fail.")

client = genai.Client(api_key=api_key)

# Load ML model
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'booking_risk_model.pkl')
model = None

def load_ml_model():
    global model
    try:
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            print("Successfully loaded scikit-learn ML model.")
        else:
            print("ML model not found. Attempting to train model first...")
            try:
                from train_model import train
                train()
                if os.path.exists(MODEL_PATH):
                    with open(MODEL_PATH, 'rb') as f:
                        model = pickle.load(f)
                    print("Successfully trained and loaded scikit-learn ML model.")
            except Exception as train_err:
                print(f"Failed to auto-train ML model: {train_err}")
    except Exception as e:
        print(f"Error loading ML model: {e}")

# Load model at startup
load_ml_model()

# --- INPUT/OUTPUT SCHEMAS ---

class TriageInput(BaseModel):
    patientName: str
    patientAge: Optional[str] = None
    patientGender: Optional[str] = None
    contactPhone: Optional[str] = None
    intakeType: str
    chiefComplaint: Optional[str] = None
    onsetDuration: Optional[str] = None
    severityLevel: Optional[str] = None
    medicalHistory: Optional[str] = None
    rawTranscript: Optional[str] = None
    previousNoShows: Optional[str] = None
    commuteDistance: Optional[str] = None
    appointmentType: Optional[str] = None
    bookingMethod: Optional[str] = None
    requestedSlot: Optional[str] = None

class ClinicalTriageResponse(BaseModel):
    riskLevel: str = Field(description="The assigned clinical risk level: EMERGENCY, URGENT, SEMI-URGENT, or NON-URGENT.")
    riskColor: str = Field(description="The visual color code representing the risk level: red, orange, yellow, or green.")
    recommendedTimeframe: str = Field(description="Recommended appointment booking or action timeframe.")
    clinicalSummary: str = Field(description="Concise, objective clinical summary of the patient symptoms, history, and timeline.")
    keyRedFlags: List[str] = Field(description="Any active red flag symptoms identified in the patient complaint that require acute monitoring.")
    identifiedRiskFactors: List[str] = Field(description="Co-morbidities, age, or circumstances that escalate the potential clinical severity.")
    operationalSteps: List[str] = Field(description="Step-by-step actions that the clinic staff must perform in sequence.")
    patientInstructions: str = Field(description="Clear, patient-friendly guidance and warning triggers for when to seek emergency services.")
    suggestedFollowUpQuestions: List[str] = Field(description="2 or 3 critical clarifying questions the receptionist can ask the patient right now if on the phone.")

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatInput(BaseModel):
    messages: List[ChatMessage]

# --- SYSTEM INSTRUCTIONS ---

TRIAGE_SYSTEM_INSTRUCTION = """
You are an expert AI clinical triage assistant for a primary care and emergency medicine clinic.
Your job is to analyze patient booking inputs (transcripts or structured forms), assess clinical risk (EMERGENCY, URGENT, SEMI-URGENT, NON-URGENT), and output structured details.

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

You must evaluate the input and return a JSON response matching the required schema exactly.
Be clinical, accurate, objective, and cautious. If there is ambiguity, lean toward safety.
"""

CHAT_SYSTEM_INSTRUCTION = """
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
"""

# --- HELPERS ---

def generate_content_with_fallback(contents: str, system_instruction: str, response_schema=None, temperature: float = 0.1):
    primary_model = "gemini-3.5-flash"
    fallback_model = "gemini-2.5-flash"
    
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=temperature,
    )
    if response_schema:
        config.response_mime_type = "application/json"
        config.response_schema = response_schema
        
    try:
        response = client.models.generate_content(
            model=primary_model,
            contents=contents,
            config=config
        )
        return response.text
    except Exception as e:
        print(f"Primary model {primary_model} failed: {e}. Trying fallback {fallback_model}...")
        response = client.models.generate_content(
            model=fallback_model,
            contents=contents,
            config=config
        )
        return response.text

# --- FEATURE MAPPINGS FOR ML MODEL ---

def map_no_shows(val: str) -> int:
    val = str(val).lower()
    if "3+" in val: return 2
    if "1-2" in val: return 1
    return 0

def map_commute(val: str) -> int:
    val = str(val).lower()
    if "15+" in val: return 2
    if "5-15" in val or "5 to 15" in val: return 1
    return 0

def map_booking_method(val: str) -> int:
    val = str(val).lower()
    if "phone" in val: return 1
    if "walk-in" in val or "walkin" in val: return 2
    return 0

def map_appointment_type(val: str) -> int:
    val = str(val).lower()
    if "special" in val: return 1
    if "urgent" in val: return 2
    return 0

def map_requested_slot(val: str) -> int:
    val = str(val).lower()
    if "friday" in val or "weekend" in val: return 2
    if "mid-day" in val or "afternoon" in val: return 1
    return 0

# --- ENDPOINTS ---

@app.get("/api/python/health")
def health_check():
    return {
        "status": "healthy",
        "has_api_key": bool(api_key),
        "ml_model_loaded": model is not None
    }

@app.post("/api/python/triage")
def run_triage(triage_input: TriageInput):
    # Formulate patient text for Gemini
    if triage_input.intakeType == 'raw':
        patient_input_text = f"""
[PATIENT DEMOGRAPHICS]
Name: {triage_input.patientName}
Age: {triage_input.patientAge or 'Unknown'}
Gender: {triage_input.patientGender or 'Unknown'}
Contact: {triage_input.contactPhone or 'Unknown'}

[BOOKING PROFILE]
Booking Method: {triage_input.bookingMethod or 'Not explicitly provided'}
Requested Slot: {triage_input.requestedSlot or 'Not explicitly provided'}
Previous No-Shows: {triage_input.previousNoShows or 'Not explicitly provided in form (extract if mentioned)'}
Commute Distance: {triage_input.commuteDistance or 'Not explicitly provided in form (extract if mentioned)'}
Appointment Type: {triage_input.appointmentType or 'Not explicitly provided'}

[RAW LOG / TELEPHONE CALL TRANSCRIPT]
{triage_input.rawTranscript or 'No transcript provided.'}
"""
    else:
        patient_input_text = f"""
[PATIENT DEMOGRAPHICS]
Name: {triage_input.patientName}
Age: {triage_input.patientAge or 'Unknown'}
Gender: {triage_input.patientGender or 'Unknown'}
Contact: {triage_input.contactPhone or 'Unknown'}

[BOOKING PROFILE]
Booking Method: {triage_input.bookingMethod or 'online'}
Requested Slot: {triage_input.requestedSlot or 'standard open slot'}
Previous No-Shows: {triage_input.previousNoShows or 'None'}
Commute Distance: {triage_input.commuteDistance or '< 5 miles'}
Appointment Type: {triage_input.appointmentType or 'Routine Care'}

[STRUCTURED SYMPTOMS FORM]
Chief Complaint: {triage_input.chiefComplaint or 'Unknown'}
Onset & Duration: {triage_input.onsetDuration or 'Unknown'}
Reported Severity: {triage_input.severityLevel or 'Unknown'}
Known Medical History/Chronic Conditions/Risk Factors: {triage_input.medicalHistory or 'None provided'}
"""

    try:
        # Call Gemini for Clinical Triage
        raw_clinical_json = generate_content_with_fallback(
            contents=patient_input_text,
            system_instruction=TRIAGE_SYSTEM_INSTRUCTION,
            response_schema=ClinicalTriageResponse,
            temperature=0.1
        )
        
        # Parse Gemini response
        clinical_data = ClinicalTriageResponse.model_validate_json(raw_clinical_json)
        
        # Run ML model for Booking No-Show Risk
        score = 10
        if model is not None:
            features = [[
                map_no_shows(triage_input.previousNoShows or ""),
                map_commute(triage_input.commuteDistance or ""),
                map_booking_method(triage_input.bookingMethod or ""),
                map_appointment_type(triage_input.appointmentType or ""),
                map_requested_slot(triage_input.requestedSlot or "")
            ]]
            try:
                # get probability of class 1 (no-show)
                no_show_prob = model.predict_proba(features)[0][1]
                score = int(no_show_prob * 100)
            except Exception as ml_err:
                print(f"Error running model prediction: {ml_err}")
                score = 10
                
        # Determine booking risk level category
        if score >= 70:
            booking_risk = "HIGH"
        elif score >= 35:
            booking_risk = "MEDIUM"
        else:
            booking_risk = "LOW"
            
        # Build explanation justification dynamically based on features
        justification_parts = []
        no_shows_val = triage_input.previousNoShows or "None"
        commute_val = triage_input.commuteDistance or "< 5 miles"
        slot_val = triage_input.requestedSlot or "standard slot"
        method_val = triage_input.bookingMethod or "online"
        
        if "3+" in no_shows_val:
            justification_parts.append("history of repeated no-shows (3+ times)")
        elif "1-2" in no_shows_val:
            justification_parts.append("history of 1-2 previous no-shows")
            
        if "15+" in commute_val:
            justification_parts.append("long travel distance (15+ miles)")
            
        if "friday" in slot_val.lower() or "weekend" in slot_val.lower():
            justification_parts.append("highly coveted/peak slot request")
            
        if "phone" in method_val.lower():
            justification_parts.append("phone call booking method (lacks email or CC verification)")
            
        if not justification_parts:
            justification = f"ML model predicted a low no-show probability ({score}%) due to stable attendance record, short commute, and standard slot selection."
        else:
            justification = f"Python scikit-learn Random Forest model computed a {score}% risk score due to: " + ", ".join(justification_parts) + "."

        # Combine clinical and operational results
        result = {
            "riskLevel": clinical_data.riskLevel,
            "riskColor": clinical_data.riskColor,
            "recommendedTimeframe": clinical_data.recommendedTimeframe,
            "clinicalSummary": clinical_data.clinicalSummary,
            "keyRedFlags": clinical_data.keyRedFlags,
            "identifiedRiskFactors": clinical_data.identifiedRiskFactors,
            "operationalSteps": clinical_data.operationalSteps,
            "patientInstructions": clinical_data.patientInstructions,
            "suggestedFollowUpQuestions": clinical_data.suggestedFollowUpQuestions,
            
            # Machine Learning predictions
            "bookingRisk": booking_risk,
            "bookingRiskScore": score,
            "bookingRiskJustification": justification
        }
        
        return result
        
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.post("/api/python/chat")
def run_chat(chat_input: ChatInput):
    try:
        # Convert message history to google-genai format
        contents = []
        for msg in chat_input.messages:
            role = "model" if msg.role == "assistant" else "user"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg.content)]
                )
            )
            
        reply = generate_content_with_fallback(
            contents=contents,
            system_instruction=CHAT_SYSTEM_INSTRUCTION,
            temperature=0.7
        )
        return {"reply": reply}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

if __name__ == '__main__':
    import uvicorn
    port = int(os.getenv("PORT", 8009))
    uvicorn.run("api_service:app", host="0.0.0.0", port=port, reload=True)
