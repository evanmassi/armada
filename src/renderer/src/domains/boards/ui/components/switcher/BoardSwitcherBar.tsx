import { useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Board } from '@shared/workspace/workspaceSchemas';
import { useProjectAccents } from '@renderer/domains/conversations';
import { soleProjectCwd } from '../../../model/lanes';
import { BoardProjectChangesIndicator } from '../changes/BoardProjectChangesIndicator';

interface BoardSwitcherBarProps {
  boards: Board[];
  activeBoardId: string | undefined;
  onSelect(boardId: string): void;
  onCreate(): void;
  onRename(boardId: string, name: string): void;
  onRemove(boardId: string): void;
  children?: ReactNode;
}

export function BoardSwitcherBar({ boards, activeBoardId, onSelect, onCreate, onRename, onRemove, children }: BoardSwitcherBarProps) {
  const [editingBoardId, setEditingBoardId] = useState<string>();
  const [draftName, setDraftName] = useState('');
  const accentFor = useProjectAccents();

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
    <nav className="flex items-center gap-1 border-b border-edge bg-panel/80 px-2 py-1 backdrop-blur" aria-label="Boards">
      {boards.map((board) => {
        const isActive = board.id === activeBoardId;
        const projectCwd = soleProjectCwd(board);
        return (
          <div
            key={board.id}
            className={`readout flex items-center gap-1 border-b-2 border-l-2 px-2 py-1 ${isActive ? 'text-accent' : 'border-b-transparent text-muted hover:text-fg'}`}
            style={{ borderLeftColor: accentFor(board.projectCwd), borderBottomColor: isActive ? 'var(--color-accent)' : undefined }}
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
            {projectCwd !== undefined && <BoardProjectChangesIndicator cwd={projectCwd} />}
            {isActive && (
              <button type="button" className="px-1 text-muted hover:text-fg" onClick={() => confirmRemove(board)} aria-label="Remove board">
                ×
              </button>
            )}
          </div>
        );
      })}
      <button type="button" className="readout px-2 py-1 text-muted hover:text-accent" onClick={onCreate} aria-label="New board">
        + board
      </button>
      {children}
    </nav>
  );
}
