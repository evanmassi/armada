import { z } from 'zod';
import type { ClaudeUsage, ModelUsageWindow, UsageWindow } from '@shared/usage/usageSchemas';

export const USAGE_PROBE_REQUEST_ID = 'armada-usage';

const probedWindowSchema = z.object({
  utilization: z.number().nullable(),
  resets_at: z.string().nullable(),
});

const probeResponseSchema = z.object({
  type: z.literal('control_response'),
  response: z.object({
    subtype: z.literal('success'),
    request_id: z.literal(USAGE_PROBE_REQUEST_ID),
    response: z.object({
      rate_limits: z
        .object({
          five_hour: probedWindowSchema.nullable().optional(),
          seven_day: probedWindowSchema.nullable().optional(),
          model_scoped: z.array(probedWindowSchema.extend({ display_name: z.string() })).optional(),
        })
        .nullable(),
    }),
  }),
});

type ProbedWindow = z.infer<typeof probedWindowSchema>;

const toSeconds = (iso: string | null): number | undefined => {
  if (iso === null) return undefined;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? undefined : Math.round(ms / 1000);
};

const toUsageWindow = (probed: ProbedWindow | null | undefined): UsageWindow | undefined => {
  if (probed?.utilization == null) return undefined;
  const resetsAt = toSeconds(probed.resets_at);
  return resetsAt === undefined ? { usedPercentage: probed.utilization } : { usedPercentage: probed.utilization, resetsAt };
};

const parseJson = (line: string): unknown => {
  try {
    return JSON.parse(line);
  } catch {
    return undefined;
  }
};

export function parseUsageProbeOutput(stdout: string, reportedAt: number): ClaudeUsage | undefined {
  for (const line of stdout.split('\n')) {
    const parsed = probeResponseSchema.safeParse(parseJson(line));
    if (!parsed.success) continue;
    const limits = parsed.data.response.response.rate_limits;
    if (!limits) return undefined;
    const modelScoped = (limits.model_scoped ?? []).flatMap((row): ModelUsageWindow[] => {
      const usageWindow = toUsageWindow(row);
      return usageWindow ? [{ ...usageWindow, displayName: row.display_name }] : [];
    });
    return { fiveHour: toUsageWindow(limits.five_hour), sevenDay: toUsageWindow(limits.seven_day), modelScoped, reportedAt };
  }
  return undefined;
}
