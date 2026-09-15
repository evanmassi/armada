import { describe, expect, it } from 'vitest';
import { workspaceSchema } from './workspaceSchemas';

describe('workspaceSchema', () => {
  it('converts legacy color names to hex and keeps hex as is', () => {
    const parsed = workspaceSchema.parse({ boards: [], projectColors: { a: 'red', b: '#123ABC' } });
    expect(parsed.projectColors).toEqual({ a: '#ef4444', b: '#123ABC' });
  });

  it('rejects colors that are neither a legacy name nor hex', () => {
    expect(() => workspaceSchema.parse({ boards: [], projectColors: { a: 'crimson' } })).toThrow();
  });

  it('fills every newer section with defaults for an old file', () => {
    const parsed = workspaceSchema.parse({ boards: [], projectColors: {} });
    expect(parsed.sidebar.projectExpansion).toEqual({});
    expect(parsed.preferences.terminalFontSize).toBe(13);
  });
});
