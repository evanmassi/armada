const { spawn } = require('node:child_process');
const { existsSync, mkdirSync, renameSync, writeFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

const usageFile = process.env.ARMADA_USAGE_FILE;
const wrappedCommand = process.argv[2] ? Buffer.from(process.argv[2], 'base64').toString('utf8') : undefined;

const usageWindow = (limit) => limit && { usedPercentage: limit.used_percentage, resetsAt: limit.resets_at };

const saveUsage = (raw) => {
  // PITFALL: a status line that throws goes blank, and a rename can lose to main reading the file on Windows; the next refresh rewrites it.
  try {
    const limits = JSON.parse(raw).rate_limits;
    if (!limits) return;
    const usage = { fiveHour: usageWindow(limits.five_hour), sevenDay: usageWindow(limits.seven_day), reportedAt: Date.now() };
    mkdirSync(dirname(usageFile), { recursive: true });
    const draft = `${usageFile}.${process.pid}.tmp`;
    writeFileSync(draft, JSON.stringify(usage), 'utf8');
    renameSync(draft, usageFile);
  } catch {
    return;
  }
};

const GIT_BASH_ROOT_VARIABLES = ['ProgramW6432', 'ProgramFiles', 'ProgramFiles(x86)'];

const windowsGitBash = () => {
  const roots = GIT_BASH_ROOT_VARIABLES.map((variable) => process.env[variable]);
  if (process.env['LOCALAPPDATA']) roots.push(join(process.env['LOCALAPPDATA'], 'Programs'));
  return roots.filter(Boolean).map((root) => join(root, 'Git', 'bin', 'bash.exe')).find((candidate) => existsSync(candidate));
};

// PITFALL: Electron leaves SHELL unset, so Node falls back to cmd.exe, where a bare `bash` resolves to WSL and cannot open the Windows path it is handed; the status line then goes blank inside a tile.
const wrappingShell = () => process.env.SHELL || (process.platform === 'win32' && windowsGitBash()) || true;

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  if (usageFile) saveUsage(raw);
  if (!wrappedCommand) return;
  const wrapped = spawn(wrappedCommand, { shell: wrappingShell(), stdio: ['pipe', 'inherit', 'inherit'] });
  wrapped.stdin.end(raw);
});
