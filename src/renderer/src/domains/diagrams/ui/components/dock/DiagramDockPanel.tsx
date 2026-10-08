import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { DiagramSummary } from '@shared/diagrams/diagramSchemas';
import { DEFAULT_DIAGRAM_DOCK, type DiagramDock } from '@shared/workspace/workspaceSchemas';
import { TRUNCATED_TOOLTIP_PROPS } from '@renderer/app/tooltips';
import { CollapseToggleButton } from '@renderer/shared/ui/components/CollapseToggleButton';
import { StrokeIconButton, StrokeIconDrawing } from '@renderer/shared/ui/components/StrokeIconButton';
import { useDiagramSave } from '../../../hooks/useDiagramSave';
import { useTileDiagramsQuery } from '../../../hooks/useTileDiagramsQuery';
import { DiagramPagerControls } from './DiagramPagerControls';
import { DiagramViewDialog } from './DiagramViewDialog';

const MIN_HEIGHT_FRACTION = 0.15;
const MAX_HEIGHT_FRACTION = 0.85;
const KEYBOARD_RESIZE_STEP = 0.05;
const SAVE_LABELS: Record<DiagramSummary['format'], string> = { mermaid: 'Save as SVG', svg: 'Save as SVG', html: 'Save as HTML' };

const clampHeightFraction = (fraction: number): number => Math.min(MAX_HEIGHT_FRACTION, Math.max(MIN_HEIGHT_FRACTION, fraction));

type DiagramDockChangeHandler = (change: Partial<DiagramDock>) => void;

interface DiagramDockPanelProps {
  tileId: string;
  dock: DiagramDock | undefined;
  onDockChange: DiagramDockChangeHandler;
}

export function DiagramDockPanel({ tileId, dock, onDockChange }: DiagramDockPanelProps) {
  const { data: diagrams = [] } = useTileDiagramsQuery(tileId);
  if (diagrams.length === 0) return null;
  return (
    <DiagramDockPanelContent tileId={tileId} dock={dock ?? DEFAULT_DIAGRAM_DOCK} onDockChange={onDockChange} diagrams={diagrams} />
  );
}

interface DiagramDockPanelContentProps extends DiagramDockPanelProps {
  dock: DiagramDock;
  diagrams: DiagramSummary[];
}

function DiagramDockPanelContent({ tileId, dock, onDockChange, diagrams }: DiagramDockPanelContentProps) {
  const [isFullView, setIsFullView] = useState(false);
  const [draftHeightFraction, setDraftHeightFraction] = useState<number>();
  const dockRef = useRef<HTMLDivElement>(null);
  const { save, isSaving } = useDiagramSave(tileId);

  const selectedIndex = diagrams.findIndex((diagram) => diagram.fileName === dock.selectedFileName);
  const index = selectedIndex === -1 ? diagrams.length - 1 : selectedIndex;
  const diagram = diagrams[index]!;
  const heightFraction = draftHeightFraction ?? dock.heightFraction;

  const step = (offset: -1 | 1): void =>
    onDockChange({ selectedFileName: diagrams[(index + offset + diagrams.length) % diagrams.length]!.fileName });

  const heightFractionAt = (clientY: number): number | undefined => {
    const bounds = dockRef.current?.parentElement?.getBoundingClientRect();
    return bounds && clampHeightFraction((bounds.bottom - clientY) / bounds.height);
  };

  const startResize = (event: PointerEvent<HTMLDivElement>): void => {
    if (!dock.isOpen || (event.target as Element).closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraftHeightFraction(dock.heightFraction);
  };

  const resize = (event: PointerEvent<HTMLDivElement>): void => {
    if (draftHeightFraction !== undefined) setDraftHeightFraction(heightFractionAt(event.clientY) ?? draftHeightFraction);
  };

  const finishResize = (): void => {
    if (draftHeightFraction === undefined) return;
    onDockChange({ heightFraction: draftHeightFraction });
    setDraftHeightFraction(undefined);
  };

  const resizeFromKeyboard = (event: KeyboardEvent<HTMLSpanElement>): void => {
    const direction = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0;
    if (direction === 0 || !dock.isOpen) return;
    event.preventDefault();
    onDockChange({ heightFraction: clampHeightFraction(dock.heightFraction + direction * KEYBOARD_RESIZE_STEP) });
  };

  return (
    <div ref={dockRef} className="diagram-dock flex min-h-0 shrink-0 flex-col overflow-hidden" style={dock.isOpen ? { flexBasis: `${heightFraction * 100}%` } : undefined}>
      <div
        className={`diagram-seam flex items-center gap-1.5 px-2 py-0.5 ${dock.isOpen ? 'cursor-row-resize' : ''}`}
        onPointerDown={startResize}
        onPointerMove={resize}
        onLostPointerCapture={finishResize}
      >
        <CollapseToggleButton isCollapsed={!dock.isOpen} target="diagram" onToggle={() => onDockChange({ isOpen: !dock.isOpen })} />
        <span
          className="diagram-seam-label"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Diagram panel height. Arrow up and down resize it."
          aria-valuenow={Math.round(heightFraction * 100)}
          tabIndex={0}
          onKeyDown={resizeFromKeyboard}
        >
          <StrokeIconDrawing icon="diagram" className="tile-accent-icon" />
        </span>
        <span className="tile-title min-w-0 flex-1 truncate" {...TRUNCATED_TOOLTIP_PROPS}>{diagram.fileName}</span>
        <StrokeIconButton icon="save" label={SAVE_LABELS[diagram.format]} onClick={() => save(diagram)} disabled={isSaving} />
        <StrokeIconButton icon="fullView" label="Full view" onClick={() => setIsFullView(true)} />
      </div>
      {(dock.isOpen || isFullView) && (
        <div className={`min-h-0 flex-1 ${draftHeightFraction === undefined ? '' : 'pointer-events-none'}`}>
          <DiagramViewDialog tileId={tileId} diagram={diagram} isFullView={isFullView} onExitFullView={() => setIsFullView(false)}>
            {diagrams.length > 1 && <DiagramPagerControls position={index + 1} count={diagrams.length} onStep={step} />}
          </DiagramViewDialog>
        </div>
      )}
    </div>
  );
}
