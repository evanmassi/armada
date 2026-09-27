export type BoardTileIcon = 'explorer' | 'editor' | 'shell';

const ICON_DRAWINGS: Record<BoardTileIcon, { viewBox: string; strokes: string }> = {
  explorer: { viewBox: '0 0 16 16', strokes: 'M2 3.5h4l1.5 1.5H14v7.5H2z' },
  editor: { viewBox: '0 0 16 16', strokes: 'M11.5 2v12M11.5 2 3 10M11.5 14 3 6' },
  shell: { viewBox: '0 0 18 16', strokes: 'M2 3.5 7.5 8 2 12.5M10 13.5h6.5' },
};

interface BoardTileIconButtonProps {
  icon: BoardTileIcon;
  label: string;
  onClick(): void;
}

function IconStrokes({ icon, className }: { icon: BoardTileIcon; className: string }) {
  const { viewBox, strokes } = ICON_DRAWINGS[icon];
  return (
    <svg className={className} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={strokes} />
    </svg>
  );
}

export function BoardTileIconButton({ icon, label, onClick }: BoardTileIconButtonProps) {
  return (
    <button type="button" className="hud-glyph px-1 text-muted" onClick={onClick} title={label} aria-label={label}>
      <IconStrokes icon={icon} className="hud-glyph-echo" />
      <IconStrokes icon={icon} className="hud-glyph-icon" />
    </button>
  );
}
