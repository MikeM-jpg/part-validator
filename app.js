// Live part data from Google Sheets
const sheetID = '1osWtIElVxSKtwTMQ__P_J4RX7Z-yuJuYTYbKkfd48co';
const sheetName = 'Sheet1';
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

let partMap = {}, scanningStopped = false, confirmTimeout = null;

// Load part data
fetch(url).then(res=>res.text()).then(data=>{
    const json = JSON.parse(data.substring(47).slice(0,-2)), rows = json.table.rows;
    rows.forEach((r,i)=>{
        if(i===0) return;
        const loc = r.c[1]?.v||'', sup = r.c[2]?.v||'', plant = r.c[3]?.v||'', concern = r.c[4]?.v||'',
              parts = (r.c[6]?.v||'').split(/\n|,/).map(p=>p.replace(/[\s-]/g,'').toUpperCase()),
              contact = r.c[12]?.v||'';
        parts.forEach(p=> partMap[p] = {loc, sup, plant, concern, contact});
    });
    document.getElementById('last-updated').textContent = new Date().toLocaleString();
}).catch(err=>{
    console.error('Error loading sheet', err);
    document.getElementById('last-updated').textContent = 'Error loading data';
});

// Validate and show result
function checkPart(code=null) {
    const input = code || document.getElementById('manualInput').value.replace(/[\s-]/g,'').toUpperCase();
    document.getElementById('manualInput').value = input;
    const res = document.getElementById('result');
    if(partMap[input]) {
        const info = partMap[input];
        res.innerHTML = `
          <p class="valid">✅ Valid Part</p>
          <p><strong>Location of Support:</strong> ${info.loc}</p>
          <p><strong>Supplier:</strong> ${info.sup}</p>
          <p><strong>Plant Location:</strong> ${info.plant}</p>
          <p><strong>Concern #:</strong> ${info.concern}</p>
          <p><strong>Contact:</strong> ${info.contact}</p>
        `;
        confirmValid(input);
    } else {
        res.innerHTML = '<p class="invalid">❌ Invalid Part</p>';
    }
}

// Stop scanner
function stopScanner() {
    scanningStopped = true;
    Quagga.stop(); Quagga.offProcessed(); Quagga.offDetected();
}

// Confirm valid with 2s delay
function confirmValid(code) {
    clearTimeout(confirmTimeout);
    confirmTimeout = setTimeout(()=>{
        stopScanner();
        document.getElementById('interactive').style.display='none';
        document.getElementById('detected').style.display='none';
        document.getElementById('rescanBtn').style.display='block';
        checkPart(code);
    }, 2000);
}

// Restart
function restartScanner() {
    document.getElementById('result').innerHTML = '';
    document.getElementById('live-code').textContent = 'Waiting...';
    document.getElementById('rescanBtn').style.display = 'none';
    startScanner();
}

// Start scanner
function startScanner() {
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('interactive').style.display = 'block';
    document.getElementById('detected').style.display = 'block';
    document.getElementById('rescanBtn').style.display = 'none';
    scanningStopped = false; clearTimeout(confirmTimeout);

    Quagga.init({
        inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: document.querySelector('#interactive'),
            constraints: { facingMode: 'environment' }
        },
        decoder: { readers: ['code_128_reader','code_39_reader'] },
        locate: true
    }, err=>{
        if(err){ console.error(err); alert('Camera init error'); return; }
        Quagga.start();
    });

    Quagga.onProcessed(result=>{
        const ctx = Quagga.canvas.ctx.overlay, canvas = Quagga.canvas.dom.overlay;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        if(result && result.box) {
            ctx.beginPath();
            ctx.moveTo(result.box[0][0],result.box[0][1]);
            for(let i=1;i<result.box.length;i++) ctx.lineTo(result.box[i][0], result.box[i][1]);
            ctx.closePath();
            ctx.lineWidth=4; ctx.strokeStyle='rgba(0,255,0,0.4)'; ctx.stroke();
        }
    });

    Quagga.onDetected(result=>{
        if(scanningStopped) return;
        const code = result.codeResult.code.replace(/[\s-]/g,'').toUpperCase();
        document.getElementById('live-code').textContent = code;
        if(partMap[code]) confirmValid(code);
    });
}
