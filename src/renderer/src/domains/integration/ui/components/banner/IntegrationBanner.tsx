import { useState } from 'react';
import type { ClaudeIntegrationGap } from '@shared/integration/integrationTypes';
import { useIntegrationRepair } from '../../../hooks/useIntegrationRepair';
import { useIntegrationStatusQuery } from '../../../hooks/useIntegrationStatusQuery';

const CONSEQUENCE_BY_GAP: Record<ClaudeIntegrationGap, string> = {
  hooks: 'tiles cannot show what Claude is doing',
  statusLine: 'the usage readout will not update',
};

export function IntegrationBanner() {
  const { data: status } = useIntegrationStatusQuery();
  const { repair, isRepairing } = useIntegrationRepair();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!status || status.gaps.length === 0 || isDismissed) return null;

  return (
    <div role="status" className="flex items-center gap-3 border-b border-alert/60 bg-panel px-3 py-1.5 text-fg">
      <span className="min-w-0 flex-1">
        Armada is not fully connected to Claude Code: {status.gaps.map((gap) => CONSEQUENCE_BY_GAP[gap]).join(', and ')}.
      </span>
      <span className="text-muted">Fixing edits ~/.claude/settings.json</span>
      <button
        type="button"
        className="readout border border-alert/60 px-2 py-0.5 text-alert hover:border-alert disabled:opacity-50"
        onClick={repair}
        disabled={isRepairing}
      >
        Fix
      </button>
      <button type="button" className="text-muted hover:text-fg" onClick={() => setIsDismissed(true)} aria-label="Dismiss until next launch">
        ×
      </button>
    </div>
  );
}
