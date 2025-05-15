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
    title: 'Home',
    url: 'https://www.forbes.com/advisor/it/',
    h1: 'Scelte finanziarie intelligenti in tutta semplicità'
  },
  {
    title: 'Investing',
    url: 'https://www.forbes.com/advisor/it/investire/',
    h1: 'Investire soldi'
  },
  {
    title: 'Credit Cards',
    url: 'https://www.forbes.com/advisor/it/carta-di-credito/migliori-carte-di-credito/',
    h1: 'Le migliori carte di credito nel 2025'
  },
  {
    title: 'Personal Loans',
    url: 'https://www.forbes.com/advisor/it/prestiti/miglior-prestito-online/',
    h1: 'I migliori prestiti online, la classifica'
  },
  {
    title: 'Car Insurance',
    url: 'https://www.forbes.com/advisor/it/assicurazione-auto/assicurazione-auto-online-economica/',
    h1: 'Assicurazione auto online più economica nel 2025'
  },
  {
    title: 'Travel Insurance',
    url: 'https://www.forbes.com/advisor/it/assicurazione-viaggio/',
    h1: 'Assicurazione viaggio: quando farla e quale scegliere'
  },
  {
    title: 'Life Insurance',
    url: 'https://www.forbes.com/advisor/it/assicurazione-vita/miglior-assicurazione-vita/',
    h1: 'La migliore assicurazione vita'
  },
  {
    title: 'Current Account',
    url: 'https://www.forbes.com/advisor/it/conto-corrente/miglior-conto-corrente-online/',
    h1: 'Il miglior conto corrente online: classifica 2025'
  },
  {
    title: 'Business',
    url: 'https://www.forbes.com/advisor/it/business/',
    h1: 'Crea il tuo business'
  },
  {
    title: 'Cryptocurrency',
    url: 'https://www.forbes.com/advisor/it/investire/criptovalute/',
    h1: 'Investire in criptovalute'
  },
  {
    title: 'ETF',
    url: 'https://www.forbes.com/advisor/it/investire/etf/',
    h1: 'Investire in ETF'
  }
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Write CSV header
fs.writeFileSync(performanceCsvPath, 'Page,URL,LoadTime(ms),TopSlowResources\n');

test('Delayed audit of Forbes IT pages with performance CSV', async ({ page }) => {
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
