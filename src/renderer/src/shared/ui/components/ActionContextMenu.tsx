import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useOutsidePress } from '../hooks/useOutsidePress';
import { ActionMenuList, focusFirstMenuItem, type ActionMenuEntry } from './ActionMenuList';

interface MenuPoint {
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
    if (isOpenedByKeyboard) focusFirstMenuItem(list);
    else list.focus();
  }, [point, isOpenedByKeyboard]);

  useOutsidePress(listRef, onClose);

  useEffect(() => {
    window.addEventListener('blur', onClose);
    return () => window.removeEventListener('blur', onClose);
  }, [onClose]);

  const dismiss = (): void => {
    onClose();
    if (opener instanceof HTMLElement) opener.focus();
  };

  return createPortal(
    <ActionMenuList
      entries={entries}
      className="fixed z-50"
      style={{ left: position.x, top: position.y }}
      listRef={listRef}
      onChosen={onClose}
      onDismiss={dismiss}
    />,
    document.body,
  );
}
