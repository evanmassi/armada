const { spawn } = require('node:child_process');
const { existsSync, mkdirSync, renameSync, writeFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

const usageFile = process.env.ARMADA_USAGE_FILE;
const terminalId = process.env.ARMADA_TERMINAL_ID;
const sessionStatusDir = process.env.ARMADA_SESSION_STATUS_DIR;
const wrappedCommand = process.argv[2] ? Buffer.from(process.argv[2], 'base64').toString('utf8') : undefined;

const parseInput = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

const replaceFile = (file, value) => {
  mkdirSync(dirname(file), { recursive: true });
  const draft = `${file}.${process.pid}.tmp`;
  writeFileSync(draft, JSON.stringify(value), 'utf8');
  renameSync(draft, file);
};

// PITFALL: a status line that throws goes blank, and a rename can lose to main reading the file on Windows; the next refresh rewrites it.
const saveQuietly = (file, value) => {
  try {
    replaceFile(file, value);
  } catch {
    return;
  }
};

const usageWindow = (limit) => limit && { usedPercentage: limit.used_percentage, resetsAt: limit.resets_at };

const saveUsage = (input) => {
  const limits = input.rate_limits;
  if (!limits) return;
  saveQuietly(usageFile, { fiveHour: usageWindow(limits.five_hour), sevenDay: usageWindow(limits.seven_day), reportedAt: Date.now() });
};

const contextWindow = (context) =>
  context && typeof context.remaining_percentage === 'number' && typeof context.context_window_size === 'number'
    ? { remainingPercentage: context.remaining_percentage, size: context.context_window_size }
    : undefined;

const saveSessionStatus = (input) => {
  if (!input.session_id) return;
  saveQuietly(join(sessionStatusDir, `${terminalId}.json`), {
    terminalId,
    sessionId: input.session_id,
    modelName: input.model?.display_name,
    effortLevel: input.effort?.level,
    contextWindow: contextWindow(input.context_window),
    cwd: input.workspace?.current_dir ?? input.cwd,
    reportedAt: Date.now(),
  });
};

const GIT_BASH_ROOT_VARIABLES = ['ProgramW6432', 'ProgramFiles', 'ProgramFiles(x86)'];

const windowsGitBash = () => {
  const roots = GIT_BASH_ROOT_VARIABLES.map((variable) => process.env[variable]);
  if (process.env['LOCALAPPDATA']) roots.push(join(process.env['LOCALAPPDATA'], 'Programs'));
  return roots.filter(Boolean).map((root) => join(root, 'Git', 'bin', 'bash.exe')).find((candidate) => existsSync(candidate));
};

// PITFALL: a claude started from PowerShell leaves SHELL unset, so Node falls back to cmd.exe, where a bare `bash` resolves to WSL and cannot open the Windows path it is handed; the status line then goes blank.
const wrappingShell = () => process.env.SHELL || (process.platform === 'win32' && windowsGitBash()) || true;

const isInsideTile = Boolean(terminalId && sessionStatusDir);

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  const input = parseInput(raw);
  if (input && usageFile) saveUsage(input);
  if (input && isInsideTile) saveSessionStatus(input);
  if (isInsideTile || !wrappedCommand) return;
  const wrapped = spawn(wrappedCommand, { shell: wrappingShell(), stdio: ['pipe', 'inherit', 'inherit'] });
  wrapped.stdin.end(raw);
});
