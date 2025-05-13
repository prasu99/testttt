const fs = require('fs');
const path = require('path');

// Paths
const reportsDir = './reports';
const screenshotsDir = './screenshots';
const csvPath = path.join(reportsDir, 'performance-metrics.csv');
const outputHtmlPath = path.join(reportsDir, 'report.html');

// Read CSV
const csvData = fs.readFileSync(csvPath, 'utf-8');
const rows = csvData.trim().split('\n').slice(1); // Remove header

let summaryTable = `
  <h2>Summary</h2>
  <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
    <tr style="background-color: #333; color: #fff;">
      <th>Page</th>
      <th>URL</th>
      <th>Load Time (ms)</th>
    </tr>
`;

let detailedReports = '';

// Generate table rows and screenshot sections
for (const row of rows) {
  const [title, url, loadTime, resources] = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, ''));

  summaryTable += `
    <tr>
      <td>${title}</td>
      <td><a href="${url}" target="_blank">${url}</a></td>
      <td>${loadTime}</td>
    </tr>
  `;

  // Format top resources as numbered list
  const topResources = resources.split('; ').map((r, i) => `<li>${r}</li>`).join('');

  // Match screenshot filename format
  const screenshotFile = `${title.toLowerCase().replace(/ /g, '-')}.png`;
  const screenshotPath = path.join(screenshotsDir, screenshotFile);
  const screenshotExists = fs.existsSync(screenshotPath);

  detailedReports += `
    <h3>${title}</h3>
    <p><strong>URL:</strong> <a href="${url}" target="_blank">${url}</a></p>
    <p><strong>Load Time:</strong> ${loadTime} ms</p>
    <p><strong>Top 5 Slowest Resources:</strong></p>
    <ol>${topResources}</ol>
    ${screenshotExists ? `<img src="../screenshots/${screenshotFile}" alt="${title} Screenshot" style="max-width: 100%; border: 1px solid #ccc;" />` : '<p><em>No screenshot available</em></p>'}
    <hr />
  `;
}

summaryTable += '</table>';

// Full HTML
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Site Audit Report</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 40px;">
  <h1 style="color: #003366;">📊 Site Performance Summary Report</h1>
  ${summaryTable}
  <br />
  <h2>Details</h2>
  ${detailedReports}
</body>
</html>
`;

// Write to HTML file
fs.writeFileSync(outputHtmlPath, htmlContent, 'utf-8');

console.log(`✅ HTML report generated at ${outputHtmlPath}`);
