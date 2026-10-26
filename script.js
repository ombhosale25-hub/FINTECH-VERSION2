const form = document.getElementById('assessment-form');
const emptyState = document.getElementById('empty-state');
const resultContent = document.getElementById('result-content');
let latestAssessment = null;

function money(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function assess(data) {
  const income = Number(data.income);
  const debt = Number(data.debt);
  const loan = Number(data.loan);
  const years = Number(data.history);
  const missed = Number(data.missed);
  const employment = data.employment;
  const debtRatio = income > 0 ? (debt / income) * 100 : 100;
  const loanRatio = income > 0 ? (loan / income) * 100 : 100;

  // Clearly labeled illustrative rules for a front-end demo, not a trained ML model.
  let score = 70;
  if (debtRatio < 10) score += 10;
  else if (debtRatio < 25) score += 5;
  else if (debtRatio > 50) score -= 18;
  else if (debtRatio > 30) score -= 10;

  if (loanRatio > 60) score -= 10;
  else if (loanRatio > 35) score -= 5;
  if (years >= 8) score += 8;
  else if (years >= 4) score += 5;
  else if (years === 0) score -= 8;
  score -= missed * 12;
  if (employment === 'stable') score += 5;
  if (employment === 'unstable') score -= 8;
  score = Math.max(0, Math.min(100, score));

  let category = score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'Needs review';
  let risk = score >= 75 ? 'Low' : score >= 50 ? 'Medium' : 'High';
  const reasons = [];
  reasons.push(debtRatio <= 25
    ? `Outstanding debt is ${debtRatio.toFixed(1)}% of annual income in this example.`
    : `Debt is relatively high compared with annual income (${debtRatio.toFixed(1)}%).`);
  reasons.push(missed === 0 ? 'No missed payments were entered.' : `${missed >= 3 ? 'Three or more' : missed} missed payment(s) were entered; payment history can be an important risk indicator.`);
  reasons.push(years >= 4 ? 'The entered credit history is at least four years.' : 'A shorter credit history gives the example less history to assess.');
  reasons.push(employment === 'stable' ? 'Stable employment was selected.' : employment === 'self' ? 'Self-employment was selected; income consistency may need more context.' : 'Irregular employment was selected; income stability may need more context.');

  return { score, category, risk, debtRatio, loanRatio, income, debt, loan, years, missed, employment, reasons };
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const income = Number(document.getElementById('income').value);
  const debt = Number(document.getElementById('debt').value);
  const loan = Number(document.getElementById('loan').value);
  if (income <= 0) {
    alert('Please enter annual income greater than ₹0 for this demonstration.');
    return;
  }
  if (debt < 0 || loan < 0) {
    alert('Debt and loan amount cannot be negative.');
    return;
  }
  const data = {
    income,
    debt,
    loan,
    history: document.getElementById('history').value,
    missed: document.getElementById('missed').value,
    employment: document.getElementById('employment').value
  };
  latestAssessment = assess(data);
  render(latestAssessment);
});

function render(result) {
  emptyState.hidden = true;
  resultContent.hidden = false;
  document.getElementById('score').textContent = result.score;
  document.getElementById('ring-number').textContent = result.score;
  document.getElementById('score-ring').style.setProperty('--score', result.score);
  document.getElementById('category').textContent = result.category;
  const riskEl = document.getElementById('risk');
  riskEl.textContent = result.risk;
  riskEl.className = result.risk === 'Low' ? 'risk-low' : result.risk === 'Medium' ? 'risk-medium' : 'risk-high';
  document.getElementById('ratio').textContent = `${result.debtRatio.toFixed(1)}%`;
  document.getElementById('ratio-bar').style.width = `${Math.min(result.debtRatio, 100)}%`;
  const list = document.getElementById('reasons');
  list.replaceChildren();
  result.reasons.forEach(reason => {
    const li = document.createElement('li');
    li.textContent = reason;
    list.appendChild(li);
  });
}

document.getElementById('reset-btn').addEventListener('click', () => {
  setTimeout(() => {
    emptyState.hidden = false;
    resultContent.hidden = true;
    latestAssessment = null;
  }, 0);
});

document.getElementById('download-btn').addEventListener('click', () => {
  if (!latestAssessment) return;
  const r = latestAssessment;
  const text = [
    'CreditLens - Illustrative Credit Risk Assessment',
    'Educational demo only; not an official credit score or lending recommendation.',
    '',
    `Illustrative score index: ${r.score}/100`,
    `Credit category: ${r.category}`,
    `Estimated risk: ${r.risk}`,
    `Annual income: ${money(r.income)}`,
    `Outstanding debt: ${money(r.debt)}`,
    `Loan amount requested: ${money(r.loan)}`,
    `Debt-to-income indicator: ${r.debtRatio.toFixed(1)}%`,
    '',
    'Factors:',
    ...r.reasons.map(reason => `- ${reason}`)
  ].join('\\n');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'credit-risk-assessment-demo.txt';
  a.click();
  URL.revokeObjectURL(url);
});
