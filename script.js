// After deploying the Flask backend to Render, replace this value with your service URL.
// Example: const API_BASE_URL = "https://your-service-name.onrender.com";
const API_BASE_URL = "https://fintech-credit-risk-api.onrender.com/";

const form = document.getElementById("riskForm");
const button = document.getElementById("predictButton");
const message = document.getElementById("formMessage");
const apiStatus = document.getElementById("apiStatus");

async function checkBackend() {
  if (API_BASE_URL.includes("YOUR-RENDER-SERVICE")) {
    apiStatus.textContent = "Backend URL not set";
    return;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    apiStatus.textContent = data.status === "ok" ? "API is online" : "API unavailable";
  } catch (_) {
    apiStatus.textContent = "API not reachable";
  }
}
checkBackend();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  if (API_BASE_URL.includes("YOUR-RENDER-SERVICE")) {
    message.textContent = "First deploy the backend to Render, then replace API_BASE_URL in script.js.";
    return;
  }

  const payload = {
    annual_income: Number(document.getElementById("income").value),
    outstanding_debt: Number(document.getElementById("debt").value),
    loan_amount: Number(document.getElementById("loan").value),
    credit_history_years: Number(document.getElementById("history").value),
    missed_payments: Number(document.getElementById("missed").value),
    employment_status: document.getElementById("employment").value
  };

  button.disabled = true;
  button.textContent = "Running model…";
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Prediction request failed.");
    showResult(result);
    message.textContent = "";
  } catch (error) {
    message.textContent = `Could not get a prediction: ${error.message}`;
  } finally {
    button.disabled = false;
    button.innerHTML = 'Predict demonstration risk <span>→</span>';
  }
});

function showResult(data) {
  document.getElementById("emptyState").classList.add("hidden");
  document.getElementById("resultContent").classList.remove("hidden");
  document.getElementById("riskLabel").textContent = data.risk_category;
  const pill = document.getElementById("riskPill");
  pill.textContent = `${data.risk_score}/100 illustrative score`;
  pill.className = `risk-pill ${data.risk_category.toLowerCase()}`;
  document.getElementById("resultDescription").textContent = data.description;
  document.getElementById("riskMeter").style.width = `${data.risk_score}%`;
  document.getElementById("dtiMetric").textContent = `${data.debt_to_income_ratio}%`;
  document.getElementById("confidenceMetric").textContent = `${data.model_confidence}%`;
  const list = document.getElementById("factorList");
  list.innerHTML = "";
  data.factor_notes.forEach((note) => {
    const li = document.createElement("li");
    li.textContent = note;
    list.appendChild(li);
  });
}
