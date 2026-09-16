const { mkdirSync, renameSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const terminalId = process.env.ARMADA_TERMINAL_ID;
const inboxDir = process.env.ARMADA_HOOK_INBOX;
if (!terminalId || !inboxDir) process.exit(0);

const EVENT_KIND_BY_HOOK = {
  SessionStart: 'sessionStarted',
  UserPromptSubmit: 'promptSubmitted',
  Stop: 'turnEnded',
  Notification: 'permissionRequested',
};
const RELAYED_NOTIFICATION_TYPE = 'permission_prompt';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  const payload = JSON.parse(raw);
  const kind = EVENT_KIND_BY_HOOK[payload.hook_event_name];
  const sessionId = payload.session_id;
  if (!kind || typeof sessionId !== 'string') return;
  if (kind === 'permissionRequested' && payload.notification_type !== RELAYED_NOTIFICATION_TYPE) return;
  mkdirSync(inboxDir, { recursive: true });
  const target = join(inboxDir, `${terminalId}-${Date.now()}-${process.pid}.json`);
  const event = kind === 'sessionStarted' ? { terminalId, sessionId, kind, source: payload.source } : { terminalId, sessionId, kind };
  writeFileSync(`${target}.tmp`, JSON.stringify(event), 'utf8');
  renameSync(`${target}.tmp`, target);
});
