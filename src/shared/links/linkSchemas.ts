import { z } from 'zod';

export const openLinkRequestSchema = z.object({
  target: z.string().min(1).max(4096),
  baseFolders: z.array(z.string().min(1)).max(2),
});

export const openWebLinkRequestSchema = z.object({
  url: z.string().min(1).max(4096),
});

export type OpenLinkRequest = z.infer<typeof openLinkRequestSchema>;
export type OpenWebLinkRequest = z.infer<typeof openWebLinkRequestSchema>;
