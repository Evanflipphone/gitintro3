const canvas = document.querySelector('#graphCanvas');
const context = canvas.getContext('2d');
const expressionList = document.querySelector('#expressionList');
const zoomLabel = document.querySelector('#zoomLabel');
const graphStatus = document.querySelector('#graphStatus');
const colors = ['#e96855', '#287b5d', '#477bc5', '#b36a2d', '#8c55b5'];
const expressions = [
  { value: 'y = x^2', color: colors[0] },
  { value: 'y = sin(x)', color: colors[1] }
];
let scale = 38;
let origin = { x: 0, y: 0 };
let dragging = false;
let dragStart;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const bounds = canvas.getBoundingClientRect();
  canvas.width = bounds.width * ratio;
  canvas.height = bounds.height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawGraph();
}

function drawGraph() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  context.clearRect(0, 0, width, height);
  const centerX = width / 2 + origin.x;
  const centerY = height / 2 + origin.y;
  const gridStep = scale;
  for (let x = centerX % gridStep; x < width; x += gridStep) drawLine(x, 0, x, height, '#e8eee9');
  for (let y = centerY % gridStep; y < height; y += gridStep) drawLine(0, y, width, y, '#e8eee9');
  drawLine(centerX, 0, centerX, height, '#9caea3', 1.4);
  drawLine(0, centerY, width, centerY, '#9caea3', 1.4);
  context.fillStyle = '#819088';
  context.font = '11px DM Mono';
  context.textAlign = 'center';
  for (let x = centerX + gridStep; x < width; x += gridStep) context.fillText(Math.round((x - centerX) / scale), x, centerY + 16);
  for (let x = centerX - gridStep; x > 0; x -= gridStep) context.fillText(Math.round((x - centerX) / scale), x, centerY + 16);
  context.textAlign = 'left';
  for (let y = centerY - gridStep; y > 0; y -= gridStep) context.fillText(Math.round((centerY - y) / scale), centerX + 8, y + 4);
  for (let y = centerY + gridStep; y < height; y += gridStep) context.fillText(Math.round((centerY - y) / scale), centerX + 8, y + 4);
  expressions.forEach((expression, index) => plotExpression(expression, centerX, centerY, index));
}

function drawLine(x1, y1, x2, y2, color, lineWidth = 1) {
  context.beginPath(); context.strokeStyle = color; context.lineWidth = lineWidth; context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
}

function compileExpression(input) {
  let expression = input.toLowerCase().replace(/^\s*y\s*=\s*/, '').replace(/\^/g, '**');
  expression = expression.replace(/\b(sin|cos|tan|sqrt|abs|log)\b/g, 'Math.$1');
  expression = expression.replace(/(\d|x|\))(?=x|\()/g, '$1*');
  if (!/^[0-9x+\-*/().\sMathsincoqrtablg]+$/.test(expression)) return null;
  try { return new Function('x', `return ${expression}`); } catch { return null; }
}

function plotExpression(expression, centerX, centerY, index) {
  const fn = compileExpression(expression.value);
  if (!fn) return;
  context.beginPath(); context.strokeStyle = expression.color; context.lineWidth = 2.5;
  let drawing = false;
  for (let pixel = 0; pixel <= canvas.clientWidth; pixel += 2) {
    const x = (pixel - centerX) / scale;
    let y;
    try { y = fn(x); } catch { y = NaN; }
    const screenY = centerY - y * scale;
    if (!Number.isFinite(screenY) || Math.abs(screenY) > canvas.clientHeight * 5) { drawing = false; continue; }
    if (!drawing) context.moveTo(pixel, screenY); else context.lineTo(pixel, screenY);
    drawing = true;
  }
  context.stroke();
  if (index === 0) graphStatus.textContent = 'LIVE PLOT';
}

function renderExpressions() {
  expressionList.innerHTML = expressions.map((expression, index) => `<div class="expression-row"><span class="expression-color" style="background:${expression.color}"></span><input class="expression-input" data-index="${index}" value="${expression.value}" aria-label="Expression ${index + 1}"><button class="remove-expression" data-remove="${index}" aria-label="Remove expression" type="button">×</button></div>`).join('');
  drawGraph();
}

function addExpression(value = '') { expressions.push({ value, color: colors[expressions.length % colors.length] }); renderExpressions(); expressionList.lastElementChild.querySelector('input').focus(); }

document.querySelector('#addExpression').addEventListener('click', () => addExpression());
document.querySelector('#clearExpressions').addEventListener('click', () => { expressions.length = 0; renderExpressions(); });
expressionList.addEventListener('input', event => { if (event.target.matches('input')) { expressions[event.target.dataset.index].value = event.target.value; drawGraph(); } });
expressionList.addEventListener('click', event => { const index = event.target.dataset.remove; if (index !== undefined) { expressions.splice(index, 1); renderExpressions(); } });
document.querySelectorAll('.example').forEach(button => button.addEventListener('click', () => addExpression(button.dataset.expression)));
document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => { scale = Math.max(12, Math.min(110, scale * (button.dataset.zoom === 'in' ? 1.25 : .8))); zoomLabel.textContent = `${(scale / 38).toFixed(1)}×`; drawGraph(); }));
document.querySelector('#resetView').addEventListener('click', () => { scale = 38; origin = { x: 0, y: 0 }; zoomLabel.textContent = '1.0×'; drawGraph(); });
document.querySelector('#themeToggle').addEventListener('click', () => document.body.classList.toggle('warm'));
canvas.addEventListener('pointerdown', event => { dragging = true; dragStart = { x: event.clientX - origin.x, y: event.clientY - origin.y }; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointermove', event => { if (dragging) { origin.x = event.clientX - dragStart.x; origin.y = event.clientY - dragStart.y; drawGraph(); } });
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('wheel', event => { event.preventDefault(); scale = Math.max(12, Math.min(110, scale * (event.deltaY < 0 ? 1.1 : .9))); zoomLabel.textContent = `${(scale / 38).toFixed(1)}×`; drawGraph(); }, { passive: false });
window.addEventListener('resize', resizeCanvas);
renderExpressions();
resizeCanvas();
