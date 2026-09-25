export const folderName = (cwd: string): string => cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? cwd;
