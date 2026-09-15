import { useEffect, useRef, useState } from 'react';

export interface ActionMenuItem {
  label: string;
  onSelect(): void;
}

interface ActionMenuProps {
  label: string;
  items: ActionMenuItem[];
}

export function ActionMenu({ label, items }: ActionMenuProps) {
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
        className="rounded px-1 text-muted hover:bg-edge hover:text-fg"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        …
      </button>
      {isOpen && (
        <div role="menu" className="absolute top-5 right-0 z-20 flex min-w-28 flex-col rounded border border-edge bg-panel py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="px-3 py-1 text-left text-fg hover:bg-edge"
              onClick={() => {
                setIsOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
