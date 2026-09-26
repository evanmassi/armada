import { useEffect, useRef, useState } from 'react';
import { SOFT_PROJECT_COLORS, VIVID_PROJECT_COLORS } from '../../projectColorPalette';

interface ProjectColorSelectorProps {
  color: string | undefined;
  onChange(color: string | undefined): void;
}

const DEFAULT_CUSTOM_COLOR = '#3b82f6';

const isSameColor = (a: string | undefined, b: string): boolean => a?.toLowerCase() === b.toLowerCase();

export function ProjectColorSelector({ color, onChange }: ProjectColorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState<string>();
  const customInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const choose = (next: string | undefined): void => {
    onChange(next);
    setIsOpen(false);
  };

  // PITFALL: React's onChange on a color input fires on every live picker movement; only the native change event marks the final pick.
  useEffect(() => {
    const input = customInputRef.current;
    if (!input) return;
    const commit = (): void => {
      onChangeRef.current(input.value);
      setCustomDraft(undefined);
      setIsOpen(false);
    };
    input.addEventListener('change', commit);
    return () => input.removeEventListener('change', commit);
  }, [isOpen]);

  const renderSwatch = (option: string) => (
    <button
      key={option}
      type="button"
      className="h-4 w-4 rounded-full hover:scale-110"
      style={{ background: option, outline: isSameColor(color, option) ? '2px solid white' : undefined }}
      onClick={() => choose(option)}
      aria-label={option}
    />
  );

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        className="h-3 w-3 rounded-full border border-muted"
        style={color ? { background: color, borderColor: 'transparent', boxShadow: `0 0 7px ${color}` } : undefined}
        onClick={() => setIsOpen((value) => !value)}
        aria-label={color ? `Color ${color}. Change color` : 'Assign a color'}
        aria-expanded={isOpen}
      />
      {isOpen && (
        <div className="absolute top-5 left-0 z-10 flex w-max flex-col gap-1.5 border border-edge-strong bg-panel/95 p-2 backdrop-blur">
          <div className="grid grid-cols-9 gap-1.5">{VIVID_PROJECT_COLORS.map(renderSwatch)}</div>
          <div className="grid grid-cols-9 gap-1.5">{SOFT_PROJECT_COLORS.map(renderSwatch)}</div>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted">
            <button type="button" className="rounded border border-muted px-1.5 hover:text-fg" onClick={() => customInputRef.current?.click()}>
              custom
            </button>
            <input
              ref={customInputRef}
              type="color"
              className="sr-only"
              value={customDraft ?? color ?? DEFAULT_CUSTOM_COLOR}
              onChange={(event) => setCustomDraft(event.target.value)}
              aria-label="Custom color"
            />
            <button type="button" className="rounded border border-muted px-1.5 hover:text-fg" onClick={() => choose(undefined)}>
              none
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
