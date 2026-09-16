import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { Unsubscribe } from '@shared/armadaApi';
import type { OpenSessionRequest, SessionLaunch } from '@shared/sessions/sessionSchemas';
import { isGlobalShortcut } from '@renderer/app/keyboardShortcuts';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { useNotificationStore } from '@renderer/app/stores/notificationStore';
import { useSessionActivityStore } from '@renderer/app/stores/sessionActivityStore';
import { useTerminalFontSize } from '@renderer/domains/workspace';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';
import { getErrorMessage } from '@renderer/shared/utils/getErrorMessage';
import { createActivityTracker } from '../model/activityTracker';
import { handleClipboardKey, handleContextMenu } from '../model/terminalClipboard';

const TERMINAL_THEME = { background: '#080a0f', foreground: '#d7dbe2', cursor: '#8fd3e8', selectionBackground: '#8fd3e844' };
const TERMINAL_FONT = '"Cascadia Code", Consolas, monospace';
const exitBanner = (exitCode: number): string => `\r\n[exited with code ${exitCode}]\r\n`;
const REFIT_DEBOUNCE_MS = 80;

interface TerminalSessionOptions {
  tileId: string;
  launch: SessionLaunch;
  onSessionRebound(sessionId: string): void;
}

interface TerminalInstance {
  terminal: Terminal;
  fit: FitAddon;
}

export function useTerminalSession(
  containerRef: RefObject<HTMLDivElement | null>,
  { tileId, launch, onSessionRebound }: TerminalSessionOptions,
) {
  const fontSize = useTerminalFontSize();
  const initialFontSizeRef = useRef(fontSize);
  initialFontSizeRef.current = fontSize;
  const onSessionReboundRef = useRef(onSessionRebound);
  onSessionReboundRef.current = onSessionRebound;
  const instanceRef = useRef<TerminalInstance | undefined>(undefined);
  // PITFALL: a /clear inside the tile rotates the Claude session id and the tile follows; the running process must not be respawned for it.
  const launchedSessionIdRef = useRef(launch.kind === 'claude' ? launch.sessionId : undefined);
  const claudeSessionId = launchedSessionIdRef.current;
  const { cwd } = launch;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const terminal = new Terminal({ theme: TERMINAL_THEME, fontFamily: TERMINAL_FONT, fontSize: initialFontSizeRef.current, cursorBlink: true });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.attachCustomKeyEventHandler((event) => !isGlobalShortcut(event) && !handleClipboardKey(terminal, event));
    terminal.open(container);
    fit.fit();
    instanceRef.current = { terminal, fit };
    terminal.textarea?.addEventListener('focus', () => useBoardSelectionStore.getState().setFocusedTile(tileId));
    const onContextMenu = (event: MouseEvent): void => handleContextMenu(terminal, event);
    container.addEventListener('contextmenu', onContextMenu);

    const { setActivity, clearActivity } = useSessionActivityStore.getState();
    let boundSessionId = claudeSessionId;
    const activity = createActivityTracker((state) => setActivity(tileId, boundSessionId, state));

    let isDisposed = false;
    let terminalId: string | undefined;
    const subscriptions: Unsubscribe[] = [];
    const size = { cols: terminal.cols, rows: terminal.rows };
    const request: OpenSessionRequest =
      claudeSessionId !== undefined ? { kind: 'claude', sessionId: claudeSessionId, cwd, ...size } : { kind: 'shell', cwd, ...size };

    armadaClient.sessions
      .open(request)
      .then((ref) => {
        if (isDisposed) {
          armadaClient.sessions.close(ref);
          return;
        }
        terminalId = ref.terminalId;
        subscriptions.push(
          armadaClient.sessions.onOutput((event) => {
            if (event.terminalId !== terminalId) return;
            terminal.write(event.data);
          }),
          armadaClient.sessions.onExit((event) => {
            if (event.terminalId !== terminalId) return;
            terminal.write(exitBanner(event.exitCode));
            activity.recordExit();
          }),
          armadaClient.sessions.onClaudeHookEvent((event) => {
            if (event.terminalId !== terminalId) return;
            if (event.sessionId !== boundSessionId) {
              boundSessionId = event.sessionId;
              onSessionReboundRef.current(event.sessionId);
            }
            activity.recordHookEvent(event.kind);
          }),
        );
        terminal.onData((data) => {
          armadaClient.sessions.write({ terminalId: ref.terminalId, data });
          activity.recordInput(data);
        });
        terminal.onResize(({ cols, rows }) => armadaClient.sessions.resize({ terminalId: ref.terminalId, cols, rows }));
        terminal.focus();
      })
      .catch((error: unknown) => useNotificationStore.getState().notify(getErrorMessage(error)));

    let refitTimer: number | undefined;
    const scheduleRefit = (): void => {
      window.clearTimeout(refitTimer);
      refitTimer = window.setTimeout(() => fit.fit(), REFIT_DEBOUNCE_MS);
    };
    const resizeObserver = new ResizeObserver(scheduleRefit);
    resizeObserver.observe(container);

    return () => {
      isDisposed = true;
      window.clearTimeout(refitTimer);
      resizeObserver.disconnect();
      container.removeEventListener('contextmenu', onContextMenu);
      subscriptions.forEach((unsubscribe) => unsubscribe());
      if (terminalId) armadaClient.sessions.close({ terminalId });
      clearActivity(tileId);
      terminal.dispose();
      instanceRef.current = undefined;
    };
  }, [containerRef, tileId, claudeSessionId, cwd]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    instance.terminal.options.fontSize = fontSize;
    instance.fit.fit();
  }, [fontSize]);

  return useCallback(() => instanceRef.current?.terminal.focus(), []);
}
