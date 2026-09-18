import { describe, expect, it, vi } from 'vitest';
import type { ClaudeUsage } from '@shared/usage/usageSchemas';
import { ClaudeUsageService, mergeUsage } from './ClaudeUsageService';

const fable = { displayName: 'Fable', usedPercentage: 82, resetsAt: 1789887600 };
const fromStatusLine: ClaudeUsage = { fiveHour: { usedPercentage: 4, resetsAt: 1789772400 }, sevenDay: { usedPercentage: 42 }, reportedAt: 200 };
const fromProbe: ClaudeUsage = { fiveHour: { usedPercentage: 5, resetsAt: 1789772401 }, sevenDay: undefined, modelScoped: [fable], reportedAt: 100 };

const fakeSource = (initial?: ClaudeUsage) => {
  let current = initial;
  const listeners: Array<(usage: ClaudeUsage) => void> = [];
  return {
    read: () => current,
    onChange: (listener: (usage: ClaudeUsage) => void) => void listeners.push(listener),
    emit: (usage: ClaudeUsage) => {
      current = usage;
      listeners.forEach((listener) => listener(usage));
    },
  };
};

describe('mergeUsage', () => {
  it('takes plan windows from the newer report, fills gaps from the older, and models only from the probe', () => {
    expect(mergeUsage(fromStatusLine, fromProbe)).toEqual({ ...fromStatusLine, modelScoped: [fable] });
    expect(mergeUsage(fromStatusLine, { ...fromProbe, reportedAt: 300 })).toEqual({
      fiveHour: fromProbe.fiveHour,
      sevenDay: fromStatusLine.sevenDay,
      modelScoped: [fable],
      reportedAt: 300,
    });
  });

  it('passes a lone source through', () => {
    expect(mergeUsage(fromStatusLine, undefined)).toBe(fromStatusLine);
    expect(mergeUsage(undefined, fromProbe)).toBe(fromProbe);
    expect(mergeUsage(undefined, undefined)).toBeUndefined();
  });
});

describe('ClaudeUsageService', () => {
  it('announces the merged picture on either source and pokes the probe when the status line moves', () => {
    const statusLine = fakeSource();
    const probe = { ...fakeSource(fromProbe), poke: vi.fn() };
    const service = new ClaudeUsageService({ statusLine, probe });
    const announced = vi.fn();
    service.onChange(announced);

    expect(service.read()).toBe(fromProbe);
    statusLine.emit(fromStatusLine);
    expect(probe.poke).toHaveBeenCalledOnce();
    expect(announced).toHaveBeenLastCalledWith({ ...fromStatusLine, modelScoped: [fable] });

    probe.emit({ ...fromProbe, modelScoped: [], reportedAt: 300 });
    expect(announced).toHaveBeenLastCalledWith({ fiveHour: fromProbe.fiveHour, sevenDay: fromStatusLine.sevenDay, modelScoped: [], reportedAt: 300 });
  });
});
