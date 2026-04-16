/**
 * scripts/lib/infra.mjs
 *
 * Shared infrastructure utilities for Swoop scoring scripts.
 * Extracted from app-vision-critique.mjs so both scripts share the same code.
 */

import fs from 'fs';
import path from 'path';

// ─── Utilities ────────────────────────────────────────────────────────────────

export function makeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

export async function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeFileSafe(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✓ ${path.relative(process.cwd(), filePath)}`);
}

export function extractScore(markdownText) {
  const m = markdownText.match(/Overall\s+Score:\s*(\d{1,3})\s*\/\s*100/i);
  return m ? parseInt(m[1], 10) : null;
}

export function compositeScore(agentScores) {
  const valid = Object.values(agentScores).filter(s => typeof s === 'number');
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

export async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function geminiWithRetry(fn, maxAttempts = 3, baseDelayMs = 2000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err.message?.includes('429') || err.status === 429 || String(err).includes('429');
      const isLast = attempt === maxAttempts - 1;
      if (isLast) throw err;
      const delay = is429
        ? Math.min(baseDelayMs * Math.pow(2, attempt), 30_000)
        : baseDelayMs;
      console.warn(`  [retry ${attempt + 1}/${maxAttempts}] ${String(err.message || err).slice(0, 80)} — waiting ${delay}ms`);
      await sleep(delay);
    }
  }
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

export function parseCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  function parseLine(line) {
    const fields = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        let field = '';
        i++;
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
          else if (line[i] === '"') { i++; break; }
          else { field += line[i++]; }
        }
        fields.push(field);
        if (line[i] === ',') i++;
      } else {
        const end = line.indexOf(',', i);
        if (end === -1) { fields.push(line.slice(i)); break; }
        fields.push(line.slice(i, end));
        i = end + 1;
      }
    }
    return fields;
  }

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let n = 1; n < lines.length; n++) {
    const line = lines[n].trim();
    if (!line) continue;
    const values = parseLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    rows.push(row);
  }
  return rows;
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

export async function createClub(appUrl) {
  const ts = Date.now();
  const email = `app-critique-${ts}@critique.test`;
  const password = 'Critique1!';

  const res = await fetch(`${appUrl}/api/onboard-club`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clubName: 'Lakewood Country Club',
      city: 'Phoenix', state: 'AZ', zip: '85001',
      memberCount: 100, courseCount: 1, outletCount: 2,
      adminEmail: email,
      adminName: 'James Mitchell',
      adminPassword: password,
    }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (res.status !== 201 || !json?.clubId) {
    throw new Error(`onboard-club failed (status=${res.status}): ${text.slice(0, 300)}`);
  }
  console.log(`  Club created: ${json.clubId}`);
  return { clubId: json.clubId, email, password };
}

export async function login(appUrl, email, password) {
  const res = await fetch(`${appUrl}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (res.status !== 200 || !json?.token) {
    throw new Error(`login failed (status=${res.status}): ${text.slice(0, 300)}`);
  }
  console.log(`  Logged in as ${email}`);
  return { token: json.token, user: json.user };
}

export async function importCSV(appUrl, token, importType, csvPath, expectedRows) {
  console.log(`  Importing ${importType} from ${path.basename(csvPath)}…`);
  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(content);
  console.log(`    Parsed ${rows.length} rows (expected ~${expectedRows})`);

  const res = await fetch(`${appUrl}/api/import-csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ importType, rows }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (!res.ok) {
    console.warn(`    ⚠ import-csv returned ${res.status}: ${text.slice(0, 200)}`);
    return { accepted: 0, total: rows.length };
  }

  const accepted = json?.accepted ?? json?.inserted ?? json?.rows ?? rows.length;
  console.log(`    ✓ ${accepted}/${rows.length} rows accepted`);
  return { accepted, total: rows.length };
}

// ─── Browser Helpers ──────────────────────────────────────────────────────────

export async function injectAuthAndNavigate(context, appUrl, hash, token, user, clubId) {
  const page = await context.newPage();

  // Inject auth AND clear stale gate cache from previous pages in this context.
  // Stale swoop_gates causes isGateOpen() to return wrong values on first render.
  await page.addInitScript(({ token, user, clubId }) => {
    localStorage.setItem('swoop_auth_token', token);
    localStorage.setItem('swoop_auth_user', JSON.stringify(user));
    localStorage.setItem('swoop_club_id', clubId);
    // Clear the gate cache so DataProvider always fetches fresh /api/gates.
    // Without this, stale fb/tee-sheet flags from prior pages leak across stages.
    localStorage.removeItem('swoop_gates');
  }, { token, user, clubId });

  // Capture browser console errors for diagnostics
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.warn(`  [browser error] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    console.warn(`  [page crash] ${err.message}`);
  });

  await page.goto(`${appUrl}${hash}`, { waitUntil: 'networkidle', timeout: 30_000 });
  return page;
}

export async function captureScreenshot(page, outputPath, waitMs = 3000) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });

  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: outputPath, fullPage: true });

  // Blank-screen guard: if the screenshot is suspiciously small (< 40 KB),
  // the React app likely rendered a black/empty state. Wait another 6 s and retry.
  const stat = fs.statSync(outputPath);
  if (stat.size < 40_000) {
    console.warn(`  ⚠ ${path.basename(outputPath)} is ${stat.size} bytes — possible blank screen, retrying in 6 s…`);
    await page.waitForTimeout(6000);
    await page.screenshot({ path: outputPath, fullPage: true });
    const stat2 = fs.statSync(outputPath);
    console.log(`  🔁 Retry result: ${stat2.size} bytes`);
  }

  console.log(`  📸 ${path.basename(outputPath)}`);
  return outputPath;
}
