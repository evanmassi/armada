import { useEffect, useRef } from 'react';
import type { Conversation, Project } from '@shared/conversations/conversationTypes';
import { GLOBAL_SHORTCUTS, isGlobalShortcut } from '@renderer/app/keyboardShortcuts';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { BoardLayoutModeControls, BoardPanel, BoardSwitcherBar, findClaudeTile, tileCwd, useBoardsEditor } from '@renderer/domains/boards';
import { ConversationSidebarPanel, useProjectColors, useProjectNames } from '@renderer/domains/conversations';
import { adjustTerminalFontSize, resetTerminalFontSize, useWorkspaceEditor, useWorkspaceQuery } from '@renderer/domains/workspace';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';
import { NotificationBar } from '@renderer/shared/ui/components/NotificationBar';
import { getErrorMessage } from '@renderer/shared/utils/getErrorMessage';

const DEFAULT_BOARD_NAME = 'Board';
const PROJECT_BOARD_TILE_COUNT = 3;

export function App() {
  const { data: workspace, isPending, isError, error } = useWorkspaceQuery();
  const { edit } = useWorkspaceEditor();
  const editor = useBoardsEditor();
  const { ensureColor } = useProjectColors();
  const nameOf = useProjectNames();
  const { activeBoardId, openedBoardIds, focusedTileId, selectBoard, focusTile } = useBoardSelectionStore();
  const boardAreaRef = useRef<HTMLDivElement>(null);

  const boards = workspace?.boards ?? [];
  const activeBoard = boards.find((board) => board.id === activeBoardId) ?? boards[0];
  const resolvedActiveBoardId = activeBoard?.id;

  useEffect(() => {
    if (resolvedActiveBoardId && resolvedActiveBoardId !== activeBoardId) selectBoard(resolvedActiveBoardId);
  }, [resolvedActiveBoardId, activeBoardId, selectBoard]);

  const ensureActiveBoard = (): string => resolvedActiveBoardId ?? editor.createBoard({ name: DEFAULT_BOARD_NAME });

  const boardFor = (cwd: string, keepOnCurrentBoard: boolean): string => {
    const isForeignProjectBoard = activeBoard?.projectCwd !== undefined && activeBoard.projectCwd !== cwd;
    if (keepOnCurrentBoard || !isForeignProjectBoard) return ensureActiveBoard();
    const own = boards.find((board) => board.projectCwd === cwd);
    const boardId = own?.id ?? editor.createBoard({ name: nameOf(cwd), projectCwd: cwd });
    selectBoard(boardId);
    return boardId;
  };

  const openConversation = (conversation: Conversation, keepOnCurrentBoard = false): void => {
    const existing = workspace && findClaudeTile(workspace, conversation.sessionId);
    if (existing) {
      focusTile(existing.boardId, existing.tile.id);
      return;
    }
    ensureColor(conversation.cwd);
    editor.addTile(boardFor(conversation.cwd, keepOnCurrentBoard), { kind: 'claude', sessionId: conversation.sessionId, cwd: conversation.cwd });
  };

  const startSession = (cwd: string, keepOnCurrentBoard = false, afterTileId?: string): void => {
    ensureColor(cwd);
    editor.addTile(boardFor(cwd, keepOnCurrentBoard), { kind: 'claude', sessionId: crypto.randomUUID(), cwd }, afterTileId);
  };

  const openShell = (cwd: string, afterTileId: string): void =>
    editor.addTile(ensureActiveBoard(), { kind: 'shell', cwd }, afterTileId);

  const openProjectBoard = (project: Project): void => {
    const existing = boards.find((board) => board.projectCwd === project.cwd);
    if (existing) {
      selectBoard(existing.id);
      return;
    }
    ensureColor(project.cwd);
    const tiles = project.conversations
      .slice(0, PROJECT_BOARD_TILE_COUNT)
      .map((conversation) => ({ kind: 'claude' as const, sessionId: conversation.sessionId, cwd: conversation.cwd }));
    selectBoard(editor.createBoard({ name: nameOf(project.cwd), projectCwd: project.cwd, tiles }));
  };

  const createBoard = (): void => selectBoard(editor.createBoard({ name: `${DEFAULT_BOARD_NAME} ${boards.length + 1}` }));

  const addNotes = (): void => {
    const focusedTile = activeBoard?.tiles.find((tile) => tile.id === focusedTileId);
    const cwd = (focusedTile && tileCwd(focusedTile)) ?? activeBoard?.projectCwd;
    editor.addTile(ensureActiveBoard(), { kind: 'notes', text: '', cwd });
  };

  const startSessionNearFocus = async (): Promise<void> => {
    const focusedTile = activeBoard?.tiles.find((tile) => tile.id === focusedTileId);
    const cwd = (focusedTile && tileCwd(focusedTile)) ?? activeBoard?.projectCwd ?? activeBoard?.tiles.map(tileCwd).find(Boolean);
    if (cwd) {
      startSession(cwd, true, focusedTile?.id);
      return;
    }
    const picked = await armadaClient.projects.pickFolder();
    if (picked) startSession(picked, true);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!isGlobalShortcut(event)) return;
      event.preventDefault();
      if (event.key === GLOBAL_SHORTCUTS.newSession) void startSessionNearFocus();
      else if (event.key === GLOBAL_SHORTCUTS.fontSmaller) edit((current) => adjustTerminalFontSize(current, -1));
      else if (event.key === GLOBAL_SHORTCUTS.fontReset) edit(resetTerminalFontSize);
      else edit((current) => adjustTerminalFontSize(current, 1));
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="flex h-full">
      <ConversationSidebarPanel onOpenConversation={openConversation} onOpenProjectBoard={openProjectBoard} onStartSession={startSession} />
      <main className="flex min-w-0 flex-1 flex-col">
        <BoardSwitcherBar
          boards={boards}
          activeBoardId={resolvedActiveBoardId}
          onSelect={selectBoard}
          onCreate={createBoard}
          onRename={editor.renameBoard}
          onRemove={editor.removeBoard}
        >
          {activeBoard && (
            <>
              <button type="button" className="readout ml-auto px-2 py-0.5 text-muted hover:text-accent" onClick={addNotes}>
                + notes
              </button>
              <BoardLayoutModeControls
                layoutMode={activeBoard.layoutMode}
                onChange={(layoutMode) => editor.setLayoutMode(activeBoard.id, layoutMode)}
                onReflow={() => editor.reflowFreeLayout(activeBoard.id, boardAreaRef.current?.clientHeight ?? 0)}
              />
            </>
          )}
        </BoardSwitcherBar>
        <div ref={boardAreaRef} className="surface-field relative min-h-0 flex-1">
          {isPending && <p className="p-6 text-muted">Loading workspace…</p>}
          {isError && <p className="p-6 text-red-400">{getErrorMessage(error)}</p>}
          {boards.map((board) => (
            <BoardPanel
              key={board.id}
              board={board}
              isActive={board.id === resolvedActiveBoardId}
              shouldMountTerminals={openedBoardIds.includes(board.id)}
              onOpenShell={openShell}
            />
          ))}
        </div>
      </main>
      <NotificationBar />
    </div>
  );
}
