import { StrokeIconButton, type StrokeIcon } from './StrokeIconButton';

type CollapseDirection = 'up' | 'left' | 'right';

const ICONS: Record<CollapseDirection, { expanded: StrokeIcon; collapsed: StrokeIcon }> = {
  up: { expanded: 'chevronDown', collapsed: 'chevronRight' },
  left: { expanded: 'chevronLeft', collapsed: 'chevronRight' },
  right: { expanded: 'chevronRight', collapsed: 'chevronLeft' },
};

interface CollapseToggleButtonProps {
  isCollapsed: boolean;
  target: string;
  onToggle(): void;
  collapsesToward?: CollapseDirection;
  isClickOrigin?: boolean;
}

export function CollapseToggleButton({ isCollapsed, target, onToggle, collapsesToward = 'up', isClickOrigin }: CollapseToggleButtonProps) {
  const icons = ICONS[collapsesToward];
  return (
    <StrokeIconButton
      icon={isCollapsed ? icons.collapsed : icons.expanded}
      label={`${isCollapsed ? 'Expand' : 'Collapse'} ${target}`}
      expanded={!isCollapsed}
      isClickOrigin={isClickOrigin}
      onClick={onToggle}
    />
  );
}
