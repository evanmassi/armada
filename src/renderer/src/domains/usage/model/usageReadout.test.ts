import { describe, expect, it } from 'vitest';
import { formatCountdown, headroomColor, isStaleReport } from './usageReadout';

const NOW = 1_800_000_000_000;
const secondsFromNow = (seconds: number): number => NOW / 1000 + seconds;

describe('formatCountdown', () => {
  it('drops to the two largest units', () => {
    expect(formatCountdown(secondsFromNow(3 * 86400 + 4 * 3600 + 120), NOW)).toBe('3d 4h');
    expect(formatCountdown(secondsFromNow(2 * 3600 + 10 * 60), NOW)).toBe('2h 10m');
    expect(formatCountdown(secondsFromNow(12 * 60 + 59), NOW)).toBe('12m');
  });

  it('holds at zero once the reset has passed', () => {
    expect(formatCountdown(secondsFromNow(-500), NOW)).toBe('0m');
  });
});

describe('headroomColor', () => {
  it('runs green with full headroom to red with none', () => {
    expect(headroomColor(0)).toBe('rgb(100, 200, 100)');
    expect(headroomColor(50)).toBe('rgb(220, 200, 80)');
    expect(headroomColor(75)).toBe('rgb(230, 150, 70)');
    expect(headroomColor(95)).toBe('rgb(220, 100, 100)');
  });
});

describe('isStaleReport', () => {
  it('turns stale after five minutes without a report', () => {
    expect(isStaleReport(NOW - 4 * 60_000, NOW)).toBe(false);
    expect(isStaleReport(NOW - 6 * 60_000, NOW)).toBe(true);
  });
});
