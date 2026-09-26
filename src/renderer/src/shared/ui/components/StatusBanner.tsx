import { useState } from 'react';

type StatusBannerTone = 'accent' | 'alert';

const TONE_CLASSES: Record<StatusBannerTone, { edge: string; action: string }> = {
  accent: { edge: 'border-accent/60', action: 'border-accent/60 text-accent hover:border-accent' },
  alert: { edge: 'border-alert/60', action: 'border-alert/60 text-alert hover:border-alert' },
};

interface StatusBannerProps {
  tone: StatusBannerTone;
  message: string;
  note: string;
  actionLabel: string;
  isActing: boolean;
  onAction(): void;
}

export function StatusBanner({ tone, message, note, actionLabel, isActing, onAction }: StatusBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;
  const { edge, action } = TONE_CLASSES[tone];

  return (
    <div role="status" className={`flex items-center gap-3 border-b bg-panel px-3 py-1.5 text-fg ${edge}`}>
      <span className="min-w-0">{message}</span>
      <span className="text-muted">{note}</span>
      <button type="button" className={`readout border px-2 py-0.5 disabled:opacity-50 ${action}`} onClick={onAction} disabled={isActing}>
        {actionLabel}
      </button>
      <button type="button" className="ml-auto text-muted hover:text-fg" onClick={() => setIsDismissed(true)} aria-label="Dismiss until next launch">
        ×
      </button>
    </div>
  );
}
