const { mkdirSync, renameSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const terminalId = process.env.ARMADA_TERMINAL_ID;
const inboxDir = process.env.ARMADA_SESSION_INBOX;
if (!terminalId || !inboxDir) process.exit(0);

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  const sessionId = JSON.parse(raw).session_id;
  if (typeof sessionId !== 'string') return;
  mkdirSync(inboxDir, { recursive: true });
  const target = join(inboxDir, `${terminalId}-${Date.now()}.json`);
  writeFileSync(`${target}.tmp`, JSON.stringify({ terminalId, sessionId }), 'utf8');
  renameSync(`${target}.tmp`, target);
});
