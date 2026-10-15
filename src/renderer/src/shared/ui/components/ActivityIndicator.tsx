import { useRef } from 'react';
import type { ActivityState } from '@renderer/app/stores/sessionActivityStore';
import { usePageClockAnimations } from '../hooks/usePageClockAnimations';

interface ActivityIndicatorProps {
  state: ActivityState;
}

const ACTIVITY_STYLES: Record<ActivityState, { className: string; label: string }> = {
  working: { className: 'activity-star text-accent', label: 'Claude is working' },
  waiting: { className: 'activity-target text-fg', label: 'Waiting for you' },
  approval: { className: 'activity-beacon text-warning', label: 'Needs your approval' },
  idle: { className: 'activity-dot bg-muted', label: 'Open' },
  exited: { className: 'activity-dot border border-muted', label: 'Session exited' },
};

export function ActivityIndicator({ state }: ActivityIndicatorProps) {
  const glyphRef = useRef<HTMLSpanElement>(null);
  const { className, label } = ACTIVITY_STYLES[state];
  usePageClockAnimations(glyphRef, state);

  return (
    <span className="activity-indicator" role="img" data-tooltip={label} aria-label={label}>
      <span ref={glyphRef} className={className} />
    </span>
  );
}
