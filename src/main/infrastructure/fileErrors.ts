export const isMissingPath = (error: unknown): boolean => error instanceof Error && 'code' in error && error.code === 'ENOENT';
