import type { ActivityState } from '@renderer/app/stores/sessionActivityStore';

const ECHO_GRACE_MS = 500;
const WORKING_STREAK_MS = 1000;
const SETTLE_MS = 2500;
const BELL = '\x07';
const ENTER = '\r';

export interface ActivityTracker {
  recordOutput(data: string): void;
  recordInput(data: string): void;
  dispose(): void;
}

export function createActivityTracker(onChange: (state: ActivityState) => void): ActivityTracker {
  let state: ActivityState = 'idle';
  let lastInputAt = Number.NEGATIVE_INFINITY;
  let streakStartedAt: number | undefined;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;

  const set = (next: ActivityState): void => {
    if (next === state) return;
    state = next;
    onChange(next);
  };

  const settle = (): void => {
    streakStartedAt = undefined;
    if (state === 'working') set('waiting');
  };

  onChange(state);

  return {
    recordOutput: (data) => {
      const now = Date.now();
      if (data.includes(BELL)) {
        streakStartedAt = undefined;
        set('waiting');
        return;
      }
      if (now - lastInputAt < ECHO_GRACE_MS) return;
      streakStartedAt ??= now;
      if (now - streakStartedAt >= WORKING_STREAK_MS) set('working');
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, SETTLE_MS);
    },
    recordInput: (data) => {
      lastInputAt = Date.now();
      if (data.includes(ENTER)) {
        streakStartedAt = undefined;
        set('idle');
      }
    },
    dispose: () => clearTimeout(settleTimer),
  };
}
