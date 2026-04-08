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
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Enter Demo Mode/i }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Guided Demo/i }).click();
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
  await page.locator(`nav >> text=/${route}/i`).first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);
}
