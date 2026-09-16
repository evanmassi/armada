import type { ClaudeHookEventKind } from '@shared/sessions/sessionSchemas';
import type { ActivityState } from '@renderer/app/stores/sessionActivityStore';

const ENTER = '\r';
const ESCAPE = '\x1b';

const STATE_BY_HOOK_EVENT: Record<ClaudeHookEventKind, ActivityState> = {
  sessionStarted: 'idle',
  promptSubmitted: 'working',
  turnEnded: 'waiting',
  permissionRequested: 'approval',
};

export interface ActivityTracker {
  recordHookEvent(kind: ClaudeHookEventKind): void;
  recordInput(data: string): void;
  recordExit(): void;
}

export function createActivityTracker(onChange: (state: ActivityState) => void): ActivityTracker {
  let state: ActivityState = 'idle';

  const set = (next: ActivityState, isForced = false): void => {
    if (state === 'exited' || (!isForced && next === state)) return;
    state = next;
    onChange(next);
  };

  onChange(state);

  return {
    // PITFALL: a session start after /clear re-emits idle even when already idle so the store republishes under the new session id.
    recordHookEvent: (kind) => set(STATE_BY_HOOK_EVENT[kind], kind === 'sessionStarted'),
    recordInput: (data) => {
      const isEnter = data.includes(ENTER);
      const isEscape = data === ESCAPE;
      if (state === 'approval' && (isEnter || isEscape)) set('working');
      else if (state === 'working' && isEscape) set('waiting');
      else if (state === 'waiting' && isEnter) set('idle');
    },
    recordExit: () => set('exited'),
  };
}
