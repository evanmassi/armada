import { describe, expect, it } from 'vitest';
import { parseUsageProbeOutput, USAGE_PROBE_REQUEST_ID } from './usageProbeOutputParser';

const NOW = 1_800_000_000_000;

const controlResponse = (rateLimits: unknown, requestId = USAGE_PROBE_REQUEST_ID): string =>
  JSON.stringify({ type: 'control_response', response: { subtype: 'success', request_id: requestId, response: { rate_limits: rateLimits } } });

describe('parseUsageProbeOutput', () => {
  it('reads the plan windows and every per-model window, converting reset times to seconds', () => {
    const stdout = [
      '{"type":"system","subtype":"init"}',
      controlResponse({
        five_hour: { utilization: 5, resets_at: '2026-09-18T23:00:00.729796+00:00' },
        seven_day: { utilization: 42, resets_at: '2026-09-20T07:00:00.729821+00:00' },
        model_scoped: [{ display_name: 'Fable', utilization: 82, resets_at: '2026-09-20T06:59:59.730027+00:00' }],
      }),
    ].join('\n');
    expect(parseUsageProbeOutput(stdout, NOW)).toEqual({
      fiveHour: { usedPercentage: 5, resetsAt: 1789772401 },
      sevenDay: { usedPercentage: 42, resetsAt: 1789887601 },
      modelScoped: [{ displayName: 'Fable', usedPercentage: 82, resetsAt: 1789887600 }],
      reportedAt: NOW,
    });
  });

  it('drops windows without a utilization and reports an empty model list when none is scoped', () => {
    const stdout = controlResponse({ five_hour: { utilization: 3, resets_at: null }, seven_day: null });
    expect(parseUsageProbeOutput(stdout, NOW)).toEqual({ fiveHour: { usedPercentage: 3 }, sevenDay: undefined, modelScoped: [], reportedAt: NOW });
  });

  it('has nothing to report when plan limits do not apply or the answer is not ours', () => {
    expect(parseUsageProbeOutput(controlResponse(null), NOW)).toBeUndefined();
    expect(parseUsageProbeOutput(controlResponse({ five_hour: { utilization: 1, resets_at: null } }, 'other'), NOW)).toBeUndefined();
    expect(parseUsageProbeOutput('not json\n', NOW)).toBeUndefined();
  });
});
