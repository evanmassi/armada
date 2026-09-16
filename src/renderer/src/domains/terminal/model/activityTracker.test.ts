import { beforeEach, describe, expect, it } from 'vitest';
import type { ActivityState } from '@renderer/app/stores/sessionActivityStore';
import { createActivityTracker } from './activityTracker';

describe('createActivityTracker', () => {
  const states: ActivityState[] = [];
  let tracker: ReturnType<typeof createActivityTracker>;

  beforeEach(() => {
    states.length = 0;
    tracker = createActivityTracker((state) => states.push(state));
  });

  it('follows the hook events through a turn', () => {
    tracker.recordHookEvent('promptSubmitted');
    tracker.recordHookEvent('permissionRequested');
    tracker.recordInput('\r');
    tracker.recordHookEvent('turnEnded');
    expect(states).toEqual(['idle', 'working', 'approval', 'working', 'waiting']);
  });

  it('treats Enter as answering only once Claude is waiting', () => {
    tracker.recordHookEvent('promptSubmitted');
    tracker.recordInput('queued\r');
    expect(states).toEqual(['idle', 'working']);
    tracker.recordHookEvent('turnEnded');
    tracker.recordInput('next\r');
    expect(states).toEqual(['idle', 'working', 'waiting', 'idle']);
  });

  it('treats Escape as an interrupt while working and as an answer while approving', () => {
    tracker.recordHookEvent('promptSubmitted');
    tracker.recordInput('\x1b');
    tracker.recordHookEvent('promptSubmitted');
    tracker.recordHookEvent('permissionRequested');
    tracker.recordInput('\x1b');
    expect(states).toEqual(['idle', 'working', 'waiting', 'working', 'approval', 'working']);
  });

  it('ignores arrow keys and typing', () => {
    tracker.recordHookEvent('turnEnded');
    tracker.recordInput('\x1b[A');
    tracker.recordInput('abc');
    expect(states).toEqual(['idle', 'waiting']);
  });

  it('stays exited once the process ends', () => {
    tracker.recordHookEvent('promptSubmitted');
    tracker.recordExit();
    tracker.recordHookEvent('turnEnded');
    tracker.recordInput('\r');
    expect(states).toEqual(['idle', 'working', 'exited']);
  });

  it('re-emits idle on a session start so a rebound session is republished', () => {
    tracker.recordHookEvent('sessionStarted');
    expect(states).toEqual(['idle', 'idle']);
  });
});
