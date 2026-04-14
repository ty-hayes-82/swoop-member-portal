const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PAGES = [
  { name: 'today', hash: '#/today' },
  { name: 'revenue', hash: '#/revenue' },
  { name: 'members', hash: '#/members' },
  { name: 'tee-sheet', hash: '#/tee-sheet' },
  { name: 'service', hash: '#/service' },
  { name: 'automations', hash: '#/automations' },
  { name: 'board-report', hash: '#/board-report' },
  { name: 'admin', hash: '#/admin' }
];

const BASE_URL = 'http://localhost:5174';
const RESULTS_DIR = '/C:/GIT/Development/swoop-member-portal/test-results';

async function setupAuth(page) {
  await page.evaluate(() => {
    localStorage.setItem('swoop_auth_token', 'demo');
    localStorage.setItem('swoop_auth_user', JSON.stringify({
      name: 'Test GM',
      role: 'gm',
      clubId: 'club_001',
      clubName: 'Demo Club'
    }));
    localStorage.setItem('swoop_data_mode', 'demo');
    window.dispatchEvent(new Event('swoop:auth-changed'));
  });
  await page.waitForTimeout(2000);
}

async function takeScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setViewportSize({ width: 1400, height: 900 });

  try {
    // Initial setup
    await page.goto(`${BASE_URL}/#/today`);
    await setupAuth(page);

    // Take screenshots for each page
    for (const { name, hash } of PAGES) {
      console.log(`Capturing ${name}...`);
      
      // Navigate by changing hash
      await page.evaluate((h) => {
        window.location.hash = h;
      }, hash);
      
      await page.waitForTimeout(2500);
      
      const screenshotPath = path.join(RESULTS_DIR, `audit-${name}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`✓ Saved to ${screenshotPath}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
