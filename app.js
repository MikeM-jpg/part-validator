
const sheetID = '1osWtIElVxSKtwTMQ__P_J4RX7Z-yuJuYTYbKkfd48co';
const sheetName = 'Sheet1';
const url = `https://docs.google.com/spreadsheets/d/${sheetID}); // end of timeout
    }/gviz/tq?tqx=out:json&sheet=${sheetName}); // end of timeout
    }`;

let partMap = {}); // end of timeout
    };
let currentDetectedCode = '';
let scannerInitialized = false;
let scanningStopped = false;

fetch(url)
  .then(res => res.text())
  .then(data => {
    const json = JSON.parse(data.substring(47).slice(0, -2));
    const rows = json.table.rows;

    rows.forEach((row, index) => {
      if (index === 0) return;
      const location = row.c[1]?.v || '';
      const supplier = row.c[2]?.v || '';
      const plant = row.c[3]?.v || '';
      const concern = row.c[4]?.v || '';
      const partCell = row.c[6]?.v || '';
      const contact = row.c[12]?.v || '';

      const parts = partCell.split(/\n|,/).map(p =>
        p.replace(/[\s-]/g, '').toUpperCase()
      );

      parts.forEach(part => {
        if (part) {
          partMap[part] = {
            location,
            supplier,
            plant,
            concern,
            contact,
          }); // end of timeout
    };
        }); // end of timeout
    }
      }); // end of timeout
    });
    }); // end of timeout
    });

    document.getElementById('last-updated').textContent = new Date().toLocaleString();
  }); // end of timeout
    })
  .catch(err => {
    console.error('Error fetching or parsing sheet data:', err);
    document.getElementById('last-updated').textContent = 'Error loading data';
  }); // end of timeout
    });

function checkPart(inputCode = null) {
  const input = inputCode || document.getElementById('manualInput').value.replace(/[\s-]/g, '').toUpperCase();
  const result = document.getElementById('result');
  document.getElementById('manualInput').value = input;

  if (partMap[input]) {
    const info = partMap[input];
    result.innerHTML = `
      <p class="valid">✅ Valid Part</p>
      <p><strong>Location of Support:</strong> ${info.location}); // end of timeout
    }</p>
      <p><strong>Supplier:</strong> ${info.supplier}); // end of timeout
    }</p>
      <p><strong>Plant Location:</strong> ${info.plant}); // end of timeout
    }</p>
      <p><strong>Concern #:</strong> ${info.concern}); // end of timeout
    }</p>
      <p><strong>Contact:</strong> ${info.contact}); // end of timeout
    }</p>
    `;
    stopScanner();
document.getElementById("reader").style.display = "none";
document.getElementById("scannerControls").style.display = "none";
document.getElementById("preview").style.display = "none";
document.getElementById("rescanBtn").style.display = "block";
  }); // end of timeout
    } else {
    result.innerHTML = `<p class="invalid">❌ Invalid Part</p>`;
  }); // end of timeout
    }
}); // end of timeout
    }

function restartScanner() {
  document.getElementById('result').innerHTML = '';
  document.getElementById('live-code').textContent = 'Waiting...';
  scanningStopped = false;
  startScanner();
}); // end of timeout
    }

function stopScanner() {
  scanningStopped = true;
  Quagga.offDetected();
  Quagga.stop();
  const video = document.getElementById('preview');
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }); // end of timeout
    }
  scannerInitialized = false;
}); // end of timeout
    }

function startScanner() {
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('reader').style.display = 'block';
document.getElementById("scannerControls").style.display = "block";
document.getElementById("preview").style.display = "block";
document.getElementById("rescanBtn").style.display = "none";

  if (scannerInitialized) {
    Quagga.stop();
    scannerInitialized = false;
  }); // end of timeout
    }

  const constraints = {
    audio: false,
    video: {
      facingMode: "environment",
      width: { ideal: 640 }); // end of timeout
    },
      height: { ideal: 480 }); // end of timeout
    }
    }); // end of timeout
    }
  }); // end of timeout
    };

  navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      const video = document.getElementById('preview');
      video.srcObject = stream;
      video.setAttribute("playsinline", true);
      video.play();

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: video
        }); // end of timeout
    },
        decoder: {
          readers: ["code_128_reader", "code_39_reader"]
        }); // end of timeout
    }
      }); // end of timeout
    }, function(err) {
        if (err) {
          console.error("Quagga init error:", err);
          return;
        }); // end of timeout
    }
        Quagga.start();
        scannerInitialized = true;
      }); // end of timeout
    });

      Quagga.onDetected(function(result) {
        if (scanningStopped) return;

        const code = result.codeResult.code;
        if (code) {
          currentDetectedCode = code.replace(/[\s-]/g, '').toUpperCase();
          document.getElementById('live-code').textContent = currentDetectedCode;

          
    if (partMap[currentDetectedCode]) {
      drawHighlight(result);  // draw box
      setTimeout(() => {
    
            checkPart(currentDetectedCode);
          }); // end of timeout
    }
        }); // end of timeout
    }
      }); // end of timeout
    });
    }); // end of timeout
    })
    .catch(function(err) {
      console.error("Camera permission denied:", err);
      alert("Camera access is required to scan barcodes. Please enable it in Safari settings.");
    }); // end of timeout
    });
}); // end of timeout
    }


function drawHighlight(result) {
  const ctx = Quagga.canvas.ctx.overlay;
  const canvas = Quagga.canvas.dom.overlay;

  if (!result || !result.box) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(0,255,0,0.4)';
  ctx.lineWidth = 4;
  ctx.moveTo(result.box[0][0], result.box[0][1]);
  for (let i = 1; i < result.box.length; i++) {
    ctx.lineTo(result.box[i][0], result.box[i][1]);
  }
  ctx.closePath();
  ctx.stroke();
}
