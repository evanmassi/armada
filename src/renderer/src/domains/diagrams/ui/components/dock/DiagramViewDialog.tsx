import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { DIAGRAM_PAGE_ESCAPE_MESSAGE, type DiagramSummary } from '@shared/diagrams/diagramSchemas';
import { DiagramCanvasPanel } from './DiagramCanvasPanel';

interface DiagramViewDialogProps {
  tileId: string;
  diagram: DiagramSummary;
  isFullView: boolean;
  onExitFullView(): void;
  children?: ReactNode;
}

export function DiagramViewDialog({ tileId, diagram, isFullView, onExitFullView, children }: DiagramViewDialogProps) {
  const viewerRef = useRef<HTMLDialogElement>(null);
  const onExitFullViewRef = useRef(onExitFullView);
  onExitFullViewRef.current = onExitFullView;

  // PITFALL: full view lifts this same dialog into the top layer instead of rendering a copy, because moving or remounting the frame reloads an interactive page and loses its state.
  useLayoutEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || (viewer.open && viewer.matches(':modal') === isFullView)) return;
    if (viewer.open) viewer.close();
    // PITFALL: show() moves focus into the dialog and would pull typing away from the terminal; the open attribute docks it without focusing.
    if (isFullView) viewer.showModal();
    else viewer.setAttribute('open', '');
  }, [isFullView]);

  useEffect(() => {
    if (!isFullView) return;
    const exitOnPageEscape = (event: MessageEvent): void => {
      const pageFrame = viewerRef.current?.querySelector('iframe')?.contentWindow;
      if (event.data === DIAGRAM_PAGE_ESCAPE_MESSAGE && pageFrame && event.source === pageFrame) onExitFullViewRef.current();
    };
    window.addEventListener('message', exitOnPageEscape);
    return () => window.removeEventListener('message', exitOnPageEscape);
  }, [isFullView]);

  return (
    <dialog
      ref={viewerRef}
      className="diagram-viewer"
      aria-label={diagram.fileName}
      onCancel={(event) => {
        event.preventDefault();
        onExitFullViewRef.current();
      }}
    >
      {isFullView && (
        <div className="diagram-seam flex items-center gap-2 px-3 py-1.5">
          <span className="diagram-seam-label readout text-[11px]">DIAGRAM</span>
          <span className="min-w-0 flex-1 truncate font-ui text-[13px] font-semibold tracking-wide text-fg">{diagram.fileName}</span>
          <button
            type="button"
            className="hud-glyph px-1 text-muted"
            data-glyph="×"
            data-tone="neutral"
            onClick={onExitFullView}
            aria-label="Close full view"
            title="Close (Esc)"
          >
            ×
          </button>
        </div>
      )}
      <div className="relative min-h-0 flex-1">
        <DiagramCanvasPanel tileId={tileId} diagram={diagram} />
        {children}
      </div>
    </dialog>
  );
}
