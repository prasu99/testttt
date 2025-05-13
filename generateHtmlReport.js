const fs = require('fs');
const path = require('path');
const open = require('open');

const csvPath = path.join(__dirname, 'reports', 'performance-metrics.csv');
const screenshotsDir = path.join(__dirname, 'screenshots');
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
    body { font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; }
    h1 {
      color: #0057a0;
      border-bottom: 2px solid #0057a0;
      padding-bottom: 10px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 20px;
      background-color: #fff;
    }
    th {
      background-color: #444;
      color: #fff;
      padding: 12px;
      text-align: left;
    }
    td {
      border: 1px solid #ccc;
      padding: 10px;
      vertical-align: top;
    }
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    ol { margin: 0; padding-left: 20px; }
    li { margin-bottom: 4px; }
    a { color: #0073e6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    img {
      max-width: 100%;
      margin-top: 10px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
    .screenshot-container {
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <h1>Forbes AU Site Performance Report</h1>
  <table>
    <thead>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}<th>Screenshot</th></tr>
    </thead>
    <tbody>
      ${rows.map(row => {
        const title = row[0].toLowerCase().replace(/ /g, '-');
        const screenshotFile = path.join(screenshotsDir, `${title}.png`);
        const imgTag = fs.existsSync(screenshotFile)
          ? `<div class="screenshot-container"><img src="../screenshots/${title}.png" alt="${row[0]} screenshot" /></div>`
          : '<div style="color: red;">⚠️ No screenshot found</div>';

        const topResourcesRaw = row[3].replace(/^"|"$/g, '');
        const topResourcesList = topResourcesRaw
          .split('; ')
          .map(item => `<li>${item}</li>`)
          .join('');

        return `
        <tr>
          <td>${row[0]}</td>
          <td><a href="${row[1]}" target="_blank">${row[1]}</a></td>
          <td>${row[2]}</td>
          <td><ol>${topResourcesList}</ol></td>
          <td>${imgTag}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
</body>
</html>
`;

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log(`✅ HTML report with screenshots saved at ${htmlPath}`);
open(htmlPath);
