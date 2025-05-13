// generateHtmlReport.js
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'reports', 'performance-metrics.csv');
const htmlPath = path.join(__dirname, 'reports', 'performance-report.html');

const csv = fs.readFileSync(csvPath, 'utf-8').trim();
const lines = csv.split('\n');
const headers = lines[0].split(',');
const rows = lines.slice(1).map(line => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/));

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Performance Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ccc; padding: 10px; text-align: left; vertical-align: top; }
    th { background-color: #f4f4f4; }
    td pre { white-space: pre-wrap; word-break: break-word; margin: 0; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>Forbes AU Site Performance Report</h1>
  <table>
    <thead>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows.map(row => `
        <tr>
          ${row.map(cell => `<td><pre>${cell.replace(/^"|"$/g, '')}</pre></td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
`;

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log(`✅ HTML report generated at ${htmlPath}`);
