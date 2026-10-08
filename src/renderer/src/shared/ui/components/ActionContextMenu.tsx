import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { ActionMenuList, type ActionMenuEntry } from './ActionMenuList';

export interface MenuPoint {
  x: number;
  y: number;
}

export interface ContextMenuOpening {
  point: MenuPoint;
  isOpenedByKeyboard: boolean;
}

interface ActionContextMenuProps extends ContextMenuOpening {
  entries: ActionMenuEntry[];
  onClose(): void;
}

const WINDOW_MARGIN_PX = 4;

export function contextMenuOpeningOf(event: ReactMouseEvent<HTMLElement>): ContextMenuOpening {
  event.preventDefault();
  const isOpenedByKeyboard = event.clientX === 0 && event.clientY === 0;
  const bounds = event.currentTarget.getBoundingClientRect();
  return { point: isOpenedByKeyboard ? { x: bounds.left, y: bounds.bottom } : { x: event.clientX, y: event.clientY }, isOpenedByKeyboard };
}

export function ActionContextMenu({ point, isOpenedByKeyboard, entries, onClose }: ActionContextMenuProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(point);
  const [opener] = useState(() => document.activeElement);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    setPosition({
      x: Math.max(WINDOW_MARGIN_PX, Math.min(point.x, window.innerWidth - list.offsetWidth - WINDOW_MARGIN_PX)),
      y: Math.max(WINDOW_MARGIN_PX, Math.min(point.y, window.innerHeight - list.offsetHeight - WINDOW_MARGIN_PX)),
    });
    (isOpenedByKeyboard ? list.querySelector<HTMLElement>('[role="menuitem"]') : list)?.focus();
  }, [point, isOpenedByKeyboard]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent): void => {
      if (!listRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    window.addEventListener('blur', onClose);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      window.removeEventListener('blur', onClose);
    };
  }, [onClose]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      if (opener instanceof HTMLElement) opener.focus();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const current = items.indexOf(document.activeElement as HTMLElement);
    items[(current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  };

  return createPortal(
    <div onKeyDown={handleKeyDown}>
      <ActionMenuList entries={entries} className="fixed z-50" style={{ left: position.x, top: position.y }} listRef={listRef} onChosen={onClose} />
    </div>,
    document.body,
  );
}
