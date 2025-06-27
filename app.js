// Live part data from Google Sheets
const sheetID = '1osWtIElVxSKtwTMQ__P_J4RX7Z-yuJuYTYbKkfd48co';
const sheetName = 'Sheet1';
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

let partMap = {};
let lastBox = null;
let stopped = false;

// Load part data
fetch(url)
  .then(res => res.text())
  .then(data => {
    const json = JSON.parse(data.substring(47).slice(0, -2));
    json.table.rows.forEach((row, idx) => {
      if (idx === 0) return;
      const loc = row.c[1]?.v || '';
      const sup = row.c[2]?.v || '';
      const plant = row.c[3]?.v || '';
      const concern = row.c[4]?.v || '';
      const contact = row.c[12]?.v || '';
      const parts = (row.c[6]?.v || '').split(/\n|,/).map(p =>
        p.replace(/[\s-]/g, '').toUpperCase()
      );
      parts.forEach(p => {
        partMap[p] = { loc, sup, plant, concern, contact };
      });
    });
    document.getElementById('last-updated').textContent = new Date().toLocaleString();
  })
  .catch(err => {
    console.error('Error loading sheet data', err);
    document.getElementById('last-updated').textContent = 'Error loading data';
  });

// Check part manually or programmatically
function checkPart(code = null) {
  const val = code || document.getElementById('manualInput').value.replace(/[\s-]/g, '').toUpperCase();
  document.getElementById('manualInput').value = val;
  const resultDiv = document.getElementById('result');
  if (partMap[val]) {
    const info = partMap[val];
    resultDiv.innerHTML = `
      <p class="valid">✅ Valid Part</p>
      <p><strong>Location of Support:</strong> ${info.loc}</p>
      <p><strong>Supplier:</strong> ${info.sup}</p>
      <p><strong>Plant Location:</strong> ${info.plant}</p>
      <p><strong>Concern #:</strong> ${info.concern}</p>
      <p><strong>Contact:</strong> ${info.contact}</p>
    `;
    showResult(val);
  } else {
    resultDiv.innerHTML = '<p class="invalid">❌ Invalid Part</p>';
  }
}

// Display result and stop scanner
function showResult(code) {
  stopped = true;
  Quagga.stop();
  Quagga.offProcessed();
  Quagga.offDetected();
  lastBox = null;

  document.getElementById('interactive').style.display = 'none';
  document.getElementById('detected').style.display = 'none';
  document.getElementById('rescanBtn').style.display = 'block';

  // fill input
  document.getElementById('manualInput').value = code;
}

// Restart scanning
function restartScanner() {
  document.getElementById('result').innerHTML = '';
  document.getElementById('live-code').textContent = 'Waiting...';
  document.getElementById('rescanBtn').style.display = 'none';
  stopped = false;
  startScanner();
}

// Initialize scanning
function startScanner() {
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('interactive').style.display = 'block';
  document.getElementById('detected').style.display = 'block';
  stopped = false;
  lastBox = null;
  document.getElementById('rescanBtn').style.display = 'none';

  Quagga.init({
    inputStream: {
      name: 'Live',
      type: 'LiveStream',
      target: document.querySelector('#interactive'),
      constraints: { facingMode: 'environment' }
    },
    locator: { patchSize: 'medium', halfSample: true },
    decoder: { readers: ['code_128_reader', 'code_39_reader'] },
    locate: true
  }, err => {
    if (err) {
      console.error('Quagga init error:', err);
      alert('Camera init error');
      return;
    }
    Quagga.start();
  });

  Quagga.onProcessed(result => {
    const ctx = Quagga.canvas.ctx.overlay;
    const canvas = Quagga.canvas.dom.overlay;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (result && result.box) {
      lastBox = result.box;
    }
    if (lastBox) {
      ctx.beginPath();
      ctx.moveTo(lastBox[0][0], lastBox[0][1]);
      for (let i = 1; i < lastBox.length; i++) {
        ctx.lineTo(lastBox[i][0], lastBox[i][1]);
      }
      ctx.closePath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,255,0,0.4)';
      ctx.stroke();
    }
  });

  Quagga.onDetected(result => {
    if (stopped) return;
    const code = result.codeResult.code.replace(/[\s-]/g, '').toUpperCase();
    document.getElementById('live-code').textContent = code;
    if (partMap[code]) {
      showResult(code);
    }
  });
}

// Expose functions
window.startScanner = startScanner;
window.restartScanner = restartScanner;
window.checkPart = checkPart;
