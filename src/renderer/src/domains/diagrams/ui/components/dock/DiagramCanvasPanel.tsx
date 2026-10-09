import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { DIAGRAM_PAGE_SCHEME, type DiagramSummary } from '@shared/diagrams/diagramSchemas';
import { getErrorMessage } from '@renderer/shared/utils/getErrorMessage';
import { useDiagramPageLinks } from '../../../hooks/useDiagramPageLinks';
import { useRenderedDiagramQuery } from '../../../hooks/useRenderedDiagramQuery';
import { svgImageSource } from '../../../model/diagramSvg';

const MIN_SCALE = 0.2;
const MAX_SCALE = 8;
const WHEEL_ZOOM_RATE = 0.0015;
const KEY_ZOOM_FACTOR = 1.25;
const KEY_PAN_STEP_PX = 40;
const IDENTITY_VIEW = { scale: 1, x: 0, y: 0 };

type DiagramView = typeof IDENTITY_VIEW;

const ZOOM_FACTOR_BY_KEY: Record<string, number> = { '+': KEY_ZOOM_FACTOR, '=': KEY_ZOOM_FACTOR, '-': 1 / KEY_ZOOM_FACTOR, _: 1 / KEY_ZOOM_FACTOR };
const PAN_BY_KEY: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: KEY_PAN_STEP_PX, y: 0 },
  ArrowRight: { x: -KEY_PAN_STEP_PX, y: 0 },
  ArrowUp: { x: 0, y: KEY_PAN_STEP_PX },
  ArrowDown: { x: 0, y: -KEY_PAN_STEP_PX },
};

const zoomAround = (current: DiagramView, factor: number, pointX: number, pointY: number): DiagramView => {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor));
  const ratio = scale / current.scale;
  return { scale, x: pointX - (pointX - current.x) * ratio, y: pointY - (pointY - current.y) * ratio };
};

interface DiagramCanvasPanelProps {
  tileId: string;
  diagram: DiagramSummary;
}

const diagramPageUrl = (tileId: string, { fileName, updatedAt }: DiagramSummary): string =>
  `${DIAGRAM_PAGE_SCHEME}://${tileId}/${encodeURIComponent(fileName)}?v=${updatedAt}`;

export function DiagramCanvasPanel({ tileId, diagram }: DiagramCanvasPanelProps) {
  if (diagram.format !== 'html') return <StaticDiagramCanvasPanel tileId={tileId} diagram={diagram} />;
  return <InteractiveDiagramCanvasPanel tileId={tileId} diagram={diagram} />;
}

function InteractiveDiagramCanvasPanel({ tileId, diagram }: DiagramCanvasPanelProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  useDiagramPageLinks(frameRef);
  return (
    <iframe
      ref={frameRef}
      className="diagram-page h-full w-full border-0"
      sandbox="allow-scripts"
      src={diagramPageUrl(tileId, diagram)}
      title={diagram.fileName}
    />
  );
}

function StaticDiagramCanvasPanel({ tileId, diagram }: DiagramCanvasPanelProps) {
  const { data: svg, isPending, isError, error } = useRenderedDiagramQuery(tileId, diagram);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | undefined>(undefined);
  const [view, setView] = useState(IDENTITY_VIEW);
  const imageSource = useMemo(() => (diagram.format === 'svg' && svg !== undefined ? svgImageSource(svg) : undefined), [diagram.format, svg]);

  useEffect(() => setView(IDENTITY_VIEW), [diagram.fileName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const zoom = (event: WheelEvent): void => {
      event.preventDefault();
      const bounds = canvas.getBoundingClientRect();
      const pointerX = event.clientX - bounds.left - bounds.width / 2;
      const pointerY = event.clientY - bounds.top - bounds.height / 2;
      setView((current) => zoomAround(current, Math.exp(-event.deltaY * WHEEL_ZOOM_RATE), pointerX, pointerY));
    };
    canvas.addEventListener('wheel', zoom, { passive: false });
    return () => canvas.removeEventListener('wheel', zoom);
  }, []);

  const startPan = (event: PointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOrigin.current = { pointerX: event.clientX, pointerY: event.clientY, x: view.x, y: view.y };
  };

  const pan = (event: PointerEvent<HTMLDivElement>): void => {
    const origin = dragOrigin.current;
    if (origin) setView((current) => ({ ...current, x: origin.x + event.clientX - origin.pointerX, y: origin.y + event.clientY - origin.pointerY }));
  };

  const moveFromKeyboard = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const zoomFactor = ZOOM_FACTOR_BY_KEY[event.key];
    const step = PAN_BY_KEY[event.key];
    if (zoomFactor) setView((current) => zoomAround(current, zoomFactor, 0, 0));
    else if (step) setView((current) => ({ ...current, x: current.x + step.x, y: current.y + step.y }));
    else if (event.key === '0') setView(IDENTITY_VIEW);
    else return;
    event.preventDefault();
  };

  return (
    <div
      ref={canvasRef}
      className="diagram-canvas relative h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
      onPointerDown={startPan}
      onPointerMove={pan}
      onLostPointerCapture={() => (dragOrigin.current = undefined)}
      onDoubleClick={() => setView(IDENTITY_VIEW)}
      onKeyDown={moveFromKeyboard}
      tabIndex={0}
      role="group"
      aria-label={`${diagram.fileName}: plus and minus zoom, arrow keys pan, 0 resets`}
      data-tooltip="Scroll or + and − to zoom, drag or arrow keys to pan, double-click or 0 to reset"
    >
      {isPending && <p className="readout p-3 text-[11px] text-muted">drawing…</p>}
      {isError && <p className="readout p-3 text-[11px] text-danger">{getErrorMessage(error)}</p>}
      {svg !== undefined && (
        <div
          className="diagram-canvas-content flex h-full w-full items-center justify-center p-3"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        >
          {diagram.format === 'mermaid' ? (
            <div className="diagram-mermaid contents" dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <img className="max-h-full max-w-full select-none" src={imageSource} alt={diagram.fileName} draggable={false} />
          )}
        </div>
      )}
    </div>
  );
}
