import type { ClaudeIntegrationGap } from '@shared/integration/integrationTypes';
import { StatusBanner } from '@renderer/shared/ui/components/StatusBanner';
import { useDiagramFolderTrustQuery } from '../../../hooks/useDiagramFolderTrustQuery';
import { useIntegrationRepair } from '../../../hooks/useIntegrationRepair';
import { useIntegrationStatusQuery } from '../../../hooks/useIntegrationStatusQuery';

const CONSEQUENCE_BY_GAP: Record<ClaudeIntegrationGap, string> = {
  hooks: 'tiles cannot show what Claude is doing',
  statusLine: 'the usage readout will not update',
};

interface IntegrationBannerProps {
  onTrustDiagramFolder(folder: string): void;
}

export function IntegrationBanner({ onTrustDiagramFolder }: IntegrationBannerProps) {
  const { data: status } = useIntegrationStatusQuery();
  const { data: diagramFolderTrust } = useDiagramFolderTrustQuery();
  const { repair, isRepairing } = useIntegrationRepair();

  if (!status) return null;

  if (!status.isNodeAvailable) {
    return (
      <StatusBanner
        tone="warning"
        message={`Node.js is not installed, and Claude Code runs Armada's hooks with it: ${Object.values(CONSEQUENCE_BY_GAP).join(' and ')}.`}
        note="Install Node.js 22 or newer from nodejs.org, then restart Armada"
      />
    );
  }

  if (status.gaps.length === 0) {
    if (!diagramFolderTrust || diagramFolderTrust.isTrusted) return null;
    return (
      <StatusBanner
        key="diagramFolderTrust"
        tone="warning"
        message={'Claude Code will ask "Adding a new directory" on every new tile until you trust Armada\'s diagram folder once.'}
        note="Click Trust, then pick Yes in the tile that opens"
        action={{ label: 'Trust', isActing: false, onSelect: () => onTrustDiagramFolder(diagramFolderTrust.folder) }}
      />
    );
  }

  return (
    <StatusBanner
      key="gaps"
      tone="warning"
      message={`Armada is not fully connected to Claude Code: ${status.gaps.map((gap) => CONSEQUENCE_BY_GAP[gap]).join(', and ')}.`}
      note={`Fixing edits ${status.settingsPath}`}
      action={{ label: 'Fix', isActing: isRepairing, onSelect: repair }}
    />
  );
}
