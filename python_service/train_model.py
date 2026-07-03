import os
import sys
import json
import pickle
import warnings
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# Suppress sklearn and other runtime warnings
warnings.filterwarnings("ignore")

# Define target save path
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'booking_risk_model.pkl')

def generate_synthetic_data(num_samples=1000):
    np.random.seed(42)
    
    # Feature ranges and probabilities
    # previous_no_shows: 0 (None), 1 (1-2 times), 2 (3+ times)
    prev_no_shows = np.random.choice([0, 1, 2], size=num_samples, p=[0.7, 0.2, 0.1])
    
    # commute_distance: 0 (< 5 miles), 1 (5-15 miles), 2 (15+ miles)
    commute_dist = np.random.choice([0, 1, 2], size=num_samples, p=[0.5, 0.3, 0.2])
    
    # booking_method: 0 (online), 1 (phone call), 2 (walk-in)
    booking_meth = np.random.choice([0, 1, 2], size=num_samples, p=[0.6, 0.3, 0.1])
    
    # appointment_type: 0 (Routine Care), 1 (Specialist Consult), 2 (Urgent Intake)
    appt_type = np.random.choice([0, 1, 2], size=num_samples, p=[0.6, 0.3, 0.1])
    
    # requested_slot: 0 (morning), 1 (mid-day), 2 (friday afternoon)
    req_slot = np.random.choice([0, 1, 2], size=num_samples, p=[0.4, 0.4, 0.2])
    
    # Build dataframe
    df = pd.DataFrame({
        'previous_no_shows': prev_no_shows,
        'commute_distance': commute_dist,
        'booking_method': booking_meth,
        'appointment_type': appt_type,
        'requested_slot': req_slot
    })
    
    # Determine ground truth probability based on rules
    # 1. Base probability: 10%
    probs = np.full(num_samples, 0.10)
    
    # 2. Add impact of previous no-shows
    # 3+ times: +50%, 1-2 times: +25%
    probs += np.where(df['previous_no_shows'] == 2, 0.50, 0.0)
    probs += np.where(df['previous_no_shows'] == 1, 0.25, 0.0)
    
    # 3. Add impact of Friday afternoon/weekend slots
    # Friday afternoon: +15%
    probs += np.where(df['requested_slot'] == 2, 0.15, 0.0)
    
    # 4. Add impact of phone calls with history
    # Phone call + previous no-shows: +15%
    probs += np.where((df['booking_method'] == 1) & (df['previous_no_shows'] > 0), 0.15, 0.0)
    
    # 5. Add impact of long commute distance
    # 15+ miles: +15%, 5-15 miles: +5%
    probs += np.where(df['commute_distance'] == 2, 0.15, 0.0)
    probs += np.where(df['commute_distance'] == 1, 0.05, 0.0)
    
    # Cap probabilities between 0.01 and 0.99
    probs = np.clip(probs, 0.01, 0.99)
    
    # Generate binary label (no-show = 1, show = 0)
    df['no_show'] = np.random.binomial(1, probs)
    
    return df

def train():
    print("Generating synthetic patient booking data...")
    df = generate_synthetic_data(1200)
    
    X = df[['previous_no_shows', 'commute_distance', 'booking_method', 'appointment_type', 'requested_slot']]
    y = df['no_show']
    
    print("Training RandomForest model on booking features...")
    model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
    model.fit(X, y)
    
    # Save the model
    print(f"Saving trained model to {MODEL_PATH}...")
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    
    print("Model training complete!")

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

def predict():
    try:
        # Check if model exists, train if not
        if not os.path.exists(MODEL_PATH):
            train()
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load or train model: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

    try:
        # Read all inputs from stdin
        input_data = sys.stdin.read().strip()
        if not input_data:
            print(json.dumps({"error": "No input provided on stdin"}), file=sys.stderr)
            sys.exit(1)
        
        data = json.loads(input_data)
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse JSON input: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

    is_list = isinstance(data, list)
    items = data if is_list else [data]
    results = []

    for item in items:
        try:
            prev_no_shows = map_no_shows(item.get("previousNoShows", ""))
            commute = map_commute(item.get("commuteDistance", ""))
            booking_method = map_booking_method(item.get("bookingMethod", ""))
            appt_type = map_appointment_type(item.get("appointmentType", ""))
            req_slot = map_requested_slot(item.get("requestedSlot", ""))
            
            features = pd.DataFrame(
                [[prev_no_shows, commute, booking_method, appt_type, req_slot]],
                columns=['previous_no_shows', 'commute_distance', 'booking_method', 'appointment_type', 'requested_slot']
            )
            
            no_show_prob = model.predict_proba(features)[0][1]
            score = int(no_show_prob * 100)
            
            if score >= 70:
                booking_risk = "HIGH"
            elif score >= 35:
                booking_risk = "MEDIUM"
            else:
                booking_risk = "LOW"

            justification_parts = []
            no_shows_val = item.get("previousNoShows", "None")
            commute_val = item.get("commuteDistance", "< 5 miles")
            slot_val = item.get("requestedSlot", "standard slot")
            method_val = item.get("bookingMethod", "online")
            
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
            
            results.append({
                "bookingRisk": booking_risk,
                "bookingRiskScore": score,
                "bookingRiskJustification": justification
            })
        except Exception as e:
            results.append({
                "error": f"Error predicting for item: {str(e)}",
                "bookingRisk": "LOW",
                "bookingRiskScore": 10,
                "bookingRiskJustification": "Fallback due to prediction error."
            })

    if is_list:
        print(json.dumps(results))
    else:
        print(json.dumps(results[0]))

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--predict':
        predict()
    else:
        train()
