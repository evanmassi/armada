import { z } from 'zod';

const usageWindowSchema = z.object({
  usedPercentage: z.number(),
  resetsAt: z.number().optional(),
});

export const statusLineUsageSchema = z.object({
  fiveHour: usageWindowSchema.optional(),
  sevenDay: usageWindowSchema.optional(),
  reportedAt: z.number(),
});

export type UsageWindow = z.infer<typeof usageWindowSchema>;
export type StatusLineUsage = z.infer<typeof statusLineUsageSchema>;

export interface ModelUsageWindow extends UsageWindow {
  displayName: string;
}

export interface ClaudeUsage extends StatusLineUsage {
  modelScoped?: ModelUsageWindow[];
}
