import { LAYOUT_MODES, type LayoutMode } from '@shared/workspace/workspaceSchemas';

interface BoardLayoutModeControlsProps {
  layoutMode: LayoutMode;
  onChange(layoutMode: LayoutMode): void;
  onReflow(): void;
}

export function BoardLayoutModeControls({ layoutMode, onChange, onReflow }: BoardLayoutModeControlsProps) {
  return (
    <div className="readout ml-auto flex items-center gap-2">
      <div className="flex gap-1.5" role="radiogroup" aria-label="Layout mode">
        {LAYOUT_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={layoutMode === mode}
            className="hud-button text-muted"
            onClick={() => onChange(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`hud-button text-muted ${layoutMode === 'free' ? '' : 'invisible'}`}
        onClick={onReflow}
        disabled={layoutMode !== 'free'}
      >
        reflow
      </button>
    </div>
  );
}
