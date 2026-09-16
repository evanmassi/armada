const { readFileSync, writeFileSync } = require('node:fs');
const { homedir } = require('node:os');
const { join } = require('node:path');

const settingsPath = join(homedir(), '.claude', 'settings.json');
const hookScript = join(__dirname, 'claudeSessionStartHook.cjs').split('\\').join('/');
const command = `node "${hookScript}"`;

const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
const hooks = (settings.hooks ??= {});
const sessionStart = (hooks.SessionStart ??= []);
const isInstalled = sessionStart.some((group) => (group.hooks ?? []).some((hook) => hook.command === command));

if (isInstalled) {
  console.log(`SessionStart hook already present: ${command}`);
} else {
  sessionStart.push({ hooks: [{ type: 'command', command }] });
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  console.log(`SessionStart hook written to ${settingsPath}: ${command}`);
}
