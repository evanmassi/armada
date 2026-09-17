import { z } from 'zod';

const usageWindowSchema = z.object({
  usedPercentage: z.number(),
  resetsAt: z.number().optional(),
});

export const claudeUsageSchema = z.object({
  fiveHour: usageWindowSchema.optional(),
  sevenDay: usageWindowSchema.optional(),
  reportedAt: z.number(),
});

export type UsageWindow = z.infer<typeof usageWindowSchema>;
export type ClaudeUsage = z.infer<typeof claudeUsageSchema>;
