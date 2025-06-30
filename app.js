// Live part data from Google Sheets
const sheetID = '1osWtIElVxSKtwTMQ__P_J4RX7Z-yuJuYTYbKkfd48co';
const sheetName = 'Sheet1';
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

let partMap = {};
let lastBox = null;
let stopped = false;

let lastCode = null;
let stableCount = 0;
const STABLE_THRESHOLD = 1;
const DEBOUNCE_MS = 100;
let lastReadTime = 0;

// Normalize code: remove hyphens/spaces, uppercase, strip leading 'P'
function normalizeCode(raw) {
  let code = raw.replace(/[-\s]/g, '').toUpperCase();
  if (code.startsWith('P') && partMap[code.slice(1)]) code = code.slice(1);
  return code;
}

// Load part data
fetch(url).then(res => res.text()).then(data => {
  const json = JSON.parse(data.substring(47).slice(0, -2));
  json.table.rows.forEach((row, idx) => {
    if (idx === 0) return;
    const loc = row.c[1]?.v || '', sup = row.c[2]?.v || '', plant = row.c[3]?.v || '', concern = row.c[4]?.v || '', contact = row.c[12]?.v || '';
    (row.c[6]?.v || '').split(/\n|,/).map(p => normalizeCode(p)).forEach(p => {
      if (p) partMap[p] = { loc, sup, plant, concern, contact };
    });
  });
  document.getElementById('last-updated').textContent = new Date().toLocaleString();
}).catch(err => {
  console.error('Error loading data', err);
  document.getElementById('last-updated').textContent = 'Error';
});

// Show details instantly
function showResult(code) {
  stopped = true;
  Quagga.stop(); Quagga.offProcessed(); Quagga.offDetected();
  lastBox = null;
  document.getElementById('interactive').style.display = 'none';
  document.getElementById('detected').style.display = 'none';
  document.getElementById('rescanBtn').style.display = 'block';
  const info = partMap[code];
  document.getElementById('result').innerHTML = `
    <p class="valid">✅ Valid Part</p>
    <p><strong>Location of Support:</strong> ${info.loc}</p>
    <p><strong>Supplier:</strong> ${info.sup}</p>
    <p><strong>Plant Location:</strong> ${info.plant}</p>
    <p><strong>Concern #:</strong> ${info.concern}</p>
    <p><strong>Contact:</strong> ${info.contact}</p>`;
}

// Restart scanning
function restartScanner() {
  document.getElementById('result').innerHTML = '';
  document.getElementById('live-code').textContent = 'Waiting...';
  document.getElementById('rescanBtn').style.display = 'none';
  stopped = false; lastBox = null; lastCode = null; stableCount = 0; lastReadTime = 0;
  startScanner();
}

// Start scanning
function startScanner() {
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('interactive').style.display = 'block';
  document.getElementById('detected').style.display = 'block';
  stopped = false; lastBox = null; lastCode = null; stableCount = 0;

  Quagga.init({
    inputStream: {
      name: 'Live', type: 'LiveStream', target: document.querySelector('#interactive'),
      constraints: { facingMode: 'environment' },
      area: { top: '10%', right: '10%', left: '10%', bottom: '10%' }
    },
    locator: { patchSize: 'large', halfSample: false },
    decoder: { readers: ['code_128_reader','code_39_reader'] },
    locate: true
  }, err => {
    if (err) { console.error(err); alert('Camera init error'); return; }
    Quagga.start();
  });

  Quagga.onProcessed(result => {
    const ctx = Quagga.canvas.ctx.overlay, canvas = Quagga.canvas.dom.overlay;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (result && result.box) lastBox = result.box;
    if (lastBox) {
      ctx.beginPath(); ctx.moveTo(lastBox[0][0], lastBox[0][1]);
      for (let i = 1; i < lastBox.length; i++) ctx.lineTo(lastBox[i][0], lastBox[i][1]);
      ctx.closePath(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,255,0,0.4)'; ctx.stroke();
    }
  });

  Quagga.onDetected(result => {
    if (stopped) return;
    const now = Date.now();
    const codeNorm = normalizeCode(result.codeResult.code);
    if (now - lastReadTime < DEBOUNCE_MS) return;
    if (codeNorm === lastCode) stableCount++; else { lastCode = codeNorm; stableCount = 1; }
    if (stableCount < STABLE_THRESHOLD) return;
    lastReadTime = now;
    if (partMap[codeNorm]) showResult(codeNorm);
  });
}

window.startScanner = startScanner;
window.restartScanner = restartScanner;
