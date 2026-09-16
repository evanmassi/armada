import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { Unsubscribe } from '@shared/armadaApi';
import type { ClaudeHookEvent, OpenSessionRequest, SessionLaunch } from '@shared/sessions/sessionSchemas';
import { isGlobalShortcut } from '@renderer/app/keyboardShortcuts';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { useNotificationStore } from '@renderer/app/stores/notificationStore';
import { useSessionActivityStore } from '@renderer/app/stores/sessionActivityStore';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';
import { getErrorMessage } from '@renderer/shared/utils/getErrorMessage';
import { createActivityTracker } from './activityTracker';
import { handleClipboardKey, handleContextMenu } from './terminalClipboard';

const TERMINAL_THEME = { background: '#080a0f', foreground: '#d7dbe2', cursor: '#8fd3e8', selectionBackground: '#8fd3e844' };
const TERMINAL_FONT = '"Cascadia Code", Consolas, monospace';
const REFIT_DEBOUNCE_MS = 80;

const exitBanner = (exitCode: number): string => `\r\n[exited with code ${exitCode}]\r\n`;

const SESSION_ROTATION_SOURCES = new Set<string>(['clear', 'resume', 'fork']);

// PITFALL: a claude started by Claude inside the tile inherits the tile id and reports its own session; only a rotation of the tile's own session rebinds.
const isSessionRotation = (event: ClaudeHookEvent): boolean =>
  event.kind === 'sessionStarted' && event.source !== undefined && SESSION_ROTATION_SOURCES.has(event.source);

export type SessionReboundHandler = (sessionId: string) => void;

export interface LiveTerminal {
  attach(container: HTMLElement, onSessionRebound: SessionReboundHandler): void;
  detach(): void;
  setFontSize(fontSize: number): void;
  focus(): void;
}

interface LiveTerminalOptions {
  launch: SessionLaunch;
  fontSize: number;
}

interface Attachment {
  container: HTMLElement;
  resizeObserver: ResizeObserver;
  onContextMenu(event: MouseEvent): void;
}

class LiveTerminalEntry implements LiveTerminal {
  private terminal: Terminal;
  private fit = new FitAddon();
  private attachment: Attachment | undefined;
  private terminalId: string | undefined;
  private isDisposed = false;
  private subscriptions: Unsubscribe[] = [];
  private refitTimer: number | undefined;
  private onSessionRebound: SessionReboundHandler = () => undefined;

  constructor(
    private tileId: string,
    private launch: SessionLaunch,
    fontSize: number,
  ) {
    this.terminal = new Terminal({ theme: TERMINAL_THEME, fontFamily: TERMINAL_FONT, fontSize, cursorBlink: true });
    this.terminal.loadAddon(this.fit);
    this.terminal.attachCustomKeyEventHandler((event) => !isGlobalShortcut(event) && !handleClipboardKey(this.terminal, event));
  }

  attach(container: HTMLElement, onSessionRebound: SessionReboundHandler): void {
    this.onSessionRebound = onSessionRebound;
    this.detach();
    const isFirstAttach = this.terminal.element === undefined;
    if (isFirstAttach) this.terminal.open(container);
    else container.appendChild(this.terminal.element!);
    this.fit.fit();
    const onContextMenu = (event: MouseEvent): void => handleContextMenu(this.terminal, event);
    container.addEventListener('contextmenu', onContextMenu);
    const resizeObserver = new ResizeObserver(() => this.scheduleRefit());
    resizeObserver.observe(container);
    this.attachment = { container, resizeObserver, onContextMenu };
    if (isFirstAttach) this.openSession();
  }

  detach(): void {
    if (!this.attachment) return;
    window.clearTimeout(this.refitTimer);
    this.attachment.resizeObserver.disconnect();
    this.attachment.container.removeEventListener('contextmenu', this.attachment.onContextMenu);
    this.terminal.element?.remove();
    this.attachment = undefined;
  }

  setFontSize(fontSize: number): void {
    this.terminal.options.fontSize = fontSize;
    if (this.attachment) this.fit.fit();
  }

  focus(): void {
    this.terminal.focus();
  }

  dispose(): void {
    this.isDisposed = true;
    this.detach();
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    if (this.terminalId) armadaClient.sessions.close({ terminalId: this.terminalId });
    useSessionActivityStore.getState().clearActivity(this.tileId);
    this.terminal.dispose();
  }

  private scheduleRefit(): void {
    window.clearTimeout(this.refitTimer);
    this.refitTimer = window.setTimeout(() => this.fit.fit(), REFIT_DEBOUNCE_MS);
  }

  private openSession(): void {
    const { terminal, tileId } = this;
    terminal.textarea?.addEventListener('focus', () => useBoardSelectionStore.getState().setFocusedTile(tileId));
    const { setActivity } = useSessionActivityStore.getState();
    let boundSessionId = this.launch.kind === 'claude' ? this.launch.sessionId : undefined;
    const activity = createActivityTracker((state) => setActivity(tileId, boundSessionId, state));
    const size = { cols: terminal.cols, rows: terminal.rows };
    const request: OpenSessionRequest =
      this.launch.kind === 'claude' ? { kind: 'claude', sessionId: this.launch.sessionId, cwd: this.launch.cwd, ...size } : { kind: 'shell', cwd: this.launch.cwd, ...size };

    armadaClient.sessions
      .open(request)
      .then((ref) => {
        if (this.isDisposed) {
          armadaClient.sessions.close(ref);
          return;
        }
        const { terminalId } = ref;
        this.terminalId = terminalId;
        this.subscriptions.push(
          armadaClient.sessions.onOutput((event) => {
            if (event.terminalId === terminalId) terminal.write(event.data);
          }),
          armadaClient.sessions.onExit((event) => {
            if (event.terminalId !== terminalId) return;
            terminal.write(exitBanner(event.exitCode));
            activity.recordExit();
          }),
          armadaClient.sessions.onClaudeHookEvent((event) => {
            if (event.terminalId !== terminalId) return;
            if (event.sessionId !== boundSessionId) {
              if (!isSessionRotation(event)) return;
              boundSessionId = event.sessionId;
              this.onSessionRebound(event.sessionId);
            }
            activity.recordHookEvent(event.kind);
          }),
        );
        terminal.onData((data) => {
          armadaClient.sessions.write({ terminalId, data });
          activity.recordInput(data);
        });
        terminal.onResize(({ cols, rows }) => armadaClient.sessions.resize({ terminalId, cols, rows }));
        terminal.focus();
      })
      .catch((error: unknown) => useNotificationStore.getState().notify(getErrorMessage(error)));
  }
}

const liveTerminals = new Map<string, LiveTerminalEntry>();

// PITFALL: terminals are keyed by tile, not by React position, so a tile that changes row or panel keeps its process.
export function acquireLiveTerminal(tileId: string, { launch, fontSize }: LiveTerminalOptions): LiveTerminal {
  let entry = liveTerminals.get(tileId);
  if (!entry) {
    entry = new LiveTerminalEntry(tileId, launch, fontSize);
    liveTerminals.set(tileId, entry);
  }
  return entry;
}

export function disposeLiveTerminal(tileId: string): void {
  liveTerminals.get(tileId)?.dispose();
  liveTerminals.delete(tileId);
}

export function disposeLiveTerminalsExcept(keptTileIds: ReadonlySet<string>): void {
  for (const tileId of [...liveTerminals.keys()]) {
    if (!keptTileIds.has(tileId)) disposeLiveTerminal(tileId);
  }
}
