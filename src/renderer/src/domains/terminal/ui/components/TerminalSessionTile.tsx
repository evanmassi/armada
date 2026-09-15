import { useRef } from 'react';
import { useTerminalSession } from '../../hooks/useTerminalSession';

interface TerminalSessionTileProps {
  sessionId: string;
  cwd: string;
}

export function TerminalSessionTile({ sessionId, cwd }: TerminalSessionTileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useTerminalSession(containerRef, { sessionId, cwd });
  return <div ref={containerRef} className="h-full w-full" />;
}
