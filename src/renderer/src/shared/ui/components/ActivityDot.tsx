import type { ActivityState } from '@renderer/app/stores/sessionActivityStore';

interface ActivityDotProps {
  state: ActivityState;
}

const ACTIVITY_STYLES: Record<ActivityState, { className: string; label: string }> = {
  working: { className: 'bg-accent animate-pulse shadow-[0_0_8px_var(--color-accent)]', label: 'Claude is working' },
  waiting: { className: 'bg-alert shadow-[0_0_8px_var(--color-alert)]', label: 'Waiting for you' },
  idle: { className: 'bg-muted', label: 'Open' },
};

export function ActivityDot({ state }: ActivityDotProps) {
  const { className, label } = ACTIVITY_STYLES[state];
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full transition-colors duration-500 ${className}`} title={label} aria-label={label} />;
}
