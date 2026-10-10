import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ClaudeSettingPage } from '@shared/claudeSettings/claudeSettingSchemas';
import { ClaudeSettingsPanel } from './ClaudeSettingsPanel';

const TITLE_ID = 'claude-settings-dialog-title';
const DIALOG_EXIT_MS = 220;

interface ClaudeSettingsDialogProps {
  isOpen: boolean;
  onClose(): void;
}

export function ClaudeSettingsDialog({ isOpen, onClose }: ClaudeSettingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isShown, setIsShown] = useState(isOpen);
  const [isLeaving, setIsLeaving] = useState(false);
  const [page, setPage] = useState<ClaudeSettingPage>('context');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      setIsShown(true);
      setIsLeaving(false);
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (!dialog.open) return;
    setIsLeaving(true);
    const closeTimer = window.setTimeout(() => {
      dialog.close();
      setIsShown(false);
      setIsLeaving(false);
    }, DIALOG_EXIT_MS);
    return () => window.clearTimeout(closeTimer);
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="hud-dialog claude-settings-dialog tone-plate"
      style={{ '--notice-exit': `${DIALOG_EXIT_MS}ms` } as CSSProperties}
      data-tone="info"
      data-leaving={isLeaving || undefined}
      aria-labelledby={TITLE_ID}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      {isShown && (
        <>
          <header className="flex items-center gap-2 pt-3.5 pr-3 pl-5">
            <h2 id={TITLE_ID} className="readout tone-text flex-1 text-[12px]">
              Claude Code settings
            </h2>
            <button type="button" className="hud-glyph text-muted" data-tone="neutral" data-glyph="×" onClick={onClose} aria-label="Close">
              ×
            </button>
          </header>
          <ClaudeSettingsPanel page={page} onPageChange={setPage} />
          <p className="px-5 py-2.5 text-[12px] text-muted">Running sessions pick up most changes as they happen. Restart a session if one does not take.</p>
        </>
      )}
    </dialog>
  );
}
