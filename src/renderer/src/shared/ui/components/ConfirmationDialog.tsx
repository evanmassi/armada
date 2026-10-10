import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useConfirmationStore } from '@renderer/app/stores/confirmationStore';
import { ToneIcon } from './ToneIcon';

const TITLE_ID = 'confirmation-dialog-title';
const DIALOG_EXIT_MS = 220;

export function ConfirmationDialog() {
  const pending = useConfirmationStore((state) => state.pending);
  const settle = useConfirmationStore((state) => state.settle);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState(pending);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pending) {
      setShown(pending);
      setIsLeaving(false);
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (!dialog.open) return;
    setIsLeaving(true);
    const closeTimer = window.setTimeout(() => {
      dialog.close();
      setShown(undefined);
      setIsLeaving(false);
    }, DIALOG_EXIT_MS);
    return () => window.clearTimeout(closeTimer);
  }, [pending]);

  return (
    <dialog
      ref={dialogRef}
      className="hud-dialog confirmation-dialog tone-plate"
      style={{ '--notice-exit': `${DIALOG_EXIT_MS}ms` } as CSSProperties}
      data-tone="danger"
      data-leaving={isLeaving || undefined}
      role="alertdialog"
      aria-labelledby={TITLE_ID}
      onCancel={(event) => {
        event.preventDefault();
        settle(false);
      }}
      onClick={(event) => event.target === event.currentTarget && settle(false)}
    >
      {shown && (
        <div className="py-4 pr-[18px] pl-5">
          <h2 id={TITLE_ID} className="readout tone-text mb-1.5 flex items-center gap-2 text-[12px]">
            <ToneIcon tone="danger" />
            {shown.title}
          </h2>
          <p className="mb-4 text-[14px] leading-relaxed">{shown.message}</p>
          <div className="flex justify-end gap-2">
            <button type="button" className="readout hud-button text-muted" onClick={() => settle(false)}>
              Cancel
            </button>
            <button type="button" className="readout hud-button tone-text" data-tone="danger" onClick={() => settle(true)}>
              {shown.actionLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
