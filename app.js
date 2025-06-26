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
      const location = row.c[0]?.v || '';
      const supplier = row.c[1]?.v || '';
      const plant = row.c[2]?.v || '';
      const concern = row.c[3]?.v || '';
      const partCell = row.c[6]?.v || '';  // Part Number(s)
      const contact = row.c[12]?.v || '';  // Contact

      // Normalize multiple part numbers (newline or comma separated)
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

    document.getEleme
// Initialize QR/Barcode scanner
function startScanner() {
  const scanner = new Html5Qrcode("reader");

  scanner.start(
    { facingMode: "environment" }, // rear camera
    {
      fps: 10,
      qrbox: 250,
    },
    (decodedText, decodedResult) => {
      document.getElementById('manualInput').value = decodedText;
      checkPart();
      scanner.stop().then(() => {
        document.getElementById('reader').innerHTML = ""; // remove scanner box
      });
    },
    (errorMessage) => {
      // silent scan errors (ignore for now)
    }
  ).catch(err => {
    console.error("Scanner failed to start", err);
  });
}

window.onload = () => {
  startScanner();
};
