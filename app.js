const sheetID='1osWtIElVxSKtwTMQ__P_J4RX7Z-yuJuYTYbKkfd48co', sheetName='Sheet1';
const url=`https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
let partMap={}, stopped=false, timer=null;

// load parts
fetch(url).then(r=>r.text()).then(t=>{
  const data=JSON.parse(t.substring(47).slice(0,-2)), rows=data.table.rows;
  rows.forEach((r,i)=> {
    if(i===0) return;
    const loc=r.c[1]?.v||'', sup=r.c[2]?.v||'', plant=r.c[3]?.v||'', concern=r.c[4]?.v||'', contact=r.c[12]?.v||'';
    (r.c[6]?.v||'').split(/\n|,/).map(p=>p.replace(/[\s-]/g,'').toUpperCase()).forEach(p=>partMap[p]={loc,sup,plant,concern,contact});
  });
  document.getElementById('last-updated').textContent=new Date().toLocaleString();
});

// check
function checkPart(c=null) {
  const code=c||document.getElementById('manualInput').value.replace(/[\s-]/g,'').toUpperCase();
  document.getElementById('manualInput').value=code;
  const res=document.getElementById('result');
  if(partMap[code]) {
    const i=partMap[code];
    res.innerHTML=`
      <p class="valid">✅ Valid Part</p>
      <p><strong>Location of Support:</strong> ${i.loc}</p>
      <p><strong>Supplier:</strong> ${i.sup}</p>
      <p><strong>Plant Location:</strong> ${i.plant}</p>
      <p><strong>Concern #:</strong> ${i.concern}</p>
      <p><strong>Contact:</strong> ${i.contact}</p>`;
    confirm(code);
  } else {
    res.innerHTML='<p class="invalid">❌ Invalid Part</p>';
  }
}

function stopScan() {
  stopped=true; Quagga.stop(); Quagga.offProcessed(); Quagga.offDetected();
}

function confirm(code) {
  clearTimeout(timer);
  timer=setTimeout(()=>{
    stopScan();
    document.getElementById('interactive').style.display='none';
    document.getElementById('detected').style.display='none';
    document.getElementById('rescanBtn').style.display='block';
    checkPart(code);
  },2000);
}

function restart() {
  document.getElementById('result').innerHTML='';
  document.getElementById('live-code').textContent='Waiting...';
  document.getElementById('rescanBtn').style.display='none';
  start();
}

let lastBox = null;
function start() {
  document.getElementById('startBtn').style.display='none';
  document.getElementById('interactive').style.display='block';
  document.getElementById('detected').style.display='block';
  stopped=false; clearTimeout(timer);

  Quagga.init({
    inputStream:{name:'Live',type:'LiveStream',target:document.querySelector('#interactive'),constraints:{facingMode:'environment'}},
    decoder:{readers:['code_128_reader','code_39_reader']},locate:true
  },e=>{
    if(e){console.error(e);return;} Quagga.start();
  });

  
  Quagga.onProcessed(result => {
    const ctx = Quagga.canvas.ctx.overlay, canvas = Quagga.canvas.dom.overlay;
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

}
const startScanner=start, restartScanner=restart;