import { useState, type ReactNode } from 'react';
import type { Board } from '@shared/workspace/workspaceSchemas';
import { useProjectAccents } from '@renderer/domains/conversations';
import { InlineRenameInput } from '@renderer/shared/ui/components/InlineRenameInput';
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
  const accentFor = useProjectAccents();

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
              <InlineRenameInput
                initialValue={board.name}
                label="Board name"
                onCommit={(name) => {
                  onRename(board.id, name);
                  setEditingBoardId(undefined);
                }}
                onCancel={() => setEditingBoardId(undefined)}
              />
            ) : (
              <button
                type="button"
                onClick={() => onSelect(board.id)}
                onDoubleClick={() => setEditingBoardId(board.id)}
                onKeyDown={(event) => event.key === 'F2' && setEditingBoardId(board.id)}
                aria-current={isActive ? 'page' : undefined}
                title="Double-click or F2 to rename"
              >
                {board.name}
              </button>
            )}
            {projectCwd !== undefined && <BoardProjectChangesIndicator cwd={projectCwd} />}
            {isActive && (
              <button type="button" className="hud-glyph px-1 text-muted" data-glyph="×" data-tone="danger" onClick={() => confirmRemove(board)} aria-label="Remove board">
                ×
              </button>
            )}
          </div>
        );
      })}
      <button type="button" className="readout hud-button ml-1 text-muted" onClick={onCreate} aria-label="New board">
        + board
      </button>
      {children}
    </nav>
  );
}
