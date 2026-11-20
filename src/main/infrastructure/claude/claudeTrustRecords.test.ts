import { describe, expect, it } from 'vitest';
import { claudeGlobalConfigSchema, isFolderTrusted } from './claudeTrustRecords';

const DIAGRAMS_DIR = 'C:\\Users\\evan\\AppData\\Roaming\\armada\\diagrams';

const configTrusting = (...paths: string[]) =>
  claudeGlobalConfigSchema.parse({ projects: Object.fromEntries(paths.map((path) => [path, { hasTrustDialogAccepted: true }])) });

describe('isFolderTrusted', () => {
  it('matches the folder itself in any case and slash direction', () => {
    expect(isFolderTrusted(configTrusting('c:/users/EVAN/appdata/roaming/armada/diagrams'), DIAGRAMS_DIR)).toBe(true);
  });

  it('counts trust recorded on a folder above it', () => {
    expect(isFolderTrusted(configTrusting('C:/Users/evan/AppData/Roaming'), DIAGRAMS_DIR)).toBe(true);
    expect(isFolderTrusted(configTrusting('C:/'), DIAGRAMS_DIR)).toBe(true);
  });

  it('ignores folders below it, beside it, or sharing its name as a prefix', () => {
    expect(isFolderTrusted(configTrusting('C:/Users/evan/AppData/Roaming/armada/diagrams/tile-1'), DIAGRAMS_DIR)).toBe(false);
    expect(isFolderTrusted(configTrusting('C:/Users/evan/AppData/Roaming/armada-dev'), DIAGRAMS_DIR)).toBe(false);
    expect(isFolderTrusted(configTrusting('C:/Users/evan/AppData/Roaming/armada/diag'), DIAGRAMS_DIR)).toBe(false);
  });

  it('ignores records whose dialog was not accepted', () => {
    const config = claudeGlobalConfigSchema.parse({ projects: { 'C:/Users/evan': { hasTrustDialogAccepted: false }, 'C:/Users': { allowedTools: [] } } });
    expect(isFolderTrusted(config, DIAGRAMS_DIR)).toBe(false);
  });

  it('reads a config with no projects or malformed records as trusting nothing', () => {
    expect(isFolderTrusted(claudeGlobalConfigSchema.parse({}), DIAGRAMS_DIR)).toBe(false);
    expect(isFolderTrusted(claudeGlobalConfigSchema.parse({ projects: { 'C:/Users': 'yes' } }), DIAGRAMS_DIR)).toBe(false);
    expect(isFolderTrusted(claudeGlobalConfigSchema.parse({ projects: 'broken' }), DIAGRAMS_DIR)).toBe(false);
  });
});
