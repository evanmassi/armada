import { useEffect, useRef, useState } from 'react';
import type { NotesTile } from '@shared/workspace/workspaceSchemas';
import { useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { useBoardsEditor } from '../../../hooks/useBoardsEditor';

const SAVE_DEBOUNCE_MS = 400;

interface BoardNotesTileProps {
  boardId: string;
  tile: NotesTile;
}

export function BoardNotesTile({ boardId, tile }: BoardNotesTileProps) {
  const editor = useBoardsEditor();
  const setFocusedTile = useBoardSelectionStore((state) => state.setFocusedTile);
  const [draft, setDraft] = useState(tile.text);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  const handleChange = (text: string): void => {
    setDraft(text);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => editor.setNotesText(boardId, tile.id, text), SAVE_DEBOUNCE_MS);
  };

  return (
    <textarea
      className="h-full w-full resize-none bg-ink p-3 text-fg placeholder:text-muted focus:outline-none"
      placeholder="What am I doing here, and what's next?"
      value={draft}
      spellCheck={false}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={() => setFocusedTile(tile.id)}
      aria-label="Board notes"
    />
  );
}
