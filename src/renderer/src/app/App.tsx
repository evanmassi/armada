import { useEffect, useRef } from 'react';
import type { Conversation } from '@shared/conversations/conversationTypes';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { BoardLayoutModeControls, BoardPanel, BoardSwitcherBar, useBoardsEditor } from '@renderer/domains/boards';
import { ConversationSidebarPanel } from '@renderer/domains/conversations';
import { useWorkspaceQuery } from '@renderer/domains/workspace';
import { NotificationBar } from '@renderer/shared/ui/components/NotificationBar';
import { getErrorMessage } from '@renderer/shared/utils/getErrorMessage';

const DEFAULT_BOARD_NAME = 'Board';

export function App() {
  const { data: workspace, isPending, isError, error } = useWorkspaceQuery();
  const editor = useBoardsEditor();
  const { activeBoardId, openedBoardIds, selectBoard } = useBoardSelectionStore();
  const boardAreaRef = useRef<HTMLDivElement>(null);

  const boards = workspace?.boards ?? [];
  const activeBoard = boards.find((board) => board.id === activeBoardId) ?? boards[0];
  const resolvedActiveBoardId = activeBoard?.id;

  useEffect(() => {
    if (resolvedActiveBoardId && resolvedActiveBoardId !== activeBoardId) selectBoard(resolvedActiveBoardId);
  }, [resolvedActiveBoardId, activeBoardId, selectBoard]);

  const ensureActiveBoard = (): string => resolvedActiveBoardId ?? editor.createBoard(DEFAULT_BOARD_NAME);

  const openConversation = (conversation: Conversation): void =>
    editor.addTile(ensureActiveBoard(), { sessionId: conversation.sessionId, cwd: conversation.cwd });

  const startSession = (cwd: string): void => editor.addTile(ensureActiveBoard(), { sessionId: crypto.randomUUID(), cwd });

  const createBoard = (): void => selectBoard(editor.createBoard(`${DEFAULT_BOARD_NAME} ${boards.length + 1}`));

  return (
    <div className="flex h-full">
      <ConversationSidebarPanel onOpenConversation={openConversation} onStartSession={startSession} />
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
            <BoardLayoutModeControls
              layoutMode={activeBoard.layoutMode}
              onChange={(layoutMode) => editor.setLayoutMode(activeBoard.id, layoutMode)}
              onReflow={() => editor.reflowFreeLayout(activeBoard.id, boardAreaRef.current?.clientHeight ?? 0)}
            />
          )}
        </BoardSwitcherBar>
        <div ref={boardAreaRef} className="relative min-h-0 flex-1">
          {isPending && <p className="p-6 text-muted">Loading workspace…</p>}
          {isError && <p className="p-6 text-red-400">{getErrorMessage(error)}</p>}
          {boards.map((board) => (
            <BoardPanel
              key={board.id}
              board={board}
              isActive={board.id === resolvedActiveBoardId}
              shouldMountTerminals={openedBoardIds.includes(board.id)}
            />
          ))}
        </div>
      </main>
      <NotificationBar />
    </div>
  );
}
