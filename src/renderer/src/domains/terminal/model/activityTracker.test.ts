import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityState } from '@renderer/app/stores/sessionActivityStore';
import { createActivityTracker } from './activityTracker';

describe('createActivityTracker', () => {
  const states: ActivityState[] = [];
  let tracker: ReturnType<typeof createActivityTracker>;

  beforeEach(() => {
    vi.useFakeTimers();
    states.length = 0;
    tracker = createActivityTracker((state) => states.push(state));
  });

  afterEach(() => {
    tracker.dispose();
    vi.useRealTimers();
  });

  it('ignores echo redraws while typing and only reacts to Enter', () => {
    for (let i = 0; i < 10; i += 1) {
      tracker.recordInput('a');
      tracker.recordOutput('redraw');
      vi.advanceTimersByTime(120);
    }
    expect(states).toEqual(['idle']);
  });

  it('marks working after a sustained streak, then waiting once output settles', () => {
    tracker.recordInput('go\r');
    vi.advanceTimersByTime(600);
    for (let elapsed = 0; elapsed <= 1200; elapsed += 200) {
      tracker.recordOutput('spinner');
      vi.advanceTimersByTime(200);
    }
    expect(states).toEqual(['idle', 'working']);
    vi.advanceTimersByTime(2600);
    expect(states).toEqual(['idle', 'working', 'waiting']);
  });

  it('does not treat a lone status refresh as work', () => {
    vi.advanceTimersByTime(1000);
    tracker.recordOutput('clock tick');
    vi.advanceTimersByTime(3000);
    tracker.recordOutput('clock tick');
    expect(states).toEqual(['idle']);
  });

  it('jumps to waiting on a bell', () => {
    tracker.recordOutput('\x07');
    expect(states).toEqual(['idle', 'waiting']);
  });
});
