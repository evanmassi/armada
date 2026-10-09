import { useEffect, useRef } from 'react';
import type { SessionLaunch } from '@shared/sessions/sessionSchemas';
import { selectBodyFocusRequest, useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { useTerminalSession } from '../../hooks/useTerminalSession';

interface TerminalSessionTileProps {
  tileId: string;
  launch: SessionLaunch;
  onSessionRebound(sessionId: string): void;
}

export function TerminalSessionTile({ tileId, launch, onSessionRebound }: TerminalSessionTileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusTerminal = useTerminalSession(containerRef, { tileId, launch, onSessionRebound });
  const bodyFocusRequest = useBoardSelectionStore(selectBodyFocusRequest(tileId));

  useEffect(() => {
    // PITFALL: entering a diagram page also makes its tile current, and pulling focus to the terminal then would take the keys away from the page.
    if (bodyFocusRequest !== undefined && !(document.activeElement instanceof HTMLIFrameElement)) focusTerminal();
  }, [bodyFocusRequest, focusTerminal]);

  return <div ref={containerRef} className="h-full w-full" />;
}
