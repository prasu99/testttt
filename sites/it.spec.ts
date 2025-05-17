import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.setTimeout(900000); // 15 minutes

const site = 'IT';  // Hardcode or you can still get from env if you want: process.env.SITE || 'IT'
const screenshotsDir = `./screenshots/${site}`;
const reportsDir = `./reports/${site}`;
const performanceCsvPath = path.join(reportsDir, `performance-metrics-${site}.csv`);

// Ensure directories exist
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

// Pages to test for IT site
const pages = [
  {
    title: 'Home',
    url: 'https://www.forbes.com/advisor/it/',
    h1: 'Scelte finanziarie intelligenti in tutta semplicità'
  },
  {
    title: 'Investing',
    url: 'https://www.forbes.com/advisor/it/investire/',
    h1: 'Investire soldi'
  }
  // Add more pages here as needed
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Write CSV header
fs.writeFileSync(performanceCsvPath, 'Page,URL,LoadTime(ms),TopSlowResources\n');

test('Performance audit for Forbes IT', async ({ page }) => {
  for (let i = 0; i < pages.length; i++) {
    const { url, title } = pages[i];
    const screenshotPath = path.join(screenshotsDir, `${title.toLowerCase().replace(/ /g, '-')}.png`);
    const resources: { url: string; duration: number }[] = [];
    const requestTimings = new Map<string, number>();

    page.on('request', request => {
      if (request.url().includes('forbes.com/advisor/it/')) {
        requestTimings.set(request.url(), Date.now());
      }
    });

    page.on('response', response => {
      const requestUrl = response.url();
      if (requestTimings.has(requestUrl)) {
        const start = requestTimings.get(requestUrl)!;
        const duration = Date.now() - start;
        resources.push({ url: requestUrl, duration });
      }
    });

    try {
      await page.goto(url, { waitUntil: 'load' });

      const loadTime = await page.evaluate(() => {
        const timing = window.performance.timing;
        return timing.loadEventEnd - timing.navigationStart;
      });

      await page.setViewportSize({ width: 1280, height: 720 });
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const topResources = resources
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .map(r => `${r.url} (${r.duration}ms)`)
        .join('; ');

      fs.appendFileSync(performanceCsvPath, `"${title}","${url}",${loadTime},"${topResources}"\n`);
      console.log(`✅ ${title} load time: ${loadTime} ms`);
    } catch (err) {
      console.error(`❌ Error visiting ${title}:`, err);
    }

    if (i < pages.length - 1) {
      console.log('⏳ Waiting 60 seconds...');
      await delay(60000);
    }
  }
});
