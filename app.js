// Live part data from Google Sheets
const sheetID='1osWtIElVxSKtwTMQ__P_J4RX7Z-yuJuYTYbKkfd48co', sheetName='Sheet1';
const url=`https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
let partMap={}, stopped=false;

// Load part data
fetch(url).then(res=>res.text()).then(txt=>{
  const data=JSON.parse(txt.substring(47).slice(0,-2)), rows=data.table.rows;
  rows.forEach((r,i)=>{
    if(i===0)return;
    const loc=r.c[1]?.v||'', sup=r.c[2]?.v||'', plant=r.c[3]?.v||'', concern=r.c[4]?.v||'', contact=r.c[12]?.v||'';
    (r.c[6]?.v||'').split(/\n|,/).map(p=>p.replace(/[\s-]/g,'').toUpperCase())
      .forEach(p=>partMap[p]={loc,sup,plant,concern,contact});
  });
  document.getElementById('last-updated').textContent=new Date().toLocaleString();
}).catch(e=>{
  console.error('Sheet load error', e);
  document.getElementById('last-updated').textContent='Error';
});

// Validate and show result
function checkPart(code=null){
  const c=code||document.getElementById('manualInput').value.replace(/[\s-]/g,'').toUpperCase();
  document.getElementById('manualInput').value=c;
  const res=document.getElementById('result');
  if(partMap[c]){
    const info=partMap[c];
    res.innerHTML=`
      <p class="valid">✅ Valid Part</p>
      <p><strong>Location of Support:</strong> ${info.loc}</p>
      <p><strong>Supplier:</strong> ${info.sup}</p>
      <p><strong>Plant Location:</strong> ${info.plant}</p>
      <p><strong>Concern #:</strong> ${info.concern}</p>
      <p><strong>Contact:</strong> ${info.contact}</p>`;
    stopScanning();
    document.getElementById('interactive').style.display='none';
    document.getElementById('detected').style.display='none';
    document.getElementById('rescanBtn').style.display='block';
  } else {
    res.innerHTML='<p class="invalid">❌ Invalid Part</p>';
  }
}

// Stop scanning
function stopScanning(){
  stopped=true;
  Quagga.stop(); Quagga.offProcessed(); Quagga.offDetected();
}

// Restart scanning
function restartScanner(){
  document.getElementById('result').innerHTML='';
  document.getElementById('live-code').textContent='Waiting...';
  document.getElementById('rescanBtn').style.display='none';
  document.getElementById('interactive').style.display='block';
  document.getElementById('detected').style.display='block';
  stopped=false;
  startScanner();
}

// Start scanner
function startScanner(){
  document.getElementById('startBtn').style.display='none';
  document.getElementById('interactive').style.display='block';
  document.getElementById('detected').style.display='block';
  stopped=false;

  Quagga.init({
    inputStream:{
      name:'Live', type:'LiveStream',
      target:document.querySelector('#interactive'),
      constraints:{facingMode:'environment'}
    },
    locator:{patchSize:'medium', halfSample:true},
    decoder:{readers:['code_128_reader','code_39_reader']},
    locate:true
  }, err=>{
    if(err){console.error(err); alert('Camera init error'); return;}
    Quagga.start();
  });

  Quagga.onProcessed(result=>{
    const ctx=Quagga.canvas.ctx.overlay, canvas=Quagga.canvas.dom.overlay;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(result && result.box){
      ctx.beginPath();
      ctx.moveTo(result.box[0][0],result.box[0][1]);
      result.box.slice(1).forEach(pt=>ctx.lineTo(pt[0],pt[1]));
      ctx.closePath();
      ctx.lineWidth=4; ctx.strokeStyle='rgba(0,255,0,0.4)'; ctx.stroke();
    }
  });

  Quagga.onDetected(result=>{
    if(stopped) return;
    const code=result.codeResult.code.replace(/[\s-]/g,'').toUpperCase();
    document.getElementById('live-code').textContent=code;
    if(partMap[code]) {
      checkPart(code);
    }
  });
}

// Alias for page
const start = startScanner; window.startScanner = startScanner; window.restartScanner = restartScanner;
