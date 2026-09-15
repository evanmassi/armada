import { z } from 'zod';

const terminalSizeSchema = z.object({
  cols: z.number().int().positive(),
  rows: z.number().int().positive(),
});

export const terminalRefSchema = z.object({
  terminalId: z.string().uuid(),
});

export const openSessionRequestSchema = terminalSizeSchema.extend({
  sessionId: z.string().uuid(),
  cwd: z.string().min(1),
});

export const terminalWriteRequestSchema = terminalRefSchema.extend({
  data: z.string(),
});

export const terminalResizeRequestSchema = terminalRefSchema.merge(terminalSizeSchema);

export type TerminalRef = z.infer<typeof terminalRefSchema>;
export type OpenSessionRequest = z.infer<typeof openSessionRequestSchema>;
export type TerminalWriteRequest = z.infer<typeof terminalWriteRequestSchema>;
export type TerminalResizeRequest = z.infer<typeof terminalResizeRequestSchema>;

export interface TerminalOutputEvent {
  terminalId: string;
  data: string;
}

export interface TerminalExitEvent {
  terminalId: string;
  exitCode: number;
}
