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

export const claudeSessionStartedEventSchema = terminalRefSchema.extend({
  sessionId: z.string().uuid(),
});

export type SessionLaunch = z.infer<typeof claudeLaunchSchema> | z.infer<typeof shellLaunchSchema>;
export type TerminalRef = z.infer<typeof terminalRefSchema>;
export type OpenSessionRequest = z.infer<typeof openSessionRequestSchema>;
export type TerminalWriteRequest = z.infer<typeof terminalWriteRequestSchema>;
export type TerminalResizeRequest = z.infer<typeof terminalResizeRequestSchema>;
export type ClaudeSessionStartedEvent = z.infer<typeof claudeSessionStartedEventSchema>;

export interface TerminalOutputEvent {
  terminalId: string;
  data: string;
}

export interface TerminalExitEvent {
  terminalId: string;
  exitCode: number;
}
