const appIdentity = require('./build/appIdentity.json');

module.exports = {
  appId: appIdentity.appUserModelId,
  productName: appIdentity.displayName,
  directories: { output: 'dist', buildResources: 'build' },
  files: ['out/**', 'scripts/claudeHookRelay.cjs', 'scripts/claudeStatusLineRelay.cjs', 'build/armada.ico'],
  // PITFALL: node-pty ships N-API prebuilds that load in Electron as is; rebuilding it from source fails in winpty's build script.
  npmRebuild: false,
  asarUnpack: ['node_modules/node-pty/**'],
  win: { target: 'nsis', icon: 'build/armada.ico' },
  nsis: {
    artifactName: '${productName}-Setup-${version}.${ext}',
    oneClick: true,
    perMachine: false,
    shortcutName: appIdentity.displayName,
    createDesktopShortcut: false,
  },
  publish: { provider: 'github', owner: 'evanmassi', repo: 'armada' },
};
