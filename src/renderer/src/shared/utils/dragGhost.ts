import type { DragEvent } from 'react';

export type DropPlacement = 'before' | 'after';

export function applyDragGhost(event: DragEvent<HTMLElement>, label: string, accentColor: string): void {
  const ghost = document.createElement('div');
  ghost.textContent = label;
  ghost.style.cssText = `position:fixed;top:-100px;left:-100px;padding:3px 10px 3px 22px;border-radius:999px;background:#15181d;color:#d6d8dc;border:1px solid ${accentColor};font:12px "Cascadia Code",Consolas,monospace;white-space:nowrap;`;
  const dot = document.createElement('span');
  dot.style.cssText = `position:absolute;left:8px;top:7px;width:8px;height:8px;border-radius:999px;background:${accentColor};`;
  ghost.appendChild(dot);
  document.body.appendChild(ghost);
  event.dataTransfer.setDragImage(ghost, 12, 12);
  window.setTimeout(() => ghost.remove());
}

export const placementFromPointer = (event: DragEvent<HTMLElement>): DropPlacement => {
  const bounds = event.currentTarget.getBoundingClientRect();
  return event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after';
};

export const PLACEMENT_LINE_CLASS: Record<DropPlacement, string> = {
  before: 'shadow-[inset_0_2px_0_0_white]',
  after: 'shadow-[inset_0_-2px_0_0_white]',
};
