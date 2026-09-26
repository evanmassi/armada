import { LAYOUT_MODES, type LayoutMode } from '@shared/workspace/workspaceSchemas';

interface BoardLayoutModeControlsProps {
  layoutMode: LayoutMode;
  onChange(layoutMode: LayoutMode): void;
  onReflow(): void;
}

export function BoardLayoutModeControls({ layoutMode, onChange, onReflow }: BoardLayoutModeControlsProps) {
  return (
    <div className="readout ml-auto flex items-center gap-1">
      <div className="flex border border-edge-strong" role="radiogroup" aria-label="Layout mode">
        {LAYOUT_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={layoutMode === mode}
            className={`px-2 py-0.5 ${layoutMode === mode ? 'bg-accent/15 text-accent' : 'text-muted hover:text-fg'}`}
            onClick={() => onChange(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`px-2 py-0.5 text-muted hover:text-accent ${layoutMode === 'free' ? '' : 'invisible'}`}
        onClick={onReflow}
        disabled={layoutMode !== 'free'}
      >
        reflow
      </button>
    </div>
  );
}
