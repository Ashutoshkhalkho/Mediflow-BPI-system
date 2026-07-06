# MediFlow Agent Prototype System 🩺🚀

MediFlow is an AI-powered Clinical Decision Support (CDS) and operational booking risk management prototype designed for primary care and emergency clinics. It assists clinic receptionists and patients by analyzing health symptoms, identifying clinical urgency categories, predicting patient no-show/cancellation risks, and providing sequential operational workflows.

---

## 🛠️ Technology Stack
* **Frontend**: React (Vite), TailwindCSS, Motion, Lucide Icons, TypeScript
* **Backend API Gateway**: Node.js (Express), TypeScript
* **Microservices & Machine Learning**: Python (FastAPI, Uvicorn, scikit-learn, Pandas)
* **AI Model Engine**: Google Gemini API (`@google/genai` and `google-genai` Python SDKs)

---

## ✨ Key Features

### 1. Receptionist Console
* **Symptom Triage (Multi-mode Ingestion)**:
  * **Structured Form**: Collects demographics and structured symptom details (complaint, severity, onset).
  * **Call Transcript / Raw Log**: Leverages Gemini to parse raw phone transcripts, extracting symptoms, onset, and history automatically.
  * **Batch CSV Ingestion**: Allows drag-and-drop/browse of patient list CSV files to run sequential, rate-limited clinical and booking assessments in batches.
* **Neural Urgency Sorting**: Evaluates patients into four clinical priority categories:
  * 🔴 **EMERGENCY** (Immediate ER redirection)
  * 🟠 **URGENT** (Same-day booking within 4 hours)
  * 🟡 **SEMI-URGENT** (Clinic booking within 24-48 hours)
  * 🟢 **NON-URGENT** (Routine wellness checkup / refill booking)
* **ML No-Show Predictor**: Spawns a scikit-learn Random Forest model to calculate appointment cancellation probability based on distance, time slot, appointment type, booking method, and no-show history.
* **Clinic Resource Monitor**: Simulates waiting room load, bed counts, and nurse availability.
* **Dynamic Operational Workflows**: Generates customized checklists for clinic staff, including laboratory prep instructions, triage physician notifications, and copyable patient advice.
* **Session Case Registry**: Keeps a search-friendly, filterable list of all cases in the current session with options to write notes, change status, and **Export logs to CSV**.

### 2. Patient Portal
* **Intake Form**: Simple form to report symptoms and demographics.
* **Empathetic AI Chatbot**: Patient-concierge chatbot answering questions about clinic hours, doctor specialties (Dr. Ann, Dr. Rishika, Dr. Shreyas), appointment prep, and health guidelines.
* **Immediate Guidance**: Displays clear arrival timeframes and symptom emergency triggers.

---

## 📂 Project Structure

```
mediflow-agent-prototype-system/
├── server.ts                  # App startup (spawns FastAPI and serves Vite Express app)
├── app.ts                     # Main Express routes routing config
├── package.json               # Frontend and Backend Node dependencies
├── tsconfig.json              # TypeScript compilation rules
├── vite.config.ts             # Vite server config
├── patients_test.csv          # Sample patient CSV list for testing batch upload
├── src/                       # React Frontend Source Code
│   ├── App.tsx                # Main state hub and Bento Layout
│   ├── main.tsx               # Client entrypoint
│   ├── types.ts               # Shared TypeScript schemas
│   ├── components/            # UI Components
│   │   ├── Header.tsx         # Top navigation and user role selection
│   │   ├── TriageForm.tsx     # Ingestion forms (Structured, Raw, CSV Ingest)
│   │   ├── TriageResults.tsx  # Display panel for clinical risk assessment
│   │   ├── ResourceMonitor.tsx# Clinic room load and nurse roster sliders
│   │   ├── OperationalWorkflows.tsx # Checklists for clinical action plans
│   │   ├── TriageHistory.tsx  # History record logs grid with CSV export
│   │   ├── PatientView.tsx    # Patient-portal layout wrapper
│   │   ├── PatientChatbot.tsx # Empathic portal assistant chatbot
│   │   └── RulesReference.tsx # Modal detailing clinic triage protocols
│   └── data/
│       └── samples.ts         # Preset cases for testing
├── server/                    # Node.js Express Backend
│   ├── routes/                # Express API Endpoints (Triage, Chat, Health)
│   └── services/
│       ├── gemini.ts          # Node-based Gemini assessment & chatbot client
│       ├── predictor.ts       # Spawn runner for Python prediction
│       └── python_runner.ts   # Provisioner & starter for the FastAPI microservice
└── python_service/            # Python FastAPI Microservice
    ├── requirements.txt       # Python library dependencies
    ├── api_service.py         # FastAPI routes (Triage, Chat, Health check)
    ├── train_model.py         # scikit-learn model trainer & predict script
    └── booking_risk_model.pkl # Trained Random Forest classifier binary
```

---

## 🚀 Setup & Installation

### Prerequisites
1. **Node.js**: Version 18+ (comes with npm)
2. **Python**: Version 3.8+ (must be in your system environment PATH variable)
3. **Gemini API Key**: A valid key from Google AI Studio

### Configuration
Create a `.env` file in the project root directory and define the following variables:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
APP_URL="http://localhost:3000"
```

---

## 🏃 Running the Application

1. **Install Node Dependencies**:
   Open a terminal in the root directory and run:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   * *Note*: The server runner automatically checks for the Python virtual environment (`.venv`), installs dependencies from `requirements.txt`, trains the ML model if `booking_risk_model.pkl` is missing, and starts the FastAPI server in the background on port `8009` before starting the Node server on port `3000`.

3. **Access the Application**:
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 📋 CSV Upload Format Guidelines
When using the **Batch CSV Ingestion** tab, ensure your file contains the following structure.

### Column Mapping
* **Required**: `patientName` (or `Name`, `Patient Name`)
* **Optional**: 
  * `patientAge` / `Age`
  * `patientGender` / `Gender`
  * `contactPhone` / `Phone`
  * `chiefComplaint` / `symptoms` / `Complaint`
  * `onsetDuration` / `Onset`
  * `severityLevel` / `Severity`
  * `medicalHistory` / `History`
  * `previousNoShows` / `no-shows` (Supports: `None`, `1-2 times`, `3+ times`)
  * `commuteDistance` / `distance` (Supports: `< 5 miles`, `5-15 miles`, `15+ miles`)
  * `appointmentType` / `type` (Supports: `Routine Care`, `Specialist Consult`, `Urgent Intake`)
  * `bookingMethod` / `method` (Supports: `online`, `phone call`, `walk-in`)
  * `requestedSlot` / `slot` (Supports: `morning`, `mid-day`, `friday afternoon`, etc.)

*You can copy a raw CSV template directly from the CSV Ingestion tab by clicking the "Copy Template" button.*
