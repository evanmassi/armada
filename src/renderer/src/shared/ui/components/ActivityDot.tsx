import type { ActivityState } from '@renderer/app/stores/sessionActivityStore';

interface ActivityDotProps {
  state: ActivityState;
}

const ACTIVITY_STYLES: Record<ActivityState, { className: string; label: string }> = {
  working: { className: 'bg-sky-400 animate-pulse', label: 'Claude is working' },
  waiting: { className: 'bg-amber-400', label: 'Waiting for you' },
  idle: { className: 'bg-emerald-500', label: 'Open' },
};

export function ActivityDot({ state }: ActivityDotProps) {
  const { className, label } = ACTIVITY_STYLES[state];
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} title={label} aria-label={label} />;
}
