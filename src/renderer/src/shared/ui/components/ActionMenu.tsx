import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { useOutsidePress } from '../hooks/useOutsidePress';
import { ActionMenuList, focusFirstMenuItem, type ActionMenuEntry } from './ActionMenuList';

interface ActionMenuProps {
  label: string;
  entries: ActionMenuEntry[];
}

export function ActionMenu({ label, entries }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isOpenedByKeyboard = useRef(false);
  const close = useCallback(() => setIsOpen(false), []);
  useOutsidePress(rootRef, close);

  useEffect(() => {
    if (isOpen && isOpenedByKeyboard.current) focusFirstMenuItem(listRef.current);
  }, [isOpen]);

  const toggle = (event: MouseEvent<HTMLButtonElement>): void => {
    isOpenedByKeyboard.current = event.detail === 0;
    setIsOpen((value) => !value);
  };

  const dismiss = (): void => {
    close();
    buttonRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative flex items-center">
      <button
        ref={buttonRef}
        type="button"
        className="hud-glyph px-1 text-muted"
        data-glyph="⋮"
        onClick={toggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        ⋮
      </button>
      {isOpen && (
        <ActionMenuList entries={entries} className="absolute top-5 right-0 z-20" listRef={listRef} onChosen={close} onDismiss={dismiss} />
      )}
    </div>
  );
}
