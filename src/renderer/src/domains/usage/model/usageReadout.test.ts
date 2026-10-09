import { describe, expect, it } from 'vitest';
import { formatResetTime, headroomColor, isStaleReport, usagePace } from './usageReadout';

const NOW = 1_800_000_000_000;

describe('formatResetTime', () => {
  const thursdayAfternoon = new Date(2026, 9, 8, 14, 47).getTime();
  const at = (day: number, hour: number, minute = 0, second = 0): Date => new Date(2026, 9, day, hour, minute, second);
  const seconds = (date: Date): number => date.getTime() / 1000;
  const hourOnly = (date: Date): string => date.toLocaleTimeString(undefined, { hour: 'numeric' });
  const weekday = (date: Date): string => date.toLocaleDateString(undefined, { weekday: 'short' });

  it('shows only the time for a reset later today', () => {
    expect(formatResetTime(seconds(at(8, 17)), thursdayAfternoon)).toBe(hourOnly(at(8, 17)));
  });

  it('rounds to the minute and shows minutes only off the hour', () => {
    expect(formatResetTime(seconds(at(8, 16, 59, 59)), thursdayAfternoon)).toBe(hourOnly(at(8, 17)));
    expect(formatResetTime(seconds(at(8, 17, 30)), thursdayAfternoon)).toBe(
      at(8, 17, 30).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    );
  });

  it('names the weekday for a reset on another day', () => {
    expect(formatResetTime(seconds(at(11, 19)), thursdayAfternoon)).toBe(`${weekday(at(11, 19))} ${hourOnly(at(11, 19))}`);
  });

  it('marks a reset on the same weekday next week', () => {
    expect(formatResetTime(seconds(at(15, 9)), thursdayAfternoon)).toBe(`next ${weekday(at(15, 9))} ${hourOnly(at(15, 9))}`);
  });
});

describe('usagePace', () => {
  const hour = 3600;
  const fiveHours = 5 * hour;
  const resetsIn = (seconds: number): number => NOW / 1000 + seconds;

  it('places the mark at the share of the window that has passed', () => {
    expect(usagePace(0, resetsIn(4 * hour), fiveHours, NOW).elapsedFraction).toBeCloseTo(0.2);
  });

  it('stays white while usage is at or behind the clock', () => {
    expect(usagePace(20, resetsIn(4 * hour), fiveHours, NOW).warningStrength).toBeCloseTo(0);
    expect(usagePace(5, resetsIn(4 * hour), fiveHours, NOW).warningStrength).toBe(0);
  });

  it('warms toward full warning as usage runs ahead of the clock', () => {
    expect(usagePace(32.5, resetsIn(4 * hour), fiveHours, NOW).warningStrength).toBeCloseTo(0.5);
    expect(usagePace(90, resetsIn(4 * hour), fiveHours, NOW).warningStrength).toBe(1);
  });

  it('holds the mark inside the window when the reset time is stale or far off', () => {
    expect(usagePace(50, resetsIn(-hour), fiveHours, NOW).elapsedFraction).toBe(1);
    expect(usagePace(50, resetsIn(10 * hour), fiveHours, NOW).elapsedFraction).toBe(0);
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
