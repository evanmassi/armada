import { z } from 'zod';

const terminalSizeSchema = z.object({
  cols: z.number().int().positive(),
  rows: z.number().int().positive(),
});

const claudeLaunchSchema = z.object({
  kind: z.literal('claude'),
  sessionId: z.string().uuid(),
  cwd: z.string().min(1),
});

const shellLaunchSchema = z.object({
  kind: z.literal('shell'),
  cwd: z.string().min(1),
});

export const terminalRefSchema = z.object({
  terminalId: z.string().uuid(),
});

export const openSessionRequestSchema = z.discriminatedUnion('kind', [
  claudeLaunchSchema.merge(terminalSizeSchema),
  shellLaunchSchema.merge(terminalSizeSchema),
]);

export const terminalWriteRequestSchema = terminalRefSchema.extend({
  data: z.string(),
});

export const terminalResizeRequestSchema = terminalRefSchema.merge(terminalSizeSchema);

export const CLAUDE_HOOK_EVENT_KINDS = ['sessionStarted', 'promptSubmitted', 'turnEnded', 'permissionRequested'] as const;

export const claudeHookEventSchema = terminalRefSchema.extend({
  sessionId: z.string().uuid(),
  kind: z.enum(CLAUDE_HOOK_EVENT_KINDS),
});

export type SessionLaunch = z.infer<typeof claudeLaunchSchema> | z.infer<typeof shellLaunchSchema>;
export type TerminalRef = z.infer<typeof terminalRefSchema>;
export type OpenSessionRequest = z.infer<typeof openSessionRequestSchema>;
export type TerminalWriteRequest = z.infer<typeof terminalWriteRequestSchema>;
export type TerminalResizeRequest = z.infer<typeof terminalResizeRequestSchema>;
export type ClaudeHookEvent = z.infer<typeof claudeHookEventSchema>;
export type ClaudeHookEventKind = ClaudeHookEvent['kind'];

export interface TerminalOutputEvent {
  terminalId: string;
  data: string;
}

export interface TerminalExitEvent {
  terminalId: string;
  exitCode: number;
}
