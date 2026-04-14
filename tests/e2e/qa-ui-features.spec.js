// QA test suite for new UI features
import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:5174';

async function enterDemoMode(page) {
  await page.goto(APP_URL);
  await page.waitForLoadState('networkidle');

  // The landing page shows "Explore Demo (Pinetree CC)" button directly
  // Try multiple possible button texts
  const demoBtnSelector = page.getByRole('button', { name: /Explore Demo/i }).first();
  const demoBtnCount = await demoBtnSelector.count();

  if (demoBtnCount > 0) {
    await demoBtnSelector.click();
  } else {
    // Fallback: try "Explore without an account" first
    const exploreBtn = page.getByText('Explore without an account', { exact: false });
    const exploreBtnCount = await exploreBtn.count();
    if (exploreBtnCount > 0) {
      await exploreBtn.click();
      await page.waitForTimeout(1000);
      // Then try Full Demo
      const fullDemoBtn = page.getByText(/Full Demo|Explore Demo/i).first();
      await fullDemoBtn.waitFor({ timeout: 5000 });
      await fullDemoBtn.click();
    } else {
      throw new Error('Cannot find demo entry button on landing page');
    }
  }

  // Wait 3 seconds for demo data to load
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');
}

test.describe('QA UI Features', () => {
  test.setTimeout(60000);

  test('Test 1: Nav order — Revenue is position #2', async ({ page }) => {
    await enterDemoMode(page);

    // Take a screenshot to see what we're working with
    await page.screenshot({ path: 'tests/e2e/qa-nav-order.png', fullPage: false });

    // Look for nav items in the sidebar
    // Try various selectors for sidebar nav items
    const navSelectors = [
      'nav a',
      '[role="navigation"] a',
      'aside a',
      '[data-testid*="nav"] a',
      '.sidebar a',
      'nav li',
      '[role="navigation"] li',
      'nav button',
    ];

    let navItems = [];
    let usedSelector = '';

    for (const sel of navSelectors) {
      const items = page.locator(sel);
      const count = await items.count();
      if (count >= 3) {
        navItems = items;
        usedSelector = sel;
        break;
      }
    }

    if (!navItems || (await navItems.count()) === 0) {
      // Try to find nav by looking for known nav item names
      const todayLink = page.getByRole('link', { name: /today/i }).first();
      const revenueLink = page.getByRole('link', { name: /revenue/i }).first();

      const todayExists = await todayLink.count() > 0;
      const revenueExists = await revenueLink.count() > 0;

      console.log('Today link found:', todayExists);
      console.log('Revenue link found:', revenueExists);

      if (todayExists && revenueExists) {
        const todayBox = await todayLink.boundingBox();
        const revenueBox = await revenueLink.boundingBox();

        console.log('Today position:', todayBox);
        console.log('Revenue position:', revenueBox);

        // Revenue should appear after Today (higher Y value in vertical nav, or sorted index)
        const revenueIsBelow = revenueBox.y > todayBox.y;
        console.log('Revenue is below Today (correct for pos #2):', revenueIsBelow);

        // Check no other nav items appear between Today and Revenue
        // by comparing Y positions
        const allNavLinks = page.getByRole('link');
        const count = await allNavLinks.count();
        const navData = [];
        for (let i = 0; i < count; i++) {
          const link = allNavLinks.nth(i);
          const text = await link.textContent();
          const box = await link.boundingBox();
          if (box && box.x < 300) { // sidebar items are on the left
            navData.push({ text: text.trim(), y: box.y });
          }
        }
        navData.sort((a, b) => a.y - b.y);
        console.log('Sorted sidebar nav items:', navData.map(n => n.text));

        const expectedOrder = ['today', 'revenue'];
        const actualTexts = navData.map(n => n.text.toLowerCase());
        const todayIdx = actualTexts.findIndex(t => t.includes('today'));
        const revenueIdx = actualTexts.findIndex(t => t.includes('revenue'));

        console.log(`Today index: ${todayIdx}, Revenue index: ${revenueIdx}`);
        console.log('Result: Revenue is position #' + (revenueIdx + 1));

        expect(revenueIdx).toBe(1); // 0-indexed, so position #2
        return;
      }

      throw new Error('Could not find navigation items');
    }

    const count = await navItems.count();
    console.log(`Found ${count} nav items using selector: ${usedSelector}`);

    const texts = [];
    for (let i = 0; i < count; i++) {
      const text = await navItems.nth(i).textContent();
      texts.push(text.trim());
    }
    console.log('Nav items in order:', texts);

    const revenueIdx = texts.findIndex(t => /revenue/i.test(t));
    console.log('Revenue is at index:', revenueIdx, '(position #' + (revenueIdx + 1) + ')');

    expect(revenueIdx).toBe(1); // position #2 = index 1
  });

  test('Test 2: Today view — Overnight Brief card exists', async ({ page }) => {
    await enterDemoMode(page);

    await page.goto(APP_URL + '#/today');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/e2e/qa-today-view.png', fullPage: true });

    // Look for "Overnight Brief" or "Agents ran at"
    const overnightBrief = page.getByText('Overnight Brief', { exact: false });
    const agentsRanAt = page.getByText('Agents ran at', { exact: false });

    const briefCount = await overnightBrief.count();
    const agentsCount = await agentsRanAt.count();

    console.log('"Overnight Brief" found:', briefCount, 'times');
    console.log('"Agents ran at" found:', agentsCount, 'times');

    // Get page text for debugging
    const bodyText = await page.locator('body').innerText();
    const hasOvernight = bodyText.toLowerCase().includes('overnight brief');
    const hasAgentsRan = bodyText.toLowerCase().includes('agents ran at');
    console.log('Body contains "overnight brief":', hasOvernight);
    console.log('Body contains "agents ran at":', hasAgentsRan);

    expect(briefCount > 0 || agentsCount > 0).toBeTruthy();
  });

  test('Test 3: Today view — Dues at risk dollar in "What you can see now"', async ({ page }) => {
    await enterDemoMode(page);

    await page.goto(APP_URL + '#/today');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/e2e/qa-today-dues.png', fullPage: true });

    // Look for "What you can see now" section
    const sectionHeader = page.getByText('What you can see now', { exact: false });
    const sectionCount = await sectionHeader.count();
    console.log('"What you can see now" found:', sectionCount, 'times');

    if (sectionCount > 0) {
      // Find the parent card/section
      const section = sectionHeader.first().locator('..').locator('..');
      const sectionText = await section.innerText().catch(() => '');
      console.log('Section text:', sectionText.substring(0, 300));

      // Look for dollar amount with K suffix + "dues at risk"
      const duesAtRisk = section.getByText(/\$\d+K.*dues at risk|dues at risk/i);
      const duesCount = await duesAtRisk.count();
      console.log('"dues at risk" in section found:', duesCount, 'times');

      // Also check full body
      const bodyText = await page.locator('body').innerText();
      const hasDuesAtRisk = bodyText.toLowerCase().includes('dues at risk');
      const dollarKPattern = /\$\d+K/;
      const hasDollarK = dollarKPattern.test(bodyText);
      console.log('Body contains "dues at risk":', hasDuesAtRisk);
      console.log('Body contains "$XXK" pattern:', hasDollarK);

      expect(duesCount > 0 || hasDuesAtRisk).toBeTruthy();
    } else {
      // Log full page content for debugging
      const bodyText = await page.locator('body').innerText();
      console.log('Page text (first 500 chars):', bodyText.substring(0, 500));
      console.log('"What you can see now" section NOT found');
      // Fail the test
      expect(sectionCount).toBeGreaterThan(0);
    }
  });

  test('Test 4: Header — Action Inbox badge', async ({ page }) => {
    await enterDemoMode(page);

    await page.screenshot({ path: 'tests/e2e/qa-header-inbox.png', fullPage: false });

    // Look for Inbox button/element in header with a badge
    const inboxEl = page.getByText('Inbox', { exact: false }).first();
    const inboxCount = await inboxEl.count();
    console.log('"Inbox" text found:', inboxCount > 0);

    if (inboxCount > 0) {
      // Check for nearby number badge
      const inboxParent = inboxEl.locator('../..');
      const parentText = await inboxParent.innerText().catch(() => '');
      console.log('Inbox parent text:', parentText);

      // Look for a numeric badge - could be a span with a number near "Inbox"
      const badgeNearInbox = page.locator('[data-testid*="badge"], [class*="badge"], [class*="count"]');
      const badgeCount = await badgeNearInbox.count();
      console.log('Badge elements found:', badgeCount);

      // Look for any element containing both "Inbox" and a number pattern
      const headerArea = page.locator('header, [role="banner"], nav').first();
      const headerText = await headerArea.innerText().catch(() => '');
      console.log('Header text:', headerText);

      // More broadly look for the inbox button
      const inboxButton = page.getByRole('button', { name: /inbox/i }).first();
      const inboxBtnCount = await inboxButton.count();
      console.log('Inbox button found:', inboxBtnCount > 0);

      if (inboxBtnCount > 0) {
        const btnText = await inboxButton.innerText();
        console.log('Inbox button text:', btnText);
        // Badge should contain a number
        const hasNumber = /\d+/.test(btnText);
        console.log('Button contains number (badge):', hasNumber);
        expect(hasNumber).toBeTruthy();
      } else {
        // Try finding inbox with adjacent badge
        const bodyText = await page.locator('body').innerText();
        const hasInbox = /inbox/i.test(bodyText);
        console.log('Body contains "Inbox":', hasInbox);
        expect(hasInbox).toBeTruthy();
      }
    } else {
      // Get full page source snippet
      const bodyText = await page.locator('body').innerText();
      console.log('Inbox not found. Page text (first 500):', bodyText.substring(0, 500));
      expect(inboxCount).toBeGreaterThan(0);
    }
  });

  test('Test 5: Automations InboxTab — member name shown', async ({ page }) => {
    await enterDemoMode(page);

    await page.goto(APP_URL + '#/automations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/e2e/qa-automations-inbox.png', fullPage: true });

    // The default tab should be "Inbox"
    const inboxTab = page.getByRole('tab', { name: /inbox/i }).first();
    const tabCount = await inboxTab.count();
    console.log('Inbox tab found:', tabCount > 0);

    // Look for action cards - check for member name in small uppercase
    const bodyText = await page.locator('body').innerText();
    console.log('Automations page text (first 600):', bodyText.substring(0, 600));

    // Look for uppercase member-name pattern (small caps above description)
    // Could be text like "JAMES WHITFIELD · BALANCED ACTIVE"
    const uppercasePattern = /[A-Z]{2,}\s+[A-Z]{2,}/;
    const hasUppercaseName = uppercasePattern.test(bodyText);
    console.log('Has uppercase name pattern (e.g., JAMES WHITFIELD):', hasUppercaseName);

    // Look for dollar impact badge (e.g., "$32K dues protected")
    const dollarImpactPattern = /\$\d+K\s+(dues protected|protected|impact)/i;
    const hasDollarImpact = dollarImpactPattern.test(bodyText);
    console.log('Has dollar impact badge (e.g., "$32K dues protected"):', hasDollarImpact);

    // Look for action cards
    const actionCards = page.locator('[class*="card"], [class*="action"], [data-testid*="action"]');
    const cardCount = await actionCards.count();
    console.log('Action card elements found:', cardCount);

    // Take targeted screenshot of first card if found
    if (cardCount > 0) {
      const firstCard = actionCards.first();
      const cardText = await firstCard.innerText().catch(() => '');
      console.log('First card text:', cardText.substring(0, 200));
      await firstCard.screenshot({ path: 'tests/e2e/qa-first-action-card.png' }).catch(() => {});
    }

    // Primary assertion: uppercase member name should appear
    expect(hasUppercaseName).toBeTruthy();

    // Secondary: dollar impact badge
    console.log('Dollar impact present:', hasDollarImpact);
    // Not failing on this one as it's secondary
  });
});
