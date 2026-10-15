import type { ClaudeUsage, UsageWindow } from '@shared/usage/usageSchemas';
import type { UsageRowVisibility, Workspace } from '@shared/workspace/workspaceSchemas';
import { withoutKey } from '@renderer/shared/utils/withoutKey';
import { FIVE_HOUR_WINDOW_SECONDS, WEEK_WINDOW_SECONDS, usagePace } from './usageReadout';

const ATTENTION_USED_PERCENTAGE = 75;
const ATTENTION_WARNING_STRENGTH = 0.5;

export interface UsageRow {
  label: string;
  usageWindow: UsageWindow;
  windowSeconds: number;
  isModelScoped: boolean;
}

export const usageRowsOf = (usage: ClaudeUsage): UsageRow[] => [
  ...(usage.fiveHour ? [{ label: '5h', usageWindow: usage.fiveHour, windowSeconds: FIVE_HOUR_WINDOW_SECONDS, isModelScoped: false }] : []),
  ...(usage.sevenDay ? [{ label: 'week', usageWindow: usage.sevenDay, windowSeconds: WEEK_WINDOW_SECONDS, isModelScoped: false }] : []),
  ...(usage.modelScoped ?? []).map((modelWindow) => ({
    label: modelWindow.displayName,
    usageWindow: modelWindow,
    windowSeconds: WEEK_WINDOW_SECONDS,
    isModelScoped: true,
  })),
];

export const roundedUsedPercentage = (usageWindow: UsageWindow): number => Math.min(100, Math.max(0, Math.round(usageWindow.usedPercentage)));

export function needsAttention({ usageWindow, windowSeconds }: UsageRow, now: number): boolean {
  const usedPercentage = roundedUsedPercentage(usageWindow);
  if (usedPercentage >= ATTENTION_USED_PERCENTAGE) return true;
  if (usageWindow.resetsAt === undefined) return false;
  return usagePace(usedPercentage, usageWindow.resetsAt, windowSeconds, now).warningStrength >= ATTENTION_WARNING_STRENGTH;
}

export const isPreferredVisible = (row: UsageRow, visibility: UsageRowVisibility | undefined): boolean =>
  row.isModelScoped ? visibility === 'shown' : visibility !== 'hidden';

export function setUsageRowPreference(workspace: Workspace, row: UsageRow, isVisible: boolean): Workspace {
  const others = withoutKey(workspace.preferences.usageRowVisibility ?? {}, row.label);
  const isDefault = isVisible !== row.isModelScoped;
  return {
    ...workspace,
    preferences: { ...workspace.preferences, usageRowVisibility: isDefault ? others : { ...others, [row.label]: isVisible ? 'shown' : 'hidden' } },
  };
}
