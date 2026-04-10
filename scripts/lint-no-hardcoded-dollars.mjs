import fs from 'node:fs';
import path from 'node:path';

// Lint rule: forbid hardcoded dollar-value string literals in UI source.
// SHIP_PLAN §1.2 / §7 item 2. Real revenue/price numbers must come from
// data sources (src/data/, services, or props), never from inline JSX
// strings, so demo teasers don't masquerade as live data.
//
// Scans: src/features/**/*.{js,jsx} and src/components/**/*.{js,jsx}
// Allowlist:
//   - *.test.* / *.spec.* files
//   - files under src/data/ (fixture / seed data)
//   - lines containing the marker comment `// lint-no-hardcoded-dollars: allow`

const ROOTS = [
  path.resolve(process.cwd(), 'src', 'features'),
  path.resolve(process.cwd(), 'src', 'components'),
];

const DATA_DIR = path.resolve(process.cwd(), 'src', 'data');
const ALLOW_MARKER = 'lint-no-hardcoded-dollars: allow';

// Matches literals like $5, $1,200, $9.99, $12K, $1.5M, $99/yr, $10/mo, $25/month
const DOLLAR_LITERAL = /\$\d[\d,]*(?:\.\d+)?(?:[KMkm]|\/yr|\/mo|\/month)?/g;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (/\.(js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function isExemptFile(filePath) {
  const base = path.basename(filePath);
  if (/\.(test|spec)\.(js|jsx)$/.test(base)) return true;
  // Anything under src/data/ is fixture/seed data — exempt.
  const rel = path.relative(DATA_DIR, filePath);
  if (!rel.startsWith('..') && !path.isAbsolute(rel)) return true;
  return false;
}

// Walk chars and record, for every position, whether it sits inside a
// string literal (', ", or `). Comments are treated as non-string so the
// allow-marker comment can still be detected on the same line.
function buildStringMask(content) {
  const len = content.length;
  const mask = new Uint8Array(len);
  let i = 0;
  while (i < len) {
    const ch = content[i];
    const next = content[i + 1];
    // Line comment — skip through end of line, not a string.
    if (ch === '/' && next === '/') {
      while (i < len && content[i] !== '\n') i += 1;
      continue;
    }
    // Block comment — skip, not a string.
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < len && !(content[i] === '*' && content[i + 1] === '/')) i += 1;
      if (i < len) i += 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i += 1;
      while (i < len && content[i] !== quote) {
        if (content[i] === '\\' && i + 1 < len) {
          mask[i] = 1;
          mask[i + 1] = 1;
          i += 2;
          continue;
        }
        // Template interpolation: leave inner code unmasked.
        if (quote === '`' && content[i] === '$' && content[i + 1] === '{') {
          i += 2;
          let depth = 1;
          while (i < len && depth > 0) {
            if (content[i] === '{') depth += 1;
            else if (content[i] === '}') {
              depth -= 1;
              if (depth === 0) {
                i += 1;
                break;
              }
            }
            i += 1;
          }
          continue;
        }
        mask[i] = 1;
        i += 1;
      }
      if (i < len) i += 1;
      continue;
    }
    i += 1;
  }
  return mask;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const mask = buildStringMask(content);
  const lines = content.split(/\r?\n/);
  const findings = [];

  // Precompute line start offsets so we can map match index -> line.
  const lineStarts = [0];
  for (let i = 0; i < content.length; i += 1) {
    if (content[i] === '\n') lineStarts.push(i + 1);
  }

  DOLLAR_LITERAL.lastIndex = 0;
  let match;
  while ((match = DOLLAR_LITERAL.exec(content)) !== null) {
    const idx = match.index;
    // Only flag matches that live inside a string literal.
    if (!mask[idx]) continue;

    // Binary-search line number.
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= idx) lo = mid;
      else hi = mid - 1;
    }
    const lineNum = lo + 1;
    const lineText = lines[lo] || '';

    if (lineText.includes(ALLOW_MARKER)) continue;

    findings.push({
      filePath,
      line: lineNum,
      literal: match[0],
      text: lineText.trim(),
    });
  }

  return findings;
}

const files = ROOTS.flatMap(walk).filter((f) => !isExemptFile(f));
const findings = files.flatMap(scanFile);

if (findings.length === 0) {
  console.log('lint-no-hardcoded-dollars: no hardcoded dollar literals found');
  process.exit(0);
}

console.error(
  `lint-no-hardcoded-dollars: found ${findings.length} hardcoded dollar literal(s):`,
);
for (const finding of findings) {
  const rel = path.relative(process.cwd(), finding.filePath);
  console.error(`- ${rel}:${finding.line}:${finding.literal}`);
  console.error(`  ${finding.text}`);
}
console.error('');
console.error(
  'lint-no-hardcoded-dollars: move values to src/data/ or a service, or add ' +
    '`// lint-no-hardcoded-dollars: allow` on the same line with a reason.',
);
process.exit(1);
