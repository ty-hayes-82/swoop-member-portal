// Shared helpers for combination tests
export const APP_URL = process.env.APP_URL || 'http://localhost:5173';

export const DEMO_MEMBERS = [
  'James Whitfield', 'Robert Callahan', 'Jennifer Walsh', 'Nathan Burke',
  'Mark Patterson', 'Greg Holloway', 'Paul Serrano', 'Anne Jordan',
  'Sandra Chen', 'Kevin Hurst',
];

export async function enterGuidedDemo(page) {
  await page.goto(APP_URL);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });
  // Two-step login: "Explore without an account" → "Guided Demo"
  await page.getByRole('button', { name: /Explore without/i }).click({ timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /Guided Demo/i }).click({ timeout: 10000 });
  await page.waitForTimeout(2000);
}

export async function importGates(page, gateIds) {
  await page.evaluate((gates) => {
    const gateToFiles = {
      members: ['JCM_Members_F9'], 'tee-sheet': ['TTM_Tee_Sheet_SV'],
      fb: ['POS_Sales_Detail_SV'], complaints: ['JCM_Service_Requests_RG'],
      email: ['CHO_Email_Events_SV'], weather: ['7shifts_Staff_Shifts'],
      pipeline: ['JCM_Club_Profile'], agents: ['_agents'],
    };
    const files = gates.flatMap(g => gateToFiles[g] || []);
    sessionStorage.setItem('swoop_demo_files', JSON.stringify(files));
    sessionStorage.setItem('swoop_demo_gates', JSON.stringify(gates));
    window.dispatchEvent(new CustomEvent('swoop:demo-sources-changed', { detail: { action: 'load' } }));
  }, gateIds);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
}

export async function getText(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  return page.evaluate(() => document.body.innerText);
}

export async function nav(page, route) {
  await page.locator(`nav >> text=/${route}/i`).first().click({ timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);
}

/**
 * Capture structured insights from the current page.
 * Returns an object with boolean presence flags and metrics.
 */
export async function capturePageInsights(page, pageName) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  // Retry on context destruction (navigation race)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await page.evaluate(() => document.body.innerText);
      if (text.length < 100 && attempt === 0) {
        await page.waitForTimeout(2000);
        continue;
      }
      break;
    } catch {
      await page.waitForTimeout(1500);
    }
  }
  return page.evaluate((pName) => {
    const body = document.body.innerText;
    return {
      page: pName,
      contentLength: body.length,
      // Feature presence flags
      hasRoundsBooked: /rounds booked/i.test(body),
      hasMemberNames: /James Whitfield|Robert Callahan|Jennifer Walsh|Nathan Burke|Mark Patterson/.test(body),
      hasHealthScores: /\bHEALTHY\b\s*\d+%|\bWATCH\b\s*\d+%|\bAT RISK\b\s*\d+%|\bCRITICAL\b\s*\d+%|Health Score Breakdown/i.test(body),
      hasArchetypes: /Die-Hard Golfer|Social Butterfly|Weekend Warrior/.test(body),
      hasServiceConsistency: /resolution rate|Complaints by Day|understaffed complaint/i.test(body),
      hasBoardReportData: !/Board report needs data/i.test(body) && /Members Retained|Retention Rate|Board Confidence/i.test(body),
      hasBoardReportEmpty: /Board report needs data/i.test(body),
      hasTeeTimes: /7:00 AM|8:00 AM|9:00 AM/.test(body),
      hasNoTeeSheetData: /No tee sheet data/i.test(body),
      hasNoMembers: /No members imported|Member intelligence|roster imported/i.test(body),
      hasAutomationsPending: /\bApprove\b|actions need review/i.test(body),
      hasAllCaughtUp: /All caught up/i.test(body),
      hasSpendingTrend: /Spending Trend/i.test(body),
      hasForecast: /5-Day Forecast|Tomorrow.s Forecast/i.test(body),
      hasPriorityAlerts: /Priority Member Alerts/i.test(body),
      hasWeatherData: /Google Weather|cloudy|sunny|rainy/i.test(body),
      hasStaffingData: /Understaffed Days|Shift Coverage|staffing gap/i.test(body),
      hasEmailDecay: /Email Decay|email engagement/i.test(body),
      hasActionQueue: /Action Queue/i.test(body),
      hasMembersRetained: /Members Retained/i.test(body),
      hasComplaintData: /resolution rate|Complaints by Day|open complaint|unresolved complaint/i.test(body),
      // Numeric metrics (bold numbers)
      metrics: (() => {
        const nums = [];
        document.querySelectorAll('[class*="font-bold"], [class*="text-2xl"], [class*="text-3xl"]').forEach(el => {
          const t = el.textContent.trim();
          if (/^\$?[\d,.]+[%°]?$/.test(t) && t.length < 20) nums.push(t);
        });
        return nums;
      })(),
      // First 500 chars for qualitative review
      textPreview: body.substring(0, 500).replace(/\s+/g, ' ').trim(),
    };
  }, pageName);
}

