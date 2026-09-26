import type { ClaudeIntegrationGap } from '@shared/integration/integrationTypes';
import { StatusBanner } from '@renderer/shared/ui/components/StatusBanner';
import { useIntegrationRepair } from '../../../hooks/useIntegrationRepair';
import { useIntegrationStatusQuery } from '../../../hooks/useIntegrationStatusQuery';

const CONSEQUENCE_BY_GAP: Record<ClaudeIntegrationGap, string> = {
  hooks: 'tiles cannot show what Claude is doing',
  statusLine: 'the usage readout will not update',
};

export function IntegrationBanner() {
  const { data: status } = useIntegrationStatusQuery();
  const { repair, isRepairing } = useIntegrationRepair();

  if (!status) return null;

  if (!status.isNodeAvailable) {
    return (
      <StatusBanner
        tone="alert"
        message="Node.js is not installed, and Claude Code runs Armada's hooks with it: tiles cannot show what Claude is doing and the usage readout will not update."
        note="Install Node.js 22 or newer from nodejs.org, then restart Armada"
      />
    );
  }

  if (status.gaps.length === 0) return null;

  return (
    <StatusBanner
      tone="alert"
      message={`Armada is not fully connected to Claude Code: ${status.gaps.map((gap) => CONSEQUENCE_BY_GAP[gap]).join(', and ')}.`}
      note="Fixing edits ~/.claude/settings.json"
      action={{ label: 'Fix', isActing: isRepairing, onSelect: repair }}
    />
  );
}
