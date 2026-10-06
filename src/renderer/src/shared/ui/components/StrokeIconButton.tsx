import { CLICK_ORIGIN_PROPS } from '@renderer/app/clickFeedback';

export type StrokeIcon = 'claude' | 'shell' | 'chevronLeft' | 'chevronRight' | 'chevronDown' | 'save' | 'fullView' | 'diagram' | 'notes';

const ICON_DRAWINGS: Record<StrokeIcon, { viewBox: string; strokes: string }> = {
  claude: { viewBox: '0 0 16 16', strokes: 'M8.21 6.51L8.88 1.76M8.92 6.82L10.83 4.38M9.39 7.44L13.28 5.86M9.49 8.21L12.16 8.58M9.18 8.92L12.81 11.76M8.56 9.39L9.84 12.54M7.79 9.49L7.11 14.34M7.08 9.18L5.29 11.47M6.61 8.56L2.90 10.06M6.51 7.79L3.25 7.33M6.82 7.08L3.27 4.31M7.44 6.61L6.39 4.01' },
  shell: { viewBox: '0 0 18 16', strokes: 'M2 3.5 7.5 8 2 12.5M10 13.5h6.5' },
  chevronLeft: { viewBox: '0 0 16 16', strokes: 'M10 3.5 5.5 8l4.5 4.5' },
  chevronRight: { viewBox: '0 0 16 16', strokes: 'M6 3.5 10.5 8 6 12.5' },
  chevronDown: { viewBox: '0 0 16 16', strokes: 'M3.5 6 8 10.5 12.5 6' },
  save: { viewBox: '0 0 16 16', strokes: 'M8 2.5v7.5M4.5 6.5 8 10l3.5-3.5M2.5 11.5v2h11v-2' },
  fullView: { viewBox: '0 0 16 16', strokes: 'M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10' },
  diagram: { viewBox: '0 0 16 16', strokes: 'M5.5 1.5h5v4h-5zM1.5 10.5h5v4h-5zM9.5 10.5h5v4h-5zM8 5.5V8M4 10.5V8h8v2.5' },
  notes: { viewBox: '0 0 16 16', strokes: 'M3.5 1.5h9v13h-9zM6 5.5h4M6 8h4M6 10.5h2.5' },
};

interface StrokeIconButtonProps {
  icon: StrokeIcon;
  label: string;
  onClick(): void;
  disabled?: boolean;
  expanded?: boolean;
  isClickOrigin?: boolean;
}

export function StrokeIconDrawing({ icon, className }: { icon: StrokeIcon; className: string }) {
  const { viewBox, strokes } = ICON_DRAWINGS[icon];
  return (
    <svg className={className} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={strokes} />
    </svg>
  );
}

export function StrokeIconButton({ icon, label, onClick, disabled, expanded, isClickOrigin }: StrokeIconButtonProps) {
  return (
    <button
      type="button"
      className="hud-glyph px-1 text-muted disabled:opacity-35"
      {...(isClickOrigin ? CLICK_ORIGIN_PROPS : {})}
      onClick={onClick}
      disabled={disabled}
      aria-expanded={expanded}
      title={label}
      aria-label={label}
    >
      <StrokeIconDrawing icon={icon} className="hud-glyph-echo" />
      <StrokeIconDrawing icon={icon} className="hud-glyph-icon" />
    </button>
  );
}
