const display = document.querySelector('#displayValue');
const expressionPreview = document.querySelector('#expressionPreview');
const memoryIndicator = document.querySelector('#memoryIndicator');
const historyList = document.querySelector('#historyList');
const history = [];

let currentValue = '0';
let storedValue = null;
let pendingOperator = null;
let shouldResetDisplay = false;

function updateDisplay() {
  display.textContent = currentValue;
  expressionPreview.textContent = storedValue !== null && pendingOperator ? `${formatNumber(storedValue)} ${pendingOperator}` : '';
  memoryIndicator.textContent = pendingOperator ? 'WAITING' : 'READY';
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Error';
  return number.toLocaleString('en-US', { maximumFractionDigits: 10, useGrouping: false });
}

function inputDigit(digit) {
  if (shouldResetDisplay || currentValue === 'Error') {
    currentValue = digit;
    shouldResetDisplay = false;
  } else {
    currentValue = currentValue === '0' ? digit : currentValue + digit;
  }
  updateDisplay();
}

function inputDecimal() {
  if (shouldResetDisplay || currentValue === 'Error') {
    currentValue = '0.';
    shouldResetDisplay = false;
  } else if (!currentValue.includes('.')) {
    currentValue += '.';
  }
  updateDisplay();
}

function chooseOperator(operator) {
  if (currentValue === 'Error') return;
  if (storedValue !== null && pendingOperator && !shouldResetDisplay) calculate(false);
  storedValue = Number(currentValue);
  pendingOperator = operator;
  shouldResetDisplay = true;
  updateDisplay();
}

function calculate(addToHistory = true) {
  if (storedValue === null || !pendingOperator || currentValue === 'Error') return;
  const left = storedValue;
  const right = Number(currentValue);
  let result;
  if (pendingOperator === '+') result = left + right;
  if (pendingOperator === '−') result = left - right;
  if (pendingOperator === '×') result = left * right;
  if (pendingOperator === '÷') result = right === 0 ? null : left / right;

  const expression = `${formatNumber(left)} ${pendingOperator} ${formatNumber(right)}`;
  if (result === null || !Number.isFinite(result)) {
    currentValue = 'Error';
    expressionPreview.textContent = 'Cannot divide by zero';
  } else {
    currentValue = formatNumber(result);
    if (addToHistory) addHistory(expression, currentValue);
  }
  storedValue = null;
  pendingOperator = null;
  shouldResetDisplay = true;
  updateDisplay();
  if (result === null) expressionPreview.textContent = 'Cannot divide by zero';
}

function clearCalculator() {
  currentValue = '0';
  storedValue = null;
  pendingOperator = null;
  shouldResetDisplay = false;
  updateDisplay();
}

function backspace() {
  if (shouldResetDisplay || currentValue === 'Error') return;
  currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '0';
  updateDisplay();
}

function percent() {
  if (currentValue !== 'Error') {
    currentValue = formatNumber(Number(currentValue) / 100);
    updateDisplay();
  }
}

function addHistory(expression, result) {
  history.unshift({ expression, result });
  if (history.length > 5) history.pop();
  historyList.innerHTML = history.map(item => `<div class="history-item"><span class="history-expression">${item.expression}</span><span class="history-result">= ${item.result}</span></div>`).join('');
}

document.querySelector('.keypad').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const { value, action } = button.dataset;
  if (value && /^\d$/.test(value)) inputDigit(value);
  else if (value === '.') inputDecimal();
  else if (['+', '−', '×', '÷'].includes(value)) chooseOperator(value);
  else if (action === 'equals') calculate();
  else if (action === 'clear') clearCalculator();
  else if (action === 'backspace') backspace();
  else if (action === 'percent') percent();
});

document.addEventListener('keydown', (event) => {
  if (/^\d$/.test(event.key)) inputDigit(event.key);
  else if (event.key === '.') inputDecimal();
  else if (event.key === '+') chooseOperator('+');
  else if (event.key === '-') chooseOperator('−');
  else if (event.key === '*') chooseOperator('×');
  else if (event.key === '/') { event.preventDefault(); chooseOperator('÷'); }
  else if (event.key === 'Enter' || event.key === '=') calculate();
  else if (event.key === 'Escape') clearCalculator();
  else if (event.key === 'Backspace') backspace();
  else if (event.key === '%') percent();
});

document.querySelector('#clearHistory').addEventListener('click', () => {
  history.length = 0;
  historyList.innerHTML = '<p class="empty-history">Your completed calculations will appear here.</p>';
});

document.querySelector('#themeToggle').addEventListener('click', () => document.body.classList.toggle('warm'));
updateDisplay();
