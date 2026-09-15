import { GridLayout, useContainerWidth, type Layout } from 'react-grid-layout';
import type { Board } from '@shared/boards/boardSchemas';
import { useConversationTitles } from '@renderer/domains/conversations';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { GRID_COLUMNS, hasLayoutChanged } from '../../../model/boardDocumentEdits';
import { BoardTileFrame, TILE_DRAG_HANDLE_CLASS } from './BoardTileFrame';

const ROW_HEIGHT_PX = 24;
const GRID_MARGIN_PX = 8;
const NEW_SESSION_TITLE = 'New session';

interface BoardGridPanelProps {
  board: Board;
  isActive: boolean;
  shouldMountTerminals: boolean;
}

export function BoardGridPanel({ board, isActive, shouldMountTerminals }: BoardGridPanelProps) {
  const { width, containerRef, mounted } = useContainerWidth();
  const titles = useConversationTitles();
  const editor = useBoardsEditor();

  const layout: Layout = board.tiles.map((tile) => ({ i: tile.id, ...tile.layout }));

  const handleLayoutChange = (nextLayout: Layout): void => {
    const positioned = nextLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
    if (hasLayoutChanged(board, positioned)) editor.applyLayouts(board.id, positioned);
  };

  return (
    <div ref={containerRef} className={`h-full overflow-y-auto ${isActive ? '' : 'hidden'}`}>
      {board.tiles.length === 0 && (
        <p className="p-6 text-muted">Pick a conversation on the left, or press + on a project to start a new one.</p>
      )}
      {mounted && (
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={{ cols: GRID_COLUMNS, rowHeight: ROW_HEIGHT_PX, margin: [GRID_MARGIN_PX, GRID_MARGIN_PX] }}
          dragConfig={{ enabled: true, handle: `.${TILE_DRAG_HANDLE_CLASS}` }}
          resizeConfig={{ enabled: true }}
          onLayoutChange={handleLayoutChange}
        >
          {board.tiles.map((tile) => (
            <div key={tile.id}>
              <BoardTileFrame
                tile={tile}
                title={titles.get(tile.sessionId) ?? NEW_SESSION_TITLE}
                shouldMountTerminal={shouldMountTerminals}
                onClose={() => editor.removeTile(board.id, tile.id)}
                onColorChange={(color) => editor.setTileColor(board.id, tile.id, color)}
                onNudge={(delta) => editor.nudgeTile(board.id, tile.id, delta)}
              />
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}
