const STALE_AFTER_MS = 5 * 60_000;
const EXHAUSTED_COLOR = 'rgb(220, 100, 100)';

type Rgb = readonly [number, number, number];

export const isStaleReport = (reportedAt: number, now: number): boolean => now - reportedAt > STALE_AFTER_MS;

export function formatResetTime(resetsAtSeconds: number, now: number): string {
  const resetsAt = new Date(Math.round(resetsAtSeconds / 60) * 60_000);
  const today = new Date(now);
  const time = resetsAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: resetsAt.getMinutes() === 0 ? undefined : '2-digit' });
  if (resetsAt.toDateString() === today.toDateString()) return time;
  const weekday = resetsAt.toLocaleDateString(undefined, { weekday: 'short' });
  const isNextWeek = resetsAt.getDay() === today.getDay();
  return `${isNextWeek ? 'next ' : ''}${weekday} ${time}`;
}

export function headroomColor(usedPercentage: number): string {
  const headroom = 100 - usedPercentage;
  const blend = (floor: number, span: number, from: Rgb, to: Rgb): string => {
    const progress = (headroom - floor) / span;
    const mix = (channel: 0 | 1 | 2): number => Math.round(from[channel] + (to[channel] - from[channel]) * progress);
    return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
  };
  if (headroom > 50) return blend(50, 50, [220, 200, 80], [100, 200, 100]);
  if (headroom > 25) return blend(25, 25, [230, 150, 70], [220, 200, 80]);
  if (headroom > 10) return blend(10, 15, [220, 100, 100], [230, 150, 70]);
  return EXHAUSTED_COLOR;
}
