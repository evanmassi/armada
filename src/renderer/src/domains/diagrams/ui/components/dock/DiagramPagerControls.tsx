import { StrokeIconButton } from '@renderer/shared/ui/components/StrokeIconButton';

interface DiagramPagerControlsProps {
  position: number;
  count: number;
  onStep(offset: -1 | 1): void;
}

export function DiagramPagerControls({ position, count, onStep }: DiagramPagerControlsProps) {
  return (
    <div className="diagram-pager absolute right-2 bottom-2 z-10 flex items-center gap-0.5 p-0.5">
      <StrokeIconButton icon="chevronLeft" label="Previous diagram" onClick={() => onStep(-1)} />
      <span className="readout min-w-[5ch] text-center text-[10px] text-muted tabular-nums">
        {position}/{count}
      </span>
      <StrokeIconButton icon="chevronRight" label="Next diagram" onClick={() => onStep(1)} />
    </div>
  );
}
