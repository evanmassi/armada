import { StatusBanner } from '@renderer/shared/ui/components/StatusBanner';
import { useAppUpdateInstall } from '../../../hooks/useAppUpdateInstall';
import { useAppUpdateQuery } from '../../../hooks/useAppUpdateQuery';

export function AppUpdateBanner() {
  const { data: status } = useAppUpdateQuery();
  const { install, isInstalling } = useAppUpdateInstall();

  if (!status?.readyVersion) return null;

  if (status.installMethod === 'download') {
    return (
      <StatusBanner
        tone="info"
        message={`Armada ${status.readyVersion} is out.`}
        note="Open the disk image and drag Armada into Applications to replace this copy"
        action={{ label: 'Download', isActing: isInstalling, onSelect: install }}
      />
    );
  }

  return (
    <StatusBanner
      tone="info"
      message={`Armada ${status.readyVersion} is ready. It installs when you quit.`}
      note="Restarting resumes your sessions"
      action={{ label: 'Restart now', isActing: isInstalling, onSelect: install }}
    />
  );
}
