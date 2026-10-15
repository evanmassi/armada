import { useEffect, useState, type CSSProperties } from 'react';
import { useWorkspaceEditor, useWorkspaceQuery } from '@renderer/domains/workspace';
import { ActionContextMenu, contextMenuOpeningOf, type ContextMenuOpening } from '@renderer/shared/ui/components/ActionContextMenu';
import { useClaudeUsageQuery } from '../../../hooks/useClaudeUsageQuery';
import { formatResetTime, headroomColor, isStaleReport, usagePace } from '../../../model/usageReadout';
import {
  isPreferredVisible,
  needsAttention,
  roundedUsedPercentage,
  setUsageRowPreference,
  usageRowsOf,
  type UsageRow,
} from '../../../model/usageRows';

const CLOCK_TICK_MS = 30_000;
const METER_SEGMENTS = 20;

interface UsageWindowReadoutProps {
  row: UsageRow;
  now: number;
}

function UsageWindowReadout({ row: { label, usageWindow, windowSeconds }, now }: UsageWindowReadoutProps) {
  const usedPercentage = roundedUsedPercentage(usageWindow);
  const litSegments = Math.round((usedPercentage / 100) * METER_SEGMENTS);
  const [powerUp, setPowerUp] = useState({ from: litSegments, to: litSegments });
  if (litSegments !== powerUp.to) setPowerUp({ from: Math.min(powerUp.to, litSegments), to: litSegments });
  const isPowering = (index: number): boolean => index >= powerUp.from && index < powerUp.to;
  const meterColor = headroomColor(usedPercentage);
  const meterStyle = { '--meter-color': meterColor, color: meterColor } as CSSProperties;
  const pace = usageWindow.resetsAt === undefined ? undefined : usagePace(usedPercentage, usageWindow.resetsAt, windowSeconds, now);
  return (
    <>
      <span className="text-muted">{label}</span>
      <div
        className="meter-track self-center"
        style={meterStyle}
        role="meter"
        aria-label={`${label} usage`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={usedPercentage}
      >
        {Array.from({ length: METER_SEGMENTS }, (_, index) => (
          <span
            key={index}
            className={`meter-segment ${index < litSegments ? 'is-lit' : ''} ${index === litSegments - 1 ? 'is-tip' : ''} ${isPowering(index) ? 'is-powering' : ''}`}
          />
        ))}
        {pace && (
          <span
            className="meter-pace-caret"
            style={{ '--pace-elapsed': pace.elapsedFraction, '--pace-warning': pace.warningStrength } as CSSProperties}
          />
        )}
      </div>
      <span className="meter-value text-right" style={meterStyle}>
        {usedPercentage}%
      </span>
      {usageWindow.resetsAt !== undefined && (
        <span className="col-start-2 col-end-4 mt-px text-muted">
          resets <span className="text-fg">{formatResetTime(usageWindow.resetsAt, now)}</span>
        </span>
      )}
    </>
  );
}

export function UsageIndicator() {
  const { data: usage } = useClaudeUsageQuery();
  const visibilityPreferences = useWorkspaceQuery().data?.preferences.usageRowVisibility ?? {};
  const { edit } = useWorkspaceEditor();
  const [now, setNow] = useState(() => Date.now());
  const [rowMenu, setRowMenu] = useState<ContextMenuOpening>();

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(clock);
  }, []);

  if (!usage) return null;
  const rows = usageRowsOf(usage);
  if (rows.length === 0) return null;
  const isStale = isStaleReport(usage.reportedAt, now);
  const isChosen = (row: UsageRow): boolean => isPreferredVisible(row, visibilityPreferences[row.label]);
  const visibleRows = rows.filter((row) => isChosen(row) || needsAttention(row, now));

  return (
    <footer
      tabIndex={0}
      className={`readout grid grid-cols-[auto_1fr_auto] items-baseline gap-x-2.5 gap-y-1 border-t border-edge bg-panel/80 px-3 py-2 transition-opacity ${isStale ? 'opacity-50' : ''}`}
      data-tooltip={`${isStale ? 'Usage as last reported; it refreshes when a session is active' : 'Claude usage: 5 hour, weekly, and per-model limits, and when each resets. The caret marks how much of the window has passed and turns amber as usage runs ahead of it'}. Right-click to choose which limits show; a hidden one returns when it nears its limit`}
      onContextMenu={(event) => setRowMenu(contextMenuOpeningOf(event))}
    >
      {visibleRows.map((row) => (
        <UsageWindowReadout key={row.label} row={row} now={now} />
      ))}
      {visibleRows.length === 0 && <span className="col-span-3 text-muted">usage hidden</span>}
      {rowMenu && (
        <ActionContextMenu
          {...rowMenu}
          entries={rows.map((row) => ({
            label: isChosen(row) ? 'Hide' : 'Show',
            emphasis: row.label,
            onSelect: () => edit((workspace) => setUsageRowPreference(workspace, row, !isChosen(row))),
          }))}
          onClose={() => setRowMenu(undefined)}
        />
      )}
    </footer>
  );
}
