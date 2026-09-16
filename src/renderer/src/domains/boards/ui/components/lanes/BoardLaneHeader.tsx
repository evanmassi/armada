import type { CSSProperties, DragEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSessionActivityStore } from '@renderer/app/stores/sessionActivityStore';
import { ActivityDot } from '@renderer/shared/ui/components/ActivityDot';
import { applyDragGhost } from '@renderer/shared/utils/dragGhost';
import type { Lane } from '../../../model/lanes';

export const LANE_DRAG_MIME = 'application/x-armada-lane';

interface BoardLaneHeaderProps {
  lane: Lane;
  name: string;
  accentColor: string;
  isDropTarget: boolean;
  onToggleCollapsed(): void;
  onAddNotes(): void;
  onDragOver(event: DragEvent<HTMLElement>): void;
  onDrop(event: DragEvent<HTMLElement>): void;
  onDragLeave(): void;
}

export function BoardLaneHeader({ lane, name, accentColor, isDropTarget, onToggleCollapsed, onAddNotes, onDragOver, onDrop, onDragLeave }: BoardLaneHeaderProps) {
  const activities = useSessionActivityStore(useShallow((state) => lane.tiles.map((tile) => state.byTileId[tile.id]?.state)));

  const handleDragStart = (event: DragEvent<HTMLElement>): void => {
    event.dataTransfer.setData(LANE_DRAG_MIME, lane.key);
    event.dataTransfer.effectAllowed = 'move';
    applyDragGhost(event, name, accentColor);
  };

  return (
    <header
      className={`readout lane-titlebar flex shrink-0 cursor-grab items-center gap-2 border-b px-2 py-1 text-[11px] active:cursor-grabbing ${
        lane.isCollapsed ? 'h-full flex-col justify-start border-b-0 px-1 py-2' : ''
      } ${isDropTarget ? 'ring-1 ring-accent/70' : ''}`}
      style={{ '--tile-accent': accentColor, borderColor: `color-mix(in srgb, ${accentColor} 45%, transparent)`, color: accentColor } as CSSProperties}
      draggable
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <button
        type="button"
        className="hover:text-white"
        onClick={onToggleCollapsed}
        aria-expanded={!lane.isCollapsed}
        aria-label={lane.isCollapsed ? `Expand ${name}` : `Collapse ${name}`}
      >
        {lane.isCollapsed ? '▸' : '◂'}
      </button>
      <span className={`truncate text-[12px] ${lane.isCollapsed ? '[writing-mode:vertical-rl]' : 'tile-project-plate'}`}>{name}</span>
      {!lane.isCollapsed && <span className="flex-1" />}
      <span className={`flex gap-1 ${lane.isCollapsed ? 'flex-col' : ''}`}>
        {activities.map((activity, index) => (activity ? <ActivityDot key={index} state={activity} /> : null))}
      </span>
      {!lane.isCollapsed && <span className="text-edge-strong">{lane.tiles.length}</span>}
      {!lane.isCollapsed && (
        <button type="button" className="px-1 hover:text-white" onClick={onAddNotes} title="Add notes to this lane" aria-label={`Add notes to ${name}`}>
          +
        </button>
      )}
    </header>
  );
}
