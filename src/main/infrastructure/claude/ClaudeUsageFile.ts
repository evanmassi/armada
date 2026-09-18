import { watch, type FSWatcher } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { basename, dirname } from 'node:path';
import { statusLineUsageSchema, type StatusLineUsage } from '@shared/usage/usageSchemas';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';

export type ClaudeUsageListener = (usage: StatusLineUsage) => void;

interface ClaudeUsageFileDeps {
  filePath: string;
  logger: FileLogger;
}

export class ClaudeUsageFile {
  private listeners = new Set<ClaudeUsageListener>();
  private watcher: FSWatcher | undefined;
  private latest: StatusLineUsage | undefined;

  constructor(private deps: ClaudeUsageFileDeps) {}

  async start(): Promise<void> {
    const usageDir = dirname(this.deps.filePath);
    const fileName = basename(this.deps.filePath);
    await mkdir(usageDir, { recursive: true });
    // PITFALL: the relay replaces the file by rename, which a watch on the file itself stops following; watch the folder.
    this.watcher = watch(usageDir, (_change, changedName) => {
      if (changedName === fileName) void this.refresh();
    });
    await this.refresh();
  }

  stop(): void {
    this.watcher?.close();
    this.watcher = undefined;
  }

  read(): StatusLineUsage | undefined {
    return this.latest;
  }

  onChange(listener: ClaudeUsageListener): void {
    this.listeners.add(listener);
  }

  private async refresh(): Promise<void> {
    let reported: unknown;
    try {
      reported = JSON.parse(await readFile(this.deps.filePath, 'utf8'));
    } catch {
      return;
    }
    const parsed = statusLineUsageSchema.safeParse(reported);
    if (!parsed.success) {
      this.deps.logger.error('usage.rejected', { reported, issues: parsed.error.issues });
      return;
    }
    if (parsed.data.reportedAt === this.latest?.reportedAt) return;
    this.latest = parsed.data;
    this.listeners.forEach((listener) => listener(parsed.data));
  }
}
