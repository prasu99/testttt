const fs = require('fs');
const path = require('path');
const site = process.env.SITE || 'AU'; // Default to AU

// Define paths based on your project structure
const reportsDir = path.join(__dirname, 'reports');
const siteDir = path.join(reportsDir, site);

// Look for the CSV file in multiple possible locations
const csvFilename = `performance-metrics-${site}.csv`;
let csvPath;

// Possible locations where the CSV might be (based on your test script)
const possibleCsvPaths = [
  path.join(reportsDir, csvFilename),               // ./reports/performance-metrics-SITE.csv
  path.join(siteDir, csvFilename),                  // ./reports/SITE/performance-metrics-SITE.csv
  path.join(__dirname, 'reports', csvFilename)      // /reports/performance-metrics-SITE.csv
];

// Find the first existing CSV file
csvPath = possibleCsvPaths.find(p => fs.existsSync(p));

// Output HTML to the site-specific directory
const htmlFilename = `performance-report-${site}.html`;
const htmlPath = path.join(siteDir, htmlFilename);

// Make sure site directory exists
if (!fs.existsSync(siteDir)) {
  fs.mkdirSync(siteDir, { recursive: true });
}

if (!csvPath) {
  console.error(`❌ CSV not found for site ${site}. Looked in:`);
  possibleCsvPaths.forEach(p => console.error(`  - ${p}`));
  process.exit(1);
}

console.log(`✅ Found CSV at: ${csvPath}`);

const csv = fs.readFileSync(csvPath, 'utf-8').trim();
const lines = csv.split('\n');
const headers = lines[0].split(',');
const rows = lines.slice(1).map(line => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/));

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Performance Report - ${site}</title>
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
  </style>
</head>
<body>
  <h1>Forbes ${site} Site Performance Report</h1>
  <table>
    <thead>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows.map(row => {
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
        </tr>`;
      }).join('')}
    </tbody>
  </table>
</body>
</html>
`;

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log(`✅ HTML report generated at ${htmlPath}`);
