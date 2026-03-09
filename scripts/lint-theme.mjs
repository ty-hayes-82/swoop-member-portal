import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'src');

const FORBIDDEN_PATTERNS = [
  /#4ade80/gi,
  /#22c55e/gi,
  /#10b981/gi,
  /#34d399/gi,
  /#16a34a/gi,
  /#059669/gi,
  /#15803d/gi,
  /\bemerald\b/gi,
  /\bteal\b/gi,
  /green-[a-z0-9-]*/gi,
  /rgba\(\s*74\s*,\s*222\s*,\s*128/gi,
  /rgba\(\s*34\s*,\s*197\s*,\s*94/gi,
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
    if (/\.(js|jsx|ts|tsx|css)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const findings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const pattern of FORBIDDEN_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        findings.push({
          filePath,
          line: index + 1,
          text: line.trim(),
          pattern: pattern.source,
        });
      }
    }
  }

  return findings;
}

if (!fs.existsSync(SRC_DIR)) {
  console.error('lint-theme: src directory not found');
  process.exit(1);
}

const files = walk(SRC_DIR);
const findings = files.flatMap(scanFile);

if (findings.length === 0) {
  console.log('lint-theme: no forbidden color tokens found');
  process.exit(0);
}

console.error(`lint-theme: found ${findings.length} forbidden color token(s):`);
for (const finding of findings) {
  const rel = path.relative(process.cwd(), finding.filePath);
  console.error(`- ${rel}:${finding.line} (${finding.pattern})`);
  console.error(`  ${finding.text}`);
}
process.exit(1);
