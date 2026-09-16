import { watch, type FSWatcher } from 'node:fs';
import { mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { claudeHookEventSchema, type ClaudeHookEvent } from '@shared/sessions/sessionSchemas';

const EVENT_FILE_EXTENSION = '.json';

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export type ClaudeHookListener = (event: ClaudeHookEvent) => void;

export class ClaudeHookInbox {
  private listeners = new Set<ClaudeHookListener>();
  private watcher: FSWatcher | undefined;
  private isDraining = false;
  private hasPendingDrain = false;

  constructor(private inboxDir: string) {}

  async start(): Promise<void> {
    await mkdir(this.inboxDir, { recursive: true });
    this.watcher = watch(this.inboxDir, () => void this.drain());
    await this.drain();
  }

  stop(): void {
    this.watcher?.close();
    this.watcher = undefined;
  }

  onEvent(listener: ClaudeHookListener): void {
    this.listeners.add(listener);
  }

  private async drain(): Promise<void> {
    if (this.isDraining) {
      this.hasPendingDrain = true;
      return;
    }
    this.isDraining = true;
    try {
      do {
        this.hasPendingDrain = false;
        // PITFALL: readdir order is not guaranteed; the timestamp in the name keeps a terminal's events in the order they fired.
        const names = (await readdir(this.inboxDir)).filter((name) => name.endsWith(EVENT_FILE_EXTENSION)).sort();
        for (const name of names) await this.consume(join(this.inboxDir, name));
      } while (this.hasPendingDrain);
    } finally {
      this.isDraining = false;
    }
  }

  private async consume(file: string): Promise<void> {
    let raw: string;
    try {
      raw = await readFile(file, 'utf8');
    } catch {
      return;
    }
    await rm(file, { force: true });
    const parsed = claudeHookEventSchema.safeParse(parseJson(raw));
    if (!parsed.success) return;
    this.listeners.forEach((listener) => listener(parsed.data));
  }
}
