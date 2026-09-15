import type { PointerEvent } from 'react';

interface DragSplitterProps {
  orientation: 'vertical' | 'horizontal';
  onDragStart(): void;
  onDragMove(deltaPx: number): void;
  onDragEnd(): void;
}

export function DragSplitter({ orientation, onDragStart, onDragMove, onDragEnd }: DragSplitterProps) {
  const isVertical = orientation === 'vertical';

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

  return (
    <div
      role="separator"
      aria-orientation={isVertical ? 'vertical' : 'horizontal'}
      className={`shrink-0 rounded bg-edge transition-colors hover:bg-muted ${isVertical ? 'w-1.5 cursor-col-resize' : 'h-1.5 cursor-row-resize'}`}
      onPointerDown={handlePointerDown}
    />
  );
}
