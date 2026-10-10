import { useState } from 'react';
import { ClaudeSettingsDialog } from './ClaudeSettingsDialog';

const GEAR = '⚙︎';

export function ClaudeSettingsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="hud-glyph ml-1 px-1 text-muted"
        data-glyph={GEAR}
        onClick={() => setIsOpen(true)}
        aria-label="Claude Code settings"
        aria-haspopup="dialog"
        data-tooltip="Claude Code settings"
      >
        {GEAR}
      </button>
      <ClaudeSettingsDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
