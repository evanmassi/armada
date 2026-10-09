import { useEffect, useRef, useState } from 'react';
import type { NotesTile } from '@shared/workspace/workspaceSchemas';
import { selectBodyFocusRequest, useBoardSelectionStore } from '@renderer/app/stores/boardSelectionStore';
import { useProjectNames } from '@renderer/domains/conversations';
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
  const flushRef = useRef<() => void>(() => undefined);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const bodyFocusRequest = useBoardSelectionStore(selectBodyFocusRequest(tile.id));
  const nameOf = useProjectNames();
  const scopeLabel = tile.cwd ? `Notes for ${nameOf(tile.cwd)}` : 'Notes for this board';

  useEffect(() => () => flushRef.current(), []);

  useEffect(() => {
    if (bodyFocusRequest !== undefined) textAreaRef.current?.focus();
  }, [bodyFocusRequest]);

  const handleChange = (text: string): void => {
    setDraft(text);
    window.clearTimeout(saveTimer.current);
    const save = (): void => {
      window.clearTimeout(saveTimer.current);
      flushRef.current = () => undefined;
      editor.setNotesText(boardId, tile.id, text);
    };
    flushRef.current = save;
    saveTimer.current = window.setTimeout(save, SAVE_DEBOUNCE_MS);
  };

  return (
    <textarea
      ref={textAreaRef}
      className="h-full w-full resize-none bg-tile p-3 font-ui text-[14px] text-fg placeholder:text-muted focus:outline-none"
      placeholder={`${scopeLabel}…`}
      value={draft}
      spellCheck={false}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={() => setFocusedTile(tile.id)}
      aria-label={scopeLabel}
    />
  );
}
