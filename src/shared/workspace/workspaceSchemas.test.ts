import { describe, expect, it } from 'vitest';
import { MAX_SIDEBAR_WIDTH_PX, MIN_SIDEBAR_WIDTH_PX, workspaceSchema } from './workspaceSchemas';

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

  it('pulls a saved sidebar width outside the limits back inside them', () => {
    const widthOf = (width: number) => workspaceSchema.parse({ boards: [], projectColors: {}, sidebar: { width } }).sidebar.width;
    expect(widthOf(271)).toBe(MIN_SIDEBAR_WIDTH_PX);
    expect(widthOf(900)).toBe(MAX_SIDEBAR_WIDTH_PX);
    expect(widthOf(400)).toBe(400);
  });
});
