import type { ClaudeUsage } from '@shared/usage/usageSchemas';

interface UsageSource {
  read(): ClaudeUsage | undefined;
  onChange(listener: (usage: ClaudeUsage) => void): void;
}

interface ClaudeUsageServiceDeps {
  statusLine: UsageSource;
  probe: UsageSource & { poke(): void };
}

export function mergeUsage(statusLine: ClaudeUsage | undefined, probe: ClaudeUsage | undefined): ClaudeUsage | undefined {
  if (!statusLine) return probe;
  if (!probe) return statusLine;
  const [newer, older] = statusLine.reportedAt >= probe.reportedAt ? [statusLine, probe] : [probe, statusLine];
  return {
    fiveHour: newer.fiveHour ?? older.fiveHour,
    sevenDay: newer.sevenDay ?? older.sevenDay,
    modelScoped: probe.modelScoped,
    reportedAt: newer.reportedAt,
  };
}

export class ClaudeUsageService {
  private listeners = new Set<(usage: ClaudeUsage) => void>();

  constructor(private deps: ClaudeUsageServiceDeps) {
    deps.statusLine.onChange(() => {
      deps.probe.poke();
      this.announce();
    });
    deps.probe.onChange(() => this.announce());
  }

  read(): ClaudeUsage | undefined {
    return mergeUsage(this.deps.statusLine.read(), this.deps.probe.read());
  }

  onChange(listener: (usage: ClaudeUsage) => void): void {
    this.listeners.add(listener);
  }

  private announce(): void {
    const merged = this.read();
    if (merged) this.listeners.forEach((listener) => listener(merged));
  }
}
