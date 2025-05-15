/**
 * Updated generateHtmlReport.js
 * Generates HTML performance reports from site-specific CSVs
 */
const fs = require('fs');
const path = require('path');
const site = process.env.SITE || 'AU'; // Default to AU

// Define base paths
const reportsDir = path.join(__dirname, 'reports');
const siteDir = path.join(reportsDir, site);
const screenshotsDir = path.join(__dirname, 'screenshots', site);

// Ensure output directories exist
if (!fs.existsSync(siteDir)) {
  fs.mkdirSync(siteDir, { recursive: true });
}
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Find the CSV file - try both naming patterns
const possibleCsvPaths = [
  path.join(reportsDir, `performance-metrics-${site}.csv`),  // New format with site name
  path.join(reportsDir, 'performance-metrics.csv'),          // Old format without site name
  path.join(siteDir, `performance-metrics-${site}.csv`),     
  path.join(siteDir, 'performance-metrics.csv')
];

let csvPath = possibleCsvPaths.find(p => fs.existsSync(p));

// If CSV not found, create a warning file and exit
if (!csvPath) {
  console.error(`❌ CSV not found for site ${site}. Looked in:`);
  possibleCsvPaths.forEach(p => console.error(`  - ${p}`));
  
  // Create an HTML error report
  const errorReportPath = path.join(siteDir, `performance-report-${site}.html`);
  const errorHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Performance Report Error - ${site}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; background-color: #fff0f0; }
      h1 { color: #d00; border-bottom: 2px solid #d00; padding-bottom: 10px; }
      .error { background-color: #fff0f0; border: 1px solid #d00; padding: 15px; border-radius: 5px; }
      pre { background-color: #f8f8f8; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
  </head>
  <body>
    <h1>⚠️ Forbes ${site} Performance Report Error</h1>
    <div class="error">
      <p>The performance CSV file could not be found for site ${site}.</p>
      <p>Locations checked:</p>
      <pre>${possibleCsvPaths.join('\n')}</pre>
      <p>Please ensure the test script is generating the performance metrics correctly.</p>
    </div>
  </body>
  </html>
  `;
  
  fs.writeFileSync(errorReportPath, errorHtml, 'utf-8');
  console.log(`⚠️ Created error report at ${errorReportPath}`);
  process.exit(1);
}

console.log(`✅ Found CSV at: ${csvPath}`);

// If found, use the format that works
const csv = fs.readFileSync(csvPath, 'utf-8').trim();
const lines = csv.split('\n');
const headers = lines[0].split(',');
const rows = lines.slice(1).map(line => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/));

// Generate HTML report
const htmlFilename = `performance-report-${site}.html`;
const htmlPath = path.join(siteDir, htmlFilename);

// Copy the CSV to the expected location for upload
const targetCsvPath = path.join(reportsDir, `performance-metrics-${site}.csv`);
if (csvPath !== targetCsvPath) {
  fs.copyFileSync(csvPath, targetCsvPath);
  console.log(`✅ Copied CSV to expected location: ${targetCsvPath}`);
}

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
    .summary {
      background-color: #e9f5ff;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
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
    .load-time {
      font-weight: bold;
    }
    .fast { color: green; }
    .medium { color: orange; }
    .slow { color: red; }
  </style>
</head>
<body>
  <h1>Forbes ${site} Site Performance Report</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Performance test completed on: ${new Date().toLocaleString()}</p>
    <p>Total pages tested: ${rows.length}</p>
    ${rows.length > 0 ? `<p>Average load time: ${Math.round(rows.reduce((sum, row) => sum + parseInt(row[2]), 0) / rows.length)} ms</p>` : ''}
  </div>
  
  <table>
    <thead>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows.map(row => {
        const loadTime = parseInt(row[2]);
        let loadTimeClass = 'fast';
        if (loadTime > 5000) loadTimeClass = 'slow';
        else if (loadTime > 3000) loadTimeClass = 'medium';
        
        const topResourcesRaw = row[3].replace(/^"|"$/g, '');
        const topResourcesList = topResourcesRaw
          .split('; ')
          .map(item => `<li>${item}</li>`)
          .join('');
        
        return `
        <tr>
          <td>${row[0]}</td>
          <td><a href="${row[1]}" target="_blank">${row[1]}</a></td>
          <td class="load-time ${loadTimeClass}">${row[2]} ms</td>
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
