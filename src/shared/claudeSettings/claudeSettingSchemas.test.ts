import { describe, expect, it } from 'vitest';
import { CLAUDE_SETTINGS, changeClaudeSettingRequestSchema } from './claudeSettingSchemas';

describe('changeClaudeSettingRequestSchema', () => {
  it('accepts a listed option or a reset', () => {
    expect(changeClaudeSettingRequestSchema.safeParse({ key: 'promptCacheTtl', value: '1h' }).success).toBe(true);
    expect(changeClaudeSettingRequestSchema.safeParse({ key: 'promptCacheTtl' }).success).toBe(true);
  });

  it('refuses a setting that is not in the panel', () => {
    expect(changeClaudeSettingRequestSchema.safeParse({ key: 'disableAllHooks', value: true }).success).toBe(false);
  });

  it('refuses a value that is not one of the setting options', () => {
    expect(changeClaudeSettingRequestSchema.safeParse({ key: 'promptCacheTtl', value: '1d' }).success).toBe(false);
    expect(changeClaudeSettingRequestSchema.safeParse({ key: 'cleanupPeriodDays', value: '30' }).success).toBe(false);
  });

  it('lists each setting once, with a default that is one of its options', () => {
    expect(new Set(CLAUDE_SETTINGS.map((setting) => setting.key)).size).toBe(CLAUDE_SETTINGS.length);
    for (const setting of CLAUDE_SETTINGS.filter((candidate) => candidate.defaultValue !== undefined)) {
      expect(setting.options.map((option) => option.value)).toContain(setting.defaultValue);
    }
  });
});
