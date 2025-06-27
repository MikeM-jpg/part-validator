// Live part data from Google Sheets
const sheetID = '1osWtIElVxSKtwTMQ__P_J4RX7Z-yuJuYTYbKkfd48co';
const sheetName = 'Sheet1';
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

let partMap = {};
let scanningStopped = false;
let confirmTimeout = null;

// Load part data
fetch(url)
  .then(res => res.text())
  .then(data => {
    const json = JSON.parse(data.substring(47).slice(0, -2));
    const rows = json.table.rows;
    rows.forEach((row, idx) => {
      if (idx === 0) return; // skip header
      const location = row.c[1]?.v || '';
      const supplier = row.c[2]?.v || '';
      const plant = row.c[3]?.v || '';
      const concern = row.c[4]?.v || '';
      const partCell = row.c[6]?.v || '';
      const contact = row.c[12]?.v || '';
      const parts = partCell.split(/\n|,/).map(p => p.replace(/[\s-]/g, '').toUpperCase());
      parts.forEach(p => {
        partMap[p] = {location, supplier, plant, concern, contact};
      });
    });
    document.getElementById('last-updated').textContent = new Date().toLocaleString();
  })
  .catch(err => {
    console.error('Error loading sheet', err);
    document.getElementById('last-updated').textContent = 'Error loading data';
  });

// Check part validity
function checkPart(code = null) {
  const input = code || document.getElementById('manualInput').value.replace(/[\s-]/g, '').toUpperCase();
  document.getElementById('manualInput').value = input;
  const resultDiv = document.getElementById('result');
  if (partMap[input]) {
    const info = partMap[input];
    resultDiv.innerHTML = `
      <p class="valid">✅ Valid Part</p>
      <p><strong>Location of Support:</strong> ${info.location}</p>
      <p><strong>Supplier:</strong> ${info.supplier}</p>
      <p><strong>Plant Location:</strong> ${info.plant}</p>
      <p><strong>Concern #:</strong> ${info.concern}</p>
      <p><strong>Contact:</strong> ${info.contact}</p>
    `;
    stopScanner();
    document.getElementById('reader').style.display = 'none';
    document.getElementById('rescanBtn').style.display = 'block';
  } else {
    resultDiv.innerHTML = `<p class="invalid">❌ Invalid Part</p>`;
  }
}

// Stop scanning and camera
function stopScanner() {
  scanningStopped = true;
  Quagga.stop();
  Quagga.offProcessed();
  Quagga.offDetected();
  const video = document.getElementById('preview');
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
}

// Restart scanning
function restartScanner() {
  document.getElementById('result').innerHTML = '';
  document.getElementById('live-code').textContent = 'Waiting...';
  document.getElementById('rescanBtn').style.display = 'none';
  scanningStopped = false;
  startScanner();
}

// Initialize scanner
function startScanner() {
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('reader').style.display = 'block';
  document.getElementById('rescanBtn').style.display = 'none';

  scanningStopped = false;
  if (confirmTimeout) clearTimeout(confirmTimeout);

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
    .then(stream => {
      const video = document.getElementById('preview');
      video.srcObject = stream;
      video.setAttribute('playsinline', true);
      video.play();

      Quagga.init({
        inputStream: { type: 'LiveStream', target: video },
        locator: { patchSize: 'medium', halfSample: true },
        decoder: { readers: ['code_128_reader','code_39_reader'] },
        locate: true
      }, err => {
        if (err) { console.error(err); alert('Camera init error'); return; }
        Quagga.start();
      });

      // Draw overlay on processed frames
      Quagga.onProcessed(result => {
        const ctx = Quagga.canvas.ctx.overlay;
        const canvas = Quagga.canvas.dom.overlay;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        if (result && result.box) {
          ctx.beginPath();
          ctx.moveTo(result.box[0][0], result.box[0][1]);
          result.box.forEach((pt, i) => {
            if(i>0) ctx.lineTo(pt[0], pt[1]);
          });
          ctx.closePath();
          ctx.lineWidth = 4;
          ctx.strokeStyle = 'rgba(0,255,0,0.4)';
          ctx.stroke();
        }
      });

      // Detect barcodes
      Quagga.onDetected(result => {
        if (scanningStopped) return;
        const code = result.codeResult.code.replace(/[\s-]/g,'').toUpperCase();
        document.getElementById('live-code').textContent = code;
        if (partMap[code]) {
          if (confirmTimeout) clearTimeout(confirmTimeout);
          confirmTimeout = setTimeout(() => checkPart(code), 2000);
        }
      });
    })
    .catch(err => {
      console.error('Permission error:', err);
      alert('Camera access denied');
    });
}
