import { useEffect, useRef, useState } from 'react';
import { ActionMenuList, type ActionMenuEntry } from './ActionMenuList';

interface ActionMenuProps {
  label: string;
  entries: ActionMenuEntry[];
}

export function ActionMenu({ label, entries }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative flex items-center">
      <button
        type="button"
        className="hud-glyph px-1 text-muted"
        data-glyph="⋮"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        ⋮
      </button>
      {isOpen && <ActionMenuList entries={entries} className="absolute top-5 right-0 z-20" onChosen={() => setIsOpen(false)} />}
    </div>
  );
}
