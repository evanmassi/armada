import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Board } from '@shared/workspace/workspaceSchemas';
import { useProjectColors } from '@renderer/domains/conversations';
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
  const { colorOf } = useProjectColors();

  const confirmRemove = (board: Board): void => {
    if (board.tiles.length === 0 || window.confirm(`Remove board "${board.name}" and its ${board.tiles.length} tiles?`)) {
      onRemove(board.id);
    }
  };

  return (
    <nav className="flex items-center gap-2 border-b border-edge bg-panel/80 px-3 py-1.5 backdrop-blur" aria-label="Boards">
      {boards.map((board, index) => {
        const isActive = board.id === activeBoardId;
        const projectCwd = soleProjectCwd(board);
        const projectColor = board.projectCwd ? colorOf(board.projectCwd) : undefined;
        return (
          <div
            key={board.id}
            className="readout hud-button hud-tab group flex items-center text-muted"
            style={projectColor ? ({ '--hud-line': projectColor } as CSSProperties) : undefined}
          >
            {editingBoardId === board.id ? (
              <span className="py-[5px] pl-[11px] pr-1">
                <InlineRenameInput
                  initialValue={board.name}
                  label="Board name"
                  onCommit={(name) => {
                    onRename(board.id, name);
                    setEditingBoardId(undefined);
                  }}
                  onCancel={() => setEditingBoardId(undefined)}
                />
              </span>
            ) : (
              <button
                type="button"
                className="flex items-center gap-2 py-[5px] pl-[11px] pr-1"
                onClick={() => onSelect(board.id)}
                onDoubleClick={() => setEditingBoardId(board.id)}
                onKeyDown={(event) => event.key === 'F2' && setEditingBoardId(board.id)}
                aria-current={isActive ? 'page' : undefined}
                title="Double-click or F2 to rename"
              >
                <span className="text-edge-strong">{String(index + 1).padStart(2, '0')}</span>
                <span>{board.name}</span>
                {projectCwd !== undefined && <BoardProjectChangesIndicator cwd={projectCwd} />}
              </button>
            )}
            <button
              type="button"
              className={`hud-glyph mr-1 text-muted ${isActive ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
              data-glyph="×"
              data-tone="neutral"
              onClick={() => confirmRemove(board)}
              aria-label={`Remove board ${board.name}`}
            >
              ×
            </button>
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
