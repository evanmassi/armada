import type { KeyboardEvent, PointerEvent } from 'react';

const KEYBOARD_STEP_PX = 24;

interface DragSplitterProps {
  orientation: 'vertical' | 'horizontal';
  onDragStart(): void;
  onDragMove(deltaPx: number): void;
  onDragEnd(): void;
}

export function DragSplitter({ orientation, onDragStart, onDragMove, onDragEnd }: DragSplitterProps) {
  const isVertical = orientation === 'vertical';
  const [backKey, forwardKey] = isVertical ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const origin = isVertical ? event.clientX : event.clientY;
    onDragStart();

    const handleMove = (moveEvent: globalThis.PointerEvent): void =>
      onDragMove((isVertical ? moveEvent.clientX : moveEvent.clientY) - origin);
    const handleUp = (): void => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      onDragEnd();
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const direction = event.key === forwardKey ? 1 : event.key === backKey ? -1 : 0;
    if (direction === 0) return;
    event.preventDefault();
    onDragStart();
    onDragMove(direction * KEYBOARD_STEP_PX);
    onDragEnd();
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={isVertical ? 'vertical' : 'horizontal'}
      aria-label={isVertical ? 'Resize, left and right arrow keys' : 'Resize, up and down arrow keys'}
      className={`shrink-0 rounded bg-edge transition-colors hover:bg-muted focus-visible:bg-muted ${isVertical ? 'w-1.5 cursor-col-resize' : 'h-1.5 cursor-row-resize'}`}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
    />
  );
}
