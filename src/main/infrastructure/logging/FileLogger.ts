import { appendFileSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { dirname } from 'node:path';

const ROTATE_AT_BYTES = 1_000_000;
const ROTATED_SUFFIX = '.1';

type LogLevel = 'info' | 'error';
export type LogFields = Record<string, unknown>;

const fileSize = (path: string): number => {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
};

const serializeErrors = (_key: string, value: unknown): unknown =>
  value instanceof Error ? { name: value.name, message: value.message, stack: value.stack } : value;

export class FileLogger {
  constructor(private filePath: string) {
    mkdirSync(dirname(filePath), { recursive: true });
    if (fileSize(filePath) > ROTATE_AT_BYTES) renameSync(filePath, `${filePath}${ROTATED_SUFFIX}`);
  }

  info(event: string, fields: LogFields = {}): void {
    this.write('info', event, fields);
  }

  error(event: string, fields: LogFields = {}): void {
    this.write('error', event, fields);
  }

  private write(level: LogLevel, event: string, fields: LogFields): void {
    const line = JSON.stringify({ at: new Date().toISOString(), level, event, ...fields }, serializeErrors);
    try {
      appendFileSync(this.filePath, `${line}\n`, 'utf8');
    } catch {
      return;
    }
  }
}
