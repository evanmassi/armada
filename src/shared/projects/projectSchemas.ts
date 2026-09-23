import { z } from 'zod';

export const folderRequestSchema = z.object({
  cwd: z.string().min(1),
});

export type FolderRequest = z.infer<typeof folderRequestSchema>;

export interface ProjectLineChanges {
  added: number;
  removed: number;
}
