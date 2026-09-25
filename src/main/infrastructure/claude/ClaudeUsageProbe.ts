import { spawn } from 'node:child_process';
import type { ClaudeUsage } from '@shared/usage/usageSchemas';
import { CLAUDE_COMMAND } from '@main/domain/claude/claudeCommand';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { parseUsageProbeOutput, USAGE_PROBE_REQUEST_ID } from './usageProbeOutputParser';

type ClaudeUsageProbeListener = (usage: ClaudeUsage) => void;

interface ClaudeUsageProbeDeps {
  cwd: string;
  logger: FileLogger;
}

const PROBE_INTERVAL_MS = 3 * 60_000;
const POKE_MIN_GAP_MS = 60_000;
const PROBE_TIMEOUT_MS = 30_000;
const LOGGED_STDOUT_CHARS = 2000;
// PITFALL: an empty --setting-sources keeps the user's hooks out of the probe; otherwise every poll would drop a SessionStart into Armada's own inbox.
const PROBE_ARGS = ['--print', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', '--no-session-persistence', '--setting-sources', ''];
const PROBE_REQUEST = JSON.stringify({ type: 'control_request', request_id: USAGE_PROBE_REQUEST_ID, request: { subtype: 'get_usage', skip_behaviors: true } });

export class ClaudeUsageProbe {
  private listeners = new Set<ClaudeUsageProbeListener>();
  private timer: NodeJS.Timeout | undefined;
  private latest: ClaudeUsage | undefined;
  private startedAt = 0;
  private isRunning = false;

  constructor(private deps: ClaudeUsageProbeDeps) {}

  start(): void {
    this.timer = setInterval(() => this.probe(), PROBE_INTERVAL_MS);
    this.probe();
  }

  stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  read(): ClaudeUsage | undefined {
    return this.latest;
  }

  onChange(listener: ClaudeUsageProbeListener): void {
    this.listeners.add(listener);
  }

  poke(): void {
    if (Date.now() - this.startedAt >= POKE_MIN_GAP_MS) this.probe();
  }

  private probe(): void {
    if (this.isRunning || !this.timer) return;
    this.isRunning = true;
    this.startedAt = Date.now();
    const child = spawn(CLAUDE_COMMAND, PROBE_ARGS, { cwd: this.deps.cwd, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    let stdout = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => (stdout += chunk));
    child.stderr.resume();
    const timeout = setTimeout(() => child.kill(), PROBE_TIMEOUT_MS);
    child.on('error', (error) => {
      clearTimeout(timeout);
      this.isRunning = false;
      this.deps.logger.error('usage.probe.failed', { error });
    });
    child.on('close', (exitCode) => {
      clearTimeout(timeout);
      this.isRunning = false;
      this.accept(stdout, exitCode);
    });
    child.stdin.end(`${PROBE_REQUEST}\n`);
  }

  private accept(stdout: string, exitCode: number | null): void {
    const usage = parseUsageProbeOutput(stdout, Date.now());
    if (!usage) {
      this.deps.logger.error('usage.probe.rejected', { exitCode, stdout: stdout.slice(0, LOGGED_STDOUT_CHARS) });
      return;
    }
    this.latest = usage;
    this.listeners.forEach((listener) => listener(usage));
  }
}
