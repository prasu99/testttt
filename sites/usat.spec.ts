import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.setTimeout(900000); // 15 minutes

const screenshotsDir = './screenshots';
const reportsDir = './reports';
const performanceCsvPath = path.join(reportsDir, 'performance-metrics-USAT.csv');

if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

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
  }
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Write CSV header
fs.writeFileSync(performanceCsvPath, 'Page,URL,LoadTime(ms),TopSlowResources\n');

test('Delayed audit of USA TODAY Blueprint pages with performance CSV', async ({ page }) => {
  for (let i = 0; i < pages.length; i++) {
    const { url, title, h1, selector } = pages[i];
    const screenshotPath = path.join(screenshotsDir, `usat-${title.toLowerCase().replace(/ /g, '-')}.png`);
    const resources: { url: string; duration: number }[] = [];

    const requestTimings = new Map<string, number>();

    page.on('request', request => {
      if (request.url().includes('usatoday.com/money/blueprint')) {
        requestTimings.set(request.url(), Date.now());
      }
    });

    page.on('response', response => {
      const reqUrl = response.url();
      if (requestTimings.has(reqUrl)) {
        const start = requestTimings.get(reqUrl)!;
        const duration = Date.now() - start;
        resources.push({ url: reqUrl, duration });
      }
    });

    try {
      const start = Date.now();
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
