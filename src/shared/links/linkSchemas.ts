import { z } from 'zod';

export const openLinkRequestSchema = z.object({
  target: z.string().min(1).max(4096),
  baseFolders: z.array(z.string().min(1)).max(2),
});

export type OpenLinkRequest = z.infer<typeof openLinkRequestSchema>;
