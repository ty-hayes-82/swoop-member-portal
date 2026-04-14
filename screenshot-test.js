const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setViewportSize({ width: 1400, height: 900 });

  // Auth setup
  await page.goto('http://localhost:5174/#/today');
  
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

  await page.waitForTimeout(2500);

  // Screenshot pages
  const pages = [
    { hash: '#/today', file: 'test-results/deep-today.png' },
    { hash: '#/revenue', file: 'test-results/deep-revenue.png' },
    { hash: '#/members', file: 'test-results/deep-members.png' },
    { hash: '#/automations', file: 'test-results/deep-automations.png' }
  ];

  for (const p of pages) {
    await page.goto(`http://localhost:5174/${p.hash}`);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: p.file });
    console.log(`Screenshot saved: ${p.file}`);
  }

  await browser.close();
})();
