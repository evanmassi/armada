import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { SessionLaunch } from '@shared/sessions/sessionSchemas';
import { useTerminalFontSize } from '@renderer/domains/workspace';
import { acquireLiveTerminal, type LiveTerminal } from '../model/liveTerminals';

interface TerminalSessionOptions {
  tileId: string;
  launch: SessionLaunch;
  onSessionRebound(sessionId: string): void;
}

export function useTerminalSession(
  containerRef: RefObject<HTMLDivElement | null>,
  { tileId, launch, onSessionRebound }: TerminalSessionOptions,
) {
  const fontSize = useTerminalFontSize();
  const fontSizeRef = useRef(fontSize);
  fontSizeRef.current = fontSize;
  const launchRef = useRef(launch);
  const onSessionReboundRef = useRef(onSessionRebound);
  onSessionReboundRef.current = onSessionRebound;
  const liveRef = useRef<LiveTerminal | undefined>(undefined);

  // PITFALL: the launch is read once per tile; a /clear rebinds the tile's session id without respawning the process.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const live = acquireLiveTerminal(tileId, { launch: launchRef.current, fontSize: fontSizeRef.current });
    live.attach(container, (sessionId) => onSessionReboundRef.current(sessionId));
    liveRef.current = live;
    return () => {
      live.detach();
      liveRef.current = undefined;
    };
  }, [containerRef, tileId]);

  useEffect(() => {
    liveRef.current?.setFontSize(fontSize);
  }, [fontSize]);

  return useCallback(() => liveRef.current?.focus(), []);
}
