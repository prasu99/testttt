const fs = require('fs');
const path = require('path');

const site = process.env.SITE || 'AU';
const jsonPath = `reports/performance-summary-${site.toLowerCase()}.json`;
const htmlPath = `reports/performance-report-${site}.html`;

if (!fs.existsSync(jsonPath)) {
  console.error(`No JSON data for ${site} at ${jsonPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

let html = `
<html>
<head>
  <title>Performance Report - ${site}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top; }
    th { background-color: #f5f5f5; }
    img { max-width: 300px; max-height: 200px; display: block; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>Performance Report - ${site}</h1>
  <table>
    <thead>
      <tr>
        <th>Page</th>
        <th>URL</th>
        <th>Load Time (ms)</th>
        <th>Top Slow Resources</th>
        <th>Screenshot</th>
      </tr>
    </thead>
    <tbody>
`;

for (const page of data) {
  const resourceList = page.topResources
    .map(r => `${r.url} (${r.duration}ms)`)
    .join('<br>');

  html += `
    <tr>
      <td>${page.title}</td>
      <td><a href="${page.url}" target="_blank">${page.url}</a></td>
      <td>${page.loadTime}</td>
      <td>${resourceList}</td>
      <td><img src="../${page.screenshot}" alt="Screenshot for ${page.title}"/></td>
    </tr>
  `;
}

html += `
    </tbody>
  </table>
</body>
</html>
`;

fs.writeFileSync(htmlPath, html);
console.log(`✅ HTML report generated at ${htmlPath}`);
