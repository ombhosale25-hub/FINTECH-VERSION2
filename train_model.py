"""Create a Random Forest model from synthetic, illustrative data.

This is for a classroom demo only. The generated labels follow an invented rule
and are not based on actual borrower records or validated credit-risk research.
"""
from pathlib import Path
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

HERE = Path(__file__).resolve().parent
MODEL_PATH = HERE / "credit_risk_model.pkl"
RANDOM_SEED = 42

def create_dataset(n=6000):
    rng = np.random.default_rng(RANDOM_SEED)
    income = rng.integers(120_000, 3_000_001, n)
    debt = rng.integers(0, 1_200_001, n)
    loan = rng.integers(10_000, 1_500_001, n)
    history = rng.choice([0, 2, 5, 8], size=n, p=[0.20, 0.35, 0.25, 0.20])
    missed = rng.choice([0, 1, 2, 3, 4], size=n, p=[0.48, 0.23, 0.14, 0.09, 0.06])
    employment = rng.choice([0, 1, 2, 3], size=n, p=[0.58, 0.20, 0.12, 0.10])
    dti = debt / np.maximum(income, 1)
    loan_income = loan / np.maximum(income, 1)

    # Invented rule to produce consistent synthetic classroom labels.
    risk = (
        0.42 * np.clip(dti, 0, 2)
        + 0.28 * np.clip(loan_income, 0, 2)
        + 0.16 * missed
        - 0.025 * history
        + np.select([employment == 0, employment == 1, employment == 2, employment == 3],
                    [0.0, 0.05, 0.16, 0.20])
        + rng.normal(0, 0.07, n)
    )
    labels = np.where(risk < 0.25, "Low", np.where(risk < 0.62, "Medium", "High"))
    X = np.column_stack([income, debt, loan, history, missed, employment])
    return X, labels

def main():
    X, y = create_dataset()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )
    model = RandomForestClassifier(
        n_estimators=180, max_depth=12, min_samples_leaf=3,
        class_weight="balanced", random_state=RANDOM_SEED, n_jobs=-1
    )
    model.fit(X_train, y_train)
    accuracy = accuracy_score(y_test, model.predict(X_test))
    joblib.dump(model, MODEL_PATH)
    print(f"Synthetic demo model saved to: {MODEL_PATH}")
    print(f"Held-out synthetic-data accuracy: {accuracy:.3f}")
    print("This metric only measures agreement with the invented synthetic labels.")

if __name__ == "__main__":
    main()
