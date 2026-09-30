export type StrokeIcon = 'explorer' | 'editor' | 'shell' | 'chevronLeft' | 'chevronRight' | 'chevronDown' | 'save' | 'fullView';

const ICON_DRAWINGS: Record<StrokeIcon, { viewBox: string; strokes: string }> = {
  explorer: { viewBox: '0 0 16 16', strokes: 'M2 3.5h4l1.5 1.5H14v7.5H2z' },
  editor: { viewBox: '0 0 16 16', strokes: 'M11.5 2v12M11.5 2 3 10M11.5 14 3 6' },
  shell: { viewBox: '0 0 18 16', strokes: 'M2 3.5 7.5 8 2 12.5M10 13.5h6.5' },
  chevronLeft: { viewBox: '0 0 16 16', strokes: 'M10 3.5 5.5 8l4.5 4.5' },
  chevronRight: { viewBox: '0 0 16 16', strokes: 'M6 3.5 10.5 8 6 12.5' },
  chevronDown: { viewBox: '0 0 16 16', strokes: 'M3.5 6 8 10.5 12.5 6' },
  save: { viewBox: '0 0 16 16', strokes: 'M8 2.5v7.5M4.5 6.5 8 10l3.5-3.5M2.5 11.5v2h11v-2' },
  fullView: { viewBox: '0 0 16 16', strokes: 'M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10' },
};

interface StrokeIconButtonProps {
  icon: StrokeIcon;
  label: string;
  onClick(): void;
  disabled?: boolean;
  expanded?: boolean;
}

function IconStrokes({ icon, className }: { icon: StrokeIcon; className: string }) {
  const { viewBox, strokes } = ICON_DRAWINGS[icon];
  return (
    <svg className={className} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={strokes} />
    </svg>
  );
}

export function StrokeIconButton({ icon, label, onClick, disabled, expanded }: StrokeIconButtonProps) {
  return (
    <button
      type="button"
      className="hud-glyph px-1 text-muted disabled:opacity-35"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={expanded}
      title={label}
      aria-label={label}
    >
      <IconStrokes icon={icon} className="hud-glyph-echo" />
      <IconStrokes icon={icon} className="hud-glyph-icon" />
    </button>
  );
}
