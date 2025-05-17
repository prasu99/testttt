import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Get site code from environment or default to 'USAT'
const site = process.env.SITE || 'USAT';

test.setTimeout(1200000); // 20 minutes

// Directories and CSV file path specific to site
const screenshotsDir = path.join('./screenshots', site);
const reportsDir = path.join('./reports', site);
const performanceCsvPath = path.join(reportsDir, `performance-metrics-${site}.csv`);

// Ensure directories exist
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

// Define pages to test
const pages = [
  {
    title: 'Blueprint Home',
    url: 'https://www.usatoday.com/money/blueprint/',
    h1: 'USA TODAY Blueprint'
  },
  {
    title: 'Auto Insurance',
    url: 'https://www.usatoday.com/money/blueprint/auto-insurance/best-auto-insurance/',
    h1: 'Best car insurance companies'
  },
  {
    title: 'Pet Insurance',
    url: 'https://www.usatoday.com/money/blueprint/pet-insurance/best-pet-insurance/',
    h1: 'Best pet insurance companies of 2024'
  },
  {
    title: 'Life Insurance',
    url: 'https://www.usatoday.com/money/blueprint/life-insurance/best-life-insurance-companies/',
    h1: 'Best life insurance Companies'
  }
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Write CSV header (overwrite on each run)
fs.writeFileSync(performanceCsvPath, 'Page,URL,LoadTime(ms),TopSlowResources\n');

test(`Delayed audit of ${site} pages with performance CSV`, async ({ page }) => {
  for (let i = 0; i < pages.length; i++) {
    const { url, title } = pages[i];
    const screenshotPath = path.join(screenshotsDir, `${title.toLowerCase().replace(/ /g, '-')}.png`);
    const resources: { url: string; duration: number }[] = [];
    const requestTimings = new Map<string, number>();

    page.on('request', request => {
      if (request.url().includes('usatoday.com/money/blueprint')) {
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
