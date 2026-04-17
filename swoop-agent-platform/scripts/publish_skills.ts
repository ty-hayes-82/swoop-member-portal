/**
 * publish_skills.ts
 *
 * Registers each skill package with the Managed Agents API and stores skill IDs.
 * Idempotent: skips skills already registered.
 *
 * Usage:
 *   npx tsx scripts/publish_skills.ts [--dry-run]
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from '@vercel/postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_DIR = join(ROOT, 'skills');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const SKILLS_API = 'https://api.anthropic.com/v1/skills';
const BETA_HEADER = 'skills-2025-10-02';

interface SkillPackage {
  name: string;        // skill_club_vocabulary
  displayTitle: string; // Club Vocabulary
  dir: string;
  content: string;
}

function toDisplayTitle(dirName: string): string {
  return dirName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function injectFrontmatter(content: string, slugName: string, displayTitle: string): string {
  if (content.startsWith('---')) return content;
  const description = `${displayTitle} knowledge for private golf and country club agents.`;
  return `---\nname: ${slugName}\ndescription: ${description}\n---\n\n${content}`;
}

async function loadSkillPackages(): Promise<SkillPackage[]> {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  const packages: SkillPackage[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillMd = join(SKILLS_DIR, entry.name, 'SKILL.md');
    try {
      const raw = await readFile(skillMd, 'utf-8');
      const displayTitle = toDisplayTitle(entry.name);
      const slugName = entry.name.replace(/_/g, '-');
      const content = injectFrontmatter(raw, slugName, displayTitle);
      packages.push({ name: `skill_${entry.name}`, displayTitle, dir: entry.name, content });
    } catch {
      // No SKILL.md, skip
    }
  }

  return packages;
}

async function getExistingSkillId(skillName: string): Promise<string | null> {
  try {
    const result = await sql`
      SELECT skill_id FROM skill_registry WHERE skill_name = ${skillName} LIMIT 1
    `;
    return (result.rows[0]?.skill_id as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function upsertSkillRegistry(skillName: string, skillId: string): Promise<void> {
  await sql`
    INSERT INTO skill_registry (skill_name, skill_id, published_at)
    VALUES (${skillName}, ${skillId}, NOW())
    ON CONFLICT (skill_name)
    DO UPDATE SET skill_id = EXCLUDED.skill_id, published_at = NOW()
  `;
}

async function publishSkill(pkg: SkillPackage): Promise<string> {
  if (!API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');

  const form = new FormData();
  form.append('display_title', pkg.displayTitle);
  form.append('files[]', new Blob([pkg.content], { type: 'text/markdown' }), `${pkg.dir}/SKILL.md`);

  const res = await fetch(SKILLS_API, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': BETA_HEADER,
    },
    body: form,
  });

  const json = await res.json() as { id?: string; error?: { message: string } };
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json)}`);
  if (!json.id) throw new Error(`No id in response: ${JSON.stringify(json)}`);
  return json.id;
}

async function main() {
  const packages = await loadSkillPackages();
  console.log(`Found ${packages.length} skill packages`);

  const results = { published: [] as string[], skipped: [] as string[], errors: [] as string[] };

  for (const pkg of packages) {
    if (dryRun) {
      console.log(`  [dry-run] Would publish: ${pkg.name}`);
      results.published.push(pkg.name);
      continue;
    }

    const existingId = await getExistingSkillId(pkg.name);
    if (existingId) {
      console.log(`  [skip] ${pkg.name} already published (${existingId})`);
      results.skipped.push(pkg.name);
      continue;
    }

    try {
      const skillId = await publishSkill(pkg);
      await upsertSkillRegistry(pkg.name, skillId);
      console.log(`  [ok] Published ${pkg.name} → ${skillId}`);
      results.published.push(pkg.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [error] ${pkg.name}: ${msg}`);
      results.errors.push(`${pkg.name}: ${msg}`);
    }
  }

  console.log(`\nDone. Published: ${results.published.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`);
  if (results.errors.length > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
