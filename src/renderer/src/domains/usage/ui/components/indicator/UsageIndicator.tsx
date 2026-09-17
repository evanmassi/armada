import { useEffect, useState } from 'react';
import type { UsageWindow } from '@shared/usage/usageSchemas';
import { useClaudeUsageQuery } from '../../../hooks/useClaudeUsageQuery';
import { formatCountdown, headroomColor, isStaleReport } from '../../../model/usageReadout';

const CLOCK_TICK_MS = 30_000;

interface UsageWindowReadoutProps {
  label: string;
  usageWindow: UsageWindow;
  now: number;
}

function UsageWindowReadout({ label, usageWindow, now }: UsageWindowReadoutProps) {
  const usedPercentage = Math.min(100, Math.max(0, Math.round(usageWindow.usedPercentage)));
  const color = headroomColor(usedPercentage);
  return (
    <>
      <span className="text-muted">{label}</span>
      <div
        className="h-1.5 self-center bg-edge"
        role="meter"
        aria-label={`${label} usage`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={usedPercentage}
      >
        <div className="h-full transition-[width]" style={{ width: `${usedPercentage}%`, backgroundColor: color }} />
      </div>
      <span className="text-right" style={{ color }}>
        {usedPercentage}%
      </span>
      {usageWindow.resetsAt !== undefined && (
        <span className="col-start-2 col-end-4 -mt-0.5 text-muted">resets in {formatCountdown(usageWindow.resetsAt, now)}</span>
      )}
    </>
  );
}

export function UsageIndicator() {
  const { data: usage } = useClaudeUsageQuery();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(clock);
  }, []);

  if (!usage || (!usage.fiveHour && !usage.sevenDay)) return null;
  const isStale = isStaleReport(usage.reportedAt, now);

  return (
    <footer
      className={`readout grid grid-cols-[auto_1fr_auto] items-baseline gap-x-2.5 gap-y-1 border-t border-edge bg-panel/80 px-3 py-2 transition-opacity ${isStale ? 'opacity-50' : ''}`}
      title={isStale ? 'Usage as last reported; it refreshes when a session is active' : 'Claude usage: 5 hour and weekly limits, with time until reset'}
    >
      {usage.fiveHour && <UsageWindowReadout label="5h" usageWindow={usage.fiveHour} now={now} />}
      {usage.sevenDay && <UsageWindowReadout label="week" usageWindow={usage.sevenDay} now={now} />}
    </footer>
  );
}
