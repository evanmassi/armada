import { LAYOUT_MODES, type LayoutMode } from '@shared/workspace/workspaceSchemas';

interface BoardLayoutModeControlsProps {
  layoutMode: LayoutMode;
  onChange(layoutMode: LayoutMode): void;
  onReflow(): void;
}

export function BoardLayoutModeControls({ layoutMode, onChange, onReflow }: BoardLayoutModeControlsProps) {
  return (
    <div className="ml-auto flex items-center gap-1 text-[11px]">
      <div className="flex overflow-hidden rounded border border-edge" role="radiogroup" aria-label="Layout mode">
        {LAYOUT_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={layoutMode === mode}
            className={`px-2 py-0.5 ${layoutMode === mode ? 'bg-edge text-white' : 'text-muted hover:text-fg'}`}
            onClick={() => onChange(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
      {layoutMode === 'free' && (
        <button type="button" className="rounded px-2 py-0.5 text-muted hover:bg-edge hover:text-fg" onClick={onReflow}>
          reflow
        </button>
      )}
    </div>
  );
}
