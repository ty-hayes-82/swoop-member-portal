import fs from 'node:fs';
import path from 'node:path';

// Lint rule: forbid reading clubId from req.body or req.query in any file
// under api/, EXCEPT for files under api/lib/ (helpers) and api/migrations/
// (frozen). The source of truth for the caller's club is req.auth.clubId,
// populated by withAuth. This prevents the "trust client-supplied clubId"
// pattern the W3 audit uncovered.

const API_DIR = path.resolve(process.cwd(), 'api');

// Directories (relative to api/) that are exempt from this rule.
const EXEMPT_DIRS = ['lib', 'migrations'];

// Patterns that indicate a forbidden read. Each entry has a regex and a
// human-readable label used in the violation output.
const FORBIDDEN_PATTERNS = [
  {
    label: "req.body.clubId — use req.auth.clubId from withAuth",
    regex: /req\.body\s*\?\.\s*clubId\b/g,
  },
  {
    label: "req.body.clubId — use req.auth.clubId from withAuth",
    regex: /req\.body\s*\.\s*clubId\b/g,
  },
  {
    label: "req.body['clubId'] — use req.auth.clubId from withAuth",
    regex: /req\.body\s*\[\s*['"]clubId['"]\s*\]/g,
  },
  {
    label: "req.query.clubId — use req.auth.clubId from withAuth",
    regex: /req\.query\s*\?\.\s*clubId\b/g,
  },
  {
    label: "req.query.clubId — use req.auth.clubId from withAuth",
    regex: /req\.query\s*\.\s*clubId\b/g,
  },
  {
    label: "req.query['clubId'] — use req.auth.clubId from withAuth",
    regex: /req\.query\s*\[\s*['"]clubId['"]\s*\]/g,
  },
  {
    label: "destructured clubId from req.body/req.query — use req.auth.clubId from withAuth",
    regex: /(?:const|let|var)\s*\{\s*[^}]*\bclubId\b[^}]*\}\s*=\s*req\s*\.\s*(?:body|query)\b/g,
  },
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function isExempt(filePath) {
  const rel = path.relative(API_DIR, filePath).split(path.sep);
  return EXEMPT_DIRS.includes(rel[0]);
}

// Strip comments and string literals from source so the linter only matches
// real code. Block comments span multiple lines, so we operate on the whole
// content and then split into lines after masking. We replace comments and
// string literals with spaces of equal length so that line/column offsets
// of surviving code are preserved.
function stripCommentsAndStrings(content) {
  const out = content.split('');
  const len = content.length;
  let i = 0;
  while (i < len) {
    const ch = content[i];
    const next = content[i + 1];
    // Line comment
    if (ch === '/' && next === '/') {
      while (i < len && content[i] !== '\n') {
        out[i] = ' ';
        i += 1;
      }
      continue;
    }
    // Block comment
    if (ch === '/' && next === '*') {
      out[i] = ' ';
      out[i + 1] = ' ';
      i += 2;
      while (i < len && !(content[i] === '*' && content[i + 1] === '/')) {
        if (content[i] !== '\n' && content[i] !== '\r') out[i] = ' ';
        i += 1;
      }
      if (i < len) {
        out[i] = ' ';
        out[i + 1] = ' ';
        i += 2;
      }
      continue;
    }
    // String literal (', ", `) — handle escapes and (for templates) skip ${...}
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      out[i] = ' ';
      i += 1;
      while (i < len && content[i] !== quote) {
        if (content[i] === '\\' && i + 1 < len) {
          if (content[i] !== '\n') out[i] = ' ';
          if (content[i + 1] !== '\n') out[i + 1] = ' ';
          i += 2;
          continue;
        }
        if (quote === '`' && content[i] === '$' && content[i + 1] === '{') {
          // Leave interpolation contents alone so real code inside templates
          // is still scanned.
          out[i] = ' ';
          out[i + 1] = ' ';
          i += 2;
          let depth = 1;
          while (i < len && depth > 0) {
            if (content[i] === '{') depth += 1;
            else if (content[i] === '}') {
              depth -= 1;
              if (depth === 0) {
                out[i] = ' ';
                i += 1;
                break;
              }
            }
            i += 1;
          }
          continue;
        }
        if (content[i] !== '\n' && content[i] !== '\r') out[i] = ' ';
        i += 1;
      }
      if (i < len) {
        out[i] = ' ';
        i += 1;
      }
      continue;
    }
    i += 1;
  }
  return out.join('');
}

function scanFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const content = stripCommentsAndStrings(raw);
  const lines = content.split(/\r?\n/);
  const rawLines = raw.split(/\r?\n/);
  const findings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    // Same-line exemption pragma: `// lint-clubid-allow: <reason>`
    // Only honored when a reason follows the colon. Used sparingly for
    // intentional public / cross-club admin reads that are documented inline.
    const rawLine = rawLines[index] || '';
    const pragmaMatch = rawLine.match(/\/\/\s*lint-clubid-allow:\s*(\S.*)$/);
    if (pragmaMatch) continue;
    for (const { regex, label } of FORBIDDEN_PATTERNS) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        findings.push({
          filePath,
          line: index + 1,
          col: match.index + 1,
          text: (rawLines[index] || '').trim(),
          label,
        });
      }
    }
  }

  return findings;
}

if (!fs.existsSync(API_DIR)) {
  console.error('lint-clubid: api directory not found');
  process.exit(1);
}

const files = walk(API_DIR).filter((f) => !isExempt(f));
const findings = files.flatMap(scanFile);

if (findings.length === 0) {
  console.log('lint-clubid: no forbidden req.body.clubId / req.query.clubId reads found');
  process.exit(0);
}

console.error(`lint-clubid: found ${findings.length} forbidden clubId read(s):`);
for (const finding of findings) {
  const rel = path.relative(process.cwd(), finding.filePath);
  console.error(`- ${rel}:${finding.line}:${finding.col}  forbidden: ${finding.label}`);
  console.error(`  ${finding.text}`);
}
console.error(
  `lint-clubid: ${findings.length} violation(s). ` +
    'Use req.auth.clubId (populated by withAuth) as the source of truth.'
);
process.exit(1);
