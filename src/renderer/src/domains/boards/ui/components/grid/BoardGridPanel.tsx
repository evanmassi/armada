import { GridLayout, useContainerWidth, type Layout } from 'react-grid-layout';
import type { Board, TileLayout } from '@shared/workspace/workspaceSchemas';
import { useConversationTitles, useProjectAccents } from '@renderer/domains/conversations';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { GRID_COLUMNS, GRID_MARGIN_PX, GRID_ROW_HEIGHT_PX, hasLayoutChanged } from '../../../model/boardEdits';
import { BoardTileFrame, TILE_DRAG_HANDLE_CLASS, type ArrowDirection } from './BoardTileFrame';

const NEW_SESSION_TITLE = 'New session';
const KEYBOARD_HINT = 'Arrow keys move, shift and arrow keys resize.';

const MOVE_DELTAS: Record<ArrowDirection, Partial<TileLayout>> = {
  left: { x: -1 },
  right: { x: 1 },
  up: { y: -1 },
  down: { y: 1 },
};

const RESIZE_DELTAS: Record<ArrowDirection, Partial<TileLayout>> = {
  left: { w: -1 },
  right: { w: 1 },
  up: { h: -1 },
  down: { h: 1 },
};

interface BoardGridPanelProps {
  board: Board;
  shouldMountTerminals: boolean;
}

export function BoardGridPanel({ board, shouldMountTerminals }: BoardGridPanelProps) {
  const { width, containerRef, mounted } = useContainerWidth();
  const titles = useConversationTitles();
  const accentFor = useProjectAccents();
  const editor = useBoardsEditor();

  const layout: Layout = board.tiles.map((tile) => ({ i: tile.id, ...tile.layout }));

  const handleLayoutChange = (nextLayout: Layout): void => {
    const positioned = nextLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
    if (hasLayoutChanged(board, positioned)) editor.applyLayouts(board.id, positioned);
  };

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      {mounted && (
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={{ cols: GRID_COLUMNS, rowHeight: GRID_ROW_HEIGHT_PX, margin: [GRID_MARGIN_PX, GRID_MARGIN_PX] }}
          dragConfig={{ enabled: true, handle: `.${TILE_DRAG_HANDLE_CLASS}` }}
          resizeConfig={{ enabled: true }}
          onLayoutChange={handleLayoutChange}
        >
          {board.tiles.map((tile) => (
            <div key={tile.id}>
              <BoardTileFrame
                tile={tile}
                title={titles.get(tile.sessionId) ?? NEW_SESSION_TITLE}
                accentColor={accentFor(tile.cwd)}
                shouldMountTerminal={shouldMountTerminals}
                keyboardHint={KEYBOARD_HINT}
                onClose={() => editor.removeTile(board.id, tile.id)}
                onArrow={(direction, isShift) =>
                  editor.nudgeTile(board.id, tile.id, (isShift ? RESIZE_DELTAS : MOVE_DELTAS)[direction])
                }
              />
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}
