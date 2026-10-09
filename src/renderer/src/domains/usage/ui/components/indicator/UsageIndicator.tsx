import { useEffect, useState, type CSSProperties } from 'react';
import type { UsageWindow } from '@shared/usage/usageSchemas';
import { useClaudeUsageQuery } from '../../../hooks/useClaudeUsageQuery';
import {
  FIVE_HOUR_WINDOW_SECONDS,
  WEEK_WINDOW_SECONDS,
  formatResetTime,
  headroomColor,
  isStaleReport,
  usagePace,
} from '../../../model/usageReadout';

const CLOCK_TICK_MS = 30_000;
const METER_SEGMENTS = 20;

interface UsageWindowReadoutProps {
  label: string;
  usageWindow: UsageWindow;
  windowSeconds: number;
  now: number;
}

function UsageWindowReadout({ label, usageWindow, windowSeconds, now }: UsageWindowReadoutProps) {
  const usedPercentage = Math.min(100, Math.max(0, Math.round(usageWindow.usedPercentage)));
  const litSegments = Math.round((usedPercentage / 100) * METER_SEGMENTS);
  const meterStyle = { '--meter-color': headroomColor(usedPercentage), color: headroomColor(usedPercentage) } as CSSProperties;
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
          <span key={index} className={`meter-segment ${index < litSegments ? 'is-lit' : ''} ${index === litSegments - 1 ? 'is-tip' : ''}`} />
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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(clock);
  }, []);

  if (!usage || (!usage.fiveHour && !usage.sevenDay && !usage.modelScoped?.length)) return null;
  const isStale = isStaleReport(usage.reportedAt, now);

  return (
    <footer
      className={`readout grid grid-cols-[auto_1fr_auto] items-baseline gap-x-2.5 gap-y-1 border-t border-edge bg-panel/80 px-3 py-2 transition-opacity ${isStale ? 'opacity-50' : ''}`}
      data-tooltip={isStale ? 'Usage as last reported; it refreshes when a session is active' : 'Claude usage: 5 hour, weekly, and per-model limits, and when each resets. The caret marks how much of the window has passed and turns amber as usage runs ahead of it'}
    >
      {usage.fiveHour && <UsageWindowReadout label="5h" usageWindow={usage.fiveHour} windowSeconds={FIVE_HOUR_WINDOW_SECONDS} now={now} />}
      {usage.sevenDay && <UsageWindowReadout label="week" usageWindow={usage.sevenDay} windowSeconds={WEEK_WINDOW_SECONDS} now={now} />}
      {usage.modelScoped?.map((modelWindow) => (
        <UsageWindowReadout
          key={modelWindow.displayName}
          label={modelWindow.displayName}
          usageWindow={modelWindow}
          windowSeconds={WEEK_WINDOW_SECONDS}
          now={now}
        />
      ))}
    </footer>
  );
}
