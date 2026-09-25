import { useState } from 'react';
import { useAppUpdateInstall } from '../../../hooks/useAppUpdateInstall';
import { useAppUpdateQuery } from '../../../hooks/useAppUpdateQuery';

export function AppUpdateBanner() {
  const { data: status } = useAppUpdateQuery();
  const { install, isInstalling } = useAppUpdateInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!status?.readyVersion || isDismissed) return null;

  return (
    <div role="status" className="flex items-center gap-3 border-b border-accent/60 bg-panel px-3 py-1.5 text-fg">
      <span className="min-w-0 flex-1">Armada {status.readyVersion} is ready. It installs when you quit.</span>
      <span className="text-muted">Restarting resumes your sessions</span>
      <button
        type="button"
        className="readout border border-accent/60 px-2 py-0.5 text-accent hover:border-accent disabled:opacity-50"
        onClick={install}
        disabled={isInstalling}
      >
        Restart now
      </button>
      <button type="button" className="text-muted hover:text-fg" onClick={() => setIsDismissed(true)} aria-label="Dismiss until next launch">
        ×
      </button>
    </div>
  );
}
