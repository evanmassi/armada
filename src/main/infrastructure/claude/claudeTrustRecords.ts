import { z } from 'zod';

const trustRecordSchema = z.object({ hasTrustDialogAccepted: z.boolean().optional() }).catch({});

export const claudeGlobalConfigSchema = z.object({ projects: z.record(z.string(), trustRecordSchema).catch({}) });

export type ClaudeGlobalConfig = z.infer<typeof claudeGlobalConfigSchema>;

const comparablePath = (folder: string): string => folder.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();

const parentOf = (folder: string): string | undefined => {
  const separatorIndex = folder.lastIndexOf('/');
  return separatorIndex > 0 ? folder.slice(0, separatorIndex) : undefined;
};

export function isFolderTrusted(config: ClaudeGlobalConfig, folder: string): boolean {
  const trustedFolders = new Set(
    Object.entries(config.projects)
      .filter(([, record]) => record.hasTrustDialogAccepted === true)
      .map(([path]) => comparablePath(path)),
  );
  for (let current: string | undefined = comparablePath(folder); current !== undefined; current = parentOf(current)) {
    if (trustedFolders.has(current)) return true;
  }
  return false;
}
