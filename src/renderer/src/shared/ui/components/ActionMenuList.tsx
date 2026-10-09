import type { CSSProperties, KeyboardEvent, Ref } from 'react';

export interface ActionMenuItem {
  label: string;
  emphasis?: string;
  onSelect(): void;
}

interface ActionMenuSubmenu {
  label: string;
  items: ActionMenuItem[];
}

export type ActionMenuEntry = ActionMenuItem | ActionMenuSubmenu | 'divider';

interface ActionMenuListProps {
  entries: ActionMenuEntry[];
  className: string;
  style?: CSSProperties;
  listRef?: Ref<HTMLDivElement>;
  onChosen(): void;
  onDismiss(): void;
}

const MENU_ITEM_CLASS = 'hud-row flex w-full items-center gap-1 px-3 py-1 text-left whitespace-nowrap focus:outline-none';
const MENU_SURFACE_CLASS = 'flex min-w-28 flex-col border border-edge-strong bg-panel/95 py-1 shadow-lg backdrop-blur';

const MENU_ITEM_SELECTOR = '[role="menuitem"]';

const isSubmenu = (entry: ActionMenuEntry): entry is ActionMenuSubmenu => typeof entry !== 'string' && 'items' in entry;

export const focusFirstMenuItem = (list: HTMLElement | null): void => list?.querySelector<HTMLElement>(MENU_ITEM_SELECTOR)?.focus();

export function ActionMenuList({ entries, className, style, listRef, onChosen, onDismiss }: ActionMenuListProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      onDismiss();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)];
    const current = items.indexOf(document.activeElement as HTMLElement);
    items[(current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  };

  const renderItem = (item: ActionMenuItem, index: number) => (
    <button
      key={`${index} ${item.label} ${item.emphasis ?? ''}`}
      type="button"
      role="menuitem"
      className={MENU_ITEM_CLASS}
      onClick={() => {
        onChosen();
        item.onSelect();
      }}
    >
      <span className="hud-row-label">{item.label}</span>
      {item.emphasis && <strong className="hud-row-label font-semibold">{item.emphasis}</strong>}
    </button>
  );

  const renderEntry = (entry: ActionMenuEntry, index: number) => {
    if (entry === 'divider') return <div key={index} role="separator" className="my-1 border-t border-edge" />;
    if (!isSubmenu(entry)) return renderItem(entry, index);
    return (
      <div key={entry.label} className="group relative">
        <button type="button" role="menuitem" aria-haspopup="menu" className={MENU_ITEM_CLASS}>
          <span className="hud-row-label flex-1">{entry.label}</span>
          <span className="text-muted">◂</span>
        </button>
        <div role="menu" className={`absolute top-0 right-full z-20 mr-px hidden group-hover:flex group-focus-within:flex ${MENU_SURFACE_CLASS}`}>
          {entry.items.map(renderItem)}
        </div>
      </div>
    );
  };

  return (
    <div ref={listRef} role="menu" tabIndex={-1} className={`${className} ${MENU_SURFACE_CLASS}`} style={style} onKeyDown={handleKeyDown}>
      {entries.map(renderEntry)}
    </div>
  );
}
