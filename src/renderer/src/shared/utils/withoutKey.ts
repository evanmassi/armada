export const withoutKey = <Value>(record: Record<string, Value>, key: string): Record<string, Value> =>
  Object.fromEntries(Object.entries(record).filter(([existing]) => existing !== key));
