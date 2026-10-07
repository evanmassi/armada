import { chmodSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const prebuildsFolder = join(dirname(createRequire(import.meta.url).resolve('node-pty/package.json')), 'prebuilds');

// PITFALL: node-pty publishes its macOS spawn-helper without the executable bit, and every pty spawn fails with posix_spawnp until it has one.
for (const platformFolder of readdirSync(prebuildsFolder).filter((name) => name.startsWith('darwin-'))) {
  chmodSync(join(prebuildsFolder, platformFolder, 'spawn-helper'), 0o755);
}
