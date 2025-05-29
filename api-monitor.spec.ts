import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const apiUrls = [
  `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places`,
  `https://my.realvalidation.com?phonenumber=9054436346&source=IVL%20Moving%20Journey&REAL_VALIDATION_TOKEN=${process.env.REALVALIDATION_TOKEN}`,
  'https://forbesmarketplace.leadspediatrack.com/post.do'
];

const getHeadersForUrl = (url: string): Record<string, string> => {
  if (url.includes('googleapis')) {
    return {};
  } else if (url.includes('realvalidation')) {
    return {};
  } else if (url.includes('leadspediatrack')) {
    return { 'Content-Type': 'application/x-www-form-urlencoded' };
  }
  return {};
};

test('API Monitoring Test', async () => {
  for (const url of apiUrls) {
    const headers = getHeadersForUrl(url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const status = response.status;
      console.log(`URL: ${url} => Status: ${status}`);
      expect(status).toBeLessThan(400);
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
    }
  }
});
