
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
      const location = row.c[1]?.v || '';     // Location of Support
      const supplier = row.c[2]?.v || '';     // Supplier
      const plant = row.c[3]?.v || '';        // Plant Location
      const concern = row.c[4]?.v || '';      // Concern #
      const partCell = row.c[6]?.v || '';     // Part Number(s)
      const contact = row.c[12]?.v || '';     // Contact

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

function startScanner() {
  const scanner = new Html5Qrcode("reader");

  scanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 350, height: 100 },
    },
    (decodedText) => {
      document.getElementById('manualInput').value = decodedText;
      checkPart();
      scanner.stop().then(() => {
        document.getElementById('reader').innerHTML = ""; // remove scanner box
      });
    },
    (errorMessage) => {
      // Silent scan errors
    }
  ).catch(err => {
    console.error("Scanner failed to start", err);
  });
}

window.onload = () => {
  startScanner();
};
