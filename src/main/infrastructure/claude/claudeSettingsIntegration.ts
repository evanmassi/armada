import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import type { ClaudeIntegrationGap } from '@shared/integration/integrationTypes';

const HOOK_RELAY_SCRIPT = 'claudeHookRelay.cjs';
const STATUS_LINE_RELAY_SCRIPT = 'claudeStatusLineRelay.cjs';
export const RELAY_SCRIPTS = [HOOK_RELAY_SCRIPT, STATUS_LINE_RELAY_SCRIPT];
const MATCHER_BY_EVENT: Record<string, string | undefined> = {
  SessionStart: undefined,
  UserPromptSubmit: undefined,
  Stop: undefined,
  Notification: 'permission_prompt',
};

const hookGroupSchema = z
  .object({
    matcher: z.string().optional(),
    hooks: z.array(z.object({ command: z.string().optional() }).passthrough()).optional(),
  })
  .passthrough();

// PITFALL: passthrough everywhere; this is the user's whole Claude Code settings file and any key dropped here is lost on save.
export const claudeSettingsSchema = z
  .object({
    hooks: z.record(z.array(hookGroupSchema)).optional(),
    statusLine: z.object({ command: z.string().optional() }).passthrough().optional(),
  })
  .passthrough();

export type ClaudeSettings = z.infer<typeof claudeSettingsSchema>;
type HookGroup = z.infer<typeof hookGroupSchema>;

const scriptCommand = (scriptsDir: string, script: string): string => `node "${join(scriptsDir, script).split('\\').join('/')}"`;

// PITFALL: matched by script name, not full command, so a relay left at an older location (a moved repo, the pre-installer scripts folder) is replaced instead of kept firing.
const isArmadaGroup = (group: HookGroup): boolean => {
  const commands = (group.hooks ?? []).map((hook) => hook.command ?? '');
  return commands.length > 0 && commands.every((command) => command.includes(HOOK_RELAY_SCRIPT));
};

function withArmadaGroup(groups: HookGroup[], armadaGroup: HookGroup): HookGroup[] {
  const others = groups.filter((group) => !isArmadaGroup(group));
  const firstArmadaIndex = groups.findIndex(isArmadaGroup);
  return others.toSpliced(firstArmadaIndex === -1 ? others.length : firstArmadaIndex, 0, armadaGroup);
}

function relayedStatusLine(statusLine: ClaudeSettings['statusLine'], scriptsDir: string): NonNullable<ClaudeSettings['statusLine']> {
  const current = statusLine?.command;
  const relayIndex = current?.indexOf(STATUS_LINE_RELAY_SCRIPT) ?? -1;
  const encodedOriginal =
    current && relayIndex !== -1
      ? current.slice(relayIndex + STATUS_LINE_RELAY_SCRIPT.length + 1).trim()
      : current && Buffer.from(current, 'utf8').toString('base64');
  return { ...statusLine, type: 'command', command: [scriptCommand(scriptsDir, STATUS_LINE_RELAY_SCRIPT), encodedOriginal].filter(Boolean).join(' ') };
}

export function integrateArmada(settings: ClaudeSettings, scriptsDir: string): ClaudeSettings {
  const command = scriptCommand(scriptsDir, HOOK_RELAY_SCRIPT);
  const hooks = { ...settings.hooks };
  for (const [event, matcher] of Object.entries(MATCHER_BY_EVENT)) {
    hooks[event] = withArmadaGroup(hooks[event] ?? [], { ...(matcher && { matcher }), hooks: [{ type: 'command', command }] });
  }
  return { ...settings, hooks, statusLine: relayedStatusLine(settings.statusLine, scriptsDir) };
}

export function findIntegrationGaps(settings: ClaudeSettings, scriptsDir: string): ClaudeIntegrationGap[] {
  const integrated = integrateArmada(settings, scriptsDir);
  const gaps: ClaudeIntegrationGap[] = [];
  if (!isDeepStrictEqual(integrated.hooks, settings.hooks)) gaps.push('hooks');
  if (!isDeepStrictEqual(integrated.statusLine, settings.statusLine)) gaps.push('statusLine');
  return gaps;
}
