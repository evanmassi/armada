import { useEffect, useRef } from 'react';
import type { SessionLaunch } from '@shared/sessions/sessionSchemas';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { useTerminalSession } from '../../hooks/useTerminalSession';

interface TerminalSessionTileProps {
  tileId: string;
  launch: SessionLaunch;
  onSessionRebound(sessionId: string): void;
}

export function TerminalSessionTile({ tileId, launch, onSessionRebound }: TerminalSessionTileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusTerminal = useTerminalSession(containerRef, { tileId, launch, onSessionRebound });
  const isFocusRequested = useBoardSelectionStore((state) => state.focusedTileId === tileId);

  useEffect(() => {
    if (isFocusRequested) focusTerminal();
  }, [isFocusRequested, focusTerminal]);

  return <div ref={containerRef} className="h-full w-full" />;
}
