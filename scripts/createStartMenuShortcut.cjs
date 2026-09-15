const { rmSync } = require('node:fs');
const { join } = require('node:path');
const { app, shell } = require('electron');
const appIdentity = require('../build/appIdentity.json');

const projectDir = join(__dirname, '..');

app.whenReady().then(() => {
  const shortcutPath = join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', `${appIdentity.displayName}.lnk`);
  rmSync(shortcutPath, { force: true });
  const wasWritten = shell.writeShortcutLink(shortcutPath, 'create', {
    target: process.execPath,
    args: `"${projectDir}"`,
    cwd: projectDir,
    icon: join(projectDir, 'build', 'armada.ico'),
    iconIndex: 0,
    description: appIdentity.description,
    appUserModelId: appIdentity.appUserModelId,
  });
  console.log(wasWritten ? `Shortcut written: ${shortcutPath}` : `Failed to write shortcut: ${shortcutPath}`);
  app.exit(wasWritten ? 0 : 1);
});
