const { spawn } = require('node:child_process');
const { mkdirSync, renameSync, writeFileSync } = require('node:fs');
const { dirname } = require('node:path');

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

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  if (usageFile) saveUsage(raw);
  if (!wrappedCommand) return;
  // PITFALL: Claude Code runs the status line in the shell named by SHELL; cmd.exe would resolve a bare `bash` to WSL on a stock Windows PATH.
  const wrapped = spawn(wrappedCommand, { shell: process.env.SHELL || true, stdio: ['pipe', 'inherit', 'inherit'] });
  wrapped.stdin.end(raw);
});
