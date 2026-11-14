import type { CSSProperties, ReactNode, Ref } from 'react';
import { CollapseToggleButton } from '@renderer/shared/ui/components/CollapseToggleButton';

interface BoardSideStripProps {
  label: string;
  count: number;
  isCollapsed: boolean;
  expandedStyle: CSSProperties;
  ref?: Ref<HTMLElement>;
  onToggle(): void;
  children: ReactNode;
}

export function BoardSideStrip({ label, count, isCollapsed, expandedStyle, ref, onToggle, children }: BoardSideStripProps) {
  return (
    <aside
      ref={ref}
      className={`flex min-w-0 flex-col border-l border-edge transition-[flex-grow] duration-200 ${isCollapsed ? 'w-8 shrink-0' : ''}`}
      style={isCollapsed ? undefined : expandedStyle}
    >
      <header className={`readout flex items-center gap-2 border-b border-edge px-2 py-1 text-[11px] text-muted ${isCollapsed ? 'h-full flex-col border-b-0 px-1 py-2' : ''}`}>
        <CollapseToggleButton isCollapsed={isCollapsed} target={label} collapsesToward="right" onToggle={onToggle} />
        <span className={isCollapsed ? '[writing-mode:vertical-rl]' : 'flex-1'}>{label}</span>
        {!isCollapsed && <span className="text-edge-strong">{count}</span>}
      </header>
      <div className={isCollapsed ? 'hidden' : 'contents'}>{children}</div>
    </aside>
  );
}
