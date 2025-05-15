import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.setTimeout(900000); // 15 minutes

const screenshotsDir = './screenshots';
const reportsDir = './reports';
const performanceCsvPath = path.join(reportsDir, 'performance-metrics.csv');

if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

const pages = [
  {
    title: 'Forbes Advisor Canada – Helping You Make Smart Financial Decisions',
    url: 'https://www.forbes.com/advisor/ca/',
    h1: 'Smart Financial Decisions Made Simple'
  },
  {
    title: '12 Best Travel Credit Cards In Canada For 2025-Forbes Advisor Canada',
    url: 'https://www.forbes.com/advisor/ca/credit-cards/best/travel/',
    h1: 'Best Travel Credit Cards In Canada For 2025'
  },
  {
    title: '10 Best Cash Back Credit In Canada For 2025-Forbes Advisor Canada',
    url: 'https://www.forbes.com/advisor/ca/credit-cards/best/cash-back/',
    h1: 'Best Cash Back Credit Canada In Canada For 2025'
  },
  {
    title: 'Business-Forbes-Advisor Canada',
    url: 'https://www.forbes.com/advisor/ca/business/',
    h1: 'Transform Your Small Business'
  },
  {
    title: 'Best Mortgage Lenders In Canada For 2025-Forbes-Advisor Canada',
    url: 'https://www.forbes.com/advisor/ca/mortgages/best-mortgage-lenders/',
    h1: 'Best Mortgage Lenders In Canada For 2025'
  },
  {
    title: 'Best Mortgage Rates In Canada For 2025',
    url: 'https://www.forbes.com/advisor/ca/mortgages/best-mortgage-rates-in-canada/',
    h1: 'Best Mortgage Rates In Canada For 2025'
  },
  {
    title: 'Best Mortgage Rates In Canada-Forbes Advisor Canad ',
    url: 'https://www.forbes.com/advisor/ca/mortgages/best-mortgage-rates-in-canada/',
    h1: 'Best Mortgage Rates In Canada For 2025'
  },
  {
    title: 'Best Personal Loans In Canada For 2025',
    url: 'https://www.forbes.com/advisor/ca/personal-loans/best-personal-loans/',
    h1: 'Best Personal Loans In Canada For 2025'
  },
  {
    title: 'Best GIC Rates In Canada For 2025-Forbes Advisor Canad',
    url: 'https://www.forbes.com/advisor/ca/banking/gic/best-gic-rates/',
    h1: 'Best GIC Rates In Canada For 2025'
  },
  {
    title: 'Best Savings Accounts In Canada For 2025-Forbes Advisor Canad',
    url: 'https://www.forbes.com/advisor/ca/banking/savings/best-savings-accounts/',
    h1: 'Best Savings Accounts In Canada For 2025'
  },
  {
    title: 'Best Chequing Accounts In Canada For 2025-Forbes Advisor Canad',
    url: 'https://www.forbes.com/advisor/ca/banking/chequing/best-chequing-accounts/',
    h1: 'Best Chequing Accounts In Canada For 2025'

  }

];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Write CSV header
fs.writeFileSync(performanceCsvPath, 'Page,URL,LoadTime(ms),TopSlowResources\n');

test('Delayed audit of Forbes CA pages with performance CSV', async ({ page }) => {
  for (let i = 0; i < pages.length; i++) {
    const { url, title } = pages[i];
    const screenshotPath = path.join(screenshotsDir, `${title.toLowerCase().replace(/ /g, '-')}.png`);
    const resources: { url: string; duration: number }[] = [];

    const requestTimings = new Map<string, number>();

    page.on('request', request => {
      if (request.url().includes('forbes.com/advisor/ca/')) {
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
      const startTime = Date.now();
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
