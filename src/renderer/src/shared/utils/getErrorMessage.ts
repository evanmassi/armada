// PITFALL: Electron wraps errors thrown by ipcMain.handle as "Error invoking remote method 'x': Error: <message>".
const REMOTE_INVOCATION_PREFIX = /^Error invoking remote method '[^']+': (?:Error: )?/;

const FALLBACK_MESSAGE = 'Something went wrong.';

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message.replace(REMOTE_INVOCATION_PREFIX, '') : FALLBACK_MESSAGE;
