/**
 * Template for site-specific test file
 * Example for IT site - save as sites/IT.spec.ts
 */
import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Get site from environment or default
const site = process.env.SITE || 'IT';
test.setTimeout(900000); // 15 minutes

// Setup directories and paths with site-specific naming
const screenshotsDir = path.join('./screenshots', site);
const reportsDir = path.join('./reports', site);
const performanceCsvPath = path.join('./reports', `performance-metrics-${site}.csv`);

// Create directories if they don't exist
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

// Define pages to test - these are specific to the IT site
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
  // Add more pages as needed
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Write CSV header with site-specific naming
fs.writeFileSync(performanceCsvPath, 'Page,URL,LoadTime(ms),TopSlowResources\n');

test(`Performance audit for Forbes ${site}`, async ({ page }) => {
  for (let i = 0; i < pages.length; i++) {
    const { url, title } = pages[i];
    const screenshotPath = path.join(screenshotsDir, `${title.toLowerCase().replace(/ /g, '-')}.png`);
    const resources: { url: string; duration: number }[] = [];
    const requestTimings = new Map<string, number>();
    
    // Track request timing - note the site-specific URL pattern
    page.on('request', request => {
      if (request.url().includes(`forbes.com/advisor/${site.toLowerCase()}/`)) {
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
      // Navigate to the page
      await page.goto(url, { waitUntil: 'load' });
      
      // Measure performance
      const loadTime = await page.evaluate(() => {
        const timing = window.performance.timing;
        return timing.loadEventEnd - timing.navigationStart;
      });
      
      // Take screenshot
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      // Record top slow resources
      const topResources = resources
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .map(r => `${r.url} (${r.duration}ms)`)
        .join('; ');
      
      // Append to CSV
      fs.appendFileSync(performanceCsvPath, `"${title}","${url}",${loadTime},"${topResources}"\n`);
      console.log(`✅ ${title} load time: ${loadTime} ms`);
    } catch (err) {
      console.error(`❌ Error visiting ${title}:`, err);
    }
    
    // Delay between pages to avoid rate limiting
    if (i < pages.length - 1) {
      console.log(`⏳ Waiting 60 seconds before visiting next page...`);
      await delay(60000);
    }
  }
});
