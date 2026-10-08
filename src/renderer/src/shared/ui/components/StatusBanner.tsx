import { useState } from 'react';
import { ToneIcon, type Tone } from './ToneIcon';

interface StatusBannerAction {
  label: string;
  isActing: boolean;
  onSelect(): void;
}

interface StatusBannerProps {
  tone: Tone;
  message: string;
  note: string;
  action?: StatusBannerAction;
}

export function StatusBanner({ tone, message, note, action }: StatusBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div role="status" className="status-banner flex items-center gap-3 border-b bg-panel px-3 py-1.5 text-fg" data-tone={tone}>
      <ToneIcon tone={tone} />
      <span className="min-w-0">{message}</span>
      <span className="text-muted">{note}</span>
      {action && (
        <button type="button" className="readout hud-button tone-text disabled:opacity-50" data-tone={tone} onClick={action.onSelect} disabled={action.isActing}>
          {action.label}
        </button>
      )}
      <button type="button" className="hud-glyph ml-auto text-muted" data-glyph="×" onClick={() => setIsDismissed(true)} aria-label="Dismiss until next launch">
        ×
      </button>
    </div>
  );
}
