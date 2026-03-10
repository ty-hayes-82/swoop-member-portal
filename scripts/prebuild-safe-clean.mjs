import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const distPath = path.resolve('dist');

if (!fs.existsSync(distPath)) {
  process.exit(0);
}

try {
  fs.rmSync(distPath, { recursive: true, force: true });
  console.log('[prebuild-safe-clean] Removed existing dist directory.');
} catch (error) {
  if (error.code === 'EACCES' || error.code === 'EPERM') {
    const backupPath = `${distPath}.locked-${Date.now()}`;
    fs.renameSync(distPath, backupPath);
    console.warn(
      `[prebuild-safe-clean] Could not remove dist due to permissions. Moved locked directory to ${path.basename(
        backupPath
      )}.`
    );
    console.warn('[prebuild-safe-clean] You may manually delete the backup directory when convenient.');
  } else {
    console.error('[prebuild-safe-clean] Failed to clean dist directory.', error);
    process.exitCode = 1;
    throw error;
  }
}
