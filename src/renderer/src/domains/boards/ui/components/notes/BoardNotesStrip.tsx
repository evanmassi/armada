import type { Board, NotesTile } from '@shared/workspace/workspaceSchemas';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { laneStateOf, NOTES_STRIP_KEY } from '../../../model/lanes';
import { BoardTileFrame } from '../grid/BoardTileFrame';
import { BoardSideStrip } from '../strip/BoardSideStrip';

const KEYBOARD_HINT = 'Up and down reorder notes.';
const EXPANDED_STYLE = { width: '18rem', flexShrink: 0 };

interface BoardNotesStripProps {
  board: Board;
  notes: NotesTile[];
}

export function BoardNotesStrip({ board, notes }: BoardNotesStripProps) {
  const editor = useBoardsEditor();

  return (
    <BoardSideStrip
      label="notes"
      count={notes.length}
      isCollapsed={laneStateOf(board, NOTES_STRIP_KEY).isCollapsed}
      expandedStyle={EXPANDED_STYLE}
      onToggle={() => editor.toggleLaneCollapsed(board.id, NOTES_STRIP_KEY)}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-1 p-1">
        {notes.map((note, index) => (
          <div key={note.id} className="min-h-0 flex-1">
            <BoardTileFrame
              boardId={board.id}
              tile={note}
              shouldMountTerminal={false}
              isCollapsible={false}
              keyboardHint={KEYBOARD_HINT}
              onArrow={(direction) => {
                const neighbor = notes[index + (direction === 'up' ? -1 : direction === 'down' ? 1 : 0)];
                if (neighbor && neighbor.id !== note.id) editor.swapTiles(board.id, note.id, neighbor.id);
              }}
            />
          </div>
        ))}
      </div>
    </BoardSideStrip>
  );
}
