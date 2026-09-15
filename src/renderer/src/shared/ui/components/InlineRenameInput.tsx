import { useState, type KeyboardEvent } from 'react';

interface InlineRenameInputProps {
  initialValue: string;
  label: string;
  onCommit(value: string): void;
  onCancel(): void;
}

export function InlineRenameInput({ initialValue, label, onCommit, onCancel }: InlineRenameInputProps) {
  const [draft, setDraft] = useState(initialValue);

  const commit = (): void => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== initialValue) onCommit(trimmed);
    else onCancel();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') commit();
    if (event.key === 'Escape') onCancel();
  };

  return (
    <input
      className="min-w-0 flex-1 rounded border border-muted bg-ink px-1 text-fg outline-none"
      value={draft}
      autoFocus
      onFocus={(event) => event.target.select()}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      aria-label={label}
    />
  );
}
