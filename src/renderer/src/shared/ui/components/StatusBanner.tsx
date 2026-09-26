import { useState } from 'react';

type StatusBannerTone = 'accent' | 'alert';

const TONE_CLASSES: Record<StatusBannerTone, { edge: string; text: string }> = {
  accent: { edge: 'border-accent/60', text: 'text-accent' },
  alert: { edge: 'border-alert/60', text: 'text-alert' },
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
  const { edge, text } = TONE_CLASSES[tone];

  return (
    <div role="status" className={`flex items-center gap-3 border-b bg-panel px-3 py-1.5 text-fg ${edge}`}>
      <span className="min-w-0">{message}</span>
      <span className="text-muted">{note}</span>
      <button type="button" className={`readout hud-button disabled:opacity-50 ${text}`} data-tone={tone} onClick={onAction} disabled={isActing}>
        {actionLabel}
      </button>
      <button type="button" className="hud-glyph ml-auto text-muted" data-glyph="×" onClick={() => setIsDismissed(true)} aria-label="Dismiss until next launch">
        ×
      </button>
    </div>
  );
}
