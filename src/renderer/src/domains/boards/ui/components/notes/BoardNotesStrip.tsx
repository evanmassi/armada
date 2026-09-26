import type { Board, NotesTile } from '@shared/workspace/workspaceSchemas';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';
import { NOTES_STRIP_KEY } from '../../../model/lanes';
import { BoardTileFrame } from '../grid/BoardTileFrame';

const KEYBOARD_HINT = 'Up and down reorder notes.';

interface BoardNotesStripProps {
  board: Board;
  notes: NotesTile[];
}

export function BoardNotesStrip({ board, notes }: BoardNotesStripProps) {
  const editor = useBoardsEditor();
  const isCollapsed = board.lanes[NOTES_STRIP_KEY]?.isCollapsed ?? false;

  return (
    <aside className={`flex shrink-0 flex-col border-l border-edge ${isCollapsed ? 'w-8' : 'w-72'}`}>
      <header className={`readout flex items-center gap-2 border-b border-edge px-2 py-1 text-[11px] text-muted ${isCollapsed ? 'h-full flex-col border-b-0 px-1 py-2' : ''}`}>
        <button type="button" className="hud-glyph" data-glyph={isCollapsed ? '◂' : '▸'} onClick={() => editor.toggleLaneCollapsed(board.id, NOTES_STRIP_KEY)} aria-expanded={!isCollapsed} aria-label={isCollapsed ? 'Expand notes' : 'Collapse notes'}>
          {isCollapsed ? '◂' : '▸'}
        </button>
        <span className={isCollapsed ? '[writing-mode:vertical-rl]' : 'flex-1'}>notes</span>
        {!isCollapsed && <span className="text-edge-strong">{notes.length}</span>}
      </header>
      <div className={`flex min-h-0 flex-1 flex-col gap-1 p-1 ${isCollapsed ? 'hidden' : ''}`}>
        {notes.map((note, index) => (
          <div key={note.id} className="min-h-0 flex-1">
            <BoardTileFrame
              boardId={board.id}
              tile={note}
              shouldMountTerminal={false}
              keyboardHint={KEYBOARD_HINT}
              onArrow={(direction) => {
                const neighbor = notes[index + (direction === 'up' ? -1 : direction === 'down' ? 1 : 0)];
                if (neighbor && neighbor.id !== note.id) editor.swapTiles(board.id, note.id, neighbor.id);
              }}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
