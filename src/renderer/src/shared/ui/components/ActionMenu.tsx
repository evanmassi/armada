import { useEffect, useRef, useState } from 'react';

export interface ActionMenuItem {
  label: string;
  emphasis?: string;
  onSelect(): void;
}

export interface ActionMenuSubmenu {
  label: string;
  items: ActionMenuItem[];
}

export type ActionMenuEntry = ActionMenuItem | ActionMenuSubmenu | 'divider';

interface ActionMenuProps {
  label: string;
  entries: ActionMenuEntry[];
}

const MENU_ITEM_CLASS = 'flex w-full items-center gap-1 px-3 py-1 text-left whitespace-nowrap text-fg hover:bg-accent/15 hover:text-accent focus:bg-accent/15 focus:outline-none';
const MENU_SURFACE_CLASS = 'z-20 flex min-w-28 flex-col border border-edge-strong bg-panel/95 py-1 shadow-lg backdrop-blur';

const isSubmenu = (entry: ActionMenuEntry): entry is ActionMenuSubmenu => typeof entry !== 'string' && 'items' in entry;

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

  const renderItem = (item: ActionMenuItem) => (
    <button
      key={`${item.label} ${item.emphasis ?? ''}`}
      type="button"
      role="menuitem"
      className={MENU_ITEM_CLASS}
      onClick={() => {
        setIsOpen(false);
        item.onSelect();
      }}
    >
      {item.label}
      {item.emphasis && <strong className="font-semibold">{item.emphasis}</strong>}
    </button>
  );

  const renderEntry = (entry: ActionMenuEntry, index: number) => {
    if (entry === 'divider') return <div key={index} role="separator" className="my-1 border-t border-edge" />;
    if (!isSubmenu(entry)) return renderItem(entry);
    return (
      <div key={entry.label} className="group relative">
        <button type="button" role="menuitem" aria-haspopup="menu" className={MENU_ITEM_CLASS}>
          <span className="flex-1">{entry.label}</span>
          <span className="text-muted">◂</span>
        </button>
        <div role="menu" className={`absolute top-0 right-full mr-px hidden group-hover:flex group-focus-within:flex ${MENU_SURFACE_CLASS}`}>
          {entry.items.map(renderItem)}
        </div>
      </div>
    );
  };

  return (
    <div ref={rootRef} className="relative flex items-center">
      <button
        type="button"
        className="rounded px-1 text-muted hover:bg-edge hover:text-fg"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        …
      </button>
      {isOpen && (
        <div role="menu" className={`absolute top-5 right-0 ${MENU_SURFACE_CLASS}`}>
          {entries.map(renderEntry)}
        </div>
      )}
    </div>
  );
}
