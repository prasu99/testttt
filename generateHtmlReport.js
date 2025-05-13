const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'reports', 'performance-metrics.csv');
const screenshotsDir = path.join(__dirname, 'screenshots');
const htmlPath = path.join(__dirname, 'reports', 'report.html');

function parseCSV(csvFilePath) {
  const lines = fs.readFileSync(csvFilePath, 'utf-8').trim().split('\n');
  const [header, ...rows] = lines;
  return rows.map(row => {
    const [page, url, loadTime, topResources] = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(field =>
      field.replace(/^"|"$/g, '')
    );

    const resources = topResources.split(';').map(item => item.trim()).filter(Boolean);
    return { page, url, loadTime, resources };
  });
}

function generateHTMLReport(data) {
  return `
    <html>
      <head>
        <title>Performance Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background-color: #f9f9f9;
          }
          h1 {
            color: #333;
          }
          h2 {
            margin-top: 40px;
            color: #444;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background-color: #fff;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            color: #333;
          }
          img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ccc;
            margin-top: 10px;
          }
          ol {
            margin: 10px 0 10px 20px;
          }
        </style>
      </head>
      <body>
        <h1>Forbes AU Site Audit Report</h1>
        ${data
          .map(item => {
            const screenshotName = `${item.page.toLowerCase().replace(/ /g, '-')}.png`;
            const screenshotPath = path.join('screenshots', screenshotName);

            const numberedResources = item.resources.map((res, index) => `<li>${res}</li>`).join('');

            return `
              <h2>${item.page}</h2>
              <table>
                <tr><th>URL</th><td><a href="${item.url}" target="_blank">${item.url}</a></td></tr>
                <tr><th>Load Time (ms)</th><td>${item.loadTime}</td></tr>
                <tr><th>Top 5 Slowest Resources</th><td><ol>${numberedResources}</ol></td></tr>
              </table>
              <div>
                <strong>Screenshot:</strong><br>
                <img src="../screenshots/${screenshotName}" alt="${item.page} Screenshot" />
              </div>
            `;
          })
          .join('')}
      </body>
    </html>
  `;
}

// Generate report
const data = parseCSV(csvPath);
const html = generateHTMLReport(data);
fs.writeFileSync(htmlPath, html, 'utf-8');
console.log(`✅ HTML report with screenshots saved at ${htmlPath}`);
