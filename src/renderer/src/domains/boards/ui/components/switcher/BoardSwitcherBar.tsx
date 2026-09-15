import { useState, type KeyboardEvent } from 'react';
import type { Board } from '@shared/boards/boardSchemas';

interface BoardSwitcherBarProps {
  boards: Board[];
  activeBoardId: string | undefined;
  onSelect(boardId: string): void;
  onCreate(): void;
  onRename(boardId: string, name: string): void;
  onRemove(boardId: string): void;
}

export function BoardSwitcherBar({ boards, activeBoardId, onSelect, onCreate, onRename, onRemove }: BoardSwitcherBarProps) {
  const [editingBoardId, setEditingBoardId] = useState<string>();
  const [draftName, setDraftName] = useState('');

  const beginRename = (board: Board): void => {
    setEditingBoardId(board.id);
    setDraftName(board.name);
  };

  const commitRename = (): void => {
    if (editingBoardId && draftName.trim()) onRename(editingBoardId, draftName.trim());
    setEditingBoardId(undefined);
  };

  const handleRenameKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') commitRename();
    if (event.key === 'Escape') setEditingBoardId(undefined);
  };

  const confirmRemove = (board: Board): void => {
    if (board.tiles.length === 0 || window.confirm(`Remove board "${board.name}" and its ${board.tiles.length} tiles?`)) {
      onRemove(board.id);
    }
  };

  return (
    <nav className="flex items-center gap-1 border-b border-edge bg-panel px-2 py-1" aria-label="Boards">
      {boards.map((board) => {
        const isActive = board.id === activeBoardId;
        return (
          <div
            key={board.id}
            className={`flex items-center gap-1 rounded px-2 py-0.5 ${isActive ? 'bg-edge text-white' : 'text-muted hover:text-fg'}`}
          >
            {editingBoardId === board.id ? (
              <input
                className="w-32 bg-ink px-1 text-fg outline-none"
                value={draftName}
                autoFocus
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={commitRename}
                onKeyDown={handleRenameKeyDown}
                aria-label="Board name"
              />
            ) : (
              <button
                type="button"
                onClick={() => onSelect(board.id)}
                onDoubleClick={() => beginRename(board)}
                onKeyDown={(event) => event.key === 'F2' && beginRename(board)}
                aria-current={isActive ? 'page' : undefined}
                title="Double-click or F2 to rename"
              >
                {board.name}
              </button>
            )}
            {isActive && (
              <button type="button" className="px-1 text-muted hover:text-fg" onClick={() => confirmRemove(board)} aria-label="Remove board">
                ×
              </button>
            )}
          </div>
        );
      })}
      <button type="button" className="rounded px-2 py-0.5 text-muted hover:bg-edge hover:text-fg" onClick={onCreate} aria-label="New board">
        + board
      </button>
    </nav>
  );
}
