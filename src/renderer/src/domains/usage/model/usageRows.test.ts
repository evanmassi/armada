import { describe, expect, it } from 'vitest';
import type { Workspace } from '@shared/workspace/workspaceSchemas';
import { isPreferredVisible, needsAttention, setUsageRowPreference, usageRowsOf, type UsageRow } from './usageRows';
import { FIVE_HOUR_WINDOW_SECONDS, WEEK_WINDOW_SECONDS } from './usageReadout';

const NOW = 1_800_000_000_000;
const HALF_WEEK_LEFT = NOW / 1000 + WEEK_WINDOW_SECONDS / 2;

const row = (usedPercentage: number, isModelScoped = false, resetsAt: number | undefined = HALF_WEEK_LEFT): UsageRow => ({
  label: isModelScoped ? 'Fable' : 'week',
  usageWindow: { usedPercentage, resetsAt },
  windowSeconds: WEEK_WINDOW_SECONDS,
  isModelScoped,
});

const workspace = (): Workspace => ({
  boards: [],
  projectColors: {},
  pinnedSessionIds: [],
  preferences: { terminalFontSize: 13 },
  sidebar: { width: 288, groups: [], projectOrder: [], archivedProjectCwds: [], archivedSessionIds: [], projectAliases: {}, projectExpansion: {} },
});

describe('usageRowsOf', () => {
  it('lists plan limits first, then per-model limits, skipping any not reported', () => {
    const rows = usageRowsOf({ fiveHour: { usedPercentage: 5 }, modelScoped: [{ displayName: 'Fable', usedPercentage: 2 }], reportedAt: NOW });
    expect(rows.map(({ label, windowSeconds, isModelScoped }) => [label, windowSeconds, isModelScoped])).toEqual([
      ['5h', FIVE_HOUR_WINDOW_SECONDS, false],
      ['Fable', WEEK_WINDOW_SECONDS, true],
    ]);
  });
});

describe('needsAttention', () => {
  it('stays quiet while usage is on pace', () => {
    expect(needsAttention(row(50), NOW)).toBe(false);
    expect(needsAttention(row(60), NOW)).toBe(false);
  });

  it('calls for attention well ahead of pace or near the limit', () => {
    expect(needsAttention(row(63), NOW)).toBe(true);
    expect(needsAttention(row(75, false, undefined), NOW)).toBe(true);
  });
});

describe('isPreferredVisible', () => {
  it('shows plan limits and hides per-model limits by default', () => {
    expect(isPreferredVisible(row(10), undefined)).toBe(true);
    expect(isPreferredVisible(row(10, true), undefined)).toBe(false);
  });

  it('follows a saved choice', () => {
    expect(isPreferredVisible(row(10), 'hidden')).toBe(false);
    expect(isPreferredVisible(row(10, true), 'shown')).toBe(true);
  });
});

describe('setUsageRowPreference', () => {
  it('saves only choices that differ from the default', () => {
    const hidden = setUsageRowPreference(workspace(), row(10), false);
    expect(hidden.preferences.usageRowVisibility).toEqual({ week: 'hidden' });
    expect(setUsageRowPreference(hidden, row(10), true).preferences.usageRowVisibility).toEqual({});
    expect(setUsageRowPreference(workspace(), row(10, true), true).preferences.usageRowVisibility).toEqual({ Fable: 'shown' });
  });
});
