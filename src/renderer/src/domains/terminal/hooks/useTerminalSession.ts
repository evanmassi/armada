import { useEffect, type RefObject } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { Unsubscribe } from '@shared/armadaApi';
import { useNotificationStore } from '@renderer/app/stores/notificationStore';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';
import { getErrorMessage } from '@renderer/shared/utils/getErrorMessage';

const TERMINAL_THEME = { background: '#0d0f12', foreground: '#d6d8dc', cursor: '#d6d8dc' };
const TERMINAL_FONT = '"Cascadia Code", Consolas, monospace';
const SESSION_ENDED_BANNER = '\r\n[session ended]\r\n';
const REFIT_DEBOUNCE_MS = 80;

interface TerminalSessionOptions {
  sessionId: string;
  cwd: string;
}

export function useTerminalSession(containerRef: RefObject<HTMLDivElement | null>, { sessionId, cwd }: TerminalSessionOptions): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const terminal = new Terminal({ theme: TERMINAL_THEME, fontFamily: TERMINAL_FONT, fontSize: 13, cursorBlink: true });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(container);
    fit.fit();

    let isDisposed = false;
    let terminalId: string | undefined;
    const subscriptions: Unsubscribe[] = [];

    armadaClient.sessions
      .open({ sessionId, cwd, cols: terminal.cols, rows: terminal.rows })
      .then((ref) => {
        if (isDisposed) {
          armadaClient.sessions.close(ref);
          return;
        }
        terminalId = ref.terminalId;
        subscriptions.push(
          armadaClient.sessions.onOutput((event) => {
            if (event.terminalId === terminalId) terminal.write(event.data);
          }),
          armadaClient.sessions.onExit((event) => {
            if (event.terminalId === terminalId) terminal.write(SESSION_ENDED_BANNER);
          }),
        );
        terminal.onData((data) => armadaClient.sessions.write({ terminalId: ref.terminalId, data }));
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
      subscriptions.forEach((unsubscribe) => unsubscribe());
      if (terminalId) armadaClient.sessions.close({ terminalId });
      terminal.dispose();
    };
  }, [containerRef, sessionId, cwd]);
}
