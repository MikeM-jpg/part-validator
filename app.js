
const sheetID = '1osWtIElVxSKtwTMQ__P_J4RX7Z-yuJuYTYbKkfd48co';
const sheetName = 'Sheet1';
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

let partMap = {};
let lastUpdated = '';

fetch(url)
  .then(res => res.text())
  .then(data => {
    const json = JSON.parse(data.substring(47).slice(0, -2));
    const rows = json.table.rows;

    rows.forEach((row, index) => {
      if (index === 0) return; // skip headers
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
          };
        }
      });
    });

    document.getElementById('last-updated').textContent = new Date().toLocaleString();
  })
  .catch(err => {
    console.error('Error fetching or parsing sheet data:', err);
    document.getElementById('last-updated').textContent = 'Error loading data';
  });

function checkPart() {
  const input = document.getElementById('manualInput').value.replace(/[\s-]/g, '').toUpperCase();
  const result = document.getElementById('result');

  if (partMap[input]) {
    const info = partMap[input];
    result.innerHTML = `
      <p class="valid">✅ Valid Part</p>
      <p><strong>Location of Support:</strong> ${info.location}</p>
      <p><strong>Supplier:</strong> ${info.supplier}</p>
      <p><strong>Plant Location:</strong> ${info.plant}</p>
      <p><strong>Concern #:</strong> ${info.concern}</p>
      <p><strong>Contact:</strong> ${info.contact}</p>
    `;
  } else {
    result.innerHTML = `<p class="invalid">❌ Invalid Part</p>`;
  }
}

// Initialize QuaggaJS
function startScanner() {
  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: document.querySelector('#preview'),
      constraints: {
        facingMode: "environment"
      }
    },
    decoder: {
      readers: ["code_128_reader", "code_39_reader"]
    }
  }, function (err) {
    if (err) {
      console.error(err);
      return;
    }
    Quagga.start();
  });

  Quagga.onDetected(function (result) {
    const code = result.codeResult.code;
    if (code) {
      document.getElementById('manualInput').value = code;
      checkPart();
      Quagga.stop();
    }
  });
}

window.onload = () => {
  startScanner();
};
