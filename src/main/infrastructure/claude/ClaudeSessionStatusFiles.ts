import { watch, type FSWatcher } from 'node:fs';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { sessionStatusSchema, type SessionStatus } from '@shared/sessions/sessionSchemas';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';

const STATUS_FILE_EXTENSION = '.json';

type SessionStatusListener = (status: SessionStatus) => void;

interface ClaudeSessionStatusFilesDeps {
  statusDir: string;
  logger: FileLogger;
}

export class ClaudeSessionStatusFiles {
  private listeners = new Set<SessionStatusListener>();
  private watcher: FSWatcher | undefined;
  private lastReportedAt = new Map<string, number>();

  constructor(private deps: ClaudeSessionStatusFilesDeps) {}

  async start(): Promise<void> {
    // PITFALL: terminal ids are minted per run, so every file left from an earlier run belongs to a terminal that no longer exists.
    await rm(this.deps.statusDir, { recursive: true, force: true });
    await mkdir(this.deps.statusDir, { recursive: true });
    this.watcher = watch(this.deps.statusDir, (_change, changedName) => {
      if (changedName?.endsWith(STATUS_FILE_EXTENSION)) void this.refresh(join(this.deps.statusDir, changedName));
    });
  }

  stop(): void {
    this.watcher?.close();
    this.watcher = undefined;
  }

  onStatus(listener: SessionStatusListener): void {
    this.listeners.add(listener);
  }

  private async refresh(file: string): Promise<void> {
    let reported: unknown;
    try {
      reported = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      return;
    }
    const parsed = sessionStatusSchema.safeParse(reported);
    if (!parsed.success) {
      this.deps.logger.error('sessionStatus.rejected', { file, reported, issues: parsed.error.issues });
      return;
    }
    const { terminalId, reportedAt } = parsed.data;
    if (this.lastReportedAt.get(terminalId) === reportedAt) return;
    this.lastReportedAt.set(terminalId, reportedAt);
    this.listeners.forEach((listener) => listener(parsed.data));
  }
}
