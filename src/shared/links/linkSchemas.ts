import { z } from 'zod';

export const openLinkRequestSchema = z.object({
  target: z.string().min(1).max(4096),
  cwd: z.string().min(1),
});

export type OpenLinkRequest = z.infer<typeof openLinkRequestSchema>;
