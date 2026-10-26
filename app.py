"""Flask API for the educational synthetic credit-risk demo."""
from pathlib import Path
import os
import joblib
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "credit_risk_model.pkl"

app = Flask(__name__)
CORS(app)  # Open for classroom deployment; restrict origins for production use.

model = None
if MODEL_PATH.exists():
    model = joblib.load(MODEL_PATH)

EMPLOYMENT_CODES = {
    "employed": 0,
    "self_employed": 1,
    "student": 2,
    "unemployed": 3,
}

@app.get("/")
def home():
    return jsonify({
        "name": "Credit Risk Lab API",
        "status": "ok",
        "notice": "Educational demo using synthetic data only."
    })

@app.get("/health")
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})

@app.post("/predict")
def predict():
    if model is None:
        return jsonify({"error": "Model file not found. Run python train_model.py first."}), 503

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Send a JSON object in the request body."}), 400

    required = [
        "annual_income", "outstanding_debt", "loan_amount",
        "credit_history_years", "missed_payments", "employment_status"
    ]
    missing = [key for key in required if key not in data]
    if missing:
        return jsonify({"error": "Missing fields: " + ", ".join(missing)}), 400

    try:
        income = float(data["annual_income"])
        debt = float(data["outstanding_debt"])
        loan = float(data["loan_amount"])
        history = float(data["credit_history_years"])
        missed = int(data["missed_payments"])
        employment_key = str(data["employment_status"]).lower()
        if employment_key not in EMPLOYMENT_CODES:
            raise ValueError("Choose a valid employment status.")
        if not all(np.isfinite(v) for v in [income, debt, loan, history]):
            raise ValueError("Numeric values must be finite.")
        if income <= 0 or debt < 0 or loan < 0:
            raise ValueError("Income must be greater than zero; debt and loan cannot be negative.")
        if history < 0 or history > 80 or missed < 0 or missed > 100:
            raise ValueError("Credit history or missed-payment value is outside the allowed range.")
    except (TypeError, ValueError) as exc:
        return jsonify({"error": str(exc) or "Invalid input values."}), 400

    features = np.array([[income, debt, loan, history, missed, EMPLOYMENT_CODES[employment_key]]])
    category = str(model.predict(features)[0])
    probabilities = model.predict_proba(features)[0]
    confidence = round(float(np.max(probabilities)) * 100, 1)

    # A display-only index, not an actual credit score or probability of default.
    category_base = {"Low": 18, "Medium": 52, "High": 82}[category]
    confidence_adjustment = min(8, max(0, confidence - 60) * 0.15)
    score = int(max(0, min(100, category_base + confidence_adjustment)))
    dti = round((debt / income) * 100, 1)

    notes = []
    if dti >= 40:
        notes.append("Outstanding debt is high relative to annual income in this example.")
    else:
        notes.append("The debt-to-income ratio is below the demo's 40% reference point.")
    if missed >= 2:
        notes.append("The entered number of missed payments is a risk-increasing input in the synthetic data.")
    else:
        notes.append("Few or no missed payments were entered.")
    if history >= 5:
        notes.append("A longer credit-history value tends to reduce risk in this synthetic model.")
    else:
        notes.append("The entered credit-history length is relatively short in this demo.")
    if employment_key in ("student", "unemployed"):
        notes.append("This demo's invented labeling rule assigns an additional risk factor to this status.")

    descriptions = {
        "Low": "The synthetic model placed this example in its lower-risk category.",
        "Medium": "The synthetic model placed this example in its middle-risk category.",
        "High": "The synthetic model placed this example in its higher-risk category."
    }
    return jsonify({
        "risk_category": category,
        "risk_score": score,
        "debt_to_income_ratio": dti,
        "model_confidence": confidence,
        "description": descriptions[category],
        "factor_notes": notes,
        "disclaimer": "Synthetic educational result only; not a real credit score or lending recommendation."
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
