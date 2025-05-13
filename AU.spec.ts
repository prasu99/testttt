import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';


// Ensure screenshots directory exists
const screenshotsDir = './screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}


// Set test timeout to 60 seconds
test.setTimeout(180000);


// Helper functions
async function setupPage(page: Page) {
  await page.setViewportSize({ width: 1280, height: 720 });
  page.on('pageerror', error => console.error('[RUNTIME ERROR]', error));
}

// Add delay function
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capturePerformanceMetrics(page: Page, pageUrl: string) {
  const performanceEntries = await page.evaluate(() => {
    return performance.getEntriesByType('resource')
      .map(entry => ({
        name: entry.name,
        duration: Number(entry.duration.toFixed(1)),
        initiatorType: (entry as PerformanceResourceTiming).initiatorType || 'unknown'
      }))
      .filter(entry => {
        try {
          const url = new URL(entry.name);
          return url.hostname.includes('forbes.com');
        } catch {
          return false;
        }
      })
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
  });

  console.log(`\nTop 5 slowest internal resources for ${pageUrl}:`);
  console.table(performanceEntries);
}

async function runPageAudit(page: Page, pageUrl: string, expectedTitle: string) {
  const start = Date.now();
  const title = test.info().title.replace(/ /g, '-');

  try {
    console.log(`[STATUS] Starting audit for ${test.info().title}`);
    await setupPage(page);
    await page.goto(pageUrl);

    // Basic page checks
    await expect(page.locator('h1')).toContainText(expectedTitle);
    await expect(page.getByRole('link', { name: 'forbes', exact: true })).toBeVisible();

    // Performance metrics
    const loadTime = ((Date.now() - start) / 1000).toFixed(3);
    test.info().annotations.push({ type: 'metric', description: `LoadTime:${loadTime}` });
    await capturePerformanceMetrics(page, pageUrl);

    // Screenshot
    await page.screenshot({ path: path.join(screenshotsDir, `${title}.png`), fullPage: true });
    console.log(`[INFO] Screenshot saved for ${test.info().title} audit`);
    console.log(`[STATUS] ${test.info().title} audit complete ✅`);
  } catch (error) {
    console.error(`[ERROR] ${test.info().title} audit failed ❌`, error);
    await page.screenshot({ path: path.join(screenshotsDir, `${title}-failure.png`), fullPage: true });
    throw error;
  }
}

// Common assertions that are used across all pages
async function verifyCommonElements(page: Page) {
  await expect(page.getByRole('link', { name: 'Forbes Logo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'forbes', exact: true })).toBeVisible();
}

// Performance metrics tracking with total load time
async function trackPerformanceMetrics(page: Page, pageUrl: string) {
  const startTime = Date.now();
  
  const performanceEntries = await page.evaluate(() => {
    return performance.getEntriesByType('resource')
      .map(entry => ({
        name: entry.name,
        duration: Number(entry.duration.toFixed(1)),
        initiatorType: (entry as PerformanceResourceTiming).initiatorType || 'unknown'
      }))
      .filter(entry => {
        try {
          const url = new URL(entry.name);
          return url.hostname.includes('forbes.com');
        } catch {
          return false;
        }
      })
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
  });

  const totalLoadTime = ((Date.now() - startTime) / 1000).toFixed(3);
  console.log(`\nTotal Load Time for ${pageUrl}: ${totalLoadTime} seconds`);
  console.log(`\nTop 5 slowest internal resources for ${pageUrl}:`);
  console.table(performanceEntries);
  
  // Add load time to test annotations
  test.info().annotations.push({ 
    type: 'metric', 
    description: `Total Load Time: ${totalLoadTime}s` 
  });
}

// Home page test
test('Home page verification', async ({ page }) => {
  await setupPage(page);
  await page.goto('https://www.forbes.com/advisor/au/');
  await expect(page.locator('h1')).toContainText('Smart Financial Decisions Made Simple');
  await expect(page.getByRole('link', { name: 'Forbes Logo' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Smart Financial Decisions' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'forbes', exact: true })).toBeVisible();
  await trackPerformanceMetrics(page, 'Home page');
  await delay(60000); // 1 minute delay
});

// Investing page test
test('Investing page verification', async ({ page }) => {
  await setupPage(page);
  await page.goto('https://www.forbes.com/advisor/au/investing/');
  await expect(page.locator('h1')).toContainText('How To Invest');
  await expect(page.getByRole('link', { name: 'Forbes Logo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'forbes', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'How To Invest', exact: true }).click();
  await expect(page.getByRole('link', { name: 'How To Invest', exact: true })).toBeVisible();
  await trackPerformanceMetrics(page, 'Investing page');
  await delay(60000); // 1 minute delay
});

// Credit Cards page test
test('Credit Cards page verification', async ({ page }) => {
  await setupPage(page);
  await page.goto('https://www.forbes.com/advisor/au/credit-cards/best-credit-cards/');
  await expect(page.locator('h1')).toContainText('Our Pick Of The Best Credit Cards For Australians');
  await expect(page.getByRole('link', { name: 'Forbes Logo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'forbes', exact: true })).toBeVisible();
  await trackPerformanceMetrics(page, 'Credit Cards page');
  await delay(60000); // 1 minute delay
});

